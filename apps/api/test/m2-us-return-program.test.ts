import test from 'node:test';
import assert from 'node:assert/strict';
import {openUsMinorMarket} from '@playball/engine';
import {expiredRetryUsCareer,nativeUndraftedUsReturn} from '../../../packages/engine/test/us-return-retry-fixture.js';
import {applyEngineCommand,type SaveState} from '../src/engine-command.js';
import {usReturnScreen} from '../src/career-us-return-shell.js';

const command=(name:string,revision:number,extra:Record<string,unknown>={})=>({
 commandId:name+revision,expectedRevision:0,type:'CAREER_US_RETURN_'+name,payload:{careerRevision:revision,...extra},
});

test('mandatory return commands reject caller authority and malformed input before accessing a career',()=>{
 for(const [name,extra] of [['REQUEST',{world:{}}],['START_YEAR',{eventVersion:1,completed:true}],['ADVANCE',{days:999}],['SETTLE_YEAR',{records:{}}],['DRAFT_PREPARE',{budget:1}],['US_ACCEPT',{offerKey:'fake',eligible:true}]] as const){
  assert.throws(()=>applyEngineCommand({schemaVersion:1},command(name,1,extra)),/INVALID_PAYLOAD/);
 }
 for(const payload of [null,[],{careerRevision:-1},{careerRevision:1.5},{careerRevision:'1'}]){
  assert.throws(()=>applyEngineCommand({schemaVersion:1},{...command('REQUEST',1),payload}),/INVALID_PAYLOAD/);
 }
 assert.throws(()=>applyEngineCommand({schemaVersion:1},command('UNKNOWN',1)),/UNSUPPORTED_COMMAND/);
 assert.throws(()=>applyEngineCommand({schemaVersion:1},command('REQUEST',1)),/CAREER_NOT_FOUND/);
});

test('US contract end enters the real mandatory return owner, starts a year and advances bounded native games',()=>{
 const closed=expiredRetryUsCareer(),source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:3_000_000})));
 let state:SaveState={schemaVersion:1,career:source};
 assert.throws(()=>applyEngineCommand(state,command('REQUEST',source.revision-1)),/REVISION/);
 const requested=applyEngineCommand(state,command('REQUEST',source.revision));state=JSON.parse(JSON.stringify(requested.nextState));
 const c=state.career as ReturnType<typeof nativeUndraftedUsReturn>;
 assert.equal(c.revision,source.revision+1);assert.equal(c.return.years.length,0);assert.equal(c.retry.careerPreparationUsed,0);
 const view=usReturnScreen(state,'US_RETURN_PROGRAM') as {careerRevision:number;requiredSeasons:number;completedSeasons:number;events:{eventVersion:number}[];settleReady:boolean;progress:unknown;usOptions:{offerKey:string;available:boolean}[]};
 assert.equal(view.careerRevision,c.revision);assert.equal(view.requiredSeasons,2);assert.equal(view.completedSeasons,0);
 assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
 assert.equal(view.progress,null);assert.equal(view.settleReady,false);assert.ok(view.usOptions.every(offer=>!offer.available));
 assert.deepEqual(view.usOptions.map(offer=>offer.offerKey),source.minorMarket!.offers.filter(offer=>offer.militaryReturnOption).map(offer=>offer.offerKey));
 const version=view.events.at(-1)!.eventVersion;
 assert.throws(()=>applyEngineCommand(state,command('START_YEAR',c.revision,{eventVersion:version+1})),/VERSION/);
 assert.throws(()=>applyEngineCommand(state,command('DRAFT_PREPARE',c.revision)),/DRAFT|RETURN/);
 state=applyEngineCommand(state,command('START_YEAR',c.revision,{eventVersion:version})).nextState;
 const started=state.career as typeof c;assert.ok(started.preparation);assert.equal(started.retry.careerPreparationUsed,0);
 const activeView=usReturnScreen(state,'US_RETURN_PROGRAM') as {settleReady:boolean;progress:{phase:string;completedTeamGames:number}};
 assert.equal(activeView.settleReady,false);assert.equal(activeView.progress.phase,'PREPARATION_REGULAR');assert.equal(activeView.progress.completedTeamGames,0);
 assert.throws(()=>applyEngineCommand(state,command('SETTLE_YEAR',started.revision)),/INCOMPLETE/);
 const advanced=applyEngineCommand(state,command('ADVANCE',started.revision)),next=advanced.nextState.career as typeof c;
 assert.equal(next.revision,started.revision+1);assert.ok(next.preparation!.records.revision>started.preparation!.records.revision);
 assert.equal(next.return.years.length,0);assert.equal(next.retry.careerPreparationUsed,0);assert.ok(advanced.summary.stopReason);
 assert.equal(source.revision,closed.revision+1);assert.equal(source.military.status,'NOT_APPLICABLE');
});

test('actual completed mandatory owner exposes its draft and hands off to the existing optional retry gateway',()=>{
 const origin=nativeUndraftedUsReturn(),state:SaveState={schemaVersion:1,career:origin};
 const view=usReturnScreen(state,'US_RETURN_PROGRAM') as {completedSeasons:number;careerPreparationConsumed:number;draft:unknown;settleReady:boolean;progress:{phase:string;completedTeamGames:number}};
 assert.equal(view.completedSeasons,2);assert.equal(view.careerPreparationConsumed,0);assert.ok(view.draft);
 assert.equal(view.settleReady,false);assert.equal(view.progress.phase,'PREPARATION_RESULT');assert.equal(view.progress.completedTeamGames,48);
 assert.throws(()=>applyEngineCommand(state,command('DRAFT_DECIDE',origin.revision,{programVersion:origin.draft!.program.version,decision:'FORCE_SIGN'})),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand(state,command('KBO_ACTIVATE',origin.revision)),/SIGNED|SIGNING|DRAFT/);
 const opened=applyEngineCommand(state,{commandId:'retry',expectedRevision:0,type:'CAREER_RETRY_US_RETURN_OPEN',payload:{careerRevision:origin.revision}});
 assert.equal((opened.nextState.career as {mode:string}).mode,'US_RETURN_RETRY');assert.equal(opened.phase,'CAREER_ROUTE');
 assert.equal(origin.retry.careerPreparationUsed,0);
});

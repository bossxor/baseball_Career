import assert from 'node:assert/strict';
import test from 'node:test';
import type {UsCareer} from '@playball/engine';
import {preparedUsOptionCareer} from '../../../packages/engine/test/us-option-fixture.js';
import {usLevelFixture} from '../../../packages/engine/test/us-level-fixture.js';
import {raiseUsWindowEvent} from '../../../packages/engine/src/us-windows.js';
import type {UsProgress} from '../../../packages/engine/src/us-season.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {usPlayScreen} from '../src/career-us-play-shell.js';
import {finishedUsCareerFixture} from '../../../packages/engine/test/us-finished-fixture.js';
import {expiredRetryUsCareer} from '../../../packages/engine/test/us-return-retry-fixture.js';

test('ordinary US play rejects caller state and invalid advance bounds',()=>{
 for(const payload of [{careerRevision:1,maxDays:8},{careerRevision:1,maxDays:0},{careerRevision:1,maxDays:'1'},{careerRevision:1,maxDays:1,world:{}},{careerRevision:1,maxDays:1,budget:1}]){
  assert.throws(()=>applyEngineCommand({schemaVersion:1},{commandId:'bad',expectedRevision:0,type:'CAREER_US_PLAY_ADVANCE',payload}),/INVALID_PAYLOAD/);
 }
});

test('US annual API exposes actual blockers and advances an owned closed year without caller funding or new income',()=>{
 const c=finishedUsCareerFixture(),view=usPlayScreen({schemaVersion:1,career:c}) as {yearTransition:{ready:boolean;targetSeasonKey:string}};
 assert.equal(view.yearTransition.ready,true);
 const command={commandId:'next-year',expectedRevision:0,type:'CAREER_US_PLAY_NEXT_MINOR_YEAR',payload:{careerRevision:c.revision}};
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:c},{...command,payload:{...command.payload,funding:[{addedBudgetUsd:999999}]}}),/INVALID_PAYLOAD/);
 const advanced=applyEngineCommand({schemaVersion:1,career:c},command),next=advanced.nextState.career as UsCareer;
 assert.equal(next.world.seasonKey,view.yearTransition.targetSeasonKey);assert.equal(next.world.players[next.protagonistKey]!.age,c.world.players[c.protagonistKey]!.age+1);assert.equal(next.phaseContext.phase,'PRESEASON_SETUP');
 assert.deepEqual(next.income,c.income);assert.deepEqual(next.records,c.records);assert.equal(c.phaseContext.phase,'SEASON_REVIEW');
 const quoted=JSON.parse(JSON.stringify(next)) as UsCareer;assert.ok(usPlayScreen({schemaVersion:1,career:quoted}));
});

test('expired US minor API quotes persisted budgets, exposes owned choices and accepts an actual one-year offer',()=>{
 const c=expiredRetryUsCareer(),dispatch=(source:UsCareer,name:string,payload:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:source},{commandId:name+source.revision,expectedRevision:0,type:'CAREER_US_PLAY_'+name,payload:{careerRevision:source.revision,...payload}});
 const opened=dispatch(c,'OPEN_MINOR_MARKET').nextState.career as UsCareer;
 assert.ok(opened.minorMarket!.funding.every(row=>row.addedBudgetUsd===0));
 const view=usPlayScreen({schemaVersion:1,career:opened}) as {minorMarket:{eventKey:string;eventVersion:number;offers:{offerKey:string;organizationId:string}[]}};
 const market=view.minorMarket,offer=market.offers[0];assert.ok(offer);
 const navigation=dispatch(opened,'RESOLVE_MINOR_MARKET',{eventKey:market.eventKey,eventVersion:market.eventVersion,command:'OPEN_CAREER_OFFERS'});
 assert.ok(navigation.summary.navigation);assert.strictEqual(navigation.nextState.career,opened);
 assert.throws(()=>dispatch(opened,'ACCEPT_MINOR_OFFER',{offerKey:'forged'}),/NOT_FOUND/);
 const signed=dispatch(opened,'ACCEPT_MINOR_OFFER',{offerKey:offer.offerKey}).nextState.career as UsCareer;
 assert.equal(signed.contract.years,1);assert.equal(signed.contract.annualSalaryUsd,30000);assert.equal(signed.protagonistOrganizationId,offer.organizationId);assert.equal(signed.minorRenewal!.offerKey,offer.offerKey);assert.deepEqual(signed.income,c.income);assert.deepEqual(signed.records,c.records);
 assert.equal(opened.minorMarket!.status,'OPEN');assert.equal(signed.world.seasonKey,String(Number(c.world.seasonKey)+1));
});

test('ordinary US window API resolves real E43 and retains navigation without consuming training on view',()=>{
 const c=usLevelFixture('ROOKIE',20),phase=c.phaseContext as UsProgress,opened=raiseUsWindowEvent(c,phase.nextWorldDay-1,phase)!;
 assert.ok(opened);const event=opened.events.at(-1)!;assert.equal(event.definitionId,'E43');
 const view=usPlayScreen({schemaVersion:1,career:opened}) as {pendingEvent:{eventKey:string;commands:string[]}};
 assert.equal(view.pendingEvent.eventKey,event.eventKey);assert.ok(view.pendingEvent.commands.includes('OPEN_TRAINING'));
 const input={commandId:'window',expectedRevision:0,type:'CAREER_US_PLAY_RESOLVE_WINDOW',payload:{careerRevision:opened.revision,eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAINING'}};
 const resolved=applyEngineCommand({schemaVersion:1,career:opened},input),next=resolved.nextState.career as UsCareer;
 assert.equal(next.phaseContext.phase,'SEASON_PROGRESS');assert.ok(resolved.summary.navigation);assert.deepEqual(next.records,opened.records);assert.deepEqual(next.development.trainingUsedSeasons,opened.development.trainingUsedSeasons);
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:next},{...input,payload:{...input.payload,careerRevision:next.revision}}),/PHASE/);
 const skipped=applyEngineCommand({schemaVersion:1,career:next},{commandId:'skip-training',expectedRevision:0,type:'CAREER_US_PLAY_TRAIN',payload:{careerRevision:next.revision,choice:{type:'SKIP'}}}).nextState.career as UsCareer;
 assert.ok(skipped.development.trainingUsedSeasons.includes(skipped.world.seasonKey));assert.equal(opened.phaseContext.phase,'EVENT_DECISION');
});

test('ordinary US API starts a signed scheduled career, advances native games and restores its public progress',()=>{
 const c=preparedUsOptionCareer('HITTER');
 const dispatch=(source:UsCareer,type:string,payload:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:source},{commandId:type+source.revision,expectedRevision:0,type:'CAREER_US_PLAY_'+type,payload:{careerRevision:source.revision,...payload}});
 const before=usPlayScreen({schemaVersion:1,career:c}) as {phase:string;campNotices:unknown[]};
 assert.equal(before.phase,'PRESEASON_SETUP');assert.deepEqual(before.campNotices,[]);
 const started=dispatch(c,'START').nextState.career as UsCareer;assert.equal(c.phaseContext.phase,'PRESEASON_SETUP');assert.equal(started.phaseContext.phase,'SEASON_PROGRESS');
 const advanced=dispatch(started,'ADVANCE',{maxDays:1}),next=JSON.parse(JSON.stringify(advanced.nextState.career)) as UsCareer;
 assert.equal(next.revision,started.revision+1);assert.ok(next.records.revision>started.records.revision);assert.ok(advanced.summary.stopReason);
 const view=usPlayScreen({schemaVersion:1,career:next}) as {careerRevision:number;progress:unknown};assert.equal(view.careerRevision,next.revision);assert.ok(view.progress);assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
 assert.throws(()=>dispatch(next,'ADVANCE',{maxDays:1,completedGames:1}),/INVALID_PAYLOAD/);
});

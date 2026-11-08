import test from 'node:test';
import assert from 'node:assert/strict';
import {openUsAgentSalaryOffer,openKboCareerFa,selectKboCareerFaOffer,declineKboCareerFaSelection,kboCareerFaView,createSeasonCalendar} from '@playball/engine';
import {KBO_MONEY} from '@playball/rules';
import {closedUsMajorFixture} from '../../../packages/engine/test/us-major-fixture.js';
import {closedUsFreeAgentFixture} from '../../../packages/engine/test/us-major-fa-fixture.js';
import {expiredRetryUsCareer} from '../../../packages/engine/test/us-return-retry-fixture.js';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import type {KboCareer,KboSeasonArchive} from '@playball/engine';
import {usFlow} from '../src/career-us-flow.js';
import {kboPlayFlow} from '../src/career-kbo-play-shell.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import {applyEngineCommand} from '../src/engine-command.js';

test('US major flow uses only existing funded quote and rejects stale or injected terms',()=>{
 const source=closedUsMajorFixture();
 assert.equal(usFlow(source).commands.length,0);
 const c=openUsAgentSalaryOffer(source,source.revision,source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20_000_000})));
 const view=usFlow(c),offer=view.commands.find(x=>x.id==='major-renew')!;
 assert.ok(offer.sign);assert.ok(offer.confirm);
 assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"|funding|sourceBasis/);
 const command={commandId:'sign',expectedRevision:0,type:offer.type,payload:offer.payload};
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:c},{...command,payload:{...offer.payload,annualSalaryUsd:1}}),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:c},{...command,payload:{...offer.payload,careerRevision:c.revision-1}}),/REVISION/);
 const next=applyEngineCommand({schemaVersion:1,career:c},command).nextState.career;
 assert.equal((next as typeof c).world.seasonKey,String(Number(c.world.seasonKey)+1));
});

test('US major FA and expired minor contracts expose existing offers without private quote data',()=>{
 for(const [source,openId,offerPrefix] of [
  [closedUsFreeAgentFixture(),'major-market','major-fa-'],
  [expiredRetryUsCareer(),'minor-market','minor-'],
 ] as const){
  const initial=usFlow(source),open=initial.commands.find(x=>x.id===openId)!;
  assert.ok(open,`${openId}: ${initial.commands.map(x=>x.id)}`);
  const command={commandId:openId,expectedRevision:0,type:open.type,payload:open.payload};
  const next=applyEngineCommand({schemaVersion:1,career:source},command).nextState.career as typeof source;
  const view=usFlow(next),offer=view.commands.find(x=>x.id.startsWith(offerPrefix));
  assert.ok(offer);assert.ok(offer.sign);assert.ok(offer.confirm);
  assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"|playerScore|competitorScore|funding/);
  const signed=applyEngineCommand({schemaVersion:1,career:next},{commandId:'accept',expectedRevision:0,type:offer.type,payload:offer.payload}).nextState.career as typeof source;
  assert.equal(signed.world.seasonKey,String(Number(source.world.seasonKey)+1));
 }
});

test('KBO FA decline returns the same fixed offers and the selected contract uses its event version',()=>{
 const c=enteredKboCareer(),key=c.protagonistKey,club=c.protagonistClubId,other=c.world.clubs.find(t=>t.id!==club)!.id;
 c.world.seasonKey='2040';c.world.calendar=createSeasonCalendar(2040,'calendar-2');
 c.world.players[key]={...c.world.players[key]!,age:28};c.phaseContext={phase:'SEASON_REVIEW'};c.events=[];
 for(const contract of Object.values(c.world.contracts)){contract.seasonKey='2040';contract.years=2;contract.annualSalaryWon=KBO_MONEY.minimumSalaryWon;}
 c.world.contracts[key]!.years=1;
 for(const team of c.world.clubs)team.reservedSalaryWon=team.roster.reduce((sum,k)=>sum+c.world.contracts[k]!.annualSalaryWon,0);
 c.seasonClose={seasonKey:'2040',receiptKey:'controlled-close'} as NonNullable<KboCareer['seasonClose']>;
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:'2040',days:[{day:303,evidence:'controlled',result:{injured:[],recovered:[]}}]};c.proSeasons=[];
 for(let i=0;i<8;i++){
  const seasonKey=String(2033+i);if(seasonKey!=='2040')c.proSeasons=[...c.proSeasons,{seasonKey} as KboSeasonArchive];
  for(let day=1;day<=100;day++){
   const gameKey=JSON.stringify(['fa-registration',seasonKey,day]);
   c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[other]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
   c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:'KBO:'+club,seasonKey,day,roster:[key],appearances:[]},result:{injured:[],recovered:[]}}];
  }
 }
 c.records.revision=800;
 const noBudget=structuredClone(c);for(const team of noBudget.world.clubs)team.budgetWon=1;
 const empty=openKboCareerFa(noBudget,noBudget.revision),emptyView=kboPlayFlow(empty)!;
 const retire=emptyView.commands.find(x=>x.id==='retire-request')!;
 assert.ok(retire);assert.equal(retire.type,'CAREER_PRO_RETIRE_REQUEST');assert.ok(retire.confirm);
 assert.match(emptyView.notice! ,/제안이 없습니다/);
 const pending=applyEngineCommand({schemaVersion:1,career:empty},{commandId:'retire',expectedRevision:0,type:retire.type,payload:retire.payload}).nextState.career as KboCareer;
 const choice=careerFlowScreen({schemaVersion:1,career:pending});
 const cancel=choice.commands.find(x=>x.id==='retire-cancel')!,confirm=choice.commands.find(x=>x.id==='retire-confirm')!;
 assert.ok(confirm.confirm);
 const cancelled=applyEngineCommand({schemaVersion:1,career:pending},{commandId:'cancel',expectedRevision:0,type:cancel.type,payload:cancel.payload}).nextState.career as KboCareer;
 assert.equal(cancelled.phaseContext.phase,'SEASON_REVIEW');
 assert.deepEqual(kboCareerFaView(cancelled)!.offers,[]);
 const retired=applyEngineCommand({schemaVersion:1,career:pending},{commandId:'confirm',expectedRevision:0,type:confirm.type,payload:confirm.payload}).nextState.career as KboCareer;
 assert.equal(retired.phaseContext.phase,'ARCHIVED');
 const opened=openKboCareerFa(c,c.revision),initial=kboCareerFaView(opened)!;
 const selected=selectKboCareerFaOffer(opened,opened.revision,{eventKey:initial.eventKey,eventVersion:initial.eventVersion,offerKey:initial.offers[0]!.offerKey});
 const view=kboPlayFlow(selected)!,sign=view.commands.find(x=>x.id==='fa-sign')!;
 assert.ok(sign.sign);assert.ok(sign.confirm);assert.equal(sign.payload.offerKey,initial.offers[0]!.offerKey);
 const command={commandId:'fa-sign',expectedRevision:0,type:sign.type,payload:sign.payload};
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:selected},{...command,payload:{...sign.payload,eventVersion:999}}),/VERSION/);
 const accepted=applyEngineCommand({schemaVersion:1,career:selected},command).nextState.career as KboCareer;
 assert.equal(accepted.renewal?.status,'ACCEPTED');assert.equal(accepted.renewal?.offerKey,initial.offers[0]!.offerKey);
 const current=kboCareerFaView(selected)!,again=declineKboCareerFaSelection(selected,selected.revision,{eventKey:current.eventKey,eventVersion:current.eventVersion});
 assert.deepEqual(kboCareerFaView(again)!.offers,initial.offers);
});

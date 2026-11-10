// Written for the final M2 integration run; no implementation-stage execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,seedSave,gameSaves,writeSaveState} from '@playball/db';
import * as engine from '@playball/engine';
import {completedHighSchoolCareer} from '../../../packages/engine/test/fixtures.js';
import {applyEngineCommand,type SaveState} from '../src/engine-command.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import {createApp} from '../src/app.js';
import {readOwnedSave} from '../src/save-state.js';

function readyToSettle(units=1_000_000){
 let c=completedHighSchoolCareer(units);
 c=engine.acknowledgeHighSchoolSeasonReview(c,c.revision);
 c=engine.openHighSchoolCareerRoute(c,c.revision,1).career;
 c=engine.prepareCareerKboDraft(c,c.revision);
 c=engine.resolveCareerKboDraft(c,c.revision,1);
 if(c.kboRecruitment!.program.result!.round)c=engine.decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'DECLINE'});
 c=engine.startCareerPreparation(c,c.revision,1);
 c=engine.confirmPreparationPreseason(c,c.revision);
 for(let i=0;i<1500&&c.phaseContext.phase!=='SEASON_REVIEW';i++){
  if(c.phaseContext.phase==='EVENT_DECISION'){
   const e=c.events.find(event=>event.eventKey===(c.phaseContext as {eventKey:string}).eventKey)!;
   c=e.definitionId==='E84'?engine.resolveHiddenTraitNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'}).career:
    engine.resolveCareerWindowEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:e.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT'}).career;
  }else c=engine.advanceCareerPreparation(c,c.revision,'ONE_MONTH').career;
 }
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');
 return c;
}

test('independent settlement stages one owned assessment and exposes the one-year US contract',()=>{
 const c=readyToSettle(),state:SaveState={schemaVersion:1,career:c};
 const applied=applyEngineCommand(state,{commandId:'settle',expectedRevision:0,type:'CAREER_AMATEUR_PREP_SETTLE',payload:{careerRevision:c.revision,forfeitUnusedTraining:true}});
 const next=applied.nextState.career as engine.HighSchoolCareer,recruitment=next.usRecruitment!;
 assert.ok(recruitment);assert.equal(recruitment.program.input.contractProfile,'INDEPENDENT_FIRST');
 assert.deepEqual(next.records,c.records);assert.equal(next.preparation!.used,1);
 assert.ok(recruitment.program.offers.length);
 assert.ok(recruitment.program.offers.every(o=>o.controlSeasons===1&&o.annualSalaryUsd===30_000&&o.signingBonusUsd===0));
 const saved=JSON.parse(JSON.stringify(applied.nextState)) as SaveState,flow=careerFlowScreen(saved);
 const sign=flow.commands.find(command=>command.type==='CAREER_US_ENTRY_SIGN')!;
 assert.ok(sign?.sign&&sign.confirm);assert.doesNotMatch(JSON.stringify(flow),/"seed"|"rng"|"potential"|sourceBasis/);
 assert.throws(()=>applyEngineCommand(saved,{commandId:'forged',expectedRevision:0,type:sign.type,payload:{...sign.payload,annualSalaryUsd:1}}),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand(saved,{commandId:'stale',expectedRevision:0,type:sign.type,payload:{...sign.payload,careerRevision:next.revision-1}}),/REVISION/);
 const signed=applyEngineCommand(saved,{commandId:'sign',expectedRevision:0,type:sign.type,payload:sign.payload}).nextState;
 const close=careerFlowScreen(signed).commands.find(command=>command.type==='CAREER_US_ENTRY_CLOSE_YEAR')!;
 assert.equal(close.payload.forfeitUnusedTraining,false);assert.equal(close.confirm,undefined);
 const closed=applyEngineCommand(signed,{commandId:'close',expectedRevision:0,type:close.type,payload:close.payload}).nextState;
 const activate=careerFlowScreen(closed).commands.find(command=>command.type==='CAREER_US_ENTRY_ACTIVATE')!;
 const entry=applyEngineCommand(closed,{commandId:'activate',expectedRevision:0,type:activate.type,payload:activate.payload}).nextState;
 const us=entry.career as engine.UsCareer;assert.equal(us.mode,'US_CAREER');
 assert.equal(us.contract.controlSeasons,1);assert.equal(us.contract.annualSalaryUsd,30_000);assert.equal(us.contract.signingBonusUsd,0);
 assert.deepEqual(us.records,next.records);assert.equal(entry.usEntry,undefined);
});

test('an independent assessment without an offer cannot be repeated',()=>{
 const c=readyToSettle(10_000),state:SaveState={schemaVersion:1,career:c};
 const settled=applyEngineCommand(state,{commandId:'settle',expectedRevision:0,type:'CAREER_AMATEUR_PREP_SETTLE',payload:{careerRevision:c.revision,forfeitUnusedTraining:true}}).nextState;
 const next=settled.career as engine.HighSchoolCareer;
 assert.equal(next.usRecruitment,undefined);
 assert.equal(next.previousUsRecruitments?.at(-1)?.closedBy,'NO_OFFER');
 assert.deepEqual(next.records,c.records);
 assert.ok(!careerFlowScreen(settled).commands.some(command=>command.type==='CAREER_US_ENTRY_ASSESS'));
 assert.throws(()=>applyEngineCommand(settled,{commandId:'retry',expectedRevision:0,type:'CAREER_US_ENTRY_ASSESS',payload:{careerRevision:next.revision}}),/US_INDEPENDENT_NOT_ELIGIBLE/);
});

test('independent US assessment respects owner, split/legacy state, CAS and receipt replay',async()=>{
 const c=readyToSettle(),settled=engine.settleCareerPreparation(c,c.revision,true);
 const {db,client}=await createTestDb();
 try{
  await seedAllowedSubject(db,'independent-owner');await seedAllowedSubject(db,'independent-other');
  const app=createApp({db,auth:{allowDevBearer:true}});
  for(const split of [false,true]){
   const id=split?'independent-parts':'independent-legacy',state={schemaVersion:1,career:settled,...(split?{padding:'x'.repeat(2_100_000)}:{})};
   await seedSave(db,{id,ownerId:'independent-owner',state});
   if(split)await db.transaction(async tx=>{
    const stored=await writeSaveState(tx,id,0n,state);assert.equal(stored.stateFormat,'PARTS_V1');
    await tx.update(gameSaves).set(stored).where(eq(gameSaves.id,id));
   });
   const headers={Authorization:'Bearer dev:independent-owner','Content-Type':'application/json'};
   const url=`/api/saves/${id}/commands`,body={commandId:'assess',expectedRevision:0,type:'CAREER_US_ENTRY_ASSESS',payload:{careerRevision:settled.revision}};
   const post=(payload:unknown,auth='independent-owner')=>app.request(url,{method:'POST',headers:{...headers,Authorization:'Bearer dev:'+auth},body:JSON.stringify(payload)});
   const first=await post(body);assert.equal(first.status,200);const receipt=await first.json();
   assert.deepEqual(await (await post(body)).json(),receipt);
   assert.equal((await post({...body,commandId:'stale'})).status,409);
   assert.equal((await post(body,'independent-other')).status,404);
   assert.equal((await app.request(`/api/saves/${id}/screens/CAREER_FLOW`,{headers:{Authorization:'Bearer dev:independent-other'}})).status,404);
   const saved=(await readOwnedSave(db,'independent-owner',id))!.state as SaveState;
   const actual=saved.career as engine.HighSchoolCareer;assert.equal(actual.usRecruitment!.program.input.contractProfile,'INDEPENDENT_FIRST');
   assert.deepEqual(actual.records,settled.records);assert.equal(actual.preparation!.used,1);
   const screen=await (await app.request(`/api/saves/${id}/screens/CAREER_FLOW`,{headers})).json() as {commands:{type:string}[]};
   assert.ok(screen.commands.some(command=>command.type==='CAREER_US_ENTRY_SIGN'));
   assert.doesNotMatch(JSON.stringify(screen),/"seed"|"rng"|"potential"|sourceBasis/);
  }
 }finally{await client.close();}
});

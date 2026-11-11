// Written for the final M2 integration run; no implementation-stage execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {closedUsOptionCareer} from '../../../packages/engine/test/us-option-fixture.js';
import {closeControlledServiceDates} from '../../../packages/engine/test/us-service-fixture.js';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {createTestDb,seedAllowedSubject,seedSave} from '@playball/db';
import {applyEngineCommand,type SaveState} from '../src/engine-command.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import {createApp} from '../src/app.js';

const state=(career:engine.UsCareer):SaveState=>({schemaVersion:1,career:JSON.parse(JSON.stringify(career))});
function run(s:SaveState,type:string){
 const action=careerFlowScreen(s).commands.find(c=>c.type===type);assert.ok(action,type);
 return applyEngineCommand(s,{commandId:type,expectedRevision:0,type,payload:action.payload}).nextState;
}

test('US military choices use owned revision and survive a saved service transition',()=>{
 const c=closedUsOptionCareer(),s=state(c),flow=careerFlowScreen(s),freeze=flow.commands.find(x=>x.type==='CAREER_US_MILITARY_PLAN'&&x.payload.choice==='FREEZE');
 assert.ok(freeze);assert.doesNotMatch(JSON.stringify(flow),/"seed"|"potential"|"rng"/);
 assert.throws(()=>applyEngineCommand(s,{commandId:'bad',expectedRevision:0,type:freeze.type,payload:{...freeze.payload,annualSalaryUsd:1}}),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand(s,{commandId:'stale',expectedRevision:0,type:freeze.type,payload:{...freeze.payload,careerRevision:c.revision-1}}),/REVISION/);
 const chosen=applyEngineCommand(s,{commandId:'plan',expectedRevision:0,type:freeze.type,payload:freeze.payload}).nextState;
 const saved=state(chosen.career as engine.UsCareer),started=run(saved,'CAREER_US_MILITARY_START_YEAR');
 assert.ok(careerFlowScreen(started).commands.some(x=>x.type==='CAREER_US_MILITARY_ADVANCE'));
 assert.deepEqual((started.career as engine.UsCareer).records,c.records);
 assert.throws(()=>applyEngineCommand(started,{commandId:'repeat',expectedRevision:0,type:freeze.type,payload:freeze.payload}),/REVISION|NOT_REQUIRED/);
});

test('US discharge offers the owned return option and displays the actual deadline',()=>{
 let c=closedUsOptionCareer();c=engine.chooseUsMilitaryPlan(c,c.revision,'FREEZE');
 c=engine.startUsMilitaryServiceSeason(c,c.revision);c=engine.startUsMilitaryWorld(c,c.revision);c=closeControlledServiceDates(c,c.season!.lastDay);
 c=engine.startUsMilitaryServiceSeason(c,c.revision);c=engine.startUsMilitaryWorld(c,c.revision);c=closeControlledServiceDates(c,c.military.service!.completionDays[1]!.worldDay);
 let s=state(c);assert.ok(careerFlowScreen(s).commands.some(x=>x.type==='CAREER_US_MILITARY_COMPLETE'));
 s=run(s,'CAREER_US_MILITARY_COMPLETE');const flow=careerFlowScreen(s);
 assert.ok(flow.commands.some(x=>x.type==='CAREER_US_MILITARY_CONFIRM_RETURN'));
 assert.equal(flow.lines.find(x=>x.label==='복귀 남은 일수')?.value,'30');
 assert.ok(!flow.commands.some(x=>x.type==='CAREER_PRO_RETIRE_REQUEST'));
 const declined=run(s,'CAREER_US_MILITARY_DECLINE_RETURN'),discharged=declined.career as engine.UsCareer;
 const pending=run(declined,'CAREER_PRO_RETIRE_REQUEST'),confirmation=careerFlowScreen(pending).commands;
 const cancel=confirmation.find(x=>x.payload.command==='CANCEL_RETIRE')!;
 const cancelled=applyEngineCommand(pending,{commandId:'cancel-retirement',expectedRevision:0,type:cancel.type,payload:cancel.payload}).nextState;
 assert.deepEqual((cancelled.career as engine.UsCareer).phaseContext,discharged.phaseContext);
 const retry=run(cancelled,'CAREER_PRO_RETIRE_REQUEST');
 const retire=careerFlowScreen(retry).commands.find(x=>x.payload.command==='CONFIRM_RETIRE')!;
 const archived=applyEngineCommand(retry,{commandId:'confirm-retirement',expectedRevision:0,type:retire.type,payload:retire.payload}).nextState.career as engine.UsCareer;
 assert.equal(archived.phaseContext.phase,'ARCHIVED');
 assert.deepEqual(archived.records,discharged.records);
 assert.deepEqual(archived.income,discharged.income);
 assert.deepEqual(archived.military,discharged.military);
 assert.equal(archived.events.at(-1)?.occurredWorldDay,discharged.military.service!.cursor!.worldDay);
 assert.equal(engine.usRetirementArchiveView(archived).retirement.age,discharged.world.players[discharged.protagonistKey]!.age);
 s=run(s,'CAREER_US_MILITARY_CONFIRM_RETURN');
 assert.ok((s.career as engine.UsCareer).military.service!.returnOption?.status==='CONFIRMED');
});

test('KBO military planning uses the saved event version and rejects forged choices',()=>{
 const c=enteredKboCareer(),key=c.protagonistKey,season=c.world.seasonKey,days=c.world.calendar.growthDays.length;
 const player={...c.world.players[key]!,age:27},ledger=engine.createSeasonGrowthLedger(player,season,days);
 const growth=engine.settleClosedGrowthPeriods(player,ledger,[{periodKey:JSON.stringify(['pro-growth',c.world.worldKey,season,0,days]),focus:player.focus,archetype:player.archetype,period:{startDay:0,endDay:days,levelSeasonDays:days,level:'PRO',appearances:0,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:true}}}]);
 const end=engine.finalizeSeasonGrowth(growth.player,growth.ledger,days);c.world.players[key]=end.player;c.seasonGrowth=end.ledger;c.phaseContext={phase:'SEASON_REVIEW'};c.revision++;
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:season,days:[{day:c.world.calendar.growthDays.at(-1)!+10,evidence:'controlled-offseason',result:{injured:[],recovered:[]}}]};
 c.seasonClose={receiptKey:'controlled-close-'+season,seasonKey:season,sourceRevision:c.revision,agingLossUnits:end.lossUnits,trainingForfeited:true};c.development.trainingUsedSeasons=[...c.development.trainingUsedSeasons,season];
 c.postseason={schemaVersion:1,seasonKey:season,seeds:c.world.clubs.slice(0,5).map(x=>x.id),series:[],championKey:c.world.clubs[0]!.id};
 const s:SaveState={schemaVersion:1,career:engine.openKboMilitaryPlan(c,c.revision)},flow=careerFlowScreen(s),action=flow.commands.find(x=>x.type==='CAREER_KBO_PLAY_MILITARY_PLAN'&&x.payload.command==='START_SERVICE');
 assert.ok(action);assert.ok(!flow.commands.some(x=>x.payload.command==='DEFER_SERVICE'));
 assert.throws(()=>applyEngineCommand(s,{commandId:'forged',expectedRevision:0,type:action.type,payload:{...action.payload,command:'DEFER_SERVICE'}}));
 assert.throws(()=>applyEngineCommand(s,{commandId:'stale',expectedRevision:0,type:action.type,payload:{...action.payload,eventVersion:Number(action.payload.eventVersion)+1}}));
 const result=applyEngineCommand(s,{commandId:'plan',expectedRevision:0,type:action.type,payload:action.payload}).nextState;
 const ready=result.career as engine.KboCareer;
 assert.equal(ready.military?.status??'UNRESOLVED','UNRESOLVED');
 assert.ok(engine.kboContractDecisionRequired(ready));
 assert.ok(careerFlowScreen(result).commands.some(x=>x.type==='CAREER_KBO_PLAY_OPEN_CONTRACT_OFFERS'));
 // Controlled accepted result with an expiring contract. Enlistment must wait for the contract screen.
 const pending=engine.applyToSangmu(ready,ready.revision);
 pending.military!.applications.at(-1)!.accepted=true;
 assert.equal(engine.remainingKboMilitaryContractDays(pending),0);
 const commands=careerFlowScreen({schemaVersion:1,career:pending}).commands;
 assert.ok(commands.some(x=>x.type==='CAREER_KBO_PLAY_OPEN_CONTRACT_OFFERS'));
 assert.ok(commands.some(x=>x.payload.command==='DECLINE'));
 assert.ok(!commands.some(x=>x.payload.command==='ENLIST'));
});

test('military commands enforce save ownership, CAS and receipt replay',async()=>{
 const c=closedUsOptionCareer(),initial=state(c),action=careerFlowScreen(initial).commands.find(x=>x.type==='CAREER_US_MILITARY_PLAN'&&x.payload.choice==='FREEZE');assert.ok(action);
 const {db,client}=await createTestDb();
 try{
  await seedAllowedSubject(db,'military-owner');await seedAllowedSubject(db,'military-other');await seedSave(db,{id:'military-save',ownerId:'military-owner',state:initial});
  const app=createApp({db,auth:{allowDevBearer:true}}),url='/api/saves/military-save/commands',body={commandId:'military-plan',expectedRevision:0,type:action.type,payload:action.payload};
  const post=(payload:unknown,owner='military-owner')=>app.request(url,{method:'POST',headers:{Authorization:'Bearer dev:'+owner,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  assert.equal((await post(body,'military-other')).status,404);
  const first=await post(body);assert.equal(first.status,200);const receipt=await first.json();assert.deepEqual(await (await post(body)).json(),receipt);
  assert.equal((await post({...body,commandId:'stale'})).status,409);
  assert.equal((await post({...body,payload:{...action.payload,choice:'TERMINATE'}})).status,409);
  const screen=await app.request('/api/saves/military-save/screens/CAREER_FLOW',{headers:{Authorization:'Bearer dev:military-owner'}});
  const resumed=await screen.json() as {commands:{type:string}[]};assert.ok(resumed.commands.some(x=>x.type==='CAREER_US_MILITARY_START_YEAR'));
 }finally{await client.close();}
});

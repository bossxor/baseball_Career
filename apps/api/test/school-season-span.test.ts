import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {completedHighSchoolCareer} from '../../../packages/engine/test/fixtures.js';
import {applySchoolCareer} from '../src/career-school-shell.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import type {SaveState} from '../src/engine-command.js';

function created(){
 return engine.createHighSchoolCareer(engine.createHighSchoolWorld({
  worldKey:'school-span',seasonKey:'2032',seed:'school-span',schoolId:'H01',startDay:31,
  player:{simulationKey:'own',name:'시즌선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'},
 }),'GROWTH');
}
function opening(){
 const initial=created();
 let c=engine.confirmCareerPlayer(initial,initial.revision);
 c=engine.resolveCareerFocusEvent(c,c.revision,{eventKey:c.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});
 return engine.confirmCareerPreseason(c,c.revision);
}
function advance(state:SaveState,payload:unknown){
 return applySchoolCareer(state,{commandId:'school-span',expectedRevision:0,type:'CAREER_SCHOOL_ADVANCE_SPAN',payload});
}

test('school season budget preserves the native pending game and offers a fresh continuation',()=>{
 const previous=process.env.PLAYBALL_SPAN_BUDGET_MS;
 process.env.PLAYBALL_SPAN_BUDGET_MS='0';
 try{
  const c=opening(),before=engine.canonicalJson(c),expected=engine.advanceHighSchoolCareer(c,c.revision);
  const first=advance({schemaVersion:1,career:c},{careerRevision:c.revision,span:'SEASON'});
  assert.equal(first.summary.spanStop,'BUDGET');
  assert.deepEqual(first.nextState.career,expected.career);
  assert.equal(engine.canonicalJson(c),before);
  const resumed=JSON.parse(JSON.stringify(first.nextState)) as SaveState;
  const flow=careerFlowScreen(resumed),action=flow.commands.find(x=>x.id==='adv-season');
  assert.ok(action);assert.equal(action.type,'CAREER_SCHOOL_ADVANCE_SPAN');
  assert.deepEqual(action.payload,{careerRevision:expected.career.revision,span:'SEASON'});
  assert.equal(flow.stop,'BUDGET');
  assert.doesNotMatch(JSON.stringify(flow),/"seed"|"rng"|"potential"/);
  const next=advance(resumed,action.payload);
  assert.deepEqual(next.nextState.career,engine.advanceHighSchoolCareer(expected.career,expected.career.revision).career);
  assert.throws(()=>advance(resumed,{careerRevision:c.revision,span:'SEASON'}),/REVISION/);
 }finally{
  if(previous===undefined)delete process.env.PLAYBALL_SPAN_BUDGET_MS;
  else process.env.PLAYBALL_SPAN_BUDGET_MS=previous;
 }
});

test('school season completion returns SEASON_END without selecting the next career route',()=>{
 const c=completedHighSchoolCareer();
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:Math.max(...c.world.schedule.map(g=>g.worldDay))+1,pendingGame:null,advancePlan:null};
 const result=advance({schemaVersion:1,career:c},{careerRevision:c.revision,span:'SEASON'});
 assert.equal(result.phase,'SEASON_REVIEW');assert.equal(result.summary.spanStop,'SEASON_END');
 const next=result.nextState.career as engine.HighSchoolCareer;
 assert.equal(engine.canonicalJson(next.records),engine.canonicalJson(c.records));assert.equal(next.graduation,undefined);
 assert.ok(!careerFlowScreen(result.nextState).commands.some(x=>x.id==='adv-season'));
});

test('school season span stops at an owned focus event without resolving it',()=>{
 const c=completedHighSchoolCareer(),last=Math.max(...c.world.schedule.map(g=>g.worldDay));
 c.days.days=c.days.days.filter(d=>d.day<last);
 c.health.games=c.health.games.filter(g=>g.evidence.day<last);
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last,pendingGame:null,advancePlan:null};
 const result=advance({schemaVersion:1,career:c},{careerRevision:c.revision,span:'SEASON'});
 const next=result.nextState.career as engine.HighSchoolCareer;
 assert.equal(result.summary.spanStop,'EVENT');assert.equal(result.phase,'EVENT_DECISION');
 assert.equal(next.events.at(-1)?.status,'OPEN');assert.equal(next.events.at(-1)?.definitionId,'E02');
 assert.ok(!careerFlowScreen(result.nextState).commands.some(x=>x.id==='adv-season'));
 assert.equal(engine.canonicalJson(next.records),engine.canonicalJson(c.records));
});

test('school season command rejects unsupported spans, forged fields and unresolved events',()=>{
 const c=opening(),state={schemaVersion:1,career:c};
 assert.throws(()=>advance(state,{careerRevision:c.revision,span:'MONTH'}),/INVALID_PAYLOAD/);
 assert.throws(()=>advance(state,{careerRevision:c.revision,span:'SEASON',seed:'forged'}),/INVALID_PAYLOAD/);
 const event=created();
 const pending=engine.confirmCareerPlayer(event,event.revision);
 assert.throws(()=>advance({schemaVersion:1,career:pending},{careerRevision:pending.revision,span:'SEASON'}),/INVALID_CAREER_PHASE/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer,pauseHighSchoolCareer,resolveCareerWindowEvent} from '../src/high-school-progress.js';
import {canonicalJson} from '../src/game.js';
import {recordTotals} from '../src/records.js';
const fixture=()=>{
 let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'progress-world',seasonKey:'2032',seed:'progress-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return confirmCareerPreseason(state,2);
};
function advance(state:HighSchoolCareer,mode?:'ONE_GAME'|'ONE_WEEK'|'NEXT_MAJOR_EVENT'){
 for(let i=0;i<300;i++){
  const result=advanceHighSchoolCareer(state,state.revision,i===0?mode:undefined);assert.ok(result.plateAppearances<=1000);assert.ok(result.completedInnings<=20);assert.notEqual(result.stopReason,'ENGINE_LIMIT');state=result.career;
  if(result.stopReason!=='CHUNK_LIMIT' && result.stopReason!=='HEALTH_CHANGE')return result;
 }
 throw new Error('PROGRESS_TEST_LIMIT');
}
test('ONE_GAME plan persists across safe chunks, serializes exactly and closes whole game date',()=>{
 const initial=fixture(),before=canonicalJson(initial);let a=initial,b=initial;
 for(let i=0;i<20;i++){
  const left=advanceHighSchoolCareer(a,a.revision,i===0?'ONE_GAME':undefined),right=advanceHighSchoolCareer(JSON.parse(JSON.stringify(b)),b.revision,i===0?'ONE_GAME':undefined);
  assert.equal(canonicalJson(left),canonicalJson(right));a=left.career;b=right.career;
  if(left.stopReason!=='CHUNK_LIMIT'){assert.equal(left.stopReason,'ONE_GAME');break;}
 }
 const total=recordTotals(a.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:a.world.seasonKey});assert.equal(total.teams.H01!.games,1);assert.equal(a.days.days.length,2);assert.equal(a.records.revision,8);assert.equal(canonicalJson(initial),before);
});
test('pause keeps pending RNG/cursor; active plan cannot be silently changed; invalid phase/revision rejected',()=>{
 const initial=fixture(),first=advanceHighSchoolCareer(initial,3,'ONE_WEEK').career;assert.equal(first.phaseContext.phase,'SEASON_PROGRESS');
 if(first.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('TEST_PHASE');assert.ok(first.phaseContext.pendingGame);
 assert.throws(()=>advanceHighSchoolCareer(first,first.revision,'ONE_GAME'),/PLAN_ACTIVE/);
 const paused=pauseHighSchoolCareer(first,first.revision);if(paused.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('TEST_PHASE');assert.equal(canonicalJson(paused.phaseContext.pendingGame),canonicalJson(first.phaseContext.pendingGame));
 assert.doesNotThrow(()=>advanceHighSchoolCareer(paused,paused.revision,'ONE_GAME'));
 assert.throws(()=>advanceHighSchoolCareer(initial,0));assert.throws(()=>advanceHighSchoolCareer({...initial,phaseContext:{phase:'PRESEASON_SETUP'}},3));
});
test('ONE_WEEK includes calendar rest, stops within7 dates with same-day games complete',()=>{
 const result=advance(fixture(),'ONE_WEEK'),state=result.career;assert.equal(result.stopReason,'ONE_WEEK');assert.equal(state.days.days.length,7);assert.equal(state.days.days.at(-1)!.day,37);assert.equal(state.records.revision,24);
});
test('actual full HS league path: focus12, training16, style24, all216 games and48 per team without auto route',async t=>{
 let state=fixture();
 await t.test('default NEXT_MAJOR_EVENT stops at actual12 team games and typed E02',()=>{
  state=advance(state).career;assert.equal(state.phaseContext.phase,'EVENT_DECISION');const event=state.events.at(-1)!;assert.equal(event.definitionId,'E02');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,12);
  assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
  state=resolveCareerFocusEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'CHOOSE_FOCUS',focus:['CONTACT','POWER','RUNNING','CLUTCH']});assert.equal(state.planHistory.length,2);assert.equal(state.planHistory[1]!.completedTeamGames,12);
 });
 await t.test('training first valid window16; DEFER preserves opportunity and never applies ability growth',()=>{
  state=advance(state).career;const event=state.events.at(-1)!;assert.equal(event.definitionId,'E43');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,16);
  const before={...state.world.players['my-hitter']!.abilities};state=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'DEFER_TRAINING'}).career;assert.deepEqual(state.world.players['my-hitter']!.abilities,before);
 });
 await t.test('style first valid window24; navigation is read/open only and does not repeat same event',()=>{
  state=advance(state).career;const event=state.events.at(-1)!;assert.equal(event.definitionId,'E41');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,24);
  const before=state.world.players['my-hitter']!.archetype,result=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_STYLE'});assert.equal(result.navigation!.targetScreen,'S22');state=result.career;assert.equal(state.world.players['my-hitter']!.archetype,before);
 });
 await t.test('league completion stops SEASON_REVIEW, no US offer/route or automatic growth invented',()=>{
  state=advance(state).career;assert.equal(state.phaseContext.phase,'SEASON_REVIEW');assert.equal(state.records.revision,216);assert.equal(state.ownAssessment!.progress.observed.length,48);assert.equal(state.ownAssessment!.progress.stage,2);
  const totals=recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'});assert.equal(Object.keys(totals.teams).length,9);assert.ok(Object.values(totals.teams).every(t=>t.games===48));assert.equal(state.events.filter(e=>e.definitionId==='E43').length,1);assert.equal(state.events.filter(e=>e.definitionId==='E41').length,1);
  assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
 });
});

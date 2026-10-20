import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer,pauseHighSchoolCareer,resolveCareerWindowEvent} from '../src/high-school-progress.js';
import {canonicalJson} from '../src/game.js';
import {recordTotals} from '../src/records.js';
import {collectHighSchoolGrowthEvidence,settleHighSchoolCareerGrowth} from '../src/high-school-growth.js';
import {trainHighSchoolCareer,changeMidseasonCareerArchetype} from '../src/high-school-training.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods,validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
const fixture=(calendar=false)=>{
 let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'progress-world',seasonKey:'2032',seed:'progress-fixture',schoolId:'H01',...(calendar?{seasonYear:2032}:{startDay:31}),player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
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
 let state=fixture(true);
 await t.test('default NEXT_MAJOR_EVENT stops at actual12 team games and typed E02',()=>{
  state=advance(state).career;assert.equal(state.phaseContext.phase,'EVENT_DECISION');const event=state.events.at(-1)!;assert.equal(event.definitionId,'E02');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,12);
  assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
  state=resolveCareerFocusEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'CHOOSE_FOCUS',focus:['CONTACT','POWER','RUNNING','CLUTCH']});assert.equal(state.planHistory.length,2);assert.equal(state.planHistory[1]!.completedTeamGames,12);
 });
 await t.test('training first valid window16; DEFER preserves opportunity and never applies ability growth',()=>{
  state=advance(state).career;const event=state.events.at(-1)!;assert.equal(event.definitionId,'E43');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,16);
  const before={...state.world.players['my-hitter']!.abilities};state=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'DEFER_TRAINING'}).career;assert.deepEqual(state.world.players['my-hitter']!.abilities,before);
  state=trainHighSchoolCareer(state,state.revision,{type:'GUARANTEED',ability:'CONTACT'});
 });
 await t.test('style first valid window24; navigation is read/open only and does not repeat same event',()=>{
  state=advance(state).career;const event=state.events.at(-1)!;assert.equal(event.definitionId,'E41');assert.equal(recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'}).teams.H01!.games,24);
  const before=state.world.players['my-hitter']!.archetype,result=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_STYLE'});assert.equal(result.navigation!.targetScreen,'S22');state=result.career;assert.equal(state.world.players['my-hitter']!.archetype,before);
  state=changeMidseasonCareerArchetype(state,state.revision,'SLUGGER');
 });
 await t.test('league completion stops SEASON_REVIEW, no US offer/route or automatic growth invented',()=>{
  state=advance(state).career;assert.equal(state.phaseContext.phase,'SEASON_REVIEW');assert.equal(state.records.revision,216);assert.equal(state.ownAssessment!.progress.observed.length,48);assert.equal(state.ownAssessment!.progress.stage,2);
  const totals=recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:'2032'});assert.equal(Object.keys(totals.teams).length,9);assert.ok(Object.values(totals.teams).every(t=>t.games===48));assert.equal(state.events.filter(e=>e.definitionId==='E43').length,1);assert.equal(state.events.filter(e=>e.definitionId==='E41').length,1);
  assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
  const before=canonicalJson(state),growth=collectHighSchoolGrowthEvidence(state);
  assert.equal(growth.days.length,state.days.days.length);
  assert.equal(growth.days.reduce((sum,d)=>sum+d.appearances,0),totals.batting['my-hitter']?.PA??0);
  const boundary=Object.values(state.records.games).filter(g=>Object.hasOwn(g.teams,'H01')).sort((a,b)=>a.worldDay-b.worldDay)[11]!.worldDay;
  assert.ok(growth.days.filter(d=>d.worldDay<=boundary).every(d=>d.focus.includes('DISCIPLINE')));
  assert.ok(growth.days.filter(d=>d.worldDay>boundary).every(d=>d.focus.includes('RUNNING')));
  assert.equal(canonicalJson(collectHighSchoolGrowthEvidence(JSON.parse(JSON.stringify(state)))),canonicalJson(growth));assert.equal(canonicalJson(state),before);
 });
 await t.test('graduation pays only actual school periods once, preserves training and leaves the shared ledger open',()=>{
  const before=canonicalJson(state),key=state.world.protagonistKey,player=state.world.players[key]!,start=state.development!.seasonStartPlayer;
  assert.equal(Object.values(player.abilities).reduce((n,v)=>n+v,0),3_010_000);assert.equal(Object.values(start.abilities).reduce((n,v)=>n+v,0),3_000_000);
  const paid=settleHighSchoolCareerGrowth(state,state.revision),ledger=paid.career.seasonGrowth!;assert.ok(paid.budgetUnits>0);validateSeasonGrowthLedger(ledger);
  assert.equal(ledger.worldGrowthDays,260);assert.equal(ledger.finalized,false);assert.equal(ledger.entries.reduce((n,e)=>n+e.period.endDay-e.period.startDay,0),151);
  assert.equal(ledger.entries.at(-1)!.archetype,'SLUGGER');assert.ok(ledger.entries.slice(0,-1).every(e=>e.archetype==='BALANCED'));
  assert.equal(Object.values(paid.career.world.players[key]!.abilities).reduce((n,v)=>n+v,0),3_010_000+paid.gainedUnits);
  const retry=settleHighSchoolCareerGrowth(JSON.parse(JSON.stringify(paid.career)),paid.career.revision);assert.equal(retry.budgetUnits,0);assert.equal(retry.gainedUnits,0);assert.deepEqual(retry.career.world.players,paid.career.world.players);assert.deepEqual(retry.career.seasonGrowth,ledger);
  assert.equal(canonicalJson(state),before);assert.throws(()=>settleHighSchoolCareerGrowth(state,0),/REVISION/);
  const legacy=structuredClone(state);delete legacy.world.calendar;assert.throws(()=>settleHighSchoolCareerGrowth(legacy,legacy.revision),/MISSING_SEASON_CALENDAR/);
  const entry=ledger.entries.at(-1)!,remaining={...entry,periodKey:'later-pro-registration',period:{...entry.period,startDay:151,endDay:260,level:'PRO' as const,levelSeasonDays:260,appearances:0}};
  const later=settleClosedGrowthPeriods(paid.career.world.players[key]!,ledger,[remaining]);assert.ok(later.newBudgetUnits>0);assert.equal(later.ledger.entries[0]!.budgetUnits,ledger.entries[0]!.budgetUnits);assert.equal(later.ledger.finalized,false);
  const corrupt=structuredClone(state);corrupt.seasonGrowth=createSeasonGrowthLedger(start,state.world.seasonKey,151);assert.throws(()=>settleHighSchoolCareerGrowth(corrupt,corrupt.revision),/CHANGED_GROWTH_SEASON/);
 });
 await t.test('actual graduation→E04→S28→college admission preserves all216 records and pays growth once',()=>{
  const before=canonicalJson(state),reviewed=acknowledgeHighSchoolSeasonReview(state,state.revision),view=highSchoolCareerRouteView(reviewed);
  assert.equal(reviewed.events.at(-1)!.definitionId,'E04');assert.ok(view.overall>50);assert.ok(view.colleges.find(c=>c.id==='U07')!.eligible);
  const opened=openHighSchoolCareerRoute(JSON.parse(JSON.stringify(reviewed)),reviewed.revision,1);assert.equal(opened.navigation!.targetScreen,'S28');assert.equal(opened.career.events.at(-1)!.status,'OPEN');
  const admitted=enrollHighSchoolCollege(opened.career,opened.career.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:view.offerSetVersion,collegeId:'U07'});
  assert.equal(admitted.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(admitted.collegeAdmission!.entryYear,2033);assert.equal(admitted.records.revision,216);assert.deepEqual(admitted.records,state.records);assert.deepEqual(admitted.seasonGrowth,reviewed.seasonGrowth);
  assert.equal(canonicalJson(state),before);assert.throws(()=>advanceHighSchoolCareer(admitted,admitted.revision));
 });
});

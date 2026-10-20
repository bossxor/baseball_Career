import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys,overall} from '@playball/rules';
import {enrolledCollegeCareer,completedHighSchoolCareer} from './fixtures.js';
import {setCollegePreseasonFocus,setCollegePreseasonArchetype,confirmCollegePreseason,advanceCollegeCareer,pauseCollegeCareer,trainCollegeCareer} from '../src/college-career.js';
import {confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {resolveCareerWindowEvent,advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {changeMidseasonCareerArchetype,previewCareerTraining} from '../src/high-school-training.js';
import {refreshOwnCareerAssessment} from '../src/high-school-assessment.js';
import {refreshCareerTraits} from '../src/high-school-traits.js';
import {createWorldEvent,eventDefinition,resolveEventChoice} from '../src/events.js';
import {recordTotals} from '../src/records.js';
import {emptyBatting} from '../src/stats.js';
import {reconcileSchoolEmergency} from '../src/high-school-emergency.js';
import {canonicalJson} from '../src/game.js';
import {validatePitchXpLedger} from '../src/pitch-xp.js';

function advance(input:HighSchoolCareer){
 let state=input;
 for(let i=0;i<500;i++){
  const result=advanceCollegeCareer(state,state.revision);state=result.career;
  assert.ok(result.plateAppearances<=1000);assert.ok(result.completedInnings<=20);assert.notEqual(result.stopReason,'ENGINE_LIMIT');
  if(result.stopReason!=='CHUNK_LIMIT' && result.stopReason!=='HEALTH_CHANGE')return state;
 }
 throw new Error('COLLEGE_TEST_LIMIT');
}
function withHistoricalWindows(input:HighSchoolCareer){
 const state=structuredClone(input);
 for(const definitionId of ['E43','E41']){
  const command=definitionId==='E43'?'OPEN_TRAINING':'OPEN_STYLE',seasonKey='2029';
  const event=createWorldEvent({definitionId,worldKey:state.world.worldKey,seasonKey,evidence:{version:1,type:eventDefinition(definitionId).evidenceDomain,fields:{playerOrTeamSimulationKey:'own',worldSeasonId:seasonKey,windowType:definitionId==='E43'?'TRAINING':'MID'}},resume:{worldKey:state.world.worldKey,seasonKey,phase:'SEASON_PROGRESS',competitionKey:'HS',registrationKey:'H01',sourceRevision:1},sourceSequence:state.events.length+1,worldDay:100});
  state.events=[...state.events,resolveEventChoice(event,1,command,null,{worldKey:state.world.worldKey,seasonKey,worldDay:100,eligibleCommands:[command]}).event];
 }
 return state;
}

test('college preseason preserves carried abilities, validates registration/revision/focus and uses a fresh PRE window',()=>{
 const source=enrolledCollegeCareer(),before=canonicalJson(source);
 const focused=setCollegePreseasonFocus(source,source.revision,['CONTACT','POWER','RUNNING','CLUTCH']);
 const styled=setCollegePreseasonArchetype(focused,focused.revision,'SLUGGER');
 assert.deepEqual(styled.world.players.own!.abilities,source.world.players.own!.abilities);
 assert.deepEqual(styled.world.players.own!.potential,source.world.players.own!.potential);
 assert.equal(styled.planHistory.length,1);assert.equal(styled.planHistory[0]!.completedTeamGames,0);
 assert.throws(()=>setCollegePreseasonArchetype(styled,styled.revision,'BALANCED'),/WINDOW_USED/);
 const confirmed=confirmCollegePreseason(styled,styled.revision);
 assert.equal(confirmed.phaseContext.phase,'SEASON_PROGRESS');assert.deepEqual(confirmed.development!.seasonStartPlayer,styled.world.players.own);
 assert.throws(()=>confirmCollegePreseason(confirmed,confirmed.revision),/PHASE/);
 assert.throws(()=>setCollegePreseasonFocus(source,0,source.world.players.own!.focus),/REVISION/);
 assert.throws(()=>setCollegePreseasonFocus(source,source.revision,['POWER']),/exactly four/);
 assert.throws(()=>confirmCareerPreseason(source,source.revision),/REGISTRATION/);
 assert.throws(()=>advanceHighSchoolCareer(confirmed,confirmed.revision),/REGISTRATION/);
 const hs=completedHighSchoolCareer();assert.throws(()=>confirmCollegePreseason(hs,hs.revision),/REGISTRATION/);
 const corrupt=structuredClone(source);corrupt.collegeAdmission!.collegeId='U01';assert.throws(()=>confirmCollegePreseason(corrupt,corrupt.revision),/REGISTRATION/);
 assert.equal(canonicalJson(source),before);
});

test('actual college216-game season: resume, annual windows, scoped records, observations and pitcher XP',async t=>{
 const entered=withHistoricalWindows(enrolledCollegeCareer('PITCHER')),oldRecords=canonicalJson(entered.records),archive=canonicalJson(entered.previousSeasons);
 let state=confirmCollegePreseason(entered,entered.revision);
 await t.test('safe chunk and pause preserve pending game exactly across JSON resume',()=>{
  const before=canonicalJson(state),chunk=advanceCollegeCareer(state,state.revision,'ONE_WEEK').career;
  assert.equal(canonicalJson(state),before);assert.equal(chunk.phaseContext.phase,'SEASON_PROGRESS');
  if(chunk.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('TEST_PHASE');assert.ok(chunk.phaseContext.pendingGame);
  assert.throws(()=>advanceCollegeCareer(chunk,chunk.revision,'ONE_GAME'),/PLAN_ACTIVE/);
  const paused=pauseCollegeCareer(chunk,chunk.revision);
  if(paused.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('TEST_PHASE');
  assert.deepEqual(paused.phaseContext.pendingGame,chunk.phaseContext.pendingGame);
  assert.throws(()=>trainCollegeCareer(paused,paused.revision,{type:'CONDITIONING'}),/DAY_IN_PROGRESS/);
  const left=advanceCollegeCareer(paused,paused.revision,'ONE_GAME'),right=advanceCollegeCareer(JSON.parse(JSON.stringify(paused)),paused.revision,'ONE_GAME');
  assert.equal(canonicalJson(left),canonicalJson(right));state=left.career;
  assert.throws(()=>trainCollegeCareer(state,state.revision,{type:'CONDITIONING'}),/WINDOW_CLOSED/);
 });
 await t.test('college skips career-start focus, opens fresh E43 at16 and permits one annual training',()=>{
  // Finish the paused ONE_GAME plan before requesting the next major event.
  while(state.phaseContext.phase==='SEASON_PROGRESS' && state.phaseContext.advancePlan){state=advanceCollegeCareer(state,state.revision).career;}
  state=advance(state);const event=state.events.at(-1)!;
  assert.equal(event.definitionId,'E43');assert.equal(event.resume.competitionKey,'COLLEGE');assert.equal(event.seasonKey,'2030');
  assert.equal(recordTotals(state.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'}).teams.U07!.games,16);
  assert.equal(state.events.filter(e=>e.definitionId==='E02' || e.definitionId==='E03').length,0);
  const forfeited=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'FORFEIT_TRAINING'}).career;
  assert.ok(forfeited.development!.trainingUsedSeasons.includes('2030'));assert.ok(forfeited.development!.trainingUsedSeasons.includes('2029'));
  state=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAINING'}).career;
  assert.equal(previewCareerTraining(state,{type:'GUARANTEED',ability:'COMMAND'}).eligible,true);
  const before=state.world.players.own!.abilities.COMMAND!;state=trainCollegeCareer(state,state.revision,{type:'GUARANTEED',ability:'COMMAND'});
  assert.equal(state.world.players.own!.abilities.COMMAND,before+10_000);
  assert.throws(()=>trainCollegeCareer(state,state.revision,{type:'CONDITIONING'}),/LIMIT_REACHED/);
 });
 await t.test('new E41 at24 permits MID once and records the college boundary',()=>{
  state=advance(state);const event=state.events.at(-1)!;assert.equal(event.definitionId,'E41');assert.equal(event.seasonKey,'2030');
  assert.equal(recordTotals(state.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'}).teams.U07!.games,24);
  state=resolveCareerWindowEvent(state,state.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_STYLE'}).career;
  state=changeMidseasonCareerArchetype(state,state.revision,'VELOCITY');assert.equal(state.planHistory.at(-1)!.completedTeamGames,24);
  assert.throws(()=>changeMidseasonCareerArchetype(state,state.revision,'BALANCED'),/WINDOW_USED/);
 });
 await t.test('all216 FINAL college games and48 per team preserve HS records and archive; observation48→96',()=>{
  state=advance(state);assert.equal(state.phaseContext.phase,'SEASON_REVIEW');
  const college=Object.values(state.records.games).filter(g=>g.scope.leagueKey==='COLLEGE'),hs=Object.fromEntries(Object.entries(state.records.games).filter(([,g])=>g.scope.leagueKey==='HS'));
  assert.equal(college.length,216);assert.equal(canonicalJson({...entered.records,games:hs}),oldRecords);
  const totals=recordTotals(state.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'});assert.equal(Object.keys(totals.teams).length,9);assert.ok(Object.values(totals.teams).every(s=>s.games===48));
  assert.equal(state.records.revision,432);assert.equal(state.ownAssessment!.progress.observed.length,96);assert.equal(state.ownAssessment!.progress.stage,4);
  assert.ok(state.ownAssessment!.progress.observed.slice(48).every(o=>o.seasonYear===2030));assert.deepEqual(refreshOwnCareerAssessment(state),state.ownAssessment);
  assert.equal(state.traits!.lastSeasonKey,'2030');assert.equal(state.traits!.lastClosedDay,state.days.days.at(-1)!.day);
  assert.equal(canonicalJson(state.previousSeasons),archive);assert.equal(state.world.players.own!.age,19);
  const repertoire=state.world.repertoires.own!;validatePitchXpLedger(repertoire.ledger);assert.ok(repertoire.ledger.actualBookGrantedUnits>0);assert.equal(repertoire.seasonId,'2030');
  assert.equal(state.events.filter(e=>e.definitionId==='E43').length,2);assert.equal(state.events.filter(e=>e.definitionId==='E41').length,2);
  assert.equal(state.collegeAdmission!.yearsCompleted,0);assert.equal(state.seasonGrowth!.totalBudgetUnits,0);assert.throws(()=>advanceCollegeCareer(state,state.revision),/PHASE/);
 });
});

test('college trait cursor resets by season, HS regular BB never counts toward a college-season threshold',()=>{
 const source=enrolledCollegeCareer(),hs=Object.values(source.records.games).find(g=>Object.hasOwn(g.teams,'H01'))!;
 const line={...emptyBatting(),twoB:0,threeB:0,games:1,fieldingGames:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
 const split={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 hs.batting.own={...line,PA:30,BB:30};hs.batterSplits.own={L:{...split,PA:30,BB:30},R:{...split}};source.traits!.lastSeasonKey='2029';source.traits!.lastClosedDay=180;
 const game=source.world.schedule.find(g=>g.awayTeamKey==='U07' || g.homeTeamKey==='U07')!,day=game.worldDay,first=refreshCareerTraits(source,day);
 assert.equal(first.lastClosedDay,day);assert.equal(first.lastSeasonKey,'2030');assert.deepEqual(first.unlocks,[]);
 const legacy=structuredClone(source);delete legacy.traits!.lastSeasonKey;assert.deepEqual(refreshCareerTraits(legacy,day),first);
 const teamLine={games:1,W:0,L:0,T:1,R:0,RA:0};
 source.records.games[game.simulationKey]={...structuredClone(hs),gameKey:game.simulationKey,worldDay:day,scope:{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'},teams:{[game.awayTeamKey]:{...teamLine},[game.homeTeamKey]:{...teamLine}},batting:{own:{...line,PA:29,BB:29}},batterSplits:{own:{L:{...split,PA:29,BB:29},R:{...split}}}};
 const below=refreshCareerTraits({...source,traits:first},day+1);assert.deepEqual(below.unlocks,[]);
 source.records.games[game.simulationKey]!.batting.own!.BB++;source.records.games[game.simulationKey]!.batting.own!.PA++;
 const ledger=refreshCareerTraits({...source,traits:below},day+2);assert.deepEqual(ledger.owned.own!.unlocked,['T02']);
 assert.equal(ledger.unlocks[0]!.seasonKey,'2030');assert.equal(ledger.unlocks[0]!.leagueKey,'COLLEGE');assert.deepEqual(refreshCareerTraits({...source,traits:ledger},day+2),ledger);
});

test('college emergency uses school floors/age/namespace and saved RNG, release preserves identities',()=>{
 const state=enrolledCollegeCareer(),school=state.world.schools[0]!,day=state.world.schedule[0]!.worldDay;
 for(const key of school.roster)state.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-fixture',seasonKey:'2030'};
 const before=canonicalJson(state),result=reconcileSchoolEmergency(state.world,state.health,state.emergency,day,state.difficulty);
 assert.equal(result.added.length,10);assert.equal(canonicalJson(state),before);
 for(const key of result.added){const player=result.world.players[key]!,score=overall(player.kind,player.abilities);assert.equal(JSON.parse(key)[0],'college-temp');assert.ok(player.age>=19 && player.age<=22);assert.ok(score.sumUnits/score.denominator>=55);assert.equal(abilityKeys(player.kind).length,6);}
 const replay=reconcileSchoolEmergency(JSON.parse(JSON.stringify(result.world)),state.health,JSON.parse(JSON.stringify(result.registry)),day,state.difficulty);
 assert.deepEqual(replay.added,[]);assert.equal(canonicalJson(replay.world),canonicalJson(result.world));
 const release=reconcileSchoolEmergency(result.world,{...state.health,injuries:{}},result.registry,day+1,state.difficulty);
 assert.equal(release.released.length,10);assert.equal(release.world.schools[0]!.roster.length,25);
 assert.ok(result.added.every(k=>Object.hasOwn(release.world.players,k)));
});

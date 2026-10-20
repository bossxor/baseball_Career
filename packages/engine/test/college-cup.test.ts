import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeRegularSeason,enrolledCollegeCareer} from './fixtures.js';
import {startCollegeCup,advanceCollegeCup,collegeRegularStandings,collegeCupSchedule} from '../src/college-cup.js';
import {advanceCollegeCareer} from '../src/college-career.js';
import {canonicalJson} from '../src/game.js';
import {recordTotals} from '../src/records.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import type {ScheduledGame} from '../src/schedule.js';
import {refreshCareerTraits} from '../src/high-school-traits.js';
import {emptyBatting} from '../src/stats.js';

// Controlled FINAL scores test bracket branches independently of simulated winners.
function win(state:HighSchoolCareer,game:ScheduledGame,home:boolean){
 const won=Number(home),lost=Number(!home);
 state.records.games[game.simulationKey]={gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:game.seasonKey,leagueKey:'COLLEGE',phase:'POSTSEASON'},teams:{[game.awayTeamKey]:{games:1,W:lost,L:won,T:0,R:lost,RA:won},[game.homeTeamKey]:{games:1,W:won,L:lost,T:0,R:won,RA:lost}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};state.records.revision++;
}
test('cup freezes top4 and regular basis, admits only a complete closed season and rejects duplicate/stale start',()=>{
 const source=completedCollegeRegularSeason(),before=canonicalJson(source),state=startCollegeCup(source,source.revision);
 assert.deepEqual(collegeRegularStandings(source).map(r=>r.teamKey),['U01','U02','U03','U04','U05','U06','U07','U08','U09']);assert.deepEqual(state.collegeCup!.seeds,['U01','U02','U03','U04']);assert.equal(state.phaseContext.phase,'POSTSEASON_PROGRESS');
 const schedule=collegeCupSchedule(state);assert.equal(schedule.length,2);assert.deepEqual(schedule.map(g=>[g.awayTeamKey,g.homeTeamKey]),[['U04','U01'],['U03','U02']]);
 const first=(Date.UTC(2030,6,1)-Date.UTC(2030,0,1))/86_400_000;assert.ok(schedule.every(g=>g.worldDay===first && g.phase==='POSTSEASON'));
 assert.equal(canonicalJson(source),before);assert.throws(()=>startCollegeCup(state,state.revision),/PHASE/);assert.throws(()=>startCollegeCup(source,0),/REVISION/);
 assert.throws(()=>startCollegeCup({...enrolledCollegeCareer(),phaseContext:{phase:'SEASON_REVIEW'}},source.revision),/REVISION|NOT_COMPLETE/);
 const incomplete=structuredClone(source);incomplete.days.days=incomplete.days.days.slice(0,-1);assert.throws(()=>startCollegeCup(incomplete,incomplete.revision),/NOT_COMPLETE/);
 const changed=structuredClone(state);changed.records.games[changed.world.schedule[0]!.simulationKey]!.teams[changed.world.schedule[0]!.awayTeamKey]!.R++;
 assert.throws(()=>collegeCupSchedule(changed),/CHANGED/);
 assert.throws(()=>advanceCollegeCareer(state,state.revision),/PHASE/);
});
test('semifinal upsets seed final venues high/low/high; two wins cancel third final, split requires it',()=>{
 const source=completedCollegeRegularSeason(),state=startCollegeCup(source,source.revision),semis=collegeCupSchedule(state);
 win(state,semis[0]!,false);win(state,semis[1]!,true);
 const first=collegeCupSchedule(state).at(-1)!;assert.equal(first.homeTeamKey,'U02');assert.equal(first.awayTeamKey,'U04');
 win(state,first,true);const second=collegeCupSchedule(state).at(-1)!;assert.equal(second.homeTeamKey,'U04');assert.equal(second.worldDay,first.worldDay+2);
 const sweep=structuredClone(state);win(sweep,second,false);assert.equal(collegeCupSchedule(sweep).length,4);
 win(state,second,true);const third=collegeCupSchedule(state).at(-1)!;assert.equal(third.homeTeamKey,'U02');assert.equal(third.worldDay,first.worldDay+4);assert.equal(collegeCupSchedule(state).length,5);
 win(state,third,false);assert.equal(collegeCupSchedule(state).length,5);
 const extra=structuredClone(sweep);win(extra,third,true);assert.throws(()=>collegeCupSchedule(extra),/INVALID/);
});
test('actual AI cup for a nonqualifying protagonist: bounded JSON replay, whole-date health, separate records/no extra growth',()=>{
 const source=completedCollegeRegularSeason(),regular=recordTotals(source.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'}),growth=canonicalJson(source.seasonGrowth),schedule=canonicalJson(source.world.schedule),development=canonicalJson(source.development),observations=source.ownAssessment!.progress.observed.length;
 let state=startCollegeCup(source,source.revision);assert.ok(!state.collegeCup!.seeds.includes('U07'));
 for(let i=0;i<40;i++){
  const before=canonicalJson(state),a=advanceCollegeCup(state,state.revision),b=advanceCollegeCup(JSON.parse(JSON.stringify(state)),state.revision);
  assert.equal(canonicalJson(a),canonicalJson(b));assert.equal(canonicalJson(state),before);assert.ok(a.plateAppearances<=1000);assert.ok(a.completedInnings<=20);assert.notEqual(a.stopReason,'ENGINE_LIMIT');state=a.career;
  if(a.stopReason==='CUP_COMPLETE')break;
 }
 assert.equal(state.collegeCup!.status,'COMPLETE');assert.ok(state.collegeCup!.seeds.includes(state.collegeCup!.championKey!));assert.equal(state.phaseContext.phase,'SEASON_REVIEW');
 const games=Object.values(state.records.games).filter(g=>g.scope.seasonKey==='2030' && g.scope.phase==='POSTSEASON');assert.ok(games.length===4 || games.length===5);assert.equal(collegeCupSchedule(state).length,games.length);
 assert.deepEqual({...recordTotals(state.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'}),revision:source.records.revision},regular);
 assert.equal(canonicalJson(state.seasonGrowth),growth);assert.equal(canonicalJson(state.world.schedule),schedule);assert.equal(canonicalJson(state.development),development);assert.equal(state.ownAssessment!.progress.observed.length,observations);assert.equal(state.collegeAdmission!.yearsCompleted,0);
 assert.ok(games.every(g=>Object.values(g.teams).reduce((n,t)=>n+t.T,0)===0));
 assert.equal(state.health.games.filter(g=>g.evidence.seasonKey==='2030').length,432+games.length*2);
 assert.equal(state.days.days.at(-1)!.day,Math.max(...games.map(g=>g.worldDay)));assert.ok(Object.values(state.world.repertoires).some(r=>r.ledger.actualBookGrantedUnits>0));
 assert.throws(()=>advanceCollegeCup(state,state.revision),/PHASE/);assert.throws(()=>startCollegeCup(state,state.revision),/PHASE/);
 const corrupt=structuredClone(state);corrupt.collegeCup!.championKey='U09';assert.throws(()=>collegeCupSchedule(corrupt),/INVALID/);
});
test('postseason-only appearance can unlock T06 from career cup HR without increasing regular PA',()=>{
 const source=completedCollegeRegularSeason(),state=startCollegeCup(source,source.revision),game=collegeCupSchedule(state)[0]!;win(state,game,true);
 const key=state.world.schools.find(s=>s.id===game.homeTeamKey)!.roster.find(k=>state.world.players[k]!.kind==='HITTER')!,record=state.records.games[game.simulationKey]!;
 record.teams[game.homeTeamKey]!.R=5;record.teams[game.awayTeamKey]!.RA=5;
 record.batting[key]={...emptyBatting(),PA:5,AB:5,H:5,HR:5,TB:20,R:5,RBI:5,twoB:0,threeB:0,games:1,fieldingGames:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
 const split={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};record.batterSplits[key]={L:{...split,PA:5,AB:5,H:5,HR:5,TB:20,RBI:5},R:split};
 const ledger=refreshCareerTraits(state,game.worldDay);assert.deepEqual(ledger.owned[key]!.unlocked,['T06']);assert.equal(ledger.unlocks[0]!.seasonKey,'2030');
 assert.equal(recordTotals(state.records,{seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR'}).batting[key]?.PA??0,0);
 assert.deepEqual(refreshCareerTraits({...state,traits:ledger},game.worldDay),ledger);
});

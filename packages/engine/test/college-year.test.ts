import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeAcademicYear,enrolledCollegeCareer,nextCollegeYear} from './fixtures.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {assertCollegeWorld} from '../src/college-world.js';
import type {CollegeWorld} from '../src/college-world.js';
import {confirmCollegePreseason,advanceCollegeCareer} from '../src/college-career.js';
import {grantPracticePitchXp,beginPitchLearning} from '../src/repertoire.js';
import {canonicalJson} from '../src/game.js';
import {validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import {recordTotals} from '../src/records.js';

test('college year close requires explicit training forfeit, audits NPC growth/caps and seals once without repaying own growth',()=>{
 const source=completedCollegeAcademicYear(),npc=Object.values(source.world.players).find(p=>p.simulationKey!=='own' && p.age<22)!;
 npc.potential={...npc.abilities};const before=canonicalJson(source),own=source.world.players.own!;
 assert.throws(()=>closeCollegeSeasonForNextYear(source,source.revision),/TRAINING_FORFEIT_REQUIRED/);
 const ready=closeCollegeSeasonForNextYear(source,source.revision,true);assert.equal(ready.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(ready.seasonGrowth!.finalized,true);validateSeasonGrowthLedger(ready.seasonGrowth!);assert.deepEqual(ready.world.players.own!.abilities,own.abilities);
 assert.equal(Object.keys(ready.collegeNpcGrowth!.results).length,224);const cap=ready.collegeNpcGrowth!.results[npc.simulationKey]!;assert.equal(cap.gainedUnits,0);assert.equal(cap.discardedUnits,cap.budgetUnits);assert.ok(cap.budgetUnits>0);
 for(const [key,g] of Object.entries(ready.collegeNpcGrowth!.results)){assert.equal(g.gainedUnits+g.discardedUnits,g.budgetUnits);assert.deepEqual(ready.world.players[key]!.potential,source.world.players[key]!.potential);assert.equal(ready.world.players[key]!.age,source.world.players[key]!.age);}
 assert.ok(ready.development!.trainingUsedSeasons.includes('2030'));assert.ok(ready.health.closedSeasons.includes('2030'));assert.equal(canonicalJson(source),before);assert.throws(()=>closeCollegeSeasonForNextYear(ready,ready.revision,true),/YEAR_END/);
});
test('next year retains continuing students/P/earned books, replaces only graduates with freshmen, archives cup/result and opens annual budgets',()=>{
 const entered=enrolledCollegeCareer('PITCHER');entered.world.repertoires.own=grantPracticePitchXp(entered.world.repertoires.own!,'carry-actual-practice','P01',3,5);
 const source=completedCollegeAcademicYear(entered),ready=closeCollegeSeasonForNextYear(source,source.revision,true),before=canonicalJson(ready),next=startNextCollegeSeason(ready,ready.revision);
 assert.deepEqual(next.relationships,ready.relationships);assert.deepEqual(next.relationNotices,ready.relationNotices);assert.equal(next.relationships!.teamEntries!.length,1);
 assertCollegeWorld(next.world as CollegeWorld);assert.equal(next.world.seasonKey,'2031');assert.equal(next.world.players.own!.age,20);assert.deepEqual(next.world.players.own!.abilities,ready.world.players.own!.abilities);assert.equal(next.collegeAdmission!.academicYear,2);assert.equal(next.collegeAdmission!.yearsCompleted,1);
 for(const school of ready.world.schools)for(const key of school.roster.filter(k=>!Object.hasOwn(ready.emergency.entries,k))){
  const old=ready.world.players[key]!;
  if(key!=='own' && old.age===22){assert.equal(next.world.players[key],undefined);continue;}
  const p=next.world.players[key]!;assert.equal(p.age,old.age+1);assert.equal(p.name,old.name);assert.equal(p.bats,old.bats);assert.equal(p.throws,old.throws);assert.deepEqual(p.abilities,old.abilities);assert.deepEqual(p.potential,old.potential);assert.deepEqual(p.careerPeaks,old.careerPeaks);
  if(old.kind==='PITCHER'){assert.deepEqual(next.world.repertoires[key]!.book,ready.world.repertoires[key]!.book);assert.deepEqual(next.world.repertoires[key]!.weights,ready.world.repertoires[key]!.weights);assert.equal(next.world.repertoires[key]!.ledger.baseSpentUnits,0);assert.equal(next.world.repertoires[key]!.seasonId,'2031');}
 }
 const freshmen=Object.values(next.world.players).filter(p=>!Object.hasOwn(ready.world.players,p.simulationKey));assert.equal(freshmen.length,Object.values(ready.world.players).filter(p=>p.simulationKey!=='own' && p.age===22 && !Object.hasOwn(ready.emergency.entries,p.simulationKey)).length);assert.ok(freshmen.every(p=>p.age===19));
 assert.equal(next.previousSeasons!.length,2);const archived=next.previousSeasons!.at(-1)!;assert.deepEqual(archived.world,ready.world);assert.deepEqual(archived.collegeCup,ready.collegeCup);assert.deepEqual(archived.collegeResult,ready.collegeResult);assert.deepEqual(archived.collegeNpcGrowth,ready.collegeNpcGrowth);
 assert.deepEqual(next.records,ready.records);assert.equal(next.collegeCup,undefined);assert.equal(next.collegeResult,undefined);assert.equal(next.collegeNpcGrowth,undefined);assert.equal(next.collegeYearEnd,undefined);assert.equal(next.days.days.length,0);assert.equal(next.seasonGrowth!.totalBudgetUnits,0);assert.equal(next.seasonGrowth!.finalized,false);assert.equal(next.development!.trainingUsedSeasons.includes('2031'),false);assert.equal(next.traits!.lastClosedDay,null);
 assert.ok(next.world.repertoires.own!.book.P01!>=ready.world.repertoires.own!.book.P01!);assert.equal(canonicalJson(ready),before);assert.equal(canonicalJson(startNextCollegeSeason(JSON.parse(JSON.stringify(ready)),ready.revision)),canonicalJson(next));assert.throws(()=>startNextCollegeSeason(next,next.revision),/RESULT_REQUIRED/);
 let playing=confirmCollegePreseason(next,next.revision);for(let i=0;i<20;i++){const result=advanceCollegeCareer(playing,playing.revision,i===0?'ONE_GAME':undefined);playing=result.career;if(result.stopReason==='ONE_GAME')break;}
 assert.equal(recordTotals(playing.records,{seasonKey:'2031',leagueKey:'COLLEGE',phase:'REGULAR'}).teams.U07!.games,1);assert.equal(playing.ownAssessment!.progress.observed.length,97);
});
test('continuing NPC medium injury carries; major injury closes, archive keeps original year-end evidence',()=>{
 for(const severity of ['MEDIUM','MAJOR'] as const){
  const source=completedCollegeAcademicYear(),npc=Object.values(source.world.players).find(p=>p.simulationKey!=='own' && p.age<22)!,team=source.world.schools.find(s=>s.roster.includes(npc.simulationKey))!,last=source.health.games.filter(g=>g.evidence.seasonKey==='2030' && g.evidence.teamKey===team.id).at(-1)!;
  last.result.injured.push(npc.simulationKey);source.days.days.find(d=>d.day===last.evidence.day)!.result.injured.push(npc.simulationKey);source.health.injuries[npc.simulationKey]={severity,remainingTeamGames:severity==='MEDIUM'?10:null,diagnosedGameKey:last.evidence.gameKey,seasonKey:'2030'};
  const ready=closeCollegeSeasonForNextYear(source,source.revision,true),next=startNextCollegeSeason(ready,ready.revision);
  if(severity==='MEDIUM'){assert.equal(next.health.injuries[npc.simulationKey]!.remainingTeamGames,10);assert.ok(next.previousSeasons!.at(-1)!.health.injuries[npc.simulationKey]);}else assert.equal(next.health.injuries[npc.simulationKey],undefined);
  assert.notStrictEqual(next.health,next.previousSeasons!.at(-1)!.health);
 }
});
test('unfinished learning, invalid result, stale revision and changed sealed state never publish a partial next year',()=>{
 const source=completedCollegeAcademicYear(enrolledCollegeCareer('PITCHER')),learning=structuredClone(source);learning.world.repertoires.own=beginPitchLearning(learning.world.repertoires.own!,'P04',true);
 assert.throws(()=>closeCollegeSeasonForNextYear(learning,learning.revision,true),/LEARNING_SETTLEMENT_REQUIRED/);assert.throws(()=>closeCollegeSeasonForNextYear(source,0,true),/REVISION/);
 const result=structuredClone(source);result.collegeResult!.receiptKey='changed';assert.throws(()=>closeCollegeSeasonForNextYear(result,result.revision,true),/RESULT_REQUIRED/);
 const ready=closeCollegeSeasonForNextYear(source,source.revision,true);
 for(const mutate of [(s:typeof ready)=>{s.collegeYearEnd!.receiptKey='wrong';},(s:typeof ready)=>{s.world.players.own!.age++;},(s:typeof ready)=>{s.collegeNpcGrowth!.seasonKey='2031';}]){
  const changed=structuredClone(ready);mutate(changed);const before=canonicalJson(changed);assert.throws(()=>startNextCollegeSeason(changed,changed.revision),/YEAR_END_REQUIRED/);assert.equal(canonicalJson(changed),before);
 }
});
test('continuing enrollment advances1→2→3→4 with persistent students and blocks a fifth year pending graduation route',()=>{
 let state=enrolledCollegeCareer();
 for(let year=1;year<=4;year++){
  state=completedCollegeAcademicYear(state);assert.equal(state.collegeAdmission!.academicYear,year);assert.equal(state.collegeAdmission!.yearsCompleted,year);assert.equal(state.world.players.own!.age,18+year);
  if(year===4){assert.throws(()=>closeCollegeSeasonForNextYear(state,state.revision,true),/GRADUATION_ROUTE_REQUIRED/);break;}
  state=nextCollegeYear(state);assert.equal(state.previousSeasons!.length,year+1);assertCollegeWorld(state.world as CollegeWorld);
 }
 assert.equal(state.world.seasonKey,'2033');assert.equal(state.collegeAdmission!.yearsCompleted,4);assert.equal(state.phaseContext.phase,'EVENT_DECISION');assert.equal(state.events.at(-1)!.definitionId,'E75');
});

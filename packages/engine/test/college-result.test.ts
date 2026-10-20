import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeRegularSeason,enrolledCollegeCareer} from './fixtures.js';
import {confirmCollegePreseason,setCollegePreseasonFocus,setCollegePreseasonArchetype} from '../src/college-career.js';
import {startCollegeCup,advanceCollegeCup} from '../src/college-cup.js';
import {settleCollegeCareerGrowth,acknowledgeCollegeSeasonReview,completedCollegeSchedule} from '../src/college-result.js';
import {collectSchoolGrowthEvidence} from '../src/high-school-growth.js';
import {validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';
import {canonicalJson} from '../src/game.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';

function cupComplete(source:HighSchoolCareer){
 let state=startCollegeCup(source,source.revision);
 for(let i=0;i<40;i++){const r=advanceCollegeCup(state,state.revision);state=r.career;if(r.stopReason==='CUP_COMPLETE')return state;}
 throw new Error('CUP_TEST_LIMIT');
}
test('college PRE plan anchors growth, regular days pay once, cup adds no entitlement and academic result increments only completion',()=>{
 let entered=enrolledCollegeCareer();entered=setCollegePreseasonFocus(entered,entered.revision,['CONTACT','POWER','RUNNING','CLUTCH']);entered=setCollegePreseasonArchetype(entered,entered.revision,'SLUGGER');entered=confirmCollegePreseason(entered,entered.revision);
 assert.deepEqual(entered.seasonGrowth!.seasonStart,entered.development!.seasonStartPlayer);
 const source=cupComplete(completedCollegeRegularSeason(entered)),before=canonicalJson(source),paid=settleCollegeCareerGrowth(source,source.revision),ledger=paid.career.seasonGrowth!;
 validateSeasonGrowthLedger(ledger);assert.ok(paid.budgetUnits>0);assert.equal(ledger.finalized,false);assert.equal(ledger.entries.length,1);assert.equal(ledger.entries[0]!.period.level,'COLLEGE');assert.equal(ledger.entries[0]!.archetype,'SLUGGER');
 const entry=ledger.entries[0]!;assert.equal(entry.period.endDay-entry.period.startDay,source.world.calendar!.highSchoolDays.length);assert.equal(entry.period.levelSeasonDays,129);assert.equal(entry.period.appearances,0);assert.equal(entry.period.rehabRatio,0);
 assert.equal(paid.budgetUnits,naturalGrowthBudgetUnits(source.development!.seasonStartPlayer,238,[entry.period]));
 const retry=settleCollegeCareerGrowth(JSON.parse(JSON.stringify(paid.career)),paid.career.revision);assert.equal(retry.budgetUnits,0);assert.deepEqual(retry.career.world.players,paid.career.world.players);
 const result=acknowledgeCollegeSeasonReview(paid.career,paid.career.revision);assert.equal(result.phaseContext.phase,'OFFSEASON_REVIEW');assert.equal(result.collegeAdmission!.academicYear,1);assert.equal(result.collegeAdmission!.yearsCompleted,1);assert.equal(result.world.players.own!.age,19);assert.equal(result.world.seasonKey,'2030');assert.equal(result.collegeResult!.championKey,source.collegeCup!.championKey);
 assert.deepEqual(result.world.players,paid.career.world.players);assert.deepEqual(result.records,source.records);assert.equal(canonicalJson(result.health),canonicalJson(source.health));assert.deepEqual(result.development,source.development);assert.deepEqual(result.previousSeasons,source.previousSeasons);assert.ok(!result.development!.trainingUsedSeasons.includes('2030'));
 assert.equal(canonicalJson(source),before);assert.throws(()=>acknowledgeCollegeSeasonReview(result,result.revision),/ALREADY_COMPLETE/);assert.throws(()=>settleCollegeCareerGrowth(result,result.revision),/NOT_COMPLETE/);
});
test('carried HS mild injury starts college rehabilitation and recovery reduces only subsequent dates',()=>{
 const source=cupComplete(completedCollegeRegularSeason(enrolledCollegeCareer('HITTER',true))),schedule=completedCollegeSchedule(source),evidence=collectSchoolGrowthEvidence(source,schedule,true);
 assert.ok(source.previousSeasons!.at(-1)!.health.injuries.own);assert.equal(source.health.injuries.own,undefined);assert.equal(evidence.days[0]!.rehabilitating,true);
 const recovered=source.health.games.find(g=>g.evidence.seasonKey==='2030' && g.result.recovered.includes('own'))!.evidence.day;
 assert.ok(evidence.days.filter(d=>d.worldDay<=recovered).every(d=>d.rehabilitating));assert.ok(evidence.days.filter(d=>d.worldDay>recovered).every(d=>!d.rehabilitating));
 const paid=settleCollegeCareerGrowth(source,source.revision);assert.ok(paid.career.seasonGrowth!.entries[0]!.period.rehabRatio>0);
 const invalid=structuredClone(source);delete invalid.previousSeasons!.at(-1)!.health.injuries.own;assert.throws(()=>settleCollegeCareerGrowth(invalid,invalid.revision),/HEALTH_HISTORY/);
});
test('cup-only recovery is audited while growth remains restricted to regular dates',()=>{
 const source=completedCollegeRegularSeason(enrolledCollegeCareer(),true),last=source.health.games.filter(g=>g.evidence.seasonKey==='2030' && g.evidence.teamKey==='U07').at(-1)!;
 last.result.injured.push('own');source.days.days.find(d=>d.day===last.evidence.day)!.result.injured.push('own');source.health.injuries.own={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:last.evidence.gameKey,seasonKey:'2030'};
 const complete=cupComplete(source);assert.equal(complete.health.injuries.own,undefined);assert.ok(complete.health.games.some(g=>g.evidence.day>source.world.calendar!.highSchoolDays.at(-1)! && g.result.recovered.includes('own')));
 const paid=settleCollegeCareerGrowth(complete,complete.revision);assert.equal(paid.career.seasonGrowth!.entries.reduce((n,e)=>n+e.period.endDay-e.period.startDay,0),129);validateSeasonGrowthLedger(paid.career.seasonGrowth!);
});
test('legacy empty college ledger rebases only PRE plan fields and still rejects changed abilities, incomplete cup and stale revision',()=>{
 const source=completedCollegeRegularSeason();source.planHistory=[{...source.planHistory[0]!,archetype:'SLUGGER'}];source.world.players.own!.archetype='SLUGGER';source.development!.seasonStartPlayer.archetype='SLUGGER';
 const complete=cupComplete(source),legacy=settleCollegeCareerGrowth(complete,complete.revision);assert.equal(legacy.career.seasonGrowth!.seasonStart.archetype,'SLUGGER');
 const changed=structuredClone(complete);changed.seasonGrowth!.seasonStart.abilities={...changed.seasonGrowth!.seasonStart.abilities,POWER:changed.seasonGrowth!.seasonStart.abilities.POWER!+1};assert.throws(()=>settleCollegeCareerGrowth(changed,changed.revision),/CHANGED_GROWTH_SEASON/);
 assert.throws(()=>settleCollegeCareerGrowth(source,source.revision),/NOT_COMPLETE/);assert.throws(()=>settleCollegeCareerGrowth(complete,0),/REVISION/);
 const missing=structuredClone(complete);missing.days.days=missing.days.days.slice(0,-1);assert.throws(()=>settleCollegeCareerGrowth(missing,missing.revision),/INCOMPLETE/);
});

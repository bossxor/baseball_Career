import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../src/college-entry.js';
import {createCollegeWorld,assertCollegeWorld} from '../src/college-world.js';
import {confirmCareerPreseason,setPreseasonCareerFocus} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {beginPitchLearning,grantPracticePitchXp} from '../src/repertoire.js';
import {canonicalJson} from '../src/game.js';
import {COLLEGES,abilityKeys,overall} from '@playball/rules';

function admitted(kind:'HITTER'|'PITCHER'='HITTER'){
 const source=completedHighSchoolCareer(undefined,kind),reviewed=acknowledgeHighSchoolSeasonReview(source,source.revision),opened=openHighSchoolCareerRoute(reviewed,reviewed.revision,1).career,view=highSchoolCareerRouteView(opened);
 return enrollHighSchoolCollege(opened,opened.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'});
}

test('year-end requires explicit unused-training forfeit, closes growth/health once and pays no new growth',()=>{
 const source=admitted(),before=canonicalJson(source),abilities=source.world.players.own!.abilities;
 assert.throws(()=>closeHighSchoolSeasonForCollege(source,source.revision),/TRAINING_FORFEIT_REQUIRED/);
 assert.throws(()=>startAdmittedCollegeSeason(source,source.revision),/YEAR_END_REQUIRED/);
 const closed=closeHighSchoolSeasonForCollege(source,source.revision,true);
 assert.equal(closed.revision,source.revision+1);assert.deepEqual(closed.world.players.own!.abilities,abilities);assert.equal(closed.seasonGrowth!.totalBudgetUnits,source.seasonGrowth!.totalBudgetUnits);assert.equal(closed.seasonGrowth!.finalized,true);assert.equal(closed.seasonGrowth!.aging!.lossUnits,0);
 assert.ok(closed.health.closedSeasons.includes('2029'));assert.ok(closed.development!.trainingUsedSeasons.includes('2029'));assert.equal(closed.development!.trainingResults.at(-1)!.choice.type,'SKIP');assert.deepEqual(closed.development!.trainingRng,source.development!.trainingRng);
 assert.equal(canonicalJson(source),before);assert.throws(()=>closeHighSchoolSeasonForCollege(closed,closed.revision,true));
});

test('atomic college activation carries identity/abilities and archives HS, new calendar/growth ledger/age only once',()=>{
 const source=admitted(),closed=closeHighSchoolSeasonForCollege(source,source.revision,true),before=canonicalJson(closed),state=startAdmittedCollegeSeason(closed,closed.revision),player=state.world.players.own!;
 assert.equal(state.world.leagueKey,'COLLEGE');assert.equal(state.world.seasonKey,'2030');assert.equal(state.world.protagonistSchoolId,'U07');assert.equal(player.age,19);assert.equal(player.fatigue,0);assert.deepEqual(player.abilities,closed.world.players.own!.abilities);assert.deepEqual(player.potential,closed.world.players.own!.potential);assert.deepEqual(player.careerPeaks,closed.world.players.own!.careerPeaks);
 assert.equal(state.phaseContext.phase,'PRESEASON_SETUP');assert.equal(state.collegeAdmission!.status,'ENROLLED');assert.equal(state.collegeAdmission!.yearsCompleted,0);assert.equal(state.collegeAdmission!.academicYear,1);assert.equal(state.revision,closed.revision+1);
 assertCollegeWorld(state.world as ReturnType<typeof createCollegeWorld>);assert.equal(state.world.schedule.length,216);assert.equal(Object.keys(state.world.players).length,225);assert.ok(state.world.schedule.every(g=>g.leagueKey==='COLLEGE' && g.seasonKey==='2030'));
 assert.deepEqual(state.records,closed.records);assert.equal(state.previousSeasons!.length,1);assert.deepEqual(state.previousSeasons![0]!.world,closed.world);assert.equal(state.previousSeasons![0]!.seasonGrowth.finalized,true);assert.equal(state.previousSeasons![0]!.world.players.own!.age,18);
 assert.equal(state.seasonGrowth!.seasonKey,'2030');assert.equal(state.seasonGrowth!.worldGrowthDays,238);assert.equal(state.seasonGrowth!.seasonStart.age,19);assert.equal(state.seasonGrowth!.totalBudgetUnits,0);assert.equal(state.seasonGrowth!.finalized,false);assert.deepEqual(state.development!.seasonStartPlayer,player);assert.ok(state.development!.trainingUsedSeasons.includes('2029'));assert.ok(!state.development!.trainingUsedSeasons.includes('2030'));assert.deepEqual(state.ownAssessment,closed.ownAssessment);assert.deepEqual(state.traits!.owned,closed.traits!.owned);assert.deepEqual(state.traits!.unlocks,closed.traits!.unlocks);assert.equal(state.traits!.lastClosedDay,null);assert.equal(state.traits!.lastSeasonKey,'2030');
 assert.equal(canonicalJson(startAdmittedCollegeSeason(JSON.parse(JSON.stringify(closed)),closed.revision)),canonicalJson(state));assert.equal(canonicalJson(closed),before);
 assert.throws(()=>startAdmittedCollegeSeason(state,state.revision),/REGISTRATION/);assert.throws(()=>confirmCareerPreseason(state,state.revision),/REGISTRATION/);assert.throws(()=>setPreseasonCareerFocus(state,state.revision,player.focus),/REGISTRATION/);assert.throws(()=>advanceHighSchoolCareer(state,state.revision),/REGISTRATION/);
});

test('college profiles respect school admission floors and preserve protagonist independently of school choice',()=>{
 const source=admitted(),closed=closeHighSchoolSeasonForCollege(source,source.revision,true),base=startAdmittedCollegeSeason(closed,closed.revision).world;
 for(const school of base.schools){
  const floor=Math.max(40,COLLEGES.find(c=>c.id===school.id)!.minimumOverall);
  for(const key of school.roster.filter(k=>k!=='own')){const player=base.players[key]!,score=overall(player.kind,player.abilities);assert.ok(score.sumUnits/score.denominator>=floor);assert.ok(score.sumUnits/score.denominator<=65);assert.ok(player.age>=19 && player.age<=22);}
 }
 const p={...base.players.own!,abilities:Object.fromEntries(abilityKeys('HITTER').map(k=>[k,600_000])),potential:Object.fromEntries(abilityKeys('HITTER').map(k=>[k,900_000])),careerPeaks:Object.fromEntries(abilityKeys('HITTER').map(k=>[k,600_000]))};
 const world=createCollegeWorld({worldKey:'college-check',seed:'fixed',seasonYear:2030,collegeId:'U01',player:p,difficulty:'REALISTIC'});
 assert.deepEqual(world.players.own,p);assert.equal(world.schools[0]!.roster.filter(k=>k==='own').length,1);
 const corrupted=structuredClone(world);corrupted.schedule[0]!.leagueKey='HS';assert.throws(()=>assertCollegeWorld(corrupted),/SCHEDULE/);
});

test('pitcher carry keeps book/weights, opens fresh annual XP budget and refuses unfinished learning',()=>{
 const source=admitted('PITCHER');source.world.repertoires.own=grantPracticePitchXp(source.world.repertoires.own!,'carry-fixture','P01',3,5);source.world.repertoires.own.usedWindows=['2029:PRE'];const initial=source.world.repertoires.own;
 assert.equal(initial.ledger.baseSpentUnits,600);
 const learning=structuredClone(source);learning.world.repertoires.own=beginPitchLearning(initial,'P04',true);
 assert.throws(()=>closeHighSchoolSeasonForCollege(learning,learning.revision,true),/PITCH_LEARNING_SETTLEMENT_REQUIRED/);
 const closed=closeHighSchoolSeasonForCollege(source,source.revision,true),state=startAdmittedCollegeSeason(closed,closed.revision),carried=state.world.repertoires.own!;
 assert.deepEqual(carried.book,initial.book);assert.deepEqual(carried.weights,initial.weights);assert.equal(carried.seasonId,'2030');assert.equal(carried.ledger.baseSpentUnits,0);assert.deepEqual(carried.usedWindows,[]);assert.equal(carried.learning,null);assert.deepEqual(state.previousSeasons![0]!.world.repertoires.own,initial);
});

test('mild team-game recovery carries across calendar rest; major season injury closes at year-end',()=>{
 for(const severity of ['MILD','MAJOR'] as const){
  const source=admitted(),evidence=source.health.games.find(g=>g.evidence.roster.includes('own'))!;
  evidence.result.injured.push('own');source.health.injuries.own={severity,remainingTeamGames:severity==='MILD'?3:null,diagnosedGameKey:evidence.evidence.gameKey,seasonKey:'2029'};
  const npc=evidence.evidence.roster.find(k=>k!=='own')!;evidence.result.injured.push(npc);source.health.injuries[npc]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:evidence.evidence.gameKey,seasonKey:'2029'};
  const closed=closeHighSchoolSeasonForCollege(source,source.revision,true),state=startAdmittedCollegeSeason(closed,closed.revision);
  if(severity==='MILD')assert.equal(state.health.injuries.own!.remainingTeamGames,3);else assert.equal(Object.hasOwn(state.health.injuries,'own'),false);
  assert.equal(Object.hasOwn(state.health.injuries,npc),false);assert.equal(Object.hasOwn(state.previousSeasons![0]!.health.injuries,npc),true);assert.notStrictEqual(state.health,state.previousSeasons![0]!.health);
 }
});

test('stale revision/ready snapshot/receipt and changed admission never publish a partial new world',()=>{
 const source=admitted(),closed=closeHighSchoolSeasonForCollege(source,source.revision,true);
 for(const mutate of [
  (s:typeof closed)=>{s.collegeYearEnd!.receiptKey='wrong';},
  (s:typeof closed)=>{s.world.seed='different';},
  (s:typeof closed)=>{s.collegeAdmission!.collegeId='U08';},
  (s:typeof closed)=>{s.seasonGrowth!.totalBudgetUnits++;},
 ]){
  const state=structuredClone(closed);mutate(state);const before=canonicalJson(state);assert.throws(()=>startAdmittedCollegeSeason(state,state.revision));assert.equal(canonicalJson(state),before);
 }
 assert.throws(()=>startAdmittedCollegeSeason(closed,0),/REVISION/);
});

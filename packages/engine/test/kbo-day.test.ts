import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from '../src/high-school-game.js';
import type {HighSchoolGameJob,HighSchoolGameContext} from '../src/high-school-game.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {closeKboCompetitionDay,createKboDayLedger} from '../src/kbo-day.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
import type {RecordLedger} from '../src/records.js';

const finish=(input:HighSchoolGameJob)=>{let job=input;for(let i=0;i<1000 && job.game.status!=='FINAL';i++){job=advanceHighSchoolGame(job,1000);assert.notEqual(job.stopReason,'ENGINE_LIMIT');}assert.equal(job.game.status,'FINAL');return job;};
function openingDay(kind:'HITTER'|'PITCHER'='PITCHER') {
 const entry=enteredKboCareer(kind),plan=confirmKboPreseasonPlan(entry,entry.revision),opening=confirmKboOpeningRoster(plan,plan.revision),career=confirmKboSeasonSchedule(opening,opening.revision);
 const schedules=career.competitionSchedule!.leagues,day=Math.min(...schedules.KBO.map(g=>g.worldDay),...schedules.FUTURES.map(g=>g.worldDay));
 return {career,schedules,day};
}
function playDay(career:ReturnType<typeof openingDay>['career'],schedules:ReturnType<typeof openingDay>['schedules'],day:number):RecordLedger {
 let records=career.records;
 for(const league of ['KBO','FUTURES'] as const){
  const world=createKboCompetitionGameWorld(career.world,league,career.protagonistKey);
  for(const scheduled of schedules[league].filter(g=>g.worldDay===day)){
   const context:HighSchoolGameContext={difficulty:career.difficulty,unavailableKeys:[],starters:Object.fromEntries(world.schools.map(c=>[c.id,c.roster.find(k=>world.players[k]!.position==='SP')!])),recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}};
   records=commitSchoolCompetitionGame(world,records,finish(prepareSchoolCompetitionGame(world,records,scheduled,context)),scheduled).records;
  }
 }
 return records;
}

test('both leagues close one pro day together: one fatigue step for every club player and per-league team-game health',()=>{
 const {career,schedules,day}=openingDay(),before=canonicalJson(career),records=playDay(career,schedules,day);
 const proDay=(g:{worldDay:number;scope:{leagueKey:string;seasonKey:string}})=>g.worldDay===day && ['KBO','FUTURES'].includes(g.scope.leagueKey) && g.scope.seasonKey===career.world.seasonKey;
 const played=Object.values(records.games).filter(proDay);
 assert.ok(played.some(g=>g.scope.leagueKey==='KBO') && played.some(g=>g.scope.leagueKey==='FUTURES'));
 const ledger=createKboDayLedger(career.world),closed=closeKboCompetitionDay(career.world,schedules,career.protagonistKey,records,career.health,ledger,day);
 assert.equal(closed.duplicate,false);assert.equal(closed.days.days.length,1);
 const clubPlayers=career.world.clubs.flatMap(c=>c.roster);assert.equal(new Set(clubPlayers).size,clubPlayers.length);
 const appeared=new Set(played.flatMap(g=>[...Object.keys(g.batting),...Object.keys(g.pitching)]));
 for(const key of clubPlayers){const was=career.world.players[key]!.fatigue,now=closed.world.players[key]!.fatigue;if(appeared.has(key))assert.ok(now>was,key);else assert.ok(now<=was,key);}
 assert.equal(closed.health.games.filter(g=>g.evidence.day===day && g.evidence.seasonKey===career.world.seasonKey).length,played.length*2);
 assert.equal(canonicalJson(career),before);
 // Replay returns the stored result without a second fatigue/health step.
 const replay=closeKboCompetitionDay(closed.world,schedules,career.protagonistKey,records,closed.health,closed.days,day);
 assert.equal(replay.duplicate,true);assert.equal(canonicalJson(replay.world),canonicalJson(closed.world));assert.equal(replay.health.games.length,closed.health.games.length);
});

test('day close rejects missing games, changed evidence, wrong order and a second health pass',()=>{
 const {career,schedules,day}=openingDay(),records=playDay(career,schedules,day),ledger=createKboDayLedger(career.world);
 const dayKeys=Object.values(records.games).filter(g=>g.worldDay===day && ['KBO','FUTURES'].includes(g.scope.leagueKey) && g.scope.seasonKey===career.world.seasonKey).map(g=>g.gameKey);assert.ok(dayKeys.length>=2);
 const partial:RecordLedger={...records,games:Object.fromEntries(Object.entries(records.games).filter(([k])=>k!==dayKeys[0]))};
 assert.throws(()=>closeKboCompetitionDay(career.world,schedules,career.protagonistKey,partial,career.health,ledger,day),/DAY_GAMES_NOT_FINAL/);
 assert.throws(()=>closeKboCompetitionDay(career.world,schedules,career.protagonistKey,records,career.health,ledger,day+1),/DAY_GAMES_NOT_FINAL|NON_CHRONOLOGICAL_PRO_DAY/);
 const closed=closeKboCompetitionDay(career.world,schedules,career.protagonistKey,records,career.health,ledger,day);
 const changed=structuredClone(records);const g=Object.values(changed.games).find(x=>x.worldDay===day && ['KBO','FUTURES'].includes(x.scope.leagueKey) && x.scope.seasonKey===career.world.seasonKey)!;g.teams[Object.keys(g.teams)[0]!]!.R+=1;
 assert.throws(()=>closeKboCompetitionDay(closed.world,schedules,career.protagonistKey,changed,closed.health,closed.days,day),/CHANGED_DAY_EVIDENCE/);
 assert.throws(()=>closeKboCompetitionDay(career.world,schedules,career.protagonistKey,records,closed.health,ledger,day),/PARTIAL_DAY_HEALTH_STATE/);
 assert.throws(()=>closeKboCompetitionDay(career.world,schedules,career.protagonistKey,records,career.health,{...ledger,worldKey:'other'},day),/INVALID_PRO_DAY/);
});

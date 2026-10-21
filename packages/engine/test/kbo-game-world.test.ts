import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from '../src/high-school-game.js';
import type {HighSchoolGameJob,HighSchoolGameContext} from '../src/high-school-game.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
const finish=(input:HighSchoolGameJob,chunk:number)=>{let job=input;for(let i=0;i<1000 && job.game.status!=='FINAL';i++){job=advanceHighSchoolGame(job,chunk);assert.notEqual(job.stopReason,'ENGINE_LIMIT');}assert.equal(job.game.status,'FINAL');return job;};
test('actual KBO and FUTURES games use disjoint rosters; JSON PA resume/official scopes/books publish once without changing the career root',()=>{
 const entry=enteredKboCareer('PITCHER'),plan=confirmKboPreseasonPlan(entry,entry.revision),opening=confirmKboOpeningRoster(plan,plan.revision),s=confirmKboSeasonSchedule(opening,opening.revision),before=canonicalJson(s);
 const first=createKboCompetitionGameWorld(s.world,'KBO',s.protagonistKey),second=createKboCompetitionGameWorld(s.world,'FUTURES',s.protagonistKey);const firstKeys=new Set(first.schools.flatMap(c=>c.roster)),secondKeys=new Set(second.schools.flatMap(c=>c.roster));assert.equal(firstKeys.size,280);assert.equal(secondKeys.size,221);assert.equal([...firstKeys].some(k=>secondKeys.has(k)),false);assert.equal(new Set([...firstKeys,...secondKeys]).size,501);
 let records=s.records;
 for(const world of [first,second]){
  const league=world.leagueKey as 'KBO'|'FUTURES',scheduled=s.competitionSchedule!.leagues[league].find(g=>g.awayTeamKey===s.protagonistClubId || g.homeTeamKey===s.protagonistClubId)!;
  const context:HighSchoolGameContext={difficulty:s.difficulty,unavailableKeys:Object.keys(s.health.injuries),starters:Object.fromEntries(world.schools.map(c=>[c.id,c.roster.find(k=>world.players[k]!.position==='SP')!])),recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}};
  const job=prepareSchoolCompetitionGame(world,records,scheduled,context),full=finish(job,1000),resumed=finish(JSON.parse(JSON.stringify(advanceHighSchoolGame(job,13))),7);assert.equal(canonicalJson(full.game),canonicalJson(resumed.game));
  const allowed=new Set(world.schools.filter(c=>[scheduled.awayTeamKey,scheduled.homeTeamKey].includes(c.id)).flatMap(c=>c.roster));for(const team of job.game.input.teams){assert.equal(team.lineup.length,9);assert.ok([...team.lineup,...team.pitchers].every(p=>allowed.has(p.simulationKey)));}
  const result=commitSchoolCompetitionGame(world,records,resumed,scheduled);assert.equal(result.duplicate,false);assert.equal(result.records.games[scheduled.simulationKey]!.scope.leagueKey,league);assert.equal(result.records.games[scheduled.simulationKey]!.scope.phase,'REGULAR');const duplicate=commitSchoolCompetitionGame(result.world,result.records,resumed,scheduled);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.records.revision,result.records.revision);
  assert.throws(()=>commitSchoolCompetitionGame(world,records,{...resumed,worldDay:999},scheduled));records=result.records;
 }
 assert.equal(records.revision,s.records.revision+2);assert.equal(canonicalJson(s),before);
 const bad=structuredClone(s.world);bad.clubs[0]!.firstTeam[0]='missing';assert.throws(()=>createKboCompetitionGameWorld(bad,'FUTURES',s.protagonistKey));assert.throws(()=>createKboCompetitionGameWorld(s.world,'KBO','missing'));
});

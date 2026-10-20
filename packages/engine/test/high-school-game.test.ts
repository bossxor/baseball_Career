import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {prepareHighSchoolGame,advanceHighSchoolGame,commitHighSchoolGame} from '../src/high-school-game.js';
import type {HighSchoolGameContext,HighSchoolGameJob} from '../src/high-school-game.js';
import type {HighSchoolWorld} from '../src/high-school-world.js';
import {emptyRecordLedger,recordTotals} from '../src/records.js';
import {canonicalJson} from '../src/game.js';
const fixture=()=>createHighSchoolWorld({worldKey:'world-game',seasonKey:'2032',seed:'school-game-fixture',schoolId:'H01',startDay:31,secondaryPitch:'P02',player:{simulationKey:'my-pitcher',name:'내투수',kind:'PITCHER',position:'SP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'BALANCED',focus:['VELOCITY','STUFF','COMMAND','STAMINA'],difficulty:'SECRET_CHEAT'}});
function context(world:HighSchoolWorld):HighSchoolGameContext {
 const starters=Object.fromEntries(world.schools.map(s=>[s.id,s.id==='H01'?world.protagonistKey:s.roster.find(k=>world.players[k]!.position==='SP')!]));
 return {difficulty:'SECRET_CHEAT',unavailableKeys:[],starters,recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}};
}
function finish(input:HighSchoolGameJob,chunk=1000):HighSchoolGameJob {let job=input;for(let i=0;job.game.status!=='FINAL' && i<100;i++){job=advanceHighSchoolGame(job,chunk);assert.notEqual(job.stopReason,'ENGINE_LIMIT');}assert.equal(job.game.status,'FINAL');return job;}
const schoolGame=(world:HighSchoolWorld)=>world.schedule.find(g=>g.awayTeamKey==='H01' || g.homeTeamKey==='H01')!;
test('generated HS roster becomes actual1.2 game; selected starter, nine distinct legal hitters and owned-only cheatXP',()=>{
 const world=fixture(),scheduled=schoolGame(world),before=canonicalJson(world),job=prepareHighSchoolGame(world,emptyRecordLedger(),scheduled.simulationKey,context(world));
 assert.equal(job.game.engineVersion,'1.2.0');assert.equal(job.worldDay,scheduled.worldDay);assert.equal(job.game.input.teams[0].simulationKey,scheduled.awayTeamKey);
 for(const team of job.game.input.teams){assert.equal(new Set(team.lineup.map(p=>p.simulationKey)).size,9);assert.equal(team.fielders.length,8);assert.equal(team.pitchers.filter(p=>p.role==='SP' && p.available).length,1);}
 assert.equal(job.game.appearances.find(a=>a.pitcherKey===world.protagonistKey)!.starter,true);
 for(const [key,entry] of Object.entries(job.game.pitchDevelopment!.players))assert.equal(entry.numerator,key===world.protagonistKey?15:5);
 assert.equal(canonicalJson(world),before);assert.throws(()=>commitHighSchoolGame(world,emptyRecordLedger(),job));
});
test('HS game serialized PA resume equals continuous final; records and XP publish once after FINAL',()=>{
 const world=fixture(),records=emptyRecordLedger(),job=prepareHighSchoolGame(world,records,schoolGame(world).simulationKey,context(world)),before=canonicalJson(world);
 const full=finish(job),resumed=finish(JSON.parse(JSON.stringify(advanceHighSchoolGame(job,17))),7);
 assert.equal(canonicalJson(resumed.game),canonicalJson(full.game));assert.equal(canonicalJson(world),before);
 const committed=commitHighSchoolGame(world,records,resumed);assert.equal(committed.records.revision,1);assert.equal(Object.keys(records.games).length,0);
 assert.ok(committed.world.repertoires[world.protagonistKey]!.ledger.actualBudgetSpentUnits>0);assert.equal(world.repertoires[world.protagonistKey]!.ledger.actualBudgetSpentUnits,0);
 const duplicate=commitHighSchoolGame(committed.world,committed.records,resumed);assert.equal(duplicate.duplicate,true);assert.equal(canonicalJson(duplicate.world),canonicalJson(committed.world));assert.equal(duplicate.records.revision,1);
 assert.throws(()=>prepareHighSchoolGame(committed.world,committed.records,job.game.input.simulationKey,context(committed.world)));
});
test('stale world/revision and tampered scheduled date rejected without partial record/book changes',()=>{
 const world=fixture(),records=emptyRecordLedger(),job=finish(prepareHighSchoolGame(world,records,schoolGame(world).simulationKey,context(world))),before=canonicalJson(records);
 const changed=structuredClone(world);changed.players[world.protagonistKey]!.fatigue=1;assert.throws(()=>commitHighSchoolGame(changed,records,job),/STALE/);
 assert.throws(()=>commitHighSchoolGame(world,{...records,revision:1},job),/STALE/);assert.throws(()=>commitHighSchoolGame(world,records,{...job,worldDay:999}),/SCHEDULE/);assert.equal(canonicalJson(records),before);
});
test('unavailable hitters excluded, insufficient roster rejects; bad starter, missing book and allocation reject',()=>{
 const world=fixture(),scheduled=schoolGame(world),c=context(world),school=world.schools[0]!,hitters=school.roster.filter(k=>world.players[k]!.kind==='HITTER');
 const job=prepareHighSchoolGame(world,emptyRecordLedger(),scheduled.simulationKey,{...c,unavailableKeys:[hitters[0]!]});assert.ok(!job.game.input.teams.flatMap(t=>t.lineup).some(p=>p.simulationKey===hitters[0]));
 assert.throws(()=>prepareHighSchoolGame(world,emptyRecordLedger(),scheduled.simulationKey,{...c,unavailableKeys:hitters.slice(0,7)}));
 assert.throws(()=>prepareHighSchoolGame(world,emptyRecordLedger(),scheduled.simulationKey,{...c,starters:{...c.starters,H01:hitters[0]!}}));
 const changed=structuredClone(world);delete changed.repertoires[world.protagonistKey];assert.throws(()=>prepareHighSchoolGame(changed,emptyRecordLedger(),scheduled.simulationKey,c));
});
test('all four first-day scheduled games commit sequentially, eight teams once; independent9th team bye',()=>{
 let world=fixture(),records=emptyRecordLedger();const firstDay=world.schedule[0]!.worldDay,games=world.schedule.filter(g=>g.worldDay===firstDay);assert.equal(games.length,4);
 for(const scheduled of games){const result=commitHighSchoolGame(world,records,finish(prepareHighSchoolGame(world,records,scheduled.simulationKey,context(world))));world=result.world;records=result.records;}
 const totals=recordTotals(records,{leagueKey:'HS',phase:'REGULAR',seasonKey:world.seasonKey});assert.equal(Object.keys(totals.teams).length,8);assert.ok(Object.values(totals.teams).every(t=>t.games===1));assert.equal(records.revision,4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import type {HighSchoolWorld} from '../src/high-school-world.js';
import {prepareHighSchoolGame,advanceHighSchoolGame,commitHighSchoolGame} from '../src/high-school-game.js';
import {createSchoolDayLedger,closeHighSchoolDay} from '../src/high-school-day.js';
import {emptyRecordLedger,recordTotals} from '../src/records.js';
import type {RecordLedger} from '../src/records.js';
import {createHealthLedger} from '../src/health.js';
import type {HealthLedger} from '../src/health.js';
import {seedPcg32} from '../src/rng.js';
import {canonicalJson} from '../src/game.js';
const fixture=()=>createHighSchoolWorld({worldKey:'day-world',seasonKey:'2032',seed:'day-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
function playDay(world:HighSchoolWorld,records:RecordLedger,health:HealthLedger,day:number){
 for(const scheduled of world.schedule.filter(g=>g.worldDay===day)){
  const totals=recordTotals(records,{leagueKey:'HS',phase:'REGULAR',seasonKey:world.seasonKey});
  const starters=Object.fromEntries(world.schools.map(s=>{const available=s.roster.filter(k=>world.players[k]!.kind==='PITCHER' && !Object.hasOwn(health.injuries,k));const rotation=available.filter(k=>world.players[k]!.position==='SP');const pool=rotation.length?rotation:available;return [s.id,pool[(totals.teams[s.id]?.games??0)%pool.length]!];}));
  let job=prepareHighSchoolGame(world,records,scheduled.simulationKey,{difficulty:'GROWTH',unavailableKeys:Object.keys(health.injuries),starters,recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}});
  for(let i=0;job.game.status!=='FINAL' && i<10;i++)job=advanceHighSchoolGame(job);
  const committed=commitHighSchoolGame(world,records,job);world=committed.world;records=committed.records;
 }
 return {world,records};
}
test('all same-day games required before fatigue/injury; first-day close changes each player only once, bye rests',()=>{
 let world=fixture();for(const p of Object.values(world.players))p.fatigue=50;
 const records=emptyRecordLedger(),health=createHealthLedger(seedPcg32(42n,54n)),days=createSchoolDayLedger(world),before=canonicalJson(world);
 assert.throws(()=>closeHighSchoolDay(world,records,health,days,31),/NOT_FINAL/);
 const played=playDay(world,records,health,31);world=played.world;
 const closed=closeHighSchoolDay(world,played.records,health,days,31);
 const actual=new Set(Object.values(played.records.games).flatMap(c=>Object.keys(c.batting)));
 for(const p of Object.values(world.players).filter(p=>p.kind==='HITTER'))assert.equal(closed.world.players[p.simulationKey]!.fatigue,actual.has(p.simulationKey)?55:42);
 assert.equal(closed.health.games.length,8);assert.equal(closed.days.days.length,1);assert.equal(canonicalJson(played.world),canonicalJson(world));
 assert.equal(closed.world.players['my-hitter']!.fatigue,42); // H01 has round0 bye.
 assert.notEqual(canonicalJson(closed.world),before);
 const retry=closeHighSchoolDay(closed.world,played.records,closed.health,JSON.parse(JSON.stringify(closed.days)),31);assert.equal(retry.duplicate,true);assert.equal(canonicalJson(retry.world),canonicalJson(closed.world));assert.equal(canonicalJson(retry.health),canonicalJson(closed.health));
});
test('day ordering, world identity, altered official contribution and partial health publication reject',()=>{
 const initial=fixture(),health=createHealthLedger(seedPcg32(42n,54n)),days=createSchoolDayLedger(initial),played=playDay(initial,emptyRecordLedger(),health,31);
 assert.throws(()=>closeHighSchoolDay(played.world,played.records,health,{...days,worldKey:'other'},31));
 assert.throws(()=>closeHighSchoolDay(played.world,played.records,health,days,32));
 const closed=closeHighSchoolDay(played.world,played.records,health,days,31);
 const changed=structuredClone(played.records);Object.values(changed.games)[0]!.teams[Object.keys(Object.values(changed.games)[0]!.teams)[0]!]!.R++;
 assert.throws(()=>closeHighSchoolDay(closed.world,changed,closed.health,closed.days,31),/CHANGED/);
 assert.throws(()=>closeHighSchoolDay(played.world,played.records,closed.health,days,31),/PARTIAL/);
});
test('six actual league dates then rest day: rest once, no injury RNG or healing tick on calendar rest',()=>{
 let world=fixture(),records=emptyRecordLedger(),health=createHealthLedger(seedPcg32(42n,54n)),days=createSchoolDayLedger(world);
 for(let day=31;day<=36;day++){
  const played=playDay(world,records,health,day);records=played.records;
  const closed=closeHighSchoolDay(played.world,records,health,days,day);world=closed.world;health=closed.health;days=closed.days;
 }
 assert.equal(world.schedule.some(g=>g.worldDay===37),false);assert.equal(records.revision,24);
 const before=structuredClone(world),beforeHealth=canonicalJson(health),rest=closeHighSchoolDay(world,records,health,days,37);
 assert.equal(canonicalJson(rest.health),beforeHealth);assert.equal(rest.days.days.length,7);
 for(const player of Object.values(before.players))assert.equal(rest.world.players[player.simulationKey]!.fatigue,Math.max(0,player.fatigue-(player.kind==='HITTER'?8:10)));
 assert.equal(canonicalJson(closeHighSchoolDay(rest.world,records,rest.health,rest.days,37).world),canonicalJson(rest.world));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld,assertHighSchoolWorld} from '../src/high-school-world.js';
import {createSchoolEmergencyRegistry,reconcileSchoolEmergency} from '../src/high-school-emergency.js';
import {createHealthLedger} from '../src/health.js';
import {seedPcg32} from '../src/rng.js';
import {canonicalJson} from '../src/game.js';
import {emptyRecordLedger} from '../src/records.js';
import {prepareHighSchoolGame,advanceHighSchoolGame,commitHighSchoolGame} from '../src/high-school-game.js';
const fixture=()=>createHighSchoolWorld({worldKey:'emergency-world',seasonKey:'2032',seed:'emergency-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
const health=()=>createHealthLedger(seedPcg32(42n,54n));
test('healthy world reconciliation consumes no generation RNG, keeps initial225 and exact25 creation invariant',()=>{
 const world=fixture(),before=canonicalJson(world),registry=createSchoolEmergencyRegistry(world),result=reconcileSchoolEmergency(world,health(),registry,31,'GROWTH');
 assert.deepEqual(result.added,[]);assert.deepEqual(result.released,[]);assert.equal(canonicalJson(result.world),before);assertHighSchoolWorld(result.world);
});
test('all injured school receives exactly9H+1P; playable actual game and JSON retry consumes no extra generation',()=>{
 const world=fixture(),injured=health(),school=world.schools[0]!,before=canonicalJson(world);
 // Controlled unavailable-state fixture. This test does not claim injury probability makes all25 hurt.
 for(const key of school.roster)injured.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-fixture',seasonKey:world.seasonKey};
 const registry=createSchoolEmergencyRegistry(world),result=reconcileSchoolEmergency(world,injured,registry,32,'GROWTH');
 assert.equal(result.added.length,10);assert.equal(result.added.filter(k=>result.world.players[k]!.kind==='HITTER').length,9);assert.equal(result.added.filter(k=>result.world.players[k]!.kind==='PITCHER').length,1);assert.equal(result.world.schools[0]!.roster.length,35);
 assert.equal(canonicalJson(world),before);assert.equal(registry.nextSerial,1);
 for(const key of result.added){const player=result.world.players[key]!;const overall=Object.values(player.abilities).reduce((a,b)=>a+b,0)/60_000;assert.ok(overall>=35 && overall<=65);assert.equal(player.age,18);}
 const scheduled=world.schedule.find(g=>g.awayTeamKey==='H01' || g.homeTeamKey==='H01')!;
 const starters=Object.fromEntries(result.world.schools.map(s=>[s.id,s.roster.find(k=>result.world.players[k]!.position==='SP' && !Object.hasOwn(injured.injuries,k))!]));
 let game=prepareHighSchoolGame(result.world,emptyRecordLedger(),scheduled.simulationKey,{difficulty:'GROWTH',unavailableKeys:Object.keys(injured.injuries),starters,recentBatting:{},recentPitchingOuts:{},traits:{},approaches:{}});
 assert.equal(game.game.input.teams.find(t=>t.simulationKey==='H01')!.lineup.length,9);
 for(let i=0;game.game.status!=='FINAL' && i<10;i++)game=advanceHighSchoolGame(game);
 const committed=commitHighSchoolGame(result.world,emptyRecordLedger(),game);assert.equal(committed.records.revision,1);assert.ok(result.added.some(key=>Object.hasOwn(committed.records.games[scheduled.simulationKey]!.batting,key)));
 const repeat=reconcileSchoolEmergency(JSON.parse(JSON.stringify(result.world)),injured,JSON.parse(JSON.stringify(result.registry)),32,'GROWTH');assert.deepEqual(repeat.added,[]);assert.equal(canonicalJson(repeat.world),canonicalJson(result.world));
});
test('originals return: all excess temps leave roster, identities/repertoires preserved; later shortages use new serials',()=>{
 const world=fixture(),injured=health();for(const key of world.schools[0]!.roster)injured.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-fixture',seasonKey:world.seasonKey};
 const first=reconcileSchoolEmergency(world,injured,createSchoolEmergencyRegistry(world),32,'GROWTH');
 const recovered=reconcileSchoolEmergency(first.world,health(),first.registry,35,'GROWTH');assert.equal(recovered.released.length,10);assert.equal(recovered.world.schools[0]!.roster.length,25);
 for(const key of first.added){assert.ok(Object.hasOwn(recovered.world.players,key));assert.equal(recovered.registry.entries[key]!.releasedDay,35);if(recovered.world.players[key]!.kind==='PITCHER')assert.ok(Object.hasOwn(recovered.world.repertoires,key));}
 const later=reconcileSchoolEmergency(recovered.world,injured,recovered.registry,36,'GROWTH');assert.equal(later.added.length,10);assert.ok(later.added.every(k=>!first.added.includes(k)));
});
test('partial hitter shortage is minimum; world/registry mismatch and backward reconciliation rejected',()=>{
 const world=fixture(),injured=health(),hitters=world.schools[0]!.roster.filter(k=>world.players[k]!.kind==='HITTER');
 for(const key of hitters.slice(0,7))injured.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-fixture',seasonKey:world.seasonKey};
 const result=reconcileSchoolEmergency(world,injured,createSchoolEmergencyRegistry(world),32,'REALISTIC');assert.equal(result.added.length,1);
 assert.throws(()=>reconcileSchoolEmergency(result.world,injured,{...result.registry,worldKey:'other'},32,'GROWTH'));assert.throws(()=>reconcileSchoolEmergency(result.world,injured,result.registry,31,'GROWTH'));
});

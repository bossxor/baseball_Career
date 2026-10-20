import assert from 'node:assert/strict';
import test from 'node:test';
import {createHighSchoolWorld,assertHighSchoolWorld} from '../src/high-school-world.js';
import {abilityKeys,HITTER_TYPES,PITCHER_TYPES} from '@playball/rules';
import type {CreationInput} from '../src/player.js';
import {canonicalJson} from '../src/game.js';
const player=(overrides:Partial<CreationInput>={}):CreationInput=>({simulationKey:'my-player',name:'내선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'SLUGGER',focus:['CONTACT','POWER','DISCIPLINE','CLUTCH'],difficulty:'GROWTH',...overrides});
const input=()=>({worldKey:'world-fixture',seasonKey:'2027',seed:'seed42',schoolId:'H01',player:player(),startDay:31});
test('HS world: 9 schools/225 players, real protagonist replacement, all positions and216 games',()=>{
  const source=input(),before=JSON.stringify(source),world=createHighSchoolWorld(source);assertHighSchoolWorld(world);
  assert.equal(world.phase,'CREATED');assert.equal(world.schedule.length,216);assert.equal(Object.keys(world.players).length,225);
  assert.equal(world.schools[0]!.roster.filter(id=>id==='my-player').length,1);assert.equal(Object.keys(world.repertoires).length,90);
  assert.equal(JSON.stringify(source),before);assert.equal(world.players['my-player']!.age,18);
  for(const npc of Object.values(world.players).filter(p=>p.simulationKey!=='my-player')) {
    const sum=Object.values(npc.abilities).reduce((a,b)=>a+b,0);assert.ok(sum>=35*60_000 && sum<=65*60_000);
    assert.ok(Object.values(npc.abilities).every(n=>n>=10_000 && n<=1_000_000));
  }
});
test('HS world: same seed and serialized snapshot exact, new seed changes generated roster',()=>{
  const first=createHighSchoolWorld(input());assert.equal(canonicalJson(createHighSchoolWorld(input())),canonicalJson(first));
  const restored=JSON.parse(JSON.stringify(first));assertHighSchoolWorld(restored);assert.equal(canonicalJson(restored),canonicalJson(first));
  assert.notDeepEqual(createHighSchoolWorld({...input(),seed:'other'}).players,first.players);
});
test('HS world: all player archetypes/positions and pitcher forms accepted without illegal rosters',()=>{
  for(const [kind,types] of [['HITTER',HITTER_TYPES],['PITCHER',PITCHER_TYPES]] as const) for(const archetype of Object.keys(types)) {
    const pitcher=kind==='PITCHER',world=createHighSchoolWorld({...input(),player:player({kind,archetype,position:pitcher?'SP':'C',pitchForm:pitcher?'UNDERHAND':null,focus:abilityKeys(kind).slice(0,4)}),...(pitcher?{secondaryPitch:'P07' as const}:{})});assertHighSchoolWorld(world);
    if(pitcher) assert.equal(world.repertoires['my-player']!.book.P07,100_000);
  }
});
test('HS world: hard does not secretly raise current abilities; NPC P+5, protagonist normal/hard unchanged',()=>{
  const normal=createHighSchoolWorld(input()),hard=createHighSchoolWorld({...input(),player:player({difficulty:'REALISTIC'})}),cheat=createHighSchoolWorld({...input(),player:player({difficulty:'SECRET_CHEAT'})});
  assert.deepEqual(normal.players['my-player'],hard.players['my-player']);assert.deepEqual(normal.schedule,hard.schedule);
  for(const id of Object.keys(normal.players)) {
    const a=normal.players[id]!,b=hard.players[id]!,c=cheat.players[id]!;assert.deepEqual(a.abilities,b.abilities);assert.equal(a.throws,b.throws);assert.equal(a.bats,b.bats);
    if(id==='my-player') assert.ok(Object.values(c.potential).every(n=>n===1_000_000));
    else for(const key of abilityKeys(a.kind)) {assert.equal(b.potential[key],Math.min(1_000_000,a.potential[key]!+50_000));assert.equal(c.potential[key],a.potential[key]);}
  }
  assert.deepEqual(normal.rng,hard.rng);assert.deepEqual(normal.rng,cheat.rng);
});
test('HS world rejects invalid school/pitch choice/key collision and corrupted persisted rosters',()=>{
  assert.throws(()=>createHighSchoolWorld({...input(),schoolId:'MISSING'}));
  assert.throws(()=>createHighSchoolWorld({...input(),player:player({kind:'PITCHER',position:'SP',pitchForm:'OVERHAND',archetype:'BALANCED',focus:abilityKeys('PITCHER').slice(0,4)})}));
  const world=createHighSchoolWorld(input()),key=world.schools[0]!.roster[0]!;
  const bad=structuredClone(world);bad.schools[1]!.roster[0]=key;assert.throws(()=>assertHighSchoolWorld(bad));
  const badPitch=structuredClone(world);delete badPitch.repertoires[Object.keys(badPitch.repertoires)[0]!];assert.throws(()=>assertHighSchoolWorld(badPitch));
});

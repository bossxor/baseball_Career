import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalJson} from '../src/game.js';
import {createSingleRoundRobinSchedule} from '../src/schedule.js';
import {nationalNationPreset,createNationalBracket,nextNationalMatch,assertNationalBracket,prepareNationalMatch,advanceNationalMatch} from '../src/national-bracket.js';
import type {TeamSnapshot} from '../src/types.js';
import {HITTER_ABILITIES,PITCHER_ABILITIES} from '@playball/rules';
import {seedPcg32,nextFloat} from '../src/rng.js';

const team=(id:string):TeamSnapshot=>({simulationKey:id,lineup:Array.from({length:9},(_,i)=>({simulationKey:id+'-h'+i,abilities:Object.fromEntries(HITTER_ABILITIES.map(a=>[a,550000])),fatigue:0,morale:1,temporary:{},traitLogits:[],available:true,bats:'R',approach:'BALANCED'})),pitchers:Array.from({length:3},(_,i)=>({simulationKey:id+'-p'+i,abilities:Object.fromEntries(PITCHER_ABILITIES.map(a=>[a,550000])),fatigue:0,morale:1,temporary:{},traitLogits:[],available:true,throws:'R',pitchForm:'OVERHAND',role:i===0?'SP':'RP',recentOuts:0,repertoire:[{pitchId:'P01',mastery:2,weight:60},{pitchId:'P03',mastery:1,weight:40}]})),fielders:Array.from({length:8},(_,i)=>({simulationKey:id+'-h'+i,fit:100}))});
test('national single round robin keeps one meeting, no double bookings and balanced venues for3/4/5/6 teams',()=>{
 for(const n of [3,4,5,6]){const ids=Array.from({length:n},(_,i)=>'T'+i),schedule=createSingleRoundRobinSchedule({teamKeys:ids,leagueKey:'INT',seasonKey:'2030',startDay:0});assert.equal(schedule.length,n*(n-1)/2);const pairs=new Set(schedule.map(g=>[g.awayTeamKey,g.homeTeamKey].sort().join(':')));assert.equal(pairs.size,schedule.length);
  for(const id of ids){const own=schedule.filter(g=>[g.awayTeamKey,g.homeTeamKey].includes(id)),home=own.filter(g=>g.homeTeamKey===id).length;assert.equal(own.length,n-1);assert.equal(new Set(own.map(g=>g.worldDay)).size,n-1);assert.ok(Math.abs(home-(n-1-home))<=1);}
 }
});
test('approved presets and seed-balanced groups are fixed, unique and do not mutate the caller',()=>{
 for(const [type,year,count,size]of [['WBC','2030',20,5],['OLY','2028',6,3],['AG','2030',8,4],['P12','2027',12,6]] as const){const input={worldKey:'world',seasonKey:year,tournament:type,seed:'draw'},a=createNationalBracket(input);assert.equal(nationalNationPreset(type).length,count);assert.equal(new Set(a.groups.flat()).size,count);assert.ok(a.groups.every(g=>g.length===size));assert.deepEqual(createNationalBracket(input),a);assertNationalBracket(JSON.parse(canonicalJson(a)));
  assert.ok(a.groupMatches.every(m=>m.day>=0));const strengths=new Map(nationalNationPreset(type).map(n=>[n.id,n.strength]));for(const tier of [65,55,45]){const counts=a.groups.map(g=>g.filter(id=>strengths.get(id)===tier).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}
 }
 const bad=createNationalBracket({worldKey:'world',seasonKey:'2030',tournament:'WBC',seed:'draw'});bad.groups=[...bad.groups].reverse();assert.throws(()=>assertNationalBracket(bad),/CHANGED_NATIONAL_DRAW/);assert.throws(()=>createNationalBracket({worldKey:'w',seasonKey:'2029',tournament:'WBC',seed:'s'}),/NOT_SCHEDULED/);
});
test('all four brackets play actual international games through FINAL, including after Korean elimination; WBC has no bronze',()=>{
 for(const [type,year,total]of [['WBC','2030',47],['OLY','2028',10],['AG','2030',16],['P12','2027',34]] as const){let s=createNationalBracket({worldKey:'w',seasonKey:year,tournament:type,seed:'actual'});const stages:string[]=[],dates=new Map<string,Set<number>>();
  for(let i=0;i<100;i++){const m=nextNationalMatch(s);if(!m)break;stages.push(m.stage);for(const id of [m.away,m.home]){if(!dates.has(id))dates.set(id,new Set());assert.ok(!dates.get(id)!.has(m.day));dates.get(id)!.add(m.day);}s=prepareNationalMatch(s,[team(m.away),team(m.home)]);let contribution=null;
   for(let chunk=0;chunk<20;chunk++){const out=advanceNationalMatch(JSON.parse(canonicalJson(s)));s=out.bracket;if(out.contribution){contribution=out.contribution;break;}}
   assert.ok(contribution);assert.equal(contribution.scope.phase,'INTERNATIONAL');assert.equal(contribution.scope.leagueKey,type);assert.equal(contribution.gameKey,m.gameKey);
  }
  assert.equal(s.results.length,total);assert.equal(nextNationalMatch(s),null);assert.equal(stages.filter(x=>x==='BRONZE').length,type==='WBC'?0:1);assertNationalBracket(s);assert.throws(()=>prepareNationalMatch(s,[team('KOR'),team('JPN')]),/COMPLETE/);
 }
});
test('midgame JSON resume equals continuous play; stale match input/results cannot advance a bracket',()=>{
 const empty=createNationalBracket({worldKey:'w',seasonKey:'2030',tournament:'AG',seed:'resume'}),m=nextNationalMatch(empty)!,started=prepareNationalMatch(empty,[team(m.away),team(m.home)]),raw=canonicalJson(started),chunk=advanceNationalMatch(started,1);assert.equal(canonicalJson(started),raw);assert.equal(chunk.contribution,null);assert.equal(chunk.bracket.results.length,0);assert.equal(nextNationalMatch(chunk.bracket)!.gameKey,m.gameKey);
 const finish=(source:typeof started)=>{let s=source;for(let i=0;i<20;i++){const out=advanceNationalMatch(s);s=out.bracket;if(out.contribution)return out;}throw Error('not final');};assert.equal(canonicalJson(finish(JSON.parse(canonicalJson(chunk.bracket)))),canonicalJson(finish(started)));
 const bad=structuredClone(chunk.bracket);bad.pendingGame!.input.seed='reroll';assert.throws(()=>advanceNationalMatch(bad),/CHANGED_NATIONAL_PENDING/);assert.throws(()=>advanceNationalMatch(started,0),/INVALID_NATIONAL_CHUNK/);assert.throws(()=>prepareNationalMatch(started,[team(m.away),team(m.home)]),/ALREADY_PENDING/);
 const final=finish(started).bracket;assert.throws(()=>advanceNationalMatch(final),/NOT_PENDING/);const changed=structuredClone(final);changed.results=[{...changed.results[0]!,winner:'not-a-team'}];assert.throws(()=>assertNationalBracket(changed),/INVALID_NATIONAL_MATCH_RESULT/);
 const capped=structuredClone(started);capped.pendingGame!.halfPlateAppearances=300;const stopped=advanceNationalMatch(capped);assert.equal(stopped.stopReason,'ENGINE_LIMIT');assert.equal(stopped.contribution,null);assert.equal(stopped.bracket.results.length,0);assert.equal(canonicalJson(stopped.bracket),canonicalJson(capped));
});
test('INT12 engine: prescribed international strikeouts preserve20-inning tie and resume inning21 without advancing the draw',()=>{
 const bracket=createNationalBracket({worldKey:'w',seasonKey:'2030',tournament:'AG',seed:'twenty'}),m=nextNationalMatch(bracket)!;let s=prepareNationalMatch(bracket,[team(m.away),team(m.home)]),k=seedPcg32(1n,1n);
 for(let i=0;i<1000;i++){const candidate=seedPcg32(BigInt(i),1n),draw=nextFloat(candidate).value;if(draw>.15&&draw<.20){k=candidate;break;}}
 // Prescribed outcome fixture only; production exposes no RNG override.
 for(let i=0;i<119;i++){s.pendingGame!.rng.game={...k,draws:s.pendingGame!.playCursor};const out=advanceNationalMatch(s,1);assert.equal(out.contribution,null);s=out.bracket;}
 s.pendingGame!.rng.game={...k,draws:s.pendingGame!.playCursor};const paused=advanceNationalMatch(s);assert.equal(paused.bracket.pendingGame!.inning,21);assert.equal(paused.bracket.pendingGame!.playCursor,120);assert.equal(paused.contribution,null);assert.equal(paused.bracket.results.length,0);assert.equal(nextNationalMatch(paused.bracket)!.gameKey,m.gameKey);
 const restored=JSON.parse(canonicalJson(paused.bracket)) as typeof s,out=advanceNationalMatch(restored,1);assert.equal(out.bracket.pendingGame!.playCursor,121);assert.equal(out.bracket.results.length,0);
});

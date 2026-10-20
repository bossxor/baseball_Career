import assert from 'node:assert/strict';
import test from 'node:test';
import { createRepertoire, pitchMastery, rebalancePitchWeights, validatePitchWeights, beginPitchLearning, settlePitchLearning, grantPracticePitchXp, aiPitchWeights, aiLearningPitch, copyPitchBook, setPitchWeights } from '../src/repertoire.js';
import type { Repertoire } from '../src/repertoire.js';
import { createHandednessStream, seedPcg32 } from '../src/rng.js';
import { generateNpcIdentities, generateNpcPotential } from '../src/npc.js';
import type { NpcIdentityInput } from '../src/npc.js';
import { abilityKeys } from '@playball/rules';
const start=()=>createRepertoire('P02','2027');
const quarter=(source:Repertoire,q:1|2|3|4,numerator:5|6|15=5,healthyDays=10,registeredDays=10)=>settlePitchLearning(source,{quarter:q,healthyDays,registeredDays,numerator,completedGames:q*12,scheduledGames:48});

test('57: initial book, exact grade thresholds, invalid loadouts and source preservation',()=>{
  const source=start(),before=JSON.stringify(source);
  assert.equal(pitchMastery(source.book.P01!),2);assert.equal(pitchMastery(299_999),1);
  for(const xp of [-1,.5,1_500_001,NaN]) assert.throws(()=>pitchMastery(xp));
  assert.throws(()=>validatePitchWeights(source.book,{P01:60,P02:39}));
  assert.throws(()=>validatePitchWeights({...source.book,P03:0},{P01:50,P03:50}));
  beginPitchLearning(source,'P03',true);assert.equal(JSON.stringify(source),before);
});
test('101: every slider target respects sum100/lower10, deterministic ties, immutable input',()=>{
  const weights={P01:40,P02:30,P03:20,P04:10} as const;
  for(const id of ['P01','P02','P03','P04'] as const) for(let value=-10;value<=110;value++) {
    const result=rebalancePitchWeights(weights,id,value);
    assert.equal(Object.values(result).reduce((a,b)=>a+b,0),100);
    assert.ok(Object.values(result).every(n=>n>=10 && n<=70));
  }
  assert.deepEqual(rebalancePitchWeights({P01:34,P02:33,P03:33},'P01',35),{P01:35,P02:33,P03:32});
  assert.deepEqual(weights,{P01:40,P02:30,P03:20,P04:10});
});
test('57: four healthy learning quarters normal10/cheat30, 0 XP stays inactive, no cancel/reselect',()=>{
  for(const numerator of [5,15] as const) {
    let result=beginPitchLearning(start(),'P03',true);
    assert.equal(result.ledger.baseReservedUnits,100_000);
    assert.equal(result.book.P03,0);assert.equal(result.weights.P03,undefined);
    assert.throws(()=>beginPitchLearning(result,'P04',true));
    for(const q of [1,2,3,4] as const) result=quarter(result,q,numerator);
    assert.equal(result.book.P03,numerator===5?100_000:300_000);
    assert.equal(pitchMastery(result.book.P03!),numerator===5?1:2);
    assert.equal(result.ledger.baseReservedUnits,0);assert.equal(result.ledger.baseSpentUnits,100_000);
  }
});
test('57/90: half-healthy cheat3.75, fraction carry, zero denominator and duplicate quarters',()=>{
  const source=beginPitchLearning(start(),'P03',true);
  assert.throws(()=>quarter(source,2));
  const first=quarter(source,1,15,5,10);assert.equal(first.book.P03,37_500);
  assert.deepEqual(quarter(first,1,15,5,10),first);
  assert.throws(()=>quarter(first,1,15,6,10));
  let result=source;
  for(const q of [1,2,3] as const) result=quarter(result,q,5,1,3);
  assert.equal(result.book.P03,25_000);assert.equal(result.learning!.carryNumerator,'0');
  result=quarter(result,4,5,0,0);assert.equal(result.book.P03,25_000);assert.equal(result.ledger.baseReservedUnits,0);
});
test('57/90: reservation protects learning, released missed learning is future practice only',()=>{
  let result=beginPitchLearning(start(),'P03',true);
  for(let i=0;i<400;i++) result=grantPracticePitchXp(result,'pa'+i,'P01',3,15);
  assert.equal(result.ledger.baseSpentUnits,100_000);assert.equal(result.ledger.actualBudgetSpentUnits,300_000);
  result=quarter(result,1,15,0,10);
  assert.equal(result.ledger.baseReservedUnits,75_000);
  assert.deepEqual(grantPracticePitchXp(result,'pa399','P01',3,15),result);
  result=grantPracticePitchXp(result,'new-pa','P01',3,15);
  assert.equal(result.ledger.baseSpentUnits,100_600);
  assert.throws(()=>grantPracticePitchXp(result,'new-pa','P01',2,15));
  assert.throws(()=>grantPracticePitchXp(result,'bad','P03',1,15));
});
test('57: full-slot learning consumes PRE once atomically; unchanged loadout costs zero',()=>{
  const source={...start(),book:{P01:300_000,P02:100_000,P03:100_000,P04:100_000},weights:{P01:40,P02:30,P03:20,P04:10}};
  assert.throws(()=>beginPitchLearning(source,'P05',true));
  const result=beginPitchLearning(source,'P05',true,{pitchId:'P04',windowId:'2027:PRE'});
  assert.deepEqual(result.usedWindows,['2027:PRE']);assert.equal(result.weights.P04,undefined);
  validatePitchWeights(result.book,result.weights);assert.equal(Object.keys(result.weights).length,3);
  assert.throws(()=>setPitchWeights(result,{P01:50,P02:30,P03:20},'2027:PRE',true));
  assert.deepEqual(setPitchWeights(result,result.weights,'2027:PRE',false),result);
  assert.deepEqual(source.weights,{P01:40,P02:30,P03:20,P04:10});
});
test('57: AI ranking/thresholds and archive grade reduction preserve history without RNG',()=>{
  assert.deepEqual(aiPitchWeights({P04:100_000,P03:300_000,P02:300_000,P01:1_500_000,P05:0}),{P01:40,P02:30,P03:20,P04:10});
  assert.equal(aiLearningPitch(start()),null);
  assert.equal(aiLearningPitch({...start(),book:{P01:400_000,P02:100_000}}),'P03');
  const copy=copyPitchBook({P01:1_500_000,P02:600_000,P03:0},{P01:60,P02:40});
  assert.deepEqual(copy,{book:{P01:300_000,P02:100_000,P03:0},weights:{P01:60,P02:40}});
  assert.throws(()=>aiPitchWeights({P01:300_000}));
});
test('121: identity sorted generation, JSON resume and restricted positions',()=>{
  const source:NpcIdentityInput[]=['C','2B','3B','SS','CF','LF','1B','RF','DH'].map((position,i)=>({simulationKey:'h'+i,kind:'HITTER',position}));
  source.push({simulationKey:'p',kind:'PITCHER',position:'SP'});
  const seed=createHandednessStream('seed','world'),result=generateNpcIdentities(source,seed);
  assert.deepEqual(generateNpcIdentities([...source].reverse(),seed),result);
  assert.ok(result.players.filter(p=>['C','2B','3B','SS'].includes(p.position)).every(p=>p.throws==='R'));
  assert.equal(result.state.draws,21);
  assert.deepEqual(generateNpcIdentities([],JSON.parse(JSON.stringify(result.state))).state,result.state);
  assert.throws(()=>generateNpcIdentities([source[0]!,source[0]!],seed));
});
test('121: fixed large sample hand/bat/form probabilities and corrected hitter population',()=>{
  const pitchers:NpcIdentityInput[]=Array.from({length:20_000},(_,i)=>({simulationKey:'p'+String(i).padStart(5,'0'),kind:'PITCHER',position:'SP'}));
  const result=generateNpcIdentities(pitchers,createHandednessStream('distribution','world')).players;
  const left=result.filter(p=>p.throws==='L');assert.ok(Math.abs(left.length/result.length-.15)<.015);
  for(const [hand,probs] of [['R',{R:.8,L:.12,S:.08}],['L',{R:.25,L:.7,S:.05}]] as const) {
    const subset=result.filter(p=>p.throws===hand);
    for(const side of ['R','L','S'] as const) assert.ok(Math.abs(subset.filter(p=>p.bats===side).length/subset.length-probs[side])<.025);
  }
  for(const [form,expected] of [['OVERHAND',.45],['THREE_QUARTER',.35],['SIDEARM',.15],['UNDERHAND',.05]] as const) assert.ok(Math.abs(result.filter(p=>p.pitchForm===form).length/result.length-expected)<.02);
  const hitters:NpcIdentityInput[]=pitchers.map((p,i)=>({...p,kind:'HITTER',position:['C','2B','3B','SS','CF','LF','RF','1B','DH'][i%9]!}));
  const h=generateNpcIdentities(hitters,createHandednessStream('hitters','world')).players;
  assert.ok(Math.abs(h.filter(p=>p.throws==='L').length/h.length-.15)<.015);
});
test('42/85: NPC hard potential+5, club cheat owned-only, unchanged A/RNG and old player floor',()=>{
  const abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,980_000])),rng=seedPcg32(42n,54n);
  const normal=generateNpcPotential('HITTER',abilities,{mode:'CAREER',difficulty:'GROWTH',owned:false},rng);
  const hard=generateNpcPotential('HITTER',abilities,{mode:'CAREER',difficulty:'REALISTIC',owned:false},rng);
  assert.ok(Object.values(normal.potential).every(n=>n===980_000));assert.ok(Object.values(hard.potential).every(n=>n===1_000_000));assert.deepEqual(normal.state,hard.state);
  const initial=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,500_000]));
  const base=generateNpcPotential('HITTER',initial,{mode:'CLUB',difficulty:'GROWTH',owned:false},rng);
  assert.deepEqual(generateNpcPotential('HITTER',initial,{mode:'CLUB',difficulty:'SECRET_CHEAT',owned:false},rng),base);
  assert.ok(Object.values(generateNpcPotential('HITTER',initial,{mode:'CLUB',difficulty:'SECRET_CHEAT',owned:true},rng).potential).every(n=>n===1_000_000));
});
test('57: newly learned pitch can enter four-pitch loadout without counting the same slot twice',()=>{
  let result=beginPitchLearning({...start(),book:{P01:300_000,P02:100_000,P03:100_000},weights:{P01:50,P02:30,P03:20}},'P04',true);
  for(const q of [1,2,3,4] as const) result=quarter(JSON.parse(JSON.stringify(result)),q,15);
  result=setPitchWeights(result,{P01:40,P02:30,P03:20,P04:10},'2027:MID',true);
  validatePitchWeights(result.book,result.weights);assert.equal(result.weights.P04,10);
  for(let i=0;i<400;i++) result=grantPracticePitchXp(result,'late-pa'+i,'P01',3,15);
  assert.equal(result.ledger.actualBudgetSpentUnits,600_000);assert.equal(result.ledger.baseSpentUnits,200_000);
});

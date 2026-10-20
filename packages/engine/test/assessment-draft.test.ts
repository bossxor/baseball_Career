import assert from 'node:assert/strict';
import test from 'node:test';
import {potentialRange,reconcileAssessment,observeAssessmentProgress,assessmentView,assessmentMidpointScore,ownAssessmentLevel} from '../src/assessment.js';
import {draftPreview,drawDraft,draftRound,draftBaseScore,canShowUsDirect} from '../src/draft.js';
import {seedPcg32} from '../src/rng.js';
import {abilityKeys} from '@playball/rules';
const abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,500_000])),potential=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,900_000]));
const basis={playerKey:'player',modelVersion:'assessment1',kind:'HITTER' as const,abilities,potential,level:2,stage:0};
test('67: range narrows monotonically across observations; lower facility does not widen',()=>{
  let ranges=reconcileAssessment(basis);const first=structuredClone(ranges);
  for(let stage=1;stage<=4;stage++) {const next=reconcileAssessment({...basis,stage,previous:ranges});for(const k of abilityKeys('HITTER')) {assert.ok(next[k]!.lowUnits>=ranges[k]!.lowUnits && next[k]!.highUnits<=ranges[k]!.highUnits);assert.ok(next[k]!.lowUnits<=potential[k]! && next[k]!.highUnits>=potential[k]!);}ranges=next;}
  assert.deepEqual(reconcileAssessment({...basis,level:1,stage:0,previous:ranges}),ranges);
  assert.deepEqual(reconcileAssessment(basis),first);
});
test('67: A99/100 bounds, outward display rounding and impossible prior fail safely',()=>{
  assert.deepEqual(potentialRange({currentUnits:1_000_000,potentialUnits:1_000_000,level:2,stage:0,z:.9}),{lowUnits:1_000_000,highUnits:1_000_000});
  const near=potentialRange({currentUnits:990_000,potentialUnits:995_000,level:2,stage:0,z:.4});assert.ok(near.lowUnits>=990_000 && near.highUnits<=1_000_000);
  assert.throws(()=>potentialRange({currentUnits:500_000,potentialUnits:900_000,level:2,stage:0,z:.5,previous:{lowUnits:700_000,highUnits:800_000}}),/ASSESSMENT_INCONSISTENT/);
  const ranges=reconcileAssessment(basis),view=assessmentView({kind:'HITTER',abilities,ranges,progress:{observed:[],stage:0},fixedCheat:false});
  assert.ok(view.abilities.every(row=>'potentialRange' in row && row.potentialRange!.low<=90 && row.potentialRange!.high>=90));
});
test('67: registered game19→20, duplicate no-op, transfer preserves progress, maxstage4',()=>{
  let progress={observed:[] as {gameKey:string;worldDay:number}[],stage:0};
  for(let i=0;i<100;i++) {progress=observeAssessmentProgress(progress,{gameKey:(i<19?'old-team':'new-team')+i,worldDay:i});assert.equal(progress.stage,Math.min(4,Math.floor((i+1)/20)));}
  assert.deepEqual(observeAssessmentProgress(progress,progress.observed[0]!),progress);
  assert.throws(()=>observeAssessmentProgress(progress,{gameKey:'old-team0',worldDay:100}));
  assert.throws(()=>observeAssessmentProgress(progress,{gameKey:'other-game',worldDay:99}));
  assert.equal(ownAssessmentLevel(0),2);assert.equal(ownAssessmentLevel(6),5);
});
test('67: public allowlist and AI midpoint use ranges, not raw hidden potential',()=>{
  const ranges=reconcileAssessment(basis),view=assessmentView({kind:'HITTER',abilities,ranges,progress:{observed:[],stage:0},fixedCheat:false});
  assert.deepEqual(Object.keys(view).sort(),['abilities','mode','nextObservationGames','stage']);
  assert.ok(!JSON.stringify(view).match(/seed|potentialUnits|rng|z"|careerPeaks/));
  const expected=Object.values(ranges).reduce((s,r)=>s+(r.lowUnits+r.highUnits)/20_000,0)/6;assert.equal(assessmentMidpointScore('HITTER',ranges),expected);
  const cheat=assessmentView({kind:'HITTER',abilities,ranges,progress:{observed:[],stage:0},fixedCheat:true});assert.ok(cheat.abilities.every(row=>'fixedPotential' in row && row.fixedPotential===100 && !('potentialRange' in row)));
});
test('34: B45 means50% selection, round10 40%+round9 10%, no draw for preview',()=>{
  const preview=draftPreview({baseScore:45,hasEligibleClubSlot:true});assert.equal(preview.selectionProbability,.5);assert.equal(preview.roundProbabilities[9]!.probability,.4);assert.equal(preview.roundProbabilities[8]!.probability,.1);assert.deepEqual(preview.conditionalLikelyRounds,[10]);
  assert.equal(draftBaseScore(50,50),50);assert.equal(draftRound(45),10);assert.equal(draftRound(49),9);assert.equal(draftRound(81),1);assert.equal(draftRound(44.999),null);
});
test('34: all boundary probabilities sum1, no fake round when no slot; tied likely rounds preserved',()=>{
  for(let baseScore=0;baseScore<=100;baseScore+=.25) {const p=draftPreview({baseScore,hasEligibleClubSlot:true});assert.ok(Math.abs(p.selectionProbability+p.undraftedProbability-1)<1e-12);assert.ok(Math.abs(p.selectionProbability-Math.max(0,Math.min(1,(baseScore-40)/10)))<1e-12);}
  const no=draftPreview({baseScore:100,hasEligibleClubSlot:false});assert.equal(no.selectionProbability,0);assert.deepEqual(no.conditionalLikelyRounds,[]);
  const tie=draftPreview({baseScore:53,hasEligibleClubSlot:true});assert.deepEqual(tie.conditionalLikelyRounds,[8,9]);
});
test('34: fixed-seed draft empirical distribution matches preview and consumes exactly one draw',()=>{
  let rng=seedPcg32(42n,54n),selected=0,r9=0,r10=0;
  for(let i=0;i<30_000;i++) {const result=drawDraft({baseScore:45,hasEligibleClubSlot:true},rng);rng=result.state;if(result.round!==null)selected++;if(result.round===9)r9++;if(result.round===10)r10++;}
  assert.equal(rng.draws,30_000);assert.ok(Math.abs(selected/30_000-.5)<.015);assert.ok(Math.abs(r9/30_000-.1)<.01);assert.ok(Math.abs(r10/30_000-.4)<.015);
  assert.deepEqual(drawDraft({baseScore:90,hasEligibleClubSlot:false},rng),{score:null,round:null,state:rng});
});
test('34: US direct only with ability AND assessment AND actual valid offer AND eligibility',()=>{
  const valid={overall:52,amateurScore:50,validOfferCount:1,eligible:true};assert.equal(canShowUsDirect(valid),true);
  for(const change of [{overall:51.9999},{amateurScore:49.9999},{validOfferCount:0},{eligible:false}]) assert.equal(canShowUsDirect({...valid,...change}),false);
  assert.throws(()=>canShowUsDirect({...valid,validOfferCount:-1}));
});

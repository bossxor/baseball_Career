import assert from 'node:assert/strict';
import test from 'node:test';
import {hiddenTraitCard,defenseTraitTemporary,traitLogitEffects,traitDefenseBonus,traitRunningBonus,traitPitchThreshold,evaluateTraitUnlocks,qualifiesRivalSeason} from '../src/traits.js';
import type {TraitOwnership,TraitContext,TraitUnlockEvidence} from '../src/traits.js';
import {createGame,runGameChunk,canonicalJson} from '../src/game.js';
import {combineEffects,extraHomeProbability} from '../src/probabilities.js';
import {advanceBases} from '../src/bases.js';
import {seedPcg32} from '../src/rng.js';
import {game,team} from './fixtures.js';
import {abilityKeys} from '@playball/rules';
const ownership=(unlocked:TraitOwnership['unlocked'],qualifiedRivalPitcherKeys:string[]=[]):TraitOwnership=>({unlocked,qualifiedRivalPitcherKeys});
const context=(overrides:Partial<TraitContext>={}):TraitContext=>({inning:1,half:'TOP',ownerLead:0,loaded:false,firstMeeting:true,postseason:false,pitcherKey:'opponent',starter:true,pitcherRuns:0,...overrides});
const zero=():TraitUnlockEvidence=>({regular:{PA:0,extraBaseHits:0,BB:0,K:0,outs:0,starts:0},career:{extraHomeSuccesses:0,fieldingGames:0,loadedHits:0,postseasonHR:0,saves:0,loadedBF:0,walkoffHits:0,shutouts:0,consecutiveQualifiedSeasons:0},qualifiedRivalPitcherKeys:[]});
test('56: first meeting, bases loaded, postseason and exact owned targets evaluated each PA',()=>{
  const own=ownership(['T01','T05','T06','T14'],['qualified']);
  assert.equal(traitLogitEffects('HITTER',own,context()).length,1);
  assert.equal(traitLogitEffects('HITTER',own,context({firstMeeting:false})).length,0);
  assert.equal(traitLogitEffects('HITTER',own,context({loaded:true,postseason:true,pitcherKey:'qualified'})).length,4);
  assert.equal(traitLogitEffects('HITTER',own,context({firstMeeting:false,pitcherKey:'other'})).length,0);
});
test('100: walkoff exact bottom9+/tied or down1, pitcher late lead/start/run boundaries',()=>{
  const hitter=ownership(['T13']);
  for(const inning of [8,9,10])for(const half of ['TOP','BOTTOM'] as const)for(const ownerLead of [-2,-1,0,1]) assert.equal(traitLogitEffects('HITTER',hitter,context({inning,half,ownerLead})).length,inning>=9 && half==='BOTTOM' && [-1,0].includes(ownerLead)?1:0);
  const pitcher=ownership(['T09','T12','T15','T16']);
  assert.equal(traitLogitEffects('PITCHER',pitcher,context({inning:9,ownerLead:1})).length,4);
  assert.equal(traitLogitEffects('PITCHER',pitcher,context({inning:9,ownerLead:0,starter:false,pitcherRuns:1})).length,1);
});
test('56/123: owned effects all apply then shared cap; nonlogit effects separate',()=>{
  const raw=traitLogitEffects('PITCHER',ownership(['T07','T09','T11','T12']),context({inning:9,loaded:true,ownerLead:1}));
  const effects=combineEffects(raw,[]);assert.equal(effects.traitRaw.K,.13);assert.equal(effects.applied.K,.06);
  assert.equal(traitDefenseBonus(ownership(['T04'])),2);assert.equal(traitRunningBonus(ownership(['T03'])),.02);
  assert.ok(Math.abs(extraHomeProbability(70,60,.02)-.745)<1e-12);assert.equal(traitPitchThreshold(104,true,ownership(['T10'])),105);assert.equal(traitPitchThreshold(30,false,ownership(['T10'])),30);
});
test('56: finalized evidence unlocks once and never removes owned traits after decline/correction',()=>{
  const abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,700_000])),evidence=zero();evidence.regular.BB=29;
  assert.deepEqual(evaluateTraitUnlocks('HITTER',abilities,ownership([]),evidence).unlocked,[]);
  evidence.regular.BB=30;evidence.career.walkoffHits=3;evidence.qualifiedRivalPitcherKeys=['rival'];
  const unlocked=evaluateTraitUnlocks('HITTER',abilities,ownership([]),evidence);assert.deepEqual(unlocked.unlocked,['T02','T13','T14']);
  assert.deepEqual(evaluateTraitUnlocks('HITTER',abilities,unlocked,evidence),unlocked);
  assert.deepEqual(evaluateTraitUnlocks('HITTER',abilities,unlocked,zero()),unlocked);
});
test('107: exact OPS .900/PA20/WIN and AB0 guards, no rounded-OPS unlock',()=>{
  assert.equal(qualifiesRivalSeason({PA:20,AB:20,H:9,BB:0,HBP:0,TB:9,confirmedRelationshipWin:true}),true);
  assert.equal(qualifiesRivalSeason({PA:20,AB:20,H:9,BB:0,HBP:0,TB:9,confirmedRelationshipWin:false}),false);
  assert.equal(qualifiesRivalSeason({PA:20,AB:20,H:8,BB:0,HBP:0,TB:9,confirmedRelationshipWin:true}),false);
  assert.equal(qualifiesRivalSeason({PA:20,AB:0,H:0,BB:20,HBP:0,TB:0,confirmedRelationshipWin:true}),false);
});
test('56: runner retains own T03 bonus across future batters, without bonus for unrelated runners',()=>{
  const state=seedPcg32(42n,54n),runner={simulationKey:'runner',responsiblePitcherKey:'p',automatic:false,running:70};
  const input={outcome:'1B' as const,outs:2,bases:[null,runner,null] as [null,typeof runner,null],batter:{...runner,simulationKey:'batter'},defense:50,pickoff:50,winningRunsNeeded:null};
  const normal=advanceBases(input,state),withTrait=advanceBases({...input,bases:[null,{...runner,extraHomeBonus:.02},null]},state);
  assert.ok(Math.abs(withTrait.attempts[0]!.probability-normal.attempts[0]!.probability-.02)<1e-12);
});
test('game1.1: actual owned traits affect probabilities; JSON PA-chunk resume exactly matches full run',()=>{
  const source=game('trait-fixture');source.traitRulesVersion=1;
  for(const t of source.teams) {for(const h of t.lineup) h.traits=ownership(['T01','T02','T03','T04','T05','T06','T13']);for(const p of t.pitchers)p.traits=ownership(['T07','T08','T09','T10','T11','T12','T15','T16']);}
  const full=runGameChunk(createGame(source)).state;let resumed=createGame(source);
  while(resumed.status!=='FINAL') resumed=runGameChunk(JSON.parse(JSON.stringify(resumed)),{plateAppearances:1}).state;
  assert.equal(full.engineVersion,'1.1.0');assert.equal(canonicalJson(full),canonicalJson(resumed));
  const plain=game('trait-fixture'),normal=runGameChunk(createGame(plain),{plateAppearances:1}).state;
  assert.notDeepEqual(normal.plays[0]!.probabilities,full.plays[0]!.probabilities);
  assert.throws(()=>createGame({...source,traitRulesVersion:2 as 1}));
  source.teams[0].lineup[0]!.traitLogits=[{HR:.04}];assert.throws(()=>createGame(source),/INVALID_TRAIT_INPUT/);
});
test('game1.1 empty ownership leaves every probability/RNG/result unchanged relative to game1.0',()=>{
  const source={...game('no-trait-fixture'),teams:[team('away'),team('home')] as const},legacy=runGameChunk(createGame(source)).state;
  const modern=runGameChunk(createGame({...source,traitRulesVersion:1})).state;
  assert.deepEqual(modern.plays,legacy.plays);assert.deepEqual(modern.rng,legacy.rng);assert.deepEqual(modern.scores,legacy.scores);assert.deepEqual(modern.decisions,legacy.decisions);
});

test('100: locked hidden trait card strictly excludes supplied secret details; unlock reveals them',()=>{
 const details={condition:'server condition',effects:{HR:.05},evidenceRefs:['receipt'],progress:99,predicateKey:'secret'};
 const card=hiddenTraitCard('T14',ownership([]),details);assert.deepEqual(Object.keys(card).sort(),['hidden','hint','name','traitId']);
 const open=hiddenTraitCard('T14',ownership(['T14'],['rival']),details);assert.ok('effects' in open);assert.ok(!('predicateKey' in open));
 assert.equal(defenseTraitTemporary(500_000,{DEFENSE:-100},ownership(['T04'])).DEFENSE,-47);
 assert.equal(defenseTraitTemporary(990_000,{},ownership(['T04'])).DEFENSE,1);
});

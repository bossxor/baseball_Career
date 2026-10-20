import assert from 'node:assert/strict';
import test from 'node:test';
import { abilityKeys, HITTER_TYPES, PITCHER_TYPES, normalizePlayerName } from '@playball/rules';
import { createCareerPlayer } from '../src/player.js';
import type { CreationInput } from '../src/player.js';
import { allocateCapped, applyAging, applyGrowthBudget, naturalGrowthBudgetUnits, positiveGrowthMultiplier, settleNaturalGrowth } from '../src/development.js';
import type { GrowthPeriod } from '../src/development.js';
import { trainingPreview, applySeasonTraining } from '../src/training.js';
import { emptyPitchXpLedger, grantPitchXp } from '../src/pitch-xp.js';
import { seedPcg32 } from '../src/rng.js';

const seed = () => seedPcg32(42n, 54n);
const input = (overrides: Partial<CreationInput> = {}): CreationInput => ({ simulationKey: 'protagonist', name: '  홍길동 ', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'SLUGGER', focus: ['CONTACT','POWER','DISCIPLINE','DEFENSE'], difficulty: 'GROWTH', ...overrides });
// Controlled cap-free fixture for arithmetic tests; generation distribution is tested separately.
const player = () => { const p = createCareerPlayer(input(), seed()).player; return { ...p, potential: Object.fromEntries(abilityKeys(p.kind).map(key => [key,1_000_000])) }; };
const context = { seasonId: 'season-2027', completedTeamGames: 48, scheduledTeamGames: 144, injured: false, windowOpen: true, careerCheat: false };
const period = (overrides: Partial<GrowthPeriod> = {}): GrowthPeriod => ({ startDay: 0, endDay: 100, levelSeasonDays: 100, level: 'PRO', appearances: 375, pitcherRole: 'SP', rehabRatio: 0, trainingMultiplier: 1, ordinaryMilitary: false, policy: { mode: 'CAREER', difficulty: 'REALISTIC', beneficiary: true }, ...overrides });

test('79: shared versioned graphemes, NFC, trim, emoji and control/name limits', () => {
  assert.equal(normalizePlayerName('  가 김  '), '가 김');
  assert.equal(normalizePlayerName('👨‍👩‍👧‍👦'.repeat(12)), '👨‍👩‍👧‍👦'.repeat(12));
  for (const value of ['', '  ', '가'.repeat(13), '가\n나', 'a\u0000b']) assert.throws(() => normalizePlayerName(value));
  assert.equal(normalizePlayerName('<b>x</b>'), '<b>x</b>'); // Render as text at the UI boundary.
});
test('35/79: every archetype starts with six axes, sum300, age18 and immutable source input', () => {
  for (const [kind, profiles] of [['HITTER', HITTER_TYPES], ['PITCHER', PITCHER_TYPES]] as const) for (const archetype of Object.keys(profiles)) {
    const creation = input({ kind, archetype, position: kind === 'HITTER' ? 'CF' : 'SP', pitchForm: kind === 'HITTER' ? null : 'THREE_QUARTER', focus: abilityKeys(kind).slice(0,4) });
    const before = JSON.stringify(creation), result = createCareerPlayer(creation, seed()).player;
    assert.equal(Object.values(result.abilities).reduce((a,b) => a+b,0), 3_000_000);
    assert.equal(result.age, 18); assert.equal(result.name, '홍길동'); assert.equal(JSON.stringify(creation), before);
  }
});
test('42/85: normal/hard protagonist A/P and RNG match; cheat only fixes P100', () => {
  const normal = createCareerPlayer(input(), seed()), hard = createCareerPlayer(input({ difficulty: 'REALISTIC' }), seed()), cheat = createCareerPlayer(input({ difficulty: 'SECRET_CHEAT' }), seed());
  assert.deepEqual(normal.player, hard.player); assert.deepEqual(normal.state, hard.state);
  assert.deepEqual(normal.player.abilities, cheat.player.abilities); assert.ok(Object.values(cheat.player.potential).every(n => n === 1_000_000));
  assert.deepEqual(normal.state, cheat.state);
  for (const key of abilityKeys('HITTER')) assert.ok(normal.player.potential[key]! >= Math.max(normal.player.abilities[key]!,600_000) && normal.player.potential[key]! <= 950_000);
});
test('79/119: left-handed restricted positions, wrong axes, missing pitcher form and extra hitter form reject', () => {
  for (const position of ['C','2B','3B','SS']) assert.throws(() => createCareerPlayer(input({ position, throws: 'L' }), seed()));
  assert.throws(() => createCareerPlayer(input({ pitchForm: 'OVERHAND' }), seed()));
  assert.throws(() => createCareerPlayer(input({ kind: 'PITCHER', position: 'SP' }), seed()));
  assert.throws(() => createCareerPlayer(input({ focus: ['CONTACT','POWER','RUNNING','STAMINA'] }), seed()));
});
test('42: G10 gives focused2 each and unselected .6667/1.3333 with exact total', () => {
  const source = player(), before = JSON.stringify(source), result = applyGrowthBudget(source,100_000);
  assert.deepEqual(result.gains,[20_000,20_000,20_000,20_000,6667,13333]);
  assert.equal(result.gains.reduce((a,b) => a+b,0),100_000); assert.equal(JSON.stringify(source), before);
  assert.deepEqual(result.player.careerPeaks,result.player.abilities);
});
test('42: capped weights redistribute all units; all-capped discards; no overshoot', () => {
  assert.deepEqual(allocateCapped(100,[1,1,1],[0,10,200]),{gains:[0,10,90],discarded:0});
  assert.deepEqual(allocateCapped(100,[0,0],[3,4]),{gains:[3,4],discarded:93});
  for(let total=0;total<100;total++) {
    const result=allocateCapped(total,[1,7,0,2],[13,4,50,6]);
    assert.equal(result.gains.reduce((a,b)=>a+b,0)+result.discarded,total);
    result.gains.forEach((gain,i)=>assert.ok(gain <= [13,4,50,6][i]!));
  }
});
test('42/85: actual period budget10→15/10/30; hardNPC12; no multiplier stacking', () => {
  for (const [difficulty,expected] of [['GROWTH',150_000],['REALISTIC',100_000],['SECRET_CHEAT',300_000]] as const) assert.equal(naturalGrowthBudgetUnits(player(),100,[period({policy:{mode:'CAREER',difficulty,beneficiary:true}})]),expected);
  assert.equal(positiveGrowthMultiplier({mode:'CAREER',difficulty:'REALISTIC',beneficiary:false}),1.2);
  assert.equal(naturalGrowthBudgetUnits(player(),100,[period({ordinaryMilitary:true})]),0);
});
test('42/85: ownership periods use their own growth policy; overlap and repeated settlement reject', () => {
  const policies = [period({startDay:0,endDay:50,appearances:250,policy:{mode:'CLUB',difficulty:'SECRET_CHEAT',beneficiary:false}}),period({startDay:50,endDay:100,appearances:250,policy:{mode:'CLUB',difficulty:'SECRET_CHEAT',beneficiary:true}})];
  assert.equal(naturalGrowthBudgetUnits(player(),100,policies),220_000);
  assert.throws(()=>naturalGrowthBudgetUnits(player(),100,[period(),period()]));
  const settled=settleNaturalGrowth(player(),[],'2027',100,[period()]);
  assert.throws(()=>settleNaturalGrowth(settled.player,settled.settledSeasons,'2027',100,[period()]));
});
test('42: aging does not triple or erase career peaks; lower1 cap is conserved', () => {
  const source={...player(),age:35}, result=applyAging(source).player;
  assert.equal(Object.values(source.abilities).reduce((a,b)=>a+b,0)-Object.values(result.abilities).reduce((a,b)=>a+b,0),50_000);
  assert.deepEqual(result.careerPeaks,source.careerPeaks);
  const bottom={...source,abilities:Object.fromEntries(abilityKeys(source.kind).map(k=>[k,10_000]))};
  assert.equal(applyAging(bottom).discarded,50_000);
});
test('75: exact preview caps at1.25, fatigue95→100, is read-only and rejects <1 capacity', () => {
  const source={...player(),abilities:{...player().abilities,POWER:900_000},potential:{...player().potential,POWER:912_500},careerPeaks:{...player().careerPeaks,POWER:900_000},fatigue:95};
  const before=JSON.stringify(source), preview=trainingPreview(source,[],{type:'CHALLENGE',ability:'POWER'},context);
  assert.equal(preview.gainUnits,12_500); assert.equal(preview.fatigueDelta,5); assert.equal(preview.probability,.6); assert.equal(before,JSON.stringify(source));
  const capped={...source,potential:{...source.potential,POWER:909_999}};
  assert.equal(trainingPreview(capped,[],{type:'GUARANTEED',ability:'POWER'},context).uses,0);
});
test('42: all choices share one world-season opportunity; cheat keeps +2, no random draw', () => {
  const source=createCareerPlayer(input({difficulty:'SECRET_CHEAT'}),seed()).player;
  const result=applySeasonTraining(source,[],{type:'CHALLENGE',ability:'POWER'},{...context,careerCheat:true},seed());
  assert.equal(result.gainUnits,20_000); assert.deepEqual(result.state,seed());
  assert.throws(()=>applySeasonTraining(result.player,result.usedSeasons,{type:'CONDITIONING'},context,result.state));
  assert.equal(trainingPreview(source,[],{type:'GUARANTEED',ability:'POWER'},{...context,completedTeamGames:47}).eligible,false);
  assert.equal(trainingPreview(source,[],{type:'GUARANTEED',ability:'POWER'},{...context,scheduledTeamGames:48,completedTeamGames:16}).eligible,true);
});
test('75: failed challenge consumes chance/fatigue; conditioning cannot invent recovery', () => {
  const source=player(); // Official42/54 first draw .6303 > .60.
  const result=applySeasonTraining(source,[],{type:'CHALLENGE',ability:'POWER'},context,seed());
  assert.equal(result.success,false); assert.equal(result.gainUnits,0); assert.equal(result.player.fatigue,10); assert.equal(result.usedSeasons.length,1);
  const rested=applySeasonTraining({...source,fatigue:8},[],{type:'CONDITIONING'},context,seed());
  assert.equal(rested.player.fatigue,0); assert.deepEqual(rested.state,seed());
});
test('90: general→cheat spent10+30=40, not60; transfer cannot reset spent base', () => {
  let result=grantPitchXp(emptyPitchXpLedger(),{evidenceKey:'one',pitchId:'P01',candidateBaseUnits:100_000,currentPitchXpUnits:0,numerator:5});
  result=grantPitchXp(result.ledger,{evidenceKey:'two',pitchId:'P01',candidateBaseUnits:200_000,currentPitchXpUnits:result.xpUnits,numerator:15});
  assert.equal(result.xpUnits,400_000); assert.equal(result.ledger.baseSpentUnits,200_000);
  const noMore=grantPitchXp(result.ledger,{evidenceKey:'three',pitchId:'P01',candidateBaseUnits:10_000,currentPitchXpUnits:result.xpUnits,numerator:15});
  assert.equal(noMore.xpUnits,400_000);
});
test('90: cheat→normal gives0, rejoin grants only remaining base; no clawback', () => {
  const first=grantPitchXp(emptyPitchXpLedger(),{evidenceKey:'one',pitchId:'P01',candidateBaseUnits:100_000,currentPitchXpUnits:0,numerator:15});
  const normal=grantPitchXp(first.ledger,{evidenceKey:'two',pitchId:'P01',candidateBaseUnits:100_000,currentPitchXpUnits:first.xpUnits,numerator:5});
  assert.equal(normal.xpUnits,300_000);
  const rejoin=grantPitchXp(normal.ledger,{evidenceKey:'three',pitchId:'P01',candidateBaseUnits:100_000,currentPitchXpUnits:normal.xpUnits,numerator:15});
  assert.equal(rejoin.xpUnits,600_000);
});
test('90: pitch cap loss consumes budget; reserved base protected; hard fractional remainder exact', () => {
  const capped=grantPitchXp(emptyPitchXpLedger(),{evidenceKey:'one',pitchId:'P01',candidateBaseUnits:10_000,currentPitchXpUnits:1_490_000,numerator:15});
  assert.equal(capped.xpUnits,1_500_000); assert.equal(capped.ledger.entries[0]!.capLoss,20_000);
  const reserved=grantPitchXp({...emptyPitchXpLedger(),baseReservedUnits:100_000},{evidenceKey:'reserved',pitchId:'P01',candidateBaseUnits:200_000,currentPitchXpUnits:0,numerator:5});
  assert.equal(reserved.xpUnits,100_000);
  let ledger=emptyPitchXpLedger(),xp=0;
  for(let i=0;i<5;i++){const result=grantPitchXp(ledger,{evidenceKey:`fraction-${i}`,pitchId:'P01',candidateBaseUnits:1,currentPitchXpUnits:xp,numerator:6});ledger=result.ledger;xp=result.xpUnits;}
  assert.equal(xp,6); assert.equal(ledger.scalingRemainder,0);
});
test('90: evidence replay is a no-op including zero grants; altered source rejected', () => {
  const request={evidenceKey:'zero',pitchId:'P01',candidateBaseUnits:0,currentPitchXpUnits:0,numerator:5 as const};
  const result=grantPitchXp(emptyPitchXpLedger(),request), duplicate=grantPitchXp(result.ledger,request);
  assert.equal(duplicate.duplicate,true); assert.deepEqual(result.ledger,duplicate.ledger);
  assert.throws(()=>grantPitchXp(result.ledger,{...request,numerator:15}));
});

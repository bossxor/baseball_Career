import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { OUTCOMES, HITTER_ABILITIES } from '@playball/rules';
import type { LogitVector } from '@playball/rules';
import { baseLogits, combineEffects, doublePlayProbability, effectiveAbilities, extraHomeProbability, identityEffects, matchupEffects, pitcherAppearanceFatigue, pitcherReviewThreshold, softmax } from '../src/probabilities.js';
import { selectRepresentativePitch } from '../src/game.js';

const context = (batter = 50, pitcher = 50, defense = 50) => ({ contact: batter, power: batter, discipline: batter, running: batter, clutch: batter, velocity: pitcher, stuff: pitcher, command: pitcher, composure: pitcher, defense, runnersOn: false, risp: false });
const near = (a: number, b: number, epsilon = 1e-12) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);
const performance = JSON.parse(readFileSync(new URL('../../../docs/design/ability-performance-examples.json', import.meta.url), 'utf8')) as { cases: { id: string; batterSix: number; pitcherSix: number; defense: number; probabilities: Record<string, number> }[] };
for (const example of performance.cases) test(`112/${example.id}: engine matches every published extreme-ability probability`, () => {
  const result = softmax(baseLogits(context(example.batterSix, example.pitcherSix, example.defense)));
  for (const outcome of OUTCOMES) { near(result[outcome], example.probabilities[outcome]!); assert.ok(result[outcome] > 0); }
  near(Object.values(result).reduce((a, b) => a + b, 0), 1);
});
const sums = JSON.parse(readFileSync(new URL('../../../docs/design/effect-sum-examples.json', import.meta.url), 'utf8')) as { examples: { id: string; traits: LogitVector[]; pitch: LogitVector; approach: LogitVector; form: LogitVector; platoon: LogitVector; rawSum: LogitVector; appliedSum: LogitVector; probs: LogitVector }[] };
for (const example of sums.examples) test(`123/${example.id}: trait-first cap and final cap match published sums/distribution`, () => {
  const result = combineEffects(example.traits, [example.pitch, example.approach, example.form, example.platoon]);
  const logits = baseLogits(context());
  for (const outcome of OUTCOMES) {
    near(result.raw[outcome], example.rawSum[outcome] ?? 0);
    near(result.applied[outcome], example.appliedSum[outcome] ?? 0);
    logits[outcome] += result.applied[outcome];
  }
  const distribution = softmax(logits);
  for (const outcome of OUTCOMES) near(distribution[outcome], example.probs[outcome]!, .000051);
});
test('41: clutch is RISP-only, composure is symmetric and permanent inputs remain unchanged', () => {
  const base = baseLogits(context());
  assert.deepEqual(baseLogits({ ...context(), clutch: 100 }), base);
  assert.ok(baseLogits({ ...context(), clutch: 100, runnersOn: true, risp: true }).K < base.K);
  const high = baseLogits({ ...context(), composure: 100, runnersOn: true });
  const low = baseLogits({ ...context(), composure: 1, runnersOn: true });
  near(high.K - base.K, .05); near(low.K - base.K, -.049);
});
test('41: temporary clamp → fatigue → morale → final clamp, without changing permanent abilities', () => {
  const permanent = Object.freeze(Object.fromEntries(HITTER_ABILITIES.map(key => [key, 1_000_000])));
  const result = effectiveAbilities('HITTER', permanent, 100, 1, { CONTACT: 100 });
  assert.equal(result.CONTACT, 80); assert.equal(permanent.CONTACT, 1_000_000);
  assert.equal(effectiveAbilities('HITTER', permanent, 100, 2).CONTACT, 100);
});
test('119/PF-D01..07: forms, opposite/same and switch sides; one platoon effect only', () => {
  assert.deepEqual(identityEffects('OVERHAND', 'P01', 'R', 'L'), { form: { K: .01 }, platoon: { '1B': .01 } });
  assert.deepEqual(identityEffects('OVERHAND', 'P03', 'R', 'R'), { form: {}, platoon: { K: .01 } });
  assert.deepEqual(identityEffects('SIDEARM', 'P02', 'L', 'S'), { form: { OUT: .01 }, platoon: { '1B': .01 } });
  assert.deepEqual(identityEffects('THREE_QUARTER', 'P03', 'R', 'S').form, { K: .01 });
  assert.equal(matchupEffects('OVERHAND', 'P01', 5, 'R', 'R', 'BALANCED', [{ K: .08 }]).applied.K, .10);
});
test('57: representative pitch uses pitchId order and .60 belongs to next segment', () => {
  const plan = [{ pitchId: 'P03' as const, mastery: 1, weight: 40 }, { pitchId: 'P01' as const, mastery: 2, weight: 60 }];
  assert.equal(selectRepresentativePitch(plan, .599999).pitchId, 'P01');
  assert.equal(selectRepresentativePitch(plan, .60).pitchId, 'P03');
  assert.throws(() => selectRepresentativePitch([{ ...plan[0]!, weight: 39 }, plan[1]!], .5));
  assert.throws(() => selectRepresentativePitch([{ ...plan[0]!, mastery: 0 }, plan[1]!], .5));
});
test('41/U DP: running/pickoff examples and approved 2%p-per-ten double play equation', () => {
  near(extraHomeProbability(70, 50), .74); near(extraHomeProbability(70, 100), .665);
  near(doublePlayProbability(60, 50), .22); near(doublePlayProbability(50, 60), .18);
  near(doublePlayProbability(100, 1), .35); near(doublePlayProbability(1, 100), .05);
});
test('41/ENG04: stamina50 gives SP/RP fatigue40/15 and review90/30', () => {
  assert.equal(pitcherReviewThreshold(50, true), 90); assert.equal(pitcherReviewThreshold(50, false), 30);
  assert.equal(pitcherAppearanceFatigue(50, true), 40); assert.equal(pitcherAppearanceFatigue(50, false), 15);
  assert.equal(pitcherReviewThreshold(100, true), 105); near(pitcherAppearanceFatigue(100, true), 34);
});

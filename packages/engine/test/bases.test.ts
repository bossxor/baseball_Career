import assert from 'node:assert/strict';
import test from 'node:test';
import { OUTCOMES } from '@playball/rules';
import { advanceBases } from '../src/bases.js';
import type { BasePlayInput, Bases, Runner } from '../src/bases.js';
import { nextFloat, seedPcg32 } from '../src/rng.js';

const runner = (key: string, running = 50, automatic = false): Runner => ({ simulationKey: key, running, automatic, responsiblePitcherKey: 'old-pitcher' });
const initial = (overrides: Partial<BasePlayInput> = {}): BasePlayInput => ({ outcome: '1B', outs: 0, bases: [null, null, null], batter: { ...runner('batter'), responsiblePitcherKey: 'current-pitcher' }, defense: 50, pickoff: 50, winningRunsNeeded: null, ...overrides });
const zero = { state: '0', increment: '1', draws: 0 };
const failure = (() => { for (let i = 0; i < 1000; i++) { const state = seedPcg32(BigInt(i), 1n); if (nextFloat(state).value > .95) return state; } throw new Error('Fixture seed unavailable'); })();

test('REC01: loaded walk forces exactly one run, preserving pitcher responsibility', () => {
  const bases: Bases = [runner('one'), runner('two'), runner('three')];
  const result = advanceBases(initial({ outcome: 'BB', bases }), zero);
  assert.deepEqual(result.scored.map(r => r.simulationKey), ['three']);
  assert.deepEqual(result.bases.map(r => r?.simulationKey), ['batter', 'one', 'two']);
  assert.equal(result.scored[0]!.responsiblePitcherKey, 'old-pitcher');
});
test('REC12: HBP has the same forced advancement but stays a distinct outcome upstream', () => {
  const bases: Bases = [null, runner('two'), runner('three')];
  const result = advanceBases(initial({ outcome: 'HBP', bases }), zero);
  assert.deepEqual(result.bases.map(r => r?.simulationKey), ['batter', 'two', 'three']);
  assert.equal(result.scored.length, 0);
});
test('REC02: two-out extra-home failure keeps the hit, prior score, and blocks following runners', () => {
  const result = advanceBases(initial({ outs: 2, bases: [runner('one'), runner('two', 70), runner('three')] }), failure);
  assert.equal(result.outsAdded, 1); assert.equal(result.scored.length, 1);
  assert.equal(result.scored[0]!.simulationKey, 'three');
  assert.equal(result.bases[1], null);
  assert.equal(result.attempts[0]!.success, false);
});
test('41: running below60 or outs below2 makes no extra-home draw', () => {
  const result = advanceBases(initial({ outs: 2, bases: [null, runner('two', 59.9999), null] }), zero);
  assert.equal(result.state.draws, 0); assert.equal(result.bases[2]!.simulationKey, 'two');
  assert.equal(advanceBases(initial({ outs: 1, bases: [null, runner('two', 100), null] }), zero).state.draws, 0);
});
test('REC03: successful double play gives two outs at0/1 outs and never four at2 outs', () => {
  for (const outs of [0, 1, 2]) {
    const result = advanceBases(initial({ outcome: 'OUT', outs, bases: [runner('one'), runner('two'), runner('three')] }), zero);
    assert.equal(result.outsAdded, outs < 2 ? 2 : 1);
    assert.equal(result.rbi, 0); assert.equal(result.scored.length, 0);
    assert.equal(result.state.draws, outs < 2 ? 1 : 0);
  }
});
test('REC05: non-HR walkoff stops at necessary run; HR credits everyone', () => {
  const bases: Bases = [runner('one'), runner('two'), runner('three')];
  const single = advanceBases(initial({ outcome: '2B', bases, winningRunsNeeded: 1 }), zero);
  assert.equal(single.scored.length, 1); assert.equal(single.rbi, 1); assert.equal(single.walkoff, true);
  const homer = advanceBases(initial({ outcome: 'HR', bases, winningRunsNeeded: 1 }), zero);
  assert.equal(homer.scored.length, 4); assert.equal(homer.rbi, 4);
});
test('REC06/07: automatic runner flag and inherited responsibility survive advancement', () => {
  const result = advanceBases(initial({ outcome: '2B', bases: [null, runner('auto', 50, true), null] }), zero);
  assert.equal(result.scored[0]!.automatic, true); assert.equal(result.scored[0]!.responsiblePitcherKey, 'old-pitcher');
});
test('all8 outcomes ×8 occupancy masks ×3 outs preserve runners/outs/input', () => {
  for (const outcome of OUTCOMES) for (let mask = 0; mask < 8; mask++) for (let outs = 0; outs < 3; outs++) {
    const bases = [0, 1, 2].map(i => mask & (1 << i) ? runner(`r${i}`, 70) : null) as Bases;
    const input = initial({ outcome, outs, bases }), before = JSON.stringify(input);
    const result = advanceBases(input, seedPcg32(42n, 54n));
    assert.ok(outs + result.outsAdded <= 3);
    const survivors = result.bases.filter(r => r !== null).map(r => r.simulationKey);
    assert.equal(new Set(survivors).size, survivors.length);
    assert.equal(before, JSON.stringify(input));
    for (const scored of result.scored) assert.ok(!survivors.includes(scored.simulationKey));
  }
});

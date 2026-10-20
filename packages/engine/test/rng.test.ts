import assert from 'node:assert/strict';
import test from 'node:test';
import { createStreams, nextFloat, nextInteger, nextUint32, seedPcg32 } from '../src/rng.js';

test('PCG32 official 42/54 reference vector', () => {
  // https://www.pcg-random.org/using-pcg-c-basic.html
  let state = seedPcg32(42n, 54n);
  const actual: string[] = [];
  for (let i = 0; i < 6; i++) { const next = nextUint32(state); actual.push(next.value.toString(16)); state = next.state; }
  assert.deepEqual(actual, ['a15c02b7', '7b47f409', 'ba1d3330', '83d2f293', 'bfa4784b', 'cbed606e']);
});
test('08/70 JSON cursor roundtrip resumes exact next draw without mutating source', () => {
  const initial = Object.freeze(seedPcg32(42n, 54n));
  const first = nextFloat(initial);
  assert.equal(initial.draws, 0);
  assert.deepEqual(nextFloat(JSON.parse(JSON.stringify(first.state))), nextFloat(first.state));
  for (let i = 0; i < 100; i++) { const result = nextInteger(seedPcg32(BigInt(i), 7n), 3); assert.ok(result.value >= 0 && result.value < 3); }
});
test('08: event/growth/injury draws cannot shift the game or pitch plan stream', () => {
  const one = createStreams('같은 시드', 'game-key'), two = createStreams('같은 시드', 'game-key');
  for (let i = 0; i < 500; i++) { one.event = nextFloat(one.event).state; one.growth = nextFloat(one.growth).state; one.injury = nextFloat(one.injury).state; }
  assert.deepEqual(nextFloat(one.game), nextFloat(two.game));
  assert.deepEqual(nextFloat(one.pitchPlan), nextFloat(two.pitchPlan));
  assert.equal(new Set(Object.values(one).map(s => s.increment)).size, 8);
});
test('invalid PCG snapshots/seed/bounds are rejected', () => {
  assert.throws(() => nextUint32({ state: '-1', increment: '1', draws: 0 }));
  assert.throws(() => nextUint32({ state: '0', increment: '2', draws: 0 }));
  assert.throws(() => nextUint32({ state: '0', increment: '1', draws: NaN }));
  assert.throws(() => seedPcg32(-1n, 1n));
  assert.throws(() => nextInteger(seedPcg32(1n, 1n), 0));
});

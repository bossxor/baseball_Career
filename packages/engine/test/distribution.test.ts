import assert from 'node:assert/strict';
import test from 'node:test';
import { OUTCOMES } from '@playball/rules';
import { baseLogits, sampleOutcome, softmax } from '../src/probabilities.js';
import { seedPcg32 } from '../src/rng.js';

const context = (h: number, p: number, d: number) => ({ contact: h, power: h, discipline: h, running: h, clutch: h, velocity: p, stuff: p, command: p, composure: p, defense: d, runnersOn: false, risp: false });

test('B100-01/02 PA-only: 4 fixed conditions ×100,000 sampled plate appearances match probabilities', () => {
  for (const [h, p, d] of [[50, 50, 50], [100, 50, 50], [100, 100, 100], [100, 1, 1]] as const) {
    const distribution = softmax(baseLogits(context(h, p, d)));
    let state = seedPcg32(42n, 54n);
    const counts = Object.fromEntries(OUTCOMES.map(key => [key, 0])) as Record<(typeof OUTCOMES)[number], number>;
    for (let i = 0; i < 100_000; i++) { const next = sampleOutcome(distribution, state); counts[next.outcome]++; state = next.state; }
    for (const key of OUTCOMES) assert.ok(Math.abs(counts[key] / 100_000 - distribution[key]) < .005, `${h}/${p}/${d}: ${key}`);
    assert.ok(counts.K > 0 && counts.OUT > 0);
    console.log(`M1 PA-only ${h}vs${p}/D${d}: ${JSON.stringify(counts)}`);
  }
});
test('B100-03: independent contact/power/discipline directions, other inputs held fixed', () => {
  const base = softmax(baseLogits(context(50, 50, 50)));
  assert.ok(softmax(baseLogits({ ...context(50, 50, 50), contact: 100 })).K < base.K);
  assert.ok(softmax(baseLogits({ ...context(50, 50, 50), power: 100 })).HR > base.HR);
  assert.ok(softmax(baseLogits({ ...context(50, 50, 50), discipline: 100 })).BB > base.BB);
});

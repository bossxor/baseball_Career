import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalJson } from '../src/game.js';

test('canonical finite numbers retain JSON bytes at rounding, exponent and signed-zero boundaries', () => {
  const values = [-0, 0, -1.5, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1e-7, 1e-6, 1e20, 1e21, 0.1 + 0.2, 1000000000000000100];
  for (const value of values) assert.equal(canonicalJson(value), JSON.stringify(value));
  assert.equal(canonicalJson(values), JSON.stringify(values));
  assert.equal(canonicalJson({ numbers: values }), JSON.stringify({ numbers: values }));
});

test('canonical non-finite numbers remain rejected before producing a persisted basis or seal', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const nested of [value, [value], { value }]) {
      assert.throws(() => canonicalJson(nested), { name: 'RangeError', message: 'Non-finite engine value' });
    }
  }
});

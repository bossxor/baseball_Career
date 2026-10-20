import assert from 'node:assert/strict';
import test from 'node:test';
import { assertAbilities, assertFocus, halfPeakAbilities, HITTER_ABILITIES, overall, PITCHER_ABILITIES, roleScore } from '../src/index.js';

const hitter = (points: number[]) => Object.fromEntries(HITTER_ABILITIES.map((key, i) => [key, points[i]! * 10_000]));

test('35/ABI02: six permanent abilities average 70.0; ceiling is 100.0', () => {
  assert.deepEqual(overall('HITTER', hitter([72, 64, 68, 81, 70, 65])), { sumUnits: 4_200_000, denominator: 60_000, display: '70.0' });
  assert.equal(overall('HITTER', hitter([100, 100, 100, 100, 100, 100])).display, '100.0');
  const pitcher = Object.fromEntries(PITCHER_ABILITIES.map(key => [key, 500_000]));
  assert.equal(overall('PITCHER', pitcher).display, '50.0');
});

test('90: display rounds the exact sum, not each ability first', () => {
  const values = hitter([50, 50, 50, 50, 50, 50]);
  values.CONTACT = 502_999;
  assert.equal(overall('HITTER', values).display, '50.0');
  values.CONTACT = 503_000;
  assert.equal(overall('HITTER', values).display, '50.1');
});

test('35/ABI01: rejects wrong kind, extra/missing axes and invalid integer units', () => {
  const valid = hitter([50, 50, 50, 50, 50, 50]);
  for (const invalid of [NaN, Infinity, -1, 9_999, 1_000_001, 500_000.5]) {
    assert.throws(() => assertAbilities('HITTER', { ...valid, CONTACT: invalid }));
  }
  assert.throws(() => assertAbilities('PITCHER', valid));
  assert.throws(() => assertAbilities('HITTER', { ...valid, STAMINA: 500_000 }));
  assert.throws(() => assertAbilities('HITTER', { CONTACT: 500_000 }));
});

test('35/ABI03: exactly four distinct abilities, no mixed player kinds', () => {
  assert.doesNotThrow(() => assertFocus('HITTER', HITTER_ABILITIES.slice(0, 4)));
  for (const invalid of [HITTER_ABILITIES.slice(0, 3), HITTER_ABILITIES.slice(0, 5), ['CONTACT', 'CONTACT', 'POWER', 'DEFENSE'], ['CONTACT', 'POWER', 'DEFENSE', 'STAMINA']]) {
    assert.throws(() => assertFocus('HITTER', invalid));
  }
});

test('90: archive half-up precision and minimum; source stays immutable', () => {
  const peaks = Object.freeze({ ...hitter([100, 1, 86, 94, 80, 76]), CONTACT: 912_501 });
  const result = halfPeakAbilities('HITTER', peaks);
  assert.equal(result.CONTACT, 456_251);
  assert.equal(result.POWER, 10_000);
  assert.equal(peaks.CONTACT, 912_501);
  assert.equal(Object.isFrozen(result), true);
});
test('41/ENG07: role weights preserve neutral50 and stay distinct from overall', () => {
  const neutral = hitter([50, 50, 50, 50, 50, 50]);
  for (const role of ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']) assert.equal(roleScore('HITTER', neutral, role), 50);
  const pitcher = Object.fromEntries(PITCHER_ABILITIES.map(key => [key, 500_000]));
  for (const role of ['SP', 'RP', 'CP']) assert.equal(roleScore('PITCHER', pitcher, role), 50);
  const defense = hitter([50, 50, 50, 100, 50, 50]);
  assert.equal(roleScore('HITTER', defense, 'DH'), 50); assert.equal(roleScore('HITTER', defense, 'SS'), 65);
  assert.throws(() => roleScore('HITTER', neutral, 'SP'));
});

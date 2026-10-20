import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePitcherDecisions, createGame } from '../src/game.js';
import { game } from './fixtures.js';
import type { Appearance } from '../src/types.js';

const relief = (key: string, order: number, enteredAt: number, extra: Partial<Appearance> = {}): Appearance => ({ pitcherKey: key, team: 1, starter: false, order, enteredAt, entryLead: 1, saveSituation: true, maintainedLead: true, blownSave: false, ...extra });
function state() {
  const value = createGame(game()); value.scores = [2, 3];
  value.decisiveLead = { team: 1, losingPitcherKey: 'away-p0', winningCandidateKey: 'home-p0', cursor: 20 };
  value.appearances.push(relief('home-p1', 2, 30), relief('home-p2', 3, 40));
  value.pitching['home-p1']!.outs = 6; value.pitching['home-p2']!.outs = 6;
  return value;
}
test('REC08: starter14 outs yields W to best later relief; 15 outs keeps starter W', () => {
  const value = state(); value.pitching['home-p0']!.outs = 14;
  assert.equal(calculatePitcherDecisions(value).W, 'home-p1');
  value.pitching['home-p0']!.outs = 15;
  const result = calculatePitcherDecisions(value);
  assert.equal(result.W, 'home-p0'); assert.equal(result.L, 'away-p0'); assert.equal(result.SV, 'home-p2'); assert.deepEqual(result.HLD, ['home-p1']);
});
test('REC09: BS and W may coexist; that pitcher cannot also receive HLD/SV', () => {
  const value = state(); value.decisiveLead!.winningCandidateKey = 'home-p1';
  value.appearances[2]!.blownSave = true; value.appearances[2]!.maintainedLead = false;
  const result = calculatePitcherDecisions(value);
  assert.equal(result.W, 'home-p1'); assert.deepEqual(result.BS, ['home-p1']); assert.ok(!result.HLD.includes('home-p1')); assert.notEqual(result.SV, 'home-p1');
});
test('save3-inning exception and tie no W/L/SV', () => {
  const value = state(); value.pitching['home-p0']!.outs = 15;
  Object.assign(value.appearances[3]!, { entryLead: 5, saveSituation: false });
  assert.equal(calculatePitcherDecisions(value).SV, null);
  value.pitching['home-p2']!.outs = 9;
  assert.equal(calculatePitcherDecisions(value).SV, 'home-p2');
  value.scores = [3, 3];
  const tied = calculatePitcherDecisions(value); assert.equal(tied.W, null); assert.equal(tied.L, null); assert.equal(tied.SV, null);
});
test('08: hold does not require the final winning side, including a tied game', () => {
  const value = state(); value.pitching['home-p0']!.outs = 15;
  value.appearances.push(relief('away-p1', 4, 10, { team: 0 }), relief('away-p2', 5, 20, { team: 0, maintainedLead: false, blownSave: true }));
  value.pitching['away-p1']!.outs = 3; value.pitching['away-p2']!.outs = 3;
  assert.ok(calculatePitcherDecisions(value).HLD.includes('away-p1'));
  value.scores = [3, 3];
  const tied = calculatePitcherDecisions(value);
  assert.ok(tied.HLD.includes('away-p1')); assert.ok(tied.HLD.includes('home-p1')); assert.equal(tied.W, null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { CLUB_LONG_RUN_PLAN, decodeClubLongCheckpoint, encodeClubLongCheckpoint, openClubLongRun, stepClubLongRun } from '../src/kbo-club-long-run.js';

test('L01-L12 stay planned and an L04 checkpoint resumes without a balance pass', () => {
  assert.deepEqual(CLUB_LONG_RUN_PLAN.map(([id]) => id), ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12']);
  assert.throws(() => openClubLongRun({ runId: 'L01', seed: 's', clubId: 'LG', difficulty: 'REALISTIC' }), /LONG_RUN_NOT_WIRED/);
  const opened = openClubLongRun({ runId: 'L04', seed: 'm6h', clubId: 'LG', difficulty: 'REALISTIC' });
  assert.equal(opened.balance, 'INCONCLUSIVE');
  assert.equal(opened.gamesPlayed, 0);
  assert.equal(opened.seasonsTarget, 50);
  const held = stepClubLongRun(opened, 0);
  assert.equal(held.game.revision, opened.game.revision);
  assert.equal(held.game.phase, 'PRESEASON_SETUP');
  const restored = decodeClubLongCheckpoint(encodeClubLongCheckpoint(held));
  assert.equal(restored.game.creationKey, opened.game.creationKey);
  assert.equal(restored.gamesPlayed, 0);
  const forged = JSON.parse(encodeClubLongCheckpoint(opened)) as { balance: string };
  forged.balance = 'PASSED';
  assert.throws(() => decodeClubLongCheckpoint(JSON.stringify(forged)), /LONG_RUN_NOT_JUDGED/);
});

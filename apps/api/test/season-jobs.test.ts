import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { commandReceipts, createTestDb, gameSaves, seedAllowedSubject, seedSave } from '@playball/db';
import * as engine from '@playball/engine';
import { completedHighSchoolCareer } from '../../../packages/engine/test/fixtures.js';
import { advanceNextSeasonJob, readSeasonJob, startSeasonJob } from '../src/season-jobs.js';

function readySchool() {
  const world = engine.createHighSchoolWorld({
    worldKey: 'worker-school', seasonKey: '2032', seed: 'worker-school', schoolId: 'H01', startDay: 31,
    player: { simulationKey: 'own', name: '시즌선수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R',
      pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'DEFENSE'], difficulty: 'GROWTH' },
  });
  const created = engine.createHighSchoolCareer(world, 'GROWTH');
  const player = engine.confirmCareerPlayer(created, created.revision);
  const focused = engine.resolveCareerFocusEvent(player, player.revision, {
    eventKey: player.events[0]!.eventKey, eventVersion: 1, command: 'KEEP_FOCUS',
  });
  return engine.confirmCareerPreseason(focused, focused.revision);
}

test('persisted worker resumes BUDGET at a fresh revision, then stops after a competing save change', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  const previous = process.env.PLAYBALL_SPAN_BUDGET_MS;
  process.env.PLAYBALL_SPAN_BUDGET_MS = '0';
  t.after(() => { if (previous === undefined) delete process.env.PLAYBALL_SPAN_BUDGET_MS; else process.env.PLAYBALL_SPAN_BUDGET_MS = previous; });
  await seedAllowedSubject(db, 'owner');
  await seedAllowedSubject(db, 'other');
  await seedSave(db, { id: 'save', ownerId: 'owner', state: { schemaVersion: 1, career: readySchool() } });
  assert.equal(await readSeasonJob(db, 'other', 'save'), null);
  assert.equal((await startSeasonJob(db, 'other', 'save', 'request', 0n)).status, 404);
  const started = await startSeasonJob(db, 'owner', 'save', 'request', 0n);
  assert.equal(started.status, 200);
  assert.deepEqual(await startSeasonJob(db, 'owner', 'save', 'request', 0n), started);
  assert.equal((await startSeasonJob(db, 'owner', 'save', 'competing', 0n)).status, 409);
  assert.equal(await advanceNextSeasonJob(db), true);
  assert.equal((await readSeasonJob(db, 'owner', 'save'))?.job?.stopReason, 'BUDGET');
  assert.equal(await advanceNextSeasonJob(db), true);
  const receipts = await db.select().from(commandReceipts).where(eq(commandReceipts.saveId, 'save'));
  assert.equal(receipts.length, 2);
  assert.deepEqual(receipts.map(receipt => receipt.resultingRevision).sort(), [1n, 2n]);
  assert.equal((await startSeasonJob(db, 'owner', 'save', 'request', 2n)).status, 409);
  await db.update(gameSaves).set({ revision: 3n }).where(eq(gameSaves.id, 'save'));
  assert.equal(await advanceNextSeasonJob(db), true);
  assert.equal((await readSeasonJob(db, 'owner', 'save'))?.job?.stopReason, 'CANCELLED');
  assert.equal(await advanceNextSeasonJob(db), false);
});

test('worker persists season review and releases the run without making another decision', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  const career = completedHighSchoolCareer();
  career.phaseContext = { phase: 'SEASON_PROGRESS', nextWorldDay: Math.max(...career.world.schedule.map(g => g.worldDay)) + 1,
    pendingGame: null, advancePlan: null };
  await seedAllowedSubject(db, 'owner');
  await seedSave(db, { id: 'save', ownerId: 'owner', state: { schemaVersion: 1, career } });
  assert.equal((await startSeasonJob(db, 'owner', 'save', 'request', 0n)).status, 200);
  assert.equal(await advanceNextSeasonJob(db), true);
  const job = (await readSeasonJob(db, 'owner', 'save'))?.job;
  assert.equal(job?.status, 'STOPPED');
  assert.equal(job?.stopReason, 'SEASON_END');
  assert.equal(job?.progress.completedGames, 216);
  assert.equal(await advanceNextSeasonJob(db), false);
});

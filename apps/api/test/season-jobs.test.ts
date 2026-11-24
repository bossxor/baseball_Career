import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { authAllowedSubjects, commandReceipts, createDbFromUrl, createTestDb, gameSaves, M3_CORE_SQL, profiles, seasonJobs, seedAllowedSubject, seedSave } from '@playball/db';
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
  assert.ok('job' in started);
  assert.equal(started.job.progress.month, 2);
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
  const finalDay = Math.max(...career.world.schedule.map(game => game.worldDay));
  assert.equal(job?.progress.month, new Date(Date.UTC(Number(career.world.seasonKey), 0, finalDay + 1)).getUTCMonth() + 1);
  assert.equal(await advanceNextSeasonJob(db), false);
});

const restartDatabaseUrl = process.env.PLAYBALL_SEASON_JOB_TEST_DATABASE_URL;

test('a replacement worker resumes a committed run on PostgreSQL without replaying steps', { skip: !restartDatabaseUrl, timeout: 120_000 }, async t => {
  const { db, pool } = createDbFromUrl(restartDatabaseUrl!);
  const id = `season-restart-${randomUUID()}`;
  const workerPath = fileURLToPath(new URL('../dist/season-job-worker.js', import.meta.url));
  async function job() {
    const [row] = await db.select().from(seasonJobs).where(eq(seasonJobs.saveId, id));
    assert.ok(row);
    return row;
  }
  async function runWorker(afterOrdinal: number) {
    const child = spawn(process.execPath, [workerPath], { windowsHide: true, stdio: 'ignore', env: {
      ...process.env, DATABASE_URL: restartDatabaseUrl!, PLAYBALL_SEASON_JOBS: '1', PLAYBALL_SPAN_BUDGET_MS: '0',
    } });
    const closed = once(child, 'close');
    try {
      const by = Date.now() + 30_000;
      while ((await job()).stepOrdinal <= afterOrdinal) {
        assert.ok(child.exitCode === null && child.signalCode === null && Date.now() < by, 'worker did not commit its next step');
        await delay(75);
      }
    } finally {
      child.kill('SIGKILL');
      await closed;
    }
    return job();
  }
  try {
    await pool.query(M3_CORE_SQL);
    await db.insert(profiles).values({ id, displayName: 'Worker restart' });
    await db.insert(authAllowedSubjects).values({ subject: id, status: 'ACTIVE' });
    await db.insert(gameSaves).values({ id, ownerId: id, mode: 'CAREER', phase: 'BOOT', summary: {},
      state: { schemaVersion: 1, career: readySchool() } });
    assert.equal((await startSeasonJob(db, id, id, 'request', 0n)).status, 200);
    const first = await runWorker(0);
    assert.equal(first.status, 'RUNNING');
    assert.equal(first.stopReason, 'BUDGET');
    const second = await runWorker(first.stepOrdinal);
    assert.equal(second.runId, first.runId);
    assert.ok(second.stepOrdinal > first.stepOrdinal);
    const [save] = await db.select({ revision: gameSaves.revision }).from(gameSaves).where(eq(gameSaves.id, id));
    assert.ok(save);
    assert.equal(save.revision, second.nextExpectedRevision);
    const receipts = await db.select().from(commandReceipts).where(eq(commandReceipts.saveId, id)).orderBy(commandReceipts.resultingRevision);
    assert.deepEqual(receipts.map(r => [r.commandId, r.resultingRevision]), Array.from({ length: second.stepOrdinal },
      (_, i) => [`season:${second.runId}:${i}`, BigInt(i + 1)]));
    t.diagnostic(`same run ID; worker steps ${first.stepOrdinal} → ${second.stepOrdinal}; ${receipts.length} unique receipts; save revision ${save.revision}`);
  } finally {
    try {
      await db.delete(gameSaves).where(eq(gameSaves.id, id));
      await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject, id));
      await db.delete(profiles).where(eq(profiles.id, id));
    } finally { await pool.end(); }
  }
});

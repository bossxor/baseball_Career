import assert from 'node:assert/strict';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import { commandReceipts, createTestDb, gameSaves, profiles, seedAllowedSubject, seedSave } from '@playball/db';
import { createApp } from '../src/app.js';
import { executeCommandTransaction } from '../src/commands.js';

const subject = 'command-worker', saveId = 'worker-save';
const body = { commandId: 'step-0', expectedRevision: '0', type: 'ALLOCATE_DEMO', payload: { total: 3, weights: [1], capacities: [10] } };

test('command factory uses the locked source and atomically commits bookkeeping once with an HTTP-compatible receipt', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, subject);
    await seedSave(db, { id: saveId, ownerId: subject });
    await seedSave(db, { id: 'http-save', ownerId: subject });
    let commits = 0;
    const result = await db.transaction(tx => executeCommandTransaction(tx, {
      saveId, subject,
      command(source) {
        assert.equal(source.revision, 0n);
        assert.equal(source.mode, 'CAREER');
        assert.equal(source.state.stampCount, 0);
        return body;
      },
      async onCommit(transaction, committed) {
        commits++;
        assert.equal(committed.result.revision, '1');
        assert.equal(committed.applied.nextState.stampCount, 1);
        await transaction.update(profiles).set({ displayName: 'step-1' }).where(eq(profiles.id, subject));
      },
    }));
    assert.equal(result.status, 200);
    if (result.status !== 200) throw new Error('unexpected rejection');
    assert.equal(result.replayed, false);
    const replay = await db.transaction(tx => executeCommandTransaction(tx, {
      saveId, subject, command: body,
      async onCommit() { throw new Error('replay must not update bookkeeping'); },
    }));
    assert.equal(replay.status, 200);
    if (replay.status !== 200) throw new Error('unexpected replay rejection');
    assert.equal(replay.replayed, true);
    assert.deepEqual(JSON.parse(JSON.stringify(replay.result)), JSON.parse(JSON.stringify(result.result)));
    assert.equal(commits, 1);
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, subject));
    assert.equal(profile!.displayName, 'step-1');
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const response = await app.request('/api/saves/http-save/commands', {
      method: 'POST', headers: { Authorization: 'Bearer dev:' + subject, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), JSON.parse(JSON.stringify(result.result)));
  } finally { await client.close(); }
});

test('failed command bookkeeping rolls back state, receipt and its own writes; the original step can retry', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, subject);
    await seedSave(db, { id: saveId, ownerId: subject });
    await assert.rejects(db.transaction(tx => executeCommandTransaction(tx, {
      saveId, subject, command: body,
      async onCommit(transaction) {
        await transaction.update(profiles).set({ displayName: 'uncommitted' }).where(eq(profiles.id, subject));
        throw new Error('bookkeeping failed');
      },
    })), /bookkeeping failed/);
    const [save] = await db.select().from(gameSaves).where(eq(gameSaves.id, saveId));
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, subject));
    assert.equal(save!.revision, 0n);
    assert.deepEqual(save!.state, { schemaVersion: 1, stampCount: 0 });
    assert.equal(profile!.displayName, 'Tester');
    assert.deepEqual(await db.select().from(commandReceipts), []);
    const retried = await db.transaction(tx => executeCommandTransaction(tx, { saveId, subject, command: body }));
    assert.equal(retried.status, 200);
    if (retried.status === 200) assert.equal(retried.result.revision, '1');
  } finally { await client.close(); }
});

test('worker factory cannot inspect another owner and unavailable commands leave the save unchanged', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, subject);
    await seedSave(db, { id: saveId, ownerId: subject });
    const foreign = await db.transaction(tx => executeCommandTransaction(tx, {
      saveId, subject: 'foreign', command() { throw new Error('foreign state exposed'); },
    }));
    assert.deepEqual(foreign, { status: 404, code: 'SAVE_NOT_FOUND' });
    const unavailable = await db.transaction(tx => executeCommandTransaction(tx, { saveId, subject, command: () => undefined }));
    assert.deepEqual(unavailable, { status: 400, code: 'SEASON_NOT_READY' });
    const stale = await db.transaction(tx => executeCommandTransaction(tx, { saveId, subject, command: { ...body, expectedRevision: '1' } }));
    assert.deepEqual(stale, { status: 409, code: 'REVISION_CONFLICT', currentRevision: '0' });
    const [save] = await db.select().from(gameSaves).where(eq(gameSaves.id, saveId));
    assert.equal(save!.revision, 0n);
    assert.deepEqual(await db.select().from(commandReceipts), []);
  } finally { await client.close(); }
});

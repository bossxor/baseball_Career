import test from 'node:test';
import assert from 'node:assert/strict';
import { eq, sql } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, seedSave, gameSaves, gameSaveParts, readSaveState, writeSaveState } from '@playball/db';
import { encodeStateParts, StateDecoder, STATE_PART_BYTES } from '../../../packages/db/src/state-codec.js';
import { createApp } from '../src/app.js';
import { readOwnedSave } from '../src/save-state.js';

test('bounded codec preserves JSON values, large Unicode strings and special keys without prototype changes', () => {
  const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":{},"empty":[],"nil":null}') as Record<string, unknown>;
  value.text = '한글⚾😀'.repeat(180_000);
  value.values = [1, true, undefined, NaN, {}, []];
  value.missing = undefined;
  value.child = { toJSON(key: string) { return { propertyKey: key }; } };
  value.omitted = { toJSON() { return undefined; } };
  value.sparse = new Array(100).fill(undefined);
  const expected = JSON.parse(JSON.stringify(value)), decoder = new StateDecoder();
  let count = 0;
  for (const part of encodeStateParts(value)) {
    assert.ok(Buffer.byteLength(part) <= STATE_PART_BYTES);
    decoder.push(part); count++;
  }
  assert.ok(count > 1);
  assert.deepEqual(decoder.finish(), expected);
  assert.equal(Object.hasOwn(Object.prototype, 'polluted'), false);
  const unfinished = new StateDecoder(); unfinished.push('["o"]\n');
  assert.throws(() => unfinished.finish(), /SAVE_STATE_CORRUPT/);
  const duplicate = new StateDecoder();
  assert.throws(() => duplicate.push('["o"]\n["k","x",true]\n["v",1]\n["k","x",true]\n["v",2]\n'), /SAVE_STATE_CORRUPT/);
  const circular: Record<string, unknown> = {}; circular.self = circular;
  assert.throws(() => [...encodeStateParts(circular)], /SAVE_STATE_CIRCULAR/);
});

const largeState = () => ({ schemaVersion: 1, stampCount: 0, history: Array.from({ length: 32_000 }, (_, i) => ({ game: i, player: '선수' + i, PA: 4, AB: 3, H: 1, BB: 1, TB: 2, outcome: '기록보존' })) });

test('split storage rolls back row/parts/receipt together and rejects missing or damaged parts', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, 'split');
    await seedSave(db, { id: 'split', ownerId: 'split' });
    const legacy = { schemaVersion: 1, $playballState: 1, parts: 'literal game data' };
    assert.deepEqual(await readSaveState(db, 'split', 0n, legacy), legacy);
    const value = largeState();
    await assert.rejects(db.transaction(async tx => {
      const state = await writeSaveState(tx, 'split', 1n, value);
      await tx.update(gameSaves).set({ ...state, revision: 1n }).where(eq(gameSaves.id, 'split'));
      await tx.execute(sql`INSERT INTO command_receipts(save_id,command_id,request_hash,result,resulting_revision) VALUES('split','rollback','hash','{}',1)`);
      throw new Error('injected failure');
    }), /injected failure/);
    assert.equal((await db.select().from(gameSaveParts)).length, 0);
    assert.equal((await db.execute(sql`SELECT count(*) AS n FROM command_receipts`)).rows[0]!.n, 0);
    assert.equal((await readOwnedSave(db, 'split', 'split'))!.revision, 0n);
    await db.transaction(async tx => {
      const state = await writeSaveState(tx, 'split', 1n, value);
      await tx.update(gameSaves).set({ ...state, revision: 1n }).where(eq(gameSaves.id, 'split'));
    });
    assert.deepEqual((await readOwnedSave(db, 'split', 'split'))!.state, value);
    assert.equal(await readOwnedSave(db, 'other', 'split'), null);
    const [row] = await db.select().from(gameSaves).where(eq(gameSaves.id, 'split'));
    await assert.rejects(readSaveState(db, 'split', 2n, row!.state, row!.stateFormat), /SAVE_STATE_CORRUPT/);
    const [part] = await db.select().from(gameSaveParts).limit(1);
    await db.update(gameSaveParts).set({ payload: 'tampered' }).where(eq(gameSaveParts.part, part!.part));
    await assert.rejects(readOwnedSave(db, 'split', 'split'), /SAVE_STATE_CORRUPT/);
    await db.delete(gameSaveParts);
    await assert.rejects(readOwnedSave(db, 'split', 'split'), /SAVE_STATE_CORRUPT/);
  } finally { await client.close(); }
});

test('HTTP commands preserve split state through replay, conflict, backup and owner-only restore', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, 'owner'); await seedAllowedSubject(db, 'foreign');
    const source = largeState();
    await seedSave(db, { id: 'large', ownerId: 'owner', state: source });
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const request = (url: string, body: unknown, owner = 'owner') => app.request(url, {
      method: 'POST', headers: { Authorization: 'Bearer dev:' + owner, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const command = { commandId: 'split-once', expectedRevision: 0, type: 'ALLOCATE_DEMO', payload: { total: 3, weights: [1], capacities: [10] } };
    const first = await request('/api/saves/large/commands', command);
    assert.equal(first.status, 200);
    const result = await first.json();
    assert.deepEqual(await (await request('/api/saves/large/commands', command)).json(), result);
    assert.equal((await request('/api/saves/large/commands', { ...command, commandId: 'stale' })).status, 409);
    assert.equal((await request('/api/saves/large/commands', command, 'foreign')).status, 404);
    assert.deepEqual(((await readOwnedSave(db, 'owner', 'large'))!.state as typeof source).history, source.history);
    const backupResponse = await request('/api/saves/large/backups', { requestId: 'split-backup' });
    assert.equal(backupResponse.status, 201);
    const backup = await backupResponse.json() as { fileId: string; contentHash: string };
    const restore = { restoreRequestId: 'split-restore', backupId: backup.fileId, backupHash: backup.contentHash };
    assert.equal((await request('/api/restores', restore, 'foreign')).status, 403);
    const restoredResponse = await request('/api/restores', restore);
    assert.equal(restoredResponse.status, 201);
    const restored = await restoredResponse.json() as { targetSaveId: string };
    assert.equal((await request('/api/restores', restore)).status, 200);
    const stored = (await readOwnedSave(db, 'owner', restored.targetSaveId))!.state as typeof source;
    assert.deepEqual(stored.history, source.history); assert.equal(stored.stampCount, 1);
  } finally { await client.close(); }
});

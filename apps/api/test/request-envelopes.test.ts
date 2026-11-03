import assert from 'node:assert/strict';
import test from 'node:test';
import { commandReceipts, createTestDb, gameSaves, seedAllowedSubject, seedSave } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const subject = 'invalid-envelope-owner';
const headers = { Authorization: `Bearer dev:${subject}`, 'Content-Type': 'application/json' };
const invalidBodies = [null, false, 0, '', [], [{}], {}];

test('command API rejects non-object JSON without changing a save or recording a receipt', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, subject);
    await seedSave(db, { id: 'envelope-save', ownerId: subject });
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const before = await db.select().from(gameSaves);
    for (const body of invalidBodies) {
      const response = await app.request('/api/saves/envelope-save/commands', {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      assert.equal(response.status, 400, `body ${JSON.stringify(body)}`);
      assert.equal((await json(response)).code, 'INVALID_REQUEST');
    }
    assert.deepEqual(await db.select().from(gameSaves), before);
    assert.deepEqual(await db.select().from(commandReceipts), []);
    const valid = await app.request('/api/saves/envelope-save/commands', {
      method: 'POST', headers,
      body: JSON.stringify({ commandId: 'valid', expectedRevision: 0, type: 'ALLOCATE_DEMO', payload: { total: 3, weights: [1, 1, 1], capacities: [10, 10, 10] } }),
    });
    assert.equal(valid.status, 200);
    assert.equal((await json(valid)).revision, '1');
  } finally {
    await client.close();
  }
});

test('creation API rejects non-object JSON without consuming a save slot', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, subject);
    const app = createApp({ db, auth: { allowDevBearer: true } });
    for (const body of invalidBodies) {
      const response = await app.request('/api/game-creations', {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      assert.equal(response.status, 400, `body ${JSON.stringify(body)}`);
      assert.equal((await json(response)).code, 'INVALID_REQUEST');
    }
    assert.deepEqual(await db.select().from(gameSaves), []);
    const valid = await app.request('/api/game-creations', {
      method: 'POST', headers, body: JSON.stringify({ creationId: 'valid', mode: 'CAREER' }),
    });
    assert.equal(valid.status, 200);
    assert.equal((await db.select().from(gameSaves)).length, 1);
  } finally {
    await client.close();
  }
});

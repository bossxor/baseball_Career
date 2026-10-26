import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb, seedAllowedSubject, seedSave } from '@playball/db';
import { createApp } from '../src/app.js';

const SUBJECT = 'user-a';
const SAVE = 'save-1';
const auth = { Authorization: `Bearer dev:${SUBJECT}`, 'Content-Type': 'application/json' };

function demoBody(commandId: string, expectedRevision: number, total = 3) {
  return {
    commandId,
    expectedRevision,
    type: 'ALLOCATE_DEMO',
    payload: { total, weights: [1, 1, 1], capacities: [10, 10, 10] },
  };
}

test('V02 reject missing auth and non-allowlisted subject', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  const app = createApp({ db });
  const noAuth = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoBody('c0', 0)),
  });
  assert.equal(noAuth.status, 401);
  const denied = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: { Authorization: 'Bearer dev:stranger', 'Content-Type': 'application/json' },
    body: JSON.stringify(demoBody('c0', 0)),
  });
  assert.equal(denied.status, 401);
  await client.close();
});

test('V03 unique receipt, idempotent replay, rollback on bad payload', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  await seedSave(db, { id: SAVE, ownerId: SUBJECT });
  const app = createApp({ db });

  const ok = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(demoBody('cmd-ok', 0)),
  });
  assert.equal(ok.status, 200);
  const okJson = await ok.json();
  assert.equal(okJson.revision, '1');

  const replay = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(demoBody('cmd-ok', 0)),
  });
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), okJson);

  const reused = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(demoBody('cmd-ok', 0, 4)),
  });
  assert.equal(reused.status, 409);
  assert.equal((await reused.json()).code, 'COMMAND_ID_REUSED');

  const beforeBad = await app.request(`/api/saves/${SAVE}/commands/cmd-ok`, { headers: auth });
  assert.equal(beforeBad.status, 200);

  const bad = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      commandId: 'cmd-bad',
      expectedRevision: 1,
      type: 'ALLOCATE_DEMO',
      payload: { total: -1, weights: [1], capacities: [1] },
    }),
  });
  assert.equal(bad.status, 400);

  const conflict = await app.request(`/api/saves/${SAVE}/commands`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(demoBody('cmd-after-bad', 1)),
  });
  assert.equal(conflict.status, 200, 'bad payload must not bump revision');
  assert.equal((await conflict.json()).revision, '2');

  await client.close();
});

test('F08 two devices same expectedRevision — one wins, other 409', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  await seedSave(db, { id: SAVE, ownerId: SUBJECT, revision: 0n });
  const app = createApp({ db });

  const [a, b] = await Promise.all([
    app.request(`/api/saves/${SAVE}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(demoBody('device-a', 0)),
    }),
    app.request(`/api/saves/${SAVE}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(demoBody('device-b', 0)),
    }),
  ]);
  const statuses = [a.status, b.status].sort();
  assert.deepEqual(statuses, [200, 409]);
  const winner = a.status === 200 ? a : b;
  const loser = a.status === 409 ? a : b;
  const winJson = await winner.json();
  const loseJson = await loser.json();
  assert.equal(winJson.revision, '1');
  assert.equal(loseJson.code, 'REVISION_CONFLICT');
  assert.equal(loseJson.currentRevision, '1');

  const getA = await app.request(`/api/saves/${SAVE}/commands/device-a`, { headers: auth });
  const getB = await app.request(`/api/saves/${SAVE}/commands/device-b`, { headers: auth });
  const found = [getA.status, getB.status].filter(s => s === 200).length;
  assert.equal(found, 1);
  await client.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, seedAllowedSubject, seedSave } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { readDeviceSaveCopy } from '../src/device-save-copy.js';

test('account copy streams only the owner’s confirmed save and rejects an interrupted transfer', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  await seedAllowedSubject(db, 'owner');
  await seedAllowedSubject(db, 'other');
  const state = { schemaVersion: 1, records: '야구😀'.repeat(280_000) };
  await seedSave(db, { id: 'save', ownerId: 'owner', revision: 7n, state, phase: 'SEASON_PROGRESS' });
  await seedSave(db, { id: 'boot', ownerId: 'owner' });
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const path = '/api/saves/save/device-copy';
  const owner = { Authorization: 'Bearer dev:owner' };
  assert.equal((await app.request(path)).status, 401);
  assert.equal((await app.request(path, { headers: { Authorization: 'Bearer dev:other' } })).status, 404);
  assert.equal((await app.request('/api/saves/boot/device-copy', { headers: owner })).status, 404);
  const response = await app.request(path, { headers: owner });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const raw = await response.text();
  const bytes = new TextEncoder().encode(raw);
  const fragmented = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 37_991) controller.enqueue(bytes.subarray(i, i + 37_991));
      controller.close();
    },
  });
  const copy = await readDeviceSaveCopy(fragmented, 'save');
  assert.equal(copy.meta.revision, '7');
  assert.equal(copy.meta.phase, 'SEASON_PROGRESS');
  assert.deepEqual(copy.state, state);
  await assert.rejects(readDeviceSaveCopy(new Response(raw.replace(/\["end",\d+\]\n$/, '')).body!, 'save'), /DEVICE_COPY_CORRUPT/);
  await assert.rejects(readDeviceSaveCopy(new Response(raw).body!, 'other-save'), /DEVICE_COPY_CORRUPT/);
});

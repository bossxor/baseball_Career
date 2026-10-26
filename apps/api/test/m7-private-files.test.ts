import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const A = 'm7-owner-a';
const B = 'm7-owner-b';
const authA = { Authorization: `Bearer dev:${A}`, 'Content-Type': 'application/json' };
const authB = { Authorization: `Bearer dev:${B}`, 'Content-Type': 'application/json' };

test('M7 V04: backup create idempotent, hash download, other owner 403', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, A);
  await seedAllowedSubject(db, B);
  const app = createApp({ db, auth: { allowDevBearer: true } });

  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: authA,
    body: JSON.stringify({ creationId: 'm7-create', mode: 'CAREER' }),
  });
  assert.equal(created.status, 200);
  const { saveId } = await json<{ saveId: string }>(created);

  await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      commandId: 'm7-create:seed', expectedRevision: 0, type: 'UI_SEED',
      payload: { name: '백업이', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] },
    }),
  });

  const once = await app.request(`/api/saves/${saveId}/backups`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({ requestId: 'backup-1', displayName: '다시플레이볼_백업이_수동' }),
  });
  assert.equal(once.status, 201);
  const meta = await json<{ fileId: string; contentHash: string; byteSize: number; fileName: string }>(once);
  assert.ok(meta.fileId);
  assert.match(meta.contentHash, /^[a-f0-9]{64}$/);
  assert.ok(meta.byteSize > 0);
  assert.match(meta.fileName, /\.json$/);

  const twice = await app.request(`/api/saves/${saveId}/backups`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({ requestId: 'backup-1' }),
  });
  assert.equal(twice.status, 200);
  assert.deepEqual(await json(twice), meta);

  const list = await app.request(`/api/saves/${saveId}/backups`, { headers: authA });
  assert.equal(list.status, 200);
  assert.equal((await json<{ items: unknown[] }>(list)).items.length, 1);

  const dl = await app.request(`/api/files/${meta.fileId}/content`, { headers: authA });
  assert.equal(dl.status, 200);
  assert.equal(dl.headers.get('X-Content-SHA256'), meta.contentHash);
  assert.equal(dl.headers.get('Cache-Control'), 'private, no-store');
  const text = await dl.text();
  assert.equal(createHash('sha256').update(text, 'utf8').digest('hex'), meta.contentHash);
  assert.match(text, /"kind":"BACKUP"/);

  const denied = await app.request(`/api/files/${meta.fileId}/content`, { headers: authB });
  assert.equal(denied.status, 403);
  assert.equal((await json<{ code: string }>(denied)).code, 'FORBIDDEN');

  const metaDenied = await app.request(`/api/files/${meta.fileId}`, { headers: authB });
  assert.equal(metaDenied.status, 403);

  const foreignList = await app.request(`/api/saves/${saveId}/backups`, { headers: authB });
  assert.equal(foreignList.status, 404);

  await client.close();
});

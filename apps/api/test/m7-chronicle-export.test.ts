import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const A = 'm7-chr-a';
const B = 'm7-chr-b';
const authA = { Authorization: `Bearer dev:${A}`, 'Content-Type': 'application/json' };
const authB = { Authorization: `Bearer dev:${B}`, 'Content-Type': 'application/json' };

test('M7 chronicle JSON export: idempotent, no secrets, not a restore file, foreign 403', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, A);
  await seedAllowedSubject(db, B);
  const app = createApp({ db, auth: { allowDevBearer: true } });

  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: authA,
    body: JSON.stringify({ creationId: 'chr-1', mode: 'CAREER' }),
  });
  const { saveId } = await json<{ saveId: string }>(created);
  await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      commandId: 'chr-1:seed', expectedRevision: 0, type: 'UI_SEED',
      payload: { name: '연대기', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] },
    }),
  });

  const once = await app.request(`/api/saves/${saveId}/exports/chronicle`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({ exportRequestId: 'exp-1', format: 'JSON' }),
  });
  assert.equal(once.status, 201);
  const meta = await json<{ fileId: string; kind: string; contentHash: string; expiresAt: string | null }>(once);
  assert.equal(meta.kind, 'CHRONICLE_JSON');
  assert.ok(meta.expiresAt);

  const twice = await app.request(`/api/saves/${saveId}/exports/chronicle`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({ exportRequestId: 'exp-1', format: 'JSON' }),
  });
  assert.equal(twice.status, 200);
  assert.equal((await json<{ fileId: string }>(twice)).fileId, meta.fileId);

  const dl = await app.request(`/api/files/${meta.fileId}/content`, { headers: authA });
  assert.equal(dl.status, 200);
  const text = await dl.text();
  assert.equal(createHash('sha256').update(text, 'utf8').digest('hex'), meta.contentHash);
  const doc = JSON.parse(text) as Record<string, unknown>;
  assert.equal(doc.notAGameBackup, true);
  assert.equal(doc.playerDisplayName, '연대기');
  assert.equal(doc.exportSchemaVersion, 1);
  assert.ok(Array.isArray(doc.moments));
  assert.doesNotMatch(text, /ownerSubject|@example\.com|"email"|DATABASE|Bearer/);

  const denied = await app.request(`/api/files/${meta.fileId}/content`, { headers: authB });
  assert.equal(denied.status, 403);

  await client.close();
});

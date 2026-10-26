import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const A = 'm7-restore-a';
const B = 'm7-restore-b';
const authA = { Authorization: `Bearer dev:${A}`, 'Content-Type': 'application/json' };
const authB = { Authorization: `Bearer dev:${B}`, 'Content-Type': 'application/json' };

test('M7 restore: preview + activate new save; source backup intact; foreign 403', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, A);
  await seedAllowedSubject(db, B);
  const app = createApp({ db, auth: { allowDevBearer: true } });

  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: authA,
    body: JSON.stringify({ creationId: 'm7-r-src', mode: 'CAREER' }),
  });
  const { saveId } = await json<{ saveId: string }>(created);
  await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      commandId: 'm7-r-src:seed', expectedRevision: 0, type: 'UI_SEED',
      payload: { name: '복원이', kind: 'HITTER', position: 'SS', throws: 'R', bats: 'L', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] },
    }),
  });

  const backupRes = await app.request(`/api/saves/${saveId}/backups`, {
    method: 'POST', headers: authA,
    body: JSON.stringify({ requestId: 'r-backup-1' }),
  });
  const backup = await json<{ fileId: string; contentHash: string }>(backupRes);

  const preview = await app.request('/api/restores/preview', {
    method: 'POST', headers: authA,
    body: JSON.stringify({ backupId: backup.fileId }),
  });
  assert.equal(preview.status, 200);
  const p = await json<{ targetSlotAvailable: boolean; blockingReasons: string[]; contentHash: string }>(preview);
  assert.equal(p.targetSlotAvailable, true);
  assert.deepEqual(p.blockingReasons, []);
  assert.equal(p.contentHash, backup.contentHash);

  const denied = await app.request('/api/restores/preview', {
    method: 'POST', headers: authB,
    body: JSON.stringify({ backupId: backup.fileId }),
  });
  assert.equal(denied.status, 403);

  const restore = await app.request('/api/restores', {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      restoreRequestId: 'job-1',
      backupId: backup.fileId,
      backupHash: backup.contentHash,
      displayName: '복원본',
    }),
  });
  assert.equal(restore.status, 201);
  const r = await json<{ targetSaveId: string; status: string; sourceBackupId: string }>(restore);
  assert.equal(r.status, 'ACTIVATED');
  assert.equal(r.sourceBackupId, backup.fileId);
  assert.notEqual(r.targetSaveId, saveId);

  const replay = await app.request('/api/restores', {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      restoreRequestId: 'job-1',
      backupId: backup.fileId,
      backupHash: backup.contentHash,
    }),
  });
  assert.equal(replay.status, 200);
  assert.equal((await json<{ targetSaveId: string }>(replay)).targetSaveId, r.targetSaveId);

  const career = await app.request(`/api/saves/${r.targetSaveId}/career`, { headers: authA });
  assert.equal(career.status, 200);
  assert.equal((await json<{ protagonist: { name: string } }>(career)).protagonist.name, '복원이');

  const srcStill = await app.request(`/api/files/${backup.fileId}`, { headers: authA });
  assert.equal(srcStill.status, 200);

  const badHash = await app.request('/api/restores', {
    method: 'POST', headers: authA,
    body: JSON.stringify({
      restoreRequestId: 'job-2',
      backupId: backup.fileId,
      backupHash: '0'.repeat(64),
    }),
  });
  assert.equal(badHash.status, 400);

  await client.close();
});

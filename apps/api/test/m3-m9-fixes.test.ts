import assert from 'node:assert/strict';
import test from 'node:test';
import { sql } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

type App = ReturnType<typeof createApp>;
const hdr = (s: string) => ({ Authorization: `Bearer dev:${s}`, 'Content-Type': 'application/json' });
const post = (app: App, who: string, path: string, body: unknown) => app.request(path, { method: 'POST', headers: hdr(who), body: JSON.stringify(body) });
const create = (app: App, who: string, creationId: string, mode = 'CAREER') => post(app, who, '/api/game-creations', { creationId, mode });
const cmd = (app: App, who: string, saveId: string, commandId: string, expectedRevision: number, type: string, payload: unknown) =>
  post(app, who, `/api/saves/${saveId}/commands`, { commandId, expectedRevision, type, payload });
const career = async (app: App, who: string, saveId: string) =>
  json<{ nextActions: { id: string }[]; pendingEventTitle: string | null; stage: { phaseLabel: string } }>(await app.request(`/api/saves/${saveId}/career`, { headers: hdr(who) }));
const seed = { name: '김철수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] };

async function fresh(...subjects: string[]) {
  const { db, client } = await createTestDb();
  for (const s of subjects.length ? subjects : ['user-a']) await seedAllowedSubject(db, s);
  return { app: createApp({ db, auth: { allowDevBearer: true } }), client, db };
}

test('CORS: allowed origins get headers on preflight and responses, unknown origins get none', async () => {
  const { app, client } = await fresh();
  const pre = await app.request('/api/saves', { method: 'OPTIONS', headers: { Origin: 'https://localhost', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  assert.ok(pre.status === 204 || pre.status === 200, String(pre.status));
  assert.equal(pre.headers.get('access-control-allow-origin'), 'https://localhost');
  assert.match(pre.headers.get('access-control-allow-headers') ?? '', /authorization/i);
  const ok = await app.request('/api/health', { headers: { Origin: 'capacitor://localhost' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'capacitor://localhost');
  const evil = await app.request('/api/health', { headers: { Origin: 'https://evil.example' } });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);
  const extra = createApp({ corsOrigins: ['https://app.example'] });
  assert.equal((await extra.request('/api/health', { headers: { Origin: 'https://app.example' } })).headers.get('access-control-allow-origin'), 'https://app.example');
  await client.close();
});

test('creation ids are owner-scoped: another user never sees or collides with a save', async () => {
  const { app, client } = await fresh('user-a', 'user-b');
  const a = await json<{ saveId: string }>(await create(app, 'user-a', 'shared-id'));
  const b = await json<{ saveId: string }>(await create(app, 'user-b', 'shared-id'));
  assert.notEqual(a.saveId, b.saveId);
  assert.equal((await app.request(`/api/saves/${a.saveId}`, { headers: hdr('user-b') })).status, 404);
  assert.equal((await app.request(`/api/saves/${b.saveId}`, { headers: hdr('user-b') })).status, 200);
  assert.equal((await create(app, 'user-a', 'bad id with spaces')).status, 400);
  assert.equal((await create(app, 'user-a', 'shared-id', 'CLUB')).status, 409);
  await client.close();
});

test('concurrent identical creations all return the one save; the active-save cap applies to creation too', async () => {
  const { app, client } = await fresh();
  const results = await Promise.all([create(app, 'user-a', 'race-1'), create(app, 'user-a', 'race-1'), create(app, 'user-a', 'race-1')]);
  assert.deepEqual(results.map(r => r.status), [200, 200, 200]);
  const ids = new Set((await Promise.all(results.map(r => json<{ saveId: string }>(r)))).map(x => x.saveId));
  assert.equal(ids.size, 1);
  for (let i = 0; i < 9; i++) assert.equal((await create(app, 'user-a', `many-${i}`)).status, 200);
  const over = await create(app, 'user-a', 'many-over');
  assert.equal(over.status, 422);
  assert.equal((await json<{ code: string }>(over)).code, 'SAVE_SLOT_REQUIRED');
  assert.equal((await create(app, 'user-a', 'race-1')).status, 200, 'replaying an existing creation still works at the cap');
  await client.close();
});

test('list cursor keeps microsecond precision: no row sharing a millisecond is skipped', async () => {
  const { app, client, db } = await fresh();
  await db.execute(sql`INSERT INTO profiles (id, display_name) VALUES ('user-a','a') ON CONFLICT DO NOTHING`);
  for (let i = 0; i < 22; i++) {
    const ts = i < 19 ? `2026-10-26 10:00:${String(59 - i).padStart(2, '0')}.000000+00` : i === 19 ? '2026-10-26 09:00:00.123900+00' : i === 20 ? '2026-10-26 09:00:00.123400+00' : '2026-10-26 08:00:00.000000+00';
    await db.execute(sql`INSERT INTO game_saves (id, owner_id, mode, revision, phase, summary, state, updated_at, created_at) VALUES (${`s${String(i).padStart(2, '0')}`}, 'user-a', 'CAREER', 0, 'BOOT', '{}'::jsonb, '{}'::jsonb, ${ts}::timestamptz, ${ts}::timestamptz)`);
  }
  const first = await json<{ items: { id: string }[]; nextCursor: string | null }>(await app.request('/api/saves', { headers: hdr('user-a') }));
  assert.equal(first.items.length, 20);
  assert.match(first.nextCursor!, /\.123900Z\|s19$/);
  const second = await json<{ items: { id: string }[]; nextCursor: string | null }>(await app.request(`/api/saves?cursor=${encodeURIComponent(first.nextCursor!)}`, { headers: hdr('user-a') }));
  assert.deepEqual(second.items.map(x => x.id), ['s20', 's21']);
  assert.equal(second.nextCursor, null);
  assert.equal((await app.request('/api/saves?cursor=not-a-cursor', { headers: hdr('user-a') })).status, 400);
  await client.close();
});

test('UI shell: the server validates the seed and refuses a second one', async () => {
  const { app, client } = await fresh();
  const { saveId } = await json<{ saveId: string }>(await create(app, 'user-a', 'seed-1'));
  const bad = [
    { ...seed, name: 'N'.repeat(40) }, { ...seed, name: '' }, { ...seed, position: 'SP' }, { ...seed, archetype: 'NOPE' },
    { ...seed, throws: 'X' }, { ...seed, throws: 'L', position: 'SS' }, { ...seed, focus: ['CONTACT'] }, { ...seed, kind: 'PITCHER', position: 'SP', pitchForm: null, archetype: 'BALANCED', focus: ['VELOCITY', 'STUFF', 'COMMAND', 'STAMINA'] },
  ];
  for (const [i, payload] of bad.entries()) assert.equal((await cmd(app, 'user-a', saveId, `bad-${i}`, 0, 'UI_SEED', payload)).status, 400, JSON.stringify(payload));
  assert.equal((await cmd(app, 'user-a', saveId, 's1', 0, 'UI_SEED', { ...seed, name: '  김철수  ' })).status, 200);
  assert.equal((await cmd(app, 'user-a', saveId, 's2', 1, 'UI_SEED', { ...seed, name: '다시' })).status, 400, 'a save is seeded once');
  await client.close();
});

test('UI shell: advance and choose follow the phase, the pending event, the offered options and the chances', async () => {
  const { app, client } = await fresh();
  const { saveId } = await json<{ saveId: string }>(await create(app, 'user-a', 'rules-1'));
  let rev = 0;
  const send = async (type: string, payload: unknown) => (await cmd(app, 'user-a', saveId, `c${rev}`, rev, type, payload)).status.valueOf() === 200 ? (rev++, 200) : 400;
  assert.equal(await send('UI_SEED', seed), 200);
  assert.equal(await send('UI_CHOOSE', { screenId: 'S05', optionId: 'accept' }), 400, 'draft screen during the season');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S06', optionId: 'opt-a' }), 400, 'no pending event yet');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S22', optionId: 'keep' }), 200);
  assert.ok((await career(app, 'user-a', saveId)).nextActions.some(a => a.id === 'open:S22'), 'keeping the style does not spend the change');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S22', optionId: 'power' }), 200);
  assert.ok(!(await career(app, 'user-a', saveId)).nextActions.some(a => a.id === 'open:S22'));
  assert.equal(await send('UI_CHOOSE', { screenId: 'S22', optionId: 'power' }), 400, 'no chance left');
  assert.equal(await send('UI_ADVANCE', { mode: 'WARP' }), 400);
  assert.equal(await send('UI_ADVANCE', { mode: 'NEXT_MAJOR_EVENT' }), 200);
  assert.ok((await career(app, 'user-a', saveId)).pendingEventTitle);
  assert.equal(await send('UI_ADVANCE', { mode: 'ONE_WEEK' }), 400, 'a pending event blocks progress');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S23', optionId: 'basic' }), 400, 'no training while an event is pending');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S06', optionId: 'opt-a' }), 200);
  // Drive to the draft and retire; progress never leaves the retired state.
  while ((await career(app, 'user-a', saveId)).stage.phaseLabel !== 'settle') {
    const view = await career(app, 'user-a', saveId);
    assert.equal(await (view.pendingEventTitle ? send('UI_CHOOSE', { screenId: 'S06', optionId: 'opt-a' }) : send('UI_ADVANCE', { mode: 'ONE_WEEK' })), 200);
  }
  assert.equal(await send('UI_ADVANCE', { mode: 'ONE_WEEK' }), 400, 'settle needs the settle screen first');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S04', optionId: 'to-path' }), 200);
  assert.equal(await send('UI_CHOOSE', { screenId: 'S28', optionId: 'us' }), 400, 'a disabled option cannot be chosen');
  assert.equal(await send('UI_CHOOSE', { screenId: 'S28', optionId: 'to-draft' }), 200);
  assert.equal(await send('UI_CHOOSE', { screenId: 'S05', optionId: 'end' }), 200);
  assert.equal((await career(app, 'user-a', saveId)).stage.phaseLabel, 'retired');
  assert.equal(await send('UI_ADVANCE', { mode: 'ONE_WEEK' }), 400);
  assert.equal((await career(app, 'user-a', saveId)).stage.phaseLabel, 'retired');
  await client.close();
});

test('M7 input: wrong types answer 400, never 500; a club backup restores as a club save', async () => {
  const { app, client } = await fresh();
  const club = await json<{ saveId: string }>(await create(app, 'user-a', 'club-1', 'CLUB'));
  assert.equal((await post(app, 'user-a', `/api/saves/${club.saveId}/backups`, { requestId: 123 })).status, 400);
  assert.equal((await post(app, 'user-a', `/api/saves/${club.saveId}/backups`, { requestId: 'x y' })).status, 400);
  assert.equal((await post(app, 'user-a', `/api/saves/${club.saveId}/exports/chronicle`, { exportRequestId: ['a'] })).status, 400);
  assert.equal((await post(app, 'user-a', '/api/restores/preview', { backupId: 5 })).status, 400);
  assert.equal((await post(app, 'user-a', '/api/restores', { restoreRequestId: 7, backupId: 'x', backupHash: 'y' })).status, 400);
  const named = await post(app, 'user-a', `/api/saves/${club.saveId}/backups`, { requestId: 'bk-0', displayName: 123 });
  assert.equal(named.status, 201, 'a non-string display name falls back to the default');
  const bk = await json<{ fileId: string; contentHash: string }>(await post(app, 'user-a', `/api/saves/${club.saveId}/backups`, { requestId: 'bk-1' }));
  const restored = await json<{ targetSaveId: string }>(await post(app, 'user-a', '/api/restores', { restoreRequestId: 'rr-1', backupId: bk.fileId, backupHash: bk.contentHash }));
  assert.equal((await json<{ mode: string }>(await app.request(`/api/saves/${restored.targetSaveId}`, { headers: hdr('user-a') }))).mode, 'CLUB');
  await client.close();
});

test('M7 ids: concurrent identical backups resolve to one file; restore ids are owner-scoped and bound to one backup', async () => {
  const { app, client } = await fresh('user-a', 'user-b');
  const a = await json<{ saveId: string }>(await create(app, 'user-a', 'sv-a'));
  const same = await Promise.all([1, 2, 3].map(() => post(app, 'user-a', `/api/saves/${a.saveId}/backups`, { requestId: 'bk-race' })));
  assert.ok(same.every(r => r.status === 200 || r.status === 201), same.map(r => r.status).join());
  const fileIds = new Set((await Promise.all(same.map(r => json<{ fileId: string }>(r)))).map(x => x.fileId));
  assert.equal(fileIds.size, 1);
  const bkA = await json<{ fileId: string; contentHash: string }>(await post(app, 'user-a', `/api/saves/${a.saveId}/backups`, { requestId: 'bk-a2' }));
  const first = await json<{ targetSaveId: string }>(await post(app, 'user-a', '/api/restores', { restoreRequestId: 'rr-shared', backupId: bkA.fileId, backupHash: bkA.contentHash }));
  const b = await json<{ saveId: string }>(await create(app, 'user-b', 'sv-b'));
  const bkB = await json<{ fileId: string; contentHash: string }>(await post(app, 'user-b', `/api/saves/${b.saveId}/backups`, { requestId: 'bk-b' }));
  const second = await json<{ targetSaveId: string }>(await post(app, 'user-b', '/api/restores', { restoreRequestId: 'rr-shared', backupId: bkB.fileId, backupHash: bkB.contentHash }));
  assert.notEqual(first.targetSaveId, second.targetSaveId);
  assert.equal((await app.request(`/api/saves/${second.targetSaveId}`, { headers: hdr('user-b') })).status, 200, 'the other user really owns their restored save');
  const bkA2 = await json<{ fileId: string; contentHash: string }>(await post(app, 'user-a', `/api/saves/${a.saveId}/backups`, { requestId: 'bk-a3' }));
  assert.equal((await post(app, 'user-a', '/api/restores', { restoreRequestId: 'rr-shared', backupId: bkA2.fileId, backupHash: bkA2.contentHash })).status, 400, 'same request id, different backup');
  await client.close();
});

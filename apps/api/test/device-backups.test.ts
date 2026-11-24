import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { commandReceipts, createTestDb, deviceBackupParts, deviceBackups, encodeStateParts, gameSaves, seasonJobs, seedAllowedSubject, seedSave, StateDecoder } from '@playball/db';
import { createApp } from '../src/app.js';

const route = '/api/device-backups';
const id = '00000000-0000-4000-8000-000000000001';
const media = 'application/x-ndjson';
const publicMetadata = { id, mode: 'CAREER', revision: '1', phase: 'HIGH_SCHOOL', summary: { title: '김야구', year: 2027 } };
const metadata = { version: 1, ...publicMetadata };
const headers = (owner: string) => ({ Authorization: `Bearer dev:${owner}` });
const frames = (...rows: unknown[]) => rows.map(row => JSON.stringify(row) + '\n').join('');
const upload = (body: string, owner = 'owner') => ({ ...headers(owner), 'Content-Type': media, 'Content-Length': String(Buffer.byteLength(body)) });

test('device backup stays isolated from account saves and is immutable per owner and ID', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  await seedAllowedSubject(db, 'owner');
  await seedAllowedSubject(db, 'other');
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const state = { schemaVersion: 1, career: { history: '한글⚾😀'.repeat(100_000) } };
  const parts = [...encodeStateParts(state)];
  assert.ok(parts.length > 1);
  const ndjson = (meta: typeof metadata) => frames(['save', meta], ...parts.map(part => ['part', part]), ['end', parts.length]);
  const body = ndjson(metadata);
  const post = (data: string, owner?: string) => app.request(`${route}/${id}`, { method: 'POST', headers: upload(data, owner), body: data });

  assert.equal((await app.request(route)).status, 401);
  const created = await post(body);
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { id });
  assert.equal((await post(body)).status, 200);
  assert.equal((await post(ndjson({ ...metadata, summary: { year: 2027, title: '김야구' } }))).status, 200);
  assert.equal((await post(ndjson({ ...metadata, revision: '2' }))).status, 409);
  assert.deepEqual(await (await app.request(route, { headers: headers('other') })).json(), { items: [] });
  assert.equal((await app.request(`${route}/${id}/content`, { headers: headers('other') })).status, 404);
  assert.equal((await post(ndjson({ ...metadata, revision: '2' }), 'other')).status, 201);

  const listed = await (await app.request(route, { headers: headers('owner') })).json() as { items: { createdAt: string }[] };
  assert.equal(listed.items.length, 1);
  assert.ok(Number.isFinite(Date.parse(listed.items[0]!.createdAt)));
  assert.deepEqual(listed.items[0], { ...publicMetadata, createdAt: listed.items[0]!.createdAt });
  const restored = await app.request(`${route}/${id}/content`, { headers: headers('owner') });
  assert.equal(restored.status, 200);
  assert.equal(restored.headers.get('content-type'), media + '; charset=utf-8');
  const responseFrames = (await restored.text()).trimEnd().split('\n').map(line => JSON.parse(line) as [string, unknown]);
  assert.deepEqual(responseFrames.shift(), ['save', metadata]);
  assert.deepEqual(responseFrames.pop(), ['end', parts.length]);
  const decoder = new StateDecoder();
  for (const [tag, part] of responseFrames) {
    assert.equal(tag, 'part');
    assert.equal(typeof part, 'string');
    decoder.push(part as string);
  }
  assert.deepEqual(decoder.finish(), state);
  assert.deepEqual(await db.select().from(gameSaves), []);
});

test('device backup rejects missing footer, unexpected state and over-limit uploads without persisting parts', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  await seedAllowedSubject(db, 'owner');
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const post = (body: string, overrides: Record<string, string> = {}) => app.request(`${route}/${id}`, {
    method: 'POST', headers: { ...upload(body), ...overrides }, body,
  });
  const parts = [...encodeStateParts({ schemaVersion: 1, career: { games: Array.from({ length: 10 }, () => ({ runs: 1 })) } })];
  const smallParts = parts.join('').trimEnd().split('\n').map(line => ['part', line + '\n']);
  assert.ok(smallParts.length >= 8);
  assert.equal((await post(frames(['save', metadata], ...smallParts))).status, 400);
  assert.deepEqual(await db.select().from(deviceBackups), []);
  assert.deepEqual(await db.select().from(deviceBackupParts), []);
  assert.equal((await post(frames(['save', metadata], ['part', '["unexpected"]\n'], ['end', 1]))).status, 400);
  assert.equal((await post(frames(['save', { ...metadata, mode: 'CLUB' }], ...smallParts, ['end', smallParts.length]))).status, 400);
  assert.equal((await post(frames(['save', { ...metadata, revision: '0' }], ...smallParts, ['end', smallParts.length]))).status, 400);
  assert.equal((await post('', { 'Content-Length': String(128 * 1024 * 1024 + 1) })).status, 413);
  assert.equal((await post('', { 'Content-Type': 'application/json' })).status, 415);
  assert.equal((await post(frames(['save', metadata], ...smallParts, ['end', smallParts.length]))).status, 201);
});

test('device backup SQL upgrades existing M3 saves and can be applied again with data already present', async t => {
  const { db, client } = await createTestDb();
  t.after(() => client.close());
  await client.exec('DROP TABLE device_backup_parts; DROP TABLE device_backups');
  await seedAllowedSubject(db, 'owner');
  const saveId = 'existing-official-save';
  await seedSave(db, { id: saveId, ownerId: 'owner', revision: 7n, state: { schemaVersion: 1, history: ['보존'] } });
  await db.insert(commandReceipts).values({ saveId, commandId: 'played', requestHash: 'existing-hash', result: { done: true }, resultingRevision: 7n });
  await db.insert(seasonJobs).values({ saveId, runId: 'existing-run', requestId: 'existing-request', nextExpectedRevision: 7n });
  const officialBefore = await db.select().from(gameSaves);
  const receiptsBefore = await db.select().from(commandReceipts);
  const jobsBefore = await db.select().from(seasonJobs);

  const migration = readFileSync(new URL('../../../packages/db/drizzle/0003_device_backups.sql', import.meta.url), 'utf8');
  await client.exec(migration);
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const parts = [...encodeStateParts({ schemaVersion: 1, career: { history: ['기기 백업'] } })];
  const body = frames(['save', metadata], ...parts.map(part => ['part', part]), ['end', parts.length]);
  assert.equal((await app.request(`${route}/${id}`, { method: 'POST', headers: upload(body), body })).status, 201);
  const backupBefore = await db.select().from(deviceBackups);
  const partsBefore = await db.select().from(deviceBackupParts);
  assert.equal(backupBefore.length, 1);
  assert.equal(partsBefore.length, parts.length);

  await client.exec(migration);
  assert.deepEqual(await db.select().from(deviceBackups), backupBefore);
  assert.deepEqual(await db.select().from(deviceBackupParts), partsBefore);
  assert.deepEqual(await db.select().from(gameSaves), officialBefore);
  assert.deepEqual(await db.select().from(commandReceipts), receiptsBefore);
  assert.deepEqual(await db.select().from(seasonJobs), jobsBefore);
});

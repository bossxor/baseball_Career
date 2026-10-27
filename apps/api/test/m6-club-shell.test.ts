import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const SUBJECT = 'm6-club';
const auth = { Authorization: `Bearer dev:${SUBJECT}`, 'Content-Type': 'application/json' };

test('club creation is stored once and S13/S15 read that save', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: auth, body: JSON.stringify({ creationId: 'club-1', mode: 'CLUB' }),
  });
  assert.equal(created.status, 200);
  const { saveId } = await json<{ saveId: string }>(created);
  const body = {
    commandId: 'club-1:club', expectedRevision: 0, type: 'CLUB_CREATE',
    payload: { worldKey: 'kbo-club', seed: 'club-1', difficulty: 'REALISTIC', clubId: 'LG' },
  };
  const first = await app.request(`/api/saves/${saveId}/commands`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  assert.equal(first.status, 200, await first.clone().text());
  const receipt = await json<{ revision: string; phase: string; summary: { clubId: string } }>(first);
  assert.equal(receipt.revision, '1');
  assert.equal(receipt.phase, 'PRESEASON_SETUP');
  assert.equal(receipt.summary.clubId, 'LG');
  const replay = await app.request(`/api/saves/${saveId}/commands`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  assert.deepEqual(await json(replay), receipt);

  const again = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ ...body, commandId: 'club-2', expectedRevision: 1 }),
  });
  assert.equal(again.status, 400);
  assert.equal((await json<{ code: string }>(again)).code, 'CLUB_ALREADY_CREATED');

  const home = await app.request(`/api/saves/${saveId}/screens/S13`, { headers: auth });
  assert.equal(home.status, 200);
  const view = await json<{ lines: { label: string; value: string }[]; commands: { type: string }[] }>(home);
  assert.equal(view.lines.find(line => line.label === '구단')?.value, 'LG 트윈스');
  assert.equal(view.commands[0]?.type, 'CLUB_START');

  const lineup = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ commandId: 'line-1', expectedRevision: 1, type: 'CLUB_LINEUP', payload: { auto: true } }),
  });
  assert.equal(lineup.status, 200, await lineup.clone().text());
  assert.equal((await json<{ revision: string }>(lineup)).revision, '2');
  const board = await json<{ lines: { label: string }[] }>(await app.request(`/api/saves/${saveId}/screens/S15`, { headers: auth }));
  assert.equal(board.lines[0]?.label, '저장된 선발');
  await client.close();
});

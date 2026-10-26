import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';

const SUBJECT = 'm4-user';
const auth = { Authorization: `Bearer dev:${SUBJECT}`, 'Content-Type': 'application/json' };

test('M4 UI shell: create → seed → advance → settle → choose S04→S28', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  const app = createApp({ db, auth: { allowDevBearer: true } });

  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ creationId: 'create-1', mode: 'CAREER' }),
  });
  assert.equal(created.status, 200);
  const { saveId } = await created.json() as { saveId: string };

  const seed = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'create-1:seed', expectedRevision: 0, type: 'UI_SEED',
      payload: { name: '김테스트', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'L', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] },
    }),
  });
  assert.equal(seed.status, 200);
  assert.equal((await seed.json()).revision, '1');

  const career0 = await app.request(`/api/saves/${saveId}/career`, { headers: auth });
  assert.equal(career0.status, 200);
  const c0 = await career0.json();
  assert.equal(c0.protagonist.name, '김테스트');
  assert.ok(c0.nextActions.some((a: { id: string }) => a.id === 'advance'));

  for (let i = 0; i < 8; i++) {
    const adv = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ commandId: `adv-${i}`, expectedRevision: 1 + i, type: 'UI_ADVANCE', payload: { mode: 'ONE_WEEK' } }),
    });
    assert.equal(adv.status, 200, await adv.text());
  }

  const career = await app.request(`/api/saves/${saveId}/career`, { headers: auth });
  const c = await career.json();
  assert.ok(c.nextActions.some((a: { id: string }) => a.id === 'open:S04'), JSON.stringify(c.nextActions));

  const screen = await app.request(`/api/saves/${saveId}/screens/S04`, { headers: auth });
  assert.equal(screen.status, 200);
  assert.equal((await screen.json()).screenId, 'S04');

  const choose = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'ch-1', expectedRevision: 9, type: 'UI_CHOOSE',
      payload: { screenId: 'S04', optionId: 'to-path' },
    }),
  });
  assert.equal(choose.status, 200);
  const ch = await choose.json();
  assert.deepEqual(ch.next, { kind: 'screen', screenId: 'S28' });

  const replay = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'ch-1', expectedRevision: 9, type: 'UI_CHOOSE',
      payload: { screenId: 'S04', optionId: 'to-path' },
    }),
  });
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), ch);

  await client.close();
});

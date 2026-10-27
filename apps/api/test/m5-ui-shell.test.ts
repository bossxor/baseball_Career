import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestDb, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';

const SUBJECT = 'm5-user';
const auth = { Authorization: `Bearer dev:${SUBJECT}`, 'Content-Type': 'application/json' };

test('M5 UI shell: S21 stub GET + CHOICE back; S34 via college', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  const app = createApp({ db, auth: { allowDevBearer: true } });

  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ creationId: 'm5-create', mode: 'CAREER' }),
  });
  assert.equal(created.status, 200);
  const { saveId } = await json<{ saveId: string }>(created);

  const seed = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'm5-create:seed', expectedRevision: 0, type: 'UI_SEED',
      payload: { name: '이설정', kind: 'HITTER', position: 'SS', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] },
    }),
  });
  assert.equal(seed.status, 200);

  const career = await app.request(`/api/saves/${saveId}/career`, { headers: auth });
  const c = await json<{ nextActions: { id: string }[] }>(career);
  assert.ok(c.nextActions.some(a => a.id === 'open:S21'));

  const screen = await app.request(`/api/saves/${saveId}/screens/S21`, { headers: auth });
  assert.equal(screen.status, 200);
  const d = await json<{ screenId: string; notice: string | null }>(screen);
  assert.equal(d.screenId, 'S21');
  assert.match(d.notice ?? '', /M5 셸/);

  const choose = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'm5-back', expectedRevision: 1, type: 'UI_CHOOSE',
      payload: { screenId: 'S21', optionId: 'back' },
    }),
  });
  assert.equal(choose.status, 200);
  assert.deepEqual((await json<{ next: unknown }>(choose)).next, { kind: 'career' });

  for (let i = 0; i < 3; i++) {
    const adv = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ commandId: `m5-adv-${i}`, expectedRevision: 2 + i, type: 'UI_ADVANCE', payload: { mode: 'ONE_WEEK' } }),
    });
    assert.equal(adv.status, 200, await adv.text());
  }
  const toPath = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ commandId: 'm5-path', expectedRevision: 5, type: 'UI_CHOOSE', payload: { screenId: 'S04', optionId: 'to-path' } }),
  });
  assert.equal(toPath.status, 200);

  const college = await app.request(`/api/saves/${saveId}/commands`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      commandId: 'm5-college', expectedRevision: 6, type: 'UI_CHOOSE',
      payload: { screenId: 'S28', optionId: 'college' },
    }),
  });
  assert.equal(college.status, 200);
  assert.deepEqual((await json<{ next: unknown }>(college)).next, { kind: 'screen', screenId: 'S34' });

  const s34 = await app.request(`/api/saves/${saveId}/screens/S34`, { headers: auth });
  assert.equal(s34.status, 200);
  assert.equal((await json<{ screenId: string }>(s34)).screenId, 'S34');

  await client.close();
});

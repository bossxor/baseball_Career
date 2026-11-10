import { storedSave } from './stored-save.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';
import { retryNoOfferPrefix } from '../../../packages/engine/test/retry-completion-scenario.js';

const SUBJECT = 'm2-retry';
const auth = { Authorization: `Bearer dev:${SUBJECT}`, 'Content-Type': 'application/json' };

test('E34 -> E36 retry retirement runs through save commands and screens', async () => {
  const { db, client } = await createTestDb();
  await seedAllowedSubject(db, SUBJECT);
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const created = await app.request('/api/game-creations', {
    method: 'POST', headers: auth, body: JSON.stringify({ creationId: 'retry-1', mode: 'CLUB' }),
  });
  const { saveId } = await json<{ saveId: string }>(created);
  // A KBO career has no API creation path yet; seed the finished-contract career directly.
  const career = retryNoOfferPrefix();
  await db.update(gameSaves).set({ state: { schemaVersion: 1, career } }).where(eq(gameSaves.id, saveId));

  let saveRevision = 0, careerRevision = career.revision, n = 0;
  const send = async (type: string, payload: Record<string, unknown>, careerRev = careerRevision) => {
    const res = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({ commandId: `r-${n++}`, expectedRevision: saveRevision, type, payload: { careerRevision: careerRev, ...payload } }),
    });
    if (res.status === 200) {
      const r = await json<{ revision: string; summary: { careerRevision: number; phase: string } }>(res);
      saveRevision = Number(r.revision); careerRevision = r.summary.careerRevision;
      return r;
    }
    return { status: res.status, code: (await json<{ code: string }>(res)).code };
  };

  const opened = await send('CAREER_RETRY_OPEN', {}) as { summary: { phase: string } };
  assert.equal(opened.summary.phase, 'RETRY_REVIEW');
  assert.equal(((await send('CAREER_RETRY_REVIEW', { eventVersion: 1 }, careerRevision - 1)) as { status: number }).status, 400);
  const stale = await send('CAREER_RETRY_REVIEW', { eventVersion: 99 }) as { status: number };
  assert.equal(stale.status, 400);
  await send('CAREER_RETRY_REVIEW', { eventVersion: 1 });

  const routes = await json<{ routes: { routeId: string }[] }>(await app.request(`/api/saves/${saveId}/screens/RETRY_ROUTES`, { headers: auth }));
  assert.ok(routes.routes.some(r => r.routeId === 'RETIRE'));
  assert.doesNotMatch(JSON.stringify(routes), /potential|"seed"|"rng"/);

  await send('CAREER_RETRY_REQUEST_RETIRE', {});
  const [row] = await storedSave(db, saveId);
  const c = (row!.state as { career: { retryPro: { eventKey: string }; events: { eventKey: string; version: number }[] } }).career;
  const ev = c.events.find(e => e.eventKey === c.retryPro.eventKey)!;
  const done = await send('CAREER_RETRY_CONFIRM_RETIRE', { eventKey: ev.eventKey, eventVersion: ev.version }) as { summary: { phase: string } };
  assert.equal(done.summary.phase, 'ARCHIVED');
  const view = await json<{ status: string }>(await app.request(`/api/saves/${saveId}/screens/RETRY_RETIREMENT`, { headers: auth }));
  assert.equal(view.status, 'ARCHIVED');
  await client.close();
});

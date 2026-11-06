import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { completedHighSchoolCareer, completedCollegeAcademicYear } from '../../../packages/engine/test/fixtures.js';
import type { FlowView } from '../src/model.js';

// One press must be able to run a whole stretch; production keeps a 25s request budget.
process.env.PLAYBALL_SPAN_BUDGET_MS = '900000';
const HIDDEN = /"seed"|"rng"|potential|sourceBasis|"score"|baseScore/;

/** Real PGlite + createApp + createHttpApi; every step replays a command the server served. */
async function session(subject: string, career: unknown) {
  const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
  await seedAllowedSubject(db, subject);
  const app = createApp({ db, auth: { allowDevBearer: true } }), headers = { Authorization: 'Bearer dev:' + subject, 'Content-Type': 'application/json' };
  const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: subject, mode: 'CAREER' }) }));
  await db.update(gameSaves).set({ state: { schemaVersion: 1, career } }).where(eq(gameSaves.id, saveId));
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => app.request(String(input), init)) as typeof fetch;
  const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:' + subject });
  let view = (await api.flow(saveId))!, n = 0;
  return {
    api, saveId, get view() { return view; },
    ids: () => view.commands.map(c => c.id),
    take: async (id: string): Promise<FlowView> => {
      const c = view.commands.find(x => x.id === id);
      assert.ok(c, `offered ${id}: ${view.commands.map(x => x.id)}`);
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      view = (await api.flowCommand(saveId, `${subject}-${n++}`, c.type, c.payload))!;
      return view;
    },
    state: async () => (await db.select({ state: gameSaves.state }).from(gameSaves).where(eq(gameSaves.id, saveId)))[0]!.state as { career: { world: { leagueKey: string; seasonKey: string } } },
    close: async () => { globalThis.fetch = originalFetch; await client.close(); },
  };
}

test('college road: graduation route → enrollment → year-end handover → season start → play → annual training window', async () => {
  const s = await session('web-college-1', completedHighSchoolCareer(800_000, 'PITCHER'));
  try {
    await s.take('ack-review'); await s.take('open-route');
    const enroll = s.view.commands.find(c => c.id.startsWith('college-'));
    assert.ok(enroll?.confirm, `colleges are offered with a confirmation: ${s.ids()}`);
    await s.take(enroll.id);
    assert.deepEqual(s.ids(), ['close-hs-year']);
    await s.take('close-hs-year');
    assert.deepEqual(s.ids(), ['college-start']);
    await s.take('college-start');
    assert.deepEqual(s.ids(), ['preseason']);
    assert.equal((await s.api.career(s.saveId)).stage.leagueLabel, '대학');
    await s.take('preseason');
    assert.deepEqual(s.ids(), ['adv-season', 'adv-month', 'adv-game'], 'default CTA is the whole season, secondary is the month');
    assert.match(s.view.lines.map(l => l.value).join(' '), /0\/48경기/);
    await s.take('adv-game');
    for (let i = 0; i < 20 && s.ids().includes('continue'); i++) await s.take('continue'); // a game may span several chunks
    assert.match(s.view.lines.map(l => l.value).join(' '), /1\/48경기/, 'the played game is counted from the saved records');
    // Play to the annual training window (E43 at 16 games); continue/pause appear while a multi-game plan is active.
    await s.take('adv-season'); // ONE press runs the engine until the mandatory training window (16 games) and stops there
    assert.deepEqual(s.ids(), ['open_training', 'forfeit_training']);
    assert.ok(s.view.commands.find(c => c.id === 'forfeit_training')!.confirm);
    await s.take('open_training');
    const train = s.ids().find(id => id.startsWith('train-') && id !== 'train-conditioning') ?? 'train-conditioning';
    assert.ok(s.ids().includes(train), `training choices are served by the engine preview: ${s.ids()}`);
    await s.take(train);
    assert.ok(!s.ids().some(id => id.startsWith('train-')), 'one training per academic year');
    assert.equal((await s.state()).career.world.leagueKey, 'COLLEGE');
  } finally { await s.close(); }
});

test('college road: result → academic year close → next year; stale/forged payloads are rejected', async () => {
  const s = await session('web-college-2', completedCollegeAcademicYear());
  try {
    assert.equal(s.view.title, '학년 마무리');
    const close = s.view.commands.find(c => c.id === 'close-year')!;
    await assert.rejects(s.api.flowCommand(s.saveId, 'forged', close.type, { ...close.payload, world: {} }));
    await assert.rejects(s.api.flowCommand(s.saveId, 'stale', close.type, { ...close.payload, careerRevision: -1 }));
    await s.take('close-year');
    assert.deepEqual(s.ids(), ['start-next']);
    await s.take('start-next');
    assert.deepEqual(s.ids(), ['preseason']);
    assert.match(s.view.lines.map(l => `${l.label} ${l.value}`).join(' '), /학년 2학년/);
    assert.equal((await s.state()).career.world.seasonKey, '2031');
  } finally { await s.close(); }
});

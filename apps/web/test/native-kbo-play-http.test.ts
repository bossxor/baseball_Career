import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { enteredKboCareer } from '../../../packages/engine/test/fixtures.js';
import { confirmKboPreseasonPlan } from '../../../packages/engine/src/kbo-preseason.js';
import { confirmKboOpeningRoster } from '../../../packages/engine/src/kbo-opening-roster.js';
import { confirmKboSeasonSchedule } from '../../../packages/engine/src/kbo-schedule.js';
import { startKboRegularSeason } from '../../../packages/engine/src/kbo-progress.js';
import type { KboCareer } from '../../../packages/engine/src/kbo-career-entry.js';
import type { FlowView } from '../src/model.js';

const HIDDEN = /"seed"|"rng"|potential|sourceBasis|"score"|baseScore/;

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
    api, saveId, get view() { return view; }, ids: () => view.commands.map(c => c.id),
    take: async (id: string): Promise<FlowView> => {
      const c = view.commands.find(x => x.id === id);
      assert.ok(c, `offered ${id}: ${view.commands.map(x => x.id)}`);
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      view = (await api.flowCommand(saveId, `${subject}-${n++}`, c.type, c.payload))!;
      return view;
    },
    close: async () => { globalThis.fetch = originalFetch; await client.close(); },
  };
}

test('KBO pro season: preseason chain → start → native games are advanced and shown', async () => {
  const s = await session('web-kbo-1', enteredKboCareer('HITTER'));
  try {
    assert.equal((await s.api.career(s.saveId)).stage.leagueLabel, 'KBO');
    for (let i = 0; i < 6 && !s.ids().includes('start'); i++) await s.take(s.ids()[0]!);
    await s.take('start');
    assert.ok(s.ids().includes('adv-1'));
    await s.take('adv-1');
    assert.match(s.view.lines.map(l => l.value).join(' '), /리그 경기 [0-9]+개 기록/);
  } finally { await s.close(); }
});

test('KBO pro season: regular season end → postseason → season close, all from served commands', async () => {
  const e = enteredKboCareer('HITTER'), p = confirmKboPreseasonPlan(e, e.revision), o = confirmKboOpeningRoster(p, p.revision), sc = confirmKboSeasonSchedule(o, o.revision);
  const c: KboCareer = structuredClone(startKboRegularSeason(sc, sc.revision));
  const all = [...c.competitionSchedule!.leagues.KBO, ...c.competitionSchedule!.leagues.FUTURES], first = Math.min(...all.map(g => g.worldDay)), last = Math.max(...all.map(g => g.worldDay));
  c.days = { ...c.days!, days: Array.from({ length: last - first + 1 }, (_, i) => ({ day: first + i, evidence: 'test', result: { injured: [], recovered: [] } })) };
  c.phaseContext = { phase: 'SEASON_REVIEW' };
  const s = await session('web-kbo-2', c);
  try {
    assert.deepEqual(s.ids(), ['post-start']);
    await s.take('post-start');
    for (let i = 0; i < 60 && s.ids().includes('post-advance'); i++) await s.take('post-advance');
    assert.deepEqual(s.ids(), ['settle-growth']);
    await s.take('settle-growth');
    assert.ok(s.ids().includes('close-season'), `postseason ends in a season close: ${s.ids()}`);
    await s.take('close-season');
    assert.ok(!s.ids().includes('close-season'));
  } finally { await s.close(); }
});

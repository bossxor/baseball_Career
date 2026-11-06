import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { preparedUsOptionCareer } from '../../../packages/engine/test/us-option-fixture.js';
import { usLevelFixture } from '../../../packages/engine/test/us-level-fixture.js';
import { finishedUsCareerFixture } from '../../../packages/engine/test/us-finished-fixture.js';
import { raiseUsWindowEvent } from '../../../packages/engine/src/us-windows.js';
import type { UsProgress } from '../../../packages/engine/src/us-season.js';
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

test('US road: preseason chain → start → advance days → home links to the flow', async () => {
  const s = await session('web-us-1', preparedUsOptionCareer('HITTER'));
  try {
    assert.equal((await s.api.career(s.saveId)).stage.leagueLabel, '미국');
    assert.equal((await s.api.career(s.saveId)).nextActions[0]!.id, 'open:FLOW');
    for (let i = 0; i < 4 && !s.ids().includes('start'); i++) await s.take(s.ids()[0]!);
    await s.take('start');
    assert.ok(s.ids().includes('adv-1'));
    const games = () => Number(/리그 경기 ([0-9]+)개/.exec(s.view.lines.map(l => l.value).join(' '))?.[1] ?? -1);
    const before = games();
    await s.take('adv-1');
    if (s.ids().includes('continue')) await s.take('continue');
    assert.ok(games() > before, `native games are recorded and shown: ${before} -> ${games()}`);
  } finally { await s.close(); }
});

test('US road: the annual training window is served as commands and training is one-time', async () => {
  const base = usLevelFixture('ROOKIE', 20), opened = raiseUsWindowEvent(base, (base.phaseContext as UsProgress).nextWorldDay - 1, base.phaseContext as UsProgress)!;
  const s = await session('web-us-2', opened);
  try {
    assert.deepEqual(s.ids().sort(), ['defer_training', 'forfeit_training', 'open_training']);
    assert.ok(s.view.commands.find(c => c.id === 'forfeit_training')!.confirm);
    await s.take('open_training');
    assert.ok(s.ids().includes('adv-1'));
    const train = s.ids().find(id => id.startsWith('train-'));
    assert.ok(train, `training choices come from the engine preview: ${s.ids()}`);
    await s.take(train);
    assert.ok(!s.ids().some(id => id.startsWith('train-')));
  } finally { await s.close(); }
});

test('US road: a finished season starts the next one from the served command', async () => {
  const s = await session('web-us-3', finishedUsCareerFixture());
  try {
    assert.deepEqual(s.ids(), ['next-minor-year']);
    await s.take('next-minor-year');
    assert.equal(s.view.title, '시즌 준비');
    assert.match(s.view.lines.map(l => l.value).join(' '), /2\d{3}/);
  } finally { await s.close(); }
});

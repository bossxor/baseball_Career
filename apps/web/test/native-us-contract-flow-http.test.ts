import test from 'node:test';
import { loadState } from './save-state.js';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { expiredRetryUsCareer } from '../../../packages/engine/test/us-return-retry-fixture.js';
import { closedUsMajorFixture } from '../../../packages/engine/test/us-major-fixture.js';
import { closedUsFreeAgentFixture } from '../../../packages/engine/test/us-major-fa-fixture.js';
import { openUsAgentSalaryOffer } from '@playball/engine';
import { closeSeasonHealth } from '../../../packages/engine/src/health.js';
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
    leagueGames: async () => Object.keys((await loadState(db, saveId) as { career: { records: { games: object } } }).career.records.games).length,
    close: async () => { globalThis.fetch = originalFetch; await client.close(); },
  };
}

test('US contracts: an expired minor deal opens the market and signs a served offer (confirmation required)', async () => {
  const c = expiredRetryUsCareer();
  c.health = closeSeasonHealth(c.health, c.world.seasonKey).ledger; // closed year, as in the API-level market test
  const s = await session('web-us-minor', c);
  try {
    assert.ok(s.ids().includes('minor-market'), 'the market is offered');
    await s.take('minor-market');
    const offer = s.view.commands.find(x => x.id.startsWith('minor-'));
    assert.ok(offer?.confirm, 'a signature needs an explicit confirmation');
    await s.take(offer.id);
    assert.ok(!s.ids().some(id => id.startsWith('minor-')), 'signed: the market is closed');
  } finally { await s.close(); }
});

test('US contracts: an unfunded major renewal says so and offers no signature; a funded quote signs once', async () => {
  const unfunded = await session('web-us-major-0', closedUsMajorFixture());
  try {
    assert.equal(unfunded.view.title, '메이저 재계약');
    assert.ok(!unfunded.ids().includes('major-renew'));
    assert.match(unfunded.view.notice ?? '', /예산이 부족/);
  } finally { await unfunded.close(); }
  const source = closedUsMajorFixture(), funding = source.inventory.clubs.map(o => ({ organizationId: o.id, addedBudgetUsd: 20_000_000 }));
  const s = await session('web-us-major', openUsAgentSalaryOffer(source, source.revision, funding));
  try {
    assert.ok(s.view.commands.find(x => x.id === 'major-renew')?.confirm, 'a signature needs an explicit confirmation');
    await s.take('major-renew');
    assert.notEqual(s.view.title, '메이저 재계약');
  } finally { await s.close(); }
});

test('US contracts: free agency opens the market, then signs a served offer', async () => {
  const s = await session('web-us-fa', closedUsFreeAgentFixture());
  try {
    assert.ok(s.ids().includes('major-market'), 'the FA market is offered');
    await s.take('major-market');
    const offer = s.view.commands.find(x => x.id.startsWith('major-fa-'));
    assert.ok(offer?.confirm, 'a signature needs an explicit confirmation');
    await s.take(offer.id);
    assert.ok(!s.ids().some(id => id.startsWith('major-fa-')), 'signed: the market is closed');
  } finally { await s.close(); }
});

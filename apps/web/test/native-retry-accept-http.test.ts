import test from 'node:test';
import { loadState } from './save-state.js';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { runRetryExhaustionScenario, retryNoOfferPrefix } from '../../../packages/engine/test/retry-completion-scenario.js';
import * as retry from '../../../packages/engine/src/career-pro-retry.js';

const HIDDEN = /"seed"|"rng"|potential|sourceBasis|"score"|baseScore/;

// Same controlled-retiring-roster setup as the engine's career-retry-completion test; the offer comes from the real market, nothing is injected.
test('retry ACCEPT: a served offer-* command signs the contract over HTTP; stale previews are rejected', async () => {
  const s = runRetryExhaustionScenario(), settlement = s.commands.findIndex(x => x.command === 'SETTLE_PREPARATION');
  let c = structuredClone(s.commands[settlement - 1]!.output), positive = retryNoOfferPrefix(true, true);
  positive = retry.openKboUncontractedRetry(positive, positive.revision);
  c.world = positive.world; c.retryPro!.origin = positive.retryPro!.origin; c.retryPro!.marketWorld = positive.retryPro!.marketWorld;
  c = retry.settleKboRetryPreparation(c, c.revision, true);
  assert.ok(retry.kboRetryRoutesView(c).offers.length, 'fixture has a real offer');

  const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
  try {
    await seedAllowedSubject(db, 'web-accept');
    const app = createApp({ db, auth: { allowDevBearer: true } }), headers = { Authorization: 'Bearer dev:web-accept', 'Content-Type': 'application/json' };
    const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: 'accept-1', mode: 'CAREER' }) }));
    await db.update(gameSaves).set({ state: { schemaVersion: 1, career: c } }).where(eq(gameSaves.id, saveId));
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => app.request(String(input), init)) as typeof fetch;
    const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:web-accept' });
    const view = (await api.flow(saveId))!, offer = view.commands.find(x => x.id.startsWith('offer-'));
    assert.ok(offer, `offer served: ${view.commands.map(x => x.id)}`);
    assert.doesNotMatch(JSON.stringify(view), HIDDEN);
    await assert.rejects(api.flowCommand(saveId, 'accept-stale', offer.type, { ...offer.payload, routePreviewId: 'stale' }));
    const after = (await api.flowCommand(saveId, 'accept-ok', offer.type, offer.payload))!;
    assert.equal(after.title, '입단 완료');
    assert.deepEqual(after.commands, []);
    const signed = (await loadState(db, saveId) as { career: typeof c }).career;
    assert.equal(signed.world.contracts[signed.protagonistKey]!.contractKey, offer.payload.offerKey);
  } finally { globalThis.fetch = originalFetch; await client.close(); }
});

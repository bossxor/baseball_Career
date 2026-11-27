import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import * as engine from '@playball/engine';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { enteredKboCareer } from '../../../packages/engine/test/fixtures.js';
import { preparedUsOptionCareer } from '../../../packages/engine/test/us-option-fixture.js';
import type { FlowView } from '../src/model.js';

const HIDDEN = /"seed"|"rng"|potential|sourceBasis|"score"|baseScore|lotRank/;

async function session(subject: string, career: unknown, extra: object = {}) {
  const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
  await seedAllowedSubject(db, subject);
  const app = createApp({ db, auth: { allowDevBearer: true } }), headers = { Authorization: 'Bearer dev:' + subject, 'Content-Type': 'application/json' };
  const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: subject, mode: 'CAREER' }) }));
  await db.update(gameSaves).set({ state: { schemaVersion: 1, career, ...extra } }).where(eq(gameSaves.id, saveId));
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => app.request(String(input), init)) as typeof fetch;
  const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:' + subject });
  let view = (await api.flow(saveId))!, n = 0;
  return {
    get view() { return view; },
    // Replay the first served command exactly as served; the page never builds a payload itself.
    first: async (type: string): Promise<FlowView> => {
      const c = view.commands[0];
      assert.ok(c, `a command is offered on "${view.title}"`);
      assert.equal(c.type, type);
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      view = (await api.flowCommand(saveId, `${subject}-${n++}`, c.type, c.payload))!;
      return view;
    },
    close: async () => { globalThis.fetch = originalFetch; await client.close(); },
  };
}

test('KBO national team: a served draw, choice and start reach tournament play over HTTP', async () => {
  const s = await session('web-kbo-national', enteredKboCareer());
  try {
    await s.first('CAREER_KBO_NATIONAL_SELECT');
    await s.first('CAREER_KBO_NATIONAL_RESOLVE');
    await s.first(s.view.commands[0]!.type); // tournament start, as served
    assert.equal(s.view.commands[0]!.type, 'CAREER_KBO_NATIONAL_ADVANCE');
  } finally { await s.close(); }
});

test('KBO national team: a sealed result shows the medal and benefit, then returns to the club', async () => {
  const source = enteredKboCareer();
  const sealed = engine.sealNationalCompetitionResult(source, source.revision, { competitionId: 'trusted-controlled-oly', tournament: 'OLY', seasonKey: source.world.seasonKey, medal: 'BRONZE', finalRank: 3, registered: true, officialAppearance: true, resultVersion: 1 });
  const s = await session('web-kbo-national-result', sealed);
  try {
    await s.first('CAREER_KBO_NATIONAL_RESOLVE'); // first appearance
    assert.equal(s.view.lines.find(r => r.label === '팀 메달')?.value, '동메달');
    assert.equal(s.view.lines.find(r => r.label === '병역')?.value, '체육요원 자격 획득');
    await s.first('CAREER_KBO_NATIONAL_RESOLVE'); // eligibility
    assert.equal(s.view.commands[0]!.payload.command, 'CONFIRM_NATIONAL_RETURN');
  } finally { await s.close(); }
});

test('US national team: a served WBC draw, event reply and start reach tournament play over HTTP', async () => {
  const c = preparedUsOptionCareer();
  delete c.preseasonPlan;
  delete c.seasonSchedule;
  const host = engine.createNpcLeagueHost(engine.usNationalNpcOwner(c), Number(c.world.seasonKey), 'calendar-2');
  const s = await session('web-us-national', c, { collegeNationalHost: host });
  try {
    await s.first('CAREER_US_NATIONAL_SELECT');
    await s.first(s.view.commands[0]!.type); // event reply, as served
    await s.first(s.view.commands[0]!.type); // tournament start, as served
    assert.equal(s.view.commands[0]!.type, 'CAREER_US_NATIONAL_ADVANCE');
  } finally { await s.close(); }
});

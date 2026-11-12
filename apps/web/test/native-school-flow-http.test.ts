import test from 'node:test';
import { loadState } from './save-state.js';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../../api/src/app.js';
import { json } from '../../api/test/json.js';
import { createHttpApi } from '../src/http.js';
import { emptyDraft, setKind, toggleFocus, toCreationRequest, SCHOOLS, SECONDARY_PITCHES, validateStep } from '../src/creation.js';
import { HIGH_SCHOOLS } from '../../../packages/engine/src/high-school-world.js';
import { PITCH_IDS, abilityKeys } from '@playball/rules';
import { completedHighSchoolCareer } from '../../../packages/engine/test/fixtures.js';
import { retryNoOfferPrefix } from '../../../packages/engine/test/retry-completion-scenario.js';
import type { FlowView } from '../src/model.js';

const HIDDEN = /"seed"|"rng"|potential|sourceBasis|"score"|baseScore/;

test('web school catalogue equals the engine list; pitcher second pitch excludes the base fastball', () => {
  assert.deepEqual(SCHOOLS, HIGH_SCHOOLS.map(s => ({ id: s.id, name: s.name })));
  assert.deepEqual(Object.keys(SECONDARY_PITCHES), PITCH_IDS.filter(p => p !== 'P01'));
});

for (const kind of ['HITTER', 'PITCHER'] as const) {
  test(`${kind}: web creation form request creates a native school career over real HTTP; a lost response replays the exact intent`, async () => {
    const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
    try {
      const subject = 'web-create-' + kind;
      await seedAllowedSubject(db, subject);
      const app = createApp({ db, auth: { allowDevBearer: true } });
      let d = setKind(emptyDraft(), kind);
      d = { ...d, name: '폼선수', position: kind === 'HITTER' ? 'CF' : 'SP', throws: 'R', bats: 'R', pitchForm: kind === 'PITCHER' ? 'OVERHAND' : null, archetype: kind === 'HITTER' ? 'BALANCED' : 'VELOCITY', schoolId: 'H02', difficulty: 'REALISTIC', secondaryPitch: kind === 'PITCHER' ? 'P03' : null };
      const abilities = abilityKeys(kind).slice(0, 4);
      for (const k of abilities) d = toggleFocus(d, k);
      assert.deepEqual(validateStep(d, 'SCHOOL'), {});
      const request = toCreationRequest(d, 'form-create-' + kind)!;
      const bodies: { commandId: string; expectedRevision: number; type: string; payload: Record<string, unknown> }[] = [];
      let lose = true;
      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const res = await app.request(String(input), init);
        if (init?.method === 'POST' && String(input).endsWith('/commands')) {
          bodies.push(JSON.parse(String(init.body)));
          if (lose) { lose = false; assert.equal(res.status, 200, await res.clone().text()); throw new TypeError('lost after commit'); }
        }
        return res;
      }) as typeof fetch;
      const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:' + subject });
      await assert.rejects(api.create(request));
      const { saveId } = await api.create(request);
      assert.equal(bodies.length, 2);
      assert.equal(bodies[0]!.type, 'CAREER_SCHOOL_CREATE');
      assert.deepEqual(bodies[1], bodies[0], 'retry replays the exact first command (no COMMAND_ID_REUSED)');
      assert.equal(bodies[0]!.payload.seasonYear, 2027);
      assert.equal(bodies[0]!.payload.difficulty, 'REALISTIC');
      assert.doesNotMatch(JSON.stringify(bodies[0]!.payload), /"seed"|"worldKey"|"potential"/);
      let view = await api.career(saveId);
      assert.equal(view.protagonist.name, '폼선수');
      assert.equal(view.stage.teamName, '청해솔고');
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      for (let i = 0; i < 3; i++) {
        if (view.nextActions[0]!.id === 'open:FLOW') {
          const keep = (await api.flow(saveId))!.commands.find(c => c.id === 'school-keep-focus');
          assert.ok(keep, 'E01 focus choice is a served flow command');
          await api.flowCommand(saveId, 'form-step-' + i, keep.type, keep.payload);
          view = await api.career(saveId);
        } else view = await api.act(saveId, view.nextActions[0]!.id, 'NEXT_MAJOR_EVENT', 'form-step-' + i);
      }
      assert.equal(view.stage.phaseLabel, '정규시즌');
    } finally { globalThis.fetch = originalFetch; await client.close(); }
  });
}

test('graduation → KBO entry runs from server-provided flow commands only; a lost refresh replays the original receipt', async () => {
  const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
  try {
    await seedAllowedSubject(db, 'web-flow');
    const app = createApp({ db, auth: { allowDevBearer: true } }), headers = { Authorization: 'Bearer dev:web-flow', 'Content-Type': 'application/json' };
    const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: 'flow-1', mode: 'CAREER' }) }));
    const source = completedHighSchoolCareer(800_000, 'HITTER');
    await db.update(gameSaves).set({ state: { schemaVersion: 1, career: source } }).where(eq(gameSaves.id, saveId));
    const sent: { commandId: string; type: string; payload: Record<string, unknown> }[] = [];
    let loseFlowRead = false;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') sent.push(JSON.parse(String(init.body)));
      else if (loseFlowRead && String(input).endsWith('/screens/CAREER_FLOW')) { loseFlowRead = false; throw new TypeError('lost refresh'); }
      return app.request(String(input), init);
    }) as typeof fetch;
    const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:web-flow' });
    const home = await api.career(saveId);
    assert.equal(home.nextActions[0]!.id, 'open:FLOW');
    let view = (await api.flow(saveId))!, n = 0;
    const take = async (id: string, loseRefresh = false) => {
      const command = view.commands.find(c => c.id === id);
      assert.ok(command, `server offered ${id}: ${view.commands.map(c => c.id)}`);
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      loseFlowRead = loseRefresh;
      const commandId = 'flow-' + n++;
      if (loseRefresh) {
        await assert.rejects(api.flowCommand(saveId, commandId, command.type, command.payload));
        const next = await api.flowCommand(saveId, commandId, command.type, { ...command.payload, careerRevision: -1 });
        assert.deepEqual(sent.at(-1), sent.at(-2), 'retry resends the original command, not the tampered payload');
        view = next!;
      } else view = (await api.flowCommand(saveId, commandId, command.type, command.payload))!;
    };
    assert.deepEqual(view.commands.map(c => c.id), ['ack-review']);
    await take('ack-review', true);
    assert.deepEqual(view.commands.map(c => c.id), ['open-route']);
    await take('open-route');
    assert.deepEqual(view.commands.map(c => c.id).filter(id => !id.startsWith('college-') && !id.startsWith('us-')), ['draft-prepare']);
    await take('draft-prepare');
    await take('draft-resolve');
    assert.ok(view.commands.some(c => c.id === 'draft-decline' && c.confirm), 'declining asks for confirmation');
    await take('draft-sign');
    await take('close-year');
    await take('activate');
    assert.ok(sent.every(s => s.type.startsWith('CAREER_')));
    assert.ok('protagonistClubId' in (await loadState(db, saveId)).career, 'KBO career owns the save after activation');
    const kboHome = await api.career(saveId);
    assert.equal(kboHome.stage.leagueLabel, 'KBO');
  } finally { globalThis.fetch = originalFetch; await client.close(); }
});

test('pro retry shell is reachable from the web: notice → routes → preparation start → retirement confirm', async () => {
  for (const path of ['PREP', 'RETIRE'] as const) {
    const { db, client } = await createTestDb(), originalFetch = globalThis.fetch;
    try {
      await seedAllowedSubject(db, 'web-retry');
      const app = createApp({ db, auth: { allowDevBearer: true } }), headers = { Authorization: 'Bearer dev:web-retry', 'Content-Type': 'application/json' };
      const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: 'retry-' + path, mode: 'CAREER' }) }));
      await db.update(gameSaves).set({ state: { schemaVersion: 1, career: retryNoOfferPrefix() } }).where(eq(gameSaves.id, saveId));
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => app.request(String(input), init)) as typeof fetch;
      const api = createHttpApi({ baseUrl: 'http://api.local', getToken: () => 'dev:web-retry' });
      assert.equal((await api.career(saveId)).nextActions[0]!.id, 'open:FLOW');
      let view = (await api.flow(saveId))!, n = 0;
      const take = async (id: string): Promise<FlowView> => {
        const c = view.commands.find(x => x.id === id);
        assert.ok(c, `offered ${id}: ${view.commands.map(x => x.id)}`);
        return (await api.flowCommand(saveId, `${path}-${n++}`, c.type, c.payload))!;
      };
      assert.deepEqual(view.commands.map(c => c.id), ['retry-open']);
      view = await take('retry-open');
      view = await take('retry-review');
      assert.ok(view.commands.some(c => c.id === 'route-retire' && c.confirm));
      assert.doesNotMatch(JSON.stringify(view), HIDDEN);
      if (path === 'PREP') {
        // 14 (2026-11-07): spending a lifetime preparation chance is irreversible and needs a confirmation step.
        assert.match(view.commands.find(c => c.id === 'route-prep')?.confirm ?? '', /준비 기회 1회/);
        view = await take('route-prep');
        assert.deepEqual(view.commands.map(c => c.id), ['prep-preseason']);
        view = await take('prep-preseason');
        assert.deepEqual(view.commands.map(c => c.id), ['prep-game', 'prep-month']);
        view = await take('prep-game');
        assert.ok(view.commands.some(c => c.id === 'prep-game'), 'advance succeeded and the season continues');
        // ponytail: the training window opens after 16 of 48 games (~minutes of PGlite time); TRAIN offering is typechecked, not run live.
        assert.ok(!view.commands.some(c => c.id.startsWith('train-')), 'no training choices before the window opens');
      } else {
        view = await take('route-retire');
        assert.deepEqual(view.commands.map(c => c.id), ['retire']);
        view = await take('retire');
        assert.equal(view.title, '은퇴 보관');
        assert.deepEqual(view.commands, []);
      }
    } finally { globalThis.fetch = originalFetch; await client.close(); }
  }
});

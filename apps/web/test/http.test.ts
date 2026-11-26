import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpApi } from '../src/http.js';

test('season job HTTP distinguishes disabled routes and uses the exact save revision', async t => {
  const job = { runId: 'run-1', status: 'RUNNING', stopReason: null,
    progress: { seasonKey: '2027', phase: 'SEASON_PROGRESS', completedGames: 12, scheduledGames: 216 } };
  const replies = [Response.json({ code: 'NOT_FOUND' }, { status: 404 }), Response.json({ job: null }), Response.json(job),
    Response.json({ job }), Response.json({ code: 'SAVE_NOT_FOUND' }, { status: 404 }), new Response('404 Not Found', { status: 404 })];
  const requests: RequestInit[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), 'http://api.test/api/saves/save%2F1/season-job');
    assert.ok(init);
    requests.push(init);
    const response = replies.shift();
    assert.ok(response);
    return response;
  });
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 'dev:t' });
  const jobs = api.seasonJobs;
  assert.ok(jobs);
  assert.equal(await jobs.read('save/1'), undefined);
  assert.equal(await jobs.read('save/1'), null);
  assert.deepEqual(await jobs.start('save/1', 'request-id', '9007199254740993'), job);
  assert.equal(requests[2]?.method, 'POST');
  assert.deepEqual(JSON.parse(String(requests[2]?.body)), { requestId: 'request-id', expectedRevision: '9007199254740993' });
  assert.deepEqual(await jobs.read('save/1'), job);
  await assert.rejects(jobs.read('save/1'), { code: 'SAVE_NOT_FOUND' });
  assert.equal(await jobs.read('save/1'), undefined);
});

test('http api maps saves list and create→seed→career against a stub fetch', async () => {
  const calls: { url: string; method: string; body?: string }[] = [];
  const revisions: Record<string, string> = {};
  const state = { seeded: false, day: 0 };

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url, method, ...(body ? { body } : {}) });

    if (url.endsWith('/api/saves') && method === 'GET') {
      return new Response(JSON.stringify({ items: [], nextCursor: null }), { status: 200 });
    }
    if (url.endsWith('/api/game-creations')) {
      revisions['save_c1'] = '0';
      return new Response(JSON.stringify({ saveId: 'save_c1', revision: '0', phase: 'BOOT', mode: 'CAREER' }), { status: 200 });
    }
    if (url.includes('/commands') && method === 'POST') {
      const parsed = JSON.parse(body!) as { type: string; commandId: string; expectedRevision: number };
      const next = String(Number(revisions['save_c1'] ?? '0') + 1);
      revisions['save_c1'] = next;
      if (parsed.type === 'CAREER_SCHOOL_CREATE') state.seeded = true;
      if (parsed.type === 'UI_ADVANCE') state.day += 7;
      return new Response(JSON.stringify({ commandId: parsed.commandId, revision: next, phase: 'season', summary: {}, eventIds: [], nextActions: [] }), { status: 200 });
    }
    if (url.endsWith('/career')) {
      return new Response(JSON.stringify({
        saveId: 'save_c1',
        revision: revisions['save_c1'] ?? '0',
        protagonist: { name: '김HTTP', kindLabel: '타자', positionLabel: '중견수', ageLabel: '18세' },
        stage: { leagueLabel: '고교', teamName: '가상고', seasonLabel: '고교 3학년', phaseLabel: '1주차' },
        progress: { mode: 'NEXT_MAJOR_EVENT', alternatives: ['ONE_GAME', 'ONE_WEEK'] },
        pendingEventTitle: null,
        recentRecords: state.day ? [{ label: '진행한 날', value: `${state.day}일` }] : [],
        nextActions: [{ id: 'advance', label: '진행', kind: 'ADVANCE', primary: true }],
      }), { status: 200 });
    }
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }) as typeof fetch;

  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 'dev:t' });
  assert.equal((await api.home()).saves.length, 0);
  const { saveId } = await api.create({
    commandId: 'c1', name: '김HTTP', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'L',
    pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'], school: { schoolId: 'H02', seasonYear: 2027, difficulty: 'GROWTH' as const, secondaryPitch: null },
  });
  assert.equal(saveId, 'save_c1');
  assert.equal(state.seeded, true);
  const before = await api.career(saveId);
  const after = await api.act(saveId, 'advance', 'ONE_WEEK', 'a1');
  assert.notDeepEqual(after.recentRecords, before.recentRecords);
  assert.ok(calls.some(c => c.url.includes('/game-creations')));
  assert.ok(calls.some(c => c.body?.includes('CAREER_SCHOOL_CREATE')));
});

test('http api: a 401 calls onUnauthorized once and surfaces AUTH_REQUIRED', async () => {
  let calls = 0;
  globalThis.fetch = (async () => new Response(JSON.stringify({ code: 'AUTH_REQUIRED' }), { status: 401 })) as typeof fetch;
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 'expired', onUnauthorized: () => { calls++; } });
  await assert.rejects(api.home(), (err: unknown) => (err as { code?: string }).code === 'AUTH_REQUIRED');
  assert.equal(calls, 1);
});

test('http api: a retried command keeps the revision it was first sent with (lost response), and a conflict clears it', async () => {
  const sent: { commandId: string; expectedRevision: number }[] = [];
  let mode: 'LOSE' | 'OK' | 'CONFLICT' = 'LOSE';
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/game-creations')) return new Response(JSON.stringify({ saveId: 's1', revision: mode === 'LOSE' ? '0' : '1', phase: 'BOOT', mode: 'CAREER' }), { status: 200 });
    if (url.includes('/commands')) {
      sent.push(JSON.parse(String(init?.body)) as { commandId: string; expectedRevision: number });
      if (mode === 'LOSE') throw new TypeError('network lost');
      if (mode === 'CONFLICT') return new Response(JSON.stringify({ code: 'REVISION_CONFLICT', currentRevision: '4' }), { status: 409 });
      return new Response(JSON.stringify({ commandId: 'x', revision: '2', phase: 'season', summary: {}, eventIds: [], nextActions: [] }), { status: 200 });
    }
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }) as typeof fetch;
  const request = { commandId: 'c9', name: '김HTTP', kind: 'HITTER' as const, position: 'CF', throws: 'R' as const, bats: 'L' as const, pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'], school: { schoolId: 'H02', seasonYear: 2027, difficulty: 'GROWTH' as const, secondaryPitch: null } };
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 't' });
  await assert.rejects(api.create(request));
  mode = 'OK';
  await api.create(request);
  assert.deepEqual(sent.map(s => [s.commandId, s.expectedRevision]), [['c9:school', 0], ['c9:school', 0]], 'the retry resends revision 0, not the 1 the server now reports');
  mode = 'CONFLICT';
  await assert.rejects(api.choose('s1', 'S06', 'opt-a', 'k1'));
  mode = 'OK';
  await api.choose('s1', 'S06', 'opt-a', 'k1');
  assert.equal(sent.at(-1)!.expectedRevision, 4, 'after a conflict the same command id may use the fresh revision');
});

test('flow grants continuation only for the read of its own receipt revision and replays a lost refresh exactly', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const sent: { commandId: string; expectedRevision: number; type: string; payload: unknown }[] = [];
  let saveRevision = '10', loseFlow = false, peerWrites = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/career')) return Response.json({ revision: saveRevision });
    if (url.endsWith('/screens/CAREER_FLOW')) {
      if (loseFlow) { loseFlow = false; throw new TypeError('network lost'); }
      return Response.json({ saveRevision, stop: 'BUDGET', commands: [] });
    }
    assert.ok(url.endsWith('/commands'));
    const body = JSON.parse(String(init?.body)) as (typeof sent)[number];
    const revision = body.commandId === 'one' ? '11' : String(Number(saveRevision) + 1);
    sent.push(body);
    saveRevision = peerWrites ? String(Number(revision) + 1) : revision;
    return Response.json({ revision, summary: { spanStop: 'BUDGET' } });
  }) as typeof fetch;
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 't' });
  const type = 'CAREER_KBO_PLAY_ADVANCE_SPAN';
  assert.equal((await api.flow('s'))?.canContinueSeason, undefined);
  loseFlow = true;
  await assert.rejects(api.flowCommand('s', 'one', type, { careerRevision: 20, span: 'SEASON' }));
  assert.equal((await api.flowCommand('s', 'one', type, { careerRevision: -1 }))?.canContinueSeason, true);
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(sent[0]?.expectedRevision, 10);
  peerWrites = true;
  assert.equal((await api.flowCommand('s', 'two', type, { careerRevision: 23, span: 'SEASON' }))?.canContinueSeason, undefined);
  assert.equal(sent[2]?.expectedRevision, 11);
});

test('chronicle uses the authenticated file endpoint and rejects an altered download', async t => {
  const text = '{"kind":"CHRONICLE_JSON"}\n';
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const contentHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const fileName = '다시플레이볼_연대기.json';
  const sent: string[] = [];
  let altered = false;
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer dev:t');
    sent.push(url);
    if (url.endsWith('/exports/chronicle')) {
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), { exportRequestId: 'same-intent', format: 'JSON' });
      return Response.json({ fileId: 'file/id', kind: 'CHRONICLE_JSON', fileName, contentHash, byteSize: bytes.length }, { status: 201 });
    }
    return new Response(altered ? text.replace('JSON', 'XXXX') : text, { headers: { 'Content-Type': 'application/json' } });
  });
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 'dev:t' });
  const download = await api.exportChronicle!('save/id', 'same-intent');
  assert.equal(download.fileName, fileName);
  assert.equal(await download.blob.text(), text);
  assert.deepEqual(sent, [
    'http://api.test/api/saves/save%2Fid/exports/chronicle',
    'http://api.test/api/files/file%2Fid/content',
  ]);
  altered = true;
  await assert.rejects(api.exportChronicle!('save/id', 'same-intent'), { code: 'FILE_CORRUPT' });
});

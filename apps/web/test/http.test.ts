import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpApi } from '../src/http.js';

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
      if (parsed.type === 'UI_SEED') state.seeded = true;
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
    pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'],
  });
  assert.equal(saveId, 'save_c1');
  assert.equal(state.seeded, true);
  const before = await api.career(saveId);
  const after = await api.act(saveId, 'advance', 'ONE_WEEK', 'a1');
  assert.notDeepEqual(after.recentRecords, before.recentRecords);
  assert.ok(calls.some(c => c.url.includes('/game-creations')));
  assert.ok(calls.some(c => c.body?.includes('UI_SEED')));
});

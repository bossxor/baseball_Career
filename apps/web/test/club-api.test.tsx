import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createFixtureApi } from '../src/fixtures.js';
import { parseRoute } from '../src/App.js';
import { ClubNew } from '../src/screens/Club.js';
import { createHttpApi } from '../src/http.js';

test('fixture club creation is idempotent and the picker lists a club', async () => {
  const api = createFixtureApi();
  const first = await api.createClub({ commandId: 'c1', clubId: 'LG' });
  const second = await api.createClub({ commandId: 'c1', clubId: 'HH' });
  assert.equal(second.saveId, first.saveId);
  const before = await api.club(first.saveId, 'S13');
  const after = await api.clubCommand(first.saveId, 'start-1', 'CLUB_START', {});
  const replay = await api.clubCommand(first.saveId, 'start-1', 'CLUB_START', {});
  assert.equal(replay.lines[0]?.value, after.lines[0]?.value);
  assert.notEqual(before.lines[0]?.value, after.lines[0]?.value);
  assert.deepEqual(parseRoute('#/club/new'), { name: 'club-new' });
  assert.equal(parseRoute('#/club/save_1/S15').name, 'club');
  assert.match(renderToStaticMarkup(<ClubNew onPick={() => undefined} onBack={() => undefined} />), /한화 이글스/);
});

test('http createClub posts a club creation and CLUB_CREATE', async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = typeof init?.body === 'string' ? init.body : '';
    calls.push(`${init?.method ?? 'GET'} ${url} ${body}`);
    if (url.endsWith('/api/game-creations')) return new Response(JSON.stringify({ saveId: 'save_c', revision: '0', mode: 'CLUB' }), { status: 200 });
    if (url.includes('/commands')) return new Response(JSON.stringify({ revision: '1', phase: 'PRESEASON_SETUP', summary: { clubId: 'LG' } }), { status: 200 });
    if (url.includes('/screens/S13')) return new Response(JSON.stringify({ screenId: 'S13', title: '구단 홈', lines: [], links: [], commands: [] }), { status: 200 });
    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), { status: 404 });
  }) as typeof fetch;
  const api = createHttpApi({ baseUrl: 'http://api.test', getToken: () => 't' });
  assert.equal((await api.createClub({ commandId: 'c1', clubId: 'LG' })).saveId, 'save_c');
  assert.ok(calls.some(call => call.includes('"mode":"CLUB"')));
  assert.ok(calls.some(call => call.includes('CLUB_CREATE') && call.includes('"clubId":"LG"')));
  assert.equal((await api.club('save_c', 'S13')).screenId, 'S13');
});

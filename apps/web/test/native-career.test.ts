import assert from 'node:assert/strict';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import { createTestDb, gameSaves, seedAllowedSubject } from '@playball/db';
import type { HighSchoolCareer } from '@playball/engine';
import { createApp } from '../../api/src/app.js';
import { createHttpApi } from '../src/http.js';
import { applyEngineCommand } from '../../api/src/engine-command.js';
import type { NativeCareerState } from '../../api/src/native-career.js';
test('M2 HTTP creation resolves E01 and PRE, plays a native game, and reads real records without exposing the save', async () => {
  const { db, client } = await createTestDb();
  const originalFetch = globalThis.fetch;
  try {
    await seedAllowedSubject(db, 'native-user');
    await seedAllowedSubject(db, 'other-user');
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const responses: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await app.request(String(input), init);
      responses.push(await response.clone().text());
      return response;
    }) as typeof fetch;
    const api = createHttpApi({ baseUrl: 'http://localhost', getToken: () => 'dev:native-user' });
    const { saveId } = await api.create({ commandId: 'native-create', name: '실제선수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'L', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] });
    const readState = async () => (await db.select({ state: gameSaves.state }).from(gameSaves).where(eq(gameSaves.id, saveId)))[0]!.state as NativeCareerState & { career: HighSchoolCareer };
    const first = await api.career(saveId);
    assert.ok(first.nextActions.some(a => a.id === 'open:S06'), 'creation must stop at the real E01 decision');
    assert.equal((await readState()).career.phaseContext.phase, 'EVENT_DECISION');
    const event = await api.decision(saveId, 'S06');
    assert.ok(event.options.some(o => o.id === 'KEEP_FOCUS' && !o.disabledReason));
    await assert.rejects(api.act(saveId, 'advance', 'ONE_GAME', 'early'));
    await assert.rejects(api.choose(saveId, 'S06', 'opt-a', 'fictional'));
    await api.choose(saveId, 'S06', 'KEEP_FOCUS', 'focus');
    const replay = await app.request(`/api/saves/${saveId}/commands`, { method: 'POST', headers: { Authorization: 'Bearer dev:native-user', 'Content-Type': 'application/json' }, body: JSON.stringify({ commandId: 'focus', expectedRevision: 1, type: 'UI_CHOOSE', payload: { screenId: 'S06', optionId: 'KEEP_FOCUS' } }) });
    assert.equal(replay.status, 200, 'the original receipt must replay without applying the event twice');
    assert.equal((await readState()).career.revision, 2);
    const pre = await api.career(saveId);
    assert.ok(pre.nextActions.some(a => a.id === 'confirm-preseason'));
    await api.act(saveId, 'confirm-preseason', 'ONE_GAME', 'pre');
    const prepared = await readState(), preparedJson = JSON.stringify(prepared);
    const nextCommand = { commandId: 'json-proof', expectedRevision: 3, type: 'UI_ADVANCE', payload: { mode: 'ONE_GAME' } };
    assert.deepEqual(applyEngineCommand(JSON.parse(preparedJson), nextCommand), applyEngineCommand(prepared, nextCommand), 'JSON resume preserves the exact native transition');
    assert.equal(JSON.stringify(prepared), preparedJson, 'native command leaves its source unchanged');
    let played = await api.act(saveId, 'advance', 'ONE_GAME', 'game-0');
    for (let i = 1; i <= 12 && !played.recentRecords.some(r => r.label === '팀 경기' && Number(r.value) > 0); i++) {
      if (played.pendingEventTitle) {
        const notice = await api.decision(saveId, 'S06');
        const option = notice.options.find(o => !o.disabledReason);
        assert.ok(option, JSON.stringify(notice));
        await api.choose(saveId, 'S06', option.id, `notice-${i}`);
      }
      played = await api.act(saveId, 'advance', 'ONE_GAME', `game-${i}`);
    }
    const saved = await readState();
    const nativeGames = Object.values(saved.career.records.games).filter(g => Object.hasOwn(g.teams, saved.career.world.protagonistSchoolId));
    assert.equal(nativeGames.length, 1, 'ONE_GAME must complete one native team game');
    assert.equal(played.recentRecords.find(r => r.label === '팀 경기')?.value, '1');
    const records = await api.decision(saveId, 'S16');
    assert.deepEqual(records.summary, played.recentRecords);
    assert.ok(played.nextActions.some(a => a.id === 'open:S16'));
    assert.equal((await api.home()).saves.find(s => s.saveId === saveId)?.title, '실제선수', 'progress must preserve the player name in the save list');
    assert.equal((await api.decision(saveId, 'S28')).options.every(o => !!o.disabledReason), true, 'unsupported later route must not offer a fictional outcome');
    const beforeUnsupported = JSON.stringify(await readState());
    await assert.rejects(api.choose(saveId, 'S28', 'to-draft', 'unsupported'));
    assert.equal(JSON.stringify(await readState()), beforeUnsupported);
    assert.equal((await app.request(`/api/saves/${saveId}/screens/S99`, { headers: { Authorization: 'Bearer dev:native-user' } })).status, 400);
    for (const path of ['career', 'screens/S06', 'screens/S16']) {
      assert.equal((await app.request(`/api/saves/${saveId}/${path}`, { headers: { Authorization: 'Bearer dev:other-user' } })).status, 404);
    }
    const exported = await app.request(`/api/saves/${saveId}/exports/chronicle`, { method: 'POST', headers: { Authorization: 'Bearer dev:native-user', 'Content-Type': 'application/json' }, body: JSON.stringify({ exportRequestId: 'native-export', format: 'JSON' }) });
    assert.equal(exported.status, 201);
    const exportFile = await exported.json() as { fileId: string };
    const exportedText = await (await app.request(`/api/files/${exportFile.fileId}/content`, { headers: { Authorization: 'Bearer dev:native-user' } })).text();
    const chronicle = JSON.parse(exportedText) as { playerDisplayName: string; moments: { rawStats: { day: number; phase: string } }[] };
    assert.equal(chronicle.playerDisplayName, '실제선수');
    assert.equal(chronicle.moments[0]!.rawStats.phase, saved.career.phaseContext.phase);
    assert.equal(chronicle.moments[0]!.rawStats.day, saved.career.days.days.at(-1)!.day);
    assert.doesNotMatch(exportedText, /"(?:seed|rng|potential|careerPeaks|world|records|career)"\s*:/);
    assert.doesNotMatch(responses.join('\n'), /"(?:seed|rng|potential|careerPeaks|world|records|career)"\s*:/, 'public DTOs never contain native state or hidden attributes');
  } finally {
    globalThis.fetch = originalFetch;
    await client.close();
  }
});


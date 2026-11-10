import { storedSave } from './stored-save.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';
import { completedHighSchoolCareer } from '../../../packages/engine/test/fixtures.js';
import type { HighSchoolCareer } from '@playball/engine';

test('school season review → route: owned commands reject forged/stale input; flow screen is public-only', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, 'school-flow');
    const headers = { Authorization: 'Bearer dev:school-flow', 'Content-Type': 'application/json' }, app = createApp({ db, auth: { allowDevBearer: true } });
    const { saveId } = await json<{ saveId: string }>(await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: 'flow-api', mode: 'CAREER' }) }));
    const source = completedHighSchoolCareer(800_000, 'HITTER');
    await db.update(gameSaves).set({ state: { schemaVersion: 1, career: source } }).where(eq(gameSaves.id, saveId));
    const path = '/api/saves/' + saveId;
    const post = (id: string, type: string, payload: Record<string, unknown>, rev = 0) => app.request(path + '/commands', { method: 'POST', headers, body: JSON.stringify({ commandId: id, expectedRevision: rev, type, payload }) });
    const screen = async () => json<{ commands: { type: string; payload: Record<string, unknown> }[]; lines: unknown[] }>(await app.request(path + '/screens/CAREER_FLOW', { headers }));

    const first = await screen();
    assert.doesNotMatch(JSON.stringify(first), /"seed"|"rng"|potential|sourceBasis/);
    assert.deepEqual(first.commands.map(c => c.type), ['CAREER_SCHOOL_ACK_SEASON_REVIEW']);
    assert.equal((await post('forged', 'CAREER_SCHOOL_ACK_SEASON_REVIEW', { careerRevision: source.revision, world: {} })).status, 400);
    assert.equal((await post('stale', 'CAREER_SCHOOL_ACK_SEASON_REVIEW', { careerRevision: source.revision - 1 })).status, 400);
    assert.equal((await post('early-route', 'CAREER_SCHOOL_OPEN_ROUTE', { careerRevision: source.revision, eventVersion: 1 })).status, 400);

    const ack = await post('ack', first.commands[0]!.type, first.commands[0]!.payload);
    assert.equal(ack.status, 200, await ack.clone().text());
    const receipt = await json<{ revision: string }>(ack);
    assert.deepEqual(await json(await post('ack', first.commands[0]!.type, first.commands[0]!.payload)), receipt, 'same command id replays the receipt');

    const second = await screen();
    assert.deepEqual(second.commands.map(c => c.type), ['CAREER_SCHOOL_OPEN_ROUTE']);
    assert.equal((await post('bad-version', 'CAREER_SCHOOL_OPEN_ROUTE', { ...second.commands[0]!.payload, eventVersion: 'x' }, Number(receipt.revision))).status, 400);
    const open = await post('open', 'CAREER_SCHOOL_OPEN_ROUTE', second.commands[0]!.payload, Number(receipt.revision));
    assert.equal(open.status, 200, await open.clone().text());
    const [row] = await storedSave(db, saveId);
    assert.equal(((row!.state as { career: HighSchoolCareer }).career).phaseContext.phase, 'CAREER_ROUTE');
    assert.deepEqual((await screen()).commands.map(c => c.type).filter(t => !t.startsWith('CAREER_COLLEGE_')), ['CAREER_KBO_ENTRY_PREPARE']);
    assert.equal((await app.request('/api/saves/' + saveId + '/screens/CAREER_FLOW', { headers: { ...headers, Authorization: 'Bearer dev:nobody' } })).status === 200, false);
  } finally { await client.close(); }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import { createTestDb, gameSaves, seedAllowedSubject } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';
import { applyEngineCommand } from '../src/engine-command.js';
import type { NativeCareerState } from '../src/native-career.js';

test('native career saves reject club commands before and after seeding without changing saved state or revision', async () => {
  const { db, client } = await createTestDb();
  try {
    await seedAllowedSubject(db, 'native-mode-owner');
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const headers = { Authorization: 'Bearer dev:native-mode-owner', 'Content-Type': 'application/json' };
    const created = await app.request('/api/game-creations', { method: 'POST', headers, body: JSON.stringify({ creationId: 'mode-guard', mode: 'CAREER', careerEngine: 'M2' }) });
    const { saveId } = await json<{ saveId: string }>(created);
    const readSave = async () => (await db.select().from(gameSaves).where(eq(gameSaves.id, saveId)))[0]!;
    const clubPayload = { worldKey: 'wrong-club-world', seed: 'wrong-club-seed', difficulty: 'REALISTIC', clubId: 'LG' };
    for (const revision of [0, 1]) {
      const before = await readSave();
      const rejected = await app.request(`/api/saves/${saveId}/commands`, { method: 'POST', headers, body: JSON.stringify({ commandId: `wrong-mode-${revision}`, expectedRevision: revision, type: 'CLUB_CREATE', payload: clubPayload }) });
      assert.equal(rejected.status, 400, 'a native career cannot acquire a club root');
      assert.equal((await json<{ code: string }>(rejected)).code, 'INVALID_REQUEST');
      assert.deepEqual(await readSave(), before, 'rejection preserves state, phase, summary and revision');
      if (revision === 0) {
        const seeded = await app.request(`/api/saves/${saveId}/commands`, { method: 'POST', headers, body: JSON.stringify({ commandId: 'seed', expectedRevision: 0, type: 'UI_SEED', payload: { name: '모드선수', kind: 'HITTER', position: 'CF', throws: 'R', bats: 'R', pitchForm: null, archetype: 'BALANCED', focus: ['CONTACT', 'POWER', 'DISCIPLINE', 'RUNNING'] } }) });
        assert.equal(seeded.status, 200);
      }
    }
    const nativeOnly = structuredClone((await readSave()).state) as NativeCareerState;
    delete nativeOnly.careerEngine;
    const before = JSON.stringify(nativeOnly);
    assert.throws(() => applyEngineCommand(nativeOnly, { commandId: 'no-marker', expectedRevision: 1, type: 'CLUB_CREATE', payload: clubPayload }), /UNSUPPORTED_COMMAND/);
    assert.equal(JSON.stringify(nativeOnly), before, 'a native root alone also blocks club dispatch');
  } finally { await client.close(); }
});

test('native pitcher creation requires a chosen secondary pitch; normal difficulty stays the approved default', () => {
  const state: NativeCareerState = { schemaVersion: 1, careerEngine: 'M2', creationId: 'pitcher', nonce: 'private-seed' };
  const payload = { name: '투수선수', kind: 'PITCHER', position: 'SP', throws: 'R', bats: 'R', pitchForm: 'OVERHAND', archetype: 'VELOCITY', focus: ['VELOCITY', 'STUFF', 'COMMAND', 'STAMINA'] };
  const command = { commandId: 'seed', expectedRevision: 0, type: 'UI_SEED', payload };
  assert.throws(() => applyEngineCommand(state, command), /SECONDARY_PITCH_REQUIRED/);
  for (const secondaryPitch of ['P01', 'NOPE']) assert.throws(() => applyEngineCommand(state, { ...command, payload: { ...payload, secondaryPitch } }));
  const next = applyEngineCommand(state, { ...command, payload: { ...payload, secondaryPitch: 'P04' } }).nextState.career!;
  assert.equal(next.difficulty, 'GROWTH');
  assert.deepEqual(next.world.repertoires[next.world.protagonistKey]!.weights, { P01: 60, P04: 40 });
  assert.equal(state.career, undefined);
});
test('M2 creation marker is persisted, validated and owner scoped; a replay cannot switch the engine', async () => {
  const { db, client } = await createTestDb();
  try {
    for (const subject of ['native-owner', 'native-other']) await seedAllowedSubject(db, subject);
    const app = createApp({ db, auth: { allowDevBearer: true } });
    const create = (subject: string, payload: unknown) => app.request('/api/game-creations', { method: 'POST', headers: { Authorization: `Bearer dev:${subject}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const input = { creationId: 'same-create', mode: 'CAREER', careerEngine: 'M2' };
    const first = await json<{ saveId: string }>(await create('native-owner', input));
    const again = await json<{ saveId: string }>(await create('native-owner', input));
    assert.equal(again.saveId, first.saveId);
    assert.doesNotMatch(JSON.stringify(again), /careerEngine|nonce|seed/);
    const other = await json<{ saveId: string }>(await create('native-other', input));
    assert.notEqual(other.saveId, first.saveId);
    const [stored] = await db.select({ state: gameSaves.state }).from(gameSaves).where(eq(gameSaves.id, first.saveId));
    assert.equal((stored!.state as { careerEngine: string }).careerEngine, 'M2');
    assert.equal((await create('native-owner', { creationId: input.creationId, mode: 'CAREER' })).status, 409);
    assert.equal((await create('native-owner', { ...input, creationId: 'bad', careerEngine: 'fictional' })).status, 400);
    assert.equal((await create('native-owner', { ...input, creationId: 'club', mode: 'CLUB' })).status, 400);
  } finally { await client.close(); }
});


import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { and, eq } from 'drizzle-orm';
import {
  authAllowedSubjects,
  commandReceipts,
  createDbFromUrl,
  gameSaves,
  M3_CORE_SQL,
  profiles,
} from '@playball/db';
import { createApp } from '../src/app.js';

function loadEnvFile(): void {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1]!;
    if (process.env[key]) continue;
    process.env[key] = m[2]!;
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
const neonReady = Boolean(databaseUrl);

test('Neon V03 unique/rollback/F08 on m3-dev', { skip: !neonReady }, async () => {
  const { pool, db } = createDbFromUrl(databaseUrl!);
  try {
    await pool.query(M3_CORE_SQL);
    const subject = `neon-${randomUUID()}`;
    const saveId = `save-${randomUUID()}`;
    await db.insert(profiles).values({ id: subject, displayName: 'Neon Tester' });
    await db.insert(authAllowedSubjects).values({ subject, status: 'ACTIVE' });
    await db.insert(gameSaves).values({
      id: saveId,
      ownerId: subject,
      mode: 'CAREER',
      revision: 0n,
      phase: 'BOOT',
      summary: {},
      state: { schemaVersion: 1, stampCount: 0 },
    });

    const app = createApp({ db });
    const auth = { Authorization: `Bearer dev:${subject}`, 'Content-Type': 'application/json' };
    const body = (commandId: string, expectedRevision: number, total = 3) => ({
      commandId,
      expectedRevision,
      type: 'ALLOCATE_DEMO',
      payload: { total, weights: [1, 1, 1], capacities: [10, 10, 10] },
    });

    const ok = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(body('neon-ok', 0)),
    });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).revision, '1');

    const replay = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(body('neon-ok', 0)),
    });
    assert.equal(replay.status, 200);

    const reused = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify(body('neon-ok', 0, 5)),
    });
    assert.equal(reused.status, 409);

    const bad = await app.request(`/api/saves/${saveId}/commands`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        commandId: 'neon-bad',
        expectedRevision: 1,
        type: 'ALLOCATE_DEMO',
        payload: { total: -1, weights: [1], capacities: [1] },
      }),
    });
    assert.equal(bad.status, 400);

    const [a, b] = await Promise.all([
      app.request(`/api/saves/${saveId}/commands`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify(body('neon-a', 1)),
      }),
      app.request(`/api/saves/${saveId}/commands`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify(body('neon-b', 1)),
      }),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);

    await db.delete(commandReceipts).where(eq(commandReceipts.saveId, saveId));
    await db.delete(gameSaves).where(eq(gameSaves.id, saveId));
    await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject, subject));
    await db.delete(profiles).where(and(eq(profiles.id, subject)));
  } finally {
    await pool.end();
  }
});

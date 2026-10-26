import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { eq } from 'drizzle-orm';
import {
  authAllowedSubjects,
  createDbFromUrl,
  gameSaves,
  M3_CORE_SQL,
  profiles,
} from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';
import { neonFetchJwt, neonSignUp } from '../src/neon-auth-client.js';

function loadEnvFile(): void {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    if (!process.env[m[1]!]) process.env[m[1]!] = m[2]!;
  }
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
const authBase =
  process.env.NEON_AUTH_BASE_URL ??
  'https://ep-nameless-hall-a14ttl1e.neonauth.ap-southeast-1.aws.neon.tech/Baseball_DB/auth';
const ready = Boolean(databaseUrl);

test('V02 Managed Auth JWT + allowlist + owner isolation', { skip: !ready }, async () => {
  const { pool, db } = createDbFromUrl(databaseUrl!);
  try {
    await pool.query(M3_CORE_SQL);
    const password = 'TestPass-m3-2026!';
    const emailA = `m3-a-${randomUUID()}@example.com`;
    const emailB = `m3-b-${randomUUID()}@example.com`;

    const a = await neonSignUp({ baseUrl: authBase, email: emailA, password, name: 'A' });
    const b = await neonSignUp({ baseUrl: authBase, email: emailB, password, name: 'B' });
    const jwtA = await neonFetchJwt({ baseUrl: authBase, cookie: a.cookie });
    const jwtB = await neonFetchJwt({ baseUrl: authBase, cookie: b.cookie });

    await db.insert(profiles).values([
      { id: a.user.id, displayName: 'A' },
      { id: b.user.id, displayName: 'B' },
    ]);
    await db.insert(authAllowedSubjects).values([
      { subject: a.user.id, status: 'ACTIVE' },
      { subject: b.user.id, status: 'ACTIVE' },
    ]);

    const app = createApp({
      db,
      auth: { neonAuthBaseUrl: authBase, allowDevBearer: false },
    });

    const denied = await app.request('/api/saves', {
      headers: { Authorization: `Bearer ${jwtA}` },
    });
    // A is allowlisted — list should work (empty ok)
    assert.equal(denied.status, 200);

    const notAllowed = await neonSignUp({
      baseUrl: authBase,
      email: `m3-x-${randomUUID()}@example.com`,
      password,
      name: 'X',
    });
    const jwtX = await neonFetchJwt({ baseUrl: authBase, cookie: notAllowed.cookie });
    const forbidden = await app.request('/api/saves', {
      headers: { Authorization: `Bearer ${jwtX}` },
    });
    assert.equal(forbidden.status, 401);
    assert.equal((await json(forbidden)).code, 'AUTH_REQUIRED');

    const createA = await app.request('/api/game-creations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ creationId: `c-${randomUUID()}`, mode: 'CAREER' }),
    });
    assert.equal(createA.status, 200);
    const created = await json<{ saveId: string }>(createA);
    assert.ok(created.saveId);

    const steal = await app.request(`/api/saves/${created.saveId}`, {
      headers: { Authorization: `Bearer ${jwtB}` },
    });
    assert.equal(steal.status, 404);
    assert.equal((await json(steal)).code, 'SAVE_NOT_FOUND');

    const own = await app.request(`/api/saves/${created.saveId}`, {
      headers: { Authorization: `Bearer ${jwtA}` },
    });
    assert.equal(own.status, 200);

    const cmd = await app.request(`/api/saves/${created.saveId}/commands`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commandId: `cmd-${randomUUID()}`,
        expectedRevision: 0,
        type: 'ALLOCATE_DEMO',
        payload: { total: 2, weights: [1, 1], capacities: [5, 5] },
      }),
    });
    assert.equal(cmd.status, 200);

    await db.delete(gameSaves).where(eq(gameSaves.ownerId, a.user.id));
    await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject, a.user.id));
    await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject, b.user.id));
    await db.delete(profiles).where(eq(profiles.id, a.user.id));
    await db.delete(profiles).where(eq(profiles.id, b.user.id));
  } finally {
    await pool.end();
  }
});

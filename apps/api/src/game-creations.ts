import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves, profiles } from '@playball/db';
import type { AppVariables } from './auth.js';

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 409,
  extra: Record<string, unknown> = {},
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId'), ...extra },
    status,
  );
}

/**
 * Minimal M3 game creation shell (78 creationId). Full career generation stays M2/M4.
 * Idempotent on owner-scoped creationId → save_${creationId}.
 */
export async function postGameCreation(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');

  let body: { creationId?: unknown; mode?: unknown };
  try {
    body = (await c.req.json()) as { creationId?: unknown; mode?: unknown };
  } catch {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }

  if (typeof body.creationId !== 'string' || body.creationId.length < 1 || body.creationId.length > 128) {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
  const mode = body.mode === 'CLUB' ? 'CLUB' : body.mode === 'CAREER' ? 'CAREER' : null;
  if (!mode) return errorBody(c, 'INVALID_REQUEST', 400);

  const saveId = `save_${body.creationId}`;

  await db.insert(profiles).values({ id: subject, displayName: subject }).onConflictDoNothing();

  const [existing] = await db
    .select({ id: gameSaves.id, revision: gameSaves.revision, mode: gameSaves.mode, phase: gameSaves.phase })
    .from(gameSaves)
    .where(eq(gameSaves.id, saveId))
    .limit(1);

  if (existing) {
    if (existing.mode !== mode) return errorBody(c, 'COMMAND_ID_REUSED', 409);
    return c.json({
      creationId: body.creationId,
      saveId: existing.id,
      revision: existing.revision.toString(),
      phase: existing.phase,
      mode: existing.mode,
    });
  }

  await db.insert(gameSaves).values({
    id: saveId,
    ownerId: subject,
    mode,
    revision: 0n,
    phase: 'BOOT',
    summary: { creationId: body.creationId },
    state: {
      schemaVersion: 1,
      stampCount: 0,
      creationId: body.creationId,
      createdWith: 'M3_SHELL',
      nonce: randomUUID(),
    },
  });

  return c.json({
    creationId: body.creationId,
    saveId,
    revision: '0',
    phase: 'BOOT',
    mode,
  });
}

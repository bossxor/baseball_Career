import { createHash, randomUUID } from 'node:crypto';
import { and, count, eq, isNull } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves, profiles } from '@playball/db';
import type { AppVariables } from './auth.js';

/** 70: one owner keeps at most this many active saves (creation and restore share the cap). */
export const ACTIVE_SAVE_CAP = 10;
const ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

/** Save ids are scoped by owner: the same client-chosen id from two users can never name one row. */
export function ownerTag(subject: string): string {
  return createHash('sha256').update(subject).digest('hex').slice(0, 12);
}
export const creationSaveId = (subject: string, creationId: string) => `save_${ownerTag(subject)}_${creationId}`;

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 409 | 422,
  extra: Record<string, unknown> = {},
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId'), ...extra },
    status,
  );
}

export async function activeSaveCount(c: Context<{ Variables: AppVariables }>): Promise<number> {
  const [row] = await c.get('db')
    .select({ n: count() })
    .from(gameSaves)
    .where(and(eq(gameSaves.ownerId, c.get('subject')), isNull(gameSaves.deletedAt)));
  return Number(row?.n ?? 0);
}

/**
 * Minimal M3 game creation shell (78 creationId). Full career generation stays M2/M4.
 * Idempotent on owner-scoped creationId; concurrent identical requests resolve to the same save.
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

  if (typeof body.creationId !== 'string' || !ID_PATTERN.test(body.creationId)) {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
  const mode = body.mode === 'CLUB' ? 'CLUB' : body.mode === 'CAREER' ? 'CAREER' : null;
  if (!mode) return errorBody(c, 'INVALID_REQUEST', 400);

  const saveId = creationSaveId(subject, body.creationId);
  const view = (row: { id: string; revision: bigint; mode: string; phase: string }) => ({
    creationId: body.creationId,
    saveId: row.id,
    revision: row.revision.toString(),
    phase: row.phase,
    mode: row.mode,
  });
  const find = async () => (await db
    .select({ id: gameSaves.id, revision: gameSaves.revision, mode: gameSaves.mode, phase: gameSaves.phase })
    .from(gameSaves)
    .where(and(eq(gameSaves.id, saveId), eq(gameSaves.ownerId, subject)))
    .limit(1))[0];

  const existing = await find();
  if (existing) {
    if (existing.mode !== mode) return errorBody(c, 'COMMAND_ID_REUSED', 409);
    return c.json(view(existing));
  }
  if ((await activeSaveCount(c)) >= ACTIVE_SAVE_CAP) return errorBody(c, 'SAVE_SLOT_REQUIRED', 422);

  await db.insert(profiles).values({ id: subject, displayName: subject }).onConflictDoNothing();
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
  }).onConflictDoNothing();

  // A concurrent identical request may have inserted first: both callers read the one row.
  const saved = await find();
  if (!saved || saved.mode !== mode) return errorBody(c, 'COMMAND_ID_REUSED', 409);
  return c.json(view(saved));
}

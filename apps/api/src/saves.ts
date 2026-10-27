import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves } from '@playball/db';
import type { AppVariables } from './auth.js';

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 404,
  extra: Record<string, unknown> = {},
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId'), ...extra },
    status,
  );
}

/** List owner saves — summary only, cursor page size 20 (06). */
/** Postgres keeps microseconds; the cursor carries them as text so no row sharing a millisecond is skipped. */
const CURSOR = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z)\|(.{1,200})$/;

export async function listSaves(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');
  const limit = 20;
  const cursor = c.req.query('cursor');
  const stamp = sql<string>`to_char(${gameSaves.updatedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

  let where = and(eq(gameSaves.ownerId, subject), isNull(gameSaves.deletedAt));
  if (cursor) {
    const m = CURSOR.exec(cursor);
    if (!m) return errorBody(c, 'INVALID_REQUEST', 400);
    where = and(where, sql`(${gameSaves.updatedAt}, ${gameSaves.id}) < (${m[1]}::timestamptz, ${m[2]})`);
  }
  const rows = await db
    .select({
      id: gameSaves.id,
      mode: gameSaves.mode,
      revision: gameSaves.revision,
      phase: gameSaves.phase,
      summary: gameSaves.summary,
      updatedAt: gameSaves.updatedAt,
      stamp,
    })
    .from(gameSaves)
    .where(where)
    .orderBy(desc(gameSaves.updatedAt), desc(gameSaves.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const nextCursor = rows.length > limit && last ? `${last.stamp}|${last.id}` : null;

  return c.json({
    items: page.map(row => ({
      id: row.id,
      mode: row.mode,
      revision: row.revision.toString(),
      phase: row.phase,
      summary: row.summary,
      updatedAt: row.updatedAt.toISOString(),
    })),
    nextCursor,
  });
}

export async function getSaveSummary(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');
  const id = c.req.param('id');
  if (!id) return errorBody(c, 'INVALID_REQUEST', 400);

  const [row] = await db
    .select({
      id: gameSaves.id,
      mode: gameSaves.mode,
      revision: gameSaves.revision,
      phase: gameSaves.phase,
      summary: gameSaves.summary,
      updatedAt: gameSaves.updatedAt,
      ownerId: gameSaves.ownerId,
      deletedAt: gameSaves.deletedAt,
    })
    .from(gameSaves)
    .where(eq(gameSaves.id, id))
    .limit(1);

  if (!row || row.deletedAt || row.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);

  return c.json({
    id: row.id,
    mode: row.mode,
    revision: row.revision.toString(),
    phase: row.phase,
    summary: row.summary,
    updatedAt: row.updatedAt.toISOString(),
  });
}

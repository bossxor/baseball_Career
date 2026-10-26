import { and, desc, eq, isNull, lt, or } from 'drizzle-orm';
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
export async function listSaves(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');
  const limit = 20;
  const cursor = c.req.query('cursor');

  const baseWhere = and(eq(gameSaves.ownerId, subject), isNull(gameSaves.deletedAt));

  let rows;
  if (cursor) {
    const [updatedAtRaw, id] = cursor.split('|');
    if (!updatedAtRaw || !id) return errorBody(c, 'INVALID_REQUEST', 400);
    const updatedAt = new Date(updatedAtRaw);
    if (Number.isNaN(updatedAt.getTime())) return errorBody(c, 'INVALID_REQUEST', 400);
    rows = await db
      .select({
        id: gameSaves.id,
        mode: gameSaves.mode,
        revision: gameSaves.revision,
        phase: gameSaves.phase,
        summary: gameSaves.summary,
        updatedAt: gameSaves.updatedAt,
      })
      .from(gameSaves)
      .where(
        and(
          baseWhere,
          or(
            lt(gameSaves.updatedAt, updatedAt),
            and(eq(gameSaves.updatedAt, updatedAt), lt(gameSaves.id, id)),
          ),
        ),
      )
      .orderBy(desc(gameSaves.updatedAt), desc(gameSaves.id))
      .limit(limit + 1);
  } else {
    rows = await db
      .select({
        id: gameSaves.id,
        mode: gameSaves.mode,
        revision: gameSaves.revision,
        phase: gameSaves.phase,
        summary: gameSaves.summary,
        updatedAt: gameSaves.updatedAt,
      })
      .from(gameSaves)
      .where(baseWhere)
      .orderBy(desc(gameSaves.updatedAt), desc(gameSaves.id))
      .limit(limit + 1);
  }

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  const nextCursor =
    rows.length > limit && last ? `${last.updatedAt.toISOString()}|${last.id}` : null;

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

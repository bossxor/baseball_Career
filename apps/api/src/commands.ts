import { and, eq, sql } from 'drizzle-orm';
import type { Context } from 'hono';
import { commandReceipts, gameSaves } from '@playball/db';
import type { AppVariables } from './auth.js';
import { requestHash } from './canonical-json.js';
import { applyEngineCommand, type CommandBody, type SaveState } from './engine-command.js';

function parseRevision(value: unknown): bigint | null {
  if (typeof value === 'bigint') return value >= 0n ? value : null;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  return null;
}

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 404 | 409 | 503,
  extra: Record<string, unknown> = {},
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId'), ...extra },
    status,
  );
}

type PgRows = { rows: Record<string, unknown>[] };

function firstRow(locked: unknown): Record<string, unknown> | undefined {
  if (locked && typeof locked === 'object' && 'rows' in locked) {
    return (locked as PgRows).rows[0];
  }
  if (Array.isArray(locked)) return locked[0] as Record<string, unknown> | undefined;
  return undefined;
}

export async function postCommand(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const saveId = c.req.param('id');
  if (!saveId || saveId.length > 128) return errorBody(c, 'INVALID_REQUEST', 400);

  let body: CommandBody;
  try {
    body = (await c.req.json()) as CommandBody;
  } catch {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
  if (
    typeof body.commandId !== 'string' ||
    body.commandId.length < 1 ||
    body.commandId.length > 128 ||
    typeof body.type !== 'string' ||
    body.type.length < 1 ||
    body.type.length > 64 ||
    body.payload === undefined
  ) {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
  const expectedRevision = parseRevision(body.expectedRevision);
  if (expectedRevision === null) return errorBody(c, 'INVALID_REQUEST', 400);

  const hash = requestHash({ type: body.type, payload: body.payload, expectedRevision });
  const subject = c.get('subject');

  try {
    return await db.transaction(async tx => {
      const locked = await tx.execute(
        sql`SELECT id, owner_id, revision, state, deleted_at FROM game_saves WHERE id = ${saveId} FOR UPDATE`,
      );
      const row = firstRow(locked);
      if (!row || row.deleted_at) return errorBody(c, 'SAVE_NOT_FOUND', 404);
      if (String(row.owner_id) !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);

      const [existing] = await tx
        .select()
        .from(commandReceipts)
        .where(and(eq(commandReceipts.saveId, saveId), eq(commandReceipts.commandId, body.commandId)))
        .limit(1);
      if (existing) {
        if (existing.requestHash !== hash) return errorBody(c, 'COMMAND_ID_REUSED', 409);
        return c.json(existing.result, 200);
      }

      const currentRevision = BigInt(String(row.revision));
      if (currentRevision !== expectedRevision) {
        return errorBody(c, 'REVISION_CONFLICT', 409, { currentRevision: currentRevision.toString() });
      }

      let applied;
      try {
        applied = applyEngineCommand((row.state as SaveState) ?? {}, body);
      } catch (err) {
        const code =
          err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : 'INVALID_REQUEST';
        return errorBody(c, code, 400);
      }

      const nextRevision = currentRevision + 1n;
      const result = {
        commandId: body.commandId,
        revision: nextRevision.toString(),
        phase: 'BOOT',
        summary: applied.summary,
        eventIds: applied.eventIds,
        nextActions: [] as string[],
        result: { gains: applied.summary.gains, discarded: applied.summary.discarded },
      };

      await tx
        .update(gameSaves)
        .set({
          revision: nextRevision,
          state: applied.nextState,
          summary: applied.summary,
          updatedAt: new Date(),
        })
        .where(eq(gameSaves.id, saveId));

      await tx.insert(commandReceipts).values({
        saveId,
        commandId: body.commandId,
        requestHash: hash,
        result,
        resultingRevision: nextRevision,
      });

      return c.json(result, 200);
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('UNIQUE')) {
      const [again] = await db
        .select()
        .from(commandReceipts)
        .where(and(eq(commandReceipts.saveId, saveId), eq(commandReceipts.commandId, body.commandId)))
        .limit(1);
      if (again && again.requestHash === hash) return c.json(again.result, 200);
      if (again) return errorBody(c, 'COMMAND_ID_REUSED', 409);
    }
    throw err;
  }
}

export async function getCommand(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const saveId = c.req.param('id');
  const commandId = c.req.param('commandId');
  if (!saveId || !commandId) return errorBody(c, 'INVALID_REQUEST', 400);
  const subject = c.get('subject');

  const [save] = await db
    .select({ ownerId: gameSaves.ownerId, deletedAt: gameSaves.deletedAt })
    .from(gameSaves)
    .where(eq(gameSaves.id, saveId))
    .limit(1);
  if (!save || save.deletedAt || save.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);

  const [receipt] = await db
    .select()
    .from(commandReceipts)
    .where(and(eq(commandReceipts.saveId, saveId), eq(commandReceipts.commandId, commandId)))
    .limit(1);
  if (!receipt) return errorBody(c, 'SAVE_NOT_FOUND', 404);
  return c.json(receipt.result, 200);
}

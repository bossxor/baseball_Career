import { and, eq, sql } from 'drizzle-orm';
import type { Context } from 'hono';
import { commandReceipts, gameSaves, readSaveState, writeSaveState } from '@playball/db';
import type { AppVariables } from './auth.js';
import { requestHash } from './canonical-json.js';
import { applyEngineCommand, type AppliedCommand, type CommandBody, type SaveState } from './engine-command.js';
import { channel } from 'node:diagnostics_channel';

const commandDiagnostic = channel('playball.command.memory');
const diagnostic = (stage:string) => { if(commandDiagnostic.hasSubscribers) commandDiagnostic.publish({stage}); };

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

export type CommandTransaction = Parameters<Parameters<AppVariables['db']['transaction']>[0]>[0];
export type CommandReceipt = {
  commandId: string; revision: string; phase: string; summary: Record<string, unknown>;
  eventIds: string[]; nextActions: string[]; next?: AppliedCommand['next'];
  result: { gains: unknown; discarded: unknown };
};
export type CommandExecutionResult =
  | { status: 200; result: CommandReceipt; replayed: boolean }
  | { status: 400 | 404 | 409; code: string; currentRevision?: string };

/** Caller owns commit/rollback. A factory reads the owned, locked state once before deriving its command. */
export async function executeCommandTransaction(tx: CommandTransaction, input: {
  saveId: string;
  subject: string;
  command: CommandBody | ((source: { state: SaveState; revision: bigint; mode: string }) => CommandBody | undefined);
  onCommit?: (tx: CommandTransaction, committed: { result: CommandReceipt; applied: AppliedCommand }) => Promise<void>;
}): Promise<CommandExecutionResult> {
  const { saveId, subject } = input;
  if (!saveId || saveId.length > 128) return { status: 400, code: 'INVALID_REQUEST' };
  diagnostic('lock-start');
  const locked = await tx.execute(
    sql`SELECT id, owner_id, mode, revision, state, state_format, deleted_at FROM game_saves WHERE id = ${saveId} FOR UPDATE`,
  );
  diagnostic('lock-return');
  const row = firstRow(locked);
  if (!row || row.deleted_at || String(row.owner_id) !== subject) return { status: 404, code: 'SAVE_NOT_FOUND' };

  const currentRevision = BigInt(String(row.revision));
  let state = {} as SaveState;
  if (typeof input.command === 'function') {
    state = (await readSaveState(tx, saveId, currentRevision, row.state, String(row.state_format)) ?? {}) as SaveState;
  }
  const body = typeof input.command === 'function'
    ? input.command({ state, revision: currentRevision, mode: String(row.mode) }) : input.command;
  if (body === undefined && typeof input.command === 'function') return { status: 400, code: 'SEASON_NOT_READY' };
  if (!validCommand(body)) return { status: 400, code: 'INVALID_REQUEST' };
  const expectedRevision = parseRevision(body.expectedRevision);
  if (expectedRevision === null) return { status: 400, code: 'INVALID_REQUEST' };
  const hash = requestHash({ type: body.type, payload: body.payload, expectedRevision });
  const [existing] = await tx.select().from(commandReceipts)
    .where(and(eq(commandReceipts.saveId, saveId), eq(commandReceipts.commandId, body.commandId))).limit(1);
  if (existing) {
    if (existing.requestHash !== hash) return { status: 409, code: 'COMMAND_ID_REUSED' };
    return { status: 200, result: existing.result as CommandReceipt, replayed: true };
  }
  if (currentRevision !== expectedRevision) {
    return { status: 409, code: 'REVISION_CONFLICT', currentRevision: currentRevision.toString() };
  }

  let applied: AppliedCommand;
  if (typeof input.command !== 'function') {
    state = (await readSaveState(tx, saveId, currentRevision, row.state, String(row.state_format)) ?? {}) as SaveState;
  }
  try {
    if ((body.type.startsWith('CAREER_SCHOOL_') || body.type.startsWith('CAREER_COLLEGE_') || body.type.startsWith('CAREER_KBO_PLAY_') || body.type.startsWith('CAREER_KBO_NATIONAL_') || body.type.startsWith('CAREER_US_NATIONAL_') || body.type.startsWith('CAREER_KBO_DEPARTURE_') || body.type.startsWith('CAREER_US_KBO_RETURN_')) && row.mode !== 'CAREER') return { status: 400, code: 'CAREER_SAVE_REQUIRED' };
    diagnostic('engine-start');
    applied = applyEngineCommand(state, body);
    diagnostic('engine-return');
  } catch (err) {
    diagnostic('engine-error');
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : 'INVALID_REQUEST';
    return { status: 400, code };
  }

  const nextRevision = currentRevision + 1n;
  const result: CommandReceipt = {
    commandId: body.commandId, revision: nextRevision.toString(), phase: applied.phase,
    summary: applied.summary, eventIds: applied.eventIds, nextActions: [],
    ...(applied.next ? { next: applied.next } : {}),
    result: { gains: applied.summary.gains, discarded: applied.summary.discarded },
  };
  diagnostic('update-start');
  const storedState = await writeSaveState(tx, saveId, nextRevision, applied.nextState);
  diagnostic('row-update-start');
  await tx.update(gameSaves).set({
    revision: nextRevision, phase: applied.phase, ...storedState,
    summary: applied.summary, updatedAt: new Date(),
  }).where(eq(gameSaves.id, saveId));
  diagnostic('update-return');
  diagnostic('receipt-start');
  await tx.insert(commandReceipts).values({ saveId, commandId: body.commandId, requestHash: hash, result, resultingRevision: nextRevision });
  diagnostic('receipt-return');
  // Bookkeeping shares the save/receipt transaction; replay never applies it twice.
  await input.onCommit?.(tx, { result, applied });
  return { status: 200, result, replayed: false };
}

function validCommand(body: unknown): body is CommandBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const command = body as CommandBody;
  return typeof command.commandId === 'string' && command.commandId.length >= 1 && command.commandId.length <= 128
    && typeof command.type === 'string' && command.type.length >= 1 && command.type.length <= 64 && command.payload !== undefined;
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
  if (!validCommand(body)) {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
  const expectedRevision = parseRevision(body.expectedRevision);
  if (expectedRevision === null) return errorBody(c, 'INVALID_REQUEST', 400);

  const hash = requestHash({ type: body.type, payload: body.payload, expectedRevision });
  const subject = c.get('subject');

  try {
    diagnostic('transaction-start');
    const response = await db.transaction(async tx => {
      const executed = await executeCommandTransaction(tx, { saveId, subject, command: body });
      if (executed.status === 200) return c.json(executed.result, 200);
      return errorBody(c, executed.code, executed.status,
        executed.currentRevision === undefined ? {} : { currentRevision: executed.currentRevision });
    });
    diagnostic('transaction-return');
    return response;
  } catch (err) {
    diagnostic('transaction-error');
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

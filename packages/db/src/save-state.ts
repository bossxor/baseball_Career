import { createHash } from 'node:crypto';
import { channel } from 'node:diagnostics_channel';
import { performance } from 'node:perf_hooks';
import { and, asc, eq, gt } from 'drizzle-orm';
import type { PlayballDb } from './client.js';
import type { TestDb } from './test-helper.js';
import { gameSaveParts } from './schema.js';
import { encodeStateParts, StateDecoder } from './state-codec.js';

type StateDb = Pick<PlayballDb | TestDb, 'select' | 'insert' | 'delete'>;
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const corrupt = (): never => { throw new Error('SAVE_STATE_CORRUPT'); };
const writeTiming = channel('playball.save-state.write-timing');

/** Caller holds the save row lock and commits the returned envelope with revision and receipt. */
export async function writeSaveState(db: StateDb, saveId: string, revision: bigint, state: unknown): Promise<{state: unknown; stateFormat: 'JSONB' | 'PARTS_V1'}> {
  const timing = writeTiming.hasSubscribers ? { codecMs: 0, hashingMs: 0, partsSqlMs: 0 } : null;
  const start = () => timing ? performance.now() : 0;
  const parts = encodeStateParts(state);
  const next = () => {
    const began = start();
    const part = parts.next();
    if (timing) timing.codecMs += performance.now() - began;
    return part;
  };
  const first = next(), second = next();
  if (first.done) corrupt();
  const deleteStarted = start();
  await db.delete(gameSaveParts).where(eq(gameSaveParts.saveId, saveId));
  if (timing) timing.partsSqlMs += performance.now() - deleteStarted;
  if (second.done) {
    if (timing) writeTiming.publish({ ...timing, stateFormat: 'JSONB' });
    return { state, stateFormat: 'JSONB' };
  }
  const total = createHash('sha256');
  let count = 0;
  const write = async (payload: string) => {
    const hashStarted = start();
    total.update(payload);
    const sha256 = hash(payload);
    if (timing) timing.hashingMs += performance.now() - hashStarted;
    const insertStarted = start();
    await db.insert(gameSaveParts).values({ saveId, revision, part: count++, payload, sha256 });
    if (timing) timing.partsSqlMs += performance.now() - insertStarted;
  };
  await write(first.value);
  await write(second.value);
  for (let part = next(); !part.done; part = next()) await write(part.value);
  const digestStarted = start();
  const sha256 = total.digest('hex');
  if (timing) {
    timing.hashingMs += performance.now() - digestStarted;
    writeTiming.publish({ ...timing, stateFormat: 'PARTS_V1' });
  }
  return { state: { $playballState: 1, revision: revision.toString(), parts: count, sha256 }, stateFormat: 'PARTS_V1' };
}

/** Caller checks ownership and keeps the row/parts at a consistent revision. */
export async function readSaveState(db: StateDb, saveId: string, revision: bigint, stored: unknown, format = 'JSONB'): Promise<unknown> {
  if (format === 'JSONB') return stored;
  if (format !== 'PARTS_V1' || !stored || typeof stored !== 'object' || !('$playballState' in stored)) corrupt();
  const envelope = stored as Record<string, unknown>;
  if (Object.keys(envelope).sort().join(',') !== '$playballState,parts,revision,sha256' || envelope.$playballState !== 1 || envelope.revision !== revision.toString() || !Number.isSafeInteger(envelope.parts) || Number(envelope.parts) < 1 || typeof envelope.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.sha256)) corrupt();
  const total = createHash('sha256'), decoder = new StateDecoder();
  let count = 0;
  for (;;) {
    const rows = await db.select().from(gameSaveParts)
      .where(and(eq(gameSaveParts.saveId, saveId), eq(gameSaveParts.revision, revision), gt(gameSaveParts.part, count - 1)))
      .orderBy(asc(gameSaveParts.part)).limit(4);
    if (!rows.length) break;
    for (const row of rows) {
      if (row.part !== count++ || hash(row.payload) !== row.sha256 || count > Number(envelope.parts)) corrupt();
      total.update(row.payload); decoder.push(row.payload);
    }
  }
  if (count !== envelope.parts || total.digest('hex') !== envelope.sha256) corrupt();
  return decoder.finish();
}

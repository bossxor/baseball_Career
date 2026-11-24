import { createHash } from 'node:crypto';
import { and, asc, desc, eq, gt } from 'drizzle-orm';
import type { Context } from 'hono';
import { deviceBackupParts, deviceBackups, profiles, StateDecoder, STATE_PART_BYTES, type DeviceBackup } from '@playball/db';
import { canonicalJson } from '@playball/engine';
import type { AppVariables } from './auth.js';

const MEDIA = 'application/x-ndjson';
const UPLOAD_LIMIT = 128 * 1024 * 1024;
const FRAME_LIMIT = 2 * STATE_PART_BYTES + 256;
const HEAD_LIMIT = 64 * 1024;
const MAX_PARTS = 2 * UPLOAD_LIMIT / STATE_PART_BYTES;
const UPLOAD_DEADLINE = 5 * 60_000;
const MAX_REVISION = 9_223_372_036_854_775_807n;
type ApiContext = Context<{ Variables: AppVariables }>;
type Tag = 'save' | 'part' | 'end';
type Frame = [Tag, unknown];
type Metadata = Pick<DeviceBackup, 'id' | 'mode' | 'revision' | 'phase' | 'summary'>;

class UploadError extends Error {
  constructor(readonly status: 400 | 408 | 413, readonly code: string) { super(code); }
}
function invalid(): never { throw new UploadError(400, 'INVALID_DEVICE_BACKUP'); }
function tooLarge(): never { throw new UploadError(413, 'DEVICE_BACKUP_TOO_LARGE'); }

function idOf(c: ApiContext) {
  const id = c.req.param('id');
  return id && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id) ? id.toLowerCase() : null;
}

function readMetadata(data: unknown, expectedId: string): Metadata {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 6) invalid();
  const { version, id, mode, revision, phase, summary } = data as Record<string, unknown>;
  if (version !== 1 || typeof id !== 'string' || id.toLowerCase() !== expectedId
    || (mode !== 'CAREER' && mode !== 'CLUB')
    || typeof revision !== 'string' || !/^[1-9]\d{0,18}$/.test(revision)
    || typeof phase !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(phase)
    || !summary || typeof summary !== 'object' || Array.isArray(summary)) invalid();
  validateSummaryJson(summary);
  if (BigInt(revision) > MAX_REVISION || Buffer.byteLength(JSON.stringify(summary)) > HEAD_LIMIT) invalid();
  return { id: expectedId, mode, revision: BigInt(revision), phase, summary: summary as Record<string, unknown> };
}

function validateSummaryJson(value: unknown, depth = 0): void {
  if (depth > 40) invalid();
  if (typeof value === 'number' && !Number.isFinite(value)) invalid();
  if (typeof value === 'string' && (value.includes('\u0000') || /[\uD800-\uDFFF]/u.test(value))) invalid();
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      validateSummaryJson(key, depth + 1);
      validateSummaryJson(child, depth + 1);
    }
  }
}

function metadataFrame(meta: Metadata) {
  return ['save', { version: 1, id: meta.id, mode: meta.mode, revision: meta.revision.toString(), phase: meta.phase, summary: meta.summary }] as const;
}

async function* uploadFrames(request: Request): AsyncGenerator<Frame> {
  if (!request.body) invalid();
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = '', received = 0, timedOut = false;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const timeout = setTimeout(() => { timedOut = true; cancel(); }, UPLOAD_DEADLINE);
  request.signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      if (timedOut) throw new UploadError(408, 'DEVICE_BACKUP_TIMEOUT');
      if (request.signal.aborted) invalid();
      const next = await reader.read().catch(() => invalid());
      if (next.done) break;
      received += next.value.byteLength;
      if (received > UPLOAD_LIMIT) tooLarge();
      try { pending += decoder.decode(next.value, { stream: true }); } catch { invalid(); }
      let offset = 0;
      for (let newline = pending.indexOf('\n'); newline >= 0; newline = pending.indexOf('\n', offset)) {
        const line = pending.slice(offset, newline);
        offset = newline + 1;
        if (!line || line.length > FRAME_LIMIT) invalid();
        let value: unknown;
        try { value = JSON.parse(line); } catch { invalid(); }
        if (!Array.isArray(value) || value.length !== 2 || !['save', 'part', 'end'].includes(value[0])) invalid();
        yield value as Frame;
      }
      pending = pending.slice(offset);
      if (pending.length > FRAME_LIMIT) invalid();
    }
    if (timedOut) throw new UploadError(408, 'DEVICE_BACKUP_TIMEOUT');
    if (request.signal.aborted) invalid();
    try { pending += decoder.decode(); } catch { invalid(); }
    if (pending) invalid();
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function postDeviceBackup(c: ApiContext) {
  const id = idOf(c);
  if (!id) return c.json({ code: 'INVALID_DEVICE_BACKUP' }, 400);
  if (c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== MEDIA) {
    return c.json({ code: 'INVALID_DEVICE_BACKUP' }, 415);
  }
  if (Number(c.req.header('Content-Length')) > UPLOAD_LIMIT) return c.json({ code: 'DEVICE_BACKUP_TOO_LARGE' }, 413);
  const ownerId = c.get('subject');
  const frames = uploadFrames(c.req.raw);
  try {
    const first = await frames.next();
    if (first.done || first.value[0] !== 'save') invalid();
    const meta = readMetadata(first.value[1], id);
    const outcome = await c.get('db').transaction(async tx => {
      const ownerBackup = and(eq(deviceBackups.ownerId, ownerId), eq(deviceBackups.id, id));
      await tx.insert(profiles).values({ id: ownerId, displayName: ownerId }).onConflictDoNothing();
      const [inserted] = await tx.insert(deviceBackups).values({ ...meta, ownerId, partCount: 0, contentHash: '' })
        .onConflictDoNothing().returning();
      const hash = createHash('sha256').update(canonicalJson(metadataFrame(meta)) + '\n');
      const validator = new StateDecoder();
      const batch: (typeof deviceBackupParts.$inferInsert)[] = [];
      let count = 0, ended = false;
      for await (const [tag, value] of frames) {
        if (ended) invalid();
        if (tag === 'end' && count > 0 && value === count) {
          ended = true;
        } else if (tag === 'part' && typeof value === 'string') {
          if (count >= MAX_PARTS) tooLarge();
          try { validator.push(value); } catch { invalid(); }
          hash.update(`${Buffer.byteLength(value)}:`).update(value);
          if (inserted) {
            batch.push({ ownerId, backupId: id, part: count, payload: value });
            if (batch.length >= 8) { await tx.insert(deviceBackupParts).values(batch); batch.length = 0; }
          }
          count++;
        } else invalid();
      }
      if (!ended) invalid();
      let state: unknown;
      try { state = validator.finish(); } catch { invalid(); }
      if (!state || typeof state !== 'object' || Array.isArray(state)) invalid();
      const record = state as Record<string, unknown>;
      const domain = record[meta.mode === 'CAREER' ? 'career' : 'club'];
      if (record.schemaVersion !== 1 || !domain || typeof domain !== 'object' || Array.isArray(domain)) invalid();

      const contentHash = hash.digest('hex');
      if (inserted) {
        if (batch.length) await tx.insert(deviceBackupParts).values(batch);
        await tx.update(deviceBackups).set({ partCount: count, contentHash }).where(ownerBackup);
        return 'created';
      }
      const [stored] = await tx.select({ hash: deviceBackups.contentHash }).from(deviceBackups).where(ownerBackup);
      return stored?.hash === contentHash ? 'replayed' : 'conflict';
    });
    if (outcome === 'conflict') return c.json({ code: 'DEVICE_BACKUP_CONFLICT' }, 409);
    return c.json({ id }, outcome === 'created' ? 201 : 200);
  } catch (err) {
    if (err instanceof UploadError) return c.json({ code: err.code }, err.status);
    throw err;
  } finally {
    await frames.return(undefined);
  }
}

export async function listDeviceBackups(c: ApiContext) {
  const records = await c.get('db').select({
    id: deviceBackups.id, mode: deviceBackups.mode, revision: deviceBackups.revision,
    phase: deviceBackups.phase, summary: deviceBackups.summary, createdAt: deviceBackups.createdAt,
  }).from(deviceBackups).where(eq(deviceBackups.ownerId, c.get('subject')))
    .orderBy(desc(deviceBackups.createdAt), asc(deviceBackups.id));
  c.header('Cache-Control', 'private, no-store');
  return c.json({ items: records.map(record => ({ ...record, revision: record.revision.toString(), createdAt: record.createdAt.toISOString() })) });
}

export async function getDeviceBackupContent(c: ApiContext) {
  const id = idOf(c);
  if (!id) return c.json({ code: 'DEVICE_BACKUP_NOT_FOUND' }, 404);
  const db = c.get('db'), ownerId = c.get('subject');
  const [record] = await db.select().from(deviceBackups)
    .where(and(eq(deviceBackups.ownerId, ownerId), eq(deviceBackups.id, id)));
  if (!record || record.partCount === 0) return c.json({ code: 'DEVICE_BACKUP_NOT_FOUND' }, 404);
  const { id: backupId, partCount, contentHash } = record;
  const head = metadataFrame(record);
  async function* downloadFrames() {
    const hash = createHash('sha256').update(canonicalJson(head) + '\n');
    yield head;
    let cursor = -1;
    while (cursor + 1 < partCount) {
      const batch = await db.select({ part: deviceBackupParts.part, payload: deviceBackupParts.payload }).from(deviceBackupParts)
        .where(and(eq(deviceBackupParts.ownerId, ownerId), eq(deviceBackupParts.backupId, backupId), gt(deviceBackupParts.part, cursor)))
        .orderBy(asc(deviceBackupParts.part)).limit(8);
      if (!batch.length) throw new Error('DEVICE_BACKUP_CORRUPT');
      for (const { part, payload } of batch) {
        if (part !== cursor + 1 || part >= partCount) throw new Error('DEVICE_BACKUP_CORRUPT');
        cursor = part;
        hash.update(`${Buffer.byteLength(payload)}:`).update(payload);
        yield ['part', payload];
      }
    }
    if (hash.digest('hex') !== contentHash) throw new Error('DEVICE_BACKUP_CORRUPT');
    yield ['end', partCount];
  }
  const frames = downloadFrames();
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({
    async pull(controller) {
      const next = await frames.next();
      if (next.done) controller.close();
      else controller.enqueue(encoder.encode(JSON.stringify(next.value) + '\n'));
    },
    async cancel() { await frames.return(undefined); },
  }), { headers: {
    'Content-Type': MEDIA + '; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  } });
}

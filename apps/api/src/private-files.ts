/** M7 private file / backup shell (V04 slice). No public share URLs; owner-only download + content hash. */
import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves, privateFiles } from '@playball/db';
import type { AppVariables } from './auth.js';

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 403 | 404,
  extra: Record<string, unknown> = {},
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId'), ...extra },
    status,
  );
}

function sha256Hex(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

function safeFileName(raw: string): string {
  const cleaned = [...raw.normalize('NFC')]
    .map(ch => {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 32 || '\\/:*?"<>|'.includes(ch)) return '_';
      return ch;
    })
    .join('')
    .trim();
  const base = cleaned.length ? cleaned.slice(0, 80) : 'backup';
  return base.endsWith('.json') ? base : `${base}.json`;
}

async function loadOwnedSave(c: Context<{ Variables: AppVariables }>, saveId: string) {
  const db = c.get('db');
  const subject = c.get('subject');
  const [row] = await db
    .select({
      id: gameSaves.id,
      ownerId: gameSaves.ownerId,
      deletedAt: gameSaves.deletedAt,
      revision: gameSaves.revision,
      phase: gameSaves.phase,
      state: gameSaves.state,
      summary: gameSaves.summary,
    })
    .from(gameSaves)
    .where(eq(gameSaves.id, saveId))
    .limit(1);
  if (!row || row.deletedAt || row.ownerId !== subject) return null;
  return row;
}

function metaOf(row: typeof privateFiles.$inferSelect) {
  return {
    fileId: row.id,
    saveId: row.saveId,
    kind: row.kind,
    status: row.status,
    mime: row.mime,
    byteSize: row.byteSize,
    contentHash: row.contentHash,
    fileName: row.fileName,
    requestId: row.requestId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

/** POST /api/saves/:id/backups — snapshot current save state; same requestId is idempotent. */
export async function postBackup(c: Context<{ Variables: AppVariables }>) {
  const saveId = c.req.param('id');
  if (!saveId) return errorBody(c, 'INVALID_REQUEST', 400);
  const body = (await c.req.json().catch(() => null)) as { requestId?: string; displayName?: string } | null;
  const requestId = body?.requestId?.trim();
  if (!requestId || requestId.length > 128) return errorBody(c, 'INVALID_REQUEST', 400);

  const save = await loadOwnedSave(c, saveId);
  if (!save) return errorBody(c, 'SAVE_NOT_FOUND', 404);

  const db = c.get('db');
  const subject = c.get('subject');
  const [prior] = await db
    .select()
    .from(privateFiles)
    .where(and(eq(privateFiles.ownerId, subject), eq(privateFiles.requestId, requestId)))
    .limit(1);
  if (prior) {
    if (prior.saveId !== saveId || prior.kind !== 'BACKUP') return errorBody(c, 'REQUEST_ID_CONFLICT', 400);
    return c.json(metaOf(prior));
  }

  const snapshot = {
    schemaVersion: 1,
    kind: 'BACKUP' as const,
    saveId: save.id,
    revision: save.revision.toString(),
    phase: save.phase,
    summary: save.summary,
    state: save.state,
    capturedAt: new Date().toISOString(),
  };
  const payload = `${JSON.stringify(snapshot)}\n`;
  const contentHash = sha256Hex(payload);
  const fileName = safeFileName(body?.displayName ?? `다시플레이볼_백업_${saveId.slice(0, 8)}`);
  const id = randomUUID();
  const [row] = await db
    .insert(privateFiles)
    .values({
      id,
      ownerId: subject,
      saveId: save.id,
      kind: 'BACKUP',
      status: 'READY',
      mime: 'application/json; charset=utf-8',
      byteSize: Buffer.byteLength(payload, 'utf8'),
      contentHash,
      body: payload,
      fileName,
      requestId,
    })
    .returning();
  return c.json(metaOf(row!), 201);
}

/** GET /api/saves/:id/backups */
export async function listBackups(c: Context<{ Variables: AppVariables }>) {
  const saveId = c.req.param('id');
  if (!saveId) return errorBody(c, 'INVALID_REQUEST', 400);
  const save = await loadOwnedSave(c, saveId);
  if (!save) return errorBody(c, 'SAVE_NOT_FOUND', 404);

  const db = c.get('db');
  const ready = await db
    .select()
    .from(privateFiles)
    .where(and(eq(privateFiles.saveId, saveId), eq(privateFiles.kind, 'BACKUP'), eq(privateFiles.status, 'READY')))
    .orderBy(desc(privateFiles.createdAt))
    .limit(20);
  return c.json({ items: ready.map(metaOf) });
}

async function loadOwnedFile(c: Context<{ Variables: AppVariables }>, fileId: string) {
  const db = c.get('db');
  const subject = c.get('subject');
  const [row] = await db.select().from(privateFiles).where(eq(privateFiles.id, fileId)).limit(1);
  if (!row) return { missing: true as const };
  if (row.ownerId !== subject) return { forbidden: true as const };
  if (row.status !== 'READY') return { missing: true as const };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return { missing: true as const };
  return { row };
}

/** GET /api/files/:fileId — metadata only */
export async function getFileMeta(c: Context<{ Variables: AppVariables }>) {
  const fileId = c.req.param('fileId');
  if (!fileId) return errorBody(c, 'INVALID_REQUEST', 400);
  const found = await loadOwnedFile(c, fileId);
  if ('forbidden' in found) return errorBody(c, 'FORBIDDEN', 403);
  if ('missing' in found) return errorBody(c, 'FILE_NOT_FOUND', 404);
  return c.json(metaOf(found.row));
}

/** GET /api/files/:fileId/content — private download; X-Content-SHA256 for V04 hash check */
export async function downloadFile(c: Context<{ Variables: AppVariables }>) {
  const fileId = c.req.param('fileId');
  if (!fileId) return errorBody(c, 'INVALID_REQUEST', 400);
  const found = await loadOwnedFile(c, fileId);
  if ('forbidden' in found) return errorBody(c, 'FORBIDDEN', 403);
  if ('missing' in found) return errorBody(c, 'FILE_NOT_FOUND', 404);
  const row = found.row;
  const liveHash = sha256Hex(row.body);
  if (liveHash !== row.contentHash) return errorBody(c, 'BACKUP_INTEGRITY_ERROR', 400);

  const asciiFallback = row.fileName.replace(/[^\x20-\x7E]/g, '_') || 'backup.json';
  const encoded = encodeURIComponent(row.fileName);
  c.header('Content-Type', row.mime);
  c.header('Cache-Control', 'private, no-store');
  c.header('X-Content-SHA256', row.contentHash);
  c.header('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`);
  return c.body(row.body);
}

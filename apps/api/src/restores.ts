/** M7 restore preview + activate (70 shell). New saveId; source backup unchanged. */
import { createHash, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves, privateFiles, profiles } from '@playball/db';
import type { AppVariables } from './auth.js';
import { ACTIVE_SAVE_CAP, activeSaveCount, ownerTag } from './game-creations.js';
import { cleanId } from './private-files.js';

const SUPPORTED_SCHEMA = 1;

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 403 | 404 | 422,
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

type BackupPayload = {
  schemaVersion?: number;
  kind?: string;
  saveId?: string;
  mode?: string;
  revision?: string;
  phase?: string;
  summary?: unknown;
  state?: unknown;
};

async function loadOwnedBackup(c: Context<{ Variables: AppVariables }>, backupId: string) {
  const db = c.get('db');
  const subject = c.get('subject');
  const [row] = await db.select().from(privateFiles).where(eq(privateFiles.id, backupId)).limit(1);
  if (!row) return { missing: true as const };
  if (row.ownerId !== subject) return { forbidden: true as const };
  if (row.kind !== 'BACKUP' || row.status !== 'READY') return { missing: true as const };
  if (sha256Hex(row.body) !== row.contentHash) return { corrupt: true as const };
  let parsed: BackupPayload;
  try {
    parsed = JSON.parse(row.body) as BackupPayload;
  } catch {
    return { corrupt: true as const };
  }
  return { row, parsed };
}

/** POST /api/restores/preview */
export async function previewRestore(c: Context<{ Variables: AppVariables }>) {
  const body = (await c.req.json().catch(() => null)) as { backupId?: string } | null;
  const backupId = cleanId(body?.backupId);
  if (!backupId) return errorBody(c, 'INVALID_REQUEST', 400);

  const found = await loadOwnedBackup(c, backupId);
  if ('forbidden' in found) return errorBody(c, 'FORBIDDEN', 403);
  if ('missing' in found) return errorBody(c, 'FILE_NOT_FOUND', 404);
  if ('corrupt' in found) return errorBody(c, 'BACKUP_INTEGRITY_ERROR', 400);

  const schemaVersion = found.parsed.schemaVersion ?? 0;
  const supported = schemaVersion === SUPPORTED_SCHEMA;
  const used = await activeSaveCount(c);
  const blockingReasons: string[] = [];
  if (!supported) blockingReasons.push('UNSUPPORTED_BACKUP_VERSION');
  if (used >= ACTIVE_SAVE_CAP) blockingReasons.push('SAVE_SLOT_REQUIRED');

  return c.json({
    backupId,
    contentHash: found.row.contentHash,
    supportedVersions: [SUPPORTED_SCHEMA],
    schemaVersion,
    targetSlotAvailable: used < ACTIVE_SAVE_CAP,
    estimatedRows: 1,
    attachmentsStatus: 'NONE',
    sourceSaveId: found.parsed.saveId ?? found.row.saveId,
    sourceRevision: found.parsed.revision ?? null,
    blockingReasons,
  });
}

/** POST /api/restores — create a new save from READY backup; never mutates source. */
export async function postRestore(c: Context<{ Variables: AppVariables }>) {
  const body = (await c.req.json().catch(() => null)) as {
    restoreRequestId?: string;
    backupId?: string;
    backupHash?: string;
    displayName?: string;
  } | null;
  const restoreRequestId = cleanId(body?.restoreRequestId);
  const backupId = cleanId(body?.backupId);
  const backupHash = cleanId(body?.backupHash, 64);
  const displayName = typeof body?.displayName === 'string' ? body.displayName.slice(0, 200) : null;
  if (!restoreRequestId || !backupId || !backupHash) return errorBody(c, 'INVALID_REQUEST', 400);

  const found = await loadOwnedBackup(c, backupId);
  if ('forbidden' in found) return errorBody(c, 'FORBIDDEN', 403);
  if ('missing' in found) return errorBody(c, 'FILE_NOT_FOUND', 404);
  if ('corrupt' in found) return errorBody(c, 'BACKUP_INTEGRITY_ERROR', 400);
  if (found.row.contentHash !== backupHash) return errorBody(c, 'BACKUP_INTEGRITY_ERROR', 400);

  const schemaVersion = found.parsed.schemaVersion ?? 0;
  if (schemaVersion !== SUPPORTED_SCHEMA) {
    return errorBody(c, 'UNSUPPORTED_BACKUP_VERSION', 422);
  }

  const db = c.get('db');
  const subject = c.get('subject');
  // Owner-scoped: another user's request id can never name this save.
  const targetSaveId = `save_restore_${ownerTag(subject)}_${restoreRequestId}`;

  const [existing] = await db.select({ id: gameSaves.id, state: gameSaves.state }).from(gameSaves).where(and(eq(gameSaves.id, targetSaveId), eq(gameSaves.ownerId, subject))).limit(1);
  if (existing) {
    // The same request id must mean the same restore.
    if ((existing.state as { restoredFromBackupId?: string } | null)?.restoredFromBackupId !== backupId) return errorBody(c, 'REQUEST_ID_CONFLICT', 400);
    return c.json({
      restoreRequestId,
      status: 'ACTIVATED',
      targetSaveId: existing.id,
      sourceBackupId: backupId,
    });
  }

  const used = await activeSaveCount(c);
  if (used >= ACTIVE_SAVE_CAP) return errorBody(c, 'SAVE_SLOT_REQUIRED', 422);

  await db.insert(profiles).values({ id: subject, displayName: subject }).onConflictDoNothing();

  const phase = typeof found.parsed.phase === 'string' ? found.parsed.phase : 'BOOT';
  const rawRevision = found.parsed.revision ?? '0';
  if (typeof rawRevision !== 'string' || !/^\d{1,18}$/.test(rawRevision)) return errorBody(c, 'BACKUP_INTEGRITY_ERROR', 400);
  const revision = BigInt(rawRevision);
  // Backups made before the mode field existed restore as career saves.
  const mode = found.parsed.mode === 'CLUB' ? 'CLUB' : 'CAREER';
  const summary =
    found.parsed.summary && typeof found.parsed.summary === 'object'
      ? { ...(found.parsed.summary as Record<string, unknown>), restoredFrom: backupId, displayName }
      : { restoredFrom: backupId, displayName };
  const state =
    found.parsed.state && typeof found.parsed.state === 'object'
      ? { ...(found.parsed.state as Record<string, unknown>), restoredFromBackupId: backupId, restoreRequestId }
      : { schemaVersion: 1, restoredFromBackupId: backupId, restoreRequestId };

  await db.insert(gameSaves).values({
    id: targetSaveId,
    ownerId: subject,
    mode,
    revision,
    phase,
    summary,
    state,
  }).onConflictDoNothing();

  return c.json({
    restoreRequestId,
    status: 'ACTIVATED',
    targetSaveId,
    sourceBackupId: backupId,
    revision: revision.toString(),
    phase,
    nonce: randomUUID(),
  }, 201);
}

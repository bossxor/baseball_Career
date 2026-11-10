import { and, eq, isNull } from 'drizzle-orm';
import { gameSaves, readSaveState } from '@playball/db';
import type { AuthDb } from './auth.js';

/** Keep the save row and its parts at one revision while an owner-only reader hydrates them. */
export async function readOwnedSave(db: AuthDb, subject: string, id: string) {
  return db.transaction(async tx => {
    const [row] = await tx.select().from(gameSaves)
      .where(and(eq(gameSaves.id, id), eq(gameSaves.ownerId, subject), isNull(gameSaves.deletedAt)))
      .limit(1).for('share');
    if (!row) return null;
    return { ...row, state: await readSaveState(tx, row.id, row.revision, row.state, row.stateFormat) };
  });
}

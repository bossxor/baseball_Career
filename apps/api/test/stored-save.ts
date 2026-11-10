import { eq } from 'drizzle-orm';
import { gameSaves, readSaveState } from '@playball/db';
import type { AuthDb } from '../src/auth.js';

/** Test inspection uses the same storage decoder as HTTP; raw state may now be an envelope. */
export async function storedSave(db: AuthDb, id: string) {
  return db.transaction(async tx => {
    const rows = await tx.select().from(gameSaves).where(eq(gameSaves.id, id)).limit(1).for('share');
    const row = rows[0];
    return row ? [{ ...row, state: await readSaveState(tx, row.id, row.revision, row.state, row.stateFormat) }] : [];
  });
}

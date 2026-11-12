import { eq } from 'drizzle-orm';
import { gameSaves, readSaveState } from '@playball/db';
import type { TestDb } from '@playball/db';

/** Saves above the inline limit are stored in bounded parts; tests must read the decoded state, not the envelope. */
export async function loadState(db: TestDb['db'], saveId: string): Promise<{ career: any }> {
  const [row] = await db.select().from(gameSaves).where(eq(gameSaves.id, saveId));
  return (await readSaveState(db, saveId, row!.revision, row!.state, row!.stateFormat)) as { career: any };
}

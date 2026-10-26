import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { M3_CORE_SQL } from './migrate-sql.js';
import * as schema from './schema.js';

export type TestDb = PgliteDatabase<typeof schema>;

export async function createTestDb(): Promise<{ client: PGlite; db: TestDb }> {
  const client = new PGlite();
  await client.exec(M3_CORE_SQL);
  const db = drizzle(client, { schema });
  return { client, db };
}

export async function seedAllowedSubject(
  db: TestDb,
  subject: string,
  displayName = 'Tester',
): Promise<void> {
  await db.insert(schema.profiles).values({ id: subject, displayName }).onConflictDoNothing();
  await db
    .insert(schema.authAllowedSubjects)
    .values({ subject, status: 'ACTIVE' })
    .onConflictDoNothing();
}

export async function seedSave(
  db: TestDb,
  input: {
    id: string;
    ownerId: string;
    mode?: 'CAREER' | 'CLUB';
    revision?: bigint;
    state?: Record<string, unknown>;
    phase?: string;
  },
): Promise<void> {
  await db.insert(schema.gameSaves).values({
    id: input.id,
    ownerId: input.ownerId,
    mode: input.mode ?? 'CAREER',
    revision: input.revision ?? 0n,
    phase: input.phase ?? 'BOOT',
    summary: {},
    state: input.state ?? { schemaVersion: 1, stampCount: 0 },
  });
}

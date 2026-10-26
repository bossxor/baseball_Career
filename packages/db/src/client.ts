import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export type PlayballDb = NodePgDatabase<typeof schema>;

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10 });
}

export function createDb(pool: pg.Pool): PlayballDb {
  return drizzle(pool, { schema });
}

export function createDbFromUrl(connectionString: string): { pool: pg.Pool; db: PlayballDb } {
  const pool = createPool(connectionString);
  return { pool, db: createDb(pool) };
}

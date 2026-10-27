import { readFileSync } from 'node:fs';
import pg from 'pg';
import { M3_CORE_SQL } from '@playball/db';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
const url = env.DATABASE_URL_DIRECT || env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL missing');

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await pool.query(M3_CORE_SQL);
  const r = await pool.query(
    `SELECT tablename FROM pg_tables
     WHERE schemaname='public'
       AND tablename IN ('profiles','game_saves','command_receipts','auth_allowed_subjects','private_files')
     ORDER BY 1`,
  );
  console.log(r.rows.map(x => x.tablename).join(','));
} finally {
  await pool.end();
}

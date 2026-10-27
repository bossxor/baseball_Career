import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { RULES_VERSION } from '@playball/rules';
import type { AuthDb, AppVariables, AuthOptions } from './auth.js';
import { createRequireAuth } from './auth.js';
import { getCommand, postCommand } from './commands.js';
import { postGameCreation } from './game-creations.js';
import { getCareer, getScreen } from './career-views.js';
import { getSaveSummary, listSaves } from './saves.js';
import { downloadFile, getFileMeta, listBackups, postBackup, postChronicleExport } from './private-files.js';
import { postRestore, previewRestore } from './restores.js';

/** Public ops surface — no secrets / connection strings. */
export const APP_VERSION = '0.1.0';
export const SCHEMA_VERSION = 1;
export const MIN_CLIENT_VERSION = '0.1.0';

export type CreateAppOptions = {
  db?: AuthDb;
  auth?: AuthOptions;
  /** Extra browser origins allowed to call the API (comma list in CORS_ORIGINS). */
  corsOrigins?: readonly string[];
};

/** The Android shell serves the app from these origins (Capacitor androidScheme https / capacitor scheme). */
const NATIVE_ORIGINS = ['https://localhost', 'capacitor://localhost'];

export function createApp(options: CreateAppOptions = {}) {
  const authOptions: AuthOptions = {
    allowDevBearer: options.auth?.allowDevBearer ?? process.env.AUTH_MODE === 'dev',
  };
  const neonAuthBaseUrl = options.auth?.neonAuthBaseUrl ?? process.env.NEON_AUTH_BASE_URL;
  if (neonAuthBaseUrl) authOptions.neonAuthBaseUrl = neonAuthBaseUrl;
  const requireAuth = createRequireAuth(authOptions);

  const app = new Hono<{ Variables: AppVariables }>();

  const allowed = new Set([
    ...NATIVE_ORIGINS,
    ...(options.corsOrigins ?? (process.env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)),
  ]);
  // Before auth: a preflight carries no credentials. Unknown origins get no CORS headers at all.
  app.use('/api/*', cors({
    origin: origin => (allowed.has(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type', 'Request-ID'],
    exposeHeaders: ['X-Content-SHA256', 'Content-Disposition', 'Request-ID'],
    maxAge: 600,
  }));

  app.use('*', async (c, next) => {
    c.set('requestId', c.req.header('Request-ID') ?? crypto.randomUUID());
    if (options.db) c.set('db', options.db);
    await next();
  });

  app.get('/api/health', c =>
    c.json({
      status: 'ok',
      service: 'playball-api',
      rulesVersion: RULES_VERSION,
      auth: authOptions.neonAuthBaseUrl ? 'neon' : authOptions.allowDevBearer ? 'dev' : 'none',
    }),
  );

  app.get('/api/version', c =>
    c.json({
      app: APP_VERSION,
      api: APP_VERSION,
      rulesVersion: RULES_VERSION,
      schemaVersion: SCHEMA_VERSION,
      minClientVersion: MIN_CLIENT_VERSION,
    }),
  );

  app.get('/api/ready', async c => {
    const db = c.get('db');
    if (!db) {
      return c.json({ status: 'not_ready', reason: 'db.unavailable' }, 503);
    }
    try {
      await db.execute(sql`SELECT 1 AS ok`);
      await db.execute(sql`SELECT 1 FROM game_saves LIMIT 0`);
      return c.json({ status: 'ready', schemaCompatible: true });
    } catch {
      return c.json({ status: 'not_ready', reason: 'db.query_failed' }, 503);
    }
  });

  const protectedRoutes = new Hono<{ Variables: AppVariables }>();
  protectedRoutes.use('*', async (c, next) => {
    if (!c.get('db')) {
      return c.json(
        { code: 'SERVICE_UNAVAILABLE', messageKey: 'db.unavailable', requestId: c.get('requestId') },
        503,
      );
    }
    return requireAuth(c, next);
  });
  protectedRoutes.post('/game-creations', postGameCreation);
  protectedRoutes.get('/saves', listSaves);
  protectedRoutes.get('/saves/:id/career', getCareer);
  protectedRoutes.get('/saves/:id/screens/:screenId', getScreen);
  protectedRoutes.get('/saves/:id', getSaveSummary);
  protectedRoutes.post('/saves/:id/commands', postCommand);
  protectedRoutes.get('/saves/:id/commands/:commandId', getCommand);
  protectedRoutes.post('/saves/:id/backups', postBackup);
  protectedRoutes.get('/saves/:id/backups', listBackups);
  protectedRoutes.post('/saves/:id/exports/chronicle', postChronicleExport);
  protectedRoutes.get('/files/:fileId', getFileMeta);
  protectedRoutes.get('/files/:fileId/content', downloadFile);
  protectedRoutes.post('/restores/preview', previewRestore);
  protectedRoutes.post('/restores', postRestore);
  app.route('/api', protectedRoutes);

  app.notFound(c => c.json({ code: 'NOT_FOUND' }, 404));
  app.onError((error, c) => {
    // Operators need the cause; the client only gets the request id (no message, no stack).
    console.error(JSON.stringify({ level: 'error', requestId: c.get('requestId'), message: error instanceof Error ? error.message : String(error) }));
    return c.json({ code: 'INTERNAL_ERROR', requestId: c.get('requestId') }, 500);
  });
  return app;
}

export const app = createApp();

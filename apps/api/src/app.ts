import { Hono } from 'hono';
import { RULES_VERSION } from '@playball/rules';
import type { AuthDb, AppVariables, AuthOptions } from './auth.js';
import { createRequireAuth } from './auth.js';
import { getCommand, postCommand } from './commands.js';
import { postGameCreation } from './game-creations.js';
import { getCareer, getScreen } from './career-views.js';
import { getSaveSummary, listSaves } from './saves.js';

export type CreateAppOptions = {
  db?: AuthDb;
  auth?: AuthOptions;
};

export function createApp(options: CreateAppOptions = {}) {
  const authOptions: AuthOptions = {
    allowDevBearer: options.auth?.allowDevBearer ?? process.env.AUTH_MODE === 'dev',
  };
  const neonAuthBaseUrl = options.auth?.neonAuthBaseUrl ?? process.env.NEON_AUTH_BASE_URL;
  if (neonAuthBaseUrl) authOptions.neonAuthBaseUrl = neonAuthBaseUrl;
  const requireAuth = createRequireAuth(authOptions);

  const app = new Hono<{ Variables: AppVariables }>();

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
  app.route('/api', protectedRoutes);

  app.notFound(c => c.json({ code: 'NOT_FOUND' }, 404));
  app.onError((_error, c) => c.json({ code: 'INTERNAL_ERROR' }, 500));
  return app;
}

export const app = createApp();

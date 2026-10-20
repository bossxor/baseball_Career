import { Hono } from 'hono';
import { RULES_VERSION } from '@playball/rules';

export const app = new Hono();

// Liveness only. This does not claim database/auth/game readiness.
app.get('/api/health', c => c.json({ status: 'ok', service: 'playball-api', rulesVersion: RULES_VERSION }));
app.notFound(c => c.json({ code: 'NOT_FOUND' }, 404));
app.onError((_error, c) => c.json({ code: 'INTERNAL_ERROR' }, 500));

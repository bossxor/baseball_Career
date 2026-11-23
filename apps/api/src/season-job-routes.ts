import type { Context } from 'hono';
import type { AppVariables } from './auth.js';
import { readSeasonJob, startSeasonJob } from './season-jobs.js';

type ApiContext = Context<{ Variables: AppVariables }>;

export async function postSeasonJob(c: ApiContext) {
  let body: { requestId?: unknown; expectedRevision?: unknown } | null = null;
  try { body = await c.req.json(); } catch { /* rejected below */ }
  if (typeof body?.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.requestId) ||
      typeof body.expectedRevision !== 'string' || !/^\d{1,19}$/.test(body.expectedRevision)) {
    return c.json({ code: 'INVALID_REQUEST' }, 400);
  }
  const id = c.req.param('id');
  if (!id) return c.json({ code: 'INVALID_REQUEST' }, 400);
  const result = await startSeasonJob(c.get('db'), c.get('subject'), id, body.requestId, BigInt(body.expectedRevision));
  if (result.status !== 200) return c.json({ code: result.code }, result.status);
  return c.json(result.job, 200);
}

export async function getSeasonJob(c: ApiContext) {
  const id = c.req.param('id');
  if (!id) return c.json({ code: 'INVALID_REQUEST' }, 400);
  const result = await readSeasonJob(c.get('db'), c.get('subject'), id);
  return result ? c.json(result, 200) : c.json({ code: 'SAVE_NOT_FOUND' }, 404);
}

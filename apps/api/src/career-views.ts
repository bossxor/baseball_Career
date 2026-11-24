import { readOwnedSave } from './save-state.js';
import type { Context } from 'hono';
import type { AppVariables } from './auth.js';
import type { UiShellState } from './ui-shell.js';
import { gameCareerView, gameScreenView } from './game-view-projections.js';

function errorBody(
  c: Context<{ Variables: AppVariables }>,
  code: string,
  status: 400 | 404,
) {
  return c.json(
    { code, messageKey: code.toLowerCase().replaceAll('_', '.'), requestId: c.get('requestId') },
    status,
  );
}

export async function getCareer(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');
  const id = c.req.param('id');
  if (!id) return errorBody(c, 'INVALID_REQUEST', 400);

  const row = await readOwnedSave(db, subject, id);

  if (!row || row.deletedAt || row.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);
  try {
    return c.json(gameCareerView(row.id, (row.state as UiShellState) ?? { schemaVersion: 1 }, row.revision.toString()));
  } catch {
    return errorBody(c, 'INVALID_REQUEST', 400);
  }
}

export async function getScreen(c: Context<{ Variables: AppVariables }>) {
  const db = c.get('db');
  const subject = c.get('subject');
  const id = c.req.param('id');
  const screenId = c.req.param('screenId');
  if (!id || !screenId) return errorBody(c, 'INVALID_REQUEST', 400);

  const row = await readOwnedSave(db, subject, id);

  if (!row || row.deletedAt || row.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);
  const state = (row.state as UiShellState) ?? { schemaVersion: 1 };
  try {
    return c.json(gameScreenView(row.id, state, row.revision.toString(), screenId, c.req.query()));
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : 'INVALID_REQUEST';
    return errorBody(c, code, 400);
  }
}

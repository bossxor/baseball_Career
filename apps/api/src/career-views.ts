import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves } from '@playball/db';
import type { AppVariables } from './auth.js';
import { CLUB_SCREEN_IDS } from '@playball/engine';
import { clubScreenOf } from './club-shell.js';
import { careerView, decisionView } from './ui-shell.js';
import { nativeCareerView, nativeDecisionView, type NativeCareerState } from './native-career.js';

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

  const [row] = await db
    .select({
      id: gameSaves.id,
      ownerId: gameSaves.ownerId,
      deletedAt: gameSaves.deletedAt,
      revision: gameSaves.revision,
      state: gameSaves.state,
    })
    .from(gameSaves)
    .where(eq(gameSaves.id, id))
    .limit(1);

  if (!row || row.deletedAt || row.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);
  try {
    const state = (row.state as NativeCareerState) ?? { schemaVersion: 1 };
    const view = state.career ? nativeCareerView(row.id, state.career) : careerView(row.id, state);
    return c.json({ ...view, revision: row.revision.toString() });
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

  const [row] = await db
    .select({
      id: gameSaves.id,
      ownerId: gameSaves.ownerId,
      deletedAt: gameSaves.deletedAt,
      state: gameSaves.state,
    })
    .from(gameSaves)
    .where(eq(gameSaves.id, id))
    .limit(1);

  if (!row || row.deletedAt || row.ownerId !== subject) return errorBody(c, 'SAVE_NOT_FOUND', 404);
  const state = (row.state as NativeCareerState) ?? { schemaVersion: 1 };
  try {
    if (state.career) return c.json(nativeDecisionView(row.id, state.career, screenId));
    if ((CLUB_SCREEN_IDS as readonly string[]).includes(screenId)) {
      const playerKey = c.req.query('playerKey'), gameKey = c.req.query('gameKey');
      return c.json(clubScreenOf(state, screenId, {
        ...(playerKey ? { playerKey } : {}),
        ...(gameKey ? { gameKey } : {}),
      }));
    }
    return c.json(decisionView(row.id, state, screenId));
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : 'INVALID_REQUEST';
    return errorBody(c, code, 400);
  }
}

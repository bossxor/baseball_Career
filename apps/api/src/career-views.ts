import {kboRecruitmentScreen} from './career-kbo-entry-shell.js';
import {schoolCareerScreen,schoolCareerHome} from './career-school-shell.js';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { gameSaves } from '@playball/db';
import type { AppVariables } from './auth.js';
import { CLUB_SCREEN_IDS } from '@playball/engine';
import { clubScreenOf } from './club-shell.js';
import { RETRY_SCREEN_IDS, retryScreenOf } from './career-retry-shell.js';
import { CAREER_CHOICE_SCREEN_IDS, careerChoiceScreen } from './career-choice-shell.js';
import { US_RETURN_SCREEN_IDS, usReturnScreen } from './career-us-return-shell.js';
import { US_MILITARY_SCREEN_IDS, usMilitaryScreen } from './career-us-military-shell.js';
import { usPlayScreen } from './career-us-play-shell.js';
import { proEventsScreen } from './career-pro-events-shell.js';
import { careerSupportScreen, careerHonorsScreen } from './career-support-shell.js';
import { relationScreen } from './career-relations-shell.js';
import { proRetirementScreen } from './career-pro-retirement-shell.js';
import { careerView, decisionView, type UiShellState } from './ui-shell.js';

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
    const state=(row.state as UiShellState)??{schemaVersion:1},owner=state.career as {schemaVersion?:number;world?:{schools?:unknown;leagueKey?:unknown}}|undefined;
    const view = owner?.schemaVersion===1&&Array.isArray(owner.world?.schools)&&owner.world?.leagueKey===undefined?schoolCareerHome(row.id,state):careerView(row.id,state);
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
  const state = (row.state as UiShellState) ?? { schemaVersion: 1 };
  try {
    if ((CLUB_SCREEN_IDS as readonly string[]).includes(screenId)) {
      const playerKey = c.req.query('playerKey'), gameKey = c.req.query('gameKey');
      return c.json(clubScreenOf(state, screenId, {
        ...(playerKey ? { playerKey } : {}),
        ...(gameKey ? { gameKey } : {}),
      }));
    }
    if ((RETRY_SCREEN_IDS as readonly string[]).includes(screenId)) return c.json(retryScreenOf(state, screenId));
    if ((US_RETURN_SCREEN_IDS as readonly string[]).includes(screenId)) return c.json(usReturnScreen(state, screenId));
    if ((US_MILITARY_SCREEN_IDS as readonly string[]).includes(screenId)) return c.json(usMilitaryScreen(state, screenId));
    if(screenId==='SCHOOL_CAREER')return c.json(schoolCareerScreen(state));
    if(screenId==='KBO_RECRUITMENT')return c.json(kboRecruitmentScreen(state));
    if (screenId==='US_CAREER') return c.json(usPlayScreen(state));
    if (screenId==='CAREER_PRO_RETIREMENT' || screenId==='CAREER_PRO_ARCHIVE') return c.json(proRetirementScreen(state,screenId));
    if (screenId==='PRO_EVENTS') return c.json(proEventsScreen(state));
    if (screenId==='CAREER_HONORS') return c.json(careerHonorsScreen(state));
    if (screenId==='CAREER_GOALS' || screenId==='CAREER_AGENT') return c.json(careerSupportScreen(state,screenId));
    if (screenId==='CAREER_RELATIONS' || screenId==='CAREER_RELATION_DETAIL') return c.json(relationScreen(state,screenId,c.req.query()));
    if ((CAREER_CHOICE_SCREEN_IDS as readonly string[]).includes(screenId)) return c.json(careerChoiceScreen(state, screenId));
    return c.json(decisionView(row.id, state, screenId));
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : 'INVALID_REQUEST';
    return errorBody(c, code, 400);
  }
}

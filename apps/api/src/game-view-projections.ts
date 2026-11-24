import {kboRecruitmentScreen} from './career-kbo-entry-shell.js';
import {schoolCareerScreen,schoolCareerHome} from './career-school-shell.js';
import {usCareerHome} from './career-us-flow.js';
import {careerFlowScreen,kboCareerHome,collegeCareerHome} from './career-flow-screen.js';
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
import { careerSeasonReview } from './career-season-review.js';
import { retirementSummary } from './career-retirement-summary.js';
import { isUsAmateurReturn,usReturnHome } from './career-us-return-flow.js';
import { isUsReturnRetry } from './career-us-return-retry-shell.js';
import { usReturnRetryHome } from './career-us-return-retry-flow.js';

export function gameCareerView(id:string, state:UiShellState, revision:string) {
    const owner=state.career as {schemaVersion?:number;world?:{schools?:unknown;leagueKey?:unknown}}|undefined;
    const view = isUsReturnRetry(state.career)?usReturnRetryHome(id,state.career):isUsAmateurReturn(state.career)?usReturnHome(id,state.career):owner?.schemaVersion===1&&Array.isArray(owner.world?.schools)&&owner.world?.leagueKey===undefined?schoolCareerHome(id,state):owner?.world?.leagueKey==='COLLEGE'||owner?.world?.leagueKey==='INDEPENDENT'?collegeCareerHome(id,state):owner&&'protagonistOrganizationId' in owner?usCareerHome(id,state):owner&&'protagonistClubId' in owner?kboCareerHome(id,state):careerView(id,state);
    return { ...view, revision };
}

export function gameScreenView(id:string, state:UiShellState, revision:string, screenId:string, query:Record<string,string>={}) {
    if ((CLUB_SCREEN_IDS as readonly string[]).includes(screenId)) {
      const { playerKey, gameKey } = query;
      return clubScreenOf(state, screenId, {
        ...(playerKey ? { playerKey } : {}),
        ...(gameKey ? { gameKey } : {}),
      });
    }
    if ((RETRY_SCREEN_IDS as readonly string[]).includes(screenId)) return retryScreenOf(state, screenId);
    if ((US_RETURN_SCREEN_IDS as readonly string[]).includes(screenId)) return usReturnScreen(state, screenId);
    if ((US_MILITARY_SCREEN_IDS as readonly string[]).includes(screenId)) return usMilitaryScreen(state, screenId);
    if(screenId==='SCHOOL_CAREER')return schoolCareerScreen(state);
    if(screenId==='CAREER_FLOW'){
      const flow=careerFlowScreen(state),retirement=retirementSummary(state);
      return {...flow,saveRevision:revision,...(retirement?{title:'은퇴 기록',notice:retirement.notice,commands:[...flow.commands,...retirement.commands],retirementSummary:retirement.summary}:{}),seasonReview:careerSeasonReview(state)};
    }
    if(screenId==='KBO_RECRUITMENT')return kboRecruitmentScreen(state);
    if (screenId==='US_CAREER') return usPlayScreen(state);
    if (screenId==='CAREER_PRO_RETIREMENT' || screenId==='CAREER_PRO_ARCHIVE') return proRetirementScreen(state,screenId);
    if (screenId==='PRO_EVENTS') return proEventsScreen(state);
    if (screenId==='CAREER_HONORS') return careerHonorsScreen(state);
    if (screenId==='CAREER_GOALS' || screenId==='CAREER_AGENT') return careerSupportScreen(state,screenId);
    if (screenId==='CAREER_RELATIONS' || screenId==='CAREER_RELATION_DETAIL') return relationScreen(state,screenId,query);
    if ((CAREER_CHOICE_SCREEN_IDS as readonly string[]).includes(screenId)) return careerChoiceScreen(state, screenId);
    return decisionView(id, state, screenId);
}

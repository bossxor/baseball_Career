import {applyKboEntry} from './career-kbo-entry-shell.js';
import {applyUsEntry} from './career-us-entry-shell.js';
import {applyAmateurPreparation} from './career-amateur-preparation-shell.js';
import {applySchoolCareer} from './career-school-shell.js';
import {applyUsNational} from './career-us-national-shell.js';
import {applyKboNational} from './career-pro-national-shell.js';
import {applyKboPlay} from './career-kbo-play-shell.js';
import {applyCollege} from './career-college-shell.js';
import { allocateCapped, ENGINE_VERSION } from '@playball/engine';
import { applyClubSave } from './club-shell.js';
import { applyCareerRetry } from './career-retry-shell.js';
import { applyCareerChoice } from './career-choice-shell.js';
import { applyUsReturn } from './career-us-return-shell.js';
import { applyUsMilitary } from './career-us-military-shell.js';
import { applyUsPlay } from './career-us-play-shell.js';
import { applyProEvent } from './career-pro-events-shell.js';
import { applyCareerSupport } from './career-support-shell.js';
import { applyRelationChoice } from './career-relations-shell.js';
import { applyProRetirement } from './career-pro-retirement-shell.js';
import {
  applyUiAdvance, applyUiChoose, applyUiSeed, phaseOf, type ChooseNext, type UiShellState,
} from './ui-shell.js';

export type SaveState = UiShellState;

export type CommandBody = {
  commandId: string;
  expectedRevision: number | string;
  type: string;
  payload: unknown;
};

export type AppliedCommand = {
  nextState: SaveState;
  summary: Record<string, unknown>;
  eventIds: string[];
  phase: string;
  next?: ChooseNext;
};

/** ALLOCATE_DEMO (M3 E2E) + UI_SEED/ADVANCE/CHOOSE (M4 shell over the same pipeline). */
export function applyEngineCommand(state: SaveState, command: CommandBody): AppliedCommand {
  if (command.type.startsWith('CAREER_AMATEUR_PREP_')) return applyAmateurPreparation(state, command);
  if (command.type.startsWith('CAREER_US_ENTRY_')) return applyUsEntry(state, command);
  if(command.type.startsWith('CAREER_SCHOOL_'))return applySchoolCareer(state,command);
  if(command.type.startsWith('CAREER_US_NATIONAL_'))return applyUsNational(state,command);
  if(command.type.startsWith('CAREER_KBO_NATIONAL_'))return applyKboNational(state,command);
  if(command.type.startsWith('CAREER_KBO_PLAY_'))return applyKboPlay(state,command);
  if(command.type.startsWith('CAREER_COLLEGE_'))return applyCollege(state,command);
  if(command.type.startsWith('CAREER_KBO_ENTRY_'))return applyKboEntry(state,command);
  if (command.type.startsWith('CAREER_PRO_RETIRE_')) return applyProRetirement(state, command);
  if (command.type.startsWith('CAREER_RELATIONS_')) return applyRelationChoice(state, command);
  if (command.type.startsWith('CAREER_HONOR_') || command.type.startsWith('CAREER_GOALS_') || command.type.startsWith('CAREER_AGENT_')) return applyCareerSupport(state, command);
  if (command.type.startsWith('CAREER_PRO_EVENT_')) return applyProEvent(state, command);
  if (command.type.startsWith('CAREER_US_PLAY_')) return applyUsPlay(state, command);
  if (command.type.startsWith('CAREER_US_MILITARY_')) return applyUsMilitary(state, command);
  if (command.type.startsWith('CAREER_US_RETURN_')) return applyUsReturn(state, command);
  if (command.type.startsWith('CLUB_')) return applyClubSave(state, command);
  if (command.type.startsWith('CAREER_RETRY_')) return applyCareerRetry(state, command);
  if (command.type.startsWith('CAREER_CHOICE_')) return applyCareerChoice(state, command);
  if (command.type === 'UI_SEED') {
    const applied = applyUiSeed(state, command.payload);
    return { ...applied, eventIds: [], phase: phaseOf(applied.nextState) };
  }
  if (command.type === 'UI_ADVANCE') {
    const applied = applyUiAdvance(state, command.payload);
    return { ...applied, eventIds: [], phase: phaseOf(applied.nextState) };
  }
  if (command.type === 'UI_CHOOSE') {
    const applied = applyUiChoose(state, command.payload);
    return { ...applied, eventIds: [], phase: phaseOf(applied.nextState) };
  }
  if (command.type !== 'ALLOCATE_DEMO') {
    throw Object.assign(new Error('UNSUPPORTED_COMMAND'), { code: 'INVALID_REQUEST' });
  }
  const payload = command.payload as {
    total?: unknown;
    weights?: unknown;
    capacities?: unknown;
  };
  if (
    typeof payload?.total !== 'number' ||
    !Array.isArray(payload.weights) ||
    !Array.isArray(payload.capacities) ||
    !payload.weights.every((n): n is number => typeof n === 'number') ||
    !payload.capacities.every((n): n is number => typeof n === 'number')
  ) {
    throw Object.assign(new Error('INVALID_PAYLOAD'), { code: 'INVALID_REQUEST' });
  }
  const result = allocateCapped(payload.total, payload.weights, payload.capacities);
  const stampCount = (typeof state.stampCount === 'number' ? state.stampCount : 0) + 1;
  const nextState: SaveState = {
    ...state,
    schemaVersion: state.schemaVersion ?? 1,
    stampCount,
    lastAllocation: { gains: result.gains, discarded: result.discarded },
    engineVersion: ENGINE_VERSION,
  };
  return {
    nextState,
    summary: { type: 'ALLOCATE_DEMO', stampCount, gains: result.gains, discarded: result.discarded },
    eventIds: [],
    phase: phaseOf(nextState),
  };
}

import { allocateCapped, ENGINE_VERSION } from '@playball/engine';
import { applyClubSave } from './club-shell.js';
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
  if (command.type.startsWith('CLUB_')) return applyClubSave(state, command);
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

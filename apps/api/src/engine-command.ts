import { allocateCapped, ENGINE_VERSION } from '@playball/engine';

export type SaveState = {
  schemaVersion?: number;
  stampCount?: number;
  lastAllocation?: { gains: number[]; discarded: number };
  engineVersion?: string;
  [key: string]: unknown;
};

export type CommandBody = {
  commandId: string;
  expectedRevision: number | string;
  type: string;
  payload: unknown;
};

/** One engine path for M3 E2E: allocateCapped demo stamp. */
export function applyEngineCommand(
  state: SaveState,
  command: CommandBody,
): { nextState: SaveState; summary: Record<string, unknown>; eventIds: string[] } {
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
  };
}

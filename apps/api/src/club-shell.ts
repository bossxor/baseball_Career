import { applyKboClubCommand, kboClubScreen, type ClubScreenView } from '@playball/engine';
import type { KboClubGame } from '@playball/engine';
import type { AppliedCommand, CommandBody, SaveState } from './engine-command.js';

function codeOf(err: unknown): never {
  const code = err instanceof Error ? err.message : 'INVALID_REQUEST';
  throw Object.assign(new Error(code), { code });
}

export function readClubGame(state: SaveState): KboClubGame | null {
  const club = state.club;
  if (!club || typeof club !== 'object') return null;
  return club as KboClubGame;
}

/** Stores the club game on the save document. Save revision stays the M3 receipt revision. */
export function applyClubSave(state: SaveState, command: CommandBody): AppliedCommand {
  let next: KboClubGame;
  try {
    next = applyKboClubCommand(readClubGame(state), { type: command.type, payload: command.payload });
  } catch (err) {
    codeOf(err);
  }
  return {
    nextState: { ...state, schemaVersion: state.schemaVersion ?? 1, club: next! },
    summary: { type: command.type, clubId: next!.userClubId, seasonKey: next!.world.seasonKey, phase: next!.phase, gameRevision: next!.revision },
    eventIds: [],
    phase: next!.phase,
  };
}

export function clubScreenOf(state: SaveState, screenId: string, query: { playerKey?: string; gameKey?: string }): ClubScreenView {
  const game = readClubGame(state);
  if (!game || game.schemaVersion !== 1) codeOf(new Error('CLUB_NOT_CREATED'));
  try {
    return kboClubScreen(game!, screenId, query);
  } catch (err) {
    codeOf(err);
  }
}

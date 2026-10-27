import type { Difficulty } from '@playball/rules';
import type { KboClubGame } from './kbo-club-game.js';
import { createKboClubGame } from './kbo-club-game.js';
import { advanceKboClubGame, startKboClubSeason } from './kbo-club-progress.js';

/** 73: the twelve planned runs. A row here is not a passing balance result. */
export const CLUB_LONG_RUN_PLAN = [
  ['L01', '진출/출장/성장/은퇴분포'],
  ['L02', '6능력·구종XP/보직/부상/노쇠'],
  ['L03', 'softmax/조건특성·구종/효과방향'],
  ['L04', '계약/선수공급/자연왕조·침체/구단비용'],
  ['L05', '원본hash/역할claim/리그왜곡을사용자설정효과로구분'],
  ['L06', '유한원장/정원/퇴단P수혜출처/소속기간성장배율'],
  ['L07', '읽기보관/통계·원본삭제0'],
  ['L08', 'clip/분배/허위상승0'],
  ['L09', '효과1회/old generation보존'],
  ['L10', '복귀/예산/출장동시성'],
  ['L11', 'simulationKey/RNG/논리결과동일'],
  ['L12', '게임resultHash/원장변화0'],
] as const;

export type ClubLongRunId = (typeof CLUB_LONG_RUN_PLAN)[number][0];
export type ClubLongReport = 'PLANNED' | 'RUNNING' | 'INCONCLUSIVE';

export interface ClubLongCheckpoint {
  schemaVersion: 1;
  runId: ClubLongRunId;
  seed: string;
  clubId: string;
  difficulty: Difficulty;
  /** 73 L04 asks for 50 seasons. This checkpoint does not claim that count. */
  seasonsTarget: 50;
  seasonsClosed: number;
  gamesPlayed: number;
  report: ClubLongReport;
  balance: 'INCONCLUSIVE';
  game: KboClubGame;
}

const IDS = new Set<string>(CLUB_LONG_RUN_PLAN.map(([id]) => id));
function fail(code: string): never { throw new RangeError(code); }

/** L04 is the club-season run this loop can store. The other eleven stay planned. */
export function openClubLongRun(input: { runId: string; seed: string; clubId: string; difficulty: Difficulty }): ClubLongCheckpoint {
  if (!IDS.has(input.runId)) fail('UNKNOWN_LONG_RUN');
  if (input.runId !== 'L04') fail('LONG_RUN_NOT_WIRED');
  if (typeof input.seed !== 'string' || input.seed.length < 1 || input.seed.length > 64) fail('INVALID_KBO_CLUB_GAME');
  const game = createKboClubGame({ worldKey: 'kbo-club-long-l04', seed: input.seed, clubId: input.clubId, difficulty: input.difficulty });
  return {
    schemaVersion: 1, runId: 'L04', seed: input.seed, clubId: input.clubId, difficulty: input.difficulty,
    seasonsTarget: 50, seasonsClosed: 0, gamesPlayed: 0, report: 'RUNNING', balance: 'INCONCLUSIVE', game,
  };
}

/** maxDays 0 stores the same games. A played chunk stays INCONCLUSIVE: 73 forbids treating a fixture as PASSED. */
export function stepClubLongRun(source: ClubLongCheckpoint, maxDays: number): ClubLongCheckpoint {
  if (source.schemaVersion !== 1 || source.balance !== 'INCONCLUSIVE') fail('LONG_RUN_NOT_JUDGED');
  if (!Number.isSafeInteger(maxDays) || maxDays < 0 || maxDays > 7) fail('INVALID_ADVANCE_DAYS');
  const next = structuredClone(source);
  if (maxDays === 0) return next;
  let game = next.game;
  if (game.phase === 'PRESEASON_SETUP') game = startKboClubSeason(game, game.revision);
  if (game.phase === 'SEASON_PROGRESS') game = advanceKboClubGame(game, game.revision, maxDays).game;
  next.game = game;
  next.gamesPlayed = Object.keys(game.records.games).length;
  next.report = 'RUNNING';
  next.balance = 'INCONCLUSIVE';
  return next;
}

export function encodeClubLongCheckpoint(source: ClubLongCheckpoint): string {
  if (source.balance !== 'INCONCLUSIVE') fail('LONG_RUN_NOT_JUDGED');
  return JSON.stringify(source);
}

export function decodeClubLongCheckpoint(json: string): ClubLongCheckpoint {
  const value = JSON.parse(json) as ClubLongCheckpoint;
  if (value?.schemaVersion !== 1 || value.runId !== 'L04' || value.balance !== 'INCONCLUSIVE' || value.report === undefined) fail('LONG_RUN_NOT_JUDGED');
  if ((value as { report: string }).report === 'PASSED') fail('LONG_RUN_NOT_JUDGED');
  return value;
}

import type { ActiveKboRosterWorld } from './kbo-career-entry.js';
import type { KboClubGame } from './kbo-club-game.js';
import { selectSangmuCohort } from './kbo-sangmu.js';
import { emptySangmuUnit, enlistSangmuCohort } from './kbo-sangmu-unit.js';
import { validateClubLineup } from './kbo-club-game.js';

/** 68 weights. They do not change ability or the shared free-agent accept odds. */
export const CLUB_STRATEGY_WEIGHTS = {
  DEVELOPMENT: { role: 0.4, outlook: 0.4, need: 0.2, recommendYears: 3 },
  BALANCED: { role: 0.6, outlook: 0.2, need: 0.2, recommendYears: 4 },
  CONTEND: { role: 0.7, outlook: 0.1, need: 0.2, recommendYears: 2 },
} as const;
export type ClubStrategy = keyof typeof CLUB_STRATEGY_WEIGHTS;
const ORDER = ['DEVELOPMENT', 'BALANCED', 'CONTEND'] as const;

function fnv(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

/** D: the design fixes the choice to the world seed and does not give a draw table. */
export function initialClubStrategy(seed: string, worldKey: string, clubId: string): ClubStrategy {
  return ORDER[fnv(JSON.stringify(['club-strategy', seed, worldKey, clubId])) % 3]!;
}

/** One offseason review. No closed rank, or no core age, keeps the seed strategy. Bottom 3 is rank 8–10 of 10 clubs. */
export function nextClubStrategy(current: ClubStrategy, ranks: readonly number[], coreAge: number | null): ClubStrategy {
  if (ranks.length < 1 || coreAge === null) return current;
  const last = ranks[ranks.length - 1]!;
  if (last <= 3 && coreAge <= 32) return 'CONTEND';
  const lastTwo = ranks.slice(-2);
  if ((lastTwo.length === 2 && lastTwo.every(rank => rank >= 8)) || coreAge >= 33) return 'DEVELOPMENT';
  return 'BALANCED';
}

export type ClubEra = 'EVALUATING' | 'PEAK' | 'SLUMP';

/** 68: before three closed seasons the label is EVALUATING. A year with no decisions stays null and is not a .000 rate. */
export function clubEraLabel(rows: readonly { rank: number; postseason: boolean; winRate: number | null }[]): ClubEra {
  if (rows.length < 3) return 'EVALUATING';
  const last = rows.slice(-3);
  if (last.every(row => row.rank >= 8)) return 'SLUMP';
  const decided = last.flatMap(row => row.winRate === null ? [] : [row.winRate]);
  if (last.filter(row => row.postseason).length >= 2 && decided.length > 0 && decided.reduce((sum, rate) => sum + rate, 0) / decided.length >= 0.55) return 'PEAK';
  return 'EVALUATING';
}

export function clubStrategyReport(world: Pick<ActiveKboRosterWorld, 'seed' | 'worldKey' | 'clubs'>) {
  return world.clubs.map(club => {
    const strategy = initialClubStrategy(world.seed, world.worldKey, club.id);
    return { clubId: club.id, strategy, weights: CLUB_STRATEGY_WEIGHTS[strategy], era: 'EVALUATING' as const };
  });
}

/** After enlistment, the watch reads the unit. Before that it previews the existing intake and moves nobody. */
export function clubMilitaryWatch(game: Pick<KboClubGame, 'world' | 'records' | 'health' | 'userClubId' | 'sangmu'>) {
  const seasonKey = game.world.seasonKey;
  if (game.sangmu?.enlistedSeasons.includes(seasonKey)) {
    return {
      seasonKey, enlisted: true,
      mine: Object.values(game.sangmu.members).filter(member => member.program.originalClubId === game.userClubId).map(member => member.program.playerKey).sort(),
    };
  }
  const selection = selectSangmuCohort({ world: game.world, records: game.records, health: game.health, seasonKey });
  return { seasonKey, enlisted: false, mine: selection.selected.filter(player => player.clubId === game.userClubId).map(player => player.playerKey).sort() };
}

/** One intake per season, via the career enlistment. Serving players leave the club roster. Return after two blocks stays on that unit. */
export function enlistClubMilitary(source: KboClubGame, expectedRevision: number): KboClubGame {
  if (source.schemaVersion !== 1 || source.revision !== expectedRevision) throw new RangeError('CLUB_GAME_REVISION_CHANGED');
  if (source.phase === 'SEASON_PROGRESS' || source.phase === 'POSTSEASON_PROGRESS') throw new RangeError('SANGMU_SEASON_LOCKED');
  const game = structuredClone(source);
  const selection = selectSangmuCohort({ world: game.world, records: game.records, health: game.health, seasonKey: game.world.seasonKey });
  game.sangmu = enlistSangmuCohort(game.world, game.sangmu ?? emptySangmuUnit(), selection);
  if (game.lineup && validateClubLineup(game, game.lineup.draft).length) delete game.lineup;
  game.revision++;
  return game;
}

/** Windows already on the season calendar. Club games are not played inside them here. */
export function clubInternationalWindows(game: Pick<KboClubGame, 'world'>) {
  return game.world.calendar.international.map(window => ({ type: window.type, startDay: window.startDay, endDay: window.endDay }));
}

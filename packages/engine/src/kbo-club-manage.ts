import { KBO_MONEY, KBO_ROSTER_LIMITS } from '@playball/rules';
import type { KboClubGame } from './kbo-club-game.js';
import { kboClubRosterIssues, validateClubLineup } from './kbo-club-game.js';
import { kboFreeAgentTerms } from './kbo-contract-value.js';
import { recordTotals } from './records.js';

const assertRevision = (g: KboClubGame, expected: number) => { if (g.schemaVersion !== 1 || g.revision !== expected) throw new RangeError('CLUB_GAME_REVISION_CHANGED'); };

/** S14 승강: the manager sets the 28-man first team from my club's roster. Structure must hold (28, pitchers 10..15, two catchers,
 * every fielding position); injured players may stay on it. Only between games (preseason or no pending game). A stored lineup
 * that no longer fits is dropped, never silently changed. */
export function setKboClubFirstTeam(source: KboClubGame, expectedRevision: number, firstTeam: readonly string[]): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase === 'SEASON_REVIEW' || (source.phase === 'SEASON_PROGRESS' && source.progress?.pendingGame)) throw new RangeError('CLUB_FIRST_TEAM_LOCKED');
  const game = structuredClone(source), club = game.world.clubs.find(c => c.id === game.userClubId)!;
  if (firstTeam.length !== KBO_ROSTER_LIMITS.firstTeam || new Set(firstTeam).size !== firstTeam.length || firstTeam.some(k => !club.roster.includes(k))) throw new RangeError('INVALID_CLUB_FIRST_TEAM');
  club.firstTeam = [...firstTeam].sort();
  if (kboClubRosterIssues(game).some(i => i !== 'FIRST_TEAM_INJURED')) throw new RangeError('INVALID_CLUB_FIRST_TEAM');
  if (game.lineup && validateClubLineup(game, game.lineup.draft).length) delete game.lineup;
  game.revision++;
  return game;
}

export interface ClubOffer { playerKey: string; annualSalaryWon: number; years: number }
/** S17 읽기: the free agents with their 08 terms (value ×1.2, age-based length) from last season's official lines. */
export function kboClubFreeAgents(game: Pick<KboClubGame, 'freeAgents' | 'records' | 'world'>) {
  const totals = recordTotals(game.records, { leagueKey: 'KBO', phase: 'REGULAR', seasonKey: game.world.seasonKey });
  return Object.entries(game.freeAgents.players).sort(([a], [b]) => (a < b ? -1 : 1)).map(([playerKey, e]) => {
    const t = kboFreeAgentTerms(e.player, totals.batting[playerKey], totals.pitching[playerKey]);
    return { playerKey, name: e.player.name, kind: e.player.kind, position: e.player.position, age: e.player.age, injured: !!e.injury, origin: e.origin, desiredAnnualSalaryWon: t.annualSalaryWon, desiredYears: t.years };
  });
}
/** Up to three offers for the coming free-agent rounds. They are used by the next offseason (the AI runs my club only when no plan
 * exists); each round resolves with the shared 40 odds, and an offer the club cannot afford then is dropped by the market. */
export function planKboClubOffers(source: KboClubGame, expectedRevision: number, offers: readonly ClubOffer[]): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || !source.seasonClose) throw new RangeError('CLUB_OFFERS_NOT_OPEN');
  if (offers.length > 3 || new Set(offers.map(o => o.playerKey)).size !== offers.length) throw new RangeError('INVALID_CLUB_OFFERS');
  for (const o of offers) {
    if (!Object.hasOwn(source.freeAgents.players, o.playerKey) || !Number.isSafeInteger(o.annualSalaryWon) || o.annualSalaryWon % 10_000 !== 0 || o.annualSalaryWon < KBO_MONEY.minimumSalaryWon || o.annualSalaryWon > KBO_MONEY.maximumSalaryWon || !Number.isInteger(o.years) || o.years < 1 || o.years > 4) throw new RangeError('INVALID_CLUB_OFFERS');
  }
  const game = structuredClone(source);
  if (offers.length) game.offerPlan = offers.map(o => ({ ...o })); else delete game.offerPlan;
  game.revision++;
  return game;
}

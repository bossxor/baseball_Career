import type { KboClubGame } from './kbo-club-game.js';
import { closeSeasonHealth } from './health.js';
import { closeKboNpcSeasons } from './kbo-year-end.js';
import { settleKboFreeAgentSeason, nextKboFreeAgentYear } from './kbo-free-agents.js';
import { retireKboOverAgeNpcs } from './kbo-retirement.js';
import { KBO_MAX_PLAYER_AGE } from './kbo-year-transition.js';
import { schoolYearEndRepertoire } from './college-entry.js';
import { emptyPitchXpLedger } from './pitch-xp.js';
import { kboRosterSeasonCharge } from './kbo-finance.js';
import { createSeasonCalendar } from './season-calendar.js';
import { prepareKboAiRenewals } from './kbo-ai-offseason.js';
import { runKboAiFreeAgentMarket } from './kbo-fa-market.js';
import { repairKboDualLeagueRosters } from './kbo-roster-repair.js';
import { draftKboRookieClass } from './kbo-supply.js';
import { leagueStandings } from './standings.js';
import { assertKboRecruitmentWorld } from './kbo-draft.js';
import { createKboSeasonSchedules } from './kbo-schedule.js';

const assertRevision = (g: KboClubGame, expected: number) => { if (g.schemaVersion !== 1 || g.revision !== expected) throw new RangeError('CLUB_GAME_REVISION_CHANGED'); };

/** SEASON_REVIEW → closed season (once): health is closed, every player of the league (my club included) grows and ages from the
 * natural PRO period over the official regular appearances, and the free-agent pool settles. Age, contracts and the next season
 * open in `startNextKboClubSeason`. */
export function closeKboClubSeason(source: KboClubGame, expectedRevision: number): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || source.seasonClose || !source.days) throw new RangeError('INVALID_CLUB_SEASON_CLOSE');
  const game = structuredClone(source), season = game.world.seasonKey;
  game.health = closeSeasonHealth(game.health, season).ledger;
  const npc = closeKboNpcSeasons({ world: game.world, records: game.records, health: game.health, days: game.days!, difficulty: game.difficulty, protagonistKey: '' }, new Set());
  game.world.players = npc.players;
  game.freeAgents = settleKboFreeAgentSeason(game.freeAgents, game.world.calendar, game.difficulty);
  game.seasonClose = { receiptKey: JSON.stringify(['kbo-club-season-close', game.world.worldKey, season]), seasonKey: season, npcGrowth: npc.results };
  game.revision++;
  return game;
}

/** The whole league's offseason in one atomic result (72, club mode): ages +1 and contract roll, 45-year retirements, AI
 * renewals, the three free-agent rounds (my club uses the offers the manager planned; without a plan the AI runs it), the yearly
 * rookie draft, roster repair that also re-selects every first team, new calendar and schedule. */
export function startNextKboClubSeason(source: KboClubGame, expectedRevision: number): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || !source.seasonClose || source.seasonClose.seasonKey !== source.world.seasonKey) throw new RangeError('CLUB_SEASON_NOT_CLOSED');
  const season = source.world.seasonKey, target = String(Number(season) + 1), calendar = createSeasonCalendar(Number(target));
  if (Object.values(source.records.games).some(g => g.scope.seasonKey === target)) throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
  const game = structuredClone(source);
  let world = game.world;
  const overAge = Object.keys(world.players).filter(k => world.players[k]!.age + 1 > KBO_MAX_PLAYER_AGE).sort();
  const retired = retireKboOverAgeNpcs(world, overAge, season, true);
  if (retired.length) game.retiredPlayers = [...(source.retiredPlayers ?? []), ...retired];
  for (const r of retired) delete game.health.injuries[r.playerKey];
  const expiring: string[] = [];
  for (const k of Object.keys(world.players).sort()) {
    const c = world.contracts[k]!, contractYear = Number(target) - Number(c.seasonKey) + 1, expired = contractYear > c.years;
    world.players[k] = { ...world.players[k]!, age: world.players[k]!.age + 1, fatigue: 0 };
    world.contracts[k] = { ...c, seasonKey: target, years: expired ? 1 : c.years - (contractYear - 1) };
    if (expired) expiring.push(k);
    const book = schoolYearEndRepertoire(source, k);
    if (book) world.repertoires[k] = { ...structuredClone(book), seasonId: target, usedWindows: [], learning: null, ledger: emptyPitchXpLedger() };
  }
  for (const club of world.clubs) { club.paidSalaryWon = 0; club.reservedSalaryWon = kboRosterSeasonCharge(world, club.id); }
  world.seasonKey = target; world.calendar = calendar;
  const pool = nextKboFreeAgentYear({ source: game.freeAgents, worldKey: world.worldKey, seed: world.seed, seasonKey: target, difficulty: game.difficulty, registeredKeys: Object.keys(world.players) });
  const prepared = prepareKboAiRenewals({ world, pool, priorContracts: source.world.contracts, expiringKeys: expiring, protagonistKey: '', sourceSeasonKey: season, records: source.records, health: game.health, ...(source.aiAssessments ? { reports: source.aiAssessments } : {}) });
  const plan = (source.offerPlan ?? []);
  const market = runKboAiFreeAgentMarket({ ...prepared, reports: prepared.reports, sourceSeasonKey: season, records: source.records, difficulty: game.difficulty, ...(plan.length ? { userClub: { clubId: game.userClubId, offers: plan } } : {}) });
  world = market.world; game.health = market.health; game.aiAssessments = market.reports;
  const standings = leagueStandings(source.records, { seasonKey: season, leagueKey: 'KBO', phase: 'REGULAR' }, world.clubs.map(c => c.id), world.seed, world.worldKey);
  game.rookieDrafts = [...(source.rookieDrafts ?? []), draftKboRookieClass(world, target, standings.map(s => s.teamKey).reverse(), game.difficulty)];
  const repaired = repairKboDualLeagueRosters({ world, pool: market.pool, health: market.health, protagonistKey: '', difficulty: game.difficulty });
  world = repaired.world; game.health = repaired.health; game.freeAgents = repaired.pool;
  game.aiOffseasons = [...(source.aiOffseasons ?? []), { seasonKey: target, renewal: prepared.receipt, repair: repaired.receipt, rounds: market.rounds, userOfferCount: plan.length }];
  assertKboRecruitmentWorld(world);
  game.world = world;
  game.seasons = [...(source.seasons ?? []), { seasonKey: season, championKey: source.postseason?.championKey ?? null, standings: standings.map(s => ({ rank: s.rank, teamKey: s.teamKey, W: s.W, L: s.L, T: s.T })), seasonClose: source.seasonClose! }];
  game.schedule = createKboSeasonSchedules(world.clubs.map(c => c.id), target, calendar);
  for (const field of ['days', 'progress', 'seasonClose', 'lineup', 'offerPlan', 'postseason', 'postseasonProgress'] as const) delete game[field];
  game.phase = 'PRESEASON_SETUP'; game.revision++;
  return game;
}

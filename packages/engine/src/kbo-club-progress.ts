import type { KboClubGame } from './kbo-club-game.js';
import { kboClubRosterIssues, validateClubLineup } from './kbo-club-game.js';
import type { HighSchoolGameContext } from './high-school-game.js';
import { prepareSchoolCompetitionGame, advanceHighSchoolGame, commitSchoolCompetitionGame } from './high-school-game.js';
import { createKboCompetitionGameWorld } from './kbo-game-world.js';
import { closeKboCompetitionDay, createKboDayLedger } from './kbo-day.js';
import type { KboLeagueKey } from './kbo-day.js';
import type { ScheduledGame } from './schedule.js';
import { recordTotals } from './records.js';

export type KboClubProgressStop = 'CHUNK_LIMIT' | 'ENGINE_LIMIT' | 'DAY_CLOSED' | 'HEALTH_CHANGE' | 'SEASON_REVIEW' | 'LINEUP_INVALID';
export interface KboClubProgressResult { game: KboClubGame; stopReason: KboClubProgressStop; plateAppearances: number; completedInnings: number; daysClosed: number }
const LEAGUES: readonly KboLeagueKey[] = ['KBO', 'FUTURES'];
const allDays = (g: KboClubGame) => LEAGUES.flatMap(l => g.schedule[l].map(x => x.worldDay));
const assertRevision = (g: KboClubGame, expected: number) => { if (g.schemaVersion !== 1 || g.revision !== expected) throw new RangeError('CLUB_GAME_REVISION_CHANGED'); };

/** PRESEASON_SETUP → SEASON_PROGRESS. Blocking roster problems (35..60, first team 28, positions, injuries) must be fixed first. */
export function startKboClubSeason(source: KboClubGame, expectedRevision: number): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'PRESEASON_SETUP' || source.days) throw new RangeError('CLUB_SEASON_NOT_READY');
  if (kboClubRosterIssues(source).length) throw new RangeError('CLUB_ROSTER_INVALID');
  return { ...structuredClone(source), phase: 'SEASON_PROGRESS', days: createKboDayLedger(source.world), progress: { nextWorldDay: Math.min(...allDays(source)), pendingGame: null }, revision: source.revision + 1 };
}

/** Server-side AI context for one league: each club rotates its healthy starters by its own games, every unavailable player
 * is excluded, and the lineup is the automatic 41/44 selection (a hand-made lineup is not applied yet). */
export function kboClubGameContext(g: KboClubGame, leagueKey: KboLeagueKey): HighSchoolGameContext {
  const world = createKboCompetitionGameWorld(g.world, leagueKey, ''), starters: Record<string, string> = Object.create(null) as Record<string, string>;
  const season = recordTotals(g.records, { leagueKey, phase: 'REGULAR', seasonKey: g.world.seasonKey });
  for (const club of world.schools) {
    const available = club.roster.filter(k => world.players[k]!.kind === 'PITCHER' && !Object.hasOwn(g.health.injuries, k)).sort();
    const rotation = available.filter(k => world.players[k]!.position === 'SP'), pool = rotation.length ? rotation : available;
    if (pool.length === 0) throw new RangeError('NO_HEALTHY_KBO_PITCHER');
    starters[club.id] = pool[(season.teams[club.id]?.games ?? 0) % pool.length]!;
  }
  // A stored lineup is used for my club's first-team (KBO) games only.
  const manual = leagueKey === 'KBO' && g.lineup ? g.lineup.draft : null;
  if (manual) starters[g.userClubId] = manual.startingPitcher;
  return {
    ...(manual ? { lineupOverrides: { [g.userClubId]: { battingOrder: manual.battingOrder, fielders: manual.fielders, dhKey: manual.dhKey } } } : {}),
    difficulty: g.difficulty, unavailableKeys: Object.keys(g.health.injuries).filter(k => Object.hasOwn(world.players, k)), starters, recentBatting: {},
    recentPitchingOuts: Object.fromEntries(Object.entries(season.pitching).map(([k, p]) => [k, p.outs])), traits: {}, approaches: {},
  };
}
const queue = (g: KboClubGame, day: number): { leagueKey: KboLeagueKey; game: ScheduledGame }[] =>
  LEAGUES.flatMap(leagueKey => g.schedule[leagueKey].filter(x => x.worldDay === day && !Object.hasOwn(g.records.games, x.simulationKey)).map(game => ({ leagueKey, game })))
    .sort((a, b) => (a.leagueKey === b.leagueKey ? (a.game.simulationKey < b.game.simulationKey ? -1 : 1) : (a.leagueKey < b.leagueKey ? -1 : 1)));

/** Bounded worker like the career one: plays the date's KBO then Futures games for the whole league in safe chunks, closes
 * the day once for every club, and stops when one of my club's players is hurt or recovers (05: 부상 자동 중지). */
export function advanceKboClubGame(source: KboClubGame, expectedRevision: number, maxDays = 1): KboClubProgressResult {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_PROGRESS' || !source.days || !source.progress) throw new RangeError('INVALID_CLUB_PHASE');
  if (!Number.isSafeInteger(maxDays) || maxDays < 1 || maxDays > 7) throw new RangeError('INVALID_ADVANCE_DAYS');
  const game = structuredClone(source), progress = game.progress!, last = Math.max(...allDays(game)), mine = new Set(game.world.clubs.find(c => c.id === game.userClubId)!.roster);
  let plateAppearances = 0, completedInnings = 0, daysClosed = 0;
  const finish = (stopReason: KboClubProgressStop): KboClubProgressResult => { game.revision++; return { game, stopReason, plateAppearances, completedInnings, daysClosed }; };
  const review = () => { game.phase = 'SEASON_REVIEW'; delete game.progress; return finish('SEASON_REVIEW'); };
  while (plateAppearances < 1000 && completedInnings < 20 && daysClosed < maxDays) {
    const day = progress.nextWorldDay;
    if (day > last) return review();
    if (!progress.pendingGame) {
      const next = queue(game, day)[0];
      // 05: validate before every game; an invalid hand-made lineup stops here instead of being replaced silently.
      if (next && next.leagueKey === 'KBO' && game.lineup && (next.game.homeTeamKey === game.userClubId || next.game.awayTeamKey === game.userClubId) && validateClubLineup(game, game.lineup.draft).length) return finish('LINEUP_INVALID');
      if (next) progress.pendingGame = { leagueKey: next.leagueKey, job: prepareSchoolCompetitionGame(createKboCompetitionGameWorld(game.world, next.leagueKey, ''), game.records, next.game, kboClubGameContext(game, next.leagueKey)) };
    }
    if (progress.pendingGame) {
      const pending = progress.pendingGame, before = pending.job.game, job = advanceHighSchoolGame(pending.job, 1000 - plateAppearances, 20 - completedInnings);
      progress.pendingGame = { leagueKey: pending.leagueKey, job };
      plateAppearances += job.game.playCursor - before.playCursor; completedInnings += job.game.completedInnings - before.completedInnings;
      if (job.stopReason === 'ENGINE_LIMIT') return finish('ENGINE_LIMIT');
      if (job.game.status !== 'FINAL') return finish('CHUNK_LIMIT');
      const scheduled = game.schedule[pending.leagueKey].find(x => x.simulationKey === job.game.input.simulationKey)!;
      const committed = commitSchoolCompetitionGame(createKboCompetitionGameWorld(game.world, pending.leagueKey, ''), game.records, job, scheduled);
      // Merge only the books this game touched, so another league's earlier pitch XP is never rolled back.
      for (const key of Object.keys(job.game.pitchDevelopment!.players)) game.world.repertoires[key] = structuredClone(committed.world.repertoires[key]!);
      game.records = committed.records; progress.pendingGame = null;
      if (queue(game, day).length > 0) continue;
    }
    const closed = closeKboCompetitionDay(game.world, game.schedule, '', game.records, game.health, game.days!, day);
    game.world = closed.world; game.health = closed.health; game.days = closed.days; progress.nextWorldDay = day + 1; daysClosed++;
    if ([...closed.result.injured, ...closed.result.recovered].some(k => mine.has(k))) return progress.nextWorldDay > last ? review() : finish('HEALTH_CHANGE');
  }
  if (progress.nextWorldDay > last) return review();
  return finish(daysClosed >= maxDays ? 'DAY_CLOSED' : 'CHUNK_LIMIT');
}

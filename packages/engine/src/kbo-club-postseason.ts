import type { KboClubGame } from './kbo-club-game.js';
import { kboClubGameContext } from './kbo-club-progress.js';
import { prepareSchoolCompetitionGame, advanceHighSchoolGame, commitSchoolCompetitionGame } from './high-school-game.js';
import { createKboCompetitionGameWorld } from './kbo-game-world.js';
import { closeKboCompetitionDay } from './kbo-day.js';
import { leagueStandings } from './standings.js';
import { createKboPostseason, nextKboPostseasonGame, recordKboPostseasonGame } from './kbo-postseason.js';
import type { ScheduledGame } from './schedule.js';

export type KboClubPostseasonStop = 'CHUNK_LIMIT' | 'ENGINE_LIMIT' | 'GAME_FINAL' | 'HEALTH_CHANGE' | 'POSTSEASON_COMPLETE';
const ROUNDS = ['WILD_CARD', 'SEMI_PLAYOFF', 'PLAYOFF', 'KOREAN_SERIES'];
const assertRevision = (g: KboClubGame, expected: number) => { if (g.schemaVersion !== 1 || g.revision !== expected) throw new RangeError('CLUB_GAME_REVISION_CHANGED'); };

/** SEASON_REVIEW → POSTSEASON_PROGRESS once per season: seeds are the final KBO regular-season ranks 1..5 (01 tie-breaks). */
export function startKboClubPostseason(source: KboClubGame, expectedRevision: number): KboClubGame {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'SEASON_REVIEW' || source.postseason || source.seasonClose || !source.days) throw new RangeError('CLUB_POSTSEASON_NOT_READY');
  const season = source.world.seasonKey, standings = leagueStandings(source.records, { seasonKey: season, leagueKey: 'KBO', phase: 'REGULAR' }, source.world.clubs.map(c => c.id), source.world.seed, source.world.worldKey);
  const game = structuredClone(source), last = source.days.days.at(-1)!.day;
  game.phase = 'POSTSEASON_PROGRESS';
  game.postseasonProgress = { postseason: createKboPostseason(season, standings.slice(0, 5).map(s => s.teamKey)), nextWorldDay: last + 1, pendingGame: null };
  game.revision++;
  return game;
}
/** One postseason game per world day with the same safe chunks and JSON resume as the regular season; the day closes once for
 * the whole league. The champion is recorded on `postseason` and the game returns to SEASON_REVIEW. */
export function advanceKboClubPostseason(source: KboClubGame, expectedRevision: number): { game: KboClubGame; stopReason: KboClubPostseasonStop } {
  assertRevision(source, expectedRevision);
  if (source.phase !== 'POSTSEASON_PROGRESS' || !source.postseasonProgress || !source.days) throw new RangeError('INVALID_CLUB_PHASE');
  const game = structuredClone(source), progress = game.postseasonProgress!, mine = new Set(game.world.clubs.find(c => c.id === game.userClubId)!.roster);
  const finish = (stopReason: KboClubPostseasonStop) => { game.revision++; return { game, stopReason }; };
  const complete = () => { game.postseason = progress.postseason; game.phase = 'SEASON_REVIEW'; delete game.postseasonProgress; return finish('POSTSEASON_COMPLETE'); };
  const next = nextKboPostseasonGame(progress.postseason);
  if (!next) return complete();
  const round = ROUNDS.indexOf(next.round);
  const scheduled: ScheduledGame = { simulationKey: JSON.stringify([game.world.seasonKey, 'KBO', 'POSTSEASON', next.round, next.gameNumber]), leagueKey: 'KBO', seasonKey: game.world.seasonKey, round: round * 10 + next.gameNumber, worldDay: progress.nextWorldDay, awayTeamKey: next.awayTeamKey, homeTeamKey: next.homeTeamKey, phase: 'POSTSEASON' };
  if (!progress.pendingGame) progress.pendingGame = { leagueKey: 'KBO', job: prepareSchoolCompetitionGame(createKboCompetitionGameWorld(game.world, 'KBO', ''), game.records, scheduled, kboClubGameContext(game, 'KBO')) };
  if (progress.pendingGame.job.game.input.simulationKey !== scheduled.simulationKey || progress.pendingGame.job.worldDay !== scheduled.worldDay) throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
  const job = advanceHighSchoolGame(progress.pendingGame.job, 1000, 20);
  progress.pendingGame = { leagueKey: 'KBO', job };
  if (job.stopReason === 'ENGINE_LIMIT') return finish('ENGINE_LIMIT');
  if (job.game.status !== 'FINAL') return finish('CHUNK_LIMIT');
  const committed = commitSchoolCompetitionGame(createKboCompetitionGameWorld(game.world, 'KBO', ''), game.records, job, scheduled);
  for (const key of Object.keys(job.game.pitchDevelopment!.players)) game.world.repertoires[key] = structuredClone(committed.world.repertoires[key]!);
  game.records = committed.records; progress.pendingGame = null;
  const line = game.records.games[scheduled.simulationKey]!.teams, winner = line[scheduled.homeTeamKey]!.W > 0 ? scheduled.homeTeamKey : line[scheduled.awayTeamKey]!.W > 0 ? scheduled.awayTeamKey : null;
  if (!winner) throw new RangeError('POSTSEASON_GAME_WITHOUT_WINNER');
  const closed = closeKboCompetitionDay(game.world, { KBO: [scheduled], FUTURES: [] }, '', game.records, game.health, game.days!, scheduled.worldDay);
  game.world = closed.world; game.health = closed.health; game.days = closed.days;
  progress.postseason = recordKboPostseasonGame(progress.postseason, winner); progress.nextWorldDay = scheduled.worldDay + 1;
  if (!nextKboPostseasonGame(progress.postseason)) return complete();
  return finish([...closed.result.injured, ...closed.result.recovered].some(k => mine.has(k)) ? 'HEALTH_CHANGE' : 'GAME_FINAL');
}

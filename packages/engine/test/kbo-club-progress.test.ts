import test from 'node:test';
import assert from 'node:assert/strict';
import { createKboClubGame, kboClubHome } from '../src/kbo-club-game.js';
import type { KboClubGame } from '../src/kbo-club-game.js';
import { startKboClubSeason, advanceKboClubGame } from '../src/kbo-club-progress.js';
import { canonicalJson } from '../src/game.js';

const fresh = () => createKboClubGame({ worldKey: 'club-p1', seed: 'club-progress-seed', difficulty: 'REALISTIC', clubId: 'LG' });
const roundTrip = (g: KboClubGame) => JSON.parse(JSON.stringify(g)) as KboClubGame;

/** Runs `days` closed days, resuming from JSON after every call (chunks, pending games and all). */
function run(source: KboClubGame, days: number): KboClubGame {
  let g = source, closed = 0;
  for (let i = 0; i < 400 && closed < days; i++) {
    const out = advanceKboClubGame(roundTrip(g), g.revision, 1);
    g = out.game; closed += out.daysClosed;
    assert.notEqual(out.stopReason, 'ENGINE_LIMIT');
    if (out.stopReason === 'SEASON_REVIEW') break;
  }
  return g;
}

test('start needs a valid roster, happens once, and opens the first game day', () => {
  const g = fresh();
  assert.throws(() => advanceKboClubGame(g, g.revision), /INVALID_CLUB_PHASE/);
  const bad = structuredClone(g), club = bad.world.clubs.find(c => c.id === 'LG')!;
  club.firstTeam = club.firstTeam.slice(1);
  assert.throws(() => startKboClubSeason(bad, bad.revision), /CLUB_ROSTER_INVALID/);
  assert.throws(() => startKboClubSeason(g, g.revision + 1), /CLUB_GAME_REVISION_CHANGED/);
  const s = startKboClubSeason(g, g.revision);
  assert.equal(s.phase, 'SEASON_PROGRESS');
  assert.equal(s.progress!.nextWorldDay, Math.min(...[...g.schedule.KBO, ...g.schedule.FUTURES].map(x => x.worldDay)));
  assert.throws(() => startKboClubSeason(s, s.revision), /CLUB_SEASON_NOT_READY/);
  assert.equal(g.phase, 'PRESEASON_SETUP');
});

test('days play both leagues for the whole league, resume from JSON deterministically, and keep standings and fatigue consistent', () => {
  const s = startKboClubSeason(fresh(), 0), a = run(s, 3), b = run(s, 3);
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(a.days!.days.length, 3);
  const games = Object.values(a.records.games);
  const day1 = s.progress!.nextWorldDay, scheduledFirst = [...s.schedule.KBO, ...s.schedule.FUTURES].filter(x => x.worldDay === day1);
  assert.ok(games.length >= scheduledFirst.length);
  assert.ok(scheduledFirst.every(x => Object.hasOwn(a.records.games, x.simulationKey)), 'every game of the first day is final');
  assert.ok(games.every(x => x.scope.phase === 'REGULAR' && ['KBO', 'FUTURES'].includes(x.scope.leagueKey)));
  const home = kboClubHome(a);
  assert.ok(home.standings.some(r => r.games > 0));
  assert.equal(home.standings.reduce((n, r) => n + r.W, 0), home.standings.reduce((n, r) => n + r.L + r.T, 0), 'every win has a loss');
  assert.ok(Object.values(a.world.players).some(p => p.fatigue > 0));
  assert.equal(a.progress!.nextWorldDay, s.progress!.nextWorldDay + 3, 'three consecutive days closed');
  assert.ok(a.progress!.pendingGame === null);
  // Input state is never mutated by a call.
  const before = canonicalJson(s); advanceKboClubGame(s, s.revision, 1); assert.equal(canonicalJson(s), before);
  assert.throws(() => advanceKboClubGame(s, s.revision, 8), /INVALID_ADVANCE_DAYS/);
});

test('a hurt or recovered player of my club stops the advance so the manager can react', () => {
  let g = startKboClubSeason(fresh(), 0), stop = '';
  for (let i = 0; i < 400 && stop !== 'HEALTH_CHANGE' && g.phase === 'SEASON_PROGRESS'; i++) {
    const out = advanceKboClubGame(roundTrip(g), g.revision, 1); g = out.game; stop = out.stopReason;
    if (g.days!.days.length >= 10) break;
  }
  const mine = new Set(g.world.clubs.find(c => c.id === 'LG')!.roster), hit = (d: { result: { injured: string[]; recovered: string[] } }) => [...d.result.injured, ...d.result.recovered].some(k => mine.has(k));
  const list = g.days!.days;
  // Every closed day before the last had no change of my club's health (otherwise the run would have stopped there).
  assert.ok(list.slice(0, -1).every(d => !hit(d)));
  assert.equal(stop === 'HEALTH_CHANGE', hit(list.at(-1)!));
});

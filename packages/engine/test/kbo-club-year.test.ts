import test from 'node:test';
import assert from 'node:assert/strict';
import { createKboClubGame, kboClubRosterIssues, autoClubLineup, applyKboClubLineup } from '../src/kbo-club-game.js';
import type { KboClubGame } from '../src/kbo-club-game.js';
import { startKboClubSeason, advanceKboClubGame } from '../src/kbo-club-progress.js';
import { closeKboClubSeason, startNextKboClubSeason } from '../src/kbo-club-year.js';
import { setKboClubFirstTeam, planKboClubOffers, kboClubFreeAgents } from '../src/kbo-club-manage.js';
import { createKboCompetitionGameWorld } from '../src/kbo-game-world.js';
import { assertKboRecruitmentWorld } from '../src/kbo-draft.js';
import { canonicalJson } from '../src/game.js';
import { kboClubBalance } from '../src/kbo-finance.js';

/** Controlled season review: every scheduled day has a closed receipt, no games were played (standings tie), so the
 * year-end path is exercised without simulating 1,440 games. */
function review(): KboClubGame {
  const g = structuredClone(startKboClubSeason(createKboClubGame({ worldKey: 'yr-w', seed: 'yr-seed', difficulty: 'REALISTIC', clubId: 'LG' }), 0));
  const all = [...g.schedule.KBO, ...g.schedule.FUTURES].map(x => x.worldDay), first = Math.min(...all), last = Math.max(...all);
  g.days = { ...g.days!, days: Array.from({ length: last - first + 1 }, (_, i) => ({ day: first + i, evidence: 'test', result: { injured: [], recovered: [] } })) };
  g.phase = 'SEASON_REVIEW'; delete g.progress;
  return g;
}

test('season close grows and ages every league player once, closes health and settles the free-agent pool', () => {
  const r = review(), before = canonicalJson(r);
  assert.throws(() => startNextKboClubSeason(r, r.revision), /CLUB_SEASON_NOT_CLOSED/);
  const c = closeKboClubSeason(r, r.revision);
  assert.equal(canonicalJson(r), before);
  assert.equal(Object.keys(c.seasonClose!.npcGrowth).length, Object.keys(r.world.players).length);
  assert.ok(c.health.closedSeasons.includes('2027'));
  assert.ok(c.freeAgents.settlement);
  const sum = (p: { abilities: Record<string, number> }) => Object.values(p.abilities).reduce((a, b) => a + b, 0);
  for (const [k, p] of Object.entries(c.world.players)) assert.equal(sum(p), sum(r.world.players[k]!) + c.seasonClose!.npcGrowth[k]!.gainedUnits - c.seasonClose!.npcGrowth[k]!.agingLossUnits);
  assert.throws(() => closeKboClubSeason(c, c.revision), /INVALID_CLUB_SEASON_CLOSE/);
  assert.throws(() => closeKboClubSeason(r, r.revision + 1), /CLUB_GAME_REVISION_CHANGED/);
  assert.throws(() => closeKboClubSeason({ ...r, phase: 'SEASON_PROGRESS' }, r.revision), /INVALID_CLUB_SEASON_CLOSE/);
});

test('next season: whole-league offseason in one result, valid world, new calendar and schedule, every first team re-selected', () => {
  const r = review();
  // The oldest player of another club reaches the age limit and retires; my club keeps a stored lineup that must be dropped.
  const other = r.world.clubs.find(c => c.id === 'HH')!, old = other.roster.find(k => r.world.players[k]!.kind === 'HITTER' && !other.firstTeam.includes(k))!;
  r.world.players[old] = { ...r.world.players[old]!, age: 45 };
  const closed = closeKboClubSeason(r, r.revision), next = startNextKboClubSeason(closed, closed.revision);
  assert.equal(next.world.seasonKey, '2028'); assert.equal(next.world.calendar.year, 2028); assert.equal(next.phase, 'PRESEASON_SETUP');
  assert.equal(next.schedule.KBO.length, 720); assert.ok(next.schedule.KBO.every(x => x.seasonKey === '2028'));
  assert.ok(!next.days && !next.progress && !next.seasonClose && !next.lineup && !next.offerPlan);
  assert.deepEqual(next.seasons!.map(s => s.seasonKey), ['2027']); assert.equal(next.seasons![0]!.standings.length, 10);
  assert.equal(next.rookieDrafts!.length, 1); assert.equal(next.aiOffseasons!.length, 1);
  assert.ok(next.retiredPlayers!.some(p => p.playerKey === old) && !Object.hasOwn(next.world.players, old));
  assert.doesNotThrow(() => assertKboRecruitmentWorld(next.world));
  assert.doesNotThrow(() => { createKboCompetitionGameWorld(next.world, 'KBO', ''); createKboCompetitionGameWorld(next.world, 'FUTURES', ''); });
  for (const club of next.world.clubs) assert.equal(club.firstTeam.length, 28);
  assert.deepEqual(kboClubRosterIssues(next), []);
  assert.ok(next.world.clubs.every(c => c.roster.length >= 35 && c.roster.length <= 60));
  assert.ok(Object.values(next.world.players).every(p => p.age >= 18 && p.age <= 45));
  assert.ok(Object.keys(next.freeAgents.players).length >= 80);
  assert.equal(canonicalJson(startNextKboClubSeason(closed, closed.revision)), canonicalJson(next), 'same input, same offseason');
  assert.throws(() => startNextKboClubSeason(next, next.revision), /CLUB_SEASON_NOT_CLOSED/);
});

test('the second season can start and play (JSON resume), and a stored lineup does not survive the transition', async () => {
  const r = review(), auto = autoClubLineup(r);
  const withLineup = applyKboClubLineup(r, r.revision, auto), closed = closeKboClubSeason(withLineup, withLineup.revision), next = startNextKboClubSeason(closed, closed.revision);
  assert.equal(next.lineup, undefined);
  let g = startKboClubSeason(next, next.revision);
  for (let i = 0; i < 6 && Object.keys(g.records.games).length === 0; i++) g = advanceKboClubGame(JSON.parse(JSON.stringify(g)) as KboClubGame, g.revision, 1).game;
  assert.ok(Object.values(g.records.games).some(x => x.scope.seasonKey === '2028'));
});

test('manager free-agent offers: validated, up to three, used by the market for my club instead of AI offers', () => {
  const r = closeKboClubSeason(review(), 0 + review().revision), list = kboClubFreeAgents(r);
  assert.ok(list.length >= 80 && list.every(x => x.desiredAnnualSalaryWon >= 30_000_000 && x.desiredYears >= 1));
  const pick = list.slice(0, 2), offers = pick.map(p => ({ playerKey: p.playerKey, annualSalaryWon: 50_000_000, years: 2 }));
  assert.throws(() => planKboClubOffers(r, r.revision, [{ ...offers[0]!, annualSalaryWon: 12_345 }]), /INVALID_CLUB_OFFERS/);
  assert.throws(() => planKboClubOffers(r, r.revision, [{ ...offers[0]!, playerKey: 'nobody' }]), /INVALID_CLUB_OFFERS/);
  assert.throws(() => planKboClubOffers(r, r.revision, list.slice(0, 4).map(p => ({ playerKey: p.playerKey, annualSalaryWon: 50_000_000, years: 1 }))), /INVALID_CLUB_OFFERS/);
  assert.throws(() => planKboClubOffers(review(), 1, offers), /CLUB_OFFERS_NOT_OPEN/);
  const planned = planKboClubOffers(r, r.revision, offers), next = startNextKboClubSeason(planned, planned.revision);
  const rounds = next.aiOffseasons![0]!.rounds as { offers: { clubId: string; playerKey: string; annualSalaryWon: number; years: number }[] }[];
  const mine = rounds.flatMap(x => x.offers.filter(o => o.clubId === 'LG'));
  assert.ok(mine.length > 0 && mine.every(o => offers.some(p => p.playerKey === o.playerKey && p.annualSalaryWon === o.annualSalaryWon)), 'only my planned players, at my salary');
  assert.ok(mine.every(o => o.years <= 2));
  assert.equal(next.aiOffseasons![0]!.userOfferCount, 2);
  const cleared = planKboClubOffers(planned, planned.revision, []);
  assert.equal(cleared.offerPlan, undefined);
});

test('first-team management: legal swaps only, locked at review and during a pending game, lineup dropped when a member leaves', () => {
  const g = createKboClubGame({ worldKey: 'ft-w', seed: 'ft-seed', difficulty: 'REALISTIC', clubId: 'LG' }), club = g.world.clubs.find(c => c.id === 'LG')!;
  const out = club.firstTeam.find(k => g.world.players[k]!.position === '1B')!, bench = club.roster.find(k => !club.firstTeam.includes(k) && g.world.players[k]!.position === '1B')!;
  const swapped = setKboClubFirstTeam(g, g.revision, club.firstTeam.filter(k => k !== out).concat(bench));
  const sc = swapped.world.clubs.find(c => c.id === 'LG')!;
  assert.ok(sc.firstTeam.includes(bench) && !sc.firstTeam.includes(out) && sc.firstTeam.length === 28 && swapped.revision === g.revision + 1);
  assert.throws(() => setKboClubFirstTeam(g, g.revision, club.firstTeam.slice(1)), /INVALID_CLUB_FIRST_TEAM/);
  const stranger = g.world.clubs.find(c => c.id !== 'LG')!.roster[0]!;
  assert.throws(() => setKboClubFirstTeam(g, g.revision, club.firstTeam.slice(1).concat(stranger)), /INVALID_CLUB_FIRST_TEAM/);
  const noCatcher = club.roster.filter(k => g.world.players[k]!.position !== 'C').slice(0, 28);
  assert.throws(() => setKboClubFirstTeam(g, g.revision, noCatcher), /INVALID_CLUB_FIRST_TEAM/);
  // Only a team that stays structurally valid is accepted; a stored lineup that loses a member is dropped.
  const lined = applyKboClubLineup(g, g.revision, autoClubLineup(g)), victim = autoClubLineup(g).fielders['1B'];
  const dropped = setKboClubFirstTeam(lined, lined.revision, lined.world.clubs.find(c => c.id === 'LG')!.firstTeam.filter(k => k !== victim).concat(bench));
  assert.equal(dropped.lineup, undefined);
  assert.throws(() => setKboClubFirstTeam({ ...review() }, review().revision, club.firstTeam), /CLUB_FIRST_TEAM_LOCKED/);
});

test('postseason: top-5 bracket plays real games to one champion, resumes from JSON, and the champion is archived at the year change', async () => {
  const { startKboClubPostseason, advanceKboClubPostseason } = await import('../src/kbo-club-postseason.js');
  const r = review();
  assert.throws(() => advanceKboClubPostseason(r, r.revision), /INVALID_CLUB_PHASE/);
  let g = startKboClubPostseason(r, r.revision), games = 0, stop = '';
  assert.equal(g.phase, 'POSTSEASON_PROGRESS');
  assert.throws(() => startKboClubPostseason(g, g.revision), /CLUB_POSTSEASON_NOT_READY/);
  for (let i = 0; i < 400; i++) {
    const out = advanceKboClubPostseason(JSON.parse(JSON.stringify(g)) as KboClubGame, g.revision);
    g = out.game; stop = out.stopReason;
    if (stop === 'GAME_FINAL' || stop === 'HEALTH_CHANGE' || stop === 'POSTSEASON_COMPLETE') games++;
    if (stop === 'POSTSEASON_COMPLETE') break;
    assert.notEqual(stop, 'ENGINE_LIMIT');
  }
  assert.equal(stop, 'POSTSEASON_COMPLETE'); assert.equal(g.phase, 'SEASON_REVIEW');
  const ps = g.postseason!;
  assert.ok(ps.championKey && ps.seeds.includes(ps.championKey)); assert.ok(games >= 10 && games <= 17);
  const played = Object.values(g.records.games).filter(x => x.scope.phase === 'POSTSEASON' && x.scope.seasonKey === '2027');
  assert.equal(played.length, games);
  const days = g.days!.days; days.forEach((d, i) => { if (i > 0) assert.equal(d.day, days[i - 1]!.day + 1); });
  const closed = closeKboClubSeason(g, g.revision), next = startNextKboClubSeason(closed, closed.revision);
  assert.equal(next.seasons![0]!.championKey, ps.championKey);
  assert.ok(!next.postseason && !next.postseasonProgress);
  assert.throws(() => startKboClubPostseason(closed, closed.revision), /CLUB_POSTSEASON_NOT_READY/);
});

test('five controlled offseasons in a row keep the league valid (rosters, first teams, ages, budget, free-agent floor, unique keys)', () => {
  let g = review(); const seasons: string[] = [];
  for (let i = 0; i < 5; i++) {
    seasons.push(g.world.seasonKey);
    const closed = closeKboClubSeason(g, g.revision), next = startNextKboClubSeason(closed, closed.revision);
    assert.doesNotThrow(() => assertKboRecruitmentWorld(next.world));
    for (const club of next.world.clubs) {
      assert.ok(club.roster.length >= 35 && club.roster.length <= 60, `${club.id} roster ${club.roster.length}`);
      assert.equal(club.firstTeam.length, 28);
      // The money invariant of the project: nothing is spendable below zero. (Payroll climbs toward the cap over the years; see M6-D.)
      assert.ok(kboClubBalance(next.world, club.id).availableWon >= 0, `${club.id} available budget`);
    }
    assert.ok(Object.values(next.world.players).every(p => p.age >= 18 && p.age <= 45));
    assert.equal(new Set(next.world.clubs.flatMap(c => c.roster)).size, Object.keys(next.world.players).length, 'every player is on exactly one club');
    assert.ok(Object.keys(next.freeAgents.players).length >= 80);
    assert.deepEqual(kboClubRosterIssues(next), []);
    // Next controlled review: start the season and mark every scheduled day closed (no games played).
    g = structuredClone(startKboClubSeason(next, next.revision));
    const all = [...g.schedule.KBO, ...g.schedule.FUTURES].map(x => x.worldDay), first = Math.min(...all), last = Math.max(...all);
    g.days = { ...g.days!, days: Array.from({ length: last - first + 1 }, (_, k) => ({ day: first + k, evidence: 'test', result: { injured: [], recovered: [] } })) };
    g.phase = 'SEASON_REVIEW'; delete g.progress;
  }
  assert.deepEqual(seasons, ['2027', '2028', '2029', '2030', '2031']);
  assert.equal(g.world.seasonKey, '2032'); assert.equal(g.seasons!.length, 5); assert.equal(g.rookieDrafts!.length, 5);
});

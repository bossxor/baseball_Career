import test from 'node:test';
import assert from 'node:assert/strict';
import { createKboClubGame, autoClubLineup, validateClubLineup, applyKboClubLineup, clearKboClubLineup } from '../src/kbo-club-game.js';
import type { KboClubGame, ClubLineupDraft } from '../src/kbo-club-game.js';
import { startKboClubSeason, advanceKboClubGame } from '../src/kbo-club-progress.js';
import { prepareSchoolCompetitionGame } from '../src/high-school-game.js';
import { createKboCompetitionGameWorld } from '../src/kbo-game-world.js';
import type { ScheduledGame } from '../src/schedule.js';

const fresh = () => createKboClubGame({ worldKey: 'lu-w', seed: 'lineup-seed', difficulty: 'REALISTIC', clubId: 'LG' });
/** A legal hand-made variation: reverse the batting order and use the second healthy SP. */
function custom(g: KboClubGame): ClubLineupDraft {
  const auto = autoClubLineup(g), club = g.world.clubs.find(c => c.id === 'LG')!;
  const sps = club.firstTeam.filter(k => g.world.players[k]!.position === 'SP').sort();
  return { ...auto, battingOrder: [...auto.battingOrder].reverse(), startingPitcher: sps.find(k => k !== auto.startingPitcher)! };
}
const firstGameOfMine = (g: KboClubGame): ScheduledGame => g.schedule.KBO.filter(x => x.homeTeamKey === 'LG' || x.awayTeamKey === 'LG').sort((a, b) => a.worldDay - b.worldDay || (a.simulationKey < b.simulationKey ? -1 : 1))[0]!;

test('engine: a hand-made lineup is used as given (order, starter); an illegal one is refused', () => {
  const g = fresh(), draft = custom(g), world = createKboCompetitionGameWorld(g.world, 'KBO', ''), scheduled = firstGameOfMine(g);
  const starters: Record<string, string> = {};
  for (const s of world.schools) starters[s.id] = world.players[s.roster.filter(k => world.players[k]!.position === 'SP').sort()[0]!]!.simulationKey;
  starters.LG = draft.startingPitcher;
  const ctx = { difficulty: g.difficulty, unavailableKeys: [], starters, recentBatting: {}, recentPitchingOuts: {}, traits: {}, approaches: {} };
  const override = { battingOrder: draft.battingOrder, fielders: draft.fielders, dhKey: draft.dhKey };
  const job = prepareSchoolCompetitionGame(world, g.records, scheduled, { ...ctx, lineupOverrides: { LG: override } });
  const mine = job.game.input.teams.find(t => t.simulationKey === 'LG')!;
  assert.deepEqual(mine.lineup.map(p => p.simulationKey), draft.battingOrder);
  assert.equal(mine.pitchers.find(p => p.available && p.role === 'SP')!.simulationKey, draft.startingPitcher);
  const auto = prepareSchoolCompetitionGame(world, g.records, scheduled, { ...ctx, starters: { ...starters, LG: autoClubLineup(g).startingPitcher } });
  assert.notDeepEqual(auto.game.input.teams.find(t => t.simulationKey === 'LG')!.lineup.map(p => p.simulationKey), draft.battingOrder);
  const bad = (o: typeof override) => () => prepareSchoolCompetitionGame(world, g.records, scheduled, { ...ctx, lineupOverrides: { LG: o } });
  assert.throws(bad({ ...override, dhKey: override.fielders.C! }), /INVALID_GAME_CONTEXT/);
  assert.throws(bad({ ...override, battingOrder: override.battingOrder.slice(1) }), /INVALID_GAME_CONTEXT/);
  assert.throws(() => prepareSchoolCompetitionGame(world, g.records, scheduled, { ...ctx, unavailableKeys: [override.fielders.SS!], lineupOverrides: { LG: override } }), /INVALID_GAME_CONTEXT/);
});

test('club: apply only valid lineups, the first game uses it, an injury stops the advance at the game, clear returns to automatic', () => {
  const g = fresh(), draft = custom(g);
  assert.throws(() => applyKboClubLineup(g, g.revision, { ...draft, dhKey: draft.fielders.C }), /CLUB_LINEUP_INVALID/);
  assert.throws(() => applyKboClubLineup(g, g.revision + 1, draft), /CLUB_GAME_REVISION_CHANGED/);
  const withLineup = applyKboClubLineup(g, g.revision, draft);
  assert.deepEqual(withLineup.lineup!.draft, draft);assert.equal(withLineup.revision, g.revision + 1);assert.equal(g.lineup, undefined);
  const started = startKboClubSeason(withLineup, withLineup.revision), mine = firstGameOfMine(g);
  let run = started;
  for (let i = 0; i < 100 && !Object.hasOwn(run.records.games, mine.simulationKey); i++) run = advanceKboClubGame(JSON.parse(JSON.stringify(run)) as KboClubGame, run.revision, 1).game;
  const line = run.records.games[mine.simulationKey]!;
  assert.ok(Object.hasOwn(line.batting, draft.battingOrder[0]!) && Object.hasOwn(line.pitching, draft.startingPitcher), 'the chosen starter and leadoff batter played');
  // Injure a lineup member before the next game of mine: the advance stops at the game and changes nothing else.
  const hurt = structuredClone(started);
  hurt.health.injuries[draft.fielders.CF] = { severity: 'MILD', remainingTeamGames: 5, diagnosedGameKey: 'x', seasonKey: '2027' };
  assert.ok(validateClubLineup(hurt, draft).some(i => i.code === 'INJURED' && i.position === 'CF'));
  let out = advanceKboClubGame(hurt, hurt.revision, 7), guard = 0;
  while (out.stopReason !== 'LINEUP_INVALID' && guard++ < 40) out = advanceKboClubGame(out.game, out.game.revision, 7);
  assert.equal(out.stopReason, 'LINEUP_INVALID');
  assert.ok(!Object.hasOwn(out.game.records.games, mine.simulationKey) || out.game.progress!.nextWorldDay >= mine.worldDay);
  const cleared = clearKboClubLineup(out.game, out.game.revision);
  assert.equal(cleared.lineup, undefined);
  const after = advanceKboClubGame(cleared, cleared.revision, 1);
  assert.notEqual(after.stopReason, 'LINEUP_INVALID');
  // A starter who is not an SP is refused while a healthy SP exists.
  const rp = g.world.clubs.find(c => c.id === 'LG')!.firstTeam.find(k => g.world.players[k]!.position === 'RP')!;
  assert.ok(validateClubLineup(g, { ...draft, startingPitcher: rp }).some(i => i.code === 'STARTER_MUST_BE_SP'));
});

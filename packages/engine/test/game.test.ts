import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { assertGameInvariants, canonicalJson, createGame, runGameChunk } from '../src/game.js';
import { battingRates, emptyBatting, emptyPitching, inningsDisplay, pitchingRates } from '../src/stats.js';
import type { GameState } from '../src/types.js';
import { game, team } from './fixtures.js';
import { nextFloat, seedPcg32 } from '../src/rng.js';

function complete(source: GameState, budget = 1000): GameState {
  let state = source;
  for (let i = 0; i < 3000; i++) {
    const result = runGameChunk(state, { plateAppearances: budget }); state = result.state;
    assert.notEqual(result.stopReason, 'ENGINE_LIMIT');
    if (state.status === 'FINAL') return state;
  }
  throw new Error('Fixture game did not end');
}
test('REC10/14: uninterrupted vs one-PA JSON resumes give identical full-state SHA256', () => {
  const source = createGame(game()), before = canonicalJson(source);
  const full = complete(source), resumed = complete(JSON.parse(JSON.stringify(source)), 1);
  const hash = (value: GameState) => createHash('sha256').update(canonicalJson(value)).digest('hex');
  assert.equal(hash(full), hash(resumed)); assert.equal(canonicalJson(source), before);
  const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf8')) as { sha256: string };
  assert.equal(hash(full), golden.sha256);
  console.log(`M1 deterministic fixture SHA256: ${hash(full)}`);
});
test('REC11: completed game replay is a no-op with unchanged RNG/records', () => {
  const final = complete(createGame(game('final-retry')));
  assert.deepEqual(runGameChunk(final).state, final);
});
test('REC13: no available pitchers/duplicate lineup/bad repertoire fail before creating state', () => {
  const input = game(), away = structuredClone(team('away'));
  for (const pitcher of away.pitchers) pitcher.available = false;
  assert.throws(() => createGame({ ...input, teams: [away, input.teams[1]] }), /no available pitcher/);
  assert.throws(() => createGame({ ...input, teams: [{ ...input.teams[0], lineup: Array(9).fill(input.teams[0].lineup[0]) }, input.teams[1]] }));
  const invalid = structuredClone(game()); invalid.teams[0].pitchers[0]!.repertoire[0]!.weight = 59;
  assert.throws(() => createGame(invalid), /sum to 100/);
  const injured = structuredClone(game()); injured.teams[0].lineup[0]!.available = false;
  assert.throws(() => createGame(injured), /unavailable hitter/);
});
test('last eligible pitcher finishes without creating a free replacement', () => {
  const input = { ...game('only-one'), teams: [team('away', 50, 0), team('home', 50, 0)] as const };
  const final = complete(createGame(input));
  assert.equal(final.appearances.length, 2); assert.ok(Object.values(final.pitching).some(line => line.pitches > 110));
});
test('24: fatigued named starter completes a PA before replacement review', () => {
  const input = game('fatigued-starter'); input.teams[1].pitchers[0]!.fatigue = 100;
  const first = runGameChunk(createGame(input), { plateAppearances: 1 }).state;
  assert.equal(first.plays[0]!.pitcherKey, 'home-p0'); assert.equal(first.pitching['home-p0']!.BF, 1);
  const second = runGameChunk(first, { plateAppearances: 1 }).state;
  assert.notEqual(second.plays[1]!.pitcherKey, 'home-p0');
});
test('REC04/05/08/09/15: 100 seeded games keep legal ending, pitching awards and box totals', () => {
  let skips = 0, walkoffs = 0, ties = 0, wins = 0, saves = 0;
  for (let i = 0; i < 100; i++) {
    const final = complete(createGame(game(`reg-${i}`)));
    assertGameInvariants(final);
    if (final.scores[0] === final.scores[1]) { ties++; assert.equal(final.inning, 12); assert.equal(final.decisions!.W, null); assert.equal(final.decisions!.L, null); }
    else { wins++; assert.ok(final.decisions!.W); assert.ok(final.decisions!.L); }
    if (final.scoreByInning[1].length < final.scoreByInning[0].length) { skips++; assert.ok(final.scores[1] > final.scores[0]); }
    const last = final.plays[final.plays.length - 1]!;
    if (last.half === 'BOTTOM' && last.scored.length > 0) { walkoffs++; assert.ok(final.scores[1] > final.scores[0]); }
    const decisions = final.decisions!;
    assert.ok(!decisions.HLD.includes(decisions.L ?? '') && !decisions.HLD.includes(decisions.SV ?? '') && !decisions.HLD.includes(decisions.W ?? ''));
    if (decisions.SV) { saves++; assert.notEqual(decisions.SV, decisions.W); assert.ok(final.pitching[decisions.SV]!.outs > 0); }
    for (const play of final.plays) assert.ok(play.outsAdded >= 0 && play.outsAdded <= 2 && play.pitches >= 2 && play.pitches <= 6);
  }
  assert.ok(skips > 0 && walkoffs > 0 && wins > 0 && saves > 0);
  console.log(`M1 fixed100 games: ${wins} wins / ${ties} ties / ${skips} skipped bottoms / ${walkoffs} walkoffs / ${saves} saves`);
});
test('postseason: automatic runners are unearned, and chunk boundaries preserve all cursors', () => {
  let foundAutomatic = false;
  for (let i = 0; i < 60 && !foundAutomatic; i++) {
    const final = complete(createGame(game(`ps-${i}`, 'POSTSEASON')), 13);
    assert.notEqual(final.scores[0], final.scores[1]);
    const automatic = final.plays.flatMap(p => p.scored).filter(r => r.automatic);
    if (automatic.length) {
      foundAutomatic = true;
      const R = Object.values(final.pitching).reduce((n, p) => n + p.R, 0), ER = Object.values(final.pitching).reduce((n, p) => n + p.ER, 0);
      assert.equal(R - ER, automatic.length);
    }
  }
  assert.equal(foundAutomatic, true);
});
test('24: engine safety cap stops with last complete-PA state and no draws', () => {
  const initial = createGame(game()); initial.halfPlateAppearances = 300;
  const result = runGameChunk(initial);
  assert.equal(result.stopReason, 'ENGINE_LIMIT'); assert.deepEqual(result.state, initial);
});
test('24: prescribed all-strikeout PS fixture pauses after20 innings and resumes inning21', () => {
  let kState = seedPcg32(1n, 1n);
  for (let i = 0; i < 1000; i++) {
    const candidate = seedPcg32(BigInt(i), 1n), value = nextFloat(candidate).value;
    if (value > .15 && value < .20) { kState = candidate; break; }
  }
  let state = createGame(game('twenty-inning', 'POSTSEASON'));
  for (let i = 0; i < 119; i++) {
    // A prescribed outcome fixture, not a random fair-game sample; no production override exists.
    state.rng.game = { ...kState, draws: state.playCursor };
    state = runGameChunk(state, { plateAppearances: 1 }).state;
  }
  assert.equal(state.inning, 20); assert.equal(state.half, 1); assert.equal(state.outs, 2);
  state.rng.game = { ...kState, draws: state.playCursor };
  const paused = runGameChunk(state);
  assert.equal(paused.stopReason, 'CHUNK_LIMIT'); assert.equal(paused.state.inning, 21); assert.equal(paused.state.playCursor, 120);
  assert.equal(paused.state.status, 'LIVE');
  const continued = runGameChunk(JSON.parse(JSON.stringify(paused.state)), { plateAppearances: 1 });
  assert.equal(continued.state.playCursor, 121);
});
test('08/112: rate denominators separate HBP/BB; SLG can exceed1 and outs use thirds', () => {
  const batting = { ...emptyBatting(), PA: 110, AB: 100, H: 25, BB: 5, HBP: 5, TB: 100 };
  assert.equal(battingRates(batting).AVG, .25); assert.equal(battingRates(batting).SLG, 1);
  assert.equal(battingRates({ ...batting, TB: 400 }).SLG, 4);
  const pitcher = { ...emptyPitching(), outs: 15, H: 2, BB: 1, HBP: 10, ER: 1 };
  assert.equal(pitchingRates(pitcher).WHIP, .6); assert.equal(inningsDisplay(14), '4.2'); assert.equal(inningsDisplay(15), '5.0');
  assert.equal(pitchingRates(emptyPitching()).ERA, null); assert.equal(battingRates(emptyBatting()).AVG, null);
});

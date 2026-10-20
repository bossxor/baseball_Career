import assert from 'node:assert/strict';
import test from 'node:test';
import { HITTER_ABILITIES, PITCHER_ABILITIES } from '@playball/rules';
import { assertGameInvariants, createGame, runGameChunk } from '../src/game.js';
import { battingRates, emptyBatting, emptyPitching, pitchingRates } from '../src/stats.js';
import type { BattingLine, PitchingLine } from '../src/types.js';
import { game } from './fixtures.js';

// 35's exact six-axis initial arrays. A constructed matchup, not a generated league/season.
const hitters: Record<string, number[]> = {
  balanced: [50, 50, 50, 50, 50, 50], slugger: [40, 70, 45, 40, 40, 65], sluggerDefense: [40, 65, 35, 70, 35, 55],
  contact: [70, 30, 60, 45, 50, 45], onBase: [55, 30, 75, 45, 45, 50], onBaseDefense: [45, 30, 65, 70, 40, 50],
  defenseRunning: [35, 30, 40, 75, 75, 45], fiveTool: [55, 55, 40, 55, 55, 40],
};
const pitchers: Record<string, number[]> = {
  balanced: [50, 50, 50, 50, 50, 50], velocity: [70, 65, 35, 40, 50, 40], command: [40, 45, 75, 55, 45, 40],
  stuffCommand: [40, 65, 65, 45, 45, 40], innings: [40, 40, 55, 45, 75, 45], composure: [40, 45, 55, 75, 45, 40],
};
for (const [kind, profiles] of [['HITTER', hitters], ['PITCHER', pitchers]] as const) for (const [name, profile] of Object.entries(profiles)) {
  test(`41 fixed100-seed matchup ${kind}/${name}: legal games and conserved records`, () => {
    assert.equal(profile.reduce((a, b) => a + b, 0), 300);
    const bat: BattingLine = emptyBatting(), pitch: PitchingLine = emptyPitching();
    for (let i = 0; i < 100; i++) {
      const input = game(`style-seed-${i}`), away = input.teams[0];
      const keys = kind === 'HITTER' ? HITTER_ABILITIES : PITCHER_ABILITIES;
      for (const player of kind === 'HITTER' ? away.lineup : away.pitchers) player.abilities = Object.fromEntries(keys.map((key, index) => [key, profile[index]! * 10_000]));
      let state = createGame(input);
      for (let chunk = 0; chunk < 10 && state.status !== 'FINAL'; chunk++) {
        const next = runGameChunk(state); assert.notEqual(next.stopReason, 'ENGINE_LIMIT'); state = next.state;
      }
      assert.equal(state.status, 'FINAL'); assertGameInvariants(state);
      for (const player of away.lineup) for (const key of Object.keys(bat) as (keyof BattingLine)[]) bat[key] += state.batting[player.simulationKey]![key];
      for (const player of away.pitchers) for (const key of Object.keys(pitch) as (keyof PitchingLine)[]) pitch[key] += state.pitching[player.simulationKey]![key];
    }
    console.log(`M1 fixed100 ${kind}/${name}: ${JSON.stringify({ batting: battingRates(bat), pitching: pitchingRates(pitch), HRperPA: bat.HR / bat.PA })}`);
  });
}

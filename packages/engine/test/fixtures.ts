import { HITTER_ABILITIES, PITCHER_ABILITIES, RULES_VERSION } from '@playball/rules';
import type { GameInput, HitterSnapshot, PitcherSnapshot, TeamSnapshot } from '../src/types.js';

export function team(key: string, value = 50, bullpen = 3): TeamSnapshot {
  const lineup: HitterSnapshot[] = Array.from({ length: 9 }, (_, i) => ({
    simulationKey: `${key}-h${i}`, abilities: Object.fromEntries(HITTER_ABILITIES.map(axis => [axis, value * 10_000])),
    fatigue: 0, morale: 1, temporary: {}, traitLogits: [], available: true, bats: i % 3 === 0 ? 'L' : i % 3 === 1 ? 'R' : 'S', approach: 'BALANCED',
  }));
  const pitchers: PitcherSnapshot[] = Array.from({ length: bullpen + 1 }, (_, i) => ({
    simulationKey: `${key}-p${i}`, abilities: Object.fromEntries(PITCHER_ABILITIES.map(axis => [axis, value * 10_000])),
    fatigue: 0, morale: 1, temporary: {}, traitLogits: [], throws: 'R', pitchForm: 'OVERHAND', role: i === 0 ? 'SP' : i === bullpen ? 'CP' : 'RP', available: true, recentOuts: 0,
    repertoire: [{ pitchId: 'P01', mastery: 2, weight: 60 }, { pitchId: 'P03', mastery: 1, weight: 40 }],
  }));
  return { simulationKey: key, lineup, fielders: lineup.slice(0, 8).map(p => ({ simulationKey: p.simulationKey, fit: 100 })), pitchers };
}
export function game(seed = 'test-42', competition: GameInput['competition'] = 'REGULAR'): GameInput {
  return { simulationKey: 'fixture-game', seed, rulesVersion: RULES_VERSION, competition, teams: [team('away'), team('home')] };
}

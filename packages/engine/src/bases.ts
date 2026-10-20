import type { Outcome } from '@playball/rules';
import { doublePlayProbability, extraHomeProbability, ranged } from './probabilities.js';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';

export interface Runner { simulationKey: string; responsiblePitcherKey: string; automatic: boolean; running: number; extraHomeBonus?: number }
export type Bases = [Runner | null, Runner | null, Runner | null];
export interface BasePlayInput {
  outcome: Outcome; outs: number; bases: Bases; batter: Runner; defense: number; pickoff: number;
  winningRunsNeeded: number | null;
}
export interface RunningAttempt { runnerKey: string; probability: number; success: boolean; kind: 'EXTRA_HOME' | 'DOUBLE_PLAY' }

/** One complete PA, leading runners first; no scores after the third out. */
export function advanceBases(input: BasePlayInput, rng: RngState) {
  const { outcome, bases, batter, winningRunsNeeded } = input;
  if (!Number.isInteger(input.outs) || input.outs < 0 || input.outs > 2) throw new RangeError('Invalid outs');
  if (winningRunsNeeded !== null && (!Number.isInteger(winningRunsNeeded) || winningRunsNeeded < 1)) throw new RangeError('Invalid walkoff target');
  const keys = [batter, ...bases.filter(r => r !== null)].map(r => r.simulationKey);
  if (new Set(keys).size !== keys.length) throw new RangeError('Duplicate runner/batter');
  for (const runner of [batter, ...bases.filter(r => r !== null)]) {ranged(runner.running, 1, 100);if(runner.extraHomeBonus!==undefined) ranged(runner.extraHomeBonus,0,.02);}
  let state = rng, outsAdded = 0;
  const next: Bases = [null, null, null], scored: Runner[] = [], attempts: RunningAttempt[] = [];
  const walkoff = () => outcome !== 'HR' && winningRunsNeeded !== null && scored.length >= winningRunsNeeded;
  const score = (runner: Runner) => { if (input.outs + outsAdded < 3 && !walkoff()) scored.push({ ...runner }); };
  if (outcome === 'BB' || outcome === 'HBP') {
    next[0] = { ...batter };
    next[1] = bases[0] ? { ...bases[0] } : bases[1] ? { ...bases[1] } : null;
    next[2] = bases[0] && bases[1] ? { ...bases[1] } : bases[2] ? { ...bases[2] } : null;
    if (bases[0] && bases[1] && bases[2]) score(bases[2]);
  } else if (outcome === 'K' || outcome === 'OUT') {
    for (const i of [0, 1, 2] as const) next[i] = bases[i] ? { ...bases[i] } : null;
    outsAdded = 1;
    if (outcome === 'OUT' && bases[0] && input.outs < 2) {
      const probability = doublePlayProbability(input.defense, batter.running);
      const draw = nextFloat(state); state = draw.state;
      const success = draw.value < probability;
      attempts.push({ runnerKey: bases[0].simulationKey, probability, success, kind: 'DOUBLE_PLAY' });
      if (success) { next[0] = null; outsAdded = 2; }
    }
  } else {
    const distance = outcome === '1B' ? 1 : outcome === '2B' ? 2 : outcome === '3B' ? 3 : 4;
    for (const index of [2, 1, 0] as const) {
      const runner = bases[index];
      if (!runner || input.outs + outsAdded >= 3 || walkoff()) continue;
      const target = index + distance;
      if (target >= 3) { score(runner); continue; }
      if (target === 2 && input.outs === 2 && runner.running >= 60) {
        const probability = extraHomeProbability(runner.running,input.pickoff,runner.extraHomeBonus??0);
        const draw = nextFloat(state); state = draw.state;
        const success = draw.value < probability;
        attempts.push({ runnerKey: runner.simulationKey, probability, success, kind: 'EXTRA_HOME' });
        if (success) score(runner); else outsAdded++;
      } else next[target as 0 | 1 | 2] = { ...runner };
    }
    if (distance === 4) scored.push({ ...batter });
    else next[(distance - 1) as 0 | 1 | 2] = { ...batter };
  }
  return { bases: next, scored, outsAdded, rbi: scored.length, attempts, state, walkoff: winningRunsNeeded !== null && scored.length >= winningRunsNeeded };
}

import { abilityKeys, assertAbilities, UNITS_PER_POINT, BASE_PROBABILITIES, OUTCOMES, PITCH_LOGITS, APPROACH_LOGITS, PITCH_FORMS } from '@playball/rules';
import type { AbilityUnits, PlayerKind, Outcome, LogitVector, PitchId, Approach } from '@playball/rules';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';

export type Distribution = Record<Outcome, number>;
export type PitchForm = (typeof PITCH_FORMS)[number];
export type Hand = 'R' | 'L';
export type BatSide = Hand | 'S';
export const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export function finite(n: number): number {
  if (!Number.isFinite(n)) throw new RangeError('Non-finite engine value');
  return n;
}
export function ranged(n: number, low: number, high: number): number {
  finite(n);
  if (n < low || n > high) throw new RangeError('Out-of-range engine value');
  return n;
}
export function effectiveAbilities(kind: PlayerKind, abilities: AbilityUnits, fatigue: number, morale: number, temporary: Readonly<Record<string, number>> = {}): Record<string, number> {
  assertAbilities(kind, abilities);
  ranged(fatigue, 0, 100);
  if (finite(morale) <= 0) throw new RangeError('Morale multiplier must be positive');
  const fatigueMultiplier = fatigue > 60 ? Math.max(.8, 1 - (fatigue - 60) * .005) : 1;
  return Object.fromEntries(abilityKeys(kind).map(key => [key, clamp(clamp(abilities[key]! / UNITS_PER_POINT + finite(temporary[key] ?? 0), 1, 100) * fatigueMultiplier * morale, 1, 100)]));
}

export interface BattingContext {
  contact: number; power: number; discipline: number; running: number; clutch: number;
  velocity: number; stuff: number; command: number; composure: number; defense: number;
  runnersOn: boolean; risp: boolean;
}
export function baseLogits(context: BattingContext): Distribution {
  const c = context;
  for (const value of [c.contact, c.power, c.discipline, c.running, c.clutch, c.velocity, c.stuff, c.command, c.composure]) ranged(value, 1, 100);
  ranged(c.defense, .5, 100);
  const clutch = c.risp ? .05 * (c.clutch - 50) : 0;
  const C = clamp(c.contact + clutch, 1, 100), P = clamp(c.power + clutch, 1, 100);
  const d = (x: number, y: number) => clamp((x - y) / 50, -1, 1);
  const crisis = c.runnersOn ? .001 * (c.composure - 50) : 0;
  return {
    BB: Math.log(BASE_PROBABILITIES["BB"]) + .6 * d(c.discipline, c.command) - crisis,
    HBP: Math.log(BASE_PROBABILITIES["HBP"]) - .15 * d(c.command, 50),
    K: Math.log(BASE_PROBABILITIES["K"]) + .45 * d(c.stuff, C) + .25 * d(c.velocity, C) - .2 * d(c.discipline, c.command) + crisis,
    '1B': Math.log(BASE_PROBABILITIES["1B"]) + .35 * d(C, c.stuff) - .2 * d(c.defense, 50),
    '2B': Math.log(BASE_PROBABILITIES["2B"]) + .3 * d(P, c.stuff) + .2 * d(C, c.command),
    '3B': Math.log(BASE_PROBABILITIES["3B"]) + .45 * d(c.running, 50) + .15 * d(P, c.stuff),
    HR: Math.log(BASE_PROBABILITIES["HR"]) + .8 * d(P, c.stuff) + .15 * d(C, c.command) - crisis,
    OUT: Math.log(BASE_PROBABILITIES["OUT"]) + .2 * d(c.defense, 50) - .25 * d(C, c.stuff) + crisis,
  };
}

export function softmax(logits: Distribution): Distribution {
  const maximum = Math.max(...OUTCOMES.map(key => finite(logits[key])));
  const weights = OUTCOMES.map(key => Math.exp(logits[key] - maximum));
  const total = weights.reduce((a, b) => a + b, 0);
  return Object.fromEntries(OUTCOMES.map((key, i) => [key, weights[i]! / total])) as Distribution;
}

/** Traits are condition-resolved inputs from M2; this layer enforces both caps. */
export function combineEffects(traits: readonly LogitVector[], others: readonly LogitVector[]) {
  const raw = {} as Distribution, applied = {} as Distribution, traitRaw = {} as Distribution;
  for (const key of OUTCOMES) {
    traitRaw[key] = traits.reduce((sum, vector) => sum + finite(vector[key] ?? 0), 0);
    raw[key] = clamp(traitRaw[key], -.06, .06) + others.reduce((sum, vector) => sum + finite(vector[key] ?? 0), 0);
    applied[key] = clamp(raw[key], -.10, .10);
  }
  return { traitRaw, raw, applied };
}

export function identityEffects(form: PitchForm, pitch: PitchId, throws: Hand, bats: BatSide): { form: LogitVector; platoon: LogitVector } {
  if (!PITCH_FORMS.includes(form) || !(pitch in PITCH_LOGITS) || !['R', 'L'].includes(throws) || !['R', 'L', 'S'].includes(bats)) throw new RangeError('Invalid pitcher/batter identity');
  const affinity: Record<PitchForm, readonly PitchId[]> = { OVERHAND: ['P01', 'P04'], THREE_QUARTER: ['P03', 'P01'], SIDEARM: ['P03', 'P02'], UNDERHAND: ['P05', 'P02'] };
  const formVector: LogitVector = affinity[form].includes(pitch) ? (form === 'SIDEARM' || form === 'UNDERHAND' ? { OUT: .01 } : { K: .01 }) : {};
  return { form: formVector, platoon: bats === 'S' || throws !== bats ? { '1B': .01 } : { K: .01 } };
}

export function matchupEffects(form: PitchForm, pitch: PitchId, mastery: number, throws: Hand, bats: BatSide, approach: Approach, traits: readonly LogitVector[]) {
  if (!Number.isInteger(mastery) || mastery < 1 || mastery > 5 || !(approach in APPROACH_LOGITS)) throw new RangeError('Invalid mastery/approach');
  const identity = identityEffects(form, pitch, throws, bats);
  const vector = Object.fromEntries(OUTCOMES.map(key => [key, (PITCH_LOGITS[pitch][key] ?? 0) * mastery / 5]));
  return combineEffects(traits, [vector, APPROACH_LOGITS[approach], identity.form, identity.platoon]);
}

export function sampleOutcome(distribution: Distribution, rng: RngState) {
  let total = 0;
  for (const key of OUTCOMES) total += ranged(distribution[key], 0, 1);
  if (Math.abs(total - 1) > 1e-12) throw new RangeError('Probability mass must equal one');
  const draw = nextFloat(rng);
  let cumulative = 0;
  for (const key of OUTCOMES) {
    cumulative += distribution[key];
    if (draw.value < cumulative) return { outcome: key, state: draw.state };
  }
  return { outcome: 'OUT' as const, state: draw.state }; // Final cumulative interval ends at exactly 1.
}

export function extraHomeProbability(running: number, pickoff: number): number {
  return clamp(.70 + .002 * (ranged(running, 1, 100) - 50) - .0015 * (ranged(pickoff, 1, 100) - 50), .40, .90);
}
export function doublePlayProbability(defense: number, running: number): number {
  return clamp(.20 + .002 * (ranged(defense, .5, 100) - 50) - .002 * (ranged(running, 1, 100) - 50), .05, .35);
}

export function pitcherReviewThreshold(stamina: number, starter: boolean): number {
  ranged(stamina, 1, 100);
  return starter ? Math.round(90 + .30 * (stamina - 50)) : Math.round(30 + .10 * (stamina - 50));
}
/** Post-appearance delta, applied by the career/club transaction, not per PA. */
export function pitcherAppearanceFatigue(stamina: number, starter: boolean): number {
  return (starter ? 40 : 15) * (1 - .003 * (ranged(stamina, 1, 100) - 50));
}

export function neutralProbabilities(): Distribution { return { ...BASE_PROBABILITIES }; }

import { abilityKeys, assertFocus } from '@playball/rules';
import type { Difficulty } from '@playball/rules';
import { archetypeFor, validateDevelopmentPlayer } from './player.js';
import type { DevelopmentPlayer } from './player.js';

export interface GrowthPolicy { mode: 'CAREER' | 'CLUB'; difficulty: Difficulty; beneficiary: boolean }
export function positiveGrowthMultiplier(policy: GrowthPolicy): number {
  if (!['CAREER','CLUB'].includes(policy.mode) || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(policy.difficulty)) throw new RangeError('INVALID_POLICY');
  if (policy.mode === 'CLUB') return policy.difficulty === 'SECRET_CHEAT' && policy.beneficiary ? 3 : 1;
  if (policy.beneficiary) return policy.difficulty === 'GROWTH' ? 1.5 : policy.difficulty === 'SECRET_CHEAT' ? 3 : 1;
  return policy.difficulty === 'REALISTIC' ? 1.2 : 1;
}
/** Integer allocation. Canonical key order receives rounding leftovers (42), no lost/recreated units. */
export function allocateCapped(total: number, weights: readonly number[], capacities: readonly number[]) {
  if (!Number.isSafeInteger(total) || total < 0 || weights.length !== capacities.length || !weights.length) throw new RangeError('INVALID_ALLOCATION');
  if (weights.some(n => !Number.isSafeInteger(n) || n < 0) || capacities.some(n => !Number.isSafeInteger(n) || n < 0)) throw new RangeError('INVALID_ALLOCATION');
  const gains = weights.map(() => 0); let remaining = total;
  while (remaining > 0) {
    const eligible = weights.map((_, i) => i).filter(i => gains[i]! < capacities[i]!);
    if (!eligible.length) break;
    const sum = eligible.reduce((n, i) => n + weights[i]!, 0);
    if (!Number.isSafeInteger(sum)) throw new RangeError('INVALID_WEIGHT_SUM');
    const shares = weights.map(() => 0);
    for (const i of eligible) {
      const weight = sum === 0 ? 1 : weights[i]!, divisor = sum === 0 ? eligible.length : sum;
      shares[i] = Number((2n * BigInt(remaining) * BigInt(weight) + BigInt(divisor)) / (2n * BigInt(divisor)));
    }
    let remainder = remaining - shares.reduce((a, b) => a + b, 0);
    for (const i of eligible) { if (remainder <= 0) break; shares[i]!++; remainder--; }
    for (const i of eligible) { if (remainder >= 0) break; if (shares[i]! > 0) { shares[i]!--; remainder++; } }
    let spent = 0;
    for (const i of eligible) { const gain = Math.min(shares[i]!, capacities[i]! - gains[i]!); gains[i]! += gain; spent += gain; }
    if (!spent) throw new Error('ALLOCATION_STALLED');
    remaining -= spent;
  }
  return { gains, discarded: remaining };
}
export function applyGrowthBudget(source: DevelopmentPlayer, budgetUnits: number) {
  validateDevelopmentPlayer(source); assertFocus(source.kind, source.focus);
  const keys = abilityKeys(source.kind), type = archetypeFor(source.kind, source.archetype);
  const other = keys.map((k, i) => source.focus.includes(k) ? 0 : type.weights[i]!);
  if (other.reduce((a, b) => a + b, 0) === 0) for (let i = 0; i < keys.length; i++) if (!source.focus.includes(keys[i]!)) other[i] = 1;
  const denominator = other.reduce((a, b) => a + b, 0);
  const weights = keys.map((key, i) => source.focus.includes(key) ? denominator : other[i]!);
  const capacities = keys.map(key => source.potential[key]! - source.abilities[key]!);
  const result = allocateCapped(budgetUnits, weights, capacities);
  const abilities = Object.fromEntries(keys.map((key, i) => [key, source.abilities[key]! + result.gains[i]!]));
  const careerPeaks = Object.fromEntries(keys.map(key => [key, Math.max(source.careerPeaks[key]!, abilities[key]!)]));
  return { player: { ...structuredClone(source), abilities, careerPeaks }, gains: result.gains, discarded: result.discarded };
}
export function applyAging(source: DevelopmentPlayer, elapsedFraction = 1) {
  if(!Number.isFinite(elapsedFraction) || elapsedFraction<0 || elapsedFraction>1)throw new RangeError('INVALID_AGING_PERIOD');
  validateDevelopmentPlayer(source);
  const age = source.age, amount = age < 32 ? 0 : age <= 34 ? 2 : age <= 37 ? 5 : age <= 40 ? 9 : age <= 44 ? 12 : 15;
  const keys = abilityKeys(source.kind), weights = source.kind === 'HITTER' ? [8,8,8,8,60,8] : [30,10,10,10,30,10];
  const result = allocateCapped(Math.round(amount * 10_000 * elapsedFraction), weights, keys.map(key => source.abilities[key]! - 10_000));
  return { player: { ...structuredClone(source), abilities: Object.fromEntries(keys.map((key, i) => [key, source.abilities[key]! - result.gains[i]!])) }, discarded: result.discarded };
}

export interface GrowthPeriod {
  startDay: number; endDay: number; levelSeasonDays: number; level: 'HIGH_SCHOOL' | 'COLLEGE' | 'PRO';
  appearances: number; pitcherRole: 'SP' | 'RP' | 'CP'; rehabRatio: number; trainingMultiplier: number;
  ordinaryMilitary: boolean; policy: GrowthPolicy;
}
export function naturalGrowthBudgetUnits(player: DevelopmentPlayer, worldGrowthDays: number, periods: readonly GrowthPeriod[]): number {
  validateDevelopmentPlayer(player);
  if (!Number.isSafeInteger(worldGrowthDays) || worldGrowthDays < 1) throw new RangeError('INVALID_WORLD_GROWTH_DAYS');
  const sorted = [...periods].sort((a, b) => a.startDay - b.startDay);
  let previousEnd = 0, points = 0;
  const base = player.age <= 22 ? 10 : player.age <= 27 ? 6 : player.age <= 31 ? 3 : 1;
  for (const period of sorted) {
    for (const n of [period.startDay, period.endDay, period.levelSeasonDays, period.appearances]) if (!Number.isSafeInteger(n) || n < 0) throw new RangeError('INVALID_GROWTH_PERIOD');
    if (period.startDay < previousEnd || period.endDay < period.startDay || period.endDay > worldGrowthDays || period.levelSeasonDays < 1 || !['HIGH_SCHOOL','COLLEGE','PRO'].includes(period.level)) throw new RangeError('OVERLAPPING_OR_INVALID_GROWTH_PERIOD');
    if (!Number.isFinite(period.rehabRatio) || period.rehabRatio < 0 || period.rehabRatio > 1 || !Number.isFinite(period.trainingMultiplier) || period.trainingMultiplier < 1 || period.trainingMultiplier > 1.2 || !['SP','RP','CP'].includes(period.pitcherRole)) throw new RangeError('INVALID_GROWTH_FACTOR');
    previousEnd = period.endDay;
    const days = period.endDay - period.startDay, multiplier = positiveGrowthMultiplier(period.policy);
    if (days === 0 || period.ordinaryMilitary) continue;
    const annualStandard = period.level !== 'PRO' ? player.kind === 'HITTER' ? 100 : 90 : player.kind === 'HITTER' ? 500 : period.pitcherRole === 'SP' ? 450 : 150;
    const standard = annualStandard * days / period.levelSeasonDays;
    const appearance = .7 + .4 * Math.min(1, period.appearances / standard);
    const training = Math.min(1.2, Math.max(.8, 1 - .2 * period.rehabRatio) * period.trainingMultiplier);
    points += base * days / worldGrowthDays * appearance * training * multiplier;
  }
  const units = Math.round(points * 10_000);
  if (!Number.isSafeInteger(units)) throw new RangeError('GROWTH_BUDGET_OVERFLOW');
  return units;
}
export function settleNaturalGrowth(source: DevelopmentPlayer, settledSeasons: readonly string[], seasonId: string, worldGrowthDays: number, periods: readonly GrowthPeriod[]) {
  if (!seasonId || settledSeasons.includes(seasonId)) throw new RangeError('GROWTH_ALREADY_SETTLED');
  const budgetUnits = naturalGrowthBudgetUnits(source, worldGrowthDays, periods);
  return { ...applyGrowthBudget(source, budgetUnits), budgetUnits, settledSeasons: [...settledSeasons, seasonId] };
}

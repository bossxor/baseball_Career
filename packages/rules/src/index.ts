/** Sources: design 35 (keys/focus), 85 (difficulty), 90 (integer precision). */
export const RULES_VERSION = '1.0.0';
export const ABILITY_SCHEMA_VERSION = 2;
export const DIFFICULTY_POLICY_VERSION = 2;
export const UNITS_PER_POINT = 10_000;
export const ABILITY_MIN_UNITS = UNITS_PER_POINT;
export const ABILITY_MAX_UNITS = 100 * UNITS_PER_POINT;
export const FOCUS_COUNT = 4;
export const ARCHIVE_IMPORT_AGE = 19;

export const HITTER_ABILITIES = Object.freeze([
  'CONTACT', 'POWER', 'DISCIPLINE', 'DEFENSE', 'RUNNING', 'CLUTCH',
] as const);
export const PITCHER_ABILITIES = Object.freeze([
  'VELOCITY', 'STUFF', 'COMMAND', 'COMPOSURE', 'STAMINA', 'PICKOFF',
] as const);
export type PlayerKind = 'HITTER' | 'PITCHER';
export type HitterAbility = (typeof HITTER_ABILITIES)[number];
export type PitcherAbility = (typeof PITCHER_ABILITIES)[number];
export type AbilityKey = HitterAbility | PitcherAbility;
export type AbilityUnits = Readonly<Record<string, number>>;

export const ABILITY_LABELS: Readonly<Record<AbilityKey, string>> = Object.freeze({
  CONTACT: '컨택', POWER: '파워', DISCIPLINE: '선구안', DEFENSE: '수비',
  RUNNING: '주루', CLUTCH: '클러치', VELOCITY: '구속', STUFF: '구위',
  COMMAND: '제구', COMPOSURE: '위기관리', STAMINA: '체력', PICKOFF: '견제',
});
export const PITCH_FORMS = Object.freeze(['OVERHAND', 'THREE_QUARTER', 'SIDEARM', 'UNDERHAND'] as const);
export const THROWING_HANDS = Object.freeze(['R', 'L'] as const);
export const BATTING_SIDES = Object.freeze(['R', 'L', 'S'] as const);

// Natural-growth factors apply once (85); XP numerator/5 scaling is separate (90).
export const GROWTH_POLICY = Object.freeze({
  careerNormalProtagonist: 1.5,
  careerHardProtagonist: 1,
  careerHardNpc: 1.2,
  careerCheatProtagonist: 3,
  clubNormal: 1,
  clubHard: 1,
  clubCheatOwned: 3,
  careerHardNpcPotentialBonus: 5,
  cheatPotential: 100,
});
export const PITCH_XP = Object.freeze({
  baseSeasonCapUnits: 200_000,
  normalActualCapUnits: 200_000,
  hardNpcActualCapUnits: 240_000,
  cheatActualCapUnits: 600_000,
  perPitchCapUnits: 1_500_000,
  scalingDenominator: 5,
});

export function abilityKeys(kind: PlayerKind): readonly AbilityKey[] {
  if (kind === 'HITTER') return HITTER_ABILITIES;
  if (kind === 'PITCHER') return PITCHER_ABILITIES;
  throw new RangeError('Unknown player kind');
}

/** Runtime boundary: no missing, extra, fractional, non-finite or out-of-range units. */
export function assertAbilities(kind: PlayerKind, values: AbilityUnits): void {
  const keys = abilityKeys(kind);
  if (Object.keys(values).length !== keys.length) throw new RangeError('Exactly six abilities required');
  for (const key of keys) {
    const value = values[key];
    if (!Object.hasOwn(values, key) || value === undefined || !Number.isSafeInteger(value) || value < ABILITY_MIN_UNITS || value > ABILITY_MAX_UNITS) {
      throw new RangeError(`Invalid ability units: ${key}`);
    }
  }
}

export function assertFocus(kind: PlayerKind, focus: readonly string[]): void {
  const keys: readonly string[] = abilityKeys(kind);
  if (focus.length !== FOCUS_COUNT || new Set(focus).size !== FOCUS_COUNT || focus.some(key => !keys.includes(key))) {
    throw new RangeError('Choose exactly four different abilities for this player kind');
  }
}

/** Keep sum/denominator exact for engine comparisons; round only the displayed tenth. */
export function overall(kind: PlayerKind, values: AbilityUnits) {
  assertAbilities(kind, values);
  const sumUnits = abilityKeys(kind).reduce((sum, key) => sum + values[key]!, 0);
  const tenths = Math.floor((sumUnits + 3_000) / 6_000);
  return Object.freeze({ sumUnits, denominator: 60_000, display: `${Math.floor(tenths / 10)}.${tenths % 10}` });
}

/** Only the ability conversion, not a complete archive/player import command. */
export function halfPeakAbilities(kind: PlayerKind, sourcePeaks: AbilityUnits): AbilityUnits {
  assertAbilities(kind, sourcePeaks);
  return Object.freeze(Object.fromEntries(abilityKeys(kind).map(key => [
    key, Math.max(ABILITY_MIN_UNITS, Math.floor((sourcePeaks[key]! + 1) / 2)),
  ])));
}

/** 41: lineup role score only; never replaces the six-axis overall. */
export function roleScore(kind: PlayerKind, abilities: AbilityUnits, role: string): number {
  assertAbilities(kind, abilities);
  const rows: Record<string, readonly number[]> = kind === 'HITTER' ? {
    C: [20, 15, 15, 30, 10, 10], '2B': [20, 15, 15, 30, 10, 10], SS: [20, 15, 15, 30, 10, 10], CF: [20, 15, 15, 30, 10, 10],
    '1B': [25, 25, 20, 15, 5, 10], '3B': [25, 25, 20, 15, 5, 10], LF: [25, 25, 20, 15, 5, 10], RF: [25, 25, 20, 15, 5, 10], DH: [30, 30, 25, 0, 5, 10],
  } : { SP: [15, 25, 25, 10, 20, 5], RP: [15, 30, 25, 20, 5, 5], CP: [15, 30, 25, 20, 5, 5] };
  const weights = Object.hasOwn(rows, role) ? rows[role] : undefined;
  if (!weights) throw new RangeError('Invalid player role');
  return abilityKeys(kind).reduce((sum, key, i) => sum + abilities[key]! * weights[i]!, 0) / (100 * UNITS_PER_POINT);
}

export * from './baseball.js';
export * from './player.js';

/** User-confirmed US scouting-score gate (2026-10-21); actual offer and eligibility remain mandatory. */
export const US_DIRECT_MIN_SCOUT_SCORE = 65;
export * from './career.js';
export * from './college.js';
export * from './kbo.js';

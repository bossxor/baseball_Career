/** Canonical numeric data from 08/41/48/119/123. */
export const OUTCOMES = ['BB', 'HBP', 'K', '1B', '2B', '3B', 'HR', 'OUT'] as const;
export type Outcome = (typeof OUTCOMES)[number];
export type LogitVector = Partial<Record<Outcome, number>>;
export const BASE_PROBABILITIES: Readonly<Record<Outcome, number>> = Object.freeze({ BB: .085, HBP: .010, K: .200, '1B': .160, '2B': .045, '3B': .005, HR: .030, OUT: .465 });
export const PITCH_IDS = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07'] as const;
export type PitchId = (typeof PITCH_IDS)[number];
export const PITCH_LOGITS: Readonly<Record<PitchId, Readonly<LogitVector>>> = Object.freeze({
  P01: Object.freeze({ K: .03, HR: .02 }), P02: Object.freeze({ OUT: .03, HR: -.02, K: -.01 }),
  P03: Object.freeze({ K: .04, BB: .02, '1B': -.01 }), P04: Object.freeze({ K: .02, '2B': -.02, BB: .02 }),
  P05: Object.freeze({ '1B': -.03, HR: -.01, BB: .02 }), P06: Object.freeze({ K: .04, BB: .03, HR: -.02 }),
  P07: Object.freeze({ OUT: .02, '2B': -.02, K: .01 }),
});
export type Approach = 'BALANCED' | 'PULL' | 'OPPOSITE' | 'ALL_FIELDS';
export const APPROACH_LOGITS: Readonly<Record<Approach, Readonly<LogitVector>>> = Object.freeze({
  BALANCED: Object.freeze({}), PULL: Object.freeze({ HR: .03, '2B': .01, '1B': -.02, OUT: .01 }),
  OPPOSITE: Object.freeze({ '1B': .03, '2B': .01, HR: -.03 }), ALL_FIELDS: Object.freeze({ '1B': .015, '2B': .015, HR: -.015, BB: -.01 }),
});

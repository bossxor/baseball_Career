import type { AbilityUnits, Approach, LogitVector, PitchId, Outcome } from '@playball/rules';
import type { Bases, Runner, RunningAttempt } from './bases.js';
import type { PitchForm, BatSide, Hand, Distribution } from './probabilities.js';
import type { Streams } from './rng.js';

export interface PlayerSnapshot {
  simulationKey: string; abilities: AbilityUnits; fatigue: number; morale: number;
  temporary: Readonly<Record<string, number>>;
  /** Condition-resolved at the PA boundary; M2 owns trait eligibility/expiry. */
  traitLogits: readonly LogitVector[];
}
export interface HitterSnapshot extends PlayerSnapshot { bats: BatSide; approach: Approach; available: boolean }
export interface PitchEntry { pitchId: PitchId; mastery: number; weight: number }
export interface PitcherSnapshot extends PlayerSnapshot {
  throws: Hand; pitchForm: PitchForm; role: 'SP' | 'RP' | 'CP'; available: boolean; recentOuts: number;
  repertoire: readonly PitchEntry[];
}
export interface TeamSnapshot {
  simulationKey: string; lineup: readonly HitterSnapshot[];
  fielders: readonly { simulationKey: string; fit: number }[];
  pitchers: readonly PitcherSnapshot[];
}
export interface GameInput {
  simulationKey: string; seed: string; rulesVersion: string; competition: 'REGULAR' | 'POSTSEASON' | 'INTERNATIONAL';
  /** Away then home. IDs are immutable simulation keys, never database row IDs. */
  teams: readonly [TeamSnapshot, TeamSnapshot];
}
export interface BattingLine { PA: number; AB: number; BB: number; HBP: number; K: number; H: number; TB: number; HR: number; R: number; RBI: number }
export interface PitchingLine { BF: number; outs: number; H: number; HR: number; BB: number; HBP: number; K: number; R: number; ER: number; pitches: number }
export interface Appearance {
  pitcherKey: string; team: 0 | 1; starter: boolean; order: number; enteredAt: number;
  entryLead: number; saveSituation: boolean; maintainedLead: boolean; blownSave: boolean;
}
export interface PlayLog {
  cursor: number; inning: number; half: 'TOP' | 'BOTTOM'; batterKey: string; pitcherKey: string;
  outsBefore: number; basesBefore: [string | null, string | null, string | null]; scoresBefore: [number, number];
  pitcherThrows: Hand; batterSide: Hand;
  outcome: Outcome; representativePitch: PitchId; probabilities: Distribution; pitches: number;
  scored: Runner[]; outsAdded: number; attempts: RunningAttempt[];
}
export interface DecisiveLead { team: 0 | 1; losingPitcherKey: string; winningCandidateKey: string; cursor: number }
export interface PitcherDecisions { W: string | null; L: string | null; SV: string | null; HLD: string[]; BS: string[] }
export interface GameState {
  engineVersion: string; input: GameInput; status: 'LIVE' | 'FINAL';
  inning: number; half: 0 | 1; outs: number; halfPlateAppearances: number; playCursor: number;
  scores: [number, number]; scoreByInning: [number[], number[]]; bases: Bases;
  nextBattingIndex: [number, number]; activePitcherIndex: [number, number];
  rng: Streams; batting: Record<string, BattingLine>; pitching: Record<string, PitchingLine>;
  appearances: Appearance[]; decisiveLead: DecisiveLead | null; decisions: PitcherDecisions | null;
  plays: PlayLog[]; completedInnings: number;
}

import type { BattingLine, PitchingLine } from './types.js';

export function emptyBatting(): BattingLine { return { PA: 0, AB: 0, BB: 0, HBP: 0, K: 0, H: 0, TB: 0, HR: 0, R: 0, RBI: 0 }; }
export function emptyPitching(): PitchingLine { return { BF: 0, outs: 0, H: 0, HR: 0, BB: 0, HBP: 0, K: 0, R: 0, ER: 0, pitches: 0 }; }
const ratio = (n: number, d: number) => d === 0 ? null : n / d;
export function battingRates(line: BattingLine) {
  const AVG = ratio(line.H, line.AB), OBP = ratio(line.H + line.BB + line.HBP, line.PA), SLG = ratio(line.TB, line.AB);
  return { AVG, OBP, SLG, OPS: OBP === null || SLG === null ? null : OBP + SLG };
}
export function pitchingRates(line: PitchingLine) {
  return { ERA: ratio(line.ER * 27, line.outs), WHIP: ratio((line.BB + line.H) * 3, line.outs), K9: ratio(line.K * 27, line.outs) };
}
export function inningsDisplay(outs: number): string {
  if (!Number.isSafeInteger(outs) || outs < 0) throw new RangeError('Invalid pitching outs');
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

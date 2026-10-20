import { PITCH_XP, PITCH_IDS } from '@playball/rules';
import type { PitchId } from '@playball/rules';

export interface PitchXpLedger {
  baseSpentUnits: number; baseReservedUnits: number; actualBudgetSpentUnits: number; actualBookGrantedUnits: number; scalingRemainder: number;
  entries: { evidenceKey: string; pitchId: string; candidateBaseUnits: number; policyNumerator: number; baseUnits: number; budgetDebit: number; bookGain: number; capLoss: number }[];
}
export function emptyPitchXpLedger(): PitchXpLedger { return { baseSpentUnits: 0, baseReservedUnits: 0, actualBudgetSpentUnits: 0, actualBookGrantedUnits: 0, scalingRemainder: 0, entries: [] }; }
/** 90 exact double-budget arithmetic; caller keys ledger by player + worldSeason. */
export function grantPitchXp(source: PitchXpLedger, input: { evidenceKey: string; pitchId: string; candidateBaseUnits: number; currentPitchXpUnits: number; numerator: 5 | 6 | 15 }) {
  if (!input.evidenceKey || !PITCH_IDS.includes(input.pitchId as PitchId) || ![5,6,15].includes(input.numerator)) throw new RangeError('INVALID_XP_SOURCE');
  for (const value of [source.baseSpentUnits,source.baseReservedUnits,source.actualBudgetSpentUnits,source.actualBookGrantedUnits,source.scalingRemainder,input.candidateBaseUnits,input.currentPitchXpUnits]) if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('INVALID_XP_UNITS');
  if (source.baseSpentUnits + source.baseReservedUnits > PITCH_XP.baseSeasonCapUnits || source.scalingRemainder > 4 || source.actualBudgetSpentUnits > 600_000 || source.actualBookGrantedUnits > source.actualBudgetSpentUnits || input.currentPitchXpUnits > PITCH_XP.perPitchCapUnits) throw new RangeError('INVALID_XP_CAP');
  const previous = source.entries.find(entry => entry.evidenceKey === input.evidenceKey);
  if (previous) {
    if (previous.pitchId !== input.pitchId || previous.candidateBaseUnits !== input.candidateBaseUnits || previous.policyNumerator !== input.numerator) throw new RangeError('EVIDENCE_REUSED');
    return { ledger: structuredClone(source), xpUnits: input.currentPitchXpUnits, duplicate: true };
  }
  const cap = input.numerator === 15 ? 600_000 : input.numerator === 6 ? 240_000 : 200_000;
  const remaining = Math.max(0, cap - source.actualBudgetSpentUnits);
  const base = Math.min(input.candidateBaseUnits, 200_000 - source.baseSpentUnits - source.baseReservedUnits, Math.floor((5 * remaining + 4 - source.scalingRemainder) / input.numerator));
  const numerator = input.numerator * base + source.scalingRemainder;
  const budgetDebit = base === 0 ? 0 : Math.floor(numerator / 5);
  const bookGain = Math.min(budgetDebit, 1_500_000 - input.currentPitchXpUnits);
  const ledger = structuredClone(source);
  ledger.baseSpentUnits += base; ledger.actualBudgetSpentUnits += budgetDebit; ledger.actualBookGrantedUnits += bookGain;
  if (base > 0) ledger.scalingRemainder = numerator % 5;
  ledger.entries.push({ evidenceKey: input.evidenceKey, pitchId: input.pitchId, candidateBaseUnits: input.candidateBaseUnits, policyNumerator: input.numerator, baseUnits: base, budgetDebit, bookGain, capLoss: budgetDebit - bookGain });
  return { ledger, xpUnits: input.currentPitchXpUnits + bookGain, duplicate: false };
}

/** Strict persisted ledger validation at game load; all historical policies share the same base budget. */
export function validatePitchXpLedger(ledger:PitchXpLedger):void {
  for(const n of [ledger.baseSpentUnits,ledger.baseReservedUnits,ledger.actualBudgetSpentUnits,ledger.actualBookGrantedUnits,ledger.scalingRemainder])if(!Number.isSafeInteger(n) || n<0)throw new RangeError('INVALID_XP_LEDGER');
  if(ledger.baseSpentUnits+ledger.baseReservedUnits>200_000 || ledger.actualBudgetSpentUnits>600_000 || ledger.actualBookGrantedUnits>ledger.actualBudgetSpentUnits || ledger.scalingRemainder>4)throw new RangeError('INVALID_XP_LEDGER');
  let base=0,spent=0,granted=0,remainder=0;const seen=new Set<string>();
  for(const entry of ledger.entries) {
    if(!entry.evidenceKey || seen.has(entry.evidenceKey) || !PITCH_IDS.includes(entry.pitchId as PitchId) || ![5,6,15].includes(entry.policyNumerator))throw new RangeError('INVALID_XP_ENTRY');
    seen.add(entry.evidenceKey);
    for(const n of [entry.candidateBaseUnits,entry.baseUnits,entry.budgetDebit,entry.bookGain,entry.capLoss])if(!Number.isSafeInteger(n) || n<0)throw new RangeError('INVALID_XP_ENTRY');
    const scaled=entry.policyNumerator*entry.baseUnits+remainder,cap=entry.policyNumerator===15?600_000:entry.policyNumerator===6?240_000:200_000;
    if(entry.baseUnits>entry.candidateBaseUnits || entry.bookGain+entry.capLoss!==entry.budgetDebit || entry.budgetDebit!==(entry.baseUnits===0?0:Math.floor(scaled/5)) || entry.budgetDebit>Math.max(0,cap-spent))throw new RangeError('INVALID_XP_ENTRY');
    base+=entry.baseUnits;spent+=entry.budgetDebit;granted+=entry.bookGain;if(entry.baseUnits>0)remainder=scaled%5;
  }
  if(base!==ledger.baseSpentUnits || spent!==ledger.actualBudgetSpentUnits || granted!==ledger.actualBookGrantedUnits || remainder!==ledger.scalingRemainder)throw new RangeError('XP_LEDGER_TOTAL_MISMATCH');
}

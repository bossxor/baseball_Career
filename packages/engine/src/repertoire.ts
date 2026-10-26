import { PITCH_IDS } from '@playball/rules';
import type { PitchId } from '@playball/rules';
import { emptyPitchXpLedger, grantPitchXp } from './pitch-xp.js';
import type { PitchXpLedger } from './pitch-xp.js';

const THRESHOLDS = [0,100_000,300_000,600_000,1_000_000,1_500_000] as const;
export type PitchBook = Partial<Record<PitchId, number>>;
export type PitchWeights = Partial<Record<PitchId, number>>;
export interface Repertoire {
  book: PitchBook; weights: PitchWeights; ledger: PitchXpLedger;
  seasonId: string; usedWindows: string[];
  learning: null | { registration?:{worldKey:string;playerKey:string;scheduledGames:number;openingInjured:boolean;calendar?:{gameKey:string;day:number}[]}; pitchId: PitchId; quarters: { healthyDays: number; registeredDays: number; numerator: 5 | 6 | 15 }[]; carryNumerator: string; carryDenominator: string };
}
function pitch(id: string): asserts id is PitchId { if (!PITCH_IDS.includes(id as PitchId)) throw new RangeError('INVALID_PITCH'); }
export function pitchMastery(xp: number): number {
  if (!Number.isSafeInteger(xp) || xp < 0 || xp > 1_500_000) throw new RangeError('INVALID_PITCH_XP');
  return THRESHOLDS.findLastIndex(value => xp >= value);
}
export function validatePitchBook(book: PitchBook): void {
  const entries = Object.entries(book);
  if (entries.length > 7) throw new RangeError('INVALID_BOOK');
  for (const [id,xp] of entries) { pitch(id); pitchMastery(xp); }
}
export function validatePitchWeights(book: PitchBook, weights: PitchWeights): void {
  validatePitchBook(book);
  const entries = Object.entries(weights);
  if (entries.length < 2 || entries.length > 4 || entries.reduce((sum,[,w]) => sum+w,0) !== 100) throw new RangeError('INVALID_ALLOCATION');
  for (const [id,w] of entries) {
    pitch(id);
    if (!Number.isInteger(w) || w < 10 || w > 90 || pitchMastery(book[id] ?? 0) < 1) throw new RangeError('NOT_ELIGIBLE');
  }
}
export function createRepertoire(secondary: PitchId, seasonId: string): Repertoire {
  pitch(secondary);
  if (secondary === 'P01' || !seasonId) throw new RangeError('INVALID_STARTING_REPERTOIRE');
  return { book: {P01:300_000,[secondary]:100_000}, weights:{P01:60,[secondary]:40}, ledger:emptyPitchXpLedger(), seasonId, usedWindows:[], learning:null };
}
/** 101 local draft only: proportional largest remainders, canonical ID ties, lower-bound redistribution. */
export function rebalancePitchWeights(source: PitchWeights, selected: PitchId, requested: number): PitchWeights {
  const ids = Object.keys(source).sort() as PitchId[];
  validatePitchWeights(Object.fromEntries(ids.map(id=>[id,100_000])),source);
  if (!ids.includes(selected) || !Number.isFinite(requested)) throw new RangeError('INVALID_SLIDER');
  const result: PitchWeights = {[selected]:Math.max(10,Math.min(100-10*(ids.length-1),Math.round(requested)))};
  let remaining=100-result[selected]!, pending=ids.filter(id=>id!==selected);
  while (pending.length) {
    const total=pending.reduce((sum,id)=>sum+source[id]!,0);
    const low=pending.filter(id=>remaining*source[id]! < 10*total);
    if (low.length) { for(const id of low) {result[id]=10;remaining-=10;} pending=pending.filter(id=>!low.includes(id)); continue; }
    const shares=pending.map(id=>({id,whole:Math.floor(remaining*source[id]!/total),remainder:(remaining*source[id]!)%total}));
    let extra=remaining-shares.reduce((sum,s)=>sum+s.whole,0);
    shares.sort((a,b)=>b.remainder-a.remainder || (a.id<b.id?-1:1));
    for(const share of shares) result[share.id]=share.whole+(extra-- > 0?1:0);
    pending=[];
  }
  return result;
}
export function setPitchWeights(source: Repertoire, weights: PitchWeights, windowId: string, open: boolean): Repertoire {
  validatePitchWeights(source.book,weights);
  if (source.learning && new Set([...Object.keys(weights),source.learning.pitchId]).size > 4) throw new RangeError('SLOT_CONFLICT');
  const same=PITCH_IDS.every(id=>source.weights[id]===weights[id]);
  if (same) return structuredClone(source);
  if (!open || !windowId || source.usedWindows.includes(windowId)) throw new RangeError('WINDOW_CLOSED');
  return {...structuredClone(source),weights:{...weights},usedWindows:[...source.usedWindows,windowId]};
}
/** Full-slot learning atomically consumes the PRE loadout opportunity (user decision 2026-10-20). */
export function beginPitchLearning(source: Repertoire, id: PitchId, preseasonOpen: boolean, replacement?: {pitchId:PitchId; windowId:string}): Repertoire {
  pitch(id); validatePitchWeights(source.book,source.weights);
  if (!preseasonOpen || source.learning) throw new RangeError('WINDOW_CLOSED');
  if (Object.hasOwn(source.book,id) && pitchMastery(source.book[id]!)>=1) throw new RangeError('ALREADY_LEARNED');
  if (replacement && (Object.keys(source.weights).length!==4 || !Object.hasOwn(source.weights,replacement.pitchId) || !replacement.windowId || source.usedWindows.includes(replacement.windowId))) throw new RangeError('INVALID_REPLACEMENT');
  if (Object.keys(source.weights).length >= 4 && !replacement) throw new RangeError('SLOT_CONFLICT');
  if (source.ledger.baseSpentUnits+source.ledger.baseReservedUnits+100_000 > 200_000) throw new RangeError('INSUFFICIENT_BUDGET');
  const next=structuredClone(source);
  if(replacement) {
    const remaining={...next.weights};delete remaining[replacement.pitchId];
    // Normalize the surviving loadout with the same largest-remainder/lower-bound rule as 101.
    const ids=Object.keys(remaining).sort() as PitchId[];
    const total=ids.reduce((sum,key)=>sum+remaining[key]!,0);
    const normalized:PitchWeights={};
    const shares=ids.map(key=>({key,whole:Math.floor(100*remaining[key]!/total),rem:100*remaining[key]!%total})).sort((a,b)=>b.rem-a.rem || (a.key<b.key?-1:1));
    let extra=100-shares.reduce((sum,share)=>sum+share.whole,0);
    for(const share of shares) normalized[share.key]=share.whole+(extra-- > 0?1:0);
    validatePitchWeights(next.book,normalized);next.weights=normalized;next.usedWindows.push(replacement.windowId);
  }
  // A new annual plan keeps unfinished XP earned before injury (user decision 2026-10-26).
  next.book[id]??=0; next.ledger.baseReservedUnits+=100_000;
  next.learning={pitchId:id,quarters:[],carryNumerator:'0',carryDenominator:'1'};
  return next;
}
const gcd=(a:bigint,b:bigint):bigint=>b===0n?a:gcd(b,a%b);
export function settlePitchLearning(source: Repertoire, input: {quarter:1|2|3|4; healthyDays:number; registeredDays:number; numerator:5|6|15; completedGames:number; scheduledGames:number}): Repertoire {
  const plan=source.learning;
  if (!plan) throw new RangeError('NO_LEARNING_PLAN');
  for (const value of [input.quarter,input.healthyDays,input.registeredDays,input.completedGames,input.scheduledGames]) if (!Number.isSafeInteger(value) || value<0) throw new RangeError('INVALID_QUARTER');
  if (input.quarter<1 || input.quarter>4 || input.healthyDays>input.registeredDays || input.scheduledGames<1 || input.completedGames>input.scheduledGames || ![5,6,15].includes(input.numerator)) throw new RangeError('INVALID_QUARTER');
  const previous=plan.quarters[input.quarter-1];
  if (previous) {
    if (previous.healthyDays!==input.healthyDays || previous.registeredDays!==input.registeredDays || previous.numerator!==input.numerator) throw new RangeError('EVIDENCE_REUSED');
    return structuredClone(source);
  }
  if (input.quarter!==plan.quarters.length+1 || input.completedGames<Math.ceil(input.scheduledGames*input.quarter/4)) throw new RangeError('QUARTER_NOT_READY');
  const next=structuredClone(source), nextPlan=next.learning!;
  if (next.ledger.baseReservedUnits<25_000) throw new RangeError('INVALID_RESERVATION');
  next.ledger.baseReservedUnits-=25_000;
  const oldN=BigInt(plan.carryNumerator),oldD=BigInt(plan.carryDenominator), d=BigInt(input.registeredDays || 1);
  if(oldN<0n || oldD<=0n || oldN>=oldD) throw new RangeError('INVALID_CARRY');
  const numerator=oldN*d+25_000n*BigInt(input.healthyDays)*oldD, denominator=oldD*d;
  const candidate=Number(numerator/denominator), remainder=numerator%denominator, divisor=gcd(remainder,denominator);
  nextPlan.carryNumerator=(remainder/divisor).toString();nextPlan.carryDenominator=(denominator/divisor).toString();
  const grant=grantPitchXp(next.ledger,{evidenceKey:JSON.stringify([source.seasonId,'learning',plan.pitchId,input.quarter]),pitchId:plan.pitchId,candidateBaseUnits:candidate,currentPitchXpUnits:next.book[plan.pitchId]!,numerator:input.numerator});
  next.ledger=grant.ledger;next.book[plan.pitchId]=grant.xpUnits;
  nextPlan.quarters.push({healthyDays:input.healthyDays,registeredDays:input.registeredDays,numerator:input.numerator});
  return next;
}
export function grantPracticePitchXp(source:Repertoire,evidenceKey:string,id:PitchId,outs:number,numerator:5|6|15):Repertoire {
  pitch(id);
  if (!Object.hasOwn(source.weights,id) || !Number.isSafeInteger(outs) || outs<0 || outs>3) throw new RangeError('INVALID_PRACTICE');
  const next=structuredClone(source),grant=grantPitchXp(source.ledger,{evidenceKey,pitchId:id,candidateBaseUnits:Math.min(600,outs*200),currentPitchXpUnits:source.book[id]!,numerator});
  next.ledger=grant.ledger;next.book[id]=grant.xpUnits;return next;
}
export function aiPitchWeights(book:PitchBook):PitchWeights {
  validatePitchBook(book);
  const ids=(Object.keys(book) as PitchId[]).filter(id=>pitchMastery(book[id]!)>=1).sort((a,b)=>pitchMastery(book[b]!)-pitchMastery(book[a]!) || (a<b?-1:1)).slice(0,4);
  if(ids.length<2) throw new RangeError('INSUFFICIENT_LEARNED_PITCHES');
  const weights=ids.length===2?[60,40]:ids.length===3?[50,30,20]:[40,30,20,10];
  return Object.fromEntries(ids.map((id,i)=>[id,weights[i]!]));
}
export function aiLearningPitch(source:Repertoire):PitchId|null {
  validatePitchWeights(source.book,source.weights);
  return source.learning || Object.keys(source.weights).length>=4 || Object.values(source.book).reduce((a,b)=>a+b,0)<500_000 ? null : PITCH_IDS.find(id=>!Object.hasOwn(source.book,id)) ?? null;
}
export function copyPitchBook(book:PitchBook,weights:PitchWeights):{book:PitchBook;weights:PitchWeights} {
  validatePitchWeights(book,weights);
  return {book:Object.fromEntries(Object.entries(book).map(([id,xp])=>{const grade=pitchMastery(xp);return [id,THRESHOLDS[grade===0?0:Math.max(1,Math.floor(grade/2))]!];})),weights:{...weights}};
}

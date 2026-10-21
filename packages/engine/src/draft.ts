import {US_DIRECT_MIN_SCOUT_SCORE} from '@playball/rules';
import type {PlayerKind} from '@playball/rules';
import {assessmentMidpointScore} from './assessment.js';
import type {PotentialRange} from './assessment.js';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';
const LOW=[81,77,73,69,65,61,57,53,49,45];
export interface DraftEvaluation {baseScore:number;hasEligibleClubSlot:boolean}
function valid(input:DraftEvaluation):void {if(!Number.isFinite(input.baseScore) || input.baseScore<0 || input.baseScore>100 || typeof input.hasEligibleClubSlot!=='boolean') throw new RangeError('INVALID_DRAFT_EVALUATION');}
export function draftRound(score:number):number|null {
  if(!Number.isFinite(score)) throw new RangeError('INVALID_DRAFT_SCORE');
  const index=LOW.findIndex(low=>score>=low);return index<0?null:index+1;
}
/** 34: exact interval overlap for the same uniform[-5,5) evaluation used in the draw. */
export function draftPreview(input:DraftEvaluation) {
  valid(input);const lo=input.baseScore-5,hi=input.baseScore+5;
  const roundProbabilities=LOW.map((low,i)=>({round:i+1,probability:input.hasEligibleClubSlot?Math.max(0,Math.min(hi,i===0?Infinity:LOW[i-1]!)-Math.max(lo,low))/10:0}));
  const selectionProbability=roundProbabilities.reduce((sum,r)=>sum+r.probability,0),best=Math.max(...roundProbabilities.map(r=>r.probability));
  return {probabilityKind:'EXACT' as const,selectionProbability,undraftedProbability:1-selectionProbability,roundProbabilities,conditionalLikelyRounds:best===0?[]:roundProbabilities.filter(r=>Math.abs(r.probability-best)<1e-12).map(r=>r.round),possibleRounds:roundProbabilities.filter(r=>r.probability>0).map(r=>r.round)};
}
/** Persist the returned result once per assessment. This is not an offer/contract acceptance. */
export function drawDraft(input:DraftEvaluation,rng:RngState) {
  valid(input);
  if(!input.hasEligibleClubSlot) return {score:null,round:null,state:{...rng}};
  const draw=nextFloat(rng),score=input.baseScore-5+10*draw.value;
  return {score,round:draftRound(score),state:draw.state};
}
export function draftBaseScore(overall:number,adjustedPerformance:number):number {
  if([overall,adjustedPerformance].some(n=>!Number.isFinite(n) || n<0 || n>100)) throw new RangeError('INVALID_DRAFT_SCORE');
  return .7*overall+.3*adjustedPerformance;
}
/** US evaluation uses the assessed range midpoint, never raw hidden potential. */
export function usDirectBaseScore(input:{kind:PlayerKind;roleScore:number;adjustedPerformance:number;ranges:Readonly<Record<string,PotentialRange>>}):number {
  if([input.roleScore,input.adjustedPerformance].some(n=>!Number.isFinite(n) || n<0 || n>100)) throw new RangeError('INVALID_US_EVALUATION');
  return .5*input.roleScore+.3*input.adjustedPerformance+.2*assessmentMidpointScore(input.kind,input.ranges);
}
/** Same one-shot uniform[-5,5) model as the draft; preview never advances RNG. */
export function usDirectPreview(baseScore:number):{probabilityKind:'EXACT';candidateProbability:number} {
  if(!Number.isFinite(baseScore) || baseScore<0 || baseScore>100) throw new RangeError('INVALID_US_EVALUATION');
  return {probabilityKind:'EXACT',candidateProbability:Math.max(0,Math.min(1,(baseScore+5-US_DIRECT_MIN_SCOUT_SCORE)/10))};
}
export function drawUsDirectEvaluation(baseScore:number,rng:RngState) {
  usDirectPreview(baseScore);const draw=nextFloat(rng),score=baseScore-5+10*draw.value;
  return {score,candidate:score>=US_DIRECT_MIN_SCOUT_SCORE,state:draw.state};
}
export function canShowUsDirect(input:{scoutScore:number;validOfferCount:number;eligible:boolean}):boolean {
  if(!Number.isFinite(input.scoutScore) || input.scoutScore< -5 || input.scoutScore>=105 || !Number.isSafeInteger(input.validOfferCount) || input.validOfferCount<0 || typeof input.eligible!=='boolean') throw new RangeError('INVALID_US_ELIGIBILITY');
  return input.eligible && input.scoutScore>=US_DIRECT_MIN_SCOUT_SCORE && input.validOfferCount>0;
}

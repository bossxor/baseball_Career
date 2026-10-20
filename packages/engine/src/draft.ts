import {US_DIRECT_MIN_OVERALL} from '@playball/rules';
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
export function canShowUsDirect(input:{overall:number;amateurScore:number;validOfferCount:number;eligible:boolean}):boolean {
  if([input.overall,input.amateurScore].some(n=>!Number.isFinite(n) || n<0 || n>100) || !Number.isSafeInteger(input.validOfferCount) || input.validOfferCount<0) throw new RangeError('INVALID_US_ELIGIBILITY');
  return input.eligible && input.overall>=US_DIRECT_MIN_OVERALL && input.amateurScore>=50 && input.validOfferCount>0;
}

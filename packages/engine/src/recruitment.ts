import {nextFloat} from './rng.js';
import type {RngState} from './rng.js';

export interface RecruitmentOffer {offerKey:string;score:number;cheat?:boolean}
export interface RecruitmentDistribution {offers:readonly {offerKey:string;probability:number}[];outside:number}
/** 40: score is common to humans and AI. Role is an actual opportunity ratio, not a promised appearance. */
export function recruitmentOfferScore(input:{totalWon:number;desiredTotalWon:number;role:number;preference:number}):number {
 for(const n of [input.totalWon,input.desiredTotalWon])if(!Number.isSafeInteger(n) || n<=0)throw new RangeError('INVALID_RECRUITMENT_MONEY');
 for(const n of [input.role,input.preference])if(!Number.isFinite(n) || n<0 || n>1)throw new RangeError('INVALID_RECRUITMENT_FACTOR');
 return .7*(Math.min(input.totalWon/input.desiredTotalWon,1.5)/1.5)+.2*input.role+.1*input.preference;
}
/** A single player's round snapshot. Outside is an explicit outcome, including after round3. */
export function recruitmentDistribution(offers:readonly RecruitmentOffer[],round:1|2|3):RecruitmentDistribution {
 if(![1,2,3].includes(round) || new Set(offers.map(o=>o.offerKey)).size!==offers.length || offers.some(o=>!o.offerKey || !Number.isFinite(o.score) || o.score<0 || o.score>1 || o.cheat!==undefined && typeof o.cheat!=='boolean') || offers.filter(o=>o.cheat).length>1)throw new RangeError('INVALID_RECRUITMENT_OFFERS');
 const sorted=[...offers].sort((a,b)=>a.offerKey<b.offerKey?-1:a.offerKey>b.offerKey?1:0),cheat=sorted.find(o=>o.cheat);
 if(cheat)return {offers:sorted.map(o=>({offerKey:o.offerKey,probability:o===cheat?1:0})),outside:0};
 const outside=round===3?.5:1,weights=sorted.map(o=>Math.exp(6*(o.score-.6))),total=outside+weights.reduce((a,b)=>a+b,0);
 return {offers:sorted.map((o,i)=>({offerKey:o.offerKey,probability:weights[i]!/total})),outside:outside/total};
}
/** Exactly one isolated draw for a nonempty candidate set; there is no re-roll on a lost response/JSON resume. */
export function resolveRecruitmentOffers(offers:readonly RecruitmentOffer[],round:1|2|3,rng:RngState){
 const distribution=recruitmentDistribution(offers,round);if(!distribution.offers.length)return {offerKey:null,distribution,state:structuredClone(rng)};
 const draw=nextFloat(rng);let cumulative=0;
 for(const o of distribution.offers){cumulative+=o.probability;if(draw.value<cumulative)return {offerKey:o.offerKey,distribution,state:draw.state};}
 return {offerKey:null,distribution,state:draw.state};
}

import {roleScore,US_DIRECT_MIN_SCOUT_SCORE} from '@playball/rules';
import type {PotentialRange} from './assessment.js';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import {usDirectBaseScore,drawUsDirectEvaluation,canShowUsDirect} from './draft.js';
import {createWorldStream,nextInteger} from './rng.js';
import type {RngState} from './rng.js';
import {canonicalJson} from './game.js';

/** Trusted recruitment inventory. This is not a generated US league or its season roster. */
export interface UsRecruitmentWorld {
 schemaVersion:1;worldKey:string;seasonKey:string;seed:string;
 registeredPlayerKeys:readonly string[];
 clubs:readonly {id:string;name:string;rookieSlots:number;aSlots:number;availableBudgetUsd:number;nationalReleaseAllowed:boolean;militaryReturnOption:boolean}[];
}
export interface UsDirectInput {
 assessmentKey:string;player:DevelopmentPlayer;adjustedPerformance:number;
 ranges:Readonly<Record<string,PotentialRange>>;eligible:boolean;issuedWorldDay:number;expiresWorldDay:number;
}
export interface UsDirectOffer {
 offerKey:string;clubId:string;clubName:string;type:'US_MINOR';currency:'USD';initialLevel:'ROOKIE'|'A';
 signingBonusUsd:number;annualSalaryUsd:number;controlSeasons:6;firstTeamGuaranteed:false;
 nationalReleaseAllowed:boolean;militaryReturnOption:boolean;
}
export interface UsDirectSigning {
 receiptKey:string;offer:UsDirectOffer;playerKey:string;seasonKey:string;signedWorldDay:number;
 contract:{contractKey:string;type:'US_MINOR';currency:'USD';status:'RESERVED';annualSalaryUsd:number;signingBonusUsd:number;controlSeasons:6};
 rights:{territory:'US';holderOrgId:string;sourceType:'AMATEUR';playerKey:string};
 registration:{status:'PENDING_SEASON_ACTIVATION';level:'ROOKIE'|'A';clubId:string;playerKey:string};
 income:{entryKey:string;currency:'USD';amount:number;kind:'SIGNING_BONUS'};
 availableBudgetBeforeUsd:number;availableBudgetAfterUsd:number;
}
export interface UsDirectProgram {
 schemaVersion:1;version:1|2;sourceBasis:string;input:UsDirectInput;
 baseScore:number;score:number;rng:RngState;offers:readonly UsDirectOffer[];
 decision:'PENDING'|'SIGNED'|'DECLINED';signing:UsDirectSigning|null;
}
export function assertUsRecruitmentWorld(world:UsRecruitmentWorld):void {
 if(world.schemaVersion!==1 || !world.worldKey || !world.seasonKey || !world.seed || world.clubs.length>30 || new Set(world.clubs.map(c=>c.id)).size!==world.clubs.length || world.registeredPlayerKeys.some(k=>typeof k!=='string' || !k) || new Set(world.registeredPlayerKeys).size!==world.registeredPlayerKeys.length)throw new RangeError('INVALID_US_RECRUITMENT_WORLD');
 for(const c of world.clubs)if(!c.id || !c.name || [c.rookieSlots,c.aSlots].some(n=>!Number.isSafeInteger(n) || n<0 || n>160) || !Number.isSafeInteger(c.availableBudgetUsd) || c.availableBudgetUsd<0 || typeof c.nationalReleaseAllowed!=='boolean' || typeof c.militaryReturnOption!=='boolean')throw new RangeError('INVALID_US_RECRUITMENT_CLUB');
}
function validateInput(world:UsRecruitmentWorld,input:UsDirectInput):void {
 assertUsRecruitmentWorld(world);validateDevelopmentPlayer(input.player);
 if(!input.assessmentKey || typeof input.eligible!=='boolean' || !Number.isSafeInteger(input.issuedWorldDay) || input.issuedWorldDay<0 || !Number.isSafeInteger(input.expiresWorldDay) || input.expiresWorldDay<=input.issuedWorldDay || world.registeredPlayerKeys.includes(input.player.simulationKey))throw new RangeError('INVALID_US_CANDIDATE');
}
function basis(world:UsRecruitmentWorld,input:UsDirectInput):string {return canonicalJson({world,input});}
function evaluation(world:UsRecruitmentWorld,input:UsDirectInput){
 validateInput(world,input);
 const baseScore=usDirectBaseScore({kind:input.player.kind,roleScore:roleScore(input.player.kind,input.player.abilities,input.player.position),adjustedPerformance:input.adjustedPerformance,ranges:input.ranges});
 const start=createWorldStream(world.seed,JSON.stringify(['us-direct-1',world.worldKey,world.seasonKey,input.assessmentKey]),'roster'),draw=drawUsDirectEvaluation(baseScore,start);
 let rng=draw.state;const level=draw.score>=70?'A' as const:'ROOKIE' as const;
 // Preserve13's existing50..90 bonus curve; eligibility was raised separately.
 const bonus=Math.round(50_000+Math.max(0,Math.min(1,(draw.score-50)/40))*1_950_000),cost=bonus+30_000;
 const candidates=world.clubs.filter(c=>c.availableBudgetUsd>=cost && (level==='A'?c.aSlots:c.rookieSlots)>0).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),offers:UsDirectOffer[]=[];
 if(input.eligible && draw.candidate)while(candidates.length && offers.length<3){
  const chosen=nextInteger(rng,candidates.length);rng=chosen.state;const c=candidates.splice(chosen.value,1)[0]!;
  offers.push({offerKey:JSON.stringify(['us-direct-offer',input.assessmentKey,c.id]),clubId:c.id,clubName:c.name,type:'US_MINOR',currency:'USD',initialLevel:level,signingBonusUsd:bonus,annualSalaryUsd:30_000,controlSeasons:6,firstTeamGuaranteed:false,nationalReleaseAllowed:c.nationalReleaseAllowed,militaryReturnOption:c.militaryReturnOption});
 }
 return {baseScore,score:draw.score,rng,offers};
}
function signing(world:UsRecruitmentWorld,p:UsDirectProgram,offerKey:string,signedWorldDay:number):UsDirectSigning {
 const offer=p.offers.find(o=>o.offerKey===offerKey);if(!offer)throw new RangeError('US_OFFER_NOT_FOUND');
 const c=world.clubs.find(c=>c.id===offer.clubId)!,playerKey=p.input.player.simulationKey,receiptKey=JSON.stringify(['us-direct-signing',p.input.assessmentKey]),cost=offer.signingBonusUsd+offer.annualSalaryUsd;
 return {receiptKey,offer:{...offer},playerKey,seasonKey:world.seasonKey,signedWorldDay,contract:{contractKey:receiptKey,type:'US_MINOR',currency:'USD',status:'RESERVED',annualSalaryUsd:offer.annualSalaryUsd,signingBonusUsd:offer.signingBonusUsd,controlSeasons:6},rights:{territory:'US',holderOrgId:offer.clubId,sourceType:'AMATEUR',playerKey},registration:{status:'PENDING_SEASON_ACTIVATION',level:offer.initialLevel,clubId:offer.clubId,playerKey},income:{entryKey:JSON.stringify(['us-signing-income',receiptKey]),currency:'USD',amount:offer.signingBonusUsd,kind:'SIGNING_BONUS'},availableBudgetBeforeUsd:c.availableBudgetUsd,availableBudgetAfterUsd:c.availableBudgetUsd-cost};
}
export function prepareUsDirect(world:UsRecruitmentWorld,input:UsDirectInput):UsDirectProgram {
 return {schemaVersion:1,version:1,sourceBasis:basis(world,input),input:structuredClone(input),...evaluation(world,input),decision:'PENDING',signing:null};
}
export function assertUsDirect(world:UsRecruitmentWorld,p:UsDirectProgram):void {
 const expected=evaluation(world,p.input);
 if(p.schemaVersion!==1 || p.sourceBasis!==basis(world,p.input) || p.version!==(p.decision==='PENDING'?1:2) || !['PENDING','SIGNED','DECLINED'].includes(p.decision) || canonicalJson(expected)!==canonicalJson({baseScore:p.baseScore,score:p.score,rng:p.rng,offers:p.offers}))throw new RangeError('STALE_US_OFFER_SET');
 if(p.decision==='SIGNED'){
  if(!p.signing || !Number.isSafeInteger(p.signing.signedWorldDay) || p.signing.signedWorldDay<p.input.issuedWorldDay || p.signing.signedWorldDay>=p.input.expiresWorldDay || canonicalJson(p.signing)!==canonicalJson(signing(world,p,p.signing.offer.offerKey,p.signing.signedWorldDay)))throw new RangeError('INVALID_US_SIGNING');
 }else if(p.signing!==null)throw new RangeError('INVALID_US_SIGNING');
}
function validDay(p:UsDirectProgram,worldDay:number):void {if(!Number.isSafeInteger(worldDay) || worldDay<(p.signing?.signedWorldDay??p.input.issuedWorldDay))throw new RangeError('INVALID_US_WORLD_DAY');}
/** Public allowlist: input contains raw P and source snapshots; never spread it into responses. */
export function usDirectView(world:UsRecruitmentWorld,p:UsDirectProgram,worldDay:number){
 assertUsDirect(world,p);validDay(p,worldDay);const expired=worldDay>=p.input.expiresWorldDay,offers=p.decision==='PENDING' && !expired?p.offers.map(o=>({...o})):[];
 const reasonCode=p.decision==='DECLINED'?'DECLINED':p.decision==='SIGNED'?null:expired?'EXPIRED':!p.input.eligible?'INELIGIBLE':p.score<US_DIRECT_MIN_SCOUT_SCORE?'ASSESSMENT_BELOW_THRESHOLD':offers.length===0?'NO_ELIGIBLE_CLUB_SLOT_OR_BUDGET':null;
 return {assessmentKey:p.input.assessmentKey,version:p.version,status:p.decision==='SIGNED'?'SIGNED' as const:p.decision==='DECLINED'?'DECLINED' as const:expired?'EXPIRED' as const:'OPEN' as const,reasonCode,expiresWorldDay:p.input.expiresWorldDay,offers,visible:canShowUsDirect({scoutScore:p.score,validOfferCount:offers.length,eligible:p.input.eligible})};
}
/** One immutable reservation receipt; league activation posts its budget/income/roster exactly once later. */
export function decideUsDirect(world:UsRecruitmentWorld,p:UsDirectProgram,expectedVersion:number,worldDay:number,decision:{type:'SIGN';offerKey:string}|{type:'DECLINE'}):UsDirectProgram {
 assertUsDirect(world,p);validDay(p,worldDay);
 if(p.version!==expectedVersion)throw new RangeError('US_OFFER_VERSION_CHANGED');
 if(p.decision!=='PENDING' || !['SIGN','DECLINE'].includes(decision.type))throw new RangeError('INVALID_US_DECISION');
 if(decision.type==='SIGN' && (!p.input.eligible || worldDay>=p.input.expiresWorldDay))throw new RangeError('US_OFFER_EXPIRED_OR_INELIGIBLE');
 const next:UsDirectProgram={...structuredClone(p),version:2,decision:decision.type==='SIGN'?'SIGNED':'DECLINED',signing:decision.type==='SIGN'?signing(world,p,decision.offerKey,worldDay):null};assertUsDirect(world,next);return next;
}

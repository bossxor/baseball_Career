import {canShowUsDirect} from './draft.js';
import {canonicalJson} from './game.js';

export type RetryEpisodeReason='HIGH_SCHOOL_UNDRAFTED'|'COLLEGE_UNDRAFTED'|'PRO_RELEASED'|'CONTRACT_EXPIRED'|'AMATEUR_RETURN_UNDRAFTED';
export type RetryCareerPhase='UNCONTRACTED_REVIEW'|'PREPARATION_PRE'|'PREPARATION_REGULAR'|'PREPARATION_RESULT'|'ROUTE_REVIEW'|'RETIRE_DECISION';
export interface RetryEpisode {episodeId:string;receiptKey:string;reason:RetryEpisodeReason;seasonKey:string;age:number}
export interface PreparationPeriod {
 worldSeasonId:string;episodeId:string;startDay:number;endDay:number;usageCharged:boolean;evidenceReceipt:string|null;kind?:'MANDATORY_RETURN';
}
export interface RetryCareerLedger {
 version:1;revision:number;worldKey:string;playerKey:string;seasonKey:string;age:number;careerPreparationUsed:number;
 phase:RetryCareerPhase;episodes:readonly RetryEpisode[];periods:readonly PreparationPeriod[];
}
export interface RetryRouteOffer {offerRef:string;expiresGameDay:number}
/** Server-owned rights/offer projection. HTTP commands must never supply these eligibility flags. */
export interface RetryRouteAuthority {
 worldKey:string;playerKey:string;seasonKey:string;age:number;worldDay:number;authorityRevision:number;
 hasProContractHistory:boolean;activeContract:boolean;domesticRightsAvailable:boolean;domesticDraftEligible:boolean;
 mandatoryReturnActive:boolean;militaryStatus:'UNRESOLVED'|'SERVING'|'COMPLETED'|'NOT_APPLICABLE';
 collegeAdmissionRefs:readonly string[];collegeResumeRef:string|null;
 domesticOffers:readonly RetryRouteOffer[];usOffers:readonly RetryRouteOffer[];usScoutScore:number;usRightsEligible:boolean;
 retirementAllowed:boolean;
}
const REASONS:readonly RetryEpisodeReason[]=['HIGH_SCHOOL_UNDRAFTED','COLLEGE_UNDRAFTED','PRO_RELEASED','CONTRACT_EXPIRED','AMATEUR_RETURN_UNDRAFTED'];
const PHASES:readonly RetryCareerPhase[]=['UNCONTRACTED_REVIEW','PREPARATION_PRE','PREPARATION_REGULAR','PREPARATION_RESULT','ROUTE_REVIEW','RETIRE_DECISION'];
const integer=(n:number,min=0)=>Number.isSafeInteger(n)&&n>=min;
const season=(key:string)=>/^\d{4}$/.test(key)&&Number(key)>=2027&&Number(key)<=9999;
function episodeKey(worldKey:string,playerKey:string,receiptKey:string):string {return JSON.stringify(['retry-episode',worldKey,playerKey,receiptKey]);}
/** Pure metadata check: safe to invoke from root readers without invoking a career view recursively. */
export function assertRetryCareerLedger(source:RetryCareerLedger,identity?:{worldKey:string;playerKey:string}):void {
 if(source.version!==1 || !integer(source.revision) || !source.worldKey || !source.playerKey || !season(source.seasonKey) || !integer(source.age,18) || source.age>45 || !PHASES.includes(source.phase) || !Array.isArray(source.episodes) || !source.episodes.length || !Array.isArray(source.periods) || !integer(source.careerPreparationUsed) || source.careerPreparationUsed>3 || identity&&(identity.worldKey!==source.worldKey||identity.playerKey!==source.playerKey))throw new RangeError('INVALID_RETRY_CAREER_LEDGER');
 const receipts=new Set<string>(),episodes=new Set<string>(),seasons=new Set<string>();
 for(const e of source.episodes){
  if(!e.receiptKey || receipts.has(e.receiptKey) || !REASONS.includes(e.reason) || e.episodeId!==episodeKey(source.worldKey,source.playerKey,e.receiptKey) || !season(e.seasonKey) || !integer(e.age,18) || e.age>source.age || Number(e.seasonKey)>Number(source.seasonKey))throw new RangeError('INVALID_RETRY_EPISODE');
  receipts.add(e.receiptKey);episodes.add(e.episodeId);
 }
 let charged=0,lastSeason=0;
 for(const p of source.periods){
  if(!season(p.worldSeasonId) || seasons.has(p.worldSeasonId) || !episodes.has(p.episodeId) || !integer(p.startDay) || !integer(p.endDay,p.startDay+1) || typeof p.usageCharged!=='boolean' || p.kind!==undefined&&p.kind!=='MANDATORY_RETURN' || p.evidenceReceipt!==null&&(typeof p.evidenceReceipt!=='string'||!p.evidenceReceipt) || p.usageCharged!==(p.kind!=='MANDATORY_RETURN'&&p.evidenceReceipt!==null) || Number(p.worldSeasonId)<=lastSeason || Number(p.worldSeasonId)>Number(source.seasonKey))throw new RangeError('INVALID_PREPARATION_PERIOD');
  seasons.add(p.worldSeasonId);lastSeason=Number(p.worldSeasonId);if(p.usageCharged)charged++;
 }
 const open=source.periods.filter(p=>p.evidenceReceipt===null),preparing=['PREPARATION_PRE','PREPARATION_REGULAR'].includes(source.phase);
 if(charged!==source.careerPreparationUsed || open.length!==(preparing?1:0) || open.some(p=>p!==source.periods.at(-1)||p.episodeId!==source.episodes.at(-1)!.episodeId||p.worldSeasonId!==source.seasonKey))throw new RangeError('PREPARATION_BUDGET_MISMATCH');
}
export function assertRetryCareerRevision(source:RetryCareerLedger,revision:number):void {
 assertRetryCareerLedger(source);
 if(!integer(revision) || revision!==source.revision)throw new RangeError('RETRY_REVISION_CHANGED');
 if(revision===Number.MAX_SAFE_INTEGER)throw new RangeError('RETRY_REVISION_LIMIT');
}
export function openRetryCareerEpisode(source:RetryCareerLedger|undefined,revision:number,input:{worldKey:string;playerKey:string;receiptKey:string;reason:RetryEpisodeReason;seasonKey:string;age:number}):RetryCareerLedger {
 if(!input.worldKey || !input.playerKey || !input.receiptKey || !REASONS.includes(input.reason) || !season(input.seasonKey) || !integer(input.age,18) || input.age>45)throw new RangeError('INVALID_RETRY_EPISODE');
 if(source)assertRetryCareerRevision(source,revision);else if(revision!==0)throw new RangeError('RETRY_REVISION_CHANGED');
 const episode:RetryEpisode={episodeId:episodeKey(input.worldKey,input.playerKey,input.receiptKey),receiptKey:input.receiptKey,reason:input.reason,seasonKey:input.seasonKey,age:input.age};
 if(source){
  if(source.worldKey!==input.worldKey || source.playerKey!==input.playerKey)throw new RangeError('RETRY_PLAYER_MISMATCH');
  const old=source.episodes.find(e=>e.receiptKey===input.receiptKey);
  if(old){if(canonicalJson(old)!==canonicalJson(episode))throw new RangeError('RETRY_EVIDENCE_REUSED');return structuredClone(source);}
  if(['PREPARATION_PRE','PREPARATION_REGULAR'].includes(source.phase) || Number(input.seasonKey)<Number(source.seasonKey) || input.age!==source.age+Number(input.seasonKey)-Number(source.seasonKey))throw new RangeError('RETRY_EPISODE_IN_PROGRESS');
 }
 const next:RetryCareerLedger={version:1,revision:(source?.revision??0)+1,worldKey:input.worldKey,playerKey:input.playerKey,seasonKey:input.seasonKey,age:input.age,careerPreparationUsed:source?.careerPreparationUsed??0,phase:'UNCONTRACTED_REVIEW',episodes:[...(source?.episodes??[]),episode],periods:structuredClone(source?.periods??[])};
 assertRetryCareerLedger(next);return next;
}
function assertAuthority(source:RetryCareerLedger,a:RetryRouteAuthority):void {
 assertRetryCareerLedger(source);
 if(a.worldKey!==source.worldKey || a.playerKey!==source.playerKey || a.seasonKey!==source.seasonKey || a.age!==source.age || !integer(a.worldDay) || !integer(a.authorityRevision) || !['UNRESOLVED','SERVING','COMPLETED','NOT_APPLICABLE'].includes(a.militaryStatus) || !Number.isFinite(a.usScoutScore) || a.usScoutScore< -5 || a.usScoutScore>=105 || [a.hasProContractHistory,a.activeContract,a.domesticRightsAvailable,a.domesticDraftEligible,a.mandatoryReturnActive,a.usRightsEligible,a.retirementAllowed].some(x=>typeof x!=='boolean') || !Array.isArray(a.collegeAdmissionRefs) || a.collegeAdmissionRefs.some(ref=>!ref) || new Set(a.collegeAdmissionRefs).size!==a.collegeAdmissionRefs.length || a.collegeResumeRef!==null&&typeof a.collegeResumeRef!=='string')throw new RangeError('INVALID_RETRY_AUTHORITY');
 for(const offers of [a.domesticOffers,a.usOffers])if(!Array.isArray(offers)||new Set(offers.map(o=>o.offerRef)).size!==offers.length||offers.some(o=>!o.offerRef||!integer(o.expiresGameDay)))throw new RangeError('INVALID_RETRY_OFFERS');
}
export function retryCareerRouteView(source:RetryCareerLedger,a:RetryRouteAuthority){
 assertAuthority(source,a);
 if(!['UNCONTRACTED_REVIEW','ROUTE_REVIEW','PREPARATION_RESULT','RETIRE_DECISION'].includes(source.phase))throw new RangeError('INVALID_RETRY_PHASE');
 const remaining=3-source.careerPreparationUsed,entryAge=source.age,militaryBlocked=a.militaryStatus==='SERVING'||a.militaryStatus==='UNRESOLVED'&&source.age+1>=28;
 const valid=(offers:readonly RetryRouteOffer[])=>offers.filter(o=>a.worldDay<o.expiresGameDay).map(o=>o.offerRef);
 const domestic=valid(a.domesticOffers),us=valid(a.usOffers),routes:{routeId:string;reasonCodes:string[];offerRefs:string[];consumesSeasons:number;ageAtCompletion:number}[]=[];
 if(!a.activeContract&&!militaryBlocked&&!a.mandatoryReturnActive&&a.domesticRightsAvailable&&remaining>0&&source.age+1<=45)routes.push({routeId:'PREPARATION',reasonCodes:['PREPARATION_REMAINING'],offerRefs:[],consumesSeasons:1,ageAtCompletion:source.age+1});
 if(!a.activeContract&&!militaryBlocked&&!a.mandatoryReturnActive&&!a.hasProContractHistory&&entryAge>=19&&entryAge<=22&&entryAge+3<=45&&a.collegeAdmissionRefs.length)routes.push({routeId:'COLLEGE_ENTRY',reasonCodes:['AMATEUR_COLLEGE_ELIGIBLE'],offerRefs:[...a.collegeAdmissionRefs],consumesSeasons:0,ageAtCompletion:entryAge+3});
 if(!a.activeContract&&!militaryBlocked&&!a.mandatoryReturnActive&&!a.hasProContractHistory&&a.collegeResumeRef)routes.push({routeId:'COLLEGE_RESUME',reasonCodes:['ENROLLMENT_REMAINS_VALID'],offerRefs:[a.collegeResumeRef],consumesSeasons:0,ageAtCompletion:entryAge});
 if(!a.activeContract&&!militaryBlocked&&!a.mandatoryReturnActive&&a.domesticRightsAvailable&&domestic.length)routes.push({routeId:'DOMESTIC_CONTRACT',reasonCodes:['VALID_OFFER'],offerRefs:domestic,consumesSeasons:0,ageAtCompletion:source.age});
 if(!a.activeContract&&!militaryBlocked&&canShowUsDirect({scoutScore:a.usScoutScore,validOfferCount:us.length,eligible:a.usRightsEligible}))routes.push({routeId:'US_CONTRACT',reasonCodes:['VALID_US_OFFER'],offerRefs:us,consumesSeasons:0,ageAtCompletion:source.age});
 if(a.militaryStatus==='UNRESOLVED')routes.push({routeId:'MILITARY_PLAN',reasonCodes:[militaryBlocked?'MILITARY_DEADLINE':'MILITARY_UNRESOLVED'],offerRefs:[],consumesSeasons:0,ageAtCompletion:source.age});
 if(a.mandatoryReturnActive)routes.push({routeId:'MANDATORY_RETURN',reasonCodes:['RETURN_PERIOD_REQUIRED'],offerRefs:[],consumesSeasons:0,ageAtCompletion:source.age});
 if(a.retirementAllowed)routes.push({routeId:'RETIRE',reasonCodes:['MANUAL_RETIREMENT'],offerRefs:[],consumesSeasons:0,ageAtCompletion:source.age});
 return {routePreviewId:canonicalJson(['retry-route',source,a]),routes,preparation:{used:source.careerPreparationUsed,remaining,consumesNextSeason:routes.some(r=>r.routeId==='PREPARATION')},rights:{domesticAvailable:a.domesticRightsAvailable,draftEligible:!a.hasProContractHistory&&a.domesticDraftEligible},militaryTasks:routes.filter(r=>r.routeId==='MILITARY_PLAN'),ageAtCompletion:entryAge};
}
export function beginRetryPreparation(source:RetryCareerLedger,revision:number,a:RetryRouteAuthority,input:{episodeId:string;seasonKey:string;routePreviewId:string;startDay:number;endDay:number}):RetryCareerLedger {
 assertRetryCareerRevision(source,revision);const view=retryCareerRouteView(source,a);
 if(view.routePreviewId!==input.routePreviewId)throw new RangeError('PREVIEW_STALE');
 if(source.careerPreparationUsed>=3)throw new RangeError('LIMIT_REACHED');
 if(!view.routes.some(r=>r.routeId==='PREPARATION'))throw new RangeError('NOT_ELIGIBLE');
 if(input.episodeId!==source.episodes.at(-1)!.episodeId || !season(input.seasonKey) || Number(input.seasonKey)!==Number(source.seasonKey)+1 || source.periods.some(p=>p.worldSeasonId===input.seasonKey) || !integer(input.startDay) || !integer(input.endDay,input.startDay+1))throw new RangeError('INVALID_PREPARATION_PERIOD');
 const next:RetryCareerLedger={...structuredClone(source),revision:revision+1,seasonKey:input.seasonKey,age:source.age+1,phase:'PREPARATION_PRE',periods:[...source.periods,{worldSeasonId:input.seasonKey,episodeId:input.episodeId,startDay:input.startDay,endDay:input.endDay,usageCharged:false,evidenceReceipt:null}]};assertRetryCareerLedger(next);return next;
}
/** Called only in the same pure result as official record/growth settlement. */
export function completeRetryPreparation(source:RetryCareerLedger,revision:number,input:{seasonKey:string;episodeId:string;evidenceReceipt:string}):RetryCareerLedger {
 assertRetryCareerRevision(source,revision);
 const p=source.periods.find(p=>p.worldSeasonId===input.seasonKey);
 if(!p||p.episodeId!==input.episodeId||!input.evidenceReceipt)throw new RangeError('INVALID_PREPARATION_RECEIPT');
 if(p.evidenceReceipt!==null){if(p.evidenceReceipt!==input.evidenceReceipt)throw new RangeError('PREPARATION_EVIDENCE_REUSED');return structuredClone(source);}
 const mandatory=p.kind==='MANDATORY_RETURN';
 if(source.phase!=='PREPARATION_REGULAR'||source.seasonKey!==input.seasonKey||!mandatory&&source.careerPreparationUsed>=3)throw new RangeError('INVALID_RETRY_PHASE');
 const next:RetryCareerLedger={...structuredClone(source),revision:revision+1,phase:'PREPARATION_RESULT',careerPreparationUsed:source.careerPreparationUsed+(mandatory?0:1),periods:source.periods.map(p=>p.worldSeasonId===input.seasonKey?{...p,usageCharged:!mandatory,evidenceReceipt:input.evidenceReceipt}:structuredClone(p))};assertRetryCareerLedger(next);return next;
}
export function acknowledgeRetryPreparationResult(source:RetryCareerLedger,revision:number,a:RetryRouteAuthority):RetryCareerLedger {
 assertRetryCareerRevision(source,revision);if(source.phase!=='PREPARATION_RESULT')throw new RangeError('INVALID_RETRY_PHASE');
 const view=retryCareerRouteView(source,a),hasRoute=view.routes.some(r=>!['RETIRE','MILITARY_PLAN'].includes(r.routeId));
 return {...structuredClone(source),revision:revision+1,phase:hasRoute?'ROUTE_REVIEW':'RETIRE_DECISION'};
}

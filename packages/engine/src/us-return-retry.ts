import type {UsAmateurReturnCareer} from './us-amateur-return-career.js';
import {assertUsAmateurReturnCareer} from './us-amateur-return-career.js';
import type {RetryCareerLedger,RetryRouteAuthority} from './retry-career.js';
import {assertRetryCareerLedger,retryCareerRouteView} from './retry-career.js';
import type {PreparationSeason} from './preparation-season.js';
import {assertPreparationSeason,startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,trainPreparationSeason,setPreparationPlan,completePreparationSeason,preparationSeasonView} from './preparation-season.js';
import {createUsReturnPreparationWorld} from './us-return-preparation.js';
import type {TrainingChoice} from './training.js';
import type {RecordLedger} from './records.js';
import {recordTotals} from './records.js';
import {overall} from '@playball/rules';
import {draftBaseScore} from './draft.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {createKboRosterWorld} from './kbo-world.js';
import type {KboRosterWorld} from './kbo-world.js';
import type {KboDraftProgram} from './kbo-draft.js';
import {prepareKboDraft,resolveKboDraft,decideKboDraft,assertKboDraft,kboDraftView} from './kbo-draft.js';
import {activateReturnedUsKbo} from './us-return-activation.js';
import {canonicalJson} from './game.js';
import {stageUsReturnMarket,materializeUsReturnMinorContract} from './us-return-us-market.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {mergeUsReturnRecords} from './us-return-activation.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {refreshCareerRepertoireEvents} from './repertoire-events.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';
import {createWorldEvent,completeBlockingEvent,validateEvent} from './events.js';
import type {EventInstance} from './events.js';
import type {AmateurRetryExit} from './career-retry-exhaustion.js';
export type UsReturnRetryUsOpportunity=ReturnType<typeof stageUsReturnMarket>&{assessmentKey:string;basis:string;ownerSeasonKey:string;sourceRevision:number;status:'AVAILABLE'|'NO_OFFER'|'DECLINED';declineReceipt?:string};
export interface UsReturnRetryDraft {world:KboRosterWorld;program:KboDraftProgram;preparationReceipt:string;basis:string}
export interface UsAmateurReturnRetryCareer {
 version:1;mode:'US_RETURN_RETRY';revision:number;entryReceipt:string;origin:UsAmateurReturnCareer;retry:RetryCareerLedger;status:'REVIEW'|'PREPARING'|'ARCHIVED';completedPreparation:readonly PreparationSeason[];preparation?:PreparationSeason;draft?:UsReturnRetryDraft;previousDrafts?:readonly UsReturnRetryDraft[];usOpportunities?:readonly UsReturnRetryUsOpportunity[];events?:readonly EventInstance[];retryExit?:AmateurRetryExit;
}
/** Origin is stored once in the destination root; this immutable delta refers to that exact return. */
export type UsAmateurReturnRetryArchive=Omit<UsAmateurReturnRetryCareer,'origin'>&{originReturnId:string};
export function usAmateurReturnRetryArchive(c:UsAmateurReturnRetryCareer):UsAmateurReturnRetryArchive {const {origin,...delta}=c;return structuredClone({...delta,originReturnId:origin.return.returnId});}
function entryReceipt(origin:UsAmateurReturnCareer):string {return JSON.stringify(['us-return-retry-entry',origin.return.returnId,origin.draft!.program.result!.receiptKey,origin.revision]);}
function assertOriginEvidence(origin:UsAmateurReturnCareer):void {
 if(!origin||origin.version!==1||!origin.source||!origin.return||!origin.retry||!Array.isArray(origin.events))throw new RangeError('INVALID_US_RETURN_RETRY_ORIGIN');
 assertUsAmateurReturnCareer(origin);
 const r=origin.return,draft=origin.draft,episode=origin.retry.episodes.at(-1),owner=origin.preparation??origin.service;
 if(!owner||!owner.seasonGrowth.finalized||owner.world.seasonKey!==r.years.at(-1)?.seasonKey||r.status!=='DRAFT_READY'||r.years.length!==2||!['COMPLETED','NOT_APPLICABLE'].includes(r.militaryStatus)||!draft||draft.program.result?.round!==null||draft.program.signing||draft.program.decision!=='PENDING'||origin.acceptedUs||episode?.reason!=='AMATEUR_RETURN_UNDRAFTED'||episode.receiptKey!==draft.program.result.receiptKey)throw new RangeError('US_RETURN_RETRY_NOT_AVAILABLE');
}
// Only deep-immutable archives are cached; every live preparation/ledger is still validated on every command.
const validatedOrigins=new WeakSet<UsAmateurReturnCareer>();
function assertImmutableOrigin(origin:UsAmateurReturnCareer):void {
 if(validatedOrigins.has(origin))return;
 assertOriginEvidence(origin);
 const seen=new WeakSet<object>(),pending:object[]=[origin];
 while(pending.length){const value=pending.pop()!;if(seen.has(value))continue;seen.add(value);for(const child of Object.values(value))if(child&&typeof child==='object')pending.push(child);Object.freeze(value);}
 validatedOrigins.add(origin);
}
function authority(c:UsAmateurReturnRetryCareer):RetryRouteAuthority {
 const origin=c.origin,r=origin.return,q=c.draft?.program;
 const us=currentUsOpportunity(c),offers=us?.status==='AVAILABLE'?us.offers:[];
 return {worldKey:c.retry.worldKey,playerKey:c.retry.playerKey,seasonKey:c.retry.seasonKey,age:c.retry.age,worldDay:c.preparation?(c.preparation.days.days.at(-1)?.day??Math.max(0,c.preparation.nextWorldDay-1)):r.years.at(-1)!.endWorldDay,authorityRevision:c.revision,hasProContractHistory:true,activeContract:Boolean(q?.signing),domesticRightsAvailable:true,domesticDraftEligible:true,mandatoryReturnActive:false,militaryStatus:r.militaryStatus,collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:q?.result?.round&&q.decision==='PENDING'?[{offerRef:q.result.receiptKey,ownerScope:{kind:'DECISION_WINDOW',sourceRef:q.result.receiptKey}}]:[],usOffers:offers.map(o=>({offerRef:o.offerKey,ownerScope:{kind:'DECISION_WINDOW',sourceRef:o.offerKey}})),usScoutScore:0,usRightsEligible:offers.length>0,retirementAllowed:false,returnedUsDraftProof:{returnId:r.returnId,sourceContractKey:r.sourceContractKey,initialUndraftedReceipt:origin.draft!.program.result!.receiptKey,draftMaximumAge:35}};
}
function currentUsOpportunity(c:UsAmateurReturnRetryCareer){return c.usOpportunities?.find(q=>q.ownerSeasonKey===c.retry.seasonKey);}
function opportunityBasis(c:UsAmateurReturnRetryCareer,owner:PreparationSeason|UsAmateurReturnCareer['source']):string {return canonicalJson([c.entryReceipt,owner.world.seasonKey,owner.world.players[c.retry.playerKey],owner.records.revision,owner.seasonGrowth,owner.health]);}
const validatedUsOpportunities=new WeakMap<UsReturnRetryUsOpportunity,{origin:UsAmateurReturnCareer;key:string}>();
function assertUsOpportunities(c:UsAmateurReturnRetryCareer):void {
 const quotes=c.usOpportunities??[];if(!Array.isArray(quotes)||new Set(quotes.map(q=>q?.ownerSeasonKey)).size!==quotes.length)throw new RangeError('INVALID_US_RETURN_RETRY_QUOTES');
 const declined:string[]=[];let previousYear=0,previousRevision=c.origin.revision;
 for(const q of quotes){
  const owner=[c.origin.preparation??c.origin.service!,...c.completedPreparation].find(p=>p.world.seasonKey===q?.ownerSeasonKey);
  if(!owner||Number(q.ownerSeasonKey)<=previousYear||q.sourceRevision<=previousRevision||!owner.seasonGrowth.finalized||!Number.isSafeInteger(q.sourceRevision)||q.sourceRevision<=c.origin.revision||q.sourceRevision>=c.revision||q.assessmentKey!==JSON.stringify(['us-return-retry-us',c.entryReceipt,q.ownerSeasonKey])||!['AVAILABLE','NO_OFFER','DECLINED'].includes(q.status)||(q.status==='DECLINED'?q.declineReceipt!==JSON.stringify(['us-return-retry-us-decline',q.assessmentKey]):q.declineReceipt!==undefined))throw new RangeError('INVALID_US_RETURN_RETRY_QUOTE');
  const basis=opportunityBasis(c,owner);if(q.basis!==basis)throw new RangeError('US_RETURN_RETRY_QUOTE_SOURCE_CHANGED');
  const validationKey=canonicalJson([basis,declined]);
  const cached=validatedUsOpportunities.get(q);
  if(cached?.key!==validationKey||cached.origin!==c.origin){
   const expected=stageUsReturnMarket(c.origin,owner,q.assessmentKey,declined);
   for(const field of ['world','inventory','offers','playerScore','retainedOfferRefs','blockedReturnOfferRefs'] as const)if(!same(q[field],expected[field]))throw new RangeError('US_RETURN_RETRY_QUOTE_CHANGED');
   if(q.status!=='DECLINED'&&q.status!==(q.offers.length?'AVAILABLE':'NO_OFFER'))throw new RangeError('US_RETURN_RETRY_QUOTE_CHANGED');
   const pending:object[]=[q],seen=new WeakSet<object>();while(pending.length){const obj=pending.pop()!;if(seen.has(obj))continue;seen.add(obj);for(const child of Object.values(obj))if(child&&typeof child==='object')pending.push(child);Object.freeze(obj);}
   validatedUsOpportunities.set(q,{origin:c.origin,key:validationKey});
  }
  if(q.status==='DECLINED')declined.push(...q.retainedOfferRefs);previousYear=Number(q.ownerSeasonKey);previousRevision=q.sourceRevision;
 }
}
function same(a:unknown,b:unknown):boolean {return a===b||canonicalJson(a)===canonicalJson(b);}
function initialRecords(c:UsAmateurReturnRetryCareer):RecordLedger {
 const owner=c.origin.preparation??c.origin.service!,key=c.retry.playerKey;
 // Complete US/NPC history stays in immutable origin; the active independent ledger keeps its actual participants.
 return {revision:owner.records.revision,games:Object.fromEntries(Object.entries(owner.records.games).filter(([,g])=>g.scope.leagueKey==='INDEPENDENT'||Object.hasOwn(g.batting,key)||Object.hasOwn(g.pitching,key)))};
}
function assertRecordPrefix(before:RecordLedger,after:RecordLedger):void {
 if(after.revision<before.revision||Object.entries(before.games).some(([key,g])=>!same(g,after.games[key])))throw new RangeError('US_RETURN_RETRY_RECORD_PREFIX_CHANGED');
}
function draftBasis(c:UsAmateurReturnRetryCareer,p:PreparationSeason):string {return canonicalJson([c.entryReceipt,p.result,p.world.worldKey,p.world.seasonKey,p.world.players[c.retry.playerKey],p.records.revision]);}
function assertResultScore(p:PreparationSeason):void {
 const key=p.world.protagonistKey,player=p.world.players[key]!,totals=recordTotals(p.records,{seasonKey:p.world.seasonKey,leagueKey:'INDEPENDENT',phase:'REGULAR'}),raw=player.kind==='HITTER'?recentBattingPerformance(totals.batting[key]??emptyBatting()):recentPitchingPerformance(totals.pitching[key]??emptyPitching()),adjusted=Math.max(0,Math.min(100,raw-20)),score=overall(player.kind,player.abilities);
 if(p.result?.adjustedPerformance!==adjusted||p.result.baseScore!==draftBaseScore(score.sumUnits/score.denominator,adjusted))throw new RangeError('US_RETURN_RETRY_RESULT_SCORE_CHANGED');
}
function assertDraft(c:UsAmateurReturnRetryCareer,q:UsReturnRetryDraft):void {
 const p=c.completedPreparation.find(p=>p.result?.receiptKey===q.preparationReceipt);if(!p)throw new RangeError('US_RETURN_RETRY_DRAFT_SOURCE_CHANGED');assertResultScore(p);assertKboDraft(q.world,q.program);
 if(q.basis!==draftBasis(c,p)||q.world.worldKey!==c.origin.return.worldKey||q.world.seed!==c.origin.source.world.seed||q.world.seasonKey!==String(Number(p.world.seasonKey)+1)||q.program.assessmentKey!==JSON.stringify(['us-return-retry-draft',c.origin.return.returnId,p.result!.receiptKey,q.world.seasonKey])||!same(q.program.input.player,p.world.players[c.retry.playerKey])||q.program.input.baseScore!==p.result!.baseScore)throw new RangeError('US_RETURN_RETRY_DRAFT_SOURCE_CHANGED');
}
function terminalDomesticAssessment(c:UsAmateurReturnRetryCareer):boolean {
 const p=c.draft?.program;return c.completedPreparation.length===0||c.retry.age>35&&!p||Boolean(p?.result&&!p.signing&&(p.result.round===null||p.decision==='DECLINED'));
}
export function assertUsAmateurReturnRetryCareer(c:UsAmateurReturnRetryCareer):void {
 if(!c||c.version!==1||c.mode!=='US_RETURN_RETRY'||!Number.isSafeInteger(c.revision)||!c.origin||c.revision<=c.origin.revision||!['REVIEW','PREPARING','ARCHIVED'].includes(c.status)||!Array.isArray(c.completedPreparation))throw new RangeError('INVALID_US_RETURN_RETRY_ROOT');
 assertImmutableOrigin(c.origin);assertRetryCareerLedger(c.retry);
 if(c.entryReceipt!==entryReceipt(c.origin)||!same(c.retry.episodes,c.origin.retry.episodes)||c.origin.retry.periods.some((p,i)=>!same(p,c.retry.periods[i])))throw new RangeError('US_RETURN_RETRY_SOURCE_CHANGED');
 let previous=initialRecords(c),lastPlayer=c.origin.return.years.at(-1)!.endingPlayer;
 for(const [i,p]of c.completedPreparation.entries()){
  assertPreparationSeason(p);assertRecordPrefix(previous,p.records);
  if(p.phase!=='PREPARATION_RESULT'||p.world.seasonKey!==String(Number(c.origin.retry.seasonKey)+i+1)||p.retry.age!==c.origin.retry.age+i+1||p.retry.careerPreparationUsed!==c.origin.retry.careerPreparationUsed+i+1||p.retry.periods.at(-1)?.kind!==undefined||!same(p.retry.episodes,c.origin.retry.episodes)||!same(p.retry.periods,c.retry.periods.slice(0,c.origin.retry.periods.length+i+1)))throw new RangeError('US_RETURN_RETRY_COMPLETION_CHANGED');
  const opening={...p.seasonGrowth.seasonStart,age:lastPlayer.age,fatigue:lastPlayer.fatigue,focus:lastPlayer.focus,archetype:lastPlayer.archetype};
  if(!same(opening,lastPlayer))throw new RangeError('US_RETURN_RETRY_PLAYER_CARRY_CHANGED');
  previous=p.records;lastPlayer=p.world.players[c.retry.playerKey]!;
 }
 const p=c.preparation;
 if(p){
  assertPreparationSeason(p);
  if(!same(p.retry,c.retry)||p.world.worldKey!==c.origin.return.worldKey||p.world.protagonistKey!==c.origin.return.playerKey||p.world.seed!==c.origin.source.world.seed||p.difficulty!==c.origin.source.difficulty||c.status==='PREPARING'&&p.phase==='PREPARATION_RESULT'||c.status!=='PREPARING'&&(p.phase!=='PREPARATION_RESULT'||!same(p,c.completedPreparation.at(-1))))throw new RangeError('US_RETURN_RETRY_PREPARATION_CHANGED');
  if(c.status==='PREPARING'){
   assertRecordPrefix(previous,p.records);
   if(p.world.seasonKey!==String(Number(c.origin.retry.seasonKey)+c.completedPreparation.length+1)||p.retry.age!==lastPlayer.age+1||p.retry.periods.length!==c.origin.retry.periods.length+c.completedPreparation.length+1||p.retry.periods.at(-1)?.kind!==undefined||!same({...p.seasonGrowth.seasonStart,age:lastPlayer.age,fatigue:lastPlayer.fatigue,focus:lastPlayer.focus,archetype:lastPlayer.archetype},lastPlayer))throw new RangeError('US_RETURN_RETRY_PLAYER_CARRY_CHANGED');
  }
 }else if(c.status==='PREPARING'||c.completedPreparation.length||!same(c.retry,c.origin.retry))throw new RangeError('US_RETURN_RETRY_SOURCE_CHANGED');
 const previousDrafts=c.previousDrafts??[],expectedPrevious=c.completedPreparation.filter((p,i)=>p.retry.age<=35&&(c.status==='PREPARING'||i<c.completedPreparation.length-1)).map(p=>p.result!.receiptKey);
 if(!Array.isArray(previousDrafts)||!same(previousDrafts.map(q=>q.preparationReceipt),expectedPrevious))throw new RangeError('US_RETURN_RETRY_DRAFT_HISTORY_CHANGED');
 for(const q of previousDrafts){assertDraft(c,q);if(q.program.signing||!q.program.result||q.program.result.round!==null&&q.program.decision!=='DECLINED')throw new RangeError('US_RETURN_RETRY_DRAFT_HISTORY_CHANGED');}
 if(c.draft){assertDraft(c,c.draft);if(c.status==='PREPARING'||c.draft.preparationReceipt!==c.completedPreparation.at(-1)?.result?.receiptKey)throw new RangeError('US_RETURN_RETRY_DRAFT_SOURCE_CHANGED');}
 if(c.retry.careerPreparationUsed!==c.origin.retry.careerPreparationUsed+c.completedPreparation.length)throw new RangeError('US_RETURN_RETRY_BUDGET_CHANGED');
 assertUsOpportunities(c);
 assertExhaustion(c);
}
function revision(c:UsAmateurReturnRetryCareer,n:number,retirement=false):void {
 assertUsAmateurReturnRetryCareer(c);if(!Number.isSafeInteger(n)||c.revision!==n||n===Number.MAX_SAFE_INTEGER)throw new RangeError('US_RETURN_RETRY_REVISION_CHANGED');
 if(c.retryExit&&!retirement)throw new RangeError('US_RETURN_RETRY_RETIREMENT_PENDING');
}
function publish(c:UsAmateurReturnRetryCareer,p:PreparationSeason):UsAmateurReturnRetryCareer {
 const next:UsAmateurReturnRetryCareer={...c,revision:c.revision+1,retry:p.retry,preparation:p};assertUsAmateurReturnRetryCareer(next);return next;
}
export function openUsAmateurReturnRetry(origin:UsAmateurReturnCareer,revision:number):UsAmateurReturnRetryCareer {
 assertOriginEvidence(origin);if(origin.revision!==revision||!Number.isSafeInteger(revision)||revision===Number.MAX_SAFE_INTEGER)throw new RangeError('US_RETURN_RETRY_REVISION_CHANGED');
 const c:UsAmateurReturnRetryCareer={version:1,mode:'US_RETURN_RETRY',revision:revision+1,entryReceipt:entryReceipt(origin),origin:structuredClone(origin),retry:structuredClone(origin.retry),status:'REVIEW',completedPreparation:[]};
 assertUsAmateurReturnRetryCareer(c);return c;
}
export function usAmateurReturnRetryRoutesView(c:UsAmateurReturnRetryCareer){
 assertUsAmateurReturnRetryCareer(c);if(c.status!=='REVIEW')throw new RangeError('US_RETURN_RETRY_ROUTE_NOT_READY');
 const view=retryCareerRouteView(c.retry,authority(c));
 const us=currentUsOpportunity(c);
 return {...view,routes:c.retryExit?[]:view.routes.filter(r=>r.routeId!=='PREPARATION'||terminalDomesticAssessment(c)),revision:c.revision,status:c.status,draft:c.draft?kboDraftView(c.draft.world,c.draft.program):null,needsDomesticAssessment:c.completedPreparation.length>0&&c.retry.age<=35&&!c.draft,activationRequired:Boolean(c.draft?.program.signing),usOpportunity:us?{status:us.status,assessmentKey:us.assessmentKey,targetSeasonKey:us.world.seasonKey,offers:us.status==='AVAILABLE'?structuredClone(us.offers):[],unresolvedReturnOptionCount:us.status==='DECLINED'?0:us.retainedOfferRefs.length}:{status:'UNASSESSED' as const}};
}

export function assessUsAmateurReturnRetryUsOpportunity(c:UsAmateurReturnRetryCareer,n:number):UsAmateurReturnRetryCareer {
 revision(c,n);if(c.status!=='REVIEW'||c.draft?.program.signing)throw new RangeError('US_RETURN_RETRY_US_NOT_READY');
 if(currentUsOpportunity(c))return c;
 const owner=c.preparation??c.origin.preparation??c.origin.service!,assessmentKey=JSON.stringify(['us-return-retry-us',c.entryReceipt,c.retry.seasonKey]),declined=(c.usOpportunities??[]).filter(q=>q.status==='DECLINED').flatMap(q=>q.retainedOfferRefs),stage=stageUsReturnMarket(c.origin,owner,assessmentKey,declined);
 const quote:UsReturnRetryUsOpportunity={...stage,assessmentKey,basis:opportunityBasis(c,owner),ownerSeasonKey:c.retry.seasonKey,sourceRevision:n,status:stage.offers.length?'AVAILABLE':'NO_OFFER'};
 const next:UsAmateurReturnRetryCareer={...c,revision:n+1,usOpportunities:[...(c.usOpportunities??[]),quote]};assertUsAmateurReturnRetryCareer(next);return next;
}
export function declineUsAmateurReturnRetryUsOpportunity(c:UsAmateurReturnRetryCareer,n:number,assessmentKey:string):UsAmateurReturnRetryCareer {
 revision(c,n);const quote=currentUsOpportunity(c);if(c.status!=='REVIEW'||c.draft?.program.signing||!quote||quote.assessmentKey!==assessmentKey)throw new RangeError('US_RETURN_RETRY_US_QUOTE_CHANGED');
 if(quote.status==='DECLINED')return c;
 const next:UsAmateurReturnRetryCareer={...c,revision:n+1,usOpportunities:c.usOpportunities!.map(q=>q===quote?{...q,status:'DECLINED',declineReceipt:JSON.stringify(['us-return-retry-us-decline',q.assessmentKey])}:q)};assertUsAmateurReturnRetryCareer(next);return next;
}

/** Validated epoch for native US readers; absence years remain in the return archive, never fabricated US seasons. */
export function usReturnRetryContinuation(c:UsCareer):NonNullable<UsCareer['usReturnContinuation']> {
 const history=c.usAmateurReturnRetryHistory,origin=c.usAmateurReturnHistory,offerKey=c.usReturnContinuation?.retryOfferKey;
 if(!history||!origin||typeof offerKey!=='string'||!offerKey)throw new RangeError('INVALID_US_RETURN_RETRY_CONTINUATION');
 const {originReturnId,...delta}=history,root:UsAmateurReturnRetryCareer={...delta,origin};if(originReturnId!==origin.return.returnId)throw new RangeError('INVALID_US_RETURN_RETRY_CONTINUATION');assertUsAmateurReturnRetryCareer(root);
 const q=currentUsOpportunity(root);if(root.status!=='REVIEW'||root.draft?.program.signing||!q||c.revision<=root.revision)throw new RangeError('INVALID_US_RETURN_RETRY_CONTINUATION');
 const stage=materializeUsReturnMinorContract(origin,q,offerKey);
 const expected:NonNullable<UsCareer['usReturnContinuation']>={retryOfferKey:offerKey,playerAge:stage.world.players[root.retry.playerKey]!.age,organizationId:stage.offer.organizationId,contract:stage.contract,inventory:stage.inventory,sourceMinorYears:origin.source.minorYears?.length??0,sourceMajorYears:origin.source.majorYears?.length??0,remainingControlSeasons:1,paidUsd:30000};
 if(!same(c.usReturnContinuation,expected))throw new RangeError('INVALID_US_RETURN_RETRY_CONTINUATION');return expected;
}

export function resignUsAfterAmateurReturnRetry(c:UsAmateurReturnRetryCareer,n:number,input:{routePreviewId:string;offerKey:string}):UsCareer {
 revision(c,n);const view=usAmateurReturnRetryRoutesView(c),q=currentUsOpportunity(c);
 if(input.routePreviewId!==view.routePreviewId)throw new RangeError('PREVIEW_STALE');
 if(!q||!view.routes.some(r=>r.routeId==='US_CONTRACT'&&r.offerRefs.includes(input.offerKey)))throw new RangeError('US_RETURN_RETRY_US_OFFER_NOT_AVAILABLE');
 const origin=c.origin,source=origin.source,owner=c.preparation??origin.preparation??origin.service!,stage=materializeUsReturnMinorContract(origin,q,input.offerKey),{world,inventory,contract,offer}=stage,key=c.retry.playerKey,player=world.players[key]!;
 const health=structuredClone(owner.health);health.injuries=Object.fromEntries(Object.entries(health.injuries).filter(([k])=>Object.hasOwn(world.players,k)));
 const events=new Map(source.events.map(e=>[e.eventKey,e]));for(const e of origin.events)events.set(e.eventKey,e);
 const out:UsCareer={...source,schemaVersion:2,revision:n+1,world,inventory,contract,records:mergeUsReturnRecords(origin,owner),health,protagonistOrganizationId:offer.organizationId,registration:{playerKey:key,clubId:offer.organizationId,level:offer.initialLevel,seasonKey:world.seasonKey,status:'ACTIVE'},rights:{...structuredClone(source.rights),holderOrgId:offer.organizationId},phaseContext:{phase:'PRESEASON_SETUP'},minorRenewal:stage.renewal,usReturnContinuation:{retryOfferKey:offer.offerKey,playerAge:player.age,organizationId:offer.organizationId,contract:structuredClone(contract),inventory:structuredClone(inventory),sourceMinorYears:source.minorYears?.length??0,sourceMajorYears:source.majorYears?.length??0,remainingControlSeasons:1,paidUsd:30000},income:structuredClone((origin.service??source).income),seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,world.calendar.growthDays.length),development:{...structuredClone(owner.development),seasonStartPlayer:structuredClone(player)},retryCareer:structuredClone(c.retry),styleUsedWindows:[...owner.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],military:{status:origin.return.militaryStatus,deadlineAge:28},events:structuredClone([...events.values()]),usAmateurReturn:{...structuredClone(origin.return),revision:origin.return.revision+1,status:'CANCELLED_US',draftReservationKey:null,cancelledByOfferRef:offer.offerKey},usAmateurReturnHistory:origin,usAmateurReturnRetryHistory:usAmateurReturnRetryArchive(c)};
 delete out.minorMarket;delete out.season;delete out.seasonSchedule;delete out.preseasonPlan;delete out.campNotices;delete out.postseason;
 if(owner.traits)out.traits={...structuredClone(owner.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};
 const day=world.calendar.growthDays[0]!,teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:offer.initialLevel,protagonistKey:key,protagonistSchoolId:offer.organizationId,schools:world.organizations.map(o=>({id:o.id,name:o.name,roster:o.levels[offer.initialLevel]})),players:world.players};
 out.relationships=formRegisteredTeamTeammate(owner.relationships,teamWorld,JSON.stringify(['us-return-retry-sign',q.assessmentKey,offer.offerKey]),day);out.relationNotices=structuredClone(source.relationNotices);out.relationNotices=queueRelationFormationNotices({...out,world:teamWorld},day)??out.relationNotices;
 assertUsCareerRevision(out,out.revision);return refreshCareerRepertoireEvents(refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(out)));
}

export function startUsAmateurReturnRetryPreparation(c:UsAmateurReturnRetryCareer,n:number,input:{routePreviewId:string}):UsAmateurReturnRetryCareer {
 revision(c,n);const view=usAmateurReturnRetryRoutesView(c);
 if(input.routePreviewId!==view.routePreviewId)throw new RangeError('PREVIEW_STALE');
 if(!view.routes.some(r=>r.routeId==='PREPARATION'))throw new RangeError('US_RETURN_RETRY_REASSESSMENT_REQUIRED');
 const owner=c.preparation??c.origin.preparation??c.origin.service!,player=owner.world.players[c.retry.playerKey]!,world=createUsReturnPreparationWorld(owner.world,player,String(Number(c.retry.seasonKey)+1));
 const p=startPreparationSeason(c.retry,c.retry.revision,authority(c),{episodeId:c.retry.episodes.at(-1)!.episodeId,routePreviewId:view.routePreviewId,world,difficulty:c.origin.source.difficulty,records:c.preparation?.records??initialRecords(c),health:owner.health,development:owner.development,styleUsedWindows:owner.styleUsedWindows,...(owner.traits?{traits:owner.traits}:{}),...(owner.relationships?{relationships:owner.relationships}:{})});
 const staged:UsAmateurReturnRetryCareer={...c,status:'PREPARING',...(c.draft?{previousDrafts:[...(c.previousDrafts??[]),c.draft]}:{})};delete staged.draft;
 return publish(staged,p);
}
function worker(c:UsAmateurReturnRetryCareer,n:number):PreparationSeason {
 revision(c,n);if(c.status!=='PREPARING'||!c.preparation)throw new RangeError('US_RETURN_RETRY_NOT_PREPARING');return c.preparation;
}
export function confirmUsAmateurReturnRetryPreseason(c:UsAmateurReturnRetryCareer,n:number):UsAmateurReturnRetryCareer {const p=worker(c,n);return publish(c,confirmPreparationPreseason(p,p.revision));}
export function advanceUsAmateurReturnRetryPreparation(c:UsAmateurReturnRetryCareer,n:number,mode:'ONE_GAME'|'ONE_MONTH'='ONE_GAME'){
 const p=worker(c,n),out=advancePreparationSeason(p,p.revision,mode);return {...out,career:publish(c,out.career)};
}
export function trainUsAmateurReturnRetryPreparation(c:UsAmateurReturnRetryCareer,n:number,choice:TrainingChoice):UsAmateurReturnRetryCareer {const p=worker(c,n);return publish(c,trainPreparationSeason(p,p.revision,choice));}
export function setUsAmateurReturnRetryPreparationPlan(c:UsAmateurReturnRetryCareer,n:number,focus:readonly string[],archetype:string):UsAmateurReturnRetryCareer {const p=worker(c,n);return publish(c,setPreparationPlan(p,p.revision,focus,archetype));}
export function settleUsAmateurReturnRetryPreparation(c:UsAmateurReturnRetryCareer,n:number,forfeitUnusedTraining=false):UsAmateurReturnRetryCareer {
 revision(c,n);if(c.status==='REVIEW'&&c.preparation?.phase==='PREPARATION_RESULT')return c;
 let p=worker(c,n);if(p.phase==='PREPARATION_PRE')throw new RangeError('PREPARATION_SEASON_INCOMPLETE');
 if(!p.development.trainingUsedSeasons.includes(p.world.seasonKey)){if(!forfeitUnusedTraining)throw new RangeError('TRAINING_FORFEIT_REQUIRED');p=trainPreparationSeason(p,p.revision,{type:'SKIP'});}
 p=completePreparationSeason(p,p.revision);
 const next:UsAmateurReturnRetryCareer={...c,revision:c.revision+1,retry:p.retry,preparation:p,status:'REVIEW',completedPreparation:[...c.completedPreparation,p]};assertUsAmateurReturnRetryCareer(next);return next;
}
export function usAmateurReturnRetryPreparationView(c:UsAmateurReturnRetryCareer){
 assertUsAmateurReturnRetryCareer(c);if(!c.preparation)throw new RangeError('US_RETURN_RETRY_NOT_PREPARING');return {...preparationSeasonView(c.preparation,authority(c)),revision:c.revision};
}
export function prepareUsAmateurReturnRetryDraft(c:UsAmateurReturnRetryCareer,n:number,preferredClubId:string|null=null):UsAmateurReturnRetryCareer {
 revision(c,n);const p=c.preparation;
 if(c.status!=='REVIEW'||!p?.result||p.phase!=='PREPARATION_RESULT'||c.draft||c.retry.age>35)throw new RangeError('US_RETURN_RETRY_DRAFT_NOT_READY');
 assertResultScore(p);const world=createKboRosterWorld({worldKey:c.origin.return.worldKey,seasonKey:String(Number(p.world.seasonKey)+1),seed:c.origin.source.world.seed,difficulty:c.origin.source.difficulty}),program=prepareKboDraft(world,{assessmentKey:JSON.stringify(['us-return-retry-draft',c.origin.return.returnId,p.result.receiptKey,world.seasonKey]),player:p.world.players[c.retry.playerKey]!,baseScore:p.result.baseScore,preferredClubId});
 const next:UsAmateurReturnRetryCareer={...c,revision:n+1,draft:{world,program,preparationReceipt:p.result.receiptKey,basis:draftBasis(c,p)}};assertUsAmateurReturnRetryCareer(next);return next;
}
export function resolveUsAmateurReturnRetryDraft(c:UsAmateurReturnRetryCareer,n:number,programVersion:number):UsAmateurReturnRetryCareer {
 revision(c,n);if(c.status!=='REVIEW'||!c.draft)throw new RangeError('US_RETURN_RETRY_DRAFT_NOT_READY');const next={...c,revision:n+1,draft:{...c.draft,program:resolveKboDraft(c.draft.world,c.draft.program,programVersion)}};assertUsAmateurReturnRetryCareer(next);return next;
}
export function decideUsAmateurReturnRetryDraft(c:UsAmateurReturnRetryCareer,n:number,programVersion:number,decision:'SIGN'|'DECLINE'):UsAmateurReturnRetryCareer {
 revision(c,n);if(c.status!=='REVIEW'||!c.draft)throw new RangeError('US_RETURN_RETRY_DRAFT_NOT_READY');const next={...c,revision:n+1,draft:{...c.draft,program:decideKboDraft(c.draft.world,c.draft.program,programVersion,decision)}};assertUsAmateurReturnRetryCareer(next);return next;
}
export function startSignedUsAmateurReturnRetryKboCareer(c:UsAmateurReturnRetryCareer,n:number){
 revision(c,n);if(c.status!=='REVIEW'||!c.preparation||c.draft?.program.decision!=='SIGNED')throw new RangeError('US_RETURN_RETRY_SIGNED_DRAFT_REQUIRED');
 return activateReturnedUsKbo({origin:c.origin,owner:c.preparation,draft:c.draft,retry:c.retry,revision:n,retryArchive:usAmateurReturnRetryArchive(c)});
}

function exhaustionBasis(c:UsAmateurReturnRetryCareer):string {
 if(c.retry.careerPreparationUsed!==3||c.status==='PREPARING'||!terminalDomesticAssessment(c))throw new RangeError('RETRY_ASSESSMENT_REQUIRED');
 const q=currentUsOpportunity(c);if(!q)throw new RangeError('RETRY_ASSESSMENT_REQUIRED');
 if(q.status==='AVAILABLE'||q.status!=='DECLINED'&&q.retainedOfferRefs.length)throw new RangeError('RETRY_ROUTES_REMAIN');
 const owner=c.preparation??c.origin.preparation??c.origin.service!;
 return canonicalJson([c.entryReceipt,c.retry,owner.world.players[c.retry.playerKey],owner.records.revision,c.preparation?.result??null,c.retry.age>35?{status:'INELIGIBLE_AGE',age:c.retry.age,maximumAge:35}:(c.draft??c.origin.draft)!.program,q.assessmentKey,q.status,q.declineReceipt??null,q.offers,q.retainedOfferRefs]);
}
function exhaustionTask(c:UsAmateurReturnRetryCareer):string {return JSON.stringify(['us-return-retry-exhausted',c.entryReceipt,c.retry.seasonKey]);}
function assertExhaustion(c:UsAmateurReturnRetryCareer):void {
 const x=c.retryExit,events=c.events??[];if(c.events!==undefined&&!Array.isArray(c.events))throw new RangeError('INVALID_US_RETURN_RETRY_EXHAUSTION');
 if(!x){if(events.length||c.status==='ARCHIVED')throw new RangeError('INVALID_US_RETURN_RETRY_EXHAUSTION');return;}
 const e=events[0],archived=x.status==='ARCHIVED';
 if(x.version!==1||!['PENDING','ARCHIVED'].includes(x.status)||events.length!==1||!e||x.eventKey!==e.eventKey||e.definitionId!=='E35'||e.worldKey!==c.retry.worldKey||e.seasonKey!==c.retry.seasonKey||e.evidence.fields.playerSimulationKey!==c.retry.playerKey||e.evidence.fields.retirementTaskOrReceiptId!==exhaustionTask(c)||e.resume.phase!=='CAREER_ROUTE'||e.resume.competitionKey!=='INDEPENDENT'||e.resume.sourceRevision!==c.revision-(archived?1:0)||e.version!==(archived?2:1)||x.sourceBasis!==exhaustionBasis(c)||archived!==(c.status==='ARCHIVED')||e.status!==(archived?'RESOLVED':'OPEN'))throw new RangeError('INVALID_US_RETURN_RETRY_EXHAUSTION');
 validateEvent(e);
 if(archived?(x.receiptKey!==JSON.stringify(['us-return-retry-retirement',e.evidenceKey])||e.resolution?.kind!=='DOMAIN'||e.resolution.command!=='CONFIRM_RETIRE'||e.resolution.receiptKey!==x.receiptKey):x.receiptKey!==undefined)throw new RangeError('INVALID_US_RETURN_RETRY_EXHAUSTION');
}
export function openUsAmateurReturnRetryExhaustion(c:UsAmateurReturnRetryCareer,n:number):UsAmateurReturnRetryCareer {
 revision(c,n,true);if(c.status!=='REVIEW')throw new RangeError('RETRY_EXHAUSTION_NOT_AVAILABLE');if(c.retryExit)return c;
 const basis=exhaustionBasis(c),owner=c.preparation??c.origin.preparation??c.origin.service!,a=authority(c),prior=[...c.origin.source.events,...c.origin.events,...(c.events??[])];
 const e=createWorldEvent({definitionId:'E35',worldKey:c.retry.worldKey,seasonKey:c.retry.seasonKey,evidence:{version:1,type:'RETIREMENT',fields:{playerSimulationKey:c.retry.playerKey,retirementTaskOrReceiptId:exhaustionTask(c)}},resume:{worldKey:c.retry.worldKey,seasonKey:c.retry.seasonKey,phase:'CAREER_ROUTE',competitionKey:'INDEPENDENT',registrationKey:'protagonistSchoolId' in owner.world?owner.world.protagonistSchoolId:null,sourceRevision:n+1},sourceSequence:prior.reduce((m,e)=>Math.max(m,e.sourceSequence),0)+1,worldDay:a.worldDay});
 const next:UsAmateurReturnRetryCareer={...c,revision:n+1,events:[e],retryExit:{version:1,eventKey:e.eventKey,sourceBasis:basis,status:'PENDING'}};assertUsAmateurReturnRetryCareer(next);return next;
}
export function confirmUsAmateurReturnRetryExhaustion(c:UsAmateurReturnRetryCareer,n:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'}):UsAmateurReturnRetryCareer {
 revision(c,n,true);const x=c.retryExit,e=c.events?.find(e=>e.eventKey===input.eventKey);
 if(c.status!=='REVIEW'||x?.status!=='PENDING'||!e||x.eventKey!==e.eventKey||input.command!=='CONFIRM_RETIRE')throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');
 const receiptKey=JSON.stringify(['us-return-retry-retirement',e.evidenceKey]),event=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey,command:input.command},{worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[input.command]});
 const next:UsAmateurReturnRetryCareer={...c,revision:n+1,status:'ARCHIVED',events:[event],retryExit:{...x,status:'ARCHIVED',receiptKey}};assertUsAmateurReturnRetryCareer(next);return next;
}
export function usAmateurReturnRetryRetirementView(c:UsAmateurReturnRetryCareer){
 assertUsAmateurReturnRetryCareer(c);if(!c.retryExit)return {available:false as const};const owner=c.preparation??c.origin.preparation??c.origin.service!,p=owner.world.players[c.retry.playerKey]!,e=c.events![0]!;
 return {available:true as const,revision:c.revision,status:c.retryExit.status,seasonKey:c.retry.seasonKey,player:{name:p.name,age:p.age,kind:p.kind,position:p.position},usedPreparationSeasons:c.retry.careerPreparationUsed,eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE' as const,receiptKey:c.retryExit.receiptKey??null};
}

import {overall,roleScore,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboServiceTimeView} from './kbo-service-time.js';
import {kboMilitaryStatus} from './kbo-military-state.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {usMajorContractValue,usMlbOfferYears} from './us-contract-value.js';
import {createWorldStream,nextInteger} from './rng.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,completeBlockingEvent,completeEventDomain,cancelInvalidEvent,validateEvent} from './events.js';
import type {EventInstance} from './events.js';

export const KBO_POSTING_APPROVAL_SCORE=65;
export const KBO_POSTING_WINDOW_DAYS=30;
export const KBO_POSTING_FEE_RATE=.2;
export const KBO_POSTING_FX_KRW_PER_USD=1_300;
const MLB_ORGS=Object.freeze(Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')})));

export type KboPostingOfferKind='MLB'|'MILB';
export interface KboPostingOffer {
 offerKey:string;organizationId:string;organizationName:string;kind:KboPostingOfferKind;currency:'USD';
 years:1|2|3|5;annualSalaryUsd:number;initialLevel:'MLB'|'AAA'|'AA'|'A'|'ROOKIE';nationalReleaseAllowed:boolean;militaryReturnOption:boolean;
}
export interface KboPostingReturnRights {
 holderClubId:string;territory:'KR';sourceType:'POSTING';seasonKey:string;contractKey:string;annualSalaryWon:number;years:number;snapshotRevision:number;
}
export interface KboPostingWindow {
 postingId:string;seasonKey:string;requestedRevision:number;clubId:string;status:'REQUESTED'|'DEFERRED'|'APPROVED'|'EXPIRED'|'REJECTED'|'SIGNED';
 approvalScore?:number;decision?:'APPROVED'|'DEFERRED';offers?:readonly KboPostingOffer[];issuedWorldDay?:number;expiresWorldDay?:number;
 signedOfferKey?:string;compensationWon?:number;returnRights?:KboPostingReturnRights;sealedPlayer?:DevelopmentPlayer;sealedContract?:KboInitialContract;
}

function offseason(c:KboCareer){
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)throw new RangeError('KBO_POSTING_NOT_AVAILABLE');
}
function activeContract(c:KboCareer){
 const contract=c.world.contracts[c.protagonistKey];if(!contract||contract.status!=='ACTIVE'||contract.clubId!==c.protagonistClubId)throw new RangeError('KBO_POSTING_CONTRACT_REQUIRED');return contract;
}
function performance(c:KboCareer){
 const player=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:c.world.seasonKey}),bat=totals.batting[c.protagonistKey]??emptyBatting(),pit=totals.pitching[c.protagonistKey]??emptyPitching(),o=overall(player.kind,player.abilities);
 return {player,bat,pit,recent:player.kind==='HITTER'?recentBattingPerformance(bat):recentPitchingPerformance(pit),role:roleScore(player.kind,player.abilities,player.position),ovr:o.sumUnits/o.denominator};
}
function windowId(c:KboCareer){return JSON.stringify(['kbo-posting',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);}
function current(c:KboCareer){return c.posting?.windows.find(w=>w.seasonKey===c.world.seasonKey);}

/** Read-only checklist. Does not invent missing registration years. */
export function kboPostingEligibility(c:KboCareer){
 assertKboCareerRevision(c,c.revision);const service=kboServiceTimeView(c),contract=c.world.contracts[c.protagonistKey],military=kboMilitaryStatus(c),open=current(c);
 const reasons:string[]=[];
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)reasons.push('OFFSEASON_REQUIRED');
 if(!service.registrationThresholds.posting.reached)reasons.push('SERVICE_SHORT');
 if(!contract||contract.status!=='ACTIVE'||contract.clubId!==c.protagonistClubId)reasons.push('CONTRACT_REQUIRED');
 if(military!=='COMPLETED'&&military!=='NOT_APPLICABLE')reasons.push('MILITARY_BLOCKED');
 if(open&&open.status!=='EXPIRED'&&open.status!=='REJECTED')reasons.push('WINDOW_OPEN');
 if(c.events.some(e=>e.status==='OPEN'))reasons.push('OPEN_EVENT');
 return {eligible:reasons.length===0,reasons,service,military,postingReached:service.registrationThresholds.posting.reached,window:open??null};
}

function openPostingWindow(c:KboCareer,revision:number):KboCareer {
 activeContract(c);const next=structuredClone(c),postingId=windowId(c);
 next.posting={windows:[...(next.posting?.windows??[]).filter(w=>w.postingId!==postingId),{postingId,seasonKey:c.world.seasonKey,requestedRevision:revision,clubId:c.protagonistClubId,status:'REQUESTED'}]};next.revision++;return next;
}

/** Once per closed season. Deferred windows wait for the next season key. */
export function requestKboPosting(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const gate=kboPostingEligibility(c);if(!gate.eligible)throw new RangeError('KBO_POSTING_NOT_ELIGIBLE');
 return openPostingWindow(c,revision);
}

function postingEvent(c:KboCareer,id:'E62'|'E63'|'E64',postingId:string,stage:string,postingDecision?:'APPROVED'|'DEFERRED'):EventInstance {
 const d=eventDefinition(id),day=c.days?.seasonKey===c.world.seasonKey?c.days.days.at(-1)?.day??0:0;
 return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,postingWindowId:postingId,stage}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:c.protagonistClubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:day,...(postingDecision?{postingDecision}:{})});
}

/** Offseason invite card when eligibility is clear. One E62 evidence key per season; direct requestKboPosting remains for non-UI paths. */
export function openKboPostingInvite(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const gate=kboPostingEligibility(c);if(!gate.eligible)throw new RangeError('KBO_POSTING_NOT_ELIGIBLE');
 const postingId=windowId(c);if(c.events.some(e=>e.definitionId==='E62'&&e.evidence.fields.postingWindowId===postingId))throw new RangeError('KBO_POSTING_INVITE_OPEN');
 const next=structuredClone(c),event=postingEvent(next,'E62',postingId,'INVITE');next.events=[...next.events,event];next.revision++;return next;
}

/** E62: REQUEST_POSTING opens the window; ACK declines without a window. */
export function resolveKboPostingInvite(c:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const e=c.events.find(x=>x.eventKey===input.eventKey);
 if(!e||e.definitionId!=='E62'||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.postingWindowId!==windowId(c))throw new RangeError('INVALID_KBO_POSTING_EVENT');
 validateEvent(e);const ctx={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,ctx);
 if(picked.domain){
  if(input.command!=='REQUEST_POSTING')throw new RangeError('INVALID_CHOICE');
  const gate=kboPostingEligibility({...c,events:c.events.filter(x=>x.eventKey!==e.eventKey)});
  if(!gate.eligible)throw new RangeError('KBO_POSTING_NOT_ELIGIBLE');
  const next=openPostingWindow(c,revision),live=next.events.find(x=>x.eventKey===e.eventKey)!;
  const closed=completeEventDomain(live,picked.domain,JSON.stringify(['kbo-posting-request',windowId(c)]),ctx);
  return {...next,events:next.events.map(x=>x.eventKey===e.eventKey?closed:x)};
 }
 if(!picked.event||picked.event.status==='OPEN')throw new RangeError('INVALID_CHOICE');
 const next={...c,events:c.events.map(x=>x.eventKey===e.eventKey?picked.event:x)};next.revision++;return next;
}

/** Score = recent×0.6 + role×0.4. No redraw. Below 65 defers; the contract stays. Queues E63 with the sealed club decision. */
export function resolveKboPostingClub(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='REQUESTED')throw new RangeError('KBO_POSTING_REQUEST_REQUIRED');
 const p=performance(c),score=p.recent*.6+p.role*.4,decision:'APPROVED'|'DEFERRED'=score>=KBO_POSTING_APPROVAL_SCORE?'APPROVED':'DEFERRED';
 const next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.approvalScore=score;w.decision=decision;w.status=decision;
 const event=postingEvent(next,'E63',open.postingId,decision,decision);if(!next.events.some(e=>e.eventKey===event.eventKey))next.events=[...next.events,event];
 next.revision++;return next;
}

/** ACK deferred E63 or navigate-approved path after the sealed club decision. */
export function resolveKboPostingEvent(c:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertKboCareerRevision(c,revision);const e=c.events.find(x=>x.eventKey===input.eventKey);
 if(!e||e.definitionId!=='E63'||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_KBO_POSTING_EVENT');
 validateEvent(e);const open=current(c);if(!open||open.postingId!==e.evidence.fields.postingWindowId||open.decision!==e.postingDecision)throw new RangeError('KBO_POSTING_DECISION_CHANGED');
 const ctx={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,ctx);
 if(picked.navigation)return {career:c,navigation:picked.navigation};
 const next={...c,events:c.events.map(x=>x.eventKey===e.eventKey?picked.event:x)};next.revision++;return {career:next,navigation:null};
}

function buildOffers(c:KboCareer,postingId:string):KboPostingOffer[] {
 const p=performance(c);if(p.player.age>=45)return [];
 const years=usMlbOfferYears(p.player.age+1),value=usMajorContractValue(p.player,p.bat,p.pit),kind:KboPostingOfferKind|null=p.ovr>=75?'MLB':p.ovr>=65?'MILB':null;if(!kind)return [];
 let rng=createWorldStream(c.world.seed,JSON.stringify(['kbo-posting-offers',postingId]),'roster');const pool=[...MLB_ORGS],offers:KboPostingOffer[]=[];
 const countDraw=nextInteger(rng,4);rng=countDraw.state;const count=Math.min(3,countDraw.value);if(!count)return [];
 while(pool.length&&offers.length<count){const pick=nextInteger(rng,pool.length);rng=pick.state;const org=pool.splice(pick.value,1)[0]!;
  offers.push({offerKey:JSON.stringify(['kbo-posting-offer',postingId,org.id]),organizationId:org.id,organizationName:org.name,kind,currency:'USD',years,annualSalaryUsd:kind==='MLB'?value.annualSalaryUsd:30_000,initialLevel:kind==='MLB'?'MLB':'AAA',nationalReleaseAllowed:true,militaryReturnOption:true});}
 return offers.sort((a,b)=>a.organizationId<b.organizationId?-1:1);
}

/** Fixed offer set for the approved window. Refresh does not redraw. Closes blocking E63 and queues E64. */
export function openKboPostingOffers(c:KboCareer,revision:number,issuedWorldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='APPROVED'||open.offers)throw new RangeError('KBO_POSTING_OFFERS_NOT_AVAILABLE');
 if(!Number.isSafeInteger(issuedWorldDay)||issuedWorldDay<0)throw new RangeError('INVALID_KBO_POSTING_DAY');
 const next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.offers=buildOffers(c,open.postingId);w.issuedWorldDay=issuedWorldDay;w.expiresWorldDay=issuedWorldDay+KBO_POSTING_WINDOW_DAYS;
 const e63=next.events.find(e=>e.definitionId==='E63'&&e.status==='OPEN'&&e.evidence.fields.postingWindowId===open.postingId&&e.postingDecision==='APPROVED');
 if(e63){const ctx={worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,worldDay:e63.occurredWorldDay,eligibleCommands:e63.offeredChoices};const closed=completeBlockingEvent(e63,e63.version,{sourceEvidenceKey:e63.evidenceKey,receiptKey:JSON.stringify(['kbo-posting-offers',open.postingId]),command:'OPEN_POSTING_OFFERS'},ctx);next.events=next.events.map(e=>e.eventKey===e63.eventKey?closed:e);}
 const e64=postingEvent(next,'E64',open.postingId,'OFFERS');if(!next.events.some(e=>e.eventKey===e64.eventKey))next.events=[...next.events,e64];
 next.revision++;return next;
}

export function expireOrRejectKboPosting(c:KboCareer,revision:number,reason:'EXPIRED'|'REJECTED'):KboCareer {
 assertKboCareerRevision(c,revision);const open=current(c);if(!open||open.status!=='APPROVED'||!open.offers)throw new RangeError('KBO_POSTING_CANCEL_NOT_AVAILABLE');
 const before=JSON.stringify(c.world.contracts[c.protagonistKey]),next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.status=reason;
 for(const e of next.events.filter(x=>x.status==='OPEN'&&['E63','E64'].includes(x.definitionId)&&x.evidence.fields.postingWindowId===open.postingId)){
  const ctx={worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};
  next.events=next.events.map(x=>x.eventKey===e.eventKey?cancelInvalidEvent(e,e.version,'POSTING_'+reason,ctx):x);
 }
 next.revision++;
 if(JSON.stringify(next.world.contracts[c.protagonistKey])!==before)throw new RangeError('KBO_POSTING_CONTRACT_MUTATED');return next;
}

/** E64 domain resume: ACCEPT_CAREER_OFFER seals one offer; REMAIN_ORIGINAL rejects the window. */
export function resolveKboPostingOfferEvent(c:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string;offerKey?:string;worldDay?:number}):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const e=c.events.find(x=>x.eventKey===input.eventKey);
 if(!e||e.definitionId!=='E64'||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_KBO_POSTING_EVENT');
 validateEvent(e);const open=current(c);if(!open||open.postingId!==e.evidence.fields.postingWindowId||open.status!=='APPROVED'||!open.offers)throw new RangeError('KBO_POSTING_OFFERS_NOT_AVAILABLE');
 const ctx={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};
 const picked=resolveEventChoice(e,input.eventVersion,input.command,input.offerKey??null,ctx);if(!picked.domain)throw new RangeError('INVALID_CHOICE');
 if(input.command==='ACCEPT_CAREER_OFFER'){
  if(!input.offerKey||input.worldDay===undefined)throw new RangeError('KBO_POSTING_OFFER_REQUIRED');
  const signed=acceptKboPostingOffer(c,revision,input.offerKey,input.worldDay);
  const live=signed.events.find(x=>x.eventKey===e.eventKey);if(!live||live.status!=='RESOLVED'||live.resolution?.command!=='ACCEPT_CAREER_OFFER')throw new RangeError('KBO_POSTING_EVENT_NOT_CLOSED');
  return signed;
 }
 if(input.command!=='REMAIN_ORIGINAL')throw new RangeError('INVALID_CHOICE');
 const before=JSON.stringify(c.world.contracts[c.protagonistKey]),next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.status='REJECTED';
 const closed=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['kbo-posting-remain',open.postingId]),command:'REMAIN_ORIGINAL'},ctx);
 next.events=next.events.map(x=>x.eventKey===e.eventKey?closed:x);
 for(const leftover of next.events.filter(x=>x.status==='OPEN'&&x.definitionId==='E63'&&x.evidence.fields.postingWindowId===open.postingId)){
  next.events=next.events.map(x=>x.eventKey===leftover.eventKey?cancelInvalidEvent(leftover,leftover.version,'POSTING_REJECTED',ctx):x);
 }
 next.revision++;if(JSON.stringify(next.world.contracts[c.protagonistKey])!==before)throw new RangeError('KBO_POSTING_CONTRACT_MUTATED');return next;
}

export function kboPostingFeeWon(offer:Pick<KboPostingOffer,'annualSalaryUsd'|'years'>){
 const fee=Math.round(offer.annualSalaryUsd*offer.years*KBO_POSTING_FEE_RATE)*KBO_POSTING_FX_KRW_PER_USD;if(!Number.isSafeInteger(fee)||fee%10_000!==0)throw new RangeError('KBO_POSTING_FEE_INVALID');return fee;
}

/** Ends the KBO contract, pays the club fee once, snapshots return rights. Does not create a US career root. */
export function acceptKboPostingOffer(c:KboCareer,revision:number,offerKey:string,worldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='APPROVED'||!open.offers||open.issuedWorldDay===undefined||open.expiresWorldDay===undefined)throw new RangeError('KBO_POSTING_OFFERS_NOT_AVAILABLE');
 if(!Number.isSafeInteger(worldDay)||worldDay<open.issuedWorldDay||worldDay>=open.expiresWorldDay)throw new RangeError('KBO_POSTING_OFFER_EXPIRED');
 const offer=open.offers.find(o=>o.offerKey===offerKey);if(!offer)throw new RangeError('KBO_POSTING_OFFER_NOT_FOUND');
 const expected=buildOffers(c,open.postingId).find(o=>o.offerKey===offerKey);if(!expected||JSON.stringify(expected)!==JSON.stringify(offer))throw new RangeError('KBO_POSTING_OFFER_CHANGED');
 const contract=activeContract(c),player=c.world.players[c.protagonistKey]!,compensationWon=kboPostingFeeWon(offer);
 const next=structuredClone(c),club=next.world.clubs.find(x=>x.id===c.protagonistClubId)!;if(!club.roster.includes(c.protagonistKey))throw new RangeError('KBO_POSTING_ROSTER_CHANGED');
 const returnRights:KboPostingReturnRights={holderClubId:c.protagonistClubId,territory:'KR',sourceType:'POSTING',seasonKey:c.world.seasonKey,contractKey:contract.contractKey,annualSalaryWon:contract.annualSalaryWon,years:contract.years,snapshotRevision:revision};
 const sealedPlayer=structuredClone(player),sealedContract=structuredClone(contract);
 delete next.world.contracts[c.protagonistKey];delete next.world.players[c.protagonistKey];delete next.world.repertoires[c.protagonistKey];
 club.roster=club.roster.filter(k=>k!==c.protagonistKey);club.firstTeam=club.firstTeam.filter(k=>k!==c.protagonistKey);
 if(club.reservedSalaryWon<contract.annualSalaryWon)throw new RangeError('KBO_POSTING_PAYROLL_CHANGED');club.reservedSalaryWon-=contract.annualSalaryWon;club.budgetWon+=compensationWon;
 if(club.roster.length>=KBO_ROSTER_LIMITS.firstTeam){const first=selectKboFirstTeamRoster(club.roster.map(k=>next.world.players[k]!));if(first.length===KBO_ROSTER_LIMITS.firstTeam)club.firstTeam=first;}
 const w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.status='SIGNED';w.signedOfferKey=offerKey;w.compensationWon=compensationWon;w.returnRights=returnRights;w.sealedPlayer=sealedPlayer;w.sealedContract=sealedContract;w.offers=open.offers;
 for(const e of next.events.filter(x=>x.status==='OPEN'&&['E63','E64'].includes(x.definitionId)&&x.evidence.fields.postingWindowId===open.postingId)){
  const ctx={worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};
  next.events=next.events.map(x=>x.eventKey===e.eventKey?(e.definitionId==='E64'?completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['kbo-posting-accept',open.postingId,offerKey]),command:'ACCEPT_CAREER_OFFER'},ctx):cancelInvalidEvent(e,e.version,'POSTING_SIGNED',ctx)):x);
 }
 next.phaseContext={phase:'ARCHIVED'};next.revision++;return next;
}

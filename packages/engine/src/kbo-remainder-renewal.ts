import {KBO_ROSTER_LIMITS} from '@playball/rules';
import {kboClubBalance,kboRecruitmentOpen} from './kbo-finance.js';
import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {kboRenewalValueWon} from './kbo-renewal.js';
import {kboRenewalSalaryWon} from './kbo-contract-value.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent} from './events.js';
import {canonicalJson} from './game.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {kboContractSeasonCharge} from './kbo-service-payroll.js';
import {createKboRemainderContract,kboRemainderBalance,kboRemainderFutureDates} from './kbo-remainder-pay.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

export interface KboRemainderRenewal {
 offerKey:string;eventKey:string;playerKey:string;clubId:string;seasonKey:string;startAfterWorldDay:number;endWorldDay:number;
 previousSalaryWon:number;valueWon:number;annualSalaryWon:number;estimatedGameDays:number;reservedGameDays:number;
 sourceBasis:string;status:'OFFERED'|'ACCEPTED'|'TRANSFERRED';acceptedOfferKey?:string;comparison?:KboRemainderComparison;
}
const basis=(c:KboCareer)=>canonicalJson({contract:c.world.contracts[c.protagonistKey],schedule:c.competitionSchedule,club:c.world.clubs.find(x=>x.id===c.protagonistClubId),player:c.world.players[c.protagonistKey],recordsRevision:c.records.revision,lastClosedDay:c.days?.days.at(-1)?.day});
function candidate(c:KboCareer,o:KboRemainderRenewal){return createKboRemainderContract(c.world.contracts[c.protagonistKey]!,{contractKey:o.offerKey,annualSalaryWon:o.annualSalaryWon,startAfterWorldDay:o.startAfterWorldDay,endWorldDay:o.endWorldDay,reservedGameDays:o.reservedGameDays});}
export function assertKboRemainderRenewal(c:KboCareer):KboRemainderRenewal {
 const o=c.remainderRenewal,p=c.phaseContext,e=o?c.events.find(e=>e.eventKey===o.eventKey):undefined;
 if(c.rights.holderOrgId!==c.protagonistClubId || c.rights.playerKey!==c.protagonistKey || c.registration.clubId!==c.protagonistClubId || c.registration.playerKey!==c.protagonistKey)throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 if(!o || o.status!=='OFFERED' || p.phase!=='EVENT_DECISION' || p.eventKey!==o.eventKey || p.resume.pendingGame || p.resume.nextWorldDay!==o.startAfterWorldDay+1 || !e || e.definitionId!=='E30' || e.status!=='OPEN' || e.worldKey!==c.world.worldKey || e.seasonKey!==c.world.seasonKey || o.playerKey!==c.protagonistKey || o.clubId!==c.protagonistClubId || o.seasonKey!==c.world.seasonKey || o.sourceBasis!==basis(c) || o.reservedGameDays!==kboRemainderFutureDates(c,o.startAfterWorldDay))throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],end=Math.max(...all.map(g=>g.worldDay)),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!,league=club.firstTeam.includes(c.protagonistKey)?'KBO':'FUTURES',estimated=c.competitionSchedule!.leagues[league].filter(g=>g.worldDay>o.startAfterWorldDay && (g.homeTeamKey===club.id || g.awayTeamKey===club.id)).length;
 if(o.endWorldDay!==end || o.estimatedGameDays!==estimated || o.offerKey!==JSON.stringify(['kbo-remainder-renewal',c.world.worldKey,c.world.seasonKey,c.world.contracts[c.protagonistKey]!.contractKey,o.startAfterWorldDay]) || e.occurredWorldDay!==o.startAfterWorldDay || canonicalJson(e.evidence.fields)!==canonicalJson({playerSimulationKey:c.protagonistKey,contractWindowId:o.offerKey,sourceReceiptId:c.world.contracts[c.protagonistKey]!.servicePay!.ledger.receipts.at(-1)!.gameKey}))throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 const {valueWon}=kboRenewalValueWon(c);if(o.valueWon!==valueWon || o.previousSalaryWon!==c.world.contracts[c.protagonistKey]!.annualSalaryWon || o.annualSalaryWon!==kboRenewalSalaryWon(o.previousSalaryWon,valueWon))throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 if(o.comparison && canonicalJson(o.comparison)!==canonicalJson(expectedComparison(c,o)))throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 candidate(c,o);return o;
}
/** Freeze one current-season E30; game time remains at the last paid closed day until explicit acceptance. */
export function offerKboRemainderRenewal(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);assertKboRecruitmentWorld(source.world);
 if(source.remainderRenewal?.status==='OFFERED' && source.remainderRenewal.seasonKey===source.world.seasonKey){assertKboRemainderRenewal(source);return structuredClone(source);}
 const phase=source.phaseContext,contract=source.world.contracts[source.protagonistKey]!,service=contract.servicePay,day=source.days?.days.at(-1)?.day;
 if(source.rights.holderOrgId!==source.protagonistClubId || contract.clubId!==source.protagonistClubId || source.registration.clubId!==source.protagonistClubId || phase.phase!=='SEASON_PROGRESS' || phase.pendingGame || !service || kboContractPaymentBalance(service.ledger).status!=='SETTLED' || day===undefined || phase.nextWorldDay!==day+1 || source.events.some(e=>e.status==='OPEN') || !source.competitionSchedule || source.remainderRenewal?.seasonKey===source.world.seasonKey)throw new RangeError('KBO_REMAINDER_RENEWAL_NOT_AVAILABLE');
 const last=service.ledger.receipts.at(-1),all=[...source.competitionSchedule.leagues.KBO,...source.competitionSchedule.leagues.FUTURES],endWorldDay=Math.max(...all.map(g=>g.worldDay));
 if(!last || last.seasonKey!==source.world.seasonKey || last.worldDay!==day || day>=endWorldDay)throw new RangeError('KBO_REMAINDER_RENEWAL_NOT_AVAILABLE');
 const {valueWon}=kboRenewalValueWon(source),annualSalaryWon=kboRenewalSalaryWon(contract.annualSalaryWon,valueWon),offerKey=JSON.stringify(['kbo-remainder-renewal',source.world.worldKey,source.world.seasonKey,contract.contractKey,day]);
 const definition=eventDefinition('E30'),event=createWorldEvent({definitionId:'E30',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:source.protagonistKey,contractWindowId:offerKey,sourceReceiptId:last.gameKey}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:source.registration.competitionKey??'FUTURES',registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 const club=source.world.clubs.find(c=>c.id===source.protagonistClubId)!,league=club.firstTeam.includes(source.protagonistKey)?'KBO':'FUTURES',estimatedGameDays=source.competitionSchedule.leagues[league].filter(g=>g.worldDay>day && (g.homeTeamKey===club.id || g.awayTeamKey===club.id)).length,reservedGameDays=kboRemainderFutureDates(source,day);
 if(reservedGameDays===0)throw new RangeError('KBO_REMAINDER_RENEWAL_NOT_AVAILABLE');
 const c=structuredClone(source);c.remainderRenewal={offerKey,eventKey:event.eventKey,playerKey:source.protagonistKey,clubId:club.id,seasonKey:source.world.seasonKey,startAfterWorldDay:day,endWorldDay,previousSalaryWon:contract.annualSalaryWon,valueWon,annualSalaryWon,estimatedGameDays,reservedGameDays,sourceBasis:basis(source),status:'OFFERED'};c.events=[...c.events,event];c.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(phase)};c.revision++;return c;
}
/** Same-club positive path only. Navigation can leave the frozen offer open; no automatic extension. */
export function acceptKboRemainderRenewal(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number}):KboCareer {
 assertCareerRevision(source,expectedRevision);const o=assertKboRemainderRenewal(source),event=source.events.find(e=>e.eventKey===o.eventKey)!;
 if(input.eventKey!==event.eventKey)throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 if(!kboRecruitmentOpen(source.world,source.protagonistClubId))throw new RangeError('KBO_TRANSFER_CAPACITY_REQUIRED');
 const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['kbo-remainder-accept',o.offerKey]),command:'ACCEPT_REMAINDER_RENEWAL'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:o.startAfterWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS']});
 const c=structuredClone(source),old=c.world.contracts[c.protagonistKey]!,next=candidate(c,o),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!;
 club.reservedSalaryWon+=kboContractSeasonCharge(next)-kboContractSeasonCharge(old);c.world.contracts[c.protagonistKey]=next;assertKboRecruitmentWorld(c.world);
 c.events=c.events.map(e=>e.eventKey===event.eventKey?resolved:e);c.remainderRenewal={...o,status:'ACCEPTED'};c.phaseContext=structuredClone((source.phaseContext as {resume:KboSeasonProgress}).resume);c.revision++;return c;
}
/** Keep the original offer open while navigating to comparison. No contract, rights or money move here. */
export function compareKboRemainderOffers(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number}){
 assertCareerRevision(source,expectedRevision);const o=assertKboRemainderRenewal(source),event=source.events.find(e=>e.eventKey===o.eventKey)!;
 if(input.eventKey!==o.eventKey || input.eventVersion!==event.version)throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 const career=structuredClone(source);
 if(!o.comparison){career.remainderRenewal={...career.remainderRenewal!,comparison:expectedComparison(source,o)};career.revision++;}
 return {career,navigation:{targetScreen:'S08' as const,sourceEventKey:event.eventKey}};
}

export interface KboRemainderAlternativeOffer {offerKey:string;clubId:string;annualSalaryWon:number;estimatedGameDays:number;reservedGameDays:number;estimatedTotalWon:number;maximumReservedWon:number;firstTeamGuaranteed:false}
export interface KboRemainderComparison {requestKey:string;requestedAfterWorldDay:number;sourceBasis:string;offers:readonly KboRemainderAlternativeOffer[]}
function expectedComparison(c:KboCareer,o:KboRemainderRenewal):KboRemainderComparison {
 const requestKey=JSON.stringify(['kbo-remainder-comparison',o.offerKey]),annualSalaryWon=Math.round(o.valueWon/10_000)*10_000,day=o.startAfterWorldDay,p=c.world.players[c.protagonistKey]!,all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES];
 const offers=c.world.clubs.filter(t=>t.id!==c.protagonistClubId&&kboRecruitmentOpen(c.world,t.id)&&t.roster.length<KBO_ROSTER_LIMITS.maximum).map(club=>{
  const reservedGameDays=new Set(all.filter(g=>g.worldDay>day&&(g.homeTeamKey===club.id||g.awayTeamKey===club.id)).map(g=>g.worldDay)).size,estimatedGameDays=c.competitionSchedule!.leagues.FUTURES.filter(g=>g.worldDay>day&&(g.homeTeamKey===club.id||g.awayTeamKey===club.id)).length,dailyWon=Math.round(annualSalaryWon/144),maximumReservedWon=dailyWon*reservedGameDays+Math.max(0,Math.round(annualSalaryWon*reservedGameDays/144)-dailyWon*reservedGameDays);
  return {club,need:kboAiRoleNeed(p,club.roster.map(k=>c.world.players[k]!)),offer:{offerKey:JSON.stringify(['kbo-remainder-alternative',requestKey,club.id]),clubId:club.id,annualSalaryWon,estimatedGameDays,reservedGameDays,estimatedTotalWon:Math.round(annualSalaryWon*estimatedGameDays/144),maximumReservedWon,firstTeamGuaranteed:false as const}};
 }).filter(x=>x.offer.reservedGameDays>0&&kboClubBalance(c.world,x.club.id).availableWon>=x.offer.maximumReservedWon).sort((a,b)=>b.need.needScore-a.need.needScore||a.need.incumbentRoleScore-b.need.incumbentRoleScore||(a.club.id<b.club.id?-1:1)).map(x=>x.offer);
 return {requestKey,requestedAfterWorldDay:day,sourceBasis:canonicalJson({world:c.world,health:c.health,recordsRevision:c.records.revision,schedule:c.competitionSchedule}),offers};
}
export function kboRemainderRenewalView(c:KboCareer){
 const o=c.remainderRenewal;if(!o || o.seasonKey!==c.world.seasonKey)return null;
 if(o.status==='OFFERED')assertKboRemainderRenewal(c);
 let canAccept=o.status==='OFFERED',reason:string|null=null;
 if(canAccept && !kboRecruitmentOpen(c.world,c.protagonistClubId)){canAccept=false;reason='BUDGET_CAPACITY_REQUIRED';}
 if(canAccept){const copy=structuredClone(c),old=copy.world.contracts[copy.protagonistKey]!,next=candidate(copy,o),club=copy.world.clubs.find(x=>x.id===copy.protagonistClubId)!;club.reservedSalaryWon+=kboContractSeasonCharge(next)-kboContractSeasonCharge(old);copy.world.contracts[copy.protagonistKey]=next;try{assertKboRecruitmentWorld(copy.world);}catch{canAccept=false;reason='BUDGET_CAPACITY_REQUIRED';}}
 const maximumReservedWon=o.status==='OFFERED'?kboRemainderBalance(candidate(c,o)).reservedWon:kboRemainderBalance(c.world.contracts[c.protagonistKey]!).reservedWon;
 const accepted=o.status==='TRANSFERRED'?o.comparison?.offers.find(x=>x.offerKey===o.acceptedOfferKey):null;if(o.status==='TRANSFERRED' && !accepted)throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 const display=accepted??o;
 return {...(o.comparison?{comparison:{originalOfferAvailable:o.status==='OFFERED',offers:o.status==='TRANSFERRED'?[]:o.comparison.offers.map(x=>({...x})),emptyReason:o.comparison.offers.length===0?'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET':null}}:{}),retirementAvailable:false,retirementReason:'SEASON_REVIEW_REQUIRED',eventKey:o.eventKey,eventVersion:c.events.find(e=>e.eventKey===o.eventKey)!.version,status:o.status,...(accepted?{acceptedClubId:accepted.clubId}:{}),annualSalaryWon:display.annualSalaryWon,dailyWon:Math.round(display.annualSalaryWon/144),estimatedGameDays:display.estimatedGameDays,estimatedTotalWon:Math.round(display.annualSalaryWon*display.estimatedGameDays/144),maximumReservedWon,endWorldDay:o.endWorldDay,canAccept,reason};
}

import {KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboContractExpiresAfterSeason,kboRenewalValueWon} from './kbo-renewal.js';
import {kboRenewalSalaryWon} from './kbo-contract-value.js';
import {kboFutureCommitmentWon} from './kbo-finance.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent} from './events.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {careerAgentOffseasonOffer} from './career-agent.js';

export interface KboOffseasonOffer {offerKey:string;clubId:string;years:1;annualSalaryWon:number;firstTeamGuaranteed:false}
export interface KboOffseasonExit {requestKey:string;eventKey:string;playerKey:string;fromClubId:string;seasonKey:string;sourceBasis:string;offers:readonly KboOffseasonOffer[];status:'OPEN'|'ACCEPTED';acceptedOfferKey?:string;acceptedBaseOfferKey?:string}

function projection(c:KboCareer){
 const key=c.protagonistKey,target=String(Number(c.world.seasonKey)+1),{valueWon,basis}=kboRenewalValueWon(c),old=c.world.contracts[key]!,salary=kboRenewalSalaryWon(old.annualSalaryWon,valueWon),origin=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 const originFits=kboFutureCommitmentWon(c.world,origin.id,1)+salary<=origin.budgetWon*.9,requestKey=JSON.stringify(['kbo-offseason-exit',c.world.worldKey,target,key,old.contractKey]);
 const offers=c.world.clubs.filter(t=>t.id!==origin.id).map(club=>{
  const guaranteed=club.roster.filter(k=>{const p=c.world.players[k]!,v=c.world.contracts[k]!;return p.age<45 && (v.servicePay?kboContractPaymentBalance(v.servicePay.ledger).remainingPaidGameDays>0:Number(v.seasonKey)+v.years-1>Number(c.world.seasonKey));});
  const open=Array.from({length:c.world.suspendedContracts?6:3},(_,i)=>i+1).every(i=>kboFutureCommitmentWon(c.world,club.id,i)<=club.budgetWon*.9);
  return {club,guaranteed,open,need:kboAiRoleNeed(c.world.players[key]!,guaranteed.map(k=>c.world.players[k]!))};
 }).filter(x=>x.open && x.guaranteed.length<KBO_ROSTER_LIMITS.maximum && kboFutureCommitmentWon(c.world,x.club.id,1)+valueWon<=x.club.budgetWon*.9).sort((a,b)=>b.need.needScore-a.need.needScore || a.need.incumbentRoleScore-b.need.incumbentRoleScore || (a.club.id<b.club.id?-1:1)).map(x=>({offerKey:JSON.stringify(['kbo-offseason-offer',requestKey,x.club.id]),clubId:x.club.id,years:1 as const,annualSalaryWon:valueWon,firstTeamGuaranteed:false as const}));
 return {target,requestKey,offers,originFits,valueWon,basis,sourceBasis:canonicalJson({worldKey:c.world.worldKey,season:c.world.seasonKey,playerKey:key,contractKey:old.contractKey,close:c.seasonClose?.receiptKey,recordsRevision:c.records.revision,originFits,offers})};
}

/** Frozen next-year offers; the closing season's registration, rights and paid salary are never rewritten. */
export function assertKboOffseasonExit(c:KboCareer):KboOffseasonExit {
 const o=c.offseasonExit,p=projection(c),event=c.events.find(e=>e.eventKey===o?.eventKey);
 if(!o || c.schemaVersion<7 || !kboContractExpiresAfterSeason(c) || c.phaseContext.phase!=='SEASON_REVIEW' || !c.seasonClose || o.playerKey!==c.protagonistKey || o.fromClubId!==c.protagonistClubId || o.seasonKey!==p.target || p.originFits || o.requestKey!==p.requestKey || o.sourceBasis!==p.sourceBasis || canonicalJson(o.offers)!==canonicalJson(p.offers) || !['OPEN','ACCEPTED'].includes(o.status) || !event || event.worldKey!==c.world.worldKey || event.seasonKey!==c.world.seasonKey || event.definitionId!=='E30' || event.evidence.fields.contractWindowId!==o.requestKey || event.evidence.fields.sourceReceiptId!==c.seasonClose.receiptKey || event.evidence.fields.playerSimulationKey!==c.protagonistKey)throw new RangeError('KBO_OFFSEASON_OFFERS_CHANGED');
 if(o.status==='OPEN' && (event.status!=='OPEN' || o.acceptedOfferKey!==undefined || o.acceptedBaseOfferKey!==undefined))throw new RangeError('KBO_OFFSEASON_OFFERS_CHANGED');
 if(o.status==='ACCEPTED'){
  const base=o.offers.find(x=>x.offerKey===(o.acceptedBaseOfferKey??o.acceptedOfferKey)),offer=base?careerAgentOffseasonOffer(c,base,o.acceptedOfferKey!):undefined,r=c.renewal;
  if(!offer || event.status!=='RESOLVED' || event.resolution?.kind!=='DOMAIN' || event.resolution.command!=='ACCEPT_OFFSEASON_OFFER' || event.resolution.receiptKey!==JSON.stringify(['kbo-offseason-accept',offer?.offerKey]) || !r || r.status!=='ACCEPTED' || r.offerKey!==offer.offerKey || r.eventKey!==o.eventKey || r.playerKey!==o.playerKey || r.clubId!==offer.clubId || r.seasonKey!==o.seasonKey || r.years!==1 || r.annualSalaryWon!==offer.annualSalaryWon || r.valueWon!==p.valueWon || r.previousSalaryWon!==c.world.contracts[c.protagonistKey]!.annualSalaryWon || canonicalJson(r.basis)!==canonicalJson(p.basis))throw new RangeError('KBO_OFFSEASON_OFFERS_CHANGED');
 }
 return o;
}

export function compareKboOffseasonOffers(source:KboCareer,expectedRevision:number):KboCareer {
 assertKboCareerRevision(source,expectedRevision);assertKboRecruitmentWorld(source.world);
 if(source.offseasonExit?.seasonKey===String(Number(source.world.seasonKey)+1)){assertKboOffseasonExit(source);return structuredClone(source);}
 const p=projection(source),key=source.protagonistKey;
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.seasonClose?.seasonKey!==source.world.seasonKey || !kboContractExpiresAfterSeason(source) || p.originFits || source.world.players[key]!.age>=45 || source.renewal?.seasonKey===p.target || source.rights.holderOrgId!==source.protagonistClubId || source.events.some(e=>e.status==='OPEN' && e.definitionId!=='E50'))throw new RangeError('KBO_OFFSEASON_EXIT_NOT_AVAILABLE');
 const day=source.days!.days.at(-1)!.day,d=eventDefinition('E30'),event=createWorldEvent({definitionId:'E30',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:key,contractWindowId:p.requestKey,sourceReceiptId:source.seasonClose.receiptKey}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 const c=structuredClone(source);c.offseasonExit={requestKey:p.requestKey,eventKey:event.eventKey,playerKey:key,fromClubId:source.protagonistClubId,seasonKey:p.target,sourceBasis:p.sourceBasis,offers:p.offers,status:'OPEN'};c.events=[...c.events,event];c.schemaVersion=7;c.revision++;return c;
}

export function acceptKboOffseasonOffer(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;offerKey:string}):KboCareer {
 assertKboCareerRevision(source,expectedRevision);assertKboRecruitmentWorld(source.world);const o=assertKboOffseasonExit(source),request=source.agents?.salaryRequests.find(r=>r.offerSetKey===o.requestKey&&r.counterOfferKey===input.offerKey),base=o.offers.find(x=>x.offerKey===(request?.baseOfferKey??input.offerKey)),offer=base?careerAgentOffseasonOffer(source,base,input.offerKey):undefined,event=source.events.find(e=>e.eventKey===o.eventKey)!;
 if(o.status!=='OPEN' || !offer || input.eventKey!==o.eventKey)throw new RangeError('KBO_OFFSEASON_OFFERS_CHANGED');
 const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['kbo-offseason-accept',offer.offerKey]),command:'ACCEPT_OFFSEASON_OFFER'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS']}),p=projection(source),c=structuredClone(source);
 c.offseasonExit={...o,status:'ACCEPTED',acceptedOfferKey:offer.offerKey,...(base!.offerKey!==offer.offerKey?{acceptedBaseOfferKey:base!.offerKey}:{})};c.renewal={...offer,eventKey:o.eventKey,playerKey:o.playerKey,seasonKey:o.seasonKey,previousSalaryWon:source.world.contracts[o.playerKey]!.annualSalaryWon,valueWon:p.valueWon,basis:p.basis,status:'ACCEPTED'};if(c.world.finance?.agentCounterReservations)c.world.finance.agentCounterReservations=c.world.finance.agentCounterReservations.map(r=>r.offerSetKey===o.requestKey&&r.counterOfferKey!==offer.offerKey?{...r,status:'RELEASED' as const}:r);c.events=c.events.map(e=>e.eventKey===event.eventKey?resolved:e);c.revision++;return c;
}

export function kboOffseasonOffersView(c:KboCareer){
 if(c.phaseContext.phase!=='SEASON_REVIEW' || !c.offseasonExit || c.offseasonExit.seasonKey!==String(Number(c.world.seasonKey)+1))return null;const o=assertKboOffseasonExit(c);
 return {eventKey:o.eventKey,eventVersion:c.events.find(e=>e.eventKey===o.eventKey)!.version,status:o.status,rightsReleaseSeasonKey:o.seasonKey,fromClubId:o.fromClubId,offers:o.offers.map(x=>({...x})),emptyReason:o.offers.length?null:'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET',retirementAvailable:true};
}

/** Private Y02 staging may temporarily exceed60 until the already-expiring NPC placeholders are removed by Y03. */
export function activateKboOffseasonExit(source:KboCareer,c:KboCareer):void {
 if(source.renewal?.clubId===source.protagonistClubId || !source.renewal)return;
 const o=assertKboOffseasonExit(source),key=c.protagonistKey,from=c.world.clubs.find(t=>t.id===o.fromClubId)!,to=c.world.clubs.find(t=>t.id===source.renewal!.clubId)!;
 from.roster=from.roster.filter(k=>k!==key);from.firstTeam=from.firstTeam.filter(k=>k!==key);to.roster=[...to.roster,key].sort();c.world.contracts[key]!.clubId=to.id;c.protagonistClubId=to.id;c.rights={...c.rights,sourceType:'FREE_AGENT',holderOrgId:to.id};
}

export function settleKboOffseasonEntryRelations(source:KboCareer,c:KboCareer):void {
 if(source.protagonistClubId===c.protagonistClubId)return;
 const o=source.offseasonExit!,from=source.world.clubs.find(t=>t.id===source.protagonistClubId)!,to=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,day=source.days!.days.at(-1)!.day;
 for(const r of c.relationships.relations)if(r.primaryPlayerKey!==c.protagonistKey || r.primaryPlayerKey===r.otherPlayerKey || !['RIVAL','TEAMMATE'].includes(r.type) || r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort()) || r.relationKey!==JSON.stringify([r.type,r.normalPairKey]) || !r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
 c.relationships.relations=c.relationships.relations.map(r=>['FORMED','REUNITED_TEAM'].includes(r.stage) && from.roster.includes(r.otherPlayerKey) && !to.roster.includes(r.otherPlayerKey)?{...r,stage:'SEPARATED',milestones:[...r.milestones,{stage:'SEPARATED',worldDay:day,evidenceKey:JSON.stringify(['relation-separation',r.relationKey,o.acceptedOfferKey])}]}:r);
 c.relationships=formRegisteredTeamTeammate(c.relationships,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,leagueKey:'KBO',protagonistKey:c.protagonistKey,protagonistSchoolId:to.id,schools:c.world.clubs,players:c.world.players},o.acceptedOfferKey!,0);
 const world={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,leagueKey:'KBO',protagonistKey:c.protagonistKey,protagonistSchoolId:to.id,schools:c.world.clubs,players:c.world.players};
 c.relationNotices=queueRelationFormationNotices({...c,world,previousSeasons:[...(c.amateurHistory.previousSeasons??[]),{world:c.amateurHistory.world}]},0)??[];
}

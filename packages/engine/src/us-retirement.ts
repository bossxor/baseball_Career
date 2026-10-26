import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent} from './events.js';

export interface UsCareerRetirement {receiptKey:string;reason:'VOLUNTARY'|'MAX_AGE';seasonKey:string;age:number;clubId:string;endedContractKey:string;sourceRevision:number}
const taskKey=(c:UsCareer)=>JSON.stringify(['us-retirement',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);
/** Archived registration/contract rows are frozen history, never a playable active contract. */
export function assertUsRetirementState(c:UsCareer):void {
 const r=c.retirement;
 if(c.phaseContext.phase!=='ARCHIVED'){if(r)throw new RangeError('INVALID_US_RETIREMENT');return;}
 const p=c.world.players[c.protagonistKey];
 if(!r||!p||r.receiptKey!==taskKey(c)||r.seasonKey!==c.world.seasonKey||r.age!==p.age||r.clubId!==c.protagonistOrganizationId||r.endedContractKey!==c.contract.contractKey||!['VOLUNTARY','MAX_AGE'].includes(r.reason)||r.reason==='MAX_AGE'&&r.age!==45||!Number.isSafeInteger(r.sourceRevision)||r.sourceRevision<1||r.sourceRevision>c.revision)throw new RangeError('INVALID_US_RETIREMENT');
}
function ready(c:UsCareer):void {
 const blockers=usYearTransitionReadiness(c).blockers;
 // Retirement needs no next-season contract or permission to depart for another overseas season.
 if(blockers.some(b=>!['MAX_AGE_REACHED','CONTRACT_DECISION_REQUIRED','MILITARY_PLAN_REQUIRED'].includes(b)))throw new RangeError('US_RETIREMENT_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
}
function notice(c:UsCareer,id:'E36'|'E37',revision:number){return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition(id).evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,retirementTaskOrReceiptId:taskKey(c)}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:c.protagonistOrganizationId,sourceRevision:revision},sourceSequence:c.events.length+1,worldDay:Object.values(c.records.games).reduce((day,g)=>g.scope.seasonKey===c.world.seasonKey?Math.max(day,g.worldDay):day,c.season!.lastDay)});}
function finish(c:UsCareer,reason:UsCareerRetirement['reason']):UsCareer {
 const revision=c.revision+1,retirement:UsCareerRetirement={receiptKey:taskKey(c),reason,seasonKey:c.world.seasonKey,age:c.world.players[c.protagonistKey]!.age,clubId:c.protagonistOrganizationId,endedContractKey:c.contract.contractKey,sourceRevision:revision};
 const next:UsCareer={...c,revision,retirement,phaseContext:{phase:'ARCHIVED'},events:[...c.events,notice(c,'E37',revision)]};assertUsCareerRevision(next,revision);return next;
}
export function requestUsRetirement(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);ready(c);const event=notice(c,'E36',revision+1);
 return {...c,revision:revision+1,events:[...c.events,event],phaseContext:{phase:'RETIRE_CONFIRM',eventKey:event.eventKey}};
}
export function resolveUsRetirement(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}):UsCareer {
 assertUsCareerRevision(c,revision);const phase=c.phaseContext,event=c.events.find(e=>e.eventKey===input.eventKey);
 if(phase.phase!=='RETIRE_CONFIRM'||phase.eventKey!==input.eventKey||event?.definitionId!=='E36'||event.evidence.fields.retirementTaskOrReceiptId!==taskKey(c)||!['CONFIRM_RETIRE','CANCEL_RETIRE'].includes(input.command))throw new RangeError('INVALID_US_RETIREMENT_EVENT');
 const base:UsCareer={...c,phaseContext:{phase:'SEASON_REVIEW'},events:c.events.filter(e=>e.eventKey!==event.eventKey)};ready(base);
 const closed=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['us-retirement-decision',taskKey(c),input.command]),command:input.command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:[input.command]});
 const next:UsCareer={...c,events:c.events.map(e=>e.eventKey===closed.eventKey?closed:e),phaseContext:{phase:'SEASON_REVIEW'}};
 return input.command==='CANCEL_RETIRE'?{...next,revision:revision+1}:finish(next,'VOLUNTARY');
}
export function retireUsAtMaxAge(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);ready(c);if(c.world.players[c.protagonistKey]!.age!==45)throw new RangeError('US_RETIREMENT_NOT_AVAILABLE');return finish(c,'MAX_AGE');
}

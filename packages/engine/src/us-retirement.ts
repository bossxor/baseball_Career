import {hasOnlyUsMajorFaWindowEvent,completeUsMajorFaWindow} from './us-major-fa-window.js';
import {careerRetirementEventId,retirementConfirmationId} from './career-retirement-event.js';
import {refreshCareerSeasonGoals} from './season-goals.js';
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
/** A player whose US service ended without an active contract can close the career at the last certified date. */
export function canRequestUsDischargeRetirement(c:UsCareer):boolean {
 const s=c.military.service,phase=c.phaseContext;
 if(c.military.status!=='COMPLETED'||c.contract.status!=='TERMINATED'||s?.version!==2||s.returnContract||
  s.completedBlocks!==s.scheduledBlocks||!s.cursor||c.season?.days.at(-1)?.day!==s.cursor.worldDay||
  c.events.some(e=>e.status==='OPEN')||!(phase.phase==='SEASON_REVIEW'||phase.phase==='SEASON_PROGRESS'&&!phase.pendingGame))return false;
 const option=s.returnOption?.status;
 return s.terminatedContractKey!==undefined&&option===undefined||
  option==='DECLINED'||option==='EXPIRED'||
  option==='CONFIRMED'&&(s.returnOffer?.status==='DECLINED'||s.returnOffer?.status==='EXPIRED');
}
function ready(c:UsCareer):void {
 if(canRequestUsDischargeRetirement(c)){auditUsClosedDays(c);return;}
 const blockers=usYearTransitionReadiness(c).blockers;
 // Retirement needs no next-season contract or permission to depart for another overseas season.
 if(blockers.some(b=>!['MAX_AGE_REACHED','CONTRACT_DECISION_REQUIRED','MILITARY_PLAN_REQUIRED'].includes(b)&&!(b==='OPEN_EVENT'&&hasOnlyUsMajorFaWindowEvent(c))))throw new RangeError('US_RETIREMENT_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
}
function notice(c:UsCareer,id:'E36'|'E37'|'E69',revision:number){return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition(id).evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,retirementTaskOrReceiptId:id==='E36'?retirementConfirmationId(taskKey(c),revision):taskKey(c)}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase==='SEASON_PROGRESS'?'SEASON_PROGRESS':'SEASON_REVIEW',competitionKey:null,registrationKey:c.protagonistOrganizationId,sourceRevision:revision},sourceSequence:c.events.length+1,worldDay:canRequestUsDischargeRetirement(c)?c.military.service!.cursor!.worldDay:Object.values(c.records.games).reduce((day,g)=>g.scope.seasonKey===c.world.seasonKey?Math.max(day,g.worldDay):day,c.season!.lastDay)});}
function finish(c:UsCareer,reason:UsCareerRetirement['reason']):UsCareer {
 const revision=c.revision+1,retirement:UsCareerRetirement={receiptKey:taskKey(c),reason,seasonKey:c.world.seasonKey,age:c.world.players[c.protagonistKey]!.age,clubId:c.protagonistOrganizationId,endedContractKey:c.contract.contractKey,sourceRevision:revision};
 const prepared=completeUsMajorFaWindow(c,'CONFIRM_RETIRE',retirement.receiptKey),next:UsCareer={...prepared,revision,retirement,phaseContext:{phase:'ARCHIVED'},events:[...prepared.events,notice(prepared,careerRetirementEventId(c.records,c.protagonistKey),revision)]};assertUsCareerRevision(next,revision);return refreshCareerSeasonGoals(next);
}
export function requestUsRetirement(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);ready(c);const event=notice(c,'E36',revision+1);
 return {...c,revision:revision+1,events:[...c.events,event],phaseContext:{phase:'RETIRE_CONFIRM',eventKey:event.eventKey}};
}
export function resolveUsRetirement(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}):UsCareer {
 assertUsCareerRevision(c,revision);const phase=c.phaseContext,event=c.events.find(e=>e.eventKey===input.eventKey);
 if(phase.phase!=='RETIRE_CONFIRM'||phase.eventKey!==input.eventKey||event?.definitionId!=='E36'||event.evidence.fields.playerSimulationKey!==c.protagonistKey||event.evidence.fields.retirementTaskOrReceiptId!==taskKey(c)&&event.evidence.fields.retirementTaskOrReceiptId!==retirementConfirmationId(taskKey(c),event.resume.sourceRevision)||!['CONFIRM_RETIRE','CANCEL_RETIRE'].includes(input.command))throw new RangeError('INVALID_US_RETIREMENT_EVENT');
 const base:UsCareer={...c,phaseContext:event.resume.phase==='SEASON_PROGRESS'?{phase:'SEASON_PROGRESS',nextWorldDay:event.occurredWorldDay+1,pendingGame:null}:{phase:'SEASON_REVIEW'},events:c.events.filter(e=>e.eventKey!==event.eventKey)};ready(base);
 const closed=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['us-retirement-decision',taskKey(c),input.command]),command:input.command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:[input.command]});
 const next:UsCareer={...c,events:c.events.map(e=>e.eventKey===closed.eventKey?closed:e),phaseContext:base.phaseContext};
 return input.command==='CANCEL_RETIRE'?{...next,revision:revision+1}:finish(next,'VOLUNTARY');
}
export function retireUsAtMaxAge(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);ready(c);if(c.world.players[c.protagonistKey]!.age!==45)throw new RangeError('US_RETIREMENT_NOT_AVAILABLE');return finish(c,'MAX_AGE');
}

import {CAREER_PHASES} from '@playball/rules';
import type {CareerPhase} from '@playball/rules';
import {EVENT_DEFINITIONS} from './event-catalogue.js';
import type {EventDefinition,EventResolutionPolicy} from './event-catalogue.js';
import {canonicalJson} from './game.js';
export interface EventEvidence {version:1;type:string;fields:Readonly<Record<string,string|number>>}
export interface EventResume {worldKey:string;seasonKey:string;phase:CareerPhase;competitionKey:string|null;registrationKey:string|null;sourceRevision:number}
export interface EventInstance {
 eventKey:string;definitionId:string;definitionVersion:1;worldKey:string;seasonKey:string;evidence:EventEvidence;evidenceKey:string;
 resume:EventResume;sourceSequence:number;occurredWorldDay:number;deadlineWorldDay:number|null;
 postingDecision:'APPROVED'|'DEFERRED'|null;offeredChoices:readonly string[];
 version:number;status:'OPEN'|'RESOLVED'|'EXPIRED_BY_DEADLINE'|'CANCELLED_WITH_REASON';
 resolution:null|{kind:'ACK'|'NAVIGATE'|'DOMAIN'|'DEADLINE'|'INVALIDATED';command:string|null;receiptKey:string|null;reason:string|null};
}
export interface EventContext {worldKey:string;seasonKey:string;worldDay:number;eligibleCommands:readonly string[]}
export function eventDefinition(id:string):EventDefinition {const found=EVENT_DEFINITIONS.find(e=>e.id===id);if(!found)throw new RangeError('UNKNOWN_EVENT');return found;}
function evidenceKey(definition:EventDefinition,evidence:EventEvidence):string {
 if(evidence.version!==1 || evidence.type!==definition.evidenceDomain || Object.keys(evidence.fields).length!==definition.evidenceFields.length || definition.evidenceFields.some(key=>!Object.hasOwn(evidence.fields,key)))throw new RangeError('INVALID_EVENT_EVIDENCE');
 for(const value of Object.values(evidence.fields))if(typeof value==='string'?!value:!Number.isSafeInteger(value) || value<0)throw new RangeError('INVALID_EVENT_EVIDENCE');
 return canonicalJson(evidence);
}
function branch(definition:EventDefinition,decision:EventInstance['postingDecision']) {
 if(definition.resolutionPolicy==='BY_POSTING_DECISION') {
   if(decision!=='APPROVED' && decision!=='DEFERRED')throw new RangeError('POSTING_DECISION_REQUIRED');
   const value=definition.resolutionBranches?.[decision];if(!value)throw new RangeError('UNKNOWN_POSTING_BRANCH');return value;
 }
 if(decision!==null)throw new RangeError('UNEXPECTED_POSTING_DECISION');
 return {resolutionPolicy:definition.resolutionPolicy,choiceCommands:definition.choices.map(c=>c.command)};
}
export function eventResolutionPolicy(instance:EventInstance):EventResolutionPolicy {return branch(eventDefinition(instance.definitionId),instance.postingDecision).resolutionPolicy;}
function validateEvent(instance:EventInstance):void {
 const definition=eventDefinition(instance.definitionId);if(['FORM','PRESENTATION'].includes(definition.queueClass))throw new RangeError('NOT_A_WORLD_EVENT');
 const key=evidenceKey(definition,instance.evidence),policy=branch(definition,instance.postingDecision);
 if(key!==instance.evidenceKey || instance.eventKey!==JSON.stringify(['event-1',instance.worldKey,instance.definitionId,key]) || instance.definitionVersion!==1 || !instance.worldKey || !instance.seasonKey || instance.resume.worldKey!==instance.worldKey || instance.resume.seasonKey!==instance.seasonKey || !CAREER_PHASES.includes(instance.resume.phase))throw new RangeError('INVALID_EVENT_INSTANCE');
 for(const n of [instance.version,instance.sourceSequence,instance.occurredWorldDay,instance.resume.sourceRevision])if(!Number.isSafeInteger(n) || n<0)throw new RangeError('INVALID_EVENT_VERSION');
 if(instance.version<1 || instance.deadlineWorldDay!==null && (!Number.isSafeInteger(instance.deadlineWorldDay) || instance.deadlineWorldDay<instance.occurredWorldDay) || instance.offeredChoices.length===0 || new Set(instance.offeredChoices).size!==instance.offeredChoices.length || instance.offeredChoices.some(command=>!policy.choiceCommands.includes(command)))throw new RangeError('INVALID_EVENT_CHOICES');
 if(!['OPEN','RESOLVED','EXPIRED_BY_DEADLINE','CANCELLED_WITH_REASON'].includes(instance.status) || (instance.status==='OPEN')!==(instance.resolution===null))throw new RangeError('INVALID_EVENT_STATUS');
}
/** Called only after a domain trigger has proved the typed source and current eligibility. */
export function createWorldEvent(input:{definitionId:string;worldKey:string;seasonKey:string;evidence:EventEvidence;resume:EventResume;sourceSequence:number;worldDay:number;deadlineWorldDay?:number;postingDecision?:'APPROVED'|'DEFERRED';offeredChoices?:readonly string[]}):EventInstance {
 const definition=eventDefinition(input.definitionId);if(['FORM','PRESENTATION'].includes(definition.queueClass))throw new RangeError('NOT_A_WORLD_EVENT');
 const decision=input.postingDecision??null,policy=branch(definition,decision),key=evidenceKey(definition,input.evidence);
 const instance:EventInstance={eventKey:JSON.stringify(['event-1',input.worldKey,input.definitionId,key]),definitionId:input.definitionId,definitionVersion:1,worldKey:input.worldKey,seasonKey:input.seasonKey,evidence:structuredClone(input.evidence),evidenceKey:key,resume:structuredClone(input.resume),sourceSequence:input.sourceSequence,occurredWorldDay:input.worldDay,deadlineWorldDay:input.deadlineWorldDay??null,postingDecision:decision,offeredChoices:[...(input.offeredChoices??policy.choiceCommands)],version:1,status:'OPEN',resolution:null};
 validateEvent(instance);return instance;
}
function checkOpen(instance:EventInstance,expectedVersion:number,context:Pick<EventContext,'worldKey'|'seasonKey'|'worldDay'>):void {
 validateEvent(instance);
 if(context.worldKey!==instance.worldKey || context.seasonKey!==instance.seasonKey || !Number.isSafeInteger(context.worldDay) || context.worldDay<instance.occurredWorldDay)throw new RangeError('RESUME_CONTEXT_CHANGED');
 if(expectedVersion!==instance.version)throw new RangeError('EVENT_VERSION_CHANGED');if(instance.status!=='OPEN')throw new RangeError('EVENT_ALREADY_RESOLVED');
}
function close(instance:EventInstance,resolution:NonNullable<EventInstance['resolution']>,status:EventInstance['status']='RESOLVED'):EventInstance {return {...structuredClone(instance),version:instance.version+1,status,resolution};}
export interface DomainEventPlan {eventKey:string;eventVersion:number;sourceEvidenceKey:string;command:string;payload:unknown}
/** Planning a DOMAIN choice performs no game effect and does not close the event. */
export function resolveEventChoice(instance:EventInstance,expectedVersion:number,command:string,payload:unknown,context:EventContext) {
 checkOpen(instance,expectedVersion,context);
 if(instance.deadlineWorldDay!==null && context.worldDay>instance.deadlineWorldDay)throw new RangeError('EVENT_DEADLINE_PASSED');
 const definition=eventDefinition(instance.definitionId),policy=branch(definition,instance.postingDecision),choice=definition.choices.find(c=>c.command===command);
 if(!choice || !policy.choiceCommands.includes(command) || !instance.offeredChoices.includes(command) || !context.eligibleCommands.includes(command))throw new RangeError('INVALID_CHOICE');
 if(choice.dispatchClass==='ACK') {
   if(policy.resolutionPolicy!=='RESOLVE_ON_SELECT')throw new RangeError('BLOCKING_TASK_PENDING');
   return {event:close(instance,{kind:'ACK',command,receiptKey:null,reason:null}),navigation:null,domain:null};
 }
 if(choice.dispatchClass==='NAVIGATE') {
   if(!choice.targetScreen)throw new RangeError('INVALID_NAVIGATION');
   const event=policy.resolutionPolicy==='RESOLVE_ON_SELECT'?close(instance,{kind:'NAVIGATE',command,receiptKey:null,reason:null}):structuredClone(instance);
   return {event,navigation:{targetScreen:choice.targetScreen,sourceEventKey:instance.eventKey},domain:null};
 }
 const domain:DomainEventPlan={eventKey:instance.eventKey,eventVersion:instance.version,sourceEvidenceKey:instance.evidenceKey,command,payload:structuredClone(payload)};
 return {event:structuredClone(instance),navigation:null,domain};
}
/** SERVER ONLY: call in the same transaction/reducer that successfully committed this DOMAIN plan. */
export function completeEventDomain(instance:EventInstance,plan:DomainEventPlan,receiptKey:string,context:EventContext):EventInstance {
 checkOpen(instance,plan.eventVersion,context);
 if(plan.eventKey!==instance.eventKey || plan.sourceEvidenceKey!==instance.evidenceKey || !receiptKey)throw new RangeError('EVENT_SOURCE_MISMATCH');
 const prepared=resolveEventChoice(instance,plan.eventVersion,plan.command,plan.payload,context);
 if(!prepared.domain)throw new RangeError('NOT_A_DOMAIN_CHOICE');
 return close(instance,{kind:'DOMAIN',command:plan.command,receiptKey,reason:null});
}
/** SERVER ONLY: a navigated blocking task may close via another legitimate domain outcome, not only the initial card. */
export function completeBlockingEvent(instance:EventInstance,expectedVersion:number,committedTask:{sourceEvidenceKey:string;receiptKey:string;command:string},context:EventContext):EventInstance {
 checkOpen(instance,expectedVersion,context);
 if(instance.deadlineWorldDay!==null && context.worldDay>instance.deadlineWorldDay)throw new RangeError('EVENT_DEADLINE_PASSED');
 if(eventResolutionPolicy(instance)!=='BLOCKING_UNTIL_DOMAIN_COMMIT' || committedTask.sourceEvidenceKey!==instance.evidenceKey || !committedTask.receiptKey || !committedTask.command)throw new RangeError('BLOCKING_TASK_SOURCE_MISMATCH');
 return close(instance,{kind:'DOMAIN',command:committedTask.command,receiptKey:committedTask.receiptKey,reason:null});
}
export function expireEventAfterDomainDeadline(instance:EventInstance,expectedVersion:number,receiptKey:string,context:EventContext,dayClosing:boolean):EventInstance {
 checkOpen(instance,expectedVersion,context);
 if(!receiptKey || !dayClosing || instance.deadlineWorldDay===null || context.worldDay<instance.deadlineWorldDay)throw new RangeError('DEADLINE_NOT_COMMITTED');
 return close(instance,{kind:'DEADLINE',command:null,receiptKey,reason:'DOMAIN_DEADLINE_COMMITTED'},'EXPIRED_BY_DEADLINE');
}
export function cancelInvalidEvent(instance:EventInstance,expectedVersion:number,reason:string,context:EventContext):EventInstance {
 checkOpen(instance,expectedVersion,context);if(!reason)throw new RangeError('INVALID_CANCELLATION_REASON');return close(instance,{kind:'INVALIDATED',command:null,receiptKey:null,reason},'CANCELLED_WITH_REASON');
}
/** One active blocking task; deadlines before immutable source sequence and stable definition/key ties. */
export function activeBlockingEvent(events:readonly EventInstance[]):EventInstance|null {
 for(const event of events)validateEvent(event);
 const open=events.filter(e=>e.status==='OPEN');if(open.some(e=>e.worldKey!==open[0]!.worldKey || e.seasonKey!==open[0]!.seasonKey))throw new RangeError('MIXED_EVENT_SCOPE');
 const pending=events.filter(e=>e.status==='OPEN' && eventResolutionPolicy(e)==='BLOCKING_UNTIL_DOMAIN_COMMIT');
 pending.sort((a,b)=>(a.deadlineWorldDay??Infinity)-(b.deadlineWorldDay??Infinity) || a.sourceSequence-b.sourceSequence || (a.definitionId<b.definitionId?-1:a.definitionId>b.definitionId?1:a.eventKey<b.eventKey?-1:a.eventKey>b.eventKey?1:0));
 return pending[0]?structuredClone(pending[0]):null;
}

export function enqueueWorldEvent(source:readonly EventInstance[],candidate:EventInstance):{events:EventInstance[];duplicate:boolean} {
 validateEvent(candidate);for(const event of source)validateEvent(event);
 if(source.some(event=>event.worldKey!==candidate.worldKey))throw new RangeError('MIXED_EVENT_SCOPE');
 const old=source.find(event=>event.eventKey===candidate.eventKey);
 if(old) {if(old.postingDecision!==candidate.postingDecision)throw new RangeError('EVENT_EVIDENCE_REUSED');return {events:structuredClone([...source]),duplicate:true};}
 return {events:[...structuredClone(source),structuredClone(candidate)],duplicate:false};
}

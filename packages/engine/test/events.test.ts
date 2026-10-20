import assert from 'node:assert/strict';
import test from 'node:test';
import {EVENT_DEFINITIONS} from '../src/event-catalogue.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,completeEventDomain,completeBlockingEvent,eventResolutionPolicy,activeBlockingEvent,enqueueWorldEvent,expireEventAfterDomainDeadline,cancelInvalidEvent} from '../src/events.js';
import type {EventContext,EventInstance} from '../src/events.js';
import {assertFocus} from '@playball/rules';
const make=(definitionId:string,overrides:Partial<Parameters<typeof createWorldEvent>[0]>={}):EventInstance=>{
 const d=eventDefinition(definitionId);return createWorldEvent({definitionId,worldKey:'world',seasonKey:'2027',worldDay:1,sourceSequence:0,evidence:{version:1,type:d.evidenceDomain,fields:Object.fromEntries(d.evidenceFields.map(k=>[k,k==='academicYear'?1:'logical-'+k]))},resume:{worldKey:'world',seasonKey:'2027',phase:'SEASON_PROGRESS',competitionKey:'HS',registrationKey:'HS-school',sourceRevision:0},...overrides});
};
const context=(e:EventInstance,overrides:Partial<EventContext>={}):EventContext=>({worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices,...overrides});
test('125: generated99/164 metadata, all dispatch/branch counts; domain implementations not implied',()=>{
 assert.equal(EVENT_DEFINITIONS.length,99);assert.equal(EVENT_DEFINITIONS.flatMap(e=>e.choices).length,164);
 assert.equal(new Set(EVENT_DEFINITIONS.flatMap(e=>e.choices.map(c=>c.command))).size,91);
 for(const [kind,count] of [['DOMAIN',70],['NAVIGATE',50],['ACK',44]] as const)assert.equal(EVENT_DEFINITIONS.flatMap(e=>e.choices).filter(c=>c.dispatchClass===kind).length,count);
 assert.equal(EVENT_DEFINITIONS.filter(e=>e.resolutionPolicy==='BLOCKING_UNTIL_DOMAIN_COMMIT').length,35);
 for(const d of EVENT_DEFINITIONS.filter(d=>!['FORM','PRESENTATION'].includes(d.queueClass) && d.id!=='E63'))assert.equal(make(d.id).definitionId,d.id);
});
test('81: exact typed evidence key, duplicates including already-resolved source never resurrect',()=>{
 const e=make('E02'),first=enqueueWorldEvent([],e);assert.equal(first.duplicate,false);assert.equal(first.events.length,1);
 const resolved=resolveEventChoice(e,1,'KEEP_FOCUS',null,context(e)).event;
 const duplicate=enqueueWorldEvent([resolved],make('E02',{sourceSequence:9,worldDay:20}));assert.equal(duplicate.duplicate,true);assert.equal(duplicate.events[0]!.status,'RESOLVED');
 assert.throws(()=>make('E02',{evidence:{version:1,type:'INJURY',fields:{careerSimulationKey:'x'}}}),/INVALID_EVENT_EVIDENCE/);
 assert.throws(()=>make('E02',{evidence:{version:1,type:'CAREER_START',fields:{careerSimulationKey:'x',extra:'not allowed'}}}));
 const serialized=JSON.parse(JSON.stringify(e));assert.deepEqual(enqueueWorldEvent([e],serialized).events,[e]);
});
test('125: blocking navigation remains OPEN, no ACK bypass; actual domain source commits resolution',()=>{
 const e=make('E30'),nav=resolveEventChoice(e,1,'OPEN_CAREER_OFFERS',null,context(e));assert.equal(nav.event.status,'OPEN');assert.equal(nav.event.version,1);assert.equal(nav.navigation!.targetScreen,'S08');
 assert.throws(()=>resolveEventChoice(e,1,'ACK_EVENT',null,context(e)),/INVALID_CHOICE/);
 const done=completeBlockingEvent(e,1,{sourceEvidenceKey:e.evidenceKey,receiptKey:'domain-receipt',command:'ACCEPT_CONTRACT'},context(e));assert.equal(done.status,'RESOLVED');assert.equal(done.version,2);assert.equal(e.status,'OPEN');
 assert.throws(()=>completeBlockingEvent(e,1,{sourceEvidenceKey:'wrong-task',receiptKey:'receipt',command:'ACCEPT_CONTRACT'},context(e)));
 assert.throws(()=>completeBlockingEvent(done,1,{sourceEvidenceKey:e.evidenceKey,receiptKey:'another',command:'ACCEPT_CONTRACT'},context(done)));
});
test('125: DOMAIN is only a plan until actual reducer succeeds; invalid focus leaves event unchanged',()=>{
 const e=make('E01'),result=resolveEventChoice(e,1,'CHOOSE_FOCUS',{focus:['CONTACT','POWER','DISCIPLINE','DEFENSE']},context(e));assert.ok(result.domain);assert.equal(result.event.status,'OPEN');
 const plan=result.domain!,focus=(plan.payload as {focus:string[]}).focus;assertFocus('HITTER',focus);
 const done=completeEventDomain(e,plan,'focus-receipt',context(e));assert.equal(done.status,'RESOLVED');assert.equal(done.resolution!.kind,'DOMAIN');
 const invalid=resolveEventChoice(e,1,'CHOOSE_FOCUS',{focus:['CONTACT']},context(e));assert.throws(()=>assertFocus('HITTER',(invalid.domain!.payload as {focus:string[]}).focus));assert.equal(e.status,'OPEN');
 assert.throws(()=>completeEventDomain(e,plan,'',context(e)));assert.throws(()=>completeEventDomain(e,plan,'receipt',context(e,{eligibleCommands:[]})));
});
test('125: nonblocking navigation and ACK resolve once; current availability/context/version rechecked',()=>{
 const e=make('E85'),choice=eventDefinition('E85').choices.find(c=>c.dispatchClass==='NAVIGATE')!;
 assert.equal(resolveEventChoice(e,1,choice.command,null,context(e)).event.status,'RESOLVED');
 assert.throws(()=>resolveEventChoice(e,1,choice.command,null,context(e,{eligibleCommands:[]})),/INVALID_CHOICE/);
 assert.throws(()=>resolveEventChoice(e,2,choice.command,null,context(e)),/EVENT_VERSION_CHANGED/);
 assert.throws(()=>resolveEventChoice(e,1,choice.command,null,context(e,{worldKey:'another'})),/RESUME_CONTEXT_CHANGED/);
 const keep=make('E01');assert.equal(resolveEventChoice(keep,1,'KEEP_FOCUS',null,context(keep)).event.status,'RESOLVED');
});
test('E63 approved/deferred branch must come from saved posting decision, no fallback/re-roll',()=>{
 assert.throws(()=>make('E63'),/POSTING_DECISION_REQUIRED/);
 const approved=make('E63',{postingDecision:'APPROVED'}),deferred=make('E63',{postingDecision:'DEFERRED'});
 assert.equal(eventResolutionPolicy(approved),'BLOCKING_UNTIL_DOMAIN_COMMIT');assert.equal(resolveEventChoice(approved,1,'OPEN_POSTING_OFFERS',null,context(approved)).event.status,'OPEN');
 assert.throws(()=>resolveEventChoice(approved,1,'ACK_EVENT',null,context(approved)),/INVALID_CHOICE/);
 assert.equal(eventResolutionPolicy(deferred),'RESOLVE_ON_SELECT');assert.equal(resolveEventChoice(deferred,1,'ACK_EVENT',null,context(deferred)).event.status,'RESOLVED');
 assert.throws(()=>resolveEventChoice(deferred,1,'OPEN_POSTING_OFFERS',null,context(deferred)),/INVALID_CHOICE/);
 assert.throws(()=>enqueueWorldEvent([approved],deferred),/EVENT_EVIDENCE_REUSED/);
});
test('69/81: one active task deadline→source sequence order, no FORM/PRESENTATION world tasks',()=>{
 const a=make('E30',{sourceSequence:1,deadlineWorldDay:10}),b=make('E04',{sourceSequence:5,deadlineWorldDay:3}),notice=make('E85',{sourceSequence:0});
 assert.equal(activeBlockingEvent([a,notice,b])!.eventKey,b.eventKey);assert.equal(activeBlockingEvent([notice]),null);
 const earlier=make('E04',{sourceSequence:0,deadlineWorldDay:10});assert.equal(activeBlockingEvent([a,earlier])!.definitionId,'E04');
 for(const id of ['E79','E82','E83','E97','E98'])assert.throws(()=>make(id),/NOT_A_WORLD_EVENT/);
});
test('125: deadline expiry only after committed day-closing domain outcome; invalidation reason preserved',()=>{
 const e=make('E30',{deadlineWorldDay:10});assert.equal(resolveEventChoice(e,1,'OPEN_CAREER_OFFERS',null,context(e,{worldDay:10})).event.status,'OPEN');
 assert.throws(()=>resolveEventChoice(e,1,'OPEN_CAREER_OFFERS',null,context(e,{worldDay:11})),/EVENT_DEADLINE_PASSED/);
 assert.throws(()=>expireEventAfterDomainDeadline(e,1,'deadline-receipt',context(e,{worldDay:10}),false));
 const expired=expireEventAfterDomainDeadline(e,1,'deadline-receipt',context(e,{worldDay:10}),true);assert.equal(expired.status,'EXPIRED_BY_DEADLINE');
 const cancelled=cancelInvalidEvent(e,1,'source registration changed',context(e));assert.equal(cancelled.status,'CANCELLED_WITH_REASON');assert.equal(cancelled.resolution!.reason,'source registration changed');assert.equal(e.status,'OPEN');
});

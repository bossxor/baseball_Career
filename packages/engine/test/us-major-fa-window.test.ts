import test from 'node:test';
import assert from 'node:assert/strict';
import * as windowOwner from '../src/us-major-fa-window.js';
import {closedUsFreeAgentFixture,majorFaFunding} from './us-major-fa-fixture.js';

test('native eligible Major FA opens exactly one source-owned E66 without changing money or playing another season',()=>{const c=closedUsFreeAgentFixture(),n=windowOwner.openUsMajorFaWindow(c,c.revision,majorFaFunding(c));assert.equal(n.events.at(-1)!.definitionId,'E66');assert.equal(n.majorFaWindow!.sourceRevision,c.revision);});

import {usMajorFreeAgencyPreview,acceptUsMajorFreeAgency} from '../src/us-major-renewal.js';
import {usCareerView} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {requestUsRetirement,resolveUsRetirement} from '../src/us-retirement.js';
import {createWorldEvent,eventDefinition} from '../src/events.js';

test('Major E66 navigates while pending and preserves original native offers, records, income and annual state',()=>{
 const c=closedUsFreeAgentFixture(),raw=canonicalJson(c),quote=usMajorFreeAgencyPreview(c,majorFaFunding(c)),n=windowOwner.openUsMajorFaWindow(c,c.revision,majorFaFunding(c)),e=n.events.at(-1)!;assert.equal(canonicalJson(c),raw);assert.equal(canonicalJson(n.world),canonicalJson(c.world));assert.deepEqual(n.income,c.income);assert.deepEqual(n.contract,c.contract);assert.deepEqual(usMajorFreeAgencyPreview(n,majorFaFunding(n)).offers,quote.offers);assert.equal(windowOwner.openUsMajorFaWindow(n,n.revision,majorFaFunding(n)),n);const frozen=canonicalJson(n);
 for(const [command,target]of [['OPEN_CAREER_OFFERS','S08'],['OPEN_RETURN','S33']] as const){const r=windowOwner.resolveUsMajorFaWindow(n,n.revision,{eventKey:e.eventKey,eventVersion:e.version,command});assert.equal(r.career,n);assert.equal(r.navigation.targetScreen,target);assert.equal(e.status,'OPEN');assert.equal(canonicalJson(n),frozen);}
 assert.throws(()=>windowOwner.resolveUsMajorFaWindow(n,n.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'OPEN_RETURN'}),/VERSION/);assert.throws(()=>windowOwner.resolveUsMajorFaWindow(n,n.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'}),/CHOICE/);
});

test('actual Major FA acceptance closes only the owned E66 and commits the existing native transfer once',()=>{
 const base=closedUsFreeAgentFixture(),c=windowOwner.openUsMajorFaWindow(base,base.revision,majorFaFunding(base)),e=c.events.at(-1)!,offer=usMajorFreeAgencyPreview(c,majorFaFunding(c)).offers[1]!;assert.ok(offer);const before=canonicalJson(c),next=acceptUsMajorFreeAgency(c,c.revision,majorFaFunding(c),undefined,offer.offerKey);assert.equal(next.majorFaWindow,undefined);assert.equal(next.events.find(n=>n.eventKey===e.eventKey)!.resolution!.command,'ACCEPT_CAREER_OFFER');assert.equal(next.protagonistOrganizationId,offer.organizationId);assert.deepEqual(next.income,c.income);assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.equal(canonicalJson(c),before);assert.equal(next.majorYears!.at(-1)!.faOffer!.offerKey,offer.offerKey);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));assert.deepEqual(acceptUsMajorFreeAgency(JSON.parse(before),c.revision,majorFaFunding(c),undefined,offer.offerKey),next);assert.throws(()=>acceptUsMajorFreeAgency(next,next.revision,majorFaFunding(next),undefined,offer.offerKey),/NOT_AVAILABLE/);
});

test('Major E66 survives retirement cancellation and closes atomically only on actual retirement confirmation',()=>{
 const base=closedUsFreeAgentFixture(),c=windowOwner.openUsMajorFaWindow(base,base.revision,majorFaFunding(base)),key=c.majorFaWindow!.eventKey,asked=requestUsRetirement(c,c.revision),e=asked.events.at(-1)!,input={eventKey:e.eventKey,eventVersion:e.version},cancel=resolveUsRetirement(asked,asked.revision,{...input,command:'CANCEL_RETIRE'});assert.ok(cancel.majorFaWindow);assert.equal(cancel.events.find(e=>e.eventKey===key)!.status,'OPEN');assert.ok(usMajorFreeAgencyPreview(cancel,majorFaFunding(cancel)).offers.length);const retired=resolveUsRetirement(JSON.parse(JSON.stringify(asked)),asked.revision,{...input,command:'CONFIRM_RETIRE'});assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.majorFaWindow,undefined);assert.equal(retired.events.find(e=>e.eventKey===key)!.resolution!.command,'CONFIRM_RETIRE');assert.deepEqual(retired.income,c.income);assert.equal(canonicalJson(retired.records),canonicalJson(c.records));
});

test('Major E66 cannot bypass another blocking task, damaged window source, invalid funding or stale revision',()=>{
 const base=closedUsFreeAgentFixture(),c=windowOwner.openUsMajorFaWindow(base,base.revision,majorFaFunding(base)),before=canonicalJson(c);assert.throws(()=>windowOwner.openUsMajorFaWindow(base,base.revision-1,majorFaFunding(base)),/REVISION/);assert.throws(()=>windowOwner.openUsMajorFaWindow(base,base.revision,[]),/FUNDING/);const bad=structuredClone(c);bad.majorFaWindow!.sourceRevision=bad.revision;assert.throws(()=>usCareerView(bad),/WINDOW/);
 const other=structuredClone(c);other.events=[...other.events,createWorldEvent({definitionId:'E36',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition('E36').evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,retirementTaskOrReceiptId:'other-task'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision},sourceSequence:c.events.length+1,worldDay:c.season!.lastDay})];assert.throws(()=>usMajorFreeAgencyPreview(other,majorFaFunding(other)),/NOT_AVAILABLE/);assert.equal(canonicalJson(c),before);
});

import {openCareerAgentEvents,resolveCareerAgentEvent,openUsAgentSalaryOffer,careerSalaryCounterPreview,requestCareerSalaryCounter} from '../src/career-agent.js';
import {seedPcg32,nextFloat} from '../src/rng.js';

test('pending Major E66 preserves a sealed original-club agent counteroffer and charges its accepted price once',()=>{
 let c=closedUsFreeAgentFixture();c=openCareerAgentEvents(c,c.revision);const hire=c.agents!.notices.find(e=>e.definitionId==='E91'&&e.status==='OPEN')!;assert.ok(hire);c=resolveCareerAgentEvent(c,c.revision,{eventKey:hire.eventKey,eventVersion:hire.version,command:'HIRE_AGENT',agentId:'AG03'});const f=majorFaFunding(c),quote=usMajorFreeAgencyPreview(c,f),years=quote.offers.find(o=>o.organizationId===c.protagonistOrganizationId)!.years,target=quote.nextSeasonKey;
 // Explicit controlled future-budget authority; the production API does not invent these receipts.
 c=openUsAgentSalaryOffer(c,c.revision,f,Array.from({length:years-1},(_,i)=>({seasonKey:String(Number(target)+i+1),availableBudgetUsd:50_000_000,authorityReceiptKey:'controlled-future-'+i,authorityRevision:1})));const q=careerSalaryCounterPreview(c),option=q.options.find(o=>o.raiseBps===1000)!;assert.ok(option.eligible);
 let seed=0;while(nextFloat(seedPcg32(BigInt(seed),1n)).value>=option.probability)seed++;c.agents!.negotiationRng=seedPcg32(BigInt(seed),1n);c=requestCareerSalaryCounter(c,c.revision,{previewId:q.previewId,raiseBps:1000});const counter=c.agents!.salaryRequests.at(-1)!;assert.equal(counter.outcome,'ACCEPTED');const w=windowOwner.openUsMajorFaWindow(c,c.revision,f),event=w.majorFaWindow!.eventKey,next=acceptUsMajorFreeAgency(w,w.revision,f,counter.counterOfferKey!);assert.equal(next.contract.annualSalaryUsd,counter.annualSalary);assert.deepEqual(next.majorYears!.at(-1)!.agentCounter,counter);assert.equal(next.events.find(e=>e.eventKey===event)!.status,'RESOLVED');assert.equal(next.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd,c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd+20_000_000-counter.annualSalary);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));
});

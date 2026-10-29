import test from 'node:test';
import assert from 'node:assert/strict';
import type {UsCareer} from '../src/us-career-entry.js';
import {usCareerView} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {closeControlledServiceDates} from './us-service-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsMilitaryWorld,advanceUsMilitaryWorld} from '../src/us-season.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason,completeUsMilitaryService,confirmUsMilitaryReturn,acceptUsMilitaryReturnOffer,declineUsMilitaryReturnOffer,assertUsMilitaryPlayable,usMilitaryServiceView} from '../src/us-military-plan.js';

let cached:UsCareer|undefined;
/** Actual signing and annual writers; regular/postseason/service contribution dates are controlled, not native seasons. */
function dischargedExpiredMinor():UsCareer {
 if(cached)return structuredClone(cached);
 let c=closedUsOptionCareer();
 for(let i=1;i<c.contract.controlSeasons;i++){
  c=startNextUsMinorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));
  c=confirmUsPreseasonPlan(c,c.revision);c=publishUsSeasonSchedule(c,c.revision);c=finishedUsCareerFixture(c);
 }
 assert.equal(c.minorYears!.length,c.contract.controlSeasons-1);
 c=chooseUsMilitaryPlan(c,c.revision,'FREEZE');c=startUsMilitaryServiceSeason(c,c.revision);c=startUsMilitaryWorld(c,c.revision);c=closeControlledServiceDates(c,c.season!.lastDay);
 c=startUsMilitaryServiceSeason(c,c.revision);c=startUsMilitaryWorld(c,c.revision);c=closeControlledServiceDates(c,c.military.service!.completionDays[1]!.worldDay);
 cached=completeUsMilitaryService(c,c.revision);return structuredClone(cached);
}
function openedOffer(){const c=dischargedExpiredMinor();return confirmUsMilitaryReturn(c,c.revision);}
function json(c:UsCareer):UsCareer{return JSON.parse(JSON.stringify(c)) as UsCareer;}

test('expired minor confirmation opens a separate offer; explicit acceptance reserves once without paying or rewriting source history',()=>{
 const discharged=dischargedExpiredMinor(),before=canonicalJson(discharged),opened=confirmUsMilitaryReturn(discharged,discharged.revision),offer=opened.military.service!.returnOffer!;
 assert.equal(canonicalJson(discharged),before);assert.equal(opened.contract.status,'TERMINATED');assert.equal(offer.status,'OPEN');assert.equal(offer.contract.years,1);assert.equal(offer.contract.annualSalaryUsd,30000);assert.notEqual(offer.contract.contractKey,opened.military.service!.sourceContract!.contractKey);
 assert.equal(offer.expiresWorldDay-offer.issuedWorldDay,30);assert.deepEqual(opened.inventory,discharged.inventory);assert.deepEqual(opened.income,discharged.income);assert.equal(opened.registration.status,'INJURED');assert.throws(()=>assertUsMilitaryPlayable(opened),/NOT_PLAYABLE/);
 assert.deepEqual(confirmUsMilitaryReturn(json(discharged),discharged.revision),opened);
 const raw=canonicalJson(opened),accepted=acceptUsMilitaryReturnOffer(opened,opened.revision,offer.offerKey),service=accepted.military.service!,club=accepted.protagonistOrganizationId;
 assert.equal(canonicalJson(opened),raw);assert.equal(accepted.contract.status,'ACTIVE');assert.equal(service.returnOffer!.status,'ACCEPTED');assert.equal(accepted.contract.contractKey,offer.contract.contractKey);assert.equal(accepted.contract.signingBonusUsd,0);assert.deepEqual(accepted.income,opened.income);assert.deepEqual(accepted.records,opened.records);assert.deepEqual(service.sourceContract,opened.military.service!.sourceContract);assert.deepEqual(service.years,opened.military.service!.years);assert.equal(accepted.registration.status,'ACTIVE');assertUsMilitaryPlayable(accepted);
 const games=Object.values(opened.seasonSchedule!.leagues).flat(),first=Math.min(...games.map(g=>g.worldDay)),last=Math.max(...games.map(g=>g.worldDay)),effective=service.cursor!.worldDay+1,expected=Math.floor(30000*Math.max(0,last-Math.max(first,effective)+1)/(last-first+1));
 assert.equal(service.returnReservationUsd,expected);assert.equal(accepted.inventory.clubs.find(o=>o.id===club)!.availableBudgetUsd,opened.inventory.clubs.find(o=>o.id===club)!.availableBudgetUsd-expected);
 assert.deepEqual(acceptUsMilitaryReturnOffer(json(opened),opened.revision,offer.offerKey),accepted);assert.deepEqual(usCareerView(json(accepted)),usCareerView(accepted));assert.throws(()=>acceptUsMilitaryReturnOffer(accepted,accepted.revision,offer.offerKey),/NOT_AVAILABLE/);
});

test('new return offer rejects stale revisions and changed identity; decline survives JSON without any reservation',()=>{
 const opened=openedOffer(),offer=opened.military.service!.returnOffer!,raw=canonicalJson(opened);
 assert.throws(()=>acceptUsMilitaryReturnOffer(opened,opened.revision-1,offer.offerKey),/STALE/);assert.throws(()=>acceptUsMilitaryReturnOffer(opened,opened.revision,offer.offerKey+'changed'),/NOT_AVAILABLE/);assert.throws(()=>declineUsMilitaryReturnOffer(opened,opened.revision-1,offer.offerKey),/STALE/);assert.throws(()=>declineUsMilitaryReturnOffer(opened,opened.revision,offer.offerKey+'changed'),/NOT_AVAILABLE/);
 const forged=json(opened);forged.military.service!.returnOffer!.contract.annualSalaryUsd++;assert.throws(()=>usCareerView(forged),/INVALID_US_MILITARY_RETURN_OFFER/);
 const declined=declineUsMilitaryReturnOffer(opened,opened.revision,offer.offerKey);assert.equal(canonicalJson(opened),raw);assert.equal(declined.contract.status,'TERMINATED');assert.equal(declined.military.service!.returnOffer!.status,'DECLINED');assert.equal(declined.military.service!.returnContract,undefined);assert.deepEqual(declined.inventory,opened.inventory);assert.deepEqual(declined.income,opened.income);assert.deepEqual(declineUsMilitaryReturnOffer(json(opened),opened.revision,offer.offerKey),declined);assert.deepEqual(usMilitaryServiceView(json(declined)),usMilitaryServiceView(declined));assert.throws(()=>acceptUsMilitaryReturnOffer(declined,declined.revision,offer.offerKey),/NOT_AVAILABLE/);
});

test('controlled offer day29 remains acceptable and day30 expires without payment or implicit acceptance',()=>{
 const opened=openedOffer(),offer=opened.military.service!.returnOffer!,last=closeControlledServiceDates(opened,offer.expiresWorldDay-1);
 assert.equal(last.military.service!.returnOffer!.status,'OPEN');assert.equal(acceptUsMilitaryReturnOffer(last,last.revision,offer.offerKey).contract.status,'ACTIVE');
 const expired=closeControlledServiceDates(last,offer.expiresWorldDay);assert.equal(expired.military.service!.returnOffer!.status,'EXPIRED');assert.equal(expired.contract.status,'TERMINATED');assert.equal(expired.military.service!.returnContract,undefined);assert.deepEqual(expired.inventory,opened.inventory);assert.equal(expired.season!.paidUsd,0);assert.ok(expired.income.filter(i=>i.kind==='SALARY'&&i.seasonKey===expired.world.seasonKey).every(i=>i.amount===0));assert.deepEqual(usMilitaryServiceView(json(expired)),usMilitaryServiceView(expired));assert.throws(()=>acceptUsMilitaryReturnOffer(expired,expired.revision,offer.offerKey),/NOT_AVAILABLE/);
});

test('one native pending-offer chunk preserves its source and resumes identically after JSON',()=>{
 const opened=openedOffer(),raw=canonicalJson(opened),first=advanceUsMilitaryWorld(opened,opened.revision,1);
 assert.ok(first.plateAppearances>0||first.completedInnings>0||first.daysClosed>0);
 assert.equal(canonicalJson(opened),raw);assert.equal(first.career.military.service!.returnOffer!.status,'OPEN');assert.equal(first.career.contract.status,'TERMINATED');assert.equal(first.career.season!.paidUsd,0);
 const chunk=canonicalJson(first.career),next=advanceUsMilitaryWorld(first.career,first.career.revision,1),replayed=advanceUsMilitaryWorld(json(first.career),first.career.revision,1);
 assert.ok(next.plateAppearances>0||next.completedInnings>0||next.daysClosed>0);
 assert.equal(canonicalJson(first.career),chunk);assert.deepEqual(replayed,next);assert.equal(next.career.military.service!.returnOffer!.status,'OPEN');assert.equal(next.career.season!.paidUsd,0);
});

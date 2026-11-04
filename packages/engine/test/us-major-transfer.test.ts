import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsMajorFixture,finishControlledMajorSeason} from './us-major-fixture.js';
import {startNextUsMajorSeason,usMajorFreeAgencyPreview,acceptUsMajorFreeAgency} from '../src/us-major-renewal.js';
import {usCareerView} from '../src/us-career-entry.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {canonicalJson} from '../src/game.js';
import type {UsCareer} from '../src/us-career-entry.js';
const funding=(c:UsCareer)=>c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000}));
const close=(c:UsCareer)=>finishControlledMajorSeason(publishUsSeasonSchedule(confirmUsPreseasonPlan(c,c.revision),c.revision+1));

test('controlled six credited seasons compare at most three foreign clubs, sign one and replay historical budgets after JSON and guaranteed renewal',()=>{
 let c=closedUsMajorFixture();for(let i=0;i<6;i++)c=close(startNextUsMajorSeason(c,c.revision,funding(c)));
 for(const y of c.majorYears??[]){delete y.organizationId;delete y.nextOrganizationId;}usCareerView(c);
 const original=c.protagonistOrganizationId,raw=canonicalJson(c),q=usMajorFreeAgencyPreview(c,funding(c));
 assert.equal(q.offers.length,4);assert.equal(q.offers[0]!.organizationId,original);
 const chosen=q.offers[1]!;assert.notEqual(chosen.organizationId,original);
 const next=acceptUsMajorFreeAgency(c,c.revision,funding(c),undefined,chosen.offerKey);
 assert.equal(canonicalJson(c),raw);assert.equal(next.protagonistOrganizationId,chosen.organizationId);assert.equal(next.registration.level,c.registration.level);assert.equal(next.rights.holderOrgId,chosen.organizationId);assert.deepEqual(next.income,c.income);assert.equal(next.records,c.records);
 for(const club of c.inventory.clubs)assert.equal(next.inventory.clubs.find(o=>o.id===club.id)!.availableBudgetUsd,club.availableBudgetUsd+20000000-(club.id===chosen.organizationId?chosen.annualSalaryUsd:0));
 assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));
 assert.throws(()=>acceptUsMajorFreeAgency(c,c.revision,funding(c),undefined,'foreign-key'),/OFFER_NOT_FOUND/);
 assert.throws(()=>acceptUsMajorFreeAgency(c,c.revision-1,funding(c),undefined,chosen.offerKey),/REVISION/);
 const bad=structuredClone(next);bad.majorYears!.at(-1)!.nextOrganizationId=original;assert.throws(()=>usCareerView(bad),/MAJOR/);
 const ended=close(next),continued=startNextUsMajorSeason(ended,ended.revision,funding(next));assert.equal(continued.protagonistOrganizationId,chosen.organizationId);assert.equal(continued.contract.annualSalaryUsd,next.contract.annualSalaryUsd);assert.equal(continued.contract.years,next.contract.years!-1);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(continued))),usCareerView(continued));
 console.log('Controlled FA prefix; real transfer and replay:',JSON.stringify({from:original,to:chosen.organizationId,offers:q.offers.length,salary:next.contract.annualSalaryUsd,years:next.contract.years}));
});

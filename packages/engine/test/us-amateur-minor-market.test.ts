import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason,usYearTransitionReadiness} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {openUsMinorMarket,usMinorMarketView,acceptUsMinorMarketOffer} from '../src/us-minor-market.js';
import {usCareerView} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import type {UsCareer} from '../src/us-career-entry.js';

const digest=(x:unknown)=>createHash('sha256').update(canonicalJson(x)).digest('hex');
const funding=(c:UsCareer)=>c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}));
function closedNext(c:UsCareer){return finishedUsCareerFixture(publishUsSeasonSchedule(confirmUsPreseasonPlan(c,c.revision),c.revision+1));}

test('direct amateur expiry uses native1-year quotes and repeated epochs without rewriting the original six-season contract',()=>{
 // All six regular/PS prefixes are controlled records; signing, funding, renewal and supply commands are real.
 let c=closedUsOptionCareer('HITTER');
 for(let i=1;i<c.contract.controlSeasons;i++)c=closedNext(startNextUsMinorSeason(c,c.revision,funding(c)));
 const original=digest(c),origin=digest(c.amateurHistory),firstContract=c.activation.contractKey,level=c.registration.level,paid=c.income.reduce((n,r)=>n+r.amount,0);
 assert.equal(usYearTransitionReadiness(c).remainingMinorControlSeasons,0);
 const market=openUsMinorMarket(c,c.revision,funding(c)),view=usMinorMarketView(market);
 assert.equal(view.returnHome.route,'AMATEUR_RETURN_PREPARATION');assert.equal(view.returnHome.holderClubId,null);
 assert.ok(view.offers.length>0&&view.offers.length<=4);assert.ok(view.offers.every(o=>o.years===1&&o.annualSalaryUsd===30000&&o.initialLevel===level));
 const own=view.offers.find(o=>o.organizationId===c.protagonistOrganizationId)!;assert.ok(own);
 const before=digest(market),renewed=acceptUsMinorMarketOffer(market,market.revision,own.offerKey),restored=acceptUsMinorMarketOffer(JSON.parse(JSON.stringify(market)) as UsCareer,market.revision,own.offerKey);
 assert.equal(digest(renewed),digest(restored));assert.equal(digest(market),before);assert.equal(digest(c),original);
 assert.equal(renewed.registration.level,level);assert.equal(renewed.activation.contractKey,firstContract);assert.equal(digest(renewed.amateurHistory),origin);
 assert.equal(renewed.income.reduce((n,r)=>n+r.amount,0),paid);assert.equal(renewed.minorYears!.at(-1)!.minorRenewal!.offerKey,own.offerKey);usCareerView(renewed);
 const nextClosed=closedNext(renewed),second=openUsMinorMarket(nextClosed,nextClosed.revision,funding(nextClosed)),other=usMinorMarketView(second).offers.find(o=>o.organizationId!==second.protagonistOrganizationId);
 assert.ok(other,'funded low-level competitors must provide this controlled high-skill positive branch');
 const priorClub=second.world.organizations.find(o=>o.id===second.protagonistOrganizationId)!,priorRelations=second.relationships.relations.filter(r=>['FORMED','REUNITED_TEAM'].includes(r.stage)&&priorClub.levels[level].includes(r.otherPlayerKey));assert.ok(priorRelations.length);const moved=acceptUsMinorMarketOffer(second,second.revision,other.offerKey);for(const r of priorRelations){const actual=moved.relationships.relations.find(x=>x.relationKey===r.relationKey)!;assert.equal(actual.stage,'SEPARATED');assert.deepEqual(actual.milestones.slice(0,-1),r.milestones);}
 assert.equal(moved.rights.holderOrgId,other.organizationId);assert.equal(moved.protagonistOrganizationId,other.organizationId);assert.equal(moved.registration.level,level);assert.equal(moved.activation.contractKey,firstContract);assert.equal(digest(moved.amateurHistory),origin);usCareerView(moved);
 assert.equal(new Set(moved.minorYears!.flatMap(y=>y.minorRenewal?[y.minorRenewal.contract.contractKey]:[])).size,2);
 assert.throws(()=>acceptUsMinorMarketOffer(second,second.revision-1,other.offerKey),/REVISION/);
 const forged=structuredClone(moved);forged.minorRenewal!.contract.years=6;assert.throws(()=>usCareerView(forged),/RENEWAL|HISTORY/);
});

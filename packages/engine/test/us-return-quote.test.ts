import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {quoteUsMinorContractOffers} from '../src/us-minor-market.js';
import {registerQuotedUsReturn} from '../src/us-return-us-market.js';
import {assertActiveUsRosterWorld} from '../src/us-career-entry.js';
import {ABILITY_MAX_UNITS,UNITS_PER_POINT} from '@playball/rules';
import {canonicalJson} from '../src/game.js';

test('real return clauses preserve their identity and terms, while current budget and a legal competitor still gate quotes',()=>{
 const c=closedUsOptionCareer('HITTER'),key=c.protagonistKey,p=c.world.players[key]!;
 const future=structuredClone(c.inventory);for(const club of future.clubs)club.availableBudgetUsd=100000;
 p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,ABILITY_MAX_UNITS]));
 const initial=quoteUsMinorContractOffers(c,'initial',future),old=initial.offers.find(o=>o.organizationId!==c.protagonistOrganizationId)!;
 assert.ok(old);old.militaryReturnOption=true;old.nationalReleaseAllowed=true;
 p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,10*UNITS_PER_POINT]));
 const source=canonicalJson(c),cash=canonicalJson(future),sealed=canonicalJson(old);
 assert.ok(!quoteUsMinorContractOffers(c,'later',future).offers.some(o=>o.organizationId===old.organizationId));
 const later=quoteUsMinorContractOffers(c,'later',future,c.world.seasonKey,[old]);
 const retained=later.offers.find(o=>o.organizationId===old.organizationId)!;
 assert.ok(retained);assert.equal(retained.offerKey,old.offerKey);assert.equal(retained.militaryReturnOption,true);assert.equal(retained.nationalReleaseAllowed,true);
 assert.equal(retained.initialLevel,c.registration.level);assert.equal(retained.annualSalaryUsd,30000);assert.equal(later.offers.length<=4,true);
 assert.equal(canonicalJson(c),source);assert.equal(canonicalJson(future),cash);assert.equal(canonicalJson(old),sealed);
 const poor=structuredClone(future);poor.clubs.find(o=>o.id===old.organizationId)!.availableBudgetUsd=29999;
 assert.ok(!quoteUsMinorContractOffers(c,'later',poor,c.world.seasonKey,[old]).offers.some(o=>o.organizationId===old.organizationId));
 const org=c.world.organizations.find(o=>o.id===old.organizationId)!;
 for(const npc of org.levels[c.registration.level])c.health.injuries[npc]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'controlled-health-quote',seasonKey:c.world.seasonKey};
 assert.ok(!quoteUsMinorContractOffers(c,'later',future,c.world.seasonKey,[old]).offers.some(o=>o.organizationId===old.organizationId));
});

test('quoted US registration uses the native vacancy writer or the exact service-reserve competitor',()=>{
 const c=closedUsOptionCareer('HITTER'),funded=structuredClone(c.inventory);for(const club of funded.clubs)club.availableBudgetUsd=100000;
 const offer=quoteUsMinorContractOffers(c,'registration',funded).offers.find(o=>o.organizationId!==c.protagonistOrganizationId)!;assert.ok(offer?.competitorKey);
 const original=canonicalJson(c.world),active=structuredClone(c.world),displaced=registerQuotedUsReturn(active,c.protagonistKey,c.protagonistOrganizationId,offer);
 assert.equal(displaced,offer.competitorKey);assert.ok(active.reserves![offer.organizationId]!.includes(displaced!));assertActiveUsRosterWorld(active);assert.equal(canonicalJson(c.world),original);
 const reserve=structuredClone(c.world),from=reserve.organizations.find(o=>o.id===c.protagonistOrganizationId)!;
 from.levels[c.registration.level]=from.levels[c.registration.level].filter(k=>k!==c.protagonistKey);reserve.reserves={...reserve.reserves,[from.id]:[...(reserve.reserves?.[from.id]??[]),c.protagonistKey]};assertActiveUsRosterWorld(reserve);
 registerQuotedUsReturn(reserve,c.protagonistKey,from.id,offer);
 assert.ok(!reserve.reserves[from.id]!.includes(c.protagonistKey));assert.ok(reserve.reserves[offer.organizationId]!.includes(offer.competitorKey!));assertActiveUsRosterWorld(reserve);
 const wrong={...offer,competitorKey:'missing'};assert.throws(()=>registerQuotedUsReturn(structuredClone(c.world),c.protagonistKey,from.id,wrong),/COMPETITOR_CHANGED/);
});

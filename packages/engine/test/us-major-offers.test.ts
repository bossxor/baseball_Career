import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedUsCareer} from './us-fixtures.js';
import {quoteUsMajorOffers} from '../src/us-major-offers.js';
import {startUsRegularSeason} from '../src/us-season.js';

test('pure controlled offer projection uses demand, 40 protection and actual funded budgets without RNG',()=>{
 const prepared=preparedUsCareer(),c=startUsRegularSeason(prepared,prepared.revision),p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,1000000]));
 const funding=c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000})),rng=structuredClone(c.world.rng),quoted=quoteUsMajorOffers(c,funding,800000,5);
 assert.equal(quoted.length,4);assert.equal(quoted[0]!.organizationId,c.protagonistOrganizationId);assert.deepEqual(quoteUsMajorOffers(c,funding,800000,5),quoted);assert.deepEqual(c.world.rng,rng);
 assert.equal(quoteUsMajorOffers(c,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:0})),50000000,5).length,0);
 const foreign=quoted[1]!,club=c.world.organizations.find(o=>o.id===foreign.organizationId)!;
 c.season!.protectedRoster![club.id]=[...club.levels.MLB,...club.levels.AAA.slice(0,14)];assert.equal(c.season!.protectedRoster![club.id]!.length,40);
 assert.ok(!quoteUsMajorOffers(c,funding,800000,5).some(o=>o.organizationId===club.id));
 c.season!.protectedRoster![club.id]=[...club.levels.MLB];
 const before=quoteUsMajorOffers(c,funding,800000,5);p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,10000]));const low=quoteUsMajorOffers(c,funding,800000,5);assert.equal(low.length,1);assert.ok(before.length>low.length);
});

// Written operating-flow and ledger checks; no club creation, market or games.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),json=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const flow=json('club-first-season-flow.json'),screens=json('screen-state-catalog.json').screens;
assert.equal(flow.status,'DESIGN_ONLY');assert.equal(flow.executionStatus,'NOT_EXECUTED');assert.ok(fs.existsSync(path.join(root,flow.source)));
assert.equal(flow.steps.length,16);assert.equal(new Set(flow.steps.map(s=>s.id)).size,16);
for(const row of flow.steps){assert.ok(row.screenIds.length>0);for(const id of row.screenIds)assert.ok(screens.some(s=>s.id===id));assert.equal(row.executionStatus,'NOT_EXECUTED');assert.ok(row.read&&row.actionAndGuard);}
assert.equal(flow.recoveryCases.length,7);for(const row of flow.recoveryCases){assert.ok(screens.some(s=>s.id===row.screenId));assert.equal(row.executionStatus,'NOT_EXECUTED');}
const plain=flow.starts.find(s=>s.id==='NO_IMPORT'),copy=flow.starts.find(s=>s.id==='WITH_IMPORT'),cheat=flow.starts.find(s=>s.id==='CLUB_CHEAT');
assert.equal(plain.requiresCareer,false);assert.equal(plain.importCount,0);assert.equal(plain.contractedPlayers,50);assert.equal(copy.contractedPlayers,50);assert.equal(copy.firstTeam,28);
assert.deepEqual(copy.abilities,copy.peaks.map(n=>n/2));assert.equal((copy.abilities.reduce((a,b)=>a+b,0)/6).toFixed(1),copy.displayOverall);assert.equal(copy.copyAge,19);assert.equal(copy.originalUnchanged,true);assert.equal(copy.militaryReset,true);assert.equal(copy.recordCount,0);
assert.equal(cheat.initialAbilityBoost,0);assert.equal(cheat.allOwnedPotential,100);assert.equal(cheat.positiveGrowthMultiplier,3);assert.equal(cheat.pitchXpMultiplier,3);assert.equal(cheat.monthlySearchLimit,2);assert.equal(cheat.illegalAcquisitionAllowed,false);
const c=flow.chain,b=c.sourceSnapshot;
const available=x=>x.budget+x.postingIncome+x.supportGrant-x.paidSalary-x.reservedSalary-x.guaranteedReleaseCost-x.reservedOffers-x.protectedMinimum-x.paidOperations-x.reservedOperations;
assert.equal(available(b),c.stages[0].available);assert.equal(available(b)-c.searchCost,c.stages[1].available);
const search={...b,paidOperations:b.paidOperations+c.searchCost};const offer={...search,reservedOffers:search.reservedOffers+c.newOfferReserve};assert.equal(available(offer),c.stages[2].available);
const accepted={...offer,reservedOffers:offer.reservedOffers-c.newOfferReserve,reservedSalary:offer.reservedSalary+c.newOfferReserve};assert.equal(available(accepted),c.successAvailable);
const rejected={...offer,reservedOffers:offer.reservedOffers-c.newOfferReserve};assert.equal(available(rejected),c.rejectAvailable);assert.equal(c.branchesExclusive,true);assert.equal(c.successMeansFirstTeamRegistration,false);
const s=flow.search;assert.ok(Math.abs(.35+.08*s.L+.20*Math.min(s.N,20)/20-.08*s.q-s.p)<1e-12);assert.equal(s.monthBefore-1,s.monthAfter);assert.equal(s.unavailableCost,0);assert.equal(flow.offer.roundAcceptanceProbability,.5);assert.equal(flow.offer.discoveryGuaranteesAcquisition,false);
console.log('PASS: club first-season 16 stages / 7 recovery cases / 3 starts, source screen links, half-peak import and finite chained search-offer ledger. Runtime remains NOT_EXECUTED.');

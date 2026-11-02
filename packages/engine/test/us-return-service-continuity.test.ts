import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {closeControlledServiceDates} from './us-service-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,settleUsAmateurReturnYear,resignUsAfterAmateurReturn} from '../src/us-amateur-return-career.js';
import {retireAndSupplyUsNpcs} from '../src/us-supply.js';
import {canonicalJson} from '../src/game.js';
import {usCareerView} from '../src/us-career-entry.js';
import {prepareUsRosters} from '../src/us-roster-repair.js';
import {closeSeasonHealth} from '../src/health.js';

test('controlled service dates: return re-sign preserves actual settled NPC growth, supply RNG and records',()=>{
 let source=closedUsOptionCareer('HITTER');
 for(let i=1;i<source.contract.controlSeasons;i++){
  source=startNextUsMinorSeason(source,source.revision,source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));
  source=finishedUsCareerFixture(publishUsSeasonSchedule(confirmUsPreseasonPlan(source,source.revision),source.revision+1));
 }
 source=openUsMinorMarket(source,source.revision,source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));
 const offer=source.minorMarket!.offers.find(o=>o.militaryReturnOption&&o.organizationId!==source.protagonistOrganizationId)!;
 assert.ok(offer);
 let c=requestUsAmateurReturn(source,source.revision);
 // Only scheduled contribution rows are controlled. All service dates, blocks, annual growth and return receipts use actual owners.
 for(let year=0;year<2;year++){
  c=startUsAmateurReturnYear(c,c.revision,1);
  c={...c,revision:c.revision+1,service:closeControlledServiceDates(c.service!,c.service!.season!.lastDay)};
  c=settleUsAmateurReturnYear(c,c.revision);
 }
 assert.equal(c.return.militaryStatus,'COMPLETED');
 const before=canonicalJson(c),service=c.service!,expected=structuredClone(service.world),target=String(Number(expected.seasonKey)+1);
 const surviving=Object.keys(expected.players).filter(k=>k!==source.protagonistKey&&expected.players[k]!.age<45);
 retireAndSupplyUsNpcs(expected,Object.keys(expected.players).filter(k=>k!==source.protagonistKey&&expected.players[k]!.age===45),target,source.protagonistKey);
 const resumed=resignUsAfterAmateurReturn(c,c.revision,offer.offerKey);
 assert.equal(resumed.world.seasonKey,target);
 assert.deepEqual(Object.keys(resumed.world.players).sort(),Object.keys(expected.players).sort());
 for(const org of expected.organizations)if(org.id!==offer.organizationId)assert.deepEqual(resumed.world.organizations.find(o=>o.id===org.id)!.levels,org.levels);
 assert.equal(resumed.world.organizations.filter(o=>Object.values(o.levels).some(roster=>roster.includes(source.protagonistKey))).length,1);
 for(const key of surviving){
  assert.deepEqual(resumed.world.players[key]!.abilities,service.world.players[key]!.abilities,'completed service NPC growth must remain authoritative');
  assert.deepEqual(resumed.world.players[key]!.careerPeaks,service.world.players[key]!.careerPeaks);
  assert.equal(resumed.world.players[key]!.age,service.world.players[key]!.age+1);
 }
 assert.equal(canonicalJson(resumed.world.rng),canonicalJson(expected.rng));
 for(const [key,book] of Object.entries(expected.repertoires))if(key!==source.protagonistKey){
  assert.deepEqual(resumed.world.repertoires[key]!.book,book.book);
  assert.deepEqual(resumed.world.repertoires[key]!.weights,book.weights);
 }
 assert.equal(canonicalJson(resumed.records),canonicalJson(service.records));
 assert.equal(canonicalJson(resumed.income),canonicalJson(service.income));
 assert.equal(canonicalJson(resumed.usAmateurReturnHistory),before);
 assert.equal(resumed.inventory.seasonKey,target);
 assert.equal(resumed.inventory.clubs.find(o=>o.id===offer.organizationId)!.availableBudgetUsd,service.inventory.clubs.find(o=>o.id===offer.organizationId)!.availableBudgetUsd+source.minorMarket!.funding.find(f=>f.organizationId===offer.organizationId)!.addedBudgetUsd-30_000);
 assert.equal(canonicalJson(c),before);
 assert.doesNotThrow(()=>usCareerView(JSON.parse(JSON.stringify(resumed))));
 assert.equal(Object.hasOwn(usCareerView(resumed),'usAmateurReturnHistory'),false);
 const planned=confirmUsPreseasonPlan(resumed,resumed.revision);
 const scheduled=publishUsSeasonSchedule(planned,planned.revision),live=startUsRegularSeason(scheduled,scheduled.revision),day=advanceUsCareer(live,live.revision,1);
 assert.notEqual(day.stopReason,'ENGINE_LIMIT');assert.ok(day.career.records.revision>live.records.revision);
 // Controlled late-year diagnoses exercise native emergency registration and annual health closure, not native injury draws.
 const emergency=structuredClone(c),owner=emergency.service!,org=owner.world.organizations.find(o=>o.id!==offer.organizationId&&o.id!==source.protagonistOrganizationId)!;
 owner.health.closedSeasons=owner.health.closedSeasons.filter(k=>k!==owner.world.seasonKey);
 for(const level of ['ROOKIE','A','AA','AAA','MLB'] as const){
  const roster=org.levels[level].filter(k=>owner.world.players[k]!.kind==='HITTER'),game=Object.values(owner.records.games).findLast(g=>g.scope.seasonKey===owner.world.seasonKey&&g.scope.leagueKey===level&&Object.hasOwn(g.teams,org.id))!;assert.ok(game);
  owner.health.games=[...owner.health.games,{evidence:{gameKey:game.gameKey,teamKey:level+':'+org.id,seasonKey:owner.world.seasonKey,day:game.worldDay,roster:[...roster],appearances:[]},result:{injured:[...roster],recovered:[]}}];
  for(const key of roster)owner.health.injuries[key]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:game.gameKey,seasonKey:owner.world.seasonKey};
 }
 prepareUsRosters(owner,owner.season!.lastDay);
 const substitutions=Object.entries(owner.season!.emergency!.entries).filter(([,e])=>e.clubId===org.id&&e.releasedDay===null);assert.ok(substitutions.length);
 owner.health=closeSeasonHealth(owner.health,owner.world.seasonKey).ledger;
 const emergencyBefore=canonicalJson(emergency),restored=resignUsAfterAmateurReturn(emergency,emergency.revision,offer.offerKey),restoredOrg=restored.world.organizations.find(o=>o.id===org.id)!;
 const survivingSubstitutions=substitutions.filter(([,entry])=>owner.world.players[entry.replacedKey]!.age<45);assert.ok(survivingSubstitutions.length);
 for(const [replacement,entry] of survivingSubstitutions){
  assert.ok(restoredOrg.levels[entry.level].includes(entry.replacedKey),'annual service handoff must restore the original registration');
  assert.ok(restored.world.reserves![org.id]!.includes(replacement));
 }
 assert.equal(canonicalJson(restored.health),canonicalJson(owner.health));assert.equal(restored.season,undefined);assert.equal(canonicalJson(emergency),emergencyBefore);
});

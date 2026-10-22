import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods,finalizeSeasonGrowth} from '../src/growth-ledger.js';
import {openKboMilitaryPlan,resolveKboMilitaryPlan,kboMilitaryPlanEventView} from '../src/kbo-military-planning.js';
import {kboMilitaryPlan,kboMilitaryStatus} from '../src/kbo-military-state.js';
import {kboYearTransitionReadiness,startNextKboSeason} from '../src/kbo-year-transition.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {confirmKboActiveService} from '../src/kbo-active-service.js';
import {retireKboAtMaxAge} from '../src/kbo-retirement.js';
import {canonicalJson} from '../src/game.js';

/** Controlled closed-season flags isolate planning/deadline decisions. No season simulation claimed. */
function reviewed(age:number):KboCareer {
 const c=enteredKboCareer(),key=c.protagonistKey,season=c.world.seasonKey,W=c.world.calendar.growthDays.length,p={...c.world.players[key]!,age};
 const ledger=createSeasonGrowthLedger(p,season,W),growth=settleClosedGrowthPeriods(p,ledger,[{periodKey:JSON.stringify(['pro-growth',c.world.worldKey,season,0,W]),focus:p.focus,archetype:p.archetype,period:{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:0,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:true}}}]),end=finalizeSeasonGrowth(growth.player,growth.ledger,W);
 c.world.players[key]=end.player;c.seasonGrowth=end.ledger;c.phaseContext={phase:'SEASON_REVIEW'};c.revision++;
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:season,days:[{day:c.world.calendar.growthDays.at(-1)!+10,evidence:'controlled-offseason',result:{injured:[],recovered:[]}}]};
 c.seasonClose={receiptKey:'controlled-close-'+season,seasonKey:season,sourceRevision:c.revision,agingLossUnits:end.lossUnits,trainingForfeited:true};c.development.trainingUsedSeasons=[...c.development.trainingUsedSeasons,season];
 c.postseason={schemaVersion:1,seasonKey:season,seeds:c.world.clubs.slice(0,5).map(x=>x.id),series:[],championKey:c.world.clubs[0]!.id};return c;
}
function renewal(c:KboCareer){const o=offerKboRenewal(c,c.revision);return acceptKboRenewal(o,o.revision,{eventKey:o.renewal!.eventKey,eventVersion:o.events.find(e=>e.eventKey===o.renewal!.eventKey)!.version});}
function choose(c:KboCareer,command:string){const e=kboMilitaryPlanEventView(c)[0]!;return resolveKboMilitaryPlan(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command});}

test('global age28 guard covers legacy careers without a military record and preserves source until explicit enlistment',()=>{
 for(const age of [27,28,31]){const c=renewal(reviewed(age)),before=canonicalJson(c);assert.equal(c.military,undefined);assert.ok(kboYearTransitionReadiness(c).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.throws(()=>startNextKboSeason(c,c.revision),/YEAR_TRANSITION_NOT_READY/);assert.equal(canonicalJson(c),before);
  const e=confirmKboActiveService(c,c.revision);assert.equal(e.schemaVersion,3);assert.ok(!kboYearTransitionReadiness(e).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.equal(canonicalJson(c),before);
 }
 const young=renewal(reviewed(26));assert.ok(!kboYearTransitionReadiness(young).blockers.includes('MILITARY_PLAN_REQUIRED'));
});
test('E49 opens once, defers only within the deadline and START_SERVICE only navigates to review',()=>{
 const c=reviewed(25),before=canonicalJson(c),o=openKboMilitaryPlan(c,c.revision),view=kboMilitaryPlanEventView(o)[0]!;
 assert.equal(view.definitionId,'E49');assert.equal(o.schemaVersion,3);assert.equal(canonicalJson(c),before);assert.deepEqual(openKboMilitaryPlan(o,o.revision),o);assert.doesNotMatch(JSON.stringify(view),/potential|rng|seed|programId|ledger/);
 const deferred=choose(o,'DEFER_SERVICE').career;assert.equal(kboMilitaryStatus(deferred),'UNRESOLVED');assert.equal(deferred.military?.program,undefined);assert.equal(kboMilitaryPlanEventView(deferred).length,0);assert.deepEqual(openKboMilitaryPlan(deferred,deferred.revision),deferred);
 const review=choose(o,'START_SERVICE');assert.equal(review.navigation!.targetScreen,'S26');assert.equal(kboMilitaryStatus(review.career),'UNRESOLVED');assert.equal(review.career.military?.program,undefined);assert.deepEqual(review.career.world,o.world);
});
test('E54 forbids indefinite defer and overdue Sangmu application, with stale/forged requests rejected atomically',()=>{
 for(const age of [27,28]){const base=reviewed(age),o=openKboMilitaryPlan(base,base.revision),view=kboMilitaryPlanEventView(o)[0]!,before=canonicalJson(o);assert.equal(view.definitionId,'E54');assert.ok(!view.choices.some(c=>c.command==='DEFER_SERVICE'));assert.throws(()=>choose(o,'DEFER_SERVICE'));assert.equal(canonicalJson(o),before);
  const review=choose(o,'START_SERVICE');assert.equal(review.navigation!.targetScreen,'S26');assert.ok(kboYearTransitionReadiness(review.career).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.equal(review.career.military?.program,undefined);
  if(age===28){assert.equal(view.choices.find(c=>c.command==='APPLY_MILITARY_TEAM')!.available,false);assert.throws(()=>choose(o,'APPLY_MILITARY_TEAM'));}
  assert.throws(()=>resolveKboMilitaryPlan(o,o.revision,{eventKey:view.eventKey,eventVersion:view.eventVersion+1,command:'START_SERVICE'}));assert.throws(()=>resolveKboMilitaryPlan(o,o.revision-1,{eventKey:view.eventKey,eventVersion:view.eventVersion,command:'START_SERVICE'}));assert.equal(canonicalJson(o),before);
 }
});
test('E49 application closes the planning task and creates one fixed E50 result; injury leaves original plan untouched',()=>{
 const base=reviewed(24),o=openKboMilitaryPlan(base,base.revision),before=canonicalJson(o),out=choose(o,'APPLY_MILITARY_TEAM').career;
 assert.equal(out.military!.status,'APPLICATION_PENDING');assert.equal(out.military!.applications.length,1);assert.ok(out.events.some(e=>e.definitionId==='E50'&&e.status==='OPEN'));assert.equal(kboMilitaryPlanEventView(out).length,0);assert.equal(canonicalJson(o),before);assert.equal(out.revision,o.revision+1);
 const injured=structuredClone(o);injured.health.injuries[injured.protagonistKey]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-injury',seasonKey:injured.world.seasonKey};const snapshot=canonicalJson(injured);assert.equal(kboMilitaryPlanEventView(injured)[0]!.choices.find(c=>c.command==='APPLY_MILITARY_TEAM')!.reason,'INJURED');assert.throws(()=>choose(injured,'APPLY_MILITARY_TEAM'));assert.equal(canonicalJson(injured),snapshot);
});
test('25/26 reminders expose future grace seasons; max-age retirement remains possible without faking military completion',()=>{
 for(const [age,left] of [[25,2],[26,1],[27,0]] as const){const c=reviewed(age),before=canonicalJson(c),p=kboMilitaryPlan(c);assert.equal(p.futureGraceSeasons,left);assert.equal(p.notice,age===27?'FINAL_GRACE':'PLAN_REMINDER');assert.equal(canonicalJson(c),before);}
 const old=reviewed(45);assert.equal(kboMilitaryPlan(old).mustResolveBeforeNextSeason,false);assert.ok(kboYearTransitionReadiness(old).blockers.includes('MAX_AGE_REACHED'));assert.throws(()=>openKboMilitaryPlan(old,old.revision));const archived=retireKboAtMaxAge(old,old.revision);assert.equal(archived.phaseContext.phase,'ARCHIVED');assert.equal(kboMilitaryStatus(archived),'UNRESOLVED');
});

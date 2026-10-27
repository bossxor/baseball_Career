import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsMajorFixture} from './us-major-fixture.js';
import {canonicalJson} from '../src/game.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {usMilitaryPlanPreview,chooseUsMilitaryPlan,completeUsMilitaryService,settleUsMilitaryServiceBlock,usMilitaryCompletionDays} from '../src/us-military-plan.js';
import {usYearTransitionReadiness} from '../src/us-year-transition.js';
import type {UsCareer} from '../src/us-career-entry.js';

/** Advances sealed calendar identity only; not a substitute for native year-transition play. */
function atServiceSeason(c:UsCareer,seasonKey:string):UsCareer {
 const next=structuredClone(c),calendar=createSeasonCalendar(Number(seasonKey));
 next.world={...next.world,seasonKey,calendar};next.registration={...next.registration,seasonKey};next.contract={...next.contract,seasonKey};
 for(const key of Object.keys(next.world.repertoires))next.world.repertoires[key]={...next.world.repertoires[key]!,seasonId:seasonKey};
 next.phaseContext={phase:'SEASON_REVIEW'};return next;
}

test('deadline military plan terminates without return option and clears the year blocker only after both 18-month blocks',()=>{
 const c=closedUsMajorFixture();c.world.players[c.protagonistKey]!.age=27;c.military={status:'UNRESOLVED',deadlineAge:28};c.contract.militaryReturnOption=false;
 assert.ok(usYearTransitionReadiness(c).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.deepEqual(usMilitaryPlanPreview(c).choices,['TERMINATE']);
 assert.throws(()=>chooseUsMilitaryPlan(c,c.revision,'FREEZE'),/REFUSED|UNAVAILABLE/);
 const raw=canonicalJson(c),ended=chooseUsMilitaryPlan(c,c.revision,'TERMINATE');assert.equal(canonicalJson(c),raw);assert.equal(ended.military.status,'TERMINATED_SERVICE');assert.equal(ended.registration.status,'INJURED');
 assert.ok((ended.world.reserves?.[ended.protagonistOrganizationId]??[]).includes(ended.protagonistKey));
 assert.ok(ended.military.service);assert.equal(ended.military.service!.scheduledBlocks,2);assert.equal(ended.military.service!.completedBlocks,0);
 assert.throws(()=>completeUsMilitaryService(ended,ended.revision),/INCOMPLETE/);
 const days=usMilitaryCompletionDays(ended.military.planSeasonKey!);
 const firstReady=atServiceSeason(ended,days[0]!.seasonKey),block1=settleUsMilitaryServiceBlock(firstReady,firstReady.revision);
 assert.equal(block1.military.service!.completedBlocks,1);assert.throws(()=>completeUsMilitaryService(block1,block1.revision),/INCOMPLETE/);
 const secondReady=atServiceSeason(block1,days[1]!.seasonKey),block2=settleUsMilitaryServiceBlock(secondReady,secondReady.revision);
 assert.equal(block2.military.service!.completedBlocks,2);
 const done=completeUsMilitaryService(block2,block2.revision);assert.equal(done.military.status,'COMPLETED');
 assert.deepEqual(done.military.service!.completionDays,days);
 // Blocker only fires for UNRESOLVED; restore plan-season identity to re-check readiness view.
 const view=structuredClone(ended);view.revision=done.revision;view.military=done.military;
 assert.ok(!usYearTransitionReadiness(view).blockers.includes('MILITARY_PLAN_REQUIRED'));
});

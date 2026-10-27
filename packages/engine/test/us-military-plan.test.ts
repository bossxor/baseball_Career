import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsMajorFixture} from './us-major-fixture.js';
import {canonicalJson} from '../src/game.js';
import {usMilitaryPlanPreview,chooseUsMilitaryPlan,completeUsMilitaryService} from '../src/us-military-plan.js';
import {usYearTransitionReadiness} from '../src/us-year-transition.js';

test('deadline military plan terminates without return option and clears the year blocker after completion',()=>{
 const c=closedUsMajorFixture();c.world.players[c.protagonistKey]!.age=27;c.military={status:'UNRESOLVED',deadlineAge:28};c.contract.militaryReturnOption=false;
 assert.ok(usYearTransitionReadiness(c).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.deepEqual(usMilitaryPlanPreview(c).choices,['TERMINATE']);
 assert.throws(()=>chooseUsMilitaryPlan(c,c.revision,'FREEZE'),/REFUSED|UNAVAILABLE/);
 const raw=canonicalJson(c),ended=chooseUsMilitaryPlan(c,c.revision,'TERMINATE');assert.equal(canonicalJson(c),raw);assert.equal(ended.military.status,'TERMINATED_SERVICE');assert.equal(ended.registration.status,'INJURED');
 assert.ok((ended.world.reserves?.[ended.protagonistOrganizationId]??[]).includes(ended.protagonistKey));
 const done=completeUsMilitaryService(ended,ended.revision);assert.equal(done.military.status,'COMPLETED');assert.ok(!usYearTransitionReadiness(done).blockers.includes('MILITARY_PLAN_REQUIRED'));
});

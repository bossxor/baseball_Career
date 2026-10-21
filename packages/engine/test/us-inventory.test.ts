import test from 'node:test';
import assert from 'node:assert/strict';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {canonicalJson} from '../src/game.js';
const orgs=()=>Array.from({length:30},(_,i)=>({id:'US'+i,name:'가상 조직'+i}));
const allocation=()=>orgs().map(o=>({organizationId:o.id,rookieCapacity:24,aCapacity:24,availableBudgetUsd:5_000_000,nationalReleaseAllowed:true,militaryReturnOption:false}));
test('full generated US roster feeds actual vacancy/budget-bound career offers and one signing reservation',()=>{
 const s=completedHighSchoolCareer(800_000),review=acknowledgeHighSchoolSeasonReview(s,s.revision),career=openHighSchoolCareerRoute(review,review.revision,1).career;
 const world=createUsRosterWorld({worldKey:career.world.worldKey,seasonKey:'2030',seed:career.world.seed,difficulty:career.difficulty,organizations:orgs()}),before=canonicalJson(world),inventory=initialUsRecruitmentInventory(world,allocation());assert.equal(inventory.registeredPlayerKeys.length,3420);assert.ok(inventory.clubs.every(c=>c.aSlots===2 && c.rookieSlots===2));
 const offered=prepareCareerUsDirect(career,career.revision,inventory),view=careerUsDirectView(offered);assert.ok(view.visible);assert.equal(view.offers.length,3);
 const signed=decideCareerUsDirect(offered,offered.revision,{programVersion:1,decision:{type:'SIGN',offerKey:view.offers[0]!.offerKey},eventVersion:1}),reserved=signed.usRecruitment!.reservations;
 assert.equal(reserved.currentWorld.registeredPlayerKeys.length,3421);assert.equal(reserved.entries.length,1);assert.equal(reserved.currentWorld.clubs.reduce((n,c)=>n+c.rookieSlots+c.aSlots,0),119);assert.equal(canonicalJson(world),before);assert.deepEqual(signed.records,career.records);assert.equal(signed.world.players.own!.age,18);
});
test('US allocation forbids invented organizations, negative/combined over160 vacancies and unknown budget',()=>{
 const world=createUsRosterWorld({worldKey:'us',seasonKey:'2030',seed:'inventory-seed',difficulty:'GROWTH',organizations:orgs()});
 assert.throws(()=>initialUsRecruitmentInventory(world,allocation().slice(1)));const unknown=allocation();unknown[0]!.organizationId='unknown';assert.throws(()=>initialUsRecruitmentInventory(world,unknown));const oversized=allocation();oversized[0]!.rookieCapacity=50;oversized[0]!.aCapacity=50;assert.throws(()=>initialUsRecruitmentInventory(world,oversized),/CAPACITY/);const small=allocation();small[0]!.aCapacity=21;assert.throws(()=>initialUsRecruitmentInventory(world,small));const budget=allocation();budget[0]!.availableBudgetUsd=NaN;assert.throws(()=>initialUsRecruitmentInventory(world,budget));
});

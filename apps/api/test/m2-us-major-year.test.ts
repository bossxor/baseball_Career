import test from 'node:test';
import assert from 'node:assert/strict';
import type {UsCareer} from '@playball/engine';
import {startNextUsMajorSeason,openUsAgentSalaryOffer,hireCareerAgent,careerSalaryCounterPreview,requestCareerSalaryCounter,seedPcg32} from '@playball/engine';
import {closedUsMajorFixture,finishControlledMajorSeason} from '../../../packages/engine/test/us-major-fixture.js';
import {confirmUsPreseasonPlan} from '../../../packages/engine/src/us-preseason.js';
import {publishUsSeasonSchedule} from '../../../packages/engine/src/us-schedule.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {usPlayScreen} from '../src/career-us-play-shell.js';

const dispatch=(c:UsCareer,type:string,extra:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:type+c.revision,expectedRevision:0,type:'CAREER_US_PLAY_'+type,payload:{careerRevision:c.revision,...extra}});
test('major API rejects caller financial terms and preserves an unfunded owner',()=>{
 for(const field of ['funding','annualSalaryUsd','years','inventory'])assert.throws(()=>applyEngineCommand({schemaVersion:1},{commandId:field,expectedRevision:0,type:'CAREER_US_PLAY_NEXT_MAJOR_YEAR',payload:{careerRevision:1,[field]:1}}),/INVALID_PAYLOAD/);
 const c=closedUsMajorFixture(),view=usPlayScreen({schemaVersion:1,career:c}) as {majorContract:{kind:string;funded:boolean;annualSalaryUsd:number}};
 assert.equal(view.majorContract.kind,'RENEWAL');assert.equal(view.majorContract.funded,false);assert.ok(view.majorContract.annualSalaryUsd>=800000);
 assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
 const cash=c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd,revision=c.revision;
 assert.throws(()=>dispatch(c,'NEXT_MAJOR_YEAR'),/CONTRACT_BUDGET/);assert.equal(c.revision,revision);assert.equal(c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd,cash);
 assert.throws(()=>dispatch(c,'NEXT_MAJOR_YEAR',{counterOfferKey:'foreign'}),/INVALID_AGENT_US_OFFER/);
});

test('major API reuses an existing server-owned agent funding quote without accepting new client money',()=>{
 const source=closedUsMajorFixture(),funding=source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000})),quoted=openUsAgentSalaryOffer(source,source.revision,funding);
 const before=quoted.inventory.clubs.find(o=>o.id===quoted.protagonistOrganizationId)!.availableBudgetUsd,view=usPlayScreen({schemaVersion:1,career:quoted}) as {majorContract:{funded:boolean;annualSalaryUsd:number}};assert.equal(view.majorContract.funded,true);
 const next=dispatch(quoted,'NEXT_MAJOR_YEAR').nextState.career as UsCareer;
 assert.equal(next.inventory.clubs.find(o=>o.id===next.protagonistOrganizationId)!.availableBudgetUsd,before+20000000-view.majorContract.annualSalaryUsd);assert.deepEqual(next.majorYears!.at(-1)!.funding,quoted.agents!.usSalaryOffers![0]!.funding);assert.deepEqual(next.income,quoted.income);
});

test('accepted owned USD counteroffer is displayed and signed at the same price through the API',()=>{
 const source=closedUsMajorFixture(),funding=source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000}));
 let c=openUsAgentSalaryOffer(source,source.revision,funding);c=hireCareerAgent(c,c.revision,'AG03');const q=careerSalaryCounterPreview(c);
 // Controlled agent draw exercises the existing accepted writer; world/game RNG is untouched.
 c.agents!.negotiationRng=seedPcg32(42n,54n);c=requestCareerSalaryCounter(c,c.revision,{previewId:q.previewId,raiseBps:1000});const accepted=c.agents!.salaryRequests.at(-1)!;assert.equal(accepted.outcome,'ACCEPTED');
 const view=usPlayScreen({schemaVersion:1,career:c}) as {majorContract:{annualSalaryUsd:number;counterOfferKey:string}};
 assert.equal(view.majorContract.annualSalaryUsd,accepted.annualSalary);assert.equal(view.majorContract.counterOfferKey,accepted.counterOfferKey);
 assert.throws(()=>dispatch(c,'NEXT_MAJOR_YEAR'),/BASE_OFFER_SUPERSEDED/);
 const next=dispatch(c,'NEXT_MAJOR_YEAR',{counterOfferKey:view.majorContract.counterOfferKey}).nextState.career as UsCareer;assert.equal(next.contract.annualSalaryUsd,view.majorContract.annualSalaryUsd);assert.deepEqual(next.income,c.income);
});
test('major annual API uses previously booked native funding, reserves once and preserves JSON and historical income',()=>{
 // Controlled regular/PS contribution prefix with an actual previous annual funding/contract receipt.
 const first=closedUsMajorFixture(),funded=startNextUsMajorSeason(first,first.revision,first.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000})));
 const closed=finishControlledMajorSeason(publishUsSeasonSchedule(confirmUsPreseasonPlan(funded,funded.revision),funded.revision+1)),view=usPlayScreen({schemaVersion:1,career:closed}) as {majorContract:{annualSalaryUsd:number;funded:boolean}};assert.equal(view.majorContract.funded,true);
 const cash=closed.inventory.clubs.find(o=>o.id===closed.protagonistOrganizationId)!.availableBudgetUsd;
 const next=dispatch(closed,'NEXT_MAJOR_YEAR').nextState.career as UsCareer;assert.equal(next.world.seasonKey,String(Number(closed.world.seasonKey)+1));assert.equal(next.contract.years,1);assert.equal(next.contract.annualSalaryUsd,view.majorContract.annualSalaryUsd);assert.deepEqual(next.income,closed.income);assert.equal(next.records,closed.records);
 assert.equal(next.inventory.clubs.find(o=>o.id===next.protagonistOrganizationId)!.availableBudgetUsd,cash-next.contract.annualSalaryUsd);assert.ok(next.majorYears!.at(-1)!.funding.every(f=>f.addedBudgetUsd===0));
 assert.deepEqual(usPlayScreen({schemaVersion:1,career:JSON.parse(JSON.stringify(next))}),usPlayScreen({schemaVersion:1,career:next}));
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:next},{commandId:'stale',expectedRevision:0,type:'CAREER_US_PLAY_NEXT_MAJOR_YEAR',payload:{careerRevision:closed.revision}}),/REVISION/);
});

test('six controlled credited MLB years expose explicit original-club FA and continue its remaining guarantee through the API',()=>{
 // Controlled contribution dates; existing funding, annual, FA and guarantee writers are genuine.
 let c=closedUsMajorFixture();
 for(let i=0;i<6;i++){
  const opening=startNextUsMajorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000})));
  c=finishControlledMajorSeason(publishUsSeasonSchedule(confirmUsPreseasonPlan(opening,opening.revision),opening.revision+1));
 }
 const view=usPlayScreen({schemaVersion:1,career:c}) as {majorContract:{kind:string;offers:{organizationId:string;years:number;annualSalaryUsd:number}[]}};
 assert.equal(view.majorContract.kind,'ORIGINAL_CLUB_FA');assert.equal(view.majorContract.offers.length,1);const offer=view.majorContract.offers[0]!;assert.equal(offer.organizationId,c.protagonistOrganizationId);
 assert.throws(()=>dispatch(c,'ACCEPT_MAJOR_FA',{years:1}),/INVALID_PAYLOAD/);assert.throws(()=>dispatch(c,'NEXT_MAJOR_YEAR'),/NOT_AVAILABLE/);
 const signed=dispatch(c,'ACCEPT_MAJOR_FA').nextState.career as UsCareer;
 assert.equal(signed.contract.years,offer.years);assert.equal(signed.contract.annualSalaryUsd,offer.annualSalaryUsd);assert.deepEqual(signed.income,c.income);assert.strictEqual(signed.records,c.records);assert.ok(signed.majorYears!.at(-1)!.funding.every(f=>f.addedBudgetUsd===0));
 const ended=finishControlledMajorSeason(publishUsSeasonSchedule(confirmUsPreseasonPlan(signed,signed.revision),signed.revision+1)),preview=usPlayScreen({schemaVersion:1,career:ended}) as {majorContract:{kind:string;guaranteed:boolean}};
 assert.equal(preview.majorContract.kind,'RENEWAL');assert.equal(preview.majorContract.guaranteed,true);
 const continued=dispatch(ended,'NEXT_MAJOR_YEAR').nextState.career as UsCareer;assert.equal(continued.contract.years,signed.contract.years!-1);assert.equal(continued.contract.annualSalaryUsd,signed.contract.annualSalaryUsd);assert.deepEqual(continued.income,ended.income);
});

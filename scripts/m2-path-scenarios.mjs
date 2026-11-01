import assert from 'node:assert/strict';
import {completedHighSchoolCareer,completedCollegeAcademicYear,enrolledCollegeCareer,enteredKboCareer} from '../packages/engine/test/fixtures.ts';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../packages/engine/src/high-school-route.ts';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../packages/engine/src/career-kbo.ts';
import {closeSchoolSeasonForKbo} from '../packages/engine/src/kbo-entry.ts';
import {startSignedKboCareer} from '../packages/engine/src/kbo-career-entry.ts';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../packages/engine/src/college-year.ts';
import {enterCollegeEarlyDraft,returnUnsignedCollegeCareer} from '../packages/engine/src/college-route.ts';
import {graduateCollegeCareer} from '../packages/engine/src/college-graduation.ts';
import {createOwnCareerAssessment} from '../packages/engine/src/high-school-assessment.ts';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../packages/engine/src/career-us.ts';
import {createUsRosterWorld} from '../packages/engine/src/us-world.ts';
import {initialUsRecruitmentInventory} from '../packages/engine/src/us-inventory.ts';
import {closeSchoolSeasonForUs} from '../packages/engine/src/us-entry.ts';
import {startSignedUsCareer} from '../packages/engine/src/us-career-entry.ts';
import {startCollegeMilitaryLeave,advanceCollegeMilitaryService,resumeCollegeAfterService} from '../packages/engine/src/college-service.ts';
import {confirmKboPreseasonPlan} from '../packages/engine/src/kbo-preseason.ts';
import {confirmKboOpeningRoster} from '../packages/engine/src/kbo-opening-roster.ts';
import {confirmKboSeasonSchedule} from '../packages/engine/src/kbo-schedule.ts';
import {startKboRegularSeason} from '../packages/engine/src/kbo-progress.ts';
import {offerKboRenewal,acceptKboRenewal} from '../packages/engine/src/kbo-renewal.ts';
import {hireCareerAgent,careerSalaryCounterPreview,requestCareerSalaryCounter,settleAgentFee} from '../packages/engine/src/career-agent.ts';
import {canonicalJson} from '../packages/engine/src/game.ts';

const prefix=description=>({kind:'CONTROLLED_PREFIX_NATIVE_SLICE',description});
function schoolRoute(t){t.command('ACKNOWLEDGE_HS_REVIEW',{},s=>acknowledgeHighSchoolSeasonReview(s,s.revision));t.command('OPEN_CAREER_ROUTE',{eventVersion:1},s=>openHighSchoolCareerRoute(s,s.revision,1));}
function signKbo(t){
 t.command('PREPARE_KBO_DRAFT',{},s=>prepareCareerKboDraft(s,s.revision));t.command('RESOLVE_KBO_DRAFT',{programVersion:1},s=>resolveCareerKboDraft(s,s.revision,1));
 assert.ok(t.state.kboRecruitment.program.result.round);
 t.command('SIGN_KBO_DRAFT',{programVersion:2,decision:'SIGN',eventVersion:1},s=>decideCareerKboDraft(s,s.revision,{programVersion:2,decision:'SIGN',eventVersion:1}));
 t.command('CLOSE_SCHOOL_FOR_KBO',{forfeitUnusedTraining:true},s=>closeSchoolSeasonForKbo(s,s.revision,true));t.command('START_SIGNED_KBO',{},s=>startSignedKboCareer(s,s.revision));
 assert.equal(t.state.registration.status,'ACTIVE');assert.ok(t.state.world.contracts[t.state.protagonistKey]);
}
function nextCollege(s){return startNextCollegeSeason(closeCollegeSeasonForNextYear(s,s.revision,true),s.revision+1);}
function academic(year,strength=800000){
 let c=enrolledCollegeCareer(),p=c.world.players.own;
 p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,strength]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};c.development.seasonStartPlayer=structuredClone(p);c.seasonGrowth.seasonStart=structuredClone(p);c.ownAssessment=createOwnCareerAssessment(c.world);
 for(let current=1;current<=year;current++){c=completedCollegeAcademicYear(c);if(current<year)c=nextCollege(c);}
 return c;
}
function inventory(c,budget=3000000){const world=createUsRosterWorld({worldKey:c.world.worldKey,seasonKey:String(c.world.calendar.year+1),seed:c.world.seed,difficulty:c.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'미국조직'+(i+1)}))});return {world,inventory:initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:budget,nationalReleaseAllowed:true,militaryReturnOption:false})))};}

export function controlledSchoolPaths(trace){
 const result=[];
 let t=trace('P01',completedHighSchoolCareer(800000),prefix('Existing completedHighSchoolCareer: controlled216 no-appearance HS contributions and abilities80. Traced real draft→contract→KBO activation.'));
 schoolRoute(t);signKbo(t);result.push(t.finish({terminal:'KBO_ACTIVE',actualDraftAndContract:true,sixAbilities:Object.keys(t.state.world.players.own.abilities).length,focusSlots:t.state.world.players.own.focus.length}));
 t=trace('P03',academic(1),prefix('Controlled completed college regular scores; actual cup and annual review reducers in completedCollegeAcademicYear. Native first-year close→second-year entry below.'));
 t.command('CLOSE_COLLEGE_YEAR',{forfeitUnusedTraining:true},s=>closeCollegeSeasonForNextYear(s,s.revision,true));t.command('START_COLLEGE_YEAR',{},s=>startNextCollegeSeason(s,s.revision));assert.equal(t.state.collegeAdmission.academicYear,2);assert.equal(t.state.collegeAdmission.yearsCompleted,1);result.push(t.finish({terminal:'COLLEGE_YEAR2_PRE',academicYear:2,completedYears:1,oldRecordsPreserved:true}));
 t=trace('P04',academic(2,10000),prefix('Controlled completed first/second academic years at low ability; actual E73 and draft/return/year-transition commands below.'));
 t.command('ENTER_EARLY_DRAFT',{eventVersion:t.state.events.at(-1).version},s=>enterCollegeEarlyDraft(s,s.revision,s.events.at(-1).version));t.command('PREPARE_KBO_DRAFT',{},s=>prepareCareerKboDraft(s,s.revision));t.command('RESOLVE_KBO_DRAFT',{programVersion:1},s=>resolveCareerKboDraft(s,s.revision,1));assert.equal(t.state.kboRecruitment.program.result.round,null);
 t.command('RETURN_UNSIGNED_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>returnUnsignedCollegeCareer(s,s.revision,s.events.at(-1).version));t.command('CLOSE_COLLEGE_YEAR',{forfeitUnusedTraining:true},s=>closeCollegeSeasonForNextYear(s,s.revision,true));t.command('START_COLLEGE_YEAR',{},s=>startNextCollegeSeason(s,s.revision));assert.equal(t.state.collegeAdmission.academicYear,3);assert.equal(t.state.collegeAdmission.earlyDraftAttempted,true);assert.equal(t.state.previousKboRecruitments.length,1);result.push(t.finish({terminal:'COLLEGE_YEAR3_PRE',unsigned:true,attempts:1,returnEnrollmentPreserved:true}));
 t=trace('P05',academic(4,950000),prefix('Controlled four academic regular seasons; actual cup/review in fixture. Real graduation→draft→KBO activation below.'));
 t.command('GRADUATE_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>graduateCollegeCareer(s,s.revision,s.events.at(-1).version));signKbo(t);assert.equal(t.state.amateurHistory.collegeAdmission.status,'GRADUATED');result.push(t.finish({terminal:'KBO_ACTIVE',graduated:true,collegeRecordsPreserved:Object.values(t.state.records.games).some(g=>g.scope.leagueKey==='COLLEGE')}));
 for(const [id,strength,budget]of [['P06',800000,3000000],['P07',10000,0]]){
  t=trace(id,completedHighSchoolCareer(strength),prefix('Controlled HS216 no-appearance contributions and explicit ability boundary; actual US eligibility/offers/signing reducers below.'));schoolRoute(t);const us=inventory(t.state,budget);
  t.command('PREPARE_US_DIRECT',{inventoryHash:canonicalJson(us.inventory)},s=>prepareCareerUsDirect(s,s.revision,us.inventory));const view=careerUsDirectView(t.state);
  if(id==='P06'){assert.equal(view.visible,true);assert.ok(view.offers.length);const offerKey=view.offers[0].offerKey;t.command('SIGN_US_DIRECT',{offerKey,eventVersion:1},s=>decideCareerUsDirect(s,s.revision,{programVersion:1,decision:{type:'SIGN',offerKey},eventVersion:1}));t.command('CLOSE_SCHOOL_FOR_US',{forfeitUnusedTraining:true},s=>closeSchoolSeasonForUs(s,s.revision,true));t.command('START_SIGNED_US',{worldKey:us.world.worldKey},s=>startSignedUsCareer(s,s.revision,us.world));assert.ok(t.state.contract);assert.ok(['ROOKIE','A'].includes(t.state.registration.level));result.push(t.finish({terminal:'US_MINOR_PRE',actualFixedOffer:true}));}
  else {assert.equal(view.visible,false);assert.equal(view.offers.length,0);result.push(t.finish({terminal:'US_CARD_HIDDEN',offers:0,noFakeOffer:true}));}
 }
 return result;
}
export function collegeServicePath(trace){
 const t=trace('P12',enrolledCollegeCareer(),prefix('Existing admitted first-year college fixture contains controlled completed HS records. All18month service dates and resume commands below are actual reducers.'));
 const old=canonicalJson(t.state.records),academicYear=t.state.collegeAdmission.academicYear,age=t.state.world.players.own.age;
 t.command('START_COLLEGE_MILITARY_LEAVE',{},s=>startCollegeMilitaryLeave(s,s.revision));
 for(let i=0;t.state.phaseContext.phase==='SERVICE_PROGRESS';i++){assert.ok(i<40);t.command('ADVANCE_COLLEGE_SERVICE',{maxDays:31},s=>advanceCollegeMilitaryService(s,s.revision,31));}
 assert.equal(t.state.collegeService.status,'COMPLETED');assert.ok(t.state.collegeService.closedDays.length>500);
 t.command('RESUME_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>resumeCollegeAfterService(s,s.revision,s.events.at(-1).version));
 assert.equal(t.state.collegeAdmission.academicYear,academicYear);assert.ok(t.state.world.players.own.age>age);assert.equal(canonicalJson(t.state.records),old);assert.equal(t.state.days.days.length,0);
 return t.finish({terminal:'COLLEGE_SAME_YEAR_PRE',ageAdvanced:true,academicYearFrozen:true,priorRecordsUnchanged:true,pastScheduleReplay:0,serviceClosedDays:t.state.collegeService.closedDays.length});
}
function closedNegotiation(){
 let c=enteredKboCareer();c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);c=startKboRegularSeason(c,c.revision);
 // Controlled prefix copied from career-agent.test.ts; no completed professional season is claimed here.
 c.phaseContext={phase:'SEASON_REVIEW'};c.days.days=[{day:300,evidence:'controlled-close',result:{injured:[],recovered:[]}}];c.seasonClose={receiptKey:'controlled-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:0,trainingForfeited:true};return c;
}
export function agentPath(trace){
 const results=[];
 for(const seed of ['agent-success-0','agent-reject-0']){
  const initial=closedNegotiation();initial.world.seed=seed;const t=trace('P15-'+seed,initial,prefix('Controlled career-agent.test.ts season-close boundary. Actual hire→renewal quote→one counter→accepted/rejected outcome and salary-fee settlement below; no native pro season claim.'));
  t.command('HIRE_AGENT',{agentId:'AG01'},s=>hireCareerAgent(s,s.revision,'AG01'));t.command('OFFER_KBO_RENEWAL',{},s=>offerKboRenewal(s,s.revision));const q=careerSalaryCounterPreview(t.state),base=canonicalJson(t.state.renewal);
  t.command('REQUEST_SALARY_COUNTER',{previewId:q.previewId,raiseBps:seed.includes('reject')?3000:1000},s=>requestCareerSalaryCounter(s,s.revision,{previewId:q.previewId,raiseBps:seed.includes('reject')?3000:1000}));const request=t.state.agents.salaryRequests.at(-1);
  if(request.outcome==='REJECTED')assert.equal(canonicalJson(t.state.renewal),base);
  const eventKey=t.state.renewal.eventKey,offerKey=request.counterOfferKey??undefined;t.command('ACCEPT_KBO_RENEWAL',{eventKey,eventVersion:1,offerKey},s=>acceptKboRenewal(s,s.revision,{eventKey,eventVersion:1,offerKey}));
  const pay={entryKey:'path-salary',currency:'KRW',gross:100000000,kind:'SALARY',seasonKey:t.state.world.seasonKey,worldDay:300};t.command('SETTLE_AGENT_FEE',pay,s=>settleAgentFee(s,pay));const income=t.state.agents.income.find(i=>i.currency==='KRW');assert.equal(income.fee,2000000);assert.equal(income.net,98000000);
  results.push(t.finish({terminal:'CONTRACT_DECIDED',counterOutcome:request.outcome,rejectedOriginalPreserved:request.outcome==='REJECTED'?true:null,fee:2000000,net:98000000}));
 }
 assert.ok(results.some(r=>r.invariantReport.counterOutcome==='REJECTED'),'P15 requires actual rejected outcome');assert.ok(results.some(r=>r.invariantReport.counterOutcome==='ACCEPTED'),'P15 requires actual accepted outcome');return results;
}

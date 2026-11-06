import assert from 'node:assert/strict';
import {nativeUndraftedUsReturn} from '../packages/engine/test/us-return-retry-fixture.ts';
import * as returnedRetry from '../packages/engine/src/us-return-retry.ts';
import {retryNoOfferPrefix} from '../packages/engine/test/retry-completion-scenario.ts';
import * as retry from '../packages/engine/src/career-pro-retry.ts';

export function returnedUsContractPath(trace){
 const origin=nativeUndraftedUsReturn();
 const t=trace('P10-returned-undrafted-to-current-US-contract',origin,{
  kind:'CONTROLLED_PREFIX_NATIVE_SLICE',
  fixture:'packages/engine/test/us-return-retry-fixture.ts:nativeUndraftedUsReturn',
  description:'Six controlled closed US years, two actual independent48-game mandatory return years, actual initial undrafted draw under controlled legal payroll saturation. Tracing starts after that draw: returned retry gateway, current US opportunity and accepted contract. No optional season, military service, native full US season or full P10 claim.',
 });
 t.command('OPEN_US_RETURN_RETRY',{},s=>returnedRetry.openUsAmateurReturnRetry(s,s.revision));
 t.command('ASSESS_US_RETURN_RETRY_US',{},s=>returnedRetry.assessUsAmateurReturnRetryUsOpportunity(s,s.revision));
 const quoted=t.state,q=quoted.usOpportunities.at(-1),view=returnedRetry.usAmateurReturnRetryRoutesView(quoted);
 const offer=q.offers.find(o=>o.organizationId!==origin.source.protagonistOrganizationId)??q.offers[0];assert.ok(offer);
 const input={routePreviewId:view.routePreviewId,offerKey:offer.offerKey};
 t.command('ACCEPT_US_RETURN_RETRY_US',input,s=>returnedRetry.resignUsAfterAmateurReturnRetry(s,s.revision,input));
 const us=t.state,club=us.inventory.clubs.find(c=>c.id===offer.organizationId),before=q.inventory.clubs.find(c=>c.id===offer.organizationId);
 assert.equal(us.world.seasonKey,q.world.seasonKey);
 assert.equal(us.world.players[us.protagonistKey].age,quoted.retry.age+1);
 assert.equal(us.retryCareer.careerPreparationUsed,0);
 assert.equal(us.usAmateurReturnHistory.return.years.length,2);
 assert.equal(us.contract.annualSalaryUsd,30000);
 assert.equal(club.availableBudgetUsd,before.availableBudgetUsd-30000);
 assert.ok(Object.keys(origin.source.records.games).every(key=>Object.hasOwn(us.records.games,key)));
 return t.finish({mandatoryTeamGames:[48,48],mandatoryYears:2,optionalBudgetUsed:0,currentYearQuote:true,currentAge:true,annualSalaryUsd:30000,salaryReservedOnce:true,originalRecordsPreserved:true,jsonReplay:'every command',sourceImmutability:'every command'});
}
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
import {refreshCareerRepertoireEvents,resolveCareerRepertoireEvent} from '../packages/engine/src/repertoire-events.ts';
import {validatePitchXpLedger} from '../packages/engine/src/pitch-xp.ts';
import {validatePitchWeights} from '../packages/engine/src/repertoire.ts';
import {openNationalCallup,respondNationalCallup,confirmNationalEligibility} from '../packages/engine/src/kbo-national.ts';
import {playAsianGamesTournament} from '../packages/engine/src/national-tournament.ts';
import {createSeasonCalendar} from '../packages/engine/src/season-calendar.ts';
import {recordTotals} from '../packages/engine/src/records.ts';
import {requestKboPosting,resolveKboPostingClub,openKboPostingOffers,resolveKboPostingOfferEvent} from '../packages/engine/src/kbo-posting.ts';
import {createWorldStream,nextInteger} from '../packages/engine/src/rng.ts';
import {emptyBatting} from '../packages/engine/src/stats.ts';
import {createHighSchoolWorld} from '../packages/engine/src/high-school-world.ts';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../packages/engine/src/high-school-career.ts';
import {advanceHighSchoolCareer,resolveCareerWindowEvent} from '../packages/engine/src/high-school-progress.ts';
import {previewCareerTraining,trainHighSchoolCareer} from '../packages/engine/src/high-school-training.ts';

const prefix=description=>({kind:'CONTROLLED_PREFIX_NATIVE_SLICE',description});

/** Diagnosis is controlled; recovery, deferred opportunity and exact one-time payment are native commands. */
export function injuryTrainingPath(trace){
 let c=createHighSchoolCareer(createHighSchoolWorld({worldKey:'training-world',seasonKey:'2032',seed:'training-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 c=confirmCareerPlayer(c,c.revision);c=resolveCareerFocusEvent(c,c.revision,{eventKey:c.events[0].eventKey,eventVersion:1,command:'KEEP_FOCUS'});c=confirmCareerPreseason(c,c.revision);
 for(let i=0;;i++){
  assert.ok(i<400,'training window command budget exhausted');
  if(c.phaseContext.phase==='EVENT_DECISION'){
   const e=c.events.find(e=>e.eventKey===c.phaseContext.eventKey);
   assert.ok(['E02','E03'].includes(e.definitionId),'unexpected prefix event');
   break;
  }else c=advanceHighSchoolCareer(c,c.revision).career;
 }
 const key=c.world.protagonistKey,diagnosis=c.health.games.findLast(g=>g.evidence.roster.includes(key));assert.ok(diagnosis);
 diagnosis.result.injured=[...new Set([...diagnosis.result.injured,key])];
 c.health.injuries[key]={severity:'MILD',remainingTeamGames:7,diagnosedGameKey:diagnosis.evidence.gameKey,seasonKey:c.world.seasonKey};
 const t=trace('P13-injury-deferred-training',c,prefix('Native12-game focus-window prefix; controlled mild diagnosis appended to its real health receipt. Traced commands play seven real recovery games, automatically delay E43 while injured, then defer the recovered window and apply exactly one annual guaranteed enhancement. Natural diagnosis draw and actual screens remain unproven.'));
 const focus=c.events.find(e=>e.eventKey===c.phaseContext.eventKey),focusInput={eventKey:focus.eventKey,eventVersion:focus.version,command:'KEEP_FOCUS'},choice={type:'GUARANTEED',ability:'POWER'};
 t.command('KEEP_FOCUS',focusInput,s=>resolveCareerFocusEvent(s,s.revision,focusInput));
 assert.ok(!t.state.development.trainingUsedSeasons.includes(c.world.seasonKey));
 let delayedAfterSixteen=false;
 for(let i=0;Object.hasOwn(t.state.health.injuries,key);i++){
  assert.ok(i<100,'recovery command budget exhausted');
  assert.ok(!t.state.events.some(e=>e.definitionId==='E43'),'injury must delay the training window');
  if(t.state.phaseContext.phase==='SEASON_PROGRESS'&&!t.state.phaseContext.pendingGame&&!t.state.phaseContext.advancePlan&&previewCareerTraining(t.state,choice).reason==='INJURED'){
   delayedAfterSixteen=true;const before=canonicalJson(t.state);assert.throws(()=>trainHighSchoolCareer(t.state,t.state.revision,choice));assert.equal(canonicalJson(t.state),before);
  }
  t.command('ADVANCE_HS',{mode:'ONE_GAME'},s=>{const out=advanceHighSchoolCareer(s,s.revision,'ONE_GAME');assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;});
 }
 assert.ok(delayedAfterSixteen,'training must remain unpaid past game16 while injured');
 assert.ok(t.state.health.games.some(g=>g.result.recovered.includes(key)));
 const window=t.state.events.find(e=>e.eventKey===t.state.phaseContext.eventKey);assert.equal(window.definitionId,'E43');
 const input={eventKey:window.eventKey,eventVersion:window.version,command:'DEFER_TRAINING'};
 t.command('DEFER_TRAINING',input,s=>resolveCareerWindowEvent(s,s.revision,input));
 const before=t.state.world.players[key],preview=previewCareerTraining(t.state,choice),rng=canonicalJson(t.state.development.trainingRng);assert.equal(preview.eligible,true);
 const power=before.abilities.POWER,fatigue=before.fatigue;
 t.command('TRAIN_HS',choice,s=>trainHighSchoolCareer(s,s.revision,choice));
 const result=t.state.development.trainingResults.at(-1),after=t.state.world.players[key];
 assert.equal(after.abilities.POWER,power+preview.gainUnits);assert.equal(result.fatigueBefore,fatigue);assert.equal(result.fatigueAfter,after.fatigue);assert.equal(result.success,true);assert.equal(canonicalJson(t.state.development.trainingRng),rng);
 const sealed=canonicalJson(t.state);assert.throws(()=>trainHighSchoolCareer(t.state,t.state.revision,choice),/LIMIT_REACHED/);assert.equal(canonicalJson(t.state),sealed);
 return t.finish({terminal:'RECOVERED_AND_TRAINED',nativeRecovery:true,controlledDiagnosis:true,trainingWindowDelayedWhileInjured:true,annualUses:t.state.development.trainingUsedSeasons.filter(s=>s===c.world.seasonKey).length,gainUnits:preview.gainUnits,fatigueBefore:fatigue,fatigueAfter:after.fatigue,noGuaranteedTrainingDraw:true,repeatedPaymentRejectedAtomically:true,jsonReplay:'every command',unproven:['natural diagnosis draw','M4 actual screens']});
}

/** Only the final independent season is native; the two earlier uses are labelled inputs. */
export function retryExhaustionPath(trace){
 const t=trace('P16-retry-exhaustion',retryNoOfferPrefix(true),prefix('Controlled closed pro season, saturated actual budgets and two prior optional completions. Commands below play the final independent48 and explicitly confirm retirement; no native full pro career or external archive export claim.'));
 t.command('OPEN_KBO_UNCONTRACTED_RETRY',{},s=>retry.openKboUncontractedRetry(s,s.revision));
 t.command('OPEN_UNCONTRACTED_ROUTES',{eventVersion:1},s=>retry.reviewKboUncontractedRoutes(s,s.revision,1));
 const routePreviewId=retry.kboRetryRoutesView(t.state).routePreviewId;
 t.command('START_PREPARATION',{routePreviewId},s=>retry.startKboRetryPreparation(s,s.revision,{routePreviewId}));
 t.command('CONFIRM_PRESEASON',{},s=>retry.confirmKboRetryPreseason(s,s.revision));
 for(let i=0;t.state.preparationSeason.nextWorldDay<=Math.max(...t.state.preparationSeason.world.schedule.map(g=>g.worldDay));i++){
  assert.ok(i<2000,'retry preparation command budget exhausted');
  t.command('ADVANCE_PREPARATION',{mode:'ONE_MONTH'},s=>{const out=retry.advanceKboRetryPreparation(s,s.revision,'ONE_MONTH');assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;});
 }
 t.command('SETTLE_PREPARATION',{forfeitUnusedTraining:true},s=>retry.settleKboRetryPreparation(s,s.revision,true));
 assert.equal(t.state.retryCareer.careerPreparationUsed,3);assert.equal(retry.kboRetryRoutesView(t.state).offers.length,0);
 const p=t.state.preparationSeason,own=p.world.protagonistKey;
 const games=Object.values(p.records.games).filter(g=>g.scope.seasonKey===p.world.seasonKey&&g.scope.leagueKey==='INDEPENDENT');
 assert.equal(games.length,216);assert.equal(games.filter(g=>Object.hasOwn(g.teams,p.world.protagonistSchoolId)).length,48);
 const recordHash=canonicalJson(t.state.records),player=canonicalJson(p.world.players[own]);
 t.command('OPEN_RETRY_EXHAUSTION',{},s=>retry.openKboRetryExhaustion(s,s.revision));
 const e=t.state.events.find(e=>e.definitionId==='E35'&&e.status==='OPEN');assert.ok(e);
 const input={eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'};
 t.command('CONFIRM_RETIRE',input,s=>retry.confirmKboRetryExhaustion(s,s.revision,input));
 assert.equal(t.state.phaseContext.phase,'ARCHIVED');assert.equal(canonicalJson(t.state.records),recordHash);assert.equal(canonicalJson(t.state.preparationSeason.world.players[own]),player);
 assert.equal(t.state.events.find(x=>x.eventKey===e.eventKey).status,'RESOLVED');
 return t.finish({terminal:'ARCHIVED',nativePreparationSeasons:1,nativeIndependentLeagueGames:games.length,ownTeamGames:48,totalOptionalUses:3,realMarketOffers:0,explicitRetirement:true,recordsAndPlayerPreserved:true,jsonReplay:'every command',unproven:['native earlier pro career and first two optional seasons','M3 archive persistence','M7 export']});
}
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
  t.command('PREPARE_US_DIRECT',{inventory:us.inventory},s=>prepareCareerUsDirect(s,s.revision,us.inventory));const view=careerUsDirectView(t.state);
  if(id==='P06'){assert.equal(view.visible,true);assert.ok(view.offers.length);const offerKey=view.offers[0].offerKey;t.command('SIGN_US_DIRECT',{programVersion:1,decision:{type:'SIGN',offerKey},eventVersion:1},s=>decideCareerUsDirect(s,s.revision,{programVersion:1,decision:{type:'SIGN',offerKey},eventVersion:1}));t.command('CLOSE_SCHOOL_FOR_US',{forfeitUnusedTraining:true},s=>closeSchoolSeasonForUs(s,s.revision,true));t.command('START_SIGNED_US',{world:us.world},s=>startSignedUsCareer(s,s.revision,us.world));assert.ok(t.state.contract);assert.ok(['ROOKIE','A'].includes(t.state.registration.level));result.push(t.finish({terminal:'US_MINOR_PRE',actualFixedOffer:true}));}
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
 // The counter outcome is a seeded draw: pick the first seed that really yields each outcome, as career-agent.test.ts does.
 const probe=(prefix,raiseBps,outcome)=>{for(let i=0;i<30;i++){const seed=prefix+i,c=closedNegotiation();c.world.seed=seed;const h=hireCareerAgent(c,c.revision,'AG01'),o=offerKboRenewal(h,h.revision),q=careerSalaryCounterPreview(o),n=requestCareerSalaryCounter(o,o.revision,{previewId:q.previewId,raiseBps});if(n.agents.salaryRequests.at(-1).outcome===outcome)return seed;}throw new Error('P15 no seed yields '+outcome);};
 for(const seed of [probe('agent-success-',1000,'ACCEPTED'),probe('agent-reject-',3000,'REJECTED')]){
  const initial=closedNegotiation();initial.world.seed=seed;const t=trace('P15-'+seed,initial,prefix('Controlled career-agent.test.ts season-close boundary. Actual hire→renewal quote→one counter→accepted/rejected outcome and salary-fee settlement below; no native pro season claim.'));
  t.command('HIRE_AGENT',{agentId:'AG01'},s=>hireCareerAgent(s,s.revision,'AG01'));t.command('OFFER_KBO_RENEWAL',{},s=>offerKboRenewal(s,s.revision));const q=careerSalaryCounterPreview(t.state),base=canonicalJson(t.state.renewal);
  t.command('REQUEST_SALARY_COUNTER',{previewId:q.previewId,raiseBps:seed.includes('reject')?3000:1000},s=>requestCareerSalaryCounter(s,s.revision,{previewId:q.previewId,raiseBps:seed.includes('reject')?3000:1000}));const request=t.state.agents.salaryRequests.at(-1);
  if(request.outcome==='REJECTED')assert.equal(canonicalJson(t.state.renewal),base);
  const eventKey=t.state.renewal.eventKey,offerKey=request.counterOfferKey,input={eventKey,eventVersion:1,...(offerKey?{offerKey}:{})};t.command('ACCEPT_KBO_RENEWAL',input,s=>acceptKboRenewal(s,s.revision,input));
  const pay={entryKey:'path-salary',currency:'KRW',gross:100000000,kind:'SALARY',seasonKey:t.state.world.seasonKey,worldDay:300};t.command('SETTLE_AGENT_FEE',pay,s=>settleAgentFee(s,pay));const income=t.state.agents.income.find(i=>i.entryKey===pay.entryKey);assert.equal(income.fee,2000000);assert.equal(income.net,98000000);
  results.push(t.finish({terminal:'CONTRACT_DECIDED',counterOutcome:request.outcome,rejectedOriginalPreserved:request.outcome==='REJECTED'?true:null,fee:2000000,net:98000000}));
 }
 assert.ok(results.some(r=>r.invariantReport.counterOutcome==='REJECTED'),'P15 requires actual rejected outcome');assert.ok(results.some(r=>r.invariantReport.counterOutcome==='ACCEPTED'),'P15 requires actual accepted outcome');return results;
}

export function pitcherLearningPath(trace){
 const t=trace('P02-learning',enteredKboCareer('PITCHER'),prefix('Existing controlled HS/draft fixture enters KBO preseason as pitcher. Traced E86 opens real learning and reserves shared XP. Role competition and completed training remain unproven.'));
 t.command('REFRESH_REPERTOIRE_EVENTS',{},s=>refreshCareerRepertoireEvents(s));
 const event=t.state.repertoireEvents.notices.find(e=>e.definitionId==='E86'&&e.status==='OPEN');assert.ok(event);
 const input={eventKey:event.eventKey,eventVersion:event.version,command:'SET_PITCH_TRAINING',pitchId:'P07'};
 t.command('SET_PITCH_TRAINING',input,s=>resolveCareerRepertoireEvent(s,s.revision,input));
 const player=t.state.world.players[t.state.protagonistKey],book=t.state.world.repertoires[t.state.protagonistKey];
 assert.equal(Object.keys(player.abilities).length,6);assert.ok(Object.hasOwn(player.abilities,'PICKOFF'));assert.equal(book.learning.pitchId,'P07');assert.equal(book.ledger.baseReservedUnits,100000);validatePitchXpLedger(book.ledger);validatePitchWeights(book.book,book.weights);
 return t.finish({terminal:'PITCH_LEARNING_REGISTERED',sixAbilities:true,reservedBaseXp:100000,pitchWeightsValid:true,sharedXpLedgerValid:true,unproven:['native creation-to-role competition','learning completion and game XP']});
}

export function nationalAppearancePath(trace){
 const initial=enteredKboCareer();
 // Controlled national-ready boundary, matching kbo-national.test.ts; no domestic full season is claimed.
 initial.world.seasonKey='2030';initial.world.calendar=createSeasonCalendar(2030);initial.phaseContext={phase:'SEASON_REVIEW'};initial.events=[];initial.records={revision:0,games:{}};initial.health.games=[];initial.military={status:'UNRESOLVED',applications:[]};initial.seasonClose={seasonKey:'2030'};
 const player=initial.world.players[initial.protagonistKey];player.abilities=Object.fromEntries(Object.keys(player.abilities).map(axis=>[axis,650000]));
 const t=trace('P11-national-appearance',initial,prefix('Controlled national-ready 2030 review, abilities65 and empty professional records. Actual callup response and batch 16-game AG tournament produce persisted official appearance and eligibility result. Full 28-player selection and international calendar worker remain unproven.'));
 t.command('OPEN_NATIONAL_CALLUP',{tournament:'AG'},s=>openNationalCallup(s,s.revision,'AG'));
 const selectionId=t.state.national.invitations[0].selectionId;t.command('ACCEPT_NATIONAL',{selectionId,decision:'ACCEPT'},s=>respondNationalCallup(s,s.revision,selectionId,'ACCEPT'));
 t.command('PLAY_ASIAN_GAMES',{},s=>playAsianGamesTournament(s,s.revision));
 const result=t.state.national.competitions[0],totals=recordTotals(t.state.records,{seasonKey:'2030',leagueKey:'AG',phase:'INTERNATIONAL'});
 assert.equal(result.gameKeys.length,16);assert.ok(totals.batting[t.state.protagonistKey].PA>0);assert.equal(result.officialAppearance,true);
 const eligible=result.medal==='GOLD';assert.equal(t.state.military.status,eligible?'ATHLETE_ELIGIBLE':'UNRESOLVED');
 if(eligible)t.command('CONFIRM_NATIONAL_ELIGIBILITY',{competitionId:result.competitionId},s=>confirmNationalEligibility(s,s.revision,result.competitionId));
 assert.notEqual(t.state.military.status,'COMPLETED');
 return t.finish({terminal:'ACTUAL_AG_RESULT',games:16,officialAppearance:true,medal:result.medal,athleteEligible:eligible,militaryStatus:t.state.military.status,serviceCompletionNotInferred:true,unproven:eligible?['three duty seasons']:['positive medal eligibility branch','three duty seasons']});
}

function postingBoundary(strength=800000,age=30){
 const c=enteredKboCareer(),key=c.protagonistKey,club=c.protagonistClubId,other=c.world.clubs.find(t=>t.id!==club).id;
 c.world.seasonKey='2040';c.world.calendar=createSeasonCalendar(2040);c.phaseContext={phase:'SEASON_REVIEW'};c.events=[];c.records={revision:0,games:{}};c.health.games=[];c.health.injuries={};c.proSeasons=[];c.seasonClose={seasonKey:'2040'};c.military={status:'COMPLETED',applications:[]};
 const player=c.world.players[key];player.age=age;player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,strength]));player.potential={...player.abilities};player.careerPeaks={...player.abilities};Object.assign(c.world.contracts[key],{seasonKey:'2040',years:2,status:'ACTIVE'});
 for(let year=2034;year<=2040;year++){
  if(year<2040)c.proSeasons.push({seasonKey:String(year)});
  for(let day=1;day<=100;day++){
   const gameKey=JSON.stringify(['controlled-posting-registration',year,day]);c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey:String(year),leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[other]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
   c.health.games.push({evidence:{gameKey,teamKey:'KBO:'+club,seasonKey:String(year),day,roster:[key],appearances:[]},result:{injured:[],recovered:[]}});
   if(year===2040&&day===100){const good=strength>=650000;c.records.games[gameKey].batting[key]={...emptyBatting(),PA:100,AB:90,H:good?40:0,TB:good?70:0,HR:good?5:0,R:20,RBI:20,BB:10,K:good?10:90,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};const split=()=>({PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0});c.records.games[gameKey].batterSplits[key]={L:split(),R:split()};}
  }
 }
 // Controlled seed guarantees a nonempty offer-count boundary, never changes a reducer outcome afterward.
 const postingId=JSON.stringify(['kbo-posting',c.world.worldKey,c.world.seasonKey,key]);
 for(let i=0;i<100;i++){const seed='m2-posting-'+i;if(nextInteger(createWorldStream(seed,JSON.stringify(['kbo-posting-offers',postingId]),'roster'),4).value>0){c.world.seed=seed;return c;}}
 throw new Error('POSTING_FIXTURE_SEED_BUDGET');
}

export function postingPaths(trace){
 const results=[];
 for(const branch of ['SIGN','DEFER','NO_OFFER','REMAIN']){
  const t=trace(branch==='SIGN'?'P08-posting-sign':'P09-posting-'+branch.toLowerCase(),postingBoundary(branch==='DEFER'?400000:800000,branch==='NO_OFFER'?45:30),prefix('Controlled seven closed100-registration seasons, military completion, current contract and batting boundary. Seed fixed before tracing to nonempty offer-count draw; age45 separately guarantees genuine zero offers. Real posting reducers below; no native seven-season career or US activation claim.'));
  const key=t.state.protagonistKey,contract=canonicalJson(t.state.world.contracts[key]),abilities=canonicalJson(t.state.world.players[key].abilities);
  t.command('REQUEST_KBO_POSTING',{},s=>requestKboPosting(s,s.revision));t.command('RESOLVE_POSTING_CLUB',{},s=>resolveKboPostingClub(s,s.revision));
  if(branch==='DEFER')assert.equal(t.state.posting.windows[0].status,'DEFERRED');
  else {
   assert.equal(t.state.posting.windows[0].status,'APPROVED');t.command('OPEN_POSTING_OFFERS',{issuedWorldDay:1},s=>openKboPostingOffers(s,s.revision,1));
   const window=t.state.posting.windows[0],event=t.state.events.find(e=>e.definitionId==='E64'&&e.status==='OPEN');assert.ok(event);
   if(branch==='NO_OFFER')assert.equal(window.offers.length,0);else assert.ok(window.offers.length>0);
   const input={eventKey:event.eventKey,eventVersion:event.version,command:branch==='SIGN'?'ACCEPT_CAREER_OFFER':'REMAIN_ORIGINAL',...(branch==='SIGN'?{offerKey:window.offers[0].offerKey,worldDay:1}:{})};
   t.command('RESOLVE_POSTING_OFFER',input,s=>resolveKboPostingOfferEvent(s,s.revision,input));
  }
  if(branch==='SIGN'){assert.equal(t.state.posting.windows[0].status,'SIGNED');assert.equal(t.state.world.contracts[key],undefined);assert.ok(t.state.posting.windows[0].returnRights);}
  else {assert.equal(canonicalJson(t.state.world.contracts[key]),contract);assert.equal(canonicalJson(t.state.world.players[key].abilities),abilities);}
  results.push(t.finish({terminal:t.state.posting.windows[0].status,branch,originalContractPreserved:branch!=='SIGN',noAbilityPenalty:branch!=='SIGN',unproven:branch==='SIGN'?['US root activation and subsequent games']:['native seven-season prefix']}));
 }
 return results;
}

/** Commands (in order) that a native slice must contain for the runner to accept its completion claim. */
const HS=['CONFIRM_PLAYER','CONFIRM_PRESEASON','ADVANCE_HS','ACKNOWLEDGE_HS_REVIEW','OPEN_CAREER_ROUTE'];
const KBO=['PREPARE_KBO_DRAFT','RESOLVE_KBO_DRAFT','SIGN_KBO_DRAFT','CLOSE_SCHOOL_FOR_KBO','START_SIGNED_KBO'];
const COLLEGE=['ENROLL_COLLEGE','CLOSE_HS_FOR_COLLEGE','START_ADMITTED_COLLEGE'];
const YEAR=['CONFIRM_COLLEGE_PRESEASON','ADVANCE_COLLEGE','START_COLLEGE_CUP','ADVANCE_COLLEGE_CUP','ACKNOWLEDGE_COLLEGE_REVIEW'];
export const PATH_REQUIREMENTS={
 P01:[...HS,...KBO],
 P03:[...HS,...COLLEGE,...YEAR,'CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR'],
 P04:[...HS,...COLLEGE,...YEAR,'CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR',...YEAR,'ENTER_EARLY_DRAFT','PREPARE_KBO_DRAFT','RESOLVE_KBO_DRAFT','RETURN_UNSIGNED_COLLEGE','CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR'],
 P05:[...HS,...COLLEGE,...YEAR,'CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR',...YEAR,'CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR',...YEAR,'CLOSE_COLLEGE_YEAR','START_COLLEGE_YEAR',...YEAR,'GRADUATE_COLLEGE',...KBO],
 P07:[...HS,'PREPARE_US_DIRECT',...KBO],
 P12:[...HS,...COLLEGE,'START_COLLEGE_MILITARY_LEAVE','ADVANCE_COLLEGE_SERVICE','RESUME_COLLEGE'],
};

/** Why a path is still FULL_PATH_NOT_PROVEN. Reasons name the engine gap; docs/implementation/M2-CLOSURE-GAPS-20261106.md ranks them. */
export const PATH_GAPS={
 P02:'no native pitcher chain driver (HS pitcher creation->HS216->KBO sign->preseason roster role->E86 pitch training); role competition has no standalone engine command (kbo-opening-roster.ts:confirmKboOpeningRoster only) and XP-cap/pitch-ratio assertions are covered only by controlled slice',
 P04:'native chain runs (P04-native-decline-variant) but the native player is DRAFTED at the early draft (round 8), so the undrafted branch the path requires is not reached; only drafted-then-DECLINED to E74 return is executed. Needs a weaker native player or seed search for an undrafted draw (career-kbo.ts:resolveCareerKboDraft round null)',
 P05:'ENGINE/PERSISTENCE: native chain ran 531 commands through 4 college years + graduation, then died at PREPARE_KBO_DRAFT with RangeError Invalid string length: the career state serializes past the V8 max string length (~0.5 GB). Measured after year 2: 123 MB (collegeEarlyRoute 54 MB, previousSeasons 31 MB, records 16 MB, collegeCup 7.5 MB, days 7.6 MB). Save-state snapshots duplicate per-year data; same blocker for M3 persistence. Needs engine to stop embedding duplicated season snapshots (or a streaming hasher in the harness)',
 P06:'native default hitter ends HS at overall 51.6; career-us.ts:careerUsDirectView stays hidden (US_DIRECT_MIN_SCOUT_SCORE in draft.ts). No creation preset/seed reaches the threshold within one HS season; needs seed search (~4 min/seed) or a college->US comparison chain (carryCollegeUsComparison)',
 P08:'KBO posting needs 7 closed native KBO registration seasons + military COMPLETED (kbo-posting.ts:kboPostingEligibility SERVICE_SHORT/MILITARY_BLOCKED); no native multi-season KBO driver (closeKboSeason->stageKboAgeAndContracts->startNextKboSeason x7) nor native military completion built; controlled fixture only',
 P09:'same prerequisite as P08 (7 native KBO seasons + military) before request/defer/no-offer/remain branches',
 P10:'helper links missing: returned-US undrafted draw needs 6 native US seasons + 2 mandatory return years (us-amateur-return-career.ts, us-return-retry.ts, us-return-preparation.ts); engine has no native US-season-to-return chain, fixture us-return-retry-fixture.ts:nativeUndraftedUsReturn uses controlled closed years',
 P11:'native player never reaches national selection (kbo-national-selection.ts needs ~65 ability; native player ~52); openNationalCallup requires a closed pro review; needs native multi-season growth or a selection path that does not need ability seeding',
 P13:'natural diagnosis draw not driven: needs an HS/pro seed where the protagonist is injured in the first 12 games (health.ts); seed search ~4 min/probe. Recovery/deferral/one-time training commands already exist in controlled slice',
 P14:'same-game trait/goal/chronicle integration: chronicle producer (E99/S45) is M7; no engine command emits one game->stat+trait+goal+chronicle receipt',
 P15:'BLOCKED BY ENGINE BUG: a native KBO regular season cannot finish. advanceKboCareer throws INVALID_PRO_TRAIT_PHASE at world day 67 of season 2033 (pro-trait-notices.ts:50 raiseProHiddenTraitNotice <- kbo-progress.ts:163 interruptHidden): career.phaseContext still carries pendingGame after Object.assign of a cloned career (hypothesis: stale progress alias, kbo-progress.ts:144). Repro + failing state in the shared notes folder. After the fix P15 needs closeKboSeason->hireCareerAgent->offerKboRenewal->counter driver.',
 P16:'native pro career + release + three independent retry uses not available; retry-completion-scenario.ts retryNoOfferPrefix and 2 earlier optional uses are controlled (career-pro-retry.ts)',
 P17:'CLUB mode (M6): kbo-club-*.ts exist but unified club creation/lineup/first-game worker chain not wired as one native command chain',
 P18:'CLUB mode (M6): archived original copy at 19 (kbo-club-import.ts:importArchivedPlayers) needs a native retired original; depends on P16-like native ARCHIVED career',
 P19:'CLUB mode (M6): same-world role claim for imported original and coach hire (S43) not an engine command here',
 P20:'CLUB mode (M6): scout/offer/round-close/signing (S36/S16/S17) not a single native chain',
 P21:'CLUB mode (M6): finance rebuild, year transition and long league (kbo-club-year.ts, kbo-club-long-run.ts) need worker chain',
 P22:'M3/API: cross-device creation/command replay with same owner is HTTP persistence (apps/api); not an engine command chain',
 P23:'M7 replay/card/export/backup is external; only read-only committed record reads are provable here',
 P24:'CLUB/DIFFICULTY: hard competition + club cheat + transfer + re-sign spans M6 club and difficulty policy; no native chain',
};

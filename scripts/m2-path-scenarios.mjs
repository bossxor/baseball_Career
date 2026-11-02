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

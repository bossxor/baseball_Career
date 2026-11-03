import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer,completedCollegeAcademicYear} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../src/college-entry.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect,advanceCareerUsNegotiation} from '../src/career-us.js';
import * as notices from '../src/career-route-notices.js';
import * as routes from '../src/college-route.js';
import {closeSchoolSeasonForUs,assertUsAmateurYearEnd} from '../src/us-entry.js';
import {canonicalJson} from '../src/game.js';
import type {UsRecruitmentWorld} from '../src/us-direct.js';

function admitted(){const c=completedHighSchoolCareer(),reviewed=acknowledgeHighSchoolSeasonReview(c,c.revision),opened=openHighSchoolCareerRoute(reviewed,reviewed.revision,1).career,view=highSchoolCareerRouteView(opened);return enrollHighSchoolCollege(opened,opened.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'});}
function secondYear(){const first=completedCollegeAcademicYear(enrolledCollegeCareer()),closed=closeCollegeSeasonForNextYear(first,first.revision,true),c=startNextCollegeSeason(closed,closed.revision),p=c.world.players.own!;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,950000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};c.development!.seasonStartPlayer=structuredClone(p);c.seasonGrowth!.seasonStart=structuredClone(p);c.ownAssessment=createOwnCareerAssessment(c.world);return completedCollegeAcademicYear(c);}
function inventory(c:ReturnType<typeof secondYear>,budget=3_000_000):UsRecruitmentWorld{return {schemaVersion:1,worldKey:c.world.worldKey,seasonKey:String(c.world.calendar!.year+1),seed:c.world.seed,registeredPlayerKeys:[],clubs:[{id:'US01',name:'가상 미국 조직',rookieSlots:1,aSlots:1,availableBudgetUsd:budget,nationalReleaseAllowed:true,militaryReturnOption:false}]};}

test('E71 CHOOSE_FOCUS commits the actual first college PRE writer once and retains its source-bound receipt',()=>{
 const before=admitted(),e=notices.careerRouteNoticesView(before).notices.find(e=>e.definitionId==='E71')!,focus=['POWER','DEFENSE','RUNNING','CLUTCH'];
 assert.ok(!notices.careerRouteNoticesView(before).notices.find(n=>n.eventKey===e.eventKey)!.requiresDomainCommands.includes('CHOOSE_FOCUS'));
 assert.throws(()=>notices.chooseCollegeAdmissionFocus(before,before.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,focus}),/COLLEGE_FOCUS_NOT_AVAILABLE/);
 const closed=closeHighSchoolSeasonForCollege(before,before.revision,true),c=startAdmittedCollegeSeason(closed,closed.revision),raw=canonicalJson(c),input={eventKey:e.eventKey,eventVersion:e.eventVersion,focus};
 const changed=notices.chooseCollegeAdmissionFocus(c,c.revision,input);
 assert.equal(changed.revision,c.revision+1);assert.deepEqual(changed.world.players.own!.focus,focus);assert.deepEqual(changed.planHistory[0]!.focus,focus);
 assert.equal(changed.routeNotices!.notices.find(n=>n.eventKey===e.eventKey)!.resolution!.command,'CHOOSE_FOCUS');assert.equal(canonicalJson(changed.records),canonicalJson(c.records));assert.equal(canonicalJson(c),raw);
 assert.equal(canonicalJson(notices.chooseCollegeAdmissionFocus(JSON.parse(raw),c.revision,input)),canonicalJson(changed));
 assert.throws(()=>notices.chooseCollegeAdmissionFocus(changed,changed.revision,input),/NOT_OPEN|RESOLVED|AVAILABLE|VERSION/);
 assert.throws(()=>notices.chooseCollegeAdmissionFocus(c,c.revision-1,input),/REVISION/);assert.throws(()=>notices.chooseCollegeAdmissionFocus(c,c.revision,{...input,eventVersion:99}),/VERSION/);
 const forged=structuredClone(changed);forged.routeNotices!.collegeFocusChoices![0]!.receiptKey='forged';assert.throws(()=>notices.assertCareerRouteNotices(forged),/FOCUS/);
 assert.doesNotMatch(JSON.stringify(notices.careerRouteNoticesView(changed)),/potential|"seed"|"rng"/);
});

test('open E73 owns fixed US comparison without consuming early KBO eligibility; only actual US signing closes enrollment',()=>{
 const source=secondYear(),event=source.events.at(-1)!,raw=canonicalJson(source);assert.equal(event.definitionId,'E73');
 const c=prepareCareerUsDirect(source,source.revision,inventory(source)),offer=careerUsDirectView(c).offers[0]!;assert.ok(offer);
 const view=routes.collegeEarlyUsComparisonView(c);assert.ok(view.us);assert.ok(view.commands.includes('OPEN_US_IF_VALID'));
 const before=canonicalJson(c),nav=routes.openCollegeEarlyUsOffer(c,c.revision,event.version);assert.equal(nav.navigation!.targetScreen,'S29');assert.equal(nav.career,c);assert.equal(c.events.at(-1)!.status,'OPEN');assert.equal(c.collegeAdmission!.earlyDraftAttempted,undefined);assert.equal(c.collegeAdmission!.status,'ENROLLED');assert.equal(canonicalJson(source),raw);
 assert.throws(()=>prepareCareerUsDirect(c,c.revision,inventory(c)),/ALREADY_EXISTS/);assert.throws(()=>routes.openCollegeEarlyUsOffer(c,c.revision-1,event.version),/REVISION/);assert.throws(()=>routes.openCollegeEarlyUsOffer(c,c.revision,99),/VERSION/);
 const early=routes.enterCollegeEarlyDraft(c,c.revision,event.version);assert.equal(early.collegeAdmission!.earlyDraftAttempted,true);assert.equal(canonicalJson(early.usRecruitment!.program),canonicalJson(c.usRecruitment!.program));assert.equal(careerUsDirectView(early).visible,true);
 const noBudget=prepareCareerUsDirect(source,source.revision,inventory(source,0));assert.equal(routes.collegeEarlyUsComparisonView(noBudget).us,null);assert.deepEqual(routes.collegeEarlyUsComparisonView(noBudget).commands,[]);assert.throws(()=>routes.openCollegeEarlyUsOffer(noBudget,noBudget.revision,event.version),/NOT_AVAILABLE/);
 const expired=advanceCareerUsNegotiation(c,c.revision,30);assert.equal(expired.events.at(-1)!.definitionId,'E73');assert.equal(expired.events.at(-1)!.status,'OPEN');assert.equal(expired.collegeAdmission!.earlyDraftAttempted,undefined);assert.throws(()=>routes.openCollegeEarlyUsOffer(expired,expired.revision,event.version),/NOT_AVAILABLE/);
 const input={programVersion:1,decision:{type:'SIGN' as const,offerKey:offer.offerKey},eventVersion:event.version},signed=decideCareerUsDirect(c,c.revision,input);
 assert.equal(signed.collegeAdmission!.status,'LEFT_FOR_PRO');assert.equal(signed.collegeAdmission!.earlyDraftAttempted,undefined);assert.equal(signed.events.find(e=>e.eventKey===event.eventKey)!.resolution!.receiptKey,signed.usRecruitment!.program.signing!.receiptKey);assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');
 assert.equal(canonicalJson(decideCareerUsDirect(JSON.parse(before),c.revision,input)),canonicalJson(signed));assertUsAmateurYearEnd(closeSchoolSeasonForUs(signed,signed.revision,true));assert.equal(canonicalJson(c),before);assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeAcademicYear} from './fixtures.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft,careerKboDraftView} from '../src/career-kbo.js';
import {graduateCollegeCareer} from '../src/college-graduation.js';
import {closeSchoolSeasonForKbo} from '../src/kbo-entry.js';
import {startSignedKboCareer} from '../src/kbo-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {createSeasonGrowthLedger} from '../src/growth-ledger.js';

/** Existing controlled college contributions/cup worker; draft, contract and activation below are real commands. */
function secondYear(strength=800000){
 const first=completedCollegeAcademicYear(),ready=closeCollegeSeasonForNextYear(first,first.revision,true),start=startNextCollegeSeason(ready,ready.revision),p=start.world.players.own!;
 p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,strength]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};start.development!.seasonStartPlayer=structuredClone(p);
 // The controlled override replaces the opening snapshot; rebuild its range and growth baseline from it.
 delete start.ownAssessment;start.seasonGrowth=createSeasonGrowthLedger(p,start.world.seasonKey,start.world.calendar!.growthDays.length);
 return completedCollegeAcademicYear(start);
}
test('second completed college year attaches one E73; entering early draft is versioned, immutable and once per enrollment',async()=>{
 const source=secondYear(),event=source.events.at(-1)!,raw=canonicalJson(source);assert.equal(event.definitionId,'E73');
 const {enterCollegeEarlyDraft,collegeEarlyRouteView}=await import('../src/college-route.js');
 assert.equal(source.phaseContext.phase,'EVENT_DECISION');assert.equal(event.evidence.fields.academicYear,2);assert.equal(event.evidence.fields.sourceTaskId,source.collegeResult!.receiptKey);
 assert.throws(()=>enterCollegeEarlyDraft(source,source.revision-1,event.version),/REVISION/);assert.throws(()=>enterCollegeEarlyDraft(source,source.revision,event.version+1),/VERSION/);
 const opened=enterCollegeEarlyDraft(JSON.parse(JSON.stringify(source)),source.revision,event.version);assert.equal(opened.phaseContext.phase,'CAREER_ROUTE');assert.equal(opened.collegeAdmission!.earlyDraftAttempted,true);assert.equal(opened.collegeAdmission!.status,'ENROLLED');assert.equal(opened.world.players.own!.age,20);assert.deepEqual(opened.records,source.records);assert.equal(canonicalJson(source),raw);
 assert.throws(()=>enterCollegeEarlyDraft(opened,opened.revision,event.version),/PHASE|ATTEMPT/);const view=collegeEarlyRouteView(opened);assert.equal(view.academicYear,2);assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"|sourceBasis/);
 const prepared=prepareCareerKboDraft(opened,opened.revision),drawn=resolveCareerKboDraft(prepared,prepared.revision,1);assert.ok(drawn.kboRecruitment!.program.result);assert.throws(()=>prepareCareerKboDraft(drawn,drawn.revision),/ALREADY/);
});
test('real undrafted second-year result opens E74 and preserves third-year enrollment plus independent graduation draft',async()=>{
 let source=secondYear(10000);assert.equal(source.events.at(-1)!.definitionId,'E73');const {enterCollegeEarlyDraft,returnUnsignedCollegeCareer}=await import('../src/college-route.js');
 source=enterCollegeEarlyDraft(source,source.revision,source.events.at(-1)!.version);source=prepareCareerKboDraft(source,source.revision);source=resolveCareerKboDraft(source,source.revision,1);assert.equal(source.kboRecruitment!.program.result!.round,null);assert.equal(source.events.at(-1)!.definitionId,'E74');
 const before=canonicalJson(source),event=source.events.at(-1)!,returned=returnUnsignedCollegeCareer(JSON.parse(JSON.stringify(source)),source.revision,event.version);assert.equal(returned.phaseContext.phase,'OFFSEASON_REVIEW');assert.equal(returned.collegeAdmission!.earlyDraftAttempted,true);assert.equal(returned.kboRecruitment,undefined);assert.equal(returned.previousKboRecruitments!.length,1);assert.equal(canonicalJson(source),before);
 const closed=closeCollegeSeasonForNextYear(returned,returned.revision,true),third=startNextCollegeSeason(closed,closed.revision);assert.equal(third.collegeAdmission!.academicYear,3);assert.equal(third.collegeAdmission!.yearsCompleted,2);assert.equal(third.world.players.own!.age,21);assert.equal(third.records.revision,source.records.revision);
 let fourth=completedCollegeAcademicYear(third);fourth=closeCollegeSeasonForNextYear(fourth,fourth.revision,true);fourth=startNextCollegeSeason(fourth,fourth.revision);fourth=completedCollegeAcademicYear(fourth);fourth=graduateCollegeCareer(fourth,fourth.revision,fourth.events.at(-1)!.version);
 const graduation=prepareCareerKboDraft(fourth,fourth.revision);assert.notEqual(graduation.kboRecruitment!.program.assessmentKey,source.kboRecruitment!.program.assessmentKey);assert.equal(graduation.previousKboRecruitments!.length,1);
});
test('declining a real early offer permits school return; signing ends enrollment and activates the existing pro contract',async()=>{
 let source=secondYear();assert.equal(source.events.at(-1)!.definitionId,'E73');const {enterCollegeEarlyDraft,returnUnsignedCollegeCareer}=await import('../src/college-route.js');source=enterCollegeEarlyDraft(source,source.revision,source.events.at(-1)!.version);source=prepareCareerKboDraft(source,source.revision);source=resolveCareerKboDraft(source,source.revision,1);assert.ok(careerKboDraftView(source).result!.round);
 const declined=decideCareerKboDraft(source,source.revision,{programVersion:2,decision:'DECLINE'});assert.equal(declined.events.at(-1)!.definitionId,'E74');assert.equal(returnUnsignedCollegeCareer(declined,declined.revision,declined.events.at(-1)!.version).collegeAdmission!.status,'ENROLLED');
 const signed=decideCareerKboDraft(source,source.revision,{programVersion:2,decision:'SIGN'});assert.equal(signed.collegeAdmission!.status,'LEFT_FOR_PRO');assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');assert.throws(()=>returnUnsignedCollegeCareer(signed,signed.revision,1),/REGISTRATION|SIGNED|PHASE/);assert.throws(()=>closeCollegeSeasonForNextYear(signed,signed.revision,true),/REGISTRATION/);
 const closed=closeSchoolSeasonForKbo(signed,signed.revision,true),pro=startSignedKboCareer(closed,closed.revision);assert.equal(pro.world.players.own!.age,21);assert.equal(pro.amateurHistory.collegeAdmission!.status,'LEFT_FOR_PRO');assert.deepEqual(pro.records,signed.records);
});

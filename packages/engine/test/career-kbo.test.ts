import {startSignedKboCareer} from '../src/kbo-career-entry.js';
import {closeSchoolSeasonForKbo,assertKboAmateurYearEnd} from '../src/kbo-entry.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer,completedCollegeAcademicYear} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft,careerKboDraftView} from '../src/career-kbo.js';
import {graduateCollegeCareer} from '../src/college-graduation.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {canonicalJson} from '../src/game.js';
const opened=(kind:'HITTER'|'PITCHER'='HITTER')=>{const s=completedHighSchoolCareer(800_000,kind),r=acknowledgeHighSchoolSeasonReview(s,s.revision);return openHighSchoolCareerRoute(r,r.revision,1).career;};
test('HS career route→actual KBO preview→fixed result→signed next-season contract preserves all school books/records/budgets',()=>{
 for(const kind of ['HITTER','PITCHER'] as const){const source=opened(kind),before=canonicalJson(source),prepared=prepareCareerKboDraft(source,source.revision,'LG'),preview=careerKboDraftView(prepared);
 assert.equal(preview.status,'PREVIEW');assert.equal(highSchoolCareerRouteView(prepared).kbo.status,'PREVIEW');assert.equal(prepared.kboRecruitment!.world.seasonKey,'2030');assert.equal(source.world.players.own!.age,18);
 const drawn=resolveCareerKboDraft(prepared,prepared.revision,1);assert.ok(careerKboDraftView(drawn).result!.round);assert.deepEqual(resolveCareerKboDraft(drawn,drawn.revision,2),drawn);
 const signed=decideCareerKboDraft(drawn,drawn.revision,{programVersion:2,decision:'SIGN',eventVersion:1});assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');assert.ok(signed.phaseContext.phase==='NEXT_SEASON_READY' && signed.phaseContext.route==='KBO');assert.equal(signed.events.at(-1)!.resolution!.command,'ACCEPT_CAREER_OFFER');assert.equal(careerKboDraftView(signed).status,'SIGNED');
 for(const key of ['world','records','health','days','development','seasonGrowth'] as const)assert.deepEqual(signed[key],source[key]);assert.equal(signed.world.players.own!.age,18);assert.equal(canonicalJson(source),before);assert.throws(()=>decideCareerKboDraft(signed,signed.revision,{programVersion:3,decision:'SIGN',eventVersion:2}));
 }});
test('declined draft keeps college admission legal, archives assessment and forbids later silent pro-world reroll',()=>{
 const source=opened(),prepared=prepareCareerKboDraft(source,source.revision),drawn=resolveCareerKboDraft(prepared,prepared.revision,1),declined=decideCareerKboDraft(drawn,drawn.revision,{programVersion:2,decision:'DECLINE'}),view=highSchoolCareerRouteView(declined);
 assert.equal(view.kbo.status,'DECLINED');assert.equal(declined.events.at(-1)!.status,'OPEN');
 const college=enrollHighSchoolCollege(declined,declined.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'});assert.equal(college.collegeAdmission!.status,'ADMITTED');assert.equal(college.kboRecruitment,undefined);assert.equal(college.previousKboRecruitments!.length,1);assert.equal(college.previousKboRecruitments![0]!.program.decision,'DECLINED');
});
test('career stale revision/player/world/book/program or event version cannot partially sign; repeat prepare cannot reroll',()=>{
 const source=opened(),prepared=prepareCareerKboDraft(source,source.revision),drawn=resolveCareerKboDraft(prepared,prepared.revision,1),before=canonicalJson(drawn);
 assert.throws(()=>prepareCareerKboDraft(prepared,prepared.revision),/ALREADY_EXISTS/);assert.throws(()=>resolveCareerKboDraft(prepared,0,1),/REVISION/);
 assert.throws(()=>decideCareerKboDraft(drawn,drawn.revision,{programVersion:2,decision:'SIGN',eventVersion:0}),/VERSION/);
 const bad=structuredClone(drawn);bad.world.players.own!.fatigue++;assert.throws(()=>careerKboDraftView(bad),/STALE/);assert.throws(()=>prepareCareerKboDraft(enrolledCollegeCareer(),0));const forged=structuredClone(drawn);forged.kboRecruitment!.program.input.baseScore--;forged.kboRecruitment!.program.sourceBasis=canonicalJson({world:forged.kboRecruitment!.world,input:forged.kboRecruitment!.program.input});assert.throws(()=>careerKboDraftView(forged),/EVALUATION/);assert.throws(()=>highSchoolCareerRouteView(forged),/EVALUATION/);assert.equal(canonicalJson(drawn),before);
});
test('college E75 graduation uses college-adjusted B and next-season reservation, without repeating degree or advancing age',()=>{
 let s=enrolledCollegeCareer();for(let year=1;year<=4;year++){s=completedCollegeAcademicYear(s);if(year<4){s=closeCollegeSeasonForNextYear(s,s.revision,true);s=startNextCollegeSeason(s,s.revision);}}
 const degree=graduateCollegeCareer(s,s.revision,s.events.at(-1)!.version),before=canonicalJson(degree),prepared=prepareCareerKboDraft(degree,degree.revision),p=prepared.kboRecruitment!.program;
 const overall=Object.values(degree.world.players.own!.abilities).reduce((a,b)=>a+b,0)/60_000;assert.equal(p.input.baseScore,.7*overall+.3*32);assert.equal(prepared.kboRecruitment!.world.seasonKey,'2034');
 const drawn=resolveCareerKboDraft(prepared,prepared.revision,1),view=careerKboDraftView(drawn);assert.equal(view.status,'RESULT');assert.ok(view.result!.round);const signed=decideCareerKboDraft(drawn,drawn.revision,{programVersion:2,decision:'SIGN'});assert.equal(signed.kboRecruitment!.program.decision,'SIGNED');assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(signed.collegeAdmission!.status,'GRADUATED');assert.equal(drawn.collegeAdmission!.status,'GRADUATED');assert.equal(drawn.world.players.own!.age,22);assert.deepEqual(drawn.records,degree.records);assert.equal(canonicalJson(degree),before);
 const closed=closeSchoolSeasonForKbo(signed,signed.revision,true);assertKboAmateurYearEnd(closed);assert.equal(careerKboDraftView(closed).status,'SIGNED');assert.equal(closed.world.players.own!.age,22);assert.equal(closed.collegeAdmission!.status,'GRADUATED');assert.deepEqual(closed.records,signed.records);assert.deepEqual(closed.kboRecruitment,signed.kboRecruitment);assert.equal(closed.seasonGrowth!.finalized,true);
 const entered=startSignedKboCareer(closed,closed.revision);assert.equal(entered.world.seasonKey,'2034');assert.equal(entered.world.players.own!.age,23);assert.equal(entered.amateurHistory.collegeAdmission!.status,'GRADUATED');assert.equal(canonicalJson(entered.records),canonicalJson(degree.records));assert.equal(Object.keys(entered.world.players).length,501);
});

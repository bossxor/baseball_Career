import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer,completedCollegeAcademicYear} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect,advanceCareerUsNegotiation} from '../src/career-us.js';
import type {UsRecruitmentWorld} from '../src/us-direct.js';
import {prepareUsDirect} from '../src/us-direct.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {graduateCollegeCareer,collegeGraduationRouteView} from '../src/college-graduation.js';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';
import {canonicalJson} from '../src/game.js';
const opened=(value=800_000,kind:'HITTER'|'PITCHER'='HITTER')=>{const s=completedHighSchoolCareer(value,kind),r=acknowledgeHighSchoolSeasonReview(s,s.revision);return openHighSchoolCareerRoute(r,r.revision,1).career;};
const inventory=(s:ReturnType<typeof opened>):UsRecruitmentWorld=>({schemaVersion:1,worldKey:s.world.worldKey,seasonKey:String(s.world.calendar!.year+1),seed:s.world.seed,registeredPlayerKeys:[],clubs:[{id:'US01',name:'가상 미국 조직',rookieSlots:1,aSlots:1,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:false}]});
test('HS hitter/pitcher: fixed US offers appear only with valid offers; signing preserves school history/age/growth and reserves minors',()=>{
 for(const kind of ['HITTER','PITCHER'] as const){const s=opened(800_000,kind),before=canonicalJson(s),p=prepareCareerUsDirect(s,s.revision,inventory(s)),v=careerUsDirectView(p);assert.ok(v.visible);assert.ok(highSchoolCareerRouteView(p).us);assert.equal(v.offers.length,1);assert.equal(canonicalJson(s),before);assert.throws(()=>prepareCareerUsDirect(p,p.revision,inventory(s)),/ALREADY_EXISTS/);
 const signed=decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'SIGN',offerKey:v.offers[0]!.offerKey},eventVersion:1});assert.deepEqual(signed.phaseContext,{phase:'NEXT_SEASON_READY',route:'US',contractKey:signed.usRecruitment!.program.signing!.contract.contractKey});assert.equal(signed.events.at(-1)!.status,'RESOLVED');assert.equal(signed.world.players.own!.age,18);for(const key of ['world','records','health','days','development','seasonGrowth'] as const)assert.deepEqual(signed[key],s[key]);assert.equal(careerUsDirectView(signed).status,'SIGNED');assert.throws(()=>decideCareerUsDirect(signed,signed.revision,{programVersion:2,decision:{type:'SIGN',offerKey:v.offers[0]!.offerKey},eventVersion:2}));}
});
test('average career hides US; declining all offers keeps domestic/college route and never rerolls',()=>{
 const average=opened(500_000),none=prepareCareerUsDirect(average,average.revision,inventory(average));assert.equal(careerUsDirectView(none).visible,false);assert.equal(highSchoolCareerRouteView(none).us,undefined);
 const s=opened(),p=prepareCareerUsDirect(s,s.revision,inventory(s)),d=decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'DECLINE'}}),v=highSchoolCareerRouteView(d);assert.equal(v.us,undefined);assert.equal(d.events.at(-1)!.status,'OPEN');
 const enrolled=enrollHighSchoolCollege(d,d.revision,{eventVersion:1,offerSetKey:v.offerSetKey,offerSetVersion:1,collegeId:'U07'});assert.equal(enrolled.usRecruitment,undefined);assert.equal(enrolled.previousUsRecruitments![0]!.closedBy,'COLLEGE');
});
test('career US: forged score input, world/player drift, stale revision/event cannot sign partially',()=>{
 const s=opened(),p=prepareCareerUsDirect(s,s.revision,inventory(s)),before=canonicalJson(p),key=careerUsDirectView(p).offers[0]!.offerKey;
 assert.throws(()=>decideCareerUsDirect(p,0,{programVersion:1,decision:{type:'SIGN',offerKey:key},eventVersion:1}),/REVISION/);assert.throws(()=>decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'SIGN',offerKey:key},eventVersion:0}),/VERSION/);
 const bad=structuredClone(p);bad.world.players.own!.fatigue++;assert.throws(()=>careerUsDirectView(bad),/STALE/);
 const forged=structuredClone(p),r=forged.usRecruitment!;r.program=prepareUsDirect(r.world,{...r.program.input,adjustedPerformance:100});assert.throws(()=>careerUsDirectView(forged),/EVALUATION/);assert.equal(canonicalJson(p),before);
});
test('competing KBO/US signing closes the alternative without two active contracts or loss of old recruitment history',()=>{
 const s=opened(),u=prepareCareerUsDirect(s,s.revision,inventory(s)),k=prepareCareerKboDraft(u,u.revision),drawn=resolveCareerKboDraft(k,k.revision,1),v=careerUsDirectView(drawn);
 const us=decideCareerUsDirect(drawn,drawn.revision,{programVersion:1,decision:{type:'SIGN',offerKey:v.offers[0]!.offerKey},eventVersion:1});assert.equal(us.kboRecruitment,undefined);assert.equal(us.previousKboRecruitments!.at(-1)!.program.decision,'DECLINED');
 const kr=decideCareerKboDraft(drawn,drawn.revision,{programVersion:2,decision:'SIGN',eventVersion:1});assert.equal(kr.usRecruitment,undefined);assert.equal(kr.previousUsRecruitments!.at(-1)!.closedBy,'KBO');assert.equal(kr.kboRecruitment!.program.decision,'SIGNED');assert.equal(drawn.usRecruitment!.program.decision,'PENDING');
});

test('career offer deadline is30 game days; clock persists, expiry hides US and preserves domestic/college paths',()=>{
 const s=opened(),p=prepareCareerUsDirect(s,s.revision,inventory(s)),original=canonicalJson(p.usRecruitment!.program),key=careerUsDirectView(p).offers[0]!.offerKey;assert.equal(p.usRecruitment!.program.input.expiresWorldDay,p.usRecruitment!.program.input.issuedWorldDay+30);
 const almost=advanceCareerUsNegotiation(p,p.revision,29);assert.ok(careerUsDirectView(almost).visible);const expired=advanceCareerUsNegotiation(almost,almost.revision,100);assert.equal(careerUsDirectView(expired).status,'EXPIRED');assert.equal(highSchoolCareerRouteView(expired).us,undefined);assert.equal(canonicalJson(expired.usRecruitment!.program),original);assert.equal(expired.usRecruitment!.currentWorldDay,p.usRecruitment!.program.input.expiresWorldDay);assert.deepEqual(careerUsDirectView(JSON.parse(JSON.stringify(expired))),careerUsDirectView(expired));
 assert.throws(()=>decideCareerUsDirect(expired,expired.revision,{programVersion:1,decision:{type:'SIGN',offerKey:key},eventVersion:1}),/EXPIRED/);assert.deepEqual(advanceCareerUsNegotiation(expired,expired.revision,1),expired);assert.throws(()=>advanceCareerUsNegotiation(p,p.revision,-1));assert.equal(expired.events.at(-1)!.status,'OPEN');assert.ok(highSchoolCareerRouteView(expired).colleges.some(c=>c.eligible));
});

test('college graduation US comparison uses adjusted college performance and never reopens E75 or college enrollment',()=>{
 let s=enrolledCollegeCareer();
 // Controlled high-ability fixture exercises the legal college-signing branch; this is not natural growth.
 const player=s.world.players.own!;player.abilities=Object.fromEntries(Object.keys(player.abilities).map(key=>[key,950_000]));player.potential={...player.abilities};player.careerPeaks={...player.abilities};s.development!.seasonStartPlayer=structuredClone(player);assert.equal(s.seasonGrowth!.entries.length,0);s.seasonGrowth!.seasonStart=structuredClone(player);s.ownAssessment=createOwnCareerAssessment(s.world);
 for(let year=1;year<=4;year++){s=completedCollegeAcademicYear(s);if(year<4){s=closeCollegeSeasonForNextYear(s,s.revision,true);s=startNextCollegeSeason(s,s.revision);}}
 const degree=graduateCollegeCareer(s,s.revision,s.events.at(-1)!.version),before=canonicalJson(degree),p=prepareCareerUsDirect(degree,degree.revision,inventory(degree)),v=careerUsDirectView(p);assert.equal(p.usRecruitment!.program.input.adjustedPerformance,32);assert.equal(p.collegeAdmission!.status,'GRADUATED');assert.ok(v.visible);const signed=decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'SIGN',offerKey:v.offers[0]!.offerKey}});assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(signed.collegeAdmission!.status,'GRADUATED');assert.equal(signed.events.at(-1)!.status,'RESOLVED');assert.deepEqual(signed.records,degree.records);assert.equal(p.world.players.own!.age,22);assert.equal(Boolean(collegeGraduationRouteView(p).us),v.visible);assert.equal(canonicalJson(degree),before);
 const declined=decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'DECLINE'}});assert.equal(declined.phaseContext.phase,'CAREER_ROUTE');assert.equal(collegeGraduationRouteView(declined).us,undefined);assert.equal(declined.events.at(-1)!.definitionId,'E75');assert.equal(declined.events.at(-1)!.status,'RESOLVED');
});

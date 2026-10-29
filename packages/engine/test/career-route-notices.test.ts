import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer,completedCollegeRegularSeason} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect,advanceCareerUsNegotiation} from '../src/career-us.js';
import {startCollegeCup} from '../src/college-cup.js';
import {startCareerPreparation} from '../src/career-preparation.js';
import {refreshCareerRouteNotices,careerRouteNoticesView,resolveCareerRouteNotice,assertCareerRouteNotices} from '../src/career-route-notices.js';
import type {RouteNoticeCareer} from '../src/career-route-notices.js';
import type {UsRecruitmentWorld} from '../src/us-direct.js';
import {canonicalJson} from '../src/game.js';
function opened(value=800_000){const c=completedHighSchoolCareer(value),reviewed=acknowledgeHighSchoolSeasonReview(c,c.revision);return openHighSchoolCareerRoute(reviewed,reviewed.revision,1).career;}
function inventory(c:ReturnType<typeof opened>,budget=3_000_000):UsRecruitmentWorld{return {schemaVersion:1,worldKey:c.world.worldKey,seasonKey:String(Number(c.world.seasonKey)+1),seed:c.world.seed,registeredPlayerKeys:[],clubs:[{id:'US01',name:'가상 미국 조직',rookieSlots:1,aSlots:1,availableBudgetUsd:budget,nationalReleaseAllowed:true,militaryReturnOption:false}]};}
function draft(value:number){let c=opened(value);c=prepareCareerKboDraft(c,c.revision);return refreshCareerRouteNotices(resolveCareerKboDraft(c,c.revision,1));}
const notices=(c:RouteNoticeCareer,id:string)=>careerRouteNoticesView(c).notices.filter(e=>e.definitionId===id);

test('E05/E06 bind actual native draft receipts; navigation cannot fabricate a contract or consume retry usage',()=>{
 const drafted=draft(800_000),before=canonicalJson(drafted),e=notices(drafted,'E05')[0]!;assert.ok(e);assert.equal(notices(drafted,'E06').length,0);assert.deepEqual(e.commands,[]);assert.ok(e.requiresDomainCommands.includes('ACCEPT_CAREER_OFFER'));
 assert.throws(()=>resolveCareerRouteNotice(drafted,drafted.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACCEPT_CAREER_OFFER'}),/REQUIRES_DOMAIN_COMMAND/);assert.throws(()=>resolveCareerRouteNotice(drafted,drafted.revision,{eventKey:e.eventKey,eventVersion:99,command:'DECLINE_DRAFT'}),/VERSION/);assert.equal(canonicalJson(drafted),before);
 const signed=refreshCareerRouteNotices(decideCareerKboDraft(drafted,drafted.revision,{programVersion:2,decision:'SIGN',eventVersion:1}));assert.equal(notices(signed,'E05')[0]!.status,'RESOLVED');assert.equal(signed.kboRecruitment!.program.decision,'SIGNED');assertCareerRouteNotices(signed);
 const undrafted=draft(10000),u=notices(undrafted,'E06')[0]!;assert.ok(u);const nav=resolveCareerRouteNotice(undrafted,undrafted.revision,{eventKey:u.eventKey,eventVersion:u.eventVersion,command:'OPEN_UNDRAFTED_ROUTES'});assert.equal(nav.navigation!.targetScreen,'S28');assert.equal(nav.career.revision,undrafted.revision);assert.equal(notices(nav.career,'E06')[0]!.status,'OPEN');
 const prepared=refreshCareerRouteNotices(startCareerPreparation(undrafted,undrafted.revision,1));assert.equal(notices(prepared,'E06')[0]!.status,'RESOLVED');assert.equal(prepared.preparation!.used,0);assert.equal(notices(prepared,'E05').length,0);assert.equal(canonicalJson(refreshCareerRouteNotices(prepared)),canonicalJson(prepared));
});

test('E56/E57 require genuine currently valid US offers; native signing/expiry owns their resolution',()=>{
 const c=opened(),p=refreshCareerRouteNotices(prepareCareerUsDirect(c,c.revision,inventory(c))),source=canonicalJson(p),view=careerUsDirectView(p);assert.ok(view.visible);const option=notices(p,'E56')[0]!,offer=notices(p,'E57')[0]!;assert.ok(option);assert.ok(offer);
 const nav=resolveCareerRouteNotice(p,p.revision,{eventKey:offer.eventKey,eventVersion:offer.eventVersion,command:'BACK_TO_ROUTE'});assert.equal(nav.navigation!.targetScreen,'S28');assert.equal(nav.career.usRecruitment!.program.decision,'PENDING');assert.equal(notices(nav.career,'E57')[0]!.status,'OPEN');
 assert.throws(()=>resolveCareerRouteNotice(p,p.revision,{eventKey:offer.eventKey,eventVersion:offer.eventVersion,command:'ACCEPT_CAREER_OFFER'}),/REQUIRES_DOMAIN_COMMAND/);assert.equal(canonicalJson(p),source);
 const signed=refreshCareerRouteNotices(decideCareerUsDirect(p,p.revision,{programVersion:1,decision:{type:'SIGN',offerKey:view.offers[0]!.offerKey},eventVersion:1}));assert.equal(notices(signed,'E56')[0]!.status,'RESOLVED');assert.equal(notices(signed,'E57')[0]!.status,'RESOLVED');assertCareerRouteNotices(signed);
 const expired=refreshCareerRouteNotices(advanceCareerUsNegotiation(p,p.revision,30));assert.equal(notices(expired,'E57')[0]!.status,'CANCELLED_WITH_REASON');assert.equal(expired.usRecruitment!.program.decision,'PENDING');
 const noBudget=refreshCareerRouteNotices(prepareCareerUsDirect(c,c.revision,inventory(c,0)));assert.equal(notices(noBudget,'E56').length,0);assert.equal(notices(noBudget,'E57').length,0);
});

test('E71 requires committed admission; E72 requires actual semifinal qualification and never invents a cup result',()=>{
 const c=opened(),v=highSchoolCareerRouteView(c);assert.equal(notices(refreshCareerRouteNotices(c),'E71').length,0);
 const admitted=refreshCareerRouteNotices(enrollHighSchoolCollege(c,c.revision,{eventVersion:1,offerSetKey:v.offerSetKey,offerSetVersion:v.offerSetVersion,collegeId:'U07'})),e=notices(admitted,'E71')[0]!;assert.ok(e);const before=canonicalJson(admitted),acked=resolveCareerRouteNotice(admitted,admitted.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACK_EVENT'}).career;assert.equal(notices(acked,'E71')[0]!.status,'RESOLVED');assert.deepEqual(acked.collegeAdmission,admitted.collegeAdmission);assert.deepEqual(acked.world,admitted.world);assert.equal(canonicalJson(admitted),before);
 const regular=completedCollegeRegularSeason(enrolledCollegeCareer(),true),qualified=refreshCareerRouteNotices(startCollegeCup(regular,regular.revision));assert.equal(notices(qualified,'E72').length,1);assert.equal(qualified.collegeCup!.championKey,null);assert.equal(Object.values(qualified.records.games).filter(g=>g.scope.phase==='POSTSEASON').length,0);
 const nonQualifier=completedCollegeRegularSeason();const outside=refreshCareerRouteNotices(startCollegeCup(nonQualifier,nonQualifier.revision));assert.equal(notices(outside,'E72').length,0);
});

test('route notice guards reject forged source/resolution, stale root/event versions, and preserve originals',()=>{
 const c=draft(800_000),e=notices(c,'E05')[0]!,raw=canonicalJson(c),fake=structuredClone(c) as RouteNoticeCareer;
 fake.routeNotices!.notices[0]!.status='RESOLVED';fake.routeNotices!.notices[0]!.resolution={kind:'ACK',command:'ACK_EVENT',receiptKey:null,reason:null};assert.throws(()=>assertCareerRouteNotices(fake));
 const forged=structuredClone(c) as RouteNoticeCareer;forged.kboRecruitment!.program.result!.receiptKey='forged';assert.throws(()=>assertCareerRouteNotices(forged));
 assert.throws(()=>resolveCareerRouteNotice(c,c.revision-1,{eventKey:e.eventKey,eventVersion:1,command:'DECLINE_DRAFT'}),/REVISION/);assert.equal(canonicalJson(c),raw);assert.deepEqual(careerRouteNoticesView(JSON.parse(JSON.stringify(c))),careerRouteNoticesView(c));assert.doesNotMatch(JSON.stringify(careerRouteNoticesView(c)),/potential|"seed"|"rng"|sourceBasis/);
});

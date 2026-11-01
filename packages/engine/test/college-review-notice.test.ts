import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {careerRouteNoticesView,resolveCareerRouteNotice,refreshCareerRouteNotices,assertCareerRouteNotices} from '../src/career-route-notices.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../src/college-entry.js';
import {canonicalJson} from '../src/game.js';
function opened(value=800000){let c=completedHighSchoolCareer(value);c=acknowledgeHighSchoolSeasonReview(c,c.revision);return openHighSchoolCareerRoute(c,c.revision,1).career;}
const notice=(c:ReturnType<typeof opened>)=>careerRouteNoticesView(c).notices.find(n=>n.definitionId==='E70')!;

test('E70 uses actual pre-admission route task, navigation never enrolls, admission closes its real receipt and survives JSON/activation',()=>{
 const c=opened(),n=notice(c),view=highSchoolCareerRouteView(c);assert.ok(n);assert.equal(c.collegeAdmission,undefined);const event=c.routeNotices!.notices.find(e=>e.eventKey===n.eventKey)!;assert.equal(event.evidence.fields.routeOfferSetId,view.offerSetKey);assert.equal(Object.hasOwn(event.evidence.fields,'enrollmentId'),false);const raw=canonicalJson(c),input={eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_COLLEGES'};const nav=resolveCareerRouteNotice(c,c.revision,input);assert.equal(nav.navigation!.targetScreen,'S34');assert.equal(nav.career,c);assert.equal(notice(nav.career).status,'OPEN');
 assert.throws(()=>resolveCareerRouteNotice(c,c.revision-1,input),/REVISION/);assert.throws(()=>resolveCareerRouteNotice(c,c.revision,{...input,eventVersion:99}),/VERSION/);
 const admitted=enrollHighSchoolCollege(c,c.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:view.offerSetVersion,collegeId:'U07'});assert.equal(notice(admitted).status,'RESOLVED');assert.equal(admitted.routeNotices!.notices.find(e=>e.eventKey===n.eventKey)!.resolution!.receiptKey,admitted.collegeAdmission!.admissionKey);assert.equal(canonicalJson(c),raw);assert.deepEqual(resolveCareerRouteNotice(JSON.parse(JSON.stringify(c)),c.revision,input),nav);assert.deepEqual(admitted.records,c.records);assert.equal(refreshCareerRouteNotices(admitted),admitted);
 const closed=closeHighSchoolSeasonForCollege(admitted,admitted.revision,true),next=startAdmittedCollegeSeason(closed,closed.revision);assertCareerRouteNotices(next);assert.equal(notice(next).status,'RESOLVED');assert.deepEqual(careerRouteNoticesView(JSON.parse(JSON.stringify(next))),careerRouteNoticesView(next));
});

test('E70 keeps legitimate fallback schools and closes only from a real competing route; forged offer/task/context fails',()=>{
 assert.ok(notice(opened(10000))); // U07..U09 explicitly admit overall1; do not invent a higher gate.
let c=opened();for(const mutate of [(x:typeof c)=>{const e=x.routeNotices!.notices.find(e=>e.definitionId==='E70')!;e.evidence={...e.evidence,fields:{...e.evidence.fields,routeOfferSetId:'forged'}};},(x:typeof c)=>{const e=x.routeNotices!.notices.find(e=>e.definitionId==='E70')!;e.evidence={...e.evidence,fields:{...e.evidence.fields,sourceTaskId:'fake'}};},(x:typeof c)=>{x.routeNotices!.notices.find(e=>e.definitionId==='E70')!.resume.registrationKey='fake';}]){const bad=structuredClone(c);mutate(bad);const before=canonicalJson(bad);assert.throws(()=>assertCareerRouteNotices(bad));assert.equal(canonicalJson(bad),before);}
 c=prepareCareerKboDraft(c,c.revision);c=resolveCareerKboDraft(c,c.revision,1);const signed=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'SIGN',eventVersion:1});assert.equal(notice(signed).status,'CANCELLED_WITH_REASON');assert.equal(signed.collegeAdmission,undefined);assertCareerRouteNotices(signed);
});

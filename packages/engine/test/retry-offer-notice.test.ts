import {createWorldEvent} from '../src/events.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {startCareerPreparation,confirmPreparationPreseason,advanceCareerPreparation,settleCareerPreparation} from '../src/career-preparation.js';
import {resolveCareerWindowEvent} from '../src/high-school-progress.js';
import {resolveHiddenTraitNotice} from '../src/trait-notices.js';
import {careerRouteNoticesView,refreshCareerRouteNotices,resolveCareerRouteNotice,assertCareerRouteNotices} from '../src/career-route-notices.js';
import {canonicalJson} from '../src/game.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';

let cached:HighSchoolCareer|undefined;
function ready(){
 if(cached)return structuredClone(cached);
 let c=completedHighSchoolCareer(800000);c=acknowledgeHighSchoolSeasonReview(c,c.revision);c=openHighSchoolCareerRoute(c,c.revision,1).career;c=prepareCareerKboDraft(c,c.revision);c=resolveCareerKboDraft(c,c.revision,1);c=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'DECLINE'});c=startCareerPreparation(c,c.revision,1);
 assert.equal(careerRouteNoticesView(c).notices.some(e=>e.definitionId==='E07'),false);assert.throws(()=>prepareCareerKboDraft(c,c.revision),/PHASE/);
 c=confirmPreparationPreseason(c,c.revision);
 for(let i=0;i<1500&&c.phaseContext.phase!=='SEASON_REVIEW';i++){
  if(c.phaseContext.phase==='EVENT_DECISION'){const event=c.events.find(e=>e.eventKey===(c.phaseContext as {eventKey:string}).eventKey)!;c=event.definitionId==='E84'?resolveHiddenTraitNotice(c,c.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAITS'}).career:resolveCareerWindowEvent(c,c.revision,{eventKey:event.eventKey,eventVersion:event.version,command:event.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT'}).career;}
  else {const out=advanceCareerPreparation(c,c.revision,'ONE_MONTH');assert.notEqual(out.stopReason,'ENGINE_LIMIT');c=out.career;}
 }
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');c=settleCareerPreparation(c,c.revision,true);c=prepareCareerKboDraft(c,c.revision);cached=resolveCareerKboDraft(c,c.revision,1);assert.ok(cached.kboRecruitment!.program.result!.round);return structuredClone(cached);
}
const notice=(c:HighSchoolCareer)=>careerRouteNoticesView(c).notices.find(e=>e.definitionId==='E07')!;

test('native preparation retry publishes E07 once, navigation cannot sign, native signing closes it and preserves all receipts',()=>{
 const c=ready(),e=notice(c),raw=canonicalJson(c);assert.ok(e);assert.equal(c.preparation!.used,1);assert.equal(careerRouteNoticesView(c).notices.filter(n=>n.definitionId==='E05').length,1);
 assert.equal(c.routeNotices!.notices.find(n=>n.eventKey===e.eventKey)!.seasonKey,c.world.seasonKey);
 const nav=resolveCareerRouteNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'REQUEST_RETIRE'});assert.equal(nav.navigation!.targetScreen,'S09');assert.equal(nav.career,c);assert.equal(notice(nav.career).status,'OPEN');
 assert.throws(()=>resolveCareerRouteNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACCEPT_CAREER_OFFER'}),/REQUIRES_DOMAIN/);assert.throws(()=>resolveCareerRouteNotice(c,c.revision-1,{eventKey:e.eventKey,eventVersion:1,command:'REQUEST_RETIRE'}),/REVISION/);assert.throws(()=>resolveCareerRouteNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:99,command:'REQUEST_RETIRE'}),/VERSION/);
 const signed=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'SIGN'});assert.equal(notice(signed).status,'RESOLVED');assert.equal(signed.routeNotices!.notices.find(n=>n.eventKey===e.eventKey)!.resolution!.receiptKey,signed.kboRecruitment!.program.signing!.receiptKey);assert.deepEqual(signed.records,c.records);assert.deepEqual(signed.preparation,c.preparation);assert.deepEqual(signed.seasonGrowth,c.seasonGrowth);assert.equal(canonicalJson(c),raw);assert.equal(refreshCareerRouteNotices(signed),signed);assert.deepEqual(careerRouteNoticesView(JSON.parse(JSON.stringify(signed))),careerRouteNoticesView(signed));
});

test('retry notice rejects missing preparation, changed result/growth/closed records without changing input',()=>{
 const source=ready();assert.ok(notice(source));
 for(const change of [(c:HighSchoolCareer)=>{delete c.preparation;},(c:HighSchoolCareer)=>{c.preparation!.seasons[0]!.receiptKey='forged';},(c:HighSchoolCareer)=>{c.seasonGrowth!.finalized=false;},(c:HighSchoolCareer)=>{delete c.records.games[c.world.schedule[0]!.simulationKey];}]){const c=structuredClone(source);change(c);const raw=canonicalJson(c);assert.throws(()=>assertCareerRouteNotices(c));assert.equal(canonicalJson(c),raw);}
});

test('declining a retry offer cancels only that task and historical evidence remains valid during the next preparation',()=>{
 const c=ready(),declined=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'DECLINE'});assert.equal(notice(declined).status,'CANCELLED_WITH_REASON');const next=startCareerPreparation(declined,declined.revision);assert.equal(next.preparation!.used,1);assert.equal(notice(next).status,'CANCELLED_WITH_REASON');assertCareerRouteNotices(next);assert.deepEqual(careerRouteNoticesView(JSON.parse(JSON.stringify(next))),careerRouteNoticesView(next));
 const forged=structuredClone(next);forged.previousSeasons!.find(s=>s.world.leagueKey==='INDEPENDENT')!.seasonGrowth.finalized=false;assert.throws(()=>assertCareerRouteNotices(forged));
});


test('older retry E05 notices remain readable without a second offer and ambiguous duplicate publications reject',()=>{
 const c=ready(),current=c.routeNotices!.notices.find(e=>e.definitionId==='E07')!;
 const legacy=createWorldEvent({definitionId:'E05',worldKey:current.worldKey,seasonKey:current.seasonKey,evidence:current.evidence,resume:current.resume,sourceSequence:current.sourceSequence,worldDay:current.occurredWorldDay});
 c.routeNotices={...c.routeNotices!,notices:c.routeNotices!.notices.map(e=>e.eventKey===current.eventKey?legacy:e)};
 assertCareerRouteNotices(c);assert.equal(refreshCareerRouteNotices(c),c);assert.equal(careerRouteNoticesView(c).notices.some(e=>e.definitionId==='E07'),false);
 const signed=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'SIGN'});assert.equal(signed.routeNotices!.notices.find(e=>e.eventKey===legacy.eventKey)!.status,'RESOLVED');
 const declined=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'DECLINE'}),closed=declined.routeNotices!.notices.find(e=>e.eventKey===legacy.eventKey)!;assert.equal(closed.status,'RESOLVED');assert.equal(closed.resolution!.command,'DECLINE_DRAFT');const next=startCareerPreparation(declined,declined.revision);assert.deepEqual(next.routeNotices!.notices.find(e=>e.eventKey===legacy.eventKey)!.resolution,closed.resolution);assertCareerRouteNotices(next);
 const duplicate=structuredClone(c);duplicate.routeNotices!.notices=[...duplicate.routeNotices!.notices,current];assert.throws(()=>assertCareerRouteNotices(duplicate),/DUPLICATE/);
});

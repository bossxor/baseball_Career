import {unreadKboFirstCampNotices,resolveKboFirstCampNotice,confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as retry from '../src/us-return-retry.js';
import {requestUsAmateurReturn} from '../src/us-amateur-return-career.js';
import {canonicalJson} from '../src/game.js';
import {expiredRetryUsCareer,nativeUndraftedUsReturn} from './us-return-retry-fixture.js';
import {usCareerView} from '../src/us-career-entry.js';
import {unreadUsFirstCampNotices,resolveUsFirstCampNotice,confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {openUsMinorMarket,acceptUsMinorMarketOffer} from '../src/us-minor-market.js';

test('returned-US E35 rejects unfinished optional budget and unassessed routes',()=>{
 const origin=nativeUndraftedUsReturn(),c=retry.openUsAmateurReturnRetry(origin,origin.revision);
 assert.throws(()=>retry.openUsAmateurReturnRetryExhaustion(c,c.revision),/RETRY_ASSESSMENT_REQUIRED/);
 assert.equal(c.retry.careerPreparationUsed,0);assert.equal(c.status,'REVIEW');
});

test('returned retry US acceptance reserves one current-year contract and enters a real US date with full history',()=>{
 const origin=nativeUndraftedUsReturn(),base=retry.openUsAmateurReturnRetry(origin,origin.revision),c=retry.assessUsAmateurReturnRetryUsOpportunity(base,base.revision),view=retry.usAmateurReturnRetryRoutesView(c),q=c.usOpportunities![0]!,offer=q.offers.find(o=>o.organizationId!==origin.source.protagonistOrganizationId)??q.offers[0];assert.ok(offer);
 const input={routePreviewId:view.routePreviewId,offerKey:offer.offerKey},before=canonicalJson(c.retry);
 let us=retry.resignUsAfterAmateurReturnRetry(c,c.revision,input);
 assert.equal(us.world.seasonKey,q.world.seasonKey);assert.equal(us.world.players[c.retry.playerKey]!.age,c.retry.age+1);assert.equal(us.protagonistOrganizationId,offer.organizationId);assert.equal(us.contract.annualSalaryUsd,30000);assert.equal(us.usReturnContinuation!.remainingControlSeasons,1);assert.equal(us.income.reduce((n,e)=>n+e.amount,0),origin.source.income.reduce((n,e)=>n+e.amount,0));
 assert.equal(us.inventory.clubs.find(o=>o.id===offer.organizationId)!.availableBudgetUsd,q.inventory.clubs.find(o=>o.id===offer.organizationId)!.availableBudgetUsd-30000);
 assert.equal(canonicalJson(c.retry),before);assert.equal(canonicalJson(us.retryCareer),before);assert.ok(us.usAmateurReturnHistory);assert.ok(us.usAmateurReturnRetryHistory);usCareerView(us);
 assert.throws(()=>retry.resignUsAfterAmateurReturnRetry(c,c.revision-1,input),/REVISION/);
 assert.throws(()=>retry.resignUsAfterAmateurReturnRetry(c,c.revision,{...input,routePreviewId:'old'}),/PREVIEW_STALE/);
 us=JSON.parse(JSON.stringify(us));usCareerView(us);
 const forged={...us,usReturnContinuation:{...us.usReturnContinuation!,sourceMinorYears:0}};assert.throws(()=>usCareerView(forged),/CONTINUATION/);
 for(const notice of unreadUsFirstCampNotices(us))us=resolveUsFirstCampNotice(us,us.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'USE_CURRENT_SETUP'});
 us=confirmUsPreseasonPlan(us,us.revision);us=publishUsSeasonSchedule(us,us.revision);us=startUsRegularSeason(us,us.revision);
 for(let i=0;i<40&&us.season!.days.length===0;i++)us=advanceUsCareer(us,us.revision,1).career;
 assert.ok(us.season!.days.length>0);assert.ok(Object.keys(origin.source.records.games).every(k=>Object.hasOwn(us.records.games,k)));usCareerView(us);
});

test('native optional latest player returns to US, plays, and follows a real renewal writer after a labelled controlled close',()=>{
 const optional=nativeOptionalForTest(),c=retry.assessUsAmateurReturnRetryUsOpportunity(optional,optional.revision),q=c.usOpportunities!.at(-1)!,view=retry.usAmateurReturnRetryRoutesView(c),offer=q.offers.find(o=>o.militaryReturnOption)??q.offers[0];assert.ok(offer);
 let us=retry.resignUsAfterAmateurReturnRetry(c,c.revision,{routePreviewId:view.routePreviewId,offerKey:offer.offerKey});
 const latest=c.preparation!.world.players[c.retry.playerKey]!;
 assert.equal(us.world.seasonKey,String(Number(c.preparation!.world.seasonKey)+1));assert.equal(us.world.players[c.retry.playerKey]!.age,latest.age+1);assert.deepEqual(us.world.players[c.retry.playerKey]!.abilities,latest.abilities);assert.equal(us.retryCareer!.careerPreparationUsed,1);
 assert.ok(Object.keys(c.preparation!.records.games).every(k=>Object.hasOwn(us.records.games,k)));
 for(const notice of unreadUsFirstCampNotices(us))us=resolveUsFirstCampNotice(us,us.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'USE_CURRENT_SETUP'});
 us=publishUsSeasonSchedule(confirmUsPreseasonPlan(us,us.revision),us.revision+1);const prepared=us;
 us=startUsRegularSeason(us,us.revision);for(let i=0;i<40&&us.season!.days.length===0;i++)us=advanceUsCareer(us,us.revision,1).career;assert.ok(us.season!.days.length>0);usCareerView(us);
 // Separate controlled full-year closure verifies the real next renewal writer, not native full-season play.
 const closed=finishedUsCareerFixture(prepared),market=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),nextOffer=market.minorMarket!.offers.find(o=>o.organizationId===us.protagonistOrganizationId);assert.ok(nextOffer);
 const renewed=acceptUsMinorMarketOffer(market,market.revision,nextOffer.offerKey);
 assert.equal(renewed.world.seasonKey,String(Number(prepared.world.seasonKey)+1));assert.equal(renewed.contract.years,1);assert.equal(renewed.contract.annualSalaryUsd,30000);assert.equal(renewed.retryCareer!.careerPreparationUsed,1);usCareerView(renewed);
});

test('returned-US market assesses current year once, preserves return clauses and explicitly closes them without reserving salary',()=>{
 const origin=nativeUndraftedUsReturn(),c=retry.openUsAmateurReturnRetry(origin,origin.revision),before=canonicalJson(c.retry),sourceMoney=canonicalJson(c.origin.source.inventory);
 const quoted=retry.assessUsAmateurReturnRetryUsOpportunity(c,c.revision),q=quoted.usOpportunities![0]!;
 assert.equal(q.world.seasonKey,String(Number(c.retry.seasonKey)+1));assert.equal(q.world.players[c.retry.playerKey]!.age,c.retry.age+1);
 assert.deepEqual(q.world.players[c.retry.playerKey]!.abilities,(c.origin.preparation??c.origin.service!).world.players[c.retry.playerKey]!.abilities);
 assert.deepEqual(q.retainedOfferRefs,(origin.source.minorMarket?.offers??[]).filter(o=>o.militaryReturnOption).map(o=>o.offerKey).sort());
 assert.equal(canonicalJson(quoted.retry),before);assert.equal(canonicalJson(quoted.origin.source.inventory),sourceMoney);
 assert.strictEqual(retry.assessUsAmateurReturnRetryUsOpportunity(quoted,quoted.revision),quoted);
 const view=retry.usAmateurReturnRetryRoutesView(quoted);assert.equal(view.usOpportunity.status,q.status);assert.doesNotMatch(JSON.stringify(view),/"rng"|"seed"|"potential"|"basis"/);
 assert.throws(()=>retry.assessUsAmateurReturnRetryUsOpportunity(quoted,quoted.revision-1),/REVISION/);
 assert.throws(()=>retry.declineUsAmateurReturnRetryUsOpportunity(quoted,quoted.revision,'wrong'),/QUOTE_CHANGED/);
 const closed=retry.declineUsAmateurReturnRetryUsOpportunity(quoted,quoted.revision,q.assessmentKey);
 assert.equal(closed.usOpportunities![0]!.status,'DECLINED');assert.equal(retry.usAmateurReturnRetryRoutesView(closed).routes.some(r=>r.routeId==='US_CONTRACT'),false);
 assert.strictEqual(retry.declineUsAmateurReturnRetryUsOpportunity(closed,closed.revision,q.assessmentKey),closed);
 const forged={...quoted,usOpportunities:[structuredClone(q)]};forged.usOpportunities[0]!.inventory.clubs[0]!.availableBudgetUsd++;
 assert.throws(()=>retry.assertUsAmateurReturnRetryCareer(forged),/QUOTE_CHANGED/);
});

test('controlled missing source US market is assessed from the actual returned owner rather than treated as no offers',()=>{
 const origin=nativeUndraftedUsReturn(),marketEvent=origin.source.minorMarket!.eventKey;
 // Controlled absent-market branch: remove its event and wrapper receipt together; keep native return games/results.
 delete origin.source.minorMarket;origin.source.events=origin.source.events.filter(e=>e.eventKey!==marketEvent);origin.events=origin.events.filter(e=>e.eventKey!==marketEvent);
 const c=retry.openUsAmateurReturnRetry(origin,origin.revision),quoted=retry.assessUsAmateurReturnRetryUsOpportunity(c,c.revision),q=quoted.usOpportunities![0]!;
 assert.equal(q.ownerSeasonKey,c.retry.seasonKey);assert.deepEqual(q.retainedOfferRefs,[]);
 assert.equal(q.status,q.offers.length?'AVAILABLE':'NO_OFFER');assert.equal(q.world.players[c.retry.playerKey]!.age,c.retry.age+1);
 assert.ok(q.offers.every(o=>o.offerKey===JSON.stringify(['us-minor-offer',q.assessmentKey,o.organizationId])));
 assert.equal(retry.usAmateurReturnRetryRoutesView(c).usOpportunity.status,'UNASSESSED');
 assert.equal(c.origin.source.military.status,origin.source.military.status);
});

test('uncompleted return gateway rejects without mutating the source',()=>{
 const c=expiredRetryUsCareer(),origin=requestUsAmateurReturn(c,c.revision),before=canonicalJson(origin);
 assert.throws(()=>retry.openUsAmateurReturnRetry(origin,origin.revision),/US_RETURN_RETRY_NOT_AVAILABLE/);assert.equal(canonicalJson(origin),before);
});
test('native returned-US gateway retains actual undrafted origin, budget and mandatory receipts across JSON',()=>{
 const origin=nativeUndraftedUsReturn(),before=canonicalJson(origin),c=retry.openUsAmateurReturnRetry(origin,origin.revision),view=retry.usAmateurReturnRetryRoutesView(c);
 assert.equal(c.revision,origin.revision+1);assert.equal(c.retry.careerPreparationUsed,origin.retry.careerPreparationUsed);assert.equal(c.retry.episodes.length,origin.retry.episodes.length);assert.equal(canonicalJson(c.origin),before);assert.equal(canonicalJson(origin),before);assert.equal(view.rights.draftEligible,true);assert.equal(view.usOpportunity.status,'UNASSESSED');assert.ok(!view.routes.some(r=>r.routeId==='COLLEGE_ENTRY'||r.routeId==='COLLEGE_RESUME'));assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"/);
 retry.assertUsAmateurReturnRetryCareer(JSON.parse(JSON.stringify(c)));assert.equal(canonicalJson(retry.openUsAmateurReturnRetry(JSON.parse(before),origin.revision)),canonicalJson(c));
 assert.throws(()=>retry.openUsAmateurReturnRetry(origin,origin.revision-1),/REVISION/);
 for(const change of [(s:typeof origin)=>{s.draft!.program.result!.receiptKey='forged';},(s:typeof origin)=>{s.retry.episodes[s.retry.episodes.length-1]!.receiptKey='forged';},(s:typeof origin)=>{s.return.playerKey='other';}]){const forged=structuredClone(origin);change(forged);assert.throws(()=>retry.openUsAmateurReturnRetry(forged,forged.revision));}
 const forged=structuredClone(c);forged.retry.careerPreparationUsed=3;assert.throws(()=>retry.assertUsAmateurReturnRetryCareer(forged),/RETRY|PREPARATION/);
});

let optionalCache:retry.UsAmateurReturnRetryCareer|undefined;
function nativeOptionalForTest():retry.UsAmateurReturnRetryCareer {
 if(optionalCache)return structuredClone(optionalCache);
 const origin=nativeUndraftedUsReturn(),c=retry.openUsAmateurReturnRetry(origin,origin.revision),view=retry.usAmateurReturnRetryRoutesView(c);
 let active=retry.startUsAmateurReturnRetryPreparation(c,c.revision,{routePreviewId:view.routePreviewId});
 assert.equal(active.preparation!.world.players[origin.return.playerKey]!.age,origin.retry.age+1);assert.equal(active.retry.careerPreparationUsed,origin.retry.careerPreparationUsed);assert.equal(active.origin.return.years.length,2);
 assert.throws(()=>retry.settleUsAmateurReturnRetryPreparation(active,active.revision,true),/INCOMPLETE/);
 active=retry.confirmUsAmateurReturnRetryPreseason(active,active.revision);const before=canonicalJson(c.origin.return);let complete=false,resumed=false;
 for(let i=0;i<2000;i++){const out=retry.advanceUsAmateurReturnRetryPreparation(active,active.revision,'ONE_MONTH');assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(!resumed){const again=retry.advanceUsAmateurReturnRetryPreparation(JSON.parse(JSON.stringify(active)),active.revision,'ONE_MONTH');assert.equal(canonicalJson(out),canonicalJson(again));resumed=true;}active=out.career;if(out.stopReason==='SEASON_COMPLETE'){complete=true;break;}}
 assert.ok(complete);assert.equal(active.retry.careerPreparationUsed,origin.retry.careerPreparationUsed);
 const done=retry.settleUsAmateurReturnRetryPreparation(active,active.revision,true);assert.equal(done.retry.careerPreparationUsed,origin.retry.careerPreparationUsed+1);assert.equal(done.completedPreparation.length,1);assert.equal(done.preparation!.result!.completedTeamGames,48);assert.equal(canonicalJson(done.origin.return),before);assert.equal(canonicalJson(retry.settleUsAmateurReturnRetryPreparation(done,done.revision,true)),canonicalJson(done));
 const fresh=retry.usAmateurReturnRetryPreparationView(done);assert.equal(fresh.evaluation!.kind,'AMATEUR_DRAFT');retry.assertUsAmateurReturnRetryCareer(JSON.parse(JSON.stringify(done)));
 optionalCache=done;return structuredClone(done);
}
test('native optional preparation charges only on completion and keeps mandatory history and latest age',()=>{nativeOptionalForTest();
});

test('three native optional seasons close actual offers before explicit E35 retirement and JSON archive',()=>{
 let c=nativeOptionalForTest();
 const closeDraft=(source:retry.UsAmateurReturnRetryCareer)=>{
  let next=retry.prepareUsAmateurReturnRetryDraft(source,source.revision);next=retry.resolveUsAmateurReturnRetryDraft(next,next.revision,next.draft!.program.version);
  if(next.draft!.program.result!.round!==null)next=retry.decideUsAmateurReturnRetryDraft(next,next.revision,next.draft!.program.version,'DECLINE');return next;
 };
 for(let year=2;year<=3;year++){
  c=closeDraft(c);const view=retry.usAmateurReturnRetryRoutesView(c);c=retry.startUsAmateurReturnRetryPreparation(c,c.revision,{routePreviewId:view.routePreviewId});c=retry.confirmUsAmateurReturnRetryPreseason(c,c.revision);let finished=false;
  for(let i=0;i<2000;i++){const out=retry.advanceUsAmateurReturnRetryPreparation(c,c.revision,'ONE_MONTH');assert.notEqual(out.stopReason,'ENGINE_LIMIT');c=out.career;if(out.stopReason==='SEASON_COMPLETE'){finished=true;break;}}
  assert.ok(finished);assert.equal(c.retry.careerPreparationUsed,year-1);c=retry.settleUsAmateurReturnRetryPreparation(c,c.revision,true);assert.equal(c.retry.careerPreparationUsed,year);assert.equal(c.preparation!.result!.completedTeamGames,48);
  process.stderr.write(JSON.stringify({nativeOptionalSettled:year,teamGames:48,recordRevision:c.preparation!.records.revision})+'\n');
 }
 c=closeDraft(c);assert.throws(()=>retry.openUsAmateurReturnRetryExhaustion(c,c.revision),/ASSESSMENT_REQUIRED/);
 c=retry.assessUsAmateurReturnRetryUsOpportunity(c,c.revision);const q=c.usOpportunities!.at(-1)!;
 if(q.status==='AVAILABLE'||q.retainedOfferRefs.length)assert.throws(()=>retry.openUsAmateurReturnRetryExhaustion(c,c.revision),/ROUTES_REMAIN/);
 c=retry.declineUsAmateurReturnRetryUsOpportunity(c,c.revision,q.assessmentKey);const opened=retry.openUsAmateurReturnRetryExhaustion(c,c.revision),view=retry.usAmateurReturnRetryRetirementView(opened);assert.ok(view.available);
 assert.equal(retry.usAmateurReturnRetryRoutesView(opened).routes.length,0);assert.throws(()=>retry.startUsAmateurReturnRetryPreparation(opened,opened.revision,{routePreviewId:'old'}),/RETIREMENT_PENDING/);
 const input={eventKey:view.eventKey,eventVersion:view.eventVersion,command:'CONFIRM_RETIRE' as const};assert.throws(()=>retry.confirmUsAmateurReturnRetryExhaustion(opened,opened.revision,{...input,eventVersion:view.eventVersion+1}),/VERSION|STALE/);
 const retired=retry.confirmUsAmateurReturnRetryExhaustion(opened,opened.revision,input),restored=JSON.parse(JSON.stringify(retired));retry.assertUsAmateurReturnRetryCareer(restored);
 assert.equal(retired.status,'ARCHIVED');assert.equal(retired.retry.careerPreparationUsed,3);assert.equal(retired.completedPreparation.length,3);assert.equal(retired.preparation!.records.revision,c.preparation!.records.revision);assert.equal(retired.origin.return.years.length,2);
 assert.equal(retired.retry.periods.filter(p=>p.kind==='MANDATORY_RETURN'&&!p.usageCharged).length,2);assert.equal(retired.retry.periods.filter(p=>p.usageCharged).length,3);
 const publicView=retry.usAmateurReturnRetryRetirementView(restored);assert.deepEqual(publicView,retry.usAmateurReturnRetryRetirementView(retired));assert.doesNotMatch(JSON.stringify(publicView),/"rng"|"seed"|"potential"|"sourceBasis"/);
 assert.throws(()=>retry.confirmUsAmateurReturnRetryExhaustion(retired,retired.revision,input),/NOT_AVAILABLE/);
});

test('fresh returned-US draft assessment cannot reuse the initial mandatory reservation before optional completion',()=>{
 const origin=nativeUndraftedUsReturn(),c=retry.openUsAmateurReturnRetry(origin,origin.revision),before=canonicalJson(c.retry);
 assert.throws(()=>retry.prepareUsAmateurReturnRetryDraft(c,c.revision),/US_RETURN_RETRY_DRAFT_NOT_READY/);assert.equal(canonicalJson(c.retry),before);
});

test('returned-US validation reuses only deep-immutable origin and always checks live or restored ledgers',()=>{
 const origin=nativeUndraftedUsReturn(),c=retry.openUsAmateurReturnRetry(origin,origin.revision);
 assert.equal(Object.isFrozen(origin),false);assert.equal(Object.isFrozen(c.origin),true);assert.equal(Object.isFrozen(c.origin.source.records.games),true);
 assert.throws(()=>{c.origin.return.sourceContractKey='changed';},TypeError);retry.assertUsAmateurReturnRetryCareer(c);
 const bad=structuredClone(c);Object.freeze(bad.origin);bad.origin.return.sourceContractKey='changed';assert.throws(()=>retry.assertUsAmateurReturnRetryCareer(bad));
 const live={...c,retry:{...c.retry,careerPreparationUsed:3}};assert.throws(()=>retry.assertUsAmateurReturnRetryCareer(live),/RETRY|PREPARATION/);
 const restored=JSON.parse(JSON.stringify(c)) as typeof c;retry.assertUsAmateurReturnRetryCareer(restored);assert.equal(Object.isFrozen(restored.origin.return.years),true);
});

test('native fresh KBO draft signs the latest optional player and actually plays without losing the original US archive',()=>{
 const prepared=nativeOptionalForTest(),last=prepared.preparation!,key=prepared.retry.playerKey;
 let c=retry.prepareUsAmateurReturnRetryDraft(prepared,prepared.revision);assert.notEqual(c.draft!.program.assessmentKey,c.origin.return.draftReservationKey);assert.equal(c.draft!.program.input.baseScore,last.result!.baseScore);assert.equal(canonicalJson(c.draft!.program.input.player),canonicalJson(last.world.players[key]));assert.throws(()=>retry.prepareUsAmateurReturnRetryDraft(c,c.revision),/NOT_READY/);
 c=retry.resolveUsAmateurReturnRetryDraft(c,c.revision,c.draft!.program.version);assert.ok(c.draft!.program.result!.round,'strong existing player needs a genuine native offer; never force one');
 c=retry.decideUsAmateurReturnRetryDraft(c,c.revision,c.draft!.program.version,'SIGN');let kbo=retry.startSignedUsAmateurReturnRetryKboCareer(c,c.revision);
 assert.equal(kbo.revision,c.revision+1);assert.equal(kbo.world.players[key]!.age,last.world.players[key]!.age+1);assert.equal(kbo.retryCareer!.careerPreparationUsed,c.retry.careerPreparationUsed);assert.equal(kbo.usAmateurReturnRetryHistory!.originReturnId,c.origin.return.returnId);
 for(const [id,row]of Object.entries({...c.origin.source.records.games,...last.records.games}))assert.equal(canonicalJson(kbo.records.games[id]),canonicalJson(row));
 for(const notice of unreadKboFirstCampNotices(kbo))kbo=resolveKboFirstCampNotice(kbo,kbo.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'KEEP_FOCUS'});
 kbo=confirmKboPreseasonPlan(kbo,kbo.revision);kbo=confirmKboOpeningRoster(kbo,kbo.revision);kbo=confirmKboSeasonSchedule(kbo,kbo.revision);kbo=startKboRegularSeason(kbo,kbo.revision);const target=kbo.world.seasonKey;
 for(let i=0;i<40&&!Object.values(kbo.records.games).some(g=>g.scope.seasonKey===target&&g.scope.leagueKey==='KBO');i++){const out=advanceKboCareer(kbo,kbo.revision,1);assert.notEqual(out.stopReason,'ENGINE_LIMIT');kbo=out.career;}
 assert.ok(Object.values(kbo.records.games).some(g=>g.scope.seasonKey===target&&g.scope.leagueKey==='KBO'));
});

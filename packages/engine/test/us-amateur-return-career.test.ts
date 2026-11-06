import {nativeServiceUsReturn} from './us-native-service-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {openUsMinorMarket,acceptUsMinorMarketOffer} from '../src/us-minor-market.js';
import {usCareerView} from '../src/us-career-entry.js';
import {prepareRelationNoticeRead} from '../src/relation-notices.js';
import {emptyPitching} from '../src/stats.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn,settleUsAmateurReturnYear,prepareUsAmateurReturnDraft,resolveUsAmateurReturnDraft,usAmateurReturnCareerView,assertUsAmateurReturnCareer,decideUsAmateurReturnDraft,startSignedUsAmateurReturnKboCareer,resignUsAfterAmateurReturn} from '../src/us-amateur-return-career.js';
import {unreadKboFirstCampNotices,resolveKboFirstCampNotice,confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
let cache:UsCareer|undefined;
function expired(){
 if(cache)return structuredClone(cache);let c=closedUsOptionCareer('HITTER');
 for(let i=1;i<c.contract.controlSeasons;i++){c=startNextUsMinorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));c=confirmUsPreseasonPlan(c,c.revision);c=publishUsSeasonSchedule(c,c.revision);c=finishedUsCareerFixture(c);}
 // Controlled US fixture omits opponent matchup rows; certify them before crossing the stricter school ledger boundary.
 for(const g of Object.values(c.records.games)){const line=g.batting[c.protagonistKey];if(!line)continue;const opposing='controlled-opponent';g.pitching[opposing]={...emptyPitching(),games:1,starts:1,starterOuts:line.K,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0,BF:line.PA,outs:line.K,K:line.K};g.pitcherSplits[opposing]={L:{BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},R:{BF:line.PA,outs:line.K,AB:line.AB,H:line.H,TB:line.TB,HR:line.HR,BB:line.BB,HBP:line.HBP,K:line.K}};g.matchups[JSON.stringify([c.protagonistKey,opposing])]={batterKey:c.protagonistKey,pitcherKey:opposing,stats:{...g.batterSplits[c.protagonistKey]!.R}};}
 for(const archive of [...(c.minorYears??[]),{season:c.season!,seasonSchedule:c.seasonSchedule!}])for(const day of archive.season.days){const rows=Object.values(archive.seasonSchedule.leagues).flatMap(games=>games.filter(g=>g.worldDay===day.day).map(g=>c.records.games[g.simulationKey]!));day.evidence=canonicalJson(rows);}
 c.military.status='NOT_APPLICABLE';cache=c;return structuredClone(c);
}
test('M2-CLOSE-RETURN-20261102: controlled US prefix: root preserves original US evidence and plays two native mandatory seasons, without retry budget',()=>{
 const closed=expired(),source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),raw=canonicalJson(source);let c=requestUsAmateurReturn(source,source.revision);
 assert.throws(()=>prepareUsAmateurReturnDraft(c,c.revision),/NOT_READY/);assert.throws(()=>startUsAmateurReturnYear(c,c.revision-1,1),/REVISION/);
 assert.equal(c.events.at(-1)!.definitionId,'E68');assert.equal(c.events[0]!.status,'RESOLVED');assert.equal(source.events.find(e=>e.eventKey===source.minorMarket!.eventKey)!.status,'OPEN');
 assert.throws(()=>resignUsAfterAmateurReturn(c,c.revision,'x'),/OPTION_NOT_AVAILABLE/);
 assert.throws(()=>assertUsAmateurReturnCareer({...c,return:{...c.return,sourceContractKey:'forged'}}));
 for(let year=0;year<2;year++){
  c=startUsAmateurReturnYear(c,c.revision,1);assert.equal(c.preparation!.world.seasonKey,String(Number(source.world.seasonKey)+year+1));
  assert.throws(()=>settleUsAmateurReturnYear(c,c.revision),/INCOMPLETE/);
  let resumed=false;
  for(let i=0;i<2000;i++){
   const next=advanceUsAmateurReturn(c,c.revision);
   assert.notEqual(next.stopReason,'ENGINE_LIMIT');
   if(!resumed){const restored=JSON.parse(JSON.stringify(c)) as typeof c;assert.equal(canonicalJson(advanceUsAmateurReturn(restored,c.revision)),canonicalJson(next));resumed=true;}
   c=next.career;if(next.stopReason==='SEASON_COMPLETE')break;
  }
  c=settleUsAmateurReturnYear(c,c.revision);assert.equal(c.return.years.length,year+1);assert.equal(c.retry.careerPreparationUsed,0);assert.equal(c.return.years[year]!.seasonGrowth.finalized,true);
 }
 assertUsAmateurReturnCareer(JSON.parse(JSON.stringify(c)));
 {const forged=structuredClone(c);forged.return.years[0]!.receiptKey='forged';assert.throws(()=>assertUsAmateurReturnCareer(forged),/COMPLETION/);}
 {const liveForged=structuredClone(c);liveForged.preparation!.retry.age++;assert.throws(()=>assertUsAmateurReturnCareer(liveForged));}
 assert.equal(c.return.status,'DRAFT_READY');assert.equal(c.retry.periods.length,2);assert.ok(c.retry.periods.every(p=>!p.usageCharged&&p.kind==='MANDATORY_RETURN'&&p.evidenceReceipt));
 assert.deepEqual(c.source,source);assert.equal(canonicalJson(source),raw);const ownRow=Object.values(source.records.games).find(g=>Object.hasOwn(g.batting,source.protagonistKey)||Object.hasOwn(g.pitching,source.protagonistKey))!;assert.ok(ownRow);assert.deepEqual(c.preparation!.records.games[ownRow.gameKey],ownRow);
 const returnOffer=source.minorMarket!.offers.find(o=>o.militaryReturnOption);assert.ok(returnOffer);
 const beforeResigning=canonicalJson(c),resigned=resignUsAfterAmateurReturn(c,c.revision,returnOffer.offerKey);
 assert.equal(resigned.revision,c.revision+1);assert.equal(resigned.world.seasonKey,String(Number(source.world.seasonKey)+3));
 assert.equal(resigned.inventory.seasonKey,resigned.world.seasonKey);assert.equal(resigned.usAmateurReturn!.status,'CANCELLED_US');
 assert.ok(Object.values(resigned.world.repertoires).every(b=>b.seasonId===resigned.world.seasonKey));
 assert.equal(canonicalJson(resigned.records.games),canonicalJson({...source.records.games,...c.preparation!.records.games}));
 assert.equal(canonicalJson(c),beforeResigning);usCareerView(resigned);
 const drafted=prepareUsAmateurReturnDraft(c,c.revision),resolved=resolveUsAmateurReturnDraft(drafted,drafted.revision,1);assert.ok(resolved.draft!.program.result);assert.equal(resolved.draft!.program.assessmentKey,c.return.draftReservationKey);assert.deepEqual(resolved.draft!.program.input.player,c.return.years[1]!.endingPlayer);assert.doesNotMatch(JSON.stringify(usAmateurReturnCareerView(resolved)),/potential|"rng"|"seed"/);
 assert.ok(resolved.draft!.program.result!.round,'strong controlled US prefix must produce a real native draft offer');
 const signed=decideUsAmateurReturnDraft(resolved,resolved.revision,resolved.draft!.program.version,'SIGN');
 let kbo=startSignedUsAmateurReturnKboCareer(signed,signed.revision);
 assert.equal(kbo.world.players[kbo.protagonistKey]!.age,c.return.sourceAge+3);assert.equal(canonicalJson(kbo.usAmateurReturnHistory),canonicalJson(signed));
 for(const [key,row] of Object.entries(source.records.games))assert.deepEqual(kbo.records.games[key],row);
 for(const notice of unreadKboFirstCampNotices(kbo))kbo=resolveKboFirstCampNotice(kbo,kbo.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'KEEP_FOCUS'});
 kbo=confirmKboPreseasonPlan(kbo,kbo.revision);kbo=confirmKboOpeningRoster(kbo,kbo.revision);kbo=confirmKboSeasonSchedule(kbo,kbo.revision);kbo=startKboRegularSeason(kbo,kbo.revision);
 const played=advanceKboCareer(kbo,kbo.revision,1);assert.notEqual(played.stopReason,'ENGINE_LIMIT');assert.ok(played.career.records.revision>kbo.records.revision);
});

test('M2-CLOSE-RETURN-20261102: committed E66 receipt derives a native TERMINATE service owner and synchronized retry metadata',()=>{
 const closed=expired();closed.military.status='UNRESOLVED';
 const source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),raw=canonicalJson(source);
 const opened=requestUsAmateurReturn(source,source.revision),started=startUsAmateurReturnYear(opened,opened.revision,1);
 assert.equal(started.service!.contract.status,'TERMINATED');assert.equal(started.service!.minorMarket,undefined);
 assert.equal(started.retry.seasonKey,started.service!.world.seasonKey);assert.equal(started.retry.age,started.service!.world.players[started.return.playerKey]!.age);assert.equal(started.retry.careerPreparationUsed,0);
 assert.equal(started.service!.events.find(e=>e.eventKey===source.minorMarket!.eventKey)!.resolution!.receiptKey,opened.return.returnId);
 assert.equal(canonicalJson(source),raw);assertUsAmateurReturnCareer(JSON.parse(JSON.stringify(started)));
});

test('M2-CLOSE-RETURN-20261102: a return-option US offer re-signs after one independent year; skipped seasons age the frozen NPC world',()=>{
 const closed=expired(),source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),raw=canonicalJson(source);
 const offer=source.minorMarket!.offers.find(o=>o.militaryReturnOption&&o.organizationId!==source.protagonistOrganizationId);assert.ok(offer,'controlled market must carry a return-option offer from another organization');
 let c=startUsAmateurReturnYear(requestUsAmateurReturn(source,source.revision),source.revision+1,1);
 for(let i=0;i<2000;i++){const next=advanceUsAmateurReturn(c,c.revision);c=next.career;if(next.stopReason==='SEASON_COMPLETE')break;}
 c=settleUsAmateurReturnYear(c,c.revision);assert.equal(c.return.years.length,1);
 const returnBefore=canonicalJson(c),us=resignUsAfterAmateurReturn(c,c.revision,offer!.offerKey);
 assert.equal(us.revision,c.revision+1,'root handoff must advance the active return revision');
 assert.equal(canonicalJson(c),returnBefore);
 assert.equal(canonicalJson(resignUsAfterAmateurReturn(JSON.parse(returnBefore),c.revision,offer!.offerKey)),canonicalJson(us));
 assert.equal(us.world.seasonKey,String(Number(source.world.seasonKey)+2));assert.equal(us.contract.seasonKey,us.world.seasonKey);assert.equal(us.usAmateurReturn!.status,'CANCELLED_US');
 assert.equal(us.inventory.seasonKey,us.world.seasonKey);
 assert.equal(us.protagonistOrganizationId,offer!.organizationId);assert.equal(us.usReturnContinuation!.organizationId,offer!.organizationId);
 assert.equal(us.usReturnContinuation!.remainingControlSeasons,1,'a one-year re-sign must not restart the original six-season control');
 for(const [key,player] of Object.entries(source.world.players))if(key!==source.protagonistKey&&us.world.players[key])assert.equal(us.world.players[key]!.age,player.age+2,`NPC age must follow both elapsed seasons: ${key}`);
 assert.equal(canonicalJson(us.records.games),canonicalJson({...source.records.games,...c.preparation!.records.games}));
 assert.equal(canonicalJson(us.health),canonicalJson(c.preparation!.health));
 assert.equal(canonicalJson(us.development),canonicalJson({...c.preparation!.development,seasonStartPlayer:us.world.players[us.protagonistKey]}));
 assert.equal(canonicalJson(us.retryCareer),canonicalJson(c.retry));assert.deepEqual(us.styleUsedWindows,c.preparation!.styleUsedWindows);
 const budget=source.inventory.clubs.find(o=>o.id===offer!.organizationId)!.availableBudgetUsd+source.minorMarket!.funding.find(f=>f.organizationId===offer!.organizationId)!.addedBudgetUsd-30000;
 assert.equal(us.inventory.clubs.find(o=>o.id===offer!.organizationId)!.availableBudgetUsd,budget,'reserve the signed salary once, without a second grant or debit');
 assert.ok(us.goals!.notices.some(e=>e.definitionId==='E89'&&e.seasonKey===us.world.seasonKey));
 assert.ok(us.repertoireEvents!.notices.some(e=>e.definitionId==='E88'&&e.seasonKey===us.world.seasonKey));
 const teamWorld={worldKey:us.world.worldKey,seasonKey:us.world.seasonKey,leagueKey:us.registration.level,protagonistKey:us.protagonistKey,protagonistSchoolId:us.protagonistOrganizationId,schools:us.world.organizations.map(o=>({id:o.id,name:o.name,roster:o.levels[us.registration.level]})),players:us.world.players};
 const teammate=us.relationNotices.find(e=>e.definitionId==='E94'&&e.seasonKey===us.world.seasonKey);assert.ok(teammate);
 assert.doesNotThrow(()=>prepareRelationNoticeRead({...us,world:teamWorld},{eventKey:teammate.eventKey,eventVersion:teammate.version,command:'OPEN_RELATIONS'}));
 assert.deepEqual(us.world.players[us.protagonistKey]!.abilities,c.return.years[0]!.endingPlayer.abilities);assert.equal(us.world.players[us.protagonistKey]!.age,c.return.years[0]!.age+1);
 const resumed=JSON.parse(JSON.stringify(us)) as typeof us,planned=publishUsSeasonSchedule(confirmUsPreseasonPlan(resumed,resumed.revision),resumed.revision+1);assert.equal(planned.world.seasonKey,us.world.seasonKey);
 const live=startUsRegularSeason(planned,planned.revision),day=advanceUsCareer(live,live.revision,1);assert.notEqual(day.stopReason,'ENGINE_LIMIT');assert.ok(day.career.revision>live.revision);
 assert.equal(canonicalJson(source),raw);assert.throws(()=>resignUsAfterAmateurReturn(c,c.revision-1,offer!.offerKey),/REVISION/);
 // Controlled next-season regular/PS prefix; actual second market and acceptance must replay the new holder epoch.
 const closedAgain=finishedUsCareerFixture(planned),marketAgain=openUsMinorMarket(closedAgain,closedAgain.revision,closedAgain.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),sameClub=marketAgain.minorMarket!.offers.find(o=>o.organizationId===us.protagonistOrganizationId);assert.ok(sameClub);
 const renewed=acceptUsMinorMarketOffer(marketAgain,marketAgain.revision,sameClub.offerKey);assert.equal(renewed.protagonistOrganizationId,us.protagonistOrganizationId);assert.equal(renewed.contract.years,1);usCareerView(renewed);
 const oldFormat=JSON.parse(JSON.stringify(renewed)) as typeof renewed;delete oldFormat.usReturnContinuation!.organizationId;assert.deepEqual(usCareerView(oldFormat),usCareerView(renewed));
 const forged=JSON.parse(JSON.stringify(renewed)) as typeof renewed;forged.usReturnContinuation!.organizationId=source.protagonistOrganizationId;assert.throws(()=>usCareerView(forged),/RETURN_ORGANIZATION/);
 const started=startUsAmateurReturnYear(c,c.revision,1);
 assert.throws(()=>resignUsAfterAmateurReturn(started,started.revision,offer!.offerKey),/YEAR_IN_PROGRESS/);
});

test('M2-CLOSE-RETURN-20261102: a return-option US offer also re-signs after two independent years',()=>{
 const closed=expired(),source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),offer=source.minorMarket!.offers.find(o=>o.militaryReturnOption)!;
 let c=requestUsAmateurReturn(source,source.revision);
 for(let year=0;year<2;year++){c=startUsAmateurReturnYear(c,c.revision,1);for(let i=0;i<2000;i++){const next=advanceUsAmateurReturn(c,c.revision);c=next.career;if(next.stopReason==='SEASON_COMPLETE')break;}c=settleUsAmateurReturnYear(c,c.revision);}
 const us=resignUsAfterAmateurReturn(c,c.revision,offer.offerKey);
 assert.equal(us.world.seasonKey,String(Number(source.world.seasonKey)+3));assert.equal(us.usAmateurReturn!.status,'CANCELLED_US');
 assert.deepEqual(us.world.players[us.protagonistKey]!.abilities,c.return.years[1]!.endingPlayer.abilities);
 const resumed=JSON.parse(JSON.stringify(us)) as typeof us;publishUsSeasonSchedule(confirmUsPreseasonPlan(resumed,resumed.revision),resumed.revision+1);
});

test('M2-CLOSE-RETURN-20261102: a return-option US offer re-signs after two native service years; open service blocks it',()=>{
 const c=nativeServiceUsReturn(),source=c.source,offer=source.minorMarket!.offers.find(o=>o.militaryReturnOption)!;assert.equal(c.return.years.length,2);assert.equal(c.return.militaryStatus,'COMPLETED');
 const us=resignUsAfterAmateurReturn(c,c.revision,offer.offerKey);
 assert.equal(us.world.seasonKey,String(Number(source.world.seasonKey)+3));assert.equal(us.usAmateurReturn!.status,'CANCELLED_US');
 const resumed=JSON.parse(JSON.stringify(us)) as typeof us;publishUsSeasonSchedule(confirmUsPreseasonPlan(resumed,resumed.revision),resumed.revision+1);
});


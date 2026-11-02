import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import {emptyPitching} from '../src/stats.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn,settleUsAmateurReturnYear,prepareUsAmateurReturnDraft,resolveUsAmateurReturnDraft,usAmateurReturnCareerView,assertUsAmateurReturnCareer,decideUsAmateurReturnDraft,startSignedUsAmateurReturnKboCareer,cancelUsAmateurReturnAfterUsSigning} from '../src/us-amateur-return-career.js';
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
 assert.throws(()=>cancelUsAmateurReturnAfterUsSigning(c,c.revision,source),/RESIGNING_NOT_SUPPORTED/);
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

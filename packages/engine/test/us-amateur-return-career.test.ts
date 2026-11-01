import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {emptyPitching} from '../src/stats.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn,settleUsAmateurReturnYear,prepareUsAmateurReturnDraft,resolveUsAmateurReturnDraft,usAmateurReturnCareerView} from '../src/us-amateur-return-career.js';
let cache:UsCareer|undefined;
function expired(){
 if(cache)return structuredClone(cache);let c=closedUsOptionCareer('HITTER');
 for(let i=1;i<c.contract.controlSeasons;i++){c=startNextUsMinorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));c=confirmUsPreseasonPlan(c,c.revision);c=publishUsSeasonSchedule(c,c.revision);c=finishedUsCareerFixture(c);}
 // Controlled US fixture omits opponent matchup rows; certify them before crossing the stricter school ledger boundary.
 for(const g of Object.values(c.records.games)){const line=g.batting[c.protagonistKey];if(!line)continue;const opposing='controlled-opponent';g.pitching[opposing]={...emptyPitching(),games:1,starts:1,starterOuts:line.K,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0,BF:line.PA,outs:line.K,K:line.K};g.pitcherSplits[opposing]={L:{BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},R:{BF:line.PA,outs:line.K,AB:line.AB,H:line.H,TB:line.TB,HR:line.HR,BB:line.BB,HBP:line.HBP,K:line.K}};g.matchups[JSON.stringify([c.protagonistKey,opposing])]={batterKey:c.protagonistKey,pitcherKey:opposing,stats:{...g.batterSplits[c.protagonistKey]!.R}};}
 for(const archive of [...(c.minorYears??[]),{season:c.season!,seasonSchedule:c.seasonSchedule!}])for(const day of archive.season.days){const rows=Object.values(archive.seasonSchedule.leagues).flatMap(games=>games.filter(g=>g.worldDay===day.day).map(g=>c.records.games[g.simulationKey]!));day.evidence=canonicalJson(rows);}
 c.military.status='NOT_APPLICABLE';cache=c;return structuredClone(c);
}
test('M2-CLOSE-RETURN-20261102: root preserves original US evidence and plays two native mandatory seasons, without retry budget',()=>{
 const source=expired(),raw=canonicalJson(source);let c=requestUsAmateurReturn(source,source.revision);
 assert.throws(()=>prepareUsAmateurReturnDraft(c,c.revision),/NOT_READY/);assert.throws(()=>startUsAmateurReturnYear(c,c.revision-1,1),/REVISION/);
 assert.equal(c.events[0]!.definitionId,'E68');
 for(let year=0;year<2;year++){
  c=startUsAmateurReturnYear(c,c.revision,1);assert.equal(c.preparation!.world.seasonKey,String(Number(source.world.seasonKey)+year+1));
  assert.throws(()=>settleUsAmateurReturnYear(c,c.revision),/INCOMPLETE/);
  let resumed=false;
  for(let i=0;i<2000;i++){
   const next=advanceUsAmateurReturn(c,c.revision);
   assert.notEqual(next.stopReason,'ENGINE_LIMIT');
   if(!resumed){const restored=JSON.parse(JSON.stringify(c)) as typeof c;assert.deepEqual(advanceUsAmateurReturn(restored,c.revision),next);resumed=true;}
   c=next.career;if(next.stopReason==='SEASON_COMPLETE')break;
  }
  c=settleUsAmateurReturnYear(c,c.revision);assert.equal(c.return.years.length,year+1);assert.equal(c.retry.careerPreparationUsed,0);assert.equal(c.return.years[year]!.seasonGrowth.finalized,true);
 }
 assert.equal(c.return.status,'DRAFT_READY');assert.equal(c.retry.periods.length,2);assert.ok(c.retry.periods.every(p=>!p.usageCharged&&p.kind==='MANDATORY_RETURN'&&p.evidenceReceipt));
 assert.deepEqual(c.source,source);assert.equal(canonicalJson(source),raw);assert.deepEqual(c.preparation!.records.games[Object.keys(source.records.games)[0]!],source.records.games[Object.keys(source.records.games)[0]!]);
 const drafted=prepareUsAmateurReturnDraft(c,c.revision),resolved=resolveUsAmateurReturnDraft(drafted,drafted.revision,1);assert.ok(resolved.draft!.program.result);assert.equal(resolved.draft!.program.assessmentKey,c.return.draftReservationKey);assert.deepEqual(resolved.draft!.program.input.player,c.return.years[1]!.endingPlayer);assert.doesNotMatch(JSON.stringify(usAmateurReturnCareerView(resolved)),/potential|"rng"|"seed"/);
});

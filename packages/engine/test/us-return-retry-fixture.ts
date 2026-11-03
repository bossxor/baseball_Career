import assert from 'node:assert/strict';
import * as retry from '../src/us-return-retry.js';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import {canonicalJson} from '../src/game.js';
import {emptyPitching} from '../src/stats.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,advanceUsAmateurReturn,settleUsAmateurReturnYear,prepareUsAmateurReturnDraft,resolveUsAmateurReturnDraft,assertUsAmateurReturnCareer} from '../src/us-amateur-return-career.js';
import type {UsAmateurReturnCareer} from '../src/us-amateur-return-career.js';
import {prepareKboDraft} from '../src/kbo-draft.js';
import {KBO_MONEY} from '@playball/rules';

/** Existing controlled US seasons; actual mandatory games are generated below, never fabricated here. */
export function expiredRetryUsCareer(){
 let c=closedUsOptionCareer('HITTER');
 for(let i=1;i<c.contract.controlSeasons;i++){c=startNextUsMinorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));c=confirmUsPreseasonPlan(c,c.revision);c=publishUsSeasonSchedule(c,c.revision);c=finishedUsCareerFixture(c);}
 for(const g of Object.values(c.records.games)){const line=g.batting[c.protagonistKey];if(!line)continue;const opposing='controlled-opponent';g.pitching[opposing]={...emptyPitching(),games:1,starts:1,starterOuts:line.K,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0,BF:line.PA,outs:line.K,K:line.K};g.pitcherSplits[opposing]={L:{BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},R:{BF:line.PA,outs:line.K,AB:line.AB,H:line.H,TB:line.TB,HR:line.HR,BB:line.BB,HBP:line.HBP,K:line.K}};g.matchups[JSON.stringify([c.protagonistKey,opposing])]={batterKey:c.protagonistKey,pitcherKey:opposing,stats:{...g.batterSplits[c.protagonistKey]!.R}};}
 for(const archive of [...(c.minorYears??[]),{season:c.season!,seasonSchedule:c.seasonSchedule!}])for(const day of archive.season.days){const rows=Object.values(archive.seasonSchedule.leagues).flatMap(games=>games.filter(g=>g.worldDay===day.day).map(g=>c.records.games[g.simulationKey]!));day.evidence=canonicalJson(rows);}
 c.military.status='NOT_APPLICABLE';return c;
}
let cache:UsAmateurReturnCareer|undefined;
export function nativeUndraftedUsReturn():UsAmateurReturnCareer {
 if(cache)return structuredClone(cache);
 const path=process.env.PLAYBALL_NATIVE_RETURN_PREFIX;
 if(path&&fs.existsSync(path)){
  const data=JSON.parse(fs.readFileSync(path,'utf8')) as {schemaVersion:number;origin:UsAmateurReturnCareer;sha256:string};
  if(data.schemaVersion!==1||createHash('sha256').update(canonicalJson(data.origin)).digest('hex')!==data.sha256)throw new Error('NATIVE_RETURN_CACHE_CHANGED');
  assertUsAmateurReturnCareer(data.origin);cache=data.origin;return structuredClone(cache);
 }
 const source=expiredRetryUsCareer(),market=openUsMinorMarket(source,source.revision,source.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000})));
 let c=requestUsAmateurReturn(market,market.revision),commands=1;
 for(let year=0;year<2;year++){
  c=startUsAmateurReturnYear(c,c.revision,1);commands++;
  let complete=false;
  for(let i=0;i<2000;i++){const out=advanceUsAmateurReturn(c,c.revision);c=out.career;commands++;if(out.stopReason==='ENGINE_LIMIT')throw new Error('NATIVE_RETURN_ENGINE_LIMIT');if(out.stopReason==='SEASON_COMPLETE'){complete=true;break;}}
  if(!complete)throw new Error('NATIVE_RETURN_NOT_COMPLETE');c=settleUsAmateurReturnYear(c,c.revision);commands++;process.stdout.write('Native mandatory return year '+(year+1)+' complete\n');
 }
 c=prepareUsAmateurReturnDraft(c,c.revision);commands++;
 // Controlled legal KBO payroll removes every entry slot; the actual draw must produce round:null.
 for(const club of c.draft!.world.clubs){let remaining=club.budgetWon*.9;for(const key of club.roster){const contract=c.draft!.world.contracts[key]!;contract.years=1;contract.annualSalaryWon=KBO_MONEY.minimumSalaryWon;remaining-=contract.annualSalaryWon;}for(const key of club.roster){const contract=c.draft!.world.contracts[key]!,delta=Math.min(remaining,KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon);contract.annualSalaryWon+=delta;remaining-=delta;}if(remaining!==0)throw new Error('CONTROLLED_KBO_PAYROLL_CAPACITY');club.reservedSalaryWon=club.budgetWon*.9;}
 c.draft!.program=prepareKboDraft(c.draft!.world,c.draft!.program.input);c=resolveUsAmateurReturnDraft(c,c.revision,c.draft!.program.version);commands++;
 if(c.draft!.program.result?.round!==null)throw new Error('NATIVE_UNDRAFTED_RESULT_REQUIRED');assertUsAmateurReturnCareer(c);cache=c;
 if(path){const artifact={schemaVersion:1,sourceCommit:'5363de3',controlledUsPrefix:true,mandatoryTeamGames:[48,48],controlledDraftMarket:'LEGAL_PAYROLL_CAP',commands,sha256:createHash('sha256').update(canonicalJson(c)).digest('hex'),origin:c};fs.writeFileSync(path,JSON.stringify(artifact));}
 return structuredClone(c);
}

let optionalCache:retry.UsAmateurReturnRetryCareer|undefined;
export function nativeOptionalUsReturnRetry():retry.UsAmateurReturnRetryCareer {
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

/** Actual three optional seasons; callers can test distinct persistence boundaries on the same scenario. */
export function nativeExhaustedUsReturnRetry():retry.UsAmateurReturnRetryCareer {
 let c=nativeOptionalUsReturnRetry();
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
 c=retry.declineUsAmateurReturnRetryUsOpportunity(c,c.revision,q.assessmentKey);
 return c;
}

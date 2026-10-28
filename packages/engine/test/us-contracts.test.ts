import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as engine from '../src/index.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startNextUsMinorSeason,usYearTransitionReadiness} from '../src/us-year-transition.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {usCareerView} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';
type Funding={organizationId:string;addedBudgetUsd:number};
type MarketView={status:string;freeAgent:boolean;offers:{offerKey:string;clubId:string;initialLevel:string;annualSalaryUsd:number;years:number;guaranteedUsd:number}[]};
interface ContractApi {
 usMajorContractTerms(ovr:number,performance:number,startingAge:number):{annualSalaryUsd:number;years:number;guaranteedUsd:number};
 prepareUsContractMarket(c:UsCareer,revision:number,funding:readonly Funding[]):UsCareer;
 usContractMarketView(c:UsCareer):MarketView;
 acceptUsContractOffer(c:UsCareer,revision:number,offerKey:string):UsCareer;
 startNextUsContractSeason(c:UsCareer,revision:number):UsCareer;
}
function api(){const a=engine as unknown as ContractApi;assert.equal(typeof a.prepareUsContractMarket,'function','missing US contract lifecycle');return a;}
const digest=(c:unknown)=>createHash('sha256').update(canonicalJson(c)).digest('hex');
let cached:UsCareer|undefined;
/** Certified controlled seasons/PS isolate annual rights; first new-year date is separately played natively. */
function expired(){
 if(!cached){let c=finishedUsCareerFixture();for(let i=0;i<5;i++){let n=startNextUsMinorSeason(c,c.revision,c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0})));n=confirmUsPreseasonPlan(n,n.revision);n=publishUsSeasonSchedule(n,n.revision);c=finishedUsCareerFixture(n);}cached=c;}
 return structuredClone(cached);
}
const funded=(c:UsCareer)=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:100_000_000}));

test('MLB terms enforce the final salary floor and starting-age term boundaries',()=>{
 const a=api();
 for(const [ovr,perf,age,salary,years] of [[65,0,29,800000,5],[65,100,30,960000,3],[80,50,32,6000000,3],[80,50,33,6000000,2],[80,50,35,6000000,2],[80,50,36,6000000,1]] as const){
  assert.deepEqual(a.usMajorContractTerms(ovr,perf,age),{annualSalaryUsd:salary,years,guaranteedUsd:salary*years});
 }
 for(const args of [[NaN,50,20],[80,101,20],[80,50,18],[80,50,46]])assert.throws(()=>a.usMajorContractTerms(args[0]!,args[1]!,args[2]!));
});

test('unexpired original minor control cannot be replaced by an unsolicited offseason market',()=>{
 const a=api(),c=finishedUsCareerFixture(),before=digest(c);
 assert.throws(()=>a.prepareUsContractMarket(c,c.revision,funded(c)),/CONTRACT_NOT_AVAILABLE/);
 assert.equal(digest(c),before);
});

test('expired control fixes at most three real offers without changing current affiliation, money, RNG or records',()=>{
 const a=api(),c=expired(),before=digest(c),market=a.prepareUsContractMarket(c,c.revision,funded(c)),view=a.usContractMarketView(market);
 assert.equal(view.freeAgent,true);assert.equal(view.status,'OPEN');assert.ok(view.offers.length>0&&view.offers.length<=3);
 assert.equal(new Set(view.offers.map(o=>o.clubId)).size,view.offers.length);
 assert.ok(view.offers.every(o=>o.years===5&&o.annualSalaryUsd>=800000&&o.guaranteedUsd===o.annualSalaryUsd*5));
 assert.equal(digest(c),before);
 for(const key of ['world','inventory','income','registration','contract','records'] as const)assert.equal(digest(market[key]),digest(c[key]));
 assert.deepEqual(a.prepareUsContractMarket(JSON.parse(JSON.stringify(c)),c.revision,funded(c)),market);
 const retry=a.prepareUsContractMarket(market,market.revision,funded(c));assert.deepEqual(retry,market);
 const originalOffer=view.offers[0]!.annualSalaryUsd;view.offers[0]!.annualSalaryUsd=1;
 assert.equal(a.usContractMarketView(market).offers[0]!.annualSalaryUsd,originalOffer);
 assert.doesNotMatch(JSON.stringify(a.usContractMarketView(market)),/potential|rng|seed|sourceBasis/);
});

test('accepted external offer activates once next year, reserves guarantee once and pays the first actual date identically after JSON',()=>{
 const a=api(),c=expired(),market=a.prepareUsContractMarket(c,c.revision,funded(c)),view=a.usContractMarketView(market),offer=view.offers.find(o=>o.clubId!==c.protagonistOrganizationId)!;
 assert.ok(offer);const before=digest(market),accepted=a.acceptUsContractOffer(market,market.revision,offer.offerKey);
 assert.equal(digest(market),before);assert.equal(accepted.protagonistOrganizationId,c.protagonistOrganizationId);
 assert.deepEqual(accepted.income,c.income);assert.deepEqual(accepted.inventory,c.inventory);
 let next=a.startNextUsContractSeason(accepted,accepted.revision);
 assert.equal(next.schemaVersion,4);assert.equal(next.world.seasonKey,'2036');assert.equal(next.world.players[c.protagonistKey]!.age,25);
 assert.equal(next.protagonistOrganizationId,offer.clubId);assert.equal(next.registration.level,'MLB');assert.equal(next.contract.annualSalaryUsd,offer.annualSalaryUsd);
 assert.equal(next.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd,c.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd+100000000-offer.guaranteedUsd);
 assert.equal(next.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);assert.deepEqual(next.records,c.records);
 assert.equal(usCareerView(next).club.id,offer.clubId);
 assert.throws(()=>a.startNextUsContractSeason(next,next.revision),/NOT_READY|NOT_AVAILABLE/);
 next=confirmUsPreseasonPlan(next,next.revision);next=publishUsSeasonSchedule(next,next.revision);next=startUsRegularSeason(next,next.revision);
 let replay=JSON.parse(JSON.stringify(next)) as UsCareer;
 for(let i=0;i<160&&!next.season!.days.length;i++){next=advanceUsCareer(next,next.revision).career;replay=advanceUsCareer(replay,replay.revision).career;}
 assert.equal(next.season!.days.length,1);assert.equal(digest(next),digest(replay));
 const span=next.season!.lastDay-next.season!.firstDay+1;
 assert.equal(next.season!.paidUsd,Math.floor(offer.annualSalaryUsd/span));
 assert.equal(next.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd,c.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd+100000000-offer.guaranteedUsd);
 assert.equal(next.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);
 console.log('US contract native date:',JSON.stringify({year:next.world.seasonKey,age:25,level:next.registration.level,games:Object.values(next.records.games).filter(g=>g.scope.seasonKey==='2036').length,firstSalary:next.season!.paidUsd,guaranteeReservedOnce:true,jsonEqual:true}));
});

test('tampered offers and incomplete funding cannot commit; a missing offer never auto-signs',()=>{
 const a=api(),c=expired(),before=digest(c);
 assert.throws(()=>a.prepareUsContractMarket(c,c.revision,[]),/FUNDING/);
 const prepared=a.prepareUsContractMarket(c,c.revision,funded(c));
 assert.throws(()=>a.acceptUsContractOffer(prepared,prepared.revision,'unknown'),/OFFER/);
 const bad=structuredClone(prepared) as UsCareer&{contractMarket:{offers:{annualSalaryUsd:number}[]}};bad.contractMarket.offers[0]!.annualSalaryUsd=1;
 assert.throws(()=>a.usContractMarketView(bad),/CONTRACT|MARKET/);
 assert.equal(digest(c),before);
 assert.equal(usYearTransitionReadiness(c).blockers.includes('CONTRACT_DECISION_REQUIRED'),true);
});

test('funded multi-year carry preserves the guarantee and USD history without requesting another contract or reservation',()=>{
 const a=api(),c=expired(),m=a.prepareUsContractMarket(c,c.revision,funded(c)),offer=a.usContractMarketView(m).offers[0]!,accepted=a.acceptUsContractOffer(m,m.revision,offer.offerKey);
 let pre=a.startNextUsContractSeason(accepted,accepted.revision);pre=confirmUsPreseasonPlan(pre,pre.revision);pre=publishUsSeasonSchedule(pre,pre.revision);
 const closed=finishedUsCareerFixture(pre),before=digest(closed),available=closed.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd;
 assert.equal(closed.season!.paidUsd,offer.annualSalaryUsd);assert.equal(usYearTransitionReadiness(closed).ready,true);
 assert.throws(()=>a.prepareUsContractMarket(closed,closed.revision,funded(closed)),/CONTRACT_NOT_AVAILABLE/);
 const next=a.startNextUsContractSeason(closed,closed.revision);
 assert.equal(next.world.seasonKey,'2037');assert.equal(next.world.players[c.protagonistKey]!.age,26);
 assert.equal(next.contract.contractKey,closed.contract.contractKey);assert.equal(next.contract.annualSalaryUsd,offer.annualSalaryUsd);
 assert.equal(next.inventory.clubs.find(o=>o.id===offer.clubId)!.availableBudgetUsd,available);
 assert.deepEqual(next.income,closed.income);assert.deepEqual(next.records,closed.records);assert.equal(digest(closed),before);
 assert.equal(usCareerView(next).contract.annualSalaryUsd,offer.annualSalaryUsd);
  const forged=structuredClone(next);forged.contractYears![0]!.market!.sourceBasis='FORGED';
  assert.throws(()=>usCareerView(forged),/CONTRACT_HISTORY|CONTRACT_MARKET/,'archived market source must stay authenticated');
  const rightsChanged=structuredClone(next),first=rightsChanged.contractYears![0]!;
  first.market!.freeAgent=false;first.nextRights.sourceType='RENEWAL';rightsChanged.rights.sourceType='RENEWAL';
  assert.throws(()=>usCareerView(rightsChanged),/CONTRACT_HISTORY|CONTRACT_MARKET/,'six completed minor seasons cannot become a renewal');
  const changedRevision=structuredClone(next);changedRevision.contractYears![0]!.market!.sourceRevision=0;
  assert.throws(()=>usCareerView(changedRevision),/CONTRACT_HISTORY|CONTRACT_MARKET/);
  const changedClauses=structuredClone(next),archived=changedClauses.contractYears![0]!,picked=archived.market!.offers.find(o=>o.offerKey===archived.market!.acceptedOfferKey)!;
  picked.militaryReturnOption=!picked.militaryReturnOption;archived.nextContract.militaryReturnOption=picked.militaryReturnOption;changedClauses.contract.militaryReturnOption=picked.militaryReturnOption;
  assert.throws(()=>usCareerView(changedClauses),/CONTRACT_HISTORY|CONTRACT_MARKET/,'signed clauses cannot be rewritten in history');
 const altered=structuredClone(next);altered.contractYears![0]!.nextContract.term!.guaranteedUsd++;
 assert.throws(()=>usCareerView(altered),/CONTRACT_HISTORY|ENTRY_VIEW/);
});

test('declining the fixed market closes its blocking event without signing, budget writes or automatic retirement',()=>{
 const a=api() as ContractApi&{declineUsContractOffers(c:UsCareer,revision:number):UsCareer};
 assert.equal(typeof a.declineUsContractOffers,'function');
 const c=expired(),m=a.prepareUsContractMarket(c,c.revision,funded(c)),before=digest(m);
 const declined=a.declineUsContractOffers(m,m.revision);
 assert.equal(a.usContractMarketView(declined).status,'DECLINED');
 assert.ok(declined.events.every(e=>e.status!=='OPEN'));
 for(const key of ['contract','inventory','world','records','income'] as const)assert.deepEqual(declined[key],c[key]);
 assert.equal(declined.phaseContext.phase,'SEASON_REVIEW');assert.equal(declined.retirement,undefined);
 assert.throws(()=>a.startNextUsContractSeason(declined,declined.revision),/CONTRACT_NOT_AVAILABLE/);
 assert.equal(digest(m),before);
});

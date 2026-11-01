import test from 'node:test';
import assert from 'node:assert/strict';
import {KBO_MONEY} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import {kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {compareKboOffseasonOffers} from '../src/kbo-offseason-exit.js';
import {canonicalJson} from '../src/game.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from '../src/growth-ledger.js';
import {closeSeasonHealth} from '../src/health.js';
import * as retry from '../src/career-pro-retry.js';

/** Controlled closed pro season and budget saturation prefix; all retry competition/market commands are native. */
function noOffer(){
 const c=enteredKboCareer();c.schemaVersion=7;c.phaseContext={phase:'SEASON_REVIEW'};c.military={status:'COMPLETED',applications:[]};
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,days:[{day:300,evidence:'controlled-retry-source',result:{injured:[],recovered:[]}}]};
 const growth=createSeasonGrowthLedger(c.world.players[c.protagonistKey]!,c.world.seasonKey,c.world.calendar.growthDays.length),closed=finalizeSeasonGrowth(c.world.players[c.protagonistKey]!,growth,c.world.calendar.growthDays.length);c.world.players[c.protagonistKey]=closed.player;c.seasonGrowth=closed.ledger;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;
 c.seasonClose={receiptKey:'controlled-pro-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:closed.lossUnits,trainingForfeited:true};
 for(const club of c.world.clubs){for(const key of club.roster)if(key!==c.protagonistKey)c.world.contracts[key]!.years=2;let remaining=club.budgetWon*.9-kboFutureCommitmentWon(c.world,club.id,1);for(const key of club.roster){if(key===c.protagonistKey)continue;const contract=c.world.contracts[key]!,amount=Math.min(remaining,KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon);contract.annualSalaryWon+=amount;club.reservedSalaryWon+=amount;remaining-=amount;}assert.equal(remaining,0);}
 return compareKboOffseasonOffers(c,c.revision);
}
test('genuine empty pro market opens E34; root CAS and owned preview guard independent preparation',()=>{
 const source=noOffer(),before=canonicalJson(source);assert.equal(source.offseasonExit!.offers.length,0);
 const opened=retry.openKboUncontractedRetry(source,source.revision),e=opened.events.find(e=>e.definitionId==='E34')!;
 assert.equal(e.status,'OPEN');assert.equal(canonicalJson(source),before);assert.throws(()=>retry.openKboUncontractedRetry(source,source.revision-1),/REVISION/);
 const c=retry.reviewKboUncontractedRoutes(opened,opened.revision,e.version),view=retry.kboRetryRoutesView(c);
 assert.ok(view.routes.some(r=>r.routeId==='PREPARATION'));assert.ok(!view.routes.some(r=>r.routeId==='COLLEGE_ENTRY'));assert.equal(view.rights.draftEligible,false);
 assert.throws(()=>retry.startKboRetryPreparation(c,c.revision,{routePreviewId:'stale'}),/PREVIEW_STALE/);
 const started=retry.startKboRetryPreparation(c,c.revision,{routePreviewId:view.routePreviewId});assert.equal(started.retryCareer!.careerPreparationUsed,0);assert.equal(started.preparationSeason!.world.leagueKey,'INDEPENDENT');assert.deepEqual(started.records,c.records);
 assert.deepEqual(started.military,c.military);assert.deepEqual(started.world,c.world);assert.equal(started.preparationSeason!.world.protagonistKey,c.protagonistKey);
});
test('native pro retry48 settles once; actual shared market quote accepts into playable KBO root',()=>{
 let c=noOffer();c=retry.openKboUncontractedRetry(c,c.revision);c=retry.reviewKboUncontractedRoutes(c,c.revision,1);c=retry.startKboRetryPreparation(c,c.revision,{routePreviewId:retry.kboRetryRoutesView(c).routePreviewId});c=retry.confirmKboRetryPreseason(c,c.revision);
 for(let i=0;i<2000&&c.preparationSeason!.nextWorldDay<=Math.max(...c.preparationSeason!.world.schedule.map(g=>g.worldDay));i++){const out=retry.advanceKboRetryPreparation(c,c.revision,'ONE_MONTH');assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(i===0)assert.equal(canonicalJson(out),canonicalJson(retry.advanceKboRetryPreparation(JSON.parse(JSON.stringify(c)),c.revision,'ONE_MONTH')));c=out.career;}
 c=retry.settleKboRetryPreparation(c,c.revision,true);assert.equal(c.retryCareer!.careerPreparationUsed,1);assert.equal(c.preparationSeason!.result!.completedTeamGames,48);assert.equal(retry.kboRetryPreparationView(c).evaluation?.kind,'PRO_MARKET_REVIEW');
 const view=retry.kboRetryRoutesView(c);assert.ok(view.offers.length);assert.throws(()=>retry.acceptKboRetryOffer(c,c.revision,{routePreviewId:'stale',offerKey:view.offers[0]!.offerKey}),/PREVIEW_STALE/);
 const signed=retry.acceptKboRetryOffer(c,c.revision,{routePreviewId:view.routePreviewId,offerKey:view.offers[0]!.offerKey});assert.equal(signed.phaseContext.phase,'PRESEASON_SETUP');assert.equal(signed.world.contracts[signed.protagonistKey]!.contractKey,view.offers[0]!.offerKey);assert.equal(signed.world.players[signed.protagonistKey]!.simulationKey,c.protagonistKey);assert.deepEqual(signed.records,c.records);assert.equal(signed.retryCareer!.careerPreparationUsed,1);assert.equal(signed.world.clubs.filter(t=>t.roster.includes(c.protagonistKey)).length,1);
});

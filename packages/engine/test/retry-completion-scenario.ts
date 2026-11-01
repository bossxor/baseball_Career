import assert from 'node:assert/strict';
import {KBO_MONEY} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {compareKboOffseasonOffers} from '../src/kbo-offseason-exit.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from '../src/growth-ledger.js';
import {closeSeasonHealth} from '../src/health.js';
import {openRetryCareerEpisode,assertRetryCareerLedger} from '../src/retry-career.js';
import * as retry from '../src/career-pro-retry.js';

/** Controlled unplayed pro closure and saturated future budgets. Retry commands and independent games are native. */
export function retryNoOfferPrefix(priorTwo=false){
 const c=enteredKboCareer();c.schemaVersion=7;c.phaseContext={phase:'SEASON_REVIEW'};c.military={status:'COMPLETED',applications:[]};
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,days:[{day:300,evidence:'controlled-retry-source',result:{injured:[],recovered:[]}}]};
 if(priorTwo)c.world.players[c.protagonistKey]!.age=23;
 const growth=createSeasonGrowthLedger(c.world.players[c.protagonistKey]!,c.world.seasonKey,c.world.calendar.growthDays.length),closed=finalizeSeasonGrowth(c.world.players[c.protagonistKey]!,growth,c.world.calendar.growthDays.length);c.world.players[c.protagonistKey]=closed.player;c.seasonGrowth=closed.ledger;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;
 c.seasonClose={receiptKey:'controlled-pro-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:closed.lossUnits,trainingForfeited:true};
 for(const club of c.world.clubs){for(const key of club.roster)if(key!==c.protagonistKey)c.world.contracts[key]!.years=2;let remaining=club.budgetWon*.9-kboFutureCommitmentWon(c.world,club.id,1);for(const key of club.roster){if(key===c.protagonistKey)continue;const contract=c.world.contracts[key]!,amount=Math.min(remaining,KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon);contract.annualSalaryWon+=amount;club.reservedSalaryWon+=amount;remaining-=amount;}assert.equal(remaining,0);}
 if(priorTwo){
  // Prior completed optional periods are a labelled controlled prefix, never counted as native simulated seasons.
  const r=openRetryCareerEpisode(undefined,0,{worldKey:c.world.worldKey,playerKey:c.protagonistKey,seasonKey:'2027',age:20,reason:'PRO_RELEASED',receiptKey:'controlled-prior-episode'}),episodeId=r.episodes[0]!.episodeId;
  c.retryCareer={...r,seasonKey:c.world.seasonKey,age:23,careerPreparationUsed:2,phase:'ROUTE_REVIEW',periods:['2028','2029'].map(seasonKey=>({worldSeasonId:seasonKey,episodeId,startDay:31,endDay:181,usageCharged:true,evidenceReceipt:`controlled-prior-completion-${seasonKey}`}))};assertRetryCareerLedger(c.retryCareer);
 }
 return compareKboOffseasonOffers(c,c.revision);
}
export interface RetryScenarioCommand {command:string;input:unknown;output:KboCareer}
let cached:ReturnType<typeof executeExhaustion>|undefined;
/** P16: controlled prior2, actual native final48, actual zero-offer evaluation, explicit E35 confirmation. */
export function runRetryExhaustionScenario(){cached??=executeExhaustion();return structuredClone(cached);}
function executeExhaustion(){
 const initialState=retryNoOfferPrefix(true),commands:RetryScenarioCommand[]=[];let c=initialState;
 const apply=(command:string,input:unknown,next:KboCareer)=>{commands.push({command,input,output:next});c=next;};
 apply('OPEN_KBO_UNCONTRACTED_RETRY',{revision:c.revision},retry.openKboUncontractedRetry(c,c.revision));
 apply('OPEN_UNCONTRACTED_ROUTES',{revision:c.revision,eventVersion:1},retry.reviewKboUncontractedRoutes(c,c.revision,1));
 const routePreviewId=retry.kboRetryRoutesView(c).routePreviewId;
 apply('START_PREPARATION',{revision:c.revision,routePreviewId},retry.startKboRetryPreparation(c,c.revision,{routePreviewId}));
 apply('CONFIRM_PRESEASON',{revision:c.revision},retry.confirmKboRetryPreseason(c,c.revision));
 for(let i=0;i<2000&&c.preparationSeason!.nextWorldDay<=Math.max(...c.preparationSeason!.world.schedule.map(g=>g.worldDay));i++){const input={revision:c.revision,mode:'ONE_MONTH' as const},out=retry.advanceKboRetryPreparation(c,c.revision,input.mode);assert.notEqual(out.stopReason,'ENGINE_LIMIT');apply('ADVANCE_PREPARATION',input,out.career);}
 apply('SETTLE_PREPARATION',{revision:c.revision,forfeitUnusedTraining:true},retry.settleKboRetryPreparation(c,c.revision,true));
 assert.equal(c.retryCareer!.careerPreparationUsed,3);assert.equal(retry.kboRetryRoutesView(c).offers.length,0);
 apply('OPEN_RETRY_EXHAUSTION',{revision:c.revision},retry.openKboRetryExhaustion(c,c.revision));
 const e=c.events.find(e=>e.definitionId==='E35')!,input={eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE' as const};
 apply('CONFIRM_RETIRE',{revision:c.revision,...input},retry.confirmKboRetryExhaustion(c,c.revision,input));
 assert.equal(c.phaseContext.phase,'ARCHIVED');
 return {prefix:'CONTROLLED_CLOSED_PRO_SEASON_BUDGETS_AND_TWO_PRIOR_OPTIONAL_COMPLETIONS',initialState,commands,finalState:c,nativePreparationSeasons:1};
}

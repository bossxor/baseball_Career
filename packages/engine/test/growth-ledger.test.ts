import assert from 'node:assert/strict';
import test from 'node:test';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods,finalizeSeasonGrowth,validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import type {ClosedGrowthPeriod} from '../src/growth-ledger.js';
import type {GrowthPeriod} from '../src/development.js';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {abilityKeys,overall} from '@playball/rules';
import {applySeasonTraining} from '../src/training.js';
import {canShowUsDirect} from '../src/draft.js';
const player=(difficulty:'GROWTH'|'REALISTIC'|'SECRET_CHEAT'='SECRET_CHEAT')=>createCareerPlayer({simulationKey:'growth-player',name:'육성선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty},seedPcg32(42n,54n)).player;
const period=(overrides:Partial<GrowthPeriod>={}):GrowthPeriod=>({startDay:0,endDay:50,levelSeasonDays:100,level:'HIGH_SCHOOL',appearances:50,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:'GROWTH',beneficiary:true},...overrides});
const closed=(key:string,p:GrowthPeriod,focus:readonly string[]=abilityKeys('HITTER').slice(0,4),archetype='BALANCED'):ClosedGrowthPeriod=>({periodKey:key,period:p,focus,archetype});
test('22/42: HS partial then same-year next period shares one cumulative budget; duplicate gives0',()=>{
 const source=player(),ledger=createSeasonGrowthLedger(source,'2027',100),firstEntry=closed('hs',period()),secondEntry=closed('pro',period({startDay:50,endDay:100}));
 const first=settleClosedGrowthPeriods(source,ledger,[firstEntry]);assert.equal(first.newBudgetUnits,82_500);
 const second=settleClosedGrowthPeriods(first.player,first.ledger,[firstEntry,secondEntry]);assert.equal(second.newBudgetUnits,82_500);assert.equal(second.ledger.totalBudgetUnits,165_000);
 const single=settleClosedGrowthPeriods(source,ledger,[firstEntry,secondEntry]);assert.deepEqual(single.player,second.player);assert.deepEqual(single.ledger,second.ledger);
 const retry=settleClosedGrowthPeriods(second.player,second.ledger,[firstEntry,secondEntry]);assert.equal(retry.newBudgetUnits,0);assert.equal(retry.newGainedUnits,0);assert.deepEqual(retry.player,second.player);
 assert.equal(ledger.totalBudgetUnits,0);assert.equal(Object.values(source.abilities).reduce((a,b)=>a+b,0),3_000_000);
});
test('22: period-specific focus/type allocations preserved; old history does not overwrite current plan',()=>{
 const source=player(),currentFocus=['CONTACT','POWER','RUNNING','CLUTCH'];source.focus=currentFocus;source.archetype='SLUGGER';
 const a=closed('before',period(),['CONTACT','POWER','DISCIPLINE','DEFENSE'],'BALANCED'),b=closed('after',period({startDay:50,endDay:100}),currentFocus,'SLUGGER');
 const result=settleClosedGrowthPeriods(source,createSeasonGrowthLedger(source,'2027',100),[a,b]);assert.deepEqual(result.player.focus,currentFocus);assert.equal(result.player.archetype,'SLUGGER');
 assert.deepEqual(result.ledger.entries[0]!.gains,[16500,16500,16500,16500,8250,8250]);
 assert.equal(result.ledger.entries[1]!.gains[4],16500);assert.equal(result.ledger.entries[1]!.gains[5],16500);
});
test('90: cumulative integer rounding conserved across tiny periods; capped loss never refunds',()=>{
 let source=player(),ledger=createSeasonGrowthLedger(source,'tiny',3);
 for(let i=0;i<3;i++){const result=settleClosedGrowthPeriods(source,ledger,[closed('p'+i,period({startDay:i,endDay:i+1,levelSeasonDays:3,appearances:0,policy:{mode:'CAREER',difficulty:'REALISTIC',beneficiary:true}}))]);source=result.player;ledger=result.ledger;}
 assert.deepEqual(ledger.entries.map(e=>e.budgetUnits),[23333,23334,23333]);assert.equal(ledger.totalBudgetUnits,70000);assert.equal(Object.values(source.abilities).reduce((a,b)=>a+b,0),3_070_000);
 const capped=player();capped.abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,1_000_000]));capped.careerPeaks={...capped.abilities};
 const result=settleClosedGrowthPeriods(capped,createSeasonGrowthLedger(capped,'cap',100),[closed('a',period()),closed('b',period({startDay:50,endDay:100}))]);
 assert.equal(result.newGainedUnits,0);assert.equal(result.newDiscardedUnits,165000);assert.equal(result.ledger.totalBudgetUnits,165000);
});
test('71: altered evidence, overlap, damaged totals and post-final new period rejected atomically',()=>{
 const source=player(),ledger=createSeasonGrowthLedger(source,'2027',100),entry=closed('a',period()),result=settleClosedGrowthPeriods(source,ledger,[entry]);
 const before=JSON.stringify(result);assert.throws(()=>settleClosedGrowthPeriods(result.player,result.ledger,[{...entry,archetype:'SLUGGER'}]),/GROWTH_EVIDENCE_REUSED/);
 assert.throws(()=>settleClosedGrowthPeriods(result.player,result.ledger,[closed('overlap',period({startDay:49,endDay:75}))]));assert.equal(JSON.stringify(result),before);
 const corrupt=structuredClone(result.ledger);corrupt.totalBudgetUnits=0;assert.throws(()=>validateSeasonGrowthLedger(corrupt),/GROWTH_LEDGER_TOTAL_MISMATCH/);
 const done=finalizeSeasonGrowth(result.player,result.ledger,100);assert.throws(()=>settleClosedGrowthPeriods(done.player,done.ledger,[closed('b',period({startDay:50,endDay:100}))]),/GROWTH_SEASON_FINALIZED/);
 assert.equal(settleClosedGrowthPeriods(done.player,done.ledger,[entry]).newBudgetUnits,0);
});
test('22: aging settles once on elapsed calendar fraction, unmultiplied; peak preserved',()=>{
 const source={...player(),age:35},ledger=createSeasonGrowthLedger(source,'old',100),growth=settleClosedGrowthPeriods(source,ledger,[closed('military',period({ordinaryMilitary:true,startDay:0,endDay:100}))]);assert.equal(growth.newBudgetUnits,0);
 const aged=finalizeSeasonGrowth(growth.player,growth.ledger,50);assert.equal(aged.lossUnits,25000);assert.deepEqual(aged.player.careerPeaks,source.careerPeaks);validateSeasonGrowthLedger(aged.ledger);
 assert.deepEqual(finalizeSeasonGrowth(aged.player,aged.ledger,50),{player:aged.player,ledger:aged.ledger,lossUnits:0,duplicate:true});assert.throws(()=>finalizeSeasonGrowth(aged.player,aged.ledger,100));
});
test('approved US52: full HS period hard starter plus guaranteed+1 can reach gate without cheat growth',()=>{
 const source=player('REALISTIC'),ledger=createSeasonGrowthLedger(source,'hs',100),growth=settleClosedGrowthPeriods(source,ledger,[closed('hs',period({startDay:0,endDay:100,appearances:100,policy:{mode:'CAREER',difficulty:'REALISTIC',beneficiary:true}}))]);assert.equal(growth.newBudgetUnits,110000);
 const trained=applySeasonTraining(growth.player,[],{type:'GUARANTEED',ability:'CONTACT'},{seasonId:'hs',completedTeamGames:48,scheduledTeamGames:48,injured:false,windowOpen:true,careerCheat:false},seedPcg32(42n,54n)).player;
 const ovr=overall('HITTER',trained.abilities);assert.equal(ovr.sumUnits/ovr.denominator,52);assert.equal(canShowUsDirect({overall:ovr.sumUnits/ovr.denominator,amateurScore:50,validOfferCount:1,eligible:true}),true);
 // This is a math-path fixture, not a simulated first-season or offer-generation integration pass.
});

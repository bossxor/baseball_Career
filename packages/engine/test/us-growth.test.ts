import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedUsCareer} from './us-fixtures.js';
import {startUsRegularSeason,US_LEVELS,usSalaryEntitlement} from '../src/us-season.js';
import {settleUsSeasonGrowth,auditUsClosedDays} from '../src/us-growth.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
import {validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import type {UsCareer} from '../src/us-career-entry.js';
/** Controlled certified contribution/date fixtures; not a native8790-game playthrough. */
let cached:UsCareer|undefined;
function reviewed(){if(cached)return structuredClone(cached);const p=preparedUsCareer(),c=startUsRegularSeason(p,p.revision),s=c.season!,key=c.protagonistKey,level=c.registration.level,club=c.protagonistOrganizationId;c.world.players[key]!.potential=Object.fromEntries(Object.keys(c.world.players[key]!.potential).map(k=>[k,1000000]));
 const zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};for(const league of US_LEVELS)for(const g of c.seasonSchedule!.leagues[league]){const own=league===level&&(g.homeTeamKey===club||g.awayTeamKey===club),batting=own?{[key]:{...emptyBatting(),PA:4,AB:4,K:4,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{};c.records.games[g.simulationKey]={gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},[g.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting,pitching:{},batterSplits:own?{[key]:{L:{...zero},R:{...zero,PA:4,AB:4,K:4}}}:{},pitcherSplits:{},matchups:{}};}
 for(let day=s.firstDay;day<=s.lastDay;day++){const games=US_LEVELS.flatMap(l=>c.seasonSchedule!.leagues[l].filter(g=>g.worldDay===day).map(g=>c.records.games[g.simulationKey]!)),amount=usSalaryEntitlement(c,day-s.firstDay+1)-s.paidUsd,entryKey=JSON.stringify(['us-salary',c.contract.contractKey,c.world.seasonKey,day]);s.days.push({day,evidence:canonicalJson(games),level,appearances:games.reduce((n,g)=>n+(g.batting[key]?.PA??0),0),rehabilitating:false,injured:[],recovered:[]});s.paidUsd+=amount;s.payroll=[...s.payroll,{day,amount,entryKey}];c.income=[...c.income,{entryKey,currency:'USD',kind:'SALARY',amount,day,seasonKey:c.world.seasonKey}];}c.phaseContext={phase:'SEASON_REVIEW'};cached=c;return structuredClone(c);}
test('US full-date annual settlement pays one PRO budget, all opening NPCs and one aging; explicit forfeiture and replay keep receipts',()=>{
 const c=reviewed(),raw=canonicalJson(c);assert.throws(()=>settleUsSeasonGrowth(c,c.revision),/TRAINING_DECISION_REQUIRED/);const n=settleUsSeasonGrowth(c,c.revision,true);assert.equal(canonicalJson(c),raw);assert.equal(n.season!.paidUsd,30000);assert.ok(n.seasonGrowth.totalBudgetUnits>0);assert.ok(n.seasonGrowth.entries[0]!.gainedUnits>0);assert.equal(n.seasonGrowth.finalized,true);validateSeasonGrowthLedger(n.seasonGrowth);assert.equal(Object.keys(n.season!.growthFinalized!.npcs).length,3420);assert.deepEqual(settleUsSeasonGrowth(n,n.revision),n);assert.deepEqual(settleUsSeasonGrowth(JSON.parse(JSON.stringify(c)),c.revision,true),n);assert.equal(n.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);
});
test('US annual audit refuses changed FINAL totals and incomplete date receipts before awarding growth',()=>{
 const c=reviewed(),bad=structuredClone(c),g=bad.seasonSchedule!.leagues.ROOKIE[0]!;bad.records.games[g.simulationKey]!.teams[g.homeTeamKey]!.R++;assert.throws(()=>settleUsSeasonGrowth(bad,bad.revision,true),/EVIDENCE_CHANGED/);const missing=structuredClone(c);missing.season!.days.pop();assert.throws(()=>settleUsSeasonGrowth(missing,missing.revision,true),/PAYROLL|NOT_CLOSED/);auditUsClosedDays(c);
});

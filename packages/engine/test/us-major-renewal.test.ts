import {usLevelFixture} from './us-level-fixture.js';
import {reviewUsLevel,resolveUsLevelEvent} from '../src/us-levels.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {closedUsMajorFixture,finishControlledMajorSeason} from './us-major-fixture.js';
import {preparedUsCareer} from './us-fixtures.js';
import {usMajorContractValue,usMlbOfferYears} from '../src/us-contract-value.js';
import {usMajorRenewalPreview,startNextUsMajorSeason} from '../src/us-major-renewal.js';
import {usCareerView} from '../src/us-career-entry.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {setUsPreseasonFocus,confirmUsPreseasonPlan,unreadUsFirstCampNotices} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer,usSalaryEntitlement} from '../src/us-season.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
import {mlbServiceTime} from '../src/us-service-time.js';
const digest=(c:unknown)=>createHash('sha256').update(canonicalJson(c)).digest('hex');
const funding=(c:UsCareer)=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:20_000_000}));
function opening(c:UsCareer){let n=setUsPreseasonFocus(c,c.revision,c.world.players[c.protagonistKey]!.focus);assert.equal(unreadUsFirstCampNotices(n).length,0);n=confirmUsPreseasonPlan(n,n.revision);return publishUsSeasonSchedule(n,n.revision);}

test('US final salary floor survives poor performance and market periods use contract-start age, without hidden-P price effects',()=>{
 const c=preparedUsCareer(),p=structuredClone(c.world.players[c.protagonistKey]!),low={...emptyBatting(),PA:100,AB:100,K:100};p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,500000]));
 const before=digest(p),value=usMajorContractValue(p,low);assert.equal(value.basis.performanceIndex,0);assert.equal(value.annualSalaryUsd,800000);assert.equal(digest(p),before);
 const high=structuredClone(p);high.potential=Object.fromEntries(Object.keys(high.potential).map(k=>[k,1000000]));assert.deepEqual(usMajorContractValue(high,low),value);
 for(const [age,years]of [[18,5],[29,5],[30,3],[32,3],[33,2],[35,2],[36,1],[45,1]])assert.equal(usMlbOfferYears(age!),years);
 for(const age of [17,46,NaN,29.5])assert.throws(()=>usMlbOfferYears(age),/START_AGE/);
});

test('controlled annual major renewal creates root4, funds one salary once, preserves source/records/service/options and pays its first native date',()=>{
 const c=closedUsMajorFixture(),raw=digest(c),quote=usMajorRenewalPreview(c),own=c.protagonistOrganizationId,key=c.protagonistKey;c.season!.options![key]={used:1,seasons:['2030'],minorGames:0};
 const afterOptions=digest(c),next=startNextUsMajorSeason(c,c.revision,funding(c));assert.equal(quote.years,1);assert.equal(quote.annualSalaryUsd,5_680_000);assert.equal(next.schemaVersion,4);assert.equal(digest(c),afterOptions);assert.notEqual(raw,afterOptions);
 assert.equal(next.contract.years,1);assert.equal(next.contract.signingBonusUsd,0);assert.deepEqual(next.income,c.income);assert.equal(next.records,c.records);assert.equal(next.income.filter(i=>i.kind==='SIGNING_BONUS').length,1);assert.equal(next.inventory.clubs.find(o=>o.id===own)!.availableBudgetUsd,c.inventory.clubs.find(o=>o.id===own)!.availableBudgetUsd+20_000_000-5_680_000);assert.equal(next.majorYears!.length,1);assert.equal(next.world.players[key]!.age,c.world.players[key]!.age+1);
 assert.deepEqual(mlbServiceTime(next.records,next.health,key),mlbServiceTime(c.records,c.health,key));assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(c))),usCareerView(c));
 let active=opening(next);active=startUsRegularSeason(active,active.revision);assert.equal(active.schemaVersion,4);assert.equal(usSalaryEntitlement(active,active.season!.lastDay-active.season!.firstDay+1),5_680_000);assert.equal(active.season!.options![key]!.used,1);assert.deepEqual(active.season!.options![key]!.seasons,['2030']);
 for(let i=0;i<350&&!active.season!.days.length;i++){const r=advanceUsCareer(active,active.revision);assert.notEqual(r.stopReason,'ENGINE_LIMIT');assert.notEqual(r.stopReason,'ROSTER_DECISION_REQUIRED');active=r.career;if(i===349)throw Error('native major date limit');}
 assert.equal(active.season!.days.length,1);assert.ok(active.season!.paidUsd>0);assert.ok(active.income.filter(i=>i.kind==='SALARY'&&i.seasonKey===active.world.seasonKey).every(i=>JSON.parse(i.entryKey)[1]===active.contract.contractKey));
 console.log('Major annual native proof:',JSON.stringify({from:c.world.seasonKey,to:active.world.seasonKey,schema:active.schemaVersion,salary:active.contract.annualSalaryUsd,paid:active.season!.paidUsd,nativeNewYearGames:Object.values(active.records.games).filter(g=>g.scope.seasonKey===active.world.seasonKey).length,oldRecords:Object.keys(c.records.games).length,signingBonuses:active.income.filter(i=>i.kind==='SIGNING_BONUS').length}));
});

test('major renewal rejects stale source, insufficient funds and changed financial quote history without losing the old root',()=>{
 const c=closedUsMajorFixture(),raw=digest(c);assert.throws(()=>startNextUsMajorSeason(c,c.revision-1,funding(c)),/REVISION/);assert.throws(()=>startNextUsMajorSeason(c,c.revision,c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),/MAJOR_CONTRACT_BUDGET/);assert.equal(digest(c),raw);
 const next=startNextUsMajorSeason(c,c.revision,funding(c));next.majorYears![0]!.nextContract.annualSalaryUsd++;assert.throws(()=>usCareerView(next),/QUOTE_CHANGED/);
 const badRevision=startNextUsMajorSeason(c,c.revision,funding(c));badRevision.majorYears![0]!.recordRevision=-1;assert.throws(()=>usCareerView(badRevision),/INVALID_US_MAJOR_YEAR_HISTORY/);
 const minor=preparedUsCareer();assert.throws(()=>usMajorRenewalPreview(minor),/NOT_AVAILABLE/);
});

test('controlled seven MLB seasons retain partial first-year noncredit and stop automatic renewal at six credited seasons',()=>{
 let c=closedUsMajorFixture(),paid=c.season!.paidUsd;assert.equal(mlbServiceTime(c.records,c.health,c.protagonistKey).creditedSeasons,0);
 for(let i=0;i<6;i++){const next=startNextUsMajorSeason(c,c.revision,funding(c));c=finishControlledMajorSeason(opening(next));paid+=c.season!.paidUsd;assert.equal(c.schemaVersion,4);assert.equal(c.contract.years,1);assert.equal(mlbServiceTime(c.records,c.health,c.protagonistKey).creditedSeasons,i+1);}
 assert.equal(c.income.filter(i=>i.kind==='SALARY').reduce((n,i)=>n+i.amount,0),paid);assert.equal(c.income.filter(i=>i.kind==='SIGNING_BONUS').length,1);assert.equal(c.majorYears!.length,6);assert.throws(()=>usMajorRenewalPreview(c),/NOT_AVAILABLE/);assert.throws(()=>startNextUsMajorSeason(c,c.revision,funding(c)),/NOT_AVAILABLE/);
 console.log('Controlled major-years proof (not native seven seasons):',JSON.stringify({lastYear:c.world.seasonKey,yearsArchived:c.majorYears!.length,creditedSeasons:6,paidUsd:paid,signingBonuses:1}));
});

test('annual major contract survives an actual call-up command after controlled AAA registration without a second reservation',()=>{
 const previous=closedUsMajorFixture();let c=opening(startNextUsMajorSeason(previous,previous.revision,funding(previous)));c=startUsRegularSeason(c,c.revision);
 const key=c.protagonistKey,org=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!,other=org.levels.AAA.find(k=>c.world.players[k]!.kind===c.world.players[key]!.kind&&c.world.players[k]!.position===c.world.players[key]!.position)!;
 org.levels.MLB=org.levels.MLB.map(k=>k===key?other:k);org.levels.AAA=org.levels.AAA.map(k=>k===other?key:k);c.registration.level='AAA';
 const template=Object.values(usLevelFixture('AAA').records.games).find(g=>g.scope.leagueKey==='AAA')!,games=c.seasonSchedule!.leagues.AAA.filter(g=>g.homeTeamKey===org.id||g.awayTeamKey===org.id).slice(0,24);
 for(const g of games)c.records.games[g.simulationKey]={...structuredClone(template),gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'AAA',phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:1,L:0,T:0,R:1,RA:0},[g.awayTeamKey]:{games:1,W:0,L:1,T:0,R:0,RA:1}}};
 c.records.revision+=games.length;const day=games.at(-1)!.worldDay;c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 const offered=reviewUsLevel(c,day,c.phaseContext)!;assert.equal(offered.season!.levelReviews!.at(-1)!.outcome,'OFFERED');const e=offered.events.at(-1)!,next=resolveUsLevelEvent(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_CALLUP'});
 assert.deepEqual(next.contract,c.contract);assert.deepEqual(next.inventory,c.inventory);assert.deepEqual(next.income,c.income);assert.equal(next.season!.majorActivation,undefined);assert.equal(next.registration.level,'MLB');
});

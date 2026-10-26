import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import {preparedUsCareer} from './us-fixtures.js';
import {startUsPostseason} from '../src/us-postseason-progress.js';
import {nextMlbPostseasonGame,recordMlbPostseasonGame} from '../src/us-postseason.js';
import {canonicalJson} from '../src/game.js';
import {settleUsSeasonGrowth} from '../src/us-growth.js';
import {stageUsAgeAndRosters,usYearTransitionReadiness,startNextUsMinorSeason} from '../src/us-year-transition.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {beginPitchLearning} from '../src/repertoire.js';
import {closeSeasonHealth} from '../src/health.js';
import {usCareerView} from '../src/us-career-entry.js';
import {setUsPreseasonFocus,confirmUsPreseasonPlan,unreadUsFirstCampNotices} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer,usSalaryEntitlement} from '../src/us-season.js';
import {fundUsMinorYear} from '../src/us-minor-history.js';
const digest=(x:unknown)=>createHash('sha256').update(canonicalJson(x)).digest('hex');
let cached:UsCareer|undefined;
/** Controlled official regular/PS contribution fixture, not a native full-career simulation. */
function finished(prepared?:UsCareer){
 if(!prepared&&cached)return structuredClone(cached);const regular=reviewedUsCareerFixture(prepared),ids=regular.world.organizations.map(o=>o.id),c=startUsPostseason(regular,regular.revision,{AL:ids.slice(0,15),NL:ids.slice(15)});if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');const p=c.phaseContext;
 for(let g=nextMlbPostseasonGame(p.bracket);g;g=nextMlbPostseasonGame(p.bracket)){
  const s=p.bracket.series.find(s=>s.id===g!.seriesId)!,winner=s.higherSeed,key=JSON.stringify([c.world.seasonKey,'MLB','POSTSEASON',g.seriesId,g.gameNumber]),other=winner===g.homeTeamKey?g.awayTeamKey:g.homeTeamKey;
  c.records.games[key]={gameKey:key,worldDay:p.nextWorldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'MLB',phase:'POSTSEASON'},teams:{[winner]:{games:1,W:1,L:0,T:0,R:1,RA:0},[other]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.records.revision++;p.gameEvidence.push(canonicalJson(c.records.games[key]));p.bracket=recordMlbPostseasonGame(p.bracket,winner);p.nextWorldDay++;
 }
 c.postseason={bracket:p.bracket,conferences:p.conferences,gameEvidence:p.gameEvidence};c.phaseContext={phase:'SEASON_REVIEW'};const closed=settleUsSeasonGrowth(c,c.revision,true);if(!prepared)cached=closed;return prepared?closed:structuredClone(closed);
}
test('annual stage ages survivors once, retires45 NPCs through Rookie supply, preserves history and has no active/root or salary write',()=>{
 const c=finished(),club=c.world.organizations.find(o=>o.id!==c.protagonistOrganizationId)!,old=club.levels.MLB[0]!;c.world.players[old]!.age=45;const before=digest(c),ready=usYearTransitionReadiness(c);assert.equal(ready.ready,true);assert.equal(ready.remainingMinorControlSeasons,5);const stage=stageUsAgeAndRosters(c,c.revision),again=stageUsAgeAndRosters(JSON.parse(JSON.stringify(c)),c.revision);
 assert.equal(digest(stage),digest(again));assert.equal(digest(c),before);assert.equal(stage.targetSeasonKey,'2031');assert.equal(stage.world.players[c.protagonistKey]!.age,c.world.players[c.protagonistKey]!.age+1);assert.deepEqual(stage.world.players[c.protagonistKey]!.abilities,c.world.players[c.protagonistKey]!.abilities);assert.ok(!stage.world.players[old]);assert.equal(stage.supply.retired[0]!.player.age,45);assert.equal(stage.supply.arrivals.length,1);assert.ok(stage.world.organizations.find(o=>o.id===club.id)!.levels.ROOKIE.includes(stage.supply.arrivals[0]!.playerKey));assert.ok(stage.health.closedSeasons.includes('2030'));assert.equal(stage.sourceRecordRevision,c.records.revision);assert.equal(Object.hasOwn(stage,'records'),false);
 for(const book of Object.values(stage.world.repertoires)){assert.equal(book.seasonId,'2031');assert.equal(book.learning,null);assert.equal(book.ledger.baseReservedUnits,0);assert.equal(book.ledger.baseSpentUnits,0);}assert.equal(stage.health.games,c.health.games);
});
test('readiness is private-state-free and blocks unfinished seasons, pitch reservations and age28 military deadline',()=>{
 const early=preparedUsCareer(),raw=digest(early),view=usYearTransitionReadiness(early);assert.equal(view.ready,false);assert.ok(view.blockers.includes('SEASON_NOT_IN_REVIEW'));assert.ok(!JSON.stringify(view).includes('potential'));assert.ok(!JSON.stringify(view).includes('rng'));assert.throws(()=>stageUsAgeAndRosters(early,early.revision),/NOT_READY/);assert.equal(digest(early),raw);
 const c=finished(),pitcher=Object.keys(c.world.repertoires)[0]!,book=c.world.repertoires[pitcher]!,id=(['P01','P02','P03','P04','P05','P06','P07'] as const).find(id=>!Object.hasOwn(book.book,id))!;c.world.repertoires[pitcher]=beginPitchLearning(book,id,true);assert.ok(usYearTransitionReadiness(c).blockers.includes('PITCH_LEARNING_NOT_SETTLED'));
 const due=finished();due.world.players[due.protagonistKey]!.age=27;assert.ok(usYearTransitionReadiness(due).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.throws(()=>stageUsAgeAndRosters(due,due.revision),/NOT_READY/);due.world.players[due.protagonistKey]!.age=45;assert.ok(usYearTransitionReadiness(due).blockers.includes('MAX_AGE_REACHED'));
});
test('stale revisions and altered final playoff records fail before changing the source or producing a new world',()=>{
 const c=finished(),before=digest(c);assert.throws(()=>stageUsAgeAndRosters(c,c.revision-1),/REVISION/);assert.equal(digest(c),before);const key=Object.values(c.records.games).find(g=>g.scope.phase==='POSTSEASON'&&g.scope.seasonKey===c.world.seasonKey)!.gameKey;c.records.games[key]!.teams[Object.keys(c.records.games[key]!.teams)[0]!]!.R++;const changed=digest(c);assert.throws(()=>stageUsAgeAndRosters(c,c.revision),/EVIDENCE/);assert.equal(digest(c),changed);
});
test('an already-closed health year is not mutated while an injured retiring NPC leaves the staged world',()=>{
 const c=finished(),org=c.world.organizations.find(o=>o.id!==c.protagonistOrganizationId)!,key=org.levels.MLB[0]!,game=Object.values(c.records.games).find(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey==='MLB'&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,org.id))!;c.world.players[key]!.age=45;
 c.health.games=[...c.health.games,{evidence:{gameKey:game.gameKey,teamKey:'MLB:'+org.id,seasonKey:c.world.seasonKey,day:game.worldDay,roster:[key],appearances:[]},result:{injured:[key],recovered:[]}}];c.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:game.gameKey,seasonKey:c.world.seasonKey};c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;
 const before=digest(c),stage=stageUsAgeAndRosters(c,c.revision);assert.ok(c.health.injuries[key]);assert.equal(stage.health.injuries[key],undefined);assert.equal(digest(c),before);
});
test('minor year activation preserves legacy input, every official record and one signing bonus; the new season plays a native first date',()=>{
 const source=finished(),key=source.protagonistKey,org=source.world.organizations.find(o=>o.id===source.protagonistOrganizationId)!;source.season!.protectedRoster![org.id]!.push(key);source.season!.options![key]={used:1,seasons:['2030'],minorGames:22,lastCountedDay:source.season!.lastDay};const before=digest(source),funding=source.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0})),next=startNextUsMinorSeason(source,source.revision,funding);
 assert.equal(digest(source),before);assert.equal(source.schemaVersion,2);assert.equal(next.schemaVersion,3);assert.equal(next.phaseContext.phase,'PRESEASON_SETUP');assert.equal(next.records,source.records);assert.deepEqual(next.income,source.income);assert.equal(next.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);assert.equal(next.world.players[key]!.age,20);assert.equal(usCareerView(next).seasonKey,'2031');assert.equal(next.inventory.clubs.find(c=>c.id===org.id)!.availableBudgetUsd,source.inventory.clubs.find(c=>c.id===org.id)!.availableBudgetUsd-30000);assert.equal(next.minorYears![0]!.season,source.season);assert.equal(digest(startNextUsMinorSeason(JSON.parse(JSON.stringify(source)),source.revision,[...funding].reverse())),digest(next));
 assert.throws(()=>startNextUsMinorSeason(next,next.revision,funding),/NOT_READY/);assert.equal(usCareerView(JSON.parse(JSON.stringify(source))).seasonKey,'2030');
 let active=setUsPreseasonFocus(next,next.revision,next.world.players[key]!.focus);assert.equal(unreadUsFirstCampNotices(active).length,0);active=confirmUsPreseasonPlan(active,active.revision);active=publishUsSeasonSchedule(active,active.revision);active=startUsRegularSeason(active,active.revision);assert.equal(active.schemaVersion,3);assert.equal(active.season!.options![key]!.used,1);assert.equal(active.season!.options![key]!.minorGames,0);assert.equal(active.season!.options![key]!.lastCountedDay,undefined);assert.ok(active.season!.protectedRoster![org.id]!.includes(key));
 const first=advanceUsCareer(active,active.revision),a=advanceUsCareer(first.career,first.career.revision),b=advanceUsCareer(JSON.parse(JSON.stringify(first.career)),first.career.revision);assert.equal(digest(a),digest(b));active=a.career;for(let i=0;i<150&&!active.season!.days.length;i++){const r=advanceUsCareer(active,active.revision);assert.notEqual(r.stopReason,'ENGINE_LIMIT');assert.notEqual(r.stopReason,'ROSTER_DECISION_REQUIRED');active=r.career;}
 assert.equal(active.season!.days.length,1);assert.equal(Object.values(active.records.games).filter(g=>g.scope.seasonKey==='2031').length,75);assert.equal(active.season!.paidUsd,usSalaryEntitlement(active,1));assert.equal(active.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);assert.equal(digest(source),before);
 console.log('M2-DK year continuation proof:',JSON.stringify({from:'2030',to:'2031',nativeNewSeasonGames:75,oldRecords:Object.keys(source.records.games).length,schema:active.schemaVersion,signingBonuses:1}));
});
test('annual funding and new history tampering fail without a second budget credit or source mutation',()=>{
 const c=finished(),funding=c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0})),before=digest(c);assert.throws(()=>startNextUsMinorSeason(c,c.revision,[]),/FUNDING/);assert.equal(digest(c),before);
 const next=startNextUsMinorSeason(c,c.revision,funding),bad=structuredClone(next);bad.minorYears![0]!.endingPlayer.age++;assert.throws(()=>usCareerView(bad),/YEAR_HISTORY/);const changed=structuredClone(next);changed.minorYears![0]!.funding[0]!.addedBudgetUsd=1;assert.throws(()=>usCareerView(changed),/ENTRY_VIEW/);
 const empty=structuredClone(c.inventory);empty.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd=0;assert.throws(()=>fundUsMinorYear(empty,'2031',Object.keys(c.world.players),funding,c.protagonistOrganizationId,30000),/BUDGET_REQUIRED/);assert.throws(()=>fundUsMinorYear(c.inventory,'2031',Object.keys(c.world.players),funding.map(f=>({...f,addedBudgetUsd:Number.MAX_SAFE_INTEGER})),c.protagonistOrganizationId,30000),/OVERFLOW/);
});


test('six controlled minor seasons preserve the history chain and stop before a seventh unapproved contract year',()=>{
 let c=finished();for(let i=1;i<=5;i++){const funding=c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}));let next=startNextUsMinorSeason(c,c.revision,funding);assert.equal(usCareerView(next).seasonKey,String(2030+i));next=confirmUsPreseasonPlan(next,next.revision);next=publishUsSeasonSchedule(next,next.revision);c=finished(next);}
 const view=usYearTransitionReadiness(c);assert.equal(c.world.seasonKey,'2035');assert.equal(c.world.players[c.protagonistKey]!.age,24);assert.equal(c.minorYears!.length,5);assert.equal(view.controlSeasonsUsed,6);assert.equal(view.remainingMinorControlSeasons,0);assert.ok(view.blockers.includes('CONTRACT_DECISION_REQUIRED'));assert.throws(()=>startNextUsMinorSeason(c,c.revision,c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),/NOT_READY/);assert.equal(c.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);assert.equal(c.income.filter(e=>e.kind==='SALARY').reduce((n,e)=>n+e.amount,0),180000);
 console.log('M2-DK controlled minor term proof:',JSON.stringify({seasons:6,lastYear:'2035',age:24,salaryUsd:180000,signingBonuses:1,seventhYear:'CONTRACT_DECISION_REQUIRED',native:false}));
});

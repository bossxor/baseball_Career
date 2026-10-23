import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {settleClosedGrowthPeriods} from '../src/growth-ledger.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {canonicalJson} from '../src/game.js';
import {enlistInSangmu,enlistInActiveService,completeKboMilitaryBlock} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';

const cache=new Map<string,KboCareer>();
function recovered(kind:'HITTER'|'PITCHER'='HITTER',afterWorldDay=0){
 const cacheKey=kind+':'+afterWorldDay;
 if(!cache.has(cacheKey)){
  let c=enteredKboCareer(kind);const key=c.protagonistKey,seasonKey=c.amateurHistory.world.seasonKey,gameKey='controlled-prior-injury';
  // Controlled prior diagnosis, actual opening and one official registered pro recovery game.
  c.health.games=[...c.health.games,{evidence:{gameKey,seasonKey,teamKey:'H01',day:10,roster:[key],appearances:[]},result:{injured:[key],recovered:[]}}];c.health.injuries[key]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:gameKey,seasonKey};
  c=startSangmuCohort(c,c.revision);c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);c=startKboRegularSeason(c,c.revision);
  const g=c.competitionSchedule!.leagues.FUTURES.find(g=>g.worldDay>afterWorldDay && (g.homeTeamKey===c.protagonistClubId||g.awayTeamKey===c.protagonistClubId))!;assert.ok(g);assert.ok(JSON.parse(c.openingRoster!.sourceBasis).unavailable.includes(key));
  // One-game competition isolates the recovery ratio, not a claimed144-game season.
  c.competitionSchedule!.leagues={KBO:[],FUTURES:[g]};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:g.worldDay,pendingGame:null};
  for(let i=0;i<100;i++){const r=advanceKboCareer(c,c.revision);c=r.career;if(r.daysClosed)break;}
  assert.equal(c.phaseContext.phase,'SEASON_REVIEW');assert.ok(c.days!.days.at(-1)!.result.recovered.includes(key));assert.ok(!c.health.injuries[key]);cache.set(cacheKey,c);
 }
 return structuredClone(cache.get(cacheKey)!);
}
for(const kind of ['HITTER','PITCHER'] as const)test(kind+' opening injury remains rehabilitation after actual registered recovery; no extra RNG or source mutation',()=>{
 const c=recovered(kind),before=canonicalJson(c),a=settleKboSeasonGrowth(c,c.revision),b=settleKboSeasonGrowth(JSON.parse(before),c.revision);
 assert.equal(a.career.seasonGrowth.entries[0]!.period.rehabRatio,1);assert.equal(a.budgetUnits,84000);assert.equal(JSON.parse(a.career.seasonGrowth.entries[0]!.periodKey).at(-1),'opening-health-v1');assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);
 for(const f of ['health','records','days','sangmu','phaseContext'] as const)assert.equal(canonicalJson(a.career[f]),canonicalJson(c[f]));assert.equal(settleKboSeasonGrowth(a.career,a.career.revision).duplicate,true);
});

test('already-paid legacy rehab inputs and amounts remain an exact duplicate, never refunded or issued again',()=>{
 const c=recovered(),key=c.protagonistKey,W=c.world.calendar.growthDays.length,p=c.seasonGrowth.seasonStart;
 // Exact pre-CW paid receipt: prior code used0 after this carried injury had already healed.
 const old=settleClosedGrowthPeriods(c.world.players[key]!,c.seasonGrowth,[{periodKey:JSON.stringify(['pro-growth',c.world.worldKey,c.world.seasonKey,0,W]),focus:[...p.focus],archetype:p.archetype,period:{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:0,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:true}}}]);c.world.players[key]=old.player;c.seasonGrowth=old.ledger;c.revision++;assert.equal(c.seasonGrowth.totalBudgetUnits,105000);
 const before=canonicalJson(c),again=settleKboSeasonGrowth(c,c.revision);assert.equal(again.duplicate,true);assert.equal(again.budgetUnits,0);assert.equal(canonicalJson(again.career),before);
});

test('missing historical opening receipt preserves legacy calculation without inventing a new opening fact',()=>{
 const c=recovered();delete c.openingRoster;const result=settleKboSeasonGrowth(c,c.revision);assert.equal(result.budgetUnits,105000);assert.notEqual(JSON.parse(result.career.seasonGrowth.entries[0]!.periodKey).at(-1),'opening-health-v1');
});

test('changed opening receipt or paid focus rejects atomically instead of rewriting the historical period',()=>{
 const c=recovered(),paid=settleKboSeasonGrowth(c,c.revision).career;
 const wrongOwner=structuredClone(c);wrongOwner.openingRoster!.playerKey='foreign';const wrongSeason=structuredClone(c);wrongSeason.openingRoster!.seasonKey='2099';const changed=structuredClone(paid),b=JSON.parse(changed.openingRoster!.sourceBasis);b.unavailable=[];changed.openingRoster!.sourceBasis=JSON.stringify(b);const focus=structuredClone(paid);focus.planHistory[0]!.focus=abilityKeys(focus.world.players[focus.protagonistKey]!.kind).slice(2);
 for(const bad of [wrongOwner,wrongSeason,changed,focus]){const before=canonicalJson(bad);assert.throws(()=>settleKboSeasonGrowth(bad,bad.revision));assert.equal(canonicalJson(bad),before);}
});

test('versioned periods finalize through the existing season close without a second growth payment',()=>{
 const c=recovered(),paid=settleKboSeasonGrowth(c,c.revision).career,budget=paid.seasonGrowth.totalBudgetUnits,closed=closeKboSeason(paid,paid.revision,true);assert.equal(closed.seasonGrowth.finalized,true);assert.equal(closed.seasonGrowth.totalBudgetUnits,budget);assert.ok(closed.seasonClose);assert.throws(()=>closeKboSeason(closed,closed.revision,true));
});

for(const kind of ['SPORTS','ACTIVE'] as const)test(kind+' return growth uses the same opening injury proof after a real post-return recovery game',()=>{
 const c=recovered('HITTER',190),year=Number(c.world.seasonKey),p=(kind==='SPORTS'?enlistInSangmu:enlistInActiveService)({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:String(year-2),contract:c.world.contracts[c.protagonistKey]!,remainingPaidGameDays:144}),due=kboMilitaryCompletionDays(p),done=completeKboMilitaryBlock(completeKboMilitaryBlock(p,due[0]!.seasonKey,due[0]!.worldDay),due[1]!.seasonKey,due[1]!.worldDay);
 // Controlled past service, actual official recovery registration after the fixed return day.
 c.military={status:'COMPLETED',applications:[],program:done,completedSeasonKey:c.world.seasonKey,completionDays:due,growthPolicyVersion:1};const before=canonicalJson(c),a=settleKboSeasonGrowth(c,c.revision);
 assert.equal(a.career.seasonGrowth.entries.length,2);assert.equal(a.career.seasonGrowth.entries.at(-1)!.period.rehabRatio,1);assert.ok(a.career.seasonGrowth.entries.every(e=>JSON.parse(e.periodKey).at(-1)==='opening-health-v1'));assert.deepEqual(a.career.military,c.military);assert.deepEqual(a.career.health,c.health);assert.equal(canonicalJson(c),before);assert.equal(settleKboSeasonGrowth(a.career,a.career.revision).duplicate,true);
});

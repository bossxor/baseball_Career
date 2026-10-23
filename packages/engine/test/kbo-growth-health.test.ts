import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {kboRegularEndInjured} from '../src/kbo-growth-health.js';
import {enlistInSangmu,enlistInActiveService,completeKboMilitaryBlock} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {canonicalJson} from '../src/game.js';

let cache:{regular:KboCareer;postseason:KboCareer;last:number}|undefined;
function fixture(){
 if(!cache){
  let c=enteredKboCareer();c=startSangmuCohort(c,c.revision);c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);c=startKboRegularSeason(c,c.revision);
  const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
  // Controlled regular clock, then real postseason games reproduce the diagnosis on the final Korean Series date.
  c.days!.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-regular-clock',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_REVIEW'};const regular=structuredClone(c);
  c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
  assert.equal(c.phaseContext.phase,'SEASON_REVIEW');assert.ok(c.health.injuries[c.protagonistKey]);assert.ok(c.days!.days.some(d=>d.day>last && d.result.injured.includes(c.protagonistKey)));cache={regular,postseason:c,last};
 }
 return structuredClone(cache);
}

test('real postseason injury cannot block or rewrite first regular growth settlement; injury and JSON replay survive',()=>{
 const {regular,postseason,last}=fixture(),before=canonicalJson(postseason),baseline=settleKboSeasonGrowth(regular,regular.revision),a=settleKboSeasonGrowth(postseason,postseason.revision),b=settleKboSeasonGrowth(JSON.parse(before),postseason.revision);
 assert.equal(kboRegularEndInjured(postseason,last),false);assert.equal(a.budgetUnits,baseline.budgetUnits);assert.deepEqual(a.career.seasonGrowth,baseline.career.seasonGrowth);assert.deepEqual(a,b);assert.equal(canonicalJson(postseason),before);
 for(const key of ['health','records','days','sangmu','traits','phaseContext'] as const)assert.equal(canonicalJson(a.career[key]),canonicalJson(postseason[key]));assert.equal(settleKboSeasonGrowth(a.career,a.career.revision).duplicate,true);
});

for(const kind of ['SPORTS','ACTIVE'] as const)test(kind+' return partitions use regular-end health and preserve already-completed military evidence',()=>{
 const {regular,postseason}=fixture(),year=Number(regular.world.seasonKey),p=(kind==='SPORTS'?enlistInSangmu:enlistInActiveService)({worldKey:regular.world.worldKey,playerKey:regular.protagonistKey,clubId:regular.protagonistClubId,selectionSeasonKey:String(year-2),contract:regular.world.contracts[regular.protagonistKey]!,remainingPaidGameDays:144}),due=kboMilitaryCompletionDays(p),done=completeKboMilitaryBlock(completeKboMilitaryBlock(p,due[0]!.seasonKey,due[0]!.worldDay),due[1]!.seasonKey,due[1]!.worldDay);
 // Controlled completed-service history isolates health reconciliation, not an eighteen-month simulation.
 for(const c of [regular,postseason])c.military={status:'COMPLETED',applications:[],program:done,completedSeasonKey:c.world.seasonKey,completionDays:due,growthPolicyVersion:1};
 const expected=settleKboSeasonGrowth(regular,regular.revision),actual=settleKboSeasonGrowth(postseason,postseason.revision);
 assert.deepEqual(actual.career.seasonGrowth,expected.career.seasonGrowth);assert.equal(actual.career.seasonGrowth.entries.length,2);assert.deepEqual(actual.career.military,postseason.military);assert.deepEqual(actual.career.health,postseason.health);
});

test('growth paid before postseason stays an identical duplicate after later injury, without a fresh budget',()=>{
 const {regular,postseason}=fixture(),paid=settleKboSeasonGrowth(regular,regular.revision);postseason.seasonGrowth=structuredClone(paid.career.seasonGrowth);
 const before=canonicalJson(postseason),again=settleKboSeasonGrowth(postseason,postseason.revision);assert.equal(again.duplicate,true);assert.equal(again.budgetUnits,0);assert.equal(again.career.revision,postseason.revision);assert.equal(canonicalJson(again.career),before);
});

test('boundary rewind handles later recovery and diagnosis/recovery cycles without changing source',()=>{
 const {postseason,last}=fixture(),key=postseason.protagonistKey,end=postseason.days!.days.at(-1)!.day;
 // Controlled closed-day recovery receipts test the boundary helper independently of another official game.
 const recovered=structuredClone(postseason);delete recovered.health.injuries[key];recovered.days!.days=[...recovered.days!.days,{day:end+1,evidence:'controlled-postseason-recovery',result:{injured:[],recovered:[key]}}];
 const before=canonicalJson(recovered);assert.equal(kboRegularEndInjured(recovered,last),false);assert.equal(canonicalJson(recovered),before);
 const regularInjury=structuredClone(recovered);regularInjury.days!.days=[{day:last,evidence:'controlled-regular-injury',result:{injured:[key],recovered:[]}},{day:last+1,evidence:'controlled-postseason-recovery',result:{injured:[],recovered:[key]}}];
 assert.equal(kboRegularEndInjured(regularInjury,last),true);
});

test('contradictory postseason health and changed regular evidence still reject atomically',()=>{
 const {regular,postseason}=fixture(),key=postseason.protagonistKey;
 const missing=structuredClone(postseason);delete missing.health.injuries[key];const both=structuredClone(postseason);both.days!.days.at(-1)!.result.recovered=[key];const changed=structuredClone(regular);changed.days!.days.at(-1)!.result.injured=[key];
 for(const bad of [missing,both,changed]){const before=canonicalJson(bad);assert.throws(()=>settleKboSeasonGrowth(bad,bad.revision),/CHANGED_GROWTH_HEALTH_EVIDENCE/);assert.equal(canonicalJson(bad),before);}
});

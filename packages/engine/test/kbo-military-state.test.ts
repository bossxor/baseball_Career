import {resolveKboMilitaryEvent,kboMilitaryEventView} from '../src/kbo-military-events.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyToSangmu,resolveSangmuApplication,kboMilitaryPlan,kboMilitaryStatus,kboProtagonistServing} from '../src/kbo-military-state.js';
import {kboYearTransitionReadiness,startNextKboSeason} from '../src/kbo-year-transition.js';
import {startSangmuCohort,kboSangmuServing} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {completeSangmuBlock} from '../src/kbo-military-program.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';

function review(c:KboCareer):KboCareer {
 const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),g=structuredClone(startKboRegularSeason(s,s.revision));
 const all=[...g.competitionSchedule!.leagues.KBO,...g.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(x=>x.worldDay)),last=Math.max(...all.map(x=>x.worldDay));
 g.days={...g.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'test',result:{injured:[],recovered:[]}}))};g.phaseContext={phase:'SEASON_REVIEW'};return g;
}
function closed(c:KboCareer):KboCareer {
 const r=review(c);let x=startKboPostseason(r,r.revision);
 for(let i=0;i<400;i++){const out=advanceKboPostseason(x,x.revision);x=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 x=settleKboSeasonGrowth(x,x.revision).career;return closeKboSeason(x,x.revision,true);
}
const renew=(c:KboCareer)=>{const o=offerKboRenewal(c,c.revision),e=o.events.find(x=>x.eventKey===o.renewal!.eventKey)!;return acceptKboRenewal(o,o.revision,{eventKey:e.eventKey,eventVersion:e.version});};

test('Sangmu application: fixed result, retry returns the same application, wrong answers rejected, decline burns the recruitment',()=>{
 const c=closed(enteredKboCareer('HITTER'));
 assert.equal(kboMilitaryStatus(c),'UNRESOLVED');assert.equal(kboMilitaryPlan(c).canApply,true);
 const a=applyToSangmu(c,c.revision);assert.equal(a.military!.status,'APPLICATION_PENDING');assert.equal(a.military!.applications.length,1);
 const again=applyToSangmu(a,a.revision);assert.deepEqual(again.military,a.military);assert.equal(again.revision,a.revision);
 assert.ok(kboYearTransitionReadiness(renew(a)).blockers.includes('MILITARY_RESULT_PENDING'));
 const app=a.military!.applications[0]!,e50=a.events.find(e=>e.eventKey===app.eventKey)!;
 assert.equal(e50.definitionId,'E50');assert.equal(e50.status,'OPEN');assert.ok(kboYearTransitionReadiness(renew(a)).blockers.includes('OPEN_EVENT'));
 if(app.accepted){
  assert.throws(()=>resolveSangmuApplication(a,a.revision,'ACK_REJECTION'),/INVALID_MILITARY_COMMAND/);
  const d=resolveSangmuApplication(a,a.revision,'DECLINE');assert.equal(d.military!.status,'UNRESOLVED');assert.equal(d.military!.applications[0]!.decision,'DECLINED');assert.equal(d.events.find(e=>e.eventKey===app.eventKey)!.status,'RESOLVED');assert.ok(!kboYearTransitionReadiness(renew(d)).blockers.includes('OPEN_EVENT'));
  assert.equal(applyToSangmu(d,d.revision).military!.applications.length,1);
 } else {
  assert.throws(()=>resolveSangmuApplication(a,a.revision,'ENLIST'),/INVALID_MILITARY_COMMAND/);
  const d=resolveSangmuApplication(a,a.revision,'ACK_REJECTION');assert.equal(d.military!.status,'UNRESOLVED');assert.equal(d.military!.applications[0]!.decision,'REJECTION_ACKNOWLEDGED');
 }
 const old=structuredClone(c);old.world.players[old.protagonistKey]={...old.world.players[old.protagonistKey]!,age:28};
 assert.throws(()=>applyToSangmu(old,old.revision),/KBO_MILITARY_NOT_AVAILABLE/);
});

test('an enlisted protagonist serves two seasons as a loan to the military team and then completes',()=>{
 const base=closed(enteredKboCareer('HITTER'));
 // Make the application certain: the only hitter that can be chosen is mine (everyone else too old for the window).
 const forced=structuredClone(base),me=forced.protagonistKey,best:Record<string,number>={};
 for(const p of Object.values(forced.world.players))if(p.kind==='HITTER')for(const [k,v] of Object.entries(p.abilities))best[k]=Math.max(best[k]??0,v);
 forced.world.players[me]={...forced.world.players[me]!,abilities:{...best} as never,potential:{...best} as never,careerPeaks:{...best} as never};
 const a=applyToSangmu(forced,forced.revision);assert.equal(a.military!.applications[0]!.accepted,true);
 const renewed=renew(a);assert.throws(()=>resolveSangmuApplication(a,a.revision,'ENLIST'),/CONTRACT_DECISION_REQUIRED/);
 const e=resolveSangmuApplication(renewed,renewed.revision,'ENLIST');
 assert.equal(e.military!.program!.contract.contractKey,renewed.renewal!.offerKey);assert.equal(e.military!.program!.contract.annualSalaryWon,renewed.renewal!.annualSalaryWon);assert.equal(e.military!.program!.contract.totalRemainingWon,renewed.renewal!.annualSalaryWon);
 assert.equal(e.military!.status,'SERVING_SPORTS');assert.ok(kboProtagonistServing(e));assert.deepEqual(e.sangmu!.loaned,[e.protagonistKey]);assert.equal(e.military!.program!.blocks[0]!.seasonKey,String(Number(e.world.seasonKey)+1));
 assert.ok(!kboYearTransitionReadiness(e).blockers.includes('MILITARY_RESULT_PENDING'));
 const pending=startNextKboSeason(e,e.revision),notice=kboMilitaryEventView(pending)[0]!;
 const n=resolveKboMilitaryEvent(pending,pending.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'ADVANCE_SERVICE'});
 assert.equal(n.military!.program!.completedBlocks,0);
 // Next season: the NPC cohort leaves one slot for my player, he is never on the first team and plays Futures for the military team.
 const s0=startSangmuCohort(n,n.revision);assert.ok(kboSangmuServing(s0).includes(n.protagonistKey));
 const p=confirmKboPreseasonPlan(s0,s0.revision),o=confirmKboOpeningRoster(p,p.revision);
 assert.equal(o.registration.competitionKey,'FUTURES');assert.equal(o.registration.firstTeam,false);
 const sched=confirmKboSeasonSchedule(o,o.revision);assert.equal(new Set(sched.competitionSchedule!.leagues.FUTURES.flatMap(g=>[g.homeTeamKey,g.awayTeamKey])).size,11);
 let g=startKboRegularSeason(sched,sched.revision);
 for(let i=0;i<30 && !Object.values(g.records.games).some(x=>Object.hasOwn(x.teams,'SANGMU')&&(Object.hasOwn(x.batting,g.protagonistKey)||Object.hasOwn(x.pitching,g.protagonistKey)));i++)g=advanceKboCareer(g,g.revision,1).career;
 assert.ok(Object.values(g.records.games).some(x=>Object.hasOwn(x.teams,'SANGMU')&&(Object.hasOwn(x.batting,g.protagonistKey)||Object.hasOwn(x.pitching,g.protagonistKey))),'my player played for the military team');
 assert.ok(!g.world.clubs.find(c=>c.id===g.protagonistClubId)!.firstTeam.includes(g.protagonistKey));
 // Completion: relabel the fixture so the second block is the season just played; the transition closes it and ends the loan.
 const fin=structuredClone(e),season=Number(fin.world.seasonKey),pg=fin.military!.program!;
 delete fin.military!.completionDays; // Explicitly exercises the pre-calendar legacy transition.
 fin.military!.program=completeSangmuBlock({...pg,blocks:[{...pg.blocks[0]!,seasonKey:String(season-1)},{...pg.blocks[1]!,seasonKey:String(season)}]},String(season-1),5);
 const out=startNextKboSeason(fin,fin.revision);
 assert.equal(out.military!.status,'COMPLETED');assert.equal(out.military!.completedSeasonKey,String(season));assert.deepEqual(out.sangmu!.loaned,[]);assert.equal(kboProtagonistServing(out),false);
});

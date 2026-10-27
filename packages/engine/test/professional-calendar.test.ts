import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeasonCalendar,assertSeasonCalendar,professionalGameDays} from '../src/season-calendar.js';
import {createKboSeasonSchedules} from '../src/kbo-schedule.js';
import {createKboFutures11Schedule} from '../src/kbo-futures-schedule.js';
import {assertSchedule} from '../src/schedule.js';
import {KBO_CLUBS} from '@playball/rules';
import {canonicalJson} from '../src/game.js';
import {preparedUsCareer} from './us-fixtures.js';
import {US_SEASON_GAMES,assertUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';
import {createKboServicePayroll,carryKboServicePayroll,kboServiceFutureCommitment,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import type {KboInitialContract} from '../src/kbo-world.js';
import {enteredKboCareer} from './fixtures.js';
import {openKboNationalSelection} from '../src/kbo-national-selection.js';
import {resolveKboNationalEvent} from '../src/kbo-national.js';
import {startNationalTournament,prepareCareerNationalMatch,advanceCareerNationalMatch,closeCareerNationalDay} from '../src/national-progress.js';
import {nextNationalMatch} from '../src/national-bracket.js';
import {auditCareerNationalDays} from '../src/national-day-audit.js';
import {confirmKboPreseasonPlan,unreadKboFirstCampNotices,resolveKboFirstCampNotice} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';

test('calendar2 shifts only professional WBC-year fixtures; old schedules, identities, school days and growth budget survive mixed reads',()=>{
 const ids=KBO_CLUBS.map(t=>t.id);
 for(const year of [2029,2030,2031,2032,2034]){
  const old=createSeasonCalendar(year),modern=createSeasonCalendar(year,'calendar-2'),raw=canonicalJson(old),before=createKboSeasonSchedules(ids,String(year),old),after=createKboSeasonSchedules(ids,String(year),modern),wbc=modern.international.find(w=>w.type==='WBC');
  assertSeasonCalendar(JSON.parse(canonicalJson(old)));assertSeasonCalendar(JSON.parse(canonicalJson(modern)));assert.deepEqual(modern.growthDays,old.growthDays);assert.deepEqual(modern.highSchoolDays,old.highSchoolDays);assert.deepEqual(modern.international,old.international);
  for(const league of ['KBO','FUTURES'] as const){assertSchedule(after[league],ids,144,72);assert.deepEqual(after[league].map(g=>({...g,worldDay:0})),before[league].map(g=>({...g,worldDay:0})));if(wbc)assert.ok(after[league].every(g=>g.worldDay>=wbc.endDay));else assert.deepEqual(after[league],before[league]);}
  const futures=createKboFutures11Schedule([...ids,'SANGMU'],String(year),modern);assertSchedule(futures,[...ids,'SANGMU'],144,72);if(wbc)assert.ok(futures.every(g=>g.worldDay>=wbc.endDay));
  assert.equal(canonicalJson(old),raw);assert.deepEqual(createKboSeasonSchedules(ids,String(year),old),before);
 }
 assert.throws(()=>createSeasonCalendar(2030,'wrong' as 'calendar-1'),/INVALID_CALENDAR_VERSION/);
});
test('all five actual US schedule publications open after WBC with unchanged game counts and annual salary',()=>{
 const c=preparedUsCareer(),wbc=c.world.calendar.international.find(w=>w.type==='WBC')!;assert.ok(wbc);assert.equal(c.world.calendar.version,'calendar-2');const raw=canonicalJson(c);
 for(const level of Object.keys(US_SEASON_GAMES) as (keyof typeof US_SEASON_GAMES)[]){const games=c.seasonSchedule!.leagues[level];assertSchedule(games,c.world.organizations.map(o=>o.id),US_SEASON_GAMES[level],US_SEASON_GAMES[level]/2);assert.ok(games.every(g=>g.worldDay>=wbc.endDay));}
 assert.equal(c.contract.annualSalaryUsd,30000);assert.equal(canonicalJson(c),raw);
 const legacy=preparedUsCareer('HITTER','calendar-1');
 const old=canonicalJson(legacy);assertUsSeasonSchedule(JSON.parse(old));assert.equal(Math.min(...legacy.seasonSchedule!.leagues.MLB.map(g=>g.worldDay)),31);assert.equal(canonicalJson(legacy),old);assertUsSeasonSchedule(c);
 let active=startUsRegularSeason(c,c.revision);for(let i=0;i<200&&!active.season!.days.length;i++){const out=advanceUsCareer(active,active.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');assert.notEqual(out.stopReason,'ROSTER_DECISION_REQUIRED');active=out.career;}
 assert.equal(active.season!.days.length,1);assert.equal(active.season!.days[0]!.day,wbc.endDay);const games=Object.values(active.records.games).filter(g=>g.scope.seasonKey===active.world.seasonKey);assert.equal(games.length,75);assert.equal(active.season!.paidUsd,Math.floor(30000/(active.season!.lastDay-active.season!.firstDay+1)));assert.equal(canonicalJson(c),raw);
 console.log('M2-EF US/opening proof:',JSON.stringify({calendar:active.world.calendar.version,openingDay:active.season!.firstDay,actualGames:games.length,annualSalaryUsd:active.contract.annualSalaryUsd,paidUsd:active.season!.paidUsd}));
});
test('calendar-versioned service reservation follows actual return-year dates without repricing principal or contaminating legacy forecast cache',()=>{
 const c:KboInitialContract={contractKey:'calendar-pay',playerKey:'p',clubId:'LG',seasonKey:'2029',years:2,annualSalaryWon:100000000,signingBonusWon:0,status:'ACTIVE'},program=enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:'2028',contract:c,remainingPaidGameDays:216});
 c.servicePay=createKboServicePayroll(c,program,{seasonKey:'2030',worldDay:180});const raw=canonicalJson(c),old=carryKboServicePayroll(c,'2030'),modern=carryKboServicePayroll(c,'2030','calendar-2');
 const schedule=createKboFutures11Schedule([...KBO_CLUBS.map(t=>t.id),'SANGMU'],'2030',createSeasonCalendar(2030,'calendar-2')),expected=schedule.filter(g=>g.worldDay>180&&[g.awayTeamKey,g.homeTeamKey].includes('LG')).length;
 assert.equal(modern.reservedGameDays,expected);assert.equal(modern.calendarVersion,'calendar-2');assert.deepEqual(modern.ledger,old.ledger);assert.deepEqual(carryKboServicePayroll(c,'2030'),old);assert.equal(canonicalJson(c),raw);
 const next={...c,seasonKey:'2030',servicePay:modern};const sum=[1,2,3,4,5,6].reduce((n,i)=>n+kboServiceFutureCommitment(c,i),0);assert.equal(sum,program.contract.totalRemainingWon);assert.equal(modern.ledger.contract.totalRemainingWon,program.contract.totalRemainingWon);assert.ok(kboServiceFutureCommitment(next,1)>0);assert.equal(kboContractSeasonCharge(next)+[1,2,3,4,5,6].reduce((n,i)=>n+kboServiceFutureCommitment(next,i),0),program.contract.totalRemainingWon);
});
test('WBC actual47 games and21 dates return to camp then actual KBO opening date without rewriting international history',()=>{
 const entry=enteredKboCareer();let c=entry;assert.equal(c.world.calendar.version,'calendar-2');const original=canonicalJson(c),selected=openKboNationalSelection(c,c.revision,'WBC'),invite=selected.events.find(e=>e.definitionId==='E44'&&e.status==='OPEN');c=invite?resolveKboNationalEvent(selected,selected.revision,{eventKey:invite.eventKey,eventVersion:invite.version,command:'ACCEPT_NATIONAL'}).career:selected;
 c=startNationalTournament(c,c.revision,'WBC');for(let i=0;i<160&&c.phaseContext.phase!=='INTERNATIONAL_REVIEW';i++){
  const phase=c.phaseContext;if(phase.phase!=='INTERNATIONAL_PROGRESS')throw Error('lost international phase');const b=c.national!.brackets![0]!,m=nextNationalMatch(b);
  if(!b.pendingGame&&(!m||m.day>phase.nextWorldDay)){c=closeCareerNationalDay(c,c.revision,phase.nextWorldDay);continue;}
  if(!b.pendingGame)c=prepareCareerNationalMatch(c,c.revision);c=advanceCareerNationalMatch(c,c.revision).career;
 }
 assert.equal(c.phaseContext.phase,'INTERNATIONAL_REVIEW');auditCareerNationalDays(c);const b=c.national!.brackets![0]!;assert.equal(b.results.length,47);assert.equal(b.dayReceipts!.length,21);assert.equal(c.days,undefined);
 const keys=b.results.map(r=>r.gameKey),records=canonicalJson(keys.map(k=>c.records.games[k]));
 for(const id of ['E45','E46','E48']){const e=c.events.find(e=>e.definitionId===id&&e.status==='OPEN');if(e)c=resolveKboNationalEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:id==='E48'?'CONFIRM_NATIONAL_RETURN':'ACK_EVENT'}).career;}
 assert.equal(c.phaseContext.phase,'PRESEASON_SETUP');const planned=confirmKboPreseasonPlan(c,c.revision),camp=unreadKboFirstCampNotices(planned)[0]!;assert.ok(camp);c=resolveKboFirstCampNotice(planned,planned.revision,{eventKey:camp.eventKey,eventVersion:camp.eventVersion,command:'KEEP_FOCUS'});c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);c=startKboRegularSeason(c,c.revision);
 const first=professionalGameDays(c.world.calendar)[0]!;assert.equal(first,b.window.endDay);for(let i=0;i<20&&!c.days!.days.length;i++)c=advanceKboCareer(c,c.revision).career;
 assert.equal(c.days!.days[0]!.day,first);assert.equal(canonicalJson(keys.map(k=>c.records.games[k])),records);assert.ok(Object.values(c.records.games).some(g=>g.scope.phase==='REGULAR'&&g.worldDay===first));assert.equal(canonicalJson(entry),original);
 console.log('M2-EF WBC/opening proof:',JSON.stringify({entry:'PRO_ENTRY_FIXTURE',internationalGames:47,nationalDays:21,openingDay:first,actualDomesticGames:Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR').length,calendar:c.world.calendar.version}));
});

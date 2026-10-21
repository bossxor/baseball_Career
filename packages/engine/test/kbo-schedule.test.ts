import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboSeasonSchedules,confirmKboSeasonSchedule,assertKboSeasonSchedule,kboSeasonScheduleView} from '../src/kbo-schedule.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {assertSchedule} from '../src/schedule.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboPreseasonPlan,unreadKboFirstCampNotices,resolveKboFirstCampNotice} from '../src/kbo-preseason.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
const teams=Array.from({length:10},(_,i)=>'T'+i);
const ready=()=>{const s=enteredKboCareer('HITTER'),plan=confirmKboPreseasonPlan(s,s.revision);return confirmKboOpeningRoster(plan,plan.revision);};

test('both independent leagues have720 games,144/team,8 home and8 away/opponent; all calendar barriers and rest respected',()=>{
 for(const year of [2029,2030,2031,2032,2100,2400,9999]){
  const calendar=createSeasonCalendar(year),leagues=createKboSeasonSchedules(teams,String(year),calendar);
  for(const league of ['KBO','FUTURES'] as const){const games=leagues[league];assert.equal(games.length,720);assertSchedule(games,teams,144,72);
   assert.equal(Math.min(...games.map(g=>g.worldDay)),calendar.growthDays[0]);assert.equal(Math.max(...games.map(g=>g.worldDay)),calendar.growthDays.at(-1));assert.equal(new Set(games.map(g=>g.worldDay)).size,144);
   for(const g of games){assert.equal(g.leagueKey,league);assert.ok(calendar.growthDays.includes(g.worldDay));assert.ok(calendar.international.every(w=>g.worldDay<w.startDay || g.worldDay>=w.endDay));}
   for(const home of teams)for(const away of teams.filter(t=>t!==home))assert.equal(games.filter(g=>g.homeTeamKey===home && g.awayTeamKey===away).length,8);
  }
  assert.equal(new Set([...leagues.KBO,...leagues.FUTURES].map(g=>g.simulationKey)).size,1440);
  assert.deepEqual(leagues,createKboSeasonSchedules([...teams].reverse(),String(year),calendar));
 }
});

test('bad teams/year/calendar reject; publication cannot bypass the confirmed roster',()=>{
 const calendar=createSeasonCalendar(2030);assert.throws(()=>createKboSeasonSchedules(teams.slice(1),'2030',calendar));assert.throws(()=>createKboSeasonSchedules([...teams.slice(1),teams[1]!],'2030',calendar));assert.throws(()=>createKboSeasonSchedules(teams,'2029',calendar));assert.throws(()=>createKboSeasonSchedules(teams,'2030',{...calendar,growthDays:calendar.growthDays.slice(1)}));
 const s=enteredKboCareer('HITTER'),before=canonicalJson(s);assert.throws(()=>confirmKboSeasonSchedule(s,s.revision));assert.equal(canonicalJson(s),before);
});

test('old roots read pending; confirmed schedule survives JSON/replay/notice ACK with no played games or extra side effects',()=>{
 const s=ready(),before=canonicalJson(s);assert.equal(kboSeasonScheduleView(s).status,'PENDING');assert.equal(s.competitionSchedule,undefined);const n=confirmKboSeasonSchedule(s,s.revision);assert.equal(canonicalJson(s),before);assert.equal(n.revision,s.revision+1);
 assert.deepEqual(assertKboSeasonSchedule(JSON.parse(JSON.stringify(n))),n.competitionSchedule);assert.deepEqual(confirmKboSeasonSchedule(n,n.revision),n);assert.deepEqual(confirmKboSeasonSchedule(s,s.revision),n);
 const {competitionSchedule:receipt,revision,...unchanged}=n;assert.ok(receipt);assert.equal(revision,n.revision);const {revision:oldRevision,...old}=s;assert.equal(oldRevision,s.revision);assert.deepEqual(unchanged,old);
 const view=kboSeasonScheduleView(n);assert.equal(view.status,'CONFIRMED');assert.equal(view.fixtures.length,144);assert.ok(view.fixtures.every(g=>g.home.id===s.protagonistClubId || g.away.id===s.protagonistClubId));for(const hidden of ['potential','sourceBasis','seed','amateurHistory','abilities'])assert.equal(JSON.stringify(view).includes('"'+hidden+'"'),false);
 const e=unreadKboFirstCampNotices(n)[0]!;const read=resolveKboFirstCampNotice(n,n.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'KEEP_FOCUS'});assert.deepEqual(assertKboSeasonSchedule(read),n.competitionSchedule);assert.deepEqual(read.records,s.records);assert.deepEqual(read.world,s.world);
});

test('changed date/venue/identity/receipt rejects atomically rather than silently rebuilding',()=>{
 const s=ready(),n=confirmKboSeasonSchedule(s,s.revision);assert.throws(()=>confirmKboSeasonSchedule(n,n.revision-1),/REVISION/);
 for(const mutate of [(x:typeof n)=>{x.competitionSchedule!.leagues.KBO= x.competitionSchedule!.leagues.KBO.slice(1);},(x:typeof n)=>{x.competitionSchedule!.leagues.KBO[0]!.worldDay++;},(x:typeof n)=>{x.competitionSchedule!.leagues.FUTURES[0]!.leagueKey='KBO';},(x:typeof n)=>{x.competitionSchedule!.openingRosterReceiptKey='wrong';},(x:typeof n)=>{x.competitionSchedule!.confirmedRevision++;}]){const bad=structuredClone(n);mutate(bad);const before=canonicalJson(bad);assert.throws(()=>kboSeasonScheduleView(bad));assert.throws(()=>confirmKboSeasonSchedule(bad,bad.revision));assert.equal(canonicalJson(bad),before);}
});

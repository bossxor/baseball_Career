import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeasonCalendar,assertSeasonCalendar} from '../src/season-calendar.js';
import {createHighSchoolWorld,assertHighSchoolWorld} from '../src/high-school-world.js';
import {assertSchedule} from '../src/schedule.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';

const world=(year=2029)=>createHighSchoolWorld({worldKey:'calendar-world',seasonKey:String(year),seasonYear:year,seed:'calendar-fixture',schoolId:'H01',player:{simulationKey:'own',name:'달력선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'REALISTIC'}});

test('fixed annual calendar includes weekly rest, excludes actual tournament windows and handles leap years',()=>{
 for(const [year,W,D,types] of [[2029,273,150,[]],[2030,238,129,['WBC','AG']],[2031,273,150,['P12']],[2032,260,151,['OLY']]] as const){
  const calendar=createSeasonCalendar(year);assertSeasonCalendar(JSON.parse(JSON.stringify(calendar)));
  assert.equal(calendar.growthDays.length,W);assert.equal(calendar.highSchoolDays.length,D);assert.deepEqual(calendar.international.map(w=>w.type),types);
  assert.equal(calendar.growthDays[0],31);assert.equal(calendar.highSchoolDays[0],31);
  assert.ok(calendar.highSchoolDays.every(d=>calendar.growthDays.includes(d)));
  for(const window of calendar.international){assert.equal(window.endDay-window.startDay,window.type==='WBC'?21:14);assert.ok(calendar.growthDays.every(d=>d<window.startDay || d>=window.endDay));}
 }
 assert.equal(createSeasonCalendar(2100).highSchoolDays.length,150); // Gregorian century exception.
 assert.throws(()=>createSeasonCalendar(2026));assert.throws(()=>createSeasonCalendar(NaN));
 const changed=structuredClone(createSeasonCalendar(2029));changed.growthDays=changed.growthDays.slice(1);assert.throws(()=>assertSeasonCalendar(changed),/CHANGED/);
});

test('calendar-backed school season spreads all216 games over Feb-Jun without international collisions',()=>{
 for(const year of [2029,2030,2032]){
  const state=world(year),calendar=state.calendar!;assertHighSchoolWorld(JSON.parse(JSON.stringify(state)));
  assertSchedule(state.schedule,state.schools.map(s=>s.id),48,24);
  assert.equal(Math.min(...state.schedule.map(g=>g.worldDay)),calendar.highSchoolDays[0]);assert.equal(Math.max(...state.schedule.map(g=>g.worldDay)),calendar.highSchoolDays.at(-1));
  assert.ok(state.schedule.every(g=>calendar.highSchoolDays.includes(g.worldDay)));assert.equal(new Set(state.schedule.map(g=>g.worldDay)).size,54);
  const changed=structuredClone(state);changed.schedule[0]!.worldDay++;assert.throws(()=>assertHighSchoolWorld(changed),/CHANGED_SCHOOL_CALENDAR/);
 }
});

test('baseline growth stays average: perfect school appearances and +2 still below52; US entry uses a separate scout score',()=>{
 const player=world().players.own!;
 for(const year of [2029,2030,2031,2032])for(const difficulty of ['GROWTH','REALISTIC'] as const){
  const calendar=createSeasonCalendar(year),D=calendar.highSchoolDays.length,W=calendar.growthDays.length;
  const budget=naturalGrowthBudgetUnits(player,W,[{startDay:0,endDay:D,levelSeasonDays:D,level:'HIGH_SCHOOL',appearances:1000,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty,beneficiary:true}}]);
  assert.ok((3_000_000+budget+20_000)/60_000<52);
 }
});

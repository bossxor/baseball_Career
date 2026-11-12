import test from 'node:test';
import assert from 'node:assert/strict';
import {virtualMlbPostseasonEndDay,kboP12Window} from '../src/kbo-p12-window.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {nationalInviteDeadlines} from '../src/national-bracket.js';
import type {KboCareer} from '../src/kbo-career-entry.js';

const stub=(seed:string,seasonKey='2027',phase='SEASON_REVIEW',kboEnd=300)=>({
 world:{seed,worldKey:'w1',seasonKey,calendar:createSeasonCalendar(Number(seasonKey))},
 phaseContext:{phase},postseason:{championKey:'X'},days:{days:[{day:kboEnd}]},
}) as unknown as KboCareer;

test('virtual MLB postseason end day is a pure function of the world seed',()=>{
 const a=virtualMlbPostseasonEndDay(stub('s'));
 assert.equal(a,virtualMlbPostseasonEndDay(stub('s')));
 const base=createSeasonCalendar(2027).growthDays.at(-1)!;
 for(const seed of ['a','b','c','d','e'])assert.ok(virtualMlbPostseasonEndDay(stub(seed))-base>=12&&virtualMlbPostseasonEndDay(stub(seed))-base<=53);
});

test('P12 window follows the later of the KBO and virtual MLB finals and seals both',()=>{
 const c=stub('s'),mlb=virtualMlbPostseasonEndDay(c),w=kboP12Window(c);
 assert.equal(w.basis,'P12_POSTSEASON');
 assert.deepEqual(JSON.parse(w.evidence!).slice(2),[300,mlb]);
 assert.ok(w.startDay>Math.max(300,mlb)-1);
 assert.doesNotThrow(()=>nationalInviteDeadlines(w));
});

test('P12 window requires a completed KBO postseason review',()=>{
 assert.throws(()=>kboP12Window(stub('s','2027','SEASON_PROGRESS')),/NATIONAL_PS_END_REQUIRED/);
});

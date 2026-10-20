import assert from 'node:assert/strict';
import test from 'node:test';
import {createRoundRobinSchedule,createEvenLeagueSchedule,assertSchedule} from '../src/schedule.js';
import type {ScheduleInput} from '../src/schedule.js';
const input=(n:number):ScheduleInput=>({teamKeys:Array.from({length:n},(_,i)=>'team-'+String(i).padStart(2,'0')),leagueKey:'league',seasonKey:'2027',startDay:30});
function pairs(schedule:ReturnType<typeof createRoundRobinSchedule>) {
  const result=new Map<string,{total:number;homes:Map<string,number>}>();
  for(const game of schedule) {const key=JSON.stringify([game.awayTeamKey,game.homeTeamKey].sort()),line=result.get(key)??{total:0,homes:new Map()};line.total++;line.homes.set(game.homeTeamKey,(line.homes.get(game.homeTeamKey)??0)+1);result.set(key,line);}
  return result;
}
test('01: KBO720/team144/home72 and pair16/home8, no double booking or >6 consecutive',()=>{
  const source=input(10),schedule=createRoundRobinSchedule(source,16);assert.equal(schedule.length,720);assertSchedule(schedule,source.teamKeys,144,72);
  for(const pair of pairs(schedule).values()) {assert.equal(pair.total,16);assert.deepEqual([...pair.homes.values()],[8,8]);}
  assert.deepEqual(createRoundRobinSchedule({...source,teamKeys:[...source.teamKeys].reverse()},16),schedule);
});
test('43/HS: nine-team216/team48/home24, 54 rounds with one bye each',()=>{
  const source=input(9),schedule=createRoundRobinSchedule(source,6);assert.equal(schedule.length,216);assertSchedule(schedule,source.teamKeys,48,24);
  for(let round=0;round<54;round++) assert.equal(schedule.filter(g=>g.round===round).length,4);
  for(const pair of pairs(schedule).values()) {assert.equal(pair.total,6);assert.deepEqual([...pair.homes.values()],[3,3]);}
});
test('13: MLB2430/team162/home81, every opponent5 plus exactly17 distinct extra opponents',()=>{
  const source=input(30),schedule=createEvenLeagueSchedule(source,162);assert.equal(schedule.length,2430);assertSchedule(schedule,source.teamKeys,162,81);
  const counts=pairs(schedule);assert.equal(counts.size,435);
  for(const pair of counts.values()) assert.ok(pair.total===5 || pair.total===6);
  for(const team of source.teamKeys) assert.equal([...counts.entries()].filter(([key,line])=>(JSON.parse(key) as string[]).includes(team) && line.total===6).length,17);
  assert.deepEqual(createEvenLeagueSchedule({...source,teamKeys:[...source.teamKeys].reverse()},162),schedule);
});
test('13: minor60/100/120/144 exact games and equal venues, fixed JSON schedule',()=>{
  const source=input(30);
  for(const games of [60,100,120,144]) {const schedule=createEvenLeagueSchedule(source,games);assertSchedule(schedule,source.teamKeys,games,games/2);assert.deepEqual(JSON.parse(JSON.stringify(schedule)),schedule);}
});
test('schedule rejects duplicate/odd degree and validator catches count/venue/date corruption',()=>{
  assert.throws(()=>createRoundRobinSchedule({...input(2),teamKeys:['same','same']},2));
  assert.throws(()=>createRoundRobinSchedule(input(3),3));
  assert.throws(()=>createEvenLeagueSchedule(input(9),48));
  assert.throws(()=>createEvenLeagueSchedule(input(10),143));
  const source=input(10),schedule=createRoundRobinSchedule(source,16);
  assert.throws(()=>assertSchedule(schedule.slice(1),source.teamKeys,144,72));
  const duplicate=structuredClone(schedule);duplicate[5]!.worldDay=duplicate[0]!.worldDay;
  assert.throws(()=>assertSchedule(duplicate,source.teamKeys,144,72));
  const venue=structuredClone(schedule);[venue[0]!.awayTeamKey,venue[0]!.homeTeamKey]=[venue[0]!.homeTeamKey,venue[0]!.awayTeamKey];
  assert.throws(()=>assertSchedule(venue,source.teamKeys,144,72));
});

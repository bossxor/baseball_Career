import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboFutures11Schedule,KBO_FUTURES_V2} from '../src/kbo-futures-schedule.js';
import {createSeasonCalendar} from '../src/season-calendar.js';

const teams=['DOOSAN','HANWHA','KIA','KIWOOM','KT','LG','LOTTE','NC','SAMSUNG','SANGMU','SSG'];
test('11-team Futures calendar: 144 games, 14 or 15 per pair, 72 home / 72 away, rest days, deterministic',()=>{
 for(const year of [2030,2031]){
  const calendar=createSeasonCalendar(year),s=createKboFutures11Schedule(teams,String(year),calendar);
  assert.equal(s.length,teams.length*KBO_FUTURES_V2.gamesPerTeam/2);
  const pair=new Map<string,number>();
  for(const g of s){const k=[g.awayTeamKey,g.homeTeamKey].sort().join('|');pair.set(k,(pair.get(k)??0)+1);assert.ok(calendar.growthDays.includes(g.worldDay));}
  assert.equal(pair.size,55);assert.ok([...pair.values()].every(n=>n===14||n===15));
  for(const t of teams)assert.equal([...pair].filter(([k,n])=>k.split('|').includes(t)&&n===15).length,4);
  assert.deepEqual(createKboFutures11Schedule(teams,String(year),calendar),s);
  assert.equal(new Set(s.map(g=>g.simulationKey)).size,s.length);
 }
 const a=createKboFutures11Schedule(teams,'2030',createSeasonCalendar(2030)),b=createKboFutures11Schedule(teams,'2031',createSeasonCalendar(2031));
 const odd=(s:typeof a)=>new Set(s.filter(g=>g.round>=154).map(g=>[g.awayTeamKey,g.homeTeamKey].sort().join('|')));
 assert.notDeepEqual([...odd(a)].sort(),[...odd(b)].sort());
 assert.throws(()=>createKboFutures11Schedule(teams.slice(1),'2030',createSeasonCalendar(2030)),/INVALID_KBO_SCHEDULE_INPUT/);
});

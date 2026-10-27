import {assertSeasonCalendar,professionalGameDays} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {createRoundRobinSchedule,assertSchedule} from './schedule.js';
import type {ScheduledGame} from './schedule.js';

/** 2026-10-22 user rule (14 U): the Futures league has 11 teams including the military team, 144 games each,
 * 14 or 15 against every opponent, 72 home / 72 away. Version 2 of the Futures calendar; the stored 10-team schedules
 * of earlier seasons are never regenerated. */
export const KBO_FUTURES_V2={teams:11,gamesPerTeam:144,homePerTeam:72} as const;

/** 14 full round-robin cycles (14 games per pair, 7 home each) plus one extra game for 22 pairs. The extra pairs are the
 * circulant graph C11(1,2) over a season-permuted team order (stride 1..10 mod 11, five distinct graphs), oriented i→i+1 and i→i+2 so every team has exactly two
 * extra home and two extra away games (4 opponents at 15, 6 at 14). Extras are first-fit packed into whole matchdays after
 * the cycles; rounds are then spread over the calendar growth days in order. */
export function createKboFutures11Schedule(teamKeys:readonly string[],seasonKey:string,calendar:SeasonCalendar):ScheduledGame[] {
 assertSeasonCalendar(calendar);
 if(teamKeys.length!==KBO_FUTURES_V2.teams || new Set(teamKeys).size!==teamKeys.length || seasonKey!==String(calendar.year))throw new RangeError('INVALID_KBO_SCHEDULE_INPUT');
 const sorted=[...teamKeys].sort(),stride=1+Number(seasonKey)%10,ids=sorted.map((_,i)=>sorted[(i*stride)%sorted.length]!);
 const cycles=createRoundRobinSchedule({teamKeys:sorted,leagueKey:'FUTURES',seasonKey,startDay:0},14);
 const base=cycles.reduce((n,g)=>Math.max(n,g.round),-1)+1;
 const edges:[string,string][]=[];
 for(let i=0;i<ids.length;i++)for(const step of [1,2])edges.push([ids[(i+step)%ids.length]!,ids[i]!]); // [away, home]
 const rounds:[string,string][][]=[];
 for(const edge of edges){
  let r=rounds.findIndex(round=>round.every(([a,h])=>a!==edge[0] && a!==edge[1] && h!==edge[0] && h!==edge[1]));
  if(r<0){rounds.push([]);r=rounds.length-1;}
  rounds[r]!.push(edge);
 }
 const total=base+rounds.length,days=professionalGameDays(calendar);
 if(days.length<total)throw new RangeError('INSUFFICIENT_KBO_CALENDAR');
 const dayOf=(round:number)=>days[Math.floor(round*(days.length-1)/(total-1))]!;
 const result:ScheduledGame[]=[
  ...cycles.map(g=>({...g,worldDay:dayOf(g.round)})),
  ...rounds.flatMap((games,i)=>games.map(([awayTeamKey,homeTeamKey],slot)=>({simulationKey:JSON.stringify([seasonKey,'FUTURES',base+i,slot]),leagueKey:'FUTURES',seasonKey,round:base+i,worldDay:dayOf(base+i),awayTeamKey,homeTeamKey}))),
 ];
 assertSchedule(result,teamKeys,KBO_FUTURES_V2.gamesPerTeam,KBO_FUTURES_V2.homePerTeam);return result;
}

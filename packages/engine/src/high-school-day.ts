import { canonicalJson } from './game.js';
import type { HighSchoolWorld } from './high-school-world.js';
import type { RecordLedger } from './records.js';
import type { HealthLedger } from './health.js';
import { settleTeamGameHealth } from './health.js';
import { appearanceFatigue } from './lineup.js';
import type { ScheduledGame } from './schedule.js';

export interface SchoolDayResult {injured:string[];recovered:string[]}
export interface SchoolDayLedger {
  schemaVersion:1;worldKey:string;seasonKey:string;
  days:readonly {day:number;evidence:string;result:SchoolDayResult}[];
}
export const createSchoolDayLedger=(world:Pick<HighSchoolWorld,'worldKey'|'seasonKey'>):SchoolDayLedger=>({schemaVersion:1,worldKey:world.worldKey,seasonKey:world.seasonKey,days:[]});
/** Internal postgame reducer. Persist world, health and day ledger together after all date games. */
export function closeHighSchoolDay(world:HighSchoolWorld,records:RecordLedger,health:HealthLedger,source:SchoolDayLedger,day:number):{world:HighSchoolWorld;health:HealthLedger;days:SchoolDayLedger;result:SchoolDayResult;duplicate:boolean} {
  return closeSchoolCompetitionDay(world,records,health,source,day,world.schedule);
}
export function closeSchoolCompetitionDay<W extends Pick<HighSchoolWorld,'worldKey'|'seasonKey'|'players'|'schools'> & {leagueKey?:string}>(world:W,records:RecordLedger,health:HealthLedger,source:SchoolDayLedger,day:number,schedule:readonly ScheduledGame[]):{world:W;health:HealthLedger;days:SchoolDayLedger;result:SchoolDayResult;duplicate:boolean} {
  const calendar=schedule.map(g=>g.worldDay),first=Math.min(...calendar),last=Math.max(...calendar);
  if(source.schemaVersion!==1 || source.worldKey!==world.worldKey || source.seasonKey!==world.seasonKey || !Number.isSafeInteger(day) || day<first || day>last)throw new RangeError('INVALID_SCHOOL_DAY');
  const scheduled=schedule.filter(g=>g.worldDay===day).sort((a,b)=>a.simulationKey<b.simulationKey?-1:1);
  const contributions=scheduled.map(game=>{
    const c=Object.hasOwn(records.games,game.simulationKey)?records.games[game.simulationKey]:undefined;
    if(!c || c.worldDay!==day || c.scope.leagueKey!==(world.leagueKey??'HS') || c.scope.seasonKey!==world.seasonKey || c.scope.phase!==(game.phase??'REGULAR') || Object.keys(c.teams).length!==2 || !Object.hasOwn(c.teams,game.awayTeamKey) || !Object.hasOwn(c.teams,game.homeTeamKey))throw new RangeError('DAY_GAMES_NOT_FINAL');
    return c;
  });
  const evidence=canonicalJson({worldKey:world.worldKey,seasonKey:world.seasonKey,day,contributions});
  const old=source.days.find(d=>d.day===day);
  if(old){if(old.evidence!==evidence)throw new RangeError('CHANGED_DAY_EVIDENCE');return {world,health,days:source,result:structuredClone(old.result),duplicate:true};}
  if(day!==(source.days.at(-1)?.day??first-1)+1 || source.days.some((d,i)=>d.day!==first+i))throw new RangeError('NON_CHRONOLOGICAL_SCHOOL_DAY');
  if(Object.values(records.games).some(c=>c.scope.leagueKey===(world.leagueKey??'HS') && c.scope.seasonKey===world.seasonKey && c.worldDay>day))throw new RangeError('FUTURE_GAME_BEFORE_DAY_CLOSE');
  if(health.games.some(g=>g.evidence.seasonKey===world.seasonKey && g.evidence.day>=day))throw new RangeError('PARTIAL_DAY_HEALTH_STATE');
  const registered=new Set<string>();
  for(const school of world.schools)for(const key of school.roster){if(registered.has(key) || !Object.hasOwn(world.players,key))throw new RangeError('INVALID_DAY_REGISTRATION');registered.add(key);}
  const appearances=new Map<string,'HITTER'|'STARTER'|'RELIEF'>();
  const mark=(key:string,kind:'HITTER'|'STARTER'|'RELIEF')=>{if(!registered.has(key) || appearances.has(key))throw new RangeError('INVALID_DAY_APPEARANCE');appearances.set(key,kind);};
  for(const c of contributions){for(const key of Object.keys(c.batting))mark(key,'HITTER');for(const [key,line] of Object.entries(c.pitching))mark(key,line.starts>0?'STARTER':'RELIEF');}
  const updated=structuredClone(world);
  // Exactly one fatigue/rest change for each registered player per calendar day, including byes.
  for(const key of [...registered].sort())updated.players[key]=appearanceFatigue(updated.players[key]!,appearances.get(key)??'NONE');
  let nextHealth=health;const result:SchoolDayResult={injured:[],recovered:[]};
  for(const game of scheduled){for(const teamKey of [game.awayTeamKey,game.homeTeamKey].sort()){
    const roster=updated.schools.find(s=>s.id===teamKey)!.roster;
    const settled=settleTeamGameHealth(nextHealth,{gameKey:game.simulationKey,teamKey,seasonKey:world.seasonKey,day,roster,appearances:roster.filter(key=>appearances.has(key)).map(playerKey=>({playerKey,riskFatigue:updated.players[playerKey]!.fatigue}))});
    nextHealth=settled.ledger;result.injured.push(...settled.result.injured);result.recovered.push(...settled.result.recovered);
  }}
  result.injured.sort();result.recovered.sort();
  return {world:updated,health:nextHealth,days:{...source,days:[...source.days,{day,evidence,result:structuredClone(result)}]},result,duplicate:false};
}

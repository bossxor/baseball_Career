import {canonicalJson} from './game.js';
import type {RecordLedger} from './records.js';
import type {HealthLedger} from './health.js';
import {settleTeamGameHealth} from './health.js';
import {appearanceFatigue} from './lineup.js';
import type {ScheduledGame} from './schedule.js';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {SchoolDayLedger,SchoolDayResult} from './high-school-day.js';
import {createKboCompetitionGameWorld} from './kbo-game-world.js';

export type KboLeagueKey='KBO'|'FUTURES';
export type KboSchedules={readonly KBO:readonly ScheduledGame[];readonly FUTURES:readonly ScheduledGame[]};
export const createKboDayLedger=(world:ActiveKboRosterWorld):SchoolDayLedger=>({schemaVersion:1,worldKey:world.worldKey,seasonKey:world.seasonKey,days:[]});

/** Pro day close (M2-AU condition 4). The two leagues share one calendar day, one fatigue/rest step per player and
 * one day evidence. A club fields two teams (first team and futures) on the same day, so health team keys are league-qualified (KBO:id / FUTURES:id) and recovery counts that registered team's own games. Calling the school day closer once per league would be rejected (or double-count rest), so this
 * closes both leagues together. Rosters are disjoint (first team vs futures), so every club player is registered once. */
export function closeKboCompetitionDay(world:ActiveKboRosterWorld,schedules:KboSchedules,protagonistKey:string,records:RecordLedger,health:HealthLedger,source:SchoolDayLedger,day:number):{world:ActiveKboRosterWorld;health:HealthLedger;days:SchoolDayLedger;result:SchoolDayResult;duplicate:boolean} {
 const worlds={KBO:createKboCompetitionGameWorld(world,'KBO',protagonistKey),FUTURES:createKboCompetitionGameWorld(world,'FUTURES',protagonistKey)};
 const all=[...schedules.KBO,...schedules.FUTURES];
 const first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 if(source.schemaVersion!==1 || source.worldKey!==world.worldKey || source.seasonKey!==world.seasonKey || !Number.isSafeInteger(day) || day<first || day>last)throw new RangeError('INVALID_PRO_DAY');
 const scheduled=(['KBO','FUTURES'] as const).flatMap(leagueKey=>schedules[leagueKey].filter(g=>g.worldDay===day && g.leagueKey===leagueKey).map(game=>({leagueKey,game}))).sort((a,b)=>a.game.simulationKey<b.game.simulationKey?-1:1);
 const contributions=scheduled.map(({leagueKey,game})=>{
  const c=Object.hasOwn(records.games,game.simulationKey)?records.games[game.simulationKey]:undefined;
  if(!c || c.worldDay!==day || c.scope.leagueKey!==leagueKey || c.scope.seasonKey!==world.seasonKey || c.scope.phase!==(game.phase??'REGULAR') || Object.keys(c.teams).length!==2 || !Object.hasOwn(c.teams,game.awayTeamKey) || !Object.hasOwn(c.teams,game.homeTeamKey))throw new RangeError('DAY_GAMES_NOT_FINAL');
  return c;
 });
 const evidence=canonicalJson({worldKey:world.worldKey,seasonKey:world.seasonKey,day,contributions});
 const old=source.days.find(d=>d.day===day);
 if(old){if(old.evidence!==evidence)throw new RangeError('CHANGED_DAY_EVIDENCE');return {world,health,days:source,result:structuredClone(old.result),duplicate:true};}
 if(day!==(source.days.at(-1)?.day??first-1)+1 || source.days.some((d,i)=>d.day!==first+i))throw new RangeError('NON_CHRONOLOGICAL_PRO_DAY');
 if(Object.values(records.games).some(c=>(c.scope.leagueKey==='KBO' || c.scope.leagueKey==='FUTURES') && c.scope.seasonKey===world.seasonKey && c.worldDay>day))throw new RangeError('FUTURE_GAME_BEFORE_DAY_CLOSE');
 if(health.games.some(g=>g.evidence.seasonKey===world.seasonKey && g.evidence.day>=day))throw new RangeError('PARTIAL_DAY_HEALTH_STATE');
 const registered=new Set<string>();
 for(const leagueKey of ['KBO','FUTURES'] as const)for(const club of worlds[leagueKey].schools)for(const key of club.roster){if(registered.has(key) || !Object.hasOwn(world.players,key))throw new RangeError('INVALID_DAY_REGISTRATION');registered.add(key);}
 const appearances=new Map<string,'HITTER'|'STARTER'|'RELIEF'>();
 const mark=(key:string,kind:'HITTER'|'STARTER'|'RELIEF')=>{if(!registered.has(key) || appearances.has(key))throw new RangeError('INVALID_DAY_APPEARANCE');appearances.set(key,kind);};
 for(const c of contributions){for(const key of Object.keys(c.batting))mark(key,'HITTER');for(const [key,line] of Object.entries(c.pitching))mark(key,line.starts>0?'STARTER':'RELIEF');}
 const updated=structuredClone(world);
 for(const key of [...registered].sort())updated.players[key]=appearanceFatigue(updated.players[key]!,appearances.get(key)??'NONE');
 let nextHealth=health;const result:SchoolDayResult={injured:[],recovered:[]};
 for(const {leagueKey,game} of scheduled){for(const teamKey of [game.awayTeamKey,game.homeTeamKey].sort()){
  const roster=worlds[leagueKey].schools.find(s=>s.id===teamKey)!.roster;
  const settled=settleTeamGameHealth(nextHealth,{gameKey:game.simulationKey,teamKey:leagueKey+":"+teamKey,seasonKey:world.seasonKey,day,roster,appearances:roster.filter(key=>appearances.has(key)).map(playerKey=>({playerKey,riskFatigue:updated.players[playerKey]!.fatigue}))});
  nextHealth=settled.ledger;result.injured.push(...settled.result.injured);result.recovered.push(...settled.result.recovered);
 }}
 result.injured.sort();result.recovered.sort();
 return {world:updated,health:nextHealth,days:{...source,days:[...source.days,{day,evidence,result:structuredClone(result)}]},result,duplicate:false};
}

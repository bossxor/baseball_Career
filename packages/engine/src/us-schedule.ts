import {assertUsMilitaryPlayable} from './us-military-plan.js';
import {professionalGameDays} from './season-calendar.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {usPreseasonPlanView} from './us-preseason.js';
import {createEvenLeagueSchedule,assertSchedule} from './schedule.js';
import type {ScheduledGame} from './schedule.js';
import type {UsLevel} from './us-world.js';
import {canonicalJson} from './game.js';
export const US_SEASON_GAMES={ROOKIE:60,A:100,AA:120,AAA:144,MLB:162} as const;
export interface UsSeasonSchedule {receiptKey:string;seasonKey:string;sourceBasis:string;leagues:Record<UsLevel,readonly ScheduledGame[]>}
export type ScheduledUsCareer=UsCareer & {seasonSchedule?:UsSeasonSchedule};
const key=(s:UsCareer)=>JSON.stringify(['us-season-schedule',s.preseasonPlan!.receiptKey]);
const basis=(s:UsCareer)=>canonicalJson({calendar:s.world.calendar,organizations:s.world.organizations.map(o=>({id:o.id})),preseasonPlan:s.preseasonPlan});
function assertSource(s:ScheduledUsCareer,revision:number){assertUsCareerRevision(s,revision);if(usPreseasonPlanView(s).status!=='CONFIRMED' || (s.campNotices??[]).some(e=>e.status==='OPEN'))throw new RangeError('US_PRESEASON_UNCONFIRMED');}
function leagues(s:UsCareer):UsSeasonSchedule['leagues'] {
 const ids=s.world.organizations.map(o=>o.id),days=professionalGameDays(s.world.calendar);
 const result:UsSeasonSchedule['leagues']={ROOKIE:[],A:[],AA:[],AAA:[],MLB:[]};for(const level of Object.keys(US_SEASON_GAMES) as UsLevel[]){
 const games=US_SEASON_GAMES[level],schedule=createEvenLeagueSchedule({teamKeys:ids,leagueKey:level,seasonKey:s.world.seasonKey,startDay:0},games).map(g=>{const day=days[g.worldDay];if(day===undefined)throw new RangeError('US_SCHEDULE_EXCEEDS_CALENDAR');return {...g,worldDay:day};});assertSchedule(schedule,ids,games,games/2);result[level]=schedule;
 }return result;
}
export function assertUsSeasonSchedule(s:ScheduledUsCareer):void {assertUsCareerRevision(s,s.revision);const published=s.seasonSchedule;if(!published || published.receiptKey!==key(s) || published.seasonKey!==s.world.seasonKey || published.sourceBasis!==basis(s) || canonicalJson(published.leagues)!==canonicalJson(leagues(s)))throw new RangeError('STALE_US_SEASON_SCHEDULE');}
/** Publication commits all five calendars together; it does not play games, pay salary or reserve a second contract. */
export function publishUsSeasonSchedule(s:ScheduledUsCareer,revision:number):ScheduledUsCareer {assertUsMilitaryPlayable(s);return publishUsSeasonScheduleOwned(s,revision);}
/** Internal publication for the NPC season while the protagonist serves. */
export function publishUsMilitarySeasonSchedule(s:ScheduledUsCareer,revision:number):ScheduledUsCareer {if(!['FROZEN_SERVICE','TERMINATED_SERVICE'].includes(s.military.status))throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');return publishUsSeasonScheduleOwned(s,revision);}
function publishUsSeasonScheduleOwned(s:ScheduledUsCareer,revision:number):ScheduledUsCareer {assertSource(s,revision);if(s.seasonSchedule){assertUsSeasonSchedule(s);return structuredClone(s);}const next=structuredClone(s);next.seasonSchedule={receiptKey:key(s),seasonKey:s.world.seasonKey,sourceBasis:basis(s),leagues:leagues(s)};next.revision++;return next;}
export function usSeasonScheduleView(s:ScheduledUsCareer){assertUsSeasonSchedule(s);return {seasonKey:s.world.seasonKey,leagues:(Object.keys(US_SEASON_GAMES) as UsLevel[]).map(level=>({level,gamesPerTeam:US_SEASON_GAMES[level],totalGames:s.seasonSchedule!.leagues[level].length,nextDay:s.seasonSchedule!.leagues[level][0]!.worldDay}))};}

import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {assertKboOpeningRoster} from './kbo-opening-roster.js';
import {assertSeasonCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {createRoundRobinSchedule,assertSchedule} from './schedule.js';
import type {ScheduledGame} from './schedule.js';
import {canonicalJson} from './game.js';
import {createKboFutures11Schedule} from './kbo-futures-schedule.js';
import {kboSangmuServing,kboSangmuFieldable} from './kbo-sangmu-start.js';
import {SANGMU_TEAM_KEY} from './kbo-game-world.js';

export interface KboSeasonSchedule {
 receiptKey:string;seasonKey:string;openingRosterReceiptKey:string;
 sourceRevision:number;confirmedRevision:number;
 leagues:{KBO:readonly ScheduledGame[];FUTURES:readonly ScheduledGame[]};
}
/** Independent game-world dates: whole rounds span Feb-Oct, leaving every international barrier empty.
 * This is calendar placement only; growth budgets retain all calendar growthDays, including rest. */
export function createKboSeasonSchedules(teamKeys:readonly string[],seasonKey:string,calendar:SeasonCalendar):KboSeasonSchedule['leagues'] {
 assertSeasonCalendar(calendar);
 if(teamKeys.length!==10 || seasonKey!==String(calendar.year))throw new RangeError('INVALID_KBO_SCHEDULE_INPUT');
 const generate=(leagueKey:'KBO'|'FUTURES')=>{
  const raw=createRoundRobinSchedule({teamKeys,leagueKey,seasonKey,startDay:0},16),days=calendar.growthDays;
  if(days.length<144)throw new RangeError('INSUFFICIENT_KBO_CALENDAR');
  const result=raw.map(g=>({...g,worldDay:days[Math.floor(g.round*(days.length-1)/143)]!}));
  assertSchedule(result,teamKeys,144,72);return result;
 };
 return {KBO:generate('KBO'),FUTURES:generate('FUTURES')};
}
/** Futures is the 11-team calendar (with the military team) only while someone serves; otherwise the stored 10-team form. */
function schedulesFor(s:KboCareer):KboSeasonSchedule['leagues']{
 const ids=s.world.clubs.map(c=>c.id),base=createKboSeasonSchedules(ids,s.world.seasonKey,s.world.calendar);
 if(kboSangmuServing(s).length && !kboSangmuFieldable(s))throw new RangeError('SANGMU_TEAM_NOT_FIELDABLE');
 return kboSangmuServing(s).length?{KBO:base.KBO,FUTURES:createKboFutures11Schedule([...ids,SANGMU_TEAM_KEY],s.world.seasonKey,s.world.calendar)}:base;
}
const teamName=(s:KboCareer,id:string)=>s.world.clubs.find(c=>c.id===id)?.name??(id===SANGMU_TEAM_KEY?'상무':id);
const receiptKey=(s:KboCareer)=>JSON.stringify(['kbo-season-schedule',s.openingRoster!.receiptKey]);
/** PRE-only validation. Once games exist this receipt is historical, not a new roster decision. */
export function assertKboSeasonSchedule(s:KboCareer):KboSeasonSchedule {
 assertCareerRevision(s,s.revision);const opening=assertKboOpeningRoster(s),r=s.competitionSchedule;
 if(!r || r.receiptKey!==receiptKey(s) || r.seasonKey!==s.world.seasonKey || r.openingRosterReceiptKey!==opening.receiptKey || !Number.isSafeInteger(r.sourceRevision) || r.sourceRevision<opening.confirmedRevision || !Number.isSafeInteger(r.confirmedRevision) || r.confirmedRevision!==r.sourceRevision+1 || r.confirmedRevision>s.revision)throw new RangeError('STALE_KBO_SEASON_SCHEDULE');
 const expected=schedulesFor(s);
 if(canonicalJson(r.leagues)!==canonicalJson(expected))throw new RangeError('CHANGED_KBO_SEASON_SCHEDULE');
 return r;
}
/** One atomic schedule publication after a valid opening roster. No games/appearance/growth or phase advance. */
export function confirmKboSeasonSchedule(s:KboCareer,revision:number):KboCareer {
 assertCareerRevision(s,revision);const opening=assertKboOpeningRoster(s);
 if(s.competitionSchedule){assertKboSeasonSchedule(s);return structuredClone(s);}
 const leagues=schedulesFor(s),next=structuredClone(s);next.revision++;
 next.competitionSchedule={receiptKey:receiptKey(s),seasonKey:s.world.seasonKey,openingRosterReceiptKey:opening.receiptKey,sourceRevision:s.revision,confirmedRevision:next.revision,leagues};
 assertKboSeasonSchedule(next);return next;
}
/** Explicit allowlist. Reading an older root never creates a schedule or claims a played game. */
export function kboSeasonScheduleView(s:KboCareer){
 assertCareerRevision(s,s.revision);assertKboOpeningRoster(s);
 if(!s.competitionSchedule)return {status:'PENDING' as const,seasonKey:s.world.seasonKey,competitionKey:s.registration.competitionKey!,gamesPerTeam:144,fixtures:[]};
 const r=assertKboSeasonSchedule(s);if(kboActiveContractSuspended(s.world.contracts[s.protagonistKey]!))return {status:'CONFIRMED' as const,seasonKey:r.seasonKey,competitionKey:null,gamesPerTeam:144,fixtures:[],reason:'SERVING_ACTIVE'};
 const competitionKey=s.registration.competitionKey!,club=s.protagonistClubId;
 const fixtures=r.leagues[competitionKey].filter(g=>g.homeTeamKey===club || g.awayTeamKey===club).map(g=>({gameKey:g.simulationKey,worldDay:g.worldDay,round:g.round,home:{id:g.homeTeamKey,name:teamName(s,g.homeTeamKey)},away:{id:g.awayTeamKey,name:teamName(s,g.awayTeamKey)}}));
 return {status:'CONFIRMED' as const,seasonKey:r.seasonKey,competitionKey,gamesPerTeam:144,fixtures};
}

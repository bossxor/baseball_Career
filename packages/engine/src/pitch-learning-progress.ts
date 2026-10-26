import {settlePitchLearning} from './repertoire.js';
import type {Repertoire} from './repertoire.js';
import type {RecordLedger} from './records.js';
import type {HealthLedger} from './health.js';
import type {ScheduledGame} from './schedule.js';

export function registerPitchLearning(source:Repertoire,worldKey:string,playerKey:string,scheduledGames:number,openingInjured:boolean):Repertoire {
 if(!source.learning||!worldKey||!playerKey||!Number.isSafeInteger(scheduledGames)||scheduledGames<1||typeof openingInjured!=='boolean')throw new RangeError('INVALID_LEARNING_REGISTRATION');
 if(source.learning.registration){const old=source.learning.registration;if(old.worldKey!==worldKey||old.playerKey!==playerKey||old.scheduledGames!==scheduledGames||old.openingInjured!==openingInjured)throw new RangeError('PITCH_LEARNING_REGISTRATION_REUSED');return structuredClone(source);}
 const next=structuredClone(source);next.learning!.registration={worldKey,playerKey,scheduledGames,openingInjured};return next;
}
type Calendar=NonNullable<NonNullable<Repertoire['learning']>['registration']>['calendar'];
function validateCalendar(calendar:NonNullable<Calendar>,scheduledGames:number){
 if(calendar.length!==scheduledGames||new Set(calendar.map(g=>g.gameKey)).size!==scheduledGames||calendar.some((g,i)=>!g.gameKey||!Number.isSafeInteger(g.day)||g.day<0||i>0&&g.day<=calendar[i-1]!.day))throw new RangeError('INVALID_PITCH_LEARNING_CALENDAR');
}
/** Freeze the original league/team schedule; promotion never resets its quarters. */
export function registerPitchLearningCalendar(source:Repertoire,schedule:readonly Pick<ScheduledGame,'simulationKey'|'worldDay'>[]):Repertoire {
 const meta=source.learning?.registration;if(!meta)throw new RangeError('MISSING_LEARNING_REGISTRATION');
 const calendar=schedule.map(g=>({gameKey:g.simulationKey,day:g.worldDay})).sort((a,b)=>a.day-b.day);validateCalendar(calendar,meta.scheduledGames);
 if(meta.calendar&&JSON.stringify(meta.calendar)!==JSON.stringify(calendar))throw new RangeError('PITCH_LEARNING_CALENDAR_CHANGED');
 const next=structuredClone(source);next.learning!.registration!.calendar=calendar;return next;
}
/** Legacy plans infer their original team from their first official regular registration. */
function inferCalendar(entries:HealthLedger['games'],records:RecordLedger,schedule:readonly ScheduledGame[]):ScheduledGame[]|null {
 const first=entries.find(g=>records.games[g.evidence.gameKey]!.scope.phase==='REGULAR');if(!first)return null;
 const row=records.games[first.evidence.gameKey]!,team=Object.keys(row.teams).find(key=>first.evidence.teamKey===key||first.evidence.teamKey===row.scope.leagueKey+':'+key);
 if(!team)throw new RangeError('MISSING_LEARNING_REGISTRATION_TEAM');
 return schedule.filter(g=>g.leagueKey===row.scope.leagueKey&&(g.homeTeamKey===team||g.awayTeamKey===team));
}
/** FINAL schedule progress closes quarters; only healthy registrations inside each interval pay XP. */
export function settleRegisteredPitchLearning(input:{worldKey:string;seasonKey:string;playerKey:string;repertoire:Repertoire;records:RecordLedger;health:HealthLedger;scheduledGames:number;numerator:5|6|15;schedule?:readonly ScheduledGame[]}):Repertoire {
 let book=input.repertoire;if(!book.learning)return book;if(book.seasonId!==input.seasonKey)throw new RangeError('PITCH_LEARNING_SEASON_CHANGED');
 const entries=input.health.games.filter(g=>g.evidence.seasonKey===input.seasonKey&&g.evidence.roster.includes(input.playerKey)).sort((a,b)=>a.evidence.day-b.evidence.day||(a.evidence.gameKey<b.evidence.gameKey?-1:1));
 const days=new Set<number>();for(const g of entries){const r=input.records.games[g.evidence.gameKey];if(!r||r.scope.seasonKey!==input.seasonKey||r.worldDay!==g.evidence.day)throw new RangeError('MISSING_LEARNING_GAME');if(days.has(r.worldDay))throw new RangeError('DOUBLE_BOOKED_LEARNING_DAY');days.add(r.worldDay);}
 let opening=Object.hasOwn(input.health.injuries,input.playerKey);for(const g of [...entries].reverse()){if(g.result.injured.includes(input.playerKey))opening=false;if(g.result.recovered.includes(input.playerKey))opening=true;}
 if(!book.learning.registration)book=registerPitchLearning(book,input.worldKey,input.playerKey,input.scheduledGames,opening);
 if(!book.learning!.registration!.calendar&&input.schedule){const calendar=inferCalendar(entries,input.records,input.schedule);if(calendar)book=registerPitchLearningCalendar(book,calendar);}
 const registration=book.learning!.registration!;if(registration.worldKey!==input.worldKey||registration.playerKey!==input.playerKey||registration.scheduledGames!==input.scheduledGames)throw new RangeError('PITCH_LEARNING_REGISTRATION_CHANGED');
 let injured=registration.openingInjured;const regular:{day:number;healthy:boolean}[]=[];
 for(const g of entries){if(input.records.games[g.evidence.gameKey]!.scope.phase==='REGULAR')regular.push({day:g.evidence.day,healthy:!injured});if(g.result.injured.includes(input.playerKey))injured=true;if(g.result.recovered.includes(input.playerKey))injured=false;}
 let completed=regular.length;
 if(registration.calendar){
  validateCalendar(registration.calendar,registration.scheduledGames);
  if(input.schedule){const published=new Map(input.schedule.map(g=>[g.simulationKey,g.worldDay]));if(registration.calendar.some(g=>published.get(g.gameKey)!==g.day))throw new RangeError('PITCH_LEARNING_CALENDAR_CHANGED');}
  const closedThrough=Math.max(-1,...input.health.games.filter(g=>g.evidence.seasonKey===input.seasonKey).map(g=>g.evidence.day));let missing=false;completed=0;
  for(const g of registration.calendar){const row=input.records.games[g.gameKey];if(!row||g.day>closedThrough){missing=true;continue;}if(row.scope.seasonKey!==input.seasonKey||row.scope.phase!=='REGULAR'||row.worldDay!==g.day)throw new RangeError('CHANGED_LEARNING_SCHEDULE_GAME');if(missing)throw new RangeError('NON_CHRONOLOGICAL_LEARNING_CALENDAR');completed++;}
 }
 for(let q=1;q<=4;q++){
  const end=Math.ceil(registration.scheduledGames*q/4),start=Math.ceil(registration.scheduledGames*(q-1)/4);if(completed<end)break;
  const calendar=registration.calendar,period=calendar?regular.filter(d=>d.day>(start?calendar[start-1]!.day:-1)&&d.day<=calendar[end-1]!.day):regular.slice(start,end);
  // Incompatible old quarter receipts fail instead of being overwritten or paid twice.
  book=settlePitchLearning(book,{quarter:q as 1|2|3|4,healthyDays:period.filter(d=>d.healthy).length,registeredDays:period.length,numerator:input.numerator,completedGames:Math.min(completed,registration.scheduledGames),scheduledGames:registration.scheduledGames});
 }
 return book;
}

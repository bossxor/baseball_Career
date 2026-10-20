import {canonicalJson} from './game.js';
import type {ScheduledGame} from './schedule.js';

export interface SeasonCalendar {
 version:'calendar-1';year:number;growthDays:readonly number[];highSchoolDays:readonly number[];
 international:readonly {type:'WBC'|'OLY'|'AG'|'P12';startDay:number;endDay:number}[];
}
/** Independent game calendar, not real tournament dates. All ranges are half-open. */
export function createSeasonCalendar(year:number):SeasonCalendar {
 if(!Number.isSafeInteger(year) || year<2027 || year>9999)throw new RangeError('INVALID_SEASON_YEAR');
 const leap=year%4===0 && (year%100!==0 || year%400===0),lengths=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 const day=(month:number,date:number)=>lengths.slice(0,month-1).reduce((n,d)=>n+d,0)+date-1;
 const international:SeasonCalendar['international'][number][]=[];
 if((year-2026)%4===0){international.push({type:'WBC',startDay:day(2,8),endDay:day(2,8)+21});international.push({type:'AG',startDay:day(9,1),endDay:day(9,15)});}
 if((year-2028)%4===0)international.push({type:'OLY',startDay:day(7,15),endDay:day(7,29)});
 if((year-2027)%4===0)international.push({type:'P12',startDay:day(11,15),endDay:day(11,29)});
 international.sort((a,b)=>a.startDay-b.startDay);
 const available=(start:number,end:number)=>Array.from({length:end-start},(_,i)=>start+i).filter(d=>!international.some(w=>d>=w.startDay && d<w.endDay));
 return {version:'calendar-1',year,growthDays:available(day(2,1),day(11,1)),highSchoolDays:available(day(2,1),day(7,1)),international};
}
export function assertSeasonCalendar(calendar:SeasonCalendar):void {
 if(canonicalJson(calendar)!==canonicalJson(createSeasonCalendar(calendar.year)))throw new RangeError('CHANGED_SEASON_CALENDAR');
}
/** Retain match identities/venues; spread complete rounds across the fixed school window. */
export function scheduleHighSchoolCalendar(schedule:readonly ScheduledGame[],calendar:SeasonCalendar):ScheduledGame[] {
 assertSeasonCalendar(calendar);
 const rounds=[...new Set(schedule.map(g=>g.round))].sort((a,b)=>a-b),days=calendar.highSchoolDays;
 if(schedule.length!==216 || rounds.length!==54 || rounds.some((r,i)=>r!==i || schedule.filter(g=>g.round===r).length!==4) || days.length<rounds.length)throw new RangeError('INVALID_SCHOOL_CALENDAR_ROUNDS');
 return schedule.map(g=>({...g,worldDay:days[Math.floor(g.round*(days.length-1)/(rounds.length-1))]!}));
}

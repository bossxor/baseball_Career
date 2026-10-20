import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import {collegeCupSchedule} from './college-cup.js';
import {settleSchoolCareerGrowth} from './high-school-growth.js';

export interface CollegeSeasonResult {receiptKey:string;seasonKey:string;academicYear:1|2|3|4;recordRevision:number;championKey:string}
export function completedCollegeSchedule(source:HighSchoolCareer){
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.collegeCup?.status!=='COMPLETE' || !source.collegeCup.championKey)throw new RangeError('COLLEGE_CUP_NOT_COMPLETE');
 const schedule=[...source.world.schedule,...collegeCupSchedule(source)],last=Math.max(...schedule.map(g=>g.worldDay));
 if(source.days.days.at(-1)?.day!==last)throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 return schedule;
}
function openingRehabilitation(source:HighSchoolCareer):boolean {
 const previous=source.previousSeasons?.at(-1);
 if(!previous || previous.world.protagonistKey!==source.world.protagonistKey || !previous.health.closedSeasons.includes(previous.world.seasonKey))throw new RangeError('MISSING_PREVIOUS_SEASON');
 return Object.hasOwn(previous.health.injuries,source.world.protagonistKey);
}
/** Cup health is audited, but only the regular school calendar contributes growth entitlement. */
export function settleCollegeCareerGrowth(source:HighSchoolCareer,expectedRevision:number){
 assertCollegeCareerRevision(source,expectedRevision);
 const schedule=completedCollegeSchedule(source);
 return settleSchoolCareerGrowth(source,expectedRevision,schedule,openingRehabilitation(source));
}
/** Acknowledging a completed year pays once and records academic completion, without changing age/year. */
export function acknowledgeCollegeSeasonReview(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);
 const admission=source.collegeAdmission!;
 if(source.collegeResult || admission.yearsCompleted!==admission.academicYear-1)throw new RangeError('COLLEGE_YEAR_ALREADY_COMPLETE');
 const career=settleCollegeCareerGrowth(source,expectedRevision).career;
 career.collegeAdmission={...admission,yearsCompleted:admission.academicYear};
 career.collegeResult={receiptKey:JSON.stringify(['college-result',source.world.worldKey,source.world.seasonKey,admission.academicYear,source.world.protagonistKey]),seasonKey:source.world.seasonKey,academicYear:admission.academicYear,recordRevision:source.records.revision,championKey:source.collegeCup!.championKey!};
 career.phaseContext={phase:'OFFSEASON_REVIEW'};return career;
}

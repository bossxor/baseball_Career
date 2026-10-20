import type {HighSchoolCareer,HighSchoolAdvancePlan} from './high-school-career.js';
import {assertCollegeCareerRevision,setSchoolPreseasonFocus,setSchoolPreseasonArchetype,confirmSchoolPreseason} from './high-school-career.js';
import {advanceSchoolCareer,pauseSchoolCareer} from './high-school-progress.js';
import {trainSchoolCareer} from './high-school-training.js';
import type {TrainingChoice} from './training.js';

export function setCollegePreseasonFocus(source:HighSchoolCareer,expectedRevision:number,focus:readonly string[]):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);return setSchoolPreseasonFocus(source,expectedRevision,focus);
}
export function setCollegePreseasonArchetype(source:HighSchoolCareer,expectedRevision:number,archetype:string):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);return setSchoolPreseasonArchetype(source,expectedRevision,archetype);
}
export function confirmCollegePreseason(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);return confirmSchoolPreseason(source,expectedRevision);
}
export function advanceCollegeCareer(source:HighSchoolCareer,expectedRevision:number,mode?:HighSchoolAdvancePlan['mode']) {
 assertCollegeCareerRevision(source,expectedRevision);return advanceSchoolCareer(source,expectedRevision,mode);
}
export function pauseCollegeCareer(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);return pauseSchoolCareer(source,expectedRevision);
}
export function trainCollegeCareer(source:HighSchoolCareer,expectedRevision:number,choice:TrainingChoice):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);return trainSchoolCareer(source,expectedRevision,choice);
}

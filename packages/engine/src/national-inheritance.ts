import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeNationalState} from './college-national.js';
import type {NationalLedger} from './kbo-national.js';

/** Completed school tournaments stay in amateurHistory; pro roots inherit benefits, not another owner's live session. */
export function schoolNationalInheritance(source:HighSchoolCareer):{national:NationalLedger;status:'ATHLETE_ELIGIBLE'|'ATHLETE_SERVICE'|'COMPLETED'}|null {
 const n=source.national;if(!n)return null;
 assertCollegeNationalState(source);
 if(n.invitations.some(i=>i.status==='INVITED')||(n.brackets??[]).some(b=>!n.returnedCompetitions?.includes(b.competitionId)))throw new RangeError('NATIONAL_SCHOOL_RETURN_REQUIRED');
 const status=n.militaryStatus;if(!status||status==='UNRESOLVED')return null;
 const national:NationalLedger={invitations:structuredClone(n.invitations),competitions:structuredClone(n.competitions),benefits:structuredClone(n.benefits),...(n.eligibilityReviews?{eligibilityReviews:[...n.eligibilityReviews]}:{}),...(n.returnedCompetitions?{returnedCompetitions:[...n.returnedCompetitions]}:{}),...(n.athleteDutySeasonsRemaining===undefined?{}:{athleteDutySeasonsRemaining:n.athleteDutySeasonsRemaining,athleteDutyStartSeasonKey:n.athleteDutyStartSeasonKey,athleteDutySettledSeasons:[...(n.athleteDutySettledSeasons??[])]})};
 return {national,status};
}

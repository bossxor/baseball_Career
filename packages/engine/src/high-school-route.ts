import {COLLEGES,overall,roleScore} from '@playball/rules';
import {assertHighSchoolCareerRevision} from './high-school-career.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {settleHighSchoolCareerGrowth} from './high-school-growth.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {draftBaseScore} from './draft.js';
import {canonicalJson} from './game.js';
import {validateDevelopmentPlayer} from './player.js';
import {createWorldEvent,resolveEventChoice,completeBlockingEvent} from './events.js';
import {createSeasonCalendar,assertSeasonCalendar} from './season-calendar.js';

export interface HighSchoolGraduation {
 version:1;eventKey:string;offerSetKey:string;sourceBasis:string;
}
export interface CollegeAdmission {
 admissionKey:string;collegeId:string;status:'ADMITTED'|'ENROLLED';entryYear:number;
 academicYear:1|2|3|4;yearsCompleted:0|1|2|3|4;playerKey:string;position:string;
}
function evaluation(source:HighSchoolCareer){
 const player=source.world.players[source.world.protagonistKey]!;validateDevelopmentPlayer(player);
 const totals=recordTotals(source.records,{seasonKey:source.world.seasonKey,leagueKey:'HS',phase:'REGULAR'});
 const batting=totals.batting[player.simulationKey]??emptyBatting(),pitching=totals.pitching[player.simulationKey]??emptyPitching();
 const score=overall(player.kind,player.abilities),performance=player.kind==='HITTER'?recentBattingPerformance(batting):recentPitchingPerformance(pitching);
 const role=roleScore(player.kind,player.abilities,player.position);
 return {playerKey:player.simulationKey,kind:player.kind,position:player.position,age:player.age,abilities:player.abilities,overall:score.sumUnits/score.denominator,overallDisplay:score.display,roleScore:role,performance,appearances:player.kind==='HITTER'?batting.PA:pitching.outs,draftBaseScore:draftBaseScore(role,performance)};
}
function basis(source:HighSchoolCareer):string {
 return canonicalJson({worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,schoolId:source.world.protagonistSchoolId,calendar:source.world.calendar,seasonGrowth:source.seasonGrowth,recordsRevision:source.records.revision,evaluation:evaluation(source)});
}
/** Validate the committed admission before year-end changes invalidate the old evaluation basis. */
export function assertPendingCollegeAdmission(source:HighSchoolCareer):CollegeAdmission {
 const admission=source.collegeAdmission,graduation=source.graduation,calendar=source.world.calendar;
 if(source.world.leagueKey || source.phaseContext.phase!=='NEXT_SEASON_READY' || source.phaseContext.route!=='COLLEGE' || !admission || admission.status!=='ADMITTED' || !graduation || !calendar || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_COLLEGE_ADMISSION');
 assertSeasonCalendar(calendar);
 const college=COLLEGES.find(c=>c.id===admission.collegeId),event=source.events.find(e=>e.eventKey===graduation.eventKey);
 if(graduation.version!==1 || graduation.sourceBasis!==basis(source) || admission.admissionKey!==JSON.stringify(['college-admission',graduation.offerSetKey,admission.collegeId]) || source.phaseContext.admissionKey!==admission.admissionKey || admission.entryYear!==calendar.year+1 || admission.playerKey!==source.world.protagonistKey || admission.position!==source.world.players[admission.playerKey]?.position || admission.academicYear!==1 || admission.yearsCompleted!==0 || !college || evaluation(source).overall<college.minimumOverall || !event || event.definitionId!=='E04' || event.status!=='RESOLVED' || event.resolution?.command!=='ENROLL_COLLEGE' || event.resolution.receiptKey!==admission.admissionKey)throw new RangeError('INVALID_COLLEGE_ADMISSION');
 return structuredClone(admission);
}
/** Growth and the blocking E04 task are committed together before route comparisons become available. */
export function acknowledgeHighSchoolSeasonReview(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.graduation || source.collegeAdmission || source.events.some(e=>e.status==='OPEN' || e.definitionId==='E04'))throw new RangeError('INVALID_CAREER_PHASE');
 const career=settleHighSchoolCareerGrowth(source,expectedRevision).career,world=career.world;
 const event=createWorldEvent({definitionId:'E04',worldKey:world.worldKey,seasonKey:world.seasonKey,evidence:{version:1,type:'CAREER_START',fields:{careerSimulationKey:world.protagonistKey}},resume:{worldKey:world.worldKey,seasonKey:world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'HS',registrationKey:world.protagonistSchoolId,sourceRevision:career.revision},sourceSequence:career.events.length+1,worldDay:Math.max(...world.schedule.map(g=>g.worldDay))});
 career.events=[...career.events,event];career.graduation={version:1,eventKey:event.eventKey,offerSetKey:JSON.stringify(['hs-route',world.worldKey,world.seasonKey,world.protagonistKey]),sourceBasis:basis(career)};
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{phase:'CAREER_ROUTE'}};return career;
}
function routeSource(source:HighSchoolCareer){
 const phase=source.phaseContext,graduation=source.graduation;
 if(phase.phase!=='CAREER_ROUTE' && !(phase.phase==='EVENT_DECISION' && phase.resume.phase==='CAREER_ROUTE'))throw new RangeError('INVALID_CAREER_PHASE');
 if(!source.world.calendar)throw new RangeError('MISSING_SEASON_CALENDAR');assertSeasonCalendar(source.world.calendar);
 if(!graduation || graduation.version!==1 || graduation.sourceBasis!==basis(source) || graduation.offerSetKey!==JSON.stringify(['hs-route',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey]))throw new RangeError('STALE_CAREER_ROUTE');
 const event=source.events.find(e=>e.eventKey===graduation.eventKey);
 if(!event || event.definitionId!=='E04' || event.status!=='OPEN' || event.resume.worldKey!==source.world.worldKey || event.resume.seasonKey!==source.world.seasonKey || event.resume.phase!=='CAREER_ROUTE' || event.resume.registrationKey!==source.world.protagonistSchoolId || event.evidence.fields.careerSimulationKey!==source.world.protagonistKey || phase.phase==='EVENT_DECISION' && phase.eventKey!==event.eventKey || source.events.filter(e=>e.status==='OPEN').length!==1)throw new RangeError('INVALID_CAREER_EVENT_SOURCE');
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_ROUTE']};
 resolveEventChoice(event,event.version,'OPEN_ROUTE',null,context);
 return {graduation,event,context};
}
/** Read-only allowlist. Recruitment results and US offers are never fabricated to fill a card. */
export function highSchoolCareerRouteView(source:HighSchoolCareer){
 const {graduation}=routeSource(source),result=evaluation(source);
 return {offerSetKey:graduation.offerSetKey,offerSetVersion:graduation.version,overall:result.overall,overallDisplay:result.overallDisplay,
  kbo:{status:'AWAITING_RECRUITMENT' as const},
  colleges:COLLEGES.map(college=>({...college,eligible:result.overall>=college.minimumOverall,reasonCode:result.overall>=college.minimumOverall?null:'OVERALL_TOO_LOW',position:result.position})),
 };
}
export function openHighSchoolCareerRoute(source:HighSchoolCareer,expectedRevision:number,eventVersion:number){
 assertHighSchoolCareerRevision(source,expectedRevision);const {event,context}=routeSource(source);
 const selected=resolveEventChoice(event,eventVersion,'OPEN_ROUTE',null,context),career=structuredClone(source);
 career.phaseContext={phase:'CAREER_ROUTE'};career.revision++;return {career,navigation:selected.navigation};
}
/** Admission is effective next season; the completed school world and its official records remain historical. */
export function enrollHighSchoolCollege(source:HighSchoolCareer,expectedRevision:number,input:{eventVersion:number;offerSetKey:string;offerSetVersion:number;collegeId:string}):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);const {graduation,event,context}=routeSource(source);
 if(source.phaseContext.phase!=='CAREER_ROUTE' || source.collegeAdmission)throw new RangeError('INVALID_CAREER_PHASE');
 if(input.offerSetKey!==graduation.offerSetKey || input.offerSetVersion!==graduation.version)throw new RangeError('COLLEGE_OFFER_SET_CHANGED');
 const college=COLLEGES.find(c=>c.id===input.collegeId),result=evaluation(source);
 if(!college || result.overall<college.minimumOverall)throw new RangeError('COLLEGE_NOT_ELIGIBLE');
 const entryYear=source.world.calendar!.year+1;createSeasonCalendar(entryYear);
 const admissionKey=JSON.stringify(['college-admission',graduation.offerSetKey,college.id]),career=structuredClone(source);
 const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:admissionKey,command:'ENROLL_COLLEGE'},context);
 career.collegeAdmission={admissionKey,collegeId:college.id,status:'ADMITTED',entryYear,academicYear:1,yearsCompleted:0,playerKey:result.playerKey,position:result.position};
 career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.phaseContext={phase:'NEXT_SEASON_READY',route:'COLLEGE',admissionKey};career.revision++;return career;
}

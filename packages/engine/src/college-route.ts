import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import {assertCollegeYearResult} from './college-result.js';
import {collegeCareerDraftEvaluation} from './college-graduation.js';
import {createWorldEvent,completeBlockingEvent} from './events.js';
import {kboDraftView} from './kbo-draft.js';

/** 43: one second-year early KBO attempt per enrollment; it does not consume the 66 preparation budget. */
export const isCollegeEarlyDraft=(source:HighSchoolCareer)=>source.world.leagueKey==='COLLEGE'&&source.collegeAdmission?.status==='ENROLLED'&&source.collegeAdmission.earlyDraftAttempted===true;

/** Internal: the acknowledging/drafting command has already advanced its revision once. */
export function attachCollegeEarlyTask(source:HighSchoolCareer,definitionId:'E73'|'E74'):HighSchoolCareer {
 const admission=source.collegeAdmission!,result=assertCollegeYearResult(source),career=structuredClone(source);
 const event=createWorldEvent({definitionId,worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:'COLLEGE',fields:{playerSimulationKey:source.world.protagonistKey,enrollmentId:admission.admissionKey,academicYear:2,sourceTaskId:result.receiptKey}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'COLLEGE',registrationKey:admission.collegeId,sourceRevision:source.revision},sourceSequence:source.events.length+1,worldDay:source.days.days.at(-1)!.day});
 career.events=[...career.events,event];career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{phase:'CAREER_ROUTE'}};return career;
}
function openTask(source:HighSchoolCareer,expectedRevision:number,definitionId:'E73'|'E74'){
 assertCollegeCareerRevision(source,expectedRevision);const admission=source.collegeAdmission!,phase=source.phaseContext,event=source.events.find(e=>phase.phase==='EVENT_DECISION'&&e.eventKey===phase.eventKey);
 if(phase.phase!=='EVENT_DECISION'||!event||event.definitionId!==definitionId||source.events.filter(e=>e.status==='OPEN').length!==1)throw new RangeError('INVALID_CAREER_PHASE');
 if(admission.academicYear!==2||admission.yearsCompleted!==2||event.evidence.fields.enrollmentId!==admission.admissionKey||event.evidence.fields.sourceTaskId!==assertCollegeYearResult(source).receiptKey)throw new RangeError('STALE_COLLEGE_EARLY_TASK');
 return {admission,event,context:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay}};
}
const receipt=(source:HighSchoolCareer,command:string)=>JSON.stringify(['college-early-route',command,source.world.worldKey,source.world.seasonKey,source.collegeAdmission!.admissionKey,source.world.protagonistKey]);

/** E73 ENTER_EARLY_DRAFT: opens the existing KBO draft route without changing age, records or enrollment. */
export function enterCollegeEarlyDraft(source:HighSchoolCareer,expectedRevision:number,eventVersion:number):HighSchoolCareer {
 const {admission,event,context}=openTask(source,expectedRevision,'E73');if(admission.earlyDraftAttempted||source.kboRecruitment)throw new RangeError('COLLEGE_EARLY_DRAFT_ATTEMPTED');
 const resolved=completeBlockingEvent(event,eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:receipt(source,'ENTER_EARLY_DRAFT'),command:'ENTER_EARLY_DRAFT'},{...context,eligibleCommands:['ENTER_EARLY_DRAFT']});
 const career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.collegeAdmission={...admission,earlyDraftAttempted:true};career.phaseContext={phase:'CAREER_ROUTE'};career.revision++;return career;
}
/** E73 stay or E74 return: ADVANCE_ACADEMIC_YEAR keeps enrollment; an unsigned early recruitment is archived, never reused. */
export function returnUnsignedCollegeCareer(source:HighSchoolCareer,expectedRevision:number,eventVersion:number):HighSchoolCareer {
 const id=source.events.find(e=>source.phaseContext.phase==='EVENT_DECISION'&&e.eventKey===source.phaseContext.eventKey)?.definitionId==='E74'?'E74':'E73',{event,context}=openTask(source,expectedRevision,id);
 const r=source.kboRecruitment;if(id==='E74'?!r?.program.result||r.program.decision==='SIGNED'||r.program.result?.round&&r.program.decision!=='DECLINED':!!r)throw new RangeError('COLLEGE_RETURN_NOT_AVAILABLE');
 const resolved=completeBlockingEvent(event,eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:receipt(source,id),command:'ADVANCE_ACADEMIC_YEAR'},{...context,eligibleCommands:['ADVANCE_ACADEMIC_YEAR']});
 const career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);
 if(career.kboRecruitment){career.previousKboRecruitments=[...(career.previousKboRecruitments??[]),career.kboRecruitment];delete career.kboRecruitment;}
 career.phaseContext={phase:'OFFSEASON_REVIEW'};career.revision++;return career;
}
/** Public allowlist for the early route; draft odds come only from the existing KBO view. */
export function collegeEarlyRouteView(source:HighSchoolCareer){
 const admission=source.collegeAdmission!;if(!isCollegeEarlyDraft(source)||source.phaseContext.phase!=='CAREER_ROUTE'||admission.academicYear!==2)throw new RangeError('INVALID_CAREER_PHASE');
 return {seasonKey:source.world.seasonKey,collegeId:admission.collegeId,status:'EARLY_DRAFT' as const,academicYear:2 as const,...collegeCareerDraftEvaluation(source),kbo:source.kboRecruitment?kboDraftView(source.kboRecruitment.world,source.kboRecruitment.program):{status:'AWAITING_RECRUITMENT' as const}};
}

import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import {assertCollegeYearResult} from './college-result.js';
import {collegeCareerDraftEvaluation} from './college-graduation.js';
import {createWorldEvent,completeBlockingEvent} from './events.js';
import {canonicalJson} from './game.js';
import {kboDraftView} from './kbo-draft.js';
import {careerUsDirectView} from './career-us.js';

export interface CollegeEarlyRoute {schemaVersion:1;eventKey:string;receiptKey:string;sourceBasis:string;returnEventKey?:string}
function basis(c:HighSchoolCareer){return canonicalJson({world:c.world,admission:c.collegeAdmission,result:c.collegeResult,cup:c.collegeCup,records:c.records,health:c.health,days:c.days,development:c.development,seasonGrowth:c.seasonGrowth});}
function event(c:HighSchoolCareer,id:'E73'|'E74',task:string){
 const a=c.collegeAdmission!;
 return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:'COLLEGE',fields:{playerSimulationKey:c.world.protagonistKey,enrollmentId:a.admissionKey,academicYear:2,sourceTaskId:task}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'COLLEGE',registrationKey:a.collegeId,sourceRevision:c.revision},sourceSequence:c.events.length+1,worldDay:c.days.days.at(-1)!.day});
}
/** Called by the actual second-year result commit, before either the draft or continued enrollment. */
export function attachCollegeEarlyRoute(c:HighSchoolCareer):HighSchoolCareer {
 assertCollegeCareerRevision(c,c.revision);const result=assertCollegeYearResult(c),a=c.collegeAdmission!;
 if(a.academicYear!==2||a.earlyDraftAttempted||c.collegeEarlyRoute||c.phaseContext.phase!=='OFFSEASON_REVIEW'||c.events.some(e=>e.status==='OPEN'))throw new RangeError('COLLEGE_EARLY_ROUTE_NOT_AVAILABLE');
 const next=structuredClone(c),e=event(next,'E73',result.receiptKey);next.events=[...next.events,e];next.phaseContext={phase:'EVENT_DECISION',eventKey:e.eventKey,resume:{phase:'CAREER_ROUTE'}};
 next.collegeEarlyRoute={schemaVersion:1,eventKey:e.eventKey,receiptKey:JSON.stringify(['college-early-route',a.admissionKey,c.world.seasonKey]),sourceBasis:basis(next)};return next;
}
function current(c:HighSchoolCareer){
 assertCollegeCareerRevision(c,c.revision);const result=assertCollegeYearResult(c),a=c.collegeAdmission!,r=c.collegeEarlyRoute,e=c.events.find(e=>e.eventKey===r?.eventKey);
 if(a.academicYear!==2||!r||r.schemaVersion!==1||r.sourceBasis!==basis(c)||r.receiptKey!==JSON.stringify(['college-early-route',a.admissionKey,c.world.seasonKey])||!e||e.definitionId!=='E73'||e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.enrollmentId!==a.admissionKey||e.evidence.fields.playerSimulationKey!==a.playerKey||e.evidence.fields.academicYear!==2||e.evidence.fields.sourceTaskId!==result.receiptKey||e.resume.registrationKey!==a.collegeId)throw new RangeError('STALE_COLLEGE_EARLY_ROUTE');
 return {a,r,e};
}
function choose(c:HighSchoolCareer,version:number,command:'ENTER_EARLY_DRAFT'|'ADVANCE_ACADEMIC_YEAR'){
 const {a,r,e}=current(c),p=c.phaseContext;
 if(p.phase!=='EVENT_DECISION'||p.eventKey!==e.eventKey||a.earlyDraftAttempted)throw new RangeError('COLLEGE_EARLY_ATTEMPT_NOT_AVAILABLE');
 const resolved=completeBlockingEvent(e,version,{sourceEvidenceKey:e.evidenceKey,receiptKey:r.receiptKey,command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[command]}),next=structuredClone(c);
 next.events=next.events.map(v=>v.eventKey===e.eventKey?resolved:v);next.phaseContext={phase:command==='ENTER_EARLY_DRAFT'?'CAREER_ROUTE':'OFFSEASON_REVIEW'};
 if(command==='ENTER_EARLY_DRAFT')next.collegeAdmission={...a,earlyDraftAttempted:true};next.collegeEarlyRoute={...r,sourceBasis:basis(next)};return next;
}
export function enterCollegeEarlyDraft(c:HighSchoolCareer,revision:number,eventVersion:number):HighSchoolCareer {
 assertCollegeCareerRevision(c,revision);const next=choose(c,eventVersion,'ENTER_EARLY_DRAFT');next.revision++;return next;
}
/** The existing ADVANCE_ACADEMIC_YEAR year-close command owns this event and its single revision. */
export function prepareCollegeYearContinuation(c:HighSchoolCareer):HighSchoolCareer {
 const phase=c.phaseContext;if(phase.phase!=='EVENT_DECISION')return c;
 const e=c.events.find(e=>e.eventKey===phase.eventKey);return e?.definitionId==='E73'?choose(c,e.version,'ADVANCE_ACADEMIC_YEAR'):c;
}
export function collegeEarlyRouteView(c:HighSchoolCareer){
 const {a,e}=current(c);
 if(c.phaseContext.phase!=='CAREER_ROUTE'||!a.earlyDraftAttempted||e.status!=='RESOLVED'||e.resolution?.command!=='ENTER_EARLY_DRAFT'||c.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_CAREER_PHASE');
 return {seasonKey:c.world.seasonKey,collegeId:a.collegeId,academicYear:2 as const,yearsCompleted:2 as const,status:'ENROLLED' as const,...collegeCareerDraftEvaluation(c),kbo:c.kboRecruitment?kboDraftView(c.kboRecruitment.world,c.kboRecruitment.program):{status:'AWAITING_RECRUITMENT' as const},...(c.usRecruitment&&careerUsDirectView(c).visible?{us:careerUsDirectView(c)}:{})};
}
/** An actual failed/declined assessment creates the return task; no new draft roll or preparation season. */
export function attachCollegeUnsignedReturn(c:HighSchoolCareer):HighSchoolCareer {
 const {a,r}=current(c),k=c.kboRecruitment?.program,u=c.usRecruitment;
 if(c.phaseContext.phase!=='CAREER_ROUTE'||!a.earlyDraftAttempted||r.returnEventKey||c.events.some(e=>e.status==='OPEN')||k?.signing||u?.program.signing||!(k?.result&&(!k.result.round||k.decision==='DECLINED')||u&&(u.program.decision==='DECLINED'||u.currentWorldDay>=u.program.input.expiresWorldDay||!u.program.offers.length)))throw new RangeError('COLLEGE_UNSIGNED_RETURN_NOT_AVAILABLE');
 const next=structuredClone(c),e=event(next,'E74',k?.result?.receiptKey??u!.program.input.assessmentKey);next.events=[...next.events,e];next.collegeEarlyRoute={...r,returnEventKey:e.eventKey};next.phaseContext={phase:'EVENT_DECISION',eventKey:e.eventKey,resume:{phase:'CAREER_ROUTE'}};return next;
}
export function prepareCollegeUnsignedReturn(c:HighSchoolCareer,revision:number):HighSchoolCareer {assertCollegeCareerRevision(c,revision);const next=attachCollegeUnsignedReturn(c);next.revision++;return next;}
export function returnUnsignedCollegeCareer(c:HighSchoolCareer,revision:number,eventVersion:number):HighSchoolCareer {
 assertCollegeCareerRevision(c,revision);const {a,r}=current(c),p=c.phaseContext,e=c.events.find(e=>e.eventKey===r.returnEventKey);
 if(p.phase!=='EVENT_DECISION'||p.eventKey!==e?.eventKey||!e||e.definitionId!=='E74'||e.evidence.fields.enrollmentId!==a.admissionKey||e.evidence.fields.academicYear!==2||c.kboRecruitment?.program.signing||c.usRecruitment?.program.signing)throw new RangeError('COLLEGE_UNSIGNED_RETURN_NOT_AVAILABLE');
 const resolved=completeBlockingEvent(e,eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['college-unsigned-return',r.receiptKey]),command:'ADVANCE_ACADEMIC_YEAR'},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['ADVANCE_ACADEMIC_YEAR']}),next=structuredClone(c);
 next.events=next.events.map(v=>v.eventKey===e.eventKey?resolved:v);if(next.kboRecruitment){next.previousKboRecruitments=[...(next.previousKboRecruitments??[]),next.kboRecruitment];delete next.kboRecruitment;}if(next.usRecruitment){next.previousUsRecruitments=[...(next.previousUsRecruitments??[]),{...next.usRecruitment,closedBy:'COLLEGE'}];delete next.usRecruitment;}
 next.phaseContext={phase:'OFFSEASON_REVIEW'};next.revision++;return next;
}

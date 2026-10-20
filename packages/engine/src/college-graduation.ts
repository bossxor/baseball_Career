import {overall} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import {assertCollegeYearResult} from './college-result.js';
import {collegeCupSchedule} from './college-cup.js';
import {validateSchoolGrowthDays} from './high-school-growth.js';
import {createWorldEvent,completeBlockingEvent} from './events.js';
import {canonicalJson} from './game.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {draftBaseScore} from './draft.js';
import {kboDraftView} from './kbo-draft.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';

export interface CollegeGraduation {schemaVersion:1;eventKey:string;receiptKey:string;sourceBasis:string}
function basis(source:HighSchoolCareer):string {
 return canonicalJson({world:source.world,admission:source.collegeAdmission,collegeResult:source.collegeResult,collegeCup:source.collegeCup,seasonGrowth:source.seasonGrowth,recordRevision:source.records.revision,health:source.health,development:source.development});
}
/** Internal post-result attachment; the acknowledging command has already advanced its revision once. */
export function attachCollegeGraduationTask(source:HighSchoolCareer):HighSchoolCareer {
 assertCollegeCareerRevision(source,source.revision);const result=assertCollegeYearResult(source),admission=source.collegeAdmission!;
 if(source.phaseContext.phase!=='OFFSEASON_REVIEW' || admission.academicYear!==4 || source.collegeGraduation || source.collegeYearEnd || source.collegeCup?.status!=='COMPLETE' || source.events.some(e=>e.status==='OPEN' || e.definitionId==='E75') || !source.seasonGrowth || source.seasonGrowth.finalized)throw new RangeError('INVALID_COLLEGE_GRADUATION');
 validateSeasonGrowthLedger(source.seasonGrowth);validateSchoolGrowthDays(source,[...source.world.schedule,...collegeCupSchedule(source)]);
 const career=structuredClone(source),event=createWorldEvent({definitionId:'E75',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:'COLLEGE',fields:{playerSimulationKey:source.world.protagonistKey,enrollmentId:admission.admissionKey,academicYear:4,sourceTaskId:result.receiptKey}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'COLLEGE',registrationKey:admission.collegeId,sourceRevision:source.revision},sourceSequence:source.events.length+1,worldDay:source.days.days.at(-1)!.day});
 career.events=[...career.events,event];career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{phase:'CAREER_ROUTE'}};
 career.collegeGraduation={schemaVersion:1,eventKey:event.eventKey,receiptKey:JSON.stringify(['college-graduation',source.world.worldKey,source.world.seasonKey,admission.admissionKey,source.world.protagonistKey]),sourceBasis:basis(career)};return career;
}
/** Compatibility entry for completed M2-Y/Z fourth-year saves that predate automatic E75 attachment. */
export function prepareCollegeGraduation(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);const career=structuredClone(source);career.revision++;return attachCollegeGraduationTask(career);
}
function graduationSource(source:HighSchoolCareer){
 const admission=source.collegeAdmission,graduation=source.collegeGraduation,result=assertCollegeYearResult(source);
 const event=source.events.find(e=>e.eventKey===graduation?.eventKey);
 if(source.world.leagueKey!=='COLLEGE' || !admission || admission.academicYear!==4 || admission.yearsCompleted!==4 || !graduation || graduation.schemaVersion!==1 || graduation.sourceBasis!==basis(source) || graduation.receiptKey!==JSON.stringify(['college-graduation',source.world.worldKey,source.world.seasonKey,admission.admissionKey,source.world.protagonistKey]) || !event || event.definitionId!=='E75' || event.worldKey!==source.world.worldKey || event.seasonKey!==source.world.seasonKey || event.resume.phase!=='CAREER_ROUTE' || event.resume.competitionKey!=='COLLEGE' || event.resume.registrationKey!==admission.collegeId || event.evidence.fields.playerSimulationKey!==source.world.protagonistKey || event.evidence.fields.enrollmentId!==admission.admissionKey || event.evidence.fields.academicYear!==4 || event.evidence.fields.sourceTaskId!==result.receiptKey)throw new RangeError('STALE_COLLEGE_GRADUATION');
 return {admission,graduation,event};
}
/** Degree confirmation closes only E75. The shared world-year growth/training/health remain available to later registration. */
export function graduateCollegeCareer(source:HighSchoolCareer,expectedRevision:number,eventVersion:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);const {admission,graduation,event}=graduationSource(source),phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==event.eventKey || phase.resume.phase!=='CAREER_ROUTE' || source.events.filter(e=>e.status==='OPEN').length!==1)throw new RangeError('INVALID_CAREER_PHASE');
 const resolved=completeBlockingEvent(event,eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:graduation.receiptKey,command:'GRADUATE_COLLEGE'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['GRADUATE_COLLEGE']});
 const career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.collegeAdmission={...admission,status:'GRADUATED'};career.phaseContext={phase:'CAREER_ROUTE'};career.revision++;career.collegeGraduation={...graduation,sourceBasis:basis(career)};return career;
}
/** Public allowlist: no raw P/seed/RNG and no fabricated club slots, draft odds, college re-entry or empty US offer card. */
export function collegeGraduationRouteView(source:HighSchoolCareer){
 const {admission,graduation,event}=graduationSource(source);
 if(source.phaseContext.phase!=='CAREER_ROUTE' || admission.status!=='GRADUATED' || event.status!=='RESOLVED' || event.resolution?.command!=='GRADUATE_COLLEGE' || event.resolution.receiptKey!==graduation.receiptKey)throw new RangeError('INVALID_CAREER_PHASE');
 const evaluation=collegeCareerDraftEvaluation(source);
 if(source.kboRecruitment && (source.kboRecruitment.program.input.baseScore!==evaluation.draftBaseScore || canonicalJson(source.kboRecruitment.program.input.player)!==canonicalJson(source.world.players[source.world.protagonistKey])))throw new RangeError('STALE_CAREER_KBO_EVALUATION');
 return {seasonKey:source.world.seasonKey,collegeId:admission.collegeId,status:'GRADUATED' as const,yearsCompleted:4 as const,...evaluation,kbo:source.kboRecruitment?kboDraftView(source.kboRecruitment.world,source.kboRecruitment.program):{status:'AWAITING_RECRUITMENT' as const}};
}

/** Shared official college evaluation; callers validate the route/task before commands. */
export function collegeCareerDraftEvaluation(source:HighSchoolCareer){
 const player=source.world.players[source.world.protagonistKey]!,totals=recordTotals(source.records,{seasonKey:source.world.seasonKey,leagueKey:'COLLEGE',phase:'REGULAR'}),score=overall(player.kind,player.abilities);
 const raw=player.kind==='HITTER'?recentBattingPerformance(totals.batting[player.simulationKey]??emptyBatting()):recentPitchingPerformance(totals.pitching[player.simulationKey]??emptyPitching()),performanceCollege=Math.max(0,Math.min(100,raw-18)),overallValue=score.sumUnits/score.denominator;
 return {overall:overallValue,overallDisplay:score.display,performanceCollege,draftBaseScore:draftBaseScore(overallValue,performanceCollege)};
}

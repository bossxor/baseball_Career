import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision,assertCollegeCareerRevision} from './high-school-career.js';
import {archiveSchoolSeason,schoolYearEndRepertoire} from './college-entry.js';
import type {SchoolSeasonArchive} from './college-entry.js';
import {settleCollegeLeaveGrowth} from './high-school-growth.js';
import {nextCollegeWorld} from './college-year.js';
import {canonicalJson} from './game.js';
import {createSeasonCalendar} from './season-calendar.js';
import {appearanceFatigue} from './lineup.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {createSchoolDayLedger} from './high-school-day.js';
import {createSchoolEmergencyRegistry} from './high-school-emergency.js';
import {createWorldEvent,completeBlockingEvent} from './events.js';
import {refreshCareerAchievements} from './career-achievements.js';

interface CollegeServiceDate {seasonKey:string;worldDay:number}
export interface CollegeServiceProgram {
 schemaVersion:1;programId:string;kind:'ACTIVE';status:'SERVING'|'COMPLETED'|'RESUMED';admissionKey:string;academicYear:1|2|3|4;yearsCompleted:0|1|2|3|4;
 source:SchoolSeasonArchive;sourceEvidence:string;sourceRecordsBasis:string;sourceWorldDay:number;sourceAge:number;
 completionDays:readonly CollegeServiceDate[];cursor:CollegeServiceDate;closedDays:readonly CollegeServiceDate[];completedBlocks:0|1|2;years:readonly SchoolSeasonArchive[];yearEvidence:readonly string[];resumeEventKey?:string;resumeSeasonKey?:string;
}
const lastDay=(year:number)=>year%4===0&&(year%100!==0||year%400===0)?365:364;
function nextDate(d:CollegeServiceDate):CollegeServiceDate {return d.worldDay===lastDay(Number(d.seasonKey))?{seasonKey:String(Number(d.seasonKey)+1),worldDay:0}:{...d,worldDay:d.worldDay+1};}
function dates(plan:string):readonly CollegeServiceDate[]{const year=Number(plan)+2;return [{seasonKey:String(Number(plan)+1),worldDay:createSeasonCalendar(Number(plan)+1).growthDays.at(-1)!},{seasonKey:String(year),worldDay:lastDay(year)===365?181:180}];}
function sourceEvidence(c:HighSchoolCareer,p:CollegeServiceProgram){
 if(p.schemaVersion!==1||p.kind!=='ACTIVE'||p.programId!==JSON.stringify(['college-active-service',c.world.worldKey,p.source.world.seasonKey,c.world.protagonistKey])||p.source.world.worldKey!==c.world.worldKey||p.source.world.seed!==c.world.seed||p.source.world.protagonistKey!==c.world.protagonistKey||p.sourceEvidence!==canonicalJson(p.source)||p.admissionKey!==c.collegeAdmission?.admissionKey||p.yearsCompleted!==p.academicYear-1||p.sourceAge!==p.source.world.players[c.world.protagonistKey]?.age||canonicalJson(p.completionDays)!==canonicalJson(dates(p.source.world.seasonKey)))throw new RangeError('STALE_COLLEGE_SERVICE_EVIDENCE');
 if(p.years.length!==p.yearEvidence.length||p.years.some((year,i)=>year.world.seasonKey!==String(Number(p.source.world.seasonKey)+i)||canonicalJson(year)!==p.yearEvidence[i]))throw new RangeError('STALE_COLLEGE_SERVICE_YEAR_EVIDENCE');
}
/** Used by the enrollment guard after a sealed leave interval; calendar time is independent of academic progress. */
export function collegeLeaveElapsedYears(c:HighSchoolCareer):number {
 const p=c.collegeService;if(!p)return 0;sourceEvidence(c,p);
 if(p.status!=='RESUMED'||p.completedBlocks!==2||p.resumeSeasonKey!==String(Number(p.source.world.seasonKey)+3)||p.academicYear>c.collegeAdmission!.academicYear||!p.resumeEventKey||!c.events.some(e=>e.eventKey===p.resumeEventKey&&e.definitionId==='E76'&&e.status==='RESOLVED'&&e.resolution?.command==='RESUME_COLLEGE'))throw new RangeError('INVALID_COLLEGE_LEAVE_INTERVAL');
 return Number(p.resumeSeasonKey)-Number(p.source.world.seasonKey);
}
function current(c:HighSchoolCareer,revision:number){
 assertCareerRevision(c,revision);const p=c.collegeService,a=c.collegeAdmission,key=c.world.protagonistKey;
 if(!p||!a||a.status!=='ON_LEAVE'||!['SERVING','COMPLETED'].includes(p.status)||a.academicYear!==p.academicYear||a.yearsCompleted!==p.yearsCompleted)throw new RangeError('COLLEGE_SERVICE_NOT_READY');sourceEvidence(c,p);
 let cursor={seasonKey:p.source.world.seasonKey,worldDay:p.sourceWorldDay},blocks=0;
 for(const d of p.closedDays){cursor=nextDate(cursor);if(canonicalJson(cursor)!==canonicalJson(d))throw new RangeError('CHANGED_COLLEGE_SERVICE_CALENDAR');const due=p.completionDays[blocks];if(due&&canonicalJson(due)===canonicalJson(d))blocks++;}
 if(canonicalJson(cursor)!==canonicalJson(p.cursor)||p.completedBlocks!==blocks||p.status==='COMPLETED'&&blocks!==2||p.cursor.seasonKey!==c.world.seasonKey||c.world.players[key]!.age!==p.sourceAge+Number(c.world.seasonKey)-Number(p.source.world.seasonKey)||p.sourceRecordsBasis!==canonicalJson(c.records))throw new RangeError('CHANGED_COLLEGE_SERVICE_CURSOR_EVIDENCE');
 if(p.status==='SERVING'&&(c.phaseContext.phase!=='SERVICE_PROGRESS'||c.phaseContext.nextWorldDay!==p.cursor.worldDay+1))throw new RangeError('INVALID_COLLEGE_SERVICE_PHASE');
 return p;
}
/** ACTIVE only. SPORTS/ATHLETE require their real admission/benefit owner, never an inferred eligibility flag. */
export function startCollegeMilitaryLeave(c:HighSchoolCareer,revision:number):HighSchoolCareer {
 if(c.national?.militaryStatus&&c.national.militaryStatus!=='UNRESOLVED')throw new RangeError('COLLEGE_MILITARY_ALREADY_RESOLVED');
 assertCollegeCareerRevision(c,revision);const a=c.collegeAdmission!,key=c.world.protagonistKey,p=c.world.players[key]!;
 if(c.collegeService)throw new RangeError('COLLEGE_SERVICE_ALREADY_EXISTS');
 if(a.yearsCompleted!==a.academicYear-1||p.age<19||p.age>27||!['PRESEASON_SETUP','SEASON_PROGRESS'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame!==null||c.events.some(e=>e.status==='OPEN')||c.kboRecruitment||c.usRecruitment||c.collegeYearEnd)throw new RangeError('COLLEGE_INCOMPLETE_YEAR_REQUIRED');
 schoolYearEndRepertoire(c,key);const next=settleCollegeLeaveGrowth(c,revision).career,programId=JSON.stringify(['college-active-service',c.world.worldKey,c.world.seasonKey,key]),source=structuredClone(archiveSchoolSeason(next,programId)),worldDay=c.days.days.at(-1)?.day??Math.min(...c.world.schedule.map(g=>g.worldDay))-1;
 next.collegeService={schemaVersion:1,programId,kind:'ACTIVE',status:'SERVING',admissionKey:a.admissionKey,academicYear:a.academicYear,yearsCompleted:a.yearsCompleted,source,sourceEvidence:canonicalJson(source),sourceRecordsBasis:canonicalJson(c.records),sourceWorldDay:worldDay,sourceAge:p.age,completionDays:dates(c.world.seasonKey),cursor:{seasonKey:c.world.seasonKey,worldDay},closedDays:[],completedBlocks:0,years:[],yearEvidence:[]};
 next.collegeAdmission={...a,status:'ON_LEAVE'};next.phaseContext={phase:'SERVICE_PROGRESS',nextWorldDay:worldDay+1};return next;
}
function newWorldYear(c:HighSchoolCareer){
 const p=c.collegeService!,key=c.world.protagonistKey,closed=finalizeSeasonGrowth(c.world.players[key]!,c.seasonGrowth!,c.world.calendar!.growthDays.length);c.world.players[key]=closed.player;c.seasonGrowth=closed.ledger;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;
 const archive=structuredClone(archiveSchoolSeason(c,JSON.stringify(['college-leave-year',p.programId,c.world.seasonKey])));p.years=[...p.years,archive];p.yearEvidence=[...p.yearEvidence,canonicalJson(archive)];
 c.world=nextCollegeWorld(c);const player=c.world.players[key]!;c.days=createSchoolDayLedger(c.world);c.emergency=createSchoolEmergencyRegistry(c.world);c.seasonGrowth=createSeasonGrowthLedger(player,c.world.seasonKey,c.world.calendar!.growthDays.length);c.development={...c.development!,seasonStartPlayer:structuredClone(player)};c.planHistory=[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}];
 if(c.traits)c.traits={...c.traits,lastClosedDay:null,lastSeasonKey:c.world.seasonKey};
}
/** Bounded real calendar dates. ACTIVE creates no appearance, salary, pitch XP or preparation-budget charge. */
export function advanceCollegeMilitaryService(c:HighSchoolCareer,revision:number,maxDays=31):{career:HighSchoolCareer;stopReason:'CHUNK_LIMIT'|'RETURN_READY'} {
 const p=current(c,revision);if(p.status!=='SERVING')throw new RangeError('COLLEGE_SERVICE_ALREADY_COMPLETE');if(!Number.isSafeInteger(maxDays)||maxDays<1||maxDays>31)throw new RangeError('INVALID_COLLEGE_SERVICE_DAYS');
 const next=structuredClone(c),s=next.collegeService!,key=c.world.protagonistKey;
 for(let i=0;i<maxDays;i++){
  const date=nextDate(s.cursor);if(date.seasonKey!==next.world.seasonKey)newWorldYear(next);next.world.players[key]=appearanceFatigue(next.world.players[key]!,'NONE');s.cursor=date;s.closedDays=[...s.closedDays,date];
  const due=s.completionDays[s.completedBlocks];if(due&&canonicalJson(due)===canonicalJson(date))s.completedBlocks=(s.completedBlocks+1) as 1|2;
  if(s.completedBlocks===2){s.status='COMPLETED';const a=next.collegeAdmission!,event=createWorldEvent({definitionId:'E76',worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,evidence:{version:1,type:'COLLEGE',fields:{playerSimulationKey:key,enrollmentId:a.admissionKey,academicYear:a.academicYear,sourceTaskId:s.programId}},resume:{worldKey:next.world.worldKey,seasonKey:next.world.seasonKey,phase:'PRESEASON_SETUP',competitionKey:'COLLEGE',registrationKey:a.collegeId,sourceRevision:c.revision+1},sourceSequence:next.events.length+1,worldDay:date.worldDay});s.resumeEventKey=event.eventKey;next.events=[...next.events,event];next.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{phase:'PRESEASON_SETUP'}};next.revision++;return {career:refreshCareerAchievements(next),stopReason:'RETURN_READY'};}
 }
 next.phaseContext={phase:'SERVICE_PROGRESS',nextWorldDay:s.cursor.worldDay+1};next.revision++;return {career:next,stopReason:'CHUNK_LIMIT'};
}
/** June30 discharge follows the school window; the next scheduled school season resumes the same incomplete grade. */
export function resumeCollegeAfterService(c:HighSchoolCareer,revision:number,eventVersion:number):HighSchoolCareer {
 const p=current(c,revision),phase=c.phaseContext,event=c.events.find(e=>e.eventKey===p.resumeEventKey),a=c.collegeAdmission!;
 if(p.status!=='COMPLETED'||p.completedBlocks!==2||phase.phase!=='EVENT_DECISION'||phase.eventKey!==event?.eventKey||!event||event.definitionId!=='E76'||event.evidence.fields.enrollmentId!==a.admissionKey||event.evidence.fields.academicYear!==a.academicYear||event.evidence.fields.sourceTaskId!==p.programId)throw new RangeError('COLLEGE_SERVICE_NOT_COMPLETE');
 const resolved=completeBlockingEvent(event,eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['college-service-return',p.programId]),command:'RESUME_COLLEGE'},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:p.cursor.worldDay,eligibleCommands:['RESUME_COLLEGE']}),next=structuredClone(c);newWorldYear(next);
 next.previousSeasons=[...(next.previousSeasons??[]),...next.collegeService!.years];next.events=next.events.map(e=>e.eventKey===event.eventKey?resolved:e);next.collegeAdmission={...a,status:'ENROLLED'};next.collegeService={...next.collegeService!,status:'RESUMED',resumeSeasonKey:next.world.seasonKey};next.phaseContext={phase:'PRESEASON_SETUP'};next.revision++;assertCollegeCareerRevision(next,next.revision);return refreshCareerAchievements(next);
}
export function collegeMilitaryServiceView(c:HighSchoolCareer){
 const p=c.collegeService;if(!p)throw new RangeError('COLLEGE_SERVICE_NOT_READY');if(p.status==='RESUMED')collegeLeaveElapsedYears(c);else current(c,c.revision);
 return {programId:p.programId,kind:p.kind,status:p.status,academicYear:p.academicYear,yearsCompleted:p.yearsCompleted,seasonKey:c.world.seasonKey,age:c.world.players[c.world.protagonistKey]!.age,completedBlocks:p.completedBlocks,scheduledBlocks:2,completionDays:structuredClone(p.completionDays),nextSchoolSeasonKey:String(Number(p.source.world.seasonKey)+3)};
}

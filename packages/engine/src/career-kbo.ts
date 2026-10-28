import {assertKboAmateurYearEnd} from './kbo-entry.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {highSchoolCareerRouteView,highSchoolCareerDraftScore} from './high-school-route.js';
import {collegeGraduationRouteView,collegeCareerDraftEvaluation} from './college-graduation.js';
import {createKboRosterWorld} from './kbo-world.js';
import type {KboRosterWorld} from './kbo-world.js';
import {prepareKboDraft,kboDraftView,resolveKboDraft,decideKboDraft,assertKboDraft} from './kbo-draft.js';
import type {KboDraftProgram} from './kbo-draft.js';
import {canonicalJson} from './game.js';
import {completeBlockingEvent} from './events.js';
import {isCollegeEarlyDraft,collegeEarlyRouteView,attachCollegeEarlyTask} from './college-route.js';
export interface CareerKboRecruitment {schemaVersion:1;world:KboRosterWorld;program:KboDraftProgram;sourceBasis:string}
function basis(source:HighSchoolCareer){return canonicalJson({world:source.world,records:source.records,health:source.health,days:source.days,development:(source.development??null),seasonGrowth:(source.seasonGrowth??null),graduation:(source.graduation??null),// Early signing's own LEFT_FOR_PRO transition is not a change to the assessed source.
 collegeAdmission:(source.collegeAdmission?.status==='LEFT_FOR_PRO'?{...source.collegeAdmission,status:'ENROLLED'}:source.collegeAdmission??null),collegeGraduation:(source.collegeGraduation??null)});}
function route(source:HighSchoolCareer):number {
 if(source.phaseContext.phase!=='CAREER_ROUTE')throw new RangeError('INVALID_CAREER_PHASE');
 if(source.world.leagueKey==='COLLEGE')return (isCollegeEarlyDraft(source)?collegeEarlyRouteView(source):collegeGraduationRouteView(source)).draftBaseScore;
 highSchoolCareerRouteView(source);
 return highSchoolCareerDraftScore(source);
}
function current(source:HighSchoolCareer){
 const seal=source.kboYearEnd?assertKboAmateurYearEnd(source):null;
 const r=source.kboRecruitment;if(!r || r.schemaVersion!==1 || r.sourceBasis!==(seal?.recruitmentSourceBasis??basis(source)) || r.world.worldKey!==source.world.worldKey || r.world.seed!==source.world.seed || r.world.difficulty!==source.difficulty || r.world.seasonKey!==String(source.world.calendar!.year+1) || canonicalJson(r.program.input.player)!==canonicalJson(source.world.players[source.world.protagonistKey]))throw new RangeError('STALE_CAREER_KBO_RECRUITMENT');
 if(r.program.assessmentKey!==JSON.stringify(['amateur-kbo',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey]) || r.program.input.baseScore!==(source.world.leagueKey==='COLLEGE'?collegeCareerDraftEvaluation(source).draftBaseScore:highSchoolCareerDraftScore(source)))throw new RangeError('STALE_CAREER_KBO_EVALUATION');
 assertKboDraft(r.world,r.program);return r;
}
/** The first domestic assessment owns one next-season pro world. Later-year league advancement is separate. */
export function prepareCareerKboDraft(source:HighSchoolCareer,expectedRevision:number,preferredClubId:string|null=null):HighSchoolCareer {
 assertCareerRevision(source,expectedRevision);const score=route(source);
 const assessmentKey=JSON.stringify(['amateur-kbo',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey]);
 if(source.kboRecruitment || source.previousKboRecruitments?.some(r=>r.program.assessmentKey===assessmentKey))throw new RangeError('KBO_ASSESSMENT_ALREADY_EXISTS');
 const world=createKboRosterWorld({worldKey:source.world.worldKey,seasonKey:String(source.world.calendar!.year+1),seed:source.world.seed,difficulty:source.difficulty});
 const program=prepareKboDraft(world,{assessmentKey,player:source.world.players[source.world.protagonistKey]!,baseScore:score,preferredClubId});
 const career=structuredClone(source);career.kboRecruitment={schemaVersion:1,world,program,sourceBasis:basis(source)};career.revision++;return career;
}
export function careerKboDraftView(source:HighSchoolCareer){const r=current(source);return kboDraftView(r.world,r.program);}
export function resolveCareerKboDraft(source:HighSchoolCareer,expectedRevision:number,programVersion:number):HighSchoolCareer {
 assertCareerRevision(source,expectedRevision);route(source);const r=current(source);
 const program=resolveKboDraft(r.world,r.program,programVersion);if(r.program.result)return structuredClone(source);
 const career=structuredClone(source);career.kboRecruitment={...career.kboRecruitment!,program};career.revision++;return isCollegeEarlyDraft(career)&&program.result!.round===null?attachCollegeEarlyTask(career,'E74'):career;
}
/** Contract, rights, next-season roster/salary reservation and route closure are one immutable commit. */
export function decideCareerKboDraft(source:HighSchoolCareer,expectedRevision:number,input:{programVersion:number;decision:'SIGN'|'DECLINE';eventVersion?:number}):HighSchoolCareer {
 assertCareerRevision(source,expectedRevision);route(source);const r=current(source),program=decideKboDraft(r.world,r.program,input.programVersion,input.decision),career=structuredClone(source);
 career.kboRecruitment={...career.kboRecruitment!,program};
 if(input.decision==='SIGN'){
  const receipt=program.signing!;
  if(source.world.leagueKey!=='COLLEGE'){
   const event=source.events.find(e=>e.eventKey===source.graduation!.eventKey)!;
   if(input.eventVersion===undefined)throw new RangeError('EVENT_VERSION_REQUIRED');
   const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:receipt.receiptKey,command:'ACCEPT_CAREER_OFFER'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['ACCEPT_CAREER_OFFER']});career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);
  }else if(source.events.some(e=>e.status==='OPEN'))throw new RangeError('BLOCKING_EVENT_PENDING');
  career.phaseContext={phase:'NEXT_SEASON_READY',route:'KBO',contractKey:receipt.contract.contractKey};
  if(career.usRecruitment){career.previousUsRecruitments=[...(career.previousUsRecruitments??[]),{...career.usRecruitment,closedBy:'KBO'}];delete career.usRecruitment;}
  if(isCollegeEarlyDraft(source))career.collegeAdmission={...career.collegeAdmission!,status:'LEFT_FOR_PRO'};
 }
 career.revision++;return input.decision==='DECLINE'&&isCollegeEarlyDraft(career)?attachCollegeEarlyTask(career,'E74'):career;
}

/** Signed route boundary shared by year-end and future activation commands. */
export function assertCareerKboSigning(source:HighSchoolCareer):CareerKboRecruitment {
 const r=current(source),phase=source.phaseContext;
 if(phase.phase!=='NEXT_SEASON_READY' || phase.route!=='KBO' || r.program.decision!=='SIGNED' || !r.program.signing || phase.contractKey!==r.program.signing.contract.contractKey)throw new RangeError('KBO_SIGNED_CONTRACT_REQUIRED');
 return r;
}

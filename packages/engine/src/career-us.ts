import {assertUsAmateurYearEnd} from './us-entry.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {highSchoolCareerRouteView} from './high-school-route.js';
import {collegeGraduationRouteView,collegeCareerDraftEvaluation} from './college-graduation.js';
import {refreshOwnCareerAssessment} from './high-school-assessment.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {prepareUsDirect,assertUsDirect,usDirectView,decideUsDirect} from './us-direct.js';
import type {UsRecruitmentWorld,UsDirectProgram} from './us-direct.js';
import {canonicalJson} from './game.js';
import {completeBlockingEvent} from './events.js';
import {decideKboDraft} from './kbo-draft.js';
import {createUsReservationLedger,assertUsReservationLedger,reserveUsDirectSigning} from './us-reservations.js';
import type {UsReservationLedger} from './us-reservations.js';
import {collegeEarlyRouteView,attachCollegeUnsignedReturn} from './college-route.js';
import {refreshCareerAchievements} from './career-achievements.js';

export interface CareerUsRecruitment {schemaVersion:1;world:UsRecruitmentWorld;program:UsDirectProgram;sourceBasis:string;currentWorldDay:number;reservations:UsReservationLedger;closedBy?:'COLLEGE'|'KBO'}
function basis(s:HighSchoolCareer):string {return canonicalJson({world:s.world,records:s.records,health:s.health,days:s.days,development:s.development??null,seasonGrowth:s.seasonGrowth??null,graduation:s.graduation??null,collegeAdmission:s.collegeAdmission??null,collegeGraduation:s.collegeGraduation??null,ownAssessment:s.ownAssessment??null});}
function day(s:HighSchoolCareer):number {return s.days.days.at(-1)?.day??0;}
function candidate(s:HighSchoolCareer){
 const p=s.world.players[s.world.protagonistKey]!,totals=recordTotals(s.records,{seasonKey:s.world.seasonKey,leagueKey:'HS',phase:'REGULAR'});
 const adjustedPerformance=s.world.leagueKey==='COLLEGE'?collegeCareerDraftEvaluation(s).performanceCollege:p.kind==='HITTER'?recentBattingPerformance(totals.batting[p.simulationKey]??emptyBatting()):recentPitchingPerformance(totals.pitching[p.simulationKey]??emptyPitching());
 return {player:p,adjustedPerformance,ranges:refreshOwnCareerAssessment(s).ranges};
}
function current(s:HighSchoolCareer):CareerUsRecruitment {
 const seal=s.usYearEnd?assertUsAmateurYearEnd(s):null;const r=s.usRecruitment;
 if(!r || r.schemaVersion!==1 || r.closedBy!==undefined || r.sourceBasis!==(seal?.recruitmentSourceBasis??basis(s)) || r.world.worldKey!==s.world.worldKey || r.world.seed!==s.world.seed || r.world.seasonKey!==String(s.world.calendar!.year+1) || r.program.input.assessmentKey!==JSON.stringify(['amateur-us',s.world.worldKey,s.world.seasonKey,s.world.protagonistKey]) || canonicalJson(r.program.input.player)!==canonicalJson(s.world.players[s.world.protagonistKey]))throw new RangeError('STALE_CAREER_US_RECRUITMENT');
 const expected=candidate(s),input=r.program.input;
 if(!input.eligible || input.issuedWorldDay!==day(s) || input.expiresWorldDay!==input.issuedWorldDay+30 || !Number.isSafeInteger(r.currentWorldDay) || r.currentWorldDay<input.issuedWorldDay || r.currentWorldDay>input.expiresWorldDay || input.adjustedPerformance!==expected.adjustedPerformance || canonicalJson(input.ranges)!==canonicalJson(expected.ranges))throw new RangeError('STALE_CAREER_US_EVALUATION');
 assertUsDirect(r.world,r.program);assertUsReservationLedger(r.reservations);
 if(canonicalJson(r.reservations.initialWorld)!==canonicalJson(r.world) || r.reservations.entries.length!==(r.program.decision==='SIGNED'?1:0) || r.program.decision==='SIGNED' && canonicalJson(r.reservations.entries[0])!==canonicalJson(r.program))throw new RangeError('INVALID_CAREER_US_RESERVATION');
 return r;
}
/** The world worker supplies real open slots/budget; the user-approved deadline is30 game days. */
export function prepareCareerUsDirect(s:HighSchoolCareer,expectedRevision:number,world:UsRecruitmentWorld):HighSchoolCareer {
 assertCareerRevision(s,expectedRevision);if(s.phaseContext.phase!=='CAREER_ROUTE')throw new RangeError('INVALID_CAREER_PHASE');
 if(s.world.leagueKey==='COLLEGE'){if(s.collegeAdmission?.academicYear===2)collegeEarlyRouteView(s);else collegeGraduationRouteView(s);}else highSchoolCareerRouteView(s);
 const assessmentKey=JSON.stringify(['amateur-us',s.world.worldKey,s.world.seasonKey,s.world.protagonistKey]);
 if(s.usRecruitment || s.previousUsRecruitments?.some(r=>r.program.input.assessmentKey===assessmentKey))throw new RangeError('US_ASSESSMENT_ALREADY_EXISTS');
 if(world.worldKey!==s.world.worldKey || world.seed!==s.world.seed || world.seasonKey!==String(s.world.calendar!.year+1))throw new RangeError('INVALID_US_RECRUITMENT_WORLD');
 const program=prepareUsDirect(world,{assessmentKey,...candidate(s),eligible:true,issuedWorldDay:day(s),expiresWorldDay:day(s)+30});
 const next=structuredClone(s);next.usRecruitment={schemaVersion:1,world:structuredClone(world),program,sourceBasis:basis(s),currentWorldDay:day(s),reservations:createUsReservationLedger(world)};next.revision++;return next;
}
export function careerUsDirectView(s:HighSchoolCareer){const r=current(s);return usDirectView(r.world,r.program,r.currentWorldDay);}
/** No games run while comparing graduation routes. Persist elapsed negotiation days; never reroll offers. */
export function advanceCareerUsNegotiation(s:HighSchoolCareer,expectedRevision:number,days:number):HighSchoolCareer {
 assertCareerRevision(s,expectedRevision);if(s.phaseContext.phase!=='CAREER_ROUTE')throw new RangeError('INVALID_CAREER_PHASE');const r=current(s);
 if(r.program.decision!=='PENDING' || !Number.isSafeInteger(days) || days<1 || !Number.isSafeInteger(r.currentWorldDay+days))throw new RangeError('INVALID_US_NEGOTIATION_ADVANCE');
 const target=Math.min(r.program.input.expiresWorldDay,r.currentWorldDay+days);if(target===r.currentWorldDay)return structuredClone(s);
 const next=structuredClone(s);next.usRecruitment!.currentWorldDay=target;next.revision++;return target===r.program.input.expiresWorldDay&&s.collegeAdmission?.academicYear===2&&!s.kboRecruitment?attachCollegeUnsignedReturn(next):next;
}
/** Same revision protects competing domestic/overseas choices. Activation and actual income posting are separate. */
export function decideCareerUsDirect(s:HighSchoolCareer,expectedRevision:number,input:{programVersion:number;decision:{type:'SIGN';offerKey:string}|{type:'DECLINE'};eventVersion?:number}):HighSchoolCareer {
 assertCareerRevision(s,expectedRevision);if(s.phaseContext.phase!=='CAREER_ROUTE')throw new RangeError('INVALID_CAREER_PHASE');
 if(s.world.leagueKey==='COLLEGE'){if(s.collegeAdmission?.academicYear===2)collegeEarlyRouteView(s);else collegeGraduationRouteView(s);}else highSchoolCareerRouteView(s);
 const r=current(s),program=decideUsDirect(r.world,r.program,input.programVersion,r.currentWorldDay,input.decision),next=structuredClone(s);next.usRecruitment={...next.usRecruitment!,program};
 if(input.decision.type==='SIGN'){
  next.usRecruitment!.reservations=reserveUsDirectSigning(r.reservations,program);
  if(s.world.leagueKey!=='COLLEGE'){
   const event=s.events.find(e=>e.eventKey===s.graduation!.eventKey)!;if(input.eventVersion===undefined)throw new RangeError('EVENT_VERSION_REQUIRED');
   const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:program.signing!.receiptKey,command:'ACCEPT_CAREER_OFFER'},{worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['ACCEPT_CAREER_OFFER']});next.events=next.events.map(e=>e.eventKey===event.eventKey?resolved:e);
  }else if(s.events.some(e=>e.status==='OPEN'))throw new RangeError('BLOCKING_EVENT_PENDING');
  if(next.kboRecruitment){const k=next.kboRecruitment;if(k.program.result?.round && k.program.decision==='PENDING')k.program=decideKboDraft(k.world,k.program,k.program.version,'DECLINE');next.previousKboRecruitments=[...(next.previousKboRecruitments??[]),k];delete next.kboRecruitment;}
  next.phaseContext={phase:'NEXT_SEASON_READY',route:'US',contractKey:program.signing!.contract.contractKey};
  if(next.collegeAdmission?.academicYear===2){next.collegeAdmission={...next.collegeAdmission,status:'LEFT_FOR_PRO'};next.usRecruitment={...next.usRecruitment!,sourceBasis:basis(next)};}
 }
 next.revision++;return input.decision.type==='DECLINE'&&next.collegeAdmission?.academicYear===2&&!next.kboRecruitment?attachCollegeUnsignedReturn(next):refreshCareerAchievements(next);
}


export function assertCareerUsSigning(s:HighSchoolCareer):CareerUsRecruitment {
 const r=current(s),p=s.phaseContext;if(p.phase!=='NEXT_SEASON_READY' || p.route!=='US' || r.program.decision!=='SIGNED' || !r.program.signing || p.contractKey!==r.program.signing.contract.contractKey)throw new RangeError('US_SIGNED_CONTRACT_REQUIRED');return r;
}

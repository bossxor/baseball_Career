import type {HighSchoolCareer,HighSchoolCareerPhase} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {highSchoolCareerRouteView} from './high-school-route.js';
import {collegeGraduationRouteView} from './college-graduation.js';
import {collegeEarlyRouteView,assertCollegeUnsignedReturn} from './college-route.js';
import {assertCareerPreparation} from './career-preparation.js';
import {assertCollegeNationalState} from './college-national.js';
import {assertKboDraft} from './kbo-draft.js';
import {assertUsDirect} from './us-direct.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,cancelInvalidEvent,validateEvent,resolveEventChoice} from './events.js';
import type {EventInstance} from './events.js';

export interface AmateurRetirement {
 version:1;status:'PENDING'|'CANCELLED'|'ARCHIVED';eventKey:string;taskKey:string;
 sourceBasis:string;resume:HighSchoolCareerPhase;sourceEvents:readonly EventInstance[];receiptKey?:string;
}
const same=(a:unknown,b:unknown)=>canonicalJson(a)===canonicalJson(b);
function basis(c:HighSchoolCareer){
 return canonicalJson({world:c.world,records:c.records,health:c.health,days:c.days,development:c.development??null,seasonGrowth:c.seasonGrowth??null,
  traits:c.traits?{...c.traits,summaryCursor:0}:null,relationships:c.relationships??null,styleUsedWindows:c.styleUsedWindows,planHistory:c.planHistory,
  graduation:c.graduation??null,collegeAdmission:c.collegeAdmission??null,collegeResult:c.collegeResult??null,collegeCup:c.collegeCup??null,
  collegeGraduation:c.collegeGraduation??null,collegeEarlyRoute:c.collegeEarlyRoute??null,collegeService:c.collegeService??null,national:c.national??null,
  retryCareer:c.retryCareer??null,preparation:c.preparation??null,kboRecruitment:c.kboRecruitment??null,usRecruitment:c.usRecruitment??null,events:c.events,phase:c.phaseContext});
}
/** Only completed amateur routes are safe; future offers never force another season. */
function safeRoute(c:HighSchoolCareer){
 assertCareerRevision(c,c.revision);
 if('protagonistClubId'in c||'mode'in c||!c.world?.protagonistKey||!['CAREER_ROUTE','EVENT_DECISION'].includes(c.phaseContext.phase)
  ||c.kboRecruitment?.program.signing||c.usRecruitment?.program.signing||c.kboYearEnd||c.usYearEnd
  ||c.collegeService&&c.collegeService.status!=='RESUMED')throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');
 let allowedOpen:string|null=null;
 if(c.phaseContext.phase==='EVENT_DECISION'){allowedOpen=assertCollegeUnsignedReturn(c).eventKey;}
 else if(c.world.leagueKey==='INDEPENDENT'){
  assertCareerPreparation(c);if(c.preparationSeason?.phase!=='PREPARATION_RESULT')throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');
 }else if(c.world.leagueKey==='COLLEGE'){
  if(c.collegeAdmission?.status==='GRADUATED')collegeGraduationRouteView(c);else collegeEarlyRouteView(c);
 }else if(c.world.leagueKey===undefined){highSchoolCareerRouteView(c);allowedOpen=c.graduation!.eventKey;}
 else throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');
 if(c.events.some(e=>e.status==='OPEN'&&e.eventKey!==allowedOpen))throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');
 if(c.kboRecruitment)assertKboDraft(c.kboRecruitment.world,c.kboRecruitment.program);
 if(c.usRecruitment)assertUsDirect(c.usRecruitment.world,c.usRecruitment.program);
 if(c.national)assertCollegeNationalState(c);
}
function context(e:EventInstance){return {worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices};}
function makeEvent(c:HighSchoolCareer,id:'E36'|'E37',taskKey:string,sourceRevision:number){
 const day=c.days.days.at(-1)?.day;if(day===undefined)throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');
 return createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition(id).evidenceDomain,fields:{playerSimulationKey:c.world.protagonistKey,retirementTaskOrReceiptId:taskKey}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:id==='E37'?'ARCHIVED':'CAREER_ROUTE',competitionKey:c.world.leagueKey??'HS',registrationKey:c.world.protagonistSchoolId,sourceRevision},sourceSequence:c.events.length+1,worldDay:day});
}
function checked(c:HighSchoolCareer,status:'PENDING'|'ARCHIVED'){
 const r=c.amateurRetirement,e=c.events.find(e=>e.eventKey===r?.eventKey);
 if(!r||r.version!==1||r.status!==status||!e||e.definitionId!=='E36')throw new RangeError('AMATEUR_RETIREMENT_NOT_PENDING');validateEvent(e);
 if(e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.playerSimulationKey!==c.world.protagonistKey||e.evidence.fields.retirementTaskOrReceiptId!==r.taskKey
  ||r.taskKey!==JSON.stringify(['amateur-retirement',e.worldKey,e.seasonKey,c.world.protagonistKey,e.resume.sourceRevision])
  ||e.sourceSequence!==r.sourceEvents.length+1||e.resume.sourceRevision>c.revision)throw new RangeError('AMATEUR_RETIREMENT_SOURCE_CHANGED');
 const original={...c,phaseContext:r.resume,events:r.sourceEvents};
 if(basis(original)!==r.sourceBasis)throw new RangeError('AMATEUR_RETIREMENT_SOURCE_CHANGED');safeRoute(original);
 const prefix=status==='PENDING'?r.sourceEvents:r.sourceEvents.map(e=>e.status==='OPEN'?cancelInvalidEvent(e,e.version,'AMATEUR_RETIRED',context(e)):e);
 if(!same(c.events.slice(0,prefix.length),prefix))throw new RangeError('AMATEUR_RETIREMENT_SOURCE_CHANGED');
 if(status==='PENDING'&&(c.phaseContext.phase!=='EVENT_DECISION'||c.phaseContext.eventKey!==e.eventKey||e.status!=='OPEN'||c.events.length!==prefix.length+1))throw new RangeError('AMATEUR_RETIREMENT_NOT_PENDING');
 if(status==='ARCHIVED'&&(c.phaseContext.phase!=='ARCHIVED'||r.receiptKey!==JSON.stringify(['amateur-retired',r.taskKey])||e.status!=='RESOLVED'||e.resolution?.command!=='CONFIRM_RETIRE'||e.resolution.receiptKey!==r.receiptKey))throw new RangeError('AMATEUR_RETIREMENT_SOURCE_CHANGED');
 return {r,e};
}
export function requestAmateurRetirement(source:HighSchoolCareer,revision:number,input?:{eventKey:string;eventVersion:number}):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.amateurRetirement?.status==='PENDING'||source.amateurRetirement?.status==='ARCHIVED')throw new RangeError('AMATEUR_RETIREMENT_NOT_AVAILABLE');safeRoute(source);
 if(source.phaseContext.phase==='EVENT_DECISION'){
  const e=assertCollegeUnsignedReturn(source);if(!input||input.eventKey!==e.eventKey||input.eventVersion!==e.version)throw new RangeError('AMATEUR_RETIREMENT_EVENT_VERSION_CHANGED');
 }
 const taskKey=JSON.stringify(['amateur-retirement',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey,revision+1]),e=makeEvent(source,'E36',taskKey,revision+1),c=structuredClone(source);
 c.amateurRetirement={version:1,status:'PENDING',eventKey:e.eventKey,taskKey,sourceBasis:basis(source),resume:structuredClone(source.phaseContext),sourceEvents:structuredClone(source.events)};
 c.events=[...c.events,e];c.phaseContext={phase:'EVENT_DECISION',eventKey:e.eventKey,resume:{phase:'CAREER_ROUTE'}};c.revision++;return c;
}
export function resolveAmateurRetirement(source:HighSchoolCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}):HighSchoolCareer {
 assertCareerRevision(source,revision);const {r,e}=checked(source,'PENDING');if(input.eventKey!==e.eventKey||!['CONFIRM_RETIRE','CANCEL_RETIRE'].includes(input.command))throw new RangeError('AMATEUR_RETIREMENT_EVENT_CHANGED');
 const receiptKey=JSON.stringify([input.command==='CONFIRM_RETIRE'?'amateur-retired':'amateur-retirement-cancelled',r.taskKey]),resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey,command:input.command},context(e)),c=structuredClone(source);
 c.events=c.events.map(event=>event.eventKey===e.eventKey?resolved:input.command==='CONFIRM_RETIRE'&&event.status==='OPEN'?cancelInvalidEvent(event,event.version,'AMATEUR_RETIRED',context(event)):event);c.revision++;
 c.amateurRetirement={...c.amateurRetirement!,status:input.command==='CONFIRM_RETIRE'?'ARCHIVED':'CANCELLED',receiptKey};c.phaseContext=input.command==='CONFIRM_RETIRE'?{phase:'ARCHIVED'}:structuredClone(r.resume);
 if(input.command==='CONFIRM_RETIRE')c.events=[...c.events,makeEvent(c,'E37',receiptKey,c.revision)];return c;
}
export function amateurRetirementView(c:HighSchoolCareer){
 assertCareerRevision(c,c.revision);const status=c.amateurRetirement?.status;if(status!=='PENDING'&&status!=='ARCHIVED')throw new RangeError('AMATEUR_RETIREMENT_NOT_PENDING');const {r,e}=checked(c,status),key=c.world.protagonistKey,p=c.world.players[key]!;
 const professionalAppearances={PA:0,outs:0};for(const g of Object.values(c.records.games))if(['KBO','FUTURES','ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey)){professionalAppearances.PA+=g.batting[key]?.PA??0;professionalAppearances.outs+=g.pitching[key]?.outs??0;}
 const shown=status==='ARCHIVED'?farewell(c):e;
 return {status,player:{simulationKey:key,name:p.name,age:p.age,kind:p.kind,position:p.position},professionalAppearances,militaryStatus:c.collegeService?.status==='RESUMED'?'COMPLETED':c.national?.militaryStatus??'UNRESOLVED',receiptKey:r.receiptKey??null,eventKey:shown.eventKey,eventVersion:shown.version,commands:shown.status!=='OPEN'?[]:status==='PENDING'?['CONFIRM_RETIRE','CANCEL_RETIRE']:['OPEN_ARCHIVE']};
}
function farewell(c:HighSchoolCareer){
 const r=c.amateurRetirement!,e=c.events.at(-1);if(!e||c.events.length!==r.sourceEvents.length+2)throw new RangeError('AMATEUR_RETIREMENT_FAREWELL_CHANGED');validateEvent(e);
 if(e.definitionId!=='E37'||e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.playerSimulationKey!==c.world.protagonistKey||e.evidence.fields.retirementTaskOrReceiptId!==r.receiptKey||e.resume.phase!=='ARCHIVED')throw new RangeError('AMATEUR_RETIREMENT_FAREWELL_CHANGED');return e;
}
export function openAmateurArchive(c:HighSchoolCareer,revision:number,input:{eventKey:string;eventVersion:number}){
 assertCareerRevision(c,revision);checked(c,'ARCHIVED');const e=farewell(c);if(input.eventKey!==e.eventKey)throw new RangeError('AMATEUR_RETIREMENT_EVENT_CHANGED');
 const result=resolveEventChoice(e,input.eventVersion,'OPEN_ARCHIVE',null,context(e));
 return {career:{...c,revision:c.revision+1,events:c.events.map(x=>x.eventKey===e.eventKey?result.event:x)},navigation:result.navigation};
}

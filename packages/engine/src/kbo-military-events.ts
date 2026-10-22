import {resumeKboContractPayments} from './kbo-contract-payments.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboMilitaryProgram} from './kbo-military-program.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import {completeSangmuBlock} from './kbo-military-program.js';
import {createSeasonCalendar} from './season-calendar.js';
import {assertCareerRevision} from './high-school-career.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,completeEventDomain} from './events.js';
import {setKboPreseasonFocus} from './kbo-preseason.js';
import {canonicalJson} from './game.js';

/** 14 U: second season June30, independent of match count or international breaks. New programs opt in. */
export function kboMilitaryCompletionDays(program:KboMilitaryProgram):readonly {seasonKey:string;worldDay:number}[]{
 if(program.blocks.length!==2)throw new RangeError('INVALID_SERVICE_CALENDAR');
 const first=program.blocks[0]!.seasonKey,second=program.blocks[1]!.seasonKey,y=Number(second);
 if(Number(second)!==Number(first)+1)throw new RangeError('INVALID_SERVICE_CALENDAR');
 const leap=y%4===0 && (y%100!==0 || y%400===0);
 return [{seasonKey:first,worldDay:createSeasonCalendar(Number(first)).growthDays.at(-1)!},{seasonKey:second,worldDay:leap?181:180}];
}
function serviceEvent(career:KboCareer,id:'E52'|'E53',day:number,phase:'PRESEASON_SETUP'|'SEASON_PROGRESS'){
 const program=career.military!.program!,stage=id==='E52'?'FIRST_BLOCK':'RETURN',definition=eventDefinition(id);
 return createWorldEvent({definitionId:id,worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:career.protagonistKey,serviceTaskIdOrServicePeriodId:program.programId,stage}},resume:{worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,phase,competitionKey:'FUTURES',registrationKey:career.protagonistClubId,sourceRevision:phase==='PRESEASON_SETUP'?career.revision:career.revision+1},sourceSequence:career.events.length+1,worldDay:day});
}
/** Internal transition hook, caller owns the clone. Old unscheduled saves do not acquire events on a read. */
export function queueKboMilitaryFirstBlock(career:KboCareer):void {
 const record=career.military,program=record?.program;
 if(record?.status!=='SERVING_SPORTS' || !record.completionDays || !program || program.blocks[0]!.seasonKey!==career.world.seasonKey || career.phaseContext.phase!=='PRESEASON_SETUP')return;
 if(career.events.some(e=>e.definitionId==='E52' && e.evidence.fields.serviceTaskIdOrServicePeriodId===program.programId))return;
 career.events=[...career.events,serviceEvent(career,'E52',career.world.calendar.growthDays[0]!,'PRESEASON_SETUP')];
}
/** Internal post-day-close hook. Return happens AFTER this day's games, before any following day's registration. */
export function closeKboMilitaryCalendarDay(career:KboCareer,day:number,progress:KboSeasonProgress):boolean {
 const record=career.military;
 if(record?.status!=='SERVING_SPORTS' || !record.program || !record.completionDays)return false;
 if(canonicalJson(record.completionDays)!==canonicalJson(kboMilitaryCompletionDays(record.program)))throw new RangeError('INVALID_SERVICE_CALENDAR');
 const season=career.world.seasonKey,open=record.program.blocks.find(b=>b.seasonKey===season && b.completedWorldDay===null);
 if(!open)return false;
 const due=record.completionDays.find(d=>d.seasonKey===season);if(!due)throw new RangeError('INVALID_SERVICE_CALENDAR');
 if(day<due.worldDay)return false;
 if(day!==due.worldDay || career.days?.days.at(-1)?.day!==day || career.phaseContext.phase!=='SEASON_PROGRESS' || career.phaseContext.nextWorldDay!==day+1 || progress.nextWorldDay!==day+1 || progress.pendingGame)throw new RangeError('MILITARY_COMPLETION_DAY_MISSED');
 record.program=completeSangmuBlock(record.program,season,day);
 if(record.program.completedBlocks<record.program.scheduledBlocks)return false;
 const club=career.world.clubs.find(c=>c.id===record.program!.originalClubId);
 if(!club || club.id!==career.protagonistClubId || !club.roster.includes(career.protagonistKey) || club.firstTeam.includes(career.protagonistKey))throw new RangeError('MILITARY_RETURN_SLOT_REQUIRED');
 const contract=career.world.contracts[career.protagonistKey]!;if(contract.servicePay)contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,record.program);
 record.status='COMPLETED';record.completedSeasonKey=season;
 if(career.sangmu)career.sangmu={...career.sangmu,loaned:(career.sangmu.loaned??[]).filter(k=>k!==career.protagonistKey)};
 career.registration={...career.registration,firstTeam:false,competitionKey:'FUTURES'};
 const event=serviceEvent(career,'E53',day,'SEASON_PROGRESS');career.events=[...career.events,event];
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(progress)};return true;
}
/** E52 confirms four focus choices or keeps them; E53 confirms the actually restored original club/Futures slot. */
export function resolveKboMilitaryEvent(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string;focus?:readonly string[]}):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const event=source.events.find(e=>e.eventKey===input.eventKey),record=source.military,program=record?.program;
 if(!event || !['E52','E53'].includes(event.definitionId) || !program || event.worldKey!==source.world.worldKey || event.seasonKey!==source.world.seasonKey || canonicalJson(event.evidence.fields)!==canonicalJson({playerSimulationKey:source.protagonistKey,serviceTaskIdOrServicePeriodId:program.programId,stage:event.definitionId==='E52'?'FIRST_BLOCK':'RETURN'}))throw new RangeError('INVALID_KBO_MILITARY_EVENT');
 if(event.definitionId==='E52'){
  if(source.phaseContext.phase!=='PRESEASON_SETUP' || source.preseasonPlan || record?.status!=='SERVING_SPORTS' || program.blocks[0]!.seasonKey!==source.world.seasonKey)throw new RangeError('KBO_MILITARY_NOT_AVAILABLE');
 }else{
  const phase=source.phaseContext,club=source.world.clubs.find(c=>c.id===source.protagonistClubId);
  if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==event.eventKey || record?.status!=='COMPLETED' || !club?.roster.includes(source.protagonistKey) || club.firstTeam.includes(source.protagonistKey) || source.sangmu?.loaned?.includes(source.protagonistKey) || source.rights.holderOrgId!==club.id)throw new RangeError('MILITARY_RETURN_SLOT_REQUIRED');
 }
 if(input.command!=='CHOOSE_FOCUS' && input.focus!==undefined)throw new RangeError('UNEXPECTED_FOCUS');
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:eventDefinition(event.definitionId).choices.map(c=>c.command)};
 const chosen=resolveEventChoice(event,input.eventVersion,input.command,input.focus?{focus:[...input.focus]}:null,context);
 if(!chosen.domain)throw new RangeError('INVALID_KBO_MILITARY_EVENT');
 const resolved=completeEventDomain(event,chosen.domain,JSON.stringify(['kbo-military-event',program.programId,event.definitionId,input.command]),context);
 let career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);
 if(input.command==='CHOOSE_FOCUS'){
  if(!input.focus)throw new RangeError('FOCUS_REQUIRED');career=setKboPreseasonFocus(career,career.revision,input.focus);
 }else career.revision++;
 if(event.definitionId==='E53')career.phaseContext=structuredClone((source.phaseContext as {phase:'EVENT_DECISION';eventKey:string;resume:KboSeasonProgress}).resume);
 return career;
}
export function kboMilitaryEventView(source:KboCareer){
 const program=source.military?.program;
 return source.events.filter(e=>e.status==='OPEN' && ['E52','E53'].includes(e.definitionId) && e.seasonKey===source.world.seasonKey && e.evidence.fields.serviceTaskIdOrServicePeriodId===program?.programId).map(e=>{const d=eventDefinition(e.definitionId);return {eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:d.title,body:d.body,choices:d.choices.map(c=>({command:c.command,label:c.label})),...(e.definitionId==='E52'?{focus:[...source.world.players[source.protagonistKey]!.focus]}:{})};});
}

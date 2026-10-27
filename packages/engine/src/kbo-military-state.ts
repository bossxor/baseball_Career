import type {KboReturnCondition} from './kbo-return-condition.js';
import {kboMilitaryCompletionDays} from './kbo-military-events.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {selectSangmuCohort,KBO_SANGMU_INTAKE} from './kbo-sangmu.js';
import {enlistInSangmu,completeSangmuBlock,KBO_CONTRACT_GAME_DAYS} from './kbo-military-program.js';
import type {KboMilitaryProgram} from './kbo-military-program.js';
import {emptySangmuUnit} from './kbo-sangmu-unit.js';
import {acceptedRenewal} from './kbo-renewal.js';
import {createWorldEvent,completeBlockingEvent,eventDefinition} from './events.js';

/** SPORTS and ACTIVE use fixed service-calendar blocks, retained original rights and suspended game-day pay. ATHLETE service remains a separate future path. */
export type KboMilitaryStatus='NOT_APPLICABLE'|'UNRESOLVED'|'APPLICATION_PENDING'|'SERVING_SPORTS'|'SERVING_ACTIVE'|'ATHLETE_ELIGIBLE'|'ATHLETE_SERVICE'|'COMPLETED';
export interface KboSangmuApplication {
 applicationId:string;eventKey:string;selectionSeasonKey:string;score:number;accepted:boolean;slotKind:'HITTER'|'PITCHER';
 decision:'PENDING'|'ENLISTED'|'DECLINED'|'REJECTION_ACKNOWLEDGED';
}
export interface KboMilitaryRecord {status:KboMilitaryStatus;applications:readonly KboSangmuApplication[];program?:KboMilitaryProgram;completedSeasonKey?:string;contractPaymentVersion?:1;completionDays?:readonly {seasonKey:string;worldDay:number}[];growthPolicyVersion?:1;returnCondition?:KboReturnCondition}
export const KBO_MILITARY_DEADLINE_AGE=28;

export const kboMilitaryStatus=(s:Pick<KboCareer,'military'>):KboMilitaryStatus=>s.military?.status??'UNRESOLVED';
/** True during SPORTS or ACTIVE; only SPORTS creates a military-team loan. */
export const kboProtagonistServing=(s:Pick<KboCareer,'military'>)=>s.military?.status==='SERVING_SPORTS' || s.military?.status==='SERVING_ACTIVE';

/** S26 read: where my player stands against the game deadline. Age window 19..27 is the application window. */
export function kboMilitaryPlan(s:KboCareer){
 const age=s.world.players[s.protagonistKey]!.age,status=kboMilitaryStatus(s);
 return {status,age,deadlineAge:28,futureGraceSeasons:Math.max(0,27-age),notice:status!=='UNRESOLVED'?null:age>=28&&age<45?'OVERDUE_PLAN':age===27?'FINAL_GRACE':age===25||age===26?'PLAN_REMINDER':null,canPlanActive:status==='UNRESOLVED'&&age>=19&&age<45,canApply:status==='UNRESOLVED' && age>=KBO_SANGMU_INTAKE.minAge && age<=KBO_SANGMU_INTAKE.maxAge,lastGraceSeason:status==='UNRESOLVED' && age===KBO_SANGMU_INTAKE.maxAge,
  mustResolveBeforeNextSeason:status==='UNRESOLVED' && age<45 && age+1>=KBO_MILITARY_DEADLINE_AGE,application:s.military?.applications.at(-1)??null,program:s.military?.program??null};
}
export function remainingKboMilitaryContractDays(s:KboCareer):number {
 const renewal=acceptedRenewal(s);if(renewal)return renewal.years*KBO_CONTRACT_GAME_DAYS;
 const c=s.world.contracts[s.protagonistKey]!;return Math.max(0,Number(c.seasonKey)+c.years-1-Number(s.world.seasonKey))*KBO_CONTRACT_GAME_DAYS;
}
function offseason(s:KboCareer){if(s.phaseContext.phase!=='SEASON_REVIEW' || s.seasonClose?.seasonKey!==s.world.seasonKey)throw new RangeError('KBO_MILITARY_NOT_AVAILABLE');}

/** One application per yearly recruitment. The result is fixed now from the same snapshot the cohort uses (my player
 * competes with the NPCs); a retry returns the same application, never a second roll. */
export function applyToSangmu(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);offseason(source);
 const plan=kboMilitaryPlan(source),season=source.world.seasonKey,id=JSON.stringify(['sangmu-application',source.world.worldKey,season,source.protagonistKey]);
 const existing=source.military?.applications.find(a=>a.applicationId===id);
 if(existing)return structuredClone(source);
 if(!plan.canApply || Object.hasOwn(source.health.injuries,source.protagonistKey) || source.events.some(e=>e.status==='OPEN'&&e.definitionId!=='E30'))throw new RangeError('KBO_MILITARY_NOT_AVAILABLE');
 const selection=selectSangmuCohort({world:source.world,records:source.records,health:source.health,seasonKey:season,serving:new Set(Object.keys(source.sangmu?.members??{}))});
 const me=selection.selected.find(a=>a.playerKey===source.protagonistKey),kind=source.world.players[source.protagonistKey]!.kind;
 // E50 (상무 선발 발표) is blocking until the result is confirmed by the domain command below.
 const definition=eventDefinition('E50'),event=createWorldEvent({definitionId:'E50',worldKey:source.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:source.protagonistKey,serviceTaskIdOrServicePeriodId:id,stage:'RESULT'}},
  resume:{worldKey:source.world.worldKey,seasonKey:season,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:source.days!.days.at(-1)!.day});
 const career=structuredClone(source);career.events=[...career.events,event];
 career.military={status:'APPLICATION_PENDING',applications:[...(source.military?.applications??[]),{applicationId:id,eventKey:event.eventKey,selectionSeasonKey:season,score:me?.score??0,accepted:!!me,slotKind:kind,decision:'PENDING'}]};
 career.revision++;return career;
}
/** Accepted: ENLIST (SERVING_SPORTS, the two blocks start next season) or DECLINE. Rejected: only ACK_REJECTION. Both
 * non-enlisting answers go back to UNRESOLVED and burn this recruitment. Enlistment needs the contract question answered first. */
export function resolveSangmuApplication(source:KboCareer,expectedRevision:number,command:'ENLIST'|'DECLINE'|'ACK_REJECTION'):KboCareer {
 assertCareerRevision(source,expectedRevision);offseason(source);
 const record=source.military,app=record?.applications.at(-1);
 if(!record || record.status!=='APPLICATION_PENDING' || !app || app.decision!=='PENDING')throw new RangeError('KBO_MILITARY_NOT_AVAILABLE');
 const allowed=app.accepted?['ENLIST','DECLINE']:['ACK_REJECTION'];
 if(!allowed.includes(command))throw new RangeError('INVALID_MILITARY_COMMAND');
 const event=source.events.find(e=>e.eventKey===app.eventKey);if(!event || event.status!=='OPEN')throw new RangeError('KBO_MILITARY_NOT_AVAILABLE');
 const career=structuredClone(source),set=(decision:KboSangmuApplication['decision'])=>career.military!.applications=record.applications.map((a,i)=>i===record.applications.length-1?{...a,decision}:a);
 if(command==='ENLIST'){
  const days=remainingKboMilitaryContractDays(source);if(days===0)throw new RangeError('CONTRACT_DECISION_REQUIRED');
  const renewal=acceptedRenewal(source),current=source.world.contracts[source.protagonistKey]!;
  const contract=renewal?{...current,contractKey:renewal.offerKey,clubId:renewal.clubId,seasonKey:renewal.seasonKey,years:renewal.years,annualSalaryWon:renewal.annualSalaryWon}:current;
  const program=enlistInSangmu({worldKey:source.world.worldKey,playerKey:source.protagonistKey,clubId:contract.clubId,selectionSeasonKey:app.selectionSeasonKey,contract,remainingPaidGameDays:days});
  set('ENLISTED');career.military!.status='SERVING_SPORTS';career.military!.program=program;career.military!.completionDays=kboMilitaryCompletionDays(program);career.military!.contractPaymentVersion=1;career.military!.growthPolicyVersion=1;
  const unit=career.sangmu??emptySangmuUnit();career.sangmu={...unit,loaned:[...(unit.loaned??[]),source.protagonistKey]};
 } else {set(command==='DECLINE'?'DECLINED':'REJECTION_ACKNOWLEDGED');career.military!.status='UNRESOLVED';}
 const closed=completeBlockingEvent(event,event.version,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['sangmu-result-confirmed',app.applicationId,command]),command:'CONFIRM_MILITARY_RESULT'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['CONFIRM_MILITARY_RESULT']});
 career.events=career.events.map(e=>e.eventKey===event.eventKey?closed:e);
 career.revision++;return career;
}
/** Year-transition step for my player: the block of the season just played is closed on its last day; after the second block
 * the program is COMPLETED and he leaves the loan. Mutates the caller's clone. */
export function advanceKboMilitaryService(career:KboCareer,playedSeasonKey:string,lastDay:number):void {
 const record=career.military;if(!record || !['SERVING_SPORTS','SERVING_ACTIVE'].includes(record.status) || !record.program)return;
 const open=record.program.blocks.find(b=>b.seasonKey===playedSeasonKey && b.completedWorldDay===null);
 if(open && record.completionDays)throw new RangeError('MILITARY_DAY_NOT_SETTLED');
 if(open)record.program=completeSangmuBlock(record.program,playedSeasonKey,lastDay);
 if(record.program.completedBlocks>=record.program.scheduledBlocks){
  record.status='COMPLETED';record.completedSeasonKey=playedSeasonKey;
  if(career.sangmu)career.sangmu={...career.sangmu,loaned:(career.sangmu.loaned??[]).filter(k=>k!==career.protagonistKey)};
 }
}

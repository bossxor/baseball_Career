import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsLevel} from './us-world.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {createSeasonCalendar} from './season-calendar.js';
import {canonicalJson} from './game.js';

export type UsMilitaryStatus='UNRESOLVED'|'FROZEN_SERVICE'|'TERMINATED_SERVICE'|'COMPLETED'|'NOT_APPLICABLE';
export type UsMilitaryPlanChoice='FREEZE'|'TERMINATE';
export type UsMilitaryServiceBlockKind='FULL_DOMESTIC_SEASON'|'FIRST_HALF_SEASON';
export interface UsMilitaryServiceBlock {seasonKey:string;kind:UsMilitaryServiceBlockKind;completedWorldDay:number|null}
/** Same 18 game-month calendar as domestic service: next full season, then June 30 of the season after (14 U). */
export interface UsMilitaryServiceProgram {
 programId:string;planSeasonKey:string;scheduledBlocks:2;blocks:readonly UsMilitaryServiceBlock[];completedBlocks:number;
 completionDays:readonly {seasonKey:string;worldDay:number}[];
}

const LEVELS:readonly UsLevel[]=['ROOKIE','A','AA','AAA','MLB'];

function assertMilitaryRevision(c:UsCareer,revision:number):void {
 if(!Number.isSafeInteger(revision)||!Number.isSafeInteger(c.revision)||revision!==c.revision||c.revision<1)throw new RangeError('STALE_US_CAREER_REVISION');
}
function gate(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const ready=usYearTransitionReadiness(c);
 if(!ready.blockers.includes('MILITARY_PLAN_REQUIRED')||c.military.status!=='UNRESOLVED')throw new RangeError('US_MILITARY_PLAN_NOT_REQUIRED');
 return ready;
}

function legalAfterRemove(next:UsCareer,orgId:string,level:UsLevel,removeKey:string):boolean {
 const org=next.world.organizations.find(o=>o.id===orgId)!,keys=org.levels[level].filter(k=>k!==removeKey);
 if(level==='MLB')return keys.length===26;
 const hitters=keys.filter(k=>next.world.players[k]!.kind==='HITTER').length,pitchers=keys.filter(k=>next.world.players[k]!.kind==='PITCHER').length;
 return hitters>=12&&pitchers>=10;
}

/** Move protagonist to reserves and keep every live level size legal. */
function parkForTerminate(next:UsCareer,key:string):void {
 const org=next.world.organizations.find(o=>o.id===next.protagonistOrganizationId)!,level=next.registration.level,kind=next.world.players[key]!.kind;
 next.world.reserves??={};
 let fill=(next.world.reserves[org.id]??[]).filter(k=>k!==key&&next.world.players[k]!.kind===kind).sort()[0];
 if(fill)next.world.reserves[org.id]=(next.world.reserves[org.id]??[]).filter(k=>k!==fill);
 else{
  const idx=LEVELS.indexOf(level);
  for(let i=idx-1;i>=0;i--){const donor=LEVELS[i]!;
   const cand=org.levels[donor].filter(k=>k!==key&&next.world.players[k]!.kind===kind&&legalAfterRemove(next,org.id,donor,k)).sort()[0];
   if(!cand)continue;org.levels[donor]=org.levels[donor].filter(k=>k!==cand);fill=cand;break;}
 }
 if(!fill)throw new RangeError('US_MILITARY_TERMINATE_NO_REPLACEMENT');
 org.levels[level]=org.levels[level].map(k=>k===key?fill!:k).sort();
 next.world.reserves[org.id]=[...(next.world.reserves[org.id]??[]).filter(k=>k!==key),key].sort();
 next.registration={...next.registration,status:'INJURED'};
}

export function usMilitaryCompletionDays(planSeasonKey:string):readonly {seasonKey:string;worldDay:number}[] {
 if(!/^\d{4}$/.test(planSeasonKey))throw new RangeError('INVALID_US_MILITARY_CALENDAR');
 const first=String(Number(planSeasonKey)+1),second=String(Number(planSeasonKey)+2),y=Number(second);
 const leap=y%4===0&&(y%100!==0||y%400===0);
 return [{seasonKey:first,worldDay:createSeasonCalendar(Number(first)).growthDays.at(-1)!},{seasonKey:second,worldDay:leap?181:180}];
}

function openProgram(worldKey:string,playerKey:string,planSeasonKey:string):UsMilitaryServiceProgram {
 const completionDays=usMilitaryCompletionDays(planSeasonKey),blocks:UsMilitaryServiceBlock[]=[
  {seasonKey:completionDays[0]!.seasonKey,kind:'FULL_DOMESTIC_SEASON',completedWorldDay:null},
  {seasonKey:completionDays[1]!.seasonKey,kind:'FIRST_HALF_SEASON',completedWorldDay:null},
 ];
 return {programId:JSON.stringify(['us-military-service',worldKey,planSeasonKey,playerKey]),planSeasonKey,scheduledBlocks:2,blocks,completedBlocks:0,completionDays};
}

function completeBlock(program:UsMilitaryServiceProgram,seasonKey:string,worldDay:number):UsMilitaryServiceProgram {
 const index=program.blocks.findIndex(b=>b.seasonKey===seasonKey);
 if(index<0||index!==program.completedBlocks)throw new RangeError('INVALID_US_SERVICE_BLOCK');
 const due=program.completionDays[index]!;if(due.seasonKey!==seasonKey||due.worldDay!==worldDay)throw new RangeError('INVALID_US_SERVICE_CALENDAR');
 const block=program.blocks[index]!;
 if(block.completedWorldDay!==null){if(block.completedWorldDay===worldDay)return structuredClone(program);throw new RangeError('US_SERVICE_BLOCK_EVIDENCE_REUSED');}
 return {...structuredClone(program),blocks:program.blocks.map((b,i)=>i===index?{...b,completedWorldDay:worldDay}:b),completedBlocks:program.completedBlocks+1};
}

/** Read-only. Freeze needs the live contract's militaryReturnOption. */
export function usMilitaryPlanPreview(c:UsCareer){
 const ready=gate(c);return {sourceRevision:c.revision,nextAge:ready.nextAge,deadlineAge:c.military.deadlineAge,militaryReturnOption:c.contract.militaryReturnOption,choices:(c.contract.militaryReturnOption?['FREEZE','TERMINATE']:['TERMINATE']) as readonly UsMilitaryPlanChoice[]};
}

/** Offseason only. Seals the 18-month two-block calendar; does not invent Korean registration or jump to COMPLETED. */
export function chooseUsMilitaryPlan(c:UsCareer,revision:number,choice:UsMilitaryPlanChoice):UsCareer {
 assertUsCareerRevision(c,revision);const preview=usMilitaryPlanPreview(c);if(!preview.choices.includes(choice))throw new RangeError('US_MILITARY_PLAN_REFUSED');
 if(choice==='FREEZE'&&!c.contract.militaryReturnOption)throw new RangeError('US_MILITARY_FREEZE_UNAVAILABLE');
 const next=structuredClone(c);next.revision++;
 const service=openProgram(c.world.worldKey,c.protagonistKey,c.world.seasonKey);
 if(choice==='FREEZE')next.military={status:'FROZEN_SERVICE',deadlineAge:c.military.deadlineAge,frozenContractKey:c.contract.contractKey,planSeasonKey:c.world.seasonKey,service};
 else{next.military={status:'TERMINATED_SERVICE',deadlineAge:c.military.deadlineAge,planSeasonKey:c.world.seasonKey,terminatedContractKey:c.contract.contractKey,service};parkForTerminate(next,c.protagonistKey);}
 assertUsCareerRevision(next,next.revision);return next;
}

/**
 * Marks the current world season's service block complete in SEASON_REVIEW (due day already on the sealed calendar).
 * Caller advances into each service season first; this never jumps to COMPLETED alone.
 * Uses revision equality (not full entry view) so year-advanced service seasons remain settleable.
 */
export function settleUsMilitaryServiceBlock(c:UsCareer,revision:number):UsCareer {
 assertMilitaryRevision(c,revision);
 if(c.military.status!=='FROZEN_SERVICE'&&c.military.status!=='TERMINATED_SERVICE')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 const service=c.military.service;if(!service)throw new RangeError('US_MILITARY_SERVICE_PROGRAM_REQUIRED');
 if(canonicalJson(service.completionDays)!==canonicalJson(usMilitaryCompletionDays(service.planSeasonKey)))throw new RangeError('INVALID_US_SERVICE_CALENDAR');
 if(c.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('US_MILITARY_BLOCK_NOT_READY');
 const open=service.blocks.find(b=>b.seasonKey===c.world.seasonKey&&b.completedWorldDay===null);
 if(!open)throw new RangeError('US_MILITARY_BLOCK_NOT_OPEN');
 const due=service.completionDays.find(d=>d.seasonKey===c.world.seasonKey)!;
 const next=structuredClone(c);next.revision++;next.military={...next.military,service:completeBlock(service,open.seasonKey,due.worldDay)};
 return next;
}

/** Completes only after both sealed 18-month blocks. Instant COMPLETED without settlement is rejected. */
export function completeUsMilitaryService(c:UsCareer,revision:number):UsCareer {
 assertMilitaryRevision(c,revision);if(c.military.status!=='FROZEN_SERVICE'&&c.military.status!=='TERMINATED_SERVICE')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 const service=c.military.service;if(!service||service.completedBlocks!==service.scheduledBlocks||service.blocks.some(b=>b.completedWorldDay===null))throw new RangeError('US_MILITARY_SERVICE_INCOMPLETE');
 const next=structuredClone(c);next.revision++;next.military={status:'COMPLETED',deadlineAge:c.military.deadlineAge,...(c.military.planSeasonKey?{planSeasonKey:c.military.planSeasonKey}:{}),...(c.military.frozenContractKey?{frozenContractKey:c.military.frozenContractKey}:{}),...(c.military.terminatedContractKey?{terminatedContractKey:c.military.terminatedContractKey}:{}),service:structuredClone(service)};
 return next;
}

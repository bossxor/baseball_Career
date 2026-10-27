import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsLevel} from './us-world.js';
import {usYearTransitionReadiness} from './us-year-transition.js';

export type UsMilitaryStatus='UNRESOLVED'|'FROZEN_SERVICE'|'TERMINATED_SERVICE'|'COMPLETED'|'NOT_APPLICABLE';
export type UsMilitaryPlanChoice='FREEZE'|'TERMINATE';

const LEVELS:readonly UsLevel[]=['ROOKIE','A','AA','AAA','MLB'];

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

/** Read-only. Freeze needs the live contract's militaryReturnOption. */
export function usMilitaryPlanPreview(c:UsCareer){
 const ready=gate(c);return {sourceRevision:c.revision,nextAge:ready.nextAge,deadlineAge:c.military.deadlineAge,militaryReturnOption:c.contract.militaryReturnOption,choices:(c.contract.militaryReturnOption?['FREEZE','TERMINATE']:['TERMINATE']) as readonly UsMilitaryPlanChoice[]};
}

/** Offseason only. Freeze keeps the US contract idle; terminate ends live registration. Neither invents Korean registration. */
export function chooseUsMilitaryPlan(c:UsCareer,revision:number,choice:UsMilitaryPlanChoice):UsCareer {
 assertUsCareerRevision(c,revision);const preview=usMilitaryPlanPreview(c);if(!preview.choices.includes(choice))throw new RangeError('US_MILITARY_PLAN_REFUSED');
 if(choice==='FREEZE'&&!c.contract.militaryReturnOption)throw new RangeError('US_MILITARY_FREEZE_UNAVAILABLE');
 const next=structuredClone(c);next.revision++;
 if(choice==='FREEZE')next.military={status:'FROZEN_SERVICE',deadlineAge:c.military.deadlineAge,frozenContractKey:c.contract.contractKey,planSeasonKey:c.world.seasonKey};
 else{next.military={status:'TERMINATED_SERVICE',deadlineAge:c.military.deadlineAge,planSeasonKey:c.world.seasonKey,terminatedContractKey:c.contract.contractKey};parkForTerminate(next,c.protagonistKey);}
 assertUsCareerRevision(next,next.revision);return next;
}

/** Completes the overseas service block. Frozen contracts may resume; terminated ones stay off the live roster. */
export function completeUsMilitaryService(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);if(c.military.status!=='FROZEN_SERVICE'&&c.military.status!=='TERMINATED_SERVICE')throw new RangeError('US_MILITARY_SERVICE_NOT_ACTIVE');
 const next=structuredClone(c);next.revision++;next.military={status:'COMPLETED',deadlineAge:c.military.deadlineAge,...(c.military.planSeasonKey?{planSeasonKey:c.military.planSeasonKey}:{}),...(c.military.frozenContractKey?{frozenContractKey:c.military.frozenContractKey}:{}),...(c.military.terminatedContractKey?{terminatedContractKey:c.military.terminatedContractKey}:{})};
 assertUsCareerRevision(next,next.revision);return next;
}

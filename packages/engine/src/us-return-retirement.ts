import type {UsAmateurReturnCareer} from './us-amateur-return-career.js';
import {assertUsAmateurReturnCareer} from './us-amateur-return-career.js';
import {canonicalJson} from './game.js';
import {canonicalSeal} from './canonical-seal.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,resolveEventChoice} from './events.js';
import type {EventInstance} from './events.js';

export interface UsReturnRetirement {version:1;status:'PENDING'|'CANCELLED'|'ARCHIVED';eventKey:string;sourceBasis:string;receiptKey?:string}
const retirementEvent=(e:EventInstance)=>e.definitionId==='E36'||e.definitionId==='E37';
function basis(c:UsAmateurReturnCareer){return canonicalSeal([c.version,c.serviceGrowthPolicy??null,c.source,c.return,c.retry,c.preparation??null,c.service??null,c.completedPreparation,c.draft??null,c.events.filter(e=>!retirementEvent(e))]);}
function safe(c:UsAmateurReturnCareer){
 const owner=c.preparation??c.service,last=c.return.years.at(-1);
 return Boolean(c.return.status==='DRAFT_READY'&&c.return.years.length===2&&last&&owner?.seasonGrowth.finalized&&owner.world.seasonKey===last.seasonKey&&['COMPLETED','NOT_APPLICABLE'].includes(c.return.militaryStatus)&&c.draft?.program.decision==='DECLINED'&&!c.draft.program.signing&&!(c.source.minorMarket?.offers??[]).some(o=>o.militaryReturnOption));
}
function task(c:UsAmateurReturnCareer,n:number){return JSON.stringify(['us-return-retirement',c.return.returnId,n]);}
function make(c:UsAmateurReturnCareer,id:'E36'|'E37',ref:string,n:number,sequence:number){
 const r=c.return,owner=c.preparation??c.service!;
 return createWorldEvent({definitionId:id,worldKey:r.worldKey,seasonKey:c.retry.seasonKey,evidence:{version:1,type:eventDefinition(id).evidenceDomain,fields:{playerSimulationKey:r.playerKey,retirementTaskOrReceiptId:ref}},resume:{worldKey:r.worldKey,seasonKey:c.retry.seasonKey,phase:id==='E36'?'CAREER_ROUTE':'ARCHIVED',competitionKey:'INDEPENDENT',registrationKey:'protagonistSchoolId' in owner.world?owner.world.protagonistSchoolId:null,sourceRevision:n},sourceSequence:sequence,worldDay:r.years.at(-1)!.endWorldDay});
}
const context=(e:EventInstance)=>({worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices});
const receipt=(command:string,ref:string)=>JSON.stringify([command==='CONFIRM_RETIRE'?'us-return-retired':'us-return-retirement-cancelled',ref]);
function same(a:unknown,b:unknown){return canonicalJson(a)===canonicalJson(b);}
/** Rebuild every decision and receipt, including earlier cancellations retained after re-request. */
export function assertUsReturnRetirement(c:UsAmateurReturnCareer):void {
 const history=c.events.filter(retirementEvent),r=c.retirement;if(!r){if(history.length)throw new RangeError('INVALID_US_RETURN_RETIREMENT');return;}
 if(!safe(c)||r.version!==1||!['PENDING','CANCELLED','ARCHIVED'].includes(r.status)||r.sourceBasis!==basis(c)||!history.length)throw new RangeError('US_RETURN_RETIREMENT_SOURCE_CHANGED');
 if(!same(c.events.slice(-history.length),history))throw new RangeError('INVALID_US_RETURN_RETIREMENT');
 let previousRevision=c.source.revision;
 for(const [i,e]of history.entries()){
  const index=c.events.indexOf(e),n=e.resume.sourceRevision;
  if(!Number.isSafeInteger(n)||n<=previousRevision||n>c.revision)throw new RangeError('US_RETURN_RETIREMENT_SOURCE_CHANGED');
  if(e.definitionId==='E37'){
   const prior=history[i-1];if(i!==history.length-1||!prior||prior.definitionId!=='E36'||prior.resolution?.command!=='CONFIRM_RETIRE'||r.status!=='ARCHIVED')throw new RangeError('INVALID_US_RETURN_RETIREMENT');
   const original=make(c,'E37',r.receiptKey!,n,index+1),expected=e.status==='OPEN'?original:resolveEventChoice(original,original.version,'OPEN_ARCHIVE',null,context(original)).event;
   if(n!==prior.resume.sourceRevision+1||!same(e,expected))throw new RangeError('US_RETURN_RETIREMENT_FAREWELL_CHANGED');
  }else{
   const ref=task(c,n),original=make(c,'E36',ref,n,index+1),latest=e.eventKey===r.eventKey;
   const command=latest?(r.status==='PENDING'?null:r.status==='ARCHIVED'?'CONFIRM_RETIRE':'CANCEL_RETIRE'):'CANCEL_RETIRE';
   const expected=command?completeBlockingEvent(original,original.version,{sourceEvidenceKey:original.evidenceKey,receiptKey:receipt(command,ref),command},context(original)):original;
   if(!same(e,expected)||latest&&(r.receiptKey!==(command?receipt(command,ref):undefined)||c.revision<n+(command?1:0)))throw new RangeError('US_RETURN_RETIREMENT_RECEIPT_CHANGED');
  }
  previousRevision=n;
 }
 const latest=history.filter(e=>e.definitionId==='E36').at(-1)!;
 if(latest.eventKey!==r.eventKey||r.status==='ARCHIVED'&&history.at(-1)?.definitionId!=='E37'||r.status!=='ARCHIVED'&&history.at(-1)!==latest)throw new RangeError('INVALID_US_RETURN_RETIREMENT');
 if(r.status==='PENDING'&&c.revision!==latest.resume.sourceRevision)throw new RangeError('US_RETURN_RETIREMENT_SOURCE_CHANGED');
}
function check(c:UsAmateurReturnCareer,n:number){assertUsAmateurReturnCareer(c);if(c.revision!==n||!Number.isSafeInteger(n)||n===Number.MAX_SAFE_INTEGER)throw new RangeError('US_RETURN_ROOT_REVISION_CHANGED');}
export function canRequestUsReturnRetirement(c:UsAmateurReturnCareer){assertUsAmateurReturnCareer(c);return safe(c)&&(!c.retirement||c.retirement.status==='CANCELLED');}
export function requestUsReturnRetirement(c:UsAmateurReturnCareer,n:number):UsAmateurReturnCareer {
 check(c,n);if(!canRequestUsReturnRetirement(c))throw new RangeError('US_RETURN_RETIREMENT_NOT_AVAILABLE');
 const e=make(c,'E36',task(c,n+1),n+1,c.events.length+1),next:UsAmateurReturnCareer={...c,revision:n+1,events:[...c.events,e],retirement:{version:1,status:'PENDING',eventKey:e.eventKey,sourceBasis:basis(c)}};assertUsAmateurReturnCareer(next);return next;
}
export function resolveUsReturnRetirement(c:UsAmateurReturnCareer,n:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}):UsAmateurReturnCareer {
 check(c,n);const r=c.retirement,e=c.events.find(e=>e.eventKey===input.eventKey);
 if(r?.status!=='PENDING'||!e||r.eventKey!==e.eventKey||!['CONFIRM_RETIRE','CANCEL_RETIRE'].includes(input.command))throw new RangeError('US_RETURN_RETIREMENT_NOT_PENDING');
 const receiptKey=receipt(input.command,task(c,e.resume.sourceRevision)),resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey,command:input.command},context(e));
 const next:UsAmateurReturnCareer={...c,revision:n+1,events:c.events.map(x=>x===e?resolved:x),retirement:{...r,status:input.command==='CONFIRM_RETIRE'?'ARCHIVED':'CANCELLED',receiptKey}};
 if(input.command==='CONFIRM_RETIRE')next.events=[...next.events,make(next,'E37',receiptKey,n+1,next.events.length+1)];assertUsAmateurReturnCareer(next);return next;
}
export function usReturnRetirementView(c:UsAmateurReturnCareer){
 assertUsAmateurReturnCareer(c);const r=c.retirement;if(!r||r.status==='CANCELLED')return null;
 const e=r.status==='ARCHIVED'?c.events.at(-1)!:c.events.find(e=>e.eventKey===r.eventKey)!,p=c.return.years.at(-1)!.endingPlayer;
 return {status:r.status,player:{name:p.name,age:p.age,kind:p.kind,position:p.position},eventKey:e.eventKey,eventVersion:e.version,commands:e.status!=='OPEN'?[]:r.status==='PENDING'?['CONFIRM_RETIRE','CANCEL_RETIRE']:['OPEN_ARCHIVE'],receiptKey:r.receiptKey??null};
}
export function openUsReturnArchive(c:UsAmateurReturnCareer,n:number,input:{eventKey:string;eventVersion:number}){
 check(c,n);const e=c.events.at(-1)!;if(c.retirement?.status!=='ARCHIVED'||e.definitionId!=='E37'||input.eventKey!==e.eventKey)throw new RangeError('US_RETURN_RETIREMENT_NOT_ARCHIVED');
 const result=resolveEventChoice(e,input.eventVersion,'OPEN_ARCHIVE',null,context(e)),career={...c,revision:n+1,events:c.events.map(x=>x===e?result.event:x)};assertUsAmateurReturnCareer(career);return {career,navigation:result.navigation};
}

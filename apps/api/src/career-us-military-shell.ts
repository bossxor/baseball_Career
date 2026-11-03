import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

export const US_MILITARY_SCREEN_IDS=['US_MILITARY_PLAN','US_MILITARY_SERVICE'] as const;
const fields=new Map<string,readonly string[]>([
 ['PLAN',['choice']],['START_YEAR',[]],['ADVANCE',['maxDays']],['COMPLETE',[]],
 ['CONFIRM_RETURN',[]],['DECLINE_RETURN',[]],['ACCEPT_OFFER',['offerKey']],['DECLINE_OFFER',['offerKey']],
]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {
 fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');
}
function owner(state:SaveState):engine.UsCareer {
 if(!state.career||typeof state.career!=='object'||Array.isArray(state.career))fail('CAREER_NOT_FOUND');
 return state.career as engine.UsCareer;
}

/** The native US worker owns service dates, payroll and return deadlines; HTTP supplies choices only. */
export function applyUsMilitary(state:SaveState,command:CommandBody):AppliedCommand {
 const name=command.type.slice('CAREER_US_MILITARY_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>;
 if(typeof p.careerRevision!=='number'||!Number.isSafeInteger(p.careerRevision)||p.careerRevision<0)fail('INVALID_PAYLOAD');
 const revision=p.careerRevision;
 if(name==='PLAN'&&p.choice!=='FREEZE'&&p.choice!=='TERMINATE')fail('INVALID_PAYLOAD');
 if(name==='ADVANCE'&&(typeof p.maxDays!=='number'||!Number.isSafeInteger(p.maxDays)||p.maxDays<1||p.maxDays>7))fail('INVALID_PAYLOAD');
 if((name==='ACCEPT_OFFER'||name==='DECLINE_OFFER')&&(typeof p.offerKey!=='string'||!p.offerKey))fail('INVALID_PAYLOAD');
 const c=owner(state);let next:engine.UsCareer,stopReason:string|undefined,rosterIssue:unknown;
 try{
  switch(name){
   case 'PLAN':next=engine.chooseUsMilitaryPlan(c,revision,p.choice as engine.UsMilitaryPlanChoice);break;
   case 'START_YEAR':{
    const prepared=engine.startUsMilitaryServiceSeason(c,revision);next=engine.startUsMilitaryWorld(prepared,prepared.revision);break;
   }
   case 'ADVANCE':{const result=engine.advanceUsMilitaryWorld(c,revision,p.maxDays as number);next=result.career;stopReason=result.stopReason;rosterIssue=result.rosterIssue;break;}
   case 'COMPLETE':next=engine.completeUsMilitaryService(c,revision);break;
   case 'CONFIRM_RETURN':next=engine.confirmUsMilitaryReturn(c,revision);break;
   case 'DECLINE_RETURN':next=engine.declineUsMilitaryReturn(c,revision);break;
   case 'ACCEPT_OFFER':next=engine.acceptUsMilitaryReturnOffer(c,revision,p.offerKey as string);break;
   case 'DECLINE_OFFER':next=engine.declineUsMilitaryReturnOffer(c,revision,p.offerKey as string);break;
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){domainError(error);}
 const phase=next!.phaseContext.phase;
 return {nextState:{...state,career:next!},phase,summary:{type:command.type,careerRevision:next!.revision,phase,...(stopReason?{stopReason}:{}),...(rosterIssue?{rosterIssue}:{})},eventIds:[]};
}

export function usMilitaryScreen(state:SaveState,screen:string):unknown {
 const c=owner(state);
 try{
  if(screen==='US_MILITARY_PLAN')return {...engine.usMilitaryPlanPreview(c),careerRevision:c.revision};
  if(screen==='US_MILITARY_SERVICE')return {...engine.usMilitaryServiceView(c),careerRevision:c.revision,phase:c.phaseContext.phase,seasonKey:c.world.seasonKey};
  fail('UNSUPPORTED_SCREEN');
 }catch(error){domainError(error);}
}

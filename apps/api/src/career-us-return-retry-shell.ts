import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

const fields:Record<string,readonly string[]>={OPEN:[],START:['routePreviewId'],PRESEASON:[],ADVANCE:['mode'],TRAIN:['choice'],PLAN:['focus','archetype'],SETTLE:['forfeitUnusedTraining'],DRAFT_PREPARE:['preferredClubId'],DRAFT_RESOLVE:['programVersion'],DRAFT_DECIDE:['programVersion','decision'],KBO_ACTIVATE:[],US_ASSESS:[],US_DECLINE:['assessmentKey'],US_ACCEPT:['routePreviewId','offerKey'],EXHAUST:[],CONFIRM_RETIRE:['eventKey','eventVersion']};
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function errorCode(error:unknown):never {fail(error instanceof Error&&/^[A-Z_]+/.test(error.message)?error.message.split(/[\s:]/)[0]!:'INVALID_REQUEST');}
export function isUsReturnRetry(value:unknown):value is engine.UsAmateurReturnRetryCareer {return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&'mode' in value&&value.mode==='US_RETURN_RETRY');}
export function applyUsReturnRetry(state:SaveState,command:CommandBody):AppliedCommand {
 const name=command.type.slice('CAREER_RETRY_US_RETURN_'.length),allowed=fields[name],raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>k!=='careerRevision'&&!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,str=(k:string)=>typeof p[k]==='string'?p[k] as string:fail('INVALID_PAYLOAD'),num=(k:string)=>typeof p[k]==='number'&&Number.isSafeInteger(p[k])&&p[k]>=0?p[k] as number:fail('INVALID_PAYLOAD'),rev=num('careerRevision');
 if(!state.career||typeof state.career!=='object')fail('CAREER_NOT_FOUND');
 if(name!=='OPEN'&&!isUsReturnRetry(state.career))fail('INVALID_CAREER_OWNER');
 const c=state.career as engine.UsAmateurReturnRetryCareer;let next:engine.UsAmateurReturnRetryCareer|engine.KboCareer|engine.UsCareer,stopReason:string|undefined;
 try{
  switch(name){
   case 'OPEN':next=engine.openUsAmateurReturnRetry(state.career as engine.UsAmateurReturnCareer,rev);break;
   case 'START':next=engine.startUsAmateurReturnRetryPreparation(c,rev,{routePreviewId:str('routePreviewId')});break;
   case 'PRESEASON':next=engine.confirmUsAmateurReturnRetryPreseason(c,rev);break;
   case 'ADVANCE':{if(p.mode!=='ONE_GAME'&&p.mode!=='ONE_MONTH')fail('INVALID_PAYLOAD');const out=engine.advanceUsAmateurReturnRetryPreparation(c,rev,p.mode);next=out.career;stopReason=out.stopReason;break;}
   case 'TRAIN':{
    const choice=p.choice;if(!choice||typeof choice!=='object'||Array.isArray(choice)||!('type' in choice))fail('INVALID_PAYLOAD');
    const t=choice as Record<string,unknown>;if(!['GUARANTEED','CHALLENGE','CONDITIONING','SKIP'].includes(String(t.type))||Object.keys(t).some(k=>k!=='type'&&k!=='ability')||(['GUARANTEED','CHALLENGE'].includes(String(t.type))?typeof t.ability!=='string':t.ability!==undefined))fail('INVALID_PAYLOAD');
    next=engine.trainUsAmateurReturnRetryPreparation(c,rev,choice as engine.TrainingChoice);break;
   }
   case 'PLAN':if(!Array.isArray(p.focus)||!p.focus.every(k=>typeof k==='string'))fail('INVALID_PAYLOAD');next=engine.setUsAmateurReturnRetryPreparationPlan(c,rev,p.focus,str('archetype'));break;
   case 'SETTLE':if(typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');next=engine.settleUsAmateurReturnRetryPreparation(c,rev,p.forfeitUnusedTraining);break;
   case 'DRAFT_PREPARE':if(p.preferredClubId!==undefined&&p.preferredClubId!==null&&typeof p.preferredClubId!=='string')fail('INVALID_PAYLOAD');next=engine.prepareUsAmateurReturnRetryDraft(c,rev,p.preferredClubId as string|null|undefined);break;
   case 'DRAFT_RESOLVE':next=engine.resolveUsAmateurReturnRetryDraft(c,rev,num('programVersion'));break;
   case 'DRAFT_DECIDE':if(p.decision!=='SIGN'&&p.decision!=='DECLINE')fail('INVALID_PAYLOAD');next=engine.decideUsAmateurReturnRetryDraft(c,rev,num('programVersion'),p.decision);break;
   case 'KBO_ACTIVATE':next=engine.startSignedUsAmateurReturnRetryKboCareer(c,rev);break;
   case 'US_ASSESS':next=engine.assessUsAmateurReturnRetryUsOpportunity(c,rev);break;
   case 'US_DECLINE':next=engine.declineUsAmateurReturnRetryUsOpportunity(c,rev,str('assessmentKey'));break;
   case 'US_ACCEPT':next=engine.resignUsAfterAmateurReturnRetry(c,rev,{routePreviewId:str('routePreviewId'),offerKey:str('offerKey')});break;
   case 'EXHAUST':next=engine.openUsAmateurReturnRetryExhaustion(c,rev);break;
   case 'CONFIRM_RETIRE':next=engine.confirmUsAmateurReturnRetryExhaustion(c,rev,{eventKey:str('eventKey'),eventVersion:num('eventVersion'),command:'CONFIRM_RETIRE'});break;
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){errorCode(error);}
 const phase=isUsReturnRetry(next!)?(next!.status==='ARCHIVED'?'ARCHIVED':next!.status==='PREPARING'?next!.preparation!.phase:'CAREER_ROUTE'):next!.phaseContext.phase;
 return {nextState:{...state,career:next!},summary:{type:command.type,careerRevision:next!.revision,phase,...(stopReason?{stopReason}:{})},eventIds:[],phase};
}
export function usReturnRetryScreen(c:engine.UsAmateurReturnRetryCareer,screen:string):unknown {
 try{
  if(screen==='RETRY_ROUTES')return engine.usAmateurReturnRetryRoutesView(c);
  if(screen==='RETRY_PREP')return engine.usAmateurReturnRetryPreparationView(c);
  if(screen==='RETRY_RETIREMENT')return engine.usAmateurReturnRetryRetirementView(c);
  fail('UNSUPPORTED_SCREEN');
 }catch(error){errorCode(error);}
}

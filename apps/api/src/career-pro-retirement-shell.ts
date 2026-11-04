import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
type Pro=engine.KboCareer|engine.UsCareer;
const isUs=(c:Pro):c is engine.UsCareer=>'mode'in c&&c.mode==='US_CAREER';
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):Pro {
 const c=state.career;if(!c||typeof c!=='object'||Array.isArray(c))fail('CAREER_NOT_FOUND');
 if(!('mode'in c&&c.mode==='US_CAREER')&&!('protagonistClubId'in c))fail('PRO_CAREER_REQUIRED');return c as Pro;
}
const archive=(c:Pro)=>isUs(c)?engine.usRetirementArchiveView(c):engine.kboRetirementArchiveView(c);
function farewell(c:Pro){
 const r=c.retirement;if(!r)return null;const matches=c.events.filter(e=>['E37','E69'].includes(e.definitionId)&&e.evidence.fields.retirementTaskOrReceiptId===r.receiptKey);if(matches.length>1)fail('INVALID_PRO_RETIREMENT_FAREWELL');const e=matches[0];if(!e)return null;engine.validateEvent(e);
 if(e.worldKey!==c.world.worldKey||e.seasonKey!==r.seasonKey||e.evidence.fields.playerSimulationKey!==c.protagonistKey)fail('INVALID_PRO_RETIREMENT_FAREWELL');return e;
}
const fields=new Map<string,readonly string[]>([['CAREER_PRO_RETIRE_OPEN_ARCHIVE',['eventKey','eventVersion']],['CAREER_PRO_RETIRE_REQUEST',[]],['CAREER_PRO_RETIRE_RESOLVE',['eventKey','eventVersion','command']],['CAREER_PRO_RETIRE_MAX_AGE',[]]]);
export function applyProRetirement(state:SaveState,command:CommandBody):AppliedCommand {
 const allowed=fields.get(command.type),raw=command.payload;if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');const p=raw as Record<string,unknown>;
 if(typeof p.careerRevision!=='number'||!Number.isSafeInteger(p.careerRevision)||p.careerRevision<1)fail('INVALID_PAYLOAD');
 const c=owner(state);let next:Pro,navigation:unknown;
 try{
  if(command.type==='CAREER_PRO_RETIRE_OPEN_ARCHIVE'){
   if(typeof p.eventKey!=='string'||!p.eventKey||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1)fail('INVALID_PAYLOAD');
   if(isUs(c))engine.assertUsCareerRevision(c,p.careerRevision);else engine.assertKboCareerRevision(c,p.careerRevision);archive(c);
   const e=farewell(c);if(!e||e.eventKey!==p.eventKey)fail('INVALID_PRO_RETIREMENT_FAREWELL');const result=engine.resolveEventChoice(e,p.eventVersion,'OPEN_ARCHIVE',null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_ARCHIVE']});
   next={...c,revision:c.revision+1,events:c.events.map(n=>n.eventKey===e.eventKey?result.event:n)};navigation=result.navigation;
  }else if(command.type==='CAREER_PRO_RETIRE_RESOLVE'){
   if(typeof p.eventKey!=='string'||!p.eventKey||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1||p.command!=='CONFIRM_RETIRE'&&p.command!=='CANCEL_RETIRE')fail('INVALID_PAYLOAD');
   const input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}={eventKey:p.eventKey,eventVersion:p.eventVersion,command:p.command};next=isUs(c)?engine.resolveUsRetirement(c,p.careerRevision,input):engine.resolveKboRetirement(c,p.careerRevision,input);
  }else if(command.type==='CAREER_PRO_RETIRE_REQUEST')next=isUs(c)?engine.requestUsRetirement(c,p.careerRevision):engine.requestKboRetirement(c,p.careerRevision);
  else next=isUs(c)?engine.retireUsAtMaxAge(c,p.careerRevision):engine.retireKboAtMaxAge(c,p.careerRevision);
  return {nextState:{...state,career:next},phase:next.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next.revision,...(navigation?{navigation}:{})}};
 }catch(error){domainError(error);}
}
/** Frozen archive rows remain readable without requiring a playable military/contract registration. */
export function proRetirementScreen(state:SaveState,screenId:'CAREER_PRO_RETIREMENT'|'CAREER_PRO_ARCHIVE'){
 const c=owner(state);
 try{
  if(screenId==='CAREER_PRO_ARCHIVE'){
   const view=archive(c),e=farewell(c),d=e?engine.eventDefinition(e.definitionId):null;
   return {careerRevision:c.revision,archive:view,farewell:e?{eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,status:e.status,title:d!.title,body:d!.body,commands:e.status==='OPEN'?['OPEN_ARCHIVE']:[]}:null};
  }
  if(isUs(c))engine.assertUsCareerRevision(c,c.revision);else engine.assertKboCareerRevision(c,c.revision);
  const phase=c.phaseContext,event=phase.phase==='RETIRE_CONFIRM'?c.events.find(e=>e.eventKey===phase.eventKey&&e.definitionId==='E36'&&e.status==='OPEN'):undefined;
  const contract=isUs(c)?engine.usCareerView(c).contract:(()=>{const t=c.world.contracts[c.protagonistKey];if(!t)fail('CONTRACT_NOT_FOUND');return {currency:'KRW',seasonKey:t.seasonKey,years:t.years,annualSalaryWon:t.annualSalaryWon,servicePay:engine.kboServiceContractView(t)};})();
  return {careerRevision:c.revision,phase:phase.phase,contract,confirmation:event?{eventKey:event.eventKey,eventVersion:event.version,definitionId:event.definitionId,commands:['CONFIRM_RETIRE','CANCEL_RETIRE']}:null};
 }catch(error){domainError(error);}
}

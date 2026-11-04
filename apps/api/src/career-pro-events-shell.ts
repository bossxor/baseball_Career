import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

type ProCareer=engine.KboCareer|engine.UsCareer;
const domains=['ADVICE','RESULT','AWARD','REPERTOIRE'] as const;
const selectionFields=new Map<string,readonly string[]>([
 ['ADVICE:START_POSITION_PLAN',['targetPosition']],['ADVICE:CONFIRM_POSITION',['planVersion']],
 ['ADVICE:CANCEL_POSITION_PLAN',['planVersion']],['ADVICE:CHOOSE_FOCUS',['focus']],
 ['REPERTOIRE:SET_PITCH_TRAINING',['pitchId','replacedPitchId']],['REPERTOIRE:SET_BATTING_APPROACH',['approach']],
]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
const isUs=(c:ProCareer):c is engine.UsCareer=>'mode'in c&&c.mode==='US_CAREER';
function owner(state:SaveState):ProCareer {
 const c=state.career;if(!c||typeof c!=='object'||Array.isArray(c))fail('CAREER_NOT_FOUND');
 if(!('mode'in c&&c.mode==='US_CAREER')&&(!('protagonistClubId'in c)||typeof c.protagonistClubId!=='string'))fail('PRO_CAREER_REQUIRED');
 return c as ProCareer;
}
/** The event's existing owner decides eligibility and commits its domain receipt, never a generic ACK substitute. */
export function applyProEvent(state:SaveState,command:CommandBody):AppliedCommand {
 const domain=command.type.slice('CAREER_PRO_EVENT_'.length),raw=command.payload;
 if(!(domains as readonly string[]).includes(domain))fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_PAYLOAD');const p=raw as Record<string,unknown>;
 const string=(key:string)=>typeof p[key]==='string'&&p[key]?p[key] as string:fail('INVALID_PAYLOAD');
 const number=(key:string)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&p[key]>=1?p[key] as number:fail('INVALID_PAYLOAD');
 const revision=number('careerRevision'),eventKey=string('eventKey'),eventVersion=number('eventVersion'),choice=string('command');
 const extra=selectionFields.get(domain+':'+choice)??[];
 if(Object.keys(p).some(key=>!['careerRevision','eventKey','eventVersion','command',...extra].includes(key)))fail('INVALID_PAYLOAD');
 if(p.targetPosition!==undefined)string('targetPosition');if(p.planVersion!==undefined)number('planVersion');
 for(const key of ['pitchId','replacedPitchId','approach'])if(p[key]!==undefined)string(key);
 if(p.focus!==undefined&&(!Array.isArray(p.focus)||!p.focus.every(v=>typeof v==='string')))fail('INVALID_PAYLOAD');
 const c=owner(state);let result:{career:ProCareer;navigation?:unknown};
 try{
  if(domain==='ADVICE')result=engine.resolveProCareerAdviceEvent(c,revision,{eventKey,eventVersion,command:choice,...(p.targetPosition!==undefined?{targetPosition:string('targetPosition')}:{}),...(p.planVersion!==undefined?{planVersion:number('planVersion')}:{}),...(p.focus!==undefined?{focus:p.focus as string[]}: {})});
  else if(domain==='RESULT')result=engine.resolveProCareerResultEvent(c,revision,{eventKey,eventVersion,command:choice as Parameters<typeof engine.resolveProCareerResultEvent>[2]['command']});
  else if(domain==='AWARD')result=engine.resolveProCareerAwardEvent(c,revision,{eventKey,eventVersion,command:choice as 'ACK_EVENT'});
  else{
   type Input=Parameters<typeof engine.resolveCareerRepertoireEvent>[2];
   result=engine.resolveCareerRepertoireEvent(c,revision,{eventKey,eventVersion,command:choice as Input['command'],...(p.pitchId!==undefined?{pitchId:p.pitchId as NonNullable<Input['pitchId']>}:{}),...(p.replacedPitchId!==undefined?{replacedPitchId:p.replacedPitchId as NonNullable<Input['replacedPitchId']>}:{}),...(p.approach!==undefined?{approach:p.approach as NonNullable<Input['approach']>}:{})});
  }
 }catch(error){domainError(error);}
 const next=result!.career;return {nextState:{...state,career:next},phase:next.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next.revision,phase:next.phaseContext.phase,...(result!.navigation?{navigation:result!.navigation}:{})}};
}
/** Read-only allowlist; no world, raw receipts, candidate scores, hidden potential or RNG leaves this view. */
export function proEventsScreen(state:SaveState){
 const c=owner(state);
 try{
  if(isUs(c))engine.assertUsCareerRevision(c,c.revision);else engine.assertKboCareerRevision(c,c.revision);
  const a=engine.proCareerAdviceView(c);
  return {careerRevision:c.revision,advice:{teamGames:a.teamGames,nextCheckpoint:a.nextCheckpoint,position:a.position,positionFits:a.positionFits,targetPositions:a.targetPositions,plans:a.plans,restPending:a.restPending,notices:a.notices},results:engine.proCareerResultEventsView(c),awards:{notices:engine.proCareerAwardsView(c).notices},repertoire:engine.careerRepertoireEventsView(c)};
 }catch(error){domainError(error);}
}

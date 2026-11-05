import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

type Career=engine.HighSchoolCareer|engine.KboCareer;
const fields=new Map<string,readonly string[]>([['PREPARE',['preferredClubId']],['RESOLVE',['programVersion']],['DECIDE',['programVersion','decision','eventVersion']],['CLOSE_YEAR',['forfeitUnusedTraining']],['ACTIVATE',[]]]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):Career {if(!state.career||typeof state.career!=='object'||Array.isArray(state.career))fail('CAREER_NOT_FOUND');return state.career as Career;}
function amateur(c:Career):engine.HighSchoolCareer {if(c.schemaVersion!==1||'protagonistClubId'in c||!('protagonistKey'in c.world)||typeof c.world.protagonistKey!=='string'||!Array.isArray((c as engine.HighSchoolCareer).world.schools))fail('KBO_AMATEUR_OWNER_REQUIRED');return c as engine.HighSchoolCareer;}
/** Existing owned draft/contract/year-end receipts supply every world, registration, identity and budget. */
export function applyKboEntry(state:SaveState,command:CommandBody):AppliedCommand {
 const name=command.type.slice('CAREER_KBO_ENTRY_'.length),allowed=fields.get(name),raw=command.payload;if(!allowed)fail('UNSUPPORTED_COMMAND');if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');const p=raw as Record<string,unknown>;
 const number=(key:string,min=1)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&p[key]>=min?p[key] as number:fail('INVALID_PAYLOAD');const revision=number('careerRevision',0);let next:Career;
 try{const c=amateur(owner(state));switch(name){
  case 'PREPARE':if(p.preferredClubId!==undefined&&p.preferredClubId!==null&&typeof p.preferredClubId!=='string')fail('INVALID_PAYLOAD');next=engine.prepareCareerKboDraft(c,revision,p.preferredClubId as string|null|undefined);break;
  case 'RESOLVE':next=engine.resolveCareerKboDraft(c,revision,number('programVersion'));break;
  case 'DECIDE':if(p.decision!=='SIGN'&&p.decision!=='DECLINE')fail('INVALID_PAYLOAD');next=engine.decideCareerKboDraft(c,revision,{programVersion:number('programVersion'),decision:p.decision,...(p.eventVersion===undefined?{}:{eventVersion:number('eventVersion')})});break;
  case 'CLOSE_YEAR':if(p.forfeitUnusedTraining!==undefined&&typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');next=engine.closeSchoolSeasonForKbo(c,revision,p.forfeitUnusedTraining as boolean|undefined);break;
  case 'ACTIVATE':next=engine.startSignedKboCareer(c,revision);break;
  default:fail('UNSUPPORTED_COMMAND');
 }}catch(error){domainError(error);}return {nextState:{...state,career:next!},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase}};
}
export function kboRecruitmentScreen(state:SaveState){
 try{const c=owner(state);if('protagonistClubId'in c){if(c.phaseContext.phase!=='PRESEASON_SETUP')fail('KBO_ENTRY_VIEW_NOT_AVAILABLE');return {mode:'KBO_CAREER',careerRevision:c.revision,entry:engine.kboCareerEntryView(c)};}
  const s=amateur(c);engine.assertSchoolCareerRevision(s,s.revision);const draft=s.kboRecruitment?engine.careerKboDraftView(s):null,graduation=s.graduation?s.events.find(e=>e.eventKey===s.graduation!.eventKey):undefined,yearEnd=s.kboYearEnd?engine.assertKboAmateurYearEnd(s):null;
  return {mode:'AMATEUR',careerRevision:s.revision,draft,graduationEvent:graduation?{eventKey:graduation.eventKey,eventVersion:graduation.version}:null,yearEndReady:Boolean(yearEnd),trainingForfeitRequired:!s.development?.trainingUsedSeasons.includes(s.world.seasonKey)};
 }catch(error){domainError(error);}
}

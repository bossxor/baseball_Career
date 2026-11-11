import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import {spanDeadline} from './span-budget.js';

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
 let updatedHost:engine.CollegeLeagueHost|undefined,consumedHost=false;
 try{const c=amateur(owner(state));switch(name){
  case 'PREPARE':{
   if(p.preferredClubId!==undefined&&p.preferredClubId!==null&&typeof p.preferredClubId!=='string')fail('INVALID_PAYLOAD');
   const preferred=p.preferredClubId as string|null|undefined,source=state.collegeNationalHost;
   if(c.world.leagueKey!=='COLLEGE'||!engine.isCollegeLeagueHost(source)){next=engine.prepareCareerKboDraft(c,revision,preferred);break;}
   if(c.revision!==revision)fail('CAREER_REVISION_CHANGED');
   if(c.phaseContext.phase!=='CAREER_ROUTE')fail('INVALID_CAREER_PHASE');
   if(c.kboRecruitment)fail('KBO_ASSESSMENT_ALREADY_EXISTS');
   const npcOwner={worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,playerKey:c.world.protagonistKey,difficulty:c.difficulty};
   const target={seasonKey:String(Number(c.world.seasonKey)+1),stopDay:null},deadline=spanDeadline();
   let current=source;
   for(let i=0;i<20_000;i++){
    const step=engine.advanceNpcLeagueHost(current,current.revision,npcOwner,target);current=step.host;
    if(['ENGINE_LIMIT','LINEUP_INVALID','BULLPEN_INVALID','ROSTER_BLOCKED','CONTRACT_EXPIRED'].includes(step.stopReason))fail(step.stopReason);
    if(step.stopReason==='TARGET_REACHED'||Date.now()>=deadline)break;
   }
   updatedHost=current;
   next=current.game.world.seasonKey===target.seasonKey&&current.game.phase==='PRESEASON_SETUP'?engine.prepareCareerKboDraft(c,revision,preferred,current):c;
   break;
  }
  case 'RESOLVE':next=engine.resolveCareerKboDraft(c,revision,number('programVersion'));break;
  case 'DECIDE':if(p.decision!=='SIGN'&&p.decision!=='DECLINE')fail('INVALID_PAYLOAD');next=engine.decideCareerKboDraft(c,revision,{programVersion:number('programVersion'),decision:p.decision,...(p.eventVersion===undefined?{}:{eventVersion:number('eventVersion')})});break;
  case 'CLOSE_YEAR':if(p.forfeitUnusedTraining!==undefined&&typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');next=engine.closeSchoolSeasonForKbo(c,revision,p.forfeitUnusedTraining as boolean|undefined);break;
  case 'ACTIVATE':{
   consumedHost=Boolean(c.kboRecruitment?.npcHostBasis);
   const source=state.collegeNationalHost;
   next=engine.startSignedKboCareer(c,revision,consumedHost&&engine.isCollegeLeagueHost(source)?source:undefined);
   break;
  }
  default:fail('UNSUPPORTED_COMMAND');
 }}catch(error){domainError(error);}
 const nextState:SaveState={...state,career:next!,...(updatedHost?{collegeNationalHost:updatedHost}:{})};
 if(consumedHost)delete nextState.collegeNationalHost;
 return {nextState,phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase,...(updatedHost?{hostRevision:updatedHost.revision,hostSeason:updatedHost.game.world.seasonKey,hostPhase:updatedHost.game.phase}: {})}};
}
export function kboRecruitmentScreen(state:SaveState){
 try{const c=owner(state);if('protagonistClubId'in c){if(c.phaseContext.phase!=='PRESEASON_SETUP')fail('KBO_ENTRY_VIEW_NOT_AVAILABLE');return {mode:'KBO_CAREER',careerRevision:c.revision,entry:engine.kboCareerEntryView(c)};}
  const s=amateur(c);engine.assertSchoolCareerRevision(s,s.revision);const draft=s.kboRecruitment?engine.careerKboDraftView(s):null,graduation=s.graduation?s.events.find(e=>e.eventKey===s.graduation!.eventKey):undefined,yearEnd=s.kboYearEnd?engine.assertKboAmateurYearEnd(s):null;
  return {mode:'AMATEUR',careerRevision:s.revision,draft,graduationEvent:graduation?{eventKey:graduation.eventKey,eventVersion:graduation.version}:null,yearEndReady:Boolean(yearEnd),trainingForfeitRequired:!s.development?.trainingUsedSeasons.includes(s.world.seasonKey)};
 }catch(error){domainError(error);}
}

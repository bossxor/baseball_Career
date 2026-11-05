import {randomUUID} from 'node:crypto';
import * as engine from '@playball/engine';
import {overall} from '@playball/rules';
import type {PitchId} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

const fields=new Map<string,readonly string[]>([
 ['CREATE',['name','kind','position','throws','bats','pitchForm','archetype','focus','difficulty','schoolId','seasonYear','secondaryPitch']],
 ['CONFIRM_PLAYER',['careerRevision']],['RESOLVE_FOCUS',['careerRevision','eventKey','eventVersion','command','focus']],
 ['CONFIRM_PRESEASON',['careerRevision']],['ADVANCE',['careerRevision','mode']],
]);
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never{fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):engine.HighSchoolCareer{const c=state.career as engine.HighSchoolCareer|undefined;if(!c||typeof c!=='object'||Array.isArray(c)||!c.world||c.world.leagueKey!==undefined)fail('HIGH_SCHOOL_OWNER_REQUIRED');engine.assertHighSchoolCareerRevision(c,c.revision);return c;}
export function applySchoolCareer(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_SCHOOL_'.length),allowed=fields.get(name),p=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!allowed.includes(k)))fail('INVALID_PAYLOAD');const input=p as Record<string,unknown>;
 let next:engine.HighSchoolCareer,stopReason:string|undefined;
 try{
  if(name==='CREATE'){
   if(Object.keys(state).some(k=>!['schemaVersion','stampCount','creationId','createdWith','nonce'].includes(k))||state.schemaVersion!==1||state.stampCount!==0||state.createdWith!=='M3_SHELL'||typeof state.nonce!=='string'||!state.nonce)fail('EMPTY_CAREER_SAVE_REQUIRED');
   if(!['HITTER','PITCHER'].includes(String(input.kind))||!['GROWTH','REALISTIC','SECRET_CHEAT'].includes(String(input.difficulty))||!['name','position','throws','bats','archetype','schoolId'].every(k=>typeof input[k]==='string')||!Array.isArray(input.focus)||!input.focus.every(k=>typeof k==='string')||!Number.isSafeInteger(input.seasonYear)|| (input.kind==='HITTER'?(input.pitchForm!==null||input.secondaryPitch!==undefined):typeof input.pitchForm!=='string'||typeof input.secondaryPitch!=='string'))fail('INVALID_PAYLOAD');
   const {schoolId,seasonYear,secondaryPitch,...player}=input,worldKey=JSON.stringify(['career',state.nonce]),seed=randomUUID();
   const world=engine.createHighSchoolWorld({worldKey,seed,schoolId:schoolId as string,seasonYear:seasonYear as number,seasonKey:String(seasonYear),player:{...player,simulationKey:JSON.stringify(['career-player',state.nonce])} as unknown as engine.CreationInput,...(secondaryPitch===undefined?{}:{secondaryPitch:secondaryPitch as PitchId})});
   next=engine.createHighSchoolCareer(world,input.difficulty as engine.HighSchoolCareer['difficulty']);
  }else{
   const c=owner(state),revision=input.careerRevision;if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)fail('INVALID_PAYLOAD');
   if(name==='CONFIRM_PLAYER')next=engine.confirmCareerPlayer(c,revision);
   else if(name==='RESOLVE_FOCUS'){
    if(typeof input.eventKey!=='string'||typeof input.eventVersion!=='number'||!Number.isSafeInteger(input.eventVersion)||input.eventVersion<1||!['KEEP_FOCUS','CHOOSE_FOCUS'].includes(String(input.command))||(input.focus!==undefined&&(!Array.isArray(input.focus)||!input.focus.every(k=>typeof k==='string'))))fail('INVALID_PAYLOAD');
    if(input.command==='KEEP_FOCUS'&&input.focus!==undefined)fail('INVALID_PAYLOAD');
    next=engine.resolveCareerFocusEvent(c,revision,input as unknown as Parameters<typeof engine.resolveCareerFocusEvent>[2]);
   }else if(name==='CONFIRM_PRESEASON')next=engine.confirmCareerPreseason(c,revision);
   else {if(!['NEXT_MAJOR_EVENT','ONE_GAME','ONE_WEEK'].includes(String(input.mode)))fail('INVALID_PAYLOAD');const result=engine.advanceHighSchoolCareer(c,revision,input.mode as engine.HighSchoolAdvancePlan['mode']);next=result.career;stopReason=result.stopReason;}
  }
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next!},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase,name:next!.world.players[next!.world.protagonistKey]!.name,seasonKey:next!.world.seasonKey,...(stopReason?{stopReason}:{})}};
}
export function schoolCareerScreen(state:SaveState){
 try{const c=owner(state),p=c.world.players[c.world.protagonistKey]!,phase=c.phaseContext,event=phase.phase==='EVENT_DECISION'?c.events.find(e=>e.eventKey===phase.eventKey&&e.status==='OPEN'):undefined;
  return {careerRevision:c.revision,phase:phase.phase,seasonKey:c.world.seasonKey,player:{name:p.name,kind:p.kind,position:p.position,age:p.age,abilities:p.abilities,overall:overall(p.kind,p.abilities).display},school:c.world.schools.find(s=>s.id===c.world.protagonistSchoolId)?.name,teamGames:Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,c.world.protagonistSchoolId)).length,event:event?{definitionId:event.definitionId,eventKey:event.eventKey,eventVersion:event.version}:null};
 }catch(error){domainError(error);}
}

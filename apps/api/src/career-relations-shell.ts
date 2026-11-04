import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

type Career=engine.HighSchoolCareer|engine.KboCareer;
const isKbo=(c:Career):c is engine.KboCareer=>'protagonistClubId'in c;
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):Career {
 const c=state.career;if(!c||typeof c!=='object'||Array.isArray(c))fail('CAREER_NOT_FOUND');
 if('mode'in c&&c.mode==='US_CAREER')fail('US_RELATION_HISTORY_REQUIRED');
 return c as Career;
}
export function applyRelationChoice(state:SaveState,command:CommandBody):AppliedCommand {
 if(command.type!=='CAREER_RELATIONS_RESOLVE')fail('UNSUPPORTED_COMMAND');const raw=command.payload;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>!['careerRevision','eventKey','eventVersion','command'].includes(key)))fail('INVALID_PAYLOAD');const p=raw as Record<string,unknown>;
 if(typeof p.careerRevision!=='number'||!Number.isSafeInteger(p.careerRevision)||p.careerRevision<1||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1||typeof p.eventKey!=='string'||!p.eventKey||p.command!=='OPEN_RELATIONS')fail('INVALID_PAYLOAD');
 const c=owner(state);
 try{
  const input={eventKey:p.eventKey,eventVersion:p.eventVersion,command:p.command},result=isKbo(c)?engine.resolveKboRelationNotice(c,p.careerRevision,input):engine.resolveCareerRelationNotice(c,p.careerRevision,input);
  return {nextState:{...state,career:result.career},phase:result.career.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:result.career.revision,navigation:result.navigation}};
 }catch(error){domainError(error);}
}
export function relationScreen(state:SaveState,screenId:'CAREER_RELATIONS'|'CAREER_RELATION_DETAIL',query:Record<string,string|undefined>={}){
 if(Object.keys(query).some(key=>!['relationKey','leagueKey','phase','seasonKey'].includes(key)))fail('INVALID_PAYLOAD');
 if(screenId==='CAREER_RELATIONS'&&Object.keys(query).length)fail('INVALID_PAYLOAD');const c=owner(state);
 try{
  if(isKbo(c))engine.assertKboCareerRevision(c,c.revision);else engine.assertSchoolCareerRevision(c,c.revision);
  if(screenId==='CAREER_RELATIONS'){
   const relations=isKbo(c)?engine.kboRelationshipListView(c):engine.careerRelationshipListView(c),notices=isKbo(c)?engine.unreadKboRelationNotices(c):engine.unreadRelationNotices(c);
   return {careerRevision:c.revision,relations,notices:notices.map(n=>({...n,commands:['OPEN_RELATIONS']}))};
  }
  if(!query.relationKey||query.leagueKey!==undefined&&!query.leagueKey||query.seasonKey!==undefined&&!/^\d{4}$/.test(query.seasonKey)||query.phase!==undefined&&!['REGULAR','POSTSEASON','INTERNATIONAL'].includes(query.phase))fail('INVALID_PAYLOAD');
  const league=query.leagueKey??(isKbo(c)?c.registration.competitionKey??(c.registration.firstTeam?'KBO':'FUTURES'):c.world.leagueKey??'HS'),scope:engine.RelationScope={leagueKey:league,phase:(query.phase??'REGULAR') as engine.RelationScope['phase'],...(query.seasonKey!==undefined?{seasonKey:query.seasonKey}:{})};
  const detail=isKbo(c)?engine.kboRelationDetailView(c,query.relationKey,scope):engine.careerRelationDetailView(c,query.relationKey,scope);return {careerRevision:c.revision,scope,detail};
 }catch(error){domainError(error);}
}

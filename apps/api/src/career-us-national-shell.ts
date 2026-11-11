import * as engine from '@playball/engine';
import {nationalResultLines,nationalEventCommands,nationalEventLabels,nationalTournamentNames} from './career-pro-national-shell.js';
import {spanDeadline} from './span-budget.js';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

const PREFIX='CAREER_US_NATIONAL_';
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function owner(state:SaveState):engine.UsCareer|null{
 const c=state.career;
 return c&&typeof c==='object'&&'mode' in c&&c.mode==='US_CAREER'?c as engine.UsCareer:null;
}
function hostOf(state:SaveState){
 const host=state.collegeNationalHost;
 return engine.isCollegeLeagueHost(host)?host:null;
}
const open=(c:engine.UsCareer)=>c.events.find(e=>e.status==='OPEN'&&e.seasonKey===c.world.seasonKey&&e.evidence.fields.playerSimulationKey===c.protagonistKey&&Object.hasOwn(nationalEventCommands,e.definitionId));
const bracket=(c:engine.UsCareer)=>{
 const phase=c.phaseContext;
 return phase.phase==='INTERNATIONAL_PROGRESS'||phase.phase==='INTERNATIONAL_REVIEW'?c.national?.brackets?.find(b=>b.competitionId===phase.competitionId):undefined;
};
function windowFor(c:engine.UsCareer,host:engine.CollegeLeagueHost|null){
 const phase=c.phaseContext;
 for(const slot of c.world.calendar.international){
  if(slot.type==='P12'||c.national?.brackets?.some(b=>b.seasonKey===c.world.seasonKey&&b.tournament===slot.type)||host?.national.brackets?.some(b=>b.seasonKey===c.world.seasonKey&&b.tournament===slot.type))continue;
  const selected=c.national?.selections?.some(s=>s.seasonKey===c.world.seasonKey&&s.tournament===slot.type);
  if(slot.type==='WBC'){
   if(phase.phase==='PRESEASON_SETUP'&&!c.preseasonPlan&&!c.season&&c.world.calendar.version==='calendar-2'&&host?.game.world.calendar.version!=='calendar-1')return {slot,selected,day:slot.startDay-7,stopDay:null};
   continue;
  }
  if(phase.phase!=='SEASON_PROGRESS'||phase.nextWorldDay>slot.startDay)continue;
  const cursor=phase.nextWorldDay+(phase.pendingGame?1:0);
  if(!selected&&cursor>slot.startDay-1)continue;
  const day=selected?slot.startDay:Math.max(slot.startDay-6,cursor);
  return {slot,selected,day,stopDay:day};
 }
 return null;
}

export function usNationalDayBudget(state:SaveState,c:engine.UsCareer,maxDays:number):number{
 const p=c.phaseContext,window=windowFor(c,hostOf(state));
 if(!window||p.phase!=='SEASON_PROGRESS')return maxDays;
 if(c.national?.invitations.some(i=>i.status==='INVITED'&&i.seasonKey===c.world.seasonKey)||p.nextWorldDay===window.day)fail('NATIONAL_DECISION_REQUIRED');
 return Math.min(maxDays,window.day-p.nextWorldDay);
}
function hostReady(host:engine.CollegeLeagueHost,c:engine.UsCareer,stopDay:number|null):boolean{
 const game=host.game;
 return game.world.seasonKey===c.world.seasonKey&&(stopDay===null?game.phase==='PRESEASON_SETUP':game.phase==='SEASON_PROGRESS'&&game.progress?.nextWorldDay===stopDay&&!game.progress.pendingGame);
}
function selectionDay(c:engine.UsCareer,fallback:number):number{
 const phase=c.phaseContext;
 return phase.phase==='SEASON_PROGRESS'||phase.phase==='INTERNATIONAL_PROGRESS'||phase.phase==='INTERNATIONAL_REVIEW'?phase.nextWorldDay-1:fallback;
}

export function applyUsNational(state:SaveState,body:CommandBody):AppliedCommand {
 const c=owner(state),raw=body.payload,name=body.type.slice(PREFIX.length);
 if(!c)fail('US_CAREER_REQUIRED');
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,rev=p.careerRevision,allowed=name==='RESOLVE'?['eventKey','eventVersion','command']:['HOST_ADVANCE','SELECT','START','RETURN'].includes(name)?['hostRevision']:[];
 if(typeof rev!=='number'||!Number.isSafeInteger(rev)||rev<1||Object.keys(p).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 const oldHost=hostOf(state),e=open(c),window=windowFor(c,oldHost);
 let host=oldHost,next=c,stopReason:string|undefined;
 try{
  engine.assertUsCareerRevision(c,rev);engine.assertUsMilitaryPlayable(c);
  if(allowed.includes('hostRevision')&&(!host||p.hostRevision!==host.revision))fail('STALE_NATIONAL_CAREER_SOURCE');
  switch(name){
   case 'HOST_CREATE':{
    if(state.collegeNationalHost!==undefined||!window||e)fail('NATIONAL_HOST_NOT_AVAILABLE');
    const history=c.amateurHistory,origin=[...(history.previousSeasons??[]).map(s=>s.world),history.world].find(w=>w.leagueKey===undefined&&w.worldKey===c.world.worldKey&&w.seed===c.world.seed&&w.protagonistKey===c.protagonistKey);
    if(!origin)fail('NATIONAL_US_ORIGIN_MISMATCH');
    host=engine.createNpcLeagueHost(engine.usNationalNpcOwner(c),Number(origin.seasonKey),'calendar-2');break;
   }
   case 'HOST_ADVANCE':{
    if(!window||!host||e)fail('NATIONAL_HOST_NOT_AVAILABLE');
    const deadline=spanDeadline(),authority=engine.usNationalNpcOwner(c);
    do {
     const result=engine.advanceNpcLeagueHost(host,host.revision,authority,{seasonKey:c.world.seasonKey,stopDay:window.stopDay});
     host=result.host;stopReason=result.stopReason;
    }while(['CHUNK_LIMIT','DAY_CLOSED','HEALTH_CHANGE','STARTED','POSTSEASON_STARTED','SEASON_REVIEW','YEAR_CLOSED','NEXT_YEAR'].includes(stopReason)&&Date.now()<deadline);
    break;
   }
   case 'SELECT':
   case 'START':{
    const phase=c.phaseContext;
    if(!window||!host||e||!hostReady(host,c,window.stopDay)||(phase.phase==='SEASON_PROGRESS'&&(phase.pendingGame||phase.nextWorldDay!==window.day))||Boolean(window.selected)!==(name==='START'))fail('NATIONAL_CALENDAR_NOT_READY');
    const sources={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,kbo:host,kboRevision:host.revision,us:c,usRevision:rev,recordProjectionRevision:Math.max(host.game.records.revision,c.records.revision)};
    next=name==='SELECT'?engine.openUsNationalSelection(c,rev,sources,window.slot.type,selectionDay(c,window.day)):engine.startUsNationalTournament(c,rev,sources,window.slot.type);
    break;
   }
   case 'RESOLVE':{
    if(!e||p.eventKey!==e.eventKey||p.eventVersion!==e.version||typeof p.command!=='string'||!nationalEventCommands[e.definitionId]?.includes(p.command)||e.definitionId==='E48')fail('INVALID_NATIONAL_EVENT');
    next=e.definitionId==='E47'?engine.confirmUsNationalEligibility(c,rev,String(e.evidence.fields.competitionId)):
     engine.resolveUsNationalEvent(c,rev,{eventKey:e.eventKey,eventVersion:e.version,command:p.command,worldDay:selectionDay(c,e.occurredWorldDay)}).career;
    break;
   }
   case 'ADVANCE':{
    if(e||c.phaseContext.phase!=='INTERNATIONAL_PROGRESS')fail('NATIONAL_TOURNAMENT_NOT_OPEN');
    const deadline=spanDeadline();
    do {
     const active=bracket(next),phase=next.phaseContext;
     if(!active||phase.phase!=='INTERNATIONAL_PROGRESS')fail('NATIONAL_TOURNAMENT_NOT_OPEN');
     if(!active.pendingGame&&engine.nextNationalMatch(active)?.day!==phase.nextWorldDay){next=engine.closeUsNationalDay(next,next.revision,phase.nextWorldDay);continue;}
     const prepared:engine.UsCareer=active.pendingGame?next:engine.prepareUsNationalMatch(next,next.revision);
     const result=engine.advanceUsNationalMatch(prepared,prepared.revision);
     next=result.career;stopReason=result.stopReason;
     if(stopReason==='ENGINE_LIMIT')break;
    }while(next.phaseContext.phase==='INTERNATIONAL_PROGRESS'&&!open(next)&&Date.now()<deadline);
    break;
   }
   case 'RETURN':{
    if(!host||e?.definitionId!=='E48')fail('NATIONAL_RETURN_NOT_READY');
    const result=engine.returnUsNationalTournament(c,rev,host,host.revision);
    host=result.host;next=result.career;break;
   }
   case 'ATHLETE_SERVICE':next=engine.confirmUsAthleteService(c,rev);break;
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
 const phase=next.phaseContext.phase;
 return {nextState:{...state,career:next,...(host?{collegeNationalHost:host}:{})},phase,eventIds:next.events.slice(c.events.length).map(event=>event.definitionId),summary:{type:body.type,careerRevision:next.revision,phase,...(host?{hostRevision:host.revision}:{}),...(stopReason?{stopReason}:{})}};
}

export function usNationalFlow(state:SaveState):FlowScreen|null{
 const c=owner(state);
 if(!c||['ARCHIVED','RETIRE_CONFIRM','EVENT_DECISION'].includes(c.phaseContext.phase))return null;
 try{engine.assertUsMilitaryPlayable(c);}catch{return null;}
 const host=hostOf(state),e=open(c),b=bracket(c),lines:FlowScreen['lines']=[];
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:PREFIX+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[]):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice:null,careerRevision:c.revision});
 if(e){
  const id=e.evidence.fields.competitionId,result=c.national?.competitions.find(r=>r.competitionId===id);
  const selected=c.national?.selections?.find(s=>s.selectionId===id||s.selectionId===c.national?.invitations.find(i=>i.selectionId===id)?.selectionSnapshotId);
  if(result)lines.push(...nationalResultLines(c,result,Boolean(c.national?.benefits.some(x=>x.competitionId===id))));
  else if(selected||b)lines.push({label:'대회',value:nationalTournamentNames[(selected?.tournament??b?.tournament)!]});
  const score=selected?.scores.find(s=>s.playerKey===c.protagonistKey),pool=score?selected?.scores.filter(s=>s.position===score.position):undefined;
  if(pool&&score)lines.push({label:'포지션 평가 순위',value:score.position+' '+(pool.indexOf(score)+1)+'위 / '+pool.length+'명'});
  if(e.definitionId==='E55'&&c.national?.athleteDutySeasonsRemaining!==undefined)lines.push({label:'남은 활동 의무',value:c.national.athleteDutySeasonsRemaining+'시즌'});
  const title=engine.eventDefinition(e.definitionId).title;
  if(e.definitionId==='E48')return out(title,host?[cmd('national-return','원소속 복귀','RETURN',{hostRevision:host.revision})]:[]);
  return out(title,(nationalEventCommands[e.definitionId]??[]).filter(command=>e.offeredChoices.includes(command)||e.definitionId==='E47').map(command=>cmd(command,nationalEventLabels[command]??command,'RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command},command==='DECLINE_NATIONAL'?'이번 대회 참가를 사양할까요?':undefined)));
 }
 if(b&&c.phaseContext.phase==='INTERNATIONAL_PROGRESS'){
  lines.push({label:'대회',value:nationalTournamentNames[b.tournament]},{label:'완료 경기',value:String(b.results.length)});
  return out('대표팀 대회',[cmd('national-advance','대회 이어서 진행','ADVANCE')]);
 }
 const window=windowFor(c,host),phase=c.phaseContext;
 if(window&&(phase.phase==='PRESEASON_SETUP'||phase.phase==='SEASON_PROGRESS'&&!phase.pendingGame&&phase.nextWorldDay===window.day)){
  lines.push({label:'대회',value:nationalTournamentNames[window.slot.type]});
  if(!host)return out('국가대표 선발 준비',[cmd('national-host-create','대표팀 선발 준비','HOST_CREATE')]);
  const payload={hostRevision:host.revision};
  if(!hostReady(host,c,window.stopDay))return out('국가대표 선발 준비',[cmd('national-host-advance','KBO 시즌 진행','HOST_ADVANCE',payload)]);
  return window.selected?out('국가대표 대회',[cmd('national-start','대회 시작','START',payload)]):out('국가대표 선발',[cmd('national-select','대표팀 명단 확인','SELECT',payload)]);
 }
 if(phase.phase==='SEASON_REVIEW'&&c.military.status==='ATHLETE_ELIGIBLE'&&c.national?.benefits.length&&!c.events.some(e=>e.status==='OPEN'&&(e.definitionId==='E47'||e.definitionId==='E48')))
  return out('체육요원 활동',[cmd('national-athlete','체육요원 활동 시작','ATHLETE_SERVICE',{},'다음 시즌부터 3시즌의 활동 의무를 시작할까요?')]);
 return null;
}

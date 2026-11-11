import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';
import {spanDeadline} from './span-budget.js';

const PREFIX='CAREER_KBO_NATIONAL_';
const tournaments={WBC:'월드 베이스볼 클래식',OLY:'올림픽',AG:'아시안게임',P12:'프리미어12'} as const;
const medals={GOLD:'금메달',SILVER:'은메달',BRONZE:'동메달'} as const;
const eventIds=['E44','E45','E46','E47','E48','E55'];
const eventCommands:Record<string,readonly string[]>={E44:['ACCEPT_NATIONAL','DECLINE_NATIONAL'],E45:['ACK_EVENT'],E46:['ACK_EVENT'],E47:['CONFIRM_SERVICE_ELIGIBILITY'],E48:['CONFIRM_NATIONAL_RETURN'],E55:['ACK_SERVICE_OBLIGATION']};
const labels:Record<string,string>={ACCEPT_NATIONAL:'참가',DECLINE_NATIONAL:'사양',ACK_EVENT:'확인하고 계속',ACK_SERVICE_OBLIGATION:'남은 의무 확인',CONFIRM_SERVICE_ELIGIBILITY:'체육요원 자격 확인',CONFIRM_NATIONAL_RETURN:'원소속 복귀'};
function fail(code:string):never{throw Object.assign(new Error(code),{code});}

function kboOwner(state:SaveState):engine.KboCareer|null {
 const c=state.career as engine.KboCareer|undefined;
 return c&&typeof c==='object'&&typeof c.protagonistClubId==='string'&&Array.isArray(c.world?.clubs)?c:null;
}
const selection=(c:engine.KboCareer,tournament:engine.NationalTournament)=>c.national?.selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament);
const started=(c:engine.KboCareer,tournament:engine.NationalTournament)=>c.national?.brackets?.some(b=>b.seasonKey===c.world.seasonKey&&b.tournament===tournament)||c.national?.competitions.some(r=>r.seasonKey===c.world.seasonKey&&r.tournament===tournament);
const openEvent=(c:engine.KboCareer)=>c.events.find(e=>e.status==='OPEN'&&eventIds.includes(e.definitionId)&&e.seasonKey===c.world.seasonKey&&e.evidence.fields.playerSimulationKey===c.protagonistKey);

function nationalBoundary(c:engine.KboCareer){
 const phase=c.phaseContext;
 for(const slot of c.world.calendar.international){
  // P12 needs both leagues' actual postseason end evidence from the same world.
  if(slot.type==='P12'||started(c,slot.type))continue;
  const selected=selection(c,slot.type);
  if(slot.type==='WBC'){
   if(phase.phase==='PRESEASON_SETUP'&&c.world.calendar.version==='calendar-2'&&!c.preseasonPlan&&!c.openingRoster)return {...slot,action:selected?'START':'SELECT',day:slot.startDay};
   continue;
  }
  if(phase.phase!=='SEASON_PROGRESS'||phase.nextWorldDay>slot.startDay)continue;
  const nextOpenDay=phase.nextWorldDay+(phase.pendingGame?1:0);
  if(!selected&&nextOpenDay>slot.startDay-2)continue;
  const day=selected?slot.startDay:Math.max(nextOpenDay,slot.startDay-7);
  return {...slot,action:selected?'START':'SELECT',day};
 }
 return null;
}

/** Cap the domestic worker at invitation/start dates so season spans cannot skip either decision. */
export function advanceKboToNationalBoundary(c:engine.KboCareer,revision:number,maxDays:number):ReturnType<typeof engine.advanceKboCareer>{
 const boundary=nationalBoundary(c),phase=c.phaseContext;
 if(!boundary||phase.phase!=='SEASON_PROGRESS')return engine.advanceKboCareer(c,revision,maxDays);
 const remaining=boundary.day-phase.nextWorldDay;
 if(remaining===0)fail('NATIONAL_DECISION_REQUIRED');
 const result=engine.advanceKboCareer(c,revision,Math.min(maxDays,remaining));
 if(result.career.phaseContext.phase==='SEASON_PROGRESS'&&result.career.phaseContext.nextWorldDay===boundary.day&&result.stopReason==='DAY_CLOSED')return {...result,stopReason:'MAJOR_EVENT'};
 return result;
}

function activeBracket(c:engine.KboCareer){
 const p=c.phaseContext;
 return p.phase==='INTERNATIONAL_PROGRESS'||p.phase==='INTERNATIONAL_REVIEW'?c.national?.brackets?.find(b=>b.competitionId===p.competitionId):undefined;
}

export function applyKboNational(state:SaveState,body:CommandBody):AppliedCommand {
 const c=kboOwner(state),raw=body.payload,name=body.type.slice(PREFIX.length);
 if(!c)fail('KBO_CAREER_REQUIRED');
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,rev=p.careerRevision,allowed=name==='RESOLVE'?['eventKey','eventVersion','command']:name==='START'||name==='SELECT'?['tournament']:[];
 if(typeof rev!=='number'||!Number.isSafeInteger(rev)||rev<1||Object.keys(p).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 if(rev!==c.revision)fail('CAREER_REVISION_CHANGED');
 let next:engine.KboCareer;
 let stopReason:string|undefined;
 try{
  switch(name){
   case 'SELECT':
   case 'START':{
    const boundary=nationalBoundary(c),phase=c.phaseContext;
    if(typeof p.tournament!=='string'||!Object.hasOwn(tournaments,p.tournament))fail('INVALID_PAYLOAD');
    if(!boundary||boundary.action!==name||boundary.type!==p.tournament||openEvent(c)||phase.phase==='SEASON_PROGRESS'&&(phase.pendingGame||phase.nextWorldDay!==boundary.day))fail('NATIONAL_CALENDAR_NOT_READY');
    next=name==='SELECT'?engine.openKboNationalSelection(c,rev,boundary.type):engine.startNationalTournament(c,rev,boundary.type);
    break;
   }
   case 'RESOLVE':{
    if(typeof p.eventKey!=='string'||typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1||typeof p.command!=='string')fail('INVALID_PAYLOAD');
    const e=openEvent(c);
    if(!e||e.eventKey!==p.eventKey||e.version!==p.eventVersion||!eventCommands[e.definitionId]?.includes(p.command))fail('INVALID_NATIONAL_EVENT');
    next=e.definitionId==='E47'?engine.confirmNationalEligibility(c,rev,String(e.evidence.fields.competitionId)):engine.resolveKboNationalEvent(c,rev,{eventKey:p.eventKey,eventVersion:p.eventVersion,command:p.command}).career;
    break;
   }
   case 'ADVANCE':{
    if(c.phaseContext.phase!=='INTERNATIONAL_PROGRESS'||openEvent(c))fail('NATIONAL_TOURNAMENT_NOT_OPEN');
    const deadline=spanDeadline();
    next=c;
    do {
     const phase=next.phaseContext,b=activeBracket(next);
     if(!b||phase.phase!=='INTERNATIONAL_PROGRESS')fail('NATIONAL_TOURNAMENT_NOT_OPEN');
     if(!b.pendingGame&&engine.nextNationalMatch(b)?.day!==phase.nextWorldDay){
      next=engine.closeCareerNationalDay(next,next.revision,phase.nextWorldDay);
      continue;
     }
     const prepared:engine.KboCareer=b.pendingGame?next:engine.prepareCareerNationalMatch(next,next.revision);
     const result=engine.advanceCareerNationalMatch(prepared,prepared.revision);
     next=result.career;
     stopReason=result.stopReason;
     if(stopReason==='ENGINE_LIMIT')break;
    }while(next.phaseContext.phase==='INTERNATIONAL_PROGRESS'&&!openEvent(next)&&Date.now()<deadline);
    break;
   }
   case 'ATHLETE_SERVICE':next=engine.confirmAthleteService(c,rev);break;
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){
  fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');
 }
 const phase=next.phaseContext.phase;
 return {nextState:{...state,career:next},phase,summary:{type:body.type,careerRevision:next.revision,phase,...(stopReason?{stopReason}:{})},eventIds:next.events.slice(c.events.length).map(e=>e.definitionId)};
}

function resultLines(c:engine.KboCareer|engine.UsCareer,result:engine.NationalCompetitionResult,eligible:boolean):FlowScreen['lines']{
 const lines:FlowScreen['lines']=[];
 if(result.officialAppearance&&result.gameKeys){
  const official=result.gameKeys.map(key=>c.records.games[key]);
  const pitching=official.flatMap(row=>{const line=row?.pitching[c.protagonistKey];return line?.BF?[line]:[];});
  const batting=official.flatMap(row=>{const line=row?.batting[c.protagonistKey];return line?.PA?[line]:[];});
  if(pitching.length){
   const outs=pitching.reduce((total,line)=>total+line.outs,0);
   lines.push({label:'개인 투구',value:pitching.length+'경기 · '+Math.floor(outs/3)+(outs%3?' '+outs%3+'/3':'')+'이닝 · '+pitching.reduce((total,line)=>total+line.K,0)+'탈삼진'});
  }else if(batting.length){
   const atBats=batting.reduce((total,line)=>total+line.AB,0),hits=batting.reduce((total,line)=>total+line.H,0);
   lines.push({label:'개인 타격',value:batting.length+'경기 · '+(atBats?'타율 '+(hits/atBats).toFixed(3)+' · ':'')+batting.reduce((total,line)=>total+line.HR,0)+'홈런'});
  }
 }
 return [{label:'대회',value:tournaments[result.tournament]},{label:'팀 최종 순위',value:result.finalRank+'위'},
  ...(result.medal?[{label:'팀 메달',value:medals[result.medal]}]:[]),
  {label:'본인 출장',value:result.officialAppearance?'공식 출장':result.registered?'등록 · 미출장':'미등록'},...lines,
  ...(eligible?[{label:'병역',value:'체육요원 자격 획득'}]:[])];
}

export function proNationalFlow(state:SaveState):FlowScreen|null {
 const c=kboOwner(state);
 if(!c||c.retryPro||['ARCHIVED','RETIRE_CONFIRM','EVENT_DECISION'].includes(c.phaseContext.phase))return null;
 const lines:FlowScreen['lines']=[];
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:PREFIX+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[]):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice:null,careerRevision:c.revision});
 const e=openEvent(c),bracket=activeBracket(c);
 if(e){
  const id=e.evidence.fields.competitionId,invitation=c.national?.invitations.find(i=>i.selectionId===id);
  const result=c.national?.competitions.find(r=>r.competitionId===id);
  const tournament=invitation?.tournament??c.national?.selections?.find(s=>s.selectionId===id)?.tournament??bracket?.tournament;
  if(result)lines.push(...resultLines(c,result,Boolean(c.national?.benefits.some(b=>b.competitionId===id))));
  else if(tournament){
   lines.push({label:'대회',value:tournaments[tournament]});
   const view=engine.kboNationalSelectionView(c,tournament)?.protagonist;
   if(view){
    const selected=selection(c,tournament),pool=selected?.scores.filter(row=>row.position===view.position);
    const rank=pool?.findIndex(row=>row.playerKey===c.protagonistKey)??-1;
    if(rank>=0)lines.push({label:'포지션 평가 순위',value:view.position+' '+(rank+1)+'위 / '+pool!.length+'명'});
    if(view.role)lines.push({label:'선발 역할',value:view.role});
   }
   if(invitation)lines.push({label:'참가',value:'출장과 메달은 대회에서 결정됩니다.'});
  }
  if(e.definitionId==='E55'&&c.national?.athleteDutySeasonsRemaining!==undefined)lines.push({label:'남은 활동 의무',value:c.national.athleteDutySeasonsRemaining+'시즌'});
  const definition=engine.eventDefinition(e.definitionId);
  return out(definition.title,(eventCommands[e.definitionId]??[]).filter(command=>e.offeredChoices.includes(command)||e.definitionId==='E47').map(command=>cmd(command,labels[command]??command,'RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command},command==='DECLINE_NATIONAL'?'이번 대회 참가를 사양할까요?':undefined)));
 }
 if(bracket&&c.phaseContext.phase==='INTERNATIONAL_PROGRESS'){
  lines.push({label:'대회',value:tournaments[bracket.tournament]},{label:'완료 경기',value:String(bracket.results.length)},{label:'진행',value:(c.phaseContext.nextWorldDay-bracket.window.startDay+1)+'일차'});
  return out('대표팀 대회',[cmd('national-advance','대회 이어서 진행','ADVANCE')]);
 }
 const boundary=nationalBoundary(c);
 if(boundary&&(c.phaseContext.phase==='PRESEASON_SETUP'||c.phaseContext.phase==='SEASON_PROGRESS'&&!c.phaseContext.pendingGame&&boundary.day===c.phaseContext.nextWorldDay)){
  lines.push({label:'대회',value:tournaments[boundary.type]});
  return boundary.action==='SELECT'?out('대표팀 선발',[cmd('national-select','대표팀 명단 확인','SELECT',{tournament:boundary.type})]):out('대표팀 대회',[cmd('national-start','대회 시작','START',{tournament:boundary.type})]);
 }
 if(c.phaseContext.phase==='SEASON_REVIEW'&&c.military?.status==='ATHLETE_ELIGIBLE'&&c.national?.benefits.length)
  return out('체육요원 활동',[cmd('national-athlete','체육요원 활동 시작','ATHLETE_SERVICE',{},'다음 시즌부터 3시즌의 활동 의무를 시작할까요?')]);
 return null;
}

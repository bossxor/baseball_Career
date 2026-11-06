import * as engine from '@playball/engine';
import {ABILITY_LABELS,abilityKeys} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

/** Thin owned dispatch for the KBO pro season loop. The engine decides every rule; the flow below only reflects its previews/readiness. */
const fields=new Map<string,readonly string[]>([
 ['RESOLVE_CAMP',['eventKey','eventVersion']],['CONFIRM_PRESEASON',[]],['CONFIRM_ROSTER',[]],['CONFIRM_SCHEDULE',[]],['START',[]],
 ['ADVANCE',['maxDays']],['WINDOW',['eventKey','eventVersion','command']],['TRAIN',['choice']],
 ['START_POSTSEASON',[]],['ADVANCE_POSTSEASON',[]],['SETTLE_GROWTH',[]],['CLOSE_SEASON',['forfeitUnusedTraining']],['NEXT_YEAR',[]],
]);
const WINDOW_COMMANDS=['OPEN_TRAINING','DEFER_TRAINING','FORFEIT_TRAINING','ACK_EVENT'];
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never{fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
const int=(p:Record<string,unknown>,k:string,min=0)=>{const v=p[k];if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min)fail('INVALID_PAYLOAD');return v;};
const str=(p:Record<string,unknown>,k:string)=>{const v=p[k];if(typeof v!=='string'||!v)fail('INVALID_PAYLOAD');return v;};
function choice(v:unknown):engine.TrainingChoice{
 if(!v||typeof v!=='object'||Array.isArray(v))fail('INVALID_PAYLOAD');
 const o=v as Record<string,unknown>,n=Object.keys(o).length;
 if((o.type==='GUARANTEED'||o.type==='CHALLENGE')&&typeof o.ability==='string'&&n===2)return {type:o.type,ability:o.ability};
 if((o.type==='CONDITIONING'||o.type==='SKIP')&&n===1)return {type:o.type};
 return fail('INVALID_PAYLOAD');
}
export function applyKboPlay(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_KBO_PLAY_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>k!=='careerRevision'&&!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,c=state.career as engine.KboCareer|undefined;
 if(!c||typeof c!=='object'||Array.isArray(c)||typeof c.protagonistClubId!=='string')fail('KBO_CAREER_REQUIRED');
 const rev=int(p,'careerRevision',1);let next:engine.KboCareer,stopReason:string|undefined;
 try{
  switch(name){
   case 'RESOLVE_CAMP':next=engine.resolveKboFirstCampNotice(c,rev,{eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion',1),command:'KEEP_FOCUS'});break;
   case 'CONFIRM_PRESEASON':next=engine.confirmKboPreseasonPlan(c,rev);break;
   case 'CONFIRM_ROSTER':next=engine.confirmKboOpeningRoster(c,rev);break;
   case 'CONFIRM_SCHEDULE':next=engine.confirmKboSeasonSchedule(c,rev);break;
   case 'START':next=engine.startKboRegularSeason(c,rev);break;
   case 'ADVANCE':{const d=int(p,'maxDays',1);if(d>7)fail('INVALID_PAYLOAD');const r=engine.advanceKboCareer(c,rev,d);next=r.career;stopReason=r.stopReason;break;}
   case 'WINDOW':{const cmd=str(p,'command');if(!WINDOW_COMMANDS.includes(cmd))fail('INVALID_PAYLOAD');next=engine.resolveKboWindowEvent(c,rev,{eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion',1),command:cmd}).career;break;}
   case 'TRAIN':next=engine.trainKboCareer(c,rev,choice(p.choice));break;
   case 'SETTLE_GROWTH':next=engine.settleKboSeasonGrowth(c,rev).career;break;
   case 'START_POSTSEASON':next=engine.startKboPostseason(c,rev);break;
   case 'ADVANCE_POSTSEASON':{const r=engine.advanceKboPostseason(c,rev);next=r.career;stopReason=r.stopReason;break;}
   case 'CLOSE_SEASON':{if(typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');next=engine.closeKboSeason(c,rev,p.forfeitUnusedTraining);break;}
   default:next=engine.startNextKboSeason(c,rev);
  }
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next!},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase,...(stopReason?{stopReason}:{})}};
}

const LABELS:Record<string,string>={ACK_EVENT:'확인하고 계속',OPEN_TRAINING:'훈련 창 열기',DEFER_TRAINING:'나중에 하기',FORFEIT_TRAINING:'이번 시즌 훈련 포기'};
/** Returns null when the pro-season loop does not apply (retry shell / contract decision / unsupported stage), so the caller falls back. */
export function kboPlayFlow(c:engine.KboCareer):FlowScreen|null{
 const p=c.world.players[c.protagonistKey];if(!p||c.retryPro)return null;
 const phase=c.phaseContext,lines:{label:string;value:string}[]=[{label:'선수',value:`${p.name} · ${p.age}세`},{label:'시즌',value:c.world.seasonKey}];
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:'CAREER_KBO_PLAY_'+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 if(phase.phase==='PRESEASON_SETUP'){
  let notices:ReturnType<typeof engine.unreadKboFirstCampNotices>;try{notices=engine.unreadKboFirstCampNotices(c);}catch{notices=[];}
  if(notices.length)return out('첫 캠프',notices.map(n=>cmd('camp-ack','현재 육성 계획 유지','RESOLVE_CAMP',{eventKey:n.eventKey,eventVersion:n.eventVersion})));
  if(!c.preseasonPlan)return out('시즌 준비',[cmd('preseason','시즌 계획 확정','CONFIRM_PRESEASON')]);
  if(!c.openingRoster)return out('시즌 준비',[cmd('roster','개막 엔트리 확정','CONFIRM_ROSTER')]);
  if(!c.competitionSchedule)return out('시즌 준비',[cmd('schedule','일정 확정','CONFIRM_SCHEDULE')]);
  return out('시즌 준비',[cmd('start','정규시즌 시작','START')]);
 }
 if(phase.phase==='SEASON_PROGRESS'){
  if(c.days)lines.push({label:'진행',value:`${c.days.days.length}일 경과 · 리그 경기 ${Object.keys(c.records.games).length}개 기록`});
  const commands:FlowCommand[]=[];
  if(!phase.pendingGame){
   const choices:engine.TrainingChoice[]=[...abilityKeys(p.kind).map(ability=>({type:'GUARANTEED' as const,ability})),{type:'CONDITIONING'}];
   for(const ch of choices){let ok:boolean;try{ok=engine.previewKboTraining(c,ch).eligible;}catch{ok=false;}
    if(ok)commands.push(cmd('train-'+(ch.type==='GUARANTEED'?ch.ability:'conditioning'),ch.type==='GUARANTEED'?`훈련: ${ABILITY_LABELS[ch.ability as keyof typeof ABILITY_LABELS]} 안정 성장 (피로 +5)`:'훈련: 컨디션 회복 (피로 최대 -20)','TRAIN',{choice:ch}));}
  }
  return out('프로 정규시즌',[...commands,cmd('adv-1','하루 진행','ADVANCE',{maxDays:1}),cmd('adv-3','3일 진행','ADVANCE',{maxDays:3}),cmd('adv-7','일주일 진행','ADVANCE',{maxDays:7})]);
 }
 if(phase.phase==='EVENT_DECISION'){
  const e=c.events.find(x=>x.eventKey===phase.eventKey&&x.status==='OPEN');
  if(e&&phase.resume.phase==='SEASON_PROGRESS'&&['E41','E43'].includes(e.definitionId)){
   const allowed=e.definitionId==='E41'?['ACK_EVENT']:['OPEN_TRAINING','DEFER_TRAINING','FORFEIT_TRAINING'];
   return out(e.definitionId==='E43'?'연간 훈련 창':'시즌 중반 점검',e.offeredChoices.filter(x=>allowed.includes(x)).map(command=>cmd(command.toLowerCase(),LABELS[command]!,'WINDOW',{eventKey:e.eventKey,eventVersion:e.version,command},command==='FORFEIT_TRAINING'?'올해 훈련 기회가 사라집니다. 포기할까요?':undefined)),e.definitionId==='E41'?'스타일 변경은 아직 웹에서 지원하지 않습니다.':null);
  }
  return null;
 }
 if(phase.phase==='POSTSEASON_PROGRESS')return out('포스트시즌',[cmd('post-advance','포스트시즌 진행','ADVANCE_POSTSEASON')]);
 if(phase.phase==='SEASON_REVIEW'&&c.days){
  const t=engine.kboYearTransitionReadiness(c);
  if(t.ready)return out('시즌 종료',[cmd('next-year','다음 시즌 시작','NEXT_YEAR')],`다음 시즌: ${t.targetSeasonKey}`);
  if(!c.postseason&&!c.seasonClose)return out('정규시즌 종료',[cmd('post-start','포스트시즌 시작','START_POSTSEASON')]);
  if(c.postseason?.championKey&&!c.seasonClose){
   if(!c.seasonGrowth.entries.some(e=>JSON.parse(e.periodKey)[0]==='pro-growth'))return out('시즌 정산',[cmd('settle-growth','시즌 성장 정산','SETTLE_GROWTH')]);
   const forfeit=!c.development.trainingUsedSeasons.includes(c.world.seasonKey);
   return out('시즌 마감',[cmd('close-season',forfeit?'남은 훈련 기회를 포기하고 시즌 마감':'시즌 마감','CLOSE_SEASON',{forfeitUnusedTraining:forfeit},forfeit?'이번 시즌에 쓰지 않은 훈련 기회는 사라집니다. 마감할까요?':undefined)]);
  }
 }
 return null;
}

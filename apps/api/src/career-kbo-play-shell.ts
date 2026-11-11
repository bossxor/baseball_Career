import * as engine from '@playball/engine';
import {spanDeadline,spanStopOf,teamProgress} from './span-budget.js';
import type {SpanStop} from './span-budget.js';
import {ABILITY_LABELS,abilityKeys,KBO_CLUBS} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

/** Thin owned dispatch for the KBO pro season loop. The engine decides every rule; the flow below only reflects its previews/readiness. */
const fields=new Map<string,readonly string[]>([
 ['RESOLVE_CAMP',['eventKey','eventVersion']],['CONFIRM_PRESEASON',[]],['CONFIRM_ROSTER',[]],['CONFIRM_SCHEDULE',[]],['START',[]],
 ['ADVANCE',['maxDays']],['ADVANCE_SPAN',['span']],['WINDOW',['eventKey','eventVersion','command']],['TRAIN',['choice']],
 ['OPEN_CONTRACT_OFFERS',[]],['ACCEPT_RENEWAL',['eventKey','eventVersion','offerKey']],['ACCEPT_OFFSEASON',['eventKey','eventVersion','offerKey']],
 ['SELECT_FA',['eventKey','eventVersion','offerKey']],['ACCEPT_FA',['eventKey','eventVersion','offerKey']],['DECLINE_FA',['eventKey','eventVersion']],
 ['START_POSTSEASON',[]],['ADVANCE_POSTSEASON',[]],['SETTLE_GROWTH',[]],['CLOSE_SEASON',['forfeitUnusedTraining']],['NEXT_YEAR',[]],
 ['MILITARY_OPEN',[]],['MILITARY_PLAN',['eventKey','eventVersion','command']],['MILITARY_RESULT',['command']],['MILITARY_ENLIST',[]],['MILITARY_EVENT',['eventKey','eventVersion','command','focus']],
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
/** Chains the engine's own advances (see the US twin): the engine's stop reasons are the only stop rule. */
function advanceSpan(c:engine.KboCareer,rev:number,span:'SEASON'|'MONTH'){
  const until=spanDeadline();let r=engine.advanceKboCareer(c,rev,7),days=r.daysClosed;
  for(let i=0;i<200_000&&(r.stopReason==='CHUNK_LIMIT'||r.stopReason==='DAY_CLOSED')&&r.career.phaseContext.phase==='SEASON_PROGRESS'&&Date.now()<until&&(span==='SEASON'||days<30);i++){r=engine.advanceKboCareer(r.career,r.career.revision,span==='MONTH'?Math.min(7,30-days):7);days+=r.daysClosed;}
  return {...r,monthDone:span==='MONTH'&&days>=30};
}
export function applyKboPlay(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_KBO_PLAY_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>k!=='careerRevision'&&!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,c=state.career as engine.KboCareer|undefined;
 if(!c||typeof c!=='object'||Array.isArray(c)||typeof c.protagonistClubId!=='string')fail('KBO_CAREER_REQUIRED');
 const rev=int(p,'careerRevision',1);let next:engine.KboCareer,stopReason:string|undefined,spanStop:SpanStop|undefined;
 const event=()=>({eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion',1)});
 const offer=()=>({...event(),offerKey:str(p,'offerKey')});
 try{
  switch(name){
   case 'RESOLVE_CAMP':next=engine.resolveKboFirstCampNotice(c,rev,{eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion',1),command:'KEEP_FOCUS'});break;
   case 'CONFIRM_PRESEASON':next=engine.confirmKboPreseasonPlan(c,rev);break;
   case 'CONFIRM_ROSTER':next=engine.confirmKboOpeningRoster(c,rev);break;
   case 'CONFIRM_SCHEDULE':next=engine.confirmKboSeasonSchedule(c,rev);break;
   case 'START':next=engine.startKboRegularSeason(c,rev);break;
   case 'ADVANCE':{const d=int(p,'maxDays',1);if(d>7)fail('INVALID_PAYLOAD');const r=engine.advanceKboCareer(c,rev,d);next=r.career;stopReason=r.stopReason;break;}
   case 'ADVANCE_SPAN':{if(p.span!=='SEASON'&&p.span!=='MONTH')fail('INVALID_PAYLOAD');const r=advanceSpan(c,rev,p.span);next=r.career;stopReason=r.stopReason;spanStop=spanStopOf(p.span,next.phaseContext.phase,r.stopReason,r.monthDone);break;}
   case 'WINDOW':{const cmd=str(p,'command');if(!WINDOW_COMMANDS.includes(cmd))fail('INVALID_PAYLOAD');next=engine.resolveKboWindowEvent(c,rev,{eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion',1),command:cmd}).career;break;}
   case 'TRAIN':next=engine.trainKboCareer(c,rev,choice(p.choice));break;
   case 'OPEN_CONTRACT_OFFERS':next=engine.kboServiceTimeView(c).registrationThresholds.domesticFa.reached?engine.openKboCareerFa(c,rev):engine.offerKboRenewal(c,rev);break;
   case 'ACCEPT_RENEWAL':next=engine.acceptKboRenewal(c,rev,offer());break;
   case 'ACCEPT_OFFSEASON':next=engine.acceptKboOffseasonOffer(c,rev,offer());break;
   case 'SELECT_FA':next=engine.selectKboCareerFaOffer(c,rev,offer());break;
   case 'ACCEPT_FA':next=engine.acceptKboCareerFaOffer(c,rev,offer());break;
   case 'DECLINE_FA':next=engine.declineKboCareerFaSelection(c,rev,event());break;
   case 'SETTLE_GROWTH':next=engine.settleKboSeasonGrowth(c,rev).career;break;
   case 'START_POSTSEASON':next=engine.startKboPostseason(c,rev);break;
   case 'ADVANCE_POSTSEASON':{const r=engine.advanceKboPostseason(c,rev);next=r.career;stopReason=r.stopReason;break;}
   case 'MILITARY_OPEN':next=engine.openKboMilitaryPlan(c,rev);break;
   case 'MILITARY_PLAN':next=engine.resolveKboMilitaryPlan(c,rev,{...event(),command:str(p,'command')}).career;break;
   case 'MILITARY_RESULT':{const action=str(p,'command');if(!['ENLIST','DECLINE','ACK_REJECTION'].includes(action))fail('INVALID_PAYLOAD');next=engine.resolveSangmuApplication(c,rev,action as 'ENLIST'|'DECLINE'|'ACK_REJECTION');break;}
   case 'MILITARY_ENLIST':next=engine.confirmKboActiveService(c,rev);break;
   case 'MILITARY_EVENT':{const focus=p.focus;if(focus!==undefined&&(!Array.isArray(focus)||!focus.every(x=>typeof x==='string')))fail('INVALID_PAYLOAD');next=engine.resolveKboMilitaryEvent(c,rev,{...event(),command:str(p,'command'),...(focus===undefined?{}:{focus:focus as string[]})});break;}
   case 'CLOSE_SEASON':{if(typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');next=engine.closeKboSeason(c,rev,p.forfeitUnusedTraining);break;}
   default:next=engine.startNextKboSeason(c,rev);
  }
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next!,...(spanStop?{span:{careerRevision:next!.revision,stop:spanStop}}:{})},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase,...(spanStop?{spanStop}:{}),...(stopReason?{stopReason}:{})}};
}

const LABELS:Record<string,string>={ACK_EVENT:'확인하고 계속',OPEN_TRAINING:'훈련 창 열기',DEFER_TRAINING:'나중에 하기',FORFEIT_TRAINING:'이번 시즌 훈련 포기'};
/** Returns null when the pro-season loop does not apply (retry shell / contract decision / unsupported stage), so the caller falls back. */
export function kboPlayFlow(c:engine.KboCareer):FlowScreen|null{
 const p=c.world.players[c.protagonistKey];if(!p||c.retryPro)return null;
 const phase=c.phaseContext,lines:{label:string;value:string}[]=[{label:'선수',value:`${p.name} · ${p.age}세`},{label:'시즌',value:c.world.seasonKey}];
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:'CAREER_KBO_PLAY_'+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 const militaryEvent=engine.kboMilitaryEventView(c)[0];
 if(militaryEvent){
  const actions=militaryEvent.choices.filter(x=>x.command!=='CHOOSE_FOCUS').map(x=>cmd('military-'+x.command,x.label,'MILITARY_EVENT',{eventKey:militaryEvent.eventKey,eventVersion:militaryEvent.eventVersion,command:x.command}));
  if(militaryEvent.focus){const focus=militaryEvent.focus;actions.unshift(cmd('military-focus','현재 육성 계획 확인','MILITARY_EVENT',{eventKey:militaryEvent.eventKey,eventVersion:militaryEvent.eventVersion,command:'CHOOSE_FOCUS',focus}));}
  return out(militaryEvent.title,actions,militaryEvent.body);
 }
 if(phase.phase==='PRESEASON_SETUP'){
  let notices:ReturnType<typeof engine.unreadKboFirstCampNotices>;try{notices=engine.unreadKboFirstCampNotices(c);}catch{notices=[];}
  if(notices.length)return out('첫 캠프',notices.map(n=>cmd('camp-ack','현재 육성 계획 유지','RESOLVE_CAMP',{eventKey:n.eventKey,eventVersion:n.eventVersion})));
  if(!c.preseasonPlan)return out('시즌 준비',[cmd('preseason','시즌 계획 확정','CONFIRM_PRESEASON')]);
  if(!c.openingRoster)return out('시즌 준비',[cmd('roster','개막 엔트리 확정','CONFIRM_ROSTER')]);
  if(!c.competitionSchedule)return out('시즌 준비',[cmd('schedule','일정 확정','CONFIRM_SCHEDULE')]);
  return out('시즌 준비',[cmd('start','정규시즌 시작','START')]);
 }
 if(phase.phase==='SEASON_PROGRESS'){
  if(c.days&&c.competitionSchedule){const g=teamProgress(c.competitionSchedule.leagues[c.registration.competitionKey==='FUTURES'?'FUTURES':'KBO'],c.protagonistClubId,c.records.games);lines.push({label:'정규시즌',value:`${g.done}/${g.total}경기 · ${c.days.days.length}일 경과`});}
  const commands:FlowCommand[]=[];
  if(!phase.pendingGame){
   const choices:engine.TrainingChoice[]=[...abilityKeys(p.kind).map(ability=>({type:'GUARANTEED' as const,ability})),{type:'CONDITIONING'}];
   for(const ch of choices){let ok:boolean;try{ok=engine.previewKboTraining(c,ch).eligible;}catch{ok=false;}
    if(ok)commands.push(cmd('train-'+(ch.type==='GUARANTEED'?ch.ability:'conditioning'),ch.type==='GUARANTEED'?`훈련: ${ABILITY_LABELS[ch.ability as keyof typeof ABILITY_LABELS]} 안정 성장 (피로 +5)`:'훈련: 컨디션 회복 (피로 최대 -20)','TRAIN',{choice:ch}));}
  }
  return out('프로 정규시즌',[...commands,cmd('adv-season','이번 시즌 끝까지','ADVANCE_SPAN',{span:'SEASON'}),cmd('adv-month','다음 달까지','ADVANCE_SPAN',{span:'MONTH'}),cmd('adv-1','하루 진행','ADVANCE',{maxDays:1})]);
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
  const planEvent=engine.kboMilitaryPlanEventView(c)[0];
  if(planEvent){lines.push({label:'유예 가능 시즌',value:String(planEvent.futureGraceSeasons)});return out(planEvent.title,planEvent.choices.filter(x=>x.available).map(x=>cmd('military-plan-'+x.command,x.label,'MILITARY_PLAN',{eventKey:planEvent.eventKey,eventVersion:planEvent.eventVersion,command:x.command})),planEvent.body);}
  const app=c.military?.status==='APPLICATION_PENDING'?c.military.applications.at(-1):undefined;
  const militaryCommands:FlowCommand[]=[];
  if(app?.decision==='PENDING'){
   lines.push({label:'상무 선발',value:app.accepted?'선발':'미선발'});
   if(!app.accepted)return out('상무 선발 결과',[cmd('military-result-ack','결과 확인','MILITARY_RESULT',{command:'ACK_REJECTION'})]);
   if(engine.remainingKboMilitaryContractDays(c)>0)return out('상무 선발 결과',[
    cmd('military-result-enlist','상무 입대','MILITARY_RESULT',{command:'ENLIST'},'상무 입대를 확정할까요?'),
    cmd('military-result-decline','입대 거절','MILITARY_RESULT',{command:'DECLINE'},'상무 입대를 거절할까요?'),
   ]);
   militaryCommands.push(cmd('military-result-decline','입대 거절','MILITARY_RESULT',{command:'DECLINE'},'상무 입대를 거절할까요?'));
  }
  if(c.seasonClose){
   const plan=engine.kboMilitaryPlan(c),preview=engine.kboActiveServicePreview(c);
   if(preview.canEnlist){lines.push({label:'복무 중 급여',value:preview.servicePayWon.toLocaleString('ko-KR')+'원'},{label:'계약 잔여 경기일',value:String(preview.remainingPaidGameDays)});militaryCommands.push(cmd('military-enlist','현역 입대 확정','MILITARY_ENLIST',{},'현역 입대를 확정할까요?'));}
   if(plan.status==='UNRESOLVED'&&plan.age>=19&&plan.age<45&&!c.events.some(e=>e.status==='OPEN'&&e.definitionId!=='E30')&&!c.events.some(e=>['E49','E54'].includes(e.definitionId)&&e.seasonKey===c.world.seasonKey))militaryCommands.push(cmd('military-open','병역 계획 확인','MILITARY_OPEN'));
  }
  if(t.ready)return out('시즌 종료',[...militaryCommands,cmd('next-year','다음 시즌 시작','NEXT_YEAR')],`다음 시즌: ${t.targetSeasonKey}`);
  if(t.blockers.includes('MILITARY_PLAN_REQUIRED')&&!t.blockers.includes('CONTRACT_DECISION_REQUIRED')&&militaryCommands.length)return out('병역 계획',militaryCommands);
  if(c.seasonClose&&t.blockers.includes('CONTRACT_DECISION_REQUIRED')){
   const label=(offer:{clubId:string;years:number;annualSalaryWon:number})=>
    `${KBO_CLUBS.find(x=>x.id===offer.clubId)?.name??offer.clubId} · ${offer.years}년 · 연봉 ${offer.annualSalaryWon.toLocaleString('ko-KR')}원`;
   const signed=(command:FlowCommand):FlowCommand=>({...command,confirm:'이 계약을 확정할까요?',sign:{name:p.name}});
   const fa=engine.kboCareerFaView(c),offseason=engine.kboOffseasonOffersView(c);
   if(fa?.state==='OPEN'){
    const commands=fa.offers.map((o,i)=>cmd('fa-'+i,label(o),'SELECT_FA',
     {eventKey:fa.eventKey,eventVersion:fa.eventVersion,offerKey:o.offerKey}));
    if(!fa.offers.length&&fa.retirementAvailable)commands.push({
     id:'retire-request',label:'은퇴 절차 시작',type:'CAREER_PRO_RETIRE_REQUEST',
     payload:{careerRevision:c.revision},confirm:'은퇴 확인 단계로 이동할까요?',
    });
    return out('FA 제안 비교',[...militaryCommands,...commands],fa.offers.length?null:'조건에 맞는 제안이 없습니다.');
   }
   if(fa?.state==='SELECTED'){
    const o=fa.offers.find(x=>x.offerKey===fa.selectedOfferKey)!;
    lines.push({label:'제안',value:label(o)});
    lines.push({label:'예상 역할',value:o.role===1?'주전 경쟁':o.role===0.8?'플래툰':'백업'});
    return out('FA 계약 확인',[
     ...militaryCommands,
     signed(cmd('fa-sign','계약 수락','ACCEPT_FA',{eventKey:fa.eventKey,eventVersion:fa.eventVersion,offerKey:o.offerKey})),
     cmd('fa-back','다른 제안 보기','DECLINE_FA',{eventKey:fa.eventKey,eventVersion:fa.eventVersion}),
    ]);
   }
   if(offseason?.status==='OPEN'){
    if(!offseason.offers.length)return militaryCommands.length?out('병역 계획',militaryCommands):null;
    return out('다른 구단 제안',[...militaryCommands,...offseason.offers.map((o,i)=>{
     const r=c.agents?.salaryRequests.find(x=>x.offerSetKey===c.offseasonExit?.requestKey&&x.baseOfferKey===o.offerKey&&x.outcome==='ACCEPTED');
     const price=engine.careerAgentOffseasonOffer(c,o,r?.counterOfferKey??o.offerKey);
     return signed(cmd('offseason-'+i,label({...o,annualSalaryWon:price.annualSalaryWon}),'ACCEPT_OFFSEASON',{eventKey:offseason.eventKey,eventVersion:offseason.eventVersion,offerKey:price.offerKey}));
    })]);
   }
   const renewal=c.renewal,e=c.events.find(x=>x.eventKey===renewal?.eventKey&&x.status==='OPEN');
   if(renewal?.status==='OFFERED'&&e){
    const counter=c.agents?.salaryRequests.find(x=>x.offerSetKey===renewal.offerKey&&x.outcome==='ACCEPTED');
    const price=engine.careerAgentRenewalOffer(c,counter?.counterOfferKey??renewal.offerKey);
    lines.push({label:'재계약',value:label({...renewal,annualSalaryWon:price.annualSalaryWon})});
    return out('재계약 제안',[
     ...militaryCommands,
     signed(cmd('renew','재계약 수락','ACCEPT_RENEWAL',{eventKey:e.eventKey,eventVersion:e.version,offerKey:price.offerKey})),
    ]);
   }
   if(!c.events.some(e=>e.status==='OPEN'&&e.definitionId!=='E50')&&p.age<45)return out('다음 시즌 계약',[...militaryCommands,cmd('contract-offers','계약 제안 확인','OPEN_CONTRACT_OFFERS')]);
  }
  if(militaryCommands.length)return out('병역 계획',militaryCommands);
  if(!c.postseason&&!c.seasonClose)return out('정규시즌 종료',[cmd('post-start','포스트시즌 시작','START_POSTSEASON')]);
  if(c.postseason?.championKey&&!c.seasonClose){
   if(!c.seasonGrowth.entries.some(e=>JSON.parse(e.periodKey)[0]==='pro-growth'))return out('시즌 정산',[cmd('settle-growth','시즌 성장 정산','SETTLE_GROWTH')]);
   const forfeit=!c.development.trainingUsedSeasons.includes(c.world.seasonKey);
   return out('시즌 마감',[cmd('close-season',forfeit?'남은 훈련 기회를 포기하고 시즌 마감':'시즌 마감','CLOSE_SEASON',{forfeitUnusedTraining:forfeit},forfeit?'이번 시즌에 쓰지 않은 훈련 기회는 사라집니다. 마감할까요?':undefined)]);
  }
 }
 return null;
}

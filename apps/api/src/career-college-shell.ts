import * as engine from '@playball/engine';
import {spanDeadline,spanStopOf} from './span-budget.js';
import type {SpanStop} from './span-budget.js';
import {ABILITY_LABELS,abilityKeys,KBO_CLUBS} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

/** Thin owned dispatch for the college road: HS route → enrollment → academic-year play loop. The engine owns every rule;
 * the web only replays the commands served by `collegeFlow`/`collegeRouteCommands`. */
const fields=new Map<string,readonly string[]>([
 ['ENROLL',['careerRevision','eventVersion','offerSetKey','offerSetVersion','collegeId']],
 ['CLOSE_HS_YEAR',['careerRevision','forfeitUnusedTraining']],['START',['careerRevision']],
 ['CONFIRM_PRESEASON',['careerRevision']],['ADVANCE',['careerRevision','mode']],['PAUSE',['careerRevision']],
 ['WINDOW',['careerRevision','eventKey','eventVersion','command']],['TRAIN',['careerRevision','choice']],
 ['START_CUP',['careerRevision']],['ADVANCE_CUP',['careerRevision']],['ACK_REVIEW',['careerRevision']],
 ['CLOSE_YEAR',['careerRevision','forfeitUnusedTraining']],['START_NEXT',['careerRevision']],['GRADUATE',['careerRevision','eventVersion']],
]);
const WINDOW_COMMANDS=['OPEN_TRAINING','FORFEIT_TRAINING','DEFER_TRAINING','ACK_EVENT'];
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never{fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
const int=(p:Record<string,unknown>,k:string)=>{const v=p[k];if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)fail('INVALID_PAYLOAD');return v;};
const str=(p:Record<string,unknown>,k:string)=>{const v=p[k];if(typeof v!=='string'||!v)fail('INVALID_PAYLOAD');return v;};
const bool=(p:Record<string,unknown>,k:string)=>{if(typeof p[k]!=='boolean')fail('INVALID_PAYLOAD');return p[k] as boolean;};
function trainingChoice(v:unknown):engine.TrainingChoice{
 if(!v||typeof v!=='object'||Array.isArray(v))fail('INVALID_PAYLOAD');
 const o=v as Record<string,unknown>,keys=Object.keys(o).length;
 if((o.type==='GUARANTEED'||o.type==='CHALLENGE')&&typeof o.ability==='string'&&keys===2)return {type:o.type,ability:o.ability};
 if((o.type==='CONDITIONING'||o.type==='SKIP')&&keys===1)return {type:o.type};
 return fail('INVALID_PAYLOAD');
}

export const isCollege=(c:engine.HighSchoolCareer)=>c.world.leagueKey==='COLLEGE';
/** College or the HS→college hand-over (admitted, not yet started). */
export const collegeApplies=(c:engine.HighSchoolCareer)=>isCollege(c)||Boolean(c.collegeAdmission);

/** One request runs the engine's own plans back to back: SEASON = "next major event" repeated until the engine stops for a reason
 * other than its internal chunk limit (mandatory event, injury change, season review); MONTH = four weekly plans. The engine decides every stop. */
function advanceSpan(c:engine.HighSchoolCareer,rev:number,span:'SEASON'|'MONTH'){
 const until=spanDeadline();let r=engine.advanceCollegeCareer(c,rev,span==='SEASON'?'NEXT_MAJOR_EVENT':'ONE_WEEK'),weeks=r.stopReason==='ONE_WEEK'?1:0;
 for(let i=0;i<20_000;i++){
  if(r.career.phaseContext.phase!=='SEASON_PROGRESS'||Date.now()>=until)break;
  if(r.stopReason==='CHUNK_LIMIT')r=engine.advanceCollegeCareer(r.career,r.career.revision);
  else if(span==='MONTH'&&r.stopReason==='ONE_WEEK'&&weeks<4){r=engine.advanceCollegeCareer(r.career,r.career.revision,'ONE_WEEK');if(r.stopReason==='ONE_WEEK')weeks++;}
  else break;
 }
 return {...r,monthDone:weeks>=4};
}
export function applyCollege(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_COLLEGE_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,c=state.career as engine.HighSchoolCareer|undefined;
 if(!c||typeof c!=='object'||Array.isArray(c)||!c.world||!(name==='ENROLL'||collegeApplies(c)))fail('COLLEGE_OWNER_REQUIRED');
 const rev=int(p,'careerRevision');let next:engine.HighSchoolCareer,stopReason:string|undefined,spanStop:SpanStop|undefined;
 try{
  if(name==='ENROLL')next=engine.enrollHighSchoolCollege(c,rev,{eventVersion:int(p,'eventVersion'),offerSetKey:str(p,'offerSetKey'),offerSetVersion:int(p,'offerSetVersion'),collegeId:str(p,'collegeId')});
  else if(name==='CLOSE_HS_YEAR')next=engine.closeHighSchoolSeasonForCollege(c,rev,bool(p,'forfeitUnusedTraining'));
  else if(name==='START')next=engine.startAdmittedCollegeSeason(c,rev);
  else if(name==='CONFIRM_PRESEASON')next=engine.confirmCollegePreseason(c,rev);
  else if(name==='PAUSE')next=engine.pauseCollegeCareer(c,rev);
  else if(name==='ADVANCE'){
   if(p.mode!==undefined&&!['NEXT_MAJOR_EVENT','ONE_GAME','ONE_WEEK','SEASON','MONTH'].includes(String(p.mode)))fail('INVALID_PAYLOAD');
   const r=p.mode==='SEASON'||p.mode==='MONTH'?advanceSpan(c,rev,p.mode):engine.advanceCollegeCareer(c,rev,p.mode as engine.HighSchoolAdvancePlan['mode']|undefined);next=r.career;stopReason=r.stopReason;
   if(p.mode==='SEASON'||p.mode==='MONTH')spanStop=spanStopOf(p.mode,next.phaseContext.phase,r.stopReason,'monthDone' in r&&r.monthDone===true);
  }else if(name==='WINDOW'){
   const cmd=str(p,'command');if(!WINDOW_COMMANDS.includes(cmd))fail('INVALID_PAYLOAD');
   next=engine.resolveCareerWindowEvent(c,rev,{eventKey:str(p,'eventKey'),eventVersion:int(p,'eventVersion'),command:cmd}).career;
  }else if(name==='TRAIN')next=engine.trainCollegeCareer(c,rev,trainingChoice(p.choice));
  else if(name==='START_CUP')next=engine.startCollegeCup(c,rev);
  else if(name==='ADVANCE_CUP'){let r=engine.advanceCollegeCup(c,rev);for(let i=0;i<2_000&&r.stopReason==='CHUNK_LIMIT';i++)r=engine.advanceCollegeCup(r.career,r.career.revision);next=r.career;stopReason=r.stopReason;}
  else if(name==='ACK_REVIEW')next=engine.acknowledgeCollegeSeasonReview(c,rev);
  else if(name==='GRADUATE')next=engine.graduateCollegeCareer(c,rev,int(p,'eventVersion'));
  else if(name==='CLOSE_YEAR')next=engine.closeCollegeSeasonForNextYear(c,rev,bool(p,'forfeitUnusedTraining'));
  else next=engine.startNextCollegeSeason(c,rev);
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next,...(spanStop?{span:{careerRevision:next.revision,stop:spanStop}}:{})},phase:next.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next.revision,phase:next.phaseContext.phase,...(spanStop?{spanStop}:{}),...(stopReason?{stopReason}:{})}};
}

const WINDOW_LABELS:Record<string,string>={OPEN_TRAINING:'훈련 창 열기',FORFEIT_TRAINING:'이번 시즌 훈련 포기',DEFER_TRAINING:'나중에 하기',ACK_EVENT:'확인하고 계속'};

/** Enrollment offers for the graduation route; served next to the KBO draft commands. */
export function collegeRouteCommands(c:engine.HighSchoolCareer):FlowCommand[]{
 const grad=c.graduation?c.events.find(e=>e.eventKey===c.graduation!.eventKey):undefined;
 if(!grad||c.collegeAdmission||c.phaseContext.phase!=='CAREER_ROUTE')return [];
 const v=engine.highSchoolCareerRouteView(c);
 return v.colleges.filter(x=>x.eligible).map(x=>({id:'college-'+x.id,label:`${x.name} 진학`,type:'CAREER_COLLEGE_ENROLL',
  payload:{careerRevision:c.revision,eventVersion:grad.version,offerSetKey:v.offerSetKey,offerSetVersion:v.offerSetVersion,collegeId:x.id},
  confirm:`${x.name}에 진학하면 이번 지명 절차는 끝납니다. 진학할까요?`}));
}

export function collegeFlow(c:engine.HighSchoolCareer):FlowScreen{
 const p=c.world.players[c.world.protagonistKey]!,phase=c.phaseContext,admission=c.collegeAdmission;
 const lines:{label:string;value:string}[]=[{label:'선수',value:`${p.name} · ${p.age}세`},{label:'시즌',value:c.world.seasonKey}];
 if(admission)lines.push({label:'학년',value:`${admission.academicYear}학년`});
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:'CAREER_COLLEGE_'+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 if(!isCollege(c)){
  // Admitted from the HS route: close the school year, then start the college season.
  if(phase.phase==='NEXT_SEASON_READY')return c.collegeYearEnd?out('대학 입학',[cmd('college-start','대학 시즌 시작','START')],'입학 절차를 마쳤습니다.'):
   out('고교 시즌 마감',[cmd('close-hs-year','고교 시즌 마감','CLOSE_HS_YEAR',{forfeitUnusedTraining:true},'이번 시즌에 쓰지 않은 훈련 기회는 사라집니다. 마감할까요?')]);
  return out('대학 진학',[],'이 단계는 아직 웹에서 지원하지 않습니다. 저장은 그대로 유지됩니다.');
 }
 const sid=c.world.protagonistSchoolId,played=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey==='COLLEGE'&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,sid));
 const tally=played.reduce((a,g)=>({W:a.W+g.teams[sid]!.W,L:a.L+g.teams[sid]!.L,T:a.T+g.teams[sid]!.T}),{W:0,L:0,T:0});
 const total=c.world.schedule.filter(g=>g.homeTeamKey===sid||g.awayTeamKey===sid).length;
 const school=c.world.schools.find(s=>s.id===sid)?.name??sid;
 lines.push({label:'대학',value:school},{label:'정규시즌',value:`${played.length}/${total}경기 · ${tally.W}승 ${tally.L}패${tally.T?` ${tally.T}무`:''}`});
 if(phase.phase==='PRESEASON_SETUP')return out('대학 시즌 준비',[cmd('preseason','시즌 시작','CONFIRM_PRESEASON')]);
 if(phase.phase==='SEASON_PROGRESS'){
  const commands:FlowCommand[]=[];
  if(phase.advancePlan)commands.push(cmd('continue','진행 이어가기','ADVANCE'),cmd('pause','여기서 멈추기','PAUSE'));
  else{
   // Training choices come from the engine's own preview (window, once per year); the web never evaluates them.
   if(!phase.pendingGame){
    const choices:engine.TrainingChoice[]=[...abilityKeys(p.kind).map(ability=>({type:'GUARANTEED' as const,ability})),{type:'CONDITIONING'}];
    for(const choice of choices){
     let ok:boolean;try{ok=engine.previewCareerTraining(c,choice).eligible;}catch{ok=false;}
     if(ok)commands.push(cmd('train-'+(choice.type==='GUARANTEED'?choice.ability:'conditioning'),choice.type==='GUARANTEED'?`훈련: ${ABILITY_LABELS[choice.ability as keyof typeof ABILITY_LABELS]} 안정 성장 (피로 +5)`:'훈련: 컨디션 회복 (피로 최대 -20)','TRAIN',{choice}));
    }
   }
   commands.push(cmd('adv-season','이번 시즌 끝까지','ADVANCE',{mode:'SEASON'}),cmd('adv-month','다음 달까지','ADVANCE',{mode:'MONTH'}),cmd('adv-game','1경기 진행','ADVANCE',{mode:'ONE_GAME'}));
  }
  return out('대학 정규시즌',commands);
 }
 if(phase.phase==='EVENT_DECISION'){
  const e=c.events.find(x=>x.eventKey===phase.eventKey&&x.status==='OPEN');
  if(e?.definitionId==='E73'){
   engine.assertCollegeEarlyUsComparison(c);
   const forfeit=!c.development?.trainingUsedSeasons.includes(c.world.seasonKey);
   return out('2학년 진로 선택',[
    {id:'early-draft',label:'조기 드래프트 검토',type:'CAREER_CHOICE_COLLEGE_EARLY_DRAFT',payload:{careerRevision:c.revision,eventVersion:e.version}},
    {id:'college-continue',label:forfeit?'남은 훈련을 포기하고 3학년 준비':'3학년 준비',type:'CAREER_CHOICE_COLLEGE_CONTINUE',payload:{careerRevision:c.revision,eventVersion:e.version,forfeitUnusedTraining:forfeit},...(forfeit?{confirm:'이번 학년에 쓰지 않은 훈련 기회가 사라집니다. 마감할까요?'}:{})},
   ]);
  }
  if(e?.definitionId==='E75')return out('대학 졸업',[cmd('graduate','졸업하고 진로 선택','GRADUATE',{eventVersion:e.version})]);
  if(e?.definitionId==='E74'){
   engine.assertCollegeUnsignedReturn(c);
   return out('대학 복귀',[{id:'college-return',label:'대학 복귀',type:'CAREER_CHOICE_COLLEGE_RETURN',payload:{careerRevision:c.revision,eventVersion:e.version}}]);
  }
  if(e&&phase.resume.phase==='SEASON_PROGRESS'&&['E41','E43'].includes(e.definitionId)){
   // E41 (mid-season style change) is acknowledged only; the style change itself is not wired to the web yet.
   const choices=e.definitionId==='E41'?['ACK_EVENT']:['OPEN_TRAINING','FORFEIT_TRAINING'];
   return out(e.definitionId==='E43'?'연간 훈련 창':'시즌 중반 점검',choices.map(command=>cmd(command.toLowerCase(),WINDOW_LABELS[command]!,'WINDOW',{eventKey:e.eventKey,eventVersion:e.version,command},command==='FORFEIT_TRAINING'?'올해 훈련 기회가 사라집니다. 포기할까요?':undefined)),e.definitionId==='E41'?'스타일 변경은 아직 웹에서 지원하지 않습니다.':null);
  }
  return out('대학 단계',[],'이 단계는 아직 웹에서 지원하지 않습니다. 저장은 그대로 유지됩니다.');
 }
 if(phase.phase==='CAREER_ROUTE'&&admission&&(admission.academicYear===2&&admission.earlyDraftAttempted||admission.status==='GRADUATED')){
  const title=admission.status==='GRADUATED'?'졸업 진로 · KBO 지명':'조기 드래프트';
  const draft=c.kboRecruitment?engine.careerKboDraftView(c):null;
  if(!draft)return out(title,[{id:'draft-prepare',label:'KBO 신인 드래프트 준비',type:'CAREER_KBO_ENTRY_PREPARE',payload:{careerRevision:c.revision}}]);
  if(!draft.result)return out(title,[{id:'draft-resolve',label:'드래프트 결과 확인',type:'CAREER_KBO_ENTRY_RESOLVE',payload:{careerRevision:c.revision,programVersion:draft.version}}]);
  const club=KBO_CLUBS.find(x=>x.id===draft.result!.clubId)?.name??draft.result.clubId;
  lines.push({label:'지명',value:draft.result.round?draft.result.round+'라운드 '+club:'지명 없음'});
  if(!draft.offer)return out(title+' 결과',[],draft.status==='DECLINED'?'지명 제안을 거절했습니다.':null);
  lines.push({label:'제안',value:draft.offer.years+'년 · 연봉 '+Math.round(draft.offer.annualSalaryWon/10_000).toLocaleString('ko-KR')+'만 원'});
  return out(title+' 결과',[
   {id:'draft-sign',label:'계약하고 입단',type:'CAREER_KBO_ENTRY_DECIDE',payload:{careerRevision:c.revision,programVersion:draft.version,decision:'SIGN'}},
   {id:'draft-decline',label:'제안 거절',type:'CAREER_KBO_ENTRY_DECIDE',payload:{careerRevision:c.revision,programVersion:draft.version,decision:'DECLINE'},confirm:'거절하면 이 지명은 사라집니다. 거절할까요?'},
  ]);
 }
 if(phase.phase==='NEXT_SEASON_READY'&&phase.route==='KBO'){
  if(c.kboYearEnd)return out('KBO 입단',[{id:'activate',label:'KBO 선수로 입단',type:'CAREER_KBO_ENTRY_ACTIVATE',payload:{careerRevision:c.revision}}]);
  const forfeit=!c.development?.trainingUsedSeasons.includes(c.world.seasonKey);
  return out('대학 시즌 마감',[{id:'close-kbo-year',label:forfeit?'남은 훈련을 포기하고 마감':'대학 시즌 마감',type:'CAREER_KBO_ENTRY_CLOSE_YEAR',payload:{careerRevision:c.revision,forfeitUnusedTraining:forfeit},...(forfeit?{confirm:'이번 학년에 쓰지 않은 훈련 기회가 사라집니다. 마감할까요?'}:{})}]);
 }
 if(phase.phase==='SEASON_REVIEW'){
  if(!c.collegeCup)return out('정규시즌 종료',[cmd('cup-start','대학 컵 시작','START_CUP')]);
  if(c.collegeCup.status==='ACTIVE')return out('대학 컵',[cmd('cup-advance','컵 경기 진행','ADVANCE_CUP')]);
  return out('시즌 결산',[cmd('ack-review','시즌 결산 확인','ACK_REVIEW')]);
 }
 if(phase.phase==='POSTSEASON_PROGRESS')return out('대학 컵',[cmd('cup-advance','컵 경기 진행','ADVANCE_CUP')]);
 if(phase.phase==='OFFSEASON_REVIEW'&&admission&&admission.academicYear<4&&(admission.academicYear!==2||admission.earlyDraftAttempted)&&!c.events.some(e=>e.status==='OPEN')){
  const forfeit=!c.development?.trainingUsedSeasons.includes(c.world.seasonKey);
  return out('학년 마무리',[cmd('close-year',forfeit?'남은 훈련 기회를 포기하고 학년 마감':'학년 마감','CLOSE_YEAR',{forfeitUnusedTraining:forfeit},forfeit?'이번 학년에 쓰지 않은 훈련 기회는 사라집니다. 마감할까요?':undefined)]);
 }
 if(phase.phase==='NEXT_SEASON_READY'&&c.collegeYearEnd)return out('다음 학년 준비',[cmd('start-next','다음 학년 시작','START_NEXT')]);
 return out('대학 단계',[],'이 단계는 아직 웹에서 지원하지 않습니다. 저장은 그대로 유지됩니다.');
}

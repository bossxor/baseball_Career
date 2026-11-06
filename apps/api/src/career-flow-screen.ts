import * as engine from '@playball/engine';
import {KBO_CLUBS,ABILITY_LABELS,abilityKeys} from '@playball/rules';
import type {SaveState} from './engine-command.js';
import {kboPlayFlow} from './career-kbo-play-shell.js';
import {usFlow,isUs} from './career-us-flow.js';
import {collegeApplies,collegeFlow,collegeRouteCommands,isCollege} from './career-college-shell.js';

/** One public, command-bearing screen for the school→KBO entry and pro-retry flows.
 * Every command here is an existing owned CAREER_* command; the web replays `type`/`payload` exactly and never builds its own.
 * Hidden values (seed, rng, potential, draft score) are never copied into lines or payloads. */
export type FlowCommand={id:string;label:string;type:string;payload:Record<string,unknown>;confirm?:string;facts?:{label:string;value:string}[]};
export type FlowScreen={screenId:'CAREER_FLOW';title:string;lines:{label:string;value:string}[];commands:FlowCommand[];notice:string|null;careerRevision:number;stop?:string};
type Career=engine.HighSchoolCareer|engine.KboCareer;

const club=(id:string)=>KBO_CLUBS.find(c=>c.id===id)?.name??id;
const won=(n:number)=>Math.round(n/10_000).toLocaleString('ko-KR')+'만 원';
const isKbo=(c:Career):c is engine.KboCareer=>'protagonistClubId' in c;
const open=(c:Career,definitionId:string)=>c.events.find(e=>e.status==='OPEN'&&e.definitionId===definitionId);
const UNSUPPORTED='이 단계는 아직 웹에서 지원하지 않습니다. 저장은 그대로 유지됩니다.';

/** True when the flow screen has something to show for this career (the home screen links to it). */
export function flowApplies(state:SaveState):boolean {
 const c=state.career as Career|undefined;if(!c||typeof c!=='object')return false;
 if(isKbo(c))return true;
 if(isUs(c))return true;
 if(isCollege(c))return true;
 return ['SEASON_REVIEW','CAREER_ROUTE','NEXT_SEASON_READY'].includes(c.phaseContext.phase)||(c.phaseContext.phase==='EVENT_DECISION'&&Boolean(open(c,'E04')))||Boolean(c.retryExit||c.amateurRetirement);
}

export function careerFlowScreen(state:SaveState):FlowScreen {
 const screen=baseFlowScreen(state),sp=(state as {span?:{careerRevision:number;stop:string}}).span;
 if(!sp||sp.careerRevision!==screen.careerRevision)return screen;
 // Why the last season/month advance stopped: after a request-time-cap stop the same CTA reads as "continue".
 if(sp.stop==='BUDGET')return {...screen,stop:sp.stop,notice:'시즌 진행 중 — 이어서 진행합니다. 같은 버튼을 다시 누르면 이어집니다.',commands:screen.commands.map(x=>x.id==='adv-season'?{...x,label:'이어서 진행 (이번 시즌 끝까지)'}:x)};
 return {...screen,stop:sp.stop,notice:screen.notice??(sp.stop==='SEASON_END'?'정규시즌이 끝났습니다.':null)};
}
function baseFlowScreen(state:SaveState):FlowScreen {
 const c=state.career as Career|undefined;if(!c||typeof c!=='object'||Array.isArray(c))throw Object.assign(new Error('CAREER_NOT_FOUND'),{code:'CAREER_NOT_FOUND'});
 return isUs(c)?usFlow(c):isKbo(c)?kboFlow(c):collegeApplies(c)&&(isCollege(c)||c.phaseContext.phase==='NEXT_SEASON_READY')?collegeFlow(c):schoolFlow(c);
}

function cmd(c:Career,id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand {
 return {id,label,type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})};
}

function schoolFlow(c:engine.HighSchoolCareer):FlowScreen {
 const p=c.world.players[c.world.protagonistKey]!,phase=c.phaseContext.phase,lines:{label:string;value:string}[]=[{label:'선수',value:`${p.name} · ${p.age}세`},{label:'시즌',value:c.world.seasonKey}];
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 if(c.retryExit||c.amateurRetirement){
  const v=(c.retryExit?engine.amateurRetryExhaustionView(c):engine.amateurRetirementView(c)) as {status:string;eventKey:string;eventVersion:number;commands:readonly string[]};
  lines.push({label:'상태',value:v.status==='ARCHIVED'?'은퇴 보관 완료':'은퇴 확인 대기'});
  const ev={eventKey:v.eventKey,eventVersion:v.eventVersion},commands:FlowCommand[]=[];
  for(const name of v.commands){
   if(name==='CONFIRM_RETIRE')commands.push(cmd(c,'retire',c.retryExit?'은퇴를 확정합니다':'은퇴 확정',c.retryExit?'CAREER_RETRY_AMATEUR_CONFIRM_RETIRE':'CAREER_RETRY_AMATEUR_RESOLVE_RETIRE',c.retryExit?ev:{...ev,decision:'CONFIRM_RETIRE'},'은퇴하면 되돌릴 수 없습니다. 확정할까요?'));
   else if(name==='CANCEL_RETIRE')commands.push(cmd(c,'cancel','은퇴 취소','CAREER_RETRY_AMATEUR_RESOLVE_RETIRE',{...ev,decision:'CANCEL_RETIRE'}));
   else if(name==='OPEN_ARCHIVE')commands.push(cmd(c,'archive','기록 보관함 열기','CAREER_RETRY_AMATEUR_OPEN_ARCHIVE',ev));
  }
  return out('은퇴 확인',commands);
 }
 if(phase==='SEASON_REVIEW')return out('시즌 결산',[cmd(c,'ack-review','시즌 결산 확인','CAREER_SCHOOL_ACK_SEASON_REVIEW')]);
 const e04=phase==='EVENT_DECISION'?open(c,'E04'):undefined;
 if(e04)return out('졸업 진로',[cmd(c,'open-route','진로 선택 열기','CAREER_SCHOOL_OPEN_ROUTE',{eventVersion:e04.version})]);
 if(phase==='CAREER_ROUTE'){
  const draft=c.kboRecruitment?engine.careerKboDraftView(c):null,commands:FlowCommand[]=[];
  if(!draft||draft.status==='PREVIEW'&&!draft.result){
   if(!draft)commands.push(cmd(c,'draft-prepare','KBO 신인 드래프트 준비','CAREER_KBO_ENTRY_PREPARE'));
   else{
    lines.push({label:'드래프트',value:draft.eligible?'지명 확률 확인 가능':'지원 자격 없음'});
    if(draft.eligible)commands.push(cmd(c,'draft-resolve','드래프트 결과 확인','CAREER_KBO_ENTRY_RESOLVE',{programVersion:draft.version}));
   }
  }else if(draft.result){
   lines.push({label:'지명',value:draft.result.round?`${draft.result.round}라운드 ${club(draft.result.clubId??'')}`:'지명 없음'});
   if(draft.offer)lines.push({label:'제안',value:`${draft.offer.years}년 · 연봉 ${won(draft.offer.annualSalaryWon)}${draft.offer.signingBonusWon?` · 계약금 ${won(draft.offer.signingBonusWon)}`:''}`});
   const grad=c.graduation?c.events.find(e=>e.eventKey===c.graduation!.eventKey):undefined;
   if(draft.offer&&grad)commands.push(
    {...cmd(c,'draft-sign','계약하고 입단','CAREER_KBO_ENTRY_DECIDE',{programVersion:draft.version,decision:'SIGN',eventVersion:grad.version}),facts:[{label:'계약',value:`${draft.offer.years}년 · 연봉 ${won(draft.offer.annualSalaryWon)}`}]},
    {...cmd(c,'draft-decline','제안 거절','CAREER_KBO_ENTRY_DECIDE',{programVersion:draft.version,decision:'DECLINE',eventVersion:grad.version},'거절하면 이 지명은 사라집니다. 거절할까요?'),facts:[{label:'결과',value:'이 지명 제안은 사라집니다'}]});
  }
  commands.push(...collegeRouteCommands(c));
  return out('졸업 진로 · KBO 지명',commands,'대학·미국 진로는 아직 웹에서 지원하지 않습니다.');
 }
 if(phase==='NEXT_SEASON_READY'&&c.phaseContext.route==='KBO'){
  if(c.kboYearEnd)return out('KBO 입단',[cmd(c,'activate','KBO 선수로 입단','CAREER_KBO_ENTRY_ACTIVATE')]);
  const forfeit=!c.development?.trainingUsedSeasons.includes(c.world.seasonKey);
  return out('고교 시즌 마감',[cmd(c,'close-year',forfeit?'남은 훈련 기회를 포기하고 마감':'고교 시즌 마감','CAREER_KBO_ENTRY_CLOSE_YEAR',forfeit?{forfeitUnusedTraining:true}:{},forfeit?'이번 시즌에 쓰지 않은 훈련 기회는 사라집니다. 마감할까요?':undefined)]);
 }
 return out('진행 중',[],UNSUPPORTED);
}

function kboFlow(c:engine.KboCareer):FlowScreen {
 const play=kboPlayFlow(c);if(play)return play;
 const p=c.world.players[c.protagonistKey]??c.preparationSeason?.world.players[c.protagonistKey],lines:{label:string;value:string}[]=[];
 if(p)lines.push({label:'선수',value:`${p.name} · ${p.age}세`});
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 const r=c.retryPro,phase=c.phaseContext.phase;
 if(!r){
  try{engine.openKboUncontractedRetry(c,c.revision);}catch{return out('시즌 결산',[],UNSUPPORTED);}
  return out('계약 만료',[cmd(c,'retry-open','무소속 재도전 길 보기','CAREER_RETRY_OPEN')],'계약 제안이 없어 시즌이 끝났습니다.');
 }
 if(r.status==='NOTICE'){
  const e=c.events.find(x=>x.eventKey===r.eventKey&&x.status==='OPEN');
  return out('무소속 안내',e?[cmd(c,'retry-review','진로 확인','CAREER_RETRY_REVIEW',{eventVersion:e.version})]:[],e?null:UNSUPPORTED);
 }
 if(r.status==='ACCEPTED')return out('입단 완료',[],'새 구단과 계약했습니다. 프로 시즌 진행은 아직 웹에서 지원하지 않습니다.');
 if(r.status==='ARCHIVED'){
  const v=engine.kboRetryRetirementView(c);
  lines.push({label:'은퇴',value:`${v.seasonKey}시즌 · ${v.age}세`},{label:'마지막 구단',value:v.club.name});
  return out('은퇴 보관',[]);
 }
 if(phase==='RETIRE_CONFIRM'){
  const e=open(c,'E36');
  return out('은퇴 확인',e?[cmd(c,'retire','은퇴를 확정합니다','CAREER_RETRY_CONFIRM_RETIRE',{eventKey:e.eventKey,eventVersion:e.version},'은퇴하면 되돌릴 수 없습니다. 확정할까요?')]:[],e?null:UNSUPPORTED);
 }
 if(r.status==='PREPARING'){
  const v=engine.kboRetryPreparationView(c);
  lines.push({label:'준비 시즌',value:`${v.seasonKey}시즌`},{label:'경기',value:`${v.completedTeamGames}/${v.scheduledTeamGames}`},{label:'남은 준비 기회',value:`${v.preparation.remaining}회`});
  const commands:FlowCommand[]=[];
  if(v.phase==='PREPARATION_PRE')commands.push(cmd(c,'prep-preseason','준비 시즌 시작','CAREER_RETRY_PRESEASON'));
  else if(v.completedTeamGames<v.scheduledTeamGames){
   // Training window and limits are the engine's (trainingPreview): open after a third of the games, once per season. CHALLENGE is not offered until its odds are shown.
   if(p&&!v.trainingUsed&&v.completedTeamGames>=Math.ceil(v.scheduledTeamGames/3)){
    for(const k of abilityKeys(p.kind))commands.push(cmd(c,'train-'+k,`훈련: ${ABILITY_LABELS[k]} 안정 성장 (피로 +5)`,'CAREER_RETRY_TRAIN',{choice:{type:'GUARANTEED',ability:k}}));
    commands.push(cmd(c,'train-conditioning','훈련: 컨디션 회복 (피로 최대 -20)','CAREER_RETRY_TRAIN',{choice:{type:'CONDITIONING'}}),cmd(c,'train-skip','이번 시즌 훈련 건너뛰기','CAREER_RETRY_TRAIN',{choice:{type:'SKIP'}},'건너뛰면 이번 준비 시즌의 훈련 기회가 사라집니다. 건너뛸까요?'));
   }
   commands.push(cmd(c,'prep-game','1경기 진행','CAREER_RETRY_ADVANCE',{mode:'ONE_GAME'}),cmd(c,'prep-month','한 달 진행','CAREER_RETRY_ADVANCE',{mode:'ONE_MONTH'}));
  }
  else commands.push(v.trainingUsed?cmd(c,'prep-settle','시즌 정산','CAREER_RETRY_SETTLE'):cmd(c,'prep-settle','남은 훈련 기회를 포기하고 정산','CAREER_RETRY_SETTLE',{forfeitUnusedTraining:true},'이번 준비 시즌의 훈련 기회는 사라집니다. 정산할까요?'));
  return out('재도전 준비 시즌',commands);
 }
 // REVIEW: routes
 const v=engine.kboRetryRoutesView(c),commands:FlowCommand[]=[];
 lines.push({label:'나이',value:`${v.ageAtCompletion}세`},{label:'남은 준비 기회',value:`${v.preparation.remaining}회`});
 for(const route of v.routes){
  if(route.routeId==='PREPARATION')commands.push({...cmd(c,'route-prep','준비 시즌으로 재도전','CAREER_RETRY_START',{routePreviewId:v.routePreviewId}),facts:[{label:'남은 준비 기회',value:`${v.preparation.remaining}회`}]});
  else if(route.routeId==='DOMESTIC_CONTRACT')for(const ref of route.offerRefs){
   const o=v.offers.find(x=>x.offerKey===ref);if(!o)continue;
   commands.push(cmd(c,'offer-'+ref,`${club(o.clubId)} 입단 · ${o.years}년 · 연봉 ${won(o.annualSalaryWon)}`,'CAREER_RETRY_ACCEPT',{routePreviewId:v.routePreviewId,offerKey:o.offerKey}));
  }
  else if(route.routeId==='RETIRE')commands.push(cmd(c,'route-retire','은퇴 절차 시작','CAREER_RETRY_REQUEST_RETIRE',{},'은퇴 확인 단계로 이동합니다. 계속할까요?'));
  else lines.push({label:'진로',value:`${route.routeId} (웹 미지원)`});
 }
 return out('무소속 진로',commands);
}

/** Home for a KBO career. Pro season play is not wired to the web yet, so only the flow link (or a clear reason) is offered. */
export function kboCareerHome(saveId:string,state:SaveState){
 const c=state.career as engine.KboCareer,p=c.world.players[c.protagonistKey],flow=flowApplies(state);
 return {saveId,protagonist:{name:p?.name??'',kindLabel:p?.kind==='PITCHER'?'투수':'타자',positionLabel:p?.position??'',ageLabel:p?`${p.age}세`:''},stage:{leagueLabel:'KBO',teamName:club(c.protagonistClubId),seasonLabel:c.world.seasonKey+' 시즌',phaseLabel:c.retryPro?'무소속 재도전':'프로'},progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:flow?[{id:'open:FLOW',label:'다음 단계 진행',kind:'OPEN_SCREEN' as const,primary:true}]:[{id:'pro-season',label:'프로 시즌 진행',kind:'ADVANCE' as const,disabledReason:'프로 시즌 진행은 아직 웹에서 지원하지 않습니다.'}],
  pendingEventTitle:null,recentRecords:[]};
}

/** Home for a college career: the flow screen is the play loop. */
export function collegeCareerHome(saveId:string,state:SaveState){
 const c=state.career as engine.HighSchoolCareer,p=c.world.players[c.world.protagonistKey]!;
 return {saveId,protagonist:{name:p.name,kindLabel:p.kind==='PITCHER'?'투수':'타자',positionLabel:p.position,ageLabel:p.age+'세'},stage:{leagueLabel:'대학',teamName:c.world.schools.find(s=>s.id===c.world.protagonistSchoolId)?.name??'',seasonLabel:c.world.seasonKey+' 시즌',phaseLabel:c.collegeAdmission?c.collegeAdmission.academicYear+'학년':'대학'},progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:[{id:'open:FLOW',label:'다음 단계 진행',kind:'OPEN_SCREEN' as const,primary:true}],pendingEventTitle:null,recentRecords:[]};
}

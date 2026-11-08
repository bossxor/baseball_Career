import * as engine from '@playball/engine';
import {ABILITY_LABELS,abilityKeys} from '@playball/rules';
import {teamProgress} from './span-budget.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';
import {majorContractView} from './career-us-play-shell.js';

/** US road play loop. Commands are the existing owned CAREER_US_PLAY_* ones; availability is decided by engine previews/readiness, never by the client. */
export const isUs=(c:object):c is engine.UsCareer=>'protagonistOrganizationId' in c;
const LABELS:Record<string,string>={ACK_EVENT:'확인하고 계속',OPEN_TRAINING:'훈련 창 열기',DEFER_TRAINING:'나중에 하기',FORFEIT_TRAINING:'이번 시즌 훈련 포기',ACCEPT_PROMOTION:'승격 수락',DEFER_PROMOTION:'승격 보류',OPEN_TRAITS:'특성 확인'};
const UNSUPPORTED='이 단계는 아직 웹에서 지원하지 않습니다. 저장은 그대로 유지됩니다.';
const BLOCKERS:Record<string,string>={SEASON_NOT_IN_REVIEW:'시즌 결산 전',POSTSEASON_NOT_COMPLETE:'포스트시즌 미완료',OPEN_EVENT:'확인할 사건',GROWTH_NOT_FINALIZED:'성장 정산 전',TRAINING_DECISION_REQUIRED:'연간 훈련 결정',PITCH_LEARNING_NOT_SETTLED:'구종 습득 정산',MILITARY_PLAN_REQUIRED:'병역 계획',MILITARY_SERVICE_ACTIVE:'병역 복무 중',MILITARY_RETURN_REQUIRED:'복귀 확인',MAX_AGE_REACHED:'최대 나이',CONTRACT_DECISION_REQUIRED:'계약 결정'};

export function usFlow(c:engine.UsCareer):FlowScreen{
 const p=c.world.players[c.protagonistKey]!,phase=c.phaseContext,lines:{label:string;value:string}[]=[{label:'선수',value:`${p.name} · ${p.age}세`},{label:'시즌',value:c.world.seasonKey},{label:'레벨',value:c.registration.level}];
 const cmd=(id:string,label:string,type:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({id,label,type:'CAREER_US_PLAY_'+type,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{})});
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 const training=():FlowCommand[]=>{
  const commands:FlowCommand[]=[],choices:engine.TrainingChoice[]=[...abilityKeys(p.kind).map(ability=>({type:'GUARANTEED' as const,ability})),{type:'CONDITIONING'}];
  for(const choice of choices){let ok:boolean;try{ok=engine.previewUsTraining(c,choice).eligible;}catch{ok=false;}
   if(ok)commands.push(cmd('train-'+(choice.type==='GUARANTEED'?choice.ability:'conditioning'),choice.type==='GUARANTEED'?`훈련: ${ABILITY_LABELS[choice.ability as keyof typeof ABILITY_LABELS]} 안정 성장 (피로 +5)`:'훈련: 컨디션 회복 (피로 최대 -20)','TRAIN',{choice}));}
  return commands;
 };
 if(phase.phase==='PRESEASON_SETUP'){
  let notices:ReturnType<typeof engine.unreadUsFirstCampNotices>;try{notices=engine.unreadUsFirstCampNotices(c);}catch{notices=[];}
  if(notices.length)return out('첫 캠프',notices.map(n=>cmd('camp-ack','현재 육성 계획 유지','RESOLVE_CAMP',{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'ACK_EVENT'})));
  if(!c.preseasonPlan)return out('시즌 준비',[cmd('preseason','시즌 계획 확정','CONFIRM_PRESEASON')]);
  if(!c.seasonSchedule)return out('시즌 준비',[cmd('schedule','일정 확정','PUBLISH_SCHEDULE')]);
  return out('시즌 준비',[cmd('start','정규시즌 시작','START')]);
 }
 if(phase.phase==='SEASON_PROGRESS'){
  if(c.season){const g=teamProgress(c.seasonSchedule?.leagues[c.registration.level]??[],c.registration.clubId,c.records.games);lines.push({label:'정규시즌',value:`${g.done}/${g.total}경기 · ${c.season.days.length}일 경과`});}
  return out('미국 정규시즌',[...(phase.pendingGame?[]:training()),cmd('adv-season','이번 시즌 끝까지','ADVANCE_SPAN',{span:'SEASON'}),cmd('adv-month','다음 달까지','ADVANCE_SPAN',{span:'MONTH'}),cmd('adv-1','하루 진행','ADVANCE',{maxDays:1})]);
 }
 if(phase.phase==='EVENT_DECISION'){
  const e=c.events.find(x=>x.eventKey===phase.eventKey&&x.status==='OPEN');
  const choices=(allowed:string[])=>e!.offeredChoices.filter(x=>allowed.includes(x)).map(command=>cmd(command.toLowerCase(),LABELS[command]??command,
   e!.definitionId==='E84'?'RESOLVE_HIDDEN':['E41','E43'].includes(e!.definitionId)?'RESOLVE_WINDOW':'RESOLVE_LEVEL',{eventKey:e!.eventKey,eventVersion:e!.version,command},command==='FORFEIT_TRAINING'?'올해 훈련 기회가 사라집니다. 포기할까요?':undefined));
  if(e&&phase.resume.phase==='SEASON_PROGRESS'){
   if(e.definitionId==='E43')return out('연간 훈련 창',choices(['OPEN_TRAINING','DEFER_TRAINING','FORFEIT_TRAINING']));
   if(e.definitionId==='E41')return out('시즌 중반 점검',choices(['ACK_EVENT']),'스타일 변경은 아직 웹에서 지원하지 않습니다.');
   if(['E59','E60','E61'].includes(e.definitionId))return out('레벨 변경 제안',choices(['ACCEPT_PROMOTION','DEFER_PROMOTION','ACK_EVENT']));
   if(e.definitionId==='E84')return out('특성 알림',choices(['OPEN_TRAITS']));
  }
  return out('미국 단계',[],UNSUPPORTED);
 }
 if(phase.phase==='POSTSEASON_PROGRESS')return out('포스트시즌',[cmd('post-advance','포스트시즌 진행','ADVANCE_POSTSEASON')]);
 if(phase.phase==='SEASON_REVIEW'){
  const t=engine.usYearTransitionReadiness(c);
  if(t.ready)return out('시즌 종료',[cmd('next-minor-year','다음 시즌 시작','NEXT_MINOR_YEAR')],`다음 시즌: ${t.targetSeasonKey}`);
  if(t.blockers.every(b=>b==='CONTRACT_DECISION_REQUIRED'||b==='OPEN_EVENT')){
   const sign=(command:FlowCommand):FlowCommand=>({...command,confirm:'이 계약을 확정할까요?',sign:{name:p.name}});
   if(c.contract.type==='US_MINOR'){
    if(c.minorMarket){
     const market=engine.usMinorMarketView(c);
     const commands=market.offers.map((o,i)=>({...sign(cmd('minor-'+i,
      `${o.organizationName} · ${o.years}년 · 연봉 $${o.annualSalaryUsd.toLocaleString('en-US')}`,
      'ACCEPT_MINOR_OFFER',{offerKey:o.offerKey})),facts:[
       {label:'대표팀 차출',value:o.nationalReleaseAllowed?'허용':'불허'},
       {label:'병역 복귀 옵션',value:o.militaryReturnOption?'있음':'없음'},
      ]}));
     return out('마이너 계약 제안',commands,commands.length?null:'현재 계약 제안이 없습니다.');
    }
    if(t.blockers.length===1)return out('계약 만료',[cmd('minor-market','계약 제안 확인','OPEN_MINOR_MARKET')]);
   }else{
    const quote=majorContractView(c,t);
    if(quote?.kind==='RENEWAL'){
     lines.push({label:'계약',value:`${quote.years}년 · 연봉 $${quote.annualSalaryUsd.toLocaleString('en-US')}`});
     const commands=quote.funded?[sign(cmd('major-renew','계약 수락','NEXT_MAJOR_YEAR',
      'counterOfferKey' in quote?{counterOfferKey:quote.counterOfferKey}:{}))]:[];
     return out('메이저 재계약',commands,quote.funded?null:'계약 예산이 부족하여 진행할 수 없습니다.');
    }
    if(quote?.kind==='FREE_AGENCY'){
     if(!c.majorFaWindow)return out('FA 자격',[cmd('major-market','FA 제안 확인','OPEN_MAJOR_FA_WINDOW')]);
     const commands:FlowCommand[]=quote.offers.map((o,i)=>({...sign(cmd('major-fa-'+i,
      `${o.organizationId} · ${o.years}년 · 연봉 $${o.annualSalaryUsd.toLocaleString('en-US')}`,
      'ACCEPT_MAJOR_FA',{offerKey:o.offerKey,...('counterOfferKey' in o?{counterOfferKey:o.counterOfferKey}:{})})),facts:[
       {label:'대표팀 차출',value:o.nationalReleaseAllowed?'허용':'불허'},
       {label:'병역 복귀 옵션',value:o.militaryReturnOption?'있음':'없음'},
      ]}));
     if(!commands.length)commands.push({
      id:'retire-request',label:'은퇴 절차 시작',type:'CAREER_PRO_RETIRE_REQUEST',
      payload:{careerRevision:c.revision},confirm:'은퇴 확인 단계로 이동할까요?',
     });
     return out('메이저 FA 제안',commands,quote.offers.length?null:'현재 계약 제안이 없습니다.');
    }
   }
  }
  const commands:FlowCommand[]=[];
  if(t.blockers.includes('POSTSEASON_NOT_COMPLETE'))commands.push(c.world.conferenceRegistry?cmd('post-start','포스트시즌 시작','START_POSTSEASON'):cmd('leagues','리그 편성 확인','CONFIGURE_LEAGUES'));
  if(t.blockers.includes('TRAINING_DECISION_REQUIRED')){let ok:boolean;try{ok=engine.previewUsTraining(c,{type:'SKIP'}).eligible;}catch{ok=false;}
   if(ok)commands.push(cmd('train-skip','이번 시즌 훈련 건너뛰기','TRAIN',{choice:{type:'SKIP'}},'이번 시즌 훈련 기회가 사라집니다. 건너뛸까요?'));}
  return out('시즌 결산',commands,commands.length?null:`남은 조건: ${t.blockers.map(b=>BLOCKERS[b]??b).join(', ')}. ${UNSUPPORTED}`);
 }
 return out('미국 단계',[],UNSUPPORTED);
}

/** Home for a US career: the flow screen is the play loop. */
export function usCareerHome(saveId:string,state:object){
 const c=(state as {career:engine.UsCareer}).career,p=c.world.players[c.protagonistKey]!;
 return {saveId,protagonist:{name:p.name,kindLabel:p.kind==='PITCHER'?'투수':'타자',positionLabel:p.position,ageLabel:p.age+'세'},stage:{leagueLabel:'미국',teamName:c.protagonistOrganizationId,seasonLabel:c.world.seasonKey+' 시즌',phaseLabel:c.registration.level},progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:[{id:'open:FLOW',label:'다음 단계 진행',kind:'OPEN_SCREEN' as const,primary:true}],pendingEventTitle:null,recentRecords:[]};
}

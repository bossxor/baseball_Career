import * as engine from '@playball/engine';
import {ABILITY_LABELS,abilityKeys} from '@playball/rules';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

export function retryYearReady(nextWorldDay:number,schedule:readonly {worldDay:number}[],pendingGame:unknown):boolean{
 return schedule.length>0&&!pendingGame&&nextWorldDay>Math.max(...schedule.map(game=>game.worldDay));
}

export function usReturnRetryHome(saveId:string,c:engine.UsAmateurReturnRetryCareer){
 const owner=c.preparation??c.origin.preparation??c.origin.service!,p=owner.world.players[c.retry.playerKey]!;
 return {saveId,protagonist:{name:p.name,kindLabel:p.kind==='PITCHER'?'투수':'타자',positionLabel:p.position,ageLabel:`${p.age}세`},
  stage:{leagueLabel:'국내 복귀',teamName:'',seasonLabel:`${c.retry.seasonKey} 시즌`,phaseLabel:'재도전'},
  progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:[{id:'open:FLOW',label:'재도전 이어가기',kind:'OPEN_SCREEN' as const,primary:true}],pendingEventTitle:null,recentRecords:[]};
}

export function usReturnRetryFlow(c:engine.UsAmateurReturnRetryCareer):FlowScreen{
 const owner=c.preparation??c.origin.preparation??c.origin.service!,player=owner.world.players[c.retry.playerKey]!;
 const lines=[{label:'선수',value:`${player.name} · ${player.age}세`}];
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({
  id,label,type:'CAREER_RETRY_US_RETURN_'+name,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{}),
 });
 const out=(title:string,commands:FlowCommand[],notice:string|null=null):FlowScreen=>({screenId:'CAREER_FLOW',title,lines,commands,notice,careerRevision:c.revision});
 if(c.retryExit){
  const v=engine.usAmateurReturnRetryRetirementView(c);
  if(!v.available)return out('은퇴',[]);
  return out('은퇴 확인',v.status==='PENDING'?[cmd('retry-retire','은퇴 확정','CONFIRM_RETIRE',{eventKey:v.eventKey,eventVersion:v.eventVersion},'은퇴하면 되돌릴 수 없습니다. 확정할까요?')]:[]);
 }
 if(c.status==='PREPARING'){
  const v=engine.usAmateurReturnRetryPreparationView(c),commands:FlowCommand[]=[];
  lines.push({label:'준비 경기',value:`${v.completedTeamGames}/${v.scheduledTeamGames}경기`});
  if(v.phase==='PREPARATION_PRE')commands.push(cmd('retry-preseason','준비 시즌 시작','PRESEASON'));
  else if(v.completedTeamGames!==v.scheduledTeamGames||!retryYearReady(v.nextWorldDay,c.preparation!.world.schedule,c.preparation!.pendingGame)){
   if(!v.trainingUsed&&v.completedTeamGames>=Math.ceil(v.scheduledTeamGames/3)&&!c.preparation!.pendingGame){
    const preparation=c.preparation!,context={seasonId:preparation.world.seasonKey,completedTeamGames:v.completedTeamGames,
     scheduledTeamGames:v.scheduledTeamGames,injured:Object.hasOwn(preparation.health.injuries,player.simulationKey),
     windowOpen:true,careerCheat:preparation.difficulty==='SECRET_CHEAT'};
    for(const ability of abilityKeys(player.kind)){
     const choice={type:'GUARANTEED' as const,ability};
     if(engine.trainingPreview(player,preparation.development.trainingUsedSeasons,choice,context).eligible)
      commands.push(cmd('train-'+ability,`훈련: ${ABILITY_LABELS[ability]} 안정 성장`,'TRAIN',{choice}));
    }
    const choice={type:'CONDITIONING' as const};
    if(engine.trainingPreview(player,preparation.development.trainingUsedSeasons,choice,context).eligible)
     commands.push(cmd('train-conditioning','컨디션 회복','TRAIN',{choice}));
   }
   commands.push(cmd('retry-game','1경기 진행','ADVANCE',{mode:'ONE_GAME'}),cmd('retry-month','한 달 진행','ADVANCE',{mode:'ONE_MONTH'}));
  }else commands.push(cmd('retry-settle',v.trainingUsed?'시즌 정산':'훈련 기회 포기 후 정산','SETTLE',{forfeitUnusedTraining:!v.trainingUsed},v.trainingUsed?undefined:'남은 훈련 기회를 포기하고 정산할까요?'));
  return out('재도전 준비 시즌',commands);
 }
 const v=engine.usAmateurReturnRetryRoutesView(c),commands:FlowCommand[]=[];
 lines.push({label:'남은 준비 기회',value:`${v.preparation.remaining}회`});
 if(v.activationRequired)commands.push(cmd('retry-kbo','KBO 입단','KBO_ACTIVATE'));
 else if(v.needsDomesticAssessment)commands.push(cmd('retry-draft-prepare','KBO 지명 준비','DRAFT_PREPARE'));
 else if(v.draft?.status==='PREVIEW')commands.push(cmd('retry-draft-resolve','지명 결과 확인','DRAFT_RESOLVE',{programVersion:v.draft.version}));
 else if(v.draft?.status==='RESULT'&&v.draft.offer){
  lines.push({label:'제안',value:`${v.draft.offer.clubId} · ${v.draft.offer.years}년 · 연봉 ${v.draft.offer.annualSalaryWon.toLocaleString('ko-KR')}원`});
  commands.push({...cmd('retry-draft-sign','계약 수락','DRAFT_DECIDE',{programVersion:v.draft.version,decision:'SIGN'},'계약을 수락할까요?'),sign:{name:player.name}},
   cmd('retry-draft-decline','제안 거절','DRAFT_DECIDE',{programVersion:v.draft.version,decision:'DECLINE'},'제안을 거절할까요?'));
 }else{
  if(v.usOpportunity.status==='UNASSESSED')commands.push(cmd('retry-us-assess','미국 제안 확인','US_ASSESS'));
  if(v.usOpportunity.status==='AVAILABLE'){
   const valid=v.routes.find(r=>r.routeId==='US_CONTRACT')?.offerRefs??[];
   for(const offer of v.usOpportunity.offers.filter(o=>valid.includes(o.offerKey)))commands.push({...cmd('retry-us-'+offer.offerKey,`${offer.organizationName} · ${offer.years}년 · 연봉 $${offer.annualSalaryUsd.toLocaleString('en-US')}`,'US_ACCEPT',{routePreviewId:v.routePreviewId,offerKey:offer.offerKey},'이 계약을 수락할까요?'),sign:{name:player.name}});
   commands.push(cmd('retry-us-decline','미국 제안 거절','US_DECLINE',{assessmentKey:v.usOpportunity.assessmentKey},'미국 제안을 거절할까요?'));
  }
  if(v.usOpportunity.status==='NO_OFFER'&&v.usOpportunity.unresolvedReturnOptionCount>0)
   commands.push(cmd('retry-us-decline','미국 복귀 옵션 포기','US_DECLINE',{assessmentKey:v.usOpportunity.assessmentKey},'미국 복귀 옵션을 포기할까요?'));
  if(v.routes.some(r=>r.routeId==='PREPARATION'))commands.push(cmd('retry-start','준비 시즌으로 재도전','START',{routePreviewId:v.routePreviewId},'준비 기회 1회를 사용합니다. 시작할까요?'));
  if(v.preparation.remaining===0&&v.usOpportunity.status!=='UNASSESSED'&&v.usOpportunity.status!=='AVAILABLE'&&v.usOpportunity.unresolvedReturnOptionCount===0)
   commands.push(cmd('retry-exhaust','은퇴 절차 시작','EXHAUST',{},'은퇴 확인 단계로 이동할까요?'));
 }
 return out('재도전 진로',commands);
}

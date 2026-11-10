import * as engine from '@playball/engine';
import type {SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';
import {usReturnScreen} from './career-us-return-shell.js';
import {draftLines} from './career-draft-lines.js';

export function isUsAmateurReturn(value:unknown):value is engine.UsAmateurReturnCareer {
 return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&'return' in value&&'source' in value&&'retry' in value&&!('mode' in value));
}

export function usReturnHome(saveId:string,c:engine.UsAmateurReturnCareer){
 const p=c.preparation?.world.players[c.return.playerKey]??c.service?.world.players[c.return.playerKey]??c.source.world.players[c.return.playerKey]!;
 const season=c.preparation?.world.seasonKey??c.service?.world.seasonKey??c.return.sourceSeasonKey;
 return {saveId,protagonist:{name:p.name,kindLabel:p.kind==='PITCHER'?'투수':'타자',positionLabel:p.position,ageLabel:`${p.age}세`},
  stage:{leagueLabel:'국내 복귀',teamName:'',seasonLabel:`${season} 시즌`,phaseLabel:c.retirement?.status==='ARCHIVED'?'은퇴':c.retirement?.status==='PENDING'?'은퇴 확인':'복귀 준비'},
  progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:[{id:'open:FLOW',label:c.retirement?.status==='ARCHIVED'?'은퇴 기록 보기':c.retirement?.status==='PENDING'?'은퇴 확인':'복귀 준비 이어가기',kind:'OPEN_SCREEN' as const,primary:true}],pendingEventTitle:null,recentRecords:[]};
}

export function usReturnFlow(state:SaveState,c:engine.UsAmateurReturnCareer):FlowScreen{
 const view=usReturnScreen(state,'US_RETURN_PROGRAM');
 const lines=[{label:'복귀 준비',value:`${view.completedSeasons}/${view.requiredSeasons}시즌`}];
 if(view.progress&&'completedTeamGames' in view.progress)lines.push({label:'준비 경기',value:`${view.progress.completedTeamGames}/${view.progress.scheduledTeamGames}경기`});
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({
  id,label,type:'CAREER_US_RETURN_'+name,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{}),
 });
 let commands:FlowCommand[]=[],notice:string|null=null;
 if(view.retirement){
  const r=view.retirement;lines.push({label:'선수 생활',value:r.status==='ARCHIVED'?'은퇴':'은퇴 확인'});
  commands=r.commands.map(command=>command==='OPEN_ARCHIVE'?cmd('return-archive','커리어 기록 보기','OPEN_ARCHIVE',{eventKey:r.eventKey,eventVersion:r.eventVersion}):cmd('return-'+command,command==='CONFIRM_RETIRE'?'은퇴 확정':'취소','RETIRE_RESOLVE',{eventKey:r.eventKey,eventVersion:r.eventVersion,decision:command},command==='CONFIRM_RETIRE'?'선수 생활을 마칠까요?':undefined));
  return {screenId:'CAREER_FLOW',title:r.status==='ARCHIVED'?'은퇴 기록':'은퇴 확인',lines,commands,notice,careerRevision:c.revision};
 }
 if(c.return.status==='PREPARING'){
  const event=c.events.find(e=>e.definitionId==='E68'&&e.status==='OPEN');
  if(event)commands=[cmd('return-start','복귀 준비 시즌 시작','START_YEAR',{eventVersion:event.version},'복귀 준비 시즌을 시작할까요?')];
  else if(view.settleReady)commands=[cmd('return-settle','복귀 준비 시즌 정산','SETTLE_YEAR')];
  else if(c.preparation||c.service)commands=[cmd('return-advance','복귀 준비 진행','ADVANCE')];
 }else if(c.return.status==='DRAFT_READY'){
  const draft=view.draft;
  if(draft)lines.push(...draftLines(draft.preview));
  if(!draft)commands=[cmd('return-draft-prepare','KBO 지명 준비','DRAFT_PREPARE')];
  else if(draft.status==='PREVIEW')commands=[cmd('return-draft-resolve','지명 결과 확인','DRAFT_RESOLVE',{programVersion:draft.version})];
  else if(draft.status==='SIGNED')commands=[cmd('return-kbo','KBO 입단','KBO_ACTIVATE')];
  else if(draft.status==='RESULT'&&draft.offer){
   lines.push({label:'제안',value:`${draft.offer.clubId} · ${draft.offer.years}년 · 연봉 ${draft.offer.annualSalaryWon.toLocaleString('ko-KR')}원`});
   const player=c.preparation?.world.players[c.return.playerKey]??c.service?.world.players[c.return.playerKey]??c.source.world.players[c.return.playerKey]!;
   commands=[{...cmd('return-sign','계약 수락','DRAFT_DECIDE',{programVersion:draft.version,decision:'SIGN'},'계약을 수락할까요?'),sign:{name:player.name}},
    cmd('return-decline','제안 거절','DRAFT_DECIDE',{programVersion:draft.version,decision:'DECLINE'},'제안을 거절할까요?')];
  }else if(draft.status==='RESULT'&&draft.result?.round===null){
   commands=[{id:'return-retry-open',label:'재도전 진로 확인',type:'CAREER_RETRY_US_RETURN_OPEN',payload:{careerRevision:c.revision}}];
  }else notice='지명 계약이 확정되지 않았습니다.';
 }
 if(c.draft?.program.decision!=='SIGNED')for(const offer of view.usOptions.filter(o=>o.available)){
  const player=c.preparation?.world.players[c.return.playerKey]??c.service?.world.players[c.return.playerKey]??c.source.world.players[c.return.playerKey]!;
  commands.push({...cmd('return-us-'+offer.offerKey,`${offer.organizationName} · ${offer.years}년 · 연봉 $${offer.annualSalaryUsd.toLocaleString('en-US')}`,'US_ACCEPT',{offerKey:offer.offerKey},'미국 계약을 수락할까요?'),sign:{name:player.name}});
 }
 if(view.canRetire)commands.push(cmd('return-retire','선수 생활 마치기','RETIRE_REQUEST'));
 return {screenId:'CAREER_FLOW',title:'국내 복귀 준비',lines,commands,notice,careerRevision:c.revision};
}

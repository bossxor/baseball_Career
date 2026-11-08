import * as engine from '@playball/engine';
import type {SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';
import {usReturnScreen} from './career-us-return-shell.js';

export function isUsAmateurReturn(value:unknown):value is engine.UsAmateurReturnCareer {
 return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&'return' in value&&'source' in value&&'retry' in value&&!('mode' in value));
}

export function usReturnHome(saveId:string,c:engine.UsAmateurReturnCareer){
 const p=c.preparation?.world.players[c.return.playerKey]??c.service?.world.players[c.return.playerKey]??c.source.world.players[c.return.playerKey]!;
 const season=c.preparation?.world.seasonKey??c.service?.world.seasonKey??c.return.sourceSeasonKey;
 return {saveId,protagonist:{name:p.name,kindLabel:p.kind==='PITCHER'?'투수':'타자',positionLabel:p.position,ageLabel:`${p.age}세`},
  stage:{leagueLabel:'국내 복귀',teamName:'',seasonLabel:`${season} 시즌`,phaseLabel:'복귀 준비'},
  progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},
  nextActions:[{id:'open:FLOW',label:'복귀 준비 이어가기',kind:'OPEN_SCREEN' as const,primary:true}],pendingEventTitle:null,recentRecords:[]};
}

export function usReturnFlow(state:SaveState,c:engine.UsAmateurReturnCareer):FlowScreen{
 const view=usReturnScreen(state,'US_RETURN_PROGRAM');
 const lines=[{label:'복귀 준비',value:`${view.completedSeasons}/${view.requiredSeasons}시즌`}];
 if(view.progress&&'completedTeamGames' in view.progress)lines.push({label:'준비 경기',value:`${view.progress.completedTeamGames}/${view.progress.scheduledTeamGames}경기`});
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={},confirm?:string):FlowCommand=>({
  id,label,type:'CAREER_US_RETURN_'+name,payload:{careerRevision:c.revision,...payload},...(confirm?{confirm}:{}),
 });
 let commands:FlowCommand[]=[],notice:string|null=null;
 if(c.return.status==='PREPARING'){
  const event=c.events.find(e=>e.definitionId==='E68'&&e.status==='OPEN');
  if(event)commands=[cmd('return-start','복귀 준비 시즌 시작','START_YEAR',{eventVersion:event.version},'복귀 준비 시즌을 시작할까요?')];
  else if(view.settleReady)commands=[cmd('return-settle','복귀 준비 시즌 정산','SETTLE_YEAR')];
  else if(c.preparation||c.service)commands=[cmd('return-advance','복귀 준비 진행','ADVANCE')];
 }else if(c.return.status==='DRAFT_READY'){
  const draft=view.draft;
  if(!draft)commands=[cmd('return-draft-prepare','KBO 지명 준비','DRAFT_PREPARE')];
  else if(draft.status==='PREVIEW')commands=[cmd('return-draft-resolve','지명 결과 확인','DRAFT_RESOLVE',{programVersion:draft.version})];
  else if(draft.status==='SIGNED')commands=[cmd('return-kbo','KBO 입단','KBO_ACTIVATE')];
  else if(draft.status==='RESULT'&&draft.offer){
   lines.push({label:'제안',value:`${draft.offer.clubId} · ${draft.offer.years}년 · 연봉 ${draft.offer.annualSalaryWon.toLocaleString('ko-KR')}원`});
   commands=[cmd('return-sign','계약 수락','DRAFT_DECIDE',{programVersion:draft.version,decision:'SIGN'},'계약을 수락할까요?'),
    cmd('return-decline','제안 거절','DRAFT_DECIDE',{programVersion:draft.version,decision:'DECLINE'},'제안을 거절할까요?')];
  }else notice='지명 계약이 확정되지 않았습니다.';
 }
 return {screenId:'CAREER_FLOW',title:'국내 복귀 준비',lines,commands,notice,careerRevision:c.revision};
}

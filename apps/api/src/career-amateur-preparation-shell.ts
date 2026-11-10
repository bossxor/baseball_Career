import * as engine from '@playball/engine';
import {abilityKeys,ABILITY_LABELS} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand,FlowScreen} from './career-flow-screen.js';

function fail(code:string):never{throw Object.assign(new Error(code),{code});}
export function applyAmateurPreparation(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_AMATEUR_PREP_'.length),fields:Record<string,readonly string[]>={START:['careerRevision','eventVersion'],PRESEASON:['careerRevision'],ADVANCE:['careerRevision','mode'],TRAIN:['careerRevision','choice'],SETTLE:['careerRevision','forfeitUnusedTraining']};
 const raw=command.payload,allowed=fields[name];
 if(!allowed||!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,c=state.career as engine.HighSchoolCareer;
 if(!c?.world||'mode' in c||'protagonistClubId' in c||!Array.isArray(c.world.schools))fail('AMATEUR_OWNER_REQUIRED');
 const revision=p.careerRevision;if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)fail('INVALID_PAYLOAD');
 let next:engine.HighSchoolCareer;
 try{
  if(name==='START'){
   if(p.eventVersion!==undefined&&(typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1))fail('INVALID_PAYLOAD');
   next=engine.startCareerPreparation(c,revision,p.eventVersion as number|undefined);
  }else if(name==='PRESEASON')next=engine.confirmPreparationPreseason(c,revision);
  else if(name==='ADVANCE'){
   if(p.mode!=='ONE_GAME'&&p.mode!=='ONE_MONTH')fail('INVALID_PAYLOAD');
   next=engine.advanceCareerPreparation(c,revision,p.mode).career;
  }else if(name==='TRAIN'){
   const choice=p.choice as Record<string,unknown>;
   if(!choice||typeof choice!=='object'||Array.isArray(choice)||!['GUARANTEED','CHALLENGE','CONDITIONING','SKIP'].includes(String(choice.type))||Object.keys(choice).some(k=>k!=='type'&&k!=='ability')||(['GUARANTEED','CHALLENGE'].includes(String(choice.type))?typeof choice.ability!=='string':choice.ability!==undefined))fail('INVALID_PAYLOAD');
   next=engine.trainCareerPreparation(c,revision,choice as unknown as engine.TrainingChoice);
  }else{
   if(typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');
   next=engine.settleCareerPreparation(c,revision,p.forfeitUnusedTraining);
  }
 }catch(error){if(error&&typeof error==='object'&&'code' in error)throw error;fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
 const nextState:SaveState={...state,career:next!};if(name==='START')delete nextState.usEntry;
 return {nextState,phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision}};
}
export function amateurPreparationRouteCommands(c:engine.HighSchoolCareer):FlowCommand[]{
 if(c.phaseContext.phase!=='CAREER_ROUTE'||c.usRecruitment&&engine.careerUsDirectView(c).visible)return [];
 let view:ReturnType<typeof engine.careerPreparationRoutes>;try{view=engine.careerPreparationRoutes(c);}catch{return [];}
 const commands:FlowCommand[]=[];
 if(view.routes.some(r=>r.routeId==='PREPARATION')){
  const graduation=c.graduation?c.events.find(e=>e.eventKey===c.graduation!.eventKey&&e.status==='OPEN'):undefined;
  commands.push({id:'amateur-preparation-start',label:'독립 재도전 준비 시즌',type:'CAREER_AMATEUR_PREP_START',payload:{careerRevision:c.revision,...(graduation?{eventVersion:graduation.version}:{})},confirm:'재도전 준비 시즌을 시작할까요?',facts:[{label:'남은 준비 기회',value:view.preparation.remaining+'회'}]});
 }
 if(view.routes.some(r=>r.routeId==='RETIRE'))commands.push({id:'amateur-retire',label:'선수 생활 마치기',type:'CAREER_RETRY_AMATEUR_REQUEST_RETIRE',payload:{careerRevision:c.revision}});
 return commands;
}
export function amateurPreparationFlow(c:engine.HighSchoolCareer):FlowScreen|null{
 const preparation=c.preparationSeason;
 if(c.world.leagueKey!=='INDEPENDENT'||!preparation||preparation.phase==='PREPARATION_RESULT'||c.retryExit||c.amateurRetirement)return null;
 const view=engine.preparationSeasonView(preparation),player=c.world.players[c.world.protagonistKey]!;
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={}):FlowCommand=>({id,label,type:'CAREER_AMATEUR_PREP_'+name,payload:{careerRevision:c.revision,...payload}});
 const commands:FlowCommand[]=[],lines=[{label:'준비 경기',value:view.completedTeamGames+'/'+view.scheduledTeamGames},{label:'남은 준비 기회',value:view.preparation.remaining+'회'}];
 if(preparation.phase==='PREPARATION_PRE')commands.push(cmd('prep-preseason','준비 시즌 시작','PRESEASON'));
 else if(c.phaseContext.phase==='SEASON_REVIEW')commands.push({...cmd('prep-settle','준비 시즌 정산','SETTLE',{forfeitUnusedTraining:!view.trainingUsed}),...(!view.trainingUsed?{confirm:'남은 훈련을 포기하고 준비 시즌을 정산할까요?'}:{})});
 else{
  const choices:engine.TrainingChoice[]=[...abilityKeys(player.kind).flatMap(ability=>[{type:'GUARANTEED' as const,ability},{type:'CHALLENGE' as const,ability}]),{type:'CONDITIONING'},{type:'SKIP'}];
  const dayInProgress=Object.values(preparation.records.games).some(g=>g.scope.seasonKey===preparation.world.seasonKey&&g.scope.leagueKey==='INDEPENDENT'&&g.worldDay>=preparation.nextWorldDay);
  if(!preparation.pendingGame&&!dayInProgress&&!view.trainingUsed)for(const choice of choices){
   let preview:ReturnType<typeof engine.previewCareerTraining>;try{preview=engine.previewCareerTraining(c,choice);}catch{continue;}
   if(!preview.eligible)continue;
   const facts=[{label:'성장',value:'+'+(preview.gainUnits/10_000).toLocaleString('ko-KR')}];
   if(preview.probability!==null&&preview.probability<1)facts.push({label:'성공 확률',value:(preview.probability*100).toLocaleString('ko-KR')+'%'});
   const label='ability' in choice?ABILITY_LABELS[choice.ability as keyof typeof ABILITY_LABELS]+' · '+(choice.type==='GUARANTEED'?'확정 성장':'도전 강화'):choice.type==='CONDITIONING'?'피로 회복':'이번 시즌 훈련 건너뛰기';
   commands.push({...cmd('prep-train-'+choice.type+'-'+('ability' in choice?choice.ability:''),label,'TRAIN',{choice}),facts,...(choice.type==='SKIP'?{confirm:'이번 준비 시즌 특별 훈련 기회가 사라집니다. 건너뛸까요?'}:{})});
  }
  commands.push(cmd('prep-month','다음 달까지 준비','ADVANCE',{mode:'ONE_MONTH'}),cmd('prep-game','1경기 준비','ADVANCE',{mode:'ONE_GAME'}));
 }
 return {screenId:'CAREER_FLOW',title:'독립 재도전 준비',lines,commands,notice:null,careerRevision:c.revision};
}

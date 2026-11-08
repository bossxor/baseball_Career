import {randomUUID} from 'node:crypto';
import * as engine from '@playball/engine';
import {overall} from '@playball/rules';
import type {PitchId} from '@playball/rules';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import {flowApplies} from './career-flow-screen.js';

const fields=new Map<string,readonly string[]>([
 ['CREATE',['name','kind','position','throws','bats','pitchForm','archetype','focus','difficulty','schoolId','seasonYear','secondaryPitch']],
 ['CONFIRM_PLAYER',['careerRevision']],['RESOLVE_FOCUS',['careerRevision','eventKey','eventVersion','command','focus']],
 ['CONFIRM_PRESEASON',['careerRevision']],['ADVANCE',['careerRevision','mode']],
 ['RESOLVE_WINDOW',['careerRevision','eventKey','eventVersion','command']],['RESOLVE_HIDDEN',['careerRevision','eventKey','eventVersion','command']],['TRAIN',['careerRevision','choice']],
 ['ACK_SEASON_REVIEW',['careerRevision']],['OPEN_ROUTE',['careerRevision','eventVersion']],
]);
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never{fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):engine.HighSchoolCareer{const c=state.career as engine.HighSchoolCareer|undefined;if(!c||typeof c!=='object'||Array.isArray(c)||!c.world||c.world.leagueKey!==undefined)fail('HIGH_SCHOOL_OWNER_REQUIRED');engine.assertHighSchoolCareerRevision(c,c.revision);return c;}
export function applySchoolCareer(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_SCHOOL_'.length),allowed=fields.get(name),p=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!allowed.includes(k)))fail('INVALID_PAYLOAD');const input=p as Record<string,unknown>;
 let next:engine.HighSchoolCareer,stopReason:string|undefined,navigation:unknown;
 try{
  if(name==='CREATE'){
   if(Object.keys(state).some(k=>!['schemaVersion','stampCount','creationId','createdWith','nonce'].includes(k))||state.schemaVersion!==1||state.stampCount!==0||state.createdWith!=='M3_SHELL'||typeof state.nonce!=='string'||!state.nonce)fail('EMPTY_CAREER_SAVE_REQUIRED');
   if(!['HITTER','PITCHER'].includes(String(input.kind))||!['GROWTH','REALISTIC','SECRET_CHEAT'].includes(String(input.difficulty))||!['name','position','throws','bats','archetype','schoolId'].every(k=>typeof input[k]==='string')||!Array.isArray(input.focus)||!input.focus.every(k=>typeof k==='string')||!Number.isSafeInteger(input.seasonYear)|| (input.kind==='HITTER'?(input.pitchForm!==null||input.secondaryPitch!==undefined):typeof input.pitchForm!=='string'||typeof input.secondaryPitch!=='string'))fail('INVALID_PAYLOAD');
   const {schoolId,seasonYear,secondaryPitch,...player}=input,worldKey=JSON.stringify(['career',state.nonce]),seed=randomUUID();
   const world=engine.createHighSchoolWorld({worldKey,seed,schoolId:schoolId as string,seasonYear:seasonYear as number,seasonKey:String(seasonYear),player:{...player,simulationKey:JSON.stringify(['career-player',state.nonce])} as unknown as engine.CreationInput,...(secondaryPitch===undefined?{}:{secondaryPitch:secondaryPitch as PitchId})});
   next=engine.createHighSchoolCareer(world,input.difficulty as engine.HighSchoolCareer['difficulty']);
  }else{
   const c=owner(state),revision=input.careerRevision;if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)fail('INVALID_PAYLOAD');
   if(name==='CONFIRM_PLAYER')next=engine.confirmCareerPlayer(c,revision);
   else if(name==='RESOLVE_FOCUS'){
    if(typeof input.eventKey!=='string'||typeof input.eventVersion!=='number'||!Number.isSafeInteger(input.eventVersion)||input.eventVersion<1||!['KEEP_FOCUS','CHOOSE_FOCUS'].includes(String(input.command))||(input.focus!==undefined&&(!Array.isArray(input.focus)||!input.focus.every(k=>typeof k==='string'))))fail('INVALID_PAYLOAD');
    if(input.command==='KEEP_FOCUS'&&input.focus!==undefined)fail('INVALID_PAYLOAD');
    next=engine.resolveCareerFocusEvent(c,revision,input as unknown as Parameters<typeof engine.resolveCareerFocusEvent>[2]);
   }else if(name==='RESOLVE_WINDOW'||name==='RESOLVE_HIDDEN'){
    if(typeof input.eventKey!=='string'||typeof input.eventVersion!=='number'||
       !Number.isSafeInteger(input.eventVersion)||input.eventVersion<1||typeof input.command!=='string')fail('INVALID_PAYLOAD');
    const eventInput=input as unknown as {eventKey:string;eventVersion:number;command:string};
    const result=name==='RESOLVE_WINDOW'
     ?engine.resolveCareerWindowEvent(c,revision,eventInput)
     :engine.resolveHiddenTraitNotice(c,revision,eventInput);
    next=result.career;
    navigation=result.navigation;
   }else if(name==='TRAIN'){
    const choice=input.choice;
    if(!choice||typeof choice!=='object'||Array.isArray(choice))fail('INVALID_PAYLOAD');
    const t=choice as Record<string,unknown>;
    if(!['GUARANTEED','CHALLENGE','CONDITIONING','SKIP'].includes(String(t.type))||
       Object.keys(t).some(k=>k!=='type'&&k!=='ability')||
       (['GUARANTEED','CHALLENGE'].includes(String(t.type))?typeof t.ability!=='string':t.ability!==undefined))fail('INVALID_PAYLOAD');
    next=engine.trainHighSchoolCareer(c,revision,choice as engine.TrainingChoice);
   }else if(name==='CONFIRM_PRESEASON')next=engine.confirmCareerPreseason(c,revision);
   else if(name==='ACK_SEASON_REVIEW')next=engine.acknowledgeHighSchoolSeasonReview(c,revision);
   else if(name==='OPEN_ROUTE'){if(typeof input.eventVersion!=='number'||!Number.isSafeInteger(input.eventVersion)||input.eventVersion<1)fail('INVALID_PAYLOAD');next=engine.openHighSchoolCareerRoute(c,revision,input.eventVersion).career;}
   else {if(!['NEXT_MAJOR_EVENT','ONE_GAME','ONE_WEEK'].includes(String(input.mode)))fail('INVALID_PAYLOAD');const result=engine.advanceHighSchoolCareer(c,revision,input.mode as engine.HighSchoolAdvancePlan['mode']);next=result.career;stopReason=result.stopReason;}
  }
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next!},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,phase:next!.phaseContext.phase,name:next!.world.players[next!.world.protagonistKey]!.name,seasonKey:next!.world.seasonKey,...(stopReason?{stopReason}:{}),...(navigation?{navigation}:{})}};
}
export function schoolCareerScreen(state:SaveState){
 try{const c=owner(state),p=c.world.players[c.world.protagonistKey]!,phase=c.phaseContext,event=phase.phase==='EVENT_DECISION'?c.events.find(e=>e.eventKey===phase.eventKey&&e.status==='OPEN'):undefined;
  return {careerRevision:c.revision,phase:phase.phase,seasonKey:c.world.seasonKey,player:{name:p.name,kind:p.kind,position:p.position,age:p.age,abilities:p.abilities,overall:overall(p.kind,p.abilities).display},school:c.world.schools.find(s=>s.id===c.world.protagonistSchoolId)?.name,teamGames:Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,c.world.protagonistSchoolId)).length,event:event?{definitionId:event.definitionId,eventKey:event.eventKey,eventVersion:event.version}:null};
 }catch(error){domainError(error);}
}
/** The existing web career screen can resume this owner without falling back to UI fixture state. */
export function schoolCareerHome(saveId:string,state:SaveState){
 const view=schoolCareerScreen(state)!,c=owner(state),phase=c.phaseContext.phase;
 const action=(name:string,label:string,payload:Record<string,unknown>={})=>({id:'school:'+name+(payload.eventKey?':'+JSON.stringify([payload.eventKey,payload.eventVersion,c.revision]):''),label,kind:'ADVANCE' as const,primary:true,command:{type:'CAREER_SCHOOL_'+name,payload:{careerRevision:c.revision,...payload}}});
 const event=view.event,eventPayload=event?{eventKey:event.eventKey,eventVersion:event.eventVersion}:{};
 let actions:(ReturnType<typeof action>|{id:string;label:string;kind:'OPEN_SCREEN';primary:true})[]=[];
 if(phase==='CREATED')actions=[action('CONFIRM_PLAYER','선수 확인')];
 else if(phase==='PRESEASON_SETUP')actions=[action('CONFIRM_PRESEASON','시즌 시작')];
 else if(phase==='SEASON_PROGRESS')actions=[action('ADVANCE','진행')];
 else if(phase==='EVENT_DECISION'&&event&&['E01','E02','E03'].includes(event.definitionId)){
  actions=[action('RESOLVE_FOCUS','현재 육성 계획 유지',{...eventPayload,command:'KEEP_FOCUS'})];
 }else if(phase==='EVENT_DECISION'&&event?.definitionId==='E43'){
  actions=[action('RESOLVE_WINDOW','훈련 나중에 하기',{...eventPayload,command:'DEFER_TRAINING'})];
 }else if(phase==='EVENT_DECISION'&&event?.definitionId==='E41'){
  actions=[action('RESOLVE_WINDOW','현재 스타일 유지',{...eventPayload,command:'ACK_EVENT'})];
 }else if(phase==='EVENT_DECISION'&&event?.definitionId==='E84'){
  actions=[action('RESOLVE_HIDDEN','특성 확인',{...eventPayload,command:'OPEN_TRAITS'})];
 }else if(flowApplies(state))actions=[{id:'open:FLOW',label:'다음 단계 진행',kind:'OPEN_SCREEN',primary:true}];
 const phaseLabel:Record<string,string>={CREATED:'선수 확인',PRESEASON_SETUP:'시즌 준비',SEASON_PROGRESS:'정규시즌',EVENT_DECISION:'사건 선택',SEASON_REVIEW:'시즌 결산',CAREER_ROUTE:'진로 선택',NEXT_SEASON_READY:'다음 시즌 준비',RETIRE_CONFIRM:'은퇴 확인',ARCHIVED:'커리어 보관'};
 return {saveId,protagonist:{name:view.player.name,kindLabel:view.player.kind==='HITTER'?'타자':'투수',positionLabel:view.player.position,ageLabel:view.player.age+'세'},stage:{leagueLabel:'고교',teamName:view.school??'',seasonLabel:view.seasonKey+' 시즌',phaseLabel:phaseLabel[phase]??'커리어'},progress:{mode:'NEXT_MAJOR_EVENT' as const,alternatives:['ONE_GAME','ONE_WEEK'] as const},nextActions:actions,pendingEventTitle:view.event?engine.eventDefinition(view.event.definitionId).title:null,recentRecords:[{label:'종합',value:view.player.overall},{label:'팀 경기',value:String(view.teamGames)}]};
}

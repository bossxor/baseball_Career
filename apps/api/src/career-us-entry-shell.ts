import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';
import type {FlowCommand} from './career-flow-screen.js';

type Entry={roster:engine.UsRosterWorld;seal:string};
function fail(code:string):never{throw Object.assign(new Error(code),{code});}
const organizations=()=>Array.from({length:30},(_,index)=>{const id='US'+String(index+1).padStart(2,'0');return {id,name:id};});
function roster(c:engine.HighSchoolCareer){
 return engine.createUsRosterWorld({worldKey:c.world.worldKey,seasonKey:String(c.world.calendar!.year+1),seed:c.world.seed,difficulty:c.difficulty,organizations:c.usRecruitment?.world.clubs.map(({id,name})=>({id,name}))??organizations()});
}
/** Draw once at the real route transition, never on GET or on a player's repeated click. */
export function stageAmateurUsEntry(state:SaveState,c:engine.HighSchoolCareer):SaveState{
 const early=c.world.leagueKey==='COLLEGE'&&c.collegeAdmission?.academicYear===2&&c.phaseContext.phase==='EVENT_DECISION'&&c.phaseContext.eventKey===c.collegeEarlyRoute?.eventKey;
 if(c.usRecruitment||!c.world.calendar||c.phaseContext.phase!=='CAREER_ROUTE'&&!early)return {...state,career:c};
 const key=JSON.stringify(['amateur-us',c.world.worldKey,c.world.seasonKey,c.world.protagonistKey]);
 if(c.previousUsRecruitments?.some(r=>r.program.input.assessmentKey===key))return {...state,career:c};
 const population=roster(c),inventory=engine.initialUsRecruitmentInventory(population,population.organizations.map(o=>({organizationId:o.id,rookieCapacity:o.levels.ROOKIE.length+1,aCapacity:o.levels.A.length+1,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:true})));
 const next=engine.prepareCareerUsDirect(c,c.revision,inventory);
 if(!engine.careerUsDirectView(next).visible){
  const career={...next,previousUsRecruitments:[...(next.previousUsRecruitments??[]),{...next.usRecruitment!,closedBy:'NO_OFFER' as const}]};
  delete career.usRecruitment;
  const result:SaveState={...state,career};delete result.usEntry;return result;
 }
 return {...state,career:next,usEntry:{roster:population,seal:engine.canonicalSeal(population)} satisfies Entry};
}
export function amateurUsCommands(c:engine.HighSchoolCareer):FlowCommand[]{
 const phase=c.phaseContext;
 const cmd=(id:string,label:string,name:string,payload:Record<string,unknown>={}):FlowCommand=>({id,label,type:'CAREER_US_ENTRY_'+name,payload:{careerRevision:c.revision,...payload}});
 if(phase.phase==='NEXT_SEASON_READY'&&phase.route==='US'){
  const forfeit=!c.development?.trainingUsedSeasons.includes(c.world.seasonKey);
  return c.usYearEnd?[cmd('us-activate','미국 구단에 등록','ACTIVATE')]:[{...cmd('us-close-year','출국 준비 마감','CLOSE_YEAR',{forfeitUnusedTraining:forfeit}),...(forfeit?{confirm:'이번 시즌에 남은 특별 훈련을 포기하고 마감할까요?'}:{})}];
 }
 if(phase.phase!=='CAREER_ROUTE'||!c.usRecruitment||c.usRecruitment.closedBy)return [];
 const view=engine.careerUsDirectView(c);
 if(!view.visible)return [];
 const graduation=c.graduation?c.events.find(e=>e.eventKey===c.graduation!.eventKey):undefined;
 return [...view.offers.map(offer=>({...cmd('us-sign-'+offer.offerKey,offer.clubName+' 미국 마이너 계약','SIGN',{programVersion:view.version,offerKey:offer.offerKey,...(graduation?{eventVersion:graduation.version}:{})}),sign:{name:c.world.players[c.world.protagonistKey]!.name},confirm:'이 미국 계약을 수락할까요?',facts:[{label:'시작 리그',value:offer.initialLevel},{label:'연봉',value:'$'+offer.annualSalaryUsd.toLocaleString('en-US')},{label:'계약금',value:'$'+offer.signingBonusUsd.toLocaleString('en-US')}]})),{...cmd('us-decline','미국 제안 모두 거절','DECLINE',{programVersion:view.version}),confirm:'현재 미국 제안은 다시 수락할 수 없습니다. 거절할까요?'}];
}
export function applyUsEntry(state:SaveState,command:CommandBody):AppliedCommand{
 const name=command.type.slice('CAREER_US_ENTRY_'.length),fields:Record<string,readonly string[]>={SIGN:['careerRevision','programVersion','offerKey','eventVersion'],DECLINE:['careerRevision','programVersion'],CLOSE_YEAR:['careerRevision','forfeitUnusedTraining'],ACTIVATE:['careerRevision']};
 const raw=command.payload,allowed=fields[name];
 if(!allowed||!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!allowed.includes(k)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>,c=state.career as engine.HighSchoolCareer;
 if(!c||!c.world||'mode' in c||'protagonistClubId' in c)fail('AMATEUR_OWNER_REQUIRED');
 const revision=p.careerRevision;if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0)fail('INVALID_PAYLOAD');
 let next:engine.HighSchoolCareer|engine.UsCareer;
 try{
  if(name==='SIGN'){
   if(typeof p.programVersion!=='number'||!Number.isSafeInteger(p.programVersion)||p.programVersion<1||typeof p.offerKey!=='string'||p.eventVersion!==undefined&&(typeof p.eventVersion!=='number'||!Number.isSafeInteger(p.eventVersion)||p.eventVersion<1))fail('INVALID_PAYLOAD');
   next=engine.decideCareerUsDirect(c,revision,{programVersion:p.programVersion,decision:{type:'SIGN',offerKey:p.offerKey},...(p.eventVersion===undefined?{}:{eventVersion:p.eventVersion as number})});
  }else if(name==='DECLINE'){
   if(typeof p.programVersion!=='number'||!Number.isSafeInteger(p.programVersion)||p.programVersion<1)fail('INVALID_PAYLOAD');
   next=engine.decideCareerUsDirect(c,revision,{programVersion:p.programVersion,decision:{type:'DECLINE'}});
  }else if(name==='CLOSE_YEAR'){
   if(typeof p.forfeitUnusedTraining!=='boolean')fail('INVALID_PAYLOAD');
   next=engine.closeSchoolSeasonForUs(c,revision,p.forfeitUnusedTraining);
  }else{
   engine.assertCareerRevision(c,revision);
   const saved=state.usEntry as Entry|undefined;
   if(saved&&(!saved.roster||!engine.matchesCanonicalSeal(saved.seal,engine.canonicalSeal(saved.roster))))fail('US_ENTRY_ROSTER_CHANGED');
   next=engine.startSignedUsCareer(c,revision,saved?.roster??roster(c));
  }
 }catch(error){if(error&&typeof error==='object'&&'code' in error)throw error;fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
 const nextState:SaveState={...state,career:next!};if(name==='ACTIVATE')delete nextState.usEntry;
 return {nextState,phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision}};
}

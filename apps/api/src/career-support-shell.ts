import {createHash} from 'node:crypto';
import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

type ProCareer=engine.KboCareer|engine.UsCareer;
const fields=new Map<string,readonly string[]>([
 ['CAREER_GOALS_OPEN',[]],['CAREER_GOALS_RESOLVE',['eventKey','eventVersion','command','goalIds']],['CAREER_GOALS_REPLACE',['slot','goalId']],
 ['CAREER_AGENT_OPEN',[]],['CAREER_AGENT_RESOLVE',['eventKey','eventVersion','command','agentId','previewId','raiseBps']],['CAREER_AGENT_CHANGE',['agentId']],['CAREER_AGENT_PROMISE',[]],['CAREER_AGENT_OPEN_US_SALARY',[]],
]);
const agentSelections=new Map<string,readonly string[]>([['HIRE_AGENT',['agentId']],['REQUEST_SALARY_COUNTER',['previewId','raiseBps']],['REQUEST_ROLE_REVIEW',['previewId']]]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
const isUs=(c:engine.GoalCareer):c is engine.UsCareer=>'mode'in c&&c.mode==='US_CAREER';
function owner(state:SaveState):engine.GoalCareer {
 const c=state.career;if(!c||typeof c!=='object'||Array.isArray(c)||!('world'in c)||!c.world||typeof c.world!=='object')fail('CAREER_NOT_FOUND');return c as engine.GoalCareer;
}
function pro(c:engine.GoalCareer):ProCareer {if(!isUs(c)&&!('protagonistClubId'in c))fail('PRO_CAREER_REQUIRED');return c as ProCareer;}
const token=(nativeId:string)=>createHash('sha256').update(nativeId).digest('hex');
function nativePreview(c:ProCareer,kind:'SALARY'|'ROLE'){return kind==='SALARY'?engine.careerSalaryCounterPreview(c):engine.careerRoleReviewPreview(c);}
function consumePreview(c:ProCareer,kind:'SALARY'|'ROLE',publicId:string){const q=nativePreview(c,kind);if(publicId!==token(q.previewId))throw new RangeError('PREVIEW_STALE');return q.previewId;}
function optionalPreview<T>(read:()=>T):T|null {
 try{return read();}catch(error){if(error instanceof RangeError&&['AGENT_NOT_ELIGIBLE','AGENT_SALARY_OFFER_NOT_AVAILABLE','AGENT_ROLE_NOT_ELIGIBLE'].includes(error.message))return null;throw error;}
}
/** Choice identifiers only. The native owner supplies every price, probability, available window and receipt. */
export function applyCareerSupport(state:SaveState,command:CommandBody):AppliedCommand {
 const allowed=fields.get(command.type),raw=command.payload;if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');const p=raw as Record<string,unknown>;
 const string=(key:string)=>typeof p[key]==='string'&&p[key]?p[key] as string:fail('INVALID_PAYLOAD');
 const number=(key:string,min=1)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&p[key]>=min?p[key] as number:fail('INVALID_PAYLOAD');
 const revision=number('careerRevision'),c=owner(state);let next:engine.GoalCareer,navigation:unknown;
 try{
  switch(command.type){
   case 'CAREER_GOALS_OPEN':next=engine.openCareerSeasonGoalSelection(c,revision);break;
   case 'CAREER_GOALS_RESOLVE':{
    const choice=string('command');if(p.goalIds!==undefined&&(choice!=='SET_GOALS'||!Array.isArray(p.goalIds)||!p.goalIds.every(id=>typeof id==='string'&&Object.hasOwn(engine.SEASON_GOAL_DEFINITIONS,id))))fail('INVALID_PAYLOAD');
    const result=engine.resolveCareerGoalEvent(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:choice as 'SET_GOALS'|'ACK_EVENT'|'OPEN_ACHIEVEMENTS',...(p.goalIds!==undefined?{goalIds:p.goalIds as engine.SeasonGoalId[]}: {})});next=result.career;navigation=result.navigation;break;
   }
   case 'CAREER_GOALS_REPLACE':{const id=string('goalId');if(!Object.hasOwn(engine.SEASON_GOAL_DEFINITIONS,id))fail('INVALID_PAYLOAD');next=engine.replaceCareerSeasonGoal(c,revision,number('slot',0),id as engine.SeasonGoalId);break;}
   case 'CAREER_AGENT_OPEN':next=engine.openCareerAgentEvents(pro(c),revision);break;
   case 'CAREER_AGENT_RESOLVE':{
    const a=pro(c),choice=string('command'),selection=agentSelections.get(choice)??[];
    if(['agentId','previewId','raiseBps'].some(key=>p[key]!==undefined&&!selection.includes(key)))fail('INVALID_PAYLOAD');
    if(p.agentId!==undefined)string('agentId');if(p.previewId!==undefined)string('previewId');
    if(p.raiseBps!==undefined&&![1000,2000,3000].includes(number('raiseBps')))fail('INVALID_PAYLOAD');
    const previewId=choice==='REQUEST_SALARY_COUNTER'?consumePreview(a,'SALARY',string('previewId')):choice==='REQUEST_ROLE_REVIEW'?consumePreview(a,'ROLE',string('previewId')):undefined;
    next=engine.resolveCareerAgentEvent(a,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:choice as 'HIRE_AGENT'|'REQUEST_SALARY_COUNTER'|'REQUEST_ROLE_REVIEW'|'ACK_EVENT',...(p.agentId!==undefined?{agentId:p.agentId as engine.CareerAgentId}:{}),...(previewId?{previewId}:{}),...(p.raiseBps!==undefined?{raiseBps:p.raiseBps as 1000|2000|3000}:{})});break;
   }
   case 'CAREER_AGENT_CHANGE':next=engine.changeCareerAgent(pro(c),revision,p.agentId===null?null:string('agentId') as engine.CareerAgentId);break;
   case 'CAREER_AGENT_PROMISE':next=engine.acceptCareerRolePromise(pro(c),revision);break;
   case 'CAREER_AGENT_OPEN_US_SALARY':{
    if(!isUs(c))fail('US_CAREER_REQUIRED');const owned=c.agents?.usSalaryOffers?.find(o=>o.fromSeasonKey===c.world.seasonKey);
    next=engine.openUsAgentSalaryOffer(c,revision,owned?.funding??c.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:0})),owned?.futureBudgets??[]);break;
   }
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){domainError(error);}
 return {nextState:{...state,career:next!},phase:next!.phaseContext.phase,eventIds:[],summary:{type:command.type,careerRevision:next!.revision,...(navigation?{navigation}:{})}};
}
function goalSlot(g:engine.SeasonGoalSlot){return {slot:g.slot,goalId:g.goalId,scope:{...g.scope},teamKey:g.teamKey,status:g.status,progress:g.progress,target:engine.SEASON_GOAL_DEFINITIONS[g.goalId].target};}
export function careerSupportScreen(state:SaveState,screenId:'CAREER_GOALS'|'CAREER_AGENT'){
 const c=owner(state);
 try{
  if(screenId==='CAREER_GOALS'){
   const v=engine.careerSeasonGoalsView(c);
   return {careerRevision:c.revision,seasonKey:v.seasonKey,availabilityReason:v.availabilityReason,selection:v.selection,definitions:v.definitions,recommendedIds:v.recommendedIds,noticeDelivery:v.noticeDelivery,notices:v.notices,slots:v.slots.map(g=>({...goalSlot(g),previousLeague:g.previousLeague})),history:v.history.map(goalSlot),replacement:v.replacement,rewards:v.rewards.map(r=>({rewardId:r.rewardId,type:r.type})),gameplayRewardDelta:v.gameplayRewardDelta};
  }
  const a=pro(c);if(isUs(a))engine.assertUsCareerRevision(a,a.revision);else engine.assertKboCareerRevision(a,a.revision);
  const salary=optionalPreview(()=>engine.careerSalaryCounterPreview(a)),role=optionalPreview(()=>engine.careerRoleReviewPreview(a)),view=engine.careerAgentView(a);
  return {careerRevision:a.revision,...view,notices:view.notices.map(n=>({...n,commands:[...(a.agents?.notices.find(e=>e.eventKey===n.eventKey)?.offeredChoices??[])]})),salary:salary?{previewId:token(salary.previewId),offerSetKey:salary.offerSetKey,baseOfferKey:salary.baseOfferKey,currency:salary.currency,deadlineWorldDay:salary.deadlineWorldDay,relationshipTrust:salary.relationshipTrust,requestUsed:salary.requestUsed,baseOfferState:salary.baseOfferState,options:salary.options}:null,role:role?{previewId:token(role.previewId),bucketKey:role.bucketKey,clubId:role.clubId,leagueKey:role.leagueKey,position:role.position,probability:role.probability,odds:role.odds,requestUsed:role.requestUsed}:null};
 }catch(error){domainError(error);}
}

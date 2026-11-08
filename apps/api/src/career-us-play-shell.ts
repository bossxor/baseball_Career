import * as engine from '@playball/engine';
import {spanDeadline,spanStopOf} from './span-budget.js';
import type {SpanStop} from './span-budget.js';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

const fields=new Map<string,readonly string[]>([
 ['ADVANCE_SPAN',['span']],['RESOLVE_CAMP',['eventKey','eventVersion','command','focus']],['CONFIRM_PRESEASON',[]],
 ['PUBLISH_SCHEDULE',[]],['START',[]],['ADVANCE',['maxDays']],['RESOLVE_HIDDEN',['eventKey','eventVersion','command']],
 ['RESOLVE_WINDOW',['eventKey','eventVersion','command']],['RESOLVE_LEVEL',['eventKey','eventVersion','command']],['TRAIN',['choice']],['CHANGE_STYLE',['archetype']],
 ['NEXT_MINOR_YEAR',[]],['OPEN_MINOR_MARKET',[]],['RESOLVE_MINOR_MARKET',['eventKey','eventVersion','command']],['ACCEPT_MINOR_OFFER',['offerKey']],
 ['CONFIGURE_LEAGUES',[]],['START_POSTSEASON',[]],['ADVANCE_POSTSEASON',[]],
 ['OPEN_MAJOR_FA_WINDOW',[]],['RESOLVE_MAJOR_FA_WINDOW',['eventKey','eventVersion','command']],
 ['NEXT_MAJOR_YEAR',['counterOfferKey']],['ACCEPT_MAJOR_FA',['counterOfferKey','offerKey']],
]);
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');}
function owner(state:SaveState):engine.UsCareer {
 if(!state.career||typeof state.career!=='object'||Array.isArray(state.career))fail('CAREER_NOT_FOUND');
 return state.career as engine.UsCareer;
}
function majorFunding(c:engine.UsCareer){
 return c.agents?.usSalaryOffers?.find(o=>o.fromSeasonKey===c.world.seasonKey)?.funding??c.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:0}));
}
function majorPrice(c:engine.UsCareer,funding:ReturnType<typeof majorFunding>,baseSalary:number){
 const offer=c.agents?.usSalaryOffers?.find(o=>o.fromSeasonKey===c.world.seasonKey),accepted=c.agents?.salaryRequests.find(r=>r.offerSetKey===offer?.offerSetKey&&r.outcome==='ACCEPTED'),key=accepted?.counterOfferKey??undefined;
 const price=engine.careerAgentUsSalary(c,funding,baseSalary,key);
 return {annualSalaryUsd:price.annualSalaryUsd,...(key?{counterOfferKey:key}:{})};
}
export function majorContractView(c:engine.UsCareer,transition:ReturnType<typeof engine.usYearTransitionReadiness>|null){
 if(c.contract.type!=='US_MAJOR'||!transition||transition.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'&&!(b==='OPEN_EVENT'&&engine.hasOnlyUsMajorFaWindowEvent(c))))return null;
 const funding=majorFunding(c);
 try{
  const quote=engine.usMajorRenewalPreview(c),balance=c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd+(funding.find(f=>f.organizationId===c.protagonistOrganizationId)?.addedBudgetUsd??0),price=quote.guaranteed?{annualSalaryUsd:quote.annualSalaryUsd}:majorPrice(c,funding,quote.annualSalaryUsd);
  return {kind:'RENEWAL' as const,...quote,...price,funded:balance>=price.annualSalaryUsd};
 }catch(error){
  if(error instanceof RangeError&&error.message==='US_MAJOR_RENEWAL_NOT_AVAILABLE'&&transition.mlbService.freeAgentEligible){const market=engine.usMajorFreeAgencyPreview(c,funding);return {kind:'FREE_AGENCY' as const,...market,offers:market.offers.map(o=>({offerKey:o.offerKey,organizationId:o.organizationId,currentLevel:o.initialLevel,years:o.years,currency:o.currency,nationalReleaseAllowed:o.nationalReleaseAllowed,militaryReturnOption:o.militaryReturnOption,...(o.organizationId===c.protagonistOrganizationId?majorPrice(c,funding,o.annualSalaryUsd):{annualSalaryUsd:o.annualSalaryUsd})}))};}
  throw error;
 }
}
/** One request chains the engine's own day/chunk advances: SEASON until the engine stops for anything but its internal limits
 * (mandatory event, injury, roster decision, season review); MONTH until 30 world days are closed or an earlier stop. */
function advanceUsSpan(c:engine.UsCareer,revision:number,span:'SEASON'|'MONTH'){
 const until=spanDeadline();
 const result=engine.advanceUsCareerRun(c,revision,span==='MONTH'?30:Number.MAX_SAFE_INTEGER,()=>Date.now()<until);
 return {...result,monthDone:span==='MONTH'&&result.daysClosed>=30};
}
export function applyUsPlay(state:SaveState,command:CommandBody):AppliedCommand {
 const name=command.type.slice('CAREER_US_PLAY_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>;
 const number=(key:string)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&p[key]>=0?p[key] as number:fail('INVALID_PAYLOAD');
 const string=(key:string)=>typeof p[key]==='string'?p[key] as string:fail('INVALID_PAYLOAD');
 const revision=number('careerRevision');
 if(name==='ADVANCE'&&(number('maxDays')<1||number('maxDays')>7))fail('INVALID_PAYLOAD');
 if(p.offerKey!==undefined&&(typeof p.offerKey!=='string'||!p.offerKey))fail('INVALID_PAYLOAD');
 if(p.counterOfferKey!==undefined&&(typeof p.counterOfferKey!=='string'||!p.counterOfferKey))fail('INVALID_PAYLOAD');
 if(p.focus!==undefined&&(!Array.isArray(p.focus)||!p.focus.every(key=>typeof key==='string')))fail('INVALID_PAYLOAD');
 if(name==='TRAIN'){
  const choice=p.choice;if(!choice||typeof choice!=='object'||Array.isArray(choice))fail('INVALID_PAYLOAD');
  const t=choice as Record<string,unknown>;
  if(!['GUARANTEED','CHALLENGE','CONDITIONING','SKIP'].includes(String(t.type))||Object.keys(t).some(key=>key!=='type'&&key!=='ability')||(['GUARANTEED','CHALLENGE'].includes(String(t.type))?typeof t.ability!=='string':t.ability!==undefined))fail('INVALID_PAYLOAD');
 }
 const c=owner(state);let next:engine.UsCareer,stopReason:string|undefined,rosterIssue:unknown,navigation:unknown,spanStop:SpanStop|undefined;
 try{
  switch(name){
   case 'RESOLVE_CAMP':next=engine.resolveUsFirstCampNotice(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command'),...(p.focus?{focus:p.focus as string[]}: {})});break;
   case 'CONFIRM_PRESEASON':next=engine.confirmUsPreseasonPlan(c,revision);break;
   case 'PUBLISH_SCHEDULE':next=engine.publishUsSeasonSchedule(c,revision);break;
   case 'START':next=engine.startUsRegularSeason(c,revision);break;
   case 'ADVANCE_SPAN':{if(p.span!=='SEASON'&&p.span!=='MONTH')fail('INVALID_PAYLOAD');const result=advanceUsSpan(c,revision,p.span);next=result.career;stopReason=result.stopReason;rosterIssue=result.rosterIssue;spanStop=spanStopOf(p.span,next.phaseContext.phase,result.stopReason,result.monthDone);break;}
   case 'ADVANCE':{const result=engine.advanceUsCareer(c,revision,number('maxDays'));next=result.career;stopReason=result.stopReason;rosterIssue=result.rosterIssue;break;}
   case 'RESOLVE_HIDDEN':{const result=engine.resolveProHiddenTraitNotice(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command')});next=result.career;navigation=result.navigation;break;}
   case 'RESOLVE_WINDOW':{const result=engine.resolveUsWindowEvent(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command')});next=result.career;navigation=result.navigation;break;}
   case 'RESOLVE_LEVEL':{const result=engine.resolveUsLevelEventResult(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command')});next=result.career;navigation=result.navigation;break;}
   case 'TRAIN':next=engine.trainUsCareer(c,revision,p.choice as engine.TrainingChoice);break;
   case 'CHANGE_STYLE':next=engine.changeUsMidseasonArchetype(c,revision,string('archetype'));break;
   // No annual grant is inferred from an HTTP request; reuse a sealed quote or carry the current balance.
   case 'NEXT_MINOR_YEAR':next=engine.startNextUsMinorSeason(c,revision,c.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:0})));break;
   case 'OPEN_MINOR_MARKET':next=engine.openUsMinorMarket(c,revision,c.minorMarket?.funding??c.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:0})));break;
   case 'RESOLVE_MINOR_MARKET':{const result=engine.resolveUsMinorMarketEvent(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command')});next=result.career;navigation=result.navigation;break;}
   case 'ACCEPT_MINOR_OFFER':next=engine.acceptUsMinorMarketOffer(c,revision,string('offerKey'));break;
   case 'CONFIGURE_LEAGUES':engine.assertUsMilitaryPlayable(c);next=engine.configureUsCareerConferences(c,revision);break;
   case 'START_POSTSEASON':{
    engine.assertUsCareerRevision(c,revision);engine.assertUsMilitaryPlayable(c);
    if(!c.world.conferenceRegistry)fail('US_CONFERENCES_NOT_CONFIGURED');
    next=engine.startUsPostseason(c,revision,c.world.conferenceRegistry);break;
   }
   case 'ADVANCE_POSTSEASON':{engine.assertUsMilitaryPlayable(c);const result=engine.advanceUsPostseason(c,revision);next=result.career;stopReason=result.stopReason;break;}
   case 'NEXT_MAJOR_YEAR':next=engine.startNextUsMajorSeason(c,revision,majorFunding(c),p.counterOfferKey as string|undefined);break;
   case 'OPEN_MAJOR_FA_WINDOW':next=engine.openUsMajorFaWindow(c,revision,majorFunding(c));break;
   case 'RESOLVE_MAJOR_FA_WINDOW':{const r=engine.resolveUsMajorFaWindow(c,revision,{eventKey:string('eventKey'),eventVersion:number('eventVersion'),command:string('command')});next=r.career;navigation=r.navigation;break;}
   case 'ACCEPT_MAJOR_FA':next=engine.acceptUsMajorFreeAgency(c,revision,majorFunding(c),p.counterOfferKey as string|undefined,p.offerKey as string|undefined);break;
   default:fail('UNSUPPORTED_COMMAND');
  }
 }catch(error){domainError(error);}
 const phase=next!.phaseContext.phase;
 return {nextState:{...state,career:next!,...(spanStop?{span:{careerRevision:next!.revision,stop:spanStop}}:{})},phase,summary:{type:command.type,careerRevision:next!.revision,phase,...(spanStop?{spanStop}:{}),...(stopReason?{stopReason}:{}),...(rosterIssue?{rosterIssue}:{}),...(navigation?{navigation}:{})},eventIds:[]};
}
export function usPlayScreen(state:SaveState):unknown {
 const c=owner(state);
 try{
  engine.assertUsMilitaryPlayable(c);
  const view=engine.usCareerView(c),phase=c.phaseContext,event=phase.phase==='EVENT_DECISION'?c.events.find(event=>event.eventKey===phase.eventKey&&event.status==='OPEN'):undefined,transition=phase.phase==='SEASON_REVIEW'?engine.usYearTransitionReadiness(c):null;
  return {...view,careerRevision:c.revision,campNotices:c.phaseContext.phase==='PRESEASON_SETUP'?engine.unreadUsFirstCampNotices(c):[],
   pendingEvent:event?{eventKey:event.eventKey,eventVersion:event.version,definitionId:event.definitionId,commands:[...event.offeredChoices]}:null,
   progress:c.season?{closedDays:c.season.days.length,firstDay:c.season.firstDay,lastDay:c.season.lastDay,paidUsd:c.season.paidUsd}:null,
   yearTransition:transition,
   majorContract:majorContractView(c,transition),
   majorFaWindow:c.majorFaWindow?engine.usMajorFaWindowView(c):null,
   leagues:engine.usConferenceConfigurationView(c),
   postseason:phase.phase==='POSTSEASON_PROGRESS'||c.postseason?engine.usPostseasonView(c):null,
   minorMarket:c.minorMarket?{...engine.usMinorMarketView(c),eventKey:c.minorMarket.eventKey,eventVersion:c.events.find(event=>event.eventKey===c.minorMarket!.eventKey)!.version}:null};
 }catch(error){domainError(error);}
}

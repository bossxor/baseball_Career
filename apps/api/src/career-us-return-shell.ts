import * as engine from '@playball/engine';
import type {AppliedCommand,CommandBody,SaveState} from './engine-command.js';

const fields=new Map<string,readonly string[]>([
 ['RETIRE_REQUEST',[]],['RETIRE_RESOLVE',['eventKey','eventVersion','decision']],['OPEN_ARCHIVE',['eventKey','eventVersion']],['REQUEST',[]],['START_YEAR',['eventVersion']],['ADVANCE',[]],['SETTLE_YEAR',[]],
 ['DRAFT_PREPARE',['preferredClubId']],['DRAFT_RESOLVE',['programVersion']],
 ['DRAFT_DECIDE',['programVersion','decision']],['KBO_ACTIVATE',[]],['US_ACCEPT',['offerKey']],
]);
export const US_RETURN_SCREEN_IDS=['US_RETURN_PROGRAM'] as const;
function fail(code:string):never {throw Object.assign(new Error(code),{code});}
function domainError(error:unknown):never {
 fail(error instanceof Error&&/^[A-Z][A-Z0-9_]*$/.test(error.message)?error.message:'INVALID_REQUEST');
}
function owner(state:SaveState):engine.UsAmateurReturnCareer {
 if(!state.career||typeof state.career!=='object'||Array.isArray(state.career))fail('CAREER_NOT_FOUND');
 const career=state.career as engine.UsAmateurReturnCareer;
 engine.assertUsAmateurReturnCareer(career);return career;
}

/** Mandatory return uses persisted owners only; callers cannot supply worlds, budgets or completion receipts. */
export function applyUsReturn(state:SaveState,command:CommandBody):AppliedCommand {
 const name=command.type.slice('CAREER_US_RETURN_'.length),allowed=fields.get(name),raw=command.payload;
 if(!allowed)fail('UNSUPPORTED_COMMAND');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>key!=='careerRevision'&&!allowed.includes(key)))fail('INVALID_PAYLOAD');
 const p=raw as Record<string,unknown>;
 const number=(key:string)=>typeof p[key]==='number'&&Number.isSafeInteger(p[key])&&p[key]>=0?p[key] as number:fail('INVALID_PAYLOAD');
 const revision=number('careerRevision');
 if(!state.career||typeof state.career!=='object'||Array.isArray(state.career))fail('CAREER_NOT_FOUND');
 let next:engine.UsAmateurReturnCareer|engine.UsCareer|engine.KboCareer,stopReason:string|undefined,navigation:unknown;
 try{
  if(name==='REQUEST')next=engine.requestUsAmateurReturn(state.career as engine.UsCareer,revision);
  else{
   const c=owner(state);
   switch(name){
    case 'RETIRE_REQUEST':next=engine.requestUsReturnRetirement(c,revision);break;
    case 'RETIRE_RESOLVE':
     if(typeof p.eventKey!=='string'||!['CONFIRM_RETIRE','CANCEL_RETIRE'].includes(p.decision as string))fail('INVALID_PAYLOAD');
     next=engine.resolveUsReturnRetirement(c,revision,{eventKey:p.eventKey,eventVersion:number('eventVersion'),command:p.decision as 'CONFIRM_RETIRE'|'CANCEL_RETIRE'});break;
    case 'OPEN_ARCHIVE':{
     if(typeof p.eventKey!=='string')fail('INVALID_PAYLOAD');const result=engine.openUsReturnArchive(c,revision,{eventKey:p.eventKey,eventVersion:number('eventVersion')});next=result.career;navigation=result.navigation;break;
    }
    case 'START_YEAR':next=engine.startUsAmateurReturnYear(c,revision,number('eventVersion'));break;
    case 'ADVANCE':{const result=engine.advanceUsAmateurReturn(c,revision);next=result.career;stopReason=result.stopReason;break;}
    case 'SETTLE_YEAR':next=engine.settleUsAmateurReturnYear(c,revision);break;
    case 'DRAFT_PREPARE':{
     if(p.preferredClubId!==undefined&&p.preferredClubId!==null&&typeof p.preferredClubId!=='string')fail('INVALID_PAYLOAD');
     next=engine.prepareUsAmateurReturnDraft(c,revision,p.preferredClubId as string|null|undefined);break;
    }
    case 'DRAFT_RESOLVE':next=engine.resolveUsAmateurReturnDraft(c,revision,number('programVersion'));break;
    case 'DRAFT_DECIDE':{
     if(p.decision!=='SIGN'&&p.decision!=='DECLINE')fail('INVALID_PAYLOAD');
     next=engine.decideUsAmateurReturnDraft(c,revision,number('programVersion'),p.decision);break;
    }
    case 'KBO_ACTIVATE':next=engine.startSignedUsAmateurReturnKboCareer(c,revision);break;
    case 'US_ACCEPT':if(typeof p.offerKey!=='string')fail('INVALID_PAYLOAD');next=engine.resignUsAfterAmateurReturn(c,revision,p.offerKey);break;
    default:fail('UNSUPPORTED_COMMAND');
   }
  }
 }catch(error){domainError(error);}
 const phase='source' in next!?(next.retirement?.status==='ARCHIVED'?'ARCHIVED':next.retirement?.status==='PENDING'?'EVENT_DECISION':next.return.status==='PREPARING'?(next.preparation?.phase??next.service?.phaseContext.phase??'CAREER_ROUTE'):'CAREER_ROUTE'):next!.phaseContext.phase;
 return {nextState:{...state,career:next!},phase,summary:{type:command.type,careerRevision:next!.revision,phase,...(stopReason?{stopReason}:{}),...(navigation?{navigation}:{})},eventIds:[]};
}

export function usReturnScreen(state:SaveState,screen:string) {
 if(screen!=='US_RETURN_PROGRAM')fail('UNSUPPORTED_SCREEN');
 try{
  const c=owner(state),p=c.preparation,service=c.service,last=c.return.years.at(-1);
  const preparation=p?engine.preparationSeasonView(p):null;
  const settleReady=c.return.status==='PREPARING'&&(p?
   p.phase==='PREPARATION_REGULAR'&&!p.pendingGame&&p.nextWorldDay===Math.max(...p.world.schedule.map(game=>game.worldDay))+1&&preparation!.completedTeamGames===48:
   service?.phaseContext.phase==='SEASON_REVIEW'&&service.military.service?.cursor?.worldDay===service.world.calendar.growthDays.at(-1));
  const current=p??service;
  const canAcceptUs=Boolean(last&&current?.world.seasonKey===last.seasonKey&&current.seasonGrowth.finalized&&(!p||p.phase==='PREPARATION_RESULT')&&c.return.militaryStatus!=='UNRESOLVED'&&['PREPARING','DRAFT_READY'].includes(c.return.status)&&c.draft?.program.decision!=='SIGNED');
  return {...engine.usAmateurReturnCareerView(c),careerRevision:c.revision,
   progress:preparation?{phase:preparation.phase,seasonKey:preparation.seasonKey,completedTeamGames:preparation.completedTeamGames,scheduledTeamGames:preparation.scheduledTeamGames,nextWorldDay:preparation.nextWorldDay}:
    service?{phase:service.phaseContext.phase,seasonKey:service.world.seasonKey,cursor:service.military.service?.cursor??null}:null,
   settleReady:Boolean(settleReady),retirement:engine.usReturnRetirementView(c),canRetire:engine.canRequestUsReturnRetirement(c),
   usOptions:(c.source.minorMarket?.offers??[]).filter(offer=>offer.militaryReturnOption).map(offer=>({offerKey:offer.offerKey,organizationId:offer.organizationId,organizationName:offer.organizationName,initialLevel:offer.initialLevel,currency:offer.currency,annualSalaryUsd:offer.annualSalaryUsd,years:offer.years,available:canAcceptUs})),
  };
 }
 catch(error){domainError(error);}
}

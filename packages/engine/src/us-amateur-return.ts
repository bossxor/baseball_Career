import {canonicalJson} from './game.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {usMilitaryCompletionDays} from './us-military-plan.js';
import type {UsMilitaryServiceProgram} from './us-military-plan.js';
import {createSeasonCalendar} from './season-calendar.js';
import {validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {createSeasonGrowthLedger,validateSeasonGrowthLedger,settleClosedGrowthPeriods,finalizeSeasonGrowth} from './growth-ledger.js';
import type {SeasonGrowthLedger,ClosedGrowthPeriod} from './growth-ledger.js';
import type {RecordLedger} from './records.js';
import {assertPreparationSeason} from './preparation-season.js';
import type {PreparationSeason} from './preparation-season.js';
import type {RetryRouteAuthority} from './retry-career.js';
import {appearanceFatigue} from './lineup.js';

export interface UsAmateurReturnYear {
 seasonKey:string;age:number;endWorldDay:number;kind:'INDEPENDENT'|'ACTIVE_SERVICE'|'ACTIVE_AND_TRAINING';receiptKey:string;
 seasonGrowth:SeasonGrowthLedger;endingPlayer:DevelopmentPlayer;recordRevision:number;
}
export interface UsAmateurReturnLedger {
 version:1;revision:number;returnId:string;worldKey:string;playerKey:string;sourceSeasonKey:string;sourceRevision:number;sourceContractKey:string;sourceAge:number;
 origin:'HIGH_SCHOOL_DIRECT'|'COLLEGE_DIRECT';status:'PREPARING'|'DRAFT_READY'|'CANCELLED_US';militaryStatus:'UNRESOLVED'|'COMPLETED'|'NOT_APPLICABLE';
 sourcePlayer:DevelopmentPlayer;years:readonly UsAmateurReturnYear[];cancelledByOfferRef?:string;draftReservationKey:string|null;
}
function returnKey(s:Pick<UsAmateurReturnLedger,'worldKey'|'playerKey'|'sourceSeasonKey'|'sourceContractKey'>):string {return JSON.stringify(['us-amateur-return',s.worldKey,s.playerKey,s.sourceSeasonKey,s.sourceContractKey]);}
/** Pure root-reader hook, deliberately does not read the active US career again. */
export function assertUsAmateurReturnLedger(s:UsAmateurReturnLedger,identity?:{worldKey:string;playerKey:string}):void {
 validateDevelopmentPlayer(s.sourcePlayer);
 if(s.version!==1||!Number.isSafeInteger(s.revision)||s.revision<1||!Number.isSafeInteger(s.sourceRevision)||s.sourceRevision<0||!s.worldKey||!s.playerKey||!s.sourceContractKey||!/^\d{4}$/.test(s.sourceSeasonKey)||Number(s.sourceSeasonKey)<2027||Number(s.sourceSeasonKey)>9997||!Number.isSafeInteger(s.sourceAge)||s.sourceAge<19||s.sourceAge+2>35||s.returnId!==returnKey(s)||!['HIGH_SCHOOL_DIRECT','COLLEGE_DIRECT'].includes(s.origin)||!['PREPARING','DRAFT_READY','CANCELLED_US'].includes(s.status)||!['UNRESOLVED','COMPLETED','NOT_APPLICABLE'].includes(s.militaryStatus)||!Array.isArray(s.years)||s.years.length>2||identity&&(identity.worldKey!==s.worldKey||identity.playerKey!==s.playerKey))throw new RangeError('INVALID_US_AMATEUR_RETURN');
 if(s.sourcePlayer.simulationKey!==s.playerKey||s.sourcePlayer.age!==s.sourceAge)throw new RangeError('US_RETURN_SOURCE_PLAYER_MISMATCH');
 for(const [i,y]of s.years.entries()){
  validateDevelopmentPlayer(y.endingPlayer);validateSeasonGrowthLedger(y.seasonGrowth);const calendar=createSeasonCalendar(Number(y.seasonKey));
  if(y.seasonKey!==String(Number(s.sourceSeasonKey)+i+1)||y.age!==s.sourceAge+i+1||y.endingPlayer.age!==y.age||y.endingPlayer.simulationKey!==s.playerKey||y.seasonGrowth.playerKey!==s.playerKey||y.seasonGrowth.seasonKey!==y.seasonKey||!y.seasonGrowth.finalized||y.seasonGrowth.aging?.elapsedDays!==calendar.growthDays.length||y.endWorldDay!==calendar.growthDays.at(-1)||!['INDEPENDENT','ACTIVE_SERVICE','ACTIVE_AND_TRAINING'].includes(y.kind)||y.kind==='ACTIVE_SERVICE'&&i!==0||y.kind==='ACTIVE_AND_TRAINING'&&i!==1||!y.receiptKey||!Number.isSafeInteger(y.recordRevision)||y.recordRevision<0)throw new RangeError('INVALID_US_AMATEUR_RETURN_YEAR');
 }
 const reservation=JSON.stringify(['amateur-return-draft',s.returnId,String(Number(s.sourceSeasonKey)+2)]);
 if((s.status==='DRAFT_READY'?(s.years.length!==2||s.militaryStatus==='UNRESOLVED'||s.draftReservationKey!==reservation):s.draftReservationKey!==null)||s.status==='PREPARING'&&s.years.length===2||(s.status==='CANCELLED_US'?!s.cancelledByOfferRef:s.cancelledByOfferRef!==undefined))throw new RangeError('INVALID_US_AMATEUR_RETURN_STATE');
}
function assertRevision(s:UsAmateurReturnLedger,revision:number):void {assertUsAmateurReturnLedger(s);if(revision!==s.revision||revision===Number.MAX_SAFE_INTEGER)throw new RangeError('US_AMATEUR_RETURN_REVISION_CHANGED');}
/** Opens only an actually expired amateur minor contract; an existing KBO return route never enters this program. */
export function openUsAmateurReturn(c:UsCareer,revision:number):UsAmateurReturnLedger {
 assertUsCareerRevision(c,revision);const ready=usYearTransitionReadiness(c),p=c.world.players[c.protagonistKey]!;
 if(c.kboTransfer||c.contract.type!=='US_MINOR'||c.phaseContext.phase!=='SEASON_REVIEW'||ready.remainingMinorControlSeasons!==0||ready.blockers.some(b=>!['CONTRACT_DECISION_REQUIRED','MILITARY_PLAN_REQUIRED'].includes(b))||p.age+2>35||!['UNRESOLVED','COMPLETED','NOT_APPLICABLE'].includes(c.military.status))throw new RangeError('US_AMATEUR_RETURN_NOT_AVAILABLE');
 const next:UsAmateurReturnLedger={version:1,revision:1,returnId:'',worldKey:c.world.worldKey,playerKey:c.protagonistKey,sourceSeasonKey:c.world.seasonKey,sourceRevision:revision,sourceContractKey:c.contract.contractKey,sourceAge:p.age,sourcePlayer:structuredClone(p),origin:c.amateurHistory.world.leagueKey==='COLLEGE'?'COLLEGE_DIRECT':'HIGH_SCHOOL_DIRECT',status:'PREPARING',militaryStatus:c.military.status as UsAmateurReturnLedger['militaryStatus'],years:[],draftReservationKey:null};next.returnId=returnKey(next);assertUsAmateurReturnLedger(next);return next;
}
function appendYear(s:UsAmateurReturnLedger,year:UsAmateurReturnYear,militaryCompleted=false):UsAmateurReturnLedger {
 const years=[...s.years,structuredClone(year)],done=years.length===2,militaryStatus=militaryCompleted?'COMPLETED':s.militaryStatus;
 const next:UsAmateurReturnLedger={...structuredClone(s),revision:s.revision+1,years,militaryStatus,status:done?'DRAFT_READY':'PREPARING',draftReservationKey:done?JSON.stringify(['amateur-return-draft',s.returnId,year.seasonKey]):null};assertUsAmateurReturnLedger(next);return next;
}
/** Actual48-game independent seasons reuse the preparation engine, with mandatory periods charging zero retry uses. */
export function settleUsAmateurIndependentYear(s:UsAmateurReturnLedger,revision:number,preparation:PreparationSeason):UsAmateurReturnLedger {
 assertRevision(s,revision);assertPreparationSeason(preparation);const p=preparation.world.players[s.playerKey],period=preparation.retry.periods.find(p=>p.worldSeasonId===preparation.world.seasonKey);
 const old=s.years.find(y=>y.seasonKey===preparation.world.seasonKey);
 if(old){if(old.receiptKey!==preparation.result?.receiptKey||canonicalJson(old.endingPlayer)!==canonicalJson(p)||canonicalJson(old.seasonGrowth)!==canonicalJson(preparation.seasonGrowth))throw new RangeError('US_RETURN_EVIDENCE_REUSED');return structuredClone(s);}
 if(s.status!=='PREPARING'||s.militaryStatus==='UNRESOLVED'||preparation.phase!=='PREPARATION_RESULT'||period?.kind!=='MANDATORY_RETURN'||period.usageCharged||!preparation.result||preparation.world.worldKey!==s.worldKey||preparation.world.protagonistKey!==s.playerKey||preparation.world.seasonKey!==String(Number(s.sourceSeasonKey)+s.years.length+1)||p?.age!==s.sourceAge+s.years.length+1)throw new RangeError('US_RETURN_INDEPENDENT_YEAR_NOT_READY');
 return appendYear(s,{seasonKey:preparation.world.seasonKey,age:p.age,endWorldDay:preparation.world.calendar.growthDays.at(-1)!,kind:'INDEPENDENT',receiptKey:preparation.result.receiptKey,seasonGrowth:preparation.seasonGrowth,endingPlayer:p,recordRevision:preparation.records.revision});
}
/** Actual ACTIVE block receipts share the same world seasons;18months never adds a third preparation year. */
export function settleUsAmateurServiceYear(s:UsAmateurReturnLedger,revision:number,input:{player:DevelopmentPlayer;seasonKey:string;service:UsMilitaryServiceProgram;records:RecordLedger;seasonGrowth?:SeasonGrowthLedger}):{return:UsAmateurReturnLedger;player:DevelopmentPlayer;seasonGrowth:SeasonGrowthLedger} {
 assertRevision(s,revision);validateDevelopmentPlayer(input.player);const completed=s.years.find(y=>y.seasonKey===input.seasonKey);
 if(completed){if(completed.kind==='INDEPENDENT'||canonicalJson(input.player)!==canonicalJson(completed.endingPlayer)||canonicalJson(input.seasonGrowth)!==canonicalJson(completed.seasonGrowth))throw new RangeError('US_RETURN_EVIDENCE_REUSED');return {return:structuredClone(s),player:structuredClone(input.player),seasonGrowth:structuredClone(completed.seasonGrowth)};}
 const index=s.years.length,expectedSeason=String(Number(s.sourceSeasonKey)+index+1),program=input.service,dates=usMilitaryCompletionDays(s.sourceSeasonKey),due=dates[index];
 if(s.status!=='PREPARING'||s.militaryStatus!=='UNRESOLVED'||input.seasonKey!==expectedSeason||input.player.simulationKey!==s.playerKey||input.player.age!==s.sourceAge+index+1||program.planSeasonKey!==s.sourceSeasonKey||program.programId!==JSON.stringify(['us-military-service',s.worldKey,s.sourceSeasonKey,s.playerKey])||program.scheduledBlocks!==2||canonicalJson(program.completionDays)!==canonicalJson(dates)||!due||program.completedBlocks<index+1||program.blocks.length!==2||program.blocks.some((b,i)=>b.seasonKey!==dates[i]!.seasonKey||b.kind!==(i===0?'FULL_DOMESTIC_SEASON':'FIRST_HALF_SEASON')||i<=index&&b.completedWorldDay!==dates[i]!.worldDay)||Object.values(input.records.games).some(g=>g.scope.seasonKey===input.seasonKey&&(Object.hasOwn(g.batting,s.playerKey)||Object.hasOwn(g.pitching,s.playerKey))))throw new RangeError('US_RETURN_SERVICE_YEAR_NOT_READY');
 const previous=index>0?s.years[index-1]!.endingPlayer:s.sourcePlayer;if(canonicalJson({...input.player,age:previous.age,fatigue:previous.fatigue})!==canonicalJson(previous))throw new RangeError('US_RETURN_PLAYER_CARRY_CHANGED');
 const calendar=createSeasonCalendar(Number(input.seasonKey)),growth=input.seasonGrowth??createSeasonGrowthLedger(input.player,input.seasonKey,calendar.growthDays.length);validateSeasonGrowthLedger(growth);
 if(growth.entries.length||growth.finalized||canonicalJson(growth.seasonStart)!==canonicalJson(input.player)||growth.seasonKey!==input.seasonKey)throw new RangeError('US_RETURN_GROWTH_ALREADY_STARTED');
 const serviceDays=calendar.growthDays.filter(day=>index===0||day<=due.worldDay).length,periods:ClosedGrowthPeriod[]=[],base={levelSeasonDays:calendar.highSchoolDays.length,level:'COLLEGE' as const,appearances:0,pitcherRole:input.player.position==='RP'?'RP' as const:input.player.position==='CP'?'CP' as const:'SP' as const,rehabRatio:0,trainingMultiplier:1,policy:{mode:'CAREER' as const,difficulty:'REALISTIC' as const,beneficiary:true}};
 // ACTIVE contributes zero; the remaining half-year gets the existing no-appearance training factor.
 periods.push({periodKey:JSON.stringify(['return-service',s.returnId,input.seasonKey]),focus:[...input.player.focus],archetype:input.player.archetype,period:{...base,startDay:0,endDay:serviceDays,ordinaryMilitary:true}});
 if(serviceDays<calendar.growthDays.length)periods.push({periodKey:JSON.stringify(['return-training',s.returnId,input.seasonKey]),focus:[...input.player.focus],archetype:input.player.archetype,period:{...base,startDay:serviceDays,endDay:calendar.growthDays.length,ordinaryMilitary:false}});
 let rested=structuredClone(input.player);for(let i=0;i<calendar.growthDays.length;i++)rested=appearanceFatigue(rested,'NONE');
 const grown=settleClosedGrowthPeriods(rested,growth,periods),aged=finalizeSeasonGrowth(grown.player,grown.ledger,calendar.growthDays.length),receiptKey=JSON.stringify(['return-service-year',s.returnId,input.seasonKey,program.programId,due.worldDay]);
 const result=appendYear(s,{seasonKey:input.seasonKey,age:input.player.age,endWorldDay:calendar.growthDays.at(-1)!,kind:index===0?'ACTIVE_SERVICE':'ACTIVE_AND_TRAINING',receiptKey,seasonGrowth:aged.ledger,endingPlayer:aged.player,recordRevision:input.records.revision},index===1);return {return:result,player:aged.player,seasonGrowth:aged.ledger};
}
/** Returning to a live US offer cancels the domestic draft reservation, preserving completed years and original records. */
export function cancelUsAmateurReturnForUsOffer(s:UsAmateurReturnLedger,revision:number,authority:RetryRouteAuthority,input:{offerRef:string;authorityRevision:number}):UsAmateurReturnLedger {
 assertRevision(s,revision);const offer=authority.usOffers.find(o=>o.offerRef===input.offerRef);
 if(authority.worldKey!==s.worldKey||authority.playerKey!==s.playerKey||authority.seasonKey!==String(Number(s.sourceSeasonKey)+s.years.length)||authority.age!==s.sourceAge+s.years.length||!Number.isSafeInteger(authority.worldDay)||authority.worldDay<0||!Number.isSafeInteger(authority.authorityRevision)||authority.authorityRevision!==input.authorityRevision||authority.activeContract||!authority.usRightsEligible||!['COMPLETED','NOT_APPLICABLE'].includes(authority.militaryStatus)||!offer||!Number.isSafeInteger(offer.expiresGameDay)||authority.worldDay>=offer.expiresGameDay)throw new RangeError('US_RETURN_OPTION_EXPIRED');
 if(s.status==='CANCELLED_US'){if(s.cancelledByOfferRef!==input.offerRef)throw new RangeError('US_RETURN_ALREADY_CANCELLED');return structuredClone(s);}
 const next:UsAmateurReturnLedger={...structuredClone(s),revision:revision+1,status:'CANCELLED_US',draftReservationKey:null,cancelledByOfferRef:input.offerRef};assertUsAmateurReturnLedger(next);return next;
}
export function usAmateurReturnView(s:UsAmateurReturnLedger){assertUsAmateurReturnLedger(s);return {returnId:s.returnId,status:s.status,completedSeasons:s.years.length,requiredSeasons:2,ageAtDraft:s.sourceAge+2,draftMaximumAge:35,careerPreparationConsumed:0,militaryStatus:s.militaryStatus,draftReservationKey:s.draftReservationKey,years:s.years.map(y=>({seasonKey:y.seasonKey,age:y.age,kind:y.kind,receiptKey:y.receiptKey}))};}

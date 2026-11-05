import type {UsCareer} from './us-career-entry.js';
import type {RecordLedger} from './records.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {canonicalJson} from './game.js';
import {openUsAmateurReturn,assertUsAmateurReturnLedger,settleUsAmateurIndependentYear,settleUsAmateurServiceYear,usAmateurReturnView} from './us-amateur-return.js';
import type {UsAmateurReturnLedger} from './us-amateur-return.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason,completeUsMilitaryService,usMilitaryServiceView,registerUsReturningPlayer} from './us-military-plan.js';
import {startUsMilitaryWorld,advanceUsMilitaryWorld} from './us-season.js';
import {startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,completePreparationSeason,assertPreparationSeason} from './preparation-season.js';
import type {PreparationSeason,PreparationWorld} from './preparation-season.js';
import {openRetryCareerEpisode,retryCareerRouteView,assertRetryCareerLedger} from './retry-career.js';
import type {RetryCareerLedger,RetryRouteAuthority} from './retry-career.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createUsReturnPreparationWorld} from './us-return-preparation.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {closeSeasonHealth} from './health.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,completeBlockingEvent,validateEvent} from './events.js';
import type {EventInstance} from './events.js';
import {createKboRosterWorld} from './kbo-world.js';
import type {KboRosterWorld} from './kbo-world.js';
import {prepareKboDraft,resolveKboDraft,decideKboDraft,assertKboDraft,kboDraftView} from './kbo-draft.js';
import type {KboDraftProgram} from './kbo-draft.js';
import {overall} from '@playball/rules';
import {draftBaseScore} from './draft.js';
import type {KboCareer} from './kbo-career-entry.js';
import {activateReturnedUsKbo} from './us-return-activation.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {refreshCareerRepertoireEvents} from './repertoire-events.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';
import {settleUsMilitaryReturnWorldGrowth} from './us-growth.js';
import {acceptUsMinorMarketOffer} from './us-minor-market.js';
import {fundUsMinorYear} from './us-minor-history.js';
import {restoreUsEmergencyRegistrations} from './us-year-transition.js';
import {retireAndSupplyUsNpcs} from './us-supply.js';
import {cancelUsAmateurReturnForUsOffer} from './us-amateur-return.js';
import {settleClosedGrowthPeriods,finalizeSeasonGrowth} from './growth-ledger.js';

/** Original US root remains an immutable archive; current native owners travel in this root transaction. */
export interface UsAmateurReturnCareer {
 version:1;revision:number;serviceGrowthPolicy?:'SOURCE_DIFFICULTY';source:UsCareer;return:UsAmateurReturnLedger;retry:RetryCareerLedger;
 service?:UsCareer;preparation?:PreparationSeason;completedPreparation:readonly PreparationSeason[];events:readonly EventInstance[];
 draft?:{world:KboRosterWorld;program:KboDraftProgram};
 acceptedUs?:UsCareer;
}
function event(s:UsAmateurReturnCareer):EventInstance {
 const r=s.return,seasonKey=String(Number(r.sourceSeasonKey)+r.years.length),worldDay=r.years.at(-1)?.endWorldDay??s.source.world.calendar.growthDays.at(-1)!;
 return createWorldEvent({definitionId:'E68',worldKey:r.worldKey,seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:r.playerKey,contractWindowIdOrReturnProgramId:r.returnId,stage:String(r.years.length)}},resume:{worldKey:r.worldKey,seasonKey,phase:'RETURN_PREPARATION',competitionKey:null,registrationKey:null,sourceRevision:s.revision},sourceSequence:r.years.length+1,worldDay});
}
/** Live preparation holds protagonist history; complete US world stays in source. */
function sourcePlayerRecords(s:UsAmateurReturnCareer):RecordLedger {
 const key=s.return.playerKey;return {revision:s.source.records.revision,games:Object.fromEntries(Object.entries(s.source.records.games).filter(([,g])=>Object.hasOwn(g.batting,key)||Object.hasOwn(g.pitching,key)))};
}
function same(a:unknown,b:unknown):boolean {return a===b||canonicalJson(a)===canonicalJson(b);}
function assertHealthPrefix(before:UsCareer['health'],after:UsCareer['health']):void {
 if(before.games.some((g,i)=>!same(g,after.games[i]))||before.closedSeasons.some(k=>!after.closedSeasons.includes(k)))throw new RangeError('US_RETURN_HEALTH_PREFIX_CHANGED');
}
function assertRecordPrefix(before:RecordLedger,after:RecordLedger):void {
 if(after.revision<before.revision||Object.entries(before.games).some(([key,g])=>!same(g,after.games[key])))throw new RangeError('US_RETURN_RECORD_PREFIX_CHANGED');
}
export function assertUsAmateurReturnCareer(s:UsAmateurReturnCareer):void {
 assertUsAmateurReturnLedger(s.return);assertRetryCareerLedger(s.retry);
 const r=s.return,source=s.source;
 if(s.serviceGrowthPolicy!==undefined&&s.serviceGrowthPolicy!=='SOURCE_DIFFICULTY'||s.version!==1||!Number.isSafeInteger(s.revision)||s.revision<1||r.sourceRevision!==source.revision||r.worldKey!==source.world.worldKey||r.playerKey!==source.protagonistKey||r.sourceContractKey!==source.contract.contractKey||r.sourceSeasonKey!==source.world.seasonKey||!same(r.sourcePlayer,source.world.players[source.protagonistKey])||r.origin!==(source.amateurHistory.world.leagueKey==='COLLEGE'?'COLLEGE_DIRECT':'HIGH_SCHOOL_DIRECT')||s.retry.worldKey!==r.worldKey||s.retry.playerKey!==r.playerKey||s.completedPreparation.length!==r.years.filter(y=>y.kind==='INDEPENDENT').length||s.preparation&&s.service||s.acceptedUs||r.status==='CANCELLED_US')throw new RangeError('INVALID_US_RETURN_ROOT');
 let replay=openUsAmateurReturn(source,source.revision);
 if(!same({...replay,years:r.years,revision:r.revision,status:r.status,militaryStatus:r.militaryStatus,draftReservationKey:r.draftReservationKey},r))throw new RangeError('US_RETURN_SOURCE_CHANGED');
 const returnEvents=s.events.filter(e=>e.definitionId==='E68'),marketEvents=s.events.filter(e=>e.definitionId!=='E68');
 if(source.minorMarket){const original=source.events.find(e=>e.eventKey===source.minorMarket!.eventKey)!;const closed=closeReturnMarketEvent(original,r);if(marketEvents.length!==1||!same(marketEvents[0],closed))throw new RangeError('US_RETURN_MARKET_EVENT_CHANGED');}else if(marketEvents.length)throw new RangeError('US_RETURN_MARKET_EVENT_CHANGED');
 if(returnEvents.length!==r.years.length+(r.status==='PREPARING'?1:0)||new Set(s.events.map(e=>e.eventKey)).size!==s.events.length)throw new RangeError('US_RETURN_EVENT_HISTORY_CHANGED');
 for(const [i,e]of returnEvents.entries()){
  validateEvent(e);const expected=event({...s,return:{...r,years:r.years.slice(0,i)}}),owner=s.preparation??s.service,started=i<r.years.length||owner?.world.seasonKey===String(Number(r.sourceSeasonKey)+i+1);
  if(e.status!==(started?'RESOLVED':'OPEN')||started&&(e.resolution?.kind!=='DOMAIN'||e.resolution.command!=='ADVANCE_RETURN_PROGRAM'||e.resolution.receiptKey!==JSON.stringify(['return-year-start',r.returnId,i+1])))throw new RangeError('US_RETURN_START_RECEIPT_CHANGED');
  if(e.definitionId!=='E68'||e.eventKey!==expected.eventKey||e.worldKey!==r.worldKey||e.seasonKey!==expected.seasonKey||i<r.years.length&&e.status!=='RESOLVED')throw new RangeError('US_RETURN_EVENT_HISTORY_CHANGED');
 }
 const initialRetry=openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:r.sourceSeasonKey,age:r.sourceAge,receiptKey:r.returnId,reason:'CONTRACT_EXPIRED'});
 let prefix=sourcePlayerRecords(s);
 for(const [i,p]of s.completedPreparation.entries()){
  assertRecordPrefix(prefix,p.records);prefix=p.records;
  replay=settleUsAmateurIndependentYear(replay,replay.revision,p);
  if(!same(replay.years[i],r.years[i]))throw new RangeError('US_RETURN_COMPLETION_CHANGED');
 }
 if(s.preparation){
  const p=s.preparation;assertPreparationSeason(p);
  if(!same(p.retry.episodes,initialRetry.episodes)||initialRetry.periods.some((period,i)=>!same(period,p.retry.periods[i])))throw new RangeError('US_RETURN_RETRY_CHANGED');assertRecordPrefix(prefix,p.records);assertHealthPrefix(source.health,p.health);
  const completed=p.phase==='PREPARATION_RESULT',index=r.years.length-(completed?1:0);
  if(p.world.seed!==source.world.seed||p.world.worldKey!==r.worldKey||p.world.protagonistKey!==r.playerKey||p.world.seasonKey!==String(Number(r.sourceSeasonKey)+index+1)||completed&&!same(p,s.completedPreparation.at(-1)))throw new RangeError('US_RETURN_LIVE_PREPARATION_CHANGED');
  const prior=r.years[index-1]?.endingPlayer??r.sourcePlayer,start=p.seasonGrowth.seasonStart;
  if(!same({...start,age:prior.age,fatigue:prior.fatigue},prior))throw new RangeError('US_RETURN_PLAYER_CARRY_CHANGED');
 }
 if(s.service){
  const c=s.service;assertUsCareerRevision(c,c.revision);usMilitaryServiceView(c);assertRecordPrefix(source.records,c.records);assertHealthPrefix(source.health,c.health);
  const program=c.military.service!;
  if(source.military.status!=='UNRESOLVED'||c.protagonistKey!==r.playerKey||c.world.worldKey!==r.worldKey||c.world.seed!==source.world.seed||!same(program.sourceContract,source.contract)||c.contract.status!=='TERMINATED'||c.military.status!==(r.years.length===2?'COMPLETED':'TERMINATED_SERVICE'))throw new RangeError('US_RETURN_LIVE_SERVICE_CHANGED');
  for(const y of r.years){
   const added=Object.values(c.records.games).filter(g=>!Object.hasOwn(source.records.games,g.gameKey)&&Number(g.scope.seasonKey)<=Number(y.seasonKey)).length,corrections=(c.recordCorrections?.receipts??[]).filter(receipt=>receipt.afterRecordRevision>source.records.revision&&Number(receipt.seasonKey)<=Number(y.seasonKey)).length;
   if(y.recordRevision!==source.records.revision+added+corrections)throw new RangeError('US_RETURN_COMPLETION_RECORD_REVISION_CHANGED');
   const growth=y.seasonKey===c.world.seasonKey?c.seasonGrowth:program.years?.find(a=>a.seasonKey===y.seasonKey)?.seasonGrowth;
   if(!growth||!same(growth,y.seasonGrowth))throw new RangeError('US_RETURN_COMPLETION_CHANGED');
   const settled=settleUsAmateurServiceYear(replay,replay.revision,{player:growth.seasonStart,seasonKey:y.seasonKey,service:program,records:{...c.records,revision:y.recordRevision},...(s.serviceGrowthPolicy?{difficulty:s.source.difficulty}:{})});replay=settled.return;
   if(!same(replay.years.at(-1),y))throw new RangeError('US_RETURN_COMPLETION_CHANGED');
  }
  if(c.seasonGrowth.finalized&&!same(c.world.players[r.playerKey],r.years.at(-1)?.endingPlayer))throw new RangeError('US_RETURN_SERVICE_PLAYER_CHANGED');
 }
 if(!same(replay,r))throw new RangeError('US_RETURN_COMPLETION_CHANGED');
 const live=s.preparation??s.service,expectedSeason=live?.world.seasonKey??r.sourceSeasonKey,expectedAge=live?.world.players[r.playerKey]?.age??r.sourceAge;
 if(s.retry.seasonKey!==expectedSeason||s.retry.age!==expectedAge||s.retry.careerPreparationUsed!==(source.retryCareer?.careerPreparationUsed??0))throw new RangeError('US_RETURN_RETRY_CHANGED');
 const baseRetry=s.preparation?s.preparation.retry:openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:r.sourceSeasonKey,age:r.sourceAge,receiptKey:r.returnId,reason:'CONTRACT_EXPIRED'});
 const currentRetry=s.preparation?baseRetry:{...baseRetry,revision:baseRetry.revision+(s.service?Number(s.service.world.seasonKey)-Number(r.sourceSeasonKey):0),seasonKey:expectedSeason,age:expectedAge};
 const failed=s.draft?.program.result?.round===null,expectedRetry=failed?openRetryCareerEpisode(currentRetry,currentRetry.revision,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:expectedSeason,age:expectedAge,receiptKey:s.draft!.program.result!.receiptKey,reason:'AMATEUR_RETURN_UNDRAFTED'}):currentRetry;
 if(!same(expectedRetry,s.retry))throw new RangeError('US_RETURN_RETRY_CHANGED');
 if(s.draft){assertKboDraft(s.draft.world,s.draft.program);if(r.status!=='DRAFT_READY'||s.draft.world.worldKey!==r.worldKey||s.draft.world.seed!==source.world.seed||s.draft.world.seasonKey!==String(Number(r.sourceSeasonKey)+3)||s.draft.program.input.assessmentKey!==r.draftReservationKey||!same(s.draft.program.input.player,r.years.at(-1)!.endingPlayer))throw new RangeError('STALE_RETURN_DRAFT');}
}

function revision(s:UsAmateurReturnCareer,n:number):void {assertUsAmateurReturnCareer(s);if(s.revision!==n||n===Number.MAX_SAFE_INTEGER)throw new RangeError('US_RETURN_ROOT_REVISION_CHANGED');}
function closeReturnMarketEvent(e:EventInstance,r:UsAmateurReturnLedger):EventInstance {
 return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:r.returnId,command:'OPEN_RETURN'},{worldKey:r.worldKey,seasonKey:r.sourceSeasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RETURN']});
}
export function requestUsAmateurReturn(source:UsCareer,n:number):UsAmateurReturnCareer {
 const r=openUsAmateurReturn(source,n),retry=openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:r.sourceSeasonKey,age:r.sourceAge,receiptKey:r.returnId,reason:'CONTRACT_EXPIRED'});
 const s:UsAmateurReturnCareer={version:1,revision:n+1,serviceGrowthPolicy:'SOURCE_DIFFICULTY',source:structuredClone(source),return:r,retry,completedPreparation:[],events:[]};s.events=[...(source.minorMarket?[closeReturnMarketEvent(source.events.find(e=>e.eventKey===source.minorMarket!.eventKey)!,r)]:[]),event(s)];assertUsAmateurReturnCareer(s);return s;
}
function authority(s:UsAmateurReturnCareer):RetryRouteAuthority {
 return {worldKey:s.retry.worldKey,playerKey:s.retry.playerKey,seasonKey:s.retry.seasonKey,age:s.retry.age,worldDay:0,authorityRevision:s.revision,hasProContractHistory:true,activeContract:false,domesticRightsAvailable:true,domesticDraftEligible:true,mandatoryReturnActive:true,militaryStatus:s.return.militaryStatus,collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:[],usOffers:[],usScoutScore:0,usRightsEligible:false,retirementAllowed:true};
}
/** Register nine existing US affiliate populations; preserve current identities, books and abilities. */
function independentWorld(s:UsAmateurReturnCareer):PreparationWorld {
 return createUsReturnPreparationWorld(s.preparation?.world??s.source.world,s.return.years.at(-1)?.endingPlayer??s.return.sourcePlayer,String(Number(s.return.sourceSeasonKey)+s.return.years.length+1));
}
/** Consume the E66 receipt already committed by request; preserve the original OPEN source archive. */
function serviceSource(s:UsAmateurReturnCareer):UsCareer {
 if(!s.source.minorMarket)return s.source;
 const original=s.source.events.find(e=>e.eventKey===s.source.minorMarket!.eventKey)!,closed=s.events.find(e=>e.eventKey===original.eventKey);
 if(!closed||!same(closed,closeReturnMarketEvent(original,s.return))||s.source.events.some(e=>e.status==='OPEN'&&e.eventKey!==original.eventKey))throw new RangeError('US_RETURN_MARKET_EVENT_CHANGED');
 const live={...s.source,revision:s.revision,events:s.source.events.map(e=>e.eventKey===closed.eventKey?closed:e)};delete live.minorMarket;return live;
}
/** E68 starts one mandatory period; acceptance never grants a fabricated completion. */
export function startUsAmateurReturnYear(s:UsAmateurReturnCareer,n:number,eventVersion:number):UsAmateurReturnCareer {
 revision(s,n);if(s.return.status!=='PREPARING'||s.preparation&&s.preparation.phase!=='PREPARATION_RESULT'||s.service&&s.service.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('US_RETURN_YEAR_IN_PROGRESS');
 const e=s.events.at(-1)!;const context={worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['ADVANCE_RETURN_PROGRAM']},plan=resolveEventChoice(e,eventVersion,'ADVANCE_RETURN_PROGRAM',null,context);
 const next={...s};next.revision++;
 if(s.return.militaryStatus==='UNRESOLVED'){
  let c=s.service??(()=>{const source=serviceSource(s);return chooseUsMilitaryPlan(source,source.revision,'TERMINATE');})();c=startUsMilitaryServiceSeason(c,c.revision);next.service=startUsMilitaryWorld(c,c.revision);next.retry={...s.retry,revision:s.retry.revision+1,seasonKey:next.service.world.seasonKey,age:next.service.world.players[s.return.playerKey]!.age};
 }else{
  const world=independentWorld(s),a=authority(s),view=retryCareerRouteView(s.retry,a),prior=s.preparation;
  next.preparation=confirmPreparationPreseason(startPreparationSeason(s.retry,s.retry.revision,a,{episodeId:s.retry.episodes.at(-1)!.episodeId,routePreviewId:view.routePreviewId,world,difficulty:s.source.difficulty,records:prior?.records??sourcePlayerRecords(s),health:prior?.health??s.source.health,development:prior?.development??s.source.development,styleUsedWindows:prior?.styleUsedWindows??s.source.styleUsedWindows,...((prior?.traits??s.source.traits)?{traits:prior?.traits??s.source.traits}:{}),relationships:prior?.relationships??s.source.relationships,mandatoryReturn:s.return}),s.retry.revision+1);next.retry=next.preparation.retry;
 }
 const receipt=JSON.stringify(['return-year-start',s.return.returnId,s.return.years.length+1]);next.events=next.events.map(x=>x.eventKey===e.eventKey?completeEventDomain(e,plan.domain!,receipt,context):x);assertUsAmateurReturnCareer(next);return next;
}
/** Bounded native worker. Pending games, records, health and date cursor commit together. */
export function advanceUsAmateurReturn(s:UsAmateurReturnCareer,n:number):{career:UsAmateurReturnCareer;stopReason:string} {
 revision(s,n);if(s.return.status!=='PREPARING')throw new RangeError('US_RETURN_NOT_PREPARING');const next={...s};let stopReason:string;
 if(s.service){const result=advanceUsMilitaryWorld(s.service,s.service.revision,7);next.service=result.career;stopReason=result.stopReason==='SEASON_REVIEW'?'SEASON_COMPLETE':result.stopReason;}
 else {if(!s.preparation)throw new RangeError('US_RETURN_YEAR_NOT_STARTED');const result=advancePreparationSeason(s.preparation,s.preparation.revision,'ONE_MONTH');next.preparation=result.career;next.retry=result.career.retry;stopReason=result.stopReason;}
 next.revision++;return {career:next,stopReason};
}
export function settleUsAmateurReturnYear(s:UsAmateurReturnCareer,n:number):UsAmateurReturnCareer {
 revision(s,n);if(s.return.status!=='PREPARING')throw new RangeError('US_RETURN_NOT_PREPARING');const next={...s};
 if(s.service){const c=structuredClone(s.service),program=c.military.service!;
  if(c.phaseContext.phase!=='SEASON_REVIEW'||program.cursor?.worldDay!==c.world.calendar.growthDays.at(-1))throw new RangeError('US_RETURN_SERVICE_YEAR_INCOMPLETE');
  const settled=settleUsAmateurServiceYear(s.return,s.return.revision,{player:c.world.players[c.protagonistKey]!,seasonKey:c.world.seasonKey,service:program,records:c.records,seasonGrowth:c.seasonGrowth,...(s.serviceGrowthPolicy?{difficulty:s.source.difficulty}:{})});next.return=settled.return;c.world.players[c.protagonistKey]=settled.player;c.seasonGrowth=settled.seasonGrowth;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;const grown=settleUsMilitaryReturnWorldGrowth(c,c.revision);next.service=next.return.years.length===2?completeUsMilitaryService(grown,grown.revision):grown;
 }else{if(!s.preparation)throw new RangeError('US_RETURN_YEAR_NOT_STARTED');const p=completePreparationSeason(s.preparation,s.preparation.revision);next.preparation=p;next.retry=p.retry;next.return=settleUsAmateurIndependentYear(s.return,s.return.revision,p);next.completedPreparation=[...s.completedPreparation,p];}
 next.revision++;if(next.return.status==='PREPARING')next.events=[...next.events,event(next)];assertUsAmateurReturnCareer(next);return next;
}
export function prepareUsAmateurReturnDraft(s:UsAmateurReturnCareer,n:number,preferredClubId:string|null=null):UsAmateurReturnCareer {
 revision(s,n);if(s.return.status!=='DRAFT_READY'||s.draft)throw new RangeError('US_RETURN_DRAFT_NOT_READY');const p=s.return.years.at(-1)!.endingPlayer,world=createKboRosterWorld({worldKey:s.return.worldKey,seasonKey:String(Number(s.return.sourceSeasonKey)+3),seed:s.source.world.seed,difficulty:s.source.difficulty}),score=overall(p.kind,p.abilities),baseScore=s.preparation?.result?.baseScore??draftBaseScore(score.sumUnits/score.denominator,0);
 const next={...s};next.draft={world,program:prepareKboDraft(world,{assessmentKey:s.return.draftReservationKey!,player:p,baseScore,preferredClubId})};next.revision++;return next;
}
export function resolveUsAmateurReturnDraft(s:UsAmateurReturnCareer,n:number,programVersion:number):UsAmateurReturnCareer {
 revision(s,n);if(!s.draft)throw new RangeError('US_RETURN_DRAFT_REQUIRED');const next={...s};next.draft={...s.draft,program:resolveKboDraft(s.draft.world,s.draft.program,programVersion)};if(next.draft.program.result?.round===null)next.retry=openRetryCareerEpisode(s.retry,s.retry.revision,{worldKey:s.return.worldKey,playerKey:s.return.playerKey,seasonKey:s.retry.seasonKey,age:s.retry.age,receiptKey:next.draft.program.result.receiptKey,reason:'AMATEUR_RETURN_UNDRAFTED'});next.revision++;return next;
}
export function decideUsAmateurReturnDraft(s:UsAmateurReturnCareer,n:number,programVersion:number,decision:'SIGN'|'DECLINE'):UsAmateurReturnCareer {
 revision(s,n);if(!s.draft)throw new RangeError('US_RETURN_DRAFT_REQUIRED');const next={...s};next.draft={...s.draft,program:decideKboDraft(s.draft.world,s.draft.program,programVersion,decision)};next.revision++;return next;
}
/** The real draft receipt owns roster, salary reservation and rights in one root replacement. */
export function startSignedUsAmateurReturnKboCareer(s:UsAmateurReturnCareer,n:number):KboCareer {
 revision(s,n);if(!s.draft||s.draft.program.decision!=='SIGNED'||!s.draft.program.signing||s.return.status!=='DRAFT_READY')throw new RangeError('US_RETURN_SIGNED_DRAFT_REQUIRED');
 return activateReturnedUsKbo({origin:s,owner:s.preparation??s.service??s.source,draft:s.draft,retry:s.retry,revision:n});
}
export function usAmateurReturnCareerView(s:UsAmateurReturnCareer){assertUsAmateurReturnCareer(s);return {...usAmateurReturnView(s.return),revision:s.revision,events:s.events.map(e=>({eventKey:e.eventKey,eventVersion:e.version,status:e.status})),draft:s.draft?kboDraftView(s.draft.world,s.draft.program):null};}
/**
 * Re-sign with a source US club whose sealed offer carried the military return option (docs/design/14 §8).
 * The frozen US world is not restored: skipped seasons age and grow NPCs once each; the protagonist enters with the
 * ability earned during the return years. The caller replaces this root with the returned UsCareer.
 */
export function resignUsAfterAmateurReturn(s:UsAmateurReturnCareer,n:number,offerKey:string):UsCareer {
 revision(s,n);const r=s.return,k=r.years.length,market=s.source.minorMarket,offer=market?.offers.find(o=>o.offerKey===offerKey),last=r.years.at(-1);
 if(!market||!offer||!last||!offer.militaryReturnOption||!['PREPARING','DRAFT_READY'].includes(r.status)||r.militaryStatus==='UNRESOLVED'||s.draft?.program.decision==='SIGNED')throw new RangeError('US_RETURN_OPTION_NOT_AVAILABLE');
 const owner=s.preparation??s.service;
 if(!owner||owner.world.seasonKey!==last.seasonKey||!owner.seasonGrowth.finalized||s.preparation&&s.preparation.phase!=='PREPARATION_RESULT')throw new RangeError('US_RETURN_YEAR_IN_PROGRESS');
 const sourceSeason=Number(r.sourceSeasonKey);
 cancelUsAmateurReturnForUsOffer(r,r.revision,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:last.seasonKey,age:last.age,worldDay:0,authorityRevision:n,hasProContractHistory:false,activeContract:false,domesticRightsAvailable:true,domesticDraftEligible:false,mandatoryReturnActive:false,militaryStatus:r.militaryStatus,collegeAdmissionRefs:[],collegeResumeRef:null,domesticOffers:[],usOffers:[{offerRef:offerKey,ownerScope:{kind:'RETURN_CLAUSE',sourceRef:offerKey}}],usScoutScore:0,usRightsEligible:true,retirementAllowed:true},{offerRef:offerKey,authorityRevision:n});
 const base=acceptUsMinorMarketOffer(s.source,s.source.revision,offerKey),world=structuredClone(s.service?.world??base.world),key=r.playerKey;let inventory=base.inventory;
 if(s.service){
  restoreUsEmergencyRegistrations(s.service,world);
  const target=String(Number(world.seasonKey)+1),existing=new Set(Object.keys(world.players));
  retireAndSupplyUsNpcs(world,Object.keys(world.players).filter(x=>x!==key&&world.players[x]!.age===45),target,key);
  for(const [x,p] of Object.entries(world.players))if(existing.has(x))world.players[x]={...p,age:p.age+1,fatigue:0};
  registerUsReturningPlayer(world,key,offer.organizationId,offer.initialLevel);
  inventory=fundUsMinorYear(s.service.inventory,target,Object.keys(world.players).sort(),market.funding,offer.organizationId,offer.annualSalaryUsd);
 }
 // Skipped seasons sourceSeason+1..sourceSeason+k: NPCs play them off-screen, then age into the next one.
 for(let i=1;!s.service&&i<=k;i++){
  const seasonKey=String(sourceSeason+i),calendar=createSeasonCalendar(Number(seasonKey),'calendar-2'),W=calendar.growthDays.length;
  for(const npc of Object.keys(world.players).sort()){
   if(npc===key)continue;const p=world.players[npc]!,ledger=createSeasonGrowthLedger(p,seasonKey,W);
   // shortcut: flat workload per role until the off-screen league sim supplies actual usage.
   const period={startDay:0,endDay:W,levelSeasonDays:W,level:'PRO' as const,appearances:p.kind==='HITTER'?400:p.position==='RP'||p.position==='CP'?180:540,pitcherRole:p.position==='RP'?'RP' as const:p.position==='CP'?'CP' as const:'SP' as const,rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER' as const,difficulty:s.source.difficulty,beneficiary:false}};
   const grown=settleClosedGrowthPeriods(p,ledger,[{periodKey:JSON.stringify(['us-return-offscreen',r.returnId,seasonKey,npc]),focus:[...p.focus],archetype:p.archetype,period}]);
   world.players[npc]=finalizeSeasonGrowth(grown.player,grown.ledger,W).player;
  }
  {
   const next=String(sourceSeason+i+1),existing=new Set(Object.keys(world.players)),retiring=Object.keys(world.players).filter(x=>x!==key&&world.players[x]!.age===45);
   retireAndSupplyUsNpcs(world,retiring,next,key);
   for(const [x,p] of Object.entries(world.players))if(x!==key&&existing.has(x))world.players[x]={...p,age:p.age+1,fatigue:0};
   world.seasonKey=next;world.calendar=createSeasonCalendar(Number(next),'calendar-2');
   for(const b of Object.values(world.repertoires))Object.assign(b,{seasonId:next,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()});
   // The offer already reserved its salary. Rolling into its actual start year must not charge it again.
   const funding=i<k?market.funding:inventory.clubs.map(c=>({organizationId:c.id,addedBudgetUsd:0}));
   inventory=fundUsMinorYear(inventory,next,Object.keys(world.players).sort(),funding,offer.organizationId,0);
  }
 }
 const target=String(sourceSeason+k+1);world.seasonKey=target;world.calendar=createSeasonCalendar(Number(target),'calendar-2');
 for(const b of Object.values(world.repertoires))Object.assign(b,{seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()});// shortcut: NPC pitch books stay unchanged until off-screen pitch XP is simulated.
 const book=s.preparation?.world.repertoires[key]??s.service?.world.repertoires[key];
 world.players[key]={...structuredClone(last.endingPlayer),age:last.age+1,fatigue:0};if(book)world.repertoires[key]={...structuredClone(book),seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 const player=world.players[key]!,contract={...base.contract,seasonKey:target};
 const records={revision:owner.records.revision,games:structuredClone({...s.source.records.games,...owner.records.games})},health=structuredClone(owner.health);
 health.injuries=Object.fromEntries(Object.entries(health.injuries).filter(([x])=>Object.hasOwn(world.players,x)));
 const out:UsCareer={...base,schemaVersion:2,revision:n+1,world,inventory,contract,records,health,registration:{...base.registration,seasonKey:target},usReturnContinuation:{playerAge:player.age,contract:structuredClone(contract),inventory:structuredClone(inventory),sourceMinorYears:base.minorYears?.length??0,sourceMajorYears:base.majorYears?.length??0,remainingControlSeasons:contract.years??contract.controlSeasons,paidUsd:30000},seasonGrowth:createSeasonGrowthLedger(player,target,world.calendar.growthDays.length),development:{...structuredClone(owner.development),seasonStartPlayer:structuredClone(player)},retryCareer:structuredClone(s.retry),styleUsedWindows:[...owner.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],military:{...base.military,status:r.militaryStatus},usAmateurReturn:{...structuredClone(r),revision:r.revision+1,status:'CANCELLED_US',draftReservationKey:null,cancelledByOfferRef:offerKey}};
 if(s.service?.recordCorrections){out.recordCorrections=structuredClone(s.service.recordCorrections);out.revision=Math.max(n,s.service.revision)+1;}
 if(owner.traits)out.traits={...structuredClone(owner.traits),lastClosedDay:null,lastSeasonKey:target};
 if(s.service){out.usAmateurReturnHistory=structuredClone(s);out.income=structuredClone(s.service.income);}
 out.usReturnContinuation!.organizationId=offer.organizationId;
 const teamWorld={worldKey:world.worldKey,seasonKey:target,leagueKey:out.registration.level,protagonistKey:key,protagonistSchoolId:offer.organizationId,schools:world.organizations.map(o=>({id:o.id,name:o.name,roster:o.levels[out.registration.level]})),players:world.players};
 out.relationships=formRegisteredTeamTeammate(s.preparation?.relationships??s.service?.relationships??s.source.relationships,teamWorld,JSON.stringify(['us-return-resign',r.returnId,offerKey,target]),world.calendar.growthDays[0]!);
 out.relationNotices=structuredClone(s.source.relationNotices);
 out.relationNotices=queueRelationFormationNotices({...out,world:teamWorld},world.calendar.growthDays[0]!)??out.relationNotices;
 assertUsCareerRevision(out,out.revision);return refreshCareerRepertoireEvents(refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(out)));
}

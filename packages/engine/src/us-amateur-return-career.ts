import type {UsCareer} from './us-career-entry.js';
import type {RecordLedger} from './records.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {canonicalJson} from './game.js';
import {openUsAmateurReturn,assertUsAmateurReturnLedger,settleUsAmateurIndependentYear,settleUsAmateurServiceYear,usAmateurReturnView} from './us-amateur-return.js';
import type {UsAmateurReturnLedger} from './us-amateur-return.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason,completeUsMilitaryService,usMilitaryServiceView} from './us-military-plan.js';
import {startUsMilitaryWorld,advanceUsMilitaryWorld} from './us-season.js';
import {startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,completePreparationSeason,assertPreparationSeason} from './preparation-season.js';
import type {PreparationSeason,PreparationWorld} from './preparation-season.js';
import {openRetryCareerEpisode,retryCareerRouteView,assertRetryCareerLedger} from './retry-career.js';
import type {RetryCareerLedger,RetryRouteAuthority} from './retry-career.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
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
import type {KboCareer,ActiveKboRosterWorld} from './kbo-career-entry.js';
import {kboCareerEntryView} from './kbo-career-entry.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {queueKboFirstCampNotices} from './kbo-preseason.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {settleUsMilitaryReturnWorldGrowth} from './us-growth.js';

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
 const previous=s.preparation?.world??s.source.world,year=Number(s.return.sourceSeasonKey)+s.return.years.length+1,calendar=createSeasonCalendar(year,'calendar-2'),key=s.return.playerKey;
 const schools=s.preparation?structuredClone(s.preparation.world.schools):s.source.world.organizations.slice(0,9).map(o=>({id:o.id,name:o.name,roster:o.levels.ROOKIE.filter(k=>k!==key)}));
 const protagonistSchoolId=s.preparation?.world.protagonistSchoolId??schools[0]!.id;
 if(!schools.some(t=>t.roster.includes(key)))schools.find(t=>t.id===protagonistSchoolId)!.roster.push(key);
 const registered=new Set(schools.flatMap(t=>t.roster));
 const world:PreparationWorld={worldKey:s.return.worldKey,seed:s.source.world.seed,seasonKey:String(year),leagueKey:'INDEPENDENT',protagonistKey:key,protagonistSchoolId,schools,players:structuredClone(Object.fromEntries(Object.entries(previous.players).filter(([k])=>registered.has(k)))),repertoires:structuredClone(Object.fromEntries(Object.entries(previous.repertoires).filter(([k])=>registered.has(k)))),calendar,schedule:[]};
 const old=s.return.years.at(-1)?.endingPlayer??s.return.sourcePlayer;world.players[key]=structuredClone(old);
 for(const p of Object.values(world.players)){p.age++;p.fatigue=0;}
 for(const b of Object.values(world.repertoires)){if(b.learning&&b.learning.quarters.length!==4)throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');b.seasonId=world.seasonKey;b.learning=null;b.usedWindows=[];b.ledger=emptyPitchXpLedger();}
 world.schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:schools.map(t=>t.id),leagueKey:'INDEPENDENT',seasonKey:world.seasonKey,startDay:calendar.highSchoolDays[0]!},6),calendar);return world;
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
 if(s.service){const result=advanceUsMilitaryWorld(s.service,s.service.revision,7);next.service=result.career;stopReason=result.stopReason;}
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
 revision(s,n);const draft=s.draft,signing=draft?.program.signing;if(!draft||draft.program.decision!=='SIGNED'||!signing||s.return.status!=='DRAFT_READY')throw new RangeError('US_RETURN_SIGNED_DRAFT_REQUIRED');
 const key=s.return.playerKey,year=Number(signing.registration.seasonKey),calendar=createSeasonCalendar(year,'calendar-2'),last=s.return.years.at(-1)!,player={...structuredClone(last.endingPlayer),age:last.age+1,fatigue:0};
 const world:ActiveKboRosterWorld={...structuredClone(draft.world),status:'ACTIVE',calendar},club=world.clubs.find(c=>c.id===signing.registration.clubId)!;
 if(year!==Number(last.seasonKey)+1||Object.hasOwn(world.players,key)||club.reservedSalaryWon!==signing.reservedSalaryBeforeWon)throw new RangeError('US_RETURN_DRAFT_RESERVATION_CHANGED');
 world.players[key]=player;world.contracts[key]=structuredClone(signing.contract);club.roster=[...signing.rosterAfter];club.reservedSalaryWon=signing.reservedSalaryAfterWon;
 const book=s.preparation?.world.repertoires[key]??s.service?.world.repertoires[key]??s.source.world.repertoires[key];if(book)world.repertoires[key]={...structuredClone(book),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};assertKboRecruitmentWorld(world);
 const owner=s.preparation??s.service??s.source,records={revision:owner.records.revision,games:structuredClone({...s.source.records.games,...owner.records.games})},health={...structuredClone(owner.health),injuries:Object.hasOwn(owner.health.injuries,key)?{[key]:structuredClone(owner.health.injuries[key]!)}:{}},receiptKey=JSON.stringify(['us-amateur-return-kbo',s.return.returnId,signing.receiptKey]);
 if(Object.values(records.games).some(g=>g.scope.seasonKey===world.seasonKey))throw new RangeError('US_RETURN_KBO_SEASON_CONFLICT');
 const teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:club.id,schools:world.clubs,players:world.players},relationships=formRegisteredTeamTeammate(s.preparation?.relationships??s.source.relationships,teamWorld,receiptKey,calendar.growthDays[0]!);
 const c:KboCareer={schemaVersion:1,revision:n+1,difficulty:s.source.difficulty,world,protagonistKey:key,protagonistClubId:club.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey,sourceYearEndReceiptKey:signing.receiptKey,sourceRevision:n,contractKey:signing.contract.contractKey},registration:{...signing.registration,status:'ACTIVE'},rights:structuredClone(signing.rights),amateurHistory:structuredClone(s.source.amateurHistory),usAmateurReturnHistory:structuredClone(s),records,health,seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(owner.development),seasonStartPlayer:structuredClone(player)},relationships,events:[...s.source.events.filter(e=>!s.events.some(current=>current.eventKey===e.eventKey)),...s.events],relationNotices:structuredClone(s.source.relationNotices),styleUsedWindows:[...owner.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],retryCareer:structuredClone(s.retry),military:{status:s.return.militaryStatus==='COMPLETED'?'COMPLETED':'NOT_APPLICABLE',applications:[]}};
 if(owner.traits)c.traits={...structuredClone(owner.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};if(s.source.achievements)c.achievements=structuredClone(s.source.achievements);if(s.source.aliases)c.aliases=structuredClone(s.source.aliases);if(s.source.recordCorrections)c.recordCorrections=structuredClone(s.source.recordCorrections);
 c.campNotices=queueKboFirstCampNotices(c);kboCareerEntryView(c);return c;
}
export function usAmateurReturnCareerView(s:UsAmateurReturnCareer){assertUsAmateurReturnCareer(s);return {...usAmateurReturnView(s.return),revision:s.revision,events:s.events.map(e=>({eventKey:e.eventKey,eventVersion:e.version,status:e.status})),draft:s.draft?kboDraftView(s.draft.world,s.draft.program):null};}
/** Direct-amateur US re-signing lacks a native market/continuation owner. Fail closed until that exists. */
export function cancelUsAmateurReturnAfterUsSigning(s:UsAmateurReturnCareer,n:number,_accepted:UsCareer):UsAmateurReturnCareer {
 void _accepted;revision(s,n);throw new RangeError('US_AMATEUR_RETURN_RESIGNING_NOT_SUPPORTED');
}

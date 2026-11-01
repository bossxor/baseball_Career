import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {canonicalJson} from './game.js';
import {openUsAmateurReturn,assertUsAmateurReturnLedger,settleUsAmateurIndependentYear,settleUsAmateurServiceYear,usAmateurReturnView,cancelUsAmateurReturnForUsOffer} from './us-amateur-return.js';
import type {UsAmateurReturnLedger} from './us-amateur-return.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason,completeUsMilitaryService} from './us-military-plan.js';
import {startUsMilitaryWorld,advanceUsMilitaryWorld} from './us-season.js';
import {startPreparationSeason,confirmPreparationPreseason,advancePreparationSeason,completePreparationSeason,assertPreparationSeason} from './preparation-season.js';
import type {PreparationSeason,PreparationWorld} from './preparation-season.js';
import {openRetryCareerEpisode,retryCareerRouteView,assertRetryCareerLedger} from './retry-career.js';
import type {RetryCareerLedger,RetryRouteAuthority} from './retry-career.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {closeSeasonHealth} from './health.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,validateEvent} from './events.js';
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
 version:1;revision:number;source:UsCareer;return:UsAmateurReturnLedger;retry:RetryCareerLedger;
 service?:UsCareer;preparation?:PreparationSeason;completedPreparation:readonly PreparationSeason[];events:readonly EventInstance[];
 draft?:{world:KboRosterWorld;program:KboDraftProgram};
 acceptedUs?:UsCareer;
}
function event(s:UsAmateurReturnCareer):EventInstance {
 const r=s.return,seasonKey=String(Number(r.sourceSeasonKey)+r.years.length),worldDay=r.years.at(-1)?.endWorldDay??s.source.world.calendar.growthDays.at(-1)!;
 return createWorldEvent({definitionId:'E68',worldKey:r.worldKey,seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:r.playerKey,contractWindowIdOrReturnProgramId:r.returnId,stage:String(r.years.length)}},resume:{worldKey:r.worldKey,seasonKey,phase:'RETURN_PREPARATION',competitionKey:null,registrationKey:null,sourceRevision:s.revision},sourceSequence:r.years.length+1,worldDay});
}
export function assertUsAmateurReturnCareer(s:UsAmateurReturnCareer):void {
 assertUsCareerRevision(s.source,s.source.revision);assertUsAmateurReturnLedger(s.return);assertRetryCareerLedger(s.retry);
 if(s.version!==1||!Number.isSafeInteger(s.revision)||s.revision<1||s.return.sourceRevision!==s.source.revision||s.return.worldKey!==s.source.world.worldKey||s.return.playerKey!==s.source.protagonistKey||s.retry.worldKey!==s.return.worldKey||s.retry.playerKey!==s.return.playerKey||s.completedPreparation.length!==s.return.years.filter(y=>y.kind==='INDEPENDENT').length)throw new RangeError('INVALID_US_RETURN_ROOT');
 for(const e of s.events)validateEvent(e);
 for(const p of s.completedPreparation)assertPreparationSeason(p);
 if(s.preparation)assertPreparationSeason(s.preparation);
 if(s.service)assertUsCareerRevision(s.service,s.service.revision);
 if(s.acceptedUs){assertUsCareerRevision(s.acceptedUs,s.acceptedUs.revision);if(s.return.status!=='CANCELLED_US'||s.acceptedUs.contract.status!=='ACTIVE')throw new RangeError('INVALID_RETURN_US_SIGNING');}
 if(s.draft){assertKboDraft(s.draft.world,s.draft.program);if(s.return.status!=='DRAFT_READY'||s.draft.program.input.assessmentKey!==s.return.draftReservationKey||canonicalJson(s.draft.program.input.player)!==canonicalJson(s.return.years.at(-1)!.endingPlayer))throw new RangeError('STALE_RETURN_DRAFT');}
}
function revision(s:UsAmateurReturnCareer,n:number):void {assertUsAmateurReturnCareer(s);if(s.revision!==n||n===Number.MAX_SAFE_INTEGER)throw new RangeError('US_RETURN_ROOT_REVISION_CHANGED');}
export function requestUsAmateurReturn(source:UsCareer,n:number):UsAmateurReturnCareer {
 const r=openUsAmateurReturn(source,n),retry=openRetryCareerEpisode(source.retryCareer,source.retryCareer?.revision??0,{worldKey:r.worldKey,playerKey:r.playerKey,seasonKey:r.sourceSeasonKey,age:r.sourceAge,receiptKey:r.returnId,reason:'CONTRACT_EXPIRED'});
 const s:UsAmateurReturnCareer={version:1,revision:n+1,source:structuredClone(source),return:r,retry,completedPreparation:[],events:[]};s.events=[event(s)];assertUsAmateurReturnCareer(s);return s;
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
/** E68 starts one mandatory period; acceptance never grants a fabricated completion. */
export function startUsAmateurReturnYear(s:UsAmateurReturnCareer,n:number,eventVersion:number):UsAmateurReturnCareer {
 revision(s,n);if(s.return.status!=='PREPARING'||s.preparation&&s.preparation.phase!=='PREPARATION_RESULT'||s.service&&s.service.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('US_RETURN_YEAR_IN_PROGRESS');
 const e=s.events.at(-1)!;const context={worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['ADVANCE_RETURN_PROGRAM']},plan=resolveEventChoice(e,eventVersion,'ADVANCE_RETURN_PROGRAM',null,context);
 const next={...s};next.revision++;
 if(s.return.militaryStatus==='UNRESOLVED'){
  let c=s.service??chooseUsMilitaryPlan(s.source,s.source.revision,'TERMINATE');c=startUsMilitaryServiceSeason(c,c.revision);next.service=startUsMilitaryWorld(c,c.revision);
 }else{
  const world=independentWorld(s),a=authority(s),view=retryCareerRouteView(s.retry,a),prior=s.preparation;
  next.preparation=confirmPreparationPreseason(startPreparationSeason(s.retry,s.retry.revision,a,{episodeId:s.retry.episodes.at(-1)!.episodeId,routePreviewId:view.routePreviewId,world,difficulty:s.source.difficulty,records:prior?.records??s.source.records,health:prior?.health??s.source.health,development:prior?.development??s.source.development,styleUsedWindows:prior?.styleUsedWindows??s.source.styleUsedWindows,mandatoryReturn:s.return}),s.retry.revision+1);next.retry=next.preparation.retry;
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
  const settled=settleUsAmateurServiceYear(s.return,s.return.revision,{player:c.world.players[c.protagonistKey]!,seasonKey:c.world.seasonKey,service:program,records:c.records,seasonGrowth:c.seasonGrowth});next.return=settled.return;c.world.players[c.protagonistKey]=settled.player;c.seasonGrowth=settled.seasonGrowth;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;const grown=settleUsMilitaryReturnWorldGrowth(c,c.revision);next.service=next.return.years.length===2?completeUsMilitaryService(grown,grown.revision):grown;
 }else{if(!s.preparation)throw new RangeError('US_RETURN_YEAR_NOT_STARTED');const p=completePreparationSeason(s.preparation,s.preparation.revision);next.preparation=p;next.retry=p.retry;next.return=settleUsAmateurIndependentYear(s.return,s.return.revision,p);next.completedPreparation=[...s.completedPreparation,p];}
 next.revision++;if(next.return.status==='PREPARING')next.events=[...next.events,event(next)];assertUsAmateurReturnCareer(next);return next;
}
export function prepareUsAmateurReturnDraft(s:UsAmateurReturnCareer,n:number,preferredClubId:string|null=null):UsAmateurReturnCareer {
 revision(s,n);if(s.return.status!=='DRAFT_READY'||s.draft)throw new RangeError('US_RETURN_DRAFT_NOT_READY');const p=s.return.years.at(-1)!.endingPlayer,world=createKboRosterWorld({worldKey:s.return.worldKey,seasonKey:String(Number(s.return.sourceSeasonKey)+3),seed:s.source.world.seed,difficulty:s.source.difficulty}),score=overall(p.kind,p.abilities),baseScore=s.preparation?.result?.baseScore??draftBaseScore(score.sumUnits/score.denominator,0);
 const next={...s};next.draft={world,program:prepareKboDraft(world,{assessmentKey:s.return.draftReservationKey!,player:p,baseScore,preferredClubId})};next.revision++;return next;
}
export function resolveUsAmateurReturnDraft(s:UsAmateurReturnCareer,n:number,programVersion:number):UsAmateurReturnCareer {
 revision(s,n);if(!s.draft)throw new RangeError('US_RETURN_DRAFT_REQUIRED');const next={...s};next.draft={...s.draft,program:resolveKboDraft(s.draft.world,s.draft.program,programVersion)};next.revision++;return next;
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
 const owner=s.preparation??s.service??s.source,records=structuredClone(owner.records),health=structuredClone(owner.health),receiptKey=JSON.stringify(['us-amateur-return-kbo',s.return.returnId,signing.receiptKey]);
 if(Object.values(records.games).some(g=>g.scope.seasonKey===world.seasonKey))throw new RangeError('US_RETURN_KBO_SEASON_CONFLICT');
 const teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:club.id,schools:world.clubs,players:world.players},relationships=formRegisteredTeamTeammate(s.source.relationships,teamWorld,receiptKey,calendar.growthDays[0]!);
 const c:KboCareer={schemaVersion:1,revision:n+1,difficulty:s.source.difficulty,world,protagonistKey:key,protagonistClubId:club.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey,sourceYearEndReceiptKey:signing.receiptKey,sourceRevision:n,contractKey:signing.contract.contractKey},registration:{...signing.registration,status:'ACTIVE'},rights:structuredClone(signing.rights),amateurHistory:structuredClone(s.source.amateurHistory),usAmateurReturnHistory:structuredClone(s),records,health,seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(owner.development),seasonStartPlayer:structuredClone(player)},relationships,events:[...s.source.events,...s.events],relationNotices:structuredClone(s.source.relationNotices),styleUsedWindows:[...owner.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],retryCareer:structuredClone(s.retry),military:{status:s.return.militaryStatus==='COMPLETED'?'COMPLETED':'NOT_APPLICABLE',applications:[]}};
 if(owner.traits)c.traits={...structuredClone(owner.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};if(s.source.achievements)c.achievements=structuredClone(s.source.achievements);if(s.source.aliases)c.aliases=structuredClone(s.source.aliases);if(s.source.recordCorrections)c.recordCorrections=structuredClone(s.source.recordCorrections);
 c.campNotices=queueKboFirstCampNotices(c);kboCareerEntryView(c);return c;
}
export function usAmateurReturnCareerView(s:UsAmateurReturnCareer){assertUsAmateurReturnCareer(s);return {...usAmateurReturnView(s.return),revision:s.revision,events:s.events.map(e=>({eventKey:e.eventKey,eventVersion:e.version,status:e.status})),draft:s.draft?kboDraftView(s.draft.world,s.draft.program):null};}
/** Consume an actual native signed offer, never a caller-provided eligibility flag or invented offer reference. */
export function cancelUsAmateurReturnAfterUsSigning(s:UsAmateurReturnCareer,n:number,accepted:UsCareer):UsAmateurReturnCareer {
 revision(s,n);assertUsCareerRevision(accepted,accepted.revision);const offer=accepted.military.service?.returnOffer,offerRef=offer?.status==='ACCEPTED'?offer.offerKey:undefined;
 const owner=s.preparation??s.service??s.source,seasonKey=String(Number(s.return.sourceSeasonKey)+s.return.years.length),age=s.return.sourceAge+s.return.years.length;
 if(!offerRef||accepted.activation.receiptKey!==s.source.activation.receiptKey||accepted.protagonistKey!==s.return.playerKey||accepted.world.worldKey!==s.return.worldKey||accepted.world.seasonKey!==seasonKey||accepted.world.players[s.return.playerKey]!.age!==age||accepted.contract.status!=='ACTIVE'||!['COMPLETED','NOT_APPLICABLE'].includes(accepted.military.status)||s.draft?.program.decision==='SIGNED'||Object.entries(owner.records.games).some(([k,row])=>canonicalJson(row)!==canonicalJson(accepted.records.games[k])))throw new RangeError('US_RETURN_NATIVE_SIGNED_OFFER_REQUIRED');
 const worldDay=accepted.military.service!.cursor!.worldDay,expiresGameDay=offer!.expiresWorldDay;
 const a:RetryRouteAuthority={...authority(s),seasonKey,age,worldDay,militaryStatus:accepted.military.status as 'COMPLETED'|'NOT_APPLICABLE',usRightsEligible:true,usOffers:[{offerRef,expiresGameDay}]};
 const next={...s,revision:n+1,return:cancelUsAmateurReturnForUsOffer(s.return,s.return.revision,a,{offerRef,authorityRevision:s.revision}),acceptedUs:structuredClone(accepted)};delete next.draft;return next;
}

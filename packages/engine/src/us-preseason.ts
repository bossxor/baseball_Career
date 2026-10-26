import {US_SEASON_GAMES} from './us-schedule.js';
import {registerPitchLearning} from './pitch-learning-progress.js';
import {assertFocus,PITCH_IDS} from '@playball/rules';
import type {PitchId} from '@playball/rules';
import type {UsCareer} from './us-career-entry.js';
import {usCareerEntryView} from './us-career-entry.js';
import {assertUsCareerRevision as assertCareerRevision} from './us-career-entry.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import {canonicalJson} from './game.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {setPitchWeights,beginPitchLearning,validatePitchWeights,pitchMastery} from './repertoire.js';
import type {PitchWeights} from './repertoire.js';
import {validatePitchXpLedger} from './pitch-xp.js';
import {createWorldEvent,enqueueWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import type {EventInstance} from './events.js';

export interface UsPreseasonPlan {receiptKey:string;seasonKey:string;playerKey:string;confirmedRevision:number;sourceBasis:string}
const windowKey=(s:UsCareer)=>JSON.stringify([s.world.seasonKey,'PRE']);
const planKey=(s:UsCareer)=>JSON.stringify(['us-preseason-plan',s.activation.receiptKey,s.world.seasonKey]);
function basis(s:UsCareer){return canonicalJson({player:s.world.players[s.protagonistKey],repertoire:s.world.repertoires[s.protagonistKey]??null,styleUsedWindows:s.styleUsedWindows,planHistory:s.planHistory});}
function assertSource(s:UsCareer,revision:number,allowConfirmed=false){
 assertCareerRevision(s,revision);usCareerEntryView(s);assertSeasonCalendar(s.world.calendar);validateSeasonGrowthLedger(s.seasonGrowth);
 const p=s.world.players[s.protagonistKey]!,start=s.seasonGrowth.seasonStart,old=s.amateurHistory;
 if(s.world.worldKey!==old.world.worldKey || s.world.seed!==old.world.seed || s.difficulty!==old.difficulty || s.protagonistKey!==old.world.protagonistKey || s.world.seasonKey!==String(s.world.calendar.year) || s.seasonGrowth.seasonKey!==s.world.seasonKey || s.seasonGrowth.playerKey!==p.simulationKey || s.seasonGrowth.worldGrowthDays!==s.world.calendar.growthDays.length || s.seasonGrowth.finalized || s.seasonGrowth.entries.length || s.seasonGrowth.totalBudgetUnits!==0 || s.events.some(e=>e.status==='OPEN') || Object.values(s.records.games).some(g=>g.scope.seasonKey===s.world.seasonKey) || s.development.trainingUsedSeasons.includes(s.world.seasonKey))throw new RangeError('INVALID_US_PRESEASON_SOURCE');
 validateDevelopmentPlayer(p);
 for(const key of ['simulationKey','name','kind','age','position','throws','bats','pitchForm','abilities','potential','careerPeaks','fatigue'] as const)if(canonicalJson(p[key])!==canonicalJson(start[key]))throw new RangeError('US_PRESEASON_PLAYER_CHANGED');
 const book=s.world.repertoires[p.simulationKey];if(p.kind==='PITCHER'){if(!book || book.seasonId!==s.world.seasonKey)throw new RangeError('INVALID_US_PRESEASON_REPERTOIRE');validatePitchWeights(book.book,book.weights);validatePitchXpLedger(book.ledger);}else if(book)throw new RangeError('INVALID_US_PRESEASON_REPERTOIRE');
 if(s.preseasonPlan){const plan=s.preseasonPlan;if(plan.receiptKey!==planKey(s) || plan.seasonKey!==s.world.seasonKey || plan.playerKey!==p.simulationKey || !Number.isSafeInteger(plan.confirmedRevision) || plan.confirmedRevision>s.revision || plan.confirmedRevision<1 || plan.sourceBasis!==basis(s) || canonicalJson(s.development.seasonStartPlayer)!==canonicalJson(p) || canonicalJson(start)!==canonicalJson(p))throw new RangeError('STALE_US_PRESEASON_PLAN');if(!allowConfirmed)throw new RangeError('US_PRESEASON_ALREADY_CONFIRMED');}
}
function updatePlan(s:UsCareer,focus:readonly string[],archetype:string){
 const next=structuredClone(s),key=s.protagonistKey;next.world.players[key]={...next.world.players[key]!,focus:[...focus],archetype};
 next.planHistory=[{completedTeamGames:0,focus:[...focus],archetype}];return next;
}
function campSource(s:UsCareer,e:EventInstance){
 enqueueWorldEvent([],e);
 if(e.definitionId!=='E58' || e.worldKey!==s.world.worldKey || e.seasonKey!==s.world.seasonKey || canonicalJson(e.evidence.fields)!==canonicalJson({playerSimulationKey:s.protagonistKey,routeDecisionIdOrContractId:s.contract.contractKey,stage:'FIRST_CAMP'}) || e.resume.competitionKey!==s.registration.level || e.resume.registrationKey!==s.protagonistOrganizationId || e.resume.phase!=='PRESEASON_SETUP' || e.occurredWorldDay!==s.world.calendar.growthDays[0])throw new RangeError('INVALID_US_FIRST_CAMP_SOURCE');
}
/** E58 is queued only on writes; confirming the plan does not simulate a game or add a bonus. */
export function queueUsFirstCampNotices(s:UsCareer):readonly EventInstance[]{
 if(s.minorYears?.length)return s.campNotices??[];
 assertSource(s,s.revision,true);const notices=s.campNotices??[];if(notices.length>1)throw new RangeError('DUPLICATE_US_FIRST_CAMP');for(const e of notices)campSource(s,e);if(notices.length || s.preseasonPlan)return structuredClone(notices);
 const event=createWorldEvent({definitionId:'E58',worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,evidence:{version:1,type:'DIRECT_US_ROUTE',fields:{playerSimulationKey:s.protagonistKey,routeDecisionIdOrContractId:s.contract.contractKey,stage:'FIRST_CAMP'}},resume:{worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,phase:'PRESEASON_SETUP',competitionKey:s.registration.level,registrationKey:s.protagonistOrganizationId,sourceRevision:s.revision},sourceSequence:s.events.length+1,worldDay:s.world.calendar.growthDays[0]!});return enqueueWorldEvent(notices,event).events;
}
function written(s:UsCareer){s.revision++;s.campNotices=queueUsFirstCampNotices(s);return s;}
export function setUsPreseasonFocus(s:UsCareer,revision:number,focus:readonly string[]):UsCareer {
 assertSource(s,revision);const p=s.world.players[s.protagonistKey]!;assertFocus(p.kind,focus);return written(updatePlan(s,focus,p.archetype));
}
export function setUsPreseasonArchetype(s:UsCareer,revision:number,archetype:string):UsCareer {
 assertSource(s,revision);const p=s.world.players[s.protagonistKey]!;archetypeFor(p.kind,archetype);const key=windowKey(s);
 if(p.archetype!==archetype && s.styleUsedWindows.includes(key))throw new RangeError('STYLE_WINDOW_USED');const next=updatePlan(s,p.focus,archetype);if(p.archetype!==archetype)next.styleUsedWindows=[...s.styleUsedWindows,key];return written(next);
}
export function setUsPreseasonPitchWeights(s:UsCareer,revision:number,weights:PitchWeights):UsCareer {
 assertSource(s,revision);const key=s.protagonistKey;if(s.world.players[key]!.kind!=='PITCHER')throw new RangeError('PITCHER_REQUIRED');const next=structuredClone(s);next.world.repertoires[key]=setPitchWeights(s.world.repertoires[key]!,weights,windowKey(s),true);return written(next);
}
export function beginUsPreseasonPitchLearning(s:UsCareer,revision:number,pitchId:PitchId,replacedPitchId?:PitchId):UsCareer {
 assertSource(s,revision);const key=s.protagonistKey;if(s.world.players[key]!.kind!=='PITCHER')throw new RangeError('PITCHER_REQUIRED');const next=structuredClone(s);next.world.repertoires[key]=beginPitchLearning(s.world.repertoires[key]!,pitchId,true,replacedPitchId?{pitchId:replacedPitchId,windowId:windowKey(s)}:undefined);next.world.repertoires[key]=registerPitchLearning(next.world.repertoires[key]!,s.world.worldKey,key,US_SEASON_GAMES[s.registration.level],Object.hasOwn(s.health.injuries,key));return written(next);
}
export function unreadUsFirstCampNotices(s:UsCareer){
 assertSource(s,s.revision,true);const notices=s.campNotices??[];if(notices.length>1)throw new RangeError('DUPLICATE_US_FIRST_CAMP');return notices.flatMap(e=>{campSource(s,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E58');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E58' as const,title:d.title,body:d.body,offeredCommands:s.preseasonPlan?['ACK_EVENT']:['CHOOSE_FOCUS','ACK_EVENT']}];});
}
export function resolveUsFirstCampNotice(s:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string;focus?:readonly string[]}):UsCareer {
 assertSource(s,revision,true);const matches=(s.campNotices??[]).filter(e=>e.eventKey===input.eventKey);if(matches.length!==1)throw new RangeError('UNKNOWN_US_FIRST_CAMP');const e=matches[0]!;campSource(s,e);
 const context={worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:s.preseasonPlan?['ACK_EVENT']:['CHOOSE_FOCUS','ACK_EVENT']};
 if(input.command==='ACK_EVENT' && input.focus!==undefined)throw new RangeError('UNEXPECTED_FOCUS');const chosen=resolveEventChoice(e,input.eventVersion,input.command,input.focus?{focus:[...input.focus]}:null,context);let next=structuredClone(s),resolved=chosen.event;
 if(chosen.domain){if(!input.focus)throw new RangeError('FOCUS_REQUIRED');assertFocus(s.world.players[s.protagonistKey]!.kind,input.focus);next=updatePlan(s,input.focus,s.world.players[s.protagonistKey]!.archetype);resolved=completeEventDomain(e,chosen.domain,JSON.stringify(['us-first-camp-focus',s.activation.receiptKey,s.revision+1]),context);}
 next.campNotices=next.campNotices!.map(event=>event.eventKey===e.eventKey?resolved:event);return written(next);
}
/** Locks the plan for later roster/schedule activation. Does not create a game or claim a1st-team slot. */
export function confirmUsPreseasonPlan(s:UsCareer,revision:number):UsCareer {
 assertSource(s,revision,true);if(s.preseasonPlan)return structuredClone(s);const next=structuredClone(s),p=next.world.players[next.protagonistKey]!;
 next.campNotices=queueUsFirstCampNotices(next);next.seasonGrowth.seasonStart=structuredClone(p);next.development.seasonStartPlayer=structuredClone(p);next.revision++;
 next.preseasonPlan={receiptKey:planKey(next),seasonKey:next.world.seasonKey,playerKey:next.protagonistKey,confirmedRevision:next.revision,sourceBasis:basis(next)};return next;
}
export function usPreseasonPlanView(s:UsCareer){
 assertSource(s,s.revision,true);const p=s.world.players[s.protagonistKey]!,book=s.world.repertoires[s.protagonistKey],draft=!s.preseasonPlan;
 return {seasonKey:s.world.seasonKey,status:draft?'DRAFT' as const:'CONFIRMED' as const,focus:[...p.focus],archetype:p.archetype,styleChangeAvailable:draft && !s.styleUsedWindows.includes(windowKey(s)),pitcher:book?{active:Object.entries(book.weights).map(([pitchId,weight])=>({pitchId,weight,mastery:pitchMastery(book.book[pitchId as PitchId]!)})),learningPitchId:book.learning?.pitchId??null,configurationChangeAvailable:draft && !book.usedWindows.includes(windowKey(s)),learningAvailable:draft && !book.learning && book.ledger.baseSpentUnits+book.ledger.baseReservedUnits+100_000<=200_000 && (Object.keys(book.weights).length<4 || !book.usedWindows.includes(windowKey(s))) && PITCH_IDS.some(id=>!Object.hasOwn(book.book,id))}:null};
}

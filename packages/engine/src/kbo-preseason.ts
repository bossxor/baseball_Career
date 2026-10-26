import {registerPitchLearning} from './pitch-learning-progress.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {assertFocus,PITCH_IDS} from '@playball/rules';
import type {PitchId} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {kboCareerEntryView} from './kbo-career-entry.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import {canonicalJson} from './game.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {setPitchWeights,beginPitchLearning,validatePitchWeights,pitchMastery} from './repertoire.js';
import type {PitchWeights} from './repertoire.js';
import {validatePitchXpLedger} from './pitch-xp.js';
import {createWorldEvent,enqueueWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import type {EventInstance} from './events.js';

export interface KboPreseasonPlan {receiptKey:string;seasonKey:string;playerKey:string;confirmedRevision:number;sourceBasis:string}
const windowKey=(s:KboCareer)=>JSON.stringify([s.world.seasonKey,'PRE']);
const planKey=(s:KboCareer)=>JSON.stringify(['kbo-preseason-plan',s.activation.receiptKey,s.world.seasonKey]);
function basis(s:KboCareer){return canonicalJson({player:s.world.players[s.protagonistKey],repertoire:s.world.repertoires[s.protagonistKey]??null,styleUsedWindows:s.styleUsedWindows,planHistory:s.planHistory});}
function assertSource(s:KboCareer,revision:number,allowConfirmed=false){
 assertCareerRevision(s,revision);kboCareerEntryView(s);assertSeasonCalendar(s.world.calendar);validateSeasonGrowthLedger(s.seasonGrowth);
 const p=s.world.players[s.protagonistKey]!,start=s.seasonGrowth.seasonStart,old=s.amateurHistory;
 if(s.world.worldKey!==old.world.worldKey || s.world.seed!==old.world.seed || s.difficulty!==old.difficulty || s.protagonistKey!==old.world.protagonistKey || s.world.seasonKey!==String(s.world.calendar.year) || s.seasonGrowth.seasonKey!==s.world.seasonKey || s.seasonGrowth.playerKey!==p.simulationKey || s.seasonGrowth.worldGrowthDays!==s.world.calendar.growthDays.length || s.seasonGrowth.finalized || s.seasonGrowth.entries.length || s.seasonGrowth.totalBudgetUnits!==0 || s.events.some(e=>e.status==='OPEN') || Object.values(s.records.games).some(g=>g.scope.seasonKey===s.world.seasonKey) || s.development.trainingUsedSeasons.includes(s.world.seasonKey))throw new RangeError('INVALID_KBO_PRESEASON_SOURCE');
 validateDevelopmentPlayer(p);
 for(const key of ['simulationKey','name','kind','age','position','throws','bats','pitchForm','abilities','potential','careerPeaks','fatigue'] as const)if(canonicalJson(p[key])!==canonicalJson(start[key]))throw new RangeError('KBO_PRESEASON_PLAYER_CHANGED');
 const book=s.world.repertoires[p.simulationKey];if(p.kind==='PITCHER'){if(!book || book.seasonId!==s.world.seasonKey)throw new RangeError('INVALID_KBO_PRESEASON_REPERTOIRE');validatePitchWeights(book.book,book.weights);validatePitchXpLedger(book.ledger);}else if(book)throw new RangeError('INVALID_KBO_PRESEASON_REPERTOIRE');
 if(s.preseasonPlan){const plan=s.preseasonPlan;if(plan.receiptKey!==planKey(s) || plan.seasonKey!==s.world.seasonKey || plan.playerKey!==p.simulationKey || !Number.isSafeInteger(plan.confirmedRevision) || plan.confirmedRevision>s.revision || plan.confirmedRevision<1 || plan.sourceBasis!==basis(s) || canonicalJson(s.development.seasonStartPlayer)!==canonicalJson(p) || canonicalJson(start)!==canonicalJson(p))throw new RangeError('STALE_KBO_PRESEASON_PLAN');if(!allowConfirmed)throw new RangeError('KBO_PRESEASON_ALREADY_CONFIRMED');}
}
function updatePlan(s:KboCareer,focus:readonly string[],archetype:string){
 const next=structuredClone(s),key=s.protagonistKey;next.world.players[key]={...next.world.players[key]!,focus:[...focus],archetype};
 next.planHistory=[{completedTeamGames:0,focus:[...focus],archetype}];return next;
}
function campSource(s:KboCareer,e:EventInstance){
 enqueueWorldEvent([],e);
 if(e.definitionId!=='E08' || e.worldKey!==s.world.worldKey || e.seasonKey!==s.world.seasonKey || canonicalJson(e.evidence.fields)!==canonicalJson({playerSimulationKey:s.protagonistKey,milestoneKey:s.activation.receiptKey}) || e.resume.competitionKey!=='KBO' || e.resume.registrationKey!==s.protagonistClubId || e.resume.phase!=='PRESEASON_SETUP' || e.occurredWorldDay!==s.world.calendar.growthDays[0])throw new RangeError('INVALID_KBO_FIRST_CAMP_SOURCE');
}
/** Nonblocking E08; old AP saves catch up on a write, never on a read. First pro season only: later seasons keep the old notice as history. */
export function queueKboFirstCampNotices(s:KboCareer):readonly EventInstance[]{
 assertSource(s,s.revision,true);if(s.proSeasons?.length)return structuredClone(s.campNotices??[]);const notices=s.campNotices??[];if(notices.length>1)throw new RangeError('DUPLICATE_KBO_FIRST_CAMP');for(const e of notices)campSource(s,e);if(notices.length || s.preseasonPlan)return structuredClone(notices);
 const event=createWorldEvent({definitionId:'E08',worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,evidence:{version:1,type:'FIRST_PRO_MILESTONE',fields:{playerSimulationKey:s.protagonistKey,milestoneKey:s.activation.receiptKey}},resume:{worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,phase:'PRESEASON_SETUP',competitionKey:'KBO',registrationKey:s.protagonistClubId,sourceRevision:s.revision},sourceSequence:s.events.length+1,worldDay:s.world.calendar.growthDays[0]!});return enqueueWorldEvent(notices,event).events;
}
function written(s:KboCareer){s.revision++;s.campNotices=queueKboFirstCampNotices(s);return s;}
export function setKboPreseasonFocus(s:KboCareer,revision:number,focus:readonly string[]):KboCareer {
 assertSource(s,revision);const p=s.world.players[s.protagonistKey]!;assertFocus(p.kind,focus);return written(updatePlan(s,focus,p.archetype));
}
export function setKboPreseasonArchetype(s:KboCareer,revision:number,archetype:string):KboCareer {
 assertSource(s,revision);const p=s.world.players[s.protagonistKey]!;archetypeFor(p.kind,archetype);const key=windowKey(s);
 if(p.archetype!==archetype && s.styleUsedWindows.includes(key))throw new RangeError('STYLE_WINDOW_USED');const next=updatePlan(s,p.focus,archetype);if(p.archetype!==archetype)next.styleUsedWindows=[...s.styleUsedWindows,key];return written(next);
}
export function setKboPreseasonPitchWeights(s:KboCareer,revision:number,weights:PitchWeights):KboCareer {
 assertSource(s,revision);const key=s.protagonistKey;if(s.world.players[key]!.kind!=='PITCHER')throw new RangeError('PITCHER_REQUIRED');const next=structuredClone(s);next.world.repertoires[key]=setPitchWeights(s.world.repertoires[key]!,weights,windowKey(s),true);return written(next);
}
export function beginKboPreseasonPitchLearning(s:KboCareer,revision:number,pitchId:PitchId,replacedPitchId?:PitchId):KboCareer {
 assertSource(s,revision);if(kboActiveContractSuspended(s.world.contracts[s.protagonistKey]!))throw new RangeError('ACTIVE_SERVICE_TRAINING_UNAVAILABLE');const key=s.protagonistKey;if(s.world.players[key]!.kind!=='PITCHER')throw new RangeError('PITCHER_REQUIRED');const next=structuredClone(s);next.world.repertoires[key]=beginPitchLearning(s.world.repertoires[key]!,pitchId,true,replacedPitchId?{pitchId:replacedPitchId,windowId:windowKey(s)}:undefined);next.world.repertoires[key]=registerPitchLearning(next.world.repertoires[key]!,s.world.worldKey,key,144,Object.hasOwn(s.health.injuries,key));return written(next);
}
export function unreadKboFirstCampNotices(s:KboCareer){
 assertSource(s,s.revision,true);if(s.proSeasons?.length)return [];const notices=s.campNotices??[];if(notices.length>1)throw new RangeError('DUPLICATE_KBO_FIRST_CAMP');return notices.flatMap(e=>{campSource(s,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E08');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E08' as const,title:d.title,body:d.body,offeredCommands:s.preseasonPlan?['KEEP_FOCUS']:['CHOOSE_FOCUS','KEEP_FOCUS']}];});
}
export function resolveKboFirstCampNotice(s:KboCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string;focus?:readonly string[]}):KboCareer {
 assertSource(s,revision,true);const matches=(s.campNotices??[]).filter(e=>e.eventKey===input.eventKey && !s.proSeasons?.length);if(matches.length!==1)throw new RangeError('UNKNOWN_KBO_FIRST_CAMP');const e=matches[0]!;campSource(s,e);
 const context={worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:s.preseasonPlan?['KEEP_FOCUS']:['CHOOSE_FOCUS','KEEP_FOCUS']};
 if(input.command==='KEEP_FOCUS' && input.focus!==undefined)throw new RangeError('UNEXPECTED_FOCUS');const chosen=resolveEventChoice(e,input.eventVersion,input.command,input.focus?{focus:[...input.focus]}:null,context);let next=structuredClone(s),resolved=chosen.event;
 if(chosen.domain){if(!input.focus)throw new RangeError('FOCUS_REQUIRED');assertFocus(s.world.players[s.protagonistKey]!.kind,input.focus);next=updatePlan(s,input.focus,s.world.players[s.protagonistKey]!.archetype);resolved=completeEventDomain(e,chosen.domain,JSON.stringify(['kbo-first-camp-focus',s.activation.receiptKey,s.revision+1]),context);}
 next.campNotices=next.campNotices!.map(event=>event.eventKey===e.eventKey?resolved:event);return written(next);
}
/** Locks the plan for later roster/schedule activation. Does not create a game or claim a1st-team slot. */
export function confirmKboPreseasonPlan(s:KboCareer,revision:number):KboCareer {
 assertSource(s,revision,true);if(s.preseasonPlan)return structuredClone(s);const next=structuredClone(s),p=next.world.players[next.protagonistKey]!;
 next.campNotices=queueKboFirstCampNotices(next);next.seasonGrowth.seasonStart=structuredClone(p);next.development.seasonStartPlayer=structuredClone(p);next.revision++;
 next.preseasonPlan={receiptKey:planKey(next),seasonKey:next.world.seasonKey,playerKey:next.protagonistKey,confirmedRevision:next.revision,sourceBasis:basis(next)};return next;
}
export function kboPreseasonPlanView(s:KboCareer){
 assertSource(s,s.revision,true);const p=s.world.players[s.protagonistKey]!,book=s.world.repertoires[s.protagonistKey],draft=!s.preseasonPlan;
 return {seasonKey:s.world.seasonKey,status:draft?'DRAFT' as const:'CONFIRMED' as const,focus:[...p.focus],archetype:p.archetype,styleChangeAvailable:draft && !s.styleUsedWindows.includes(windowKey(s)),pitcher:book?{active:Object.entries(book.weights).map(([pitchId,weight])=>({pitchId,weight,mastery:pitchMastery(book.book[pitchId as PitchId]!)})),learningPitchId:book.learning?.pitchId??null,configurationChangeAvailable:draft && !book.usedWindows.includes(windowKey(s)),learningAvailable:draft && !kboActiveContractSuspended(s.world.contracts[s.protagonistKey]!) && !book.learning && book.ledger.baseSpentUnits+book.ledger.baseReservedUnits+100_000<=200_000 && (Object.keys(book.weights).length<4 || !book.usedWindows.includes(windowKey(s))) && PITCH_IDS.some(id=>!Object.hasOwn(book.book,id))}:null};
}

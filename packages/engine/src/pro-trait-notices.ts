import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import type {UsProgress} from './us-season.js';
import type {TraitUnlockReceipt} from './high-school-traits.js';
import {createWorldEvent,eventDefinition,resolveEventChoice} from './events.js';

type ProCareer=KboCareer|UsCareer;
type ProProgress=KboSeasonProgress|UsProgress;
const HIDDEN=new Set(['T13','T14','T15','T16']);
const isUs=(source:ProCareer):source is UsCareer=>'mode' in source&&source.mode==='US_CAREER';
function registration(source:ProCareer){
 const key=source.protagonistKey,r=source.registration;
 if(!source.world.worldKey||!source.world.seasonKey||!key||source.world.players[key]?.simulationKey!==key||r.playerKey!==key||r.seasonKey!==source.world.seasonKey||!r.clubId)throw new RangeError('INVALID_PRO_TRAIT_SOURCE');
 return {clubId:r.clubId,leagueKey:isUs(source)?source.registration.level:source.registration.competitionKey??(source.registration.firstTeam?'KBO':'FUTURES')};
}
function assertBoundary(source:ProCareer,day:number,resume:ProProgress):void {
 if(!Number.isSafeInteger(day)||day<0||resume.phase!=='SEASON_PROGRESS'||resume.pendingGame!==null||resume.nextWorldDay!==day+1)throw new RangeError('INVALID_PRO_TRAIT_RESUME');
 const closed=isUs(source)?source.season?.days.at(-1)?.day:source.days?.worldKey===source.world.worldKey&&source.days.seasonKey===source.world.seasonKey?source.days.days.at(-1)?.day:undefined;
 if(closed!==day||source.traits?.lastClosedDay!==day||source.traits.lastSeasonKey!==source.world.seasonKey)throw new RangeError('PRO_TRAIT_DAY_NOT_CLOSED');
}
function validReceipt(source:ProCareer,receipt:TraitUnlockReceipt,day:number):boolean {
 const leagues=isUs(source)?['ROOKIE','A','AA','AAA','MLB']:['KBO','FUTURES'];
 return receipt.playerKey===source.protagonistKey&&HIDDEN.has(receipt.traitId)&&Number.isSafeInteger(receipt.worldDay)&&receipt.worldDay>=0&&receipt.worldDay<=day&&receipt.seasonKey===source.world.seasonKey&&receipt.recordRevision<=source.records.revision&&Number.isSafeInteger(receipt.recordRevision)&&receipt.recordRevision>=0&&leagues.includes(receipt.leagueKey??'')&&!!source.traits?.owned[source.protagonistKey]?.unlocked.includes(receipt.traitId);
}

/** Worker-only regular day-close writer; the worker's finish commits the one revision increment. */
export function raiseProHiddenTraitNotice(source:KboCareer,day:number,resume:KboSeasonProgress):KboCareer|null;
export function raiseProHiddenTraitNotice(source:UsCareer,day:number,resume:UsProgress):UsCareer|null;
export function raiseProHiddenTraitNotice(source:ProCareer,day:number,resume:ProProgress):ProCareer|null {
 if(source.phaseContext.phase!=='SEASON_PROGRESS'||source.phaseContext.pendingGame!==null||source.phaseContext.nextWorldDay!==resume.nextWorldDay)throw new RangeError('INVALID_PRO_TRAIT_PHASE');
 const r=registration(source);
 const receipt=source.traits?.unlocks.find(u=>validReceipt(source,u,day)&&!source.events.some(e=>e.definitionId==='E84'&&e.worldKey===source.world.worldKey&&e.evidence.fields.playerSimulationKey===source.protagonistKey&&e.evidence.fields.traitId===u.traitId));
 if(!receipt)return null;
 assertBoundary(source,day,resume);
 if(!Number.isSafeInteger(source.revision)||source.revision<1)throw new RangeError('STALE_PRO_TRAIT_REVISION');
 const definition=eventDefinition('E84'),event=createWorldEvent({definitionId:'E84',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:receipt.playerKey,traitId:receipt.traitId,unlockEvidenceVersion:1}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:r.leagueKey,registrationKey:r.clubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 return {...source,events:[...source.events,event],phaseContext:{phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{...resume,pendingGame:null}}};
}

interface ProTraitChoice {eventKey:string;eventVersion:number;command:string}
type ProTraitResolution<T>={career:T;navigation:{targetScreen:string;sourceEventKey:string}|null};
/** Public E84 navigation resolves once and restores the exact saved regular progress boundary. */
export function resolveProHiddenTraitNotice(source:KboCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<KboCareer>;
export function resolveProHiddenTraitNotice(source:UsCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<UsCareer>;
export function resolveProHiddenTraitNotice(source:ProCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<ProCareer> {
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<1||source.revision!==expectedRevision)throw new RangeError('STALE_PRO_TRAIT_REVISION');
 const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION'||phase.eventKey!==input.eventKey)throw new RangeError('INVALID_PRO_TRAIT_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey),r=registration(source);
 if(!event||event.definitionId!=='E84'||event.worldKey!==source.world.worldKey||event.seasonKey!==source.world.seasonKey||(!Number.isSafeInteger(event.resume.sourceRevision)||event.resume.sourceRevision<1||event.resume.sourceRevision>source.revision)||event.resume.phase!=='SEASON_PROGRESS'||event.resume.registrationKey!==r.clubId||event.resume.competitionKey!==r.leagueKey||event.evidence.fields.playerSimulationKey!==source.protagonistKey||!source.traits?.unlocks.some(u=>u.traitId===event.evidence.fields.traitId&&validReceipt(source,u,event.occurredWorldDay)))throw new RangeError('INVALID_PRO_TRAIT_NOTICE_SOURCE');
 assertBoundary(source,event.occurredWorldDay,phase.resume);
 if(isUs(source))assertUsCareerRevision(source,expectedRevision);else assertKboCareerRevision(source,expectedRevision);
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_TRAITS']});
 return {career:{...source,revision:source.revision+1,events:source.events.map(e=>e.eventKey===event.eventKey?selected.event:e),phaseContext:{...phase.resume,pendingGame:null}},navigation:selected.navigation};
}

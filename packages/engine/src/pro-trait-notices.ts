import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import type {UsProgress} from './us-season.js';
import {assertKboPostseasonProgress} from './kbo-postseason-progress.js';
import type {KboPostseasonPhase} from './kbo-postseason-progress.js';
import {assertUsPostseasonProgress} from './us-postseason-progress.js';
import type {UsPostseasonPhase} from './us-postseason-progress.js';
import {canonicalJson} from './game.js';
import type {TraitUnlockReceipt} from './high-school-traits.js';
import {createWorldEvent,eventDefinition,resolveEventChoice} from './events.js';

type ProCareer=KboCareer|UsCareer;
export type KboProTraitResume=KboSeasonProgress|KboPostseasonPhase|{phase:'SEASON_REVIEW'};
export type UsProTraitResume=UsProgress|UsPostseasonPhase|{phase:'SEASON_REVIEW'};
type ProTraitResume=KboProTraitResume|UsProTraitResume;
const HIDDEN=new Set(['T13','T14','T15','T16']);
const isUs=(source:ProCareer):source is UsCareer=>'mode' in source&&source.mode==='US_CAREER';
function registration(source:ProCareer){
 const key=source.protagonistKey,r=source.registration;
 if(!source.world.worldKey||!source.world.seasonKey||!key||source.world.players[key]?.simulationKey!==key||r.playerKey!==key||r.seasonKey!==source.world.seasonKey||!r.clubId)throw new RangeError('INVALID_PRO_TRAIT_SOURCE');
 return {clubId:r.clubId,leagueKey:isUs(source)?source.registration.level:source.registration.competitionKey??(source.registration.firstTeam?'KBO':'FUTURES')};
}
function assertBoundary(source:ProCareer,day:number,resume:ProTraitResume):void {
 if(!Number.isSafeInteger(day)||day<0||!['SEASON_PROGRESS','POSTSEASON_PROGRESS','SEASON_REVIEW'].includes(resume.phase)||resume.phase!=='SEASON_REVIEW'&&(resume.pendingGame!==null||resume.nextWorldDay!==day+1))throw new RangeError('INVALID_PRO_TRAIT_RESUME');
 if(resume.phase==='SEASON_PROGRESS'){
  const closed=isUs(source)?source.season?.days.at(-1)?.day:source.days?.worldKey===source.world.worldKey&&source.days.seasonKey===source.world.seasonKey?source.days.days.at(-1)?.day:undefined;
  if(closed!==day)throw new RangeError('PRO_TRAIT_DAY_NOT_CLOSED');
 }else if(isUs(source)){
  const post=resume.phase==='POSTSEASON_PROGRESS'&&'bracket' in resume?resume:resume.phase==='SEASON_REVIEW'&&source.postseason?.bracket.championKey?{phase:'POSTSEASON_PROGRESS' as const,...source.postseason,nextWorldDay:source.season!.lastDay+1+source.postseason.bracket.results.length,pendingGame:null}:null;
  if(!post||post.nextWorldDay!==day+1)throw new RangeError('INVALID_PRO_TRAIT_RESUME');assertUsPostseasonProgress(source,post);
 }else{
  const post=resume.phase==='POSTSEASON_PROGRESS'&&'postseason' in resume?resume:resume.phase==='SEASON_REVIEW'&&source.postseason?.championKey?{phase:'POSTSEASON_PROGRESS' as const,postseason:source.postseason,nextWorldDay:day+1,pendingGame:null}:null;
  if(!post)throw new RangeError('INVALID_PRO_TRAIT_RESUME');assertKboPostseasonProgress(source,post);
 }
 if(source.traits?.lastClosedDay!==day||source.traits.lastSeasonKey!==source.world.seasonKey)throw new RangeError('PRO_TRAIT_DAY_NOT_CLOSED');
}
function validReceipt(source:ProCareer,receipt:TraitUnlockReceipt,day:number):boolean {
 const leagues=isUs(source)?['ROOKIE','A','AA','AAA','MLB']:['KBO','FUTURES'];
 return receipt.playerKey===source.protagonistKey&&HIDDEN.has(receipt.traitId)&&Number.isSafeInteger(receipt.worldDay)&&receipt.worldDay>=0&&receipt.worldDay<=day&&receipt.seasonKey===source.world.seasonKey&&receipt.recordRevision<=source.records.revision&&Number.isSafeInteger(receipt.recordRevision)&&receipt.recordRevision>=0&&leagues.includes(receipt.leagueKey??'')&&!!source.traits?.owned[source.protagonistKey]?.unlocked.includes(receipt.traitId);
}

/** Closed-date writer; its caller commits the one revision increment. */
export function raiseProHiddenTraitNotice(source:KboCareer,day:number,resume:KboProTraitResume):KboCareer|null;
export function raiseProHiddenTraitNotice(source:UsCareer,day:number,resume:UsProTraitResume):UsCareer|null;
export function raiseProHiddenTraitNotice(source:ProCareer,day:number,resume:ProTraitResume):ProCareer|null {
 const phase=source.phaseContext;
 if(phase.phase!==resume.phase||!['SEASON_PROGRESS','POSTSEASON_PROGRESS','SEASON_REVIEW'].includes(phase.phase)||'pendingGame' in phase&&(phase.pendingGame!==null||phase.nextWorldDay!==('nextWorldDay' in resume?resume.nextWorldDay:undefined)))throw new RangeError('INVALID_PRO_TRAIT_PHASE');
 const r=registration(source);
 const receipt=source.traits?.unlocks.find(u=>validReceipt(source,u,day)&&!source.events.some(e=>e.definitionId==='E84'&&e.worldKey===source.world.worldKey&&e.evidence.fields.playerSimulationKey===source.protagonistKey&&e.evidence.fields.traitId===u.traitId));
 if(!receipt)return null;
 assertBoundary(source,day,resume);
 if(!Number.isSafeInteger(source.revision)||source.revision<1)throw new RangeError('STALE_PRO_TRAIT_REVISION');
 if(resume.phase==='POSTSEASON_PROGRESS'&&canonicalJson(phase)!==canonicalJson(resume))throw new RangeError('INVALID_PRO_TRAIT_RESUME');
 const definition=eventDefinition('E84'),event=createWorldEvent({definitionId:'E84',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:receipt.playerKey,traitId:receipt.traitId,unlockEvidenceVersion:1}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:resume.phase,competitionKey:r.leagueKey,registrationKey:r.clubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 return isUs(source)?{...source,events:[...source.events,event],phaseContext:{phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(resume) as UsProTraitResume}}:{...source,events:[...source.events,event],phaseContext:{phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(resume) as KboProTraitResume}};
}

interface ProTraitChoice {eventKey:string;eventVersion:number;command:string}
type ProTraitResolution<T>={career:T;navigation:{targetScreen:string;sourceEventKey:string}|null};
/** Public E84 navigation resolves once and restores the exact closed-date continuation. */
export function resolveProHiddenTraitNotice(source:KboCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<KboCareer>;
export function resolveProHiddenTraitNotice(source:UsCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<UsCareer>;
export function resolveProHiddenTraitNotice(source:ProCareer,expectedRevision:number,input:ProTraitChoice):ProTraitResolution<ProCareer> {
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<1||source.revision!==expectedRevision)throw new RangeError('STALE_PRO_TRAIT_REVISION');
 const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION'||phase.eventKey!==input.eventKey)throw new RangeError('INVALID_PRO_TRAIT_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey),r=registration(source);
 if(!event||event.definitionId!=='E84'||event.worldKey!==source.world.worldKey||event.seasonKey!==source.world.seasonKey||(!Number.isSafeInteger(event.resume.sourceRevision)||event.resume.sourceRevision<1||event.resume.sourceRevision>source.revision)||event.resume.phase!==phase.resume.phase||event.resume.registrationKey!==r.clubId||event.resume.competitionKey!==r.leagueKey||event.evidence.fields.playerSimulationKey!==source.protagonistKey||!source.traits?.unlocks.some(u=>u.traitId===event.evidence.fields.traitId&&validReceipt(source,u,event.occurredWorldDay)))throw new RangeError('INVALID_PRO_TRAIT_NOTICE_SOURCE');
 assertBoundary(source,event.occurredWorldDay,phase.resume);
 if(isUs(source))assertUsCareerRevision(source,expectedRevision);else assertKboCareerRevision(source,expectedRevision);
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_TRAITS']});
 const events=source.events.map(e=>e.eventKey===event.eventKey?selected.event:e);
 let career:ProCareer=isUs(source)?{...source,events,phaseContext:structuredClone(phase.resume) as UsProTraitResume}:{...source,events,phaseContext:structuredClone(phase.resume) as KboProTraitResume};
 if(phase.resume.phase!=='SEASON_PROGRESS')career=(isUs(career)?raiseProHiddenTraitNotice(career,event.occurredWorldDay,career.phaseContext as UsProTraitResume):raiseProHiddenTraitNotice(career,event.occurredWorldDay,career.phaseContext as KboProTraitResume))??career;
 return {career:{...career,revision:source.revision+1},navigation:selected.navigation};
}

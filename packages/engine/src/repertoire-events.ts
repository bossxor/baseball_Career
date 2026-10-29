import {APPROACH_LOGITS,PITCH_IDS} from '@playball/rules';
import type {Approach,PitchId} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertSchoolCareerRevision} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {beginSchoolPreseasonPitchLearning} from './school-repertoire.js';
import {beginKboPreseasonPitchLearning} from './kbo-preseason.js';
import {beginUsPreseasonPitchLearning} from './us-preseason.js';
import {US_SEASON_GAMES} from './us-schedule.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {pitchMastery,validatePitchWeights} from './repertoire.js';
import {validatePitchXpLedger} from './pitch-xp.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice,completeEventDomain} from './events.js';
import type {EventInstance} from './events.js';

export interface PitchLevelReceipt {receiptKey:string;seasonKey:string;pitchId:PitchId;grade:number;xpEvidenceKey:string;xpAfter:number}
export interface CareerRepertoireLedger {
 schemaVersion:1;worldKey:string;playerKey:string;approach:Approach;usedApproachWindows:readonly string[];
 levels:readonly PitchLevelReceipt[];notices:readonly EventInstance[];
}
export type RepertoireCareer=(HighSchoolCareer|KboCareer|UsCareer)&{repertoireEvents?:CareerRepertoireLedger};
const isUs=(c:RepertoireCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
const isKbo=(c:RepertoireCareer):c is KboCareer=>'protagonistClubId'in c;
function scope(c:RepertoireCareer){
 if(isUs(c))return {key:c.protagonistKey,team:c.protagonistOrganizationId,league:c.registration.level,games:US_SEASON_GAMES[c.registration.level],available:c.registration.status==='ACTIVE'};
 if(isKbo(c))return {key:c.protagonistKey,team:c.protagonistClubId,league:c.registration.firstTeam?'KBO':'FUTURES',games:144,available:!kboActiveContractSuspended(c.world.contracts[c.protagonistKey]!)};
 return {key:c.world.protagonistKey,team:c.world.protagonistSchoolId,league:c.world.leagueKey??'HS',games:c.world.schedule.filter(g=>g.homeTeamKey===c.world.protagonistSchoolId||g.awayTeamKey===c.world.protagonistSchoolId).length,available:true};
}
function assertRevision(c:RepertoireCareer,revision:number){if(isUs(c))assertUsCareerRevision(c,revision);else if(isKbo(c))assertKboCareerRevision(c,revision);else assertSchoolCareerRevision(c,revision);}
function empty(c:RepertoireCareer):CareerRepertoireLedger{return {schemaVersion:1,worldKey:c.world.worldKey,playerKey:scope(c).key,approach:'BALANCED',usedApproachWindows:[],levels:[],notices:[]};}
function validate(c:RepertoireCareer){
 const l=c.repertoireEvents;if(!l)return;
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==scope(c).key||!Object.hasOwn(APPROACH_LOGITS,l.approach)||!Array.isArray(l.usedApproachWindows)||!Array.isArray(l.levels)||!Array.isArray(l.notices)||l.usedApproachWindows.some(w=>typeof w!=='string'||!w)||new Set(l.usedApproachWindows).size!==l.usedApproachWindows.length||new Set(l.levels.map(r=>r.receiptKey)).size!==l.levels.length||new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length)throw new RangeError('INVALID_REPERTOIRE_EVENT_LEDGER');
 for(const r of l.levels)if(!r.seasonKey||!r.xpEvidenceKey||!PITCH_IDS.includes(r.pitchId)||!Number.isSafeInteger(r.grade)||r.grade<1||r.grade>5||pitchMastery(r.xpAfter)<r.grade||r.receiptKey!==levelKey(c,r.seasonKey,r.pitchId,r.grade,r.xpEvidenceKey))throw new RangeError('INVALID_PITCH_LEVEL_RECEIPT');
 for(const e of l.notices){validateEvent(e);if(!['E86','E87','E88'].includes(e.definitionId)||e.worldKey!==l.worldKey||e.evidence.fields.playerSimulationKey!==l.playerKey||e.resume.sourceRevision>c.revision)throw new RangeError('INVALID_REPERTOIRE_EVENT');if(e.definitionId==='E87'&&!l.levels.some(r=>r.receiptKey===e.evidence.fields.trainingWindowIdOrPitchLevelReceiptId&&r.seasonKey===e.seasonKey))throw new RangeError('MISSING_PITCH_LEVEL_RECEIPT');}
}
function levelKey(c:RepertoireCareer,season:string,pitch:PitchId,grade:number,evidence:string){return JSON.stringify(['pitch-level',c.world.worldKey,scope(c).key,season,pitch,grade,evidence]);}
function window(c:RepertoireCareer):'PRE'|'MID'|null {
 const r=scope(c),p=c.phaseContext;
 if(!r.available)return null;
 if(p.phase==='PRESEASON_SETUP'&&(!('preseasonPlan'in c)||!c.preseasonPlan)&&!Object.values(c.records.games).some(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='REGULAR'))return 'PRE';
 if(p.phase!=='SEASON_PROGRESS'||p.pendingGame||Object.hasOwn(c.health.injuries,r.key))return null;
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey===r.league&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,r.team));
 return games.length>=Math.ceil(r.games/2)?'MID':null;
}
function windowKey(c:RepertoireCareer,w:'PRE'|'MID'){return JSON.stringify([c.world.seasonKey,w]);}
function learningAvailable(c:RepertoireCareer){const r=scope(c),book=c.world.repertoires[r.key];return window(c)==='PRE'&&c.world.players[r.key]!.kind==='PITCHER'&&!!book&&!book.learning&&book.ledger.baseSpentUnits+book.ledger.baseReservedUnits+100_000<=200_000&&(Object.keys(book.weights).length<4||!book.usedWindows.includes(windowKey(c,'PRE')))&&PITCH_IDS.some(id=>pitchMastery(book.book[id]??0)===0);}
function append(c:RepertoireCareer,l:CareerRepertoireLedger,id:'E86'|'E87'|'E88',source:string,day:number){
 const r=scope(c),d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:r.key,trainingWindowIdOrPitchLevelReceiptId:source}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:r.league,registrationKey:r.team,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day});
 if(!l.notices.some(e=>e.eventKey===event.eventKey))l.notices=[...l.notices,event];
}
/** SERVER ONLY: committed PRE entry / closed day. Official XP entries, never a pending game's temporary book. */
export function refreshCareerRepertoireEvents<T extends RepertoireCareer>(c:T):T {
 validate(c);if(c.phaseContext.phase==='EVENT_DECISION'||c.phaseContext.phase==='CREATED'||c.phaseContext.phase==='ARCHIVED'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))return c;
 const r=scope(c),l=structuredClone(c.repertoireEvents??empty(c)),book=c.world.repertoires[r.key],day=Math.max(0,...c.health.games.filter(g=>g.evidence.seasonKey===c.world.seasonKey).map(g=>g.evidence.day));
 if(book){
  validatePitchWeights(book.book,book.weights);validatePitchXpLedger(book.ledger);
  for(const id of PITCH_IDS){
   const entries=book.ledger.entries.filter(e=>e.pitchId===id);let xp=(book.book[id]??0)-entries.reduce((n,e)=>n+e.bookGain,0);pitchMastery(xp);
   for(const e of entries){const before=pitchMastery(xp);xp+=e.bookGain;for(let grade=before+1;grade<=pitchMastery(xp);grade++){const receiptKey=levelKey(c,c.world.seasonKey,id,grade,e.evidenceKey);if(!l.levels.some(x=>x.receiptKey===receiptKey))l.levels=[...l.levels,{receiptKey,seasonKey:c.world.seasonKey,pitchId:id,grade,xpEvidenceKey:e.evidenceKey,xpAfter:xp}];append(c,l,'E87',receiptKey,day);}}
  }
 }
 const w=window(c);
 if(learningAvailable(c))append(c,l,'E86',windowKey(c,'PRE'),day);
 if(w&&c.world.players[r.key]!.kind==='HITTER'&&!l.usedApproachWindows.includes(windowKey(c,w)))append(c,l,'E88',windowKey(c,w),day);
 if(canonicalJson(l)===canonicalJson(c.repertoireEvents??empty(c)))return c;
 return {...c,repertoireEvents:l};
}
/** Read by all game snapshot owners. Legacy saves use the established balanced default. */
export function careerBattingApproaches(c:RepertoireCareer):Readonly<Record<string,Approach>> {validate(c);return c.repertoireEvents?{[scope(c).key]:c.repertoireEvents.approach}:{};}
export function setCareerBattingApproach<T extends RepertoireCareer>(c:T,revision:number,approach:Approach):T {
 assertRevision(c,revision);validate(c);if(!Object.hasOwn(APPROACH_LOGITS,approach)||c.world.players[scope(c).key]!.kind!=='HITTER')throw new RangeError('INVALID_BATTING_APPROACH');
 const l=structuredClone(c.repertoireEvents??empty(c));if(l.approach===approach)return c;
 const w=window(c);if(!w||l.usedApproachWindows.includes(windowKey(c,w)))throw new RangeError('APPROACH_WINDOW_CLOSED');
 l.approach=approach;l.usedApproachWindows=[...l.usedApproachWindows,windowKey(c,w)];return {...c,revision:revision+1,repertoireEvents:l};
}
export function resolveCareerRepertoireEvent<T extends RepertoireCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:'SET_PITCH_TRAINING'|'SET_BATTING_APPROACH'|'OPEN_REPERTOIRE'|'ACK_EVENT';pitchId?:PitchId;replacedPitchId?:PitchId;approach?:Approach}) {
 assertRevision(c,revision);validate(c);const event=c.repertoireEvents?.notices.find(e=>e.eventKey===input.eventKey);if(!event)throw new RangeError('REPERTOIRE_EVENT_NOT_FOUND');
 const r=scope(c),w=window(c),key=event.evidence.fields.trainingWindowIdOrPitchLevelReceiptId;
 const commands=event.definitionId==='E87'?['OPEN_REPERTOIRE']:event.definitionId==='E86'?['ACK_EVENT',...(event.seasonKey===c.world.seasonKey&&key===windowKey(c,'PRE')&&learningAvailable(c)?['SET_PITCH_TRAINING']:[])]:['ACK_EVENT',...(event.seasonKey===c.world.seasonKey&&w&&key===windowKey(c,w)?['SET_BATTING_APPROACH']:[])];
 const context={worldKey:c.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:commands},selected=resolveEventChoice(event,input.eventVersion,input.command,input,context);
 let next:T=c;
 if(input.command==='SET_PITCH_TRAINING'){
  if(event.resume.competitionKey!==r.league||event.resume.registrationKey!==r.team)throw new RangeError('REPERTOIRE_EVENT_SOURCE_CHANGED');
  if(!input.pitchId||input.approach!==undefined)throw new RangeError('PITCH_SELECTION_REQUIRED');
  next=(isUs(c)?beginUsPreseasonPitchLearning(c,revision,input.pitchId,input.replacedPitchId):isKbo(c)?beginKboPreseasonPitchLearning(c,revision,input.pitchId,input.replacedPitchId):beginSchoolPreseasonPitchLearning(c,revision,input.pitchId,input.replacedPitchId)) as T;
 }else if(input.command==='SET_BATTING_APPROACH'){
  if(event.resume.competitionKey!==r.league||event.resume.registrationKey!==r.team)throw new RangeError('REPERTOIRE_EVENT_SOURCE_CHANGED');
  if(input.approach===undefined||input.pitchId!==undefined||input.replacedPitchId!==undefined)throw new RangeError('APPROACH_SELECTION_REQUIRED');next=setCareerBattingApproach(c,revision,input.approach);
 }else if(input.approach!==undefined||input.pitchId!==undefined||input.replacedPitchId!==undefined)throw new RangeError('UNEXPECTED_REPERTOIRE_SELECTION');
 if(r.key!==event.evidence.fields.playerSimulationKey)throw new RangeError('REPERTOIRE_EVENT_SOURCE_CHANGED');
 const resolved=selected.domain?completeEventDomain(event,selected.domain,JSON.stringify(['repertoire-choice',event.eventKey,revision+1]),context):selected.event;
 return {career:{...next,revision:revision+1,repertoireEvents:{...next.repertoireEvents!,notices:next.repertoireEvents!.notices.map(e=>e.eventKey===event.eventKey?resolved:e)}} as T,navigation:selected.navigation};
}
export function careerRepertoireEventsView(c:RepertoireCareer){
 validate(c);const l=c.repertoireEvents??empty(c),r=scope(c),w=window(c);
 return {approach:l.approach,approachOptions:Object.entries(APPROACH_LOGITS).map(([id,effects])=>({id,effects:{...effects}})),approachChangeAvailable:!!w&&c.world.players[r.key]!.kind==='HITTER'&&!l.usedApproachWindows.includes(windowKey(c,w)),learningAvailable:learningAvailable(c),levels:l.levels.map(x=>({pitchId:x.pitchId,grade:x.grade,seasonKey:x.seasonKey})),notices:l.notices.filter(e=>e.status==='OPEN').map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:eventDefinition(e.definitionId).title,body:eventDefinition(e.definitionId).body,commands:[...e.offeredChoices]}))};
}

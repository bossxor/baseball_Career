import {HITTER_TYPES,PITCHER_TYPES} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice} from './events.js';
import type {EventInstance} from './events.js';

const recordLabels={G02:'라인업의한자리',G07:'마지막아웃'} as const;
type AliasGoalId=keyof typeof recordLabels;
export interface CareerRecordAlias {goalId:AliasGoalId;label:string;completionReceipt:string;seasonKey:string}
export interface CareerAliasSnapshot {kind:DevelopmentPlayer['kind'];archetype:string;typeLabel:string;recordAliases:readonly CareerRecordAlias[];display:string}
export interface CareerAliasReceipt {receiptKey:string;seasonKey:string;sourceRevision:number;before:CareerAliasSnapshot;after:CareerAliasSnapshot;changed:boolean;eventKey?:string}
export interface CareerAliasLedger {schemaVersion:1;worldKey:string;playerKey:string;history:readonly CareerAliasReceipt[];notices:readonly EventInstance[]}
type AliasCareer=(HighSchoolCareer|KboCareer|UsCareer)&{aliases?:CareerAliasLedger};
const keyOf=(c:AliasCareer)=>'protagonistKey'in c?c.protagonistKey:c.world.protagonistKey;
const receiptKey=(c:AliasCareer,year:string)=>JSON.stringify(['career-season-alias',c.world.worldKey,keyOf(c),year]);
function ledger(c:AliasCareer):CareerAliasLedger{return c.aliases??{schemaVersion:1,worldKey:c.world.worldKey,playerKey:keyOf(c),history:[],notices:[]};}
function typeLabel(kind:DevelopmentPlayer['kind'],archetype:string):string {
 const types=kind==='HITTER'?HITTER_TYPES:kind==='PITCHER'?PITCHER_TYPES:null;
 if(!types||!Object.hasOwn(types,archetype))throw new RangeError('INVALID_CAREER_ALIAS_TYPE');return types[archetype]!.label;
}
function snapshot(player:Pick<DevelopmentPlayer,'kind'|'archetype'>,recordAliases:readonly CareerRecordAlias[]):CareerAliasSnapshot {
 const label=typeLabel(player.kind,player.archetype);return {kind:player.kind,archetype:player.archetype,typeLabel:label,recordAliases:structuredClone(recordAliases),display:[label,...recordAliases.map(a=>a.label)].join(' · ')};
}
/** Only an earned canonical TITLE reward and its completion receipt prove a record alias. */
function recordAliases(c:AliasCareer,beforeSeason?:string):CareerRecordAlias[]{
 const goals=c.goals;if(!goals)return [];
 if(goals.worldKey!==c.world.worldKey||goals.playerKey!==keyOf(c))throw new RangeError('INVALID_CAREER_ALIAS_GOALS');
 const result:CareerRecordAlias[]=[];
 for(const goalId of Object.keys(recordLabels)as AliasGoalId[]){
  const reward=goals.rewards.find(r=>r.rewardId==='R-'+goalId&&r.type==='TITLE');if(!reward)continue;
  const sources=Object.entries(goals.seasons).filter(([year])=>Number(year)<=Number(c.world.seasonKey)&&(beforeSeason===undefined||Number(year)<Number(beforeSeason))).flatMap(([year,s])=>[...s.slots,...s.history].filter(g=>g.goalId===goalId&&['COMPLETED','CORRECTED'].includes(g.status)&&g.scope.seasonKey===year&&g.completionReceipt===JSON.stringify(['season-goal-completion',goals.worldKey,keyOf(c),year,g.slot,g.goalId,g.selectedRevision])&&reward.sources.includes(g.completionReceipt)).map(g=>({goalId,label:recordLabels[goalId],completionReceipt:g.completionReceipt!,seasonKey:year})));
  sources.sort((a,b)=>Number(a.seasonKey)-Number(b.seasonKey)||(a.completionReceipt<b.completionReceipt?-1:a.completionReceipt>b.completionReceipt?1:0));
  const source=sources.find(s=>s.completionReceipt===reward.firstReceipt)??sources[0];if(source)result.push(source);
 }
 return result;
}
const aliasEqual=(a:CareerAliasSnapshot,b:CareerAliasSnapshot)=>a.display===b.display;
function validateSnapshot(c:AliasCareer,s:CareerAliasSnapshot){
 if(!s||!Array.isArray(s.recordAliases)||new Set(s.recordAliases.map((a:CareerRecordAlias)=>a.goalId)).size!==s.recordAliases.length||canonicalJson(snapshot(s,s.recordAliases))!==canonicalJson(s))throw new RangeError('INVALID_CAREER_ALIAS_SNAPSHOT');
 const earned=recordAliases(c);
 for(const a of s.recordAliases as readonly CareerRecordAlias[])if(!Object.hasOwn(recordLabels,a.goalId)||a.label!==recordLabels[a.goalId]||!earned.some(e=>e.goalId===a.goalId&&e.completionReceipt===a.completionReceipt&&e.seasonKey===a.seasonKey))throw new RangeError('UNPROVEN_CAREER_RECORD_ALIAS');
}
/** Pure persistence guard; no career revision guard, derivation mutation or event publication. */
export function assertCareerAliases(c:AliasCareer):void {
 const l=c.aliases;if(!l)return;
 if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==keyOf(c)||!Array.isArray(l.history)||!Array.isArray(l.notices)||new Set(l.history.map(r=>r.seasonKey)).size!==l.history.length||new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length)throw new RangeError('INVALID_CAREER_ALIAS_LEDGER');
 let previous:CareerAliasReceipt|undefined;
 for(const r of l.history as readonly CareerAliasReceipt[]){
  if(!Number.isSafeInteger(Number(r.seasonKey))||String(Number(r.seasonKey))!==r.seasonKey||Number(r.seasonKey)>Number(c.world.seasonKey)||r.receiptKey!==receiptKey(c,r.seasonKey)||!Number.isSafeInteger(r.sourceRevision)||r.sourceRevision<0||r.sourceRevision>c.revision||typeof r.changed!=='boolean'||r.changed===aliasEqual(r.before,r.after)||previous&&(Number(previous.seasonKey)>=Number(r.seasonKey)||previous.sourceRevision>r.sourceRevision||canonicalJson(previous.after)!==canonicalJson(r.before)))throw new RangeError('INVALID_CAREER_ALIAS_HISTORY');
  validateSnapshot(c,r.before);validateSnapshot(c,r.after);
  const event=l.notices.find(e=>e.eventKey===r.eventKey);if(r.changed?(!event||event.seasonKey!==r.seasonKey):r.eventKey!==undefined)throw new RangeError('INVALID_CAREER_ALIAS_EVENT_RECEIPT');previous=r;
 }
 for(const e of l.notices as readonly EventInstance[]){validateEvent(e);const r=l.history.find(r=>r.eventKey===e.eventKey);if(e.definitionId!=='E42'||e.worldKey!==l.worldKey||e.evidence.fields.playerOrTeamSimulationKey!==l.playerKey||e.evidence.fields.worldSeasonId!==e.seasonKey||e.evidence.fields.windowType!=='ALIAS_CHANGED'||!r||e.resume.sourceRevision!==r.sourceRevision)throw new RangeError('INVALID_CAREER_ALIAS_EVENT');}
}
/** SERVER ONLY: call after the genuine full-year growth finalizer and goal refresh, before sealing the year. */
export function settleCareerSeasonAlias<T extends AliasCareer>(c:T,sourceStart?:AliasCareer):T {
 assertCareerAliases(c);const growth=c.seasonGrowth;
 if(!growth||!growth.finalized||growth.seasonKey!==c.world.seasonKey||growth.playerKey!==keyOf(c)||growth.aging?.elapsedDays!==growth.worldGrowthDays)throw new RangeError('CAREER_ALIAS_YEAR_NOT_FINAL');
 validateSeasonGrowthLedger(growth);
 if(sourceStart&&(sourceStart.world.worldKey!==c.world.worldKey||keyOf(sourceStart)!==keyOf(c)||sourceStart.world.seasonKey!==c.world.seasonKey))throw new RangeError('CAREER_ALIAS_SOURCE_CHANGED');
 const l=ledger(c),year=c.world.seasonKey;if(l.history.some(r=>r.seasonKey===year))return c;
 const player=c.world.players[keyOf(c)];if(!player)throw new RangeError('CAREER_ALIAS_PLAYER_MISSING');
 const before=l.history.at(-1)?.after??snapshot(growth.seasonStart,recordAliases(sourceStart??c,year)),after=snapshot(player,recordAliases(c)),changed=!aliasEqual(before,after);
 const receipt:CareerAliasReceipt={receiptKey:receiptKey(c,year),seasonKey:year,sourceRevision:c.revision,before:structuredClone(before),after,changed};let notices=l.notices;
 if(changed){
  const pro='protagonistKey'in c,league=pro?('mode'in c?c.registration.level:c.registration.firstTeam?'KBO':'FUTURES'):c.world.leagueKey??'HS',team=pro?('mode'in c?c.protagonistOrganizationId:c.protagonistClubId):c.world.protagonistSchoolId;
  const day=Math.max(0,...Object.values(c.records.games).filter(g=>g.scope.seasonKey===year).map(g=>g.worldDay)),d=eventDefinition('E42');
  const event=createWorldEvent({definitionId:'E42',worldKey:c.world.worldKey,seasonKey:year,evidence:{version:1,type:d.evidenceDomain,fields:{playerOrTeamSimulationKey:keyOf(c),worldSeasonId:year,windowType:'ALIAS_CHANGED'}},resume:{worldKey:c.world.worldKey,seasonKey:year,phase:c.phaseContext.phase,competitionKey:league,registrationKey:team,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day});receipt.eventKey=event.eventKey;notices=[...notices,event];
 }
 return {...c,aliases:{...l,history:[...l.history,receipt],notices}};
}
export function resolveCareerAliasEvent<T extends AliasCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:'ACK_EVENT'}){
 if('mode'in c)assertUsCareerRevision(c,revision);else if('protagonistClubId'in c)assertKboCareerRevision(c,revision);else assertCareerRevision(c,revision);assertCareerAliases(c);
 if(c.phaseContext.phase==='ARCHIVED'||c.phaseContext.phase==='EVENT_DECISION'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))throw new RangeError('INVALID_CAREER_ALIAS_PHASE');
 if(!('protagonistKey'in c)&&(c.collegeYearEnd||c.kboYearEnd||c.usYearEnd))throw new RangeError('CAREER_ALIAS_YEAR_END_SEALED');
 const l=ledger(c),event=l.notices.find(e=>e.eventKey===input.eventKey);if(!event)throw new RangeError('CAREER_ALIAS_EVENT_NOT_FOUND');
 const result=resolveEventChoice(event,input.eventVersion,input.command,input,{worldKey:c.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['ACK_EVENT']});
 return {career:{...c,revision:revision+1,aliases:{...l,notices:l.notices.map(e=>e.eventKey===event.eventKey?result.event:e)}}as T,navigation:result.navigation};
}
export function careerAliasView(c:AliasCareer){
 assertCareerAliases(c);const l=ledger(c),player=c.world.players[keyOf(c)];if(!player)throw new RangeError('CAREER_ALIAS_PLAYER_MISSING');
 return {current:snapshot(player,recordAliases(c)),history:structuredClone(l.history),notices:l.notices.filter(e=>e.status==='OPEN').map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:eventDefinition(e.definitionId).title,body:eventDefinition(e.definitionId).body,commands:['ACK_EVENT']as const}))};
}

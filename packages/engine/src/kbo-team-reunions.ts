import type {KboCareer} from './kbo-career-entry.js';
import type {PlayerRelationship} from './relationships.js';
import type {EventInstance} from './events.js';
import {currentKboSeasonTransfers} from './kbo-transfer-registration.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {createWorldEvent,enqueueWorldEvent,eventDefinition,resolveEventChoice} from './events.js';
import {canonicalJson} from './game.js';

const registrationKey=(transferKey:string,relationKey:string)=>JSON.stringify(['kbo-shared-registration',transferKey,relationKey]);
function assertRelation(c:KboCareer,r:PlayerRelationship){
 if(r.primaryPlayerKey!==c.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
}
function source(c:KboCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,relations=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=relations[0];
 if(event.definitionId!=='E96'||event.worldKey!==c.world.worldKey||relations.length!==1||!r)throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');assertRelation(c,r);
 const transfers=(c.transferHistory??[]).filter(t=>registrationKey(t.receiptKey,r.relationKey)===f.sharedTeamRegistrationReceiptId),t=transfers[0];
 const index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM'&&m.evidenceKey===event.evidenceKey&&m.worldDay===event.occurredWorldDay);
 if(transfers.length!==1||!t||t.playerKey!==r.primaryPlayerKey||t.fromClubId===t.toClubId||t.seasonKey!==event.seasonKey||t.afterWorldDay!==event.occurredWorldDay||!Array.isArray(t.sharedRelationKeys)||new Set(t.sharedRelationKeys).size!==t.sharedRelationKeys.length||!t.sharedRelationKeys.includes(r.relationKey)||index<0||!r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED')||event.resume.registrationKey!==t.toClubId||event.resume.competitionKey!=='KBO'||event.resume.phase!=='SEASON_PROGRESS'||canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:registrationKey(t.receiptKey,r.relationKey)}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
}

/** Successful player transfer only. The receipt seals which existing relationships actually shared registration. */
export function settleKboTransferTeamReunions(previous:KboCareer,c:KboCareer):void {
 const t=currentKboSeasonTransfers(c)?.at(-1),from=previous.world.clubs.find(x=>x.id===previous.protagonistClubId),to=c.world.clubs.find(x=>x.id===c.protagonistClubId);
 if(c.phaseContext.phase!=='SEASON_PROGRESS'||!t||!from||!to||previous.world.worldKey!==c.world.worldKey||previous.world.seasonKey!==c.world.seasonKey||previous.protagonistKey!==c.protagonistKey||t.playerKey!==c.protagonistKey||t.fromClubId!==from.id||t.toClubId!==to.id||!from.roster.includes(c.protagonistKey)||!to.roster.includes(c.protagonistKey)||(previous.transferHistory??[]).some(x=>x.receiptKey===t.receiptKey))throw new RangeError('INVALID_KBO_TEAM_REUNION_TRANSFER');
 if(t.sharedRelationKeys!==undefined){for(const e of c.relationNotices.filter(e=>e.definitionId==='E96'))source(c,e);return;}
 const keys:string[]=[],seen=new Set<string>();let notices=structuredClone([...c.relationNotices]);
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage)||!to.roster.includes(r.otherPlayerKey)||from.roster.includes(r.otherPlayerKey)||c.sangmu?.loaned?.includes(r.otherPlayerKey)||kboActiveContractSuspended(c.world.contracts[r.otherPlayerKey]!))return r;
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:t.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:registrationKey(t.receiptKey,r.relationKey)}},resume:{worldKey:c.world.worldKey,seasonKey:t.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:to.id,sourceRevision:c.revision},sourceSequence:c.events.length+notices.length+1,worldDay:t.afterWorldDay});
  keys.push(r.relationKey);notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:t.afterWorldDay}]};
 });
 c.transferHistory=c.transferHistory!.map(row=>row.receiptKey===t.receiptKey?{...row,sharedRelationKeys:keys}:row);c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
export function kboTeamReunionNoticeRows(c:KboCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E96').flatMap(e=>{const r=source(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E96');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E96' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
export function prepareKboTeamReunionRead(c:KboCareer,input:{eventKey:string;eventVersion:number;command:string}){
 const found=c.relationNotices.filter(e=>e.eventKey===input.eventKey);if(found.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const e=found[0]!,r=source(c,e),read=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});return {event:read.event,navigation:{...read.navigation!,relationKey:r.relationKey}};
}

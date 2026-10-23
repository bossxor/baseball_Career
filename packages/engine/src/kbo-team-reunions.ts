import type {KboCareer} from './kbo-career-entry.js';
import type {PlayerRelationship} from './relationships.js';
import type {GameContribution} from './records.js';
import type {EventInstance} from './events.js';
import {currentKboSeasonTransfers} from './kbo-transfer-registration.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {createWorldEvent,enqueueWorldEvent,eventDefinition,resolveEventChoice} from './events.js';
import {canonicalJson} from './game.js';

const registrationKey=(transferKey:string,relationKey:string)=>JSON.stringify(['kbo-shared-registration',transferKey,relationKey]);
function assertRelation(c:KboCareer,r:PlayerRelationship){
 if(r.primaryPlayerKey!==c.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
}
/** A real army team-game registration qualifies even for a benched or injured member. No present-day membership inference. */
function armyRegistration(c:KboCareer,r:PlayerRelationship,g:GameContribution){
 if(g.scope.leagueKey!=='FUTURES' || g.scope.phase!=='REGULAR' || !Object.hasOwn(g.teams,'SANGMU'))return null;
 const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence);
 if(rows.length<2)return null;
 if(Object.keys(g.teams).length!==2 || rows.length!==2 || new Set(rows.map(h=>h.teamKey)).size!==2 || rows.some(h=>h.seasonKey!==g.scope.seasonKey || h.day!==g.worldDay || !h.teamKey.startsWith('FUTURES:') || !Object.hasOwn(g.teams,h.teamKey.slice(8)) || g.teams[h.teamKey.slice(8)]!.games!==1 || new Set(h.roster).size!==h.roster.length))throw new RangeError('INVALID_KBO_ARMY_REGISTRATION');
 const army=rows.find(h=>h.teamKey==='FUTURES:SANGMU')!;
 if(!army || !army.roster.includes(r.primaryPlayerKey) || !army.roster.includes(r.otherPlayerKey))return null;
 if(rows.some(h=>h!==army && (h.roster.includes(r.primaryPlayerKey) || h.roster.includes(r.otherPlayerKey))))throw new RangeError('INVALID_KBO_ARMY_REGISTRATION');
 // The key seals the registered identities without exposing fatigue, appearances or current private ability.
 return JSON.stringify(['kbo-army-shared-registration',r.relationKey,g.gameKey,[...army.roster].sort()]);
}
function source(c:KboCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,relations=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=relations[0];
 if(event.definitionId!=='E96'||event.worldKey!==c.world.worldKey||relations.length!==1||!r)throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');assertRelation(c,r);
 if(event.resume.registrationKey==='SANGMU' && event.resume.competitionKey==='FUTURES'){
  const id=typeof f.sharedTeamRegistrationReceiptId==='string'?JSON.parse(f.sharedTeamRegistrationReceiptId):null;
  const g=Array.isArray(id) && id.length===4 && id[0]==='kbo-army-shared-registration' && id[1]===r.relationKey && typeof id[2]==='string'?c.records.games[id[2]]:undefined;
  const index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM' && m.evidenceKey===event.evidenceKey && m.worldDay===event.occurredWorldDay);
  if(!g || g.scope.seasonKey!==event.seasonKey || g.worldDay!==event.occurredWorldDay || index<0 || !r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED') || event.resume.phase!=='SEASON_PROGRESS' || f.sharedTeamRegistrationReceiptId!==armyRegistration(c,r,g) || canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:f.sharedTeamRegistrationReceiptId}))throw new RangeError('INVALID_KBO_TEAM_REUNION_NOTICE');return r;
 }
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
/** Internal finalized-day hook. Old saves are not rewritten by a read; caller owns the cloned transaction. */
export function settleKboArmyTeamReunions(c:KboCareer,day:number):void {
 if(c.days?.days.at(-1)?.day!==day)throw new RangeError('KBO_ARMY_REUNION_DAY_NOT_FINAL');
 for(const e of c.relationNotices.filter(e=>e.definitionId==='E96' && e.resume.registrationKey==='SANGMU'))source(c,e);
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay===day && g.scope.leagueKey==='FUTURES' && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,'SANGMU'));
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(!['SEPARATED','REUNITED_OPPONENT'].includes(r.stage))return r;
  const matches=games.map(g=>({g,key:armyRegistration(c,r,g)})).filter(x=>x.key!==null);
  if(matches.length>1)throw new RangeError('INVALID_KBO_ARMY_REGISTRATION');if(!matches.length)return r;
  if(!r.milestones.some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_KBO_TEAM_REUNION_SEPARATION');
  const {g,key}=matches[0]!;
  const event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:key!}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'FUTURES',registrationKey:'SANGMU',sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey))throw new RangeError('KBO_ARMY_REUNION_STAGE_CHANGED');
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}
export function kboTeamReunionNoticeRows(c:KboCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E96').flatMap(e=>{const r=source(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E96');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E96' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
export function prepareKboTeamReunionRead(c:KboCareer,input:{eventKey:string;eventVersion:number;command:string}){
 const found=c.relationNotices.filter(e=>e.eventKey===input.eventKey);if(found.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const e=found[0]!,r=source(c,e),read=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});return {event:read.event,navigation:{...read.navigation!,relationKey:r.relationKey}};
}

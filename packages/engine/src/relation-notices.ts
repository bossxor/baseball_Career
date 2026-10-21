import {assertTeamEntryRelationReceipt,teamEntryFormationKey} from './team-teammates.js';
import type {PlayerRelationship,RelationMilestone} from './relationships.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {createWorldEvent,enqueueWorldEvent,eventDefinition,resolveEventChoice} from './events.js';
import type {EventInstance} from './events.js';
import {canonicalJson} from './game.js';
import {schoolYearEndBasis} from './college-entry.js';
import {careerRelationshipListView} from './relationship-history.js';

function formationContext(source:HighSchoolCareer,relation:PlayerRelationship,formation:RelationMilestone){
 if(formation.evidenceKey===JSON.stringify(['hs-formation',source.world.worldKey,relation.type]))return {competitionKey:'HS',seasonKey:source.previousSeasons?.find(a=>(a.world.leagueKey??'HS')==='HS')?.world.seasonKey??source.world.seasonKey,registrationKey:source.previousSeasons?.find(a=>(a.world.leagueKey??'HS')==='HS')?.world.protagonistSchoolId??source.world.protagonistSchoolId};
 const matches=(source.relationships?.teamEntries??[]).filter(r=>r.relationKey===relation.relationKey && teamEntryFormationKey(r)===formation.evidenceKey);
 if(matches.length!==1)return null;const entry=matches[0]!;assertTeamEntryRelationReceipt(entry);
 if(entry.worldKey!==source.world.worldKey || entry.primaryPlayerKey!==relation.primaryPlayerKey || entry.otherPlayerKey!==relation.otherPlayerKey || relation.type!=='TEAMMATE' || entry.worldDay!==formation.worldDay)throw new RangeError('INVALID_RELATION_FORMATION_NOTICE');
 return {competitionKey:entry.leagueKey,seasonKey:entry.seasonKey,registrationKey:entry.teamId};
}

/** E94 is a NOTICE. It lives outside blocking tasks and never stops an E01/E02/E84 or pending game. */
export function queueRelationFormationNotices(source:HighSchoolCareer,worldDay:number):readonly EventInstance[]|undefined {
 if(!Number.isSafeInteger(worldDay) || worldDay<0)throw new RangeError('INVALID_RELATION_NOTICE_DAY');
 let notices=source.relationNotices?structuredClone([...source.relationNotices]):undefined;
 if(!source.relationships)return notices;
 for(const relation of source.relationships.relations){
  const formation=relation.milestones.find(m=>m.stage==='FORMED' && (m.kind===undefined || m.kind==='FORMATION'));
  if(!formation || formation.worldDay>worldDay)continue;
  const context=formationContext(source,relation,formation);if(!context || context.seasonKey!==source.world.seasonKey || context.competitionKey!==(source.world.leagueKey??'HS'))continue;
  if(relation.primaryPlayerKey!==source.world.protagonistKey || !Object.hasOwn(source.world.players,relation.otherPlayerKey) || relation.otherPlayerKey===relation.primaryPlayerKey || !['RIVAL','TEAMMATE'].includes(relation.type) || relation.normalPairKey!==JSON.stringify([relation.primaryPlayerKey,relation.otherPlayerKey].sort()) || relation.relationKey!==JSON.stringify([relation.type,relation.normalPairKey]))throw new RangeError('INVALID_RELATION_FORMATION_NOTICE');
  const event=createWorldEvent({definitionId:'E94',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,
   evidence:{version:1,type:'RELATIONS',fields:{relationId:relation.relationKey,creationReceiptId:formation.evidenceKey}},
   resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:context.competitionKey==='HS'?'SEASON_PROGRESS':source.phaseContext.phase,competitionKey:context.competitionKey,registrationKey:context.registrationKey,sourceRevision:source.revision},
   sourceSequence:source.events.length+(notices?.length??0)+1,worldDay:formation.worldDay});
  notices=enqueueWorldEvent(notices??[],event).events;
 }
 return notices;
}

function noticeSource(source:HighSchoolCareer,event:EventInstance){
 // Reuse the event contract validation without changing its state or revision.
 enqueueWorldEvent([],event);
 const relation=source.relationships?.relations.find(r=>r.relationKey===event.evidence.fields.relationId);
 const formation=relation?.milestones.find(m=>m.evidenceKey===event.evidence.fields.creationReceiptId && m.stage==='FORMED' && (m.kind===undefined || m.kind==='FORMATION'));
 const context=relation && formation?formationContext(source,relation,formation):null;
 if(event.definitionId!=='E94' || event.worldKey!==source.world.worldKey || !relation || relation.primaryPlayerKey!==source.world.protagonistKey || relation.otherPlayerKey===relation.primaryPlayerKey || !['RIVAL','TEAMMATE'].includes(relation.type) || relation.normalPairKey!==JSON.stringify([relation.primaryPlayerKey,relation.otherPlayerKey].sort()) || relation.relationKey!==JSON.stringify([relation.type,relation.normalPairKey]) || !formation || !context || context.seasonKey!==event.seasonKey || context.registrationKey!==event.resume.registrationKey || formation.worldDay!==event.occurredWorldDay || event.resume.competitionKey!==context.competitionKey || canonicalJson(event.evidence.fields)!==canonicalJson({relationId:relation.relationKey,creationReceiptId:formation.evidenceKey}))throw new RangeError('INVALID_RELATION_NOTICE_SOURCE');
 return relation;
}

/** Public unread projection. No receipt snapshots, abilities, P, seed, RNG or phase-resume state. */
export function unreadRelationNotices(source:HighSchoolCareer){
 const seen=new Set<string>();
 return (source.relationNotices??[]).flatMap(event=>{
  if(seen.has(event.eventKey))throw new RangeError('DUPLICATE_RELATION_NOTICE');seen.add(event.eventKey);
  const relation=noticeSource(source,event);if(event.status!=='OPEN')return [];
  const definition=eventDefinition(event.definitionId),other=careerRelationshipListView(source).find(r=>r.relationKey===relation.relationKey)!;
  return [{eventKey:event.eventKey,eventVersion:event.version,definitionId:'E94' as const,title:definition.title,body:definition.body,relationKey:relation.relationKey,type:relation.type,otherPlayerKey:relation.otherPlayerKey,otherName:other.other?.name??null,otherInCurrentWorld:other.otherAvailability==='CURRENT_WORLD',seasonKey:event.seasonKey,occurredWorldDay:event.occurredWorldDay,targetScreen:'S42' as const}];
 });
}

/** OPEN_RELATIONS acknowledges just this notice. It never restores an obsolete event phase or applies game effects. */
export function resolveCareerRelationNotice(source:HighSchoolCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertCareerRevision(source,expectedRevision);
 if(source.collegeYearEnd && (source.collegeYearEnd.sourceRevision!==source.revision || source.collegeYearEnd.sourceBasis!==schoolYearEndBasis(source)))throw new RangeError('STALE_RELATION_NOTICE_YEAR_END');
 const matches=(source.relationNotices??[]).filter(e=>e.eventKey===input.eventKey);if(matches.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');
 const event=matches[0]!,relation=noticeSource(source,event);
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,{worldKey:source.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});
 const career=structuredClone(source);career.relationNotices=career.relationNotices!.map(e=>e.eventKey===event.eventKey?selected.event:e);career.revision++;
 // The full-career seal includes notice metadata. Verify it first, then carry that seal across this read-state-only commit.
 if(career.collegeYearEnd)career.collegeYearEnd={...career.collegeYearEnd,sourceRevision:career.revision,sourceBasis:schoolYearEndBasis(career)};
 return {career,navigation:{...selected.navigation!,relationKey:relation.relationKey}};
}

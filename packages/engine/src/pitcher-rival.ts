import type {CareerPhase} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import type {RecordLedger} from './records.js';
import {assertContributionSplits,directDuelOutcome} from './records.js';
import type {RelationshipLedger,PitcherRivalFormationReceipt,PlayerRelationship} from './relationships.js';
import type {EventInstance} from './events.js';
import {createWorldEvent,enqueueWorldEvent,eventDefinition,resolveEventChoice} from './events.js';
import {canonicalJson} from './game.js';

export interface PitcherRivalSource {
 world:{worldKey:string;seasonKey:string;players:Readonly<Record<string,DevelopmentPlayer>>;protagonistKey?:string;protagonistSchoolId?:string};
 protagonistKey?:string;protagonistClubId?:string;registration?:{clubId:string};revision:number;phaseContext:{phase:CareerPhase};
 records:RecordLedger;relationships?:RelationshipLedger;events:readonly EventInstance[];relationNotices?:readonly EventInstance[];
}
function actor(source:PitcherRivalSource):string {
 const key=source.protagonistKey??source.world.protagonistKey;
 if(!key || source.protagonistKey && source.world.protagonistKey && source.protagonistKey!==source.world.protagonistKey || !source.world.worldKey || !source.world.seasonKey || !Number.isSafeInteger(source.revision) || source.revision<0 || source.world.players[key]?.simulationKey!==key)throw new RangeError('INVALID_PITCHER_RIVAL_SOURCE');
 return key;
}
const slotKey=(worldKey:string,seasonKey:string,primaryPlayerKey:string)=>JSON.stringify(['pitcher-rival-formation',worldKey,seasonKey,primaryPlayerKey]);
export const pitcherRivalFormationKey=(r:PitcherRivalFormationReceipt)=>JSON.stringify([r.formationKey,r.gameKey,r.otherPlayerKey]);

/** Formation is immutable history. Official corrections do not erase an existing relationship. */
export function validatePitcherRivalFormations(source:PitcherRivalSource):void {
 const me=actor(source),seen=new Set<string>();
 if(source.relationships && source.relationships.schemaVersion!==1)throw new RangeError('INVALID_PITCHER_RIVAL_FORMATION');
 for(const r of source.relationships?.pitcherRivalFormations??[]) {
  const game=source.records.games[r.gameKey],normalPairKey=JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort()),relation=source.relationships?.relations.find(v=>v.relationKey===r.relationKey);
  if(r.worldKey!==source.world.worldKey || r.primaryPlayerKey!==me || !r.seasonKey || r.formationKey!==slotKey(r.worldKey,r.seasonKey,me) || seen.has(r.formationKey) || r.otherPlayerKey===me || !relation || relation.type!=='RIVAL' || relation.primaryPlayerKey!==me || relation.otherPlayerKey!==r.otherPlayerKey || relation.normalPairKey!==normalPairKey || r.relationKey!==JSON.stringify(['RIVAL',normalPairKey]) ||
   !game || game.gameKey!==r.gameKey || game.scope.phase!=='REGULAR' || game.scope.seasonKey!==r.seasonKey || game.scope.leagueKey!==r.leagueKey || game.worldDay!==r.worldDay ||
   !Number.isSafeInteger(r.worldDay) || r.worldDay<0 || !Number.isSafeInteger(source.records.revision) || !Number.isSafeInteger(r.recordRevision) || r.recordRevision<1 || r.recordRevision>source.records.revision ||
   [r.PA,r.H,r.TB].some(n=>!Number.isSafeInteger(n) || n<0) || r.PA<3 || r.H>r.PA || r.TB<r.H || r.TB>4*r.H || !['WIN','LOSS'].includes(r.outcome) || directDuelOutcome(r)!==r.outcome ||
   !relation.milestones.some(m=>m.stage==='FORMED' && m.kind==='FORMATION' && m.evidenceKey===pitcherRivalFormationKey(r) && m.worldDay===r.worldDay) ||
   source.world.players[me]?.kind==='PITCHER' || source.world.players[r.otherPlayerKey]?.kind==='HITTER' || r.registrationKey!==null && !r.registrationKey)throw new RangeError('INVALID_PITCHER_RIVAL_FORMATION');
  seen.add(r.formationKey);
 }
}

/** After the existing-pair duel writer; at most one new pitcher rival per actor/world season across competitions. */
export function formPitcherRivalFromGame(source:PitcherRivalSource,gameKey:string):{relationships:RelationshipLedger;relationNotices:readonly EventInstance[]}|null {
 const me=actor(source);validatePitcherRivalFormations(source);
 const game=source.records.games[gameKey];if(!game || game.gameKey!==gameKey)throw new RangeError('UNKNOWN_PITCHER_RIVAL_GAME');
 if(game.scope.seasonKey!==source.world.seasonKey)throw new RangeError('INVALID_PITCHER_RIVAL_SOURCE');
 if(game.scope.phase!=='REGULAR' || source.world.players[me]!.kind!=='HITTER')return null;
 const formationKey=slotKey(source.world.worldKey,source.world.seasonKey,me);
 if(source.relationships?.pitcherRivalFormations?.some(r=>r.formationKey===formationKey))return null;
 if(!Number.isSafeInteger(source.records.revision) || source.records.revision<1)throw new RangeError('INVALID_PITCHER_RIVAL_SOURCE');
 assertContributionSplits(game);
 const candidates=Object.values(game.matchups).filter(m=>m.batterKey===me && source.world.players[m.pitcherKey]?.kind==='PITCHER' && source.world.players[m.pitcherKey]!.simulationKey===m.pitcherKey && m.pitcherKey!==me && directDuelOutcome(m.stats)!=='NO_DECISION' && !source.relationships?.relations.some(r=>r.primaryPlayerKey===me && r.otherPlayerKey===m.pitcherKey || r.primaryPlayerKey===m.pitcherKey && r.otherPlayerKey===me))
  .sort((a,b)=>b.stats.PA-a.stats.PA || (a.pitcherKey<b.pitcherKey?-1:a.pitcherKey>b.pitcherKey?1:0));
 const chosen=candidates[0];if(!chosen)return null;
 const normalPairKey=JSON.stringify([me,chosen.pitcherKey].sort()),relationKey=JSON.stringify(['RIVAL',normalPairKey]),registrationKey=source.registration?.clubId??source.protagonistClubId??source.world.protagonistSchoolId??null;
 const receipt:PitcherRivalFormationReceipt={formationKey,worldKey:source.world.worldKey,seasonKey:game.scope.seasonKey,primaryPlayerKey:me,otherPlayerKey:chosen.pitcherKey,relationKey,gameKey,worldDay:game.worldDay,leagueKey:game.scope.leagueKey,recordRevision:source.records.revision,PA:chosen.stats.PA,H:chosen.stats.H,TB:chosen.stats.TB,outcome:directDuelOutcome(chosen.stats) as 'WIN'|'LOSS',registrationKey};
 const creationReceiptId=pitcherRivalFormationKey(receipt),relation:PlayerRelationship={relationKey,normalPairKey,type:'RIVAL',primaryPlayerKey:me,otherPlayerKey:chosen.pitcherKey,stage:'FORMED',milestones:[{stage:'FORMED',kind:'FORMATION',evidenceKey:creationReceiptId,worldDay:game.worldDay}]};
 const prior:RelationshipLedger=source.relationships??{schemaVersion:1,relations:[],formation:{rival:'NO_CANDIDATE',teammate:'NO_CANDIDATE'}},relationships:RelationshipLedger={...prior,relations:[...prior.relations,relation],formation:{...prior.formation,rival:'FORMED'},pitcherRivalFormations:[...(prior.pitcherRivalFormations??[]),receipt]};
 validatePitcherRivalFormations({...source,relationships});
 const event=createWorldEvent({definitionId:'E94',worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:relationKey,creationReceiptId}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:source.phaseContext.phase,competitionKey:game.scope.leagueKey,registrationKey,sourceRevision:source.revision},sourceSequence:source.events.length+(source.relationNotices?.length??0)+1,worldDay:game.worldDay});
 return {relationships,relationNotices:enqueueWorldEvent(source.relationNotices??[],event).events};
}

function noticeReceipt(source:PitcherRivalSource,event:EventInstance):PitcherRivalFormationReceipt {
 enqueueWorldEvent([],event);
 const receipts=(source.relationships?.pitcherRivalFormations??[]).filter(r=>r.relationKey===event.evidence.fields.relationId && pitcherRivalFormationKey(r)===event.evidence.fields.creationReceiptId),r=receipts[0];
 if(receipts.length!==1 || !r || event.definitionId!=='E94' || event.worldKey!==r.worldKey || event.seasonKey!==r.seasonKey || event.occurredWorldDay!==r.worldDay || event.resume.competitionKey!==r.leagueKey || event.resume.registrationKey!==r.registrationKey || event.resume.sourceRevision>source.revision+1 || canonicalJson(event.evidence.fields)!==canonicalJson({relationId:r.relationKey,creationReceiptId:pitcherRivalFormationKey(r)}))throw new RangeError('INVALID_PITCHER_RIVAL_NOTICE');
 return r;
}
/** Explicit E94 reader shared by school and pro roots. No record or hidden trait detail is projected. */
export function unreadPitcherRivalNotices(source:PitcherRivalSource) {
 validatePitcherRivalFormations(source);const seen=new Set<string>();
 return (source.relationNotices??[]).flatMap(event=>{
  if(event.definitionId!=='E94' || !(source.relationships?.pitcherRivalFormations??[]).some(r=>r.relationKey===event.evidence.fields.relationId))return [];
  if(seen.has(event.eventKey))throw new RangeError('DUPLICATE_RELATION_NOTICE');seen.add(event.eventKey);
  const r=noticeReceipt(source,event);if(event.status!=='OPEN')return [];
  const definition=eventDefinition('E94'),other=source.world.players[r.otherPlayerKey];
  return [{eventKey:event.eventKey,eventVersion:event.version,definitionId:'E94' as const,title:definition.title,body:definition.body,relationKey:r.relationKey,type:'RIVAL' as const,otherPlayerKey:r.otherPlayerKey,otherName:other?.name??null,otherInCurrentWorld:!!other,seasonKey:r.seasonKey,occurredWorldDay:r.worldDay,targetScreen:'S42' as const}];
 });
}
export function preparePitcherRivalNoticeRead(source:PitcherRivalSource,input:{eventKey:string;eventVersion:number;command:string}) {
 validatePitcherRivalFormations(source);
 const matches=(source.relationNotices??[]).filter(e=>e.eventKey===input.eventKey);if(matches.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');
 const event=matches[0]!,r=noticeReceipt(source,event),selected=resolveEventChoice(event,input.eventVersion,input.command,null,{worldKey:source.world.worldKey,seasonKey:r.seasonKey,worldDay:r.worldDay,eligibleCommands:['OPEN_RELATIONS']});
 return {notices:source.relationNotices!.map(e=>e.eventKey===event.eventKey?selected.event:e),navigation:{...selected.navigation!,relationKey:r.relationKey}};
}
/** School roots with year-end seals must use a validating, resealing wrapper around preparePitcherRivalNoticeRead. */
export function resolvePitcherRivalNotice<T extends PitcherRivalSource>(source:T,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 if(source.revision!==expectedRevision)throw new RangeError('CAREER_REVISION_CHANGED');
 if(('kboYearEnd' in source&&source.kboYearEnd!==undefined)||('collegeYearEnd' in source&&source.collegeYearEnd!==undefined)||('usYearEnd' in source&&source.usYearEnd!==undefined))throw new RangeError('PITCHER_RIVAL_ROOT_WRAPPER_REQUIRED');
 const read=preparePitcherRivalNoticeRead(source,input);
 return {career:{...source,relationNotices:read.notices,revision:source.revision+1},navigation:read.navigation};
}

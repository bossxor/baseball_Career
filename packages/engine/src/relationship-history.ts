import type {HighSchoolWorld} from './high-school-world.js';
import type {RecordLedger} from './records.js';
import {relationDetailView} from './relationships.js';
import type {RelationshipLedger,PlayerRelationship,RelationScope} from './relationships.js';

export interface RelationshipHistorySource {
 world:HighSchoolWorld;records:RecordLedger;relationships?:RelationshipLedger;
 previousSeasons?:readonly {world:HighSchoolWorld}[];
}
const STAGES=['FORMED','SEPARATED','REUNITED_OPPONENT','REUNITED_TEAM','RETIRED'];
function validateRelation(source:RelationshipHistorySource,r:PlayerRelationship):void {
 if(r.primaryPlayerKey!==source.world.protagonistKey || r.primaryPlayerKey===r.otherPlayerKey || !['RIVAL','TEAMMATE'].includes(r.type) || !STAGES.includes(r.stage) || r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort()) || r.relationKey!==JSON.stringify([r.type,r.normalPairKey]) || r.milestones.length===0)throw new RangeError('INVALID_CAREER_RELATION');
}
function findPlayer(source:RelationshipHistorySource,key:string){
 if(Object.hasOwn(source.world.players,key))return {player:source.world.players[key]!,world:source.world,availability:'CURRENT_WORLD' as const};
 for(const archive of [...(source.previousSeasons??[])].reverse()){
  if(archive.world.worldKey!==source.world.worldKey || archive.world.seed!==source.world.seed)throw new RangeError('RELATION_HISTORY_WORLD_MISMATCH');
  if(Object.hasOwn(archive.world.players,key))return {player:archive.world.players[key]!,world:archive.world,availability:'HISTORICAL_ONLY' as const};
 }
 return null;
}
function playerView(found:ReturnType<typeof findPlayer>){
 if(!found)return {other:null,otherAvailability:'UNKNOWN_REFERENCE' as const,lastKnownRegistration:null};
 const {player:p,world}=found,team=world.schools.find(s=>s.roster.includes(p.simulationKey));
 return {other:{name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm??null,schoolName:team?.name??null},otherAvailability:found.availability,lastKnownRegistration:team?{seasonKey:world.seasonKey,leagueKey:world.leagueKey??'HS',teamId:team.id,teamName:team.name}:null};
}
/** Career S42 list: archived players stay visible; their last known team is never presented as a current transfer. */
export function careerRelationshipListView(source:RelationshipHistorySource){
 const seen=new Set<string>();
 return (source.relationships?.relations??[]).map(r=>{
  validateRelation(source,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  return {relationKey:r.relationKey,type:r.type,stage:r.stage,otherPlayerKey:r.otherPlayerKey,...playerView(findPlayer(source,r.otherPlayerKey))};
 });
}
/** Reuse the official cumulative record projection with an archived identity, not invented games or appearances. */
export function careerRelationDetailView(source:RelationshipHistorySource,relationKey:string,scope:RelationScope){
 const matches=(source.relationships?.relations??[]).filter(r=>r.relationKey===relationKey);if(matches.length!==1)throw new RangeError(matches.length?'DUPLICATE_CAREER_RELATION':'UNKNOWN_RELATION');
 const r=matches[0]!;validateRelation(source,r);if(!Object.hasOwn(source.world.players,r.primaryPlayerKey))throw new RangeError('MISSING_PROTAGONIST');
 const found=findPlayer(source,r.otherPlayerKey),identity=playerView(found);
 if(!found)return {relationKey,mode:'UNAVAILABLE' as const,reason:'PLAYER_REFERENCE_UNAVAILABLE' as const,...identity};
 // Only the read adapter sees this identity map. No archived player is registered or copied into the active world.
 const world=found.availability==='CURRENT_WORLD'?source.world:{...source.world,players:{...source.world.players,[r.otherPlayerKey]:found.player}};
 return {...relationDetailView({...source,world},relationKey,scope),...identity};
}

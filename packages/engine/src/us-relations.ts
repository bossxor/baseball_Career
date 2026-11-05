import {usOpponentReunionNoticeRows,prepareUsOpponentReunionRead} from './us-reunion-events.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {careerRelationshipListView,careerRelationDetailView} from './relationship-history.js';
import type {RelationshipHistorySource,RelationHistoryWorld} from './relationship-history.js';
import type {RelationScope} from './relationships.js';
import {unreadRelationNotices,prepareRelationNoticeRead} from './relation-notices.js';
import type {RelationNoticeReadSource,RelationNoticeReadInput} from './relation-notices.js';
import {US_LEVELS} from './us-season.js';

/** Projection only: historical identities never become active roster members. Missing legacy identities stay unknown. */
function relationSource(c:UsCareer):RelationNoticeReadSource {
 assertUsCareerRevision(c,c.revision);const seen=new Set<string>();for(const e of c.relationNotices){if(seen.has(e.eventKey))throw new RangeError('DUPLICATE_RELATION_NOTICE');seen.add(e.eventKey);}
 const world:RelationHistoryWorld={worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,leagueKey:c.registration.level,protagonistKey:c.protagonistKey,protagonistSchoolId:c.protagonistOrganizationId,players:c.world.players,schools:c.world.organizations.flatMap(o=>US_LEVELS.map(level=>({id:o.id,name:o.name,leagueKey:level,roster:o.levels[level]})))};
 const detachedPlayers:Record<string,NonNullable<RelationshipHistorySource['detachedPlayers']>[string]>={},supply=[...(c.minorYears??[]).map(y=>y.supply),...(c.majorYears??[]).map(y=>y.supply),...(c.military.service?.supply??[])].sort((a,b)=>Number(a.targetSeasonKey)-Number(b.targetSeasonKey));
 for(const receipt of supply)for(const r of receipt.retired){const org=c.world.organizations.find(o=>o.id===r.organizationId);detachedPlayers[r.playerKey]={player:r.player,lastKnownRegistration:org&&r.level!=='RESERVE'?{seasonKey:r.lastSeasonKey,leagueKey:r.level,teamId:org.id,teamName:org.name}:null};}
 return {world,detachedPlayers,records:c.records,relationships:c.relationships,previousSeasons:[...(c.amateurHistory.previousSeasons??[]),{world:c.amateurHistory.world}],events:c.events,revision:c.revision,phaseContext:c.phaseContext,relationNotices:c.relationNotices.filter(e=>e.definitionId==='E94')};
}
type Identity=ReturnType<typeof careerRelationshipListView>[number]['other'];
const identity=(p:Identity)=>p?{name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm,teamName:p.schoolName}:null;
export function usRelationshipListView(c:UsCareer){return careerRelationshipListView(relationSource(c)).map(r=>({...r,other:identity(r.other)}));}
export function usRelationDetailView(c:UsCareer,key:string,scope:RelationScope){const r=careerRelationDetailView(relationSource(c),key,scope);return {...r,other:identity(r.other)};}
/** US game receipts own E95; carried KBO reunions retain their original owner. */
export function unreadUsRelationNotices(c:UsCareer){
 const source=relationSource(c),formation=unreadRelationNotices(source),identities=careerRelationshipListView(source),reunions=usOpponentReunionNoticeRows(c).map(row=>{const other=identities.find(r=>r.relationKey===row.relationKey)!;return {...row,otherName:other.other?.name??null,otherInCurrentWorld:other.otherAvailability==='CURRENT_WORLD'};});
 const rows=[...formation,...reunions];return c.relationNotices.flatMap(e=>rows.filter(r=>r.eventKey===e.eventKey));
}
export function resolveUsRelationNotice(c:UsCareer,revision:number,input:RelationNoticeReadInput){
 assertUsCareerRevision(c,revision);const source=relationSource(c);if(c.relationNotices.filter(e=>e.eventKey===input.eventKey).length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const event=c.relationNotices.find(e=>e.eventKey===input.eventKey),selected=event?.definitionId==='E95'?prepareUsOpponentReunionRead(c,input):(()=>{const read=prepareRelationNoticeRead(source,input);return {event:read.notices.find(e=>e.eventKey===input.eventKey)!,navigation:read.navigation};})(),read=selected.event;
 return {career:{...c,revision:revision+1,relationNotices:c.relationNotices.map(e=>e.eventKey===read.eventKey?read:e)},navigation:selected.navigation};
}

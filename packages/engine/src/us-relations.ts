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
 assertUsCareerRevision(c,c.revision);
 const world:RelationHistoryWorld={worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,leagueKey:c.registration.level,protagonistKey:c.protagonistKey,protagonistSchoolId:c.protagonistOrganizationId,players:c.world.players,schools:c.world.organizations.flatMap(o=>US_LEVELS.map(level=>({id:o.id,name:o.name,leagueKey:level,roster:o.levels[level]})))};
 const detachedPlayers:Record<string,NonNullable<RelationshipHistorySource['detachedPlayers']>[string]>={},supply=[...(c.minorYears??[]).map(y=>y.supply),...(c.majorYears??[]).map(y=>y.supply),...(c.military.service?.supply??[])].sort((a,b)=>Number(a.targetSeasonKey)-Number(b.targetSeasonKey));
 for(const receipt of supply)for(const r of receipt.retired){const org=c.world.organizations.find(o=>o.id===r.organizationId);detachedPlayers[r.playerKey]={player:r.player,lastKnownRegistration:org&&r.level!=='RESERVE'?{seasonKey:r.lastSeasonKey,leagueKey:r.level,teamId:org.id,teamName:org.name}:null};}
 return {world,detachedPlayers,records:c.records,relationships:c.relationships,previousSeasons:[...(c.amateurHistory.previousSeasons??[]),{world:c.amateurHistory.world}],events:c.events,revision:c.revision,phaseContext:c.phaseContext,relationNotices:c.relationNotices.filter(e=>e.definitionId==='E94')};
}
type Identity=ReturnType<typeof careerRelationshipListView>[number]['other'];
const identity=(p:Identity)=>p?{name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm,teamName:p.schoolName}:null;
export function usRelationshipListView(c:UsCareer){return careerRelationshipListView(relationSource(c)).map(r=>({...r,other:identity(r.other)}));}
export function usRelationDetailView(c:UsCareer,key:string,scope:RelationScope){const r=careerRelationDetailView(relationSource(c),key,scope);return {...r,other:identity(r.other)};}
/** Only actual formation receipts are supported here; carried KBO reunion events need their own evidence owner. */
export function unreadUsRelationNotices(c:UsCareer){return unreadRelationNotices(relationSource(c));}
export function resolveUsRelationNotice(c:UsCareer,revision:number,input:RelationNoticeReadInput){
 assertUsCareerRevision(c,revision);const source=relationSource(c),selected=prepareRelationNoticeRead(source,input),read=selected.notices.find(e=>e.eventKey===input.eventKey)!;
 return {career:{...c,revision:revision+1,relationNotices:c.relationNotices.map(e=>e.eventKey===read.eventKey?read:e)},navigation:selected.navigation};
}

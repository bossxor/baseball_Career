import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {kboPreseasonPlanView} from './kbo-preseason.js';
import {careerRelationshipListView,careerRelationDetailView} from './relationship-history.js';
import type {RelationHistoryWorld} from './relationship-history.js';
import type {RelationScope} from './relationships.js';
import {unreadRelationNotices,prepareRelationNoticeRead} from './relation-notices.js';
import type {RelationNoticeReadInput,RelationNoticeReadSource} from './relation-notices.js';

/** Read adapter only. It never registers an archived student in the live pro roster. */
function relationSource(s:KboCareer):RelationNoticeReadSource {
 assertCareerRevision(s,s.revision);kboPreseasonPlanView(s);
 const world:RelationHistoryWorld={worldKey:s.world.worldKey,seed:s.world.seed,seasonKey:s.world.seasonKey,leagueKey:'KBO',protagonistKey:s.protagonistKey,protagonistSchoolId:s.protagonistClubId,schools:s.world.clubs,players:s.world.players};
 return {world,records:s.records,relationships:s.relationships,previousSeasons:[...(s.amateurHistory.previousSeasons??[]),{world:s.amateurHistory.world}],events:s.events,revision:s.revision,phaseContext:s.phaseContext,relationNotices:s.relationNotices};
}
/** New pro DTO uses teamName for both a school and a club; old school DTOs remain compatible. */
type Identity=NonNullable<ReturnType<typeof careerRelationshipListView>[number]['other']>;
function proIdentity(other:Identity|null){
 return other?{name:other.name,kind:other.kind,position:other.position,throws:other.throws,bats:other.bats,pitchForm:other.pitchForm,teamName:other.schoolName}:null;
}
export function kboRelationshipListView(s:KboCareer){return careerRelationshipListView(relationSource(s)).map(row=>({...row,other:proIdentity(row.other)}));}
export function kboRelationDetailView(s:KboCareer,relationKey:string,scope:RelationScope){const row=careerRelationDetailView(relationSource(s),relationKey,scope);return {...row,other:proIdentity(row.other)};}
export function unreadKboRelationNotices(s:KboCareer){return unreadRelationNotices(relationSource(s));}
/** Root-specific commit: read state/revision only. The immutable amateur seal and confirmed plan remain unchanged. */
export function resolveKboRelationNotice(s:KboCareer,revision:number,input:RelationNoticeReadInput){
 assertCareerRevision(s,revision);const selected=prepareRelationNoticeRead(relationSource(s),input),career=structuredClone(s);
 career.relationNotices=selected.notices;career.revision++;return {career,navigation:selected.navigation};
}

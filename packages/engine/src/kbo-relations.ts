import {assertKboRecruitmentWorld} from './kbo-draft.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {kboPreseasonPlanView} from './kbo-preseason.js';
import {careerRelationshipListView,careerRelationDetailView} from './relationship-history.js';
import type {RelationshipHistorySource,RelationHistoryWorld} from './relationship-history.js';
import type {RelationScope} from './relationships.js';
import {unreadRelationNotices,prepareRelationNoticeRead} from './relation-notices.js';
import type {RelationNoticeReadInput,RelationNoticeReadSource} from './relation-notices.js';
import {kboOpponentReunionNoticeRows,prepareKboOpponentReunionRead} from './kbo-reunion-events.js';
import {kboTeamReunionNoticeRows,prepareKboTeamReunionRead} from './kbo-team-reunions.js';

/** Read adapter only. It never registers an archived student in the live pro roster. */
function relationSource(s:KboCareer):RelationNoticeReadSource {
 assertCareerRevision(s,s.revision);
 if(s.phaseContext.phase==='PRESEASON_SETUP')kboPreseasonPlanView(s);
 else {
  assertKboRecruitmentWorld(s.world);const club=s.world.clubs.find(c=>c.id===s.protagonistClubId),r=s.registration;
  if(!club || !club.roster.includes(s.protagonistKey) || s.rights.holderOrgId!==club.id || s.rights.playerKey!==s.protagonistKey || r.playerKey!==s.protagonistKey || r.clubId!==club.id || r.seasonKey!==s.world.seasonKey || r.status!=='ACTIVE' || r.firstTeam!==club.firstTeam.includes(s.protagonistKey))throw new RangeError('INVALID_KBO_RELATION_REGISTRATION');
 }
 const world:RelationHistoryWorld={worldKey:s.world.worldKey,seed:s.world.seed,seasonKey:s.world.seasonKey,leagueKey:'KBO',protagonistKey:s.protagonistKey,protagonistSchoolId:s.protagonistClubId,schools:s.world.clubs,players:s.world.players};
 const detachedPlayers:Record<string,NonNullable<RelationshipHistorySource['detachedPlayers']>[string]>={};
 const registration=(clubId:string|null,seasonKey:string)=>{const c=s.world.clubs.find(c=>c.id===clubId);return c?{seasonKey,leagueKey:'KBO',teamId:c.id,teamName:c.name}:null;};
 for(const [key,e] of Object.entries(s.freeAgents?.players??{}))detachedPlayers[key]={player:e.player,lastKnownRegistration:e.origin==='RELEASED'?null:registration(e.previousClubId,e.previousContract?.seasonKey??e.enteredSeasonKey)};
 for(const r of s.retiredPlayers??[])detachedPlayers[r.playerKey]={player:r.player,lastKnownRegistration:registration(r.clubId,r.lastSeasonKey)};
 // A player retired while unsigned has no saved last club in the legacy FA archive. Do not invent one.
 for(const r of s.freeAgents?.retired??[])detachedPlayers[r.player.simulationKey]={player:r.player,lastKnownRegistration:null};
 // A preseason signing can be released before activation. Its contract club is not proof it ever registered there.
 // Recover only official historical registration when the FA/archive snapshot has no known active registration.
 const observed=new Map<string,{year:number;day:number;registration:NonNullable<NonNullable<RelationshipHistorySource['detachedPlayers']>[string]['lastKnownRegistration']>}>();
 for(const row of s.health.games){const e=row.evidence,g=s.records.games[e.gameKey];if(!g || !['KBO','FUTURES'].includes(g.scope.leagueKey))continue;
  const keys=e.roster.filter(k=>Object.hasOwn(detachedPlayers,k) && detachedPlayers[k]!.lastKnownRegistration===null);if(!keys.length)continue;
  if(e.seasonKey!==g.scope.seasonKey || e.day!==g.worldDay || !e.teamKey.startsWith(g.scope.leagueKey+':') || !Object.hasOwn(g.teams,e.teamKey.slice(g.scope.leagueKey.length+1)))throw new RangeError('INVALID_KBO_RELATION_REGISTRATION');
  const team=s.world.clubs.find(c=>c.id===e.teamKey.slice(g.scope.leagueKey.length+1));if(!team)continue;
  for(const key of keys){const old=observed.get(key),year=Number(e.seasonKey);if(!old || year>old.year || year===old.year && e.day>old.day)observed.set(key,{year,day:e.day,registration:{seasonKey:e.seasonKey,leagueKey:g.scope.leagueKey,teamId:team.id,teamName:team.name}});}
 }
 for(const [key,value] of observed)detachedPlayers[key]!.lastKnownRegistration=value.registration;
 return {world,detachedPlayers,records:s.records,relationships:s.relationships,previousSeasons:[...(s.amateurHistory.previousSeasons??[]),{world:s.amateurHistory.world}],events:s.events,revision:s.revision,phaseContext:s.phaseContext,relationNotices:s.relationNotices};
}
/** New pro DTO uses teamName for both a school and a club; old school DTOs remain compatible. */
type Identity=NonNullable<ReturnType<typeof careerRelationshipListView>[number]['other']>;
function proIdentity(other:Identity|null){
 return other?{name:other.name,kind:other.kind,position:other.position,throws:other.throws,bats:other.bats,pitchForm:other.pitchForm,teamName:other.schoolName}:null;
}
export function kboRelationshipListView(s:KboCareer){return careerRelationshipListView(relationSource(s)).map(row=>({...row,other:proIdentity(row.other)}));}
export function kboRelationDetailView(s:KboCareer,relationKey:string,scope:RelationScope){const row=careerRelationDetailView(relationSource(s),relationKey,scope);return {...row,other:proIdentity(row.other)};}
function noticeSources(s:KboCareer){
 const seen=new Set<string>();for(const e of s.relationNotices){if(seen.has(e.eventKey))throw new RangeError('DUPLICATE_RELATION_NOTICE');if(!['E94','E95','E96'].includes(e.definitionId))throw new RangeError('INVALID_KBO_RELATION_NOTICE');seen.add(e.eventKey);}
 return {...relationSource(s),relationNotices:s.relationNotices.filter(e=>e.definitionId==='E94')};
}
export function unreadKboRelationNotices(s:KboCareer){
 const formation=unreadRelationNotices(noticeSources(s)),identities=kboRelationshipListView(s),reunions=[...kboOpponentReunionNoticeRows(s),...kboTeamReunionNoticeRows(s)].map(row=>{const other=identities.find(r=>r.relationKey===row.relationKey)!;return {...row,otherName:other.other?.name??null,otherInCurrentWorld:other.otherAvailability==='CURRENT_WORLD'};});
 const rows=[...formation,...reunions];return s.relationNotices.flatMap(e=>rows.filter(r=>r.eventKey===e.eventKey));
}
/** Root-specific commit: read state/revision only. The immutable amateur seal and confirmed plan remain unchanged. */
export function resolveKboRelationNotice(s:KboCareer,revision:number,input:RelationNoticeReadInput){
 assertCareerRevision(s,revision);if(s.relationNotices.filter(e=>e.eventKey===input.eventKey).length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const formation=noticeSources(s),event=s.relationNotices.find(e=>e.eventKey===input.eventKey);
 const selected=event?.definitionId==='E95'?prepareKboOpponentReunionRead(s,input):event?.definitionId==='E96'?prepareKboTeamReunionRead(s,input):(()=>{const read=prepareRelationNoticeRead(formation,input);return {event:read.notices.find(e=>e.eventKey===input.eventKey)!,navigation:read.navigation};})();
 const career=structuredClone(s);career.relationNotices=career.relationNotices.map(e=>e.eventKey===selected.event.eventKey?selected.event:e);career.revision++;return {career,navigation:selected.navigation};
}

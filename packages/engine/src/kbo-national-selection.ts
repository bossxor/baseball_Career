import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {NationalTournament} from './kbo-national.js';
import {openNationalCallup} from './kbo-national.js';
import {createNationalSelection,assertNationalSelectionSnapshot} from './national-selection.js';
import type {NationalCandidate,NationalSelectionSnapshot} from './national-selection.js';
import {createWorldEvent,eventDefinition} from './events.js';

/** Existing KBO population is KOR; explicit nationality metadata always overrides the legacy default. */
export function kboNationalCandidates(c:KboCareer):NationalCandidate[] {
 const first=new Set(c.world.clubs.flatMap(club=>club.firstTeam)),sports=new Set([...(c.sangmu?.loaned??[]),...Object.keys(c.sangmu?.members??{})]);
 const players={...c.world.players,...Object.fromEntries(Object.entries(c.sangmu?.members??{}).map(([k,m])=>[k,m.player]))};
 return Object.values(players).map(player=>{const key=player.simulationKey,own=key===c.protagonistKey,service=own&&c.military?.status==='SERVING_ACTIVE'||Object.hasOwn(c.world.suspendedContracts??{},key)&&!sports.has(key)?'ACTIVE':sports.has(key)?'SPORTS':'NONE';
  return {player,nationalTeamId:'nationalTeamId' in player?String(player.nationalTeamId):'KOR',league:first.has(key)&&service==='NONE'?'KBO':'FUTURES',injured:Object.hasOwn(c.health.injuries,key),retired:own&&c.phaseContext.phase==='ARCHIVED',nationalReleaseAllowed:true,service,militaryUnresolved:own?['UNRESOLVED','APPLICATION_PENDING'].includes(c.military?.status??'UNRESOLVED'):!sports.has(key)&&!Object.hasOwn(c.sangmu?.npcReturns??{},key),recentTopLeagueRecord:false};
 });
}
/** Seals score/roster once; absence is evidenced by this snapshot, not an invented ACK-only outcome. */
export function openKboNationalSelection(c:KboCareer,revision:number,tournament:NationalTournament):KboCareer {
 if(!c.protagonistClubId||!Array.isArray(c.world?.clubs))throw new RangeError('NATIONAL_CAREER_MODE_MISMATCH');
 assertKboCareerRevision(c,revision);
 if(['ARCHIVED','RETIRE_CONFIRM','EVENT_DECISION','INTERNATIONAL_PROGRESS','INTERNATIONAL_REVIEW'].includes(c.phaseContext.phase)||c.phaseContext.phase==='SEASON_PROGRESS'&&c.phaseContext.pendingGame)throw new RangeError('NATIONAL_SELECTION_NOT_AVAILABLE');
 if(!c.world.calendar.international.some(w=>w.type===tournament))throw new RangeError('NATIONAL_NOT_SCHEDULED');
 const id=JSON.stringify(['national-selection',c.world.worldKey,c.world.seasonKey,tournament]),old=c.national?.selections?.find(s=>s.selectionId===id);
 if(old){assertNationalSelectionSnapshot(old);return c;}
 if(c.national?.invitations.some(i=>i.tournament===tournament&&i.seasonKey===c.world.seasonKey&&!i.selectionSnapshotId))throw new RangeError('LEGACY_NATIONAL_CALLUP_ACTIVE');
 const selection=createNationalSelection({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,tournament,candidates:kboNationalCandidates(c),records:c.records});
 let next:KboCareer={...c,national:{invitations:c.national?.invitations??[],competitions:c.national?.competitions??[],benefits:c.national?.benefits??[],...c.national,selections:[...(c.national?.selections??[]),selection]}};
 if(selection.roster.slots.some(s=>s.playerKey===c.protagonistKey)){
  next=openNationalCallup(next,revision,tournament);const invite=next.national!.invitations.at(-1)!;next.national={...next.national!,invitations:next.national!.invitations.map(i=>i.selectionId===invite.selectionId?{...i,selectionSnapshotId:selection.selectionId}:i)};
 }else{
  const d=eventDefinition('E45'),event=createWorldEvent({definitionId:'E45',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,competitionId:selection.selectionId,selectionOrAppearanceStage:'NOT_SELECTED'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:null,registrationKey:c.protagonistClubId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:c.days?.seasonKey===c.world.seasonKey?c.days.days.at(-1)?.day??0:0});
  next={...next,revision:c.revision+1,events:[...c.events,event]};
 }
 return next;
}
export function kboNationalSelectionView(c:KboCareer,tournament:NationalTournament) {
 if(!c.protagonistClubId||!Array.isArray(c.world?.clubs))throw new RangeError('NATIONAL_CAREER_MODE_MISMATCH');
 assertKboCareerRevision(c,c.revision);const s=c.national?.selections?.find(s=>s.seasonKey===c.world.seasonKey&&s.tournament===tournament);if(!s)return null;assertNationalSelectionSnapshot(s);
 const byKey=new Map(s.scores.map(r=>[r.playerKey,r])),own=byKey.get(c.protagonistKey),slot=s.roster.slots.find(r=>r.playerKey===c.protagonistKey),publicScore=(r:NationalSelectionSnapshot['scores'][number])=>({playerKey:r.playerKey,name:r.name,kind:r.kind,position:r.position,score:r.score,sample:r.sample,performanceLeague:r.performanceLeague,performanceSeason:r.performanceSeason,emergency:(s.emergencyAdmissions??[]).some(a=>a.playerKeys.includes(r.playerKey))&&s.replacements.some(replacement=>replacement.to===r.playerKey)});
 return {selectionId:s.selectionId,tournament:s.tournament,seasonKey:s.seasonKey,roster:s.roster.slots.map(slot=>({...publicScore(byKey.get(slot.playerKey)!),role:slot.role})),protagonist:own?{...publicScore(own),selected:!!slot,role:slot?.role??null}:null};
}

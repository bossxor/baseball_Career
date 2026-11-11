import {assertKboCareerRevision} from './kbo-career-version.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboClubGame} from './kbo-club-game.js';
import type {CollegeLeagueHost} from './college-national-host.js';
import type {UsCareer} from './us-career-entry.js';

export function createKboDepartureHost(source:KboCareer,us:UsCareer):CollegeLeagueHost {
 assertKboCareerRevision(source,us.kboTransfer?.sourceRevision??-1);
 const {seasonClose,postseason,competitionSchedule,days,freeAgents}=source;
 if(source.phaseContext.phase!=='ARCHIVED'||!seasonClose||seasonClose.seasonKey!==source.world.seasonKey||!postseason?.championKey||
  !competitionSchedule||!days||!freeAgents||us.protagonistKey!==source.protagonistKey||us.world.worldKey!==source.world.worldKey||
  us.world.seed!==source.world.seed||Object.hasOwn(source.world.players,source.protagonistKey))throw new RangeError('KBO_DEPARTURE_HOST_NOT_READY');
 const national=source.national??{invitations:[],competitions:[],benefits:[]};
 const tournamentRosters=national.competitions.flatMap(competition=>{
  const selection=national.selections?.find(s=>s.seasonKey===competition.seasonKey&&s.tournament===competition.tournament);
  return selection?[{seasonKey:competition.seasonKey,type:competition.tournament,playerKeys:selection.roster.slots.map(slot=>slot.playerKey)}]:[];
 });
 const health=structuredClone(source.health);
 delete health.injuries[source.protagonistKey];
 const game:KboClubGame={
  schemaVersion:1,revision:source.revision,difficulty:source.difficulty,world:source.world,userClubId:source.protagonistClubId,
  startYear:source.world.calendar.year,creationKey:JSON.stringify(['kbo-departure-host',us.activation.receiptKey]),
  phase:'SEASON_REVIEW',records:source.records,health,schedule:competitionSchedule.leagues,freeAgents,imports:[],
  ...(source.npcLeagueHistory?.seasons?{seasons:source.npcLeagueHistory.seasons}:{}),
  seasonClose:{receiptKey:seasonClose.receiptKey,seasonKey:seasonClose.seasonKey,npcGrowth:seasonClose.npcGrowth??{}},days,postseason,
  ...(source.sangmu?{sangmu:source.sangmu}:{}),...(source.aiAssessments?{aiAssessments:source.aiAssessments}:{}),
  ...(source.rookieDrafts?{rookieDrafts:source.rookieDrafts}:{}),...(source.retiredPlayers?{retiredPlayers:source.retiredPlayers}:{}),
  ...(source.aiOffseasons?{aiOffseasons:source.aiOffseasons.map(entry=>({...entry,userOfferCount:0}))}:{}),national:tournamentRosters,
 };
 return structuredClone({kind:'COLLEGE_NPC_KBO',revision:game.revision,ownerPlayerKey:source.protagonistKey,game,national,
  departure:{kboRevision:source.revision,usActivationReceiptKey:us.activation.receiptKey}});
}

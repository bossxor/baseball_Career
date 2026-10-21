import type {KboCareer} from './kbo-career-entry.js';
import {validateSeasonGrowthLedger,createSeasonGrowthLedger} from './growth-ledger.js';
import {kboContractDecisionRequired,acceptedRenewal} from './kbo-renewal.js';
import {assertCareerRevision} from './high-school-career.js';
import {createSeasonCalendar} from './season-calendar.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {retireKboOverAgeNpcs} from './kbo-retirement.js';
import {draftKboRookieClass} from './kbo-supply.js';
import {leagueStandings} from './standings.js';

export type KboTransitionBlocker='SEASON_NOT_IN_REVIEW'|'POSTSEASON_NOT_COMPLETE'|'SEASON_NOT_CLOSED'|'OPEN_EVENT'|'PENDING_GAME'|'GROWTH_NOT_FINALIZED'|'MAX_AGE_REACHED'|'CONTRACT_DECISION_REQUIRED';
/** 14: 45 is the last playable age in every league. */
export const KBO_MAX_PLAYER_AGE=45;

/** 72 Y01 start conditions for my pro career, read-only. Year transition may only be requested when nothing is
 * blocking; growth/aging are checked here, never applied again. A player whose next age passes 45 goes to the
 * retirement/archive path instead of a new season. Reads never change revision or RNG. */
export function kboYearTransitionReadiness(source:KboCareer):{ready:boolean;blockers:KboTransitionBlocker[];targetSeasonKey:string;nextAge:number} {
 const blockers:KboTransitionBlocker[]=[],phase=source.phaseContext;
 if(phase.phase!=='SEASON_REVIEW')blockers.push('SEASON_NOT_IN_REVIEW');
 if(phase.phase==='SEASON_PROGRESS' && phase.pendingGame || phase.phase==='POSTSEASON_PROGRESS' && phase.pendingGame)blockers.push('PENDING_GAME');
 if(!source.postseason?.championKey)blockers.push('POSTSEASON_NOT_COMPLETE');
 if(!source.seasonClose || source.seasonClose.seasonKey!==source.world.seasonKey)blockers.push('SEASON_NOT_CLOSED');
 if(source.events.some(e=>e.status==='OPEN'))blockers.push('OPEN_EVENT');
 validateSeasonGrowthLedger(source.seasonGrowth);
 if(!source.seasonGrowth.finalized)blockers.push('GROWTH_NOT_FINALIZED');
 if(kboContractDecisionRequired(source))blockers.push('CONTRACT_DECISION_REQUIRED');
 const nextAge=source.world.players[source.protagonistKey]!.age+1;
 if(nextAge>KBO_MAX_PLAYER_AGE)blockers.push('MAX_AGE_REACHED');
 return {ready:blockers.length===0,blockers,targetSeasonKey:String(Number(source.world.seasonKey)+1),nextAge};
}

export interface KboAgeContractStage {
 stepKey:string;targetSeasonKey:string;sourceRevision:number;
 players:Record<string,{age:number;contract:{contractKey:string;contractYear:number;years:number;expired:boolean}|null}>;
 /** NPCs whose staged age passes 45: Y04 supply replaces them; no death model. */
 overAge:string[];expiring:string[];
}
/** 72 Y02 staging only: age+1 and contract-year carry for every player of the pro world. Pure and deterministic, so a
 * retry with the same source returns the same output; nothing is activated and growth/aging are never re-applied. */
export function stageKboAgeAndContracts(source:KboCareer):KboAgeContractStage {
 const ready=kboYearTransitionReadiness(source);
 if(!ready.ready)throw new RangeError('YEAR_TRANSITION_NOT_READY');
 const target=Number(ready.targetSeasonKey),players:KboAgeContractStage['players']={},overAge:string[]=[],expiring:string[]=[];
 for(const key of Object.keys(source.world.players).sort()){
  const age=source.world.players[key]!.age+1,c=source.world.contracts[key],renewed=key===source.protagonistKey?acceptedRenewal(source):null;
  const contract=renewed?{contractKey:renewed.offerKey,contractYear:1,years:1,expired:false}:c?{contractKey:c.contractKey,contractYear:target-Number(c.seasonKey)+1,years:c.years,expired:target-Number(c.seasonKey)+1>c.years}:null;
  players[key]={age,contract};
  if(age>KBO_MAX_PLAYER_AGE)overAge.push(key);
  if(contract?.expired)expiring.push(key);
 }
 return {stepKey:JSON.stringify(['kbo-year-transition','Y02',source.world.worldKey,ready.targetSeasonKey]),targetSeasonKey:ready.targetSeasonKey,sourceRevision:source.revision,players,overAge,expiring};
}

/** One finished pro season kept for reads; official records stay in the shared ledger. */
export interface KboSeasonArchive {seasonKey:string;seasonClose:NonNullable<KboCareer['seasonClose']>;postseason:NonNullable<KboCareer['postseason']>;days:NonNullable<KboCareer['days']>;seasonGrowth:KboCareer['seasonGrowth'];planHistory:KboCareer['planHistory'];openingRoster?:KboCareer['openingRoster'];callupReviews?:KboCareer['callupReviews']}
/** 72 atomic activation for my pro world: the Y02 stage is applied to every player at once (age+1, contract carry,
 * my accepted renewal), the next calendar and fresh season ledgers open, and the career returns to PRESEASON_SETUP.
 * Earned growth, P, books (maturity) and history carry; nothing is re-grown or re-aged. */
export function startNextKboSeason(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const stage=stageKboAgeAndContracts(source),target=stage.targetSeasonKey,key=source.protagonistKey;
 if(Object.values(source.records.games).some(g=>g.scope.seasonKey===target))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const career=structuredClone(source),world=career.world,renewal=acceptedRenewal(source)!;
 // Y04: 45-year retirements first, then the yearly rookie class (15) after the new contracts are in place.
 const retired=retireKboOverAgeNpcs(world,stage.overAge,source.world.seasonKey);
 if(retired.length)career.retiredPlayers=[...(source.retiredPlayers??[]),...retired];
 for(const r of retired)delete career.health.injuries[r.playerKey];
 for(const [k,s] of Object.entries(stage.players)){
  if(!Object.hasOwn(world.players,k))continue;
  world.players[k]={...world.players[k]!,age:s.age,fatigue:0};
  const c=world.contracts[k]!;
  // ponytail: AI clubs re-sign every expiring NPC for 1 year at the same salary until the 05/115 offseason (O05) exists.
  world.contracts[k]=k===key?{...c,contractKey:renewal.offerKey,seasonKey:target,years:1,annualSalaryWon:renewal.annualSalaryWon}:{...c,seasonKey:target,years:s.contract!.expired?1:c.years-1};
  const book=schoolYearEndRepertoire(source,k);if(book)world.repertoires[k]={...structuredClone(book),seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 for(const club of world.clubs){club.paidSalaryWon=0;club.reservedSalaryWon=club.roster.reduce((n,k)=>n+world.contracts[k]!.annualSalaryWon,0);}
 const standings=leagueStandings(source.records,{seasonKey:source.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},world.clubs.map(c=>c.id),source.world.seed,source.world.worldKey);
 career.rookieDrafts=[...(source.rookieDrafts??[]),draftKboRookieClass(world,target,standings.map(s=>s.teamKey).reverse(),source.difficulty)];
 world.seasonKey=target;world.calendar=createSeasonCalendar(Number(target));assertKboRecruitmentWorld(world);
 const player=world.players[key]!,club=world.clubs.find(c=>c.id===career.protagonistClubId)!;
 const archive:KboSeasonArchive={seasonKey:source.world.seasonKey,seasonClose:source.seasonClose!,postseason:source.postseason!,days:source.days!,seasonGrowth:source.seasonGrowth,planHistory:source.planHistory,...(source.openingRoster?{openingRoster:source.openingRoster}:{}),...(source.callupReviews?{callupReviews:source.callupReviews}:{})};
 career.proSeasons=[...(source.proSeasons??[]),structuredClone(archive)];
 career.registration={playerKey:key,clubId:club.id,seasonKey:target,status:'ACTIVE',firstTeam:club.firstTeam.includes(key)};
 career.seasonGrowth=createSeasonGrowthLedger(player,target,world.calendar.growthDays.length);
 career.development={...career.development,seasonStartPlayer:structuredClone(player)};
 career.planHistory=[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}];
 if(career.traits)career.traits={...career.traits,lastClosedDay:null,lastSeasonKey:target};
 for(const field of ['days','seasonClose','postseason','preseasonPlan','openingRoster','competitionSchedule','callupReviews'] as const)delete career[field];
 career.phaseContext={phase:'PRESEASON_SETUP'};career.revision++;return career;
}

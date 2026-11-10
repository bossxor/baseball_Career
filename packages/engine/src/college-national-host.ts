import {KBO_CLUBS} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import type {KboClubGame} from './kbo-club-game.js';
import {createKboClubGame} from './kbo-club-game.js';
import {startKboClubSeason,advanceKboClubGame} from './kbo-club-progress.js';
import {closeKboClubSeason,startNextKboClubSeason} from './kbo-club-year.js';
import {startKboClubPostseason,advanceKboClubPostseason} from './kbo-club-postseason.js';
import type {NationalLedger,NationalHostReturn} from './kbo-national.js';
import {assertNationalLedger} from './kbo-national.js';
import type {NationalCandidate,NationalSelectionSnapshot} from './national-selection.js';
import type {NationalBracket} from './national-bracket.js';
import {assertNationalBracket,nationalMatchesOnDay} from './national-bracket.js';
import type {NationalHostSnapshot} from './national-host-return.js';
import {nationalDayEvidence} from './national-day-audit.js';
import type {RecordLedger} from './records.js';
import {putGameContribution} from './records.js';
import type {HealthLedger} from './health.js';
import {canonicalJson} from './game.js';
import {canonicalSeal,matchesCanonicalSeal} from './canonical-seal.js';

/** A server-owned NPC league with a separate detailed national ledger. */
export interface CollegeLeagueHost {kind:'COLLEGE_NPC_KBO';revision:number;ownerPlayerKey:string;game:KboClubGame;national:NationalLedger}
export function assertCollegeLeagueHost(host:CollegeLeagueHost,c:HighSchoolCareer,revision:number):void {
 if(!host||host.kind!=='COLLEGE_NPC_KBO'||!host.game||host.revision!==revision||host.game.revision!==revision||host.ownerPlayerKey!==c.world.protagonistKey||host.game.world.worldKey!==c.world.worldKey||host.game.world.seed!==c.world.seed||host.game.difficulty!==c.difficulty||Number(host.game.world.seasonKey)>Number(c.world.seasonKey))throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 assertNationalLedger(host.national,c.world.worldKey);
 for(const handoff of host.national.hostReturns??[]){
  const bracket=host.national.brackets?.find(b=>b.competitionId===handoff.competitionId);
  if(!bracket)throw new RangeError('CHANGED_NATIONAL_HOST_ROSTER');
  const selection=host.national.selections?.find(s=>s.seasonKey===bracket.seasonKey&&s.tournament===bracket.tournament);
  const roster=host.game.national?.find(r=>r.seasonKey===bracket.seasonKey&&r.type===bracket.tournament);
  if(!selection||!roster||canonicalJson(roster.playerKeys)!==canonicalJson(selection.roster.slots.map(s=>s.playerKey)))throw new RangeError('CHANGED_NATIONAL_HOST_ROSTER');
  assertNationalBracket(bracket);
  for(const day of bracket.dayReceipts??[])for(const match of nationalMatchesOnDay(bracket,day.day).completed){
   const result=bracket.results.find(r=>r.gameKey===match.gameKey)!,game=host.game.records.games[match.gameKey];
   if(!game||game.worldDay!==match.day||game.scope.seasonKey!==bracket.seasonKey||game.scope.leagueKey!==bracket.tournament||game.scope.phase!=='INTERNATIONAL'||game.teams[match.away]?.R!==result.awayRuns||game.teams[match.home]?.R!==result.homeRuns)throw new RangeError('CHANGED_NATIONAL_GAME_EVIDENCE');
  }
  if(bracket.seasonKey===host.game.world.seasonKey)for(const day of bracket.dayReceipts??[]){const closed=host.game.days?.days.find(d=>d.day===day.day);if(!closed||closed.evidence!==nationalDayEvidence(bracket,day.day,day.gameKeys,day.rosterKeys)||canonicalJson(closed.result)!==canonicalJson(day.result))throw new RangeError('CHANGED_NATIONAL_HOST_DAYS');}
 }
}
/** The first school-world year is authoritative; no current-year shortcut for old saves. */
export function createCollegeLeagueHost(c:HighSchoolCareer,revision:number):CollegeLeagueHost {
 assertCollegeCareerRevision(c,revision);
 const origin=(c.previousSeasons??[]).find(a=>a.world.leagueKey===undefined&&a.world.worldKey===c.world.worldKey&&a.world.seed===c.world.seed&&a.world.protagonistKey===c.world.protagonistKey);
 if(!origin||!/^\d{4}$/.test(origin.world.seasonKey))throw new RangeError('NATIONAL_COLLEGE_ORIGIN_MISMATCH');
 const game=createKboClubGame({worldKey:c.world.worldKey,seed:c.world.seed,difficulty:c.difficulty,clubId:KBO_CLUBS[0]!.id,startYear:Number(origin.world.seasonKey)});
 return {kind:'COLLEGE_NPC_KBO',revision:game.revision,ownerPlayerKey:c.world.protagonistKey,game,national:{invitations:[],competitions:[],benefits:[]}};
}
/** One bounded engine step; a save commits every partial game/day and each year transition. */
export function advanceCollegeLeagueHost(c:HighSchoolCareer,revision:number,host:CollegeLeagueHost,hostRevision:number,stopDay:number):{host:CollegeLeagueHost;stopReason:string} {
 assertCollegeCareerRevision(c,revision);assertCollegeLeagueHost(host,c,hostRevision);
 if(!Number.isSafeInteger(stopDay)||stopDay<0)throw new RangeError('INVALID_NATIONAL_DAY');
 let game=host.game,stopReason:string;
 if(game.phase==='PRESEASON_SETUP'){game=startKboClubSeason(game,game.revision);stopReason='STARTED';}
 else if(game.phase==='SEASON_PROGRESS'){
  if(!game.progress||Number(game.world.seasonKey)===Number(c.world.seasonKey)&&game.progress.nextWorldDay>=stopDay&&!game.progress.pendingGame)return {host,stopReason:'TARGET_REACHED'};
  const result=advanceKboClubGame(game,game.revision,1);game=result.game;stopReason=result.stopReason;
 }else if(game.phase==='SEASON_REVIEW'){
  if(Number(game.world.seasonKey)>=Number(c.world.seasonKey))throw new RangeError('NATIONAL_HOST_PASSED_WINDOW');
  if(!game.postseason){game=startKboClubPostseason(game,game.revision);stopReason='POSTSEASON_STARTED';}
  else if(!game.seasonClose){game=closeKboClubSeason(game,game.revision);stopReason='YEAR_CLOSED';}
  else {game=startNextKboClubSeason(game,game.revision);stopReason='NEXT_YEAR';}
 }else if(game.phase==='POSTSEASON_PROGRESS'){
  const result=advanceKboClubPostseason(game,game.revision);game=result.game;stopReason=result.stopReason;
 }else throw new RangeError('NATIONAL_HOST_PHASE');
 return {host:{...host,game,revision:game.revision},stopReason};
}
export function collegeLeagueCandidates(host:CollegeLeagueHost):NationalCandidate[]{
 const game=host.game,first=new Set(game.world.clubs.flatMap(club=>club.firstTeam)),sports=new Set([...(game.sangmu?.loaned??[]),...Object.keys(game.sangmu?.members??{})]);
 const players={...game.world.players,...Object.fromEntries(Object.entries(game.sangmu?.members??{}).map(([key,m])=>[key,m.player]))};
 return Object.values(players).map(player=>{const key=player.simulationKey,service=Object.hasOwn(game.world.suspendedContracts??{},key)&&!sports.has(key)?'ACTIVE':sports.has(key)?'SPORTS':'NONE';return {player,nationalTeamId:'nationalTeamId' in player?String(player.nationalTeamId):'KOR',league:first.has(key)&&service==='NONE'?'KBO':'FUTURES',injured:Object.hasOwn(game.health.injuries,key),retired:false,nationalReleaseAllowed:true,service,militaryUnresolved:!sports.has(key)&&!Object.hasOwn(game.sangmu?.npcReturns??{},key),recentTopLeagueRecord:false};});
}
export function captureCollegeLeagueHost(host:CollegeLeagueHost):NationalHostSnapshot {
 const members={...host.game.sangmu?.emergency?.entries,...host.game.sangmu?.members};
 return {hostSourceFingerprint:canonicalSeal(host),hostPlayers:structuredClone({...host.game.world.players,...Object.fromEntries(Object.entries(members).map(([k,m])=>[k,m.player]))}),hostRepertoires:structuredClone({...host.game.world.repertoires,...Object.fromEntries(Object.entries(members).filter(([,m])=>m.repertoire).map(([k,m])=>[k,m.repertoire!]))}),hostHealth:structuredClone(host.game.health)};
}
export function returnCollegeLeagueHost(input:{host:CollegeLeagueHost;college:HighSchoolCareer;expectedRevision:number;snapshot:NationalHostSnapshot;bracket:NationalBracket;selection:NationalSelectionSnapshot;records:RecordLedger;ownerRevision:number;ownerHealth:HealthLedger}):{host:CollegeLeagueHost;ownership:NationalHostReturn} {
 const {host,college,expectedRevision,snapshot:s,bracket:b}=input;assertCollegeLeagueHost(host,college,expectedRevision);assertNationalBracket(b);
 const source=host.game;if(!matchesCanonicalSeal(s.hostSourceFingerprint,canonicalSeal(host))||source.world.seasonKey!==b.seasonKey||source.phase!=='SEASON_PROGRESS'||!source.progress||source.progress.pendingGame||source.progress.nextWorldDay!==b.window.startDay||b.pendingGame||b.dayReceipts?.length!==b.window.endDay-b.window.startDay)throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 const next=structuredClone(host),game=next.game;game.health=structuredClone(s.hostHealth);
 for(const [key,player] of Object.entries(s.hostPlayers)){
  if(game.sangmu?.members[key])game.sangmu={...game.sangmu,members:{...game.sangmu.members,[key]:{...game.sangmu.members[key]!,player:structuredClone(player)}}};
  else if(game.sangmu?.emergency?.entries[key])game.sangmu.emergency.entries[key]!.player=structuredClone(player);
  else if(Object.hasOwn(game.world.players,key))game.world.players[key]=structuredClone(player);else throw new RangeError('NATIONAL_ROSTER_CHANGED');
 }
 for(const [key,book] of Object.entries(s.hostRepertoires)){
  if(game.sangmu?.members[key])game.sangmu={...game.sangmu,members:{...game.sangmu.members,[key]:{...game.sangmu.members[key]!,repertoire:structuredClone(book)}}};
  else if(game.sangmu?.emergency?.entries[key])game.sangmu.emergency.entries[key]!.repertoire=structuredClone(book);
  else if(Object.hasOwn(game.world.repertoires,key))game.world.repertoires[key]=structuredClone(book);else throw new RangeError('NATIONAL_ROSTER_CHANGED');
 }
 const gameKeys=b.results.map(r=>r.gameKey);for(const key of gameKeys){const row=input.records.games[key];if(!row)throw new RangeError('NATIONAL_GAME_RECORD_MISSING');game.records=putGameContribution(game.records,row).ledger;}
 const competition=college.national?.competitions.find(r=>r.competitionId===b.competitionId);
 if(!competition||game.national?.some(r=>r.seasonKey===b.seasonKey&&r.type===b.tournament))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_STARTED');
 game.national=[...(game.national??[]),{seasonKey:b.seasonKey,type:b.tournament,playerKeys:input.selection.roster.slots.map(slot=>slot.playerKey)}];
 const ownership:NationalHostReturn={competitionId:b.competitionId,owner:'COLLEGE',sourceKboRevision:expectedRevision,sourceOwnerRevision:input.ownerRevision,kboPlayerKeys:Object.keys(s.hostPlayers).sort(),ownerPlayerKeys:Object.keys(college.world.players).sort(),ownerHealthGames:structuredClone(input.ownerHealth.games.filter(h=>gameKeys.includes(h.evidence.gameKey))),recordGameKeys:gameKeys,fatigueDays:b.dayReceipts!.map(d=>d.day),pitchXpKeys:Object.keys(s.hostRepertoires).filter(k=>canonicalJson(s.hostRepertoires[k])!==canonicalJson(source.sangmu?.members[k]?.repertoire??source.sangmu?.emergency?.entries[k]?.repertoire??source.world.repertoires[k])).sort()};
 for(const d of b.dayReceipts!){if(game.days?.days.at(-1)?.day!==d.day-1)throw new RangeError('NATIONAL_HOST_CLOCK_MISMATCH');game.days={...game.days,days:[...game.days.days,{day:d.day,evidence:nationalDayEvidence(b,d.day,d.gameKeys,d.rosterKeys),result:structuredClone(d.result)}]};}
 game.progress!.nextWorldDay=b.window.endDay;game.revision++;next.revision=game.revision;
 next.national={...next.national,selections:[...(next.national.selections??[]),structuredClone(input.selection)],brackets:[...(next.national.brackets??[]),structuredClone(b)],competitions:[...next.national.competitions,structuredClone(competition)],hostReturns:[...(next.national.hostReturns??[]),ownership]};
 return {host:next,ownership};
}

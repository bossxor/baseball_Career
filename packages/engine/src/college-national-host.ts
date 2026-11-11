import {KBO_CLUBS} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {CalendarVersion} from './season-calendar.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import type {KboClubGame} from './kbo-club-game.js';
import {createKboClubGame} from './kbo-club-game.js';
import {startKboClubSeason,advanceKboClubGame} from './kbo-club-progress.js';
import {closeKboClubSeason,startNextKboClubSeason} from './kbo-club-year.js';
import {startKboClubPostseason,advanceKboClubPostseason} from './kbo-club-postseason.js';
import type {NationalLedger,NationalHostReturn,NationalCompetitionResult} from './kbo-national.js';
import {assertNationalLedger} from './kbo-national.js';
import type {NationalCandidate,NationalSelectionSnapshot} from './national-selection.js';
import type {NationalBracket} from './national-bracket.js';
import {assertNationalBracket} from './national-bracket.js';
import type {NationalHostSnapshot} from './national-host-return.js';
import {auditCareerNationalDays,nationalDayEvidence} from './national-day-audit.js';
import type {RecordLedger} from './records.js';
import {putGameContribution} from './records.js';
import type {HealthLedger} from './health.js';
import {canonicalJson} from './game.js';
import {canonicalSeal,matchesCanonicalSeal} from './canonical-seal.js';

/** A server-owned NPC league with a separate detailed national ledger. */
export interface CollegeLeagueHost {kind:'COLLEGE_NPC_KBO';revision:number;ownerPlayerKey:string;game:KboClubGame;national:NationalLedger}
export function isCollegeLeagueHost(host:unknown):host is CollegeLeagueHost {
 return typeof host==='object'&&host!==null&&'kind' in host&&host.kind==='COLLEGE_NPC_KBO';
}
export interface NpcLeagueOwner {worldKey:string;seed:string;seasonKey:string;playerKey:string;difficulty:Difficulty}
const collegeOwner=(c:HighSchoolCareer):NpcLeagueOwner=>({worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,playerKey:c.world.protagonistKey,difficulty:c.difficulty});
export function assertCollegeLeagueHost(host:CollegeLeagueHost,c:HighSchoolCareer,revision:number):void {
 assertNpcLeagueHost(host,collegeOwner(c),revision);
}
export function assertNpcLeagueHost(host:CollegeLeagueHost,owner:NpcLeagueOwner,revision:number,maxSeasonKey=owner.seasonKey):void {
 if(!host||host.kind!=='COLLEGE_NPC_KBO'||!host.game||host.revision!==revision||host.game.revision!==revision||host.ownerPlayerKey!==owner.playerKey||host.game.world.worldKey!==owner.worldKey||host.game.world.seed!==owner.seed||host.game.difficulty!==owner.difficulty||Number(host.game.world.seasonKey)>Number(maxSeasonKey))throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
 assertNationalLedger(host.national,owner.worldKey);
 for(const handoff of host.national.hostReturns??[]){
  const bracket=host.national.brackets?.find(b=>b.competitionId===handoff.competitionId);
  if(!bracket)throw new RangeError('CHANGED_NATIONAL_HOST_ROSTER');
  const selection=host.national.selections?.find(s=>s.seasonKey===bracket.seasonKey&&s.tournament===bracket.tournament);
  const roster=host.game.national?.find(r=>r.seasonKey===bracket.seasonKey&&r.type===bracket.tournament);
  if(!selection||!roster||canonicalJson(roster.playerKeys)!==canonicalJson(selection.roster.slots.map(s=>s.playerKey)))throw new RangeError('CHANGED_NATIONAL_HOST_ROSTER');
 }
 auditCareerNationalDays({...host.game,national:host.national},true);
}
/** The first school-world year is authoritative; no current-year shortcut for old saves. */
export function createCollegeLeagueHost(c:HighSchoolCareer,revision:number):CollegeLeagueHost {
 assertCollegeCareerRevision(c,revision);
 const origin=(c.previousSeasons??[]).find(a=>a.world.leagueKey===undefined&&a.world.worldKey===c.world.worldKey&&a.world.seed===c.world.seed&&a.world.protagonistKey===c.world.protagonistKey);
 if(!origin||!/^\d{4}$/.test(origin.world.seasonKey))throw new RangeError('NATIONAL_COLLEGE_ORIGIN_MISMATCH');
 return createNpcLeagueHost(collegeOwner(c),Number(origin.world.seasonKey),'calendar-1');
}
export function createNpcLeagueHost(owner:NpcLeagueOwner,startYear:number,calendarVersion:CalendarVersion):CollegeLeagueHost {
 if(startYear>Number(owner.seasonKey))throw new RangeError('INVALID_NATIONAL_HOST_YEAR');
 const game=createKboClubGame({worldKey:owner.worldKey,seed:owner.seed,difficulty:owner.difficulty,clubId:KBO_CLUBS[0]!.id,startYear,calendarVersion});
 return {kind:'COLLEGE_NPC_KBO',revision:game.revision,ownerPlayerKey:owner.playerKey,game,national:{invitations:[],competitions:[],benefits:[]}};
}
/** One bounded engine step; a save commits every partial game/day and each year transition. */
export function advanceCollegeLeagueHost(c:HighSchoolCareer,revision:number,host:CollegeLeagueHost,hostRevision:number,stopDay:number):{host:CollegeLeagueHost;stopReason:string} {
 assertCollegeCareerRevision(c,revision);
 return advanceNpcLeagueHost(host,hostRevision,collegeOwner(c),{seasonKey:c.world.seasonKey,stopDay});
}
export function advanceNpcLeagueHost(host:CollegeLeagueHost,hostRevision:number,owner:NpcLeagueOwner,target:{seasonKey:string;stopDay:number|null}):{host:CollegeLeagueHost;stopReason:string} {
 if(!/^\d{4}$/.test(target.seasonKey)||Number(target.seasonKey)>Number(owner.seasonKey)+1)throw new RangeError('INVALID_NATIONAL_HOST_YEAR');
 assertNpcLeagueHost(host,owner,hostRevision,target.seasonKey);
 const {stopDay}=target;
 if(stopDay!==null&&(!Number.isSafeInteger(stopDay)||stopDay<0))throw new RangeError('INVALID_NATIONAL_DAY');
 let game=host.game,stopReason:string;
 if(game.phase==='PRESEASON_SETUP'){
  if(game.world.seasonKey===target.seasonKey&&stopDay===null)return {host,stopReason:'TARGET_REACHED'};
  game=startKboClubSeason(game,game.revision);stopReason='STARTED';}
 else if(game.phase==='SEASON_PROGRESS'){
  if(!game.progress)throw new RangeError('NATIONAL_HOST_PHASE');
  if(game.world.seasonKey===target.seasonKey&&(stopDay===null||game.progress.nextWorldDay>=stopDay)){
   if(game.progress.nextWorldDay!==stopDay||game.progress.pendingGame)throw new RangeError('NATIONAL_HOST_PASSED_WINDOW');
   return {host,stopReason:'TARGET_REACHED'};
  }
  const result=advanceKboClubGame(game,game.revision,1);game=result.game;stopReason=result.stopReason;
 }else if(game.phase==='SEASON_REVIEW'){
  if(Number(game.world.seasonKey)>=Number(target.seasonKey))throw new RangeError('NATIONAL_HOST_PASSED_WINDOW');
  if(game.seasonClose){game=startNextKboClubSeason(game,game.revision);stopReason='NEXT_YEAR';}
  else if(game.postseason){game=closeKboClubSeason(game,game.revision);stopReason='YEAR_CLOSED';}
  else {game=startKboClubPostseason(game,game.revision);stopReason='POSTSEASON_STARTED';}
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
 const {college,bracket}=input;
 return returnNpcLeagueHost({...input,owner:'COLLEGE',ownerState:collegeOwner(college),ownerPlayerKeys:Object.keys(college.world.players),competition:college.national?.competitions.find(r=>r.competitionId===bracket.competitionId)});
}
export function returnNpcLeagueHost(input:{host:CollegeLeagueHost;owner:NationalHostReturn['owner'];ownerState:NpcLeagueOwner;ownerPlayerKeys:string[];competition:NationalCompetitionResult|undefined;expectedRevision:number;snapshot:NationalHostSnapshot;bracket:NationalBracket;selection:NationalSelectionSnapshot;records:RecordLedger;ownerRevision:number;ownerHealth:HealthLedger}):{host:CollegeLeagueHost;ownership:NationalHostReturn} {
 const {host,expectedRevision,snapshot:s,bracket:b}=input;assertNpcLeagueHost(host,input.ownerState,expectedRevision);assertNationalBracket(b);
 const source=host.game,regular=source.phase==='SEASON_PROGRESS';
 const aligned=regular?source.progress?.nextWorldDay===b.window.startDay&&!source.progress.pendingGame:
  b.tournament==='WBC'&&source.phase==='PRESEASON_SETUP'&&source.world.calendar.version==='calendar-2';
 if(!matchesCanonicalSeal(s.hostSourceFingerprint,canonicalSeal(host))||source.world.seasonKey!==b.seasonKey||!aligned||b.pendingGame||b.dayReceipts?.length!==b.window.endDay-b.window.startDay)throw new RangeError('STALE_NATIONAL_CAREER_SOURCE');
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
 const competition=input.competition;
 if(!competition)throw new RangeError('NATIONAL_RESULT_REQUIRED');
 if(game.national?.some(r=>r.seasonKey===b.seasonKey&&r.type===b.tournament))throw new RangeError('NATIONAL_TOURNAMENT_ALREADY_STARTED');
 game.national=[...(game.national??[]),{seasonKey:b.seasonKey,type:b.tournament,playerKeys:input.selection.roster.slots.map(slot=>slot.playerKey)}];
 const ownership:NationalHostReturn={competitionId:b.competitionId,owner:input.owner,sourceKboRevision:expectedRevision,sourceOwnerRevision:input.ownerRevision,kboPlayerKeys:Object.keys(s.hostPlayers).sort(),ownerPlayerKeys:input.ownerPlayerKeys.slice().sort(),ownerHealthGames:structuredClone(input.ownerHealth.games.filter(h=>gameKeys.includes(h.evidence.gameKey))),recordGameKeys:gameKeys,fatigueDays:b.dayReceipts!.map(d=>d.day),pitchXpKeys:Object.keys(s.hostRepertoires).filter(k=>canonicalJson(s.hostRepertoires[k])!==canonicalJson(source.sangmu?.members[k]?.repertoire??source.sangmu?.emergency?.entries[k]?.repertoire??source.world.repertoires[k])).sort()};
 if(regular)for(const d of b.dayReceipts!){if(game.days?.days.at(-1)?.day!==d.day-1)throw new RangeError('NATIONAL_HOST_CLOCK_MISMATCH');game.days={...game.days,days:[...game.days.days,{day:d.day,evidence:nationalDayEvidence(b,d.day,d.gameKeys,d.rosterKeys),result:structuredClone(d.result)}]};}
 if(regular)game.progress!.nextWorldDay=b.window.endDay;
 game.revision++;next.revision=game.revision;
 next.national={...next.national,selections:[...(next.national.selections??[]),structuredClone(input.selection)],brackets:[...(next.national.brackets??[]),structuredClone(b)],competitions:[...next.national.competitions,structuredClone(competition)],hostReturns:[...(next.national.hostReturns??[]),ownership]};
 assertNpcLeagueHost(next,input.ownerState,next.revision);
 return {host:next,ownership};
}

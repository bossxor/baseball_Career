import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import type {HighSchoolGameContext,HighSchoolGameJob} from './high-school-game.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from './high-school-game.js';
import {createKboCompetitionGameWorld} from './kbo-game-world.js';
import {closeKboCompetitionDay,createKboDayLedger} from './kbo-day.js';
import type {KboLeagueKey} from './kbo-day.js';
import type {ScheduledGame} from './schedule.js';
import {refreshCareerTraits} from './high-school-traits.js';

export interface KboPendingGame {leagueKey:KboLeagueKey;job:HighSchoolGameJob}
export type KboSeasonProgress={phase:'SEASON_PROGRESS';nextWorldDay:number;pendingGame:KboPendingGame|null};
export type KboProgressStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'DAY_CLOSED'|'HEALTH_CHANGE'|'SEASON_REVIEW';
export interface KboProgressResult {career:KboCareer;stopReason:KboProgressStop;plateAppearances:number;completedInnings:number;daysClosed:number}
const LEAGUES:readonly KboLeagueKey[]=['KBO','FUTURES'];
const schedulesOf=(c:KboCareer)=>c.competitionSchedule!.leagues;
const lastDay=(c:KboCareer)=>Math.max(...LEAGUES.flatMap(l=>schedulesOf(c)[l].map(g=>g.worldDay)));
const firstDay=(c:KboCareer)=>Math.min(...LEAGUES.flatMap(l=>schedulesOf(c)[l].map(g=>g.worldDay)));

/** PRESEASON_SETUP → SEASON_PROGRESS. Needs the confirmed plan, opening roster and schedule; replays are rejected. */
export function startKboRegularSeason(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='PRESEASON_SETUP' || !source.preseasonPlan || !source.openingRoster || !source.competitionSchedule || source.days)throw new RangeError('KBO_SEASON_NOT_READY');
 const career=structuredClone(source);
 career.days=createKboDayLedger(career.world);
 career.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:firstDay(career),pendingGame:null};
 career.revision++;return career;
}

/** Server-internal world AI context for one league. Rotations follow each club's own games in that league. Never sent to clients. */
export function kboGameContext(career:KboCareer,leagueKey:KboLeagueKey):HighSchoolGameContext {
 const world=createKboCompetitionGameWorld(career.world,leagueKey,career.protagonistKey);
 const starters:Record<string,string>=Object.create(null) as Record<string,string>;
 for(const club of world.schools){
  const available=club.roster.filter(k=>world.players[k]!.kind==='PITCHER' && !Object.hasOwn(career.health.injuries,k)).sort();
  const rotation=available.filter(k=>world.players[k]!.position==='SP'),pool=rotation.length?rotation:available;
  if(pool.length===0)throw new RangeError('NO_HEALTHY_KBO_PITCHER');
  const games=Object.values(career.records.games).filter(g=>g.scope.leagueKey===leagueKey && g.scope.seasonKey===career.world.seasonKey && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,club.id)).length;
  starters[club.id]=pool[games%pool.length]!;
 }
 return {difficulty:career.difficulty,unavailableKeys:Object.keys(career.health.injuries),starters,recentBatting:{},recentPitchingOuts:{},traits:career.traits?.owned??{},approaches:{}};
}

function pendingQueue(career:KboCareer,day:number):{leagueKey:KboLeagueKey;game:ScheduledGame}[] {
 return LEAGUES.flatMap(leagueKey=>schedulesOf(career)[leagueKey].filter(g=>g.worldDay===day && !Object.hasOwn(career.records.games,g.simulationKey)).map(game=>({leagueKey,game})))
  .sort((a,b)=>a.leagueKey===b.leagueKey?(a.game.simulationKey<b.game.simulationKey?-1:1):(a.leagueKey<b.leagueKey?-1:1));
}

/** Bounded server worker: plays the date queue (KBO then FUTURES) in safe chunks, merges only the pitchers a game actually
 * touched, and closes the day for both leagues at once. A pending game survives chunk limits and JSON round trips. */
export function advanceKboCareer(source:KboCareer,expectedRevision:number,maxDays=1):KboProgressResult {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_PROGRESS' || !source.days || !source.competitionSchedule)throw new RangeError('INVALID_CAREER_PHASE');
 if(!Number.isSafeInteger(maxDays) || maxDays<1 || maxDays>7)throw new RangeError('INVALID_ADVANCE_DAYS');
 const career=structuredClone(source),progress=career.phaseContext as KboSeasonProgress,last=lastDay(career);
 if(!Number.isSafeInteger(progress.nextWorldDay) || progress.nextWorldDay<firstDay(career))throw new RangeError('INVALID_KBO_PROGRESS');
 if(progress.pendingGame && (progress.pendingGame.job.worldDay!==progress.nextWorldDay || progress.pendingGame.job.worldKey!==career.world.worldKey || progress.pendingGame.job.seasonKey!==career.world.seasonKey))throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
 let plateAppearances=0,completedInnings=0,daysClosed=0;
 const finish=(stopReason:KboProgressStop):KboProgressResult=>{career.revision++;return {career,stopReason,plateAppearances,completedInnings,daysClosed};};
 while(plateAppearances<1000 && completedInnings<20 && daysClosed<maxDays){
  const day=progress.nextWorldDay;
  if(day>last){career.phaseContext={phase:'SEASON_REVIEW'};return finish('SEASON_REVIEW');}
  if(!progress.pendingGame){
   const next=pendingQueue(career,day)[0];
   if(next){
    const world=createKboCompetitionGameWorld(career.world,next.leagueKey,career.protagonistKey);
    progress.pendingGame={leagueKey:next.leagueKey,job:prepareSchoolCompetitionGame(world,career.records,next.game,kboGameContext(career,next.leagueKey))};
   }
  }
  if(progress.pendingGame){
   const pending=progress.pendingGame,before=pending.job.game,job=advanceHighSchoolGame(pending.job,1000-plateAppearances,20-completedInnings);
   progress.pendingGame={leagueKey:pending.leagueKey,job};
   plateAppearances+=job.game.playCursor-before.playCursor;completedInnings+=job.game.completedInnings-before.completedInnings;
   if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');
   if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
   const world=createKboCompetitionGameWorld(career.world,pending.leagueKey,career.protagonistKey),scheduled=schedulesOf(career)[pending.leagueKey].find(g=>g.simulationKey===job.game.input.simulationKey)!;
   const committed=commitSchoolCompetitionGame(world,career.records,job,scheduled);
   // Merge only the books this game touched so another league's earlier XP is never rolled back (M2-AU condition 2).
   for(const key of Object.keys(job.game.pitchDevelopment!.players)){
    if(!Object.hasOwn(career.world.repertoires,key))throw new RangeError('UNREGISTERED_GAME_PITCHER');
    career.world.repertoires[key]=structuredClone(committed.world.repertoires[key]!);
   }
   career.records=committed.records;progress.pendingGame=null;
   if(pendingQueue(career,day).length>0)continue;
  }
  const closed=closeKboCompetitionDay(career.world,schedulesOf(career),career.protagonistKey,career.records,career.health,career.days!,day);
  career.world=closed.world;career.health=closed.health;career.days=closed.days;progress.nextWorldDay=day+1;daysClosed++;
  career.traits=refreshCareerTraits(career,day,LEAGUES);
  // Like school careers, a change to my own player's health stops progress so the player can react before the next day.
  if(closed.result.injured.includes(career.protagonistKey) || closed.result.recovered.includes(career.protagonistKey)){
   if(progress.nextWorldDay>last){career.phaseContext={phase:'SEASON_REVIEW'};return finish('SEASON_REVIEW');}
   return finish('HEALTH_CHANGE');
  }
 }
 if(progress.nextWorldDay>last && !progress.pendingGame){career.phaseContext={phase:'SEASON_REVIEW'};return finish('SEASON_REVIEW');}
 return finish(daysClosed>=maxDays?'DAY_CLOSED':'CHUNK_LIMIT');
}

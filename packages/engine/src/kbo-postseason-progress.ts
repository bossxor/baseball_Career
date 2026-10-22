import {settleKboReturnConditionDay} from './kbo-return-condition.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboPendingGame} from './kbo-progress.js';
import {kboGameContext} from './kbo-progress.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from './high-school-game.js';
import {createKboCompetitionGameWorld} from './kbo-game-world.js';
import {closeKboCompetitionDay} from './kbo-day.js';
import {leagueStandings} from './standings.js';
import {createKboPostseason,nextKboPostseasonGame,recordKboPostseasonGame} from './kbo-postseason.js';
import type {KboPostseason} from './kbo-postseason.js';
import type {ScheduledGame} from './schedule.js';
import {refreshCareerTraits} from './high-school-traits.js';

export type KboPostseasonPhase={phase:'POSTSEASON_PROGRESS';postseason:KboPostseason;nextWorldDay:number;pendingGame:KboPendingGame|null};
export type KboPostseasonStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'|'HEALTH_CHANGE'|'POSTSEASON_COMPLETE';
const ROUNDS=['WILD_CARD','SEMI_PLAYOFF','PLAYOFF','KOREAN_SERIES'];

/** SEASON_REVIEW → POSTSEASON_PROGRESS once per season: seeds are the final KBO regular-season ranks 1..5 (01 tie-breaks). */
export function startKboPostseason(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.postseason || source.seasonClose || !source.days || !source.competitionSchedule)throw new RangeError('KBO_POSTSEASON_NOT_READY');
 const season=source.world.seasonKey,clubs=source.world.clubs.map(c=>c.id);
 const standings=leagueStandings(source.records,{seasonKey:season,leagueKey:'KBO',phase:'REGULAR'},clubs,source.world.seed,source.world.worldKey);
 const career=structuredClone(source),last=source.days.days.at(-1)!.day;
 career.phaseContext={phase:'POSTSEASON_PROGRESS',postseason:createKboPostseason(season,standings.slice(0,5).map(s=>s.teamKey)),nextWorldDay:last+1,pendingGame:null};
 career.revision++;return career;
}
function scheduledFor(career:KboCareer,phase:KboPostseasonPhase):ScheduledGame {
 const next=nextKboPostseasonGame(phase.postseason)!,round=ROUNDS.indexOf(next.round);
 return {simulationKey:JSON.stringify([career.world.seasonKey,'KBO','POSTSEASON',next.round,next.gameNumber]),leagueKey:'KBO',seasonKey:career.world.seasonKey,round:round*10+next.gameNumber,worldDay:phase.nextWorldDay,awayTeamKey:next.awayTeamKey,homeTeamKey:next.homeTeamKey,phase:'POSTSEASON'};
}
/** One postseason game per world day. Safe chunks and JSON resume like the regular season; the day closes for every
 * club player (fatigue/rest once) with only the two playing first teams settling team-game health. */
export function advanceKboPostseason(source:KboCareer,expectedRevision:number):{career:KboCareer;stopReason:KboPostseasonStop} {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='POSTSEASON_PROGRESS' || !source.days)throw new RangeError('INVALID_CAREER_PHASE');
 const career=structuredClone(source),phase=career.phaseContext as KboPostseasonPhase;
 const finish=(stopReason:KboPostseasonStop)=>{career.revision++;return {career,stopReason};};
 if(!nextKboPostseasonGame(phase.postseason)){career.postseason=phase.postseason;career.phaseContext={phase:'SEASON_REVIEW'};return finish('POSTSEASON_COMPLETE');}
 const scheduled=scheduledFor(career,phase);
 if(!phase.pendingGame){
  const world=createKboCompetitionGameWorld(career.world,'KBO',career.protagonistKey,career.sangmu);
  phase.pendingGame={leagueKey:'KBO',job:prepareSchoolCompetitionGame(world,career.records,scheduled,kboGameContext(career,'KBO'))};
 }
 if(phase.pendingGame.job.game.input.simulationKey!==scheduled.simulationKey || phase.pendingGame.job.worldDay!==scheduled.worldDay)throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
 const job=advanceHighSchoolGame(phase.pendingGame.job,1000,20);phase.pendingGame={leagueKey:'KBO',job};
 if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');
 if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
 const world=createKboCompetitionGameWorld(career.world,'KBO',career.protagonistKey,career.sangmu),committed=commitSchoolCompetitionGame(world,career.records,job,scheduled);
 for(const key of Object.keys(job.game.pitchDevelopment!.players))career.world.repertoires[key]=structuredClone(committed.world.repertoires[key]!);
 career.records=committed.records;phase.pendingGame=null;
 const line=career.records.games[scheduled.simulationKey]!.teams,winner=line[scheduled.homeTeamKey]!.W>0?scheduled.homeTeamKey:line[scheduled.awayTeamKey]!.W>0?scheduled.awayTeamKey:null;
 if(!winner)throw new RangeError('POSTSEASON_GAME_WITHOUT_WINNER');
 const closed=closeKboCompetitionDay(career.world,{KBO:[scheduled],FUTURES:[]},career.protagonistKey,career.records,career.health,career.days!,scheduled.worldDay,career.sangmu);
 career.world=closed.world;career.health=closed.health;career.days=closed.days;if(closed.sangmu)career.sangmu=closed.sangmu;settleKboReturnConditionDay(career,scheduled.worldDay);
 phase.postseason=recordKboPostseasonGame(phase.postseason,winner);phase.nextWorldDay=scheduled.worldDay+1;
 // Same day-close hooks as the regular season: trait unlocks (PS records count for T06) and my health stop.
 career.traits=refreshCareerTraits(career,scheduled.worldDay,['KBO']);
 const healthChanged=closed.result.injured.includes(career.protagonistKey) || closed.result.recovered.includes(career.protagonistKey);
 if(!nextKboPostseasonGame(phase.postseason)){career.postseason=phase.postseason;career.phaseContext={phase:'SEASON_REVIEW'};return finish('POSTSEASON_COMPLETE');}
 return finish(healthChanged?'HEALTH_CHANGE':'GAME_FINAL');
}

import {refreshCareerSeasonGoals} from './season-goals.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsPendingGame} from './us-season.js';
import {assertUsSeason,usCompetitionGameWorld,usGameContext,US_LEVELS,cloneUsCareerForGames} from './us-season.js';
import {auditUsClosedDays} from './us-growth.js';
import {createMlbPostseason,nextMlbPostseasonGame,recordMlbPostseasonGame,assertMlbPostseason} from './us-postseason.js';
import type {MlbPostseason,MlbLeague} from './us-postseason.js';
import {leagueStandings} from './standings.js';
import {canonicalJson} from './game.js';
import type {ScheduledGame} from './schedule.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from './high-school-game.js';
import {prepareUsRosters} from './us-roster-repair.js';
import {appearanceFatigue} from './lineup.js';
import {settleTeamGameHealth} from './health.js';
import {planEmergencyRoster} from './emergency-roster.js';
import {refreshCareerTraits} from './high-school-traits.js';

export interface UsPostseasonPhase {phase:'POSTSEASON_PROGRESS';bracket:MlbPostseason;conferences:Record<MlbLeague,string[]>;nextWorldDay:number;gameEvidence:string[];pendingGame:UsPendingGame|null}
export type UsPostseasonStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'GAME_FINAL'|'HEALTH_CHANGE'|'POSTSEASON_COMPLETE'|'ROSTER_DECISION_REQUIRED';
const gameKey=(season:string,id:string,n:number)=>JSON.stringify([season,'MLB','POSTSEASON',id,n]);
function seeding(c:UsCareer,conferences:Record<MlbLeague,readonly string[]>){
 const ids=c.world.organizations.map(o=>o.id),all=[...conferences.AL,...conferences.NL];
 if(conferences.AL.length!==15||conferences.NL.length!==15||new Set(all).size!==30||all.some(k=>!ids.includes(k)))throw new RangeError('INVALID_MLB_CONFERENCES');
 const scope={seasonKey:c.world.seasonKey,leagueKey:'MLB',phase:'REGULAR' as const};
 const seeds={AL:leagueStandings(c.records,scope,conferences.AL,c.world.seed,c.world.worldKey,ids).slice(0,6).map(r=>r.teamKey),NL:leagueStandings(c.records,scope,conferences.NL,c.world.seed,c.world.worldKey,ids).slice(0,6).map(r=>r.teamKey)},qualified=[...seeds.AL,...seeds.NL];
 const priority=leagueStandings(c.records,scope,ids,c.world.seed,c.world.worldKey).map(r=>r.teamKey).filter(k=>qualified.includes(k));return {seeds,priority};
}
/** Internal server registry supplies the fixed AL/NL membership; no user-selected bracket or playoff reroll. */
export function startUsPostseason(c:UsCareer,revision:number,conferences:Record<MlbLeague,readonly string[]>):UsCareer {
 assertUsSeason(c,revision);if(c.phaseContext.phase!=='SEASON_REVIEW'||c.postseason||c.season!.days.length!==c.season!.lastDay-c.season!.firstDay+1||c.events.some(e=>e.status==='OPEN'))throw new RangeError('US_POSTSEASON_NOT_READY');auditUsClosedDays(c);
 const {seeds,priority}=seeding(c,conferences),next:UsCareer={...c};next.phaseContext={phase:'POSTSEASON_PROGRESS',bracket:createMlbPostseason(c.world.seasonKey,seeds,priority),conferences:{AL:[...conferences.AL],NL:[...conferences.NL]},nextWorldDay:c.season!.lastDay+1,gameEvidence:[],pendingGame:null};next.revision++;return refreshCareerSeasonGoals(next);
}
function assertProgress(c:UsCareer,p:UsPostseasonPhase){
 assertMlbPostseason(p.bracket);const {seeds,priority}=seeding(c,p.conferences);
 if(p.gameEvidence.length!==p.bracket.results.length||p.bracket.seasonKey!==c.world.seasonKey||canonicalJson(p.bracket.seeds)!==canonicalJson(seeds)||canonicalJson(p.bracket.worldSeriesPriority)!==canonicalJson(priority)||p.nextWorldDay!==c.season!.lastDay+1+p.bracket.results.length)throw new RangeError('CHANGED_US_POSTSEASON');
 const expected=new Set<string>();for(const [i,g]of p.bracket.results.entries()){const key=gameKey(c.world.seasonKey,g.seriesId,g.gameNumber),r=c.records.games[key];expected.add(key);if(!r||r.worldDay!==c.season!.lastDay+1+i||r.scope.seasonKey!==c.world.seasonKey||r.scope.leagueKey!=='MLB'||r.scope.phase!=='POSTSEASON'||Object.keys(r.teams).length!==2||r.teams[g.winner]?.W!==1||r.teams[g.winner===g.homeTeamKey?g.awayTeamKey:g.homeTeamKey]?.L!==1)throw new RangeError('MISSING_US_POSTSEASON_RESULT');if(p.gameEvidence[i]!==canonicalJson(r))throw new RangeError('CHANGED_US_POSTSEASON_EVIDENCE');}
 if(Object.values(c.records.games).some(r=>r.scope.seasonKey===c.world.seasonKey&&r.scope.leagueKey==='MLB'&&r.scope.phase==='POSTSEASON'&&!expected.has(r.gameKey)))throw new RangeError('UNREGISTERED_US_POSTSEASON_GAME');
}
function closeGameDay(c:UsCareer,g:ScheduledGame){
 const row=c.records.games[g.simulationKey]!,played=new Map<string,'HITTER'|'STARTER'|'RELIEF'>();
 for(const key of Object.keys(row.batting))played.set(key,'HITTER');for(const[key,line]of Object.entries(row.pitching)){if(played.has(key))throw new RangeError('DOUBLE_BOOKED_US_PLAYER');played.set(key,line.starts?'STARTER':'RELIEF');}
 for(const key of Object.keys(c.world.players))c.world.players[key]=appearanceFatigue(c.world.players[key]!,played.get(key)??'NONE');
 const injured:string[]=[],recovered:string[]=[];
 for(const id of [g.awayTeamKey,g.homeTeamKey].sort()){const org=c.world.organizations.find(o=>o.id===id)!,reserve=Object.values(c.season!.emergency?.entries??{}).filter(e=>e.clubId===id&&e.level==='MLB'&&e.releasedDay===null).map(e=>e.replacedKey),roster=[...org.levels.MLB,...reserve],result=settleTeamGameHealth(c.health,{gameKey:g.simulationKey,teamKey:'MLB:'+id,seasonKey:c.world.seasonKey,day:g.worldDay,roster,appearances:roster.filter(k=>played.has(k)).map(playerKey=>({playerKey,riskFatigue:c.world.players[playerKey]!.fatigue}))});c.health=result.ledger;injured.push(...result.result.injured);recovered.push(...result.result.recovered);}
 if(played.has(c.protagonistKey)&&!c.season!.firstAppearance.MLB)c.season!.firstAppearance.MLB={gameKey:g.simulationKey,day:g.worldDay};
 c.traits=refreshCareerTraits(c,g.worldDay,US_LEVELS);return injured.includes(c.protagonistKey)||recovered.includes(c.protagonistKey);
}
/** One official playoff game per date, bounded to the existing worker limit; regular payroll/growth is not paid twice. */
export function advanceUsPostseason(c:UsCareer,revision:number):{career:UsCareer;stopReason:UsPostseasonStop} {
 assertUsSeason(c,revision);if(c.phaseContext.phase!=='POSTSEASON_PROGRESS'||c.postseason)throw new RangeError('INVALID_CAREER_PHASE');assertProgress(c,c.phaseContext);
 const next=cloneUsCareerForGames(c),phase=next.phaseContext as UsPostseasonPhase,game=nextMlbPostseasonGame(phase.bracket),finish=(stopReason:UsPostseasonStop)=>{next.revision++;return {career:refreshCareerSeasonGoals(next),stopReason};};
 if(!game){next.postseason={bracket:phase.bracket,conferences:phase.conferences,gameEvidence:phase.gameEvidence};next.phaseContext={phase:'SEASON_REVIEW'};return finish('POSTSEASON_COMPLETE');}
 const scheduled:ScheduledGame={simulationKey:gameKey(next.world.seasonKey,game.seriesId,game.gameNumber),leagueKey:'MLB',seasonKey:next.world.seasonKey,phase:'POSTSEASON',round:phase.bracket.results.length,worldDay:phase.nextWorldDay,homeTeamKey:game.homeTeamKey,awayTeamKey:game.awayTeamKey};
 if(!phase.pendingGame){prepareUsRosters(next,phase.nextWorldDay);const world=usCompetitionGameWorld(next,'MLB',scheduled);for(const club of world.schools){const needs=planEmergencyRoster(club.roster.map(key=>({player:world.players[key]!,available:!Object.hasOwn(next.health.injuries,key),temporary:false})));if(needs.requiredHitters||needs.requiredPitchers)return finish('ROSTER_DECISION_REQUIRED');}phase.pendingGame={level:'MLB',job:prepareSchoolCompetitionGame(world,next.records,scheduled,usGameContext(next,world))};}
 const pending=phase.pendingGame;if(pending.level!=='MLB'||pending.job.worldKey!==next.world.worldKey||pending.job.seasonKey!==next.world.seasonKey||pending.job.worldDay!==scheduled.worldDay||pending.job.game.input.simulationKey!==scheduled.simulationKey)throw new RangeError('CHANGED_US_POSTSEASON_PENDING');
 const job=advanceHighSchoolGame(pending.job,1000,20);phase.pendingGame={level:'MLB',job};if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
 const world=usCompetitionGameWorld(next,'MLB',scheduled),today={...next.records,games:Object.fromEntries(Object.entries(next.records.games).filter(([,g])=>g.scope.seasonKey===next.world.seasonKey&&g.worldDay===scheduled.worldDay))},done=commitSchoolCompetitionGame(world,today,job,scheduled);for(const key of Object.keys(job.game.pitchDevelopment!.players))next.world.repertoires[key]=done.world.repertoires[key]!;next.records={revision:done.records.revision,games:{...next.records.games,...done.records.games}};
 const teams=next.records.games[scheduled.simulationKey]!.teams,winner=teams[game.homeTeamKey]!.W?game.homeTeamKey:teams[game.awayTeamKey]!.W?game.awayTeamKey:null;if(!winner)throw new RangeError('US_POSTSEASON_WITHOUT_WINNER');
 const healthChanged=closeGameDay(next,scheduled);phase.bracket=recordMlbPostseasonGame(phase.bracket,winner);phase.gameEvidence.push(canonicalJson(next.records.games[scheduled.simulationKey]));phase.pendingGame=null;phase.nextWorldDay++;
 if(phase.bracket.championKey){next.postseason={bracket:phase.bracket,conferences:phase.conferences,gameEvidence:phase.gameEvidence};next.phaseContext={phase:'SEASON_REVIEW'};return finish('POSTSEASON_COMPLETE');}
 return finish(healthChanged?'HEALTH_CHANGE':'GAME_FINAL');
}

/** Final playoff records remain sealed for growth/year-end/archive after the progress phase is gone. */
export function auditUsCompletedPostseason(c:UsCareer):void {
 assertUsCareerRevision(c,c.revision);const post=c.postseason;if(!post?.bracket.championKey)throw new RangeError('US_POSTSEASON_NOT_COMPLETE');
 assertProgress(c,{phase:'POSTSEASON_PROGRESS',bracket:post.bracket,conferences:post.conferences,gameEvidence:post.gameEvidence,nextWorldDay:c.season!.lastDay+1+post.bracket.results.length,pendingGame:null});
}

export function usPostseasonView(c:UsCareer){
 assertUsCareerRevision(c,c.revision);let bracket:MlbPostseason;
 if(c.phaseContext.phase==='POSTSEASON_PROGRESS'){assertProgress(c,c.phaseContext);bracket=c.phaseContext.bracket;}else{auditUsCompletedPostseason(c);bracket=c.postseason!.bracket;}
 const club=(key:string)=>({id:key,name:c.world.organizations.find(o=>o.id===key)!.name});
 return {seasonKey:c.world.seasonKey,status:bracket.championKey?'COMPLETE':'ACTIVE',champion:bracket.championKey?club(bracket.championKey):null,nextGame:nextMlbPostseasonGame(bracket),series:bracket.series.map(s=>({id:s.id,league:s.league,round:s.round,higherSeed:club(s.higherSeed),lowerSeed:club(s.lowerSeed),higherWins:s.higherWins,lowerWins:s.lowerWins,winsNeeded:s.winsNeeded}))};
}

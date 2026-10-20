import {prepareHighSchoolGame,advanceHighSchoolGame,commitHighSchoolGame} from './high-school-game.js';
import {closeHighSchoolDay} from './high-school-day.js';
import {reconcileSchoolEmergency} from './high-school-emergency.js';
import {recordTotals} from './records.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import {assertHighSchoolCareerRevision} from './high-school-career.js';
import type {HighSchoolCareer,HighSchoolProgressPhase,HighSchoolAdvancePlan} from './high-school-career.js';
import type {HighSchoolGameContext} from './high-school-game.js';
import type {BattingLine} from './types.js';
import {forfeitCareerTrainingEvent} from './high-school-training.js';
import {refreshOwnCareerAssessment} from './high-school-assessment.js';
import {refreshCareerTraits} from './high-school-traits.js';
export type SchoolProgressStop='CHUNK_LIMIT'|'ENGINE_LIMIT'|'ONE_GAME'|'ONE_WEEK'|'MAJOR_EVENT'|'HEALTH_CHANGE'|'SEASON_REVIEW';
export interface SchoolProgressResult {career:HighSchoolCareer;stopReason:SchoolProgressStop;plateAppearances:number;completedInnings:number;healthChanges:{injured:boolean;recovered:boolean}|null}
function teamGames(state:HighSchoolCareer):number {return Object.values(state.records.games).filter(g=>g.scope.seasonKey===state.world.seasonKey && g.scope.leagueKey==='HS' && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,state.world.protagonistSchoolId)).length;}
/** Server-internal world AI context; never returned to clients. */
export function highSchoolGameContext(state:HighSchoolCareer):HighSchoolGameContext {
 const total=recordTotals(state.records,{leagueKey:'HS',phase:'REGULAR',seasonKey:state.world.seasonKey});
 const starters:Record<string,string>=Object.create(null) as Record<string,string>,recentBatting:Record<string,BattingLine>=Object.create(null) as Record<string,BattingLine>;
 for(const school of state.world.schools){
  const available=school.roster.filter(k=>state.world.players[k]!.kind==='PITCHER' && !Object.hasOwn(state.health.injuries,k)).sort();
  const rotation=available.filter(k=>state.world.players[k]!.position==='SP'),pool=rotation.length?rotation:available;
  if(pool.length===0)throw new RangeError('NO_HEALTHY_SCHOOL_PITCHER');starters[school.id]=pool[(total.teams[school.id]?.games??0)%pool.length]!;
  const games=Object.values(state.records.games).filter(g=>g.scope.seasonKey===state.world.seasonKey && g.scope.leagueKey==='HS' && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,school.id)).sort((a,b)=>a.worldDay-b.worldDay);
  const review=Math.floor(games.length/20)*20,reviewGames=new Set(games.slice(Math.max(0,review-20),review).map(g=>g.gameKey));
  const reviewed=recordTotals({...state.records,games:Object.fromEntries(Object.entries(state.records.games).filter(([key])=>reviewGames.has(key)))},{leagueKey:'HS',phase:'REGULAR',seasonKey:state.world.seasonKey});
  for(const key of school.roster)if(Object.hasOwn(reviewed.batting,key))recentBatting[key]=reviewed.batting[key]!;
 }
 return {difficulty:state.difficulty,unavailableKeys:Object.keys(state.health.injuries),starters,recentBatting,recentPitchingOuts:Object.fromEntries(Object.entries(total.pitching).map(([key,p])=>[key,p.outs])),traits:state.traits?.owned??{},approaches:{}};
}
/** Bounded server worker. A plan survives safe chunks; a fresh click never redraws a pending game. */
export function advanceHighSchoolCareer(source:HighSchoolCareer,expectedRevision:number,mode?:HighSchoolAdvancePlan['mode']):SchoolProgressResult {
 assertHighSchoolCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_PROGRESS' || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_CAREER_PHASE');
 if(mode!==undefined && !['NEXT_MAJOR_EVENT','ONE_GAME','ONE_WEEK'].includes(mode))throw new RangeError('INVALID_ADVANCE_MODE');
 const career=structuredClone(source),progress=career.phaseContext as HighSchoolProgressPhase;
 const current=progress.advancePlan;if(current && mode!==undefined && current.mode!==mode)throw new RangeError('ADVANCE_PLAN_ACTIVE');
 const firstDay=Math.min(...career.world.schedule.map(g=>g.worldDay));
 if(!Number.isSafeInteger(progress.nextWorldDay) || progress.nextWorldDay<firstDay || current && (!['NEXT_MAJOR_EVENT','ONE_GAME','ONE_WEEK'].includes(current.mode) || !Number.isSafeInteger(current.startWorldDay) || current.startWorldDay<firstDay || current.startWorldDay>progress.nextWorldDay || !Number.isSafeInteger(current.startTeamGames) || current.startTeamGames<0 || current.startTeamGames>teamGames(career)))throw new RangeError('INVALID_ADVANCE_PLAN');
 if(progress.pendingGame && (progress.pendingGame.worldKey!==career.world.worldKey || progress.pendingGame.seasonKey!==career.world.seasonKey || progress.pendingGame.worldDay!==progress.nextWorldDay))throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
 const plan=current??{mode:mode??'NEXT_MAJOR_EVENT',startWorldDay:progress.nextWorldDay,startTeamGames:teamGames(career)};progress.advancePlan=plan;
 let plateAppearances=0,completedInnings=0;const initialTeamGames=teamGames(career),lastDay=Math.max(...career.world.schedule.map(g=>g.worldDay));
 const finish=(stopReason:SchoolProgressStop,healthChanges:SchoolProgressResult['healthChanges']=null):SchoolProgressResult=>{if(stopReason!=='CHUNK_LIMIT' && stopReason!=='ENGINE_LIMIT')progress.advancePlan=null;career.revision++;return {career,stopReason,plateAppearances,completedInnings,healthChanges};};
 while(plateAppearances<1000 && completedInnings<20 && teamGames(career)-initialTeamGames<6){
  const day=progress.nextWorldDay;
  if(day>lastDay){career.phaseContext={phase:'SEASON_REVIEW'};return finish('SEASON_REVIEW');}
  if(!progress.pendingGame){
   const pending=career.world.schedule.filter(g=>g.worldDay===day && !Object.hasOwn(career.records.games,g.simulationKey)).sort((a,b)=>a.simulationKey<b.simulationKey?-1:1)[0];
   if(pending){
    const emergency=reconcileSchoolEmergency(career.world,career.health,career.emergency,day,career.difficulty);career.world=emergency.world;career.emergency=emergency.registry;
    progress.pendingGame=prepareHighSchoolGame(career.world,career.records,pending.simulationKey,highSchoolGameContext(career));
   }
  }
  if(progress.pendingGame){
   const before=progress.pendingGame.game,job=advanceHighSchoolGame(progress.pendingGame,1000-plateAppearances,20-completedInnings);progress.pendingGame=job;
   plateAppearances+=job.game.playCursor-before.playCursor;completedInnings+=job.game.completedInnings-before.completedInnings;
   if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');
   if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
   const committed=commitHighSchoolGame(career.world,career.records,job);career.world=committed.world;career.records=committed.records;progress.pendingGame=null;
   if(career.world.schedule.some(g=>g.worldDay===day && !Object.hasOwn(career.records.games,g.simulationKey)))continue;
  }
  const closed=closeHighSchoolDay(career.world,career.records,career.health,career.days,day);career.world=closed.world;career.health=closed.health;career.days=closed.days;progress.nextWorldDay=day+1;career.ownAssessment=refreshOwnCareerAssessment(career);career.traits=refreshCareerTraits(career,day);
  const player=career.world.players[career.world.protagonistKey]!,count=teamGames(career);
  const healthChanges={injured:closed.result.injured.includes(player.simulationKey),recovered:closed.result.recovered.includes(player.simulationKey)};
  const healthy=!Object.hasOwn(career.health.injuries,player.simulationKey);
  const definitionId=count>=12 && !career.events.some(e=>e.definitionId===(player.kind==='HITTER'?'E02':'E03'))?(player.kind==='HITTER'?'E02':'E03'):count>=16 && healthy && !career.events.some(e=>e.definitionId==='E43')?'E43':count>=24 && healthy && !career.events.some(e=>e.definitionId==='E41')?'E41':null;
  if(definitionId){
   progress.advancePlan=null;
   const start=definitionId==='E02' || definitionId==='E03',definition=eventDefinition(definitionId);
   const event=createWorldEvent({definitionId,worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:start?{careerSimulationKey:player.simulationKey}:{playerOrTeamSimulationKey:player.simulationKey,worldSeasonId:career.world.seasonKey,windowType:definitionId==='E43'?'TRAINING':'MID'}},resume:{worldKey:career.world.worldKey,seasonKey:career.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'HS',registrationKey:career.world.protagonistSchoolId,sourceRevision:career.revision+1},sourceSequence:career.events.length+1,worldDay:day});
   career.events=[...career.events,event];career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:structuredClone(progress)};return finish('MAJOR_EVENT',healthChanges);
  }
  if(healthChanges.injured || healthChanges.recovered)return finish('HEALTH_CHANGE',healthChanges);
  if(progress.nextWorldDay>lastDay){career.phaseContext={phase:'SEASON_REVIEW'};return finish('SEASON_REVIEW');}
  if(plan.mode==='ONE_GAME' && count>plan.startTeamGames)return finish('ONE_GAME');
  if(plan.mode==='ONE_WEEK' && progress.nextWorldDay>=plan.startWorldDay+7)return finish('ONE_WEEK');
 }
 return finish('CHUNK_LIMIT');
}
/** Safe pause preserves any pending game's exact RNG/cursor, and permits a new speed on resume. */
export function pauseHighSchoolCareer(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);if(source.phaseContext.phase!=='SEASON_PROGRESS')throw new RangeError('INVALID_CAREER_PHASE');
 const career=structuredClone(source);(career.phaseContext as HighSchoolProgressPhase).advancePlan=null;career.revision++;return career;
}
/** Window navigation does not apply training/style. Their domain commands remain separate. */
export function resolveCareerWindowEvent(source:HighSchoolCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}):{career:HighSchoolCareer;navigation:{targetScreen:string;sourceEventKey:string}|null} {
 assertHighSchoolCareerRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==input.eventKey || phase.resume.phase!=='SEASON_PROGRESS')throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || !['E41','E43'].includes(event.definitionId))throw new RangeError('INVALID_CAREER_WINDOW');
 if(event.definitionId==='E43' && input.command==='FORFEIT_TRAINING')return {career:forfeitCareerTrainingEvent(source,expectedRevision,input.eventVersion),navigation:null};
 const eligible=event.definitionId==='E41'?['OPEN_STYLE','ACK_EVENT']:['OPEN_TRAINING','DEFER_TRAINING'];
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:eligible};
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,context);
 const resolved=selected.domain?completeEventDomain(event,selected.domain,JSON.stringify(['career-defer',source.world.worldKey,source.revision+1]),context):selected.event;
 const career=structuredClone(source);career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.phaseContext=structuredClone(phase.resume);career.revision++;return {career,navigation:selected.navigation};
}

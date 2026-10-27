import type {UsCareer} from './us-career-entry.js';
import type {UsProgress} from './us-season.js';
import {assertUsCareerRevision as assertCareerRevision} from './us-career-entry.js';
import {archetypeFor} from './player.js';
import {trainingPreview,applySeasonTraining} from './training.js';
import type {TrainingChoice,TrainingContext} from './training.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import type {UsLevel} from './us-world.js';

import {US_SEASON_GAMES} from './us-schedule.js';
export function usProtagonistLeague(c:UsCareer):UsLevel {return c.registration.level;}
export function usTeamGames(c:UsCareer):number {return Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.leagueKey===c.registration.level&&g.scope.phase==='REGULAR'&&Object.hasOwn(g.teams,c.protagonistOrganizationId)).length;}
function scheduledTeamGames(c:UsCareer):number{return US_SEASON_GAMES[c.registration.level];}
function idle(career:UsCareer):void {
 const phase=career.phaseContext;
 if(phase.phase!=='SEASON_PROGRESS' && phase.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_CAREER_PHASE');
 if(phase.phase==='SEASON_PROGRESS' && (phase.pendingGame || Object.values(career.records.games).some(g=>g.scope.seasonKey===career.world.seasonKey && g.worldDay>=phase.nextWorldDay && ['ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey))))throw new RangeError('CAREER_DAY_IN_PROGRESS');
}
function trainingContext(career:UsCareer):TrainingContext {
 return {seasonId:career.world.seasonKey,completedTeamGames:usTeamGames(career),scheduledTeamGames:scheduledTeamGames(career),injured:Object.hasOwn(career.health.injuries,career.protagonistKey),windowOpen:true,careerCheat:career.difficulty==='SECRET_CHEAT'};
}
export function previewUsTraining(source:UsCareer,choice:TrainingChoice) {
 idle(source);return trainingPreview(source.world.players[source.protagonistKey]!,source.development.trainingUsedSeasons,choice,trainingContext(source));
}
export function applyUsSeasonTraining(source:UsCareer,choice:TrainingChoice):UsCareer {
 const ledger=source.development,before=source.world.players[source.protagonistKey]!;
 const result=applySeasonTraining(before,ledger.trainingUsedSeasons,choice,trainingContext(source),ledger.trainingRng),career=structuredClone(source);
 career.world.players[career.protagonistKey]=result.player;
 career.development={...structuredClone(ledger),trainingUsedSeasons:result.usedSeasons,trainingRng:result.state,trainingResults:[...ledger.trainingResults,{seasonKey:source.world.seasonKey,choice:structuredClone(choice),success:result.success,gainUnits:result.gainUnits,fatigueBefore:before.fatigue,fatigueAfter:result.player.fatigue,receiptKey:JSON.stringify(['us-training',source.world.worldKey,source.world.seasonKey])}]};
 return career;
}
/** Once per world season; availability and the current level one-third window come only from saved state (training.ts). */
export function trainUsCareer(source:UsCareer,expectedRevision:number,choice:TrainingChoice):UsCareer {
 assertCareerRevision(source,expectedRevision);idle(source);
 const career=applyUsSeasonTraining(source,choice);career.revision++;return career;
}
/** MID style change: one change per world season after 72 team games while healthy; ability values do not change. */
export function changeUsMidseasonArchetype(source:UsCareer,expectedRevision:number,archetype:string):UsCareer {
 assertCareerRevision(source,expectedRevision);idle(source);
 if(source.phaseContext.phase!=='SEASON_PROGRESS' || usTeamGames(source)<Math.ceil(scheduledTeamGames(source)/2) || Object.hasOwn(source.health.injuries,source.protagonistKey))throw new RangeError('STYLE_WINDOW_CLOSED');
 const player=source.world.players[source.protagonistKey]!;archetypeFor(player.kind,archetype);const window=JSON.stringify([source.world.seasonKey,'MID']);
 if(player.archetype!==archetype && source.styleUsedWindows.includes(window))throw new RangeError('STYLE_WINDOW_USED');
 const career=structuredClone(source);career.world.players[player.simulationKey]={...career.world.players[player.simulationKey]!,archetype};
 if(player.archetype!==archetype)career.styleUsedWindows=[...career.styleUsedWindows,window];
 const count=usTeamGames(source);career.planHistory=[...career.planHistory.filter(p=>p.completedTeamGames!==count),{completedTeamGames:count,focus:[...player.focus],archetype}];
 if(player.archetype!==archetype && career.season && source.phaseContext.phase==='SEASON_PROGRESS'){const effectiveDay=source.phaseContext.nextWorldDay;career.season.planChanges=[...(career.season.planChanges??[]).filter(p=>p.effectiveDay!==effectiveDay),{effectiveDay,focus:[...player.focus],archetype}];}career.revision++;return career;
}

/** After a pro day close: the first eligible window event (E43 then E41) for this season, or null. */
export function raiseUsWindowEvent(source:UsCareer,day:number,progress:UsProgress):UsCareer|null {
 const count=usTeamGames(source),healthy=!Object.hasOwn(source.health.injuries,source.protagonistKey),season=source.world.seasonKey;
 const has=(id:string)=>source.events.some(e=>e.definitionId===id && e.seasonKey===season);
 const definitionId=count>=Math.ceil(scheduledTeamGames(source)/3) && healthy && !has('E43') && !source.development.trainingUsedSeasons.includes(season)?'E43':count>=Math.ceil(scheduledTeamGames(source)/2) && healthy && !has('E41')?'E41':null;
 if(!definitionId)return null;
 const definition=eventDefinition(definitionId),career=structuredClone(source);
 const event=createWorldEvent({definitionId,worldKey:career.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerOrTeamSimulationKey:career.protagonistKey,worldSeasonId:season,windowType:definitionId==='E43'?'TRAINING':'MID'}},
  resume:{worldKey:career.world.worldKey,seasonKey:season,phase:'SEASON_PROGRESS',competitionKey:usProtagonistLeague(career),registrationKey:career.protagonistOrganizationId,sourceRevision:career.revision+1},sourceSequence:career.events.length+1,worldDay:day});
 career.events=[...career.events,event];
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{...structuredClone(progress),pendingGame:null}};
 return career;
}
/** E41: OPEN_STYLE (S22) or ACK_EVENT. E43: OPEN_TRAINING (S23), DEFER_TRAINING, or FORFEIT_TRAINING (uses the season chance with no gain). */
export function resolveUsWindowEvent(source:UsCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertCareerRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || !['E41','E43'].includes(event.definitionId))throw new RangeError('INVALID_CAREER_WINDOW');
 const eligible=event.definitionId==='E41'?['OPEN_STYLE','ACK_EVENT']:['OPEN_TRAINING','DEFER_TRAINING','FORFEIT_TRAINING'];
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:eligible};
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,context);
 let career=input.command==='FORFEIT_TRAINING'?applyUsSeasonTraining({...source,phaseContext:phase.resume},{type:'SKIP'}):structuredClone(source);
 const resolved=selected.domain?completeEventDomain(event,selected.domain,JSON.stringify(['us-window',source.world.worldKey,input.command,source.revision+1]),context):selected.event;
 career={...career,events:career.events.map(e=>e.eventKey===event.eventKey?resolved:e),phaseContext:structuredClone(phase.resume)};career.revision=source.revision+1;
 return {career,navigation:selected.navigation};
}

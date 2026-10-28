import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import {kboMilitaryRegisteredGames,kboMilitaryScheduledGames} from './kbo-military-growth.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboSeasonProgress} from './kbo-progress.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {archetypeFor} from './player.js';
import {trainingPreview,applySeasonTraining} from './training.js';
import type {TrainingChoice,TrainingContext} from './training.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain,eventDefinition} from './events.js';
import type {KboLeagueKey} from './kbo-day.js';
import {currentKboSeasonTransfers} from './kbo-transfer-registration.js';

/** 14: pro seasons open special training at 48 team games and the style review at 72 (school uses 16/24 of 48). */
export const KBO_TRAINING_GAMES=48,KBO_STYLE_GAMES=72;

/** My registered league: the first team plays KBO, everyone else on the club plays FUTURES. */
export function protagonistLeague(career:KboCareer):KboLeagueKey {
 const club=career.world.clubs.find(c=>c.id===career.protagonistClubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 return club.firstTeam.includes(career.protagonistKey)?'KBO':'FUTURES';
}
/** Legacy team games; transferred careers follow actual season registrations across clubs and leagues. */
export function kboTeamGames(career:KboCareer):number {
 const military=kboMilitaryRegisteredGames(career);if(military)return military.length;
 const league=protagonistLeague(career);
 return Object.values(career.records.games).filter(g=>g.scope.leagueKey===league && g.scope.seasonKey===career.world.seasonKey && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,career.protagonistClubId)).length;
}
function scheduledTeamGames(career:KboCareer):number {
 const military=kboMilitaryScheduledGames(career);if(military!==null)return military;
 const league=protagonistLeague(career);
 return career.competitionSchedule!.leagues[league].filter(g=>g.awayTeamKey===career.protagonistClubId || g.homeTeamKey===career.protagonistClubId).length;
}
function idle(career:KboCareer):void {
 const phase=career.phaseContext;
 if(phase.phase!=='SEASON_PROGRESS' && phase.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_CAREER_PHASE');
 if(phase.phase==='SEASON_PROGRESS' && phase.pendingGame)throw new RangeError('CAREER_DAY_IN_PROGRESS');
}
function trainingContext(career:KboCareer):TrainingContext {
 if(kboActiveContractSuspended(career.world.contracts[career.protagonistKey]!))throw new RangeError('ACTIVE_SERVICE_TRAINING_UNAVAILABLE');
 return {seasonId:career.world.seasonKey,completedTeamGames:kboTeamGames(career),scheduledTeamGames:scheduledTeamGames(career),injured:Object.hasOwn(career.health.injuries,career.protagonistKey),windowOpen:true,careerCheat:career.difficulty==='SECRET_CHEAT'};
}
export function previewKboTraining(source:KboCareer,choice:TrainingChoice) {
 idle(source);return trainingPreview(source.world.players[source.protagonistKey]!,source.development.trainingUsedSeasons,choice,trainingContext(source));
}
function applyTraining(source:KboCareer,choice:TrainingChoice):KboCareer {
 const ledger=source.development,before=source.world.players[source.protagonistKey]!;
 const result=applySeasonTraining(before,ledger.trainingUsedSeasons,choice,trainingContext(source),ledger.trainingRng),career=structuredClone(source);
 career.world.players[career.protagonistKey]=result.player;
 career.development={...structuredClone(ledger),trainingUsedSeasons:result.usedSeasons,trainingRng:result.state,trainingResults:[...ledger.trainingResults,{seasonKey:source.world.seasonKey,choice:structuredClone(choice),success:result.success,gainUnits:result.gainUnits,fatigueBefore:before.fatigue,fatigueAfter:result.player.fatigue,receiptKey:JSON.stringify(['kbo-training',source.world.worldKey,source.world.seasonKey])}]};
 return career;
}
/** Once per world season; availability and the 48-game window come only from saved state (training.ts). */
export function trainKboCareer(source:KboCareer,expectedRevision:number,choice:TrainingChoice):KboCareer {
 assertCareerRevision(source,expectedRevision);idle(source);
 const career=applyTraining(source,choice);career.revision++;return career;
}
/** MID style change: one change per world season after 72 team games while healthy; ability values do not change. */
export function changeKboMidseasonArchetype(source:KboCareer,expectedRevision:number,archetype:string):KboCareer {
 assertCareerRevision(source,expectedRevision);idle(source);
 if(source.phaseContext.phase!=='SEASON_PROGRESS' || kboTeamGames(source)<KBO_STYLE_GAMES || Object.hasOwn(source.health.injuries,source.protagonistKey))throw new RangeError('STYLE_WINDOW_CLOSED');
 const player=source.world.players[source.protagonistKey]!;archetypeFor(player.kind,archetype);const window=JSON.stringify([source.world.seasonKey,'MID']);
 if(player.archetype!==archetype && source.styleUsedWindows.includes(window))throw new RangeError('STYLE_WINDOW_USED');
 const career=structuredClone(source);career.world.players[player.simulationKey]={...career.world.players[player.simulationKey]!,archetype};
 if(player.archetype!==archetype)career.styleUsedWindows=[...career.styleUsedWindows,window];
 const count=kboTeamGames(source),frozen=currentKboSeasonTransfers(source)?.at(-1)?.planBoundaryDays;
 if(!frozen || player.archetype!==archetype)career.planHistory=[...career.planHistory.filter((p,i)=>i<(frozen?.length??0) || p.completedTeamGames!==count),{completedTeamGames:count,focus:[...player.focus],archetype}];career.revision++;return career;
}

/** After a pro day close: the first eligible window event (E43 then E41) for this season, or null. */
export function raiseKboWindowEvent(source:KboCareer,day:number,progress:KboSeasonProgress):KboCareer|null {
 const count=kboTeamGames(source),healthy=!Object.hasOwn(source.health.injuries,source.protagonistKey),season=source.world.seasonKey;
 const has=(id:string)=>source.events.some(e=>e.definitionId===id && e.seasonKey===season);
 const definitionId=count>=KBO_TRAINING_GAMES && healthy && !has('E43') && !source.development.trainingUsedSeasons.includes(season)?'E43':count>=KBO_STYLE_GAMES && healthy && !has('E41')?'E41':null;
 if(!definitionId)return null;
 const definition=eventDefinition(definitionId),career=structuredClone(source);
 const event=createWorldEvent({definitionId,worldKey:career.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerOrTeamSimulationKey:career.protagonistKey,worldSeasonId:season,windowType:definitionId==='E43'?'TRAINING':'MID'}},
  resume:{worldKey:career.world.worldKey,seasonKey:season,phase:'SEASON_PROGRESS',competitionKey:protagonistLeague(career),registrationKey:career.protagonistClubId,sourceRevision:career.revision+1},sourceSequence:career.events.length+1,worldDay:day});
 career.events=[...career.events,event];
 career.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{...structuredClone(progress),pendingGame:null}};
 return career;
}
/** E41: OPEN_STYLE (S22) or ACK_EVENT. E43: OPEN_TRAINING (S23), DEFER_TRAINING, or FORFEIT_TRAINING (uses the season chance with no gain). */
export function resolveKboWindowEvent(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}) {
 assertCareerRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.resume.phase!=='SEASON_PROGRESS' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || !['E41','E43'].includes(event.definitionId))throw new RangeError('INVALID_CAREER_WINDOW');
 const eligible=event.definitionId==='E41'?['OPEN_STYLE','ACK_EVENT']:['OPEN_TRAINING','DEFER_TRAINING','FORFEIT_TRAINING'];
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:eligible};
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,context);
 let career=input.command==='FORFEIT_TRAINING'?applyTraining({...source,phaseContext:phase.resume},{type:'SKIP'}):structuredClone(source);
 const resolved=selected.domain?completeEventDomain(event,selected.domain,JSON.stringify(['kbo-window',source.world.worldKey,input.command,source.revision+1]),context):selected.event;
 career={...career,events:career.events.map(e=>e.eventKey===event.eventKey?resolved:e),phaseContext:structuredClone(phase.resume)};career.revision=source.revision+1;
 return {career,navigation:selected.navigation};
}

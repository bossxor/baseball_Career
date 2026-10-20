import type {HighSchoolCareer} from './high-school-career.js';
import {assertHighSchoolCareerRevision} from './high-school-career.js';
import type {DevelopmentPlayer} from './player.js';
import {archetypeFor} from './player.js';
import type {RngState} from './rng.js';
import {createStreams} from './rng.js';
import {trainingPreview,applySeasonTraining} from './training.js';
import type {TrainingChoice,TrainingContext} from './training.js';
import {resolveEventChoice,completeEventDomain} from './events.js';

export interface CareerTrainingResult {seasonKey:string;choice:TrainingChoice;success:boolean;gainUnits:number;fatigueBefore:number;fatigueAfter:number;receiptKey:string}
export interface CareerDevelopmentLedger {seasonStartPlayer:DevelopmentPlayer;trainingUsedSeasons:readonly string[];trainingRng:RngState;trainingResults:readonly CareerTrainingResult[]}
function development(source:HighSchoolCareer):CareerDevelopmentLedger {
 // M2-O/P saves predate this command, so none can already have paid training.
 if(source.development)return source.development;
 const player=structuredClone(source.world.players[source.world.protagonistKey]!),initialPlan=source.planHistory[0]!;
 player.focus=[...initialPlan.focus];player.archetype=initialPlan.archetype;player.fatigue=0;
 return {seasonStartPlayer:player,trainingUsedSeasons:[],trainingResults:[],trainingRng:createStreams(source.world.seed,JSON.stringify(['hs-training',source.world.worldKey])).growth};
}
function completedTeamGames(source:HighSchoolCareer):number {return Object.values(source.records.games).filter(g=>g.scope.leagueKey==='HS' && g.scope.seasonKey===source.world.seasonKey && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,source.world.protagonistSchoolId)).length;}
function safeSetup(source:HighSchoolCareer,allowForfeitEvent=false):void {
 const phase=source.phaseContext;
 if(allowForfeitEvent && phase.phase==='EVENT_DECISION')return;
 if(phase.phase!=='SEASON_PROGRESS' && phase.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_CAREER_PHASE');
 if(phase.phase==='SEASON_PROGRESS' && (phase.pendingGame || phase.advancePlan || Object.values(source.records.games).some(g=>g.worldDay>=phase.nextWorldDay && g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey==='HS')))throw new RangeError('CAREER_DAY_IN_PROGRESS');
}
function context(source:HighSchoolCareer):TrainingContext {
 const school=source.world.protagonistSchoolId;
 return {seasonId:source.world.seasonKey,completedTeamGames:completedTeamGames(source),scheduledTeamGames:source.world.schedule.filter(g=>g.awayTeamKey===school || g.homeTeamKey===school).length,injured:Object.hasOwn(source.health.injuries,source.world.protagonistKey),windowOpen:true,careerCheat:source.difficulty==='SECRET_CHEAT'};
}
export function previewCareerTraining(source:HighSchoolCareer,choice:TrainingChoice) {
 safeSetup(source);const ledger=development(source);
 return trainingPreview(source.world.players[source.world.protagonistKey]!,ledger.trainingUsedSeasons,choice,context(source));
}
function applyTraining(source:HighSchoolCareer,choice:TrainingChoice):HighSchoolCareer {
 const ledger=development(source),result=applySeasonTraining(source.world.players[source.world.protagonistKey]!,ledger.trainingUsedSeasons,choice,context(source),ledger.trainingRng),career=structuredClone(source);
 career.world.players[career.world.protagonistKey]=result.player;
 career.development={...structuredClone(ledger),trainingUsedSeasons:result.usedSeasons,trainingRng:result.state,trainingResults:[...ledger.trainingResults,{seasonKey:source.world.seasonKey,choice:structuredClone(choice),success:result.success,gainUnits:result.gainUnits,fatigueBefore:source.world.players[source.world.protagonistKey]!.fatigue,fatigueAfter:result.player.fatigue,receiptKey:JSON.stringify(['career-training',source.world.worldKey,source.world.seasonKey,source.revision+1])}]};return career;
}
/** Policy, availability,48-game denominator and once-per-world-season usage come only from saved state. */
export function trainHighSchoolCareer(source:HighSchoolCareer,expectedRevision:number,choice:TrainingChoice):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);safeSetup(source);
 const career=applyTraining(source,choice);career.revision++;return career;
}
export function forfeitCareerTrainingEvent(source:HighSchoolCareer,expectedRevision:number,eventVersion:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);safeSetup(source,true);const phase=source.phaseContext;
 if(phase.phase!=='EVENT_DECISION' || phase.resume.phase!=='SEASON_PROGRESS')throw new RangeError('INVALID_CAREER_PHASE');
 safeSetup({...source,phaseContext:phase.resume});
 const event=source.events.find(e=>e.eventKey===phase.eventKey);if(!event || event.definitionId!=='E43')throw new RangeError('INVALID_CAREER_WINDOW');
 const eventContext={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['FORFEIT_TRAINING']};
 const choice=resolveEventChoice(event,eventVersion,'FORFEIT_TRAINING',null,eventContext);if(!choice.domain)throw new RangeError('INVALID_TRAINING_FORFEIT');
 const career=applyTraining(source,{type:'SKIP'}),resolved=completeEventDomain(event,choice.domain,JSON.stringify(['career-forfeit-training',source.world.worldKey,source.world.seasonKey,source.revision+1]),eventContext);
 career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.phaseContext=structuredClone(phase.resume);career.revision++;return career;
}
export function changeMidseasonCareerArchetype(source:HighSchoolCareer,expectedRevision:number,archetype:string):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);safeSetup(source);
 if(source.phaseContext.phase!=='SEASON_PROGRESS' || completedTeamGames(source)<24 || Object.hasOwn(source.health.injuries,source.world.protagonistKey))throw new RangeError('STYLE_WINDOW_CLOSED');
 const player=source.world.players[source.world.protagonistKey]!;archetypeFor(player.kind,archetype);const window=JSON.stringify([source.world.seasonKey,'MID']);
 if(player.archetype!==archetype && source.styleUsedWindows.includes(window))throw new RangeError('STYLE_WINDOW_USED');
 const career=structuredClone(source);career.development=structuredClone(development(source));career.world.players[player.simulationKey]={...career.world.players[player.simulationKey]!,archetype};
 if(player.archetype!==archetype)career.styleUsedWindows=[...career.styleUsedWindows,window];
 const count=completedTeamGames(source);career.planHistory=[...career.planHistory.filter(p=>p.completedTeamGames!==count),{completedTeamGames:count,focus:[...player.focus],archetype}];career.revision++;return career;
}

import {assertFocus} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {HighSchoolWorld} from './high-school-world.js';
import {assertHighSchoolWorld} from './high-school-world.js';
import {archetypeFor} from './player.js';
import {emptyRecordLedger} from './records.js';
import type {RecordLedger} from './records.js';
import {createHealthLedger} from './health.js';
import type {HealthLedger} from './health.js';
import {createSchoolDayLedger} from './high-school-day.js';
import type {SchoolDayLedger} from './high-school-day.js';
import {createSchoolEmergencyRegistry} from './high-school-emergency.js';
import type {SchoolEmergencyRegistry} from './high-school-emergency.js';
import type {HighSchoolGameJob} from './high-school-game.js';
import {createStreams} from './rng.js';
import {createWorldEvent,resolveEventChoice,completeEventDomain} from './events.js';
import type {EventInstance} from './events.js';
import type {CareerDevelopmentLedger} from './high-school-training.js';
import {createOwnCareerAssessment} from './high-school-assessment.js';
import type {OwnCareerAssessment} from './high-school-assessment.js';
import {createCareerTraitLedger} from './high-school-traits.js';
import type {CareerTraitLedger} from './high-school-traits.js';
import type {SeasonGrowthLedger} from './growth-ledger.js';
import type {HighSchoolGraduation,CollegeAdmission} from './high-school-route.js';
import type {SchoolSeasonArchive,CollegeYearEnd} from './college-entry.js';
import type {CollegeCup} from './college-cup.js';

export interface HighSchoolAdvancePlan {mode:'NEXT_MAJOR_EVENT'|'ONE_GAME'|'ONE_WEEK';startWorldDay:number;startTeamGames:number}
export type HighSchoolProgressPhase={phase:'SEASON_PROGRESS';nextWorldDay:number;pendingGame:HighSchoolGameJob|null;advancePlan?:HighSchoolAdvancePlan|null};
export type HighSchoolCareerPhase =
 | {phase:'CREATED'}
 | {phase:'PRESEASON_SETUP'}
 | HighSchoolProgressPhase
 | {phase:'POSTSEASON_PROGRESS';nextWorldDay:number;pendingGame:HighSchoolGameJob|null}
 | {phase:'SEASON_REVIEW'}
 | {phase:'CAREER_ROUTE'}
 | {phase:'NEXT_SEASON_READY';route:'COLLEGE';admissionKey:string}
 | {phase:'EVENT_DECISION';eventKey:string;resume:{phase:'PRESEASON_SETUP'}|HighSchoolProgressPhase|{phase:'CAREER_ROUTE'}};
export interface HighSchoolCareer {
 schemaVersion:1;revision:number;world:HighSchoolWorld;difficulty:Difficulty;
 phaseContext:HighSchoolCareerPhase;events:readonly EventInstance[];
 records:RecordLedger;health:HealthLedger;days:SchoolDayLedger;emergency:SchoolEmergencyRegistry;
 styleUsedWindows:readonly string[];
 development?:CareerDevelopmentLedger;
 ownAssessment?:OwnCareerAssessment;
 traits?:CareerTraitLedger;
 seasonGrowth?:SeasonGrowthLedger;
 graduation?:HighSchoolGraduation;
 collegeAdmission?:CollegeAdmission;
 previousSeasons?:readonly SchoolSeasonArchive[];
 collegeYearEnd?:CollegeYearEnd;
 collegeCup?:CollegeCup;
 planHistory:readonly {completedTeamGames:number;focus:readonly string[];archetype:string}[];
}
/** Difficulty is immutable save metadata. Never accept a replacement policy on later commands. */
export function createHighSchoolCareer(world:HighSchoolWorld,difficulty:Difficulty):HighSchoolCareer {
 assertHighSchoolWorld(world);
 if(!['GROWTH','REALISTIC','SECRET_CHEAT'].includes(difficulty))throw new RangeError('INVALID_CAREER_DIFFICULTY');
 const player=world.players[world.protagonistKey]!;
 return {schemaVersion:1,revision:0,world:structuredClone(world),difficulty,phaseContext:{phase:'CREATED'},events:[],records:emptyRecordLedger(),health:createHealthLedger(createStreams(world.seed,JSON.stringify(['hs-health',world.worldKey])).injury),days:createSchoolDayLedger(world),emergency:createSchoolEmergencyRegistry(world),styleUsedWindows:[],ownAssessment:createOwnCareerAssessment(world),traits:createCareerTraitLedger(),development:{seasonStartPlayer:structuredClone(player),trainingUsedSeasons:[],trainingResults:[],trainingRng:createStreams(world.seed,JSON.stringify(['hs-training',world.worldKey])).growth},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
}
export function assertCareerRevision(source:HighSchoolCareer,expectedRevision:number):void {
 if(source.schemaVersion!==1 || !Number.isSafeInteger(source.revision) || source.revision<0 || !Number.isSafeInteger(expectedRevision) || source.revision!==expectedRevision)throw new RangeError('CAREER_REVISION_CHANGED');
 if(source.revision===Number.MAX_SAFE_INTEGER)throw new RangeError('CAREER_REVISION_LIMIT');
}
export function assertHighSchoolCareerRevision(source:HighSchoolCareer,expectedRevision:number):void {
 assertCareerRevision(source,expectedRevision);
 if(source.world.leagueKey==='COLLEGE')throw new RangeError('INVALID_CAREER_REGISTRATION');
}
export function assertCollegeCareerRevision(source:HighSchoolCareer,expectedRevision:number):void {
 assertCareerRevision(source,expectedRevision);
 const admission=source.collegeAdmission,world=source.world,player=world.players[world.protagonistKey];
 if(world.leagueKey!=='COLLEGE' || !admission || admission.status!=='ENROLLED' || admission.collegeId!==world.protagonistSchoolId || admission.playerKey!==world.protagonistKey || admission.position!==player?.position || admission.entryYear+admission.yearsCompleted!==world.calendar?.year || world.seasonKey!==String(world.calendar?.year))throw new RangeError('INVALID_CAREER_REGISTRATION');
}
export function assertSchoolCareerRevision(source:HighSchoolCareer,expectedRevision:number):void {
 if(source.world.leagueKey==='COLLEGE')assertCollegeCareerRevision(source,expectedRevision);
 else assertHighSchoolCareerRevision(source,expectedRevision);
}
function updateCareerPlan(source:HighSchoolCareer,focus:readonly string[],archetype:string):HighSchoolCareer {
 const updated=structuredClone(source),key=updated.world.protagonistKey;
 updated.world.players[key]={...updated.world.players[key]!,focus:[...focus],archetype};
 const completedTeamGames=Object.values(source.records.games).filter(g=>g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey===(source.world.leagueKey??'HS') && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,source.world.protagonistSchoolId)).length;
 updated.planHistory=[...source.planHistory.filter(p=>p.completedTeamGames!==completedTeamGames),{completedTeamGames,focus:[...focus],archetype}];return updated;
}
export function confirmCareerPlayer(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);if(source.phaseContext.phase!=='CREATED')throw new RangeError('INVALID_CAREER_PHASE');
 const updated=structuredClone(source),world=updated.world;
 const event=createWorldEvent({definitionId:'E01',worldKey:world.worldKey,seasonKey:world.seasonKey,evidence:{version:1,type:'CAREER_START',fields:{careerSimulationKey:world.protagonistKey}},resume:{worldKey:world.worldKey,seasonKey:world.seasonKey,phase:'PRESEASON_SETUP',competitionKey:'HS',registrationKey:world.protagonistSchoolId,sourceRevision:source.revision+1},sourceSequence:1,worldDay:Math.max(0,Math.min(...world.schedule.map(g=>g.worldDay))-1)});
 updated.events=[event];updated.phaseContext={phase:'EVENT_DECISION',eventKey:event.eventKey,resume:{phase:'PRESEASON_SETUP'}};updated.revision++;return updated;
}
/** Focus domain handlers only; other events are never automatically confirmed here. */
export function resolveCareerFocusEvent(source:HighSchoolCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:'KEEP_FOCUS'|'CHOOSE_FOCUS';focus?:readonly string[]}):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);
 const phase=source.phaseContext;if(phase.phase!=='EVENT_DECISION' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey);if(!event || !['E01','E02','E03'].includes(event.definitionId) || event.resume.phase!==phase.resume.phase || event.resume.worldKey!==source.world.worldKey || event.resume.seasonKey!==source.world.seasonKey || event.resume.registrationKey!==source.world.protagonistSchoolId)throw new RangeError('INVALID_CAREER_EVENT_SOURCE');
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['KEEP_FOCUS','CHOOSE_FOCUS']};
 const prepared=resolveEventChoice(event,input.eventVersion,input.command,input.focus?{focus:[...input.focus]}:null,context);
 let updated=structuredClone(source),resolved=prepared.event;
 if(prepared.domain){
  const player=source.world.players[source.world.protagonistKey]!;
  if(!input.focus)throw new RangeError('FOCUS_REQUIRED');assertFocus(player.kind,input.focus);
  updated=updateCareerPlan(source,input.focus,player.archetype);
  resolved=completeEventDomain(event,prepared.domain,JSON.stringify(['career-domain',source.world.worldKey,source.revision+1,event.eventKey,input.command]),context);
 }
 updated.events=updated.events.map(e=>e.eventKey===event.eventKey?resolved:e);updated.phaseContext=structuredClone(phase.resume);updated.revision++;return updated;
}
export const resolveInitialCareerEvent=resolveCareerFocusEvent;
export function setPreseasonCareerFocus(source:HighSchoolCareer,expectedRevision:number,focus:readonly string[]):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);return setSchoolPreseasonFocus(source,expectedRevision,focus);
}
export function setSchoolPreseasonFocus(source:HighSchoolCareer,expectedRevision:number,focus:readonly string[]):HighSchoolCareer {
 assertSchoolCareerRevision(source,expectedRevision);if(source.phaseContext.phase!=='PRESEASON_SETUP')throw new RangeError('INVALID_CAREER_PHASE');
 const player=source.world.players[source.world.protagonistKey]!;assertFocus(player.kind,focus);
 const updated=updateCareerPlan(source,focus,player.archetype);updated.revision++;return updated;
}
export function setPreseasonCareerArchetype(source:HighSchoolCareer,expectedRevision:number,archetype:string):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);return setSchoolPreseasonArchetype(source,expectedRevision,archetype);
}
export function setSchoolPreseasonArchetype(source:HighSchoolCareer,expectedRevision:number,archetype:string):HighSchoolCareer {
 assertSchoolCareerRevision(source,expectedRevision);if(source.phaseContext.phase!=='PRESEASON_SETUP')throw new RangeError('INVALID_CAREER_PHASE');
 const player=source.world.players[source.world.protagonistKey]!;archetypeFor(player.kind,archetype);
 const window=JSON.stringify([source.world.seasonKey,'PRE']);
 if(player.archetype!==archetype && source.styleUsedWindows.includes(window))throw new RangeError('STYLE_WINDOW_USED');
 const updated=updateCareerPlan(source,player.focus,archetype);
 if(player.archetype!==archetype)updated.styleUsedWindows=[...source.styleUsedWindows,window];
 updated.revision++;return updated;
}
export function confirmCareerPreseason(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);return confirmSchoolPreseason(source,expectedRevision);
}
export function confirmSchoolPreseason(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertSchoolCareerRevision(source,expectedRevision);if(source.phaseContext.phase!=='PRESEASON_SETUP' || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_CAREER_PHASE');
 const updated=structuredClone(source);if(updated.development)updated.development.seasonStartPlayer=structuredClone(updated.world.players[updated.world.protagonistKey]!);updated.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:Math.min(...source.world.schedule.map(g=>g.worldDay)),pendingGame:null};updated.revision++;return updated;
}

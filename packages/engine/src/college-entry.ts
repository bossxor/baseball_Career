import type {HighSchoolCareer} from './high-school-career.js';
import {assertHighSchoolCareerRevision} from './high-school-career.js';
import {assertPendingCollegeAdmission} from './high-school-route.js';
import {applyCareerSeasonTraining} from './high-school-training.js';
import {canonicalJson} from './game.js';
import {validateSeasonGrowthLedger,finalizeSeasonGrowth,createSeasonGrowthLedger} from './growth-ledger.js';
import type {SeasonGrowthLedger} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {pitchMastery,validatePitchWeights} from './repertoire.js';
import type {Repertoire} from './repertoire.js';
import {validatePitchXpLedger,emptyPitchXpLedger} from './pitch-xp.js';
import {createCollegeWorld} from './college-world.js';
import {createSchoolDayLedger} from './high-school-day.js';
import {createSchoolEmergencyRegistry} from './high-school-emergency.js';

export interface CollegeYearEnd {receiptKey:string;admissionKey:string;sourceRevision:number;sourceBasis:string}
export type SchoolSeasonArchive=Pick<HighSchoolCareer,'world'|'health'|'days'|'emergency'|'development'|'planHistory'> & {seasonGrowth:SeasonGrowthLedger;yearEndReceiptKey:string};
function yearEndBasis(source:HighSchoolCareer):string {
 const snapshot={...source};delete snapshot.collegeYearEnd;return canonicalJson(snapshot);
}
function carriedRepertoire(source:HighSchoolCareer):Repertoire|undefined {
 const player=source.world.players[source.world.protagonistKey]!;
 if(player.kind!=='PITCHER')return undefined;
 const repertoire=source.world.repertoires[player.simulationKey];
 if(!repertoire || repertoire.seasonId!==source.world.seasonKey)throw new RangeError('MISSING_YEAR_END_REPERTOIRE');
 validatePitchWeights(repertoire.book,repertoire.weights);validatePitchXpLedger(repertoire.ledger);
 if(repertoire.learning && (repertoire.learning.quarters.length!==4 || repertoire.ledger.baseReservedUnits!==0 || pitchMastery(repertoire.book[repertoire.learning.pitchId]??0)<1))throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');
 return repertoire;
}
/** Explicit year-end domain action; unresolved training/learning is never silently discarded by activation. */
export function closeHighSchoolSeasonForCollege(source:HighSchoolCareer,expectedRevision:number,forfeitUnusedTraining=false):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);const admission=assertPendingCollegeAdmission(source);
 if(source.collegeYearEnd || !source.seasonGrowth || !source.development)throw new RangeError('INVALID_COLLEGE_YEAR_END');
 validateSeasonGrowthLedger(source.seasonGrowth);carriedRepertoire(source);
 let career=structuredClone(source);
 if(!source.development.trainingUsedSeasons.includes(source.world.seasonKey)){
  if(forfeitUnusedTraining!==true)throw new RangeError('TRAINING_FORFEIT_REQUIRED');
  career=applyCareerSeasonTraining(source,{type:'SKIP'});
 }
 const key=source.world.protagonistKey,closed=finalizeSeasonGrowth(career.world.players[key]!,career.seasonGrowth!,source.world.calendar!.growthDays.length);
 career.world.players[key]=closed.player;career.seasonGrowth=closed.ledger;career.health=closeSeasonHealth(career.health,source.world.seasonKey).ledger;career.revision++;
 const receiptKey=JSON.stringify(['college-year-end',admission.admissionKey,source.world.seasonKey]);
 career.collegeYearEnd={receiptKey,admissionKey:admission.admissionKey,sourceRevision:career.revision,sourceBasis:yearEndBasis(career)};return career;
}
/** Pure atomic activation. Repeating the same source reproduces the same world; old state stays intact on failure. */
export function startAdmittedCollegeSeason(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertHighSchoolCareerRevision(source,expectedRevision);
 const admission=source.collegeAdmission,ready=source.collegeYearEnd;
 if(source.phaseContext.phase!=='NEXT_SEASON_READY' || !admission || admission.status!=='ADMITTED' || !ready || ready.receiptKey!==JSON.stringify(['college-year-end',admission.admissionKey,source.world.seasonKey]) || ready.admissionKey!==admission.admissionKey || ready.sourceRevision!==source.revision || ready.sourceBasis!==yearEndBasis(source) || !source.seasonGrowth?.finalized || !source.health.closedSeasons.includes(source.world.seasonKey) || source.events.some(e=>e.status==='OPEN'))throw new RangeError('COLLEGE_YEAR_END_REQUIRED');
 validateSeasonGrowthLedger(source.seasonGrowth);
 const key=source.world.protagonistKey,player={...structuredClone(source.world.players[key]!),age:source.world.players[key]!.age+1,fatigue:0};
 const previousBook=carriedRepertoire(source),seasonKey=String(admission.entryYear);
 if(Object.values(source.records.games).some(g=>g.scope.seasonKey===seasonKey))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const repertoire=previousBook?{...structuredClone(previousBook),seasonId:seasonKey,usedWindows:[],ledger:emptyPitchXpLedger(),learning:null}:undefined;
 const world=createCollegeWorld({worldKey:source.world.worldKey,seed:source.world.seed,seasonYear:admission.entryYear,collegeId:admission.collegeId,player,...(repertoire?{repertoire}:{}),difficulty:source.difficulty});
 const career=structuredClone(source),archive:SchoolSeasonArchive={world:career.world,health:career.health,days:career.days,emergency:career.emergency,development:career.development!,planHistory:career.planHistory,seasonGrowth:career.seasonGrowth!,yearEndReceiptKey:ready.receiptKey};
 career.previousSeasons=[...(career.previousSeasons??[]),archive];career.world=world;
 // Calendar rest does not heal mild/medium injuries measured in team games.
 career.health={...career.health,injuries:Object.hasOwn(career.health.injuries,key)?{[key]:structuredClone(career.health.injuries[key]!)}:{}};
 career.days=createSchoolDayLedger(world);career.emergency=createSchoolEmergencyRegistry(world);
 career.seasonGrowth=createSeasonGrowthLedger(player,seasonKey,world.calendar.growthDays.length);
 career.development={...career.development!,seasonStartPlayer:structuredClone(player)};
 career.planHistory=[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}];
 career.collegeAdmission={...admission,status:'ENROLLED'};career.phaseContext={phase:'PRESEASON_SETUP'};delete career.collegeYearEnd;career.revision++;return career;
}

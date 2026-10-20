import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import {schoolYearEndBasis,schoolYearEndRepertoire,archiveSchoolSeason} from './college-entry.js';
import {assertCollegeWorld} from './college-world.js';
import type {CollegeWorld} from './college-world.js';
import {collegeCupSchedule} from './college-cup.js';
import {validateSchoolGrowthDays,collectRegisteredSchoolGrowthEvidence} from './high-school-growth.js';
import {naturalGrowthBudgetUnits,applyGrowthBudget} from './development.js';
import type {GrowthPeriod} from './development.js';
import {applyCareerSeasonTraining} from './high-school-training.js';
import {validateSeasonGrowthLedger,finalizeSeasonGrowth,createSeasonGrowthLedger} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
import {generateSchoolNpcRoster} from './school-roster.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {createSchoolDayLedger} from './high-school-day.js';
import {createSchoolEmergencyRegistry} from './high-school-emergency.js';
import type {DevelopmentPlayer} from './player.js';
import type {Repertoire} from './repertoire.js';
import {assertCollegeYearResult} from './college-result.js';

export interface CollegeNpcGrowth {seasonKey:string;results:Record<string,{budgetUnits:number;gainedUnits:number;discardedUnits:number;gains:readonly number[]}>}
function permanentWorld(source:HighSchoolCareer):CollegeWorld {
 const schools=source.world.schools.map(s=>({...s,roster:s.roster.filter(k=>!Object.hasOwn(source.emergency.entries,k))}));
 const players=Object.fromEntries(schools.flatMap(s=>s.roster.map(k=>[k,source.world.players[k]!] as const)));
 const world:CollegeWorld={...source.world,leagueKey:'COLLEGE',calendar:source.world.calendar!,schools,players};assertCollegeWorld(world);return world;
}
function receiptKey(source:HighSchoolCareer):string {return JSON.stringify(['college-academic-year-end',source.world.worldKey,source.world.seasonKey,source.collegeAdmission!.academicYear]);}
/** Explicit continuation after academic completion. Unused training and unfinished learning cannot disappear. */
export function closeCollegeSeasonForNextYear(source:HighSchoolCareer,expectedRevision:number,forfeitUnusedTraining=false):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);assertCollegeYearResult(source);
 if(source.collegeAdmission!.academicYear===4)throw new RangeError('COLLEGE_GRADUATION_ROUTE_REQUIRED');
 if(source.phaseContext.phase!=='OFFSEASON_REVIEW' || source.collegeYearEnd || source.collegeNpcGrowth || !source.seasonGrowth || !source.development || source.events.some(e=>e.status==='OPEN') || source.collegeCup?.status!=='COMPLETE')throw new RangeError('INVALID_COLLEGE_YEAR_END');
 validateSeasonGrowthLedger(source.seasonGrowth);
 const base=permanentWorld(source),schedule=[...base.schedule,...collegeCupSchedule(source)],previous=source.previousSeasons?.at(-1);
 if(!previous)throw new RangeError('MISSING_PREVIOUS_SEASON');
 validateSchoolGrowthDays(source,schedule);
 collectRegisteredSchoolGrowthEvidence(source,schedule,Object.hasOwn(previous.health.injuries,base.protagonistKey));
 for(const key of Object.keys(base.players))schoolYearEndRepertoire(source,key);
 let career=structuredClone(source);
 if(!source.development.trainingUsedSeasons.includes(base.seasonKey)){
  if(forfeitUnusedTraining!==true)throw new RangeError('TRAINING_FORFEIT_REQUIRED');
  career=applyCareerSeasonTraining(source,{type:'SKIP'});
 }
 const growthDays=new Set(base.calendar.highSchoolDays),indices=new Map(base.calendar.growthDays.map((d,i)=>[d,i])),results:CollegeNpcGrowth['results']={};
 for(const school of base.schools)for(const key of school.roster){
  if(key===base.protagonistKey)continue;const player=base.players[key]!,start={...structuredClone(player),fatigue:0};
  // shortcut: NPCs have no permanent in-season training; add opening snapshots before introducing it.
  const projected:HighSchoolCareer={...source,world:{...base,protagonistKey:key,protagonistSchoolId:school.id},development:{...source.development,seasonStartPlayer:start},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
  const days=collectRegisteredSchoolGrowthEvidence(projected,schedule,Object.hasOwn(previous.health.injuries,key)).days.filter(d=>growthDays.has(d.worldDay));
  if(days.length!==growthDays.size)throw new RangeError('INCOMPLETE_GROWTH_DAYS');
  const period:GrowthPeriod={startDay:indices.get(days[0]!.worldDay)!,endDay:indices.get(days.at(-1)!.worldDay)!+1,levelSeasonDays:growthDays.size,level:'COLLEGE',appearances:days.reduce((n,d)=>n+d.appearances,0),pitcherRole:player.position==='RP'?'RP':player.position==='CP'?'CP':'SP',rehabRatio:days.filter(d=>d.rehabilitating).length/days.length,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:false}};
  const budgetUnits=naturalGrowthBudgetUnits(start,base.calendar.growthDays.length,[period]),grown=applyGrowthBudget(player,budgetUnits),gainedUnits=grown.gains.reduce((a,b)=>a+b,0);
  career.world.players[key]=grown.player;results[key]={budgetUnits,gainedUnits,discardedUnits:grown.discarded,gains:grown.gains};
 }
 career.collegeNpcGrowth={seasonKey:base.seasonKey,results};
 const closed=finalizeSeasonGrowth(career.world.players[base.protagonistKey]!,career.seasonGrowth!,base.calendar.growthDays.length);career.world.players[base.protagonistKey]=closed.player;career.seasonGrowth=closed.ledger;
 career.health=closeSeasonHealth(career.health,base.seasonKey).ledger;career.phaseContext={phase:'NEXT_SEASON_READY',route:'COLLEGE',admissionKey:source.collegeAdmission!.admissionKey};career.revision++;
 career.collegeYearEnd={receiptKey:receiptKey(source),admissionKey:source.collegeAdmission!.admissionKey,sourceRevision:career.revision,sourceBasis:schoolYearEndBasis(career)};return career;
}
function nextWorld(source:HighSchoolCareer):CollegeWorld {
 const base=permanentWorld(source),year=base.calendar.year+1,seasonKey=String(year),calendar=createSeasonCalendar(year),players:Record<string,DevelopmentPlayer>={},repertoires:Record<string,Repertoire>={};
 if(Object.values(source.records.games).some(g=>g.scope.seasonKey===seasonKey))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const schools=base.schools.map(s=>({...s,roster:[] as string[]})),templates=[] as {simulationKey:string;kind:'HITTER'|'PITCHER';position:string;schoolId:string}[];
 for(const school of base.schools)for(const [slot,key] of school.roster.entries()){
  const player=base.players[key]!;
  if(key!==base.protagonistKey && player.age===22){templates.push({simulationKey:JSON.stringify(['college-rookie',seasonKey,school.id,player.kind,player.position,slot]),kind:player.kind,position:player.position,schoolId:school.id});continue;}
  players[key]={...structuredClone(player),age:player.age+1,fatigue:0};schools.find(s=>s.id===school.id)!.roster.push(key);
  const book=schoolYearEndRepertoire(source,key);if(book)repertoires[key]={...structuredClone(book),seasonId:seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 const recruited=generateSchoolNpcRoster({templates,seed:base.seed,worldKey:JSON.stringify([base.worldKey,'college-recruits-1',seasonKey]),seasonKey,difficulty:source.difficulty,league:'COLLEGE'});
 for(const [key,player] of Object.entries(recruited.players)){if(Object.hasOwn(players,key))throw new RangeError('PLAYER_KEY_COLLISION');players[key]={...player,age:19};}
 Object.assign(repertoires,recruited.repertoires);
 for(const school of schools)school.roster=[...school.roster,...(recruited.rosters[school.id]??[])].sort();
 const schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:schools.map(s=>s.id),leagueKey:'COLLEGE',seasonKey,startDay:calendar.highSchoolDays[0]!},6),calendar);
 const world:CollegeWorld={...base,seasonKey,schools,players,repertoires,calendar,schedule,rng:{...base.rng,...recruited.rng}};assertCollegeWorld(world);return world;
}
/** Existing students carry identity/P/earned growth/books; only age22 graduates receive new freshman replacements. */
export function startNextCollegeSeason(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);assertCollegeYearResult(source);
 const ready=source.collegeYearEnd,admission=source.collegeAdmission!;
 if(source.phaseContext.phase!=='NEXT_SEASON_READY' || source.phaseContext.route!=='COLLEGE' || source.phaseContext.admissionKey!==admission.admissionKey || admission.academicYear===4 || !ready || ready.receiptKey!==receiptKey(source) || ready.admissionKey!==admission.admissionKey || ready.sourceRevision!==source.revision || ready.sourceBasis!==schoolYearEndBasis(source) || !source.seasonGrowth?.finalized || !source.health.closedSeasons.includes(source.world.seasonKey) || !source.collegeNpcGrowth || source.events.some(e=>e.status==='OPEN'))throw new RangeError('COLLEGE_YEAR_END_REQUIRED');
 validateSeasonGrowthLedger(source.seasonGrowth);
 const world=nextWorld(source),career=structuredClone(source),archive=archiveSchoolSeason(career,ready.receiptKey),player=world.players[world.protagonistKey]!;
 career.previousSeasons=[...(career.previousSeasons??[]),archive];career.world=world;
 career.health={...career.health,injuries:Object.fromEntries(Object.entries(career.health.injuries).filter(([key])=>Object.hasOwn(world.players,key)))};
 career.days=createSchoolDayLedger(world);career.emergency=createSchoolEmergencyRegistry(world);career.seasonGrowth=createSeasonGrowthLedger(player,world.seasonKey,world.calendar.growthDays.length);
 career.development={...career.development!,seasonStartPlayer:structuredClone(player)};career.planHistory=[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}];
 career.collegeAdmission={...admission,academicYear:admission.academicYear===1?2:admission.academicYear===2?3:4};
 if(career.traits)career.traits={...career.traits,lastClosedDay:null,lastSeasonKey:world.seasonKey};
 delete career.collegeYearEnd;delete career.collegeCup;delete career.collegeResult;delete career.collegeNpcGrowth;career.phaseContext={phase:'PRESEASON_SETUP'};career.revision++;return career;
}

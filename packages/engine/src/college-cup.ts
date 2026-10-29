import {refreshCareerRepertoireEvents} from './repertoire-events.js';
import {refreshCareerSeasonGoals} from './season-goals.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCollegeCareerRevision} from './high-school-career.js';
import type {ScheduledGame} from './schedule.js';
import {leagueStandings} from './standings.js';
import {canonicalJson} from './game.js';
import {closeHighSchoolDay,closeSchoolCompetitionDay} from './high-school-day.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from './high-school-game.js';
import {highSchoolGameContext} from './high-school-progress.js';
import type {SchoolProgressResult,SchoolProgressStop} from './high-school-progress.js';
import {reconcileSchoolEmergency} from './high-school-emergency.js';
import {refreshOwnCareerAssessment} from './high-school-assessment.js';
import {refreshCareerTraits} from './high-school-traits.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {refreshCareerRouteNotices} from './career-route-notices.js';

export interface CollegeCup {schemaVersion:1;seasonKey:string;seeds:readonly string[];regularBasis:string;status:'ACTIVE'|'COMPLETE';championKey:string|null}
export function collegeRegularStandings(source:HighSchoolCareer){
 if(source.world.leagueKey!=='COLLEGE')throw new RangeError('INVALID_CAREER_REGISTRATION');
 return leagueStandings(source.records,{seasonKey:source.world.seasonKey,leagueKey:'COLLEGE',phase:'REGULAR'},source.world.schools.map(s=>s.id),source.world.seed,source.world.worldKey);
}
function regularBasis(source:HighSchoolCareer):string {
 const games=source.world.schedule.map(g=>source.records.games[g.simulationKey]);
 if(source.world.schedule.length!==216 || games.some(g=>!g || g.scope.seasonKey!==source.world.seasonKey || g.scope.leagueKey!=='COLLEGE' || g.scope.phase!=='REGULAR'))throw new RangeError('COLLEGE_REGULAR_NOT_COMPLETE');
 return canonicalJson({schedule:source.world.schedule,games});
}
function julyFirst(source:HighSchoolCareer):number {
 assertSeasonCalendar(source.world.calendar!);
 // calendar-1 school registration ends on June30, including weekly rest days.
 return source.world.calendar!.highSchoolDays.at(-1)!+1;
}
function winner(source:HighSchoolCareer,game:ScheduledGame):string|null {
 const result=source.records.games[game.simulationKey];if(!result)return null;
 const a=result.teams[game.awayTeamKey],h=result.teams[game.homeTeamKey];
 if(result.gameKey!==game.simulationKey || result.worldDay!==game.worldDay || result.scope.seasonKey!==game.seasonKey || result.scope.leagueKey!=='COLLEGE' || result.scope.phase!=='POSTSEASON' || Object.keys(result.teams).length!==2 || !a || !h || a.games!==1 || h.games!==1 || a.T!==0 || h.T!==0 || a.R===h.R || a.R!==h.RA || h.R!==a.RA || a.W!==Number(a.R>h.R) || h.W!==Number(h.R>a.R) || a.L!==h.W || h.L!==a.W)throw new RangeError('INVALID_COLLEGE_CUP_RESULT');
 return a.W===1?game.awayTeamKey:game.homeTeamKey;
}
/** Rebuild the bracket from frozen seeds and FINAL records; cancelled third finals are never scheduled. */
function bracket(source:HighSchoolCareer):{schedule:ScheduledGame[];championKey:string|null} {
 const cup=source.collegeCup;if(!cup || cup.schemaVersion!==1 || !['ACTIVE','COMPLETE'].includes(cup.status) || cup.seasonKey!==source.world.seasonKey || cup.regularBasis!==regularBasis(source) || canonicalJson(cup.seeds)!==canonicalJson(collegeRegularStandings(source).slice(0,4).map(s=>s.teamKey)))throw new RangeError('CHANGED_COLLEGE_CUP_BASIS');
 const day=julyFirst(source),game=(round:number,slot:number,awayTeamKey:string,homeTeamKey:string,worldDay:number):ScheduledGame=>({simulationKey:JSON.stringify([source.world.seasonKey,'COLLEGE_CUP',round,slot]),leagueKey:'COLLEGE',seasonKey:source.world.seasonKey,round,worldDay,awayTeamKey,homeTeamKey,phase:'POSTSEASON'});
 const schedule=[game(0,0,cup.seeds[3]!,cup.seeds[0]!,day),game(0,1,cup.seeds[2]!,cup.seeds[1]!,day)],finalists=schedule.map(g=>winner(source,g));
 const result=(championKey:string|null)=>{
  const keys=new Set(schedule.map(g=>g.simulationKey));
  if(Object.values(source.records.games).some(g=>g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey==='COLLEGE' && g.scope.phase==='POSTSEASON' && !keys.has(g.gameKey)) || cup.status==='COMPLETE' && (cup.championKey!==championKey || !championKey))throw new RangeError('INVALID_COLLEGE_CUP_RESULT');
  return {schedule,championKey};
 };
 if(finalists.some(k=>k===null))return result(null);
 const [high,low]=(finalists as string[]).sort((a,b)=>cup.seeds.indexOf(a)-cup.seeds.indexOf(b)),wins=new Map([[high!,0],[low!,0]]);
 for(let i=0;i<3;i++){
  const next=game(1,i,i===1?high!:low!,i===1?low!:high!,day+2+i*2);schedule.push(next);
  const won=winner(source,next);if(!won)break;wins.set(won,wins.get(won)!+1);
  if(wins.get(won)===2)return result(won);
 }
 return result(null);
}
export function collegeCupSchedule(source:HighSchoolCareer):ScheduledGame[] {return bracket(source).schedule;}
/** The whole world's cup advances even when the protagonist's team did not qualify. */
export function startCollegeCup(source:HighSchoolCareer,expectedRevision:number):HighSchoolCareer {
 assertCollegeCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || source.collegeCup || source.events.some(e=>e.status==='OPEN') || source.health.closedSeasons.includes(source.world.seasonKey) || source.seasonGrowth?.finalized)throw new RangeError('INVALID_CAREER_PHASE');
 const basis=regularBasis(source),first=Math.min(...source.world.schedule.map(g=>g.worldDay)),last=Math.max(...source.world.schedule.map(g=>g.worldDay));
 if(source.days.days.length!==last-first+1 || source.days.days.some((d,i)=>d.day!==first+i) || last>=julyFirst(source) || Object.values(source.records.games).some(g=>g.scope.seasonKey===source.world.seasonKey && g.scope.leagueKey==='COLLEGE' && g.scope.phase!=='REGULAR'))throw new RangeError('COLLEGE_REGULAR_NOT_COMPLETE');
 for(const d of source.days.days)closeHighSchoolDay(source.world,source.records,source.health,source.days,d.day);
 const standings=collegeRegularStandings(source);if(standings.some(s=>s.games!==48))throw new RangeError('COLLEGE_REGULAR_NOT_COMPLETE');
 const career=structuredClone(source);career.collegeCup={schemaVersion:1,seasonKey:source.world.seasonKey,seeds:standings.slice(0,4).map(s=>s.teamKey),regularBasis:basis,status:'ACTIVE',championKey:null};
 career.phaseContext={phase:'POSTSEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};career.revision++;return refreshCareerRouteNotices(refreshCareerSeasonGoals(career));
}
export function advanceCollegeCup(source:HighSchoolCareer,expectedRevision:number):SchoolProgressResult {
 assertCollegeCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='POSTSEASON_PROGRESS' || source.collegeCup?.status!=='ACTIVE' || source.collegeCup.championKey!==null || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_CAREER_PHASE');
 bracket(source);
 const career=structuredClone(source),progress=career.phaseContext;
 if(progress.phase!=='POSTSEASON_PROGRESS')throw new RangeError('INVALID_CAREER_PHASE');
 const nextDay=(source.days.days.at(-1)?.day??-1)+1;
 if(progress.nextWorldDay!==nextDay || progress.pendingGame && (progress.pendingGame.worldKey!==source.world.worldKey || progress.pendingGame.seasonKey!==source.world.seasonKey || progress.pendingGame.worldDay!==nextDay))throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
 let plateAppearances=0,completedInnings=0;
 const finish=(stopReason:SchoolProgressStop,healthChanges:SchoolProgressResult['healthChanges']=null):SchoolProgressResult=>{career.revision++;return {career:refreshCareerRepertoireEvents(refreshCareerSeasonGoals(career)),stopReason,plateAppearances,completedInnings,healthChanges};};
 while(plateAppearances<1000 && completedInnings<20){
  const day=progress.nextWorldDay,current=bracket(career),pending=current.schedule.filter(g=>g.worldDay===day && !Object.hasOwn(career.records.games,g.simulationKey))[0];
  if(progress.pendingGame && (!pending || progress.pendingGame.game.input.simulationKey!==pending.simulationKey))throw new RangeError('PENDING_GAME_CONTEXT_CHANGED');
  if(pending && !progress.pendingGame){
   const emergency=reconcileSchoolEmergency(career.world,career.health,career.emergency,day,career.difficulty);career.world=emergency.world;career.emergency=emergency.registry;
   progress.pendingGame=prepareSchoolCompetitionGame(career.world,career.records,pending,highSchoolGameContext(career,'POSTSEASON'));
  }
  if(progress.pendingGame){
   const before=progress.pendingGame.game,job=advanceHighSchoolGame(progress.pendingGame,1000-plateAppearances,20-completedInnings);progress.pendingGame=job;
   plateAppearances+=job.game.playCursor-before.playCursor;completedInnings+=job.game.completedInnings-before.completedInnings;
   if(job.stopReason==='ENGINE_LIMIT')return finish('ENGINE_LIMIT');
   if(job.game.status!=='FINAL')return finish('CHUNK_LIMIT');
   const result=commitSchoolCompetitionGame(career.world,career.records,job,pending!);career.world=result.world;career.records=result.records;progress.pendingGame=null;
   if(current.schedule.some(g=>g.worldDay===day && !Object.hasOwn(career.records.games,g.simulationKey)))continue;
  }
  const updated=bracket(career),closed=closeSchoolCompetitionDay(career.world,career.records,career.health,career.days,day,[...career.world.schedule,...updated.schedule]);
  career.world=closed.world;career.health=closed.health;career.days=closed.days;progress.nextWorldDay=day+1;career.ownAssessment=refreshOwnCareerAssessment(career);career.traits=refreshCareerTraits(career,day);
  const healthChanges={injured:closed.result.injured.includes(career.world.protagonistKey),recovered:closed.result.recovered.includes(career.world.protagonistKey)};
  if(updated.championKey){career.collegeCup={...career.collegeCup!,status:'COMPLETE',championKey:updated.championKey};career.phaseContext={phase:'SEASON_REVIEW'};return finish('CUP_COMPLETE',healthChanges);}
  if(healthChanges.injured || healthChanges.recovered)return finish('HEALTH_CHANGE',healthChanges);
 }
 return finish('CHUNK_LIMIT');
}

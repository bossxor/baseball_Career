import {assertFocus} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {closeSchoolCompetitionDay} from './high-school-day.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {assertHighSchoolCareerRevision,assertSchoolCareerRevision,assertCollegeCareerRevision} from './high-school-career.js';
import {assertSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods} from './growth-ledger.js';
import type {ClosedGrowthPeriod} from './growth-ledger.js';
import {canonicalJson} from './game.js';
import {refreshOwnCareerAssessment} from './high-school-assessment.js';
import {assertSchedule} from './schedule.js';
import type {ScheduledGame} from './schedule.js';
import {schoolNationalEndInjured} from './college-national.js';

export interface HighSchoolGrowthDay {
 worldDay:number;appearances:number;rehabilitating:boolean;focus:readonly string[];archetype:string;
}
export interface HighSchoolGrowthEvidence {
 worldKey:string;seasonKey:string;playerKey:string;seasonStartPlayer:DevelopmentPlayer;days:HighSchoolGrowthDay[];
}
/** Server-only evidence. Absolute world days are not the growth ledger's [0,W] indices. */
export function collectHighSchoolGrowthEvidence(source:HighSchoolCareer):HighSchoolGrowthEvidence {
 return collectSchoolGrowthEvidence(source,source.world.schedule,false);
}
/** The caller supplies the active competitions and the verified injury carried at registration. */
export function collectSchoolGrowthEvidence(source:HighSchoolCareer,schedule:readonly ScheduledGame[],openingRehabilitation:boolean):HighSchoolGrowthEvidence {
 if(source.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_CAREER_PHASE');
 validateSchoolGrowthDays(source,schedule);
 return collectRegisteredSchoolGrowthEvidence(source,schedule,openingRehabilitation);
}
export function validateSchoolGrowthDays(source:HighSchoolCareer,schedule:readonly ScheduledGame[]):void {
 const first=Math.min(...schedule.map(g=>g.worldDay)),last=Math.max(...schedule.map(g=>g.worldDay));
 if(!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || source.days.days.length!==last-first+1 || source.days.days.some((d,i)=>d.day!==first+i))throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 for(const d of source.days.days)closeSchoolCompetitionDay(source.world,source.records,source.health,source.days,d.day,schedule);
}
/** Internal player audit after validateSchoolGrowthDays has certified the shared date receipts. */
export function collectRegisteredSchoolGrowthEvidence(source:HighSchoolCareer,schedule:readonly ScheduledGame[],openingRehabilitation:boolean):HighSchoolGrowthEvidence {
 const {world}=source,key=world.protagonistKey,start=source.development?.seasonStartPlayer;
 // Old saves without a pre-training snapshot cannot reconstruct one from the enhanced player.
 if(!start)throw new RangeError('MISSING_SEASON_START_PLAYER');
 validateDevelopmentPlayer(start);
 if(start.simulationKey!==key || start.kind!==world.players[key]?.kind || start.age!==world.players[key]?.age)throw new RangeError('GROWTH_PLAYER_MISMATCH');
 const first=Math.min(...schedule.map(g=>g.worldDay));
 const teamGames=world.schedule.filter(g=>g.awayTeamKey===world.protagonistSchoolId || g.homeTeamKey===world.protagonistSchoolId).sort((a,b)=>a.worldDay-b.worldDay);
 const registeredGames=schedule.filter(g=>g.awayTeamKey===world.protagonistSchoolId || g.homeTeamKey===world.protagonistSchoolId);
 const history=source.planHistory;
 if(!history.length || history[0]!.completedTeamGames!==0)throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
 for(const [i,plan] of history.entries()){
  if(!Number.isSafeInteger(plan.completedTeamGames) || plan.completedTeamGames<0 || plan.completedTeamGames>teamGames.length || i>0 && plan.completedTeamGames<=history[i-1]!.completedTeamGames)throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
  assertFocus(start.kind,plan.focus);archetypeFor(start.kind,plan.archetype);
 }
 const boundaries=history.map(p=>p.completedTeamGames===0?first:teamGames[p.completedTeamGames-1]!.worldDay+1);
 const days:HighSchoolGrowthDay[]=[];let planIndex=0,rehabilitating=openingRehabilitation;
 for(const closed of source.days.days){
  const day=closed.day;
  while(planIndex+1<history.length && boundaries[planIndex+1]!<=day)planIndex++;
  const plan=history[planIndex]!,scheduled=registeredGames.filter(g=>g.worldDay===day);
  if(scheduled.length>1)throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');
  let appearances=0;
  for(const game of scheduled){
   const health=source.health.games.filter(g=>g.evidence.seasonKey===world.seasonKey && g.evidence.gameKey===game.simulationKey && g.evidence.teamKey===world.protagonistSchoolId);
   if(health.length!==1 || health[0]!.evidence.day!==day || !health[0]!.evidence.roster.includes(key))throw new RangeError('MISSING_GROWTH_REGISTRATION');
   const result=health[0]!.result;
   if(result.injured.includes(key)!==closed.result.injured.includes(key) || result.recovered.includes(key)!==closed.result.recovered.includes(key))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
   const contribution=source.records.games[game.simulationKey]!;
   if(health[0]!.evidence.appearances.some(p=>p.playerKey===key)!==(Object.hasOwn(contribution.batting,key) || Object.hasOwn(contribution.pitching,key)))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
   appearances=start.kind==='HITTER'?(contribution.batting[key]?.PA??0):(contribution.pitching[key]?.outs??0);
  }
  if(!Number.isSafeInteger(appearances) || appearances<0 || rehabilitating && appearances>0)throw new RangeError('INVALID_GROWTH_APPEARANCES');
  days.push({worldDay:day,appearances,rehabilitating,focus:[...plan.focus],archetype:plan.archetype});
  const injured=closed.result.injured.includes(key),recovered=closed.result.recovered.includes(key);
  if(injured && (rehabilitating || recovered) || recovered && !rehabilitating || !scheduled.length && (injured || recovered))throw new RangeError('INVALID_GROWTH_HEALTH_HISTORY');
  // Diagnosis follows play; recovery follows an unavailable team game. Both affect the next date.
  if(injured)rehabilitating=true;if(recovered)rehabilitating=false;
 }
 if(rehabilitating!==schoolNationalEndInjured(source,key))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
 return {worldKey:world.worldKey,seasonKey:world.seasonKey,playerKey:key,seasonStartPlayer:structuredClone(start),days};
}

/** Graduate growth is a partial world-season payment, never a fresh annual budget. */
export function settleHighSchoolCareerGrowth(source:HighSchoolCareer,expectedRevision:number){
 assertHighSchoolCareerRevision(source,expectedRevision);
 return settleSchoolCareerGrowth(source,expectedRevision,source.world.schedule,false);
}
export function settleSchoolCareerGrowth(source:HighSchoolCareer,expectedRevision:number,schedule:readonly ScheduledGame[],openingRehabilitation:boolean){
 assertSchoolCareerRevision(source,expectedRevision);
 const calendar=source.world.calendar;if(!calendar)throw new RangeError('MISSING_SEASON_CALENDAR');assertSeasonCalendar(calendar);
 assertSchedule(source.world.schedule,source.world.schools.map(s=>s.id),48,24);
 if(canonicalJson(scheduleHighSchoolCalendar(source.world.schedule,calendar))!==canonicalJson(source.world.schedule))throw new RangeError('CHANGED_SCHOOL_CALENDAR');
 const evidence=collectSchoolGrowthEvidence(source,schedule,openingRehabilitation);
 if(evidence.days.filter(d=>calendar.highSchoolDays.includes(d.worldDay)).length!==calendar.highSchoolDays.length)throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 return settleRegisteredGrowth(source,evidence);
}
/** Interrupted academic years settle only their real closed dates before the service owner takes over. */
export function settleCollegeLeaveGrowth(source:HighSchoolCareer,revision:number){
 assertCollegeCareerRevision(source,revision);const calendar=source.world.calendar!;assertSeasonCalendar(calendar);
 const schedule=source.world.schedule,first=Math.min(...schedule.map(g=>g.worldDay)),last=source.days.days.at(-1)?.day??first-1;
 if(source.days.days.some((d,i)=>d.day!==first+i)||Object.values(source.records.games).some(g=>g.scope.seasonKey===source.world.seasonKey&&g.scope.leagueKey==='COLLEGE'&&g.worldDay>last))throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 for(const d of source.days.days)closeSchoolCompetitionDay(source.world,source.records,source.health,source.days,d.day,schedule);
 const previous=source.previousSeasons?.at(-1);if(!previous)throw new RangeError('MISSING_PREVIOUS_SEASON');
 return settleRegisteredGrowth(source,collectRegisteredSchoolGrowthEvidence(source,schedule,Object.hasOwn(previous.health.injuries,source.world.protagonistKey)));
}
function settleRegisteredGrowth(source:HighSchoolCareer,evidence:HighSchoolGrowthEvidence){
 const calendar=source.world.calendar!,growthIndex=new Map(calendar.growthDays.map((d,i)=>[d,i])),schoolDays=new Set(calendar.highSchoolDays),college=source.world.leagueKey==='COLLEGE';
 const eligible=evidence.days.filter(d=>schoolDays.has(d.worldDay)),periods:ClosedGrowthPeriod[]=[];
 for(let i=0;i<eligible.length;){
  const start=i,plan=eligible[i]!;
  while(i<eligible.length && eligible[i]!.archetype===plan.archetype && canonicalJson(eligible[i]!.focus)===canonicalJson(plan.focus))i++;
  const days=eligible.slice(start,i),startDay=growthIndex.get(plan.worldDay)!,endDay=growthIndex.get(days.at(-1)!.worldDay)!+1;
  periods.push({periodKey:JSON.stringify([college?'college-growth':'hs-growth',source.world.worldKey,source.world.seasonKey,startDay,endDay]),focus:[...plan.focus],archetype:plan.archetype,period:{startDay,endDay,levelSeasonDays:calendar.highSchoolDays.length,level:college?'COLLEGE':'HIGH_SCHOOL',appearances:days.reduce((n,d)=>n+d.appearances,0),pitcherRole:evidence.seasonStartPlayer.position==='RP'?'RP':evidence.seasonStartPlayer.position==='CP'?'CP':'SP',rehabRatio:days.filter(d=>d.rehabilitating).length/days.length,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:true}}});
 }
 let ledger=source.seasonGrowth??createSeasonGrowthLedger(evidence.seasonStartPlayer,source.world.seasonKey,calendar.growthDays.length);
 // M2-V/W college saves opened an empty ledger before PRE focus/style choices were confirmed.
 if(college && !ledger.finalized && ledger.entries.length===0 && canonicalJson({...ledger.seasonStart,focus:evidence.seasonStartPlayer.focus,archetype:evidence.seasonStartPlayer.archetype})===canonicalJson(evidence.seasonStartPlayer))ledger={...ledger,seasonStart:structuredClone(evidence.seasonStartPlayer)};
 if(ledger.seasonKey!==source.world.seasonKey || ledger.worldGrowthDays!==calendar.growthDays.length || canonicalJson(ledger.seasonStart)!==canonicalJson(evidence.seasonStartPlayer))throw new RangeError('CHANGED_GROWTH_SEASON');
 const settled=settleClosedGrowthPeriods(source.world.players[evidence.playerKey]!,ledger,periods),career=structuredClone(source);
 career.world.players[evidence.playerKey]=settled.player;career.seasonGrowth=settled.ledger;career.ownAssessment=refreshOwnCareerAssessment(career);career.revision++;
 return {career,budgetUnits:settled.newBudgetUnits,gainedUnits:settled.newGainedUnits,discardedUnits:settled.newDiscardedUnits};
}

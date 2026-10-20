import {assertFocus} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import {closeHighSchoolDay} from './high-school-day.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {assertHighSchoolCareerRevision} from './high-school-career.js';
import {assertSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods} from './growth-ledger.js';
import type {ClosedGrowthPeriod} from './growth-ledger.js';
import {canonicalJson} from './game.js';
import {refreshOwnCareerAssessment} from './high-school-assessment.js';
import {assertSchedule} from './schedule.js';

export interface HighSchoolGrowthDay {
 worldDay:number;appearances:number;rehabilitating:boolean;focus:readonly string[];archetype:string;
}
export interface HighSchoolGrowthEvidence {
 worldKey:string;seasonKey:string;playerKey:string;seasonStartPlayer:DevelopmentPlayer;days:HighSchoolGrowthDay[];
}
/** Server-only evidence. Absolute world days are not the growth ledger's [0,W] indices. */
export function collectHighSchoolGrowthEvidence(source:HighSchoolCareer):HighSchoolGrowthEvidence {
 if(source.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_CAREER_PHASE');
 const {world}=source,key=world.protagonistKey,start=source.development?.seasonStartPlayer;
 // Old saves without a pre-training snapshot cannot reconstruct one from the enhanced player.
 if(!start)throw new RangeError('MISSING_SEASON_START_PLAYER');
 validateDevelopmentPlayer(start);
 if(start.simulationKey!==key || start.kind!==world.players[key]?.kind || start.age!==world.players[key]?.age)throw new RangeError('GROWTH_PLAYER_MISMATCH');
 const first=Math.min(...world.schedule.map(g=>g.worldDay)),last=Math.max(...world.schedule.map(g=>g.worldDay));
 if(!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || source.days.days.length!==last-first+1 || source.days.days.some((d,i)=>d.day!==first+i))throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 const teamGames=world.schedule.filter(g=>g.awayTeamKey===world.protagonistSchoolId || g.homeTeamKey===world.protagonistSchoolId).sort((a,b)=>a.worldDay-b.worldDay);
 const history=source.planHistory;
 if(!history.length || history[0]!.completedTeamGames!==0)throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
 for(const [i,plan] of history.entries()){
  if(!Number.isSafeInteger(plan.completedTeamGames) || plan.completedTeamGames<0 || plan.completedTeamGames>teamGames.length || i>0 && plan.completedTeamGames<=history[i-1]!.completedTeamGames)throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
  assertFocus(start.kind,plan.focus);archetypeFor(start.kind,plan.archetype);
 }
 const boundaries=history.map(p=>p.completedTeamGames===0?first:teamGames[p.completedTeamGames-1]!.worldDay+1);
 const days:HighSchoolGrowthDay[]=[];let planIndex=0,rehabilitating=false;
 for(const closed of source.days.days){
  const day=closed.day;
  // Reuse the day-close receipt check so missing or corrected FINAL records cannot pay old evidence.
  closeHighSchoolDay(world,source.records,source.health,source.days,day);
  while(planIndex+1<history.length && boundaries[planIndex+1]!<=day)planIndex++;
  const plan=history[planIndex]!,scheduled=teamGames.filter(g=>g.worldDay===day);
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
 if(rehabilitating!==Object.hasOwn(source.health.injuries,key))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
 return {worldKey:world.worldKey,seasonKey:world.seasonKey,playerKey:key,seasonStartPlayer:structuredClone(start),days};
}

/** Graduate growth is a partial world-season payment, never a fresh annual budget. */
export function settleHighSchoolCareerGrowth(source:HighSchoolCareer,expectedRevision:number){
 assertHighSchoolCareerRevision(source,expectedRevision);
 const calendar=source.world.calendar;if(!calendar)throw new RangeError('MISSING_SEASON_CALENDAR');assertSeasonCalendar(calendar);
 assertSchedule(source.world.schedule,source.world.schools.map(s=>s.id),48,24);
 if(canonicalJson(scheduleHighSchoolCalendar(source.world.schedule,calendar))!==canonicalJson(source.world.schedule))throw new RangeError('CHANGED_SCHOOL_CALENDAR');
 const evidence=collectHighSchoolGrowthEvidence(source),growthIndex=new Map(calendar.growthDays.map((d,i)=>[d,i])),schoolDays=new Set(calendar.highSchoolDays);
 const eligible=evidence.days.filter(d=>schoolDays.has(d.worldDay)),periods:ClosedGrowthPeriod[]=[];
 if(eligible.length!==calendar.highSchoolDays.length)throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 for(let i=0;i<eligible.length;){
  const start=i,plan=eligible[i]!;
  while(i<eligible.length && eligible[i]!.archetype===plan.archetype && canonicalJson(eligible[i]!.focus)===canonicalJson(plan.focus))i++;
  const days=eligible.slice(start,i),startDay=growthIndex.get(plan.worldDay)!,endDay=growthIndex.get(days.at(-1)!.worldDay)!+1;
  periods.push({periodKey:JSON.stringify(['hs-growth',source.world.worldKey,source.world.seasonKey,startDay,endDay]),focus:[...plan.focus],archetype:plan.archetype,period:{startDay,endDay,levelSeasonDays:calendar.highSchoolDays.length,level:'HIGH_SCHOOL',appearances:days.reduce((n,d)=>n+d.appearances,0),pitcherRole:evidence.seasonStartPlayer.position==='RP'?'RP':evidence.seasonStartPlayer.position==='CP'?'CP':'SP',rehabRatio:days.filter(d=>d.rehabilitating).length/days.length,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:true}}});
 }
 const ledger=source.seasonGrowth??createSeasonGrowthLedger(evidence.seasonStartPlayer,source.world.seasonKey,calendar.growthDays.length);
 if(ledger.seasonKey!==source.world.seasonKey || ledger.worldGrowthDays!==calendar.growthDays.length || canonicalJson(ledger.seasonStart)!==canonicalJson(evidence.seasonStartPlayer))throw new RangeError('CHANGED_GROWTH_SEASON');
 const settled=settleClosedGrowthPeriods(source.world.players[evidence.playerKey]!,ledger,periods),career=structuredClone(source);
 career.world.players[evidence.playerKey]=settled.player;career.seasonGrowth=settled.ledger;career.ownAssessment=refreshOwnCareerAssessment(career);career.revision++;
 return {career,budgetUnits:settled.newBudgetUnits,gainedUnits:settled.newGainedUnits,discardedUnits:settled.newDiscardedUnits};
}

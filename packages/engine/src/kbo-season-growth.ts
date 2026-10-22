import {kboMilitaryGrowthPeriods} from './kbo-military-growth.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {settleClosedGrowthPeriods,validateSeasonGrowthLedger} from './growth-ledger.js';
import type {ClosedGrowthPeriod} from './growth-ledger.js';
import {protagonistLeague} from './kbo-windows.js';

/** Pro regular-season growth (42): one registration period over the world growth calendar, PRO denominators
 * (hitter PA 500 / SP outs 450 / RP·CP outs 150), split at MID plan changes,, appearances from official KBO and FUTURES regular games,
 * and the rehabilitation ratio from the closed pro day receipts. Paid once; a replay adds nothing. */
export function settleKboSeasonGrowth(source:KboCareer,expectedRevision:number) {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || !source.days || !source.competitionSchedule)throw new RangeError('INVALID_CAREER_PHASE');
 const calendar=source.world.calendar;assertSeasonCalendar(calendar);validateSeasonGrowthLedger(source.seasonGrowth);
 const key=source.protagonistKey,season=source.world.seasonKey,W=calendar.growthDays.length;
 if(source.seasonGrowth.seasonKey!==season || source.seasonGrowth.worldGrowthDays!==W || source.seasonGrowth.playerKey!==key)throw new RangeError('CHANGED_GROWTH_SEASON');
 const history=source.planHistory;
 if(!history.length || history[0]!.completedTeamGames!==0 || history.some((p,i)=>i>0 && p.completedTeamGames<=history[i-1]!.completedTeamGames))throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
 const all=[...source.competitionSchedule.leagues.KBO,...source.competitionSchedule.leagues.FUTURES];
 const first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 // Postseason days follow the regular range in the same ledger; regular growth reads only the regular range.
 const regularDays=source.days.days.filter(d=>d.day<=last);
 if(regularDays.length!==last-first+1 || regularDays.some((d,i)=>d.day!==first+i))throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 const military=kboMilitaryGrowthPeriods(source);if(military)return publishGrowth(source,military);
 const start=source.seasonGrowth.seasonStart;
 // Plan boundaries: a plan recorded after N team games starts the growth day after my club's N-th game in my league.
 const league=protagonistLeague(source),growthIndex=new Map(calendar.growthDays.map((d,i)=>[d,i]));
 const teamGameDays=Object.values(source.records.games).filter(g=>g.scope.leagueKey===league && g.scope.seasonKey===season && g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,source.protagonistClubId)).map(g=>g.worldDay).sort((a,b)=>a-b);
 const boundaries=history.map(p=>{if(p.completedTeamGames===0)return 0;const d=teamGameDays[p.completedTeamGames-1];if(d===undefined || !growthIndex.has(d))throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');return growthIndex.get(d)!+1;});
 const parts=history.map((_,i)=>({appearances:0,scheduledDays:0,rehabDays:0,start:boundaries[i]!,end:i+1<history.length?boundaries[i+1]!:W}));
 // International barrier days are outside the growth calendar and carry no games; they only advance health state.
 const partOf=(day:number)=>{const g=growthIndex.get(day);return g===undefined?-1:parts.findIndex(p=>g>=p.start && g<p.end);};
 // A registration that began injured from an earlier season starts in rehabilitation.
 let rehabilitating=Object.hasOwn(source.health.injuries,key) && source.health.injuries[key]!.seasonKey!==season && !source.days.days.some(d=>d.result.injured.includes(key));
 for(const closed of regularDays){
  const games=Object.values(source.records.games).filter(g=>g.worldDay===closed.day && g.scope.seasonKey===season && g.scope.phase==='REGULAR' && (g.scope.leagueKey==='KBO' || g.scope.leagueKey==='FUTURES'));
  const mine=games.filter(g=>Object.hasOwn(g.batting,key) || Object.hasOwn(g.pitching,key));
  if(mine.length>1)throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');
  const day=mine[0]?(start.kind==='HITTER'?(mine[0].batting[key]?.PA??0):(mine[0].pitching[key]?.outs??0)):0;
  if(rehabilitating && day>0)throw new RangeError('INVALID_GROWTH_APPEARANCES');
  const index=partOf(closed.day);
  if(index<0){if(games.length>0)throw new RangeError('DAY_OUTSIDE_GROWTH_CALENDAR');}
  else {const part=parts[index]!;part.appearances+=day;if(games.length>0){part.scheduledDays++;if(rehabilitating)part.rehabDays++;}}
  if(closed.result.injured.includes(key))rehabilitating=true;
  if(closed.result.recovered.includes(key))rehabilitating=false;
 }
 if(rehabilitating!==Object.hasOwn(source.health.injuries,key))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
 const periods:ClosedGrowthPeriod[]=history.map((plan,i)=>{const p=parts[i]!;return {periodKey:JSON.stringify(['pro-growth',source.world.worldKey,season,p.start,p.end]),focus:[...plan.focus],archetype:plan.archetype,
  period:{startDay:p.start,endDay:p.end,levelSeasonDays:W,level:'PRO',appearances:p.appearances,pitcherRole:start.position==='RP'?'RP':start.position==='CP'?'CP':'SP',
   rehabRatio:p.scheduledDays?p.rehabDays/p.scheduledDays:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:true}}};});
 return publishGrowth(source,periods);
}
function publishGrowth(source:KboCareer,periods:readonly ClosedGrowthPeriod[]){
 const key=source.protagonistKey,player=source.world.players[key]!;
 const settled=settleClosedGrowthPeriods(player,source.seasonGrowth,periods),career=structuredClone(source);
 if(settled.newBudgetUnits===0 && settled.ledger.entries.length===source.seasonGrowth.entries.length)return {career,budgetUnits:0,gainedUnits:0,discardedUnits:0,duplicate:true};
 career.world.players[key]=settled.player;career.seasonGrowth=settled.ledger;career.revision++;
 return {career,budgetUnits:settled.newBudgetUnits,gainedUnits:settled.newGainedUnits,discardedUnits:settled.newDiscardedUnits,duplicate:false};
}

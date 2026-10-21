import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {settleClosedGrowthPeriods,validateSeasonGrowthLedger} from './growth-ledger.js';
import type {ClosedGrowthPeriod} from './growth-ledger.js';

/** Pro regular-season growth (42): one registration period over the world growth calendar, PRO denominators
 * (hitter PA 500 / SP outs 450 / RP·CP outs 150), appearances from official KBO and FUTURES regular games,
 * and the rehabilitation ratio from the closed pro day receipts. Paid once; a replay adds nothing. */
export function settleKboSeasonGrowth(source:KboCareer,expectedRevision:number) {
 assertCareerRevision(source,expectedRevision);
 if(source.phaseContext.phase!=='SEASON_REVIEW' || !source.days || !source.competitionSchedule)throw new RangeError('INVALID_CAREER_PHASE');
 const calendar=source.world.calendar;assertSeasonCalendar(calendar);validateSeasonGrowthLedger(source.seasonGrowth);
 const key=source.protagonistKey,season=source.world.seasonKey,W=calendar.growthDays.length;
 if(source.seasonGrowth.seasonKey!==season || source.seasonGrowth.worldGrowthDays!==W || source.seasonGrowth.playerKey!==key)throw new RangeError('CHANGED_GROWTH_SEASON');
 if(source.planHistory.length!==1 || source.planHistory[0]!.completedTeamGames!==0)throw new RangeError('UNSUPPORTED_PRO_PLAN_SPLIT');
 const all=[...source.competitionSchedule.leagues.KBO,...source.competitionSchedule.leagues.FUTURES];
 const first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 if(source.days.days.length!==last-first+1 || source.days.days.some((d,i)=>d.day!==first+i))throw new RangeError('INCOMPLETE_GROWTH_DAYS');
 const player=source.world.players[key]!,start=source.seasonGrowth.seasonStart;
 let appearances=0,scheduledDays=0,rehabDays=0;
 // A registration that began injured from an earlier season starts in rehabilitation.
 let rehabilitating=Object.hasOwn(source.health.injuries,key) && source.health.injuries[key]!.seasonKey!==season && !source.days.days.some(d=>d.result.injured.includes(key));
 for(const closed of source.days.days){
  const games=Object.values(source.records.games).filter(g=>g.worldDay===closed.day && g.scope.seasonKey===season && g.scope.phase==='REGULAR' && (g.scope.leagueKey==='KBO' || g.scope.leagueKey==='FUTURES'));
  const mine=games.filter(g=>Object.hasOwn(g.batting,key) || Object.hasOwn(g.pitching,key));
  if(mine.length>1)throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');
  const day=mine[0]?(start.kind==='HITTER'?(mine[0].batting[key]?.PA??0):(mine[0].pitching[key]?.outs??0)):0;
  if(rehabilitating && day>0)throw new RangeError('INVALID_GROWTH_APPEARANCES');
  appearances+=day;
  if(games.length>0){scheduledDays++;if(rehabilitating)rehabDays++;}
  if(closed.result.injured.includes(key))rehabilitating=true;
  if(closed.result.recovered.includes(key))rehabilitating=false;
 }
 if(rehabilitating!==Object.hasOwn(source.health.injuries,key))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
 const plan=source.planHistory[0]!;
 const period:ClosedGrowthPeriod={periodKey:JSON.stringify(['pro-growth',source.world.worldKey,season,0,W]),focus:[...plan.focus],archetype:plan.archetype,
  period:{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances,pitcherRole:start.position==='RP'?'RP':start.position==='CP'?'CP':'SP',
   rehabRatio:scheduledDays?rehabDays/scheduledDays:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:source.difficulty,beneficiary:true}}};
 const settled=settleClosedGrowthPeriods(player,source.seasonGrowth,[period]),career=structuredClone(source);
 if(settled.newBudgetUnits===0 && settled.ledger.entries.length===source.seasonGrowth.entries.length)return {career,budgetUnits:0,gainedUnits:0,discardedUnits:0,duplicate:true};
 career.world.players[key]=settled.player;career.seasonGrowth=settled.ledger;career.revision++;
 return {career,budgetUnits:settled.newBudgetUnits,gainedUnits:settled.newGainedUnits,discardedUnits:settled.newDiscardedUnits,duplicate:false};
}

import {kboRegularEndInjured,kboOpeningGrowthState} from './kbo-growth-health.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {ClosedGrowthPeriod} from './growth-ledger.js';
import type {GameContribution} from './records.js';
import {canonicalJson} from './game.js';
import {kboMilitaryCompletionDays} from './kbo-military-events.js';
import {currentKboSeasonTransfers,kboTransferredRegisteredGames,kboTransferredScheduledGames,kboRegistrationPlanBoundaryDays} from './kbo-transfer-registration.js';

/** New enlistments opt in. Legacy growth receipts retain their exact old allocation. */
export function kboMilitaryGrowthWindow(c:KboCareer):{untilWorldDay:number;kind:'SPORTS'|'ACTIVE'}|null {
 const r=c.military,p=r?.program;
 if(r?.growthPolicyVersion!==1 || !p || !p.blocks.some(b=>b.seasonKey===c.world.seasonKey))return null;
 if(!['SPORTS','ACTIVE'].includes(p.kind) || p.playerKey!==c.protagonistKey || canonicalJson(r.completionDays)!==canonicalJson(kboMilitaryCompletionDays(p)))throw new RangeError('INVALID_MILITARY_GROWTH_CALENDAR');
 const untilWorldDay=r.completionDays!.find(x=>x.seasonKey===c.world.seasonKey)!.worldDay;
 if(p.originalClubId!==c.protagonistClubId){const transfers=currentKboSeasonTransfers(c);if(r.status!=='COMPLETED' || p.completedBlocks!==p.scheduledBlocks || !transfers || transfers[0]!.fromClubId!==p.originalClubId || transfers[0]!.afterWorldDay<untilWorldDay)throw new RangeError('INVALID_MILITARY_GROWTH_CALENDAR');}
 return {untilWorldDay,kind:p.kind};
}
/** Team-game counts follow military registration, then actual original-club registration after return. */
export function kboMilitaryRegisteredGames(c:KboCareer):GameContribution[]|null {
 const window=kboMilitaryGrowthWindow(c);if(currentKboSeasonTransfers(c))return kboTransferredRegisteredGames(c,window);if(!window)return null;
 const key=c.protagonistKey,season=c.world.seasonKey;
 const registrations=new Set(c.health.games.filter(h=>h.evidence.seasonKey===season && h.evidence.roster.includes(key)).map(h=>canonicalJson([h.evidence.gameKey,h.evidence.day,h.evidence.teamKey])));
 const games=Object.values(c.records.games).filter(g=>{
  if(g.scope.seasonKey!==season || g.scope.phase!=='REGULAR' || !['KBO','FUTURES'].includes(g.scope.leagueKey))return false;
  if(g.worldDay<=window.untilWorldDay)return window.kind==='SPORTS' && g.scope.leagueKey==='FUTURES' && Object.hasOwn(g.teams,'SANGMU');
  return Object.hasOwn(g.teams,c.protagonistClubId) && registrations.has(canonicalJson([g.gameKey,g.worldDay,g.scope.leagueKey+':'+c.protagonistClubId]));
 }).sort((a,b)=>a.worldDay-b.worldDay || (a.gameKey<b.gameKey?-1:1));
 if(new Set(games.map(g=>g.worldDay)).size!==games.length)throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');
 return games;
}
export function kboMilitaryScheduledGames(c:KboCareer):number|null {
 const window=kboMilitaryGrowthWindow(c);if(currentKboSeasonTransfers(c))return kboTransferredScheduledGames(c,kboTransferredRegisteredGames(c,window));if(!window)return null;
 if(!c.competitionSchedule)throw new RangeError('KBO_SCHEDULE_REQUIRED');
 const club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!,league=club.firstTeam.includes(c.protagonistKey)?'KBO':'FUTURES';
 const during=window.kind==='ACTIVE'?0:c.competitionSchedule.leagues.FUTURES.filter(g=>g.worldDay<=window.untilWorldDay && (g.homeTeamKey==='SANGMU' || g.awayTeamKey==='SANGMU')).length;
 const after=c.competitionSchedule.leagues[league].filter(g=>g.worldDay>window.untilWorldDay && (g.homeTeamKey===club.id || g.awayTeamKey===club.id)).length;
 return during+after;
}
/** Growth-day partitions share one annual ledger and split both plan changes and the June return. */
export function kboMilitaryGrowthPeriods(c:KboCareer):ClosedGrowthPeriod[]|null {
 const window=kboMilitaryGrowthWindow(c),transfers=currentKboSeasonTransfers(c);if(!window && !transfers)return null;
 const games=kboMilitaryRegisteredGames(c)!,calendar=c.world.calendar.growthDays,W=calendar.length,key=c.protagonistKey,season=c.world.seasonKey;
 const index=new Map(calendar.map((d,i)=>[d,i])),history=c.planHistory,start=c.seasonGrowth.seasonStart;
 const boundaries=transfers?kboRegistrationPlanBoundaryDays(c,games).map((day,i)=>i===0?0:index.get(day)!+1):history.map(p=>{
  if(p.completedTeamGames===0)return 0;
  const day=games[p.completedTeamGames-1]?.worldDay;if(day===undefined || !index.has(day))throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
  return index.get(day)!+1;
 });
 const serviceEnd=window?calendar.filter(day=>day<=window.untilWorldDay).length:0;
 const cuts=[...new Set([0,W,serviceEnd,...boundaries])].sort((a,b)=>a-b);
 const parts=cuts.slice(0,-1).map((begin,i)=>({start:begin,end:cuts[i+1]!,appearances:0,scheduledDays:0,rehabDays:0}));
 const registeredKeys=new Set(games.map(g=>g.gameKey)),dayGames=new Map(games.map(g=>[g.worldDay,g]));
 const official=Object.values(c.records.games).filter(g=>g.scope.seasonKey===season && g.scope.phase==='REGULAR' && ['KBO','FUTURES'].includes(g.scope.leagueKey));
 for(const g of official)if((Object.hasOwn(g.batting,key)||Object.hasOwn(g.pitching,key))&&!registeredKeys.has(g.gameKey))throw new RangeError('INVALID_MILITARY_GROWTH_REGISTRATION');
  const lastRegular=Math.max(...[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES].map(g=>g.worldDay));
 const openingHealth=kboOpeningGrowthState(c);let rehab=openingHealth.injured;
 for(const closed of c.days!.days.filter(d=>d.day<=lastRegular)){
  const game=dayGames.get(closed.day),appearance=game?(start.kind==='HITTER'?game.batting[key]?.PA??0:game.pitching[key]?.outs??0):0,growthIndex=index.get(closed.day);
  if(rehab && appearance>0)throw new RangeError('INVALID_GROWTH_APPEARANCES');
  if(growthIndex===undefined){if(game)throw new RangeError('DAY_OUTSIDE_GROWTH_CALENDAR');}
  else {const part=parts.find(p=>growthIndex>=p.start && growthIndex<p.end)!;part.appearances+=appearance;if(game){part.scheduledDays++;if(rehab)part.rehabDays++;}}
  if(openingHealth.versioned && (closed.result.injured.includes(key) && (rehab || closed.result.recovered.includes(key)) || closed.result.recovered.includes(key) && !rehab))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
  if(closed.result.injured.includes(key))rehab=true;
  if(closed.result.recovered.includes(key))rehab=false;
 }
 if(rehab!==kboRegularEndInjured(c,lastRegular))throw new RangeError('CHANGED_GROWTH_HEALTH_EVIDENCE');
 return parts.map(part=>{
  const plan=history[boundaries.findLastIndex(b=>b<=part.start)]!;
  return {periodKey:JSON.stringify(['pro-growth',c.world.worldKey,season,part.start,part.end,transfers?'transfer-v1':'military-v1',...(openingHealth.versioned?['opening-health-v1']:[])]),focus:[...plan.focus],archetype:plan.archetype,
   period:{startDay:part.start,endDay:part.end,levelSeasonDays:W,level:'PRO',appearances:part.appearances,pitcherRole:start.position==='RP'?'RP':start.position==='CP'?'CP':'SP',rehabRatio:part.scheduledDays?part.rehabDays/part.scheduledDays:0,trainingMultiplier:1,ordinaryMilitary:window?.kind==='ACTIVE' && part.end<=serviceEnd,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:true}}};
 });
}

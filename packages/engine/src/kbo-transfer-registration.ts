import type {KboCareer} from './kbo-career-entry.js';
import type {GameContribution} from './records.js';
import type {KboRosterRepairReceipt} from './kbo-roster-repair.js';

export interface KboSeasonTransfer {
 receiptKey:string;seasonKey:string;playerKey:string;fromClubId:string;toClubId:string;afterWorldDay:number;
 previousContractKey:string;contractKey:string;planBoundaryDays:readonly number[];
 rosterSignings?:KboRosterRepairReceipt['signings'];
 /** Present only for new successful transfers; immutable shared registration witness for E96. */
 sharedRelationKeys?:readonly string[];
}
type MilitaryWindow={untilWorldDay:number;kind:'SPORTS'|'ACTIVE'};

/** Only a successful current-season transfer opts into registration-based windows. Old saves retain their counts. */
export function currentKboSeasonTransfers(c:KboCareer):readonly KboSeasonTransfer[]|null {
 const rows=(c.transferHistory??[]).filter(r=>r.seasonKey===c.world.seasonKey);if(!rows.length)return null;
 const seen=new Set<string>(),lastDay=c.days?.days.at(-1)?.day,calendar=new Set(c.world.calendar.growthDays);
 for(const [i,r] of rows.entries()){
  const previous=rows[i-1];
  if(c.schemaVersion!==4 || !r.receiptKey || seen.has(r.receiptKey) || r.playerKey!==c.protagonistKey || !r.previousContractKey || !r.contractKey || r.previousContractKey===r.contractKey || r.fromClubId===r.toClubId || !c.world.clubs.some(t=>t.id===r.fromClubId) || !c.world.clubs.some(t=>t.id===r.toClubId) || !Number.isSafeInteger(r.afterWorldDay) || r.afterWorldDay<0 || lastDay===undefined || r.afterWorldDay>lastDay || !Array.isArray(r.planBoundaryDays) || !r.planBoundaryDays.length || r.planBoundaryDays.length>c.planHistory.length || r.planBoundaryDays[0]!==0 || r.planBoundaryDays.some((d,j)=>!Number.isSafeInteger(d) || d>r.afterWorldDay || j>0 && (!calendar.has(d) || d<=r.planBoundaryDays[j-1]!)) || previous && (previous.toClubId!==r.fromClubId || previous.contractKey!==r.previousContractKey || previous.afterWorldDay>=r.afterWorldDay || previous.planBoundaryDays.length>r.planBoundaryDays.length || previous.planBoundaryDays.some((d,j)=>r.planBoundaryDays[j]!==d)))throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');
  if(r.sharedRelationKeys!==undefined&&(!Array.isArray(r.sharedRelationKeys)||new Set(r.sharedRelationKeys).size!==r.sharedRelationKeys.length||r.sharedRelationKeys.some(k=>typeof k!=='string'||!k)))throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');
  seen.add(r.receiptKey);
 }
 const latest=rows.at(-1)!,registration=c.registration,contract=c.world.contracts[c.protagonistKey];
 if(latest.toClubId!==c.protagonistClubId || registration.clubId!==latest.toClubId || registration.playerKey!==c.protagonistKey || registration.seasonKey!==c.world.seasonKey || registration.status!=='ACTIVE' || contract?.clubId!==latest.toClubId || contract.contractKey!==latest.contractKey)throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');
 return rows;
}

/** Join immutable health rosters to official games. SPORTS retains its existing military-team registration rule. */
export function kboTransferredRegisteredGames(c:KboCareer,window:MilitaryWindow|null):GameContribution[] {
 const transfers=currentKboSeasonTransfers(c);if(!transfers)throw new RangeError('KBO_TRANSFER_REGISTRATION_REQUIRED');
 const key=c.protagonistKey,season=c.world.seasonKey,registered=new Map<string,GameContribution>(),dates=new Set<number>(),lastDay=c.days!.days.at(-1)!.day;
 const add=(g:GameContribution)=>{if(registered.has(g.gameKey) || dates.has(g.worldDay))throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');registered.set(g.gameKey,g);dates.add(g.worldDay);};
 for(const row of c.health.games){
  const e=row.evidence;if(e.seasonKey!==season || !e.roster.includes(key))continue;
  const g=c.records.games[e.gameKey];if(g && (!['KBO','FUTURES'].includes(g.scope.leagueKey) || g.scope.phase!=='REGULAR'))continue;
  const split=e.teamKey.indexOf(':'),league=e.teamKey.slice(0,split),club=e.teamKey.slice(split+1),expected=transfers.findLast(r=>e.day>r.afterWorldDay)?.toClubId??transfers[0]!.fromClubId;
  if(!g || g.gameKey!==e.gameKey || g.scope.seasonKey!==season || g.scope.leagueKey!==league || g.worldDay!==e.day || !Number.isSafeInteger(e.day) || e.day>lastDay || !['KBO','FUTURES'].includes(league) || g.teams[club]?.games!==1 || Object.keys(g.teams).length!==2 || new Set(e.roster).size!==e.roster.length || club!==expected || window && e.day<=window.untilWorldDay)throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');
  add(g);
 }
 const official=Object.values(c.records.games).filter(g=>g.scope.seasonKey===season && g.scope.phase==='REGULAR' && ['KBO','FUTURES'].includes(g.scope.leagueKey));
 if(window?.kind==='SPORTS')for(const g of official.filter(g=>g.scope.leagueKey==='FUTURES' && g.worldDay<=window.untilWorldDay && Object.hasOwn(g.teams,'SANGMU'))){
  if(g.worldDay>lastDay || g.teams.SANGMU?.games!==1 || Object.keys(g.teams).length!==2)throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');add(g);
 }
 for(const g of official)if((Object.hasOwn(g.batting,key) || Object.hasOwn(g.pitching,key)) && !registered.has(g.gameKey))throw new RangeError('INVALID_KBO_TRANSFER_REGISTRATION');
 return [...registered.values()].sort((a,b)=>a.worldDay-b.worldDay || (a.gameKey<b.gameKey?-1:1));
}

/** Paid registrations before the last move plus the new club's remaining league schedule; never its pre-entry games. */
export function kboTransferredScheduledGames(c:KboCareer,games:readonly GameContribution[]):number {
 const transfer=currentKboSeasonTransfers(c)?.at(-1);if(!transfer || !c.competitionSchedule)throw new RangeError('KBO_TRANSFER_REGISTRATION_REQUIRED');
 const club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,league=club.firstTeam.includes(c.protagonistKey)?'KBO':'FUTURES';
 return games.filter(g=>g.worldDay<=transfer.afterWorldDay).length+c.competitionSchedule.leagues[league].filter(g=>g.worldDay>transfer.afterWorldDay && (g.homeTeamKey===club.id || g.awayTeamKey===club.id)).length;
}

/** Freeze old count-based plan dates at acceptance; subsequent plans use the actual registered-game sequence. */
export function kboRegistrationPlanBoundaryDays(c:KboCareer,games:readonly GameContribution[]):number[] {
 const frozen=currentKboSeasonTransfers(c)?.at(-1)?.planBoundaryDays??[],calendar=new Set(c.world.calendar.growthDays);
 if(!c.planHistory.length || c.planHistory[0]!.completedTeamGames!==0)throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
 const boundaries:number[]=[];
 for(const [i,p] of c.planHistory.entries()){
  const day=i===0?0:frozen[i]??games[p.completedTeamGames-1]?.worldDay;
  if(!Number.isSafeInteger(p.completedTeamGames) || p.completedTeamGames<0 || day===undefined || i>0 && (!calendar.has(day) || day<=boundaries[i-1]!))throw new RangeError('INVALID_GROWTH_PLAN_HISTORY');
  boundaries.push(day);
 }
 return boundaries;
}

import {activateKboOffseasonExit,settleKboOffseasonEntryRelations} from './kbo-offseason-exit.js';
import {returnKboNpcMilitaryPlayers} from './kbo-npc-military.js';
import {createKboServicePayroll,carryKboServicePayroll} from './kbo-service-payroll.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {queueKboMilitaryFirstBlock} from './kbo-military-events.js';
import {prepareKboAiRenewals} from './kbo-ai-offseason.js';
import {runKboAiFreeAgentMarket} from './kbo-fa-market.js';
import {repairKboDualLeagueRosters} from './kbo-roster-repair.js';
import {kboRosterSeasonCharge,reserveKboOffseasonGuarantee} from './kbo-finance.js';
import {nextKboFreeAgentYear} from './kbo-free-agents.js';
import type {KboCareer} from './kbo-career-entry.js';
import {validateSeasonGrowthLedger,createSeasonGrowthLedger} from './growth-ledger.js';
import {kboContractDecisionRequired,acceptedRenewal} from './kbo-renewal.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {createSeasonCalendar} from './season-calendar.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {retireKboOverAgeNpcs} from './kbo-retirement.js';
import {draftKboRookieClass} from './kbo-supply.js';
import {completeSangmuBlock} from './kbo-military-program.js';
import {kboMilitaryStatus,kboMilitaryPlan,advanceKboMilitaryService} from './kbo-military-state.js';
import {returnSangmuPlayers} from './kbo-sangmu-unit.js';
import {leagueStandings} from './standings.js';

export type KboTransitionBlocker='SEASON_NOT_IN_REVIEW'|'POSTSEASON_NOT_COMPLETE'|'SEASON_NOT_CLOSED'|'OPEN_EVENT'|'PENDING_GAME'|'GROWTH_NOT_FINALIZED'|'MAX_AGE_REACHED'|'CONTRACT_DECISION_REQUIRED'|'MILITARY_RESULT_PENDING'|'MILITARY_PLAN_REQUIRED';
/** 14: 45 is the last playable age in every league. */
export const KBO_MAX_PLAYER_AGE=45;

/** 72 Y01 start conditions for my pro career, read-only. Year transition may only be requested when nothing is
 * blocking; growth/aging are checked here, never applied again. A player whose next age passes 45 goes to the
 * retirement/archive path instead of a new season. Reads never change revision or RNG. */
export function kboYearTransitionReadiness(source:KboCareer):{ready:boolean;blockers:KboTransitionBlocker[];targetSeasonKey:string;nextAge:number} {
 const blockers:KboTransitionBlocker[]=[],phase=source.phaseContext;
 if(phase.phase!=='SEASON_REVIEW')blockers.push('SEASON_NOT_IN_REVIEW');
 if(phase.phase==='SEASON_PROGRESS' && phase.pendingGame || phase.phase==='POSTSEASON_PROGRESS' && phase.pendingGame)blockers.push('PENDING_GAME');
 if(!source.postseason?.championKey)blockers.push('POSTSEASON_NOT_COMPLETE');
 if(!source.seasonClose || source.seasonClose.seasonKey!==source.world.seasonKey)blockers.push('SEASON_NOT_CLOSED');
 if(source.events.some(e=>e.status==='OPEN'))blockers.push('OPEN_EVENT');
 validateSeasonGrowthLedger(source.seasonGrowth);
 if(!source.seasonGrowth.finalized)blockers.push('GROWTH_NOT_FINALIZED');
 if(kboContractDecisionRequired(source))blockers.push('CONTRACT_DECISION_REQUIRED');
 if(kboMilitaryStatus(source)==='APPLICATION_PENDING')blockers.push('MILITARY_RESULT_PENDING');
 // Unresolved careers, including legacy saves without a military record, cannot start the age28 season.
 if(kboMilitaryPlan(source).mustResolveBeforeNextSeason)blockers.push('MILITARY_PLAN_REQUIRED');
 const nextAge=source.world.players[source.protagonistKey]!.age+1;
 if(nextAge>KBO_MAX_PLAYER_AGE)blockers.push('MAX_AGE_REACHED');
 return {ready:blockers.length===0,blockers,targetSeasonKey:String(Number(source.world.seasonKey)+1),nextAge};
}

export interface KboAgeContractStage {
 stepKey:string;targetSeasonKey:string;sourceRevision:number;
 players:Record<string,{age:number;contract:{contractKey:string;contractYear:number;years:number;expired:boolean}|null}>;
 /** NPCs whose staged age passes 45: Y04 supply replaces them; no death model. */
 overAge:string[];expiring:string[];
}
/** 72 Y02 staging only: age+1 and contract-year carry for every player of the pro world. Pure and deterministic, so a
 * retry with the same source returns the same output; nothing is activated and growth/aging are never re-applied. */
export function stageKboAgeAndContracts(source:KboCareer):KboAgeContractStage {
 const ready=kboYearTransitionReadiness(source);
 if(!ready.ready)throw new RangeError('YEAR_TRANSITION_NOT_READY');
 const target=Number(ready.targetSeasonKey),players:KboAgeContractStage['players']={},overAge:string[]=[],expiring:string[]=[];
 for(const key of Object.keys(source.world.players).sort()){
  const age=source.world.players[key]!.age+1,c=source.world.contracts[key],renewed=key===source.protagonistKey?acceptedRenewal(source):null;
  const residual=c?.servicePay?kboContractPaymentBalance(c.servicePay.ledger).remainingPaidGameDays:0;
  const contract=renewed?{contractKey:renewed.offerKey,contractYear:1,years:1,expired:false}:c?.servicePay && residual>0?{contractKey:c.contractKey,contractYear:1,years:Math.ceil(residual/144),expired:false}:c?.servicePay?{contractKey:c.contractKey,contractYear:c.years+1,years:c.years,expired:true}:c?{contractKey:c.contractKey,contractYear:target-Number(c.seasonKey)+1,years:c.years,expired:target-Number(c.seasonKey)+1>c.years}:null;
  players[key]={age,contract};
  if(age>KBO_MAX_PLAYER_AGE)overAge.push(key);
  if(contract?.expired)expiring.push(key);
 }
 return {stepKey:JSON.stringify(['kbo-year-transition','Y02',source.world.worldKey,ready.targetSeasonKey]),targetSeasonKey:ready.targetSeasonKey,sourceRevision:source.revision,players,overAge,expiring};
}

/** One finished pro season kept for reads; official records stay in the shared ledger. */
export interface KboSeasonArchive {seasonKey:string;seasonClose:NonNullable<KboCareer['seasonClose']>;postseason:NonNullable<KboCareer['postseason']>;days:NonNullable<KboCareer['days']>;seasonGrowth:KboCareer['seasonGrowth'];planHistory:KboCareer['planHistory'];openingRoster?:KboCareer['openingRoster'];callupReviews?:KboCareer['callupReviews']}
/** 72 atomic activation for my pro world: the Y02 stage is applied to every player at once (age+1, contract carry,
 * my accepted renewal), the next calendar and fresh season ledgers open, and the career returns to PRESEASON_SETUP.
 * Earned growth, P, books (maturity) and history carry; nothing is re-grown or re-aged. */
export function startNextKboSeason(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const stage=stageKboAgeAndContracts(source),target=stage.targetSeasonKey,key=source.protagonistKey;
 if(Object.values(source.records.games).some(g=>g.scope.seasonKey===target))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const career=structuredClone(source),renewal=acceptedRenewal(source);let world=career.world;
 // Older saves kept the retired contract snapshot but had no finance ledger. Restore it only in this explicit writer.
 for(const r of source.retiredPlayers??[])reserveKboOffseasonGuarantee(world,r.contract,r.lastSeasonKey,'RETIREMENT');
 // Y04: 45-year retirements first, then the yearly rookie class (15) after the new contracts are in place.
 const retired=retireKboOverAgeNpcs(world,stage.overAge,source.world.seasonKey,true);
 if(retired.length)career.retiredPlayers=[...(source.retiredPlayers??[]),...retired];
 for(const r of retired)delete career.health.injuries[r.playerKey];
 for(const [k,s] of Object.entries(stage.players)){
  if(!Object.hasOwn(world.players,k))continue;
  world.players[k]={...world.players[k]!,age:s.age,fatigue:0};
  const c=world.contracts[k]!;
  // Temporary expired placeholders stay private until the AI renewal stage resolves them.
  world.contracts[k]=k===key && renewal?{...c,contractKey:renewal.offerKey,clubId:renewal.clubId,seasonKey:target,years:1,annualSalaryWon:renewal.annualSalaryWon}:{...c,seasonKey:target,years:s.contract!.expired?1:c.years-(s.contract!.contractYear-1)};
  const activated=world.contracts[k]!;
  if(k===key && renewal){
   if(c.servicePay || c.remainderPay){if(c.remainderPay && !c.remainderPay.settlement)throw new RangeError('KBO_REMAINDER_NOT_FINALIZED');if(career.contractHistory?.some(h=>h.contractKey===c.contractKey))throw new RangeError('DUPLICATE_CONTRACT_HISTORY');career.contractHistory=[...(career.contractHistory??[]),structuredClone(c)];}
   delete activated.servicePay;delete activated.remainderPay;activated.status='ACTIVE';
  }
  else if(c.servicePay){activated.servicePay=carryKboServicePayroll(c,target);activated.years=Math.max(1,Math.ceil(kboContractPaymentBalance(activated.servicePay.ledger).remainingPaidGameDays/144));}
  const service=career.military,program=service?.program;
  if(k===key && !activated.servicePay && service?.contractPaymentVersion===1 && ['SERVING_SPORTS','SERVING_ACTIVE'].includes(service.status) && program?.blocks[0]?.seasonKey===target && service.completionDays){activated.servicePay=createKboServicePayroll(activated,program,service.completionDays[1]!);activated.years=Math.ceil(program.contract.remainingPaidGameDays/144);}
  const book=schoolYearEndRepertoire(source,k);if(book)world.repertoires[k]={...structuredClone(book),seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 for(const [k,c] of Object.entries(world.suspendedContracts??{})){const carried={...c,seasonKey:target,servicePay:carryKboServicePayroll(c,target)};carried.years=Math.max(1,Math.ceil(kboContractPaymentBalance(carried.servicePay.ledger).remainingPaidGameDays/144));world.suspendedContracts![k]=carried;}
 activateKboOffseasonExit(source,career);
 for(const club of world.clubs){club.paidSalaryWon=0;club.reservedSalaryWon=kboRosterSeasonCharge(world,club.id);}
 world.seasonKey=target;world.calendar=createSeasonCalendar(Number(target));
// Military unit carries over: members age and reset their books like everyone else, the block of the season just played is
// recorded complete on its last day, and finished programs rejoin their club's Futures squad (full clubs wait in the unit).
// Legacy/NPC unit members still complete at year close; versioned protagonist programs use their actual completion-day ledger.
advanceKboMilitaryService(career,source.world.seasonKey,source.days!.days.at(-1)!.day);
if(career.sangmu){
 for(const e of Object.values(career.sangmu.emergency?.entries??{}))if(e.released===null)e.released={seasonKey:source.world.seasonKey,worldDay:source.days!.days.at(-1)!.day};
 const lastDay=source.days!.days.at(-1)!.day,members=Object.fromEntries(Object.entries(career.sangmu.members).map(([k,m])=>{
  const open=world.suspendedContracts?.[k]?undefined:m.program.blocks.find(b=>b.seasonKey===source.world.seasonKey && b.completedWorldDay===null);
  return [k,{...m,player:{...m.player,age:m.player.age+1,fatigue:0},repertoire:m.repertoire?{...m.repertoire,seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()}:null,program:open?completeSangmuBlock(m.program,open.seasonKey,lastDay):m.program}];
 }));
 career.sangmu=returnSangmuPlayers(world,{...career.sangmu,members},target).unit;
}
 const pool=nextKboFreeAgentYear({...(source.freeAgents?{source:source.freeAgents}:{}),worldKey:world.worldKey,seed:world.seed,seasonKey:target,difficulty:career.difficulty,registeredKeys:Object.keys(world.players)});
 const prepared=prepareKboAiRenewals({world,pool,priorContracts:source.world.contracts,expiringKeys:stage.expiring.filter(k=>Object.hasOwn(world.players,k)),protagonistKey:key,sourceSeasonKey:source.world.seasonKey,records:source.records,health:career.health,...(source.aiAssessments?{reports:source.aiAssessments}:{})});
 // This AI-only schedule closes FA before the draft;115 permits deadline-dependent ordering, not UI order.
 const market=runKboAiFreeAgentMarket({...prepared,reports:prepared.reports,sourceSeasonKey:source.world.seasonKey,records:source.records,difficulty:career.difficulty});
 world=market.world;career.world=world;career.health=market.health;career.freeAgents=market.pool;career.aiAssessments=market.reports;
 const standings=leagueStandings(source.records,{seasonKey:source.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},world.clubs.map(c=>c.id),source.world.seed,source.world.worldKey);
 career.rookieDrafts=[...(source.rookieDrafts??[]),draftKboRookieClass(world,target,standings.map(s=>s.teamKey).reverse(),source.difficulty)];
 // Normal recruitment gets the first chance to fill gaps. Safety supply covers only what is still impossible.
 const repaired=repairKboDualLeagueRosters({world,pool:market.pool,health:market.health,protagonistKey:key,difficulty:career.difficulty});
 world=repaired.world;career.world=world;career.health=repaired.health;career.freeAgents=repaired.pool;returnKboNpcMilitaryPlayers(career,0);
 career.aiOffseasons=[...(source.aiOffseasons??[]),{seasonKey:target,renewal:prepared.receipt,repair:repaired.receipt,rounds:market.rounds}];
 assertKboRecruitmentWorld(world);
 const player=world.players[key]!,club=world.clubs.find(c=>c.id===career.protagonistClubId)!;
 const archive:KboSeasonArchive={seasonKey:source.world.seasonKey,seasonClose:source.seasonClose!,postseason:source.postseason!,days:source.days!,seasonGrowth:source.seasonGrowth,planHistory:source.planHistory,...(source.openingRoster?{openingRoster:source.openingRoster}:{}),...(source.callupReviews?{callupReviews:source.callupReviews}:{})};
 career.proSeasons=[...(source.proSeasons??[]),structuredClone(archive)];
 career.registration={playerKey:key,clubId:club.id,seasonKey:target,status:'ACTIVE',firstTeam:club.firstTeam.includes(key)};
 career.seasonGrowth=createSeasonGrowthLedger(player,target,world.calendar.growthDays.length);
 career.development={...career.development,seasonStartPlayer:structuredClone(player)};
 career.planHistory=[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}];
 if(career.traits)career.traits={...career.traits,lastClosedDay:null,lastSeasonKey:target};
 for(const field of ['days','seasonClose','postseason','preseasonPlan','openingRoster','competitionSchedule','callupReviews'] as const)delete career[field];
 // New unplayed season can adopt registration-aware growth without rewriting any prior receipts or plan boundaries.
 if(career.military?.completionDays && career.military.program?.blocks.some(b=>b.seasonKey===target))career.military.growthPolicyVersion=1;
 if(career.schemaVersion<3)career.schemaVersion=3;career.phaseContext={phase:'PRESEASON_SETUP'};settleKboOffseasonEntryRelations(source,career);career.revision++;queueKboMilitaryFirstBlock(career);return career;
}

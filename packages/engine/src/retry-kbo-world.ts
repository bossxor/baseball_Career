import type {KboCareer,ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import {nextKboFreeAgentYear,settleKboFreeAgentSeason} from './kbo-free-agents.js';
import {prepareKboAiRenewals} from './kbo-ai-offseason.js';
import {runKboAiFreeAgentMarket} from './kbo-fa-market.js';
import {repairKboDualLeagueRosters} from './kbo-roster-repair.js';
import {draftKboRookieClass} from './kbo-supply.js';
import {retireKboOverAgeNpcs} from './kbo-retirement.js';
import {kboRosterSeasonCharge} from './kbo-finance.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {carryKboServicePayroll} from './kbo-service-payroll.js';
import {createSeasonCalendar} from './season-calendar.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

/** Contractless protagonist is excluded from AI renewal, market, draft and safety signings. */
export function advanceRetryKboWorld(source:KboCareer,worldSource:ActiveKboRosterWorld,poolSource?:KboFreeAgentPool){
 let world=structuredClone(worldSource);const prior=structuredClone(world.contracts),oldSeason=world.seasonKey,target=String(Number(oldSeason)+1),key=source.protagonistKey,expired:string[]=[];
 const health=structuredClone(source.health);delete health.injuries[key];
 for(const club of world.clubs){club.roster=club.roster.filter(k=>k!==key);club.firstTeam=club.firstTeam.filter(k=>k!==key);}
 delete world.players[key];delete world.contracts[key];delete world.repertoires[key];
 const retired=retireKboOverAgeNpcs(world,Object.keys(world.players).filter(k=>world.players[k]!.age>=45),oldSeason,true);
 for(const r of retired)delete health.injuries[r.playerKey];
 for(const [k,p]of Object.entries(world.players)){
  p.age++;p.fatigue=0;const c=world.contracts[k]!,remaining=c.servicePay?kboContractPaymentBalance(c.servicePay.ledger).remainingPaidGameDays:null;
  const ends=remaining===null?Number(c.seasonKey)+c.years-1<=Number(oldSeason):remaining===0;
  if(ends)expired.push(k);
  if(c.servicePay){c.servicePay=carryKboServicePayroll(c,target,'calendar-2');c.years=Math.max(1,Math.ceil(remaining!/144));}
  else c.years=ends?1:Number(c.seasonKey)+c.years-Number(target);
  c.seasonKey=target;
  const book=world.repertoires[k];if(book){if(book.learning)throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');book.seasonId=target;book.usedWindows=[];book.ledger=emptyPitchXpLedger();}
 }
 world.seasonKey=target;world.calendar=createSeasonCalendar(Number(target),'calendar-2');
 for(const club of world.clubs){club.paidSalaryWon=0;club.reservedSalaryWon=kboRosterSeasonCharge(world,club.id);}
 const closedPool=poolSource&&!poolSource.settlement?settleKboFreeAgentSeason(poolSource,worldSource.calendar,source.difficulty):poolSource;
 const pool=nextKboFreeAgentYear({...(closedPool?{source:closedPool}:{}),worldKey:world.worldKey,seed:world.seed,seasonKey:target,difficulty:source.difficulty,registeredKeys:Object.keys(world.players)});
 const renewed=prepareKboAiRenewals({world,pool,priorContracts:prior,expiringKeys:expired,protagonistKey:key,sourceSeasonKey:oldSeason,records:source.records,health});
 const market=runKboAiFreeAgentMarket({...renewed,sourceSeasonKey:oldSeason,records:source.records,difficulty:source.difficulty});world=market.world;
 const draft=draftKboRookieClass(world,target,world.clubs.map(c=>c.id),source.difficulty);
 const repaired=repairKboDualLeagueRosters({world,pool:market.pool,health:market.health,difficulty:source.difficulty});assertKboRecruitmentWorld(repaired.world);
 return {...repaired,retired,draft,rounds:market.rounds,renewal:renewed.receipt};
}

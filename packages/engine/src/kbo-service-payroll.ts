import {kboRemainderSeasonCharge,settleKboRemainderPayrollDay} from './kbo-remainder-pay.js';
import {KBO_CLUBS} from '@playball/rules';
import type {KboInitialContract} from './kbo-world.js';
import type {KboMilitaryProgram} from './kbo-military-program.js';
import type {KboContractPaymentLedger} from './kbo-contract-payments.js';
import {createKboContractPaymentLedger,assertKboContractPaymentLedger,kboContractPaymentBalance} from './kbo-contract-payments.js';
import {resumedContractPayment} from './kbo-military-program.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createKboFutures11Schedule} from './kbo-futures-schedule.js';

/** Optional extension. Original annual salary stays immutable; this is the current-year reservation, not a new deal. */
export interface KboServicePayroll {
 schemaVersion:1;kind:'SPORTS';ledger:KboContractPaymentLedger;seasonKey:string;reservedGameDays:number;
 returnDate:{seasonKey:string;worldDay:number};
}
const june30=(year:number)=>year%4===0 && (year%100!==0 || year%400===0)?181:180;
const forecastCache=new Map<string,number>();
/** Pure calendar forecast, memoized off the serialized state; reloads produce exactly the same value without RNG. */
function returnCapacity(clubId:string,year:string,day:number):number {
 const key=JSON.stringify([clubId,year,day]),old=forecastCache.get(key);if(old!==undefined)return old;
 const schedule=createKboFutures11Schedule([...KBO_CLUBS.map(c=>c.id),'SANGMU'],year,createSeasonCalendar(Number(year)));
 const n=schedule.filter(g=>g.worldDay>day && (g.homeTeamKey===clubId || g.awayTeamKey===clubId)).length;forecastCache.set(key,n);return n;
}
export function assertKboServicePayroll(contract:KboInitialContract):void {
 const p=contract.servicePay;if(!p)return;assertKboContractPaymentLedger(p.ledger);
 const s=p.ledger.contract,b=kboContractPaymentBalance(p.ledger);
 if(p.ledger.resume && (p.ledger.resume.completedSeasonKey!==p.returnDate.seasonKey || p.ledger.resume.completedWorldDay!==p.returnDate.worldDay))throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
 if(p.schemaVersion!==1 || p.kind!=='SPORTS' || p.ledger.schemaVersion!==2 || p.seasonKey!==contract.seasonKey || !/^\d{4}$/.test(p.returnDate.seasonKey) || Number(p.returnDate.seasonKey)<2027 || p.returnDate.worldDay!==june30(Number(p.returnDate.seasonKey)) || s.contractKey!==contract.contractKey || s.playerKey!==contract.playerKey || s.clubId!==contract.clubId || s.annualSalaryWon!==contract.annualSalaryWon || !Number.isSafeInteger(p.reservedGameDays) || p.reservedGameDays<0 || p.reservedGameDays>b.remainingPaidGameDays || p.reservedGameDays>144)throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
}
export const kboContractSuspended=(c:KboInitialContract)=>!!c.servicePay && c.servicePay.ledger.resume===null;
/** Same season receipts have been paid; only the remaining reservation remains unpaid. */
export function kboContractSeasonCharge(contract:KboInitialContract):number {
 if(contract.remainderPay)return kboRemainderSeasonCharge(contract);
 if(contract.status==='ACTIVE_PRORATED')throw new RangeError('KBO_REMAINDER_REQUIRED');
 if(!contract.servicePay)return contract.annualSalaryWon;assertKboServicePayroll(contract);
 const p=contract.servicePay,paid=p.ledger.receipts.filter(r=>r.seasonKey===contract.seasonKey).reduce((n,r)=>n+r.amountWon,0);
 return paid+resumedContractPayment(p.ledger.contract,p.ledger.receipts.length,p.reservedGameDays);
}
function capacity(p:KboServicePayroll,clubId:string,seasonKey:string):number {
 if(Number(seasonKey)<Number(p.returnDate.seasonKey))return 0;
 return seasonKey===p.returnDate.seasonKey?returnCapacity(clubId,seasonKey,p.returnDate.worldDay):144;
}
export function createKboServicePayroll(contract:KboInitialContract,program:KboMilitaryProgram,returnDate:{seasonKey:string;worldDay:number}):KboServicePayroll {
 if(program.blocks[1]?.seasonKey!==returnDate.seasonKey)throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
 const p:KboServicePayroll={schemaVersion:1,kind:'SPORTS',ledger:createKboContractPaymentLedger(program),seasonKey:contract.seasonKey,reservedGameDays:0,returnDate:{...returnDate}};
 p.reservedGameDays=Math.min(p.ledger.contract.remainingPaidGameDays,capacity(p,contract.clubId,contract.seasonKey));assertKboServicePayroll({...contract,servicePay:p});return p;
}
/** Called only during actual Y02 activation. Past receipts and frozen principal never reset. */
export function carryKboServicePayroll(contract:KboInitialContract,targetSeasonKey:string):KboServicePayroll {
 assertKboServicePayroll(contract);if(!contract.servicePay || !/^\d{4}$/.test(targetSeasonKey) || Number(targetSeasonKey)!==Number(contract.seasonKey)+1)throw new RangeError('INVALID_KBO_PAYROLL_CARRY');
 const p=structuredClone(contract.servicePay);p.seasonKey=targetSeasonKey;
 p.reservedGameDays=Math.min(kboContractPaymentBalance(p.ledger).remainingPaidGameDays,capacity(p,contract.clubId,targetSeasonKey));return p;
}
/** Project residual paid days after this year's reserved portion into later seasons; never calendar-years +1. */
export function kboServiceFutureCommitment(contract:KboInitialContract,yearOffset:number):number {
 if(!Number.isSafeInteger(yearOffset) || yearOffset<1 || yearOffset>3)throw new RangeError('INVALID_KBO_FUTURE_YEAR');
 if(contract.remainderPay){kboRemainderSeasonCharge(contract);return 0;}
 if(!contract.servicePay)return contract.years>yearOffset?contract.annualSalaryWon:0;assertKboServicePayroll(contract);
 const p=contract.servicePay,all=p.ledger.contract.remainingPaidGameDays;let index=p.ledger.receipts.length+p.reservedGameDays;
 for(let offset=1;offset<=yearOffset;offset++){
  const year=String(Number(contract.seasonKey)+offset),n=Math.min(Math.max(0,all-index),capacity(p,contract.clubId,year));
  if(offset===yearOffset)return resumedContractPayment(p.ledger.contract,index,n);index+=n;
 }
 return 0;
}
import type {KboCareer} from './kbo-career-entry.js';
import {recordKboContractPayment} from './kbo-contract-payments.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

/** Internal daily transaction hook; caller owns the clone. All games and registration receipts must already be final. */
export function settleKboServicePayrollDay(career:KboCareer,day:number):void {
 const c=career.world.contracts[career.protagonistKey]!;if(c.remainderPay){settleKboRemainderPayrollDay(career,day);return;}if(!c.servicePay)return;
 if(!career.competitionSchedule || career.days?.days.at(-1)?.day!==day)throw new RangeError('PAYROLL_DAY_NOT_FINAL');
 const oldCharge=kboContractSeasonCharge(c),p=c.servicePay,club=career.world.clubs.find(x=>x.id===c.clubId)!;
 const matches=career.health.games.map(x=>x.evidence).filter(r=>r.seasonKey===career.world.seasonKey && r.day===day && r.roster.includes(c.playerKey) && ['KBO:'+c.clubId,'FUTURES:'+c.clubId].includes(r.teamKey));
 if(matches.length>1 || matches.length && !p.ledger.resume)throw new RangeError('INVALID_SERVICE_PAYROLL_REGISTRATION');
 let paid=0;
 if(matches.length){
  const registration=matches[0]!,game=career.records.games[registration.gameKey];if(!game)throw new RangeError('PAYROLL_GAME_NOT_FINAL');
  // Exhausted service principal must never silently become free play. The contract choice owns renewal.
  if(kboContractPaymentBalance(p.ledger).remainingPaidGameDays===0 && !p.ledger.receipts.some(r=>r.gameKey===game.gameKey))throw new RangeError('CONTRACT_DECISION_REQUIRED');
  const result=recordKboContractPayment(p.ledger,game,registration);p.ledger=result.ledger;paid=result.paidWon;
 }
 const beforeReturn=Number(career.world.seasonKey)<Number(p.returnDate.seasonKey);
 const threshold=p.ledger.resume?day:Math.max(day,p.returnDate.worldDay);
 const league=club.firstTeam.includes(c.playerKey)?'KBO':'FUTURES';
 const future=beforeReturn?0:career.competitionSchedule.leagues[league].filter(g=>g.worldDay>threshold && (g.homeTeamKey===c.clubId || g.awayTeamKey===c.clubId)).length;
 p.reservedGameDays=Math.min(kboContractPaymentBalance(p.ledger).remainingPaidGameDays,future);
 const newCharge=kboContractSeasonCharge(c);club.reservedSalaryWon+=newCharge-oldCharge-paid;club.paidSalaryWon+=paid;
 assertKboRecruitmentWorld(career.world);
}

/** Public own-contract projection. Frozen receipts/program internals never leave the engine. */
export function kboServiceContractView(contract:KboInitialContract){
 if(!contract.servicePay)return null;assertKboServicePayroll(contract);
 const p=contract.servicePay,b=kboContractPaymentBalance(p.ledger),paidThisSeasonWon=p.ledger.receipts.filter(r=>r.seasonKey===contract.seasonKey).reduce((n,r)=>n+r.amountWon,0);
 return {status:b.status,remainingPaidGameDays:b.remainingPaidGameDays,paidGameDays:b.paidDays,unpaidPrincipalWon:b.remainingWon,paidThisSeasonWon,reservedThisSeasonWon:kboContractSeasonCharge(contract)-paidThisSeasonWon,returnSeasonKey:p.returnDate.seasonKey,returnWorldDay:p.returnDate.worldDay};
}

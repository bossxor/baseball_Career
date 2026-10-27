import type {CalendarVersion} from './season-calendar.js';
import {kboClubBalance,protectKboServiceBudget} from './kbo-finance.js';
import {kboRemainderSeasonCharge,settleKboPlayerRemainderPayrollDay} from './kbo-remainder-pay.js';
import {createKboSeasonSchedules} from './kbo-schedule.js';
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
 calendarVersion?:CalendarVersion;
 schemaVersion:1;kind:'SPORTS'|'ACTIVE';ledger:KboContractPaymentLedger;seasonKey:string;reservedGameDays:number;
 returnDate:{seasonKey:string;worldDay:number};
}
const june30=(year:number)=>year%4===0 && (year%100!==0 || year%400===0)?181:180;
const forecastCache=new Map<string,number>();
/** Pure calendar forecast, memoized off the serialized state; reloads produce exactly the same value without RNG. */
function returnCapacity(clubId:string,year:string,day:number,version:CalendarVersion):number {
 const key=JSON.stringify([clubId,year,day,version]),old=forecastCache.get(key);if(old!==undefined)return old;
 const schedule=createKboFutures11Schedule([...KBO_CLUBS.map(c=>c.id),'SANGMU'],year,createSeasonCalendar(Number(year),version));
 const n=schedule.filter(g=>g.worldDay>day && (g.homeTeamKey===clubId || g.awayTeamKey===clubId)).length;forecastCache.set(key,n);return n;
}
export function assertKboServicePayroll(contract:KboInitialContract):void {
 const p=contract.servicePay;if(!p)return;assertKboContractPaymentLedger(p.ledger);
 const s=p.ledger.contract,b=kboContractPaymentBalance(p.ledger);
 if(p.ledger.resume && (p.ledger.resume.completedSeasonKey!==p.returnDate.seasonKey || p.ledger.resume.completedWorldDay!==p.returnDate.worldDay))throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
 if(p.calendarVersion!==undefined&&!['calendar-1','calendar-2'].includes(p.calendarVersion))throw new RangeError('INVALID_KBO_PAYROLL_CALENDAR');
 if(p.schemaVersion!==1 || !['SPORTS','ACTIVE'].includes(p.kind) || p.ledger.schemaVersion!==2 || p.seasonKey!==contract.seasonKey || !/^\d{4}$/.test(p.returnDate.seasonKey) || Number(p.returnDate.seasonKey)<2027 || p.returnDate.worldDay!==june30(Number(p.returnDate.seasonKey)) || s.contractKey!==contract.contractKey || s.playerKey!==contract.playerKey || s.clubId!==contract.clubId || s.annualSalaryWon!==contract.annualSalaryWon || !Number.isSafeInteger(p.reservedGameDays) || p.reservedGameDays<0 || p.reservedGameDays>b.remainingPaidGameDays || p.reservedGameDays>144)throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
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
 if(seasonKey!==p.returnDate.seasonKey)return 144;
 const version=p.calendarVersion??'calendar-1',futures=returnCapacity(clubId,seasonKey,p.returnDate.worldDay,version);if(p.kind==='SPORTS')return futures;
 const schedules=createKboSeasonSchedules(KBO_CLUBS.map(c=>c.id),seasonKey,createSeasonCalendar(Number(seasonKey),version));
 return Math.max(futures,...Object.values(schedules).map(games=>games.filter(g=>g.worldDay>p.returnDate.worldDay && (g.homeTeamKey===clubId || g.awayTeamKey===clubId)).length));
}
export function createKboServicePayroll(contract:KboInitialContract,program:KboMilitaryProgram,returnDate:{seasonKey:string;worldDay:number},calendarVersion:CalendarVersion='calendar-1'):KboServicePayroll {
 if(!['calendar-1','calendar-2'].includes(calendarVersion))throw new RangeError('INVALID_KBO_PAYROLL_CALENDAR');
 if(program.blocks[1]?.seasonKey!==returnDate.seasonKey)throw new RangeError('INVALID_KBO_SERVICE_PAYROLL');
 const p:KboServicePayroll={schemaVersion:1,...(calendarVersion==='calendar-2'?{calendarVersion}:{}),kind:program.kind,ledger:createKboContractPaymentLedger(program),seasonKey:contract.seasonKey,reservedGameDays:0,returnDate:{...returnDate}};
 p.reservedGameDays=Math.min(p.ledger.contract.remainingPaidGameDays,capacity(p,contract.clubId,contract.seasonKey));assertKboServicePayroll({...contract,servicePay:p});return p;
}
/** Called only during actual Y02 activation. Past receipts and frozen principal never reset. */
export function carryKboServicePayroll(contract:KboInitialContract,targetSeasonKey:string,calendarVersion:CalendarVersion=contract.servicePay?.calendarVersion??'calendar-1'):KboServicePayroll {
 if(!['calendar-1','calendar-2'].includes(calendarVersion))throw new RangeError('INVALID_KBO_PAYROLL_CALENDAR');
 assertKboServicePayroll(contract);if(!contract.servicePay || !/^\d{4}$/.test(targetSeasonKey) || Number(targetSeasonKey)!==Number(contract.seasonKey)+1)throw new RangeError('INVALID_KBO_PAYROLL_CARRY');
 const p=structuredClone(contract.servicePay);p.seasonKey=targetSeasonKey;if(calendarVersion==='calendar-2')p.calendarVersion=calendarVersion;else delete p.calendarVersion;
 p.reservedGameDays=Math.min(kboContractPaymentBalance(p.ledger).remainingPaidGameDays,capacity(p,contract.clubId,targetSeasonKey));return p;
}
/** Project residual paid days after this year's reserved portion into later seasons; never calendar-years +1. */
export function kboServiceFutureCommitment(contract:KboInitialContract,yearOffset:number):number {
 if(!Number.isSafeInteger(yearOffset) || yearOffset<1 || yearOffset>6)throw new RangeError('INVALID_KBO_FUTURE_YEAR');
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
export function settleKboServicePayrollDay(career:KboCareer,day:number):void {settleKboPlayerServicePayrollDay(career,career.protagonistKey,day);}
export function settleKboPlayerServicePayrollDay(career:KboCareer,playerKey:string,day:number):void {
 const c=career.world.contracts[playerKey]??career.world.suspendedContracts?.[playerKey];if(!c)throw new RangeError('MISSING_KBO_SERVICE_CONTRACT');if(c.remainderPay){settleKboPlayerRemainderPayrollDay(career,playerKey,day);return;}if(!c.servicePay)return;
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
 protectKboServiceBudget(career.world,club.id);
 assertKboRecruitmentWorld(career.world);
}

/** Public own-contract projection. Frozen receipts/program internals never leave the engine. */
export function kboServiceContractView(contract:KboInitialContract){
 if(!contract.servicePay)return null;assertKboServicePayroll(contract);
 const p=contract.servicePay,b=kboContractPaymentBalance(p.ledger),paidThisSeasonWon=p.ledger.receipts.filter(r=>r.seasonKey===contract.seasonKey).reduce((n,r)=>n+r.amountWon,0);
 return {status:b.status,remainingPaidGameDays:b.remainingPaidGameDays,paidGameDays:b.paidDays,unpaidPrincipalWon:b.remainingWon,paidThisSeasonWon,reservedThisSeasonWon:kboContractSeasonCharge(contract)-paidThisSeasonWon,returnSeasonKey:p.returnDate.seasonKey,returnWorldDay:p.returnDate.worldDay};
}

/** No official registration while serving ACTIVE; ownership/master roster remains unchanged. */
export const kboActiveContractSuspended=(c:KboInitialContract)=>c.servicePay?.kind==='ACTIVE' && c.servicePay.ledger.resume===null;


/** Registration changes fund the combined calendar difference before exposing an extra payable date. */
export function reserveKboNpcServiceRosterChange(c:KboCareer,clubId:string,nextFirstTeam:readonly string[]):boolean {
 const club=c.world.clubs.find(t=>t.id===clubId);if(!club)throw new RangeError('KBO_SERVICE_ROSTER_CONTEXT_REQUIRED');
 const affected=club.roster.filter(key=>c.world.contracts[key]!.servicePay?.ledger.resume && club.firstTeam.includes(key)!==nextFirstTeam.includes(key));if(!affected.length)return true;
 if(!c.competitionSchedule || !c.days?.days.length)throw new RangeError('KBO_SERVICE_ROSTER_CONTEXT_REQUIRED');
 const day=c.days.days.at(-1)!.day,changes:KboInitialContract[]=[];let delta=0;
 for(const key of affected){
  const old=c.world.contracts[key]!;
  const next=structuredClone(old),league=nextFirstTeam.includes(key)?'KBO':'FUTURES';
  const n=c.competitionSchedule.leagues[league].filter(g=>g.worldDay>day && (g.homeTeamKey===club.id || g.awayTeamKey===club.id)).length;
  next.servicePay!.reservedGameDays=Math.min(kboContractPaymentBalance(next.servicePay!.ledger).remainingPaidGameDays,n);delta+=kboContractSeasonCharge(next)-kboContractSeasonCharge(old);changes.push(next);
 }
 if(delta>kboClubBalance(c.world,club.id).availableWon)return false;
 for(const next of changes)c.world.contracts[next.playerKey]=next;club.reservedSalaryWon+=delta;return true;
}

import {KBO_CLUBS,KBO_MONEY} from '@playball/rules';
import type {KboInitialContract} from './kbo-world.js';
import type {KboServicePayroll} from './kbo-service-payroll.js';
import {assertKboServicePayroll} from './kbo-service-payroll.js';
import {kboContractPaymentBalance,kboRegisteredContractEvidence} from './kbo-contract-payments.js';
import type {KboContractPaymentReceipt} from './kbo-contract-payments.js';
import type {GameContribution} from './records.js';
import type {HealthGame} from './health.js';

/** Calendar-limited new deal. The preceding military principal and receipts remain immutable. */
export interface KboRemainderPay {
 schemaVersion:1|2;seasonKey:string;startAfterWorldDay:number;endWorldDay:number;dailyWon:number;reservedGameDays:number;
 previous:Omit<KboInitialContract,'servicePay'|'remainderPay'> & {servicePay:KboServicePayroll};
 receipts:readonly KboContractPaymentReceipt[];settlement:null|{worldDay:number;adjustmentWon:number};
}
const integer=(n:number)=>Number.isSafeInteger(n)&&n>=0;
export function assertKboRemainderPay(c:KboInitialContract):void {
 const p=c.remainderPay;if(!p)return;
 if(c.servicePay || c.status!=='ACTIVE_PRORATED' || c.years!==1 || c.signingBonusWon!==0 || !/^\d{4}$/.test(c.seasonKey) || Number(c.seasonKey)<2027 || ![1,2].includes(p.schemaVersion) || p.seasonKey!==c.seasonKey || !c.contractKey || c.contractKey===p.previous.contractKey || c.playerKey!==p.previous.playerKey || p.previous.seasonKey!==c.seasonKey || p.previous.status!=='ACTIVE' || !Number.isSafeInteger(c.annualSalaryWon) || c.annualSalaryWon%10_000!==0 || c.annualSalaryWon<KBO_MONEY.minimumSalaryWon || c.annualSalaryWon>KBO_MONEY.maximumSalaryWon || p.dailyWon!==Math.round(c.annualSalaryWon/144) || !integer(p.startAfterWorldDay) || !integer(p.endWorldDay) || p.endWorldDay>365 || p.endWorldDay<=p.startAfterWorldDay || !integer(p.reservedGameDays) || p.reservedGameDays>p.endWorldDay-p.startAfterWorldDay)throw new RangeError('INVALID_KBO_REMAINDER_PAY');
 if(p.schemaVersion===1?c.clubId!==p.previous.clubId:c.clubId===p.previous.clubId || !KBO_CLUBS.some(x=>x.id===c.clubId) || !KBO_CLUBS.some(x=>x.id===p.previous.clubId))throw new RangeError('INVALID_KBO_REMAINDER_PAY');
 assertKboServicePayroll(p.previous);const prior=kboContractPaymentBalance(p.previous.servicePay.ledger),last=p.previous.servicePay.ledger.receipts.at(-1);
 if(prior.status!=='SETTLED' || !last || last.seasonKey!==p.seasonKey || last.worldDay!==p.startAfterWorldDay)throw new RangeError('INVALID_KBO_REMAINDER_SOURCE');
 const seen=new Set<string>();let day=p.startAfterWorldDay;
 for(const r of p.receipts){if(!r.gameKey || seen.has(r.gameKey) || !integer(r.worldDay) || r.worldDay<=day || r.worldDay>p.endWorldDay || r.seasonKey!==p.seasonKey || !['KBO','FUTURES'].includes(r.leagueKey) || r.amountWon!==p.dailyWon || !r.evidenceKey)throw new RangeError('INVALID_KBO_REMAINDER_RECEIPT');seen.add(r.gameKey);day=r.worldDay;}
 if(p.reservedGameDays>p.endWorldDay-day)throw new RangeError('INVALID_KBO_REMAINDER_RESERVATION');
 if(p.settlement && (p.reservedGameDays!==0 || p.settlement.worldDay!==p.endWorldDay || p.settlement.adjustmentWon!==Math.round(c.annualSalaryWon*p.receipts.length/144)-p.dailyWon*p.receipts.length))throw new RangeError('INVALID_KBO_REMAINDER_SETTLEMENT');
}
export function kboRemainderBalance(c:KboInitialContract){
 assertKboRemainderPay(c);const p=c.remainderPay;if(!p)throw new RangeError('KBO_REMAINDER_REQUIRED');
 const paidWon=p.dailyWon*p.receipts.length+(p.settlement?.adjustmentWon??0),priorPaidWon=p.previous.servicePay.ledger.receipts.filter(r=>r.seasonKey===p.seasonKey).reduce((n,r)=>n+r.amountWon,0),n=p.receipts.length+p.reservedGameDays;
 // Reserve the maximum remaining registered dates across both leagues; a promotion cannot create an unfunded day.
 const reservedWon=p.settlement?0:p.dailyWon*p.reservedGameDays+Math.max(0,Math.round(c.annualSalaryWon*n/144)-p.dailyWon*n);
 return {status:p.settlement?'SETTLED' as const:'ACTIVE' as const,paidGameDays:p.receipts.length,paidWon,priorPaidWon,reservedWon};
}
export function kboRemainderSeasonCharge(c:KboInitialContract):number {const b=kboRemainderBalance(c);return (c.remainderPay!.schemaVersion===1?b.priorPaidWon:0)+b.paidWon+b.reservedWon;}
/** The immutable old contract remains the original club's paid-cost evidence after a v2 transfer. */
export function kboRemainderPriorClubCharge(c:KboInitialContract):{clubId:string;seasonKey:string;sourceContractKey:string;paidWon:number}|null {
 if(!c.remainderPay)return null;assertKboRemainderPay(c);if(c.remainderPay.schemaVersion===1)return null;
 const p=c.remainderPay;return {clubId:p.previous.clubId,seasonKey:p.seasonKey,sourceContractKey:p.previous.contractKey,paidWon:kboRemainderBalance(c).priorPaidWon};
}
export function createKboRemainderContract(previous:KboInitialContract,input:{contractKey:string;annualSalaryWon:number;startAfterWorldDay:number;endWorldDay:number;reservedGameDays:number;clubId?:string}):KboInitialContract {
 if(!previous.servicePay || previous.remainderPay)throw new RangeError('INVALID_KBO_REMAINDER_SOURCE');
 const inherited=structuredClone(previous);delete inherited.servicePay;
 const clubId=input.clubId??previous.clubId;
 const c:KboInitialContract={...inherited,contractKey:input.contractKey,playerKey:previous.playerKey,clubId,seasonKey:previous.seasonKey,years:1,annualSalaryWon:input.annualSalaryWon,signingBonusWon:0,status:'ACTIVE_PRORATED',remainderPay:{schemaVersion:clubId===previous.clubId?1:2,seasonKey:previous.seasonKey,startAfterWorldDay:input.startAfterWorldDay,endWorldDay:input.endWorldDay,dailyWon:Math.round(input.annualSalaryWon/144),reservedGameDays:input.reservedGameDays,previous:structuredClone(previous) as KboRemainderPay['previous'],receipts:[],settlement:null}};
 assertKboRemainderPay(c);return c;
}
/** Registered bench/injured players qualify exactly as for the frozen military contract. */
export function recordKboRemainderPayment(source:KboInitialContract,game:GameContribution,registration:HealthGame){
 assertKboRemainderPay(source);const p=source.remainderPay;if(!p)throw new RangeError('KBO_REMAINDER_REQUIRED');
 const evidenceKey=kboRegisteredContractEvidence(source,game,registration);
 if(game.scope.seasonKey!==p.seasonKey || game.worldDay<=p.startAfterWorldDay || game.worldDay>p.endWorldDay)throw new RangeError('INVALID_KBO_REMAINDER_DATE');
 const old=p.receipts.find(r=>r.gameKey===game.gameKey);if(old){if(old.evidenceKey!==evidenceKey)throw new RangeError('CHANGED_CONTRACT_PAYMENT_EVIDENCE');return {contract:structuredClone(source),paidWon:0,duplicate:true};}
 if(p.settlement || p.reservedGameDays===0 || game.worldDay<=(p.receipts.at(-1)?.worldDay??p.startAfterWorldDay))throw new RangeError('KBO_REMAINDER_NOT_PAYABLE');
 const c=structuredClone(source),q=c.remainderPay!;q.receipts=[...q.receipts,{gameKey:game.gameKey,seasonKey:p.seasonKey,worldDay:game.worldDay,leagueKey:game.scope.leagueKey as 'KBO'|'FUTURES',amountWon:p.dailyWon,evidenceKey}];q.reservedGameDays=Math.min(Math.max(0,q.reservedGameDays-1),Math.max(0,q.endWorldDay-game.worldDay));assertKboRemainderPay(c);return {contract:c,paidWon:p.dailyWon,duplicate:false};
}
/** Final contractual calendar date: rounding changes money only, never creates another registration/game. */
export function finalizeKboRemainderPayments(source:KboInitialContract,worldDay:number){
 assertKboRemainderPay(source);const p=source.remainderPay;if(!p || worldDay!==p.endWorldDay)throw new RangeError('INVALID_KBO_REMAINDER_SETTLEMENT_DATE');
 if(p.settlement)return {contract:structuredClone(source),adjustmentWon:0,duplicate:true};
 const c=structuredClone(source),q=c.remainderPay!,adjustmentWon=Math.round(c.annualSalaryWon*q.receipts.length/144)-q.dailyWon*q.receipts.length;q.reservedGameDays=0;q.settlement={worldDay,adjustmentWon};assertKboRemainderPay(c);return {contract:c,adjustmentWon,duplicate:false};
}
export function kboRemainderContractView(c:KboInitialContract){
 const b=kboRemainderBalance(c),p=c.remainderPay!;return {status:b.status,annualSalaryWon:c.annualSalaryWon,dailyWon:p.dailyWon,paidGameDays:b.paidGameDays,paidThisSeasonWon:b.paidWon,reservedThisSeasonWon:b.reservedWon,endsAfterWorldDay:p.endWorldDay};
}
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {kboContractSeasonCharge} from './kbo-service-payroll.js';

/** Conservative upper bound from both already-published calendars; never counts one date twice. */
export function kboRemainderFutureDates(c:KboCareer,afterDay:number):number {return kboClubRemainderFutureDates(c,c.protagonistClubId,afterDay);}
export function kboClubRemainderFutureDates(c:KboCareer,clubId:string,afterDay:number):number {
 if(!c.competitionSchedule)throw new RangeError('KBO_SCHEDULE_REQUIRED');
 return new Set([...c.competitionSchedule.leagues.KBO,...c.competitionSchedule.leagues.FUTURES].filter(g=>g.worldDay>afterDay && (g.homeTeamKey===clubId || g.awayTeamKey===clubId)).map(g=>g.worldDay)).size;
}
/** Caller owns the progress clone; joins actual official registrations and publishes one money transaction. */
export function settleKboRemainderPayrollDay(career:KboCareer,day:number):void {settleKboPlayerRemainderPayrollDay(career,career.protagonistKey,day);}
export function settleKboPlayerRemainderPayrollDay(career:KboCareer,playerKey:string,day:number):void {
 const old=career.world.contracts[playerKey]!;if(!old.remainderPay)return;
 if(career.days?.days.at(-1)?.day!==day || day<=old.remainderPay.startAfterWorldDay || day>old.remainderPay.endWorldDay)throw new RangeError('PAYROLL_DAY_NOT_FINAL');
 const oldCharge=kboContractSeasonCharge(old),club=career.world.clubs.find(x=>x.id===old.clubId)!;
 const matches=career.health.games.map(x=>x.evidence).filter(r=>r.seasonKey===career.world.seasonKey && r.day===day && r.roster.includes(old.playerKey) && ['KBO:'+old.clubId,'FUTURES:'+old.clubId].includes(r.teamKey));
 if(matches.length>1)throw new RangeError('INVALID_REMAINDER_PAYROLL_REGISTRATION');
 let c=structuredClone(old),paidWon=0;
 if(matches.length){const r=matches[0]!,g=career.records.games[r.gameKey];if(!g)throw new RangeError('PAYROLL_GAME_NOT_FINAL');const out=recordKboRemainderPayment(c,g,r);c=out.contract;paidWon=out.paidWon;}
 if(!c.remainderPay!.settlement)c.remainderPay!.reservedGameDays=kboClubRemainderFutureDates(career,c.clubId,day);
 if(day===c.remainderPay!.endWorldDay){const out=finalizeKboRemainderPayments(c,day);c=out.contract;paidWon+=out.adjustmentWon;}
 career.world.contracts[c.playerKey]=c;club.reservedSalaryWon+=kboContractSeasonCharge(c)-oldCharge-paidWon;club.paidSalaryWon+=paidWon;assertKboRecruitmentWorld(career.world);
}

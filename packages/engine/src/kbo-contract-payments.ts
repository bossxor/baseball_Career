import {canonicalJson} from './game.js';
import type {GameContribution} from './records.js';
import type {HealthGame} from './health.js';
import {KBO_CONTRACT_GAME_DAYS,resumedContractPayment} from './kbo-military-program.js';
import type {KboMilitaryProgram,KboSuspendedContract} from './kbo-military-program.js';

export interface KboContractPaymentReceipt {
 gameKey:string;seasonKey:string;worldDay:number;leagueKey:'KBO'|'FUTURES';amountWon:number;evidenceKey:string;
}
/** Server-owned, explicit ledger. Calendar days alone never consume a paid contract day. */
export interface KboContractPaymentLedger {
 schemaVersion:1;programId:string;contract:KboSuspendedContract;
 resume:null|{returnOptionId:string;completedWorldDay:number};receipts:readonly KboContractPaymentReceipt[];
}
function assertSnapshot(s:KboSuspendedContract):void {
 const n=s.remainingPaidGameDays;
 if(!s.contractKey || !s.playerKey || !s.clubId || !Number.isSafeInteger(s.annualSalaryWon) || s.annualSalaryWon<=0 || !Number.isSafeInteger(n) || n<0 || n>4*KBO_CONTRACT_GAME_DAYS || s.dailyWon!==Math.round(s.annualSalaryWon/KBO_CONTRACT_GAME_DAYS) || !Number.isSafeInteger(s.totalRemainingWon) || s.totalRemainingWon!==Math.round(s.annualSalaryWon*n/KBO_CONTRACT_GAME_DAYS) || s.finalDayWon!==(n?s.totalRemainingWon-s.dailyWon*(n-1):0) || s.finalDayWon<0)throw new RangeError('INVALID_CONTRACT_PAYMENT_LEDGER');
}
export function assertKboContractPaymentLedger(s:KboContractPaymentLedger):void {
 assertSnapshot(s.contract);
 if(s.schemaVersion!==1 || !s.programId || s.receipts.length>s.contract.remainingPaidGameDays || !s.resume && s.receipts.length || s.resume && (!s.resume.returnOptionId || !Number.isSafeInteger(s.resume.completedWorldDay) || s.resume.completedWorldDay<0))throw new RangeError('INVALID_CONTRACT_PAYMENT_LEDGER');
 const seen=new Set<string>();let last=s.resume?.completedWorldDay??-1;
 for(const [i,r] of s.receipts.entries()){
  if(!r.gameKey || seen.has(r.gameKey) || !/^\d{4}$/.test(r.seasonKey) || !['KBO','FUTURES'].includes(r.leagueKey) || !Number.isSafeInteger(r.worldDay) || r.worldDay<=last || !r.evidenceKey || r.amountWon!==resumedContractPayment(s.contract,i,1))throw new RangeError('INVALID_CONTRACT_PAYMENT_LEDGER');
  seen.add(r.gameKey);last=r.worldDay;
 }
}
/** A fresh suspension starts unpaid. This does not mutate a club budget or create past receipts. */
export function createKboContractPaymentLedger(program:KboMilitaryProgram):KboContractPaymentLedger {
 if(program.completedBlocks!==0 || program.returnOptionId!==null || program.playerKey!==program.contract.playerKey || program.originalClubId!==program.contract.clubId)throw new RangeError('INVALID_CONTRACT_PAYMENT_PROGRAM');
 const ledger:KboContractPaymentLedger={schemaVersion:1,programId:program.programId,contract:structuredClone(program.contract),resume:null,receipts:[]};
 assertKboContractPaymentLedger(ledger);return ledger;
}
/** Resume requires the same program and frozen principal, with both chronological completion receipts. */
export function resumeKboContractPayments(source:KboContractPaymentLedger,program:KboMilitaryProgram):KboContractPaymentLedger {
 assertKboContractPaymentLedger(source);
 const days=program.blocks.map(b=>b.completedWorldDay);
 if(program.programId!==source.programId || program.playerKey!==source.contract.playerKey || program.originalClubId!==source.contract.clubId || canonicalJson(program.contract)!==canonicalJson(source.contract) || program.scheduledBlocks!==2 || program.completedBlocks!==2 || days.length!==2 || days.some(d=>d===null || !Number.isSafeInteger(d) || d<0) || days[1]!<=days[0]! || !program.returnOptionId)throw new RangeError('CONTRACT_RETURN_NOT_CONFIRMED');
 const resume={returnOptionId:program.returnOptionId,completedWorldDay:days[1]!};
 if(source.resume && canonicalJson(source.resume)!==canonicalJson(resume))throw new RangeError('CHANGED_CONTRACT_RETURN');
 return {...structuredClone(source),resume};
}
/** Join a finalized official game to its registered-team health receipt. Bench/injured registrations qualify;
 * PS/international/Sangmu registrations, missing registration and service-period dates do not. No appearance requirement. */
export function recordKboContractPayment(source:KboContractPaymentLedger,game:GameContribution,registration:HealthGame):{ledger:KboContractPaymentLedger;paidWon:number;duplicate:boolean} {
 assertKboContractPaymentLedger(source);
 if(!source.resume)throw new RangeError('CONTRACT_PAYMENT_SUSPENDED');
 const c=source.contract,league=game.scope.leagueKey;
 if(!['KBO','FUTURES'].includes(league) || game.scope.phase!=='REGULAR' || !/^\d{4}$/.test(game.scope.seasonKey) || !game.gameKey || registration.gameKey!==game.gameKey || registration.day!==game.worldDay || registration.seasonKey!==game.scope.seasonKey || registration.teamKey!==league+':'+c.clubId || Object.keys(game.teams).length!==2 || !Object.hasOwn(game.teams,c.clubId) || game.teams[c.clubId]!.games!==1 || new Set(registration.roster).size!==registration.roster.length || !registration.roster.includes(c.playerKey) || !Number.isSafeInteger(game.worldDay) || game.worldDay<=source.resume.completedWorldDay)throw new RangeError('INVALID_CONTRACT_PAYMENT_EVIDENCE');
 const evidenceKey=canonicalJson({gameKey:game.gameKey,worldDay:game.worldDay,scope:game.scope,teamKey:registration.teamKey,roster:[...registration.roster].sort()});
 const old=source.receipts.find(r=>r.gameKey===game.gameKey);
 if(old){if(old.evidenceKey!==evidenceKey)throw new RangeError('CHANGED_CONTRACT_PAYMENT_EVIDENCE');return {ledger:structuredClone(source),paidWon:0,duplicate:true};}
 if(game.worldDay<=(source.receipts.at(-1)?.worldDay??source.resume.completedWorldDay))throw new RangeError('NON_CHRONOLOGICAL_CONTRACT_PAYMENT');
 if(source.receipts.length>=c.remainingPaidGameDays)throw new RangeError('CONTRACT_PAYMENT_COMPLETE');
 const paidWon=resumedContractPayment(c,source.receipts.length,1),receipt:KboContractPaymentReceipt={gameKey:game.gameKey,seasonKey:game.scope.seasonKey,worldDay:game.worldDay,leagueKey:league as 'KBO'|'FUTURES',amountWon:paidWon,evidenceKey};
 const ledger={...structuredClone(source),receipts:[...structuredClone(source.receipts),receipt]};assertKboContractPaymentLedger(ledger);
 return {ledger,paidWon,duplicate:false};
}
export function kboContractPaymentBalance(source:KboContractPaymentLedger){
 assertKboContractPaymentLedger(source);
 const paidDays=source.receipts.length,paidWon=source.receipts.reduce((n,r)=>n+r.amountWon,0);
 return {status:!source.resume?'SUSPENDED' as const:paidDays===source.contract.remainingPaidGameDays?'SETTLED' as const:'RESUMED' as const,paidDays,paidWon,remainingPaidGameDays:source.contract.remainingPaidGameDays-paidDays,remainingWon:source.contract.totalRemainingWon-paidWon};
}

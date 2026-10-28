import {assertKboServicePayroll,kboContractSeasonCharge,kboServiceFutureCommitment} from './kbo-service-payroll.js';
import {assertKboRemainderPay,kboRemainderPriorClubCharge} from './kbo-remainder-pay.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {KBO_CLUBS,KBO_MONEY,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboRosterWorld,KboInitialContract} from './kbo-world.js';
import {canonicalJson} from './game.js';

export interface KboGuarantee {
 obligationKey:string;sourceContractKey:string;playerKey:string;clubId:string;reason:'RETIREMENT'|'RELEASE';createdSeasonKey:string;timing?:'BEFORE_SEASON';
 dues:readonly {seasonKey:string;amountWon:number}[];
}
export interface KboFinanceLedger {
 agentCounterReservations?:readonly {receiptKey:string;offerSetKey:string;counterOfferKey:string;playerKey:string;clubId:string;seasonKey:string;deltaWon:number;status?:'RESERVED'|'RELEASED'}[];
 closedContracts?:readonly KboInitialContract[];
 guarantees:readonly KboGuarantee[];
 grants:readonly {receiptKey:string;seasonKey:string;clubId:string;amountWon:number;reason:'MINIMUM_ROSTER_REBUILD'|'SERVICE_OBLIGATION_REBUILD'}[];
}
type World=Omit<KboRosterWorld,'status'>;
const validYear=(key:string)=>Number.isSafeInteger(Number(key)) && Number(key)>=2027 && Number(key)<=9999 && String(Number(key))===key;
const won=(n:number)=>Number.isSafeInteger(n) && n>=0 && n%10_000===0;
const sum=(numbers:readonly number[])=>{const n=numbers.reduce((a,b)=>a+b,0);if(!Number.isSafeInteger(n))throw new RangeError('KBO_FINANCE_OVERFLOW');return n;};
/** Optional reader-first ledger; old worlds have no historical guarantee/grant entries. */
export function assertKboFinanceLedger(world:World):void {
 for(const [key,c] of Object.entries(world.suspendedContracts??{})){
  assertKboServicePayroll(c);
  if(!c.servicePay || c.remainderPay || c.servicePay.kind!=='SPORTS' || c.playerKey!==key || c.seasonKey!==world.seasonKey || c.status!=='ACTIVE' || !c.contractKey || !KBO_CLUBS.some(t=>t.id===c.clubId) || !Number.isInteger(c.years) || c.years<1 || c.years>4 || !won(c.annualSalaryWon) || c.annualSalaryWon<KBO_MONEY.minimumSalaryWon || c.annualSalaryWon>KBO_MONEY.maximumSalaryWon || c.signingBonusWon!==0 || Object.hasOwn(world.players,key) || Object.hasOwn(world.contracts,key) || world.clubs.some(t=>t.roster.includes(key)) || Object.values(world.contracts).some(x=>x.contractKey===c.contractKey))throw new RangeError('INVALID_KBO_DETACHED_CONTRACT');
 }
 const ledger=world.finance;if(!ledger)return;const seen=new Set<string>(),contracts=new Set<string>();
 for(const r of ledger.agentCounterReservations??[]){if(!r.receiptKey||seen.has(r.receiptKey)||!r.offerSetKey||!r.counterOfferKey||!r.playerKey||!KBO_CLUBS.some(c=>c.id===r.clubId)||!validYear(r.seasonKey)||!won(r.deltaWon)||r.deltaWon<=0||r.status!==undefined&&!['RESERVED','RELEASED'].includes(r.status))throw new RangeError('INVALID_AGENT_COUNTER_RESERVATION');seen.add(r.receiptKey);}
 for(const c of ledger.closedContracts??[]){
  assertSettledContract(c);
  if(contracts.has(c.contractKey) || Object.values(world.contracts).some(x=>x.contractKey===c.contractKey || x.remainderPay?.previous.contractKey===c.contractKey) || Object.values(world.suspendedContracts??{}).some(x=>x.contractKey===c.contractKey))throw new RangeError('DUPLICATE_KBO_CLOSED_CONTRACT');contracts.add(c.contractKey);
 }
 for(const g of ledger.guarantees){
  if(!g.obligationKey || seen.has(g.obligationKey) || contracts.has(g.sourceContractKey) || !g.sourceContractKey || !g.playerKey || !KBO_CLUBS.some(c=>c.id===g.clubId) || !['RETIREMENT','RELEASE'].includes(g.reason) || !validYear(g.createdSeasonKey) || g.dues.length<1 || g.dues.length>(g.timing==='BEFORE_SEASON'?4:3) || g.timing!==undefined && g.timing!=='BEFORE_SEASON' || g.timing==='BEFORE_SEASON' && g.reason!=='RELEASE' || world.contracts[g.playerKey]?.contractKey===g.sourceContractKey)throw new RangeError('INVALID_KBO_GUARANTEE');seen.add(g.obligationKey);contracts.add(g.sourceContractKey);
  for(const [i,d] of g.dues.entries())if(!validYear(d.seasonKey) || Number(d.seasonKey)!==Number(g.createdSeasonKey)+i+(g.timing==='BEFORE_SEASON'?0:1) || !won(d.amountWon) || d.amountWon<KBO_MONEY.minimumSalaryWon || d.amountWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_GUARANTEE_DUE');
 }
 for(const g of ledger.grants){if(!g.receiptKey || seen.has(g.receiptKey) || !KBO_CLUBS.some(c=>c.id===g.clubId) || !validYear(g.seasonKey) || !Number.isSafeInteger(g.amountWon) || g.amountWon<=0 || !['MINIMUM_ROSTER_REBUILD','SERVICE_OBLIGATION_REBUILD'].includes(g.reason) || g.reason==='SERVICE_OBLIGATION_REBUILD' && !world.suspendedContracts || g.reason==='MINIMUM_ROSTER_REBUILD' && !world.suspendedContracts && !won(g.amountWon))throw new RangeError('INVALID_KBO_SUPPORT_GRANT');seen.add(g.receiptKey);}
}
export function kboGuaranteedWon(world:World,clubId:string,seasonKey:string):number {return sum((world.finance?.guarantees??[]).filter(g=>g.clubId===clubId).flatMap(g=>g.dues.filter(d=>d.seasonKey===seasonKey).map(d=>d.amountWon)));}
export function kboSupportWon(world:World,clubId:string,seasonKey:string):number{return sum((world.finance?.grants??[]).filter(g=>g.clubId===clubId && g.seasonKey===seasonKey).map(g=>g.amountWon));}
export function kboClubBalance(world:World,clubId:string,seasonKey=world.seasonKey){
 if(!validYear(seasonKey))throw new RangeError('INVALID_KBO_FINANCE_SEASON');const club=world.clubs.find(c=>c.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 const guaranteedWon=kboGuaranteedWon(world,clubId,seasonKey),supportWon=kboSupportWon(world,clubId,seasonKey),protectedWon=Math.max(0,KBO_ROSTER_LIMITS.minimum-club.roster.length)*KBO_MONEY.minimumSalaryWon;
 const availableWon=club.budgetWon+supportWon-club.paidSalaryWon-club.reservedSalaryWon-guaranteedWon-protectedWon;
 if(!Number.isSafeInteger(availableWon))throw new RangeError('KBO_FINANCE_OVERFLOW');return {budgetWon:club.budgetWon,supportWon,guaranteedWon,protectedWon,availableWon};
}
/** Offseason only: current season was fully played/charged. Preserve every future guaranteed annual salary.
 * Caller removes the matching active contract in the same cloned-world result; never validate an intermediate half. */
export function reserveKboOffseasonGuarantee(world:World,contract:KboInitialContract,closedSeasonKey:string,reason:KboGuarantee['reason']):void {
 if(!['RETIREMENT','RELEASE'].includes(reason) || !contract.contractKey || !contract.playerKey || !KBO_CLUBS.some(c=>c.id===contract.clubId) || contract.status!=='ACTIVE' || !validYear(closedSeasonKey) || !validYear(contract.seasonKey) || !won(contract.annualSalaryWon) || contract.annualSalaryWon<KBO_MONEY.minimumSalaryWon || contract.annualSalaryWon>KBO_MONEY.maximumSalaryWon || !Number.isInteger(contract.years) || contract.years<1 || contract.years>4 || Number(closedSeasonKey)<Number(contract.seasonKey))throw new RangeError('INVALID_KBO_OFFSEASON_GUARANTEE');
 const remaining=Math.max(0,contract.years-(Number(closedSeasonKey)-Number(contract.seasonKey)+1));if(!remaining)return;
 const dues=Array.from({length:remaining},(_,i)=>({seasonKey:String(Number(closedSeasonKey)+i+1),amountWon:contract.annualSalaryWon}));if(dues.some(d=>!validYear(d.seasonKey)))throw new RangeError('INVALID_KBO_GUARANTEE_DUE');
 const obligationKey=JSON.stringify(['kbo-guarantee',contract.contractKey,closedSeasonKey,reason]),entry:KboGuarantee={obligationKey,sourceContractKey:contract.contractKey,playerKey:contract.playerKey,clubId:contract.clubId,reason,createdSeasonKey:closedSeasonKey,dues};
 const old=world.finance?.guarantees.find(g=>g.obligationKey===obligationKey);if(old){if(canonicalJson(old)!==canonicalJson(entry))throw new RangeError('CHANGED_KBO_GUARANTEE');return;}
 if(world.finance?.guarantees.some(g=>g.sourceContractKey===contract.contractKey))throw new RangeError('DUPLICATE_KBO_GUARANTEE');
 world.finance={...(world.finance??{}),guarantees:[...(world.finance?.guarantees??[]),entry],grants:[...(world.finance?.grants??[])]};
}
/** A preseason release still owes the target season, plus every later guaranteed year.
 * Caller removes the active contract in the same cloned-world result. Old entries retain after-season semantics. */
export function reserveKboPreseasonGuarantee(world:World,contract:KboInitialContract):void {
 if(contract.seasonKey!==world.seasonKey || !validYear(contract.seasonKey) || contract.status!=='ACTIVE' || !contract.contractKey || !contract.playerKey || !KBO_CLUBS.some(c=>c.id===contract.clubId) || !Number.isInteger(contract.years) || contract.years<1 || contract.years>4 || !won(contract.annualSalaryWon) || contract.annualSalaryWon<KBO_MONEY.minimumSalaryWon || contract.annualSalaryWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_PRESEASON_GUARANTEE');
 const dues=Array.from({length:contract.years},(_,i)=>({seasonKey:String(Number(contract.seasonKey)+i),amountWon:contract.annualSalaryWon}));if(dues.some(d=>!validYear(d.seasonKey)))throw new RangeError('INVALID_KBO_GUARANTEE_DUE');
 const entry:KboGuarantee={obligationKey:JSON.stringify(['kbo-preseason-guarantee',contract.contractKey,contract.seasonKey]),sourceContractKey:contract.contractKey,playerKey:contract.playerKey,clubId:contract.clubId,reason:'RELEASE',createdSeasonKey:contract.seasonKey,timing:'BEFORE_SEASON',dues};
 const old=world.finance?.guarantees.find(g=>g.sourceContractKey===contract.contractKey);if(old){if(canonicalJson(old)!==canonicalJson(entry))throw new RangeError('CHANGED_KBO_GUARANTEE');return;}
 world.finance={...(world.finance??{}),guarantees:[...(world.finance?.guarantees??[]),entry],grants:[...(world.finance?.grants??[])]};
}
/** 08/44 safety net: caller must already prove a real minimum-roster/required-slot repair, not a competitive bid.
 * The exact deficit is a current-year grant, never a permanent budget or a deleted guarantee. */
export function protectKboEmergencyBudget(world:World,clubId:string,seasonKey:string,requiredNewContracts:number):number {
 const club=world.clubs.find(c=>c.id===clubId);if(!club || !Number.isSafeInteger(requiredNewContracts) || requiredNewContracts<1 || requiredNewContracts>KBO_ROSTER_LIMITS.minimum || club.roster.length+requiredNewContracts>KBO_ROSTER_LIMITS.maximum || !validYear(seasonKey))throw new RangeError('INVALID_KBO_EMERGENCY_BUDGET');
 const balance=kboClubBalance(world,clubId,seasonKey),requiredWon=Math.max(requiredNewContracts*KBO_MONEY.minimumSalaryWon,balance.protectedWon),deficit=Math.max(0,requiredWon+club.paidSalaryWon+club.reservedSalaryWon+balance.guaranteedWon-club.budgetWon-balance.supportWon);if(!deficit)return 0;
 const entry={receiptKey:JSON.stringify(['kbo-support',world.worldKey,seasonKey,clubId,world.finance?.grants.length??0]),seasonKey,clubId,amountWon:deficit,reason:'MINIMUM_ROSTER_REBUILD' as const};
 world.finance={...(world.finance??{}),guarantees:[...(world.finance?.guarantees??[])],grants:[...(world.finance?.grants??[]),entry]};return deficit;
}
/** Future commitments do not treat a one-off support grant as recurring income. */
export function kboFutureCommitmentWon(world:World,clubId:string,yearOffset:number):number {
 if(!Number.isSafeInteger(yearOffset) || yearOffset<1 || yearOffset>6)throw new RangeError('INVALID_KBO_FUTURE_YEAR');
 const club=world.clubs.find(c=>c.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 return sum([kboGuaranteedWon(world,clubId,String(Number(world.seasonKey)+yearOffset)),...(world.finance?.agentCounterReservations??[]).filter(r=>r.status!=='RELEASED'&&r.clubId===clubId&&r.seasonKey===String(Number(world.seasonKey)+yearOffset)).map(r=>r.deltaWon),...club.roster.map(k=>kboServiceFutureCommitment(world.contracts[k]!,yearOffset)),...Object.values(world.suspendedContracts??{}).filter(c=>c.clubId===clubId).map(c=>kboServiceFutureCommitment(c,yearOffset))]);
}

/** v6 keeps authentic intake debt separate; old annual worlds retain their original budget boundary. */
export function kboPreservedServiceCommitmentWon(world:World,clubId:string,yearOffset:number):number {
 if(!Number.isSafeInteger(yearOffset) || yearOffset<1 || yearOffset>6)throw new RangeError('INVALID_KBO_FUTURE_YEAR');
 if(!world.suspendedContracts)return 0;
 return sum([...Object.values(world.contracts),...Object.values(world.suspendedContracts)].filter(c=>c.clubId===clubId && c.servicePay).map(c=>kboServiceFutureCommitment(c,yearOffset)));
}
/** A rescue grant pays existing debt; it never opens room for optional recruitment. */
export function kboRecruitmentOpen(world:World,clubId:string):boolean {
 const club=world.clubs.find(c=>c.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 if(world.finance?.grants.some(g=>g.clubId===clubId && g.seasonKey===world.seasonKey && g.reason==='SERVICE_OBLIGATION_REBUILD'))return false;
 for(let year=1;year<=(world.suspendedContracts?6:3);year++)if(kboFutureCommitmentWon(world,clubId,year)>club.budgetWon*.9)return false;
 return true;
}
/** Only a real current-year debt deficit is supported, after expired placeholders are removed. */
export function protectKboServiceBudget(world:World,clubId:string):number {
 if(!world.suspendedContracts)return 0;
 const club=world.clubs.find(c=>c.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 const balance=kboClubBalance(world,clubId),deficit=Math.max(0,club.paidSalaryWon+club.reservedSalaryWon+balance.guaranteedWon-club.budgetWon-balance.supportWon);
 if(!deficit)return 0;
 const serviceWon=sum([...Object.values(world.contracts),...Object.values(world.suspendedContracts)].filter(c=>c.clubId===clubId && c.servicePay).map(kboContractSeasonCharge));
 if(deficit>serviceWon)throw new RangeError('INVALID_KBO_SERVICE_SUPPORT');
 const entry={receiptKey:JSON.stringify(['kbo-service-support',world.worldKey,world.seasonKey,clubId,world.finance?.grants.length??0]),seasonKey:world.seasonKey,clubId,amountWon:deficit,reason:'SERVICE_OBLIGATION_REBUILD' as const};
 world.finance={...(world.finance??{}),guarantees:[...(world.finance?.guarantees??[])],grants:[...(world.finance?.grants??[]),entry]};return deficit;
}


function assertSettledContract(c:KboInitialContract):void {
 if(c.remainderPay){assertKboRemainderPay(c);if(!c.remainderPay.settlement)throw new RangeError('UNSETTLED_KBO_CLOSED_CONTRACT');}
 else {assertKboServicePayroll(c);if(!c.servicePay || kboContractPaymentBalance(c.servicePay.ledger).status!=='SETTLED')throw new RangeError('UNSETTLED_KBO_CLOSED_CONTRACT');}
}
/** A completed military/prorated deal retains this year's paid-cost proof after AI expiry. */
export function archiveKboSettledContract(world:World,contract:KboInitialContract):void {
 assertSettledContract(contract);const old=world.finance?.closedContracts?.find(c=>c.contractKey===contract.contractKey);
 if(old){if(canonicalJson(old)!==canonicalJson(contract))throw new RangeError('CHANGED_KBO_CLOSED_CONTRACT');return;}
 world.finance={guarantees:[],grants:[],...(world.finance??{}),closedContracts:[...(world.finance?.closedContracts??[]),structuredClone(contract)]};
}
export function kboArchivedPaidWon(world:World,clubId:string,seasonKey:string):number {
 return sum((world.finance?.closedContracts??[]).flatMap(c=>{
  const prior=kboRemainderPriorClubCharge(c);return [c.clubId===clubId && c.seasonKey===seasonKey?kboContractSeasonCharge(c):0,prior?.clubId===clubId && prior.seasonKey===seasonKey?prior.paidWon:0];
 }));
}
export function kboRosterSeasonCharge(world:World,clubId:string):number {
 const club=world.clubs.find(t=>t.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 return sum([...club.roster.map(k=>kboContractSeasonCharge(world.contracts[k]!)),...Object.values(world.suspendedContracts??{}).filter(c=>c.clubId===clubId).map(kboContractSeasonCharge)]);
}

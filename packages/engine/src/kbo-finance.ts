import {KBO_CLUBS,KBO_MONEY,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboRosterWorld,KboInitialContract} from './kbo-world.js';
import {canonicalJson} from './game.js';

export interface KboGuarantee {
 obligationKey:string;sourceContractKey:string;playerKey:string;clubId:string;reason:'RETIREMENT'|'RELEASE';createdSeasonKey:string;timing?:'BEFORE_SEASON';
 dues:readonly {seasonKey:string;amountWon:number}[];
}
export interface KboFinanceLedger {
 guarantees:readonly KboGuarantee[];
 grants:readonly {receiptKey:string;seasonKey:string;clubId:string;amountWon:number;reason:'MINIMUM_ROSTER_REBUILD'}[];
}
type World=Omit<KboRosterWorld,'status'>;
const validYear=(key:string)=>Number.isSafeInteger(Number(key)) && Number(key)>=2027 && Number(key)<=9999 && String(Number(key))===key;
const won=(n:number)=>Number.isSafeInteger(n) && n>=0 && n%10_000===0;
const sum=(numbers:readonly number[])=>{const n=numbers.reduce((a,b)=>a+b,0);if(!Number.isSafeInteger(n))throw new RangeError('KBO_FINANCE_OVERFLOW');return n;};
/** Optional reader-first ledger; old worlds have no historical guarantee/grant entries. */
export function assertKboFinanceLedger(world:World):void {
 const ledger=world.finance;if(!ledger)return;const seen=new Set<string>(),contracts=new Set<string>();
 for(const g of ledger.guarantees){
  if(!g.obligationKey || seen.has(g.obligationKey) || contracts.has(g.sourceContractKey) || !g.sourceContractKey || !g.playerKey || !KBO_CLUBS.some(c=>c.id===g.clubId) || !['RETIREMENT','RELEASE'].includes(g.reason) || !validYear(g.createdSeasonKey) || g.dues.length<1 || g.dues.length>(g.timing==='BEFORE_SEASON'?4:3) || g.timing!==undefined && g.timing!=='BEFORE_SEASON' || g.timing==='BEFORE_SEASON' && g.reason!=='RELEASE' || world.contracts[g.playerKey]?.contractKey===g.sourceContractKey)throw new RangeError('INVALID_KBO_GUARANTEE');seen.add(g.obligationKey);contracts.add(g.sourceContractKey);
  for(const [i,d] of g.dues.entries())if(!validYear(d.seasonKey) || Number(d.seasonKey)!==Number(g.createdSeasonKey)+i+(g.timing==='BEFORE_SEASON'?0:1) || !won(d.amountWon) || d.amountWon<KBO_MONEY.minimumSalaryWon || d.amountWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_GUARANTEE_DUE');
 }
 for(const g of ledger.grants){if(!g.receiptKey || seen.has(g.receiptKey) || !KBO_CLUBS.some(c=>c.id===g.clubId) || !validYear(g.seasonKey) || !won(g.amountWon) || g.amountWon<=0 || g.reason!=='MINIMUM_ROSTER_REBUILD')throw new RangeError('INVALID_KBO_SUPPORT_GRANT');seen.add(g.receiptKey);}
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
 world.finance={guarantees:[...(world.finance?.guarantees??[]),entry],grants:[...(world.finance?.grants??[])]};
}
/** A preseason release still owes the target season, plus every later guaranteed year.
 * Caller removes the active contract in the same cloned-world result. Old entries retain after-season semantics. */
export function reserveKboPreseasonGuarantee(world:World,contract:KboInitialContract):void {
 if(contract.seasonKey!==world.seasonKey || !validYear(contract.seasonKey) || contract.status!=='ACTIVE' || !contract.contractKey || !contract.playerKey || !KBO_CLUBS.some(c=>c.id===contract.clubId) || !Number.isInteger(contract.years) || contract.years<1 || contract.years>4 || !won(contract.annualSalaryWon) || contract.annualSalaryWon<KBO_MONEY.minimumSalaryWon || contract.annualSalaryWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_PRESEASON_GUARANTEE');
 const dues=Array.from({length:contract.years},(_,i)=>({seasonKey:String(Number(contract.seasonKey)+i),amountWon:contract.annualSalaryWon}));if(dues.some(d=>!validYear(d.seasonKey)))throw new RangeError('INVALID_KBO_GUARANTEE_DUE');
 const entry:KboGuarantee={obligationKey:JSON.stringify(['kbo-preseason-guarantee',contract.contractKey,contract.seasonKey]),sourceContractKey:contract.contractKey,playerKey:contract.playerKey,clubId:contract.clubId,reason:'RELEASE',createdSeasonKey:contract.seasonKey,timing:'BEFORE_SEASON',dues};
 const old=world.finance?.guarantees.find(g=>g.sourceContractKey===contract.contractKey);if(old){if(canonicalJson(old)!==canonicalJson(entry))throw new RangeError('CHANGED_KBO_GUARANTEE');return;}
 world.finance={guarantees:[...(world.finance?.guarantees??[]),entry],grants:[...(world.finance?.grants??[])]};
}
/** 08/44 safety net: caller must already prove a real minimum-roster/required-slot repair, not a competitive bid.
 * The exact deficit is a current-year grant, never a permanent budget or a deleted guarantee. */
export function protectKboEmergencyBudget(world:World,clubId:string,seasonKey:string,requiredNewContracts:number):number {
 const club=world.clubs.find(c=>c.id===clubId);if(!club || !Number.isSafeInteger(requiredNewContracts) || requiredNewContracts<1 || requiredNewContracts>KBO_ROSTER_LIMITS.minimum || club.roster.length+requiredNewContracts>KBO_ROSTER_LIMITS.maximum || !validYear(seasonKey))throw new RangeError('INVALID_KBO_EMERGENCY_BUDGET');
 const balance=kboClubBalance(world,clubId,seasonKey),requiredWon=Math.max(requiredNewContracts*KBO_MONEY.minimumSalaryWon,balance.protectedWon),deficit=Math.max(0,requiredWon+club.paidSalaryWon+club.reservedSalaryWon+balance.guaranteedWon-club.budgetWon-balance.supportWon);if(!deficit)return 0;
 const entry={receiptKey:JSON.stringify(['kbo-support',world.worldKey,seasonKey,clubId,world.finance?.grants.length??0]),seasonKey,clubId,amountWon:deficit,reason:'MINIMUM_ROSTER_REBUILD' as const};
 world.finance={guarantees:[...(world.finance?.guarantees??[])],grants:[...(world.finance?.grants??[]),entry]};return deficit;
}
/** Future commitments do not treat a one-off support grant as recurring income. */
export function kboFutureCommitmentWon(world:World,clubId:string,yearOffset:number):number {
 if(!Number.isSafeInteger(yearOffset) || yearOffset<1 || yearOffset>3)throw new RangeError('INVALID_KBO_FUTURE_YEAR');
 const club=world.clubs.find(c=>c.id===clubId);if(!club)throw new RangeError('MISSING_KBO_CLUB');
 return sum([kboGuaranteedWon(world,clubId,String(Number(world.seasonKey)+yearOffset)),...club.roster.map(k=>world.contracts[k]!.years>yearOffset?world.contracts[k]!.annualSalaryWon:0)]);
}

import type {KboInitialContract} from './kbo-world.js';

/** 21: scheduled pro games per year; the suspended contract is counted in game days, never in "years + 1". */
export const KBO_CONTRACT_GAME_DAYS=144;
export interface KboSuspendedContract {
 contractKey:string;playerKey:string;clubId:string;annualSalaryWon:number;
 remainingPaidGameDays:number;dailyWon:number;totalRemainingWon:number;finalDayWon:number;
}
const roundWon=(value:number)=>Math.round(value);

/** Snapshot at the confirmed enlistment: unpaid days are the days not yet played this contract. The day rate is
 * round(annual / 144); the last resumed day carries the rounded remainder so the resumed total is exact. */
export function suspendKboContract(contract:KboInitialContract,remainingPaidGameDays:number):KboSuspendedContract {
 const max=contract.years*KBO_CONTRACT_GAME_DAYS;
 if(contract.status!=='ACTIVE' || !Number.isSafeInteger(remainingPaidGameDays) || remainingPaidGameDays<0 || remainingPaidGameDays>max)throw new RangeError('INVALID_SUSPENDED_CONTRACT');
 const dailyWon=roundWon(contract.annualSalaryWon/KBO_CONTRACT_GAME_DAYS),totalRemainingWon=roundWon(contract.annualSalaryWon*remainingPaidGameDays/KBO_CONTRACT_GAME_DAYS);
 return {contractKey:contract.contractKey,playerKey:contract.playerKey,clubId:contract.clubId,annualSalaryWon:contract.annualSalaryWon,remainingPaidGameDays,dailyWon,totalRemainingWon,finalDayWon:remainingPaidGameDays?totalRemainingWon-dailyWon*(remainingPaidGameDays-1):0};
}
/** Amount of the next `days` resumed game days after `resumedDays` were already paid (idempotent by day index). */
export function resumedContractPayment(s:KboSuspendedContract,resumedDays:number,days:number):number {
 if(!Number.isSafeInteger(resumedDays) || !Number.isSafeInteger(days) || resumedDays<0 || days<0 || resumedDays+days>s.remainingPaidGameDays)throw new RangeError('INVALID_RESUMED_PAYMENT');
 const paid=(n:number)=>n===0?0:n===s.remainingPaidGameDays?s.totalRemainingWon:s.dailyWon*n;
 return paid(resumedDays+days)-paid(resumedDays);
}

export type KboServiceBlockKind='FULL_DOMESTIC_SEASON'|'FIRST_HALF_SEASON';
export interface KboServiceBlock {seasonKey:string;kind:KboServiceBlockKind;completedWorldDay:number|null}
export interface KboMilitaryProgram {
 programId:string;kind:'SPORTS';playerKey:string;originalClubId:string;startedSeason:string;
 scheduledBlocks:2;blocks:readonly KboServiceBlock[];completedBlocks:number;
 contract:KboSuspendedContract;returnOptionId:string|null;
}
/** 21: 18 game months = two blocks: the whole next domestic season, then the first half of the one after.
 * Completion points are recorded world days; team games are never converted to service time. */
export function enlistInSangmu(input:{worldKey:string;playerKey:string;clubId:string;selectionSeasonKey:string;contract:KboInitialContract;remainingPaidGameDays:number}):KboMilitaryProgram {
 const first=String(Number(input.selectionSeasonKey)+1),second=String(Number(input.selectionSeasonKey)+2);
 if(input.contract.playerKey!==input.playerKey || input.contract.clubId!==input.clubId)throw new RangeError('INVALID_SUSPENDED_CONTRACT');
 return {programId:JSON.stringify(['sangmu-program',input.worldKey,input.selectionSeasonKey,input.playerKey]),kind:'SPORTS',playerKey:input.playerKey,originalClubId:input.clubId,startedSeason:first,scheduledBlocks:2,
  blocks:[{seasonKey:first,kind:'FULL_DOMESTIC_SEASON',completedWorldDay:null},{seasonKey:second,kind:'FIRST_HALF_SEASON',completedWorldDay:null}],completedBlocks:0,contract:suspendKboContract(input.contract,input.remainingPaidGameDays),returnOptionId:null};
}
/** Records one block's pre-fixed completion day once. A resend of the same day is the same result; a different day or an
 * out-of-order block is rejected. */
export function completeSangmuBlock(program:KboMilitaryProgram,seasonKey:string,worldDay:number):KboMilitaryProgram {
 const index=program.blocks.findIndex(b=>b.seasonKey===seasonKey);
 if(index<0 || !Number.isSafeInteger(worldDay) || worldDay<0 || index>program.completedBlocks)throw new RangeError('INVALID_SERVICE_BLOCK');
 const block=program.blocks[index]!;
 if(block.completedWorldDay!==null){if(block.completedWorldDay===worldDay)return structuredClone(program);throw new RangeError('SERVICE_BLOCK_EVIDENCE_REUSED');}
 const previous=program.blocks[index-1];if(previous && (previous.completedWorldDay===null || worldDay<=previous.completedWorldDay))throw new RangeError('INVALID_SERVICE_BLOCK');
 const blocks=program.blocks.map((b,i)=>i===index?{...b,completedWorldDay:worldDay}:b);
 return {...structuredClone(program),blocks,completedBlocks:program.completedBlocks+1,returnOptionId:index+1===program.scheduledBlocks?JSON.stringify(['sangmu-return',program.programId]):null};
}

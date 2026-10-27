import {overall} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {BattingLine,PitchingLine} from './types.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';

export const US_MAJOR_MINIMUM_SALARY_USD=800_000;
export const US_MAJOR_SALARY_CAP_USD=40_000_000;
/** 13 / user2026-10-27: clamp the final performance-adjusted value, never a hidden-potential forecast. */
export function usMajorContractValue(player:DevelopmentPlayer,bat:BattingLine=emptyBatting(),pit:PitchingLine=emptyPitching()){
 validateDevelopmentPlayer(player);const o=overall(player.kind,player.abilities),ovr=o.sumUnits/o.denominator,performanceIndex=player.kind==='HITTER'?recentBattingPerformance(bat):recentPitchingPerformance(pit);
 const raw=Math.max(US_MAJOR_MINIMUM_SALARY_USD,(ovr-65)*400_000)*(.8+.4*performanceIndex/100);
 return {annualSalaryUsd:Math.round(Math.min(US_MAJOR_SALARY_CAP_USD,Math.max(US_MAJOR_MINIMUM_SALARY_USD,raw))),basis:{ovr,performanceIndex,PA:bat.PA,outs:pit.outs}};
}
/** Open-market MLB offers; controlled pre-FA renewals remain one year. */
export function usMlbOfferYears(contractStartAge:number):1|2|3|5 {
 if(!Number.isSafeInteger(contractStartAge)||contractStartAge<18||contractStartAge>45)throw new RangeError('INVALID_US_CONTRACT_START_AGE');
 return contractStartAge<=29?5:contractStartAge<=32?3:contractStartAge<=35?2:1;
}

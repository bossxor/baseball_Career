import {overall,KBO_MONEY} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {BattingLine,PitchingLine} from './types.js';
import {battingRates,pitchingRates} from './stats.js';

export const KBO_RENEWAL_SAMPLE={PA:50,outs:60} as const;
export interface KboContractValueBasis {ovr:number;PA:number;OPS:number;outs:number;ERA:number}
const clamp=(n:number)=>Math.min(KBO_MONEY.maximumSalaryWon,Math.max(KBO_MONEY.minimumSalaryWon,n));
const manwon=(n:number)=>Math.round(n/10_000)*10_000;
/** 08 annual role value: public current ability and actual scoped statistics, never hidden potential. */
export function kboPlayerContractValue(player:DevelopmentPlayer,bat:BattingLine|undefined,pit:PitchingLine|undefined):{valueWon:number;basis:KboContractValueBasis}{
 validateDevelopmentPlayer(player);const o=overall(player.kind,player.abilities),ovr=o.sumUnits/o.denominator,PA=bat?.PA??0,outs=pit?.outs??0;
 const OPS=bat && PA>=KBO_RENEWAL_SAMPLE.PA?battingRates(bat).OPS??.6:.6,ERA=pit && outs>=KBO_RENEWAL_SAMPLE.outs?pitchingRates(pit).ERA??5:5;
 const base=30_000_000+Math.max(0,ovr-40)*10_000_000;
 const raw=player.kind==='PITCHER'?base+outs*200_000+Math.max(0,5-ERA)*50_000_000:base+PA*100_000+Math.max(0,OPS-.6)*500_000_000;
 return {valueWon:clamp(raw),basis:{ovr,PA,OPS,outs,ERA}};
}
export function kboRenewalSalaryWon(previous:number,value:number):number {
 if(!Number.isSafeInteger(previous) || previous<KBO_MONEY.minimumSalaryWon || previous>KBO_MONEY.maximumSalaryWon || !Number.isFinite(value) || value<KBO_MONEY.minimumSalaryWon || value>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_CONTRACT_VALUE');
 return clamp(manwon(.5*previous+.5*value));
}
/** Desired salary can exceed the legal offer cap: a demand is not a guaranteed contract. */
export function kboFreeAgentTerms(player:DevelopmentPlayer,bat:BattingLine|undefined,pit:PitchingLine|undefined){
 const value=kboPlayerContractValue(player,bat,pit);return {...value,annualSalaryWon:manwon(value.valueWon*1.2),years:player.age<=29?4:player.age<=32?3:player.age<=35?2:1};
}

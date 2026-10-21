import type {KboCareer} from './kbo-career-entry.js';
import {recordTotals} from './records.js';

/** 01 §6 thresholds: first-team (KBO regular) 50 PA for a hitter, 20 innings (60 outs) for a pitcher. */
export const KBO_FORCED_REVIEW={minAge:35,PA:50,outs:60,seasons:2} as const;

/** Read-only 01 §6 trigger after season close: 35+ and below the first-team threshold in each of the last two closed
 * seasons. It only reports; the retry event and the retirement on failure follow the 66 route work. */
export function kboForcedRetirementReview(source:KboCareer):{required:boolean;age:number;seasons:{seasonKey:string;amount:number}[]} {
 const key=source.protagonistKey,player=source.world.players[key]!,age=player.age;
 const closed=[...(source.proSeasons??[]).map(s=>s.seasonKey),...(source.seasonClose?.seasonKey===source.world.seasonKey?[source.world.seasonKey]:[])].slice(-KBO_FORCED_REVIEW.seasons);
 const seasons=closed.map(seasonKey=>{const t=recordTotals(source.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey});return {seasonKey,amount:player.kind==='PITCHER'?t.pitching[key]?.outs??0:t.batting[key]?.PA??0};});
 const limit=player.kind==='PITCHER'?KBO_FORCED_REVIEW.outs:KBO_FORCED_REVIEW.PA;
 return {required:age>=KBO_FORCED_REVIEW.minAge && seasons.length===KBO_FORCED_REVIEW.seasons && seasons.every(s=>s.amount<limit),age,seasons};
}

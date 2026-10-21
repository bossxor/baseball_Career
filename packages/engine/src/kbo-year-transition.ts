import type {KboCareer} from './kbo-career-entry.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';

export type KboTransitionBlocker='SEASON_NOT_IN_REVIEW'|'POSTSEASON_NOT_COMPLETE'|'SEASON_NOT_CLOSED'|'OPEN_EVENT'|'PENDING_GAME'|'GROWTH_NOT_FINALIZED'|'MAX_AGE_REACHED';
/** 14: 45 is the last playable age in every league. */
export const KBO_MAX_PLAYER_AGE=45;

/** 72 Y01 start conditions for my pro career, read-only. Year transition may only be requested when nothing is
 * blocking; growth/aging are checked here, never applied again. A player whose next age passes 45 goes to the
 * retirement/archive path instead of a new season. Reads never change revision or RNG. */
export function kboYearTransitionReadiness(source:KboCareer):{ready:boolean;blockers:KboTransitionBlocker[];targetSeasonKey:string;nextAge:number} {
 const blockers:KboTransitionBlocker[]=[],phase=source.phaseContext;
 if(phase.phase!=='SEASON_REVIEW')blockers.push('SEASON_NOT_IN_REVIEW');
 if(phase.phase==='SEASON_PROGRESS' && phase.pendingGame || phase.phase==='POSTSEASON_PROGRESS' && phase.pendingGame)blockers.push('PENDING_GAME');
 if(!source.postseason?.championKey)blockers.push('POSTSEASON_NOT_COMPLETE');
 if(!source.seasonClose || source.seasonClose.seasonKey!==source.world.seasonKey)blockers.push('SEASON_NOT_CLOSED');
 if(source.events.some(e=>e.status==='OPEN'))blockers.push('OPEN_EVENT');
 validateSeasonGrowthLedger(source.seasonGrowth);
 if(!source.seasonGrowth.finalized)blockers.push('GROWTH_NOT_FINALIZED');
 const nextAge=source.world.players[source.protagonistKey]!.age+1;
 if(nextAge>KBO_MAX_PLAYER_AGE)blockers.push('MAX_AGE_REACHED');
 return {ready:blockers.length===0,blockers,targetSeasonKey:String(Number(source.world.seasonKey)+1),nextAge};
}

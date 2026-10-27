import type {RecordLedger} from './records.js';
import type {HealthLedger} from './health.js';

/** Official registered MLB games, including injured/bench registrations; PA/outs never substitute for registration. */
export function mlbServiceTime(records:RecordLedger,health:HealthLedger,playerKey:string){
 if(!playerKey)throw new RangeError('INVALID_MLB_SERVICE_PLAYER');const counts=new Map<string,number>(),seen=new Set<string>();
 for(const g of health.games){if(!g.evidence.roster.includes(playerKey))continue;const row=records.games[g.evidence.gameKey];if(!row||row.scope.seasonKey!==g.evidence.seasonKey||row.worldDay!==g.evidence.day)throw new RangeError('MISSING_MLB_SERVICE_GAME');if(row.scope.leagueKey!=='MLB'||row.scope.phase!=='REGULAR')continue;
  if(!Object.keys(row.teams).some(k=>g.evidence.teamKey===k||g.evidence.teamKey==='MLB:'+k))throw new RangeError('CHANGED_MLB_SERVICE_REGISTRATION');const date=JSON.stringify([row.scope.seasonKey,row.worldDay]);if(seen.has(date))throw new RangeError('DOUBLE_BOOKED_MLB_SERVICE_DAY');seen.add(date);counts.set(row.scope.seasonKey,(counts.get(row.scope.seasonKey)??0)+1);
 }
 const seasons=[...counts].sort(([a],[b])=>a<b?-1:1).map(([seasonKey,registeredGames])=>({seasonKey,registeredGames,credited:registeredGames>=100})),creditedSeasons=seasons.filter(s=>s.credited).length;
 return {seasons,creditedSeasons,freeAgentEligible:creditedSeasons>=6};
}

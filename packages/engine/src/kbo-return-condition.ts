import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {compareKboSeasonDays} from './kbo-military-program.js';
import {canonicalJson} from './game.js';

export interface KboReturnCondition {programId:string;returnSeasonKey:string;returnWorldDay:number;gameKeys:readonly string[]}
export const KBO_ACTIVE_RETURN_TEAM_GAMES=6,KBO_ACTIVE_RETURN_MULTIPLIER=.95;
function expected(c:KboCareer,p:KboReturnCondition){
 const out:{gameKey:string;seasonKey:string;worldDay:number}[]=[],dates=new Set<string>();
 for(const h of c.health.games){const r=h.evidence,split=r.teamKey.indexOf(':'),league=r.teamKey.slice(0,split),club=r.teamKey.slice(split+1);
  if(!['KBO','FUTURES'].includes(league)||!c.world.clubs.some(t=>t.id===club)||!r.roster.includes(c.protagonistKey)||compareKboSeasonDays({seasonKey:r.seasonKey,worldDay:r.day},{seasonKey:p.returnSeasonKey,worldDay:p.returnWorldDay})<=0)continue;
  const g=c.records.games[r.gameKey];if(!g||g.worldDay!==r.day||g.scope.seasonKey!==r.seasonKey||g.scope.leagueKey!==league||!['REGULAR','POSTSEASON'].includes(g.scope.phase)||g.teams[club]?.games!==1||Object.keys(g.teams).length!==2||new Set(r.roster).size!==r.roster.length)throw new RangeError('INVALID_RETURN_CONDITION_REGISTRATION');
  const date=JSON.stringify([r.seasonKey,r.day]);if(dates.has(date))throw new RangeError('DOUBLE_BOOKED_RETURN_CONDITION_DAY');dates.add(date);out.push({gameKey:g.gameKey,seasonKey:r.seasonKey,worldDay:r.day});
 }
 return out.sort(compareKboSeasonDays).slice(0,KBO_ACTIVE_RETURN_TEAM_GAMES);
}
function inspect(c:KboCareer,closingDay?:number){
 const r=c.military,p=r?.returnCondition;if(!p)return null;const program=r.program,last=program?.blocks[1];
 if(r.status!=='COMPLETED'||program?.kind!=='ACTIVE'||program.completedBlocks!==2||!program.returnOptionId||!last||p.programId!==program.programId||p.returnSeasonKey!==last.seasonKey||p.returnWorldDay!==last.completedWorldDay||p.gameKeys.length>6||new Set(p.gameKeys).size!==p.gameKeys.length)throw new RangeError('INVALID_RETURN_CONDITION');
 const actual=expected(c,p);
 if(canonicalJson(p.gameKeys)!==canonicalJson(actual.slice(0,p.gameKeys.length).map(g=>g.gameKey)))throw new RangeError('CHANGED_RETURN_CONDITION_EVIDENCE');
 const pending=actual.slice(p.gameKeys.length);
 if(pending.length && (closingDay===undefined||pending.length!==1||pending[0]!.seasonKey!==c.world.seasonKey||pending[0]!.worldDay!==closingDay))throw new RangeError('RETURN_CONDITION_DAY_NOT_SETTLED');
 return {p,actual};
}
/** Internal snapshot multiplier only; permanent abilities/peaks never change. Legacy completed programs without this field keep1. */
export function kboReturnConditionMultiplier(c:KboCareer):number {
 const state=inspect(c);return state&&state.p.gameKeys.length<6?KBO_ACTIVE_RETURN_MULTIPLIER:1;
}
/** Caller owns the transactional daily clone. Registered bench/injured players count; INT/break days do not. */
export function settleKboReturnConditionDay(c:KboCareer,day:number):void {
 if(!c.military?.returnCondition)return;
 if(c.days?.days.at(-1)?.day!==day)throw new RangeError('RETURN_CONDITION_DAY_NOT_CLOSED');
 const state=inspect(c,day)!;state.p.gameKeys=state.actual.map(g=>g.gameKey);
}
export function kboReturnConditionView(c:KboCareer){
 assertKboCareerRevision(c,c.revision);const state=inspect(c);if(!state)return null;
 return {remainingTeamGames:6-state.p.gameKeys.length,totalTeamGames:6,effectiveMultiplier:state.p.gameKeys.length<6?.95:1};
}

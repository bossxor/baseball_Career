import {canonicalJson} from './game.js';
import {assertNationalBracket,nationalMatchesOnDay} from './national-bracket.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {NationalBracket} from './national-bracket.js';

export function nationalDayEvidence(b:NationalBracket,day:number,gameKeys:readonly string[],rosterKeys:readonly string[]):string {
 return canonicalJson({nationalDayVersion:1,competitionId:b.competitionId,day,gameKeys,rosterKeys});
}
/** Exact receipt/record/health linkage; international days outside REG never enter its day closer. */
export function auditCareerNationalDays(c:KboCareer):void {
 for(const b of c.national?.brackets??[]){
  if(b.dayCloseVersion===undefined)continue;
  assertNationalBracket(b);if(b.dayCloseVersion!==1||!Array.isArray(b.dayReceipts)||b.worldKey!==c.world.worldKey)throw new RangeError('INVALID_NATIONAL_DAY_RECEIPTS');
  if(canonicalJson(b.fatigueSettledDays??[])!==canonicalJson(b.dayReceipts.map(d=>d.day)))throw new RangeError('CHANGED_NATIONAL_DAY_RECEIPTS');
  for(const [i,d]of b.dayReceipts.entries()){
   if(d.day!==b.window.startDay+i||d.day>=b.window.endDay||!Array.isArray(d.gameKeys)||!Array.isArray(d.rosterKeys)||d.rosterKeys.length!==28||d.rosterKeys.some((k:unknown)=>typeof k!=='string'||!k)||new Set(d.rosterKeys).size!==28)throw new RangeError('INVALID_NATIONAL_DAY_RECEIPTS');
   const {completed,blocked}=nationalMatchesOnDay(b,d.day);if(blocked||canonicalJson(d.gameKeys)!==canonicalJson(completed.map(m=>m.gameKey)))throw new RangeError('NATIONAL_DAY_GAMES_PENDING');
   const result:{injured:string[];recovered:string[]}={injured:[],recovered:[]};
   for(const m of completed){
    const g=c.records.games[m.gameKey];if(!g||g.worldDay!==d.day||g.scope.seasonKey!==b.seasonKey||g.scope.phase!=='INTERNATIONAL'||g.scope.leagueKey!==b.tournament||!g.teams[m.away]||!g.teams[m.home])throw new RangeError('NATIONAL_GAME_RECORD_MISSING');
    const r=b.results.find(r=>r.gameKey===m.gameKey)!;
    if(g.gameKey!==m.gameKey||Object.keys(g.teams).length!==2||g.teams[m.away]!.R!==r.awayRuns||g.teams[m.home]!.R!==r.homeRuns||g.teams[m.away]!.RA!==r.homeRuns||g.teams[m.home]!.RA!==r.awayRuns||g.teams[r.winner]!.W!==1)throw new RangeError('CHANGED_NATIONAL_GAME_EVIDENCE');
    if(m.away!=='KOR'&&m.home!=='KOR')continue;
    const handoff=c.national?.hostReturns?.find(r=>r.competitionId===b.competitionId),local=c.health.games.filter(h=>h.evidence.gameKey===m.gameKey&&h.evidence.teamKey===b.tournament+':KOR'),external=(handoff?.ownerHealthGames??[]).filter(h=>h.evidence.gameKey===m.gameKey),h=[...local,...external];
    if(!handoff&&h.length!==1||handoff&&(local.length!==Number(d.rosterKeys.some((k:string)=>handoff.kboPlayerKeys.includes(k)))||external.length!==Number(d.rosterKeys.some((k:string)=>handoff.ownerPlayerKeys.includes(k)))||local.some(x=>x.evidence.roster.some(k=>!handoff.kboPlayerKeys.includes(k)))))throw new RangeError('CHANGED_NATIONAL_HEALTH_OWNERSHIP');
    if(h.some(x=>x.evidence.day!==d.day||x.evidence.seasonKey!==b.seasonKey)||canonicalJson(h.flatMap(x=>x.evidence.roster).sort())!==canonicalJson(d.rosterKeys)||canonicalJson(h.flatMap(x=>x.evidence.appearances.map(p=>p.playerKey)).sort())!==canonicalJson(d.rosterKeys.filter((k:string)=>(g.batting[k]?.PA??0)+(g.pitching[k]?.BF??0)>0)))throw new RangeError('CHANGED_NATIONAL_HEALTH_EVIDENCE');
    for(const x of h){result.injured.push(...x.result.injured);result.recovered.push(...x.result.recovered);}
   }
   result.injured.sort();result.recovered.sort();if(canonicalJson(result)!==canonicalJson(d.result))throw new RangeError('CHANGED_NATIONAL_HEALTH_EVIDENCE');
   if(b.seasonKey===c.world.seasonKey){const closed=c.days?.days.find(row=>row.day===d.day);if(closed&&(closed.evidence!==nationalDayEvidence(b,d.day,d.gameKeys,d.rosterKeys)||canonicalJson(closed.result)!==canonicalJson(d.result)))throw new RangeError('CHANGED_NATIONAL_PRO_DAY_EVIDENCE');}
  }
 }
}

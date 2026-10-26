import type {RecordLedger,RecordScope,GameContribution} from './records.js';
import {recordTotals} from './records.js';
import {createStreams,nextInteger} from './rng.js';

export interface TeamStanding {rank:number;teamKey:string;games:number;W:number;L:number;T:number;R:number;RA:number;winPercentage:number|null}
type Results=Pick<GameContribution['teams'][string],'W'|'L'>;
function comparePercentage(a:Results,b:Results):number {
 const ad=a.W+a.L,bd=b.W+b.L;
 return ad===0 || bd===0?(ad===0?bd===0?0:1:-1):b.W*ad-a.W*bd;
}
/** 01: winning percentage, tied-group head-to-head, run difference, preseason seeded lot. */
export function leagueStandings(records:RecordLedger,scope:RecordScope,teamKeys:readonly string[],seed:string,worldKey:string,registeredTeamKeys:readonly string[]=teamKeys):TeamStanding[] {
 if(!scope.seasonKey || !worldKey)throw new RangeError('INVALID_STANDINGS_SCOPE');
 if(teamKeys.length<2 || new Set(teamKeys).size!==teamKeys.length || teamKeys.some(k=>!k))throw new RangeError('INVALID_STANDINGS_TEAMS');
 if(new Set(registeredTeamKeys).size!==registeredTeamKeys.length || registeredTeamKeys.some(k=>!k) || teamKeys.some(k=>!registeredTeamKeys.includes(k)))throw new RangeError('INVALID_STANDINGS_TEAMS');
 const totals=recordTotals(records,scope),lots=[...teamKeys].sort();
 let rng=createStreams(seed,JSON.stringify(['standings-1',worldKey,scope.seasonKey,scope.leagueKey,scope.phase])).worldCreation;
 for(let i=lots.length-1;i>0;i--){const draw=nextInteger(rng,i+1);rng=draw.state;[lots[i],lots[draw.value]]=[lots[draw.value]!,lots[i]!];}
 const rows=teamKeys.map(teamKey=>({teamKey,...(totals.teams[teamKey]??{games:0,W:0,L:0,T:0,R:0,RA:0})}));
 if(Object.keys(totals.teams).some(k=>!registeredTeamKeys.includes(k)))throw new RangeError('UNREGISTERED_STANDINGS_TEAM');
 rows.sort(comparePercentage);
 for(let start=0;start<rows.length;){
  let end=start+1;while(end<rows.length && comparePercentage(rows[start]!,rows[end]!)===0)end++;
  const group=rows.slice(start,end),keys=new Set(group.map(r=>r.teamKey)),headToHead=new Map(group.map(r=>[r.teamKey,{W:0,L:0}]));
  for(const g of Object.values(records.games))if(g.scope.seasonKey===scope.seasonKey && g.scope.leagueKey===scope.leagueKey && g.scope.phase===scope.phase && Object.keys(g.teams).length===2 && Object.keys(g.teams).every(k=>keys.has(k))){
   for(const [key,line] of Object.entries(g.teams)){const h=headToHead.get(key)!;h.W+=line.W;h.L+=line.L;}
  }
  group.sort((a,b)=>comparePercentage(headToHead.get(a.teamKey)!,headToHead.get(b.teamKey)!) || b.R-b.RA-(a.R-a.RA) || lots.indexOf(a.teamKey)-lots.indexOf(b.teamKey));
  rows.splice(start,group.length,...group);start=end;
 }
 return rows.map((row,i)=>({...row,rank:i+1,winPercentage:row.W+row.L?row.W/(row.W+row.L):null}));
}

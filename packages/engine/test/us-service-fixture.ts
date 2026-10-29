import type {UsCareer} from '../src/us-career-entry.js';
import {usSalaryEntitlement,salaryContractKey,assertUsSeason} from '../src/us-season.js';
import {recordUsMilitaryClosedDay} from '../src/us-military-plan.js';
import {auditUsClosedDays} from '../src/us-growth.js';
import {canonicalJson} from '../src/game.js';

/** Controlled scheduled rows, never evidence of native competitive service seasons. No dates/blocks are assigned directly. */
export function closeControlledServiceDates(c:UsCareer,through:number):UsCareer {
 const next=structuredClone(c),s=next.season!,all=Object.values(next.seasonSchedule!.leagues).flat();
 for(let day=(s.days.at(-1)?.day??s.firstDay-1)+1;day<=through;day++){
  const games=all.filter(g=>g.worldDay===day).map(g=>{const row={gameKey:g.simulationKey,worldDay:day,scope:{seasonKey:next.world.seasonKey,leagueKey:g.leagueKey,phase:'REGULAR' as const},teams:{[g.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},[g.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};next.records.games[g.simulationKey]=row;next.records.revision++;return row;});
  s.days.push({day,evidence:canonicalJson(games),level:next.registration.level,appearances:0,rehabilitating:false,injured:[],recovered:[]});const entryKey=JSON.stringify(['us-salary',salaryContractKey(next,day),next.world.seasonKey,day]),amount=usSalaryEntitlement(next,s.days.length)-s.paidUsd;s.paidUsd+=amount;s.payroll=[...s.payroll,{day,amount,entryKey}];next.income=[...next.income,{entryKey,kind:'SALARY',currency:'USD',seasonKey:next.world.seasonKey,day,amount}];if(next.military.service!.returnOption?.status!=='CONFIRMED'||next.military.service!.returnOffer?.status==='OPEN')recordUsMilitaryClosedDay(next,day);
 }
 next.phaseContext=through===s.lastDay?{phase:'SEASON_REVIEW'}:{phase:'SEASON_PROGRESS',nextWorldDay:through+1,pendingGame:null};next.revision++;assertUsSeason(next,next.revision);auditUsClosedDays(next);return next;
}


import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {enlistInSangmu,completeSangmuBlock} from '../src/kbo-military-program.js';
import {createKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {resumeKboContractPayments} from '../src/kbo-contract-payments.js';
let cached:KboCareer|undefined;
/** Controlled prior clock, then actual worker execution to one remaining paid day's safe stop. */
export function remainderDecisionCareer():KboCareer {
 if(cached)return structuredClone(cached);
 const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),r=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(r,r.revision);let c=startKboRegularSeason(s,s.revision);
 const contract=c.world.contracts[c.protagonistKey]!,year=Number(c.world.seasonKey),day=year%4===0 && (year%100!==0 || year%400===0)?181:180;
 const program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:1}),done=completeSangmuBlock(completeSangmuBlock(program,String(year-1),300),String(year),day);
 contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:String(year),worldDay:day});contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,done);
 c.world.clubs.find(x=>x.id===c.protagonistClubId)!.reservedSalaryWon-=contract.annualSalaryWon-kboContractSeasonCharge(contract);
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay));c.days={...c.days!,days:Array.from({length:day-first+1},(_,i)=>({day:first+i,evidence:'controlled-prior-clock',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 for(let i=0;i<150;i++){const out=advanceKboCareer(c,c.revision,7);c=out.career;if(out.stopReason==='CONTRACT_DECISION_REQUIRED'){cached=structuredClone(c);return c;}}
 throw new Error('fixture failed to close the last paid day');
}

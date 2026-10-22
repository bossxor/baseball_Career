import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboInitialContract} from '../src/kbo-world.js';
import {enlistInSangmu,completeSangmuBlock,resumedContractPayment} from '../src/kbo-military-program.js';
import {resumeKboContractPayments} from '../src/kbo-contract-payments.js';
import {createKboServicePayroll,carryKboServicePayroll,kboContractSeasonCharge,kboServiceFutureCommitment,assertKboServicePayroll,kboServiceContractView} from '../src/kbo-service-payroll.js';

function fixture(){
 const contract:KboInitialContract={contractKey:'c',playerKey:'p',clubId:'LG',seasonKey:'2031',years:2,annualSalaryWon:100_000_000,signingBonusWon:0,status:'ACTIVE'};
 const program=enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:'2030',contract,remainingPaidGameDays:216});
 contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:'2032',worldDay:181});return {contract,program};
}
test('service payroll reserves zero in the full service year, actual return-year Futures capacity and residual future principal',()=>{
 const {contract:c,program}=fixture(),before=JSON.stringify(c);
 assert.equal(kboContractSeasonCharge(c),0);assert.equal(c.servicePay!.reservedGameDays,0);
 const next={...c,seasonKey:'2032',servicePay:carryKboServicePayroll(c,'2032')},n=next.servicePay!.reservedGameDays;
 assert.ok(n>0 && n<144);assert.equal(kboContractSeasonCharge(next),resumedContractPayment(program.contract,0,n));
 assert.equal(kboServiceFutureCommitment(c,1),kboContractSeasonCharge(next));
 assert.equal(kboServiceFutureCommitment(c,1)+kboServiceFutureCommitment(c,2)+kboServiceFutureCommitment(c,3),program.contract.totalRemainingWon);
 assert.equal(kboContractSeasonCharge(next)+kboServiceFutureCommitment(next,1)+kboServiceFutureCommitment(next,2),program.contract.totalRemainingWon);
 assert.equal(JSON.stringify(c),before);assert.deepEqual(next.servicePay!.ledger,c.servicePay!.ledger);assert.equal(next.servicePay!.ledger.contract.remainingPaidGameDays,216);
 assert.throws(()=>carryKboServicePayroll(c,'2033'),/INVALID_KBO_PAYROLL_CARRY/);assert.throws(()=>kboServiceFutureCommitment(c,0),/INVALID_KBO_FUTURE_YEAR/);
 const ordinary={...c};delete ordinary.servicePay;assert.equal(kboContractSeasonCharge(ordinary),ordinary.annualSalaryWon);assert.equal(kboServiceFutureCommitment(ordinary,1),ordinary.annualSalaryWon);
});
test('service payroll rejects changed contract identity, principal version, wrong completion date and excessive reservation',()=>{
 const {contract:c,program}=fixture();
 for(const change of [{contractKey:'wrong'},{annualSalaryWon:200_000_000},{playerKey:'other'}])assert.throws(()=>assertKboServicePayroll({...c,...change}),/INVALID_KBO_SERVICE_PAYROLL/);
 const excess=structuredClone(c);excess.servicePay!.reservedGameDays=217;assert.throws(()=>assertKboServicePayroll(excess));
 const legacy=structuredClone(c);legacy.servicePay!.ledger.schemaVersion=1;assert.throws(()=>assertKboServicePayroll(legacy),/INVALID_KBO_SERVICE_PAYROLL/);
 const done=completeSangmuBlock(completeSangmuBlock(program,'2031',300),'2032',181),valid={...c,seasonKey:'2032',servicePay:carryKboServicePayroll(c,'2032')};valid.servicePay.ledger=resumeKboContractPayments(valid.servicePay.ledger,done);assertKboServicePayroll(valid);
 const wrong=structuredClone(valid);wrong.servicePay.returnDate.worldDay=180;assert.throws(()=>assertKboServicePayroll(wrong),/INVALID_KBO_SERVICE_PAYROLL/);
 const before=JSON.stringify(valid);const carried=carryKboServicePayroll(valid,'2033');assert.equal(JSON.stringify(valid),before);assert.deepEqual(carried.ledger,valid.servicePay.ledger);
});

test('public service contract view reports suspended/returned money and exact days without exposing receipts or mutating source',()=>{
 const {contract:c,program}=fixture(),before=JSON.stringify(c),v=kboServiceContractView(c)!;
 assert.equal(v.status,'SUSPENDED');assert.equal(v.remainingPaidGameDays,216);assert.equal(v.unpaidPrincipalWon,150_000_000);assert.equal(v.paidThisSeasonWon,0);assert.equal(v.reservedThisSeasonWon,0);assert.equal(JSON.stringify(c),before);assert.doesNotMatch(JSON.stringify(v),/ledger|receipt|program|contractKey|potential|rng|seed/i);
 const plain={...c};delete plain.servicePay;assert.equal(kboServiceContractView(plain),null);
 const next={...c,seasonKey:'2032',servicePay:carryKboServicePayroll(c,'2032')},done=completeSangmuBlock(completeSangmuBlock(program,'2031',300),'2032',181);next.servicePay.ledger=resumeKboContractPayments(next.servicePay.ledger,done);
 const returned=kboServiceContractView(next)!;assert.equal(returned.status,'RESUMED');assert.equal(returned.returnSeasonKey,'2032');assert.equal(returned.returnWorldDay,181);assert.equal(returned.reservedThisSeasonWon,kboContractSeasonCharge(next));assert.deepEqual(kboServiceContractView(JSON.parse(JSON.stringify(next))),returned);
});

test('career entry adds payment details only for a service contract, keeping ordinary view shape and private state intact',async()=>{
 const {enteredKboCareer}=await import('./fixtures.js'),{kboCareerEntryView}=await import('../src/kbo-career-entry.js');
 const c=enteredKboCareer(),key=c.protagonistKey,ordinary=kboCareerEntryView(c);assert.equal(Object.hasOwn(ordinary.contract,'payment'),false);
 const contract=c.world.contracts[key]!,year=Number(c.world.seasonKey),program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:key,clubId:c.protagonistClubId,selectionSeasonKey:String(year-1),contract,remainingPaidGameDays:144}),returnYear=year+1,day=returnYear%4===0 && (returnYear%100!==0 || returnYear%400===0)?181:180;
 contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:String(returnYear),worldDay:day});const before=JSON.stringify(c),view=kboCareerEntryView(c);assert.equal(view.contract.payment!.remainingPaidGameDays,144);assert.equal(view.contract.payment!.status,'SUSPENDED');assert.equal(JSON.stringify(c),before);assert.doesNotMatch(JSON.stringify(view),/ledger|receipt|potential|rng|seed/i);
});

test('last service-contract payment stops a multi-day worker at the closed date before any following games are published',async()=>{
 const {enteredKboCareer}=await import('./fixtures.js'),{confirmKboPreseasonPlan}=await import('../src/kbo-preseason.js'),{confirmKboOpeningRoster}=await import('../src/kbo-opening-roster.js'),{confirmKboSeasonSchedule}=await import('../src/kbo-schedule.js'),{startKboRegularSeason,advanceKboCareer}=await import('../src/kbo-progress.js'),{canonicalJson}=await import('../src/game.js');
 const e=enteredKboCareer(),plan=confirmKboPreseasonPlan(e,e.revision),roster=confirmKboOpeningRoster(plan,plan.revision),scheduled=confirmKboSeasonSchedule(roster,roster.revision);let c=startKboRegularSeason(scheduled,scheduled.revision);
 const contract=c.world.contracts[c.protagonistKey]!,year=Number(c.world.seasonKey),day=year%4===0 && (year%100!==0 || year%400===0)?181:180;
 // Controlled returned-contract boundary with one paid day left. Prior calendar days are fixtures; following games are real.
 const program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:1}),done=completeSangmuBlock(completeSangmuBlock(program,String(year-1),300),String(year),day);
 contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:String(year),worldDay:day});contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,done);
 const own=c.world.clubs.find(x=>x.id===c.protagonistClubId)!;own.reservedSalaryWon-=contract.annualSalaryWon-kboContractSeasonCharge(contract);
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay));c.days={...c.days!,days:Array.from({length:day-first+1},(_,i)=>({day:first+i,evidence:'controlled-prior-clock',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 let stop='';for(let i=0;i<150;i++){const out=advanceKboCareer(c,c.revision,7);c=out.career;stop=out.stopReason;if(stop==='CONTRACT_DECISION_REQUIRED')break;}
 assert.equal(stop,'CONTRACT_DECISION_REQUIRED');assert.equal(c.world.contracts[c.protagonistKey]!.servicePay!.ledger.receipts.length,1);assert.equal(c.world.clubs.find(x=>x.id===c.protagonistClubId)!.paidSalaryWon,program.contract.totalRemainingWon);assert.equal(c.phaseContext.phase,'SEASON_PROGRESS');if(c.phaseContext.phase!=='SEASON_PROGRESS')return;
 assert.equal(c.phaseContext.pendingGame,null);assert.equal(c.phaseContext.nextWorldDay,c.days!.days.at(-1)!.day+1);const nextDay=c.phaseContext.nextWorldDay;assert.ok(Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey).every(g=>g.worldDay<nextDay));const before=canonicalJson(c);assert.throws(()=>advanceKboCareer(c,c.revision,7),/CONTRACT_DECISION_REQUIRED/);assert.equal(canonicalJson(c),before);
});

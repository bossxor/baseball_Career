import test from 'node:test';
import assert from 'node:assert/strict';
import {enlistInSangmu,completeSangmuBlock} from '../src/kbo-military-program.js';
import {createKboContractPaymentLedger,resumeKboContractPayments,recordKboContractPayment,kboContractPaymentBalance} from '../src/kbo-contract-payments.js';
import type {KboContractPaymentLedger} from '../src/kbo-contract-payments.js';
import type {GameContribution} from '../src/records.js';
import type {HealthGame} from '../src/health.js';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';

function program(days=72,salary=100_000_000){return enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:'2030',remainingPaidGameDays:days,contract:{contractKey:'c',playerKey:'p',clubId:'LG',seasonKey:'2030',years:4,annualSalaryWon:salary,signingBonusWon:0,status:'ACTIVE'}});}
function finished(p=program()){return completeSangmuBlock(completeSangmuBlock(p,'2031',300),'2032',500);}
function resumed(days=72,salary=100_000_000){const p=program(days,salary);return resumeKboContractPayments(createKboContractPaymentLedger(p),finished(p));}
function evidence(day:number,leagueKey='KBO',opponent='KT'):{game:GameContribution;registration:HealthGame}{
 const gameKey='g'+day;
 return {game:{gameKey,worldDay:day,scope:{seasonKey:day<1000?'2032':'2033',leagueKey,phase:'REGULAR'},teams:{LG:{games:1,W:0,L:0,T:1,R:0,RA:0},[opponent]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}},registration:{gameKey,day,seasonKey:day<1000?'2032':'2033',teamKey:leagueKey+':LG',roster:['p'],appearances:[]}};
}
test('suspension pays nothing, preserves principal and cannot resume before the same two-block program completes',()=>{
 const p=program(),s=createKboContractPaymentLedger(p),before=structuredClone(s),e=evidence(501);
 assert.deepEqual(kboContractPaymentBalance(s),{status:'SUSPENDED',paidDays:0,paidWon:0,remainingPaidGameDays:72,remainingWon:50_000_000});
 assert.throws(()=>recordKboContractPayment(s,e.game,e.registration),/PAYMENT_SUSPENDED/);
 for(const other of [p,completeSangmuBlock(p,'2031',300),{...finished(p),programId:'another'}, {...finished(p),contract:{...p.contract,annualSalaryWon:200_000_000}}])assert.throws(()=>resumeKboContractPayments(s,other),/RETURN_NOT_CONFIRMED/);
 assert.deepEqual(s,before);const r=resumeKboContractPayments(s,finished(p));assert.deepEqual(resumeKboContractPayments(r,finished(p)),r);
 assert.throws(()=>resumeKboContractPayments(r,{...finished(p),returnOptionId:'changed'}),/CHANGED_CONTRACT_RETURN/);
});
test('72 actual registered days pay exactly half the annual salary; duplicate retries after JSON reload never pay again',()=>{
 let s=resumed(),sum=0;
 for(let i=0;i<72;i++){const e=evidence(501+i,i%2?'FUTURES':'KBO',i===10?'SANGMU':'KT'),r=recordKboContractPayment(s,e.game,e.registration);s=JSON.parse(JSON.stringify(r.ledger)) as KboContractPaymentLedger;sum+=r.paidWon;const retry=recordKboContractPayment(s,e.game,e.registration);assert.equal(retry.paidWon,0);assert.equal(retry.duplicate,true);assert.deepEqual(retry.ledger,s);}
 assert.equal(sum,50_000_000);assert.equal(s.receipts.at(-1)!.amountWon,50_000_000-694_444*71);
 assert.deepEqual(kboContractPaymentBalance(s),{status:'SETTLED',paidDays:72,paidWon:50_000_000,remainingPaidGameDays:0,remainingWon:0});
 const prior=resumed(),one=evidence(501),first=recordKboContractPayment(prior,one.game,one.registration).ledger,two=evidence(502),second=recordKboContractPayment(first,two.game,two.registration).ledger;second.receipts[0]!.amountWon++;assert.equal(first.receipts[0]!.amountWon,694_444);assert.equal(prior.receipts.length,0);
 const old=evidence(501);assert.equal(recordKboContractPayment(s,old.game,old.registration).paidWon,0);
 const next=evidence(600);assert.throws(()=>recordKboContractPayment(s,next.game,next.registration),/PAYMENT_COMPLETE/);
});
test('unregistered, mismatched, duplicated and pre-return evidence rejects without consuming days',()=>{
 const s=resumed(),base=evidence(501),cases=[
  {...base,registration:{...base.registration,roster:[]}}, {...base,registration:{...base.registration,roster:['p','p']}},
  {...base,registration:{...base.registration,day:502}}, {...base,registration:{...base.registration,teamKey:'KBO:KT'}},
  {...base,registration:{...base.registration,gameKey:'other'}}, {...base,registration:{...base.registration,seasonKey:'2034'}},
  {...base,game:{...base.game,scope:{...base.game.scope,phase:'POSTSEASON' as const}}},evidence(501,'INTERNATIONAL'),evidence(500),
 ];
 for(const e of cases)assert.throws(()=>recordKboContractPayment(s,e.game,e.registration),/INVALID_CONTRACT_PAYMENT_EVIDENCE/);
 const paid=recordKboContractPayment(s,base.game,base.registration).ledger;
 assert.throws(()=>recordKboContractPayment(paid,base.game,{...base.registration,roster:['p','another']}),/CHANGED_CONTRACT_PAYMENT_EVIDENCE/);
 assert.throws(()=>recordKboContractPayment(paid,{...base.game,gameKey:'different'},{...base.registration,gameKey:'different'}),/NON_CHRONOLOGICAL/);
 assert.equal(s.receipts.length,0);
});
test('zero remaining days stay settled after return; multi-season pay retains exact days and integer-won remainder',()=>{
 assert.equal(kboContractPaymentBalance(resumed(0)).status,'SETTLED');
 let s=resumed(576,30_000_000),sum=0;
 for(let i=0;i<576;i++){const e=evidence(501+i);const r=recordKboContractPayment(s,e.game,e.registration);s=r.ledger;sum+=r.paidWon;}
 assert.equal(sum,120_000_000);assert.equal(kboContractPaymentBalance(s).remainingPaidGameDays,0);
 const bad=resumed();bad.contract.dailyWon++;assert.throws(()=>kboContractPaymentBalance(bad),/INVALID_CONTRACT_PAYMENT_LEDGER/);
 const paid=recordKboContractPayment(resumed(),evidence(501).game,evidence(501).registration).ledger;
 paid.receipts[0]!.amountWon++;assert.throws(()=>kboContractPaymentBalance(paid),/INVALID_CONTRACT_PAYMENT_LEDGER/);
});
test('an actual finalized pro game and unused bench registration can pay one resumed day without changing career or records',()=>{
 const entered=enteredKboCareer(),plan=confirmKboPreseasonPlan(entered,entered.revision),roster=confirmKboOpeningRoster(plan,plan.revision),scheduled=confirmKboSeasonSchedule(roster,roster.revision);
 let career=startKboRegularSeason(scheduled,scheduled.revision);
 for(let i=0;i<60 && !career.health.games.some(r=>r.evidence.seasonKey===career.world.seasonKey && r.evidence.teamKey.startsWith('KBO:'));i++)career=advanceKboCareer(career,career.revision,1).career;
 const registration=career.health.games.find(r=>r.evidence.seasonKey===career.world.seasonKey && r.evidence.teamKey.startsWith('KBO:'))!.evidence;
 const playerKey=registration.roster.find(k=>!registration.appearances.some(a=>a.playerKey===k))!,contract=career.world.contracts[playerKey]!;
 const game=career.records.games[registration.gameKey]!,selection=String(Number(contract.seasonKey)-2);
 const p=enlistInSangmu({worldKey:career.world.worldKey,playerKey,clubId:contract.clubId,selectionSeasonKey:selection,contract,remainingPaidGameDays:72});
 const complete=completeSangmuBlock(completeSangmuBlock(p,p.blocks[0]!.seasonKey,game.worldDay-2),p.blocks[1]!.seasonKey,game.worldDay-1);
 const ledger=resumeKboContractPayments(createKboContractPaymentLedger(p),complete),before=JSON.stringify(career),paid=recordKboContractPayment(ledger,game,registration);
 assert.equal(paid.paidWon,Math.round(contract.annualSalaryWon/144));assert.equal(paid.ledger.receipts.length,1);assert.equal(JSON.stringify(career),before);
});

test('calendar-year reset: service return and registered pay use season plus day, preserving old receipts and replay safety',()=>{
 const p=program(),completed=completeSangmuBlock(completeSangmuBlock(p,'2031',303),'2032',150);
 let s=resumeKboContractPayments(createKboContractPaymentLedger(p),completed);
 const at=(year:string,day:number)=>{const e=evidence(day);e.game.gameKey=year+':'+day;e.game.scope.seasonKey=year;e.registration.gameKey=e.game.gameKey;e.registration.seasonKey=year;return e;};
 const one=at('2032',302);s=recordKboContractPayment(s,one.game,one.registration).ledger;const prior=JSON.stringify(s);
 const two=at('2033',32),paid=recordKboContractPayment(s,two.game,two.registration);assert.equal(paid.paidWon,694_444);assert.equal(paid.ledger.receipts.length,2);assert.equal(JSON.stringify(s),prior);
 assert.equal(recordKboContractPayment(JSON.parse(JSON.stringify(paid.ledger)),one.game,one.registration).paidWon,0);
 const backward=at('2032',303);assert.throws(()=>recordKboContractPayment(paid.ledger,backward.game,backward.registration),/NON_CHRONOLOGICAL/);
 const premature=at('2032',150);assert.throws(()=>recordKboContractPayment(s,premature.game,premature.registration),/INVALID_CONTRACT_PAYMENT_EVIDENCE/);
});

test('legacy v1 reads stay unchanged; an explicit matching-program resume upgrades to v2 without rewriting paid receipts',()=>{
 const old=structuredClone(resumed());old.schemaVersion=1;delete old.resume!.completedSeasonKey;const e=evidence(501),paid=recordKboContractPayment(old,e.game,e.registration).ledger,before=JSON.stringify(paid);
 assert.equal(paid.schemaVersion,1);assert.equal(kboContractPaymentBalance(paid).paidDays,1);assert.equal(JSON.stringify(paid),before);
 const upgraded=resumeKboContractPayments(paid,finished());assert.equal(upgraded.schemaVersion,2);assert.equal(upgraded.resume!.completedSeasonKey,'2032');assert.deepEqual(upgraded.receipts,paid.receipts);assert.equal(JSON.stringify(paid),before);
 assert.equal(recordKboContractPayment(upgraded,e.game,e.registration).paidWon,0);
 const bad=structuredClone(upgraded);delete bad.resume!.completedSeasonKey;assert.throws(()=>kboContractPaymentBalance(bad),/INVALID_CONTRACT_PAYMENT_LEDGER/);
});

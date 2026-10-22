import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboInitialContract} from '../src/kbo-world.js';
import {enlistInSangmu,completeSangmuBlock,resumedContractPayment} from '../src/kbo-military-program.js';
import {resumeKboContractPayments} from '../src/kbo-contract-payments.js';
import {createKboServicePayroll,carryKboServicePayroll,kboContractSeasonCharge,kboServiceFutureCommitment,assertKboServicePayroll} from '../src/kbo-service-payroll.js';

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

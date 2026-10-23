import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {carryKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {completeSangmuBlock} from '../src/kbo-military-program.js';
import {recordKboContractPayment,resumeKboContractPayments} from '../src/kbo-contract-payments.js';
import {assertKboFinanceLedger,kboClubBalance,kboFutureCommitmentWon,kboPreservedServiceCommitmentWon,kboRecruitmentOpen,protectKboEmergencyBudget,protectKboServiceBudget} from '../src/kbo-finance.js';
import {KBO_MONEY} from '@playball/rules';
import {canonicalJson} from '../src/game.js';
import type {GameContribution} from '../src/records.js';

function intake(){const e=enteredKboCareer();return startSangmuCohort(e,e.revision);}

function payable(){
 const c=intake(),world=c.world,key=Object.keys(world.suspendedContracts!)[0]!,first=world.seasonKey;
 const carry=()=>{const target=String(Number(world.seasonKey)+1);for(const contract of Object.values(world.suspendedContracts!)){contract.servicePay=carryKboServicePayroll(contract,target);contract.seasonKey=target;}world.seasonKey=target;};
 carry();const contract=world.suspendedContracts![key]!,day=contract.servicePay!.returnDate.worldDay,program=c.sangmu!.members[key]!.program;
 const done=completeSangmuBlock(completeSangmuBlock(program,first,300),world.seasonKey,day);
 contract.servicePay!.ledger=resumeKboContractPayments(contract.servicePay!.ledger,done);
 const line={games:1,W:0,L:0,T:1,R:0,RA:0},game:GameContribution={gameKey:'controlled-paid-registration',worldDay:day+1,scope:{seasonKey:world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[contract.clubId]:line,OTHER:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 contract.servicePay!.ledger=recordKboContractPayment(contract.servicePay!.ledger,game,{gameKey:game.gameKey,seasonKey:world.seasonKey,day:game.worldDay,teamKey:'FUTURES:'+contract.clubId,roster:[key],appearances:[]}).ledger;
 contract.servicePay!.reservedGameDays--;carry();
 const club=world.clubs.find(t=>t.id===contract.clubId)!,serviceWon=Object.values(world.suspendedContracts!).filter(x=>x.clubId===club.id).reduce((n,x)=>n+kboContractSeasonCharge(x),0);
 assert.ok(serviceWon>1_234_567);return {world,club,contract,serviceWon};
}

test('existing service debt receives only the exact current-year deficit without changing principal or past payments',()=>{
 const {world,club,contract}=payable(),budget=club.budgetWon,principal=canonicalJson(world.suspendedContracts),future=kboFutureCommitmentWon(world,club.id,1),deficit=1_234_567;
 // Controlled ordinary commitments fit the budget; the preserved service reservation causes this exact shortage.
 club.paidSalaryWon=0;club.reservedSalaryWon=budget+deficit;
 assert.equal(contract.servicePay!.ledger.receipts.length,1);assert.notEqual(contract.servicePay!.ledger.receipts[0]!.seasonKey,world.seasonKey);
 assert.equal(protectKboServiceBudget(world,club.id),deficit);assert.equal(world.finance!.grants.length,1);
 assert.deepEqual(world.finance!.grants[0],{receiptKey:JSON.stringify(['kbo-service-support',world.worldKey,world.seasonKey,club.id,0]),seasonKey:world.seasonKey,clubId:club.id,amountWon:deficit,reason:'SERVICE_OBLIGATION_REBUILD'});
 assert.equal(kboClubBalance(world,club.id).availableWon,0);assert.equal(club.budgetWon,budget);assert.equal(canonicalJson(world.suspendedContracts),principal);assertKboFinanceLedger(world);
 const supported=canonicalJson(world);assert.equal(protectKboServiceBudget(world,club.id),0);assert.equal(canonicalJson(world),supported);
 assert.equal(kboRecruitmentOpen(world,club.id),false);assert.equal(kboClubBalance(world,club.id,String(Number(world.seasonKey)+1)).supportWon,0);assert.equal(kboFutureCommitmentWon(world,club.id,1),future);
 // Support is not a permanent recruitment ban after its own payment season.
 const later=structuredClone(world);later.seasonKey=String(Number(world.seasonKey)+1);later.clubs.find(t=>t.id===club.id)!.budgetWon=100_000_000_000;assert.equal(kboRecruitmentOpen(later,club.id),true);
});

test('future preserved obligations restrict recruitment without issuing an advance payment grant',()=>{
 const c=intake(),world=c.world,contract=Object.values(world.suspendedContracts!)[0]!,club=world.clubs.find(t=>t.id===contract.clubId)!;
 assert.ok(kboPreservedServiceCommitmentWon(world,club.id,1)>0);
 // A controlled budget isolates future debt from an otherwise fully funded current year.
 club.budgetWon=10_000;club.paidSalaryWon=0;club.reservedSalaryWon=0;
 const before=canonicalJson(world);assert.equal(kboRecruitmentOpen(world,club.id),false);assert.equal(protectKboServiceBudget(world,club.id),0);assert.equal(canonicalJson(world),before);assert.equal(world.finance?.grants.length??0,0);
 const legacy=structuredClone(world);delete legacy.suspendedContracts;assert.equal(kboPreservedServiceCommitmentWon(legacy,club.id,1),0);
});

test('service rescue refuses unrelated overspending and leaves old annual worlds unchanged',()=>{
 const {world,club,serviceWon}=payable();club.reservedSalaryWon=club.budgetWon+serviceWon+1;club.paidSalaryWon=0;
 const before=canonicalJson(world);assert.throws(()=>protectKboServiceBudget(world,club.id),/INVALID_KBO_SERVICE_SUPPORT/);assert.equal(canonicalJson(world),before);
 const legacy=enteredKboCareer().world,oldClub=legacy.clubs[0]!;oldClub.reservedSalaryWon=oldClub.budgetWon+1_234_567;const old=canonicalJson(legacy);
 assert.equal(protectKboServiceBudget(legacy,oldClub.id),0);assert.equal(canonicalJson(legacy),old);
});

test('a required roster repair covers an exact one-won gap after service accounting',()=>{
 const {world,club}=payable(),budget=club.budgetWon;
 club.paidSalaryWon=0;club.reservedSalaryWon=budget-KBO_MONEY.minimumSalaryWon+1;
 const principal=canonicalJson(world.suspendedContracts);assert.equal(kboClubBalance(world,club.id).availableWon,KBO_MONEY.minimumSalaryWon-1);assert.equal(protectKboServiceBudget(world,club.id),0);
 assert.equal(protectKboEmergencyBudget(world,club.id,world.seasonKey,1),1);assert.equal(world.finance!.grants[0]!.reason,'MINIMUM_ROSTER_REBUILD');assert.equal(world.finance!.grants[0]!.amountWon,1);assertKboFinanceLedger(world);
 assert.equal(kboClubBalance(world,club.id).availableWon,KBO_MONEY.minimumSalaryWon);assert.equal(protectKboEmergencyBudget(world,club.id,world.seasonKey,1),0);assert.equal(canonicalJson(world.suspendedContracts),principal);assert.equal(club.budgetWon,budget);
 const legacy=structuredClone(world);delete legacy.suspendedContracts;assert.throws(()=>assertKboFinanceLedger(legacy),/INVALID_KBO_SUPPORT_GRANT/);
});

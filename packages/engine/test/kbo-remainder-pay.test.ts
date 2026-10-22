import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {createKboRemainderContract,recordKboRemainderPayment,finalizeKboRemainderPayments,kboRemainderBalance,kboRemainderSeasonCharge,assertKboRemainderPay} from '../src/kbo-remainder-pay.js';
import {kboContractPaymentBalance} from '../src/kbo-contract-payments.js';
import type {GameContribution} from '../src/records.js';
import type {HealthGame} from '../src/health.js';
function term(salary=30_010_000){const c=remainderDecisionCareer(),old=c.world.contracts[c.protagonistKey]!,day=c.days!.days.at(-1)!.day;return createKboRemainderContract(old,{contractKey:'new-term',annualSalaryWon:salary,startAfterWorldDay:day,endWorldDay:day+3,reservedGameDays:3});}
function evidence(c:ReturnType<typeof term>,offset:number){const p=c.remainderPay!,day=p.startAfterWorldDay+offset,gameKey='remainder-'+offset,other=c.clubId==='KT'?'LG':'KT';const game:GameContribution={gameKey,worldDay:day,scope:{seasonKey:c.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[c.clubId]:{games:1,W:1,L:0,T:0,R:1,RA:0},[other]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};const registration:HealthGame={gameKey,day,seasonKey:c.seasonKey,teamKey:'FUTURES:'+c.clubId,roster:[c.playerKey],appearances:[]};return {game,registration};}
test('new prorated term preserves settled principal, pays registered bench once and settles both rounding signs exactly',()=>{
 for(const salary of [30_010_000,100_000_000]){const initial=term(salary),prior=canonicalJson(initial.remainderPay!.previous);let c=initial;
  assert.equal(c.status,'ACTIVE_PRORATED');assert.equal(kboContractPaymentBalance(c.remainderPay!.previous.servicePay.ledger).status,'SETTLED');
  for(let i=1;i<=3;i++){const e=evidence(c,i),out=recordKboRemainderPayment(c,e.game,e.registration);c=JSON.parse(JSON.stringify(out.contract));assert.equal(out.paidWon,Math.round(salary/144));const replay=recordKboRemainderPayment(c,e.game,e.registration);assert.equal(replay.paidWon,0);assert.equal(replay.duplicate,true);assert.equal(canonicalJson(c.remainderPay!.previous),prior);}
  const before=canonicalJson(c),out=finalizeKboRemainderPayments(c,c.remainderPay!.endWorldDay);assert.equal(canonicalJson(c),before);assert.equal(out.adjustmentWon,Math.round(salary*3/144)-Math.round(salary/144)*3);c=out.contract;const b=kboRemainderBalance(c);assert.equal(b.paidWon,Math.round(salary*3/144));assert.equal(b.reservedWon,0);assert.equal(kboRemainderSeasonCharge(c),b.priorPaidWon+b.paidWon);assert.equal(finalizeKboRemainderPayments(c,c.remainderPay!.endWorldDay).adjustmentWon,0);assert.equal(c.remainderPay!.receipts.length,3);
 }
});
test('prorated payment rejects foreign/unregistered/international/changed evidence, stale dates and invalid previous principal without mutations',()=>{
 const c=term(),before=canonicalJson(c),e=evidence(c,1);
 for(const mutate of [(x:typeof e)=>{x.registration.roster=[];},(x:typeof e)=>{x.game.scope.phase='POSTSEASON';},(x:typeof e)=>{x.registration.teamKey='FUTURES:OTHER';},(x:typeof e)=>{x.game.scope.seasonKey='2040';}]){const bad=structuredClone(e);mutate(bad);assert.throws(()=>recordKboRemainderPayment(c,bad.game,bad.registration));assert.equal(canonicalJson(c),before);}
 const paid=recordKboRemainderPayment(c,e.game,e.registration).contract,changed=structuredClone(e);changed.registration.roster=[...changed.registration.roster,'extra'];assert.throws(()=>recordKboRemainderPayment(paid,changed.game,changed.registration),/CHANGED/);
 assert.throws(()=>finalizeKboRemainderPayments(c,c.remainderPay!.endWorldDay-1));const bad=structuredClone(c);bad.remainderPay!.previous.servicePay.ledger.receipts=[];assert.throws(()=>assertKboRemainderPay(bad));
});

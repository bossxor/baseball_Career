import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {createKboRemainderContract,recordKboRemainderPayment,finalizeKboRemainderPayments,kboRemainderBalance,kboRemainderSeasonCharge,kboRemainderPriorClubCharge,assertKboRemainderPay,settleKboRemainderPayrollDay} from '../src/kbo-remainder-pay.js';
import type {KboInitialContract} from '../src/kbo-world.js';
import type {GameContribution} from '../src/records.js';
import type {HealthGame} from '../src/health.js';

function term(salary=30_010_000){
 const c=remainderDecisionCareer(),old=c.world.contracts[c.protagonistKey]!,day=c.days!.days.at(-1)!.day,clubId=c.world.clubs.find(x=>x.id!==old.clubId)!.id;
 return createKboRemainderContract(old,{contractKey:'transferred-term',clubId,annualSalaryWon:salary,startAfterWorldDay:day,endWorldDay:day+3,reservedGameDays:3});
}
function evidence(c:KboInitialContract,worldDay:number,gameKey='transfer-'+worldDay){
 const other=c.clubId==='KT'?'LG':'KT';
 const game:GameContribution={gameKey,worldDay,scope:{seasonKey:c.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[c.clubId]:{games:1,W:1,L:0,T:0,R:1,RA:0},[other]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 const registration:HealthGame={gameKey,day:worldDay,seasonKey:c.seasonKey,teamKey:'FUTURES:'+c.clubId,roster:[c.playerKey],appearances:[]};return {game,registration};
}

test('foreign v2 term preserves old-club principal and pays only the new registered club, including both rounding signs and JSON replays',()=>{
 const adjustments:number[]=[];
 for(const salary of [30_010_000,100_000_000]){
  let c=term(salary);const p=c.remainderPay!,prior=canonicalJson(p.previous),charge=kboRemainderPriorClubCharge(c)!;
  assert.equal(p.schemaVersion,2);assert.notEqual(c.clubId,p.previous.clubId);assert.ok(charge.paidWon>0);assert.equal(charge.clubId,p.previous.clubId);
  assert.equal(kboRemainderSeasonCharge(c),kboRemainderBalance(c).reservedWon);
  for(let i=1;i<=3;i++){
   const e=evidence(c,p.startAfterWorldDay+i),out=recordKboRemainderPayment(c,e.game,e.registration);c=JSON.parse(JSON.stringify(out.contract)) as KboInitialContract;
   assert.equal(out.paidWon,Math.round(salary/144));const replay=recordKboRemainderPayment(c,e.game,e.registration);assert.equal(replay.paidWon,0);assert.equal(replay.duplicate,true);
   assert.equal(canonicalJson(c.remainderPay!.previous),prior);assert.deepEqual(kboRemainderPriorClubCharge(c),charge);
  }
  const before=canonicalJson(c),settled=finalizeKboRemainderPayments(c,p.endWorldDay);assert.equal(canonicalJson(c),before);c=settled.contract;adjustments.push(settled.adjustmentWon);
  const balance=kboRemainderBalance(c);assert.equal(balance.paidWon,Math.round(salary*3/144));assert.equal(balance.reservedWon,0);assert.equal(kboRemainderSeasonCharge(c),balance.paidWon);
  assert.equal(finalizeKboRemainderPayments(c,p.endWorldDay).adjustmentWon,0);assert.equal(canonicalJson(c.remainderPay!.previous),prior);assert.deepEqual(kboRemainderPriorClubCharge(c),charge);
 }
 assert.ok(adjustments.some(n=>n>0));assert.ok(adjustments.some(n=>n<0));
});

test('v1 same-club data stays unchanged; cross-club terms reject version downgrade, old-team registration and changed evidence',()=>{
 const foreign=term(),old=foreign.remainderPay!.previous,input={contractKey:'same-club-term',annualSalaryWon:foreign.annualSalaryWon,startAfterWorldDay:foreign.remainderPay!.startAfterWorldDay,endWorldDay:foreign.remainderPay!.endWorldDay,reservedGameDays:3};
 const legacy=createKboRemainderContract(old,input),explicit=createKboRemainderContract(old,{...input,clubId:old.clubId});assert.deepEqual(explicit,legacy);assert.equal(legacy.remainderPay!.schemaVersion,1);assert.equal(kboRemainderPriorClubCharge(legacy),null);
 assert.equal(kboRemainderSeasonCharge(legacy),kboRemainderBalance(legacy).priorPaidWon+kboRemainderBalance(legacy).reservedWon);
 const down=structuredClone(foreign);down.remainderPay!.schemaVersion=1;assert.throws(()=>assertKboRemainderPay(down),/INVALID_KBO_REMAINDER_PAY/);
 const wrong=structuredClone(legacy);wrong.remainderPay!.schemaVersion=2;assert.throws(()=>assertKboRemainderPay(wrong),/INVALID_KBO_REMAINDER_PAY/);
 assert.throws(()=>createKboRemainderContract(old,{...input,clubId:'OTHER'}),/INVALID_KBO_REMAINDER_PAY/);
 const before=canonicalJson(foreign),valid=evidence(foreign,foreign.remainderPay!.startAfterWorldDay+1);
 for(const mutate of [(e:typeof valid)=>{e.registration.teamKey='FUTURES:'+old.clubId;},(e:typeof valid)=>{e.registration.roster=[];},(e:typeof valid)=>{e.game.scope.phase='POSTSEASON';},(e:typeof valid)=>{e.game.scope.leagueKey='HS';},(e:typeof valid)=>{e.registration.day--; }]){
  const bad=structuredClone(valid);mutate(bad);assert.throws(()=>recordKboRemainderPayment(foreign,bad.game,bad.registration));assert.equal(canonicalJson(foreign),before);
 }
 const paid=recordKboRemainderPayment(foreign,valid.game,valid.registration).contract,changed=structuredClone(valid);changed.registration.roster=[...changed.registration.roster,'changed'];assert.throws(()=>recordKboRemainderPayment(paid,changed.game,changed.registration),/CHANGED_CONTRACT_PAYMENT_EVIDENCE/);
});

test('world payroll keeps the old-club paid cost and charges new registered days only to the new club once',()=>{
 // Controlled money-boundary fixture; actual roster/rights transfer is tested by its command separately.
 const source=remainderDecisionCareer(),before=canonicalJson(source),c=structuredClone(source),key=c.protagonistKey,previous=c.world.contracts[key]!,old=c.world.clubs.find(x=>x.id===previous.clubId)!,next=c.world.clubs.find(x=>x.id!==old.id)!;
 const day=c.days!.days.at(-1)!.day,all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],endWorldDay=Math.max(...all.map(g=>g.worldDay)),reservedGameDays=new Set(all.filter(g=>g.worldDay>day && (g.homeTeamKey===next.id || g.awayTeamKey===next.id)).map(g=>g.worldDay)).size;
 const contract=createKboRemainderContract(previous,{contractKey:'world-transfer',clubId:next.id,annualSalaryWon:30_010_000,startAfterWorldDay:day,endWorldDay,reservedGameDays}),prior=kboRemainderPriorClubCharge(contract)!;
 old.roster=old.roster.filter(k=>k!==key);old.firstTeam=old.firstTeam.filter(k=>k!==key);old.reservedSalaryWon-=kboContractSeasonCharge(previous)-prior.paidWon;
 next.roster=[...next.roster,key].sort();next.reservedSalaryWon+=kboContractSeasonCharge(contract);c.world.contracts[key]=contract;c.protagonistClubId=next.id;assertKboRecruitmentWorld(c.world);
 const oldPaid=old.paidSalaryWon,newPaid=next.paidSalaryWon,priorSnapshot=canonicalJson(contract.remainderPay!.previous),scheduled=c.competitionSchedule!.leagues.FUTURES.find(g=>g.worldDay>day && (g.homeTeamKey===next.id || g.awayTeamKey===next.id))!,e=evidence(contract,scheduled.worldDay,scheduled.simulationKey);
 c.records.games[e.game.gameKey]=e.game;c.health.games=[...c.health.games,{evidence:e.registration,result:{injured:[],recovered:[]}}];c.days!.days=[...c.days!.days,{day:scheduled.worldDay,evidence:'controlled-payroll-date',result:{injured:[],recovered:[]}}];
 settleKboRemainderPayrollDay(c,scheduled.worldDay);assert.equal(old.paidSalaryWon,oldPaid);assert.equal(next.paidSalaryWon,newPaid+Math.round(contract.annualSalaryWon/144));assert.equal(canonicalJson(c.world.contracts[key]!.remainderPay!.previous),priorSnapshot);assertKboRecruitmentWorld(c.world);
 const once=canonicalJson(c);settleKboRemainderPayrollDay(c,scheduled.worldDay);assert.equal(canonicalJson(c),once);
 const moved=structuredClone(c),movedOld=moved.world.clubs.find(x=>x.id===old.id)!,movedNew=moved.world.clubs.find(x=>x.id===next.id)!;movedOld.paidSalaryWon-=prior.paidWon;movedNew.paidSalaryWon+=prior.paidWon;assert.throws(()=>assertKboRecruitmentWorld(moved.world),/PAYROLL/);
 const doubled=structuredClone(c),otherKey=next.roster.find(k=>k!==key)!,duplicate=structuredClone(doubled.world.contracts[key]!);duplicate.contractKey='duplicate-prior';duplicate.playerKey=otherKey;duplicate.remainderPay!.previous.playerKey=otherKey;duplicate.remainderPay!.previous.servicePay.ledger.contract.playerKey=otherKey;doubled.world.contracts[otherKey]=duplicate;assert.throws(()=>assertKboRecruitmentWorld(doubled.world),/PAYROLL/);
 assert.equal(canonicalJson(source),before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {suspendKboContract,resumedContractPayment,enlistInSangmu,completeSangmuBlock} from '../src/kbo-military-program.js';
import type {KboInitialContract} from '../src/kbo-world.js';

const contract=(annualSalaryWon:number,years:number):KboInitialContract=>({contractKey:'c',playerKey:'p',clubId:'LG',seasonKey:'2030',years,annualSalaryWon,signingBonusWon:0,status:'ACTIVE'});

test('suspended contract pays day-rate round(annual/144) and settles the rounded remainder on the last day',()=>{
 const s=suspendKboContract(contract(100_000_000,2),72);
 assert.equal(s.dailyWon,694_444);assert.equal(s.totalRemainingWon,50_000_000);assert.equal(s.finalDayWon,50_000_000-694_444*71);
 assert.equal(resumedContractPayment(s,0,72),50_000_000);assert.equal(resumedContractPayment(s,0,10)+resumedContractPayment(s,10,62),50_000_000);
 assert.equal(resumedContractPayment(s,71,1),s.finalDayWon);assert.equal(resumedContractPayment(s,72,0),0);
 assert.throws(()=>resumedContractPayment(s,70,3),/INVALID_RESUMED_PAYMENT/);
 assert.throws(()=>suspendKboContract(contract(100_000_000,1),145),/INVALID_SUSPENDED_CONTRACT/);
 assert.equal(suspendKboContract(contract(30_000_000,1),0).finalDayWon,0);
});

test('Sangmu program is two blocks; completion days are recorded once and in order',()=>{
 const p=enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:'2030',contract:contract(100_000_000,2),remainingPaidGameDays:288});
 assert.deepEqual(p.blocks.map(b=>[b.seasonKey,b.kind]),[['2031','FULL_DOMESTIC_SEASON'],['2032','FIRST_HALF_SEASON']]);assert.equal(p.startedSeason,'2031');
 assert.throws(()=>completeSangmuBlock(p,'2032',500),/INVALID_SERVICE_BLOCK/);
 const a=completeSangmuBlock(p,'2031',300);assert.equal(a.completedBlocks,1);assert.equal(a.returnOptionId,null);assert.deepEqual(completeSangmuBlock(a,'2031',300),a);
 assert.throws(()=>completeSangmuBlock(a,'2031',301),/SERVICE_BLOCK_EVIDENCE_REUSED/);assert.equal(completeSangmuBlock(a,'2032',300).completedBlocks,2);
 const b=completeSangmuBlock(a,'2032',420);assert.equal(b.completedBlocks,2);assert.ok(b.returnOptionId);assert.equal(p.completedBlocks,0);
});

test('service completion accepts the next season with a smaller calendar day and rejects a backward season',()=>{
 const p=enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:'2030',contract:contract(100_000_000,2),remainingPaidGameDays:288});
 const first=completeSangmuBlock(p,'2031',303),done=completeSangmuBlock(first,'2032',150);
 assert.equal(done.completedBlocks,2);assert.equal(done.blocks[1]!.completedWorldDay,150);assert.deepEqual(completeSangmuBlock(done,'2032',150),done);
 assert.throws(()=>completeSangmuBlock({...first,blocks:[first.blocks[0]!,{...first.blocks[1]!,seasonKey:'2030'}]},'2030',350),/INVALID_SERVICE_BLOCK/);
});

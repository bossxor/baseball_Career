import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareerPlayer} from '../src/player.js';
import {createWorldStream} from '../src/rng.js';
import {abilityKeys} from '@playball/rules';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {kboPlayerContractValue,kboRenewalSalaryWon,kboFreeAgentTerms} from '../src/kbo-contract-value.js';
const player=(kind:'HITTER'|'PITCHER')=>createCareerPlayer({simulationKey:kind,name:'가치선수',kind,position:kind==='HITTER'?'CF':'SP',throws:'R',bats:'R',pitchForm:kind==='HITTER'?null:'OVERHAND',archetype:'BALANCED',focus:abilityKeys(kind).slice(0,4),difficulty:'GROWTH'},createWorldStream('value',kind,'protagonist')).player;
test('08 hitter value uses exact OVR/sample PA/OPS; low samples use neutral.600, never hidden P',()=>{
 const p=player('HITTER'),low={...emptyBatting(),PA:49,AB:49,H:49,TB:49};assert.equal(kboPlayerContractValue(p,undefined,undefined).valueWon,130_000_000);const lowValue=kboPlayerContractValue(p,low,undefined);assert.equal(lowValue.basis.OPS,.6);assert.equal(lowValue.valueWon,134_900_000);
 const actual={...emptyBatting(),PA:100,AB:100,H:30,TB:50},v=kboPlayerContractValue(p,actual,undefined);assert.equal(v.basis.OPS,.8);assert.ok(Math.abs(v.valueWon-240_000_000)<.001);const changed={...p,potential:Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1_000_000]))};assert.deepEqual(kboPlayerContractValue(changed,actual,undefined),v);
});
test('08 pitcher value uses outs and ERA after20IP; salary rounded to manwon and bounded',()=>{
 const p=player('PITCHER'),v=kboPlayerContractValue(p,undefined,{...emptyPitching(),outs:60,ER:4});assert.equal(v.basis.ERA,1.8);assert.equal(v.valueWon,302_000_000);assert.equal(kboPlayerContractValue(p,undefined,{...emptyPitching(),outs:59,ER:0}).basis.ERA,5);assert.equal(kboRenewalSalaryWon(30_000_000,50_001_000),40_000_000);assert.throws(()=>kboRenewalSalaryWon(-1,50_000_000));
});
test('08 FA terms use age4/3/2/1 years, desired1.2×value; demand is not an accepted contract',()=>{
 const p=player('HITTER');for(const [age,years] of [[29,4],[30,3],[32,3],[33,2],[35,2],[36,1],[45,1]]){const v=kboFreeAgentTerms({...p,age:age!},undefined,undefined);assert.equal(v.years,years);assert.equal(v.annualSalaryWon,156_000_000);}const max=kboFreeAgentTerms(p,{...emptyBatting(),PA:30000,AB:30000,H:30000,TB:120000},undefined);assert.equal(max.valueWon,3_000_000_000);assert.equal(max.annualSalaryWon,3_600_000_000);
});

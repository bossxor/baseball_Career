import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsGuaranteedOptionCareer} from './us-option-major-fixture.js';
import {chooseUsMilitaryPlan} from '../src/us-military-plan.js';
import {canonicalJson} from '../src/game.js';
test('authentic option survives actual promotion and six credited annual writers into a five-year FA guarantee before freeze',()=>{
 const c=closedUsGuaranteedOptionCareer(),raw=canonicalJson(c),frozen=chooseUsMilitaryPlan(c,c.revision,'FREEZE');assert.equal(canonicalJson(c),raw);assert.equal(c.contract.years,5);assert.equal(c.contract.militaryReturnOption,true);assert.equal(frozen.contract.status,'FROZEN');assert.deepEqual(frozen.military.service!.sourceContract,c.contract);assert.deepEqual(frozen.income,c.income);assert.deepEqual(frozen.inventory,c.inventory);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {careerSeasonGrowthSummary} from '../src/career-growth-summary.js';
import {completedHighSchoolCareer,enteredKboCareer} from './fixtures.js';
import {settleHighSchoolCareerGrowth} from '../src/high-school-growth.js';
import {preparedUsOptionCareer} from './us-option-fixture.js';

// The raw fixture has no ledger until growth is settled (done at route open in the real flow).
const settledHighSchool=()=>{const c=completedHighSchoolCareer();return settleHighSchoolCareerGrowth(c,c.revision).career;};

test('season summary uses current protagonist and original growth ledger for all career types',()=>{
 for(const career of [settledHighSchool(),enteredKboCareer(),preparedUsOptionCareer()]){
  const key='protagonistKey' in career?career.protagonistKey:career.world.protagonistKey;
  const player=career.world.players[key]!,ledger=career.seasonGrowth!;
  const ability=abilityKeys(player.kind)[0]!,before=player.abilities[ability]!;
  career.world.players[key]={...player,abilities:{...player.abilities,[ability]:before===1000000?before-1:before+1}};
  const snapshot=JSON.stringify(career),summary=careerSeasonGrowthSummary(career)!;
  assert.equal(summary.seasonKey,ledger.seasonKey);assert.equal(summary.finalized,ledger.finalized);
  assert.deepEqual(summary.abilities,abilityKeys(player.kind).map(ability=>({ability,beforeUnits:ledger.seasonStart.abilities[ability]!,afterUnits:career.world.players[key]!.abilities[ability]!,deltaUnits:career.world.players[key]!.abilities[ability]!-ledger.seasonStart.abilities[ability]!})));
  assert.equal(JSON.stringify(career),snapshot);assert.doesNotMatch(JSON.stringify(summary),/potential/i);
 }
});

test('legacy absent ledger returns null and mismatched owner is rejected',()=>{
 const career=settledHighSchool();
 const legacy=structuredClone(career);delete legacy.seasonGrowth;assert.equal(careerSeasonGrowthSummary(legacy),null);
 const bad=structuredClone(career);bad.seasonGrowth!.playerKey='foreign';assert.throws(()=>careerSeasonGrowthSummary(bad),/GROWTH/);
});

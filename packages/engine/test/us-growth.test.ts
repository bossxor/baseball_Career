import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {settleUsSeasonGrowth,auditUsClosedDays} from '../src/us-growth.js';
import {canonicalJson} from '../src/game.js';
import {validateSeasonGrowthLedger} from '../src/growth-ledger.js';
import {canonicalSeal} from '../src/canonical-seal.js';
import {US_LEVELS} from '../src/us-season.js';
const reviewed=reviewedUsCareerFixture;

test('US full-date annual settlement pays one PRO budget, all opening NPCs and one aging; explicit forfeiture and replay keep receipts',()=>{
 const c=reviewed(),raw=canonicalJson(c);assert.throws(()=>settleUsSeasonGrowth(c,c.revision),/TRAINING_DECISION_REQUIRED/);const n=settleUsSeasonGrowth(c,c.revision,true);assert.equal(canonicalJson(c),raw);assert.equal(n.season!.paidUsd,30000);assert.ok(n.seasonGrowth.totalBudgetUnits>0);assert.ok(n.seasonGrowth.entries[0]!.gainedUnits>0);assert.equal(n.seasonGrowth.finalized,true);validateSeasonGrowthLedger(n.seasonGrowth);assert.equal(Object.keys(n.season!.growthFinalized!.npcs).length,3420);assert.deepEqual(settleUsSeasonGrowth(n,n.revision),n);assert.deepEqual(settleUsSeasonGrowth(JSON.parse(JSON.stringify(c)),c.revision,true),n);assert.equal(n.income.filter(e=>e.kind==='SIGNING_BONUS').length,1);
});
test('US annual audit refuses changed FINAL totals and incomplete date receipts before awarding growth',()=>{
 const c=reviewed(),bad=structuredClone(c),g=bad.seasonSchedule!.leagues.ROOKIE[0]!;bad.records.games[g.simulationKey]!.teams[g.homeTeamKey]!.R++;assert.throws(()=>settleUsSeasonGrowth(bad,bad.revision,true),/EVIDENCE_CHANGED/);const missing=structuredClone(c);missing.season!.days.pop();assert.throws(()=>settleUsSeasonGrowth(missing,missing.revision,true),/PAYROLL|NOT_CLOSED/);auditUsClosedDays(c);
});
test('US day seals retain legacy receipts and reject changed official game evidence',()=>{
 const legacy=reviewed(),c=structuredClone(legacy),day=c.season!.days[0]!,games=US_LEVELS.flatMap(l=>c.seasonSchedule!.leagues[l].filter(g=>g.worldDay===day.day).map(g=>c.records.games[g.simulationKey]!));
 assert.equal(day.evidence,canonicalJson(games));day.evidence=canonicalSeal(games);
 assert.doesNotThrow(()=>auditUsClosedDays(JSON.parse(JSON.stringify(c))));assert.doesNotThrow(()=>auditUsClosedDays(legacy));
 const altered=structuredClone(c),g=altered.records.games[games[0]!.gameKey]!,team=Object.keys(g.teams)[0]!;g.teams[team]!.R++;assert.throws(()=>auditUsClosedDays(altered),/EVIDENCE_CHANGED/);
 const forged=structuredClone(c);forged.season!.days[0]!.evidence='sha256:'+ '0'.repeat(64);assert.throws(()=>auditUsClosedDays(forged),/EVIDENCE_CHANGED/);
});

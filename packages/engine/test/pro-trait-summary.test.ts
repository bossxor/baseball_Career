import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {preparedUsCareer} from './us-fixtures.js';
import {closedUsOptionCareer} from './us-option-fixture.js';
import {usYearTransitionReadiness} from '../src/us-year-transition.js';
import {retryNoOfferPrefix} from './retry-completion-scenario.js';
import {openKboUncontractedRetry,reviewKboUncontractedRoutes,startKboRetryPreparation,kboRetryRoutesView,assertKboRetryState} from '../src/career-pro-retry.js';
import {unreadProTraitSummary,acknowledgeProTraitSummary} from '../src/pro-trait-summary.js';
import {createCareerTraitLedger} from '../src/high-school-traits.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {assertUsCareerRevision} from '../src/us-career-entry.js';
import {canonicalJson} from '../src/game.js';

/** Controlled unlock receipts test the reading boundary, not the gameplay unlock predicates. */
function receipts<T extends KboCareer|UsCareer>(source:T):T {
 const c=structuredClone(source),key=c.protagonistKey,traits=createCareerTraitLedger();
 traits.owned[key]={unlocked:['T02','T03','T13'],qualifiedRivalPitcherKeys:[]};
 const row={playerKey:key,worldDay:0,recordRevision:c.records.revision,seasonKey:c.world.seasonKey,leagueKey:'mode' in c?c.registration.level:'KBO'};
 traits.unlocks=[{...row,playerKey:'unrelated-player',traitId:'T02'},{...row,traitId:'T02',privateNote:'PRIVATE_SENTINEL'} as typeof traits.unlocks[number],{...row,traitId:'T13'},{...row,traitId:'T03'}];
 c.traits=traits;return c;
}

test('pro E85 summary returns only own general receipt allowlist; read and caller mutation preserve the root',()=>{
 for(const source of [receipts(enteredKboCareer()),receipts(preparedUsCareer())]){
  const before=canonicalJson(source),summary=unreadProTraitSummary(source);
  assert.deepEqual(summary.map(r=>r.traitId),['T02','T03']);
  assert.doesNotMatch(JSON.stringify(summary),/T13|unrelated-player|PRIVATE_SENTINEL|potential|seed|rng/);
  assert.deepEqual(Object.keys(summary[0]!).sort(),['leagueKey','playerKey','recordRevision','seasonKey','traitId','worldDay']);
  summary[0]!.worldDay=999;
  assert.equal(canonicalJson(source),before);
 }
});

test('pro E85 ACK has root CAS, persists one cursor and preserves closed histories, gameplay and hidden notice eligibility',()=>{
 for(const source of [receipts(enteredKboCareer()),receipts(preparedUsCareer())]){
  const before=canonicalJson(source),restored=JSON.parse(JSON.stringify(source)) as typeof source;
  assert.throws(()=>acknowledgeProTraitSummary(source,source.revision-1),/REVISION/);
  const next=acknowledgeProTraitSummary(source,source.revision),replayed=acknowledgeProTraitSummary(restored,restored.revision);
  assert.equal(canonicalJson(next),canonicalJson(replayed));assert.equal(canonicalJson(source),before);
  assert.equal(next.revision,source.revision+1);assert.equal(next.traits!.summaryCursor,4);assert.deepEqual(unreadProTraitSummary(next),[]);
  assert.equal(acknowledgeProTraitSummary(next,next.revision),next);
  for(const field of ['world','records','health','seasonGrowth','development','events','amateurHistory','phaseContext'] as const)assert.equal(next[field],source[field],field);
  assert.deepEqual(next.traits!.owned,source.traits!.owned);assert.equal(next.traits!.unlocks,source.traits!.unlocks);
  assert.equal(next.events.some(e=>e.definitionId==='E85'),false);
  if('mode' in next)assertUsCareerRevision(next,next.revision);
 }
});

test('pro E85 rejects forged cursor, ownership, future record evidence and mismatched registration',()=>{
 const source=receipts(enteredKboCareer());
 for(const cursor of [-1,1.5,5])assert.throws(()=>unreadProTraitSummary({...source,traits:{...source.traits!,summaryCursor:cursor}}),/TRAIT_SUMMARY/);
 const future=structuredClone(source);future.traits!.unlocks=future.traits!.unlocks.map(r=>r.playerKey===source.protagonistKey?{...r,recordRevision:source.records.revision+1}:r);assert.throws(()=>unreadProTraitSummary(future),/TRAIT_SUMMARY/);
 const ownership=structuredClone(source);ownership.traits!.owned[source.protagonistKey]!.unlocked=['T03','T13'];assert.throws(()=>unreadProTraitSummary(ownership),/TRAIT_LEDGER/);
 const nullOwnership=structuredClone(source);Object.assign(nullOwnership.traits!.owned,{[source.protagonistKey]:null});assert.throws(()=>unreadProTraitSummary(nullOwnership),/TRAIT_LEDGER/);
 assert.throws(()=>unreadProTraitSummary({...source,registration:{...source.registration,playerKey:'foreign'}}),/TRAIT_SUMMARY/);
});

test('pro E85 ACK preserves sealed US season, salary and next-year readiness at actual closed-owner boundary',()=>{
 const source=receipts(closedUsOptionCareer('HITTER')),ready=usYearTransitionReadiness(source),before=canonicalJson(source);
 const next=acknowledgeProTraitSummary(source,source.revision);
 assert.deepEqual(usYearTransitionReadiness(next),ready);assert.equal(canonicalJson(source),before);
 for(const field of ['season','postseason','minorYears','contract','inventory','income','seasonGrowth','amateurHistory'] as const)assert.equal(next[field],source[field],field);
});

test('pro E85 ACK keeps the active retry preparation mirror valid without advancing preparation or old world seals',()=>{
 let c=retryNoOfferPrefix();c=openKboUncontractedRetry(c,c.revision);c=reviewKboUncontractedRoutes(c,c.revision,1);
 c=startKboRetryPreparation(c,c.revision,{routePreviewId:kboRetryRoutesView(c).routePreviewId});
 c=receipts(c);assert.ok(c.traits);c.preparationSeason={...c.preparationSeason!,traits:c.traits};assertKboRetryState(c);
 const before=canonicalJson(c),next=acknowledgeProTraitSummary(c,c.revision);
 assertKboRetryState(next);assert.equal(canonicalJson(c),before);assert.equal(next.preparationSeason!.traits,next.traits);
 assert.equal(next.preparationSeason!.revision,c.preparationSeason!.revision);assert.equal(next.preparationSeason!.retry,c.preparationSeason!.retry);assert.equal(next.world,c.world);
});

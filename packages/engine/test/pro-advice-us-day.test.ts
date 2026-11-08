import test from 'node:test';
import assert from 'node:assert/strict';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {closeControlledServiceDates} from './us-service-fixture.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason} from '../src/us-military-plan.js';
import {startUsMilitaryWorld,advanceUsMilitaryWorld} from '../src/us-season.js';
import {refreshProCareerAdvice} from '../src/pro-career-advice.js';
import {canonicalJson} from '../src/game.js';
import {canonicalSeal} from '../src/canonical-seal.js';
import type {UsCareer} from '../src/us-career-entry.js';
let cached:{prefix:UsCareer;off:number}|undefined;
function beforeRest(){
 if(!cached){const c=finishedUsCareerFixture();c.world.players[c.protagonistKey]!.age=27;const chosen=chooseUsMilitaryPlan(c,c.revision,'TERMINATE'),year=startUsMilitaryServiceSeason(chosen,chosen.revision),live=startUsMilitaryWorld(year,year.revision),games=Object.values(live.seasonSchedule!.leagues).flat(),scheduled=new Set(games.map(g=>g.worldDay)),off=Array.from({length:15},(_,i)=>live.season!.firstDay+i).find(d=>!scheduled.has(d))!;assert.ok(Number.isSafeInteger(off));
 // Controlled prior games/dates isolate one actual native rest-day close, not a native full service season.
 cached={prefix:closeControlledServiceDates(live,off-1),off};}return {prefix:structuredClone(cached.prefix),off:cached.off};
}
function closedRest(){const {prefix,off}=beforeRest();return {career:advanceUsMilitaryWorld(prefix,prefix.revision,1).career,off};}

test('US military worker closes an actual rest date without health rows and refreshes advice once across JSON resume',()=>{
 const {prefix,off}=beforeRest(),before=canonicalJson(prefix),result=advanceUsMilitaryWorld(prefix,prefix.revision,1),next=result.career;assert.equal(result.stopReason,'DAY_CLOSED');assert.equal(next.season!.days.at(-1)!.day,off);assert.equal(next.season!.days.at(-1)!.evidence,'[]');assert.ok(!next.health.games.some(h=>h.evidence.day===off&&h.evidence.seasonKey===next.world.seasonKey));assert.equal(canonicalJson(prefix),before);assert.equal(canonicalJson(advanceUsMilitaryWorld(JSON.parse(before),prefix.revision,1)),canonicalJson(result));const frozen=canonicalJson(next);assert.equal(canonicalJson(refreshProCareerAdvice(next,off)),frozen);assert.equal(canonicalJson(next),frozen);assert.equal(next.season!.paidUsd,0);assert.equal(next.military.status,'TERMINATED_SERVICE');
});

test('US advice refuses missing rest-day closure and future unclosed dates',()=>{
 const {career:c,off}=closedRest();const missing=structuredClone(c);missing.season!.days=missing.season!.days.filter(d=>d.day!==off);assert.throws(()=>refreshProCareerAdvice(missing,off),/ADVICE_DAY_NOT_CLOSED/);assert.throws(()=>refreshProCareerAdvice(c,off+1),/ADVICE_DAY_NOT_CLOSED/);
});
test('US advice accepts the sealed empty rest day while rejecting a forged seal',()=>{
 const {career:c,off}=closedRest(),sealed=structuredClone(c);sealed.season!.days.find(d=>d.day===off)!.evidence=canonicalSeal([]);
 assert.doesNotThrow(()=>refreshProCareerAdvice(sealed,off));sealed.season!.days.find(d=>d.day===off)!.evidence='sha256:'+'0'.repeat(64);
 assert.throws(()=>refreshProCareerAdvice(sealed,off),/ADVICE_DAY_NOT_CLOSED/);
});

test('US advice does not accept a date alone when its rest receipt or owning season is corrupted',()=>{
 const {career:c,off}=closedRest();for(const mutate of [(x:UsCareer)=>{x.season!.days.find(d=>d.day===off)!.evidence='changed';},(x:UsCareer)=>{x.seasonSchedule!.seasonKey='1900';},(x:UsCareer)=>{x.season!.receiptKey='foreign';},(x:UsCareer)=>{x.season!.days.push(structuredClone(x.season!.days.find(d=>d.day===off)!));},(x:UsCareer)=>{x.season!.lastDay=off-1;}]){const bad=structuredClone(c);mutate(bad);const before=canonicalJson(bad);assert.throws(()=>refreshProCareerAdvice(bad,off),/ADVICE_DAY_NOT_CLOSED/);assert.equal(canonicalJson(bad),before);}
});

test('US advice cannot use an empty receipt to close a scheduled competition date without game health evidence',()=>{
 const {prefix:c}=beforeRest(),day=c.season!.firstDay;assert.ok(Object.values(c.seasonSchedule!.leagues).some(games=>games.some(g=>g.worldDay===day)));c.health.games=c.health.games.filter(h=>h.evidence.day!==day||h.evidence.seasonKey!==c.world.seasonKey);c.season!.days.find(d=>d.day===day)!.evidence='[]';assert.throws(()=>refreshProCareerAdvice(c,day),/ADVICE_DAY_NOT_CLOSED/);
});

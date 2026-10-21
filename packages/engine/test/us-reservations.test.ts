import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {prepareUsDirect,decideUsDirect} from '../src/us-direct.js';
import type {UsRecruitmentWorld} from '../src/us-direct.js';
import {createUsReservationLedger,assertUsReservationLedger,reserveUsDirectSigning} from '../src/us-reservations.js';
import {canonicalJson} from '../src/game.js';
const world=():UsRecruitmentWorld=>({schemaVersion:1,worldKey:'reservation-world',seasonKey:'2030',seed:'reservation-seed',registeredPlayerKeys:[],clubs:[{id:'US01',name:'가상 조직',rookieSlots:2,aSlots:2,availableBudgetUsd:10_000_000,nationalReleaseAllowed:true,militaryReturnOption:false}]});
function signed(w:UsRecruitmentWorld,key='own'){
 const p=createCareerPlayer({simulationKey:key,name:'예약선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'SECRET_CHEAT'},seedPcg32(42n,54n)).player;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,900_000]));p.careerPeaks={...p.abilities};
 const program=prepareUsDirect(w,{assessmentKey:'us-'+key,player:p,adjustedPerformance:90,ranges:Object.fromEntries(abilityKeys(p.kind).map(k=>[k,{lowUnits:1_000_000,highUnits:1_000_000}])),eligible:true,issuedWorldDay:180,expiresWorldDay:210});return decideUsDirect(w,program,1,190,{type:'SIGN',offerKey:program.offers[0]!.offerKey});
}
test('US reservation deducts one real level slot and bonus+first-year salary; identical receipt retries preserve totals',()=>{
 const w=world(),ledger=createUsReservationLedger(w),p=signed(w),before=canonicalJson({ledger,p}),applied=reserveUsDirectSigning(ledger,p),club=applied.currentWorld.clubs[0]!;
 assert.equal(club.aSlots,1);assert.equal(club.rookieSlots,2);assert.equal(club.availableBudgetUsd,10_000_000-p.signing!.offer.signingBonusUsd-30_000);assert.deepEqual(applied.currentWorld.registeredPlayerKeys,['own']);assert.equal(applied.entries.length,1);assert.equal(canonicalJson({ledger,p}),before);
 assert.deepEqual(reserveUsDirectSigning(applied,p),applied);assert.deepEqual(reserveUsDirectSigning(JSON.parse(JSON.stringify(applied)),JSON.parse(JSON.stringify(p))),applied);assertUsReservationLedger(applied);
});
test('US reservation supports sequential candidates from current inventory and rejects stale competing snapshots atomically',()=>{
 const w=world(),first=reserveUsDirectSigning(createUsReservationLedger(w),signed(w)),before=canonicalJson(first);assert.throws(()=>reserveUsDirectSigning(first,signed(w,'stale')),/STALE/);assert.equal(canonicalJson(first),before);
 const second=reserveUsDirectSigning(first,signed(first.currentWorld,'second'));assert.equal(second.currentWorld.clubs[0]!.aSlots,0);assert.deepEqual(second.currentWorld.registeredPlayerKeys,['own','second']);assert.equal(second.entries.length,2);assertUsReservationLedger(second);
});
test('US reservation detects changed totals/duplicated receipts/rewritten receipt and rejects invalid inventory',()=>{
 const w=world(),p=signed(w),first=reserveUsDirectSigning(createUsReservationLedger(w),p),bad=structuredClone(first);bad.currentWorld.clubs[0]!.availableBudgetUsd++;assert.throws(()=>assertUsReservationLedger(bad),/TOTAL/);
 const repeated=structuredClone(first);repeated.entries=[...repeated.entries,repeated.entries[0]!];assert.throws(()=>assertUsReservationLedger(repeated),/RECEIPT/);
 const changed=structuredClone(p);changed.signing!.income.amount++;assert.throws(()=>reserveUsDirectSigning(first,changed),/REUSED/);
 const invalid=world();invalid.clubs[0]!.aSlots=-1;assert.throws(()=>createUsReservationLedger(invalid));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {prepareUsDirect,assertUsDirect,usDirectView,decideUsDirect} from '../src/us-direct.js';
import type {UsRecruitmentWorld,UsDirectInput} from '../src/us-direct.js';
import {canonicalJson} from '../src/game.js';
const world=():UsRecruitmentWorld=>({schemaVersion:1,worldKey:'us-test',seasonKey:'2030',seed:'us-seed',registeredPlayerKeys:[],clubs:Array.from({length:5},(_,i)=>({id:'U'+i,name:'가상 조직'+i,rookieSlots:1,aSlots:1,availableBudgetUsd:3_000_000,nationalReleaseAllowed:i%2===0,militaryReturnOption:i%2!==0}))});
function input(score=80):UsDirectInput {
 const p=createCareerPlayer({simulationKey:'own',name:'미국선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'GROWTH'},seedPcg32(42n,54n)).player;
 p.abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,score*10000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};
 return {assessmentKey:'us-assessment',player:p,adjustedPerformance:score,ranges:Object.fromEntries(abilityKeys('HITTER').map(k=>[k,{lowUnits:score*10000,highUnits:score*10000}])),eligible:true,issuedWorldDay:150,expiresWorldDay:180};
}
test('US offers: fixed snapshot, distinct max3 clubs, minor A/Rookie, canonical USD terms and no mutation',()=>{
 const w=world(),i=input(),before=canonicalJson({w,i}),p=prepareUsDirect(w,i);assertUsDirect(w,JSON.parse(JSON.stringify(p)));
 assert.deepEqual(prepareUsDirect(w,i),p);assert.equal(new Set(p.offers.map(o=>o.clubId)).size,3);assert.equal(p.offers.length,3);
 for(const o of p.offers){assert.equal(o.initialLevel,'A');assert.equal(o.annualSalaryUsd,30_000);assert.equal(o.controlSeasons,6);assert.equal(o.firstTeamGuaranteed,false);assert.equal(o.type,'US_MINOR');assert.equal(o.currency,'USD');assert.ok(o.signingBonusUsd>=50_000 && o.signingBonusUsd<=2_000_000);}
 assert.equal(canonicalJson({w,i}),before);assert.deepEqual(usDirectView(w,p,150),usDirectView(w,p,150));
 const publicView=usDirectView(w,p,150);assert.deepEqual(Object.keys(publicView).sort(),['assessmentKey','expiresWorldDay','offers','reasonCode','status','version','visible']);assert.ok(!JSON.stringify(publicView).match(/potential|rng|seed|sourceBasis/i));
});
test('US offers: average evaluation, no roster slot, no budget or ineligible produces no visible US choice',()=>{
 for(const [w,i] of [[world(),input(50)],[{...world(),clubs:world().clubs.map(c=>({...c,aSlots:0,rookieSlots:0}))},input()],[{...world(),clubs:world().clubs.map(c=>({...c,availableBudgetUsd:1}))},input()],[world(),{...input(),eligible:false}]] as const){const p=prepareUsDirect(w,i);assert.equal(p.offers.length,0);assert.equal(usDirectView(w,p,150).visible,false);assert.throws(()=>decideUsDirect(w,p,1,150,{type:'SIGN',offerKey:'missing'}));}
});
test('US offers: boundary expiry, stale world/offer/version and player registration reject atomically',()=>{
 const w=world(),p=prepareUsDirect(w,input()),key=p.offers[0]!.offerKey,before=canonicalJson({w,p});
 assert.equal(usDirectView(w,p,179).visible,true);assert.equal(usDirectView(w,p,180).visible,false);assert.equal(usDirectView(w,p,180).status,'EXPIRED');
 for(const d of [NaN,149,180])assert.throws(()=>decideUsDirect(w,p,1,d,{type:'SIGN',offerKey:key}));
 assert.throws(()=>decideUsDirect(w,p,0,150,{type:'SIGN',offerKey:key}),/VERSION/);
 const changed=structuredClone(w);changed.clubs[0]!.availableBudgetUsd--;assert.throws(()=>decideUsDirect(changed,p,1,150,{type:'SIGN',offerKey:key}),/STALE/);
 const forged=structuredClone(p);forged.offers[0]!.signingBonusUsd=0;assert.throws(()=>assertUsDirect(w,forged));assert.throws(()=>prepareUsDirect({...w,registeredPlayerKeys:['own']},input()));
 assert.throws(()=>prepareUsDirect(w,{...input(),expiresWorldDay:150}));assert.equal(canonicalJson({w,p}),before);
});
test('US signing: one contract/rights/registration/income reservation, no duplicate payout or world mutation',()=>{
 const w=world(),p=prepareUsDirect(w,input()),before=canonicalJson({w,p}),signed=decideUsDirect(w,p,1,150,{type:'SIGN',offerKey:p.offers[0]!.offerKey}),s=signed.signing!;
 assert.equal(s.contract.status,'RESERVED');assert.equal(s.registration.status,'PENDING_SEASON_ACTIVATION');assert.equal(s.income.amount,s.offer.signingBonusUsd);assert.equal(s.availableBudgetAfterUsd,s.availableBudgetBeforeUsd-s.offer.signingBonusUsd-30_000);assert.equal(s.rights.territory,'US');assert.equal(usDirectView(w,signed,150).visible,false);assert.equal(usDirectView(w,signed,150).status,'SIGNED');assertUsDirect(w,JSON.parse(JSON.stringify(signed)));
 assert.throws(()=>decideUsDirect(w,signed,2,150,{type:'SIGN',offerKey:p.offers[0]!.offerKey}));assert.equal(canonicalJson({w,p}),before);
 const declined=decideUsDirect(w,p,1,180,{type:'DECLINE'});assert.equal(declined.signing,null);assert.equal(usDirectView(w,declined,180).status,'DECLINED');
});

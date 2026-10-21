import test from 'node:test';
import assert from 'node:assert/strict';
import {recruitmentOfferScore,recruitmentDistribution,resolveRecruitmentOffers} from '../src/recruitment.js';
import {createWorldStream} from '../src/rng.js';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-12);
test('40 OF01: one score.60 offer is50%, tied teams each1/3; third-round outside remains1/3',()=>{
 const offer={offerKey:'club1',score:.6};near(recruitmentDistribution([offer],1).offers[0]!.probability,.5);const tied=recruitmentDistribution([offer,{...offer,offerKey:'club2'}],2);near(tied.offers[0]!.probability,1/3);near(tied.offers[1]!.probability,1/3);near(tied.outside,1/3);const last=recruitmentDistribution([offer],3);near(last.offers[0]!.probability,2/3);near(last.outside,1/3);
});
test('40 score uses guaranteed money/actual role/fixed preference, with money capped at1.5×desired',()=>{
 near(recruitmentOfferScore({totalWon:150_000_000,desiredTotalWon:100_000_000,role:1,preference:1}),1);near(recruitmentOfferScore({totalWon:300_000_000,desiredTotalWon:100_000_000,role:1,preference:1}),1);near(recruitmentOfferScore({totalWon:90_000_000,desiredTotalWon:100_000_000,role:.5,preference:.2}),.7*.6+.2*.5+.1*.2);
});
test('OF02/03 sum1, no input-order effects; better own pay increases own chance and a competing offer reduces it',()=>{
 const score=(totalWon:number)=>recruitmentOfferScore({totalWon,desiredTotalWon:100_000_000,role:.8,preference:.5}),a={offerKey:'a',score:score(100_000_000)},b={offerKey:'b',score:.6};const d=recruitmentDistribution([a,b],1);near(d.outside+d.offers.reduce((n,o)=>n+o.probability,0),1);assert.deepEqual(recruitmentDistribution([b,a],1),d);assert.ok(d.offers[0]!.probability<recruitmentDistribution([a],1).offers[0]!.probability);assert.ok(recruitmentDistribution([{...a,score:score(120_000_000)},b],1).offers[0]!.probability>d.offers[0]!.probability);
});
test('OF04: one eligible club cheat takes1, no team/outside chance remains; two cheats reject',()=>{
 const offers=[{offerKey:'ordinary',score:1},{offerKey:'owned',score:0,cheat:true}],d=recruitmentDistribution(offers,3);assert.deepEqual(d,{offers:[{offerKey:'ordinary',probability:0},{offerKey:'owned',probability:1}],outside:0});assert.equal(resolveRecruitmentOffers(offers,3,createWorldStream('seed','offer','roster')).offerKey,'owned');assert.throws(()=>recruitmentDistribution(offers.map(o=>({...o,cheat:true})),1));
});
test('fixed round snapshot and RNG survives JSON and ordering; outside is a real result, empty offers consume0 draws',()=>{
 const rng=createWorldStream('market','player-round','roster'),before=JSON.stringify(rng),offers=[{offerKey:'b',score:.6},{offerKey:'a',score:.6}],one=resolveRecruitmentOffers(offers,1,rng),restored=resolveRecruitmentOffers(JSON.parse(JSON.stringify(offers)),1,JSON.parse(before));assert.deepEqual(restored,one);assert.deepEqual(resolveRecruitmentOffers([...offers].reverse(),1,rng),one);assert.equal(JSON.stringify(rng),before);assert.deepEqual(resolveRecruitmentOffers([],3,rng),{offerKey:null,distribution:{offers:[],outside:1},state:rng});let outside=0;for(let i=0;i<40;i++)if(resolveRecruitmentOffers([{offerKey:'low',score:0}],3,createWorldStream('market',String(i),'roster')).offerKey===null)outside++;assert.ok(outside>0);
});
test('bad/duplicate candidates, invalid rounds, nonfinite scores/money/roles reject',()=>{
 assert.throws(()=>recruitmentDistribution([{offerKey:'same',score:.6},{offerKey:'same',score:.7}],1));assert.throws(()=>recruitmentDistribution([{offerKey:'x',score:NaN}],1));assert.throws(()=>recruitmentDistribution([{offerKey:'x',score:1.01}],1));assert.throws(()=>recruitmentDistribution([],4 as never));for(const input of [{totalWon:0,desiredTotalWon:10,role:.5,preference:.5},{totalWon:10,desiredTotalWon:Infinity,role:.5,preference:.5},{totalWon:10,desiredTotalWon:10,role:1.1,preference:.5}])assert.throws(()=>recruitmentOfferScore(input));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {prepareKboAiRenewals} from '../src/kbo-ai-offseason.js';
import {runKboAiFreeAgentMarket} from '../src/kbo-fa-market.js';
import {kboClubBalance,kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {recruitmentDistribution} from '../src/recruitment.js';
import {canonicalJson} from '../src/game.js';
const fixture=()=>{const s=stagedKboOffseason(),p=prepareKboAiRenewals(s);return {world:p.world,pool:p.pool,reports:p.reports,health:p.health,records:s.records,sourceSeasonKey:s.sourceSeasonKey,difficulty:'GROWTH' as const};};

test('AI fixes all offers before player-ID draws; each player signs once, costs/slots obey all-success reservations and rounds replay exactly',()=>{
 const input=fixture(),before=canonicalJson(input),n=runKboAiFreeAgentMarket(input);assert.equal(canonicalJson(input),before);assert.deepEqual(runKboAiFreeAgentMarket(JSON.parse(JSON.stringify(input))),n);assert.equal(n.rounds.length,3);const signed=new Set<string>(),ledger=structuredClone(input.world);
 for(const r of n.rounds){
  for(const club of ledger.clubs){const offers=r.offers.filter(o=>o.clubId===club.id);assert.ok(offers.length<=3);assert.equal(new Set(offers.map(o=>o.playerKey)).size,offers.length);assert.ok(club.roster.length+offers.length<=60);assert.ok(offers.reduce((n,o)=>n+o.annualSalaryWon,0)<=kboClubBalance(ledger,club.id).availableWon);for(let y=1;y<=3;y++)assert.ok(kboFutureCommitmentWon(ledger,club.id,y)+offers.reduce((n,o)=>n+(o.years>y?o.annualSalaryWon:0),0)<=club.budgetWon*.9);}
  for(const outcome of r.outcomes){const offers=r.offers.filter(o=>o.playerKey===outcome.playerKey),d=recruitmentDistribution(offers,r.round);assert.deepEqual(outcome.chances,d.offers);assert.equal(outcome.outside,d.outside);assert.ok(Math.abs(d.outside+d.offers.reduce((n,o)=>n+o.probability,0)-1)<1e-12);
   if(outcome.offerKey===null){if(r.round===3)assert.ok(n.pool.players[outcome.playerKey]);continue;}
   assert.equal(signed.has(outcome.playerKey),false);signed.add(outcome.playerKey);const o=offers.find(o=>o.offerKey===outcome.offerKey)!,c=ledger.clubs.find(c=>c.id===o.clubId)!;c.roster.push(o.playerKey);c.reservedSalaryWon+=o.annualSalaryWon;ledger.contracts[o.playerKey]=n.world.contracts[o.playerKey]!;assert.equal(n.world.contracts[o.playerKey]!.contractKey,o.offerKey);assert.equal(n.world.contracts[o.playerKey]!.years,o.years);assert.equal(n.world.contracts[o.playerKey]!.annualSalaryWon,o.annualSalaryWon);assert.equal(Object.hasOwn(n.pool.players,o.playerKey),false);
  }
  assert.deepEqual(r.releasedOfferKeys,r.offers.filter(o=>!r.outcomes.some(w=>w.offerKey===o.offerKey)).map(o=>o.offerKey));
 }
 assert.ok(signed.size>0);assert.equal(Object.keys(n.world.players).length,Object.keys(input.world.players).length+signed.size);assert.ok(Object.keys(n.pool.players).length>=80);assertKboRecruitmentWorld(n.world);
 for(const c of n.world.clubs){const l=ledger.clubs.find(l=>l.id===c.id)!;assert.deepEqual([...l.roster].sort(),c.roster);assert.equal(l.reservedSalaryWon,c.reservedSalaryWon);}
});

test('personal career cheat does not turn AI club bids into100% wins or NPC potential100',()=>{
 const input=fixture(),normal=runKboAiFreeAgentMarket(input),cheat=runKboAiFreeAgentMarket({...input,difficulty:'SECRET_CHEAT'});assert.deepEqual(cheat,normal);assert.ok(normal.rounds.flatMap(r=>r.outcomes).every(o=>o.outside>0));assert.ok(Object.values(cheat.pool.players).some(e=>Object.values(e.player.potential).some(v=>v<1_000_000)));
});

test('an injured free agent keeps the same remaining games when signing; no market day heals or creates a medical receipt',()=>{
 const input=fixture(),key=Object.keys(input.pool.players)[0]!,entry=input.pool.players[key]!;
 // Controlled veteran star guarantees candidate ranking; production independent supply stays35..50.
 const values=Object.fromEntries(abilityKeys(entry.player.kind).map(k=>[k,1_000_000]));entry.player={...entry.player,abilities:values,potential:{...values},careerPeaks:{...values}};entry.injury={severity:'MEDIUM',remainingTeamGames:8,diagnosedGameKey:'controlled-prior-injury',seasonKey:'2030'};
 const n=runKboAiFreeAgentMarket(input),won=n.rounds.flatMap(r=>r.outcomes).find(o=>o.playerKey===key && o.offerKey!==null);assert.ok(won);assert.equal(n.health.injuries[key]!.remainingTeamGames,8);assert.deepEqual(n.health.games,input.health.games);assert.equal(Object.hasOwn(n.pool.players,key),false);assert.equal(n.world.players[key]!.age,entry.player.age);assert.deepEqual(n.world.players[key]!.abilities,entry.player.abilities);
});

test('wrong season/registered FA/closed pool rejects; no partial contracts or paid medical days',()=>{
 const input=fixture(),before=canonicalJson(input);assert.throws(()=>runKboAiFreeAgentMarket({...input,sourceSeasonKey:'2029'}));const bad=structuredClone(input),key=Object.keys(bad.world.players)[0]!;bad.pool.players[key]={player:bad.world.players[key]!,origin:'INDEPENDENT',enteredSeasonKey:'2031',previousClubId:null,previousContract:null};assert.throws(()=>runKboAiFreeAgentMarket(bad));assert.equal(canonicalJson(input),before);
});

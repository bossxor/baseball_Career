import {PITCH_IDS} from '@playball/rules';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {kboRetirementArchiveView} from '../src/kbo-archive-view.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';

/** Controlled frozen root for projection boundaries; actual E36/E37 is exercised in the postseason integration test. */
function archived(kind:'HITTER'|'PITCHER'='HITTER'){
 const s=enteredKboCareer(kind),key=s.protagonistKey;s.phaseContext={phase:'ARCHIVED'};s.retirement={receiptKey:'controlled-retirement',reason:'VOLUNTARY',seasonKey:s.world.seasonKey,age:s.world.players[key]!.age,clubId:s.protagonistClubId,remainingContractYears:0,sourceRevision:s.revision};s.records.games={};return s;
}
test('zero-first-team career archives actual identity/six peaks and zero rates without exposing hidden state or creating a player copy',()=>{
 const s=archived(),before=canonicalJson(s),v=kboRetirementArchiveView(s);assert.equal(v.player.abilities.length,6);assert.ok(v.player.overall<=100 && v.player.careerPeakAbilityAverage<=100);assert.equal(v.retirement.reason,'VOLUNTARY');assert.equal(v.records.length,1);assert.equal(v.records[0]!.leagueKey,'KBO');assert.equal(v.records[0]!.record.games,0);assert.equal((v.records[0]!.record as {rates:{AVG:number|null}}).rates.AVG,null);assert.equal(canonicalJson(s),before);assert.deepEqual(kboRetirementArchiveView(JSON.parse(before)),v);assert.doesNotMatch(JSON.stringify(v),/potential|careerPeaks|sourceRevision|amateurHistory|sourceBasis|rng|seed|ledger|contractKey/i);assert.equal(s.world.players[s.protagonistKey]!.age,v.retirement.age);
});
test('KBO, Futures and postseason totals stay distinct, with rates from summed raw numerators rather than averaged seasons',()=>{
 const s=archived(),key=s.protagonistKey;
 for(const [i,leagueKey,phase,AB,H,TB] of [[0,'KBO','REGULAR',2,1,2],[1,'KBO','REGULAR',8,1,4],[2,'FUTURES','REGULAR',2,2,8],[3,'KBO','POSTSEASON',2,2,2]] as const){
  const gameKey='archive-record-'+i,totals={...emptyBatting(),PA:AB,AB,H,TB,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
  const split={PA:AB,AB,H,BB:0,HBP:0,K:0,TB,HR:0,twoB:0,threeB:0,RBI:0},zero={...split,PA:0,AB:0,H:0,TB:0};
  s.records.games[gameKey]={gameKey,worldDay:i+1,scope:{seasonKey:String(2029+i%2),leagueKey,phase},teams:{},batting:{[key]:totals},pitching:{},batterSplits:{[key]:{L:zero,R:split}},pitcherSplits:{},matchups:{}};
 }
 const v=kboRetirementArchiveView(s),regular=v.records.find(r=>r.leagueKey==='KBO' && r.phase==='REGULAR')!.record;assert.equal(regular.kind,'HITTER');if(regular.kind!=='HITTER')return;assert.equal(regular.AB,10);assert.equal(regular.rates.AVG,.2);assert.equal(regular.rates.SLG,.6);assert.equal(v.records.find(r=>r.leagueKey==='FUTURES')!.record.games,1);assert.equal(v.records.find(r=>r.phase==='POSTSEASON')!.record.games,1);assert.equal(v.seasonRows.length,4);assert.equal(Object.hasOwn(v,'combinedRates'),false);
});
test('pitcher archive retains hand/form and active pitch mastery without exposing pitch XP or treating zero outs as ERA0',()=>{
 const s=archived('PITCHER'),book=s.world.repertoires[s.protagonistKey]!,inactive=PITCH_IDS.find(id=>!Object.hasOwn(book.book,id))!;book.book[inactive]=600_000;const before=canonicalJson(s),v=kboRetirementArchiveView(s);assert.deepEqual(v.player.pitches.find(p=>p.pitchId===inactive),{pitchId:inactive,active:false,weight:0,mastery:3});assert.equal(v.player.kind,'PITCHER');assert.ok(v.player.pitchForm);assert.ok(v.player.pitches.length>0);assert.equal(v.records[0]!.record.kind,'PITCHER');if(v.records[0]!.record.kind!=='PITCHER')return;assert.equal(v.records[0]!.record.innings,'0.0');assert.equal(v.records[0]!.record.rates.ERA,null);assert.equal(canonicalJson(s),before);assert.doesNotMatch(JSON.stringify(v),/baseSpent|usedWindows|learning|potential|ledger/i);const missing=structuredClone(s);delete missing.world.repertoires[missing.protagonistKey];assert.throws(()=>kboRetirementArchiveView(missing),/REPERTOIRE/);const bad=structuredClone(s);bad.world.repertoires[bad.protagonistKey]!.weights.P01=99;assert.throws(()=>kboRetirementArchiveView(bad),/ALLOCATION/);
});
test('live roots, foreign retirement club/year, mismatched age and future receipt cannot masquerade as a retired archive',()=>{
 const s=archived();for(const change of [(x:typeof s)=>{x.phaseContext={phase:'PRESEASON_SETUP'};},(x:typeof s)=>{delete x.retirement;},(x:typeof s)=>{x.retirement!.clubId='foreign';},(x:typeof s)=>{x.retirement!.seasonKey='2040';},(x:typeof s)=>{x.retirement!.reason='MAX_AGE';},(x:typeof s)=>{x.retirement!.age++;},(x:typeof s)=>{x.retirement!.sourceRevision=x.revision+1;}]){const bad=structuredClone(s);change(bad);const before=canonicalJson(bad);assert.throws(()=>kboRetirementArchiveView(bad),/KBO_ARCHIVE_NOT_AVAILABLE/);assert.equal(canonicalJson(bad),before);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {assertContributionSplits} from '../src/records.js';
import type {GameContribution} from '../src/records.js';
import {settleRelationshipDirectDuels,validateDirectDuelReceipts} from '../src/relationships.js';
import type {RelationshipLedger} from '../src/relationships.js';
import {refreshCareerTraits} from '../src/high-school-traits.js';

function fixture() {
 const world=createHighSchoolWorld({worldKey:'duel-world',seasonKey:'2032',seed:'duel-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
 const pitchers=Object.values(world.players).filter(p=>p.kind==='PITCHER').slice(0,2).map(p=>p.simulationKey);
 const relations=pitchers.map(otherPlayerKey=>{const normalPairKey=JSON.stringify(['me',otherPlayerKey].sort());return {relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,type:'RIVAL' as const,primaryPlayerKey:'me',otherPlayerKey,stage:'FORMED' as const,milestones:[{stage:'FORMED' as const,kind:'FORMATION' as const,evidenceKey:'formation:'+otherPlayerKey,worldDay:2}]};});
 const relationships:RelationshipLedger={schemaVersion:1,relations,formation:{rival:'FORMED',teammate:'NO_CANDIDATE'}};
 return {world,records:{revision:2,games:{before:contribution('before',1,pitchers[0]!,16,7),after:contribution('after',3,pitchers[0]!,4,2)}},relationships,pitchers};
}
/** Controlled official contributions with consistent hitter/pitcher splits; no simulated outcome is changed. */
function contribution(gameKey:string,worldDay:number,pitcherKey:string,PA:number,H:number):GameContribution {
 const stats={PA,AB:PA,H,BB:0,HBP:0,K:PA-H,TB:H,HR:0,twoB:0,threeB:0,RBI:0},zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 const pz={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
 const g:GameContribution={gameKey,worldDay,scope:{seasonKey:'2032',leagueKey:'KBO',phase:'REGULAR'},teams:{A:{games:1,W:0,L:0,T:1,R:0,RA:0},B:{games:1,W:0,L:0,T:1,R:0,RA:0}},
  batting:{me:{...emptyBatting(),...stats,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},
  pitching:{[pitcherKey]:{...emptyPitching(),BF:PA,H,K:PA-H,outs:PA-H,games:1,starts:1,starterOuts:PA-H,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},
  batterSplits:{me:{L:{...zero},R:{...stats}}},pitcherSplits:{[pitcherKey]:{L:{...pz},R:{...pz,BF:PA,AB:PA,H,TB:H,K:PA-H,outs:PA-H}}},matchups:{[JSON.stringify(['me',pitcherKey])]:{batterKey:'me',pitcherKey,stats}}};
 assertContributionSplits(g);return g;
}

test('107: actual post-formation direct duel is stored once, immutable and JSON resumable; preformation stats count toward T14',()=>{
 const source=fixture(),before=canonicalJson(source),relationships=settleRelationshipDirectDuels(source,'after')!;
 assert.equal(canonicalJson(source),before);assert.equal(relationships.directDuels!.length,1);
 assert.equal(relationships.directDuels![0]!.outcome,'WIN');assert.equal(relationships.directDuels![0]!.recordRevision,2);
 const settled={...source,relationships};validateDirectDuelReceipts(settled);
 assert.strictEqual(settleRelationshipDirectDuels(settled,'after'),relationships);
 assert.deepEqual(settleRelationshipDirectDuels(JSON.parse(JSON.stringify(settled)),'after'),relationships);
 const traits=refreshCareerTraits(settled,3,['KBO']);
 assert.ok(traits.owned.me!.unlocked.includes('T14'));assert.deepEqual(traits.owned.me!.qualifiedRivalPitcherKeys,[source.pitchers[0]]);
 assert.equal(traits.unlocks.filter(r=>r.traitId==='T14').length,1);
 assert.deepEqual(refreshCareerTraits({...settled,traits},3,['KBO']),traits);
});

test('107: no retroactive formation-game victory, absent contribution, same-kind or teammate win',()=>{
 const source=fixture();
 assert.deepEqual(settleRelationshipDirectDuels(source,'before'),source.relationships);
 assert.throws(()=>settleRelationshipDirectDuels(source,'missing'),/UNKNOWN_DUEL_GAME/);
 const sameDay=structuredClone(source);sameDay.relationships.relations[0]!.milestones[0]!.worldDay=3;
 assert.deepEqual(settleRelationshipDirectDuels(sameDay,'after'),sameDay.relationships);
 const teammate=structuredClone(source);teammate.relationships.relations[0]!.type='TEAMMATE';
 assert.deepEqual(settleRelationshipDirectDuels(teammate,'after'),teammate.relationships);
 const sameKind=structuredClone(source);sameKind.world.players[source.pitchers[0]!]!.kind='HITTER';
 assert.deepEqual(settleRelationshipDirectDuels(sameKind,'after'),sameKind.relationships);
 assert.equal(refreshCareerTraits(source,3,['KBO']).owned.me?.unlocked.includes('T14')??false,false);
});

test('107: scoped losses and no-decisions stay recorded, never become a T14 win',()=>{
 for(const [PA,H,outcome] of [[4,0,'LOSS'],[2,2,'NO_DECISION'],[4,1,'NO_DECISION']] as const){
  const source=fixture();source.records.games.after=contribution('after',3,source.pitchers[0]!,PA,H);
  const relationships=settleRelationshipDirectDuels(source,'after')!;
  assert.equal(relationships.directDuels![0]!.outcome,outcome);
  assert.equal(refreshCareerTraits({...source,relationships},3,['KBO']).owned.me?.unlocked.includes('T14')??false,false);
 }
 const source=fixture();source.records.games.after.scope.phase='POSTSEASON';
 const relationships=settleRelationshipDirectDuels(source,'after')!;
 assert.equal(relationships.directDuels![0]!.phase,'POSTSEASON');
 assert.equal(refreshCareerTraits({...source,relationships},3,['KBO']).owned.me?.unlocked.includes('T14')??false,false);
});

test('107: tampered pair, revision, outcome, impossible counts or duplicate receipt is rejected',()=>{
 const source=fixture(),relationships=settleRelationshipDirectDuels(source,'after')!;
 for(const mutate of [
  (s:typeof relationships)=>{s.directDuels![0]!.pitcherKey='ghost';},
  (s:typeof relationships)=>{s.directDuels![0]!.recordRevision=3;},
  (s:typeof relationships)=>{s.directDuels![0]!.outcome='LOSS';},
  (s:typeof relationships)=>{s.directDuels![0]!.PA=1;},
  (s:typeof relationships)=>{s.directDuels=[...s.directDuels!,s.directDuels![0]!];},
 ]){const changed=structuredClone(relationships);mutate(changed);assert.throws(()=>refreshCareerTraits({...source,relationships:changed},3,['KBO']),/INVALID_DIRECT_DUEL_RECEIPT/);}
});

test('107: corrected current stats stop new unlock evidence while stored duel and owned target survive',()=>{
 const source=fixture(),relationships=settleRelationshipDirectDuels(source,'after')!,traits=refreshCareerTraits({...source,relationships},3,['KBO']);
 const corrected={...source,relationships,records:{revision:3,games:{...source.records.games,after:contribution('after',3,source.pitchers[0]!,4,0)}}};
 validateDirectDuelReceipts(corrected);
 assert.deepEqual(settleRelationshipDirectDuels(corrected,'after'),relationships);
 assert.equal(refreshCareerTraits(corrected,4,['KBO']).owned.me?.unlocked.includes('T14')??false,false);
 assert.deepEqual(refreshCareerTraits({...corrected,traits},4,['KBO']).owned.me,traits.owned.me);
});

test('107: other competition and season WINs never substitute for regular KBO season evidence',()=>{
 for(const scope of [{seasonKey:'2032',leagueKey:'AAA',phase:'REGULAR' as const},{seasonKey:'2031',leagueKey:'KBO',phase:'REGULAR' as const}]){
  const source=fixture();source.records.games.after.scope=scope;
  const relationships=settleRelationshipDirectDuels(source,'after')!;
  assert.equal(refreshCareerTraits({...source,relationships},3,['KBO']).owned.me?.unlocked.includes('T14')??false,false);
 }
});

test('107: another qualified pitcher extends owned T14 targets without a second unlock receipt',()=>{
 const source=fixture(),firstRelations=settleRelationshipDirectDuels(source,'after')!,first=refreshCareerTraits({...source,relationships:firstRelations},3,['KBO']);
 const second=contribution('second',4,source.pitchers[1]!,20,9);
 const next={...source,records:{revision:3,games:{...source.records.games,second}},relationships:firstRelations,traits:first};
 next.relationships=settleRelationshipDirectDuels(next,'second')!;
 const traits=refreshCareerTraits(next,4,['KBO']);
 assert.deepEqual(traits.owned.me!.qualifiedRivalPitcherKeys,[...source.pitchers].sort());
 assert.equal(traits.unlocks.filter(r=>r.traitId==='T14').length,1);
});

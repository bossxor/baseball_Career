import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer,highSchoolGameContext} from '../src/high-school-progress.js';
import {refreshCareerTraits,validateCareerTraitLedger} from '../src/high-school-traits.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import type {GameContribution} from '../src/records.js';
import {assertContributionSplits} from '../src/records.js';
import type {RelationshipLedger} from '../src/relationships.js';

const fixture=()=>{
 let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'traits-world',seasonKey:'2032',seed:'traits-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return confirmCareerPreseason(state,2);
};
function oneGame(state:HighSchoolCareer):HighSchoolCareer {
 for(let i=0;i<50;i++){const r=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_GAME':undefined);state=r.career;if(r.stopReason!=='CHUNK_LIMIT')return state;}
 throw new Error('TEST_LIMIT');
}
/** Test-only evidence: raise one official HS regular line so the T02 threshold (BB30) is crossed. */
function withWalks(state:HighSchoolCareer,walks:number):HighSchoolCareer {
 const next=structuredClone(state),game=Object.values(next.records.games).find(g=>Object.hasOwn(g.batting,'my-hitter'))!;
 const line=game.batting['my-hitter']!;line.BB+=walks;line.PA+=walks;next.records.revision+=1;return next;
}

test('day close records the evaluated day and unlocks nothing without evidence',()=>{
 const state=oneGame(fixture());
 assert.equal(state.traits!.lastClosedDay,Math.max(...state.days.days.map(d=>d.day)));
 assert.deepEqual(state.traits!.unlocks,[]);
});

test('crossing BB30 unlocks T02 once with a receipt; replay and older days are no-ops',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1,evidence=withWalks(base,30),before=canonicalJson(evidence);
 const ledger=refreshCareerTraits(evidence,day);
 assert.deepEqual(ledger.owned['my-hitter']!.unlocked,['T02']);
 assert.deepEqual(ledger.unlocks.filter(u=>u.playerKey==='my-hitter').map(u=>[u.traitId,u.worldDay]),[['T02',day]]);
 assert.equal(canonicalJson(evidence),before);
 const replay=refreshCareerTraits({...evidence,traits:ledger},day);assert.equal(canonicalJson(replay),canonicalJson(ledger));
 const older=refreshCareerTraits({...evidence,traits:ledger},day-1);assert.equal(canonicalJson(older),canonicalJson(ledger));
 validateCareerTraitLedger(ledger,evidence.world.players);
});

test('owned traits survive a later correction and pitcher-only traits never reach a hitter',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1;
 const unlocked=refreshCareerTraits(withWalks(base,30),day);
 const corrected=refreshCareerTraits({...base,traits:unlocked},day+1);
 assert.deepEqual(corrected.owned['my-hitter']!.unlocked,['T02']);
 assert.ok(corrected.owned['my-hitter']!.unlocked.every(id=>['T01','T02','T03','T04','T05','T06','T13','T14'].includes(id)));
});

test('unlocked traits feed the next game context and the career keeps advancing',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1;
 const state={...base,traits:refreshCareerTraits(withWalks(base,30),day)};
 assert.deepEqual(highSchoolGameContext(state).traits['my-hitter']!.unlocked,['T02']);
 assert.equal(highSchoolGameContext(base).traits['my-hitter'],undefined);
 const next=oneGame(state);
 assert.deepEqual(next.traits!.owned['my-hitter']!.unlocked,['T02']);
 assert.ok(next.records.revision>state.records.revision);
});

test('T14 stays locked without a committed relationship WIN even with a rival and PA20/OPS .900',()=>{
 const base=fixture(),batterKey='my-hitter',pitcherKey=Object.values(base.world.players).find(p=>p.kind==='PITCHER')!.simulationKey;
 const stats={PA:20,AB:20,H:9,BB:0,HBP:0,K:11,TB:9,HR:0,twoB:0,threeB:0,RBI:0};
 const zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 const pitchZero={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
 const game:GameContribution={gameKey:'rival-no-win',worldDay:5,scope:{seasonKey:base.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},
  teams:{},batting:{[batterKey]:{...emptyBatting(),...stats,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},
  pitching:{[pitcherKey]:{...emptyPitching(),BF:20,H:9,K:11,outs:11,games:1,starts:1,starterOuts:11,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},
  batterSplits:{[batterKey]:{L:{...zero},R:{...stats}}},pitcherSplits:{[pitcherKey]:{L:{...pitchZero},R:{...pitchZero,BF:20,AB:20,H:9,TB:9,K:11,outs:11}}},
  matchups:{[JSON.stringify([batterKey,pitcherKey])]:{batterKey,pitcherKey,stats}}};
 assertContributionSplits(game);
 const normalPairKey=JSON.stringify([batterKey,pitcherKey].sort());
 const relationships:RelationshipLedger={schemaVersion:1,formation:{rival:'FORMED',teammate:'NO_CANDIDATE'},relations:[{
  relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,type:'RIVAL',primaryPlayerKey:batterKey,otherPlayerKey:pitcherKey,stage:'FORMED',
  milestones:[{stage:'FORMED',kind:'FORMATION',evidenceKey:'actual-pair-formation',worldDay:1}],
 }]};
 const source={...base,world:{...base.world,leagueKey:'KBO'},relationships,records:{revision:1,games:{[game.gameKey]:game}}},before=canonicalJson(source);
 const ledger=refreshCareerTraits(source,5,['KBO']);
 assert.equal(ledger.owned[batterKey]?.unlocked.includes('T14')??false,false);
 assert.deepEqual(ledger.owned[batterKey]?.qualifiedRivalPitcherKeys??[],[]);
 assert.equal(canonicalJson(source),before);
});

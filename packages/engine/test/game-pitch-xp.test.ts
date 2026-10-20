import assert from 'node:assert/strict';
import test from 'node:test';
import {createGame,runGameChunk,canonicalJson} from '../src/game.js';
import {createRepertoire,pitchMastery,beginPitchLearning} from '../src/repertoire.js';
import {validatePitchXpLedger} from '../src/pitch-xp.js';
import {softmax,matchupEffects} from '../src/probabilities.js';
import {BASE_PROBABILITIES,OUTCOMES} from '@playball/rules';
import {game,team} from './fixtures.js';
import type {GameInput,GamePitchDevelopment} from '../src/types.js';
const input=(numerator:5|6|15=5):GameInput=>{
 const source={...game('xp-fixture'),teams:[team('away',50,0),team('home',50,0)] as const,traitRulesVersion:1 as const};
 const players:GamePitchDevelopment['players']=Object.fromEntries(source.teams.flatMap(t=>t.pitchers.map(p=>[p.simulationKey,{repertoire:createRepertoire('P03','2027'),numerator}])));
 return {...source,pitchDevelopment:{seasonKey:'2027',players}};
};
test('57/90 game1.2: every PA supplies outs-based source exactly once, no phantom BF, JSON resume stable',()=>{
 const source=input(),before=canonicalJson(source),full=runGameChunk(createGame(source)).state;let resumed=createGame(source);
 while(resumed.status!=='FINAL')resumed=runGameChunk(JSON.parse(JSON.stringify(resumed)),{plateAppearances:1}).state;
 assert.equal(full.engineVersion,'1.2.0');assert.equal(canonicalJson(full),canonicalJson(resumed));assert.equal(canonicalJson(source),before);
 for(const [id,entry] of Object.entries(full.pitchDevelopment!.players)) {
   validatePitchXpLedger(entry.repertoire.ledger);assert.equal(entry.repertoire.ledger.entries.length,full.pitching[id]!.BF);
   for(const play of full.plays.filter(p=>p.pitcherKey===id)) {const xp=entry.repertoire.ledger.entries.find(e=>e.evidenceKey===JSON.stringify(['2027',source.simulationKey,id,play.cursor]))!;assert.equal(xp.candidateBaseUnits,Math.min(600,play.outsAdded*200));assert.equal(xp.pitchId,play.representativePitch);}
 }
 assert.equal(canonicalJson(runGameChunk(full).state),canonicalJson(full));
});
test('57: mastery crossing uses pre-PA grade now and the new grade starting next PA',()=>{
 const source=input();for(const t of source.teams)for(const p of t.pitchers){source.pitchDevelopment!.players[p.simulationKey]!.repertoire.book.P01=299_999;p.repertoire.find(e=>e.pitchId==='P01')!.mastery=1;}
 let state=createGame(source),verifiedAfterCrossing=false,verifiedCrossing=false;
 while(state.status!=='FINAL') {
   const before=state,next=runGameChunk(state,{plateAppearances:1}).state,play=next.plays[next.plays.length-1]!,pitcher=source.teams.flatMap(t=>t.pitchers).find(p=>p.simulationKey===play.pitcherKey)!;
   const book=before.pitchDevelopment!.players[pitcher.simulationKey]!.repertoire.book,grade=pitchMastery(book[play.representativePitch]!);
   const batter=source.teams.flatMap(t=>t.lineup).find(h=>h.simulationKey===play.batterKey)!,effect=matchupEffects(pitcher.pitchForm,play.representativePitch,grade,pitcher.throws,batter.bats,batter.approach,[]);
   const logits=Object.fromEntries(OUTCOMES.map(o=>[o,Math.log(BASE_PROBABILITIES[o])+effect.applied[o]])) as Record<(typeof OUTCOMES)[number],number>;
   assert.deepEqual(play.probabilities,softmax(logits));
   const afterBook=next.pitchDevelopment!.players[pitcher.simulationKey]!.repertoire.book;
   if(play.representativePitch==='P01' && grade===1 && pitchMastery(afterBook.P01!)===2)verifiedCrossing=true;
   if(play.representativePitch==='P01' && grade===2)verifiedAfterCrossing=true;
   state=next;
 }
 assert.equal(verifiedCrossing,true);assert.equal(verifiedAfterCrossing,true);
});
test('85: normal/hardNPC/cheat XP policies apply once and leave below-threshold game outcomes identical',()=>{
 const normal=runGameChunk(createGame(input(5))).state,hard=runGameChunk(createGame(input(6))).state,cheat=runGameChunk(createGame(input(15))).state;
 assert.deepEqual(normal.plays,hard.plays);assert.deepEqual(normal.plays,cheat.plays);
 for(const id of Object.keys(normal.pitchDevelopment!.players)) {const base=normal.pitchDevelopment!.players[id]!.repertoire.ledger;assert.equal(hard.pitchDevelopment!.players[id]!.repertoire.ledger.actualBudgetSpentUnits,base.actualBudgetSpentUnits*6/5);assert.equal(cheat.pitchDevelopment!.players[id]!.repertoire.ledger.actualBudgetSpentUnits,base.actualBudgetSpentUnits*3);}
});
test('90: learning reservation survives actual game, ledger corruption or initial mastery mismatch rejects',()=>{
 const source=input(15);for(const entry of Object.values(source.pitchDevelopment!.players))entry.repertoire=beginPitchLearning(entry.repertoire,'P04',true);
 const final=runGameChunk(createGame(source)).state;
 for(const entry of Object.values(final.pitchDevelopment!.players))assert.equal(entry.repertoire.ledger.baseReservedUnits,100_000);
 const bad=input();bad.pitchDevelopment!.players['home-p0']!.repertoire.ledger.actualBudgetSpentUnits=1;assert.throws(()=>createGame(bad),/XP_LEDGER_TOTAL_MISMATCH/);
 const mismatch=input();mismatch.teams[0].pitchers[0]!.repertoire[0]!.mastery=5;assert.throws(()=>createGame(mismatch),/PITCH_SNAPSHOT_MISMATCH/);
 const missing=createGame(input());delete missing.pitchDevelopment;assert.throws(()=>runGameChunk(missing),/MISSING_PITCH_DEVELOPMENT_STATE/);
});

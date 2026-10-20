import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer,resolveCareerWindowEvent} from '../src/high-school-progress.js';
import {previewCareerTraining,trainHighSchoolCareer,changeMidseasonCareerArchetype} from '../src/high-school-training.js';
import {canonicalJson} from '../src/game.js';
const fixture=()=>{let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'training-world',seasonKey:'2032',seed:'training-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return confirmCareerPreseason(state,2);};
function nextWindow(input:HighSchoolCareer){let state=input;for(let i=0;i<200;i++){const result=advanceHighSchoolCareer(state,state.revision);state=result.career;if(state.phaseContext.phase==='EVENT_DECISION')return state;}throw new Error('TEST_NO_WINDOW');}
test('training cannot run before16 team games or during pending game/partial date',()=>{
 const state=fixture();assert.equal(previewCareerTraining(state,{type:'GUARANTEED',ability:'POWER'}).reason,'WINDOW_CLOSED');assert.throws(()=>trainHighSchoolCareer(state,state.revision,{type:'GUARANTEED',ability:'POWER'}));
 const pending=advanceHighSchoolCareer(state,state.revision).career;assert.throws(()=>previewCareerTraining(pending,{type:'CONDITIONING'}),/DAY_IN_PROGRESS/);
});
test('actual career training16 and MID24 use authoritative state and preserve annual opportunities',async t=>{
 let state=nextWindow(fixture());const focus=state.events.at(-1)!;state=resolveCareerFocusEvent(state,state.revision,{eventKey:focus.eventKey,eventVersion:focus.version,command:'KEEP_FOCUS'});const at16=nextWindow(state),window=at16.events.at(-1)!;assert.equal(window.definitionId,'E43');
 const ready=resolveCareerWindowEvent(at16,at16.revision,{eventKey:window.eventKey,eventVersion:window.version,command:'OPEN_TRAINING'}).career;
 await t.test('guaranteed exact preview/gain, once-per-season and immutable original',()=>{
  const before=canonicalJson(ready),player=ready.world.players['my-hitter']!,preview=previewCareerTraining(ready,{type:'GUARANTEED',ability:'POWER'});assert.equal(preview.gainUnits,10_000);
  const trained=trainHighSchoolCareer(ready,ready.revision,{type:'GUARANTEED',ability:'POWER'});assert.equal(trained.world.players['my-hitter']!.abilities.POWER,player.abilities.POWER!+10_000);assert.equal(trained.world.players['my-hitter']!.careerPeaks.POWER,player.abilities.POWER!+10_000);assert.ok(trained.development!.trainingUsedSeasons.includes('2032'));
  assert.deepEqual(trained.development!.seasonStartPlayer.abilities,player.abilities);assert.throws(()=>trainHighSchoolCareer(trained,trained.revision,{type:'GUARANTEED',ability:'CONTACT'}),/LIMIT_REACHED/);assert.equal(canonicalJson(ready),before);
 });
 await t.test('cheat challenge guaranteed+2 without3x reinforcement, injury blocks permanent gain only',()=>{
  const cheat=structuredClone(ready);cheat.difficulty='SECRET_CHEAT';const player=cheat.world.players['my-hitter']!;player.potential=Object.fromEntries(Object.keys(player.potential).map(k=>[k,1_000_000]));
  assert.equal(previewCareerTraining(cheat,{type:'CHALLENGE',ability:'POWER'}).probability,1);const trained=trainHighSchoolCareer(cheat,cheat.revision,{type:'CHALLENGE',ability:'POWER'});assert.equal(trained.world.players['my-hitter']!.abilities.POWER,player.abilities.POWER!+20_000);assert.deepEqual(trained.development!.trainingRng,cheat.development!.trainingRng);
  const injured=structuredClone(ready);injured.health.injuries['my-hitter']={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'controlled-fixture',seasonKey:'2032'};assert.equal(previewCareerTraining(injured,{type:'GUARANTEED',ability:'POWER'}).reason,'INJURED');assert.equal(previewCareerTraining(injured,{type:'CONDITIONING'}).eligible,true);
 });
 await t.test('DEFER keeps usage; FORFEIT commits real SKIP usage before closing event',()=>{
  const deferred=resolveCareerWindowEvent(at16,at16.revision,{eventKey:window.eventKey,eventVersion:window.version,command:'DEFER_TRAINING'}).career;assert.equal(previewCareerTraining(deferred,{type:'CONDITIONING'}).eligible,true);
  const forfeited=resolveCareerWindowEvent(at16,at16.revision,{eventKey:window.eventKey,eventVersion:window.version,command:'FORFEIT_TRAINING'}).career;assert.ok(forfeited.development!.trainingUsedSeasons.includes('2032'));assert.equal(forfeited.events.at(-1)!.resolution!.kind,'DOMAIN');assert.equal(previewCareerTraining(forfeited,{type:'CONDITIONING'}).reason,'LIMIT_REACHED');
 });
 await t.test('MID24 type choice once with historical boundary and current abilities unchanged',()=>{
  const at24=nextWindow(ready),event=at24.events.at(-1)!;assert.equal(event.definitionId,'E41');const after=resolveCareerWindowEvent(at24,at24.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_STYLE'}).career;
  const changed=changeMidseasonCareerArchetype(after,after.revision,'SLUGGER');assert.deepEqual(changed.world.players['my-hitter']!.abilities,after.world.players['my-hitter']!.abilities);assert.equal(changed.planHistory.at(-1)!.completedTeamGames,24);
  const kept=changeMidseasonCareerArchetype(changed,changed.revision,'SLUGGER');assert.equal(kept.styleUsedWindows.filter(k=>k.includes('MID')).length,1);assert.throws(()=>changeMidseasonCareerArchetype(kept,kept.revision,'BALANCED'),/WINDOW_USED/);
 });
});

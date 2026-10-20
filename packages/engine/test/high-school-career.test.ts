import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveInitialCareerEvent,setPreseasonCareerFocus,setPreseasonCareerArchetype,confirmCareerPreseason} from '../src/high-school-career.js';
import {canonicalJson} from '../src/game.js';
const fixture=()=>createHighSchoolCareer(createHighSchoolWorld({worldKey:'career-world',seasonKey:'2032',seed:'career-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
const setup=()=>{const state=confirmCareerPlayer(fixture(),0),event=state.events[0]!;return resolveInitialCareerEvent(state,1,{eventKey:event.eventKey,eventVersion:1,command:'KEEP_FOCUS'});};
test('career creation/confirmation uses canonical phases and persisted E01, no game auto-play',()=>{
 const source=fixture(),before=canonicalJson(source),confirmed=confirmCareerPlayer(source,0);
 assert.equal(source.phaseContext.phase,'CREATED');assert.equal(confirmed.phaseContext.phase,'EVENT_DECISION');assert.equal(confirmed.revision,1);assert.equal(confirmed.events[0]!.definitionId,'E01');assert.equal(confirmed.events[0]!.status,'OPEN');assert.equal(confirmed.records.revision,0);
 assert.equal(canonicalJson(source),before);assert.throws(()=>confirmCareerPreseason(confirmed,1));assert.throws(()=>confirmCareerPlayer(confirmed,1));assert.throws(()=>confirmCareerPlayer(source,1),/REVISION/);
 assert.equal(canonicalJson(confirmCareerPlayer(JSON.parse(JSON.stringify(source)),0)),canonicalJson(confirmed));
});
test('E01 domain focus validates4 before commit; failed choice leaves event and world untouched',()=>{
 const source=confirmCareerPlayer(fixture(),0),event=source.events[0]!,before=canonicalJson(source);
 assert.throws(()=>resolveInitialCareerEvent(source,1,{eventKey:event.eventKey,eventVersion:1,command:'CHOOSE_FOCUS',focus:['POWER','CONTACT']}));assert.equal(canonicalJson(source),before);
 const focus=['POWER','DISCIPLINE','RUNNING','CLUTCH'];const updated=resolveInitialCareerEvent(source,1,{eventKey:event.eventKey,eventVersion:1,command:'CHOOSE_FOCUS',focus});
 assert.deepEqual(updated.world.players['my-hitter']!.focus,focus);assert.equal(updated.phaseContext.phase,'PRESEASON_SETUP');assert.equal(updated.events[0]!.resolution!.kind,'DOMAIN');assert.ok(updated.events[0]!.resolution!.receiptKey);assert.deepEqual(updated.planHistory[0]!.focus,focus);
 assert.throws(()=>resolveInitialCareerEvent(source,1,{eventKey:event.eventKey,eventVersion:2,command:'KEEP_FOCUS'}));assert.throws(()=>resolveInitialCareerEvent(updated,2,{eventKey:event.eventKey,eventVersion:2,command:'KEEP_FOCUS'}));
});
test('KEEP_FOCUS resolves E01; initial plan changes preserve current ability, potential and stream state',()=>{
 const source=setup(),player=source.world.players['my-hitter']!,before=canonicalJson(source.world.rng);
 const changed=setPreseasonCareerFocus(source,2,['POWER','CONTACT','RUNNING','CLUTCH']);assert.equal(changed.revision,3);assert.deepEqual(changed.world.players['my-hitter']!.abilities,player.abilities);assert.deepEqual(changed.world.players['my-hitter']!.potential,player.potential);assert.equal(canonicalJson(changed.world.rng),before);assert.equal(changed.planHistory.length,1);
});
test('PRE archetype change once; keeping current archetype uses no new opportunity or ability reset',()=>{
 const source=setup(),kept=setPreseasonCareerArchetype(source,2,'BALANCED');assert.equal(kept.styleUsedWindows.length,0);
 const changed=setPreseasonCareerArchetype(kept,3,'SLUGGER');assert.equal(changed.styleUsedWindows.length,1);assert.deepEqual(changed.world.players['my-hitter']!.abilities,source.world.players['my-hitter']!.abilities);
 const keptAgain=setPreseasonCareerArchetype(changed,4,'SLUGGER');assert.equal(keptAgain.styleUsedWindows.length,1);assert.throws(()=>setPreseasonCareerArchetype(keptAgain,5,'BALANCED'),/WINDOW_USED/);
});
test('preseason confirmation enters progress at first schedule day, revision protected; unresolved source mismatch rejected',()=>{
 const source=setup(),progress=confirmCareerPreseason(source,2);assert.deepEqual(progress.phaseContext,{phase:'SEASON_PROGRESS',nextWorldDay:31,pendingGame:null});assert.equal(progress.records.revision,0);
 assert.throws(()=>setPreseasonCareerFocus(progress,3,['POWER','CONTACT','RUNNING','CLUTCH']));assert.throws(()=>confirmCareerPreseason(source,0));
 const decision=confirmCareerPlayer(fixture(),0),bad=structuredClone(decision);bad.events[0]!.resume.registrationKey='H09';assert.throws(()=>resolveInitialCareerEvent(bad,1,{eventKey:bad.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'}));
});

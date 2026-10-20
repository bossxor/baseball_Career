import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {ownCareerAssessmentView,refreshOwnCareerAssessment} from '../src/high-school-assessment.js';
import {canonicalJson} from '../src/game.js';
const fixture=(cheat=false)=>{const difficulty=cheat?'SECRET_CHEAT':'GROWTH';return createHighSchoolCareer(createHighSchoolWorld({worldKey:'assessment-world',seasonKey:'2032',seed:'assessment-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty}}),difficulty);};
test('own six potential ranges contain true potential; repeated reads consume no RNG, revision or observation',()=>{
 const state=fixture(),before=canonicalJson(state),view=ownCareerAssessmentView(state),ranges=state.ownAssessment!.ranges;
 for(const [key,value] of Object.entries(state.world.players['my-hitter']!.potential))assert.ok(ranges[key]!.lowUnits<=value && ranges[key]!.highUnits>=value);
 assert.equal(view.abilities.length,6);assert.equal(view.mode,'RANGE');assert.equal(view.nextObservationGames,20);assert.deepEqual(ownCareerAssessmentView(state),view);assert.equal(canonicalJson(state),before);
 const json=JSON.stringify(view);for(const field of ['"potential":','"seed":','"rng":','"z":','"potentialUnits":'])assert.equal(json.includes(field),false);
});
test('only closed registered team games observed, byes not counted; repeat refresh has no duplicate progress',()=>{
 let state=fixture();state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});state=confirmCareerPreseason(state,2);
 for(let i=0;i<20;i++){const result=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_GAME':undefined);state=result.career;if(result.stopReason==='ONE_GAME')break;}
 assert.equal(state.ownAssessment!.progress.observed.length,1);assert.equal(state.ownAssessment!.progress.stage,0);assert.equal(ownCareerAssessmentView(state).nextObservationGames,19);assert.equal(state.days.days.length,2);
 const before=canonicalJson(state);assert.deepEqual(refreshOwnCareerAssessment(state),state.ownAssessment);assert.equal(canonicalJson(state),before);
});
test('cheat own report gives six fixed100 values and no range or hidden raw fields',()=>{
 const state=fixture(true),view=ownCareerAssessmentView(state);assert.equal(view.mode,'FIXED_CHEAT');assert.ok(view.abilities.every(a=>'fixedPotential' in a && a.fixedPotential===100 && !('potentialRange' in a)));
 assert.equal(canonicalJson(refreshOwnCareerAssessment(state)),canonicalJson(state.ownAssessment));
});

// Written for the single final M2 validation. Not executed during implementation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer} from '../../../packages/engine/test/fixtures.js';
import {preparedUsOptionCareer} from '../../../packages/engine/test/us-option-fixture.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import {collegeFlow} from '../src/career-college-shell.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {draftLines} from '../src/career-draft-lines.js';

test('college admission exposes all fifteen distinct four-ability plans with owned notice versions',()=>{
 const career=enrolledCollegeCareer(),flow=collegeFlow(career),choices=flow.commands.filter(c=>c.type==='CAREER_CHOICE_COLLEGE_FOCUS');
 assert.equal(choices.length,15);
 assert.equal(new Set(choices.map(c=>JSON.stringify(c.payload.focus))).size,15);
 for(const choice of choices){assert.equal((choice.payload.focus as string[]).length,4);assert.equal(choice.payload.careerRevision,career.revision);assert.equal(typeof choice.payload.eventKey,'string');}
});
test('signed amateur US route exposes activation and rejects caller-provided rosters',()=>{
 const career=preparedUsOptionCareer('HITTER').amateurHistory,state={schemaVersion:1,career};
 const flow=careerFlowScreen(state),activate=flow.commands.find(c=>c.type==='CAREER_US_ENTRY_ACTIVATE');assert.ok(activate);
 assert.throws(()=>applyEngineCommand(state,{commandId:'forged',expectedRevision:0,type:activate.type,payload:{...activate.payload,roster:{}}}),/INVALID_PAYLOAD/);
 const next=applyEngineCommand(state,{commandId:'activate',expectedRevision:0,type:activate.type,payload:activate.payload});
 assert.equal((next.nextState.career as {mode:string}).mode,'US_CAREER');
 assert.equal(next.nextState.usEntry,undefined);
});
test('school review stays playable and public draft facts omit certainty percentages',()=>{
 const c=completedHighSchoolCareer(),flow=careerFlowScreen({schemaVersion:1,career:c});assert.ok(flow.commands.length);
 const lines=draftLines({probabilityKind:'EXACT',selectionProbability:1,undraftedProbability:0,conditionalLikelyRounds:[1],possibleRounds:[1],roundProbabilities:[{round:1,probability:1}]});
 assert.ok(lines.some(line=>line.value==='1라운드'));assert.ok(lines.every(line=>!line.value.includes('100%')));
});

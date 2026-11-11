import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldEvent,eventDefinition} from '@playball/engine';
import {completedCollegeAcademicYear,enrolledCollegeCareer} from '../../../packages/engine/test/fixtures.js';
import {applyCollege,collegeFlow} from '../src/career-college-shell.js';

test('college national notice uses owned event revision and rejects caller state',()=>{
 const c=enrolledCollegeCareer(),definition=eventDefinition('E45');
 const event=createWorldEvent({definitionId:'E45',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:c.world.protagonistKey,competitionId:'test-selection',selectionOrAppearanceStage:'NOT_SELECTED'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:'COLLEGE',registrationKey:c.world.protagonistSchoolId,sourceRevision:c.revision},sourceSequence:c.events.length+1,worldDay:1});
 c.events=[...c.events,event];const action=collegeFlow(c).commands[0]!;
 assert.equal(action.type,'CAREER_COLLEGE_NATIONAL_EVENT');
 const command={commandId:'national-ack',expectedRevision:0,type:action.type,payload:action.payload},state={schemaVersion:1,career:c};
 assert.throws(()=>applyCollege(state,{...command,payload:{...action.payload,host:{}}}),/INVALID_PAYLOAD/);
 assert.throws(()=>applyCollege(state,{...command,payload:{...action.payload,eventVersion:event.version+1}}),/VERSION/);
 assert.throws(()=>applyCollege(state,{...command,payload:{...action.payload,eventKey:'forged'}}),/INVALID_NATIONAL_EVENT/);
 const result=applyCollege(state,command),next=result.nextState.career as typeof c;
 assert.equal(next.events.find(e=>e.eventKey===event.eventKey)!.status,'RESOLVED');
 assert.deepEqual(next.records,c.records);assert.deepEqual(next.world,c.world);
 assert.throws(()=>applyCollege({schemaVersion:1,career:next},{...command,payload:{...action.payload,careerRevision:next.revision}}),/INVALID_NATIONAL_EVENT/);
});

test('college national source is server-owned and both revisions are required',()=>{
 const c=enrolledCollegeCareer(),command={commandId:'select',expectedRevision:0,type:'CAREER_COLLEGE_NATIONAL_SELECT',payload:{careerRevision:c.revision,hostRevision:1}};
 assert.throws(()=>applyCollege({schemaVersion:1,career:c},command),/STALE_NATIONAL_CAREER_SOURCE/);
 assert.throws(()=>applyCollege({schemaVersion:1,career:c},{...command,payload:{...command.payload,host:{revision:1}}}),/INVALID_PAYLOAD/);
 assert.throws(()=>applyCollege({schemaVersion:1,career:c,collegeNationalHost:{revision:2}},{...command}),/STALE_NATIONAL_CAREER_SOURCE/);
});

test('college AG creates an owned NPC host only at the academic break',()=>{
 const enrolled=enrolledCollegeCareer(),career=completedCollegeAcademicYear(enrolled),state={schemaVersion:1,career};
 const action=collegeFlow(career).commands[0]!;
 assert.equal(action.type,'CAREER_COLLEGE_NATIONAL_HOST_CREATE');
 const command={commandId:'create-host',expectedRevision:0,type:action.type,payload:action.payload};
 assert.throws(()=>applyCollege({...state,career:enrolled},command),/NATIONAL_CALENDAR_NOT_READY/);
 const result=applyCollege(state,command),host=result.nextState.collegeNationalHost;
 assert.equal(result.nextState.career,career);
 assert.equal(result.summary.hostRevision,0);
 assert.throws(()=>applyCollege(result.nextState,command),/NATIONAL_HOST_ALREADY_EXISTS/);
 assert.throws(()=>applyCollege(state,{...command,payload:{...action.payload,seed:'forged'}}),/INVALID_PAYLOAD/);
 assert.ok(host);
});

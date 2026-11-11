import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {preparedUsOptionCareer} from '../../../packages/engine/test/us-option-fixture.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import type {SaveState} from '../src/engine-command.js';

test('US national Flow starts WBC with the actual stored NPC host and validates both revisions',()=>{
 const c=preparedUsOptionCareer();
 delete c.preseasonPlan;
 delete c.seasonSchedule;
 const raw={schemaVersion:1,career:c};
 const create=careerFlowScreen(raw).commands[0]!;
 const command=(type:string,payload:unknown)=>({type,payload,commandId:type,expectedRevision:0});
 assert.equal(create.type,'CAREER_US_NATIONAL_HOST_CREATE');
 assert.throws(()=>applyEngineCommand(raw,command(create.type,{...create.payload,seed:'injected'})),/INVALID_PAYLOAD/);
 const created=applyEngineCommand(raw,command(create.type,create.payload));
 assert.ok(engine.isCollegeLeagueHost(created.nextState.collegeNationalHost));
 assert.equal(created.nextState.collegeNationalHost.game.world.seasonKey,c.amateurHistory.world.seasonKey);
 // Controlled target preseason host isolates the public entry/selection path from replaying an entire prior year.
 const host=engine.createNpcLeagueHost(engine.usNationalNpcOwner(c),Number(c.world.seasonKey),'calendar-2');
 const state:SaveState={...raw,collegeNationalHost:host};
 const select=careerFlowScreen(state).commands[0]!;
 assert.equal(select.type,'CAREER_US_NATIONAL_SELECT');
 assert.throws(()=>applyEngineCommand(state,command(select.type,{...select.payload,hostRevision:host.revision+1})),/STALE_NATIONAL_CAREER_SOURCE/);
 const selection=applyEngineCommand(state,command(select.type,select.payload));
 const event=careerFlowScreen(selection.nextState).commands[0]!;
 const response=applyEngineCommand(selection.nextState,command(event.type,event.payload));
 const start=careerFlowScreen(response.nextState).commands[0]!;
 const playing=applyEngineCommand(response.nextState,command(start.type,start.payload));
 assert.equal(playing.phase,'INTERNATIONAL_PROGRESS');
 assert.equal(playing.nextState.collegeNationalHost,host);
 assert.equal(careerFlowScreen(playing.nextState).commands[0]!.type,'CAREER_US_NATIONAL_ADVANCE');
 assert.doesNotMatch(JSON.stringify(careerFlowScreen(playing.nextState)),/seed|potential|rng|lotRank/i);
});

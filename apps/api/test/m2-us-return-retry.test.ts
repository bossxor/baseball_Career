import test from 'node:test';
import assert from 'node:assert/strict';
import {applyEngineCommand} from '../src/engine-command.js';
import {retryScreenOf} from '../src/career-retry-shell.js';
import {nativeUndraftedUsReturn} from '../../../packages/engine/test/us-return-retry-fixture.js';
import type {SaveState} from '../src/engine-command.js';

test('returned-US commands reject caller authority before reading an owner',()=>{
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:{mode:'US_RETURN_RETRY'}} as SaveState,{commandId:'bad',expectedRevision:0,type:'CAREER_RETRY_US_RETURN_US_ASSESS',payload:{careerRevision:1,budget:100000}}),/INVALID_PAYLOAD/);
});
test('native returned owner uses the existing save command pipeline, JSON and public retry screens',()=>{
 const origin=nativeUndraftedUsReturn();let state={schemaVersion:1,career:origin} as SaveState;
 const command=(name:string,careerRevision:number,extra:Record<string,unknown>={})=>({commandId:name+careerRevision,expectedRevision:0,type:'CAREER_RETRY_US_RETURN_'+name,payload:{careerRevision,...extra}});
 const opened=applyEngineCommand(state,command('OPEN',origin.revision));state=JSON.parse(JSON.stringify(opened.nextState));
 const root=state.career as unknown as {mode:string;revision:number};assert.equal(root.mode,'US_RETURN_RETRY');
 const view=retryScreenOf(state,'RETRY_ROUTES') as {revision:number;routes:{routeId:string}[]};assert.equal(view.revision,root.revision);assert.ok(view.routes.some(r=>r.routeId==='PREPARATION'));assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"|"basis"/);
 assert.throws(()=>applyEngineCommand(state,command('US_ASSESS',root.revision-1)),/REVISION/);
 const assessed=applyEngineCommand(state,command('US_ASSESS',root.revision));state=assessed.nextState;
 const market=retryScreenOf(state,'RETRY_ROUTES') as {revision:number;usOpportunity:{assessmentKey:string}};
 const declined=applyEngineCommand(state,command('US_DECLINE',market.revision,{assessmentKey:market.usOpportunity.assessmentKey}));state=JSON.parse(JSON.stringify(declined.nextState));
 const after=retryScreenOf(state,'RETRY_ROUTES') as {revision:number;routePreviewId:string;routes:{routeId:string}[]};assert.ok(!after.routes.some(r=>r.routeId==='US_CONTRACT'));
 const started=applyEngineCommand(state,command('START',after.revision,{routePreviewId:after.routePreviewId}));assert.equal(started.phase,'PREPARATION_PRE');
 assert.ok(retryScreenOf(JSON.parse(JSON.stringify(started.nextState)),'RETRY_PREP'));
 assert.throws(()=>applyEngineCommand(state,command('EXHAUST',after.revision)),/ASSESSMENT_REQUIRED/);
 assert.deepEqual(retryScreenOf(state,'RETRY_RETIREMENT'),{available:false});
 assert.throws(()=>applyEngineCommand(state,command('ADVANCE',after.revision,{mode:'UNBOUNDED'})),/INVALID_PAYLOAD/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import type {UsAmateurReturnCareer,UsAmateurReturnRetryCareer} from '@playball/engine';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {retryYearReady} from '../src/career-us-return-retry-flow.js';

test('retry season waits for the final league day and pending game before settlement',()=>{
 const schedule=[{worldDay:10},{worldDay:12}];
 assert.equal(retryYearReady(11,schedule,null),false);
 assert.equal(retryYearReady(12,schedule,null),false);
 assert.equal(retryYearReady(13,schedule,{}),false);
 assert.equal(retryYearReady(13,schedule,null),true);
 assert.equal(retryYearReady(13,[],null),false);
});

// Existing completed fixture is optional; generation would run two native seasons.
const fixture=process.env.PLAYBALL_RETURN_FLOW_FIXTURE;
test('completed undrafted return opens retry and resumes preparation with owned revision',{skip:!fixture},()=>{
 const origin=(JSON.parse(readFileSync(fixture!,'utf8')) as {origin:UsAmateurReturnCareer}).origin;
 const state={schemaVersion:1,career:origin},first=careerFlowScreen(state);
 const open=first.commands.find(c=>c.id==='return-retry-open')!;
 assert.ok(open);assert.doesNotMatch(JSON.stringify(first),/"seed"|"rng"|potential|"records"/);
 assert.throws(()=>applyEngineCommand(state,{commandId:'stale',expectedRevision:0,type:open.type,payload:{careerRevision:origin.revision-1}}),/REVISION/);
 const retry=applyEngineCommand(state,{commandId:'open',expectedRevision:0,type:open.type,payload:open.payload}).nextState.career as UsAmateurReturnRetryCareer;
 const view=careerFlowScreen({schemaVersion:1,career:retry}),start=view.commands.find(c=>c.id==='retry-start')!;
 assert.ok(start);assert.ok(start.confirm);assert.ok(view.commands.some(c=>c.id==='retry-us-assess'));
 assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|potential|"records"/);
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:retry},{commandId:'bad',expectedRevision:0,type:start.type,payload:{...start.payload,routePreviewId:'wrong'}}),/STALE/);
 const preparing=applyEngineCommand({schemaVersion:1,career:retry},{commandId:'start',expectedRevision:0,type:start.type,payload:start.payload}).nextState.career as UsAmateurReturnRetryCareer;
 assert.ok(careerFlowScreen({schemaVersion:1,career:preparing}).commands.some(c=>c.id==='retry-preseason'));
 const assess=view.commands.find(c=>c.id==='retry-us-assess')!;
 const quoted=applyEngineCommand({schemaVersion:1,career:retry},{commandId:'assess',expectedRevision:0,type:assess.type,payload:assess.payload}).nextState.career as UsAmateurReturnRetryCareer;
 const quoteView=careerFlowScreen({schemaVersion:1,career:quoted}),offer=quoteView.commands.find(c=>c.id.startsWith('retry-us-')&&c.type==='CAREER_RETRY_US_RETURN_US_ACCEPT');
 assert.ok(offer);assert.ok(offer.confirm);assert.ok(offer.sign);
 const signed=applyEngineCommand({schemaVersion:1,career:quoted},{commandId:'us-sign',expectedRevision:0,type:offer.type,payload:offer.payload}).nextState.career as {mode:string};
 assert.equal(signed.mode,'US_CAREER');
 const declined=quoteView.commands.find(c=>c.id==='retry-us-decline')!;assert.ok(declined.confirm);
 const after=applyEngineCommand({schemaVersion:1,career:quoted},{commandId:'decline',expectedRevision:0,type:declined.type,payload:declined.payload}).nextState.career as UsAmateurReturnRetryCareer;
 assert.ok(!careerFlowScreen({schemaVersion:1,career:after}).commands.some(c=>c.type==='CAREER_RETRY_US_RETURN_US_ACCEPT'));
});

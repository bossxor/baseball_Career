import assert from 'node:assert/strict';
import test from 'node:test';
import type {UsCareer} from '@playball/engine';
import {closedUsOptionCareer} from '../../../packages/engine/test/us-option-fixture.js';
import {closeControlledServiceDates} from '../../../packages/engine/test/us-service-fixture.js';
import {applyEngineCommand,type SaveState} from '../src/engine-command.js';
import {usMilitaryScreen} from '../src/career-us-military-shell.js';
import {usPlayScreen} from '../src/career-us-play-shell.js';

const command=(name:string,revision:number,extra:Record<string,unknown>={})=>({commandId:name+revision,expectedRevision:0,type:'CAREER_US_MILITARY_'+name,payload:{careerRevision:revision,...extra}});
const apply=(c:UsCareer,name:string,extra:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},command(name,c.revision,extra)).nextState.career as UsCareer;

test('US military commands reject authority, invalid choices and unbounded dates before reading a career',()=>{
 for(const [name,extra] of [['PLAN',{choice:'FREEZE',world:{}}],['PLAN',{choice:'COMPLETE'}],['ADVANCE',{maxDays:8}],['ADVANCE',{maxDays:0}],['ADVANCE',{maxDays:1.5}],['COMPLETE',{completedBlocks:2}],['CONFIRM_RETURN',{worldDay:0}],['ACCEPT_OFFER',{offerKey:1}],['DECLINE_OFFER',{offerKey:''}]] as const){
  assert.throws(()=>applyEngineCommand({schemaVersion:1},command(name,1,extra)),/INVALID_PAYLOAD/);
 }
 assert.throws(()=>applyEngineCommand({schemaVersion:1},command('UNKNOWN',1)),/UNSUPPORTED_COMMAND/);
 assert.throws(()=>applyEngineCommand({schemaVersion:1},command('PLAN',1,{choice:'FREEZE'})),/CAREER_NOT_FOUND/);
});

test('US military API freezes or terminates a real contract and starts bounded native service play',()=>{
 const source=closedUsOptionCareer(),state:SaveState={schemaVersion:1,career:source};
 const preview=usMilitaryScreen(state,'US_MILITARY_PLAN') as {careerRevision:number;choices:string[]};
 assert.equal(preview.careerRevision,source.revision);assert.deepEqual(preview.choices,['FREEZE','TERMINATE']);
 assert.throws(()=>applyEngineCommand(state,command('PLAN',source.revision-1,{choice:'FREEZE'})),/STALE|REVISION/);
 const frozen=apply(source,'PLAN',{choice:'FREEZE'}),terminated=apply(source,'PLAN',{choice:'TERMINATE'});
 assert.equal(source.contract.status,'ACTIVE');assert.equal(frozen.contract.status,'FROZEN');assert.equal(terminated.contract.status,'TERMINATED');
 assert.equal(frozen.military.service!.completedBlocks,0);assert.deepEqual(frozen.income,source.income);
 assert.throws(()=>apply(frozen,'COMPLETE'),/INCOMPLETE/);
 const started=apply(frozen,'START_YEAR');assert.equal(started.phaseContext.phase,'SEASON_PROGRESS');assert.ok(started.seasonSchedule);assert.equal(started.season!.paidUsd,0);
 const progress=applyEngineCommand({schemaVersion:1,career:started},command('ADVANCE',started.revision,{maxDays:1})),advanced=progress.nextState.career as UsCareer;
 assert.ok(progress.summary.stopReason);assert.ok(advanced.records.revision>started.records.revision);assert.equal(advanced.season!.paidUsd,0);assert.equal(advanced.military.service!.completedBlocks,0);
 const restored=JSON.parse(JSON.stringify(advanced)) as UsCareer;
 const view=usMilitaryScreen({schemaVersion:1,career:restored},'US_MILITARY_SERVICE') as {careerRevision:number;phase:string;completedBlocks:number};
 assert.equal(view.careerRevision,restored.revision);assert.equal(view.phase,restored.phaseContext.phase);assert.equal(view.completedBlocks,0);assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
});

test('controlled service dates reach real discharge, preserve 30-game-day option and require explicit return choice',()=>{
 const source=closedUsOptionCareer();let c=apply(source,'PLAN',{choice:'FREEZE'});
 // Controlled closed competitive rows; calendar, service blocks and return writers remain authoritative.
 c=apply(c,'START_YEAR');c=closeControlledServiceDates(c,c.season!.lastDay);
 assert.equal(c.military.service!.completedBlocks,1);assert.throws(()=>apply(c,'COMPLETE'),/INCOMPLETE/);
 c=apply(c,'START_YEAR');c=closeControlledServiceDates(c,c.military.service!.completionDays[1]!.worldDay);
 const discharged=apply(c,'COMPLETE'),option=discharged.military.service!.returnOption!;
 assert.equal(discharged.military.status,'COMPLETED');assert.equal(option.expiresWorldDay-option.issuedWorldDay,30);assert.equal(discharged.contract.status,'FROZEN');
 const restored=JSON.parse(JSON.stringify(discharged)) as UsCareer;
 const view=usMilitaryScreen({schemaVersion:1,career:restored},'US_MILITARY_SERVICE') as {returnOption:{optionId:string;expiresWorldDay:number};completedBlocks:number};
 assert.equal(view.completedBlocks,2);assert.equal(view.returnOption.optionId,option.optionId);assert.equal(view.returnOption.expiresWorldDay,option.expiresWorldDay);
 const confirmed=apply(restored,'CONFIRM_RETURN'),declined=apply(restored,'DECLINE_RETURN');
 assert.equal(confirmed.contract.status,'ACTIVE');assert.equal(confirmed.military.service!.returnOption!.status,'CONFIRMED');assert.deepEqual(confirmed.records,discharged.records);assert.deepEqual(confirmed.income,discharged.income);
 assert.equal(declined.contract.status,'TERMINATED');assert.equal(declined.military.service!.returnOption!.status,'DECLINED');assert.equal(restored.contract.status,'FROZEN');
 assert.throws(()=>usPlayScreen({schemaVersion:1,career:discharged}),/NOT_PLAYABLE/);
 const playable=usPlayScreen({schemaVersion:1,career:confirmed}) as {careerRevision:number;phase:string};
 assert.equal(playable.careerRevision,confirmed.revision);assert.equal(playable.phase,'SEASON_PROGRESS');
 const resumed=applyEngineCommand({schemaVersion:1,career:confirmed},{commandId:'resumed',expectedRevision:0,type:'CAREER_US_PLAY_ADVANCE',payload:{careerRevision:confirmed.revision,maxDays:1}});
 assert.ok(resumed.summary.stopReason);assert.equal((resumed.nextState.career as UsCareer).revision,confirmed.revision+1);
});

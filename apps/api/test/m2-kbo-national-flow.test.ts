import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {proNationalFlow} from '../src/career-pro-national-shell.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';

test('KBO national Flow opens one server draw and binds event choice and tournament start to its revision',()=>{
 const source=enteredKboCareer();
 const state={schemaVersion:1,career:source};
 const selection=careerFlowScreen(state).commands[0]!;
 const body=(type:string,payload:unknown)=>({commandId:'national',expectedRevision:0,type,payload});
 assert.equal(selection.type,'CAREER_KBO_NATIONAL_SELECT');
 assert.throws(()=>applyEngineCommand(state,body(selection.type,{...selection.payload,window:{startDay:0}})),/INVALID_PAYLOAD/);
 const selected=applyEngineCommand(state,body(selection.type,selection.payload));
 const choice=proNationalFlow(selected.nextState)!.commands[0]!;
 assert.equal(choice.type,'CAREER_KBO_NATIONAL_RESOLVE');
 assert.throws(()=>applyEngineCommand(selected.nextState,body(choice.type,{...choice.payload,careerRevision:source.revision})),/CAREER_REVISION_CHANGED/);
 const resolved=applyEngineCommand(selected.nextState,body(choice.type,choice.payload));
 const start=proNationalFlow(resolved.nextState)!.commands[0]!;
 const playing=applyEngineCommand(resolved.nextState,body(start.type,start.payload));
 assert.equal(playing.phase,'INTERNATIONAL_PROGRESS');
 assert.equal(proNationalFlow(playing.nextState)!.commands[0]!.type,'CAREER_KBO_NATIONAL_ADVANCE');
 assert.equal(source.national,undefined);
 assert.doesNotMatch(JSON.stringify(proNationalFlow(playing.nextState)),/seed|potential|lotRank|rng/i);
});

test('KBO national result uses the sealed outcome and reviews benefit before returning',()=>{
 const source=enteredKboCareer();
 const result=engine.sealNationalCompetitionResult(source,source.revision,{competitionId:'trusted-controlled-oly',tournament:'OLY',seasonKey:source.world.seasonKey,medal:'BRONZE',finalRank:3,registered:true,officialAppearance:true,resultVersion:1});
 const first={schemaVersion:1,career:result};
 const appearance=proNationalFlow(first)!.commands[0]!;
 assert.equal(appearance.payload.command,'ACK_EVENT');
 const state=applyEngineCommand(first,{commandId:'appearance',expectedRevision:0,type:appearance.type,payload:appearance.payload}).nextState;
 const screen=proNationalFlow(state)!;
 assert.equal(screen.lines.find(row=>row.label==='팀 최종 순위')?.value,'3위');
 assert.equal(screen.lines.find(row=>row.label==='팀 메달')?.value,'동메달');
 assert.equal(screen.lines.find(row=>row.label==='병역')?.value,'체육요원 자격 획득');
 const choice=screen.commands[0]!;
 assert.equal(choice.payload.command,'CONFIRM_SERVICE_ELIGIBILITY');
 const next=applyEngineCommand(state,{commandId:'eligibility',expectedRevision:0,type:choice.type,payload:choice.payload});
 assert.equal(proNationalFlow(next.nextState)!.commands[0]!.payload.command,'CONFIRM_NATIONAL_RETURN');
});

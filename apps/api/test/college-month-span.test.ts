import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {enrolledCollegeCareer} from '../../../packages/engine/test/fixtures.js';
import {applyCollege} from '../src/career-college-shell.js';

test('college MONTH returns MONTH_END after four weeks and keeps bounded unfinished requests resumable',()=>{
 const enrolled=enrolledCollegeCareer(),c=engine.confirmCollegePreseason(enrolled,enrolled.revision);
 const previous=process.env.PLAYBALL_SPAN_BUDGET_MS;
 const command={commandId:'college-month',expectedRevision:0,type:'CAREER_COLLEGE_ADVANCE',payload:{careerRevision:c.revision,mode:'MONTH'}};
 try{
  process.env.PLAYBALL_SPAN_BUDGET_MS='0';
  const bounded=applyCollege({schemaVersion:1,career:c},command);
  assert.equal(bounded.summary.spanStop,'BUDGET');assert.equal(bounded.summary.stopReason,'CHUNK_LIMIT');
  assert.deepEqual(bounded.nextState.career,engine.advanceCollegeCareer(c,c.revision,'ONE_WEEK').career);
  process.env.PLAYBALL_SPAN_BUDGET_MS='10000';
  const result=applyCollege({schemaVersion:1,career:c},command);
  assert.equal(result.summary.spanStop,'MONTH_END');assert.equal(result.summary.stopReason,'ONE_WEEK');
  const next=result.nextState.career as engine.HighSchoolCareer;
  assert.equal(next.phaseContext.phase,'SEASON_PROGRESS');
  if(next.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('TEST_PHASE');
  assert.equal(next.phaseContext.nextWorldDay,c.phaseContext.nextWorldDay+28);
  assert.deepEqual(result.nextState.span,{careerRevision:next.revision,stop:'MONTH_END'});
 }finally{
  if(previous===undefined)delete process.env.PLAYBALL_SPAN_BUDGET_MS;
  else process.env.PLAYBALL_SPAN_BUDGET_MS=previous;
 }
});

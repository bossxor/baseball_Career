import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer,completedHighSchoolCareer} from './fixtures.js';
import {advanceCollegeCareer,confirmCollegePreseason} from '../src/college-career.js';
import {advanceCollegeCareerRun} from '../src/high-school-progress.js';
import {canonicalSha256} from '../src/canonical-seal.js';
import {setEngineTimingObserver} from '../src/engine-timing.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';

/** The prior API command sequence, bounded to four steps for a focused equality proof. */
function ordinary(source:HighSchoolCareer,span:'SEASON'|'MONTH'){
 let result=advanceCollegeCareer(source,source.revision,span==='SEASON'?'NEXT_MAJOR_EVENT':'ONE_WEEK');
 let weeks=result.stopReason==='ONE_WEEK'?1:0,steps=1;
 let plateAppearances=result.plateAppearances,completedInnings=result.completedInnings;
 for(let i=0;i<3;i++){
  if(result.career.phaseContext.phase!=='SEASON_PROGRESS')break;
  if(result.stopReason==='CHUNK_LIMIT')result=advanceCollegeCareer(result.career,result.career.revision);
  else if(span==='MONTH'&&result.stopReason==='ONE_WEEK'&&weeks<4){result=advanceCollegeCareer(result.career,result.career.revision,'ONE_WEEK');if(result.stopReason==='ONE_WEEK')weeks++;}
  else break;
  steps++;plateAppearances+=result.plateAppearances;completedInnings+=result.completedInnings;
 }
 return {result:{...result,plateAppearances,completedInnings,monthDone:weeks>=4},steps};
}

test('college request-owned season and month preserve full command hashes and omit repeated root clones',()=>{
 const enrolled=enrolledCollegeCareer(),c=confirmCollegePreseason(enrolled,enrolled.revision),before=canonicalSha256(c);
 for(const span of ['SEASON','MONTH'] as const){
  let clock=0,clones=0;
  setEngineTimingObserver({now:()=>clock++,record:category=>{if(category==='clone')clones++;}});
  try{
   const repeated=ordinary(c,span),ordinaryClones=clones;clones=0;
   let calls=0;
   const run=advanceCollegeCareerRun(c,c.revision,span,()=>calls++<3);
   assert.equal(canonicalSha256(run),canonicalSha256(repeated.result));
   assert.equal(ordinaryClones-clones,repeated.steps-1);
   assert.equal(canonicalSha256(c),before);
  }finally{setEngineTimingObserver();}
 }
});

test('college owned span preserves registration, stale revision, pending plan and abort guards',()=>{
 const enrolled=enrolledCollegeCareer(),c=confirmCollegePreseason(enrolled,enrolled.revision);
 const first=advanceCollegeCareer(c,c.revision,'ONE_WEEK').career,before=canonicalSha256(first);
 assert.equal(first.phaseContext.phase,'SEASON_PROGRESS');
 assert.deepEqual(advanceCollegeCareerRun(first,first.revision,'MONTH',()=>false),{
  ...advanceCollegeCareer(first,first.revision,'ONE_WEEK'),monthDone:false,
 });
 assert.throws(()=>advanceCollegeCareerRun(first,first.revision,'SEASON',()=>true),/ADVANCE_PLAN_ACTIVE/);
 assert.throws(()=>advanceCollegeCareerRun(first,first.revision-1,'MONTH',()=>true),/REVISION/);
 const hs=completedHighSchoolCareer();
 assert.throws(()=>advanceCollegeCareerRun(hs,hs.revision,'SEASON',()=>true),/REGISTRATION/);
 assert.throws(()=>advanceCollegeCareerRun(first,first.revision,'MONTH',()=>{throw new Error('REQUEST_ABORTED');}),/REQUEST_ABORTED/);
 assert.equal(canonicalSha256(first),before);
});

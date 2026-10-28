import test from 'node:test';
import assert from 'node:assert/strict';
import {completedCollegeAcademicYear,enrolledCollegeCareer,nextCollegeYear} from './fixtures.js';
import {closeCollegeSeasonForNextYear} from '../src/college-year.js';
import {prepareCollegeGraduation,graduateCollegeCareer,collegeGraduationRouteView} from '../src/college-graduation.js';
import {advanceCollegeCareer} from '../src/college-career.js';
import {canonicalJson} from '../src/game.js';

test('four-year college journey ends in blocking E75 and an evidence-bound graduated route',async t=>{
 let source=enrolledCollegeCareer();
 for(let year=1;year<=4;year++){
  source=completedCollegeAcademicYear(source);
  if(year<4)source=nextCollegeYear(source);
 }
 const before=canonicalJson(source),event=source.events.at(-1)!;
 await t.test('only the fourth completed year attaches one E75 with current enrollment/year/result evidence',()=>{
  assert.equal(source.phaseContext.phase,'EVENT_DECISION');assert.equal(event.definitionId,'E75');assert.equal(event.status,'OPEN');assert.equal(source.events.filter(e=>e.definitionId==='E75').length,1);
  assert.equal(event.resume.sourceRevision,source.revision);assert.equal(event.evidence.fields.enrollmentId,source.collegeAdmission!.admissionKey);assert.equal(event.evidence.fields.academicYear,4);assert.equal(event.evidence.fields.sourceTaskId,source.collegeResult!.receiptKey);
  assert.equal(source.world.players.own!.age,22);assert.equal(source.collegeAdmission!.yearsCompleted,4);assert.equal(source.seasonGrowth!.finalized,false);assert.throws(()=>collegeGraduationRouteView(source),/PHASE/);
 });
 await t.test('graduation commits only the degree/route: growth, health, training, age and official records stay intact',()=>{
  const degree=graduateCollegeCareer(source,source.revision,event.version);
  assert.equal(degree.collegeAdmission!.status,'GRADUATED');assert.equal(degree.phaseContext.phase,'CAREER_ROUTE');assert.equal(degree.world.players.own!.age,22);assert.equal(degree.revision,source.revision+1);
  for(const key of ['world','records','health','development','seasonGrowth','previousSeasons'] as const)assert.equal(canonicalJson(degree[key]),canonicalJson(source[key]));
  assert.equal(degree.seasonGrowth!.finalized,false);assert.ok(!degree.development!.trainingUsedSeasons.includes('2033'));assert.equal(degree.collegeNpcGrowth,undefined);assert.equal(degree.events.at(-1)!.resolution!.receiptKey,degree.collegeGraduation!.receiptKey);
  const saved=canonicalJson(degree),view=collegeGraduationRouteView(degree);assert.equal(view.performanceCollege,32);assert.equal(view.draftBaseScore,.7*view.overall+.3*32);assert.deepEqual(view.kbo,{status:'AWAITING_RECRUITMENT'});
  assert.deepEqual(Object.keys(view).sort(),['collegeId','draftBaseScore','kbo','overall','overallDisplay','performanceCollege','seasonKey','status','yearsCompleted']);assert.equal(view.yearsCompleted,4);assert.equal(view.status,'GRADUATED');
  for(const field of ['"potential":','"seed":','"rng":','"sourceBasis":','"selectionProbability":','"us":','"colleges":'])assert.equal(JSON.stringify(view).includes(field),false);
  assert.deepEqual(collegeGraduationRouteView(JSON.parse(JSON.stringify(degree))),view);assert.equal(canonicalJson(degree),saved);assert.equal(canonicalJson(source),before);
  assert.throws(()=>graduateCollegeCareer(degree,degree.revision,2),/REGISTRATION/);assert.throws(()=>advanceCollegeCareer(degree,degree.revision),/REGISTRATION/);assert.throws(()=>closeCollegeSeasonForNextYear(degree,degree.revision,true),/REGISTRATION/);
 });
 await t.test('stale revision/event version and changed evaluation/event source reject without partial graduation',()=>{
  assert.throws(()=>graduateCollegeCareer(source,0,event.version),/REVISION/);assert.throws(()=>graduateCollegeCareer(source,source.revision,event.version+1));
  for(const mutate of [(s:typeof source)=>{s.world.players.own!.fatigue++;},(s:typeof source)=>{s.world.calendar!.growthDays=s.world.calendar!.growthDays.slice(1);},(s:typeof source)=>{s.world.seed='changed';},(s:typeof source)=>{s.events.at(-1)!.resume.registrationKey='U01';},(s:typeof source)=>{s.collegeGraduation!.receiptKey='wrong';}]){
   const changed=structuredClone(source);mutate(changed);const unchanged=canonicalJson(changed);assert.throws(()=>graduateCollegeCareer(changed,changed.revision,event.version),/STALE/);assert.equal(canonicalJson(changed),unchanged);
  }
 });
 await t.test('pre-E75 fourth-year saves attach the same legal task; earlier grades and repeated attachment reject',()=>{
  const legacy=structuredClone(source);delete legacy.collegeGraduation;legacy.events=legacy.events.filter(e=>e.definitionId!=='E75');legacy.phaseContext={phase:'OFFSEASON_REVIEW'};
  const original=canonicalJson(legacy),prepared=prepareCollegeGraduation(legacy,legacy.revision);assert.equal(prepared.events.at(-1)!.definitionId,'E75');assert.equal(prepared.phaseContext.phase,'EVENT_DECISION');assert.equal(canonicalJson(legacy),original);
  assert.throws(()=>prepareCollegeGraduation(prepared,prepared.revision),/INVALID/);
  const early=completedCollegeAcademicYear();assert.throws(()=>prepareCollegeGraduation(early,early.revision),/INVALID/);
 });
});

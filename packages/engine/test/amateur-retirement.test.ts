import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer,enrolledCollegeCareer,enteredKboCareer,completedCollegeAcademicYear} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {canonicalJson} from '../src/game.js';
import {requestAmateurRetirement,resolveAmateurRetirement,amateurRetirementView,openAmateurArchive} from '../src/amateur-retirement.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {enterCollegeEarlyDraft} from '../src/college-route.js';
let cache:ReturnType<typeof completedHighSchoolCareer>|undefined;
function route(){let c=structuredClone(cache??=completedHighSchoolCareer());c=acknowledgeHighSchoolSeasonReview(c,c.revision);return openHighSchoolCareerRoute(c,c.revision,1).career;}
test('amateur voluntary E36 cancels to the original route, confirms a zero-pro archive and preserves unresolved military and records',()=>{
 const source=route(),before=canonicalJson(source),opened=requestAmateurRetirement(source,source.revision),e=opened.events.at(-1)!;
 assert.equal(e.definitionId,'E36');assert.equal(opened.phaseContext.phase,'EVENT_DECISION');assert.equal(canonicalJson(source),before);
 const cancel=resolveAmateurRetirement(opened,opened.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CANCEL_RETIRE'});
 assert.deepEqual(cancel.phaseContext,source.phaseContext);assert.deepEqual(cancel.world,source.world);assert.deepEqual(cancel.records,source.records);assert.equal(cancel.retryCareer?.careerPreparationUsed??0,0);
 const again=requestAmateurRetirement(cancel,cancel.revision),event=again.events.at(-1)!,input={eventKey:event.eventKey,eventVersion:event.version,command:'CONFIRM_RETIRE' as const};
 const archived=resolveAmateurRetirement(again,again.revision,input),restored=resolveAmateurRetirement(JSON.parse(JSON.stringify(again)),again.revision,input);
 assert.equal(archived.phaseContext.phase,'ARCHIVED');assert.equal(canonicalJson(restored),canonicalJson(archived));assert.deepEqual(archived.records,source.records);assert.deepEqual(archived.world,source.world);
 const view=amateurRetirementView(archived) as {militaryStatus:string;professionalAppearances:{PA:number;outs:number}};
 assert.equal(view.militaryStatus,'UNRESOLVED');assert.deepEqual(view.professionalAppearances,{PA:0,outs:0});assert.doesNotMatch(JSON.stringify(view),/"(potential|seed|rng)"/);
 assert.equal(archived.events.at(-1)!.definitionId,'E37');assert.equal(archived.events.filter(e=>e.status==='OPEN').length,1);
 const f=archived.events.at(-1)!,read=openAmateurArchive(archived,archived.revision,{eventKey:f.eventKey,eventVersion:f.version});assert.equal(read.navigation!.targetScreen,'S10');assert.equal(read.career.records,archived.records);assert.equal(read.career.world,archived.world);assert.deepEqual(amateurRetirementView(read.career).commands,[]);
 assert.throws(()=>resolveAmateurRetirement(archived,archived.revision,input),/NOT_PENDING/);
});
test('actual E74 unsigned college route keeps enrollment and the open task on cancel; explicit retirement closes it without consuming preparation',()=>{
 const first=completedCollegeAcademicYear(),closed=closeCollegeSeasonForNextYear(first,first.revision,true);let c=completedCollegeAcademicYear(startNextCollegeSeason(closed,closed.revision));
 c=enterCollegeEarlyDraft(c,c.revision,c.events.at(-1)!.version);c=prepareCareerKboDraft(c,c.revision);c=resolveCareerKboDraft(c,c.revision,1);
 if(c.kboRecruitment!.program.result!.round)c=decideCareerKboDraft(c,c.revision,{programVersion:2,decision:'DECLINE'});
 const e=c.events.at(-1)!;assert.equal(e.definitionId,'E74');const raw=canonicalJson(c);
 assert.throws(()=>requestAmateurRetirement(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version+1}),/VERSION/);
 const opened=requestAmateurRetirement(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version}),review=opened.events.at(-1)!;
 const cancelled=resolveAmateurRetirement(opened,opened.revision,{eventKey:review.eventKey,eventVersion:review.version,command:'CANCEL_RETIRE'});assert.deepEqual(cancelled.phaseContext,c.phaseContext);assert.deepEqual(cancelled.collegeAdmission,c.collegeAdmission);assert.equal(cancelled.events.find(x=>x.eventKey===e.eventKey)!.status,'OPEN');
 const retired=resolveAmateurRetirement(opened,opened.revision,{eventKey:review.eventKey,eventVersion:review.version,command:'CONFIRM_RETIRE'});assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.events.find(x=>x.eventKey===e.eventKey)!.status,'CANCELLED_WITH_REASON');assert.equal(retired.retryCareer?.careerPreparationUsed??0,0);assert.deepEqual(retired.records,c.records);amateurRetirementView(retired);assert.equal(canonicalJson(c),raw);
});
test('amateur retirement rejects live school/service/pro roots, signed contracts, stale CAS/version and changed confirmation source atomically',()=>{
 const c=route(),raw=canonicalJson(c);assert.throws(()=>requestAmateurRetirement(c,c.revision-1),/REVISION/);
 const live=enrolledCollegeCareer();assert.throws(()=>requestAmateurRetirement(live,live.revision),/NOT_AVAILABLE/);
 assert.throws(()=>requestAmateurRetirement(enteredKboCareer() as never,1));
 const serving={...c,phaseContext:{phase:'SERVICE_PROGRESS' as const,nextWorldDay:1}};assert.throws(()=>requestAmateurRetirement(serving,serving.revision),/NOT_AVAILABLE/);
 const opened=requestAmateurRetirement(c,c.revision),e=opened.events.at(-1)!;
 assert.throws(()=>resolveAmateurRetirement(opened,opened.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'CONFIRM_RETIRE'}),/VERSION/);
 const forged=structuredClone(opened),player=forged.world.players[forged.world.protagonistKey]!;player.abilities={...player.abilities,POWER:player.abilities.POWER!+1};
 assert.throws(()=>resolveAmateurRetirement(forged,forged.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'}),/CHANGED|STALE/);
 let signed=prepareCareerKboDraft(c,c.revision);signed=resolveCareerKboDraft(signed,signed.revision,1);
 if(signed.kboRecruitment!.program.result!.round){signed=decideCareerKboDraft(signed,signed.revision,{programVersion:2,decision:'SIGN',eventVersion:1});assert.throws(()=>requestAmateurRetirement(signed,signed.revision),/NOT_AVAILABLE/);}
 assert.equal(canonicalJson(c),raw);
});

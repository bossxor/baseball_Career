import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {queueRelationFormationNotices,unreadRelationNotices,resolveCareerRelationNotice} from '../src/relation-notices.js';
import {canonicalJson} from '../src/game.js';
import {completedHighSchoolCareer} from './fixtures.js';
import {formHighSchoolRelations} from '../src/relationships.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../src/college-entry.js';
function fixture(noRival=false){
 const world=createHighSchoolWorld({worldKey:'relation-notices',seasonKey:'2032',seasonYear:2032,seed:'relation-notices-fixture',schoolId:'H01',player:{simulationKey:'me',name:'알림선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
 if(noRival){const p=world.players.me!;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,900_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};}
 let career=confirmCareerPlayer(createHighSchoolCareer(world,'GROWTH'),0);career=resolveCareerFocusEvent(career,career.revision,{eventKey:career.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return career;
}
function playedDay(source:HighSchoolCareer){let s=source;for(let i=0;i<50;i++){const result=advanceHighSchoolCareer(s,s.revision,i===0?'ONE_GAME':undefined);s=result.career;if(result.stopReason!=='CHUNK_LIMIT')return s;}throw new Error('DAY_LIMIT');}

test('preseason confirmation persists two E94 notices for pinned rival/teammate without blocking progress',()=>{
 const before=fixture(),snapshot=canonicalJson(before),s=confirmCareerPreseason(before,before.revision),notices=unreadRelationNotices(s);
 assert.equal(before.relationNotices,undefined);assert.equal(s.phaseContext.phase,'SEASON_PROGRESS');assert.equal(notices.length,2);assert.equal(s.events.length,before.events.length);assert.ok(s.events.every(e=>e.status==='RESOLVED'));
 assert.deepEqual(notices.map(n=>n.type).sort(),['RIVAL','TEAMMATE']);for(const n of notices){assert.equal(n.targetScreen,'S42');assert.equal(n.definitionId,'E94');assert.equal(n.otherInCurrentWorld,true);assert.ok(n.otherName);}
 assert.equal(canonicalJson(before),snapshot);assert.deepEqual(unreadRelationNotices(JSON.parse(JSON.stringify(s))),notices);assert.doesNotMatch(JSON.stringify(notices),/potential|abilities|sourceBasis|sourceRevision|"rng"|"seed"|"resume"/i);
});
test('opening a notice acknowledges only that notice and navigates to its relation; gameplay phase and RNG stay unchanged',()=>{
 const s=confirmCareerPreseason(fixture(),fixture().revision),before=canonicalJson(s),n=unreadRelationNotices(s)[0]!;
 const result=resolveCareerRelationNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'});
 assert.deepEqual(result.navigation,{targetScreen:'S42',sourceEventKey:n.eventKey,relationKey:n.relationKey});assert.equal(result.career.revision,s.revision+1);assert.equal(unreadRelationNotices(result.career).length,1);
 for(const key of ['world','records','health','days','phaseContext','events','relationships','development','traits'] as const)assert.deepEqual(result.career[key],s[key]);assert.equal(canonicalJson(s),before);
 assert.throws(()=>resolveCareerRelationNotice(result.career,result.career.revision,{eventKey:n.eventKey,eventVersion:2,command:'OPEN_RELATIONS'}),/RESOLVED/);
 assert.deepEqual(queueRelationFormationNotices(result.career,n.occurredWorldDay+1),result.career.relationNotices);
});
test('stale revision/version, wrong command, foreign or rewritten relation evidence reject atomically',()=>{
 const s=confirmCareerPreseason(fixture(),fixture().revision),n=unreadRelationNotices(s)[0]!,before=canonicalJson(s),input={eventKey:n.eventKey,eventVersion:1,command:'OPEN_RELATIONS'};
 assert.throws(()=>resolveCareerRelationNotice(s,0,input),/REVISION/);assert.throws(()=>resolveCareerRelationNotice(s,s.revision,{...input,eventVersion:0}),/VERSION/);assert.throws(()=>resolveCareerRelationNotice(s,s.revision,{...input,command:'ACK_EVENT'}),/CHOICE/);assert.throws(()=>resolveCareerRelationNotice(s,s.revision,{...input,eventKey:'missing'}),/UNKNOWN/);
 const foreign=structuredClone(s);foreign.world.worldKey='other-world';assert.throws(()=>unreadRelationNotices(foreign));const forged=structuredClone(s);forged.relationNotices![0]!.evidence={...forged.relationNotices![0]!.evidence,fields:{relationId:n.relationKey,creationReceiptId:'fake'}};assert.throws(()=>unreadRelationNotices(forged));
 const duplicate=structuredClone(s);duplicate.relationNotices=[...duplicate.relationNotices!,duplicate.relationNotices![0]!];assert.throws(()=>unreadRelationNotices(duplicate),/DUPLICATE/);assert.equal(canonicalJson(s),before);
});
test('unread notices do not stop real games; acknowledging both does not alter first-day results/health/trait evidence',()=>{
 const unread=confirmCareerPreseason(fixture(),fixture().revision);let read=structuredClone(unread);
 for(const n of unreadRelationNotices(read))read=resolveCareerRelationNotice(read,read.revision,{eventKey:n.eventKey,eventVersion:n.eventVersion,command:'OPEN_RELATIONS'}).career;
 const a=playedDay(unread),b=playedDay(read);assert.ok(Object.keys(a.records.games).length>0);assert.equal(unreadRelationNotices(a).length,2);assert.equal(unreadRelationNotices(b).length,0);
 for(const key of ['world','records','health','days','traits','relationships'] as const)assert.deepEqual(a[key],b[key]);
});
test('legacy HS saves catch up once at day close; absence of relations and college worlds creates no fictitious notice',()=>{
 const legacy=confirmCareerPreseason(fixture(),fixture().revision);delete legacy.relationNotices;const result=playedDay(legacy);assert.equal(unreadRelationNotices(result).length,2);assert.deepEqual(queueRelationFormationNotices(result,result.days.days.at(-1)!.day),result.relationNotices);
 const absent=structuredClone(legacy);delete absent.relationships;assert.equal(queueRelationFormationNotices(absent,100),undefined);assert.deepEqual(unreadRelationNotices(absent),[]);
 const college=structuredClone(legacy);college.world.leagueKey='COLLEGE';assert.equal(queueRelationFormationNotices(college,100),undefined);
});
test('notice acknowledgment during a pending task leaves that task and its saved resume untouched',()=>{
 const s=confirmCareerPreseason(fixture(),fixture().revision),n=unreadRelationNotices(s)[0]!;s.phaseContext={phase:'EVENT_DECISION',eventKey:'pending-domain-task',resume:{phase:'SEASON_PROGRESS',nextWorldDay:40,pendingGame:null}};
 const result=resolveCareerRelationNotice(s,s.revision,{eventKey:n.eventKey,eventVersion:1,command:'OPEN_RELATIONS'});assert.deepEqual(result.career.phaseContext,s.phaseContext);assert.deepEqual(result.career.events,s.events);assert.equal(result.career.revision,s.revision+1);
});
test('notice acknowledgment during a real pending game preserves the exact cursor/RNG and resumed game result',()=>{
 const start=confirmCareerPreseason(fixture(),fixture().revision);let pending=start;
 for(let i=0;i<10;i++){pending=advanceHighSchoolCareer(pending,pending.revision,i===0?'ONE_GAME':undefined).career;if(pending.phaseContext.phase==='SEASON_PROGRESS' && pending.phaseContext.pendingGame)break;}
 assert.equal(pending.phaseContext.phase,'SEASON_PROGRESS');if(pending.phaseContext.phase!=='SEASON_PROGRESS')return;assert.ok(pending.phaseContext.pendingGame);
 const n=unreadRelationNotices(pending)[0]!,read=resolveCareerRelationNotice(pending,pending.revision,{eventKey:n.eventKey,eventVersion:1,command:'OPEN_RELATIONS'}).career;
 assert.deepEqual(read.phaseContext,pending.phaseContext);const a=playedDay(pending),b=playedDay(read);for(const key of ['world','records','health','days','traits'] as const)assert.deepEqual(a[key],b[key]);
});
test('approved25-player rule: no eligible rival produces no rival notice or extra NPC, while the teammate notice remains',()=>{
 const before=fixture(true),count=Object.keys(before.world.players).length,s=confirmCareerPreseason(before,before.revision),notices=unreadRelationNotices(s);
 assert.equal(s.relationships!.formation.rival,'NO_CANDIDATE');assert.equal(count,225);assert.equal(Object.keys(s.world.players).length,count);assert.ok(s.world.schools.every(school=>school.roster.length===25));assert.deepEqual(notices.map(n=>n.type),['TEAMMATE']);assert.deepEqual(s.world.players,before.world.players);assert.deepEqual(s.world.rng,before.world.rng);
});
test('acknowledging a notice after sealed year end preserves the valid seal and college activation; corrupt seals never get repaired',()=>{
 const s=completedHighSchoolCareer();s.relationships=formHighSchoolRelations(s.world,Math.min(...s.world.schedule.map(g=>g.worldDay)));const notices=queueRelationFormationNotices(s,s.days.days.at(-1)!.day);assert.ok(notices);s.relationNotices=notices;
 const review=acknowledgeHighSchoolSeasonReview(s,s.revision),opened=openHighSchoolCareerRoute(review,review.revision,1).career,view=highSchoolCareerRouteView(opened),admitted=enrollHighSchoolCollege(opened,opened.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'}),ready=closeHighSchoolSeasonForCollege(admitted,admitted.revision,true),n=unreadRelationNotices(ready)[0]!;
 const input={eventKey:n.eventKey,eventVersion:1,command:'OPEN_RELATIONS'},read=resolveCareerRelationNotice(ready,ready.revision,input).career,a=startAdmittedCollegeSeason(ready,ready.revision),b=startAdmittedCollegeSeason(read,read.revision);
 assert.equal(read.collegeYearEnd!.receiptKey,ready.collegeYearEnd!.receiptKey);for(const key of ['world','records','health','days','phaseContext','seasonGrowth','relationships'] as const)assert.deepEqual(a[key],b[key]);assert.equal(b.world.players.own!.age,19);assert.equal(unreadRelationNotices(b).length,unreadRelationNotices(a).length-1);
 const bad=structuredClone(ready);bad.world.players.own!.fatigue++;assert.throws(()=>resolveCareerRelationNotice(bad,bad.revision,input),/YEAR_END/);
});

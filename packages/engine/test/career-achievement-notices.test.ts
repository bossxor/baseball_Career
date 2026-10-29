import test from 'node:test';
import assert from 'node:assert/strict';
import * as achievements from '../src/career-achievements.js';
import type {AchievementCareer} from '../src/career-achievements.js';
import {enteredKboCareer,completedHighSchoolCareer} from './fixtures.js';
import {activeUsCareer} from './us-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {createWorldEvent} from '../src/events.js';
import {emptyBatting} from '../src/stats.js';
import {assertKboAmateurYearEnd} from '../src/kbo-entry.js';
import {assertUsAmateurYearEnd} from '../src/us-entry.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason,schoolYearEndBasis} from '../src/college-entry.js';

function input(c:AchievementCareer,index=0){const n=c.achievements!.notices[index]!;return {eventKey:n.eventKey,eventVersion:n.version,command:'OPEN_ACHIEVEMENTS' as const};}
function unchangedGameplay(before:AchievementCareer,after:AchievementCareer){
 const expected={...before,revision:after.revision,achievements:{...before.achievements!,notices:after.achievements!.notices}};
 // A valid school seal changes only its revision and basis when notice metadata changes.
 if(!('protagonistKey'in after)&&!('protagonistKey'in expected)){
  if(after.kboYearEnd)expected.kboYearEnd=after.kboYearEnd;if(after.usYearEnd)expected.usYearEnd=after.usYearEnd;if(after.collegeYearEnd)expected.collegeYearEnd=after.collegeYearEnd;
 }
 assert.equal(canonicalJson(after),canonicalJson(expected));
}
/** Controlled international contribution isolates outbox reading, not native tournament evidence. */
function internationalNotice<T extends AchievementCareer>(source:T):T {
 const c=structuredClone(source),key='protagonistKey'in c?c.protagonistKey:c.world.protagonistKey,gameKey='controlled-achievement-notice',line={...emptyBatting(),PA:1,BB:1,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
 c.records.games[gameKey]={gameKey,worldDay:1,scope:{seasonKey:c.world.seasonKey,leagueKey:'AG',phase:'INTERNATIONAL'},teams:{},batting:{[key]:line},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 return achievements.refreshCareerAchievements(c);
}

test('achievement E90 read acknowledges only its outbox notice across school, KBO and US roots with JSON replay',()=>{
 const kbo=enteredKboCareer(),us=activeUsCareer('HITTER');
 for(const c of [kbo,us,kbo.amateurHistory,us.amateurHistory]){
  const raw=canonicalJson(c),command=input(c),result=achievements.resolveCareerAchievementEvent(c,c.revision,command),read=result.career;
  assert.equal(canonicalJson(c),raw);assert.equal(read.revision,c.revision+1);unchangedGameplay(c,read);
  assert.equal(read.achievements!.notices[0]!.status,'RESOLVED');assert.equal(read.achievements!.notices[0]!.version,command.eventVersion+1);
  assert.equal(read.achievements!.notices[0]!.resolution!.command,'OPEN_ACHIEVEMENTS');
  assert.equal(read.achievements!.notices[0]!.resolution!.kind,'NAVIGATE');assert.deepEqual(result.navigation,{targetScreen:'S40',sourceEventKey:command.eventKey});
  assert.deepEqual(result,achievements.resolveCareerAchievementEvent(JSON.parse(raw),c.revision,command));
  assert.throws(()=>achievements.resolveCareerAchievementEvent(read,read.revision,command),/VERSION|RESOLVED/);
  if(!('protagonistKey'in read)){if(read.kboYearEnd)assertKboAmateurYearEnd(read);if(read.usYearEnd)assertUsAmateurYearEnd(read);}
 }
});

test('achievement notice commands enforce root CAS, notice version, ownership and immutable source context',()=>{
 const c=enteredKboCareer(),command=input(c),raw=canonicalJson(c);
 assert.throws(()=>achievements.resolveCareerAchievementEvent(c,c.revision-1,command),/REVISION/);
 assert.throws(()=>achievements.resolveCareerAchievementEvent(c,c.revision,{...command,eventVersion:command.eventVersion+1}),/VERSION/);
 assert.throws(()=>achievements.resolveCareerAchievementEvent(c,c.revision,{...command,command:'ACK_EVENT' as never}),/CHOICE/);
 assert.throws(()=>achievements.resolveCareerAchievementEvent(c,c.revision,{...command,eventKey:c.goals!.notices[0]!.eventKey}),/ACHIEVEMENT_EVENT_NOT_FOUND/);
 for(const rewrite of [
  (s:typeof c)=>{s.achievements!.notices[0]!.resume.sourceRevision=s.revision+1;},
  (s:typeof c)=>{s.achievements!.notices[0]!.resume.competitionKey='MLB';},
  (s:typeof c)=>{s.achievements!.notices[0]!.resume.registrationKey='other';},
  (s:typeof c)=>{s.achievements!.notices[0]!.occurredWorldDay++;},
  (s:typeof c)=>{const n=s.achievements!.notices[0]!;s.achievements!.notices[0]=createWorldEvent({definitionId:n.definitionId,worldKey:n.worldKey,seasonKey:n.seasonKey,resume:n.resume,sourceSequence:n.sourceSequence,worldDay:n.occurredWorldDay,evidence:{...n.evidence,fields:{...n.evidence.fields,stage:'CORRECTED'}}});},
 ]){
  const bad=structuredClone(c);rewrite(bad);const before=canonicalJson(bad);
  assert.throws(()=>achievements.resolveCareerAchievementEvent(bad,bad.revision,input(bad)),/ACHIEVEMENT_EVENT_SOURCE_CHANGED/);assert.equal(canonicalJson(bad),before);
 }
 assert.equal(canonicalJson(c),raw);
});

test('historical completion and correction notices read independently without regranting rewards or restoring their phase',()=>{
 let c=internationalNotice(enteredKboCareer());delete c.records.games['controlled-achievement-notice'];c=achievements.refreshCareerAchievements(c);
 const completed=c.achievements!.notices.findIndex(n=>n.evidence.fields.goalId==='A04'&&n.evidence.fields.stage==='COMPLETED'),corrected=c.achievements!.notices.findIndex(n=>n.evidence.fields.goalId==='A04'&&n.evidence.fields.stage==='CORRECTED');
 assert.ok(completed>=0&&corrected>=0);c.world.seasonKey=String(Number(c.world.seasonKey)+1);
 c.phaseContext={phase:'EVENT_DECISION',eventKey:'pending-task',resume:{phase:'SEASON_PROGRESS',nextWorldDay:8,pendingGame:null}};
 for(const index of [completed,corrected]){const raw=canonicalJson(c),read=achievements.resolveCareerAchievementEvent(c,c.revision,input(c,index)).career;assert.equal(canonicalJson(c),raw);unchangedGameplay(c,read);c=read;}
 assert.equal(c.achievements!.rewards.filter(r=>r.rewardId==='R-A04').length,1);assert.equal(c.achievements!.unlocks.find(u=>u.achievementId==='A04')!.status,'CORRECTED');
});

test('achievement reads validate and rebind all school year-end seals; corrupted roots cannot be repaired by reading',()=>{
 const school=internationalNotice(completedHighSchoolCareer()),review=acknowledgeHighSchoolSeasonReview(school,school.revision),route=openHighSchoolCareerRoute(review,review.revision,1).career,view=highSchoolCareerRouteView(route),admitted=enrollHighSchoolCollege(route,route.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'}),college=closeHighSchoolSeasonForCollege(admitted,admitted.revision,true);
 const roots=[enteredKboCareer().amateurHistory,activeUsCareer('HITTER').amateurHistory,college];
 for(const c of roots){
  const command=input(c),read=achievements.resolveCareerAchievementEvent(c,c.revision,command).career;unchangedGameplay(c,read);
  const oldSeal=c.kboYearEnd??c.usYearEnd??c.collegeYearEnd!,seal=read.kboYearEnd??read.usYearEnd??read.collegeYearEnd!;
  assert.equal(seal.receiptKey,oldSeal.receiptKey);assert.equal(seal.sourceRevision,read.revision);assert.equal(seal.sourceBasis,schoolYearEndBasis(read));
  const bad=structuredClone(c);bad.world.players[bad.world.protagonistKey]!.fatigue++;
  assert.throws(()=>achievements.resolveCareerAchievementEvent(bad,bad.revision,command),/YEAR_END/);
 }
 const read=achievements.resolveCareerAchievementEvent(college,college.revision,input(college)).career;
 const a=startAdmittedCollegeSeason(college,college.revision),b=startAdmittedCollegeSeason(read,read.revision);
 assert.deepEqual(a.world,b.world);assert.deepEqual(a.records,b.records);assert.deepEqual(a.health,b.health);
});

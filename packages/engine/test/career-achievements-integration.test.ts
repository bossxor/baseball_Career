import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer,completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {activeUsCareer} from './us-fixtures.js';
import {careerAchievementsView,refreshCareerAchievements} from '../src/career-achievements.js';
import {refreshCareerSeasonGoals} from '../src/season-goals.js';

test('native KBO and US signing/entry commits carry A01 without requiring season goal selection',()=>{
 for(const c of [enteredKboCareer(),activeUsCareer('HITTER')]){
  const view=careerAchievementsView(c);
  assert.equal(view.achievements.find(a=>a.achievementId==='A01')!.status,'COMPLETED');
  assert.equal(view.rewards.filter(r=>r.rewardId==='R-A01').length,1);
  assert.deepEqual(c.achievements,c.amateurHistory.achievements);
  assert.equal(refreshCareerAchievements(c),c);assert.equal(refreshCareerSeasonGoals(c),c);
  assert.deepEqual(refreshCareerSeasonGoals(JSON.parse(JSON.stringify(c))),c);
 }
});

test('A01 is committed by actual contract acceptance before annual closure or pro activation',()=>{
 const c=completedHighSchoolCareer(800000),review=acknowledgeHighSchoolSeasonReview(c,c.revision),route=openHighSchoolCareerRoute(review,review.revision,1).career,prepared=prepareCareerKboDraft(route,route.revision),draft=resolveCareerKboDraft(prepared,prepared.revision,1);
 const signed=decideCareerKboDraft(draft,draft.revision,{programVersion:2,decision:'SIGN',eventVersion:1});
 assert.equal(signed.phaseContext.phase,'NEXT_SEASON_READY');
 assert.equal(careerAchievementsView(signed).achievements.find(a=>a.achievementId==='A01')!.status,'COMPLETED');
 assert.equal(signed.kboYearEnd,undefined);
});

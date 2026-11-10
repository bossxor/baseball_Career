import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createTestDb, seedAllowedSubject, gameSaves } from '@playball/db';
import { createApp } from '../src/app.js';
import { json } from './json.js';
import { enteredKboCareer } from '../../../packages/engine/test/fixtures.js';
import type { GameContribution } from '@playball/engine';

test('HTTP review uses finalized regular records, correct rate denominators, and hides private state', async () => {
 const { db, client } = await createTestDb(), subject = 'season-review-http';
 try {
  await seedAllowedSubject(db, subject);
  const app = createApp({ db, auth: { allowDevBearer: true } });
  const headers = { Authorization: 'Bearer dev:' + subject, 'Content-Type': 'application/json' };
  const { saveId } = await json<{saveId:string}>(await app.request('/api/game-creations',{
   method:'POST',headers,body:JSON.stringify({creationId:subject,mode:'CAREER'}),
  }));
  for (const kind of ['HITTER','PITCHER'] as const) {
   const c = enteredKboCareer(kind), key = c.protagonistKey, team = c.protagonistClubId;
   const match = {PA:4,AB:3,H:2,BB:1,HBP:0,K:0,TB:5,HR:1,twoB:0,threeB:0,RBI:2};
   const emptyMatch = Object.fromEntries(Object.keys(match).map(k=>[k,0]));
   const split = {BF:4,outs:2,AB:3,H:2,TB:5,HR:1,BB:1,HBP:0,K:0};
   const emptySplit = Object.fromEntries(Object.keys(split).map(k=>[k,0]));
   const batter = kind === 'HITTER' ? key : 'opponent', pitcher = kind === 'PITCHER' ? key : 'opponent';
   const game = {
    gameKey:'official',worldDay:1,
    scope:{seasonKey:c.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},
    teams:{[team]:{games:1,W:1,L:0,T:0,R:3,RA:2}},
    batting:{[batter]:{...match,R:1,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},
    pitching:{[pitcher]:{
     BF:4,outs:2,H:2,HR:1,BB:1,HBP:0,K:0,R:2,ER:2,pitches:12,games:1,starts:1,
     starterOuts:2,loadedBF:0,W:1,L:0,SV:0,HLD:0,BS:0,shutouts:0,
    }},
    batterSplits:{[batter]:{L:emptyMatch,R:match}},
    pitcherSplits:{[pitcher]:{L:emptySplit,R:split}},
    matchups:{[JSON.stringify([batter,pitcher])]:{batterKey:batter,pitcherKey:pitcher,stats:match}},
   } as unknown as GameContribution;
   c.records.games = {official:game}; c.phaseContext = {phase:'SEASON_REVIEW'};
   await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,saveId));
   const res = await app.request(`/api/saves/${saveId}/screens/CAREER_FLOW`,{headers}); assert.equal(res.status,200);
   const view = await json<{seasonReview:{sections:{lines:{label:string;value:string}[]}[]}}>(res);
   const lines = view.seasonReview.sections.flatMap(s=>s.lines), val=(label:string)=>lines.find(x=>x.label===label)?.value;
   if (kind === 'HITTER') {
    assert.equal(val('타율'),'0.667'); assert.equal(val('출루율'),'0.750'); assert.equal(val('장타율'),'1.667');
   } else {
    assert.equal(val('이닝'),'0.2'); assert.equal(val('평균자책점'),'27.000'); assert.equal(val('WHIP'),'4.500');
   }
   assert.doesNotMatch(JSON.stringify(view.seasonReview),/potential|seed|rng|sourceBasis|타구속도/);
   c.phaseContext = {phase:'SEASON_PROGRESS',nextWorldDay:2,pendingGame:{} as never};
   await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,saveId));
   const pending = await json<{seasonReview:null}>(await app.request(`/api/saves/${saveId}/screens/CAREER_FLOW`,{headers}));
   assert.equal(pending.seasonReview,null);
  }
 } finally { await client.close(); }
});

test('school growth distinguishes pending, finalized, and legacy saves', async () => {
 const { completedHighSchoolCareer } = await import('../../../packages/engine/test/fixtures.js');
 const { createSeasonGrowthLedger, finalizeSeasonGrowth } = await import('@playball/engine');
 const { careerSeasonReview } = await import('../src/career-season-review.js');
 const c = completedHighSchoolCareer(10000), key = c.world.protagonistKey;
 const player = c.world.players[key]!, days = c.world.calendar!.growthDays.length;
 c.seasonGrowth = createSeasonGrowthLedger(player,c.world.seasonKey,days);
 c.phaseContext = {phase:'SEASON_REVIEW'};
 const state = {schemaVersion:1,career:c};
 assert.ok(careerSeasonReview(state)?.sections.some(s=>s.title==='현재 능력 변화 (시즌 마감 전)' && s.lines.length===6));
 const finalized = finalizeSeasonGrowth(player,c.seasonGrowth,days);
 c.world.players[key] = finalized.player; c.seasonGrowth = finalized.ledger;
 c.phaseContext = {phase:'CAREER_ROUTE'};
 assert.ok(careerSeasonReview(state)?.sections.some(s=>s.title==='확정 능력 변화' && s.lines.length===6));
 delete c.seasonGrowth;
 assert.equal(careerSeasonReview(state),null);
});

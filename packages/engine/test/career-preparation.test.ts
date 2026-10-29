import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft} from '../src/career-kbo.js';
import {canonicalJson} from '../src/game.js';
import {resolveCareerWindowEvent} from '../src/high-school-progress.js';
import {resolveHiddenTraitNotice} from '../src/trait-notices.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
function undrafted(){let c=completedHighSchoolCareer(10000);c=acknowledgeHighSchoolSeasonReview(c,c.revision);c=openHighSchoolCareerRoute(c,c.revision,1).career;c=prepareCareerKboDraft(c,c.revision);return resolveCareerKboDraft(c,c.revision,1);}
test('actual independent48-game preparation consumes one lifetime season only after native competition/date/growth settlement',async()=>{
 const api=await import('../src/career-preparation.js'),source=undrafted(),raw=canonicalJson(source),started=api.startCareerPreparation(source,source.revision,1);assert.equal(started.world.leagueKey,'INDEPENDENT');assert.equal(started.world.seasonKey,'2030');assert.equal(started.world.players.own!.age,19);assert.equal(started.world.schedule.length,216);assert.equal(started.world.schedule.filter(g=>g.homeTeamKey===started.world.protagonistSchoolId||g.awayTeamKey===started.world.protagonistSchoolId).length,48);assert.equal(started.preparation!.used,0);assert.deepEqual(started.records,source.records);assert.deepEqual(started.achievements,source.achievements);assert.equal(canonicalJson(source),raw);assert.throws(()=>api.settleCareerPreparation(started,started.revision,true),/NOT_COMPLETE|PHASE/);
 assert.equal(started.previousSeasons!.at(-1)!.world.seasonKey,'2029');assert.equal(started.previousSeasons!.at(-1)!.world.leagueKey,undefined);assert.equal(started.previousSeasons!.at(-1)!.seasonGrowth.finalized,true);assert.equal(started.events.find(e=>e.definitionId==='E04')!.status,'RESOLVED');assert.equal(started.events.some(e=>e.status==='OPEN'),false);assert.deepEqual(Object.keys(started.world.players),Object.keys(source.world.players));assert.deepEqual(started.previousSeasons!.at(-1)!.world.players.own!.abilities,source.world.players.own!.abilities);
 let c=api.confirmPreparationPreseason(started,started.revision),resumed=false,trained=false;
 for(let i=0;i<1200&&c.phaseContext.phase!=='SEASON_REVIEW';i++){
  if(c.phaseContext.phase==='EVENT_DECISION'){const e=c.events.find(e=>e.eventKey===(c.phaseContext as {eventKey:string}).eventKey)!;c=e.definitionId==='E84'?resolveHiddenTraitNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'}).career:resolveCareerWindowEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:e.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT'}).career;}
  else {if(!trained&&api.careerPreparationView(c).completedTeamGames>=16&&c.phaseContext.phase==='SEASON_PROGRESS'&&!c.phaseContext.pendingGame){c=api.trainCareerPreparation(c,c.revision,{type:'SKIP'});trained=true;assert.ok(c.development!.trainingUsedSeasons.includes('2030'));assert.throws(()=>api.trainCareerPreparation(c,c.revision,{type:'SKIP'}),/LIMIT_REACHED/);}const out=api.advanceCareerPreparation(c,c.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(!resumed){const replay=api.advanceCareerPreparation(JSON.parse(JSON.stringify(c)) as HighSchoolCareer,c.revision);assert.equal(canonicalJson(out),canonicalJson(replay));resumed=true;}c=out.career;}
 }
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');const games=Object.values(c.records.games).filter(g=>g.scope.leagueKey==='INDEPENDENT'&&g.scope.seasonKey==='2030');assert.equal(games.length,216);assert.equal(games.filter(g=>Object.hasOwn(g.teams,c.world.protagonistSchoolId)).length,48);assert.equal(c.preparation!.used,0);
 const settled=api.settleCareerPreparation(c,c.revision,true);assert.equal(settled.preparation!.used,1);assert.equal(settled.preparation!.seasons.length,1);assert.equal(settled.phaseContext.phase,'CAREER_ROUTE');assert.equal(api.careerPreparationView(settled).remaining,2);assert.equal(settled.seasonGrowth!.finalized,true);assert.ok(settled.health.closedSeasons.includes('2030'));assert.throws(()=>api.settleCareerPreparation(settled,settled.revision,true),/COMPLETE|PHASE/);
 const assessment=prepareCareerKboDraft(settled,settled.revision);assert.notEqual(assessment.kboRecruitment!.program.assessmentKey,source.kboRecruitment!.program.assessmentKey);assert.equal(assessment.previousKboRecruitments!.length,1);assert.equal(assessment.kboRecruitment!.program.input.baseScore,settled.preparationSeason!.result!.baseScore);assert.equal(assessment.kboRecruitment!.world.seasonKey,'2031');assert.deepEqual(assessment.kboRecruitment!.program.input.player,settled.world.players.own);assert.doesNotMatch(JSON.stringify(api.careerPreparationView(settled)),/potential|"seed"|"rng"|sourceBasis/);
});

test('root preparation rejects stale revisions, missing results and forged projected state without changing source',async()=>{
 const api=await import('../src/career-preparation.js'),source=undrafted(),raw=canonicalJson(source);
 assert.throws(()=>api.startCareerPreparation(source,source.revision-1,1),/REVISION/);
 const pending=structuredClone(source);pending.kboRecruitment!.program.result=null;assert.throws(()=>api.startCareerPreparation(pending,pending.revision,1));
 assert.throws(()=>api.startCareerPreparation(source,source.revision,2),/EVENT_VERSION/);
 const started=api.startCareerPreparation(source,source.revision,1),forged=structuredClone(started);forged.world=structuredClone(forged.world);forged.world.players.own!.fatigue=2;
 assert.throws(()=>api.confirmPreparationPreseason(forged,forged.revision),/STALE_CAREER_PREPARATION/);assert.equal(canonicalJson(source),raw);
});

test('root preparation plan/roster commands preserve the native ledger and use the shared root revision',async()=>{
 const api=await import('../src/career-preparation.js'),source=undrafted(),started=api.startCareerPreparation(source,source.revision,1),raw=canonicalJson(started);
 const ownerAdvanced={...structuredClone(started),revision:started.revision+2},player=started.world.players.own!;
 const planned=api.setCareerPreparationPlan(ownerAdvanced,ownerAdvanced.revision,player.focus,player.archetype);
 assert.equal(planned.revision,ownerAdvanced.revision+1);assert.equal(planned.preparationSeason!.revision,planned.revision);assert.equal(planned.retryCareer!.revision,planned.revision);api.assertCareerPreparation(planned);
 const rosters=Object.fromEntries(planned.world.schools.map(t=>[t.id,t.roster])),registered=api.setCareerPreparationRosters(planned,planned.revision,rosters);api.assertCareerPreparation(registered);
 const confirmed=api.confirmPreparationPreseason(registered,registered.revision);api.assertCareerPreparation(confirmed);assert.equal(confirmed.phaseContext.phase,'SEASON_PROGRESS');assert.throws(()=>api.trainCareerPreparation(confirmed,confirmed.revision,{type:'SKIP'}),/WINDOW_CLOSED/);
 const badPhase={...structuredClone(confirmed),phaseContext:{phase:'SEASON_REVIEW' as const}};assert.throws(()=>api.assertCareerPreparation(badPhase),/STALE_CAREER_PREPARATION_PHASE/);assert.equal(canonicalJson(started),raw);
});

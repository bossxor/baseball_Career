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
 let c=api.confirmPreparationPreseason(started,started.revision),resumed=false;
 for(let i=0;i<1200&&c.phaseContext.phase!=='SEASON_REVIEW';i++){
  if(c.phaseContext.phase==='EVENT_DECISION'){const e=c.events.find(e=>e.eventKey===(c.phaseContext as {eventKey:string}).eventKey)!;c=e.definitionId==='E84'?resolveHiddenTraitNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'}).career:resolveCareerWindowEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:e.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT'}).career;}
  else {const out=api.advanceCareerPreparation(c,c.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');if(!resumed){const replay=api.advanceCareerPreparation(JSON.parse(JSON.stringify(c)) as HighSchoolCareer,c.revision);assert.equal(canonicalJson(out),canonicalJson(replay));resumed=true;}c=out.career;}
 }
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');const games=Object.values(c.records.games).filter(g=>g.scope.leagueKey==='INDEPENDENT'&&g.scope.seasonKey==='2030');assert.equal(games.length,216);assert.equal(games.filter(g=>Object.hasOwn(g.teams,c.world.protagonistSchoolId)).length,48);assert.equal(c.preparation!.used,0);
 const settled=api.settleCareerPreparation(c,c.revision,true);assert.equal(settled.preparation!.used,1);assert.equal(settled.preparation!.seasons.length,1);assert.equal(settled.phaseContext.phase,'CAREER_ROUTE');assert.equal(api.careerPreparationView(settled).remaining,2);assert.equal(settled.seasonGrowth!.finalized,true);assert.ok(settled.health.closedSeasons.includes('2030'));assert.throws(()=>api.settleCareerPreparation(settled,settled.revision,true),/COMPLETE|PHASE/);
 const assessment=prepareCareerKboDraft(settled,settled.revision);assert.notEqual(assessment.kboRecruitment!.program.assessmentKey,source.kboRecruitment!.program.assessmentKey);assert.equal(assessment.previousKboRecruitments!.length,1);assert.doesNotMatch(JSON.stringify(api.careerPreparationView(settled)),/potential|"seed"|"rng"|sourceBasis/);
});

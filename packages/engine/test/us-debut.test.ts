import test from 'node:test';
import assert from 'node:assert/strict';
import {usLevelFixture} from './us-level-fixture.js';
import {reviewUsLevel,resolveUsLevelEvent} from '../src/us-levels.js';
import {usCompetitionGameWorld,usGameContext} from '../src/us-season.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame,commitSchoolCompetitionGame} from '../src/high-school-game.js';
import {queueUsMajorDebut,resolveUsMajorDebut} from '../src/us-debut.js';
import {canonicalJson} from '../src/game.js';
import type {UsCareer} from '../src/us-career-entry.js';
function major(){const c=usLevelFixture('AAA',24);if(c.phaseContext.phase!=='SEASON_PROGRESS')throw Error('phase');const offered=reviewUsLevel(c,c.phaseContext.nextWorldDay-1,c.phaseContext)!,e=offered.events.at(-1)!;return resolveUsLevelEvent(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_CALLUP'});}
/** Controlled prior season dates/financial fixture, then one real MLB engine game; not a native complete date or season. */
function actualGame(){const c=major();if(c.phaseContext.phase!=='SEASON_PROGRESS')throw Error('phase');const day=c.phaseContext.nextWorldDay,g=c.seasonSchedule!.leagues.MLB.find(g=>g.worldDay>=day&&(g.homeTeamKey===c.protagonistOrganizationId||g.awayTeamKey===c.protagonistOrganizationId))!;
 const world=usCompetitionGameWorld(c,'MLB',g);let job=prepareSchoolCompetitionGame(world,c.records,g,usGameContext(c,world));for(let i=0;i<100&&job.game.status!=='FINAL';i++)job=advanceHighSchoolGame(job,1000,20);assert.equal(job.game.status,'FINAL');const done=commitSchoolCompetitionGame(world,c.records,job,g);c.records=done.records;
 for(const k of Object.keys(job.game.pitchDevelopment!.players))c.world.repertoires[k]=done.world.repertoires[k]!;
 assert.ok((c.records.games[g.simulationKey]!.batting[c.protagonistKey]?.PA??0)>0);c.season!.firstAppearance.MLB={gameKey:g.simulationKey,day:g.worldDay};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:g.worldDay,pendingGame:null};return {c,key:g.simulationKey};}
test('E65 is absent on accepted callup, then one actual MLB game creates an evidence-bound notice without another salary or XP grant',()=>{
 const called=major(),raw=canonicalJson(called);queueUsMajorDebut(called,'missing');assert.equal(canonicalJson(called),raw);assert.ok(!called.events.some(e=>e.definitionId==='E65'));
 const {c,key}=actualGame(),before=canonicalJson(c),next=structuredClone(c);queueUsMajorDebut(next,key);next.revision++;const notices=next.events.filter(e=>e.definitionId==='E65');assert.equal(notices.length,1);assert.equal(notices[0]!.evidence.fields.promotionDecisionIdOrFirstAppearanceId,key);assert.deepEqual(next.world,c.world);assert.deepEqual(next.income,c.income);assert.deepEqual(next.records,c.records);assert.equal(canonicalJson(c),before);
 const after=canonicalJson(next);queueUsMajorDebut(next,key);assert.equal(canonicalJson(next),after);const e=notices[0]!;assert.throws(()=>resolveUsMajorDebut(next,next.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'ACK_EVENT'}),/VERSION/);
 const ack=resolveUsMajorDebut(next,next.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'});assert.equal(ack.events.find(x=>x.eventKey===e.eventKey)!.status,'RESOLVED');assert.deepEqual(ack.records,next.records);assert.deepEqual(ack.income,next.income);assert.throws(()=>resolveUsMajorDebut(ack,ack.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'ACK_EVENT'}),/ALREADY_RESOLVED/);
 const bad=structuredClone(next);bad.records.games[key]!.batting[bad.protagonistKey]!.PA=0;assert.throws(()=>resolveUsMajorDebut(bad,bad.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'}),/EVIDENCE_CHANGED/);
});
test('E65 ignores zero-PA/zero-BF listings and preserves legacy prior debuts rather than fabricating a second one',()=>{
 const {c,key}=actualGame(),zero=structuredClone(c);zero.records.games[key]!.batting[c.protagonistKey]!.PA=0;queueUsMajorDebut(zero,key);assert.ok(!zero.events.some(e=>e.definitionId==='E65'));
 const row=structuredClone(c.records.games[key]!);row.gameKey='controlled-later-game';row.worldDay++;c.records.games[row.gameKey]=row;queueUsMajorDebut(c,row.gameKey);assert.ok(!c.events.some(e=>e.definitionId==='E65'));
 const hydrated=JSON.parse(JSON.stringify(c)) as UsCareer;queueUsMajorDebut(hydrated,row.gameKey);assert.ok(!hydrated.events.some(e=>e.definitionId==='E65'));
});

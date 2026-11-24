import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {beginKboPreseasonPitchLearning,unreadKboFirstCampNotices,resolveKboFirstCampNotice,confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {canonicalSha256} from '../src/canonical-seal.js';
import type {KboCareer} from '../src/kbo-career-entry.js';

function opening(){
 let c=enteredKboCareer('PITCHER');
 c=beginKboPreseasonPitchLearning(c,c.revision,'P04');
 const notice=unreadKboFirstCampNotices(c)[0]!;
 c=resolveKboFirstCampNotice(c,c.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'KEEP_FOCUS'});
 c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);
 return startKboRegularSeason(c,c.revision);
}

test('KBO date queue preserves fixed command hashes, lexical league order and a learning day close',()=>{
 const initial=opening(),before=canonicalSha256(initial),hashes:string[]=[];
 let c=initial;
 for(let i=0;i<40;i++){
  const result=advanceKboCareer(JSON.parse(JSON.stringify(c)) as KboCareer,c.revision,1);
  if(i<3)hashes.push(canonicalSha256(result));
  c=result.career;
  if(result.daysClosed){hashes.push(canonicalSha256(result));break;}
  assert.equal(result.stopReason,'CHUNK_LIMIT');
 }
 // Captured from the original repeated schedule scans before the date queue reuse.
 assert.deepEqual(hashes,[
  '77f1c1e036c8fc8fa9c91cf2e3519cdcdea44be5325dac013ac2b25be251da94',
  '4495fc03dd91c25f68e3fbe259f1e5c43dd23a841dd95646fdc1149849c26e26',
  'fa3fa344b16defa97a8d9b096c4f62b806d8dd643505d67c2d95d1544d112add',
  '21671e339682500cdbb088c5ffbb557f3d009d734127ede7440bd3eff174d156',
 ]);
 assert.equal(c.days!.days.length,1);
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey);
 assert.equal(games.length,10);
 assert.deepEqual(games.map(g=>g.gameKey),[...games].sort((a,b)=>a.scope.leagueKey===b.scope.leagueKey?(a.gameKey<b.gameKey?-1:1):(a.scope.leagueKey<b.scope.leagueKey?-1:1)).map(g=>g.gameKey));
 assert.ok(c.world.repertoires[c.protagonistKey]!.learning);
 assert.equal(canonicalSha256(initial),before);
});

test('KBO date queue rejects a pending game that moved to a different date or disappeared',()=>{
 const source=opening(),first=advanceKboCareer(source,source.revision).career;
 assert.equal(first.phaseContext.phase,'SEASON_PROGRESS');
 if(first.phaseContext.phase!=='SEASON_PROGRESS'||!first.phaseContext.pendingGame)throw new Error('TEST_PENDING_GAME');
 const before=canonicalSha256(first);
 const stale=structuredClone(first);
 if(stale.phaseContext.phase!=='SEASON_PROGRESS'||!stale.phaseContext.pendingGame)throw new Error('TEST_PENDING_GAME');
 stale.phaseContext.pendingGame.job.worldDay++;
 assert.throws(()=>advanceKboCareer(stale,stale.revision),/PENDING_GAME_CONTEXT_CHANGED/);
 const missing=structuredClone(first);
 if(missing.phaseContext.phase!=='SEASON_PROGRESS'||!missing.phaseContext.pendingGame)throw new Error('TEST_PENDING_GAME');
 missing.phaseContext.pendingGame.job.game.input.simulationKey='missing-scheduled-game';
 assert.throws(()=>advanceKboCareer(missing,missing.revision),/PENDING_GAME_CONTEXT_CHANGED/);
 assert.equal(canonicalSha256(first),before);
});

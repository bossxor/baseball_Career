import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer} from './fixtures.js';
import {advanceCollegeLeagueHost,createCollegeLeagueHost} from '../src/college-national-host.js';
import {canonicalJson} from '../src/game.js';

test('college NPC host starts at the actual school origin and advances only owned league state',()=>{
 const c=enrolledCollegeCareer(),before=canonicalJson(c),host=createCollegeLeagueHost(c,c.revision),school=c.previousSeasons!.find(s=>s.world.leagueKey===undefined)!;
 assert.equal(host.game.world.seasonKey,school.world.seasonKey);
 assert.equal(host.game.world.worldKey,c.world.worldKey);assert.equal(host.game.world.seed,c.world.seed);
 assert.equal(host.game.phase,'PRESEASON_SETUP');assert.deepEqual(host.game.records.games,{});
 const started=advanceCollegeLeagueHost(c,c.revision,host,host.revision,100);
 assert.equal(started.host.game.phase,'SEASON_PROGRESS');assert.equal(started.host.revision,host.revision+1);
 assert.equal(canonicalJson(c),before);assert.equal(host.game.phase,'PRESEASON_SETUP');
 assert.throws(()=>advanceCollegeLeagueHost(c,c.revision,started.host,host.revision,100),/STALE/);
 const foreign=structuredClone(started.host);foreign.ownerPlayerKey='forged';
 assert.throws(()=>advanceCollegeLeagueHost(c,c.revision,foreign,foreign.revision,100),/STALE/);
 assert.throws(()=>createCollegeLeagueHost({...c,previousSeasons:[]},c.revision),/ORIGIN|REGISTRATION/);
});

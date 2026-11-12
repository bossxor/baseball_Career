import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer} from './fixtures.js';
import {advanceCollegeLeagueHost,advanceNpcLeagueHost,createCollegeLeagueHost,npcHostPostseasonEndDay} from '../src/college-national-host.js';
import {canonicalJson} from '../src/game.js';
import {closeKboClubSeason} from '../src/kbo-club-year.js';

test('college NPC host starts at the actual school origin and advances only owned league state',()=>{
 const c=enrolledCollegeCareer(),before=canonicalJson(c),host=createCollegeLeagueHost(c,c.revision),school=c.previousSeasons!.find(s=>s.world.leagueKey===undefined)!;
 assert.equal(host.game.world.seasonKey,school.world.seasonKey);
 assert.equal(host.game.world.worldKey,c.world.worldKey);assert.equal(host.game.world.seed,c.world.seed);
 assert.equal(host.game.phase,'PRESEASON_SETUP');assert.deepEqual({...host.game.records.games},{});
 const started=advanceCollegeLeagueHost(c,c.revision,host,host.revision,100);
 assert.equal(started.host.game.phase,'SEASON_PROGRESS');assert.equal(started.host.revision,host.revision+1);
 assert.equal(canonicalJson(c),before);assert.equal(host.game.phase,'PRESEASON_SETUP');
 assert.throws(()=>advanceCollegeLeagueHost(c,c.revision,started.host,host.revision,100),/STALE/);
 const foreign=structuredClone(started.host);foreign.ownerPlayerKey='forged';
 assert.throws(()=>advanceCollegeLeagueHost(c,c.revision,foreign,foreign.revision,100),/STALE/);
 assert.throws(()=>createCollegeLeagueHost({...c,previousSeasons:[]},c.revision),/ORIGIN|REGISTRATION|SOURCE_CHANGED/);
});

test('college NPC host rolls a closed prior season into the college AG year',()=>{
 const c=enrolledCollegeCareer(),host=createCollegeLeagueHost(c,c.revision);
 const started=advanceCollegeLeagueHost(c,c.revision,host,host.revision,100).host;
 // Controlled review boundary; official games and postseason play are covered by their native workers.
 started.game.phase='SEASON_REVIEW';delete started.game.progress;
 const closed=closeKboClubSeason(started.game,started.revision);
 const source={...started,game:closed,revision:closed.revision};
 const next=advanceCollegeLeagueHost(c,c.revision,source,source.revision,100).host;
 assert.equal(next.game.world.seasonKey,c.world.seasonKey);
 assert.equal(next.game.phase,'PRESEASON_SETUP');
 assert.deepEqual(next.game.seasons?.map(season=>season.seasonKey),[host.game.world.seasonKey]);
 assert.deepEqual(next.game.health.closedSeasons,[host.game.world.seasonKey]);
 assert.deepEqual(next.game.records,source.game.records);
});

test('neutral host postseason target opens native playoffs and rejects a missing final game receipt',()=>{
 const c=enrolledCollegeCareer(),host=createCollegeLeagueHost(c,c.revision);
 const started=advanceCollegeLeagueHost(c,c.revision,host,host.revision,100).host;
 const seasonKey=started.game.world.seasonKey;
 const owner={worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,playerKey:c.world.protagonistKey,difficulty:c.difficulty};
 const review={...started,game:{...started.game,phase:'SEASON_REVIEW' as const,progress:undefined,days:{...started.game.days!,days:[{day:280,evidence:'controlled-review',result:{injured:[],recovered:[]}}]}}};
 const result=advanceNpcLeagueHost(review as never,review.revision,owner,{seasonKey,stopDay:'POSTSEASON_COMPLETE'});
 assert.equal(result.stopReason,'POSTSEASON_STARTED');
 assert.equal(result.host.game.postseasonProgress?.nextWorldDay,281);
 assert.throws(()=>npcHostPostseasonEndDay(result.host),/NATIONAL_PS_END_REQUIRED/);
 const bracket=result.host.game.postseasonProgress!.postseason;
 const forged={...review,game:{...review.game,postseason:{...bracket,championKey:'winner',series:[{...bracket.series[0]!,round:'KOREAN_SERIES' as const,games:[{gameNumber:1,homeTeamKey:'winner',awayTeamKey:'runner-up',winner:'winner'}]}]}}};
 assert.throws(()=>advanceNpcLeagueHost(forged as never,forged.revision,owner,{seasonKey,stopDay:'POSTSEASON_COMPLETE'}),/NATIONAL_PS_END_CHANGED/);
});

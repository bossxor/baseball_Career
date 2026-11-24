import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {canonicalSha256} from '../src/canonical-seal.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {highSchoolGameContext} from '../src/high-school-progress.js';
import {prepareHighSchoolGame,advanceHighSchoolGame} from '../src/high-school-game.js';
import type {GameContribution} from '../src/records.js';

function fixture(count:number){
 const c=completedHighSchoolCareer(),key=c.world.protagonistKey,team=c.world.protagonistSchoolId;
 const cutoff=c.world.schedule.filter(g=>g.homeTeamKey===team||g.awayTeamKey===team)[count-1]!.worldDay;
 c.records.games=Object.fromEntries(Object.entries(c.records.games).filter(([,g])=>g.worldDay<=cutoff));
 const pitcher=c.world.schools.find(s=>s.id===team)!.roster.find(k=>c.world.players[k]!.kind==='PITCHER')!;
 for(const g of Object.values(c.records.games)){
  if(!Object.hasOwn(g.teams,team))continue;
  const hits=g.worldDay%2;
  g.batting[key]={...emptyBatting(),games:1,fieldingGames:1,PA:4,AB:4,H:hits,TB:hits,twoB:0,threeB:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
  const line={PA:4,AB:4,H:hits,TB:hits,HR:0,BB:0,HBP:0,K:0,twoB:0,threeB:0,RBI:0};
  g.batterSplits[key]={L:{...line},R:{...line,PA:0,AB:0,H:0,TB:0}};
  g.pitching[pitcher]={...emptyPitching(),games:1,starts:1,outs:9,starterOuts:9,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};
  const split={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
  g.pitcherSplits[pitcher]={L:{...split},R:{...split,outs:9}};
 }
 const prior=structuredClone(Object.values(c.records.games)[0]!) as GameContribution;
 prior.gameKey='archive-other-year';prior.scope.seasonKey=String(Number(c.world.seasonKey)-1);
 c.records.games[prior.gameKey]=prior;
 const postseason=structuredClone(prior);postseason.gameKey='current-postseason';postseason.scope={seasonKey:c.world.seasonKey,leagueKey:'HS',phase:'POSTSEASON'};
 c.records.games[postseason.gameKey]=postseason;
 c.records.revision=Object.keys(c.records.games).length;
 return c;
}

test('school context preserves fixed review-block and postseason command hashes',()=>{
 // Captured before the aggregation change from the same fixed inputs and native game command.
 const expected:Record<number,{regular:string;postseason:string;command:string}>={
  19:{regular:'e56099736177aaf23ecdc75e7276d6d016d27241fbe62610da81d9b8d88e92cc',postseason:'342ef3a52248593fcb2680d5e92778ce5b8e9e8441c5d59d34dcaa2b5fb227f2',command:'40a5c2235125a5eb3547d899745470a2478331f91ab6c22035b1b0bfda02c73c'},
  20:{regular:'93ff14f49a38f38b969969b755a367d2d665c390c1bbd175219e776ddd17bcdf',postseason:'d05c89dfe358fadaea5274dc26acea127927e9fe43c95207051f3daf1a0abb93',command:'c12a7edb31292e88017299e10692271769d95877f024729fcd2dee2c952ed5e6'},
  39:{regular:'e040c4f500ba6c390a415f0c26fcd262c8c3028ddaaf94212b42e6edc3b114e7',postseason:'29d1f1ab0c5102c965edab7b05f80dfc1e8fcb5fe0162bcff550c8e3623be1f8',command:'ab2632ff6d1737192e64e6cd9d9c7b57b5d8a66dbe98796c909b6d00843a1d8c'},
  40:{regular:'52b8d0bf90743db72e7e2ca9ab20773ee663c4b2311649ed28ec06b31db7f8a2',postseason:'f29116a6f37747bee1b308582e2359ba45291bdcf19de71010a0a017d1a7114c',command:'54984ba430c13ebc0d3701c0ed1cbbe9ea63ef2e24937369c5ef5931a1b5b8a4'},
 };
 for(const count of [19,20,39,40]){
  const c=fixture(count),before=canonicalJson(c),regular=highSchoolGameContext(c),postseason=highSchoolGameContext(c,'POSTSEASON');
  const next=c.world.schedule.find(g=>!Object.hasOwn(c.records.games,g.simulationKey))!;
  const command=advanceHighSchoolGame(prepareHighSchoolGame(c.world,c.records,next.simulationKey,regular),1000,20);
  const hashes={regular:canonicalSha256(regular),postseason:canonicalSha256(postseason),command:canonicalSha256(command)};
  assert.deepEqual(hashes,expected[count]);
  assert.equal(canonicalJson(c),before);
  assert.equal(regular.recentBatting?.[c.world.protagonistKey]?.PA,count<20?undefined:80);
 }
});

test('school context traverses the full archive once for all teams and competitions',()=>{
 const c=fixture(40),expected=highSchoolGameContext(c,'POSTSEASON');
 let scans=0;
 const games=new Proxy(c.records.games,{ownKeys(target){scans++;return Reflect.ownKeys(target);}});
 const result=highSchoolGameContext({...c,records:{...c.records,games}},'POSTSEASON');
 assert.deepEqual(result,expected);assert.equal(scans,1);
});

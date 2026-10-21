import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {starterSeasonEvidence,settleStarterSeasonTraits,createCareerTraitLedger} from '../src/high-school-traits.js';
import type {GameContribution,RecordLedger} from '../src/records.js';

const base=createHighSchoolCareer(createHighSchoolWorld({worldKey:'t16-world',seasonKey:'2030',seed:'t16-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
const pitcherKey=Object.values(base.world.players).find(p=>p.kind==='PITCHER')!.simulationKey;
const pz={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
/** Controlled official contributions: each game gives both teams one game and the pitcher `outs` starter outs. */
function season(seasonKey:string,games:number,outsEach:number,phase:'REGULAR'|'POSTSEASON'='REGULAR',leagueKey='HS'):Record<string,GameContribution> {
 const out:Record<string,GameContribution>={};
 for(let i=0;i<games;i++){
  const gameKey=[seasonKey,leagueKey,phase,i].join(':');
  out[gameKey]={gameKey,worldDay:i+1,scope:{seasonKey,leagueKey,phase},teams:{A:{games:1,W:1,L:0,T:0,R:1,RA:0},B:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},
   pitching:{[pitcherKey]:{BF:outsEach,outs:outsEach,H:0,HR:0,BB:0,HBP:0,K:0,R:0,ER:0,pitches:0,games:1,starts:1,starterOuts:outsEach,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},
   batterSplits:{},pitcherSplits:{[pitcherKey]:{L:{...pz},R:{...pz,BF:outsEach,outs:outsEach}}},matchups:{}};
 }
 return out;
}
const at=(games:Record<string,GameContribution>,seasonKey:string,traits=createCareerTraitLedger()):HighSchoolCareer=>({...base,world:{...base.world,seasonKey},records:{revision:Object.keys(games).length,games} as RecordLedger,traits});

test('3×G boundary uses starter outs only and ignores postseason',()=>{
 assert.equal(starterSeasonEvidence({revision:1,games:season('2030',4,2)},pitcherKey,'2030').qualified,false); // 8 < 12
 assert.deepEqual(starterSeasonEvidence({revision:1,games:season('2030',4,3)},pitcherKey,'2030').evidence,[{leagueKey:'HS',starterOuts:12,teamGames:4}]);
 const withPost={...season('2030',4,2),...season('2030',4,9,'POSTSEASON')};
 assert.equal(starterSeasonEvidence({revision:1,games:withPost},pitcherKey,'2030').qualified,false);
});

test('five consecutive qualified seasons unlock T16 once at the fifth season close',()=>{
 let games:Record<string,GameContribution>={},traits=createCareerTraitLedger();
 for(const year of [2030,2031,2032,2033,2034]){
  games={...games,...season(String(year),4,3)};traits=settleStarterSeasonTraits(at(games,String(year),traits),100);
  assert.equal(traits.starterStreaks![pitcherKey]!.streak,year-2029);
  assert.equal(traits.owned[pitcherKey]?.unlocked.includes('T16')??false,year===2034);
 }
 assert.deepEqual(traits.unlocks.filter(u=>u.traitId==='T16').map(u=>u.seasonKey),['2034']);
 assert.equal(JSON.stringify(settleStarterSeasonTraits(at(games,'2034',traits),100)),JSON.stringify(traits));
 assert.throws(()=>settleStarterSeasonTraits(at(games,'2033',{...traits,settledStarterSeasons:[]}),100),/STARTER_SEASON_OUT_OF_ORDER/);
});

test('a missed season resets the streak and owned T16 survives a later miss',()=>{
 let games:Record<string,GameContribution>={},traits=createCareerTraitLedger();
 const plan:[number,number][]=[[2030,3],[2031,3],[2032,1],[2033,3],[2034,3],[2035,3],[2036,3]];
 for(const [year,outs] of plan){games={...games,...season(String(year),4,outs)};traits=settleStarterSeasonTraits(at(games,String(year),traits),100);}
 assert.equal(traits.starterStreaks![pitcherKey]!.streak,4);
 assert.equal(traits.owned[pitcherKey]?.unlocked.includes('T16')??false,false);
 games={...games,...season('2037',4,3)};traits=settleStarterSeasonTraits(at(games,'2037',traits),100);
 assert.ok(traits.owned[pitcherKey]!.unlocked.includes('T16'));
 games={...games,...season('2038',4,0)};traits=settleStarterSeasonTraits(at(games,'2038',traits),100);
 assert.equal(traits.starterStreaks![pitcherKey]!.streak,0);
 assert.ok(traits.owned[pitcherKey]!.unlocked.includes('T16'));
});

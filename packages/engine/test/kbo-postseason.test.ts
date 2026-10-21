import test from 'node:test';
import assert from 'node:assert/strict';
import {createKboPostseason,nextKboPostseasonGame,recordKboPostseasonGame} from '../src/kbo-postseason.js';
import type {KboPostseason} from '../src/kbo-postseason.js';

const seeds=['S1','S2','S3','S4','S5'];
const play=(s:KboPostseason,winners:readonly string[])=>winners.reduce((x,w)=>recordKboPostseasonGame(x,w),s);

test('wild card: 4th seed starts 1-0 and hosts; one 4th-seed win ends it, the 5th seed needs two',()=>{
 const s=createKboPostseason('2033',seeds);
 assert.deepEqual(nextKboPostseasonGame(s),{round:'WILD_CARD',gameNumber:1,homeTeamKey:'S4',awayTeamKey:'S5'});
 const quick=play(s,['S4']);assert.equal(quick.series.length,2);assert.deepEqual([quick.series[1]!.higherSeed,quick.series[1]!.lowerSeed],['S3','S4']);
 const upset=play(s,['S5','S5']);assert.equal(upset.series[0]!.lowerWins,2);assert.equal(upset.series[1]!.lowerSeed,'S5');
 assert.equal(nextKboPostseasonGame(play(s,['S5']))!.homeTeamKey,'S4');
});

test('best-of 3/5/7 with 2-1, 2-2-1 and 2-2-3 home patterns and a single champion',()=>{
 let s=play(createKboPostseason('2033',seeds),['S4']);
 const homes:string[]=[];
 // Semi playoff S3 vs S4: S4 wins in 3.
 for(const w of ['S3','S4','S4']){homes.push(nextKboPostseasonGame(s)!.homeTeamKey);s=recordKboPostseasonGame(s,w);}
 assert.deepEqual(homes.splice(0),['S3','S3','S4']);
 // Playoff S2 vs S4: goes 5.
 for(const w of ['S2','S4','S2','S4','S2']){homes.push(nextKboPostseasonGame(s)!.homeTeamKey);s=recordKboPostseasonGame(s,w);}
 assert.deepEqual(homes.splice(0),['S2','S2','S4','S4','S2']);
 // Korean series S1 vs S2: goes 7.
 for(const w of ['S1','S2','S1','S2','S1','S2','S2']){homes.push(nextKboPostseasonGame(s)!.homeTeamKey);s=recordKboPostseasonGame(s,w);}
 assert.deepEqual(homes,['S1','S1','S2','S2','S2','S1','S1']);
 assert.equal(s.championKey,'S2');assert.equal(nextKboPostseasonGame(s),null);
 assert.throws(()=>recordKboPostseasonGame(s,'S1'),/POSTSEASON_COMPLETE/);
 assert.deepEqual(s.series.map(x=>x.round),['WILD_CARD','SEMI_PLAYOFF','PLAYOFF','KOREAN_SERIES']);
});

test('invalid seeds or a winner outside the game are rejected',()=>{
 assert.throws(()=>createKboPostseason('2033',['A','B','C','D']),/INVALID_POSTSEASON_SEEDS/);
 assert.throws(()=>createKboPostseason('2033',['A','A','C','D','E']),/INVALID_POSTSEASON_SEEDS/);
 assert.throws(()=>recordKboPostseasonGame(createKboPostseason('2033',seeds),'S1'),/INVALID_POSTSEASON_WINNER/);
});

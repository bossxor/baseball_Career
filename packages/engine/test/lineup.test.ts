import assert from 'node:assert/strict';
import test from 'node:test';
import {automaticFieldLineup,initialPositionFits,recentBattingPerformance,recentPitchingPerformance,lineupCompetition,appearanceFatigue,FIELD_POSITIONS} from '../src/lineup.js';
import type {LineupCandidate} from '../src/lineup.js';
import {createCareerPlayer} from '../src/player.js';
import {seedPcg32} from '../src/rng.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import {abilityKeys} from '@playball/rules';
const hitter=(key:string,position:string):LineupCandidate=>({player:createCareerPlayer({simulationKey:key,name:'가상선수',kind:'HITTER',position,throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:abilityKeys('HITTER').slice(0,4),difficulty:'SECRET_CHEAT'},seedPcg32(42n,54n)).player,available:true,fits:initialPositionFits(position),recent:emptyBatting()});
const roster=()=>[...FIELD_POSITIONS,'DH'].map((p,i)=>hitter('player'+i,p));
test('05/41: automatic field assignment legal, distinct, exact primary fit, stable input ordering',()=>{
 const source=roster(),before=JSON.stringify(source),lineup=automaticFieldLineup(source,60);
 assert.equal(new Set(lineup.lineup).size,9);assert.equal(lineup.fielders.length,8);assert.equal(lineup.fitSum,900);assert.ok(lineup.fielders.every(f=>f.fit===100));
 assert.deepEqual(automaticFieldLineup([...source].reverse(),60),lineup);assert.equal(JSON.stringify(source),before);
});
test('AI global assignment preserves scarce SS utility instead of greedy C theft',()=>{
 const source=roster();source[4]!.fits={...initialPositionFits('C'),SS:100};source[4]!.player.position='C';
 const lineup=automaticFieldLineup(source,60);assert.equal(lineup.fielders.find(f=>f.position==='SS')!.simulationKey,'player4');assert.equal(lineup.fielders.find(f=>f.position==='C')!.simulationKey,'player0');
});
test('01/05: unavailable players, left-handed restrictions, low-fit fallback and insufficient roster errors',()=>{
 const source=roster();source[0]!.available=false;assert.throws(()=>automaticFieldLineup(source));source.push(hitter('replacement','C'));assert.equal(automaticFieldLineup(source).fielders[0]!.simulationKey,'replacement');
 const left=roster();left[4]!.player.throws='L';left[4]!.player.position='CF';left[4]!.fits={...initialPositionFits('SS'),CF:100};
 assert.throws(()=>automaticFieldLineup(left,60));left.push(hitter('right-ss','SS'));assert.notEqual(automaticFieldLineup(left,60).fielders.find(f=>f.position==='SS')!.simulationKey,'player4');
 const backup=roster();backup[6]!.available=false;backup.push(hitter('extra-dh','DH'));assert.throws(()=>automaticFieldLineup(backup,60));assert.equal(automaticFieldLineup(backup).lineup.length,9);
});
test('08: role/performance competition uses minimum PA50/outs30 then exact index',()=>{
 const candidate=hitter('same','C');assert.equal(lineupCompetition(candidate,'C'),50);
 assert.equal(recentBattingPerformance({...emptyBatting(),PA:49,AB:49,H:49,TB:196}),50);
 assert.equal(recentBattingPerformance({...emptyBatting(),PA:50,AB:50,H:30,TB:30}),100);
 assert.equal(recentPitchingPerformance({...emptyPitching(),outs:29,ER:0}),50);assert.equal(recentPitchingPerformance({...emptyPitching(),outs:30,ER:0}),90);
});
test('05: batting order chooses discipline leaders then power core without changing field assignment',()=>{
 const source=roster();for(const [i,key] of [[0,'DISCIPLINE'],[1,'DISCIPLINE'],[2,'POWER'],[3,'POWER'],[4,'POWER']] as const){source[i]!.player.abilities={...source[i]!.player.abilities,[key]:900_000};source[i]!.player.careerPeaks={...source[i]!.player.careerPeaks,[key]:900_000};}
 const result=automaticFieldLineup(source);assert.deepEqual(result.lineup.slice(0,2),['player0','player1']);assert.deepEqual(result.lineup.slice(2,5),['player2','player3','player4']);
});
test('01/41: appearance and rest fatigue use existing 5/-8 and stamina40/15/-10 once, source immutable',()=>{
 const h=hitter('h','CF').player;h.fatigue=98;const before=JSON.stringify(h);assert.equal(appearanceFatigue(h,'HITTER').fatigue,100);assert.equal(appearanceFatigue(h,'NONE').fatigue,90);assert.equal(JSON.stringify(h),before);
 const p=createCareerPlayer({simulationKey:'p',name:'투수',kind:'PITCHER',position:'SP',throws:'R',bats:'R',pitchForm:'OVERHAND',archetype:'BALANCED',focus:abilityKeys('PITCHER').slice(0,4),difficulty:'SECRET_CHEAT'},seedPcg32(42n,54n)).player;
 assert.equal(appearanceFatigue(p,'STARTER').fatigue,40);assert.equal(appearanceFatigue(p,'RELIEF').fatigue,15);p.abilities={...p.abilities,STAMINA:1_000_000};p.careerPeaks={...p.careerPeaks,STAMINA:1_000_000};assert.equal(appearanceFatigue(p,'STARTER').fatigue,34);
 assert.equal(appearanceFatigue({...p,fatigue:5},'NONE').fatigue,0);assert.throws(()=>appearanceFatigue(h,'RELIEF'));assert.throws(()=>appearanceFatigue(p,'HITTER'));
});

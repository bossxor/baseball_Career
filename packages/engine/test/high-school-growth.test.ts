import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import {collectHighSchoolGrowthEvidence} from '../src/high-school-growth.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import type {GameContribution} from '../src/records.js';

// Controlled official/health receipts isolate calendar boundaries without random injury draws.
function fixture(pitcher=false){
 const player=pitcher?{kind:'PITCHER' as const,position:'SP',pitchForm:'OVERHAND' as const,focus:['VELOCITY','COMMAND','STUFF','STAMINA']}:{kind:'HITTER' as const,position:'CF',pitchForm:null,focus:['CONTACT','POWER','DISCIPLINE','DEFENSE']};
 const state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'growth-world',seasonKey:'2032',seed:'growth-fixture',schoolId:'H01',startDay:100,secondaryPitch:'P03',player:{...player,simulationKey:'own',name:'성장선수',throws:'R',bats:'R',archetype:'BALANCED',difficulty:'GROWTH'}}),'GROWTH');
 state.world.schedule=[100,102,105].map((worldDay,i)=>({simulationKey:'g'+i,leagueKey:'HS',seasonKey:'2032',round:i,worldDay,awayTeamKey:'H01',homeTeamKey:'H02'}));
 state.phaseContext={phase:'SEASON_REVIEW'};
 state.planHistory=[state.planHistory[0]!,{completedTeamGames:1,focus:player.focus,archetype:pitcher?'VELOCITY':'SLUGGER'},{completedTeamGames:2,focus:player.focus,archetype:'BALANCED'}];
 for(const [i,game] of state.world.schedule.entries()){
  const count=i===1?0:pitcher?9:4;
  const batting={...emptyBatting(),PA:count,games:1,fieldingGames:1,twoB:0,threeB:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
  const pitching={...emptyPitching(),outs:count,games:1,starts:1,starterOuts:count,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};
  const team={games:1,W:0,L:0,T:1,R:0,RA:0};
  const contribution:GameContribution={gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:'2032',leagueKey:'HS',phase:'REGULAR'},teams:{H01:team,H02:team},batting:!pitcher && count?{own:batting}:{},pitching:pitcher && count?{own:pitching}:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  state.records.games[game.simulationKey]=contribution;
  state.health.games=[...state.health.games,{evidence:{gameKey:game.simulationKey,teamKey:'H01',seasonKey:'2032',day:game.worldDay,roster:['own'],appearances:count?[{playerKey:'own',riskFatigue:0}]:[]},result:{injured:i===0?['own']:[],recovered:i===1?['own']:[]}}];
 }
 state.days.days=Array.from({length:6},(_,i)=>{
  const day=100+i,contributions=Object.values(state.records.games).filter(g=>g.worldDay===day);
  return {day,evidence:canonicalJson({worldKey:'growth-world',seasonKey:'2032',day,contributions}),result:{injured:i===0?['own']:[],recovered:i===2?['own']:[]}};
 });
 return state;
}

test('growth evidence maps plans to the following date, preserves rest/rehab days and pre-training snapshot',()=>{
 const state=fixture(),player=state.world.players.own!;player.abilities={...player.abilities,CONTACT:player.abilities.CONTACT!+10_000};player.careerPeaks={...player.careerPeaks,CONTACT:player.abilities.CONTACT!};
 const before=canonicalJson(state),evidence=collectHighSchoolGrowthEvidence(state);
 assert.deepEqual(evidence.days.map(d=>d.worldDay),[100,101,102,103,104,105]);
 assert.deepEqual(evidence.days.map(d=>d.appearances),[4,0,0,0,0,4]);
 assert.deepEqual(evidence.days.map(d=>d.rehabilitating),[false,true,true,false,false,false]);
 assert.deepEqual(evidence.days.map(d=>d.archetype),['BALANCED','SLUGGER','SLUGGER','BALANCED','BALANCED','BALANCED']);
 assert.equal(evidence.seasonStartPlayer.abilities.CONTACT!+10_000,state.world.players.own!.abilities.CONTACT);
 assert.equal(canonicalJson(collectHighSchoolGrowthEvidence(JSON.parse(JSON.stringify(state)))),canonicalJson(evidence));assert.equal(canonicalJson(state),before);
 evidence.seasonStartPlayer.abilities={};evidence.days[0]!.focus=[];assert.equal(canonicalJson(state),before);
});

test('pitcher evidence uses actual outs, not BF or displayed innings; end-of-season plan pays no previous date',()=>{
 const state=fixture(true);state.planHistory=[...state.planHistory,{completedTeamGames:3,focus:state.planHistory[0]!.focus,archetype:'VELOCITY'}];
 const evidence=collectHighSchoolGrowthEvidence(state);assert.equal(evidence.days.reduce((n,d)=>n+d.appearances,0),18);assert.equal(evidence.days.at(-1)!.archetype,'BALANCED');
});

test('incomplete dates, changed FINAL evidence, missing registration and invalid plan history reject without mutation',()=>{
 const initial=fixture();
 for(const mutate of [
  (s:typeof initial)=>{s.phaseContext={phase:'PRESEASON_SETUP'};},
  (s:typeof initial)=>{s.days.days=s.days.days.slice(1);},
  (s:typeof initial)=>{s.records.games.g0!.batting.own!.PA++;},
  (s:typeof initial)=>{s.health.games[0]!.evidence.roster=[];},
  (s:typeof initial)=>{s.planHistory=s.planHistory.slice(1);},
  (s:typeof initial)=>{s.planHistory=[s.planHistory[0]!,{...s.planHistory[1]!,completedTeamGames:4}];},
  (s:typeof initial)=>{s.health.games[1]!.result.recovered=[];},
  (s:typeof initial)=>{delete s.development;},
 ]){
  const state=structuredClone(initial);mutate(state);const before=canonicalJson(state);assert.throws(()=>collectHighSchoolGrowthEvidence(state));assert.equal(canonicalJson(state),before);
 }
});

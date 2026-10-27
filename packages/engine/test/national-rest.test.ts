import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {openKboNationalSelection} from '../src/kbo-national-selection.js';
import {koreaNationalTeam} from '../src/national-tournament.js';
import {emptyPitching} from '../src/stats.js';
import {canonicalJson} from '../src/game.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {NationalSelectionSnapshot} from '../src/national-selection.js';
function selected(){const c=enteredKboCareer(),next=openKboNationalSelection(c,c.revision,'AG');return {c:next,s:next.national!.selections![0]!};}
/** Controlled complete-shaped usage rows, not actual played seasons. BF1/outs0 is an appearance. */
function usage(c:KboCareer,key:string,day:number,bf=1,season=c.world.seasonKey):KboCareer {
 const gameKey=JSON.stringify(['rest-fixture',key,day,season]);
 return {...c,records:{revision:c.records.revision+1,games:{...c.records.games,[gameKey]:{gameKey,worldDay:day,scope:{seasonKey:season,leagueKey:'KBO',phase:'REGULAR'},teams:{A:{games:1,W:1,L:0,T:0,R:1,RA:0},B:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{[key]:{...emptyPitching(),BF:bf,BB:bf,pitches:4*bf,games:1,starts:0,starterOuts:0,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{},pitcherSplits:{},matchups:{}}}}};
}
function team(c:KboCareer,s:NationalSelectionSnapshot,day:number){return koreaNationalTeam(c,s,0,new Map(),day);}
test('national SP rests three full world days after an actual BF, including domestic use, without changing legacy projection or source',()=>{
 const {c,s}=selected(),key=s.roster.slots.find(r=>r.role==='SP')!.playerKey;
 for(const last of [97,98,99]){const used=usage(c,key,last),raw=canonicalJson(used),out=team(used,s,100);assert.equal(out.pitchers.find(p=>p.simulationKey===key)!.available,false);assert.notEqual(out.pitchers[0]!.simulationKey,key);assert.equal(canonicalJson(used),raw);}
 for(const used of [usage(c,key,96),usage(c,key,100),usage(c,key,101),usage(c,key,99,0),usage(c,key,99,1,String(Number(c.world.seasonKey)-1))])assert.equal(team(used,s,100).pitchers[0]!.simulationKey,key);
 assert.equal(koreaNationalTeam(usage(c,key,99),s,0,new Map()).pitchers[0]!.simulationKey,key);
});
test('national RP and CP rest only after consecutive world-day BF appearances; bench, gap and future rows give no extra rest',()=>{
 const {c,s}=selected();for(const role of ['RP','CP'] as const){const key=s.roster.slots.find(r=>r.role===role)!.playerKey;
  assert.equal(team(usage(usage(c,key,98),key,99),s,100).pitchers.find(p=>p.simulationKey===key)!.available,false);
  for(const used of [usage(c,key,99),usage(usage(c,key,97),key,99),usage(usage(c,key,98),key,99,0),usage(usage(c,key,99),key,100)])assert.equal(team(used,s,100).pitchers.find(p=>p.simulationKey===key)!.available,true);
 }
});
test('a rested RP opener keeps permanent position; exhausted or fatigued starting choices reject without partial writes',()=>{
 const {c,s}=selected();let used=c;for(const slot of s.roster.slots.filter(r=>r.role==='SP'))used=usage(used,slot.playerKey,99);
 const firstRp=s.roster.slots.find(r=>r.role==='RP')!.playerKey;used=usage(usage(used,firstRp,98),firstRp,99);const raw=canonicalJson(used),out=team(used,s,100),opener=out.pitchers[0]!;assert.equal(opener.role,'SP');assert.notEqual(opener.simulationKey,firstRp);assert.equal(used.world.players[opener.simulationKey]!.position,'RP');assert.equal(canonicalJson(used),raw);
 const tired=structuredClone(used);for(const slot of s.roster.slots.filter(r=>r.role==='RP'))tired.world.players[slot.playerKey]!.fatigue=60;const before=canonicalJson(tired);assert.throws(()=>team(tired,s,100),/NATIONAL_STARTER_REQUIRED/);assert.equal(canonicalJson(tired),before);
 const legacy=structuredClone(tired);for(const slot of s.roster.slots.filter(r=>r.role==='SP'))legacy.world.players[slot.playerKey]!.fatigue=60;assert.equal(koreaNationalTeam(legacy,s,0,new Map()).pitchers[0]!.simulationKey,firstRp);assert.throws(()=>team(c,s,-1),/INVALID_NATIONAL_GAME_DAY/);
});

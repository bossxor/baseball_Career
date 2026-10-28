import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {canonicalJson} from '../src/game.js';
import {emptyRecordLedger} from '../src/records.js';
import {assertNationalSelectionSnapshot,chooseNationalRoster,createNationalSelection} from '../src/national-selection.js';
import type {NationalCandidate} from '../src/national-selection.js';
import {replaceNationalInjuryWithEmergency} from '../src/national-injury-replacement.js';

function fixture(){
 const c=stagedKboOffseason(0),records=emptyRecordLedger();
 const candidates:NationalCandidate[]=Object.values(c.world.players).map(player=>({player,nationalTeamId:'KOR',league:'KBO',injured:false,retired:false,nationalReleaseAllowed:true,service:'NONE',militaryUnresolved:true,recentTopLeagueRecord:false}));
 const input={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,tournament:'WBC' as const,candidates,records};
 const full=createNationalSelection(input),keys=new Set(full.roster.slots.map(s=>s.playerKey)),scores=full.scores.filter(s=>keys.has(s.playerKey));
 const selection={...full,scores,roster:chooseNationalRoster(scores)};
 for(const candidate of candidates)if(!keys.has(candidate.player.simulationKey))candidate.league='FUTURES';
 const injured=selection.roster.slots.find(s=>s.role==='C')!.playerKey;
 return {...input,selection,full,injured};
}

test('injury emergency admits existing healthy lower-league players, seals a separate lottery and preserves original scores',()=>{
 const input=fixture(),unavailable=new Set([input.injured]),raw=canonicalJson(input),next=replaceNationalInjuryWithEmergency(input,input.injured,unavailable);
 assert.equal(canonicalJson(input),raw);assert.deepEqual(next.scores.slice(0,input.selection.scores.length),input.selection.scores);
 assert.equal(next.roster.slots.length,28);assert.equal(next.emergencyAdmissions!.length,1);assert.equal(next.emergencyAdmissions![0]!.beforeReplacement,0);
 const replacement=next.replacements[0]!.to,actual=input.candidates.find(c=>c.player.simulationKey===replacement)!;
 assert.equal(actual.league,'FUTURES');assert.equal(actual.player.position,'C');assert.equal(actual.nationalTeamId,'KOR');
 const emergencyScore=next.scores.find(s=>s.playerKey===replacement)!,normalScore=input.full.scores.find(s=>s.playerKey===replacement)!;
 assert.deepEqual({...emergencyScore,lotRank:normalScore.lotRank},normalScore);
 assert.ok(next.scores.slice(input.selection.scores.length).every(s=>s.lotRank>Math.max(...input.selection.scores.map(s=>s.lotRank))));
 for(const slot of input.selection.roster.slots.filter(s=>s.playerKey!==input.injured))assert.ok(next.roster.slots.some(s=>s.playerKey===slot.playerKey&&s.role===slot.role));
 assert.deepEqual(replaceNationalInjuryWithEmergency({...input,candidates:[...input.candidates].reverse()},input.injured,unavailable),next);
 assertNationalSelectionSnapshot(JSON.parse(canonicalJson(next)));
});

test('sealed candidates are used before emergency admission and legacy snapshots still replay unchanged',()=>{
 const input=fixture(),selection=input.full,raw=canonicalJson(selection);
 assertNationalSelectionSnapshot(selection);assert.equal(canonicalJson(selection),raw);assert.equal(Object.hasOwn(selection,'emergencyAdmissions'),false);
 const next=replaceNationalInjuryWithEmergency({...input,selection,candidates:[]},input.injured,new Set([input.injured]));
 assert.equal(next.emergencyAdmissions,undefined);assert.deepEqual(next.scores,selection.scores);assertNationalSelectionSnapshot(next);
});

test('later injuries reuse the sealed emergency pool without rescoring, reranking or creating another admission batch',()=>{
 const input=fixture(),first=replaceNationalInjuryWithEmergency(input,input.injured,new Set([input.injured])),other=input.selection.roster.slots.find(s=>s.role==='C'&&s.playerKey!==input.injured)!.playerKey;
 const next=replaceNationalInjuryWithEmergency({...input,selection:first,candidates:[],records:{...input.records,revision:input.records.revision+1}},other,new Set([input.injured,other]));
 assert.deepEqual(next.scores,first.scores);assert.deepEqual(next.emergencyAdmissions,first.emergencyAdmissions);assert.equal(next.replacements.length,2);
 assertNationalSelectionSnapshot(JSON.parse(canonicalJson(next)));
});

test('emergency eligibility excludes foreign, injured, retired, active/sports service and refused releases without inferring nationality',()=>{
 const input=fixture(),eligible=input.candidates.filter(c=>c.league==='FUTURES'),blocked=eligible.slice(0,6);
 Object.assign(blocked[0]!,{nationalTeamId:'USA'});Object.assign(blocked[1]!,{injured:true});Object.assign(blocked[2]!,{retired:true});
 Object.assign(blocked[3]!,{service:'ACTIVE'});Object.assign(blocked[4]!,{service:'SPORTS'});Object.assign(blocked[5]!,{nationalReleaseAllowed:false});
 const next=replaceNationalInjuryWithEmergency(input,input.injured,new Set([input.injured]));
 for(const candidate of blocked)assert.ok(!next.scores.some(s=>s.playerKey===candidate.player.simulationKey));
 const missing=structuredClone(input);missing.candidates.find(c=>c.league==='FUTURES')!.nationalTeamId=undefined as unknown as string;
 assert.throws(()=>replaceNationalInjuryWithEmergency(missing,missing.injured,new Set([missing.injured])),/INVALID_NATIONAL_CANDIDATE/);
});

test('impossible emergency roles and foreign-world inputs fail without modifying the source',()=>{
 const input=fixture(),unavailable=new Set([input.injured]),bad={...input,candidates:input.candidates.filter(c=>c.league==='KBO'||c.player.position!=='C')},raw=canonicalJson(bad);
 assert.throws(()=>replaceNationalInjuryWithEmergency(bad,input.injured,unavailable),/NATIONAL_ROSTER_IMPOSSIBLE/);assert.equal(canonicalJson(bad),raw);
 assert.throws(()=>replaceNationalInjuryWithEmergency({...input,worldKey:'another-world'},input.injured,unavailable),/NATIONAL_EMERGENCY_WORLD_MISMATCH/);
 assert.throws(()=>replaceNationalInjuryWithEmergency(input,input.injured,new Set()),/NATIONAL_INJURY_EVIDENCE_REQUIRED/);
});

test('saved emergency admission rejects altered replacement timing, reused ranks and admission disguised as decline',()=>{
 const input=fixture(),next=replaceNationalInjuryWithEmergency(input,input.injured,new Set([input.injured]));
 for(const alter of [
  (s:typeof next)=>{s.emergencyAdmissions![0]!.beforeReplacement=1;},
  (s:typeof next)=>{s.scores.find(row=>row.playerKey===s.emergencyAdmissions![0]!.playerKeys[0])!.lotRank=s.scores[0]!.lotRank;},
  (s:typeof next)=>{s.replacements[0]!.reason='DECLINED';},
  (s:typeof next)=>{s.emergencyAdmissions![0]!.sourceRecordRevision=-1;},
 ]){const bad=structuredClone(next);alter(bad);assert.throws(()=>assertNationalSelectionSnapshot(bad),/INVALID_NATIONAL_EMERGENCY/);}
});

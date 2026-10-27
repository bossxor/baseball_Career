import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {chooseNationalRoster,nationalCandidateEligible} from '../src/national-selection.js';
import type {NationalCandidateScore,NationalCandidate} from '../src/national-selection.js';
import {canonicalJson} from '../src/game.js';
function candidates():NationalCandidateScore[]{const s=stagedKboOffseason(0);return Object.values(s.world.players).map((p,i)=>({playerKey:p.simulationKey,name:p.name,kind:p.kind,position:p.position,throws:p.throws,stamina:(p.abilities.STAMINA??0)/10000,composure:(p.abilities.COMPOSURE??0)/10000,score:60,sample:0,lotRank:i}));}
test('national roster has exactly28 unique players, required hitter slots and5/7/1 pitchers without changing identities',()=>{
 const rows=candidates(),raw=canonicalJson(rows),r=chooseNationalRoster(rows);assert.equal(r.slots.length,28);assert.equal(new Set(r.slots.map(s=>s.playerKey)).size,28);
 const count=(role:string)=>r.slots.filter(s=>s.role===role).length;assert.equal(count('C'),2);assert.equal(count('UTIL'),5);assert.equal(count('SP'),5);assert.equal(count('RP'),7);assert.equal(count('CP'),1);assert.equal(canonicalJson(rows),raw);assert.deepEqual(chooseNationalRoster([...rows].reverse()),r);
 for(const keys of Object.values(r.reserves)){assert.ok(keys!.length<=3);assert.ok(keys!.every(k=>!r.slots.some(s=>s.playerKey===k)));}
});
test('national eligibility distinguishes AG, recent top-league evidence, military status, injury and contract refusal',()=>{
 const player=Object.values(stagedKboOffseason(0).world.players)[0]!,c:NationalCandidate={player,nationalTeamId:'KOR',league:'KBO',injured:false,retired:false,nationalReleaseAllowed:true,service:'NONE',militaryUnresolved:true,recentTopLeagueRecord:true};assert.equal(nationalCandidateEligible(c,'WBC'),true);assert.equal(nationalCandidateEligible({...c,league:'AAA',recentTopLeagueRecord:false},'WBC'),false);assert.equal(nationalCandidateEligible({...c,league:'AAA',recentTopLeagueRecord:false},'AG'),true);
 for(const patch of [{injured:true},{retired:true},{nationalReleaseAllowed:false},{service:'ACTIVE' as const},{nationalTeamId:'JPN'}])assert.equal(nationalCandidateEligible({...c,...patch},'AG'),false);
 assert.equal(nationalCandidateEligible({...c,service:'SPORTS'},'AG'),true);assert.equal(nationalCandidateEligible({...c,service:'SPORTS'},'OLY'),false);
});
test('missing roles fail atomically, CP fallback uses remaining RP composure and duplicate candidates are rejected',()=>{
 const rows=candidates(),raw=canonicalJson(rows),withoutCatchers=rows.filter(s=>s.position!=='C');assert.throws(()=>chooseNationalRoster(withoutCatchers),/ROSTER_IMPOSSIBLE/);assert.equal(canonicalJson(rows),raw);assert.throws(()=>chooseNationalRoster([...rows,rows[0]!]),/INVALID_NATIONAL_SCORES/);
 const noCP=rows.filter(s=>s.position!=='CP'),r=chooseNationalRoster(noCP),cp=r.slots.find(s=>s.role==='CP')!,best=noCP.filter(s=>s.position==='RP').sort((a,b)=>b.composure-a.composure||a.lotRank-b.lotRank)[0]!;assert.equal(cp.playerKey,best.playerKey);assert.equal(best.position,'RP');
});

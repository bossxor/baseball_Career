import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {nationalUsCandidates} from '../src/national-us-candidates.js';
import {createNationalSelection,nationalCandidateEligible} from '../src/national-selection.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
import type {GameContribution} from '../src/records.js';

/** Adapter-only US source: no claims about US signing, game simulation or persistence validity. */
function sources(){
 const kbo=enteredKboCareer(),key='verified-us-own',player={...structuredClone(kbo.world.players[kbo.protagonistKey]!),simulationKey:key},amateurHistory=structuredClone(kbo.amateurHistory),old=amateurHistory.world.protagonistKey;
 amateurHistory.world.protagonistKey=key;amateurHistory.world.players={[key]:structuredClone(player)};amateurHistory.world.schools=amateurHistory.world.schools.map(s=>({...s,roster:s.roster.map(k=>k===old?key:k)}));
 const us={mode:'US_CAREER',revision:1,protagonistKey:key,protagonistOrganizationId:'US01',world:{worldKey:kbo.world.worldKey,seasonKey:kbo.world.seasonKey,seed:kbo.world.seed,players:{[key]:player,npc:{...player,simulationKey:'npc'}},organizations:[{id:'US01',levels:{MLB:[key],AAA:[],AA:[],A:[],ROOKIE:[]}}]},registration:{playerKey:key,clubId:'US01',seasonKey:kbo.world.seasonKey,status:'ACTIVE',level:'MLB'},contract:{seasonKey:kbo.world.seasonKey,status:'ACTIVE',nationalReleaseAllowed:true},military:{status:'UNRESOLVED'},phaseContext:{phase:'PRESEASON_SETUP'},health:{injuries:{}},amateurHistory,records:structuredClone(kbo.records)} as unknown as UsCareer;
 return {worldKey:kbo.world.worldKey,seasonKey:kbo.world.seasonKey,kbo,kboRevision:kbo.revision,us,usRevision:us.revision,recordProjectionRevision:Math.max(kbo.records.revision,us.records.revision)};
}
function contribution(key:string,playerKey:string,seasonKey:string):GameContribution{
 return {gameKey:key,worldDay:1,scope:{seasonKey,leagueKey:'MLB',phase:'REGULAR'},teams:{},batting:{[playerKey]:{...emptyBatting(),PA:50,AB:50,H:25,TB:25,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
}

test('common selection receives KBO plus verified US protagonist, uses actual MLB records and leaves both roots unchanged',()=>{
 const input=sources(),key=input.us.protagonistKey;input.us.records.games.us=contribution('us',key,input.seasonKey);input.us.records.revision++;input.recordProjectionRevision++;
 const raw=canonicalJson(input),projection=nationalUsCandidates(input),selection=createNationalSelection({...projection,tournament:'AG'});
 assert.equal(projection.candidates.length,Object.keys(input.kbo.world.players).length+1);assert.ok(!projection.candidates.some(c=>c.player.simulationKey==='npc'));
 assert.equal(selection.scores.find(s=>s.playerKey===key)!.performanceLeague,'MLB');assert.equal(selection.scores.find(s=>s.playerKey===key)!.sample,50);assert.equal(selection.sourceRecordRevision,input.recordProjectionRevision);assert.equal(canonicalJson(input),raw);
 projection.candidates.at(-1)!.player.name='isolated';projection.records.games.us!.worldDay=2;assert.equal(canonicalJson(input),raw);
});

test('US candidate reads current release, injury, military and retirement facts through existing eligibility rules',()=>{
 const input=sources(),own=()=>nationalUsCandidates(input).candidates.find(c=>c.player.simulationKey===input.us.protagonistKey)!;
 assert.equal(nationalCandidateEligible(own(),'WBC'),true);Object.assign(input.us.world.players[input.us.protagonistKey]!,{nationalTeamId:'USA'});assert.equal(nationalCandidateEligible(own(),'AG'),false);Object.assign(input.us.world.players[input.us.protagonistKey]!,{nationalTeamId:'KOR'});input.us.contract.nationalReleaseAllowed=false;assert.equal(nationalCandidateEligible(own(),'AG'),false);input.us.contract.nationalReleaseAllowed=true;
 input.us.registration.status='INJURED';input.us.world.organizations[0]!.levels.MLB=[];input.us.world.reserves={US01:[input.us.protagonistKey]};assert.equal(nationalCandidateEligible(own(),'AG'),false);input.us.registration.status='ACTIVE';input.us.world.organizations[0]!.levels.MLB=[input.us.protagonistKey];
 input.us.military.status='FROZEN_SERVICE';assert.equal(own().service,'ACTIVE');assert.equal(nationalCandidateEligible(own(),'AG'),false);input.us.military.status='COMPLETED';assert.equal(own().militaryUnresolved,false);
 input.us.phaseContext={phase:'ARCHIVED'};assert.equal(nationalCandidateEligible(own(),'AG'),false);
});

test('foreign or stale roots, origin mismatch, duplicate owners and record conflicts fail without overwrites',()=>{
 const input=sources(),raw=canonicalJson(input);assert.throws(()=>nationalUsCandidates({...input,usRevision:0}),/STALE_NATIONAL/);assert.throws(()=>nationalUsCandidates({...input,seasonKey:'2099'}),/WORLD_MISMATCH/);
 const foreign=structuredClone(input);foreign.us.world.worldKey+='foreign';assert.throws(()=>nationalUsCandidates(foreign),/WORLD_MISMATCH/);
 const origin=structuredClone(input);origin.us.amateurHistory.world.protagonistKey='foreign';assert.throws(()=>nationalUsCandidates(origin),/ORIGIN_MISMATCH/);
 const duplicate=structuredClone(input);duplicate.kbo.world.players[input.us.protagonistKey]=structuredClone(input.us.world.players[input.us.protagonistKey]!);assert.throws(()=>nationalUsCandidates(duplicate),/PLAYER_SOURCE_CONFLICT/);
 const conflict=structuredClone(input),gameKey=Object.keys(conflict.kbo.records.games)[0]!;conflict.us.records.games[gameKey]!.worldDay++;assert.throws(()=>nationalUsCandidates(conflict),/RECORD_SOURCE_CONFLICT/);assert.equal(canonicalJson(input),raw);
 const projection=nationalUsCandidates(input);assert.equal(Object.keys(projection.records.games).length,Object.keys(input.kbo.records.games).length);assert.throws(()=>nationalUsCandidates({...input,recordProjectionRevision:-1}),/RECORD_PROJECTION/);
});

test('unverified origin is excluded; a same-world Korean school archive can prove college graduate origin',()=>{
 const input=sources(),history=input.us.amateurHistory,school=structuredClone(history.world);history.world.leagueKey='COLLEGE';history.previousSeasons=[];
 assert.ok(!nationalUsCandidates(input).candidates.some(c=>c.player.simulationKey===input.us.protagonistKey));
 history.previousSeasons=[{world:school} as NonNullable<typeof history.previousSeasons>[number]];
 assert.ok(nationalUsCandidates(input).candidates.some(c=>c.player.simulationKey===input.us.protagonistKey));
 school.worldKey='foreign';assert.ok(!nationalUsCandidates(input).candidates.some(c=>c.player.simulationKey===input.us.protagonistKey));
});

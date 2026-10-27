import {playAsianGamesTournament} from '../src/national-tournament.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {kboNationalCandidates,openKboNationalSelection,kboNationalSelectionView} from '../src/kbo-national-selection.js';
import {createNationalSelection,assertNationalSelectionSnapshot} from '../src/national-selection.js';
import type {NationalLeague} from '../src/national-selection.js';
import {resolveKboNationalEvent} from '../src/kbo-national.js';
import {canonicalJson} from '../src/game.js';
import {emptyRecordLedger} from '../src/records.js';
import type {RecordLedger,GameContribution} from '../src/records.js';
import {emptyBatting} from '../src/stats.js';
function batting(ledger:RecordLedger,key:string,league:NationalLeague,year:string,PA:number,H:number,phase:GameContribution['scope']['phase']='REGULAR'){
 const gameKey=JSON.stringify(['controlled-national-sample',key,league,year,phase]),line={PA,AB:PA,H,BB:0,HBP:0,K:0,TB:H,HR:0,twoB:0,threeB:0,RBI:0},zero={...line,PA:0,AB:0,H:0,TB:0};ledger.games[gameKey]={gameKey,worldDay:1,scope:{seasonKey:year,leagueKey:league,phase},teams:{},batting:{[key]:{...emptyBatting(),...line,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},batterSplits:{[key]:{L:zero,R:line}},pitcherSplits:{},matchups:{}};ledger.revision++;
}
function scoreInput(){const c=enteredKboCareer(),candidates=kboNationalCandidates(c);return {worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,tournament:'AG' as const,candidates,records:emptyRecordLedger()};}
test('national source U: adequate current highest league wins, insufficient49PA is ignored, prior is fallback and WBC ignores current',()=>{
 const input=scoreInput(),key=input.candidates.find(c=>c.player.kind==='HITTER')!.player.simulationKey,year=input.seasonKey,previous=String(Number(year)-1);
 batting(input.records,key,'MLB',year,49,30);batting(input.records,key,'AAA',year,50,20);batting(input.records,key,'MLB',previous,100,50);
 let s=createNationalSelection(input),row=s.scores.find(s=>s.playerKey===key)!;assert.equal(row.performanceLeague,'AAA');assert.equal(row.performanceSeason,year);assert.equal(row.sample,50);
 batting(input.records,key,'KBO',year,50,10);s=createNationalSelection(input);assert.equal(s.scores.find(s=>s.playerKey===key)!.performanceLeague,'KBO');
 batting(input.records,key,'MLB',year,50,25);s=createNationalSelection(input);row=s.scores.find(s=>s.playerKey===key)!;assert.equal(row.performanceLeague,'MLB');assert.equal(row.sample,50);
 const wbc=createNationalSelection({...input,tournament:'WBC'}).scores.find(s=>s.playerKey===key)!;assert.equal(wbc.performanceLeague,'MLB');assert.equal(wbc.performanceSeason,previous);assert.equal(wbc.militaryBonus,0);
 assertNationalSelectionSnapshot(s);
});
test('national evaluations exclude international/PS lines, apply AG bonus only and never use hidden potential',()=>{
 const input=scoreInput(),key=input.candidates.find(c=>c.player.kind==='HITTER')!.player.simulationKey;batting(input.records,key,'MLB',input.seasonKey,200,100,'INTERNATIONAL');batting(input.records,key,'KBO',input.seasonKey,200,100,'POSTSEASON');
 const s=createNationalSelection(input),row=s.scores.find(s=>s.playerKey===key)!;assert.equal(row.sample,0);assert.equal(row.performanceIndex,50);assert.equal(row.performanceLeague,null);assert.equal(row.militaryBonus,3);
 const changed=structuredClone(input);for(const c of changed.candidates)c.player.potential=Object.fromEntries(abilityKeys(c.player.kind).map(k=>[k,1000000]));assert.deepEqual(createNationalSelection(changed),s);assert.deepEqual(createNationalSelection({...input,candidates:[...input.candidates].reverse()}),s);
});
test('actual sealed28-roster absence triggers E45; repeated opening preserves the snapshot even when records change',()=>{
 const c=enteredKboCareer(),p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,350000]));const raw=canonicalJson(c),opened=openKboNationalSelection(c,c.revision,'AG'),e=opened.events.find(e=>e.definitionId==='E45')!;assert.ok(e);assert.equal(canonicalJson(c),raw);assert.equal(opened.national!.selections![0]!.roster.slots.length,28);
 const ack=resolveKboNationalEvent(opened,opened.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'}).career;assert.deepEqual(ack.world,opened.world);assert.deepEqual(ack.records,opened.records);
 const old=canonicalJson(ack.national!.selections);batting(ack.records,c.protagonistKey,'KBO',c.world.seasonKey,200,100);const reopened=openKboNationalSelection(ack,ack.revision,'AG');assert.equal(canonicalJson(reopened.national!.selections),old);assert.equal(reopened.revision,ack.revision);
 const view=kboNationalSelectionView(reopened,'AG')!;assert.equal(view.protagonist!.selected,false);assert.doesNotMatch(JSON.stringify(view),/potential|abilities|lotRank|rng|seed|sourceRecordRevision/);
});
test('selected protagonist decline replaces only one slot with the next sealed eligible candidate and cannot reroll back in',()=>{
 const c=enteredKboCareer(),p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1000000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};const selected=openKboNationalSelection(c,c.revision,'AG'),snapshot=selected.national!.selections![0]!,e=selected.events.find(e=>e.definitionId==='E44')!;assert.ok(e);const raw=canonicalJson(selected);
 const declined=resolveKboNationalEvent(selected,selected.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'DECLINE_NATIONAL'}).career,next=declined.national!.selections![0]!;assert.equal(canonicalJson(selected),raw);assert.equal(next.roster.slots.length,28);assert.ok(!next.roster.slots.some(s=>s.playerKey===c.protagonistKey));assert.equal(next.replacements.length,1);
 for(const slot of snapshot.roster.slots.filter(s=>s.playerKey!==c.protagonistKey))assert.ok(next.roster.slots.some(s=>s.playerKey===slot.playerKey&&s.role===slot.role));assertNationalSelectionSnapshot(next);assert.deepEqual(openKboNationalSelection(declined,declined.revision,'AG').national!.selections,declined.national!.selections);
});

test('selected actual28 roster supplies Korean game identities; registered bench players are not fabricated appearances',()=>{
 const c=enteredKboCareer(),p=c.world.players[c.protagonistKey]!;p.abilities=Object.fromEntries(abilityKeys(p.kind).map(k=>[k,1000000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};const selected=openKboNationalSelection(c,c.revision,'AG'),e=selected.events.find(e=>e.definitionId==='E44')!,accepted=resolveKboNationalEvent(selected,selected.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'ACCEPT_NATIONAL'}).career,raw=canonicalJson(accepted),done=playAsianGamesTournament(accepted,accepted.revision),keys=new Set(accepted.national!.selections![0]!.roster.slots.map(s=>s.playerKey));
 const games=done.national!.competitions[0]!.gameKeys!.map(k=>done.records.games[k]!).filter(g=>Object.hasOwn(g.teams,'KOR'));assert.ok(games.length>=3);assert.equal(keys.size,28);
 for(const g of games){for(const key of Object.keys(g.batting).filter(k=>Object.hasOwn(c.world.players,k)))assert.ok(keys.has(key));for(const key of Object.keys(g.pitching).filter(k=>Object.hasOwn(c.world.players,k)))assert.ok(keys.has(key));assert.ok(!Object.keys(g.batting).some(k=>/^KOR-h/.test(k)));}
 assert.ok(games.some(g=>(g.batting[c.protagonistKey]?.PA??0)>0));assert.equal(canonicalJson(accepted),raw);assert.equal(done.national!.competitions[0]!.officialAppearance,true);
});
test('national pitcher sample uses30 actual outs, applies the selected league adjustment and rejects invalid counters atomically',()=>{
 const input=scoreInput(),p=input.candidates.find(c=>c.player.kind==='PITCHER')!.player,key=p.simulationKey,gameKey='controlled-pitching-sample';
 const split={BF:40,outs:30,AB:40,H:10,TB:10,HR:0,BB:0,HBP:0,K:10},zero={...split,BF:0,outs:0,AB:0,H:0,TB:0,K:0};input.records.games[gameKey]={gameKey,worldDay:1,scope:{seasonKey:input.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{},batting:{},pitching:{[key]:{BF:40,outs:30,H:10,HR:0,BB:0,HBP:0,K:10,R:3,ER:3,pitches:100,games:1,starts:1,starterOuts:30,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{},pitcherSplits:{[key]:{L:zero,R:split}},matchups:{}};
 const raw=canonicalJson(input),s=createNationalSelection(input),row=s.scores.find(r=>r.playerKey===key)!;assert.equal(row.sample,30);assert.equal(row.performanceLeague,'FUTURES');assert.ok(Math.abs(row.performanceIndex-51)<1e-10);assert.equal(canonicalJson(input),raw);
 input.records.games[gameKey]!.pitching[key]!.outs=-1;const bad=canonicalJson(input);assert.throws(()=>createNationalSelection(input),/INVALID_NATIONAL_SAMPLE/);assert.equal(canonicalJson(input),bad);
});

test('canonical sorted-key save restores the same selection; a foreign-world snapshot with identical player IDs is rejected',()=>{
 const c=enteredKboCareer(),opened=openKboNationalSelection(c,c.revision,'AG'),restored=JSON.parse(canonicalJson(opened)) as KboCareer;assert.deepEqual(kboNationalSelectionView(restored,'AG'),kboNationalSelectionView(opened,'AG'));assert.equal(canonicalJson(openKboNationalSelection(restored,restored.revision,'AG')),canonicalJson(opened));
 const bad=structuredClone(opened),s=bad.national!.selections![0]!;s.worldKey='another-world';s.selectionId=JSON.stringify(['national-selection',s.worldKey,s.seasonKey,s.tournament]);assert.throws(()=>kboNationalSelectionView(bad,'AG'),/INVALID_NATIONAL_SELECTION/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {overall} from '@playball/rules';
import {assertKboFreeAgentPool,nextKboFreeAgentYear,replenishKboFreeAgents,settleKboFreeAgentSeason,kboFreeAgentListView} from '../src/kbo-free-agents.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {canonicalJson} from '../src/game.js';
const input={worldKey:'fa-world',seed:'fa-seed',seasonKey:'2030',difficulty:'GROWTH' as const,registeredKeys:['contracted']};
const create=()=>nextKboFreeAgentYear(input);

test('15: initial FA floor80 is fixed low-OVR independent supply, no contract/club assignment or own-cheat potential',()=>{
 const pool=create(),keys=Object.keys(pool.players);assert.equal(keys.length,80);assertKboFreeAgentPool(JSON.parse(JSON.stringify(pool)),input.registeredKeys);assert.deepEqual(create(),pool);
 for(const e of Object.values(pool.players)){const p=e.player,o=overall(p.kind,p.abilities),value=o.sumUnits/o.denominator;assert.ok(value>=35 && value<=50);assert.ok(p.age>=22 && p.age<=30);assert.equal(e.origin,'INDEPENDENT');assert.equal(e.previousClubId,null);assert.equal(e.previousContract,null);if(e.repertoire)assert.equal(e.repertoire.seasonId,'2030');}
 const cheat=nextKboFreeAgentYear({...input,difficulty:'SECRET_CHEAT'});assert.deepEqual(cheat,pool);assert.ok(Object.values(cheat.players).some(e=>Object.values(e.player.potential).some(v=>v<1_000_000)));
});

test('a real deficit creates only missing players; same source repeats same batch and never reuses signed identities',()=>{
 const pool=create(),before=canonicalJson(pool);assert.deepEqual(replenishKboFreeAgents(pool,input),pool);assert.equal(canonicalJson(pool),before);
 const chosen=Object.keys(pool.players).slice(0,3),reduced=structuredClone(pool);for(const k of chosen)delete reduced.players[k];const args={...input,registeredKeys:[...input.registeredKeys,...chosen]},filled=replenishKboFreeAgents(reduced,args);assert.equal(Object.keys(filled.players).length,80);assert.equal(filled.supplies.length,2);assert.equal(filled.supplies[1]!.playerKeys.length,3);assert.ok(chosen.every(k=>!Object.hasOwn(filled.players,k)));assert.deepEqual(replenishKboFreeAgents(reduced,args),filled);for(const k of Object.keys(reduced.players))assert.deepEqual(filled.players[k],reduced.players[k]);
});

test('FA year end pays no-appearance growth/aging once; year carry preserves identities, peaks/P/books and age45 retirement',()=>{
 const pool=create(),key=Object.keys(pool.players)[0]!,pitcher=Object.keys(pool.players).find(k=>pool.players[k]!.repertoire)!;pool.players[key]!.player.age=45;
 const before=canonicalJson(pool),closed=settleKboFreeAgentSeason(pool,createSeasonCalendar(2030),'GROWTH');assert.equal(canonicalJson(pool),before);assert.deepEqual(settleKboFreeAgentSeason(closed,createSeasonCalendar(2030),'GROWTH'),closed);assert.equal(closed.players[key]!.player.age,45);assert.ok(closed.settlement!.players[key]!.agingLossUnits>0);
 const hard=settleKboFreeAgentSeason(pool,createSeasonCalendar(2030),'REALISTIC');assert.ok(hard.settlement!.players[pitcher]!.budgetUnits>closed.settlement!.players[pitcher]!.budgetUnits);
 const next=nextKboFreeAgentYear({...input,seasonKey:'2031',source:JSON.parse(JSON.stringify(closed))});assert.equal(Object.keys(next.players).length,80);assert.equal(next.retired.length,1);assert.equal(next.retired[0]!.player.simulationKey,key);assert.equal(Object.hasOwn(next.players,key),false);assert.equal(next.supplies.at(-1)!.playerKeys.length,1);assert.equal(next.settlement,undefined);
 for(const [k,e] of Object.entries(closed.players)){if(k===key)continue;assert.equal(next.players[k]!.player.age,e.player.age+1);assert.deepEqual(next.players[k]!.player.abilities,e.player.abilities);assert.deepEqual(next.players[k]!.player.potential,e.player.potential);assert.deepEqual(next.players[k]!.player.careerPeaks,e.player.careerPeaks);}
 assert.deepEqual(next.players[pitcher]!.repertoire!.book,closed.players[pitcher]!.repertoire!.book);assert.equal(next.players[pitcher]!.repertoire!.seasonId,'2031');assert.equal(next.players[pitcher]!.repertoire!.ledger.actualBudgetSpentUnits,0);assert.deepEqual(nextKboFreeAgentYear({...input,seasonKey:'2031',source:closed}),next);
});

test('wrong season/world, overlapping ownership, bad books and skipped close reject instead of recreating the pool',()=>{
 const pool=create(),key=Object.keys(pool.players)[0]!;assert.throws(()=>assertKboFreeAgentPool(pool,[key]));assert.throws(()=>nextKboFreeAgentYear({...input,seasonKey:'2031',source:pool}),/YEAR_NOT_READY/);assert.throws(()=>settleKboFreeAgentSeason(pool,createSeasonCalendar(2031),'GROWTH'),/CALENDAR/);
 const closed=settleKboFreeAgentSeason(pool,createSeasonCalendar(2030),'GROWTH');assert.throws(()=>replenishKboFreeAgents(closed,input),/ALREADY_CLOSED/);assert.throws(()=>nextKboFreeAgentYear({...input,worldKey:'other',seasonKey:'2031',source:closed}),/YEAR_NOT_READY/);
 const bad=structuredClone(pool),p=Object.values(bad.players).find(e=>e.repertoire)!;p.repertoire!.seasonId='2029';assert.throws(()=>assertKboFreeAgentPool(bad),/REPERTOIRE/);
 const collision=JSON.stringify(['kbo-fa',input.worldKey,input.seasonKey,0]);assert.throws(()=>nextKboFreeAgentYear({...input,registeredKeys:[collision]}),/SUPPLY_CONFLICT/);
});

test('public FA list is read-only and contains only identity/overall/former club; no hidden P, seed or private book',()=>{
 const pool=create(),before=canonicalJson(pool),list=kboFreeAgentListView(pool);assert.equal(list.length,80);assert.deepEqual(Object.keys(list[0]!).sort(),['playerKey','name','age','kind','position','overall','previousClubId'].sort());assert.equal(canonicalJson(pool),before);
});

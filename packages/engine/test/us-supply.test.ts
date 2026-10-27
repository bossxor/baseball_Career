import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {preparedUsCareer} from './us-fixtures.js';
import {retireAndSupplyUsNpcs} from '../src/us-supply.js';
import {canonicalJson} from '../src/game.js';
import {assertActiveUsRosterWorld} from '../src/us-career-entry.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
const digest=(x:unknown)=>createHash('sha256').update(canonicalJson(x)).digest('hex');
test('retirement vacancies promote existing organization players; all new identities stay in Rookie and old abilities survive',()=>{
 const c=preparedUsCareer(),org=c.world.organizations.find(o=>o.id!==c.protagonistOrganizationId)!,keys=[org.levels.MLB.find(k=>c.world.players[k]!.position==='C')!,org.levels.AAA.find(k=>c.world.players[k]!.kind==='PITCHER')!];for(const k of keys)c.world.players[k]!.age=45;
 const before=digest(c.world),a=structuredClone(c.world),b=structuredClone(c.world),target=String(Number(c.world.seasonKey)+1),ra=retireAndSupplyUsNpcs(a,keys,target,c.protagonistKey),rb=retireAndSupplyUsNpcs(b,[...keys].reverse(),target,c.protagonistKey);
 assert.equal(digest(c.world),before);assert.deepEqual(ra,rb);assert.equal(digest(a),digest(b));assert.equal(ra.retired.length,2);assert.equal(ra.arrivals.length,2);assert.ok(ra.moves.length>=4);assert.equal(Object.keys(a.players).length,Object.keys(c.world.players).length);assert.ok(keys.every(k=>!a.players[k]));
 for(const m of ra.moves){assert.equal(m.organizationId,org.id);assert.ok(Object.hasOwn(c.world.players,m.playerKey));assert.deepEqual(a.players[m.playerKey],c.world.players[m.playerKey]);assert.ok(!ra.arrivals.some(p=>p.playerKey===m.playerKey));}
 for(const p of ra.arrivals){assert.equal(p.level,'ROOKIE');assert.ok(a.organizations.find(o=>o.id===org.id)!.levels.ROOKIE.includes(p.playerKey));const player=a.players[p.playerKey]!,score=Object.values(player.abilities).reduce((a,b)=>a+b,0)/60000;assert.ok(score>=27&&score<=43);assert.ok(player.age>=18&&player.age<=22);if(player.position==='C')assert.equal(player.throws,'R');}
 a.seasonKey=target;a.calendar=createSeasonCalendar(Number(target));for(const book of Object.values(a.repertoires))book.seasonId=target;assertActiveUsRosterWorld(a);assert.equal(a.organizations.find(o=>o.id===org.id)!.levels.MLB.length,26);
});
test('reserve retirement creates no unnecessary rookie or RNG draws, and cheat does not give NPCs potential100',()=>{
 const c=preparedUsCareer(),world=structuredClone(c.world),org=world.organizations[0]!,template=org.levels.ROOKIE.find(k=>world.players[k]!.kind==='HITTER')!,key='controlled-old-reserve';world.players[key]={...structuredClone(world.players[template]!),simulationKey:key,age:45};world.reserves={[org.id]:[key]};const rng=structuredClone(world.rng),out=retireAndSupplyUsNpcs(world,[key],'2031',c.protagonistKey);assert.equal(out.arrivals.length,0);assert.equal(out.moves.length,0);assert.deepEqual(world.rng,rng);assert.equal(out.retired[0]!.level,'RESERVE');
 const cheat=structuredClone(c.world);cheat.difficulty='SECRET_CHEAT';const retire=cheat.organizations[0]!.levels.MLB.find(k=>cheat.players[k]!.kind==='HITTER')!;cheat.players[retire]!.age=45;const supplied=retireAndSupplyUsNpcs(cheat,[retire],'2031',c.protagonistKey);assert.ok(supplied.arrivals.some(a=>Object.values(cheat.players[a.playerKey]!.potential).some(p=>p<1000000)));
});
test('supply rejects my player, invalid retirement ages and impossible existing promotion instead of fabricating MLB entrants',()=>{
 const c=preparedUsCareer(),world=structuredClone(c.world),key=world.organizations[0]!.levels.MLB[0]!;assert.throws(()=>retireAndSupplyUsNpcs(world,[key],'2031',c.protagonistKey),/INVALID_US_RETIREMENT/);assert.throws(()=>retireAndSupplyUsNpcs(world,[c.protagonistKey],'2031',c.protagonistKey),/INVALID_US_RETIREMENT/);
 const org=world.organizations.find(o=>o.id!==c.protagonistOrganizationId)!,all=Object.values(org.levels).flat().filter(k=>world.players[k]!.kind==='PITCHER');for(const k of all)world.players[k]!.age=45;const before=digest(world);assert.throws(()=>retireAndSupplyUsNpcs(structuredClone(world),all,'2031',c.protagonistKey),/US_EXISTING_PROMOTION_REQUIRED/);assert.equal(digest(world),before);
});

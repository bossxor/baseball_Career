import {retireAndSupplyUsNpcs} from '../src/us-supply.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {preparedUsCareer} from './us-fixtures.js';
import {moveToOffer} from '../src/us-minor-market.js';
import {assertActiveUsRosterWorld} from '../src/us-career-entry.js';

for(const kind of ['HITTER','PITCHER'] as const)test(kind+' MLB offer moves an actual registered NPC, promotes internally and supplies only Rookie; reserve swap preserves population',()=>{
 const c=preparedUsCareer(),world=structuredClone(c.world),from=world.organizations[0]!,to=world.organizations[1]!,key=from.levels.MLB.find(k=>world.players[k]!.kind===kind)!,p=world.players[key]!,other=to.levels.MLB.find(k=>world.players[k]!.kind===p.kind&&world.players[k]!.position===p.position)!;
 const count=Object.keys(world.players).length,old=structuredClone(world.players),books=structuredClone(world.repertoires),rng=structuredClone(c.world.rng);
 assert.equal(moveToOffer(world,key,'MLB',from.id,{organizationId:to.id,competitorKey:other},String(Number(world.seasonKey)+1)),other);
 assert.ok(to.levels.MLB.includes(key));assert.ok(!from.levels.MLB.includes(key));assert.ok(world.reserves![to.id]!.includes(other));assert.equal(from.levels.MLB.length,26);assert.equal(to.levels.MLB.length,26);
 assert.equal(Object.keys(world.players).length,count+1);for(const k of Object.keys(old)){assert.deepEqual(world.players[k],old[k]);assert.deepEqual(world.repertoires[k],books[k]);}
 const born=Object.keys(world.players).find(k=>!old[k])!;assert.ok(from.levels.ROOKIE.includes(born));assertActiveUsRosterWorld(world);assert.deepEqual(c.world.rng,rng);
 assert.equal(moveToOffer(world,other,'MLB',to.id,{organizationId:to.id,competitorKey:key},String(Number(world.seasonKey)+1)),key);
 assert.ok(to.levels.MLB.includes(other));assert.ok(world.reserves![to.id]!.includes(key));assert.equal(Object.keys(world.players).length,count+1);assertActiveUsRosterWorld(world);
});

test('offer vacancy and same-year Rookie retirement cannot allocate the same rookie identity',()=>{
 const c=preparedUsCareer(),world=structuredClone(c.world),from=world.organizations[0]!,to=world.organizations[1]!,key=from.levels.MLB.find(k=>world.players[k]!.kind==='HITTER')!,p=world.players[key]!,other=to.levels.MLB.find(k=>world.players[k]!.kind===p.kind&&world.players[k]!.position===p.position)!,retiring=from.levels.ROOKIE.find(k=>world.players[k]!.kind==='HITTER'&&world.players[k]!.position==='CF')!,target=String(Number(world.seasonKey)+1);
 world.players[retiring]!.age=45;moveToOffer(world,key,'MLB',from.id,{organizationId:to.id,competitorKey:other},target);const supplied=retireAndSupplyUsNpcs(world,[retiring],target,key);assert.equal(supplied.arrivals.length,1);assert.equal(new Set(Object.keys(world.players)).size,Object.keys(world.players).length);
});

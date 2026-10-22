import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {draftKboRookieClass} from '../src/kbo-supply.js';
import {canonicalJson} from '../src/game.js';

test('AI rookie draft fills a missing primary shortstop before covered hitter positions; generation and retry stay fixed',()=>{
 const x=stagedKboOffseason(0),club=x.world.clubs[0]!,removed=club.roster.filter(k=>x.world.players[k]!.position==='SS');assert.ok(removed.length>0);
 for(const k of removed){delete x.world.players[k];delete x.world.contracts[k];delete x.world.repertoires[k];}club.roster=club.roster.filter(k=>!removed.includes(k));club.firstTeam=club.firstTeam.filter(k=>!removed.includes(k));club.reservedSalaryWon=club.roster.reduce((n,k)=>n+x.world.contracts[k]!.annualSalaryWon,0);
 const before=canonicalJson(x.world),order=x.world.clubs.map(c=>c.id),d=draftKboRookieClass(x.world,'2031',order,'GROWTH'),pick=d.picks.find(p=>p.clubId===club.id && p.round===1)!;assert.ok(pick);assert.equal(x.world.players[pick.playerKey]!.position,'SS');assert.equal(d.classKeys.length,100);assert.ok(x.world.clubs.every(c=>c.roster.length<=60));
 const restored=JSON.parse(before),again=draftKboRookieClass(restored,'2031',order,'GROWTH');assert.deepEqual(again,d);assert.equal(canonicalJson(restored),canonicalJson(x.world));
});

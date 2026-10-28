import test from 'node:test';
import assert from 'node:assert/strict';
import * as season from '../src/us-season.js';
import {closedUsMajorFixture} from './us-major-fixture.js';
import {chooseUsMilitaryPlan,startUsMilitaryServiceSeason} from '../src/us-military-plan.js';
import {canonicalJson} from '../src/game.js';

test('service world runs actual NPC opening games with zero own appearances or salary and blocks ordinary play',()=>{
 assert.equal(typeof season.startUsMilitaryWorld,'function');assert.equal(typeof season.advanceUsMilitaryWorld,'function');
 const source=closedUsMajorFixture();source.world.players[source.protagonistKey]!.age=27;source.military={status:'UNRESOLVED',deadlineAge:28};
 const chosen=chooseUsMilitaryPlan(source,source.revision,'TERMINATE'),ready=startUsMilitaryServiceSeason(chosen,chosen.revision),raw=canonicalJson(ready);
 let c=season.startUsMilitaryWorld(ready,ready.revision);assert.equal(canonicalJson(ready),raw);assert.throws(()=>season.advanceUsCareer(c,c.revision),/MILITARY_CONTRACT_NOT_PLAYABLE/);
 const initial=canonicalJson(c),probe=season.advanceUsMilitaryWorld(c,c.revision);assert.ok(canonicalJson(c)===initial,"native service command changed its source root");c=probe.career;
 const first=Math.min(...Object.values(c.seasonSchedule!.leagues).flat().map(g=>g.worldDay));for(let i=0;i<600&&(c.season!.days.at(-1)?.day??-1)<first;i++){const before=canonicalJson(c),out=season.advanceUsMilitaryWorld(c,c.revision);assert.ok(canonicalJson(c)===before,'closed military day mutated its source');assert.notEqual(out.stopReason,'ENGINE_LIMIT');assert.notEqual(out.stopReason,'ROSTER_DECISION_REQUIRED');c=out.career;}
 assert.equal(c.season!.days.at(-1)!.day,first);assert.equal(Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey).length,75);assert.equal(c.military.service!.cursor!.worldDay,first);assert.equal(c.season!.paidUsd,0);assert.ok(!c.health.games.some(g=>g.evidence.seasonKey===c.world.seasonKey&&g.evidence.roster.includes(c.protagonistKey)));assert.ok(!Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey).some(g=>g.batting[c.protagonistKey]||g.pitching[c.protagonistKey]));
 assert.deepEqual(season.usSeasonView(JSON.parse(JSON.stringify(c))),season.usSeasonView(c));assert.ok(canonicalJson(season.advanceUsMilitaryWorld(JSON.parse(JSON.stringify(c)),c.revision))===canonicalJson(season.advanceUsMilitaryWorld(c,c.revision)),'JSON resume changed actual next chunk');
 console.log('Native military opening:',JSON.stringify({year:c.world.seasonKey,nativeNpcGames:75,ownAppearances:0,salaryUsd:c.season!.paidUsd,closedDays:c.season!.days.length}));
});

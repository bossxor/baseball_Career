import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {finishedUsCareerFixture as finished} from './us-finished-fixture.js';
import {preparedUsCareer} from './us-fixtures.js';
import {requestUsRetirement,resolveUsRetirement,retireUsAtMaxAge} from '../src/us-retirement.js';
import {usRetirementArchiveView} from '../src/us-archive-view.js';
import {usCareerView} from '../src/us-career-entry.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {canonicalJson} from '../src/game.js';
import type {UsCareer} from '../src/us-career-entry.js';
const digest=(c:unknown)=>createHash('sha256').update(canonicalJson(c)).digest('hex');
function choose(c:UsCareer,command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'){
 const e=c.events.at(-1)!;return resolveUsRetirement(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command});
}

test('US retirement confirmation/cancellation preserves source, all league records, income and contract without another payment',()=>{
 const c=finished(),before=digest(c),open=requestUsRetirement(c,c.revision);assert.equal(digest(c),before);assert.equal(open.events.at(-1)!.definitionId,'E36');
 const cancelled=choose(open,'CANCEL_RETIRE');assert.equal(cancelled.phaseContext.phase,'SEASON_REVIEW');assert.equal(cancelled.retirement,undefined);assert.deepEqual(cancelled.income,c.income);
 const frozen=digest(open),retired=choose(open,'CONFIRM_RETIRE');assert.equal(digest(open),frozen);assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.events.at(-1)!.definitionId,'E37');assert.equal(retired.retirement!.reason,'VOLUNTARY');
 assert.equal(retired.records,c.records);assert.equal(retired.world,c.world);assert.deepEqual(retired.income,c.income);assert.deepEqual(retired.inventory,c.inventory);assert.deepEqual(retired.contract,c.contract);
 assert.deepEqual(choose(JSON.parse(JSON.stringify(open)),'CONFIRM_RETIRE'),retired);assert.throws(()=>choose(retired,'CONFIRM_RETIRE'),/RETIREMENT_EVENT/);
 assert.throws(()=>startNextUsMinorSeason(retired,retired.revision,retired.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),/NOT_READY/);
});

test('US archive separates school/minor/MLB and zero MLB debut, returns public six-stat peaks without hidden state',()=>{
 const source=finished(),key=source.protagonistKey,school=Object.values(source.records.games).find(g=>g.scope.seasonKey!==source.world.seasonKey)!,minor=Object.values(source.records.games).find(g=>g.scope.leagueKey===source.registration.level&&Object.hasOwn(g.batting,key))!;
 // The school fixture otherwise contains no individual contributions; add one controlled strikeout-only line.
 school.batting[key]=structuredClone(minor.batting[key]!);school.batterSplits[key]=structuredClone(minor.batterSplits[key]!);
 const c=choose(requestUsRetirement(source,source.revision),'CONFIRM_RETIRE'),before=digest(c),view=usRetirementArchiveView(c);
 assert.equal(digest(c),before);assert.equal(view.player.abilities.length,6);assert.ok(view.records.some(r=>r.leagueKey===c.registration.level));assert.ok(view.records.some(r=>r.leagueKey==='MLB'&&r.phase==='REGULAR'&&r.record.games===0));
 assert.ok(view.records.some(r=>r.leagueKey!=='MLB'&&r.leagueKey!==c.registration.level));assert.equal(c.season!.firstAppearance.MLB,undefined);
 const serialized=JSON.stringify(view);for(const field of ['potential','rng','amateurHistory','openingPlayers','inventory'])assert.ok(!serialized.includes('"'+field+'"'));
 assert.deepEqual(usRetirementArchiveView(JSON.parse(JSON.stringify(c))),view);assert.equal(view.retirement.endedContractKey,c.contract.contractKey);
 const bad=structuredClone(c);bad.retirement!.age++;assert.throws(()=>usCareerView(bad),/INVALID_US_RETIREMENT/);const forged=finished();forged.retirement=c.retirement!;assert.throws(()=>usCareerView(forged),/INVALID_US_RETIREMENT/);
});

test('US maximum-age retirement closes at45 with unresolved overseas deadline preserved, not erased or treated as exemption',()=>{
 const young=finished();assert.throws(()=>retireUsAtMaxAge(young,young.revision),/NOT_AVAILABLE/);const c=finished();c.world.players[c.protagonistKey]!.age=45;const before=digest(c),retired=retireUsAtMaxAge(c,c.revision);
 assert.equal(digest(c),before);assert.equal(retired.retirement!.reason,'MAX_AGE');assert.equal(usRetirementArchiveView(retired).retirement.age,45);assert.deepEqual(retired.military,c.military);assert.equal(retired.military.status,'UNRESOLVED');
});

test('US retirement rejects unfinished seasons, stale/version mismatch and changed final evidence atomically',()=>{
 const early=preparedUsCareer();assert.throws(()=>requestUsRetirement(early,early.revision),/NOT_AVAILABLE/);const c=finished(),raw=digest(c);assert.throws(()=>requestUsRetirement(c,c.revision-1),/REVISION/);assert.equal(digest(c),raw);
 const open=requestUsRetirement(c,c.revision),e=open.events.at(-1)!,before=digest(open);assert.throws(()=>resolveUsRetirement(open,open.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'CONFIRM_RETIRE'}),/VERSION/);assert.equal(digest(open),before);
 const changed=finished(),g=Object.values(changed.records.games).find(g=>g.scope.phase==='POSTSEASON')!;g.teams[Object.keys(g.teams)[0]!]!.R++;const altered=digest(changed);assert.throws(()=>requestUsRetirement(changed,changed.revision),/EVIDENCE/);assert.equal(digest(changed),altered);
});

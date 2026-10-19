// Design contracts, not actual adaptation counters or fast-play execution.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),read=n=>fs.readFileSync(path.join(root,n),'utf8'),json=n=>JSON.parse(read(n));
const mid=json('midcareer-experience-cases.json'),policy=json('career-fast-progression-policy.json'),events=json('event-catalog-v2.json').events,screens=json('screen-state-catalog.json').screens;
assert.equal(mid.experiences.length,12);for(const c of mid.experiences){assert.equal(c.executionStatus,'NOT_EXECUTED');for(const id of c.screenIds)assert.ok(screens.some(s=>s.id===id));for(const id of c.eventIds)assert.ok(events.some(e=>e.id===id));}
const p=mid.positionPlan;assert.equal(p.sourceCommand,'START_POSITION_PLAN');assert.equal(p.requiredGames,24);assert.equal(p.currentRoleChoiceCreatesPlan,false);assert.equal(p.injuredCanProgress,false);assert.equal(p.readyMeansRegistered,false);for(const c of p.examples)assert.equal(c.planValid&&c.eligibleGames>=24,c.ready);
const e13=events.find(e=>e.id==='E13');assert.equal(e13.triggerEvidence.sourceCommand,p.sourceCommand);assert.equal(e13.triggerEvidence.eligibleTeamGames,24);assert.ok(!e13.trigger.includes('E12 B'));
for(const name of ['04-EVENTS.md','26-EVENT-CONTENT-CONTRACT.md','EVENT-CATALOG.md'])assert.ok(!read(name).includes('E12 B 후24경기'));
assert.equal(policy.authority,'USER_CONFIRMED');assert.equal(policy.defaultMode,'NEXT_MAJOR_EVENT');assert.deepEqual(policy.alternatives,['ONE_GAME','ONE_WEEK']);assert.equal(policy.doesNotChangeClubDefault,true);
for(const k of ['ordinaryNewsStops','skipTrainingConsumesUse','showLockedHiddenProximity','closedClientSchedulesUnboundedChunks','goesAcrossUnconfirmedSeason'])assert.equal(policy[k],false);
assert.equal(policy.checks.length,12);for(const c of policy.checks)assert.equal(c.executionStatus,'NOT_EXECUTED');
const bindings=json('screen-action-bindings.json').screens;for(const id of policy.appliesTo){const b=bindings.find(b=>b.screenId===id);assert.equal(b.progressionPolicy.defaultMode,policy.defaultMode);assert.equal(screens.find(s=>s.id===id).progressionPolicy.defaultMode,policy.defaultMode);}
assert.equal(screens.length,45);assert.equal(events.length,99);
console.log('PASS: midcareer 12 groups, E13 command-based plan boundaries and confirmed fast-progression defaults / 12 checks; runtime remains NOT_EXECUTED.');

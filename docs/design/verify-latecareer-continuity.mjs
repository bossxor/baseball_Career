// Written continuity examples, not actual retirement/claim transactions.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),json=n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'));
const d=json('latecareer-continuity-cases.json'),screens=json('screen-state-catalog.json').screens;
assert.equal(d.scenes.length,9);assert.equal(d.checks.length,12);assert.equal(d.executionStatus,'NOT_EXECUTED');
for(const s of d.scenes){assert.ok(screens.some(r=>r.id===s.screenId));assert.equal(s.executionStatus,'NOT_EXECUTED');}for(const c of d.checks)assert.equal(c.executionStatus,'NOT_EXECUTED');
for(const e of d.examples){assert.equal(e.copyAge,19);assert.equal(e.sourceAge,41);assert.deepEqual(e.copyAbilities,e.peaks.map(n=>n/2));assert.equal((e.copyAbilities.reduce((a,b)=>a+b,0)/6).toFixed(1),e.displayOverall);}
assert.equal(d.claims.sameWorldPlayerAndStaffAllowed,false);assert.equal(d.claims.retiredPlayerReleasesClaim,true);assert.equal(d.claims.differentWorldReuseAllowed,true);assert.equal(d.claims.hideSourceReleasesClaim,false);assert.equal(d.claims.cloneDescendantBypassesRoot,false);
assert.equal(d.archive.projectionFailureBlocksSnapshot,false);assert.equal(d.archive.zeroProfessionalAppearancesAllowed,true);assert.equal(d.archive.allClubNpcAutoArchive,false);assert.equal(d.archive.sourceSnapshotMutable,false);assert.equal(d.copy.records,0);assert.equal(d.copy.militaryReset,true);assert.equal(d.copy.hiddenUnlocked,0);
console.log('PASS: latecareer 9 scenes / 12 checks, peak-half age19 examples, immutable archive and root-role claim policy. Runtime remains NOT_EXECUTED.');

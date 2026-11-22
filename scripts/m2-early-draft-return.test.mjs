import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {canonicalSha256} from '../packages/engine/src/canonical-seal.ts';
import {earlyDraftReturnReport} from './m2-native-drivers.mjs';
import {nativeSliceVerdict} from './m2-native-paths.mjs';
import {PATH_REQUIREMENTS} from './m2-path-scenarios.mjs';

test('only an explicitly undrafted second-year result can claim P04',()=>{
 assert.deepEqual(earlyDraftReturnReport(null).completesPaths,['P04']);
 assert.equal(earlyDraftReturnReport(8).completesPaths,undefined);
 assert.throws(()=>earlyDraftReturnReport(undefined),/resolved draft round/);
});

test('the archived round-eight decline cannot prove P04 even if its report claims completion',()=>{
 const archive=JSON.parse(readFileSync(new URL('../docs/implementation/evidence/M2-20261106-closure-native-b.json',import.meta.url),'utf8'));
 const slice=archive.slices.find(s=>s.id==='P04-native-decline-variant');
 assert.equal(slice.invariantReport.draftRound,8);
 const edited={...slice,invariantReport:earlyDraftReturnReport(null)};
 const verdict=nativeSliceVerdict(edited,PATH_REQUIREMENTS.P04,canonicalSha256);
 assert.equal(verdict.ok,false);
 assert.match(verdict.problem,/undrafted result/);
});

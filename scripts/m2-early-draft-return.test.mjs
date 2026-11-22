import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {canonicalSha256} from '../packages/engine/src/canonical-seal.ts';
import {createWorldStream} from '../packages/engine/src/rng.ts';
import {drawDraft} from '../packages/engine/src/draft.ts';
import {earlyDraftReturnReport,nativePaths} from './m2-native-drivers.mjs';
import {createNativeP04Hs,nativeSliceVerdict} from './m2-native-paths.mjs';
import {PATH_REQUIREMENTS} from './m2-path-scenarios.mjs';

test('only an explicitly undrafted second-year result can claim P04',()=>{
 assert.deepEqual(earlyDraftReturnReport(null).completesPaths,['P04']);
 assert.equal(earlyDraftReturnReport(8).completesPaths,undefined);
 assert.throws(()=>earlyDraftReturnReport(undefined),/resolved draft round/);
});

test('alternate P04 creation rebuilds identically and has a low second-year draft draw',()=>{
 const career=createNativeP04Hs(),{world}=career;
 assert.equal(canonicalSha256(career),canonicalSha256(createNativeP04Hs()));
 assert.equal(career.difficulty,'REALISTIC');
 assert.equal(world.players[world.protagonistKey].archetype,'DEFENSE_RUNNING');
 const secondYear=String(world.calendar.year+2),draftYear=String(world.calendar.year+3);
 const assessmentKey=JSON.stringify(['amateur-kbo',world.worldKey,secondYear,world.protagonistKey]);
 const rng=createWorldStream(world.seed,JSON.stringify(['career-kbo-draft-1',world.worldKey,draftYear,assessmentKey]),'roster');
 assert.equal(drawDraft({baseScore:49.8,hasEligibleClubSlot:true},rng).round,null);
 assert.equal(drawDraft({baseScore:49.9,hasEligibleClubSlot:true},rng).round,10);
 assert.throws(()=>nativePaths(null,['P04'],null,'unknown'),/unknown P04 creation/);
 assert.throws(()=>nativePaths(null,['P03','P04'],null,'HS_P04_DEFENSE'),/select only P04/);
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

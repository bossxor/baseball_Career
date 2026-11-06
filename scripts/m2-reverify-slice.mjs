// Offline re-check of a completed slice stored in a runner report (also works on -failed.json completedSlices).
// usage: node --import tsx scripts/m2-reverify-slice.mjs <report.json> <sliceId> <pathId> [out.json]
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonicalJson} from '../packages/engine/src/game.ts';
import {nativeSliceVerdict} from './m2-native-paths.mjs';
import {PATH_REQUIREMENTS} from './m2-path-scenarios.mjs';
const [file,sliceId,pathId,out]=process.argv.slice(2),hash=v=>createHash('sha256').update(canonicalJson(v)).digest('hex');
const report=JSON.parse(readFileSync(file,'utf8')),slice=[...(report.slices??[]),...(report.completedSlices??[])].find(s=>s.id===sliceId);
if(!slice)throw new Error('slice not found');
const verdict=nativeSliceVerdict(slice,PATH_REQUIREMENTS[pathId],hash),result={pathId,sliceId,source:file,verdict,claims:slice.invariantReport?.completesPaths,invariantReport:slice.invariantReport};
console.log(JSON.stringify(result));if(out)writeFileSync(out,JSON.stringify(result,null,2)+'\n');process.exitCode=verdict.ok?0:1;

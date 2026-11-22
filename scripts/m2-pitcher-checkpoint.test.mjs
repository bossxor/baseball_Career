import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {gzipSync,gunzipSync} from 'node:zlib';
import {canonicalSha256 as hash} from '../packages/engine/src/canonical-seal.ts';
import {loadPitcherCheckpoint,savePitcherCheckpoint} from './m2-pitcher-checkpoint.mjs';

test('P02 checkpoints restore the exact command prefix and cursor before the next step',t=>{
 const dir=mkdtempSync(join(tmpdir(),'p02-resume-'));
 t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const file={path:join(dir,'test.gz'),sourceHash:'manifest'},creation='HS_PITCHER_V7';
 const initial={revision:0,xp:0};
 function advance({state,rows},gain){
  const next={revision:state.revision+1,xp:state.xp+gain},input={gain};
  return {state:next,rows:[...rows,{command:'advance',input,inputHash:hash(input),sourceHash:hash(state),resultHash:hash(next),sourceRevision:state.revision,resultRevision:next.revision}]};
 }
 const start=advance({state:initial,rows:[]},11),expected=advance(start,2);
 const cursor={step:25,draftRound:3,roleReview:{outcome:'OTHER_CANDIDATE'},quartersAtRoleReview:1};
 assert.equal(loadPitcherCheckpoint(file,creation,initial),null);
 savePitcherCheckpoint(file,creation,start,cursor);
 const resumed=loadPitcherCheckpoint(file,creation,initial);
 assert.deepEqual(resumed.cursor,cursor);
 assert.deepEqual(advance(resumed,2),expected);
 savePitcherCheckpoint(file,creation,expected,{...cursor,step:50});
 assert.deepEqual(loadPitcherCheckpoint(file,creation,initial).rows,expected.rows);
 assert.throws(()=>loadPitcherCheckpoint(file,'HS_PITCHER',initial),/fixture mismatch/);
 assert.throws(()=>loadPitcherCheckpoint({...file,sourceHash:'changed'},creation,initial),/manifest mismatch/);
 assert.throws(()=>loadPitcherCheckpoint(file,creation,{...initial,xp:99}),/chain mismatch/);
 const raw=JSON.parse(gunzipSync(readFileSync(file.path)));
 raw.state.xp++;
 writeFileSync(file.path,gzipSync(JSON.stringify(raw)));
 assert.throws(()=>loadPitcherCheckpoint(file,creation,initial),/state mismatch/);
});

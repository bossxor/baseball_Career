import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {canonicalSha256 as hash} from '../packages/engine/src/canonical-seal.ts';

export function savePitcherCheckpoint({path,sourceHash},creation,trace,cursor){
 const {state,rows}=trace;
 const header={version:1,sourceHash,creation,cursor,chainHash:hash(rows)};
 const data=JSON.stringify({header,headerHash:hash(header),state,rows});
 const temp=path+'.'+randomUUID()+'.tmp';
 mkdirSync(dirname(path),{recursive:true});
 try{
  writeFileSync(temp,gzipSync(data,{level:1}),{flag:'wx',flush:true});
  renameSync(temp,path);
 }finally{rmSync(temp,{force:true});}
}

export function loadPitcherCheckpoint({path,sourceHash},creation,initial){
 let bytes;
 try{bytes=readFileSync(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}
 const {header,headerHash,state,rows}=JSON.parse(gunzipSync(bytes));
 assert.equal(hash(header),headerHash,'P02 checkpoint header changed');
 assert.equal(header.version,1,'unknown P02 checkpoint version');
 assert.equal(header.sourceHash,sourceHash,'P02 checkpoint source manifest mismatch');
 assert.equal(header.creation,creation,'P02 checkpoint fixture mismatch');
 assert.ok(Array.isArray(rows)&&rows.length>0,'P02 checkpoint has no command history');
 assert.equal(hash(rows),header.chainHash,'P02 checkpoint receipts changed');
 let previousHash=hash(initial),revision=initial.revision;
 for(const row of rows){
  assert.equal(row.inputHash,hash(row.input),'P02 checkpoint command input mismatch');
  assert.equal(row.sourceHash,previousHash,'P02 checkpoint state chain mismatch');
  assert.equal(row.sourceRevision,revision,'P02 checkpoint revision chain mismatch');
  previousHash=row.resultHash;revision=row.resultRevision;
 }
 assert.equal(hash(state),previousHash,'P02 checkpoint state mismatch');
 assert.equal(state.revision,revision,'P02 checkpoint revision mismatch');
 return {state,rows,cursor:header.cursor};
}

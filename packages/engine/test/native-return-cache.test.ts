import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {canonicalJson} from '../src/game.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {captureNativeSource,nativeReturnSource,roundTripNativeState,pinNativeRecordPrefix,readNativeReturnCache,writeNativeReturnCache,withNativeReturnWriter} from './native-return-cache.js';

function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'playball-cache-test-')),sourceFile=path.join(dir,'source.ts'),file=path.join(dir,'prefix.json');fs.writeFileSync(sourceFile,'export const a=1;');return {dir,sourceFile,file,manifest:()=>captureNativeSource(dir,['source.ts'])};}
function cleanup(dir:string):void {assert.equal(path.dirname(dir),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(dir).startsWith('playball-cache-test-'));for(const file of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,file));fs.rmdirSync(dir);}
const valid=(v:unknown)=>{assert.deepEqual(v,{completed:2});};

test('native cache checks canonical data, kind and current source before the domain owner accepts it',()=>{const s=setup();try{const m=s.manifest();writeNativeReturnCache(s.file,'SERVICE',m,{completed:2});assert.deepEqual(readNativeReturnCache(s.file,'SERVICE',m,valid),{completed:2});assert.throws(()=>readNativeReturnCache(s.file,'INDEPENDENT',m,valid),/KIND/);const lines=fs.readFileSync(s.file,'utf8').trimEnd().split('\n');const data=JSON.parse(lines[1]!);data.payload=data.payload.replace('2','1');lines[1]=JSON.stringify(data);fs.writeFileSync(s.file,lines.join('\n')+'\n');assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',m,valid),/CHANGED/);}finally{cleanup(s.dir);}});

test('native cache never accepts a prior source generation or a schema1 unbound fixture as fresh evidence',()=>{const s=setup();try{writeNativeReturnCache(s.file,'SERVICE',s.manifest(),{completed:2});fs.writeFileSync(s.sourceFile,'export const a=2;');assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid),/SOURCE_CHANGED/);fs.writeFileSync(s.file,JSON.stringify({schemaVersion:1,origin:{completed:2}}));assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid),/SCHEMA/);}finally{cleanup(s.dir);}});

test('canonical cache roundtrip cannot turn an incomplete checkpoint into a completed owner',()=>{const s=setup();try{writeNativeReturnCache(s.file,'CHECKPOINT',s.manifest(),{completed:1});assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid),/KIND/);writeNativeReturnCache(s.file,'SERVICE',s.manifest(),{completed:1});assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid));assert.equal(readNativeReturnCache(path.join(s.dir,'missing'),'SERVICE',s.manifest(),valid),undefined);}finally{cleanup(s.dir);}});

test('only one writer owns a prefix and its lock is released even after a failed generation',()=>{const s=setup();try{assert.throws(()=>withNativeReturnWriter(s.file,()=>{assert.throws(()=>withNativeReturnWriter(s.file,()=>{}),/WRITER_ACTIVE/);throw Error('generation failed');}),/generation failed/);assert.equal(withNativeReturnWriter(s.file,()=>12),12);assert.ok(!fs.existsSync(s.file+'.lock'));}finally{cleanup(s.dir);}});

test('actual native manifest binds existing configs and executed rules distribution',()=>{const m=nativeReturnSource();assert.ok(m.files.some(f=>f.path==='tsconfig.base.json'));assert.ok(m.files.some(f=>f.path==='packages/db/src/state-codec.ts'));assert.ok(m.files.some(f=>f.path==='packages/rules/dist/index.js'));assert.ok(!m.files.some(f=>f.path==='tsconfig.json'));});

import type {RecordLedger} from '../src/records.js';
function records():RecordLedger {return {revision:1,games:{one:{gameKey:'one',worldDay:1,scope:{seasonKey:'2030',leagueKey:'ROOKIE',phase:'REGULAR'},teams:{club:{games:1,W:1,L:0,T:0,R:1,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}}}};}
test('native cache pinning freezes verified historical rows and shares them without changing serialized values',()=>{const source=records(),current=structuredClone(source),before=JSON.stringify(current),result=pinNativeRecordPrefix(source,current);assert.equal(JSON.stringify(result),before);assert.equal(result.games.one,source.games.one);assert.ok(Object.isFrozen(source.games.one!.teams.club));assert.throws(()=>{source.games.one!.teams.club!.R++;},TypeError);assert.notEqual(current.games.one,result.games.one);});
test('native cache pinning refuses missing, corrected or regressed prefix evidence before sharing anything',()=>{for(const mutate of [(c:RecordLedger)=>{delete c.games.one;},(c:RecordLedger)=>{c.games.one!.teams.club!.R++;},(c:RecordLedger)=>{c.revision=0;}]){const source=records(),current=structuredClone(source);mutate(current);assert.throws(()=>pinNativeRecordPrefix(source,current),/PREFIX_CHANGED/);assert.ok(!Object.isFrozen(source.games.one));}});

test('verified dead-owner recovery preserves the abandoned lock before one writer resumes',()=>{const s=setup();try{const child=spawnSync(process.execPath,['-e','']);assert.equal(child.status,0);const lock=s.file+'.lock';fs.writeFileSync(lock,JSON.stringify({pid:child.pid,host:os.hostname()}));assert.throws(()=>withNativeReturnWriter(s.file,()=>{}),/WRITER_ACTIVE/);assert.throws(()=>process.kill(child.pid!,0),(error:unknown)=>(error as NodeJS.ErrnoException).code==='ESRCH');const abandoned=path.join(s.dir,'abandoned-lock');fs.renameSync(lock,abandoned);assert.equal(withNativeReturnWriter(s.file,()=>42),42);assert.ok(fs.existsSync(abandoned));assert.ok(!fs.existsSync(lock));}finally{cleanup(s.dir);}});

test('native cache accepts schema2 with its original canonical hash and rejects forged legacy data',()=>{
 const s=setup();
 try{
  const origin={completed:2},sha256=createHash('sha256').update(canonicalJson(origin)).digest('hex');
  const old={schemaVersion:2,kind:'SERVICE',source:s.manifest(),sha256,origin};
  fs.writeFileSync(s.file,JSON.stringify(old));
  assert.deepEqual(readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid),origin);
  old.origin.completed=1;fs.writeFileSync(s.file,JSON.stringify(old));
  assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),valid),/CHANGED/);
 }finally{cleanup(s.dir);}
});

test('bounded native stream and in-memory roundtrip preserve multiple parts, Unicode and own special keys',()=>{
 const s=setup();
 try{
  const origin=JSON.parse('{"__proto__":{"own":true},"constructor":[],"completed":2}') as Record<string,unknown>;
  origin.history=Array.from({length:24000},(_,i)=>({day:i,text:'한글⚾😀'.repeat(8)}));
  assert.deepEqual(roundTripNativeState(origin),origin);
  writeNativeReturnCache(s.file,'SERVICE',s.manifest(),origin);
  const lines=fs.readFileSync(s.file,'utf8').trimEnd().split('\n');
  assert.equal(JSON.parse(lines[0]!).schemaVersion,3);
  assert.ok(JSON.parse(lines.at(-1)!).parts>1);
  assert.deepEqual(readNativeReturnCache(s.file,'SERVICE',s.manifest(),()=>{}),origin);
  assert.equal(Object.hasOwn(Object.prototype,'own'),false);
 }finally{cleanup(s.dir);}
});

test('native stream rejects missing footer, reordered or duplicate parts, extra rows and changed origin hash',()=>{
 const s=setup();
 try{
  const origin={history:Array.from({length:18000},(_,i)=>({day:i,text:'record'.repeat(20)}))};
  writeNativeReturnCache(s.file,'SERVICE',s.manifest(),origin);
  const lines=fs.readFileSync(s.file,'utf8').trimEnd().split('\n');
  assert.ok(JSON.parse(lines.at(-1)!).parts>1);
  const swapped=lines.slice();[swapped[1],swapped[2]]=[swapped[2]!,swapped[1]!];
  const duplicate=[...lines.slice(0,2),lines[1]!,...lines.slice(2)];
  const header=JSON.parse(lines[0]!);header.sha256='0'.repeat(64);
  for(const changed of [lines.slice(0,-1),swapped,duplicate,[...lines,'{}'],[JSON.stringify(header),...lines.slice(1)]]){
   fs.writeFileSync(s.file,changed.join('\n')+'\n');
   assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),()=>{}),/CHANGED/);
  }
  fs.writeFileSync(s.file,lines.join('\n'));
  assert.throws(()=>readNativeReturnCache(s.file,'SERVICE',s.manifest(),()=>{}),/CHANGED/);
 }finally{cleanup(s.dir);}
});

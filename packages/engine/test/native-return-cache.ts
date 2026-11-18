import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {StringDecoder} from 'node:string_decoder';
import {createHash,randomUUID} from 'node:crypto';
import {canonicalJson} from '../src/game.js';
import {canonicalSha256} from '../src/canonical-seal.js';
import {encodeStateParts,StateDecoder,STATE_PART_BYTES} from '../../db/src/state-codec.js';

export interface NativeSourceManifest {node:string;files:{path:string;sha256:string}[];sha256:string}
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export function captureNativeSource(root:string,files:readonly string[]):NativeSourceManifest {
 const rows=[...new Set(files)].sort().map(file=>({path:file.replaceAll('\\','/'),sha256:hash(fs.readFileSync(path.join(root,file)))})),node=process.version;return {node,files:rows,sha256:hash(canonicalJson({node,files:rows}))};
}
export function nativeReturnSource():NativeSourceManifest {
 const root=fileURLToPath(new URL('../../../',import.meta.url)),files=['package.json','package-lock.json','tsconfig.base.json','tsconfig.tests.json','packages/engine/tsconfig.json','packages/rules/tsconfig.json','packages/engine/package.json','packages/rules/package.json','packages/db/src/state-codec.ts'];
 const visit=(dir:string,suffix='.ts')=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isDirectory())visit(name,suffix);else if(entry.name.endsWith(suffix))files.push(name);}};
 for(const dir of ['packages/engine/src','packages/rules/src','packages/engine/test'])visit(dir);visit('packages/rules/dist','.js');visit('packages/engine/dist','.js');return captureNativeSource(root,files);
}

function* cacheLines(file:string):Generator<string> {
 const fd=fs.openSync(file,'r'),buffer=Buffer.alloc(64*1024),decoder=new StringDecoder('utf8');
 let pending='';
 try{
  for(let count=fs.readSync(fd,buffer);count;count=fs.readSync(fd,buffer)){
   pending+=decoder.write(buffer.subarray(0,count));
   for(let end=pending.indexOf('\n');end>=0;end=pending.indexOf('\n')){
    if(end>8*STATE_PART_BYTES)throw Error('NATIVE_RETURN_CACHE_CHANGED');
    yield pending.slice(0,end);pending=pending.slice(end+1);
   }
   if(pending.length>8*STATE_PART_BYTES)throw Error('NATIVE_RETURN_CACHE_CHANGED');
  }
  pending+=decoder.end();
  if(pending.length)throw Error('NATIVE_RETURN_CACHE_CHANGED');
 }finally{fs.closeSync(fd);}
}

export function roundTripNativeState<T>(state:T):T {
 const decoder=new StateDecoder();
 for(const part of encodeStateParts(state))decoder.push(part);
 return decoder.finish() as T;
}

export function readNativeReturnCache<T>(file:string,kind:string,source:NativeSourceManifest,validate:(origin:T)=>void):T|undefined {
 if(!fs.existsSync(file))return undefined;
 const fd=fs.openSync(file,'r'),prefix=Buffer.alloc(128);
 let schema:number|undefined;
 try{
  const count=fs.readSync(fd,prefix);
  schema=Number(/"schemaVersion"\s*:\s*(\d+)/.exec(prefix.subarray(0,count).toString('utf8'))?.[1]);
 }finally{fs.closeSync(fd);}
 if(schema!==2&&schema!==3)throw Error('NATIVE_RETURN_CACHE_SCHEMA');
 const lines=schema===3?cacheLines(file):null;
 try{
  const data=JSON.parse(lines?lines.next().value??'':fs.readFileSync(file,'utf8')) as {schemaVersion:number;kind:string;source:NativeSourceManifest;sha256:string;origin:T};
  if(data.schemaVersion!==schema)throw Error('NATIVE_RETURN_CACHE_SCHEMA');
  if(data.kind!==kind)throw Error('NATIVE_RETURN_CACHE_KIND');
  if(canonicalJson(data.source)!==canonicalJson(source))throw Error('NATIVE_RETURN_CACHE_SOURCE_CHANGED');
  let origin:T;
  if(lines){
   const decoder=new StateDecoder();
   let count=0,complete=false;
   for(const line of lines){
    const row=JSON.parse(line) as {part?:number;sha256?:string;payload?:string;parts?:number};
    if(complete)throw Error('NATIVE_RETURN_CACHE_CHANGED');
    if(Object.keys(row).length===1&&row.parts===count&&count>0){complete=true;continue;}
    if(Object.keys(row).sort().join(',')!=='part,payload,sha256'||row.part!==count++||typeof row.payload!=='string'||
     Buffer.byteLength(row.payload)>STATE_PART_BYTES||hash(row.payload)!==row.sha256)throw Error('NATIVE_RETURN_CACHE_CHANGED');
    decoder.push(row.payload);
   }
   if(!complete)throw Error('NATIVE_RETURN_CACHE_CHANGED');
   origin=decoder.finish() as T;
  }else origin=data.origin;
  if(canonicalSha256(origin)!==data.sha256)throw Error('NATIVE_RETURN_CACHE_CHANGED');
  validate(origin);return origin;
 }finally{lines?.return(undefined);}
}
export function writeNativeReturnCache<T>(file:string,kind:string,source:NativeSourceManifest,origin:T):void {
 const temp=file+'.'+process.pid+'.'+randomUUID()+'.tmp';
 const header=JSON.stringify({schemaVersion:3,kind,source,sha256:canonicalSha256(origin)});
 fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(temp,'wx');
 try{
  try{
   fs.writeFileSync(fd,header+'\n');
   let part=0;
   for(const payload of encodeStateParts(origin))fs.writeFileSync(fd,JSON.stringify({part:part++,sha256:hash(payload),payload})+'\n');
   fs.writeFileSync(fd,JSON.stringify({parts:part})+'\n');fs.fsyncSync(fd);
  }finally{fs.closeSync(fd);}
  fs.renameSync(temp,file);
 }catch(error){if(fs.existsSync(temp))fs.unlinkSync(temp);throw error;}
}
export function withNativeReturnWriter<T>(file:string,generate:()=>T):T {
 fs.mkdirSync(path.dirname(file),{recursive:true});const lock=file+'.lock';let fd:number;try{fd=fs.openSync(lock,'wx');}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')throw new Error('NATIVE_RETURN_WRITER_ACTIVE',{cause:error});throw error;}
 try{fs.writeFileSync(fd,JSON.stringify({pid:process.pid,host:os.hostname(),startedAt:new Date().toISOString()}));return generate();}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}

export function assertNativeSourceUnchanged(source:NativeSourceManifest):void {if(source.sha256!==nativeReturnSource().sha256)throw new Error('NATIVE_RETURN_CACHE_SOURCE_CHANGED');}

/** Test-only immutable archive sharing; never changes serialized evidence or skips a native command. */
export function pinNativeRecordPrefix(source:import('../src/records.js').RecordLedger,current:import('../src/records.js').RecordLedger){
 if(!Number.isSafeInteger(source.revision)||!Number.isSafeInteger(current.revision)||current.revision<source.revision||Object.entries(source.games).some(([key,g])=>!Object.hasOwn(current.games,key)||canonicalJson(g)!==canonicalJson(current.games[key])))throw Error('NATIVE_RECORD_PREFIX_CHANGED');
 const freeze=(value:unknown)=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}};freeze(source);return {...current,games:{...current.games,...source.games}};
}

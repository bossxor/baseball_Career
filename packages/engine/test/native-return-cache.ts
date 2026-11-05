import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {canonicalJson} from '../src/game.js';

export interface NativeSourceManifest {node:string;files:{path:string;sha256:string}[];sha256:string}
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export function captureNativeSource(root:string,files:readonly string[]):NativeSourceManifest {
 const rows=[...new Set(files)].sort().map(file=>({path:file.replaceAll('\\','/'),sha256:hash(fs.readFileSync(path.join(root,file)))})),node=process.version;return {node,files:rows,sha256:hash(canonicalJson({node,files:rows}))};
}
export function nativeReturnSource():NativeSourceManifest {
 const root=fileURLToPath(new URL('../../../',import.meta.url)),files=['package.json','package-lock.json','tsconfig.base.json','tsconfig.tests.json','packages/engine/tsconfig.json','packages/rules/tsconfig.json','packages/engine/package.json','packages/rules/package.json'];
 const visit=(dir:string,suffix='.ts')=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isDirectory())visit(name,suffix);else if(entry.name.endsWith(suffix))files.push(name);}};
 for(const dir of ['packages/engine/src','packages/rules/src','packages/engine/test'])visit(dir);visit('packages/rules/dist','.js');visit('packages/engine/dist','.js');return captureNativeSource(root,files);
}
export function readNativeReturnCache<T>(file:string,kind:string,source:NativeSourceManifest,validate:(origin:T)=>void):T|undefined {
 if(!fs.existsSync(file))return undefined;const data=JSON.parse(fs.readFileSync(file,'utf8')) as {schemaVersion:number;kind:string;source:NativeSourceManifest;sha256:string;origin:T};
 if(data.schemaVersion!==2)throw new Error('NATIVE_RETURN_CACHE_SCHEMA');if(data.kind!==kind)throw new Error('NATIVE_RETURN_CACHE_KIND');if(canonicalJson(data.source)!==canonicalJson(source))throw new Error('NATIVE_RETURN_CACHE_SOURCE_CHANGED');if(hash(canonicalJson(data.origin))!==data.sha256)throw new Error('NATIVE_RETURN_CACHE_CHANGED');validate(data.origin);return data.origin;
}
export function writeNativeReturnCache<T>(file:string,kind:string,source:NativeSourceManifest,origin:T):void {
 const canonical=canonicalJson(origin),temp=file+'.'+process.pid+'.'+randomUUID()+'.tmp',header=JSON.stringify({schemaVersion:2,kind,source,sha256:hash(canonical)});fs.mkdirSync(path.dirname(file),{recursive:true});const fd=fs.openSync(temp,'wx');
 try{try{fs.writeFileSync(fd,header.slice(0,-1)+',"origin":');fs.writeFileSync(fd,canonical);fs.writeFileSync(fd,'}');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}catch(error){if(fs.existsSync(temp))fs.unlinkSync(temp);throw error;}
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

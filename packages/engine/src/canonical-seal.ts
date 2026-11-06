import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex} from '@noble/hashes/utils.js';
import {canonicalJson} from './game.js';

const encoder=new TextEncoder();
function updateText(hash:ReturnType<typeof sha256.create>,text:string):void {
 const size=64*1024;
 for(let start=0;start<text.length;){
  let end=Math.min(start+size,text.length);
  if(end<text.length && text.charCodeAt(end-1)>=0xD800 && text.charCodeAt(end-1)<=0xDBFF && text.charCodeAt(end)>=0xDC00 && text.charCodeAt(end)<=0xDFFF)end--;
  hash.update(encoder.encode(text.slice(start,end)));
  start=end;
 }
}

/** Hash the same bytes as canonicalJson without assembling a whole career string. */
export function canonicalSha256(value:unknown):string {
 const hash=sha256.create();
 let buffer='';
 function write(chunk:string){
  if(buffer.length+chunk.length>64*1024){updateText(hash,buffer);buffer='';}
  if(chunk.length>=64*1024)updateText(hash,chunk);else buffer+=chunk;
 }
 function visit(item:unknown){
  if(Array.isArray(item)){
   write('[');
   for(let index=0;index<item.length;index++){
    if(index)write(',');
    if(index in item)visit(item[index]);
   }
   write(']');
  }else if(item!==null&&typeof item==='object'){
   write('{');
   Object.keys(item).sort().forEach((key,index)=>{
    if(index)write(',');
    write(JSON.stringify(key)+':');
    visit((item as Record<string,unknown>)[key]);
   });
   write('}');
  }else write(canonicalJson(item));
 }
 visit(value);
 updateText(hash,buffer);
 return bytesToHex(hash.digest());
}

export const canonicalSeal=(value:unknown):string=>'sha256:'+canonicalSha256(value);

/** Older saves stored the canonical object itself. */
export function matchesCanonicalSeal(stored:string,expected:string):boolean {
 if(stored===expected)return true;
 if(typeof stored!=='string'||!stored.startsWith('{'))return false;
 const hash=sha256.create();
 updateText(hash,stored);
 return 'sha256:'+bytesToHex(hash.digest())===expected;
}

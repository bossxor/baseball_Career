// Measure selected object values in an existing JSON string without parsing or copying the state.
import {Buffer} from 'node:buffer';

const descend=new Set(['','career','career.season','career.records','career.health','career.proAwards']);
function stringEnd(text,start){let i=start+1;for(;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==='"')return i+1;}throw Error('unterminated JSON string');}
function valueEnd(text,start){
 if(text[start]==='"')return stringEnd(text,start);
 if(text[start]!=='{'&&text[start]!=='['){let i=start;while(i<text.length&&!/[,}\]\s]/.test(text[i]))i++;return i;}
 let depth=0;for(let i=start;i<text.length;i++){const c=text[i];if(c==='"'){i=stringEnd(text,i)-1;continue;}if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(depth===0)return i+1;}}throw Error('unterminated JSON container');
}
export function profileStateSize(text){
 const rows=[];
 function object(start,path){
  if(text[start]!=='{')return;
  let i=start+1;while(i<text.length&&text[i]!=='}'){
   if(text[i]===' '||text[i]==='\n'||text[i]==='\r'||text[i]==='\t'||text[i]===','){i++;continue;}
   if(text[i]!=='"')throw Error('invalid JSON object key');const end=stringEnd(text,i),key=JSON.parse(text.slice(i,end));i=end;
   while(/\s/.test(text[i]))i++;if(text[i++]!==':')throw Error('invalid JSON object');while(/\s/.test(text[i]))i++;
   const valueStart=i,valueStop=valueEnd(text,i),name=path?path+'.'+key:key;
   rows.push({path:name,bytes:Buffer.byteLength(text.slice(valueStart,valueStop))});
   if(descend.has(name))object(valueStart,name);i=valueStop;
  }
 }
 object(0,'');return rows.sort((a,b)=>b.bytes-a.bytes);
}

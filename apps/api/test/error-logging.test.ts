import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.js';

test('API logs the bounded database cause without serializing query parameters or save state',async()=>{
 const app=createApp(),messages:string[]=[],original=console.error;
 const cause=Object.assign(new Error('out of memory'),{code:'53200'});
 app.get('/failure',()=>{throw new Error('Failed query: update game_saves\nparams: '+ 'private-save-state'.repeat(1000),{cause});});
 console.error=(message:unknown)=>{messages.push(String(message));};
 try{
  const response=await app.request('/failure');assert.equal(response.status,500);
  const body=await response.json() as {code:string;requestId:string};assert.equal(body.code,'INTERNAL_ERROR');assert.ok(body.requestId);
  assert.equal(messages.length,1);assert.ok(messages[0]!.length<1000);assert.doesNotMatch(messages[0]!,/private-save-state|params:|update game_saves/);
  const logged=JSON.parse(messages[0]!) as {message:string;requestId:string};assert.equal(logged.message,cause.message);assert.equal(logged.requestId,body.requestId);
  assert.doesNotMatch(JSON.stringify(body),/53200|out of memory|query|params/);
 }finally{console.error=original;}
});

test('API bounds cyclic causes and an unwrapped query error without dropping its request id',async()=>{
 const app=createApp(),messages:string[]=[],original=console.error,error=new Error('Failed query: select secret\nparams: private-save-state');
 Object.assign(error,{cause:error});app.get('/failure',()=>{throw error;});console.error=(message:unknown)=>{messages.push(String(message));};
 try{
  const response=await app.request('/failure');assert.equal(response.status,500);assert.equal(messages.length,1);
  const body=await response.json() as {requestId:string},logged=JSON.parse(messages[0]!) as {message:string;requestId:string};
  assert.equal(logged.requestId,body.requestId);assert.doesNotMatch(logged.message,/secret|params|private-save-state/);
 }finally{console.error=original;}
});

test('API redacts parameter lines after an actual newline without relying on a query wrapper prefix',async()=>{
 const app=createApp(),messages:string[]=[],original=console.error;
 app.get('/failure',()=>{throw new Error(['Database operation failed','params: private-save-state'].join(String.fromCharCode(10)));});
 console.error=(message:unknown)=>{messages.push(String(message));};
 try{assert.equal((await app.request('/failure')).status,500);assert.equal(messages.length,1);assert.doesNotMatch(messages[0]!,/private-save-state|params:/);}
 finally{console.error=original;}
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {channel} from 'node:diagnostics_channel';
import {createTestDb,seedAllowedSubject} from '@playball/db';
import {createApp} from '../src/app.js';

test('command diagnostics preserve the HTTP response and report ordered boundaries only when subscribed',async()=>{
 const {db,client}=await createTestDb(),subject='diagnostic-test';await seedAllowedSubject(db,subject);
 const app=createApp({db,auth:{allowDevBearer:true}}),headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
 const post=(path:string,body:unknown)=>app.request(path,{method:'POST',headers,body:JSON.stringify(body)});
 const make=async(id:string)=>{const response=await post('/api/game-creations',{creationId:id,mode:'CAREER'});assert.equal(response.status,200);return (await response.json() as {saveId:string}).saveId;};
 const a=await make('diagnostic-a'),b=await make('diagnostic-b');
 const command={commandId:'seed',expectedRevision:0,type:'UI_SEED',payload:{name:'테스트',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','RUNNING']}};
 const stream=channel('playball.command.memory'),stages:string[]=[],listener=(message:unknown)=>stages.push((message as {stage:string}).stage);
 try{
  const baseline=await post('/api/saves/'+a+'/commands',command);assert.equal(baseline.status,200);const expected=await baseline.json();assert.deepEqual(stages,[]);
  stream.subscribe(listener);const measured=await post('/api/saves/'+b+'/commands',command);assert.equal(measured.status,200);assert.deepEqual(await measured.json(),expected);
  assert.deepEqual(stages,['transaction-start','lock-start','lock-return','engine-start','engine-return','update-start','update-return','receipt-start','receipt-return','transaction-return']);
 }finally{stream.unsubscribe(listener);await client.close();}
});

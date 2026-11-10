import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {storedSave} from './stored-save.js';
import {controlledDeclinedUsReturn} from '../../../packages/engine/test/us-return-retirement-fixture.js';
import type {UsAmateurReturnCareer} from '../../../packages/engine/src/us-amateur-return-career.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';

test('controlled return HTTP: voluntary exit cancel/re-request/archive, replay/stale/foreign/forgery protection',async()=>{
 const {db,client}=await createTestDb();
 try{
  const subject='return-retirement',headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'},other={Authorization:'Bearer dev:return-retirement-other'};
  await seedAllowedSubject(db,subject);await seedAllowedSubject(db,'return-retirement-other');const app=createApp({db,auth:{allowDevBearer:true}});
  const created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'controlled-return-retirement',mode:'CAREER'})}));
  const source=controlledDeclinedUsReturn();await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));
  const url='/api/saves/'+created.saveId,stored=async()=>((await storedSave(db,created.saveId))[0]!.state as {career:UsAmateurReturnCareer}).career;
  let saveRevision=0,careerRevision=source.revision;
  const raw=(id:string,name:string,payload:Record<string,unknown>,revision=saveRevision)=>app.request(url+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:revision,type:'CAREER_US_RETURN_'+name,payload})});
  const flow=async()=>json<{commands:{id:string;type:string;payload:Record<string,unknown>}[]}>(await app.request(url+'/screens/CAREER_FLOW',{headers}));
  const screen=async()=>json<{retirement:{status:string;eventKey:string;eventVersion:number}}>(await app.request(url+'/screens/US_RETURN_PROGRAM',{headers}));
  const send=async(id:string,name:string,fields:Record<string,unknown>)=>{
   const payload={careerRevision,...fields},revision=saveRevision,res=await raw(id,name,payload,revision);assert.equal(res.status,200,await res.clone().text());
   const result=await json<{revision:string;summary:{careerRevision:number;phase:string;navigation?:{targetScreen:string}}}>(res);assert.deepEqual(await json(await raw(id,name,payload,revision)),result);
   saveRevision=Number(result.revision);careerRevision=result.summary.careerRevision;return result;
  };
  assert.ok((await flow()).commands.some(c=>c.id==='return-retire'));
  assert.equal((await raw('forged','RETIRE_REQUEST',{careerRevision,receiptKey:'forged'})).status,400);
  const foreignBody=JSON.stringify({commandId:'foreign',expectedRevision:0,type:'CAREER_US_RETURN_RETIRE_REQUEST',payload:{careerRevision}});
  assert.equal((await app.request(url+'/commands',{method:'POST',headers:{...other,'Content-Type':'application/json'},body:foreignBody})).status,404);
  assert.equal((await app.request(url+'/screens/CAREER_FLOW',{headers:other})).status,404);
  await send('request','RETIRE_REQUEST',{});let view=(await screen()).retirement;const firstEvent=view.eventKey;
  assert.equal((await raw('stale-save','RETIRE_RESOLVE',{careerRevision,eventKey:view.eventKey,eventVersion:view.eventVersion,decision:'CANCEL_RETIRE'},0)).status,409);
  assert.equal((await raw('stale-owner','RETIRE_RESOLVE',{careerRevision:careerRevision-1,eventKey:view.eventKey,eventVersion:view.eventVersion,decision:'CANCEL_RETIRE'})).status,400);
  assert.equal((await raw('wrong-event','RETIRE_RESOLVE',{careerRevision,eventKey:'foreign',eventVersion:view.eventVersion,decision:'CONFIRM_RETIRE'})).status,400);
  assert.equal((await raw('wrong-version','RETIRE_RESOLVE',{careerRevision,eventKey:view.eventKey,eventVersion:0,decision:'CONFIRM_RETIRE'})).status,400);
  const cancelled=await send('cancel','RETIRE_RESOLVE',{eventKey:view.eventKey,eventVersion:view.eventVersion,decision:'CANCEL_RETIRE'});assert.equal(cancelled.summary.phase,'CAREER_ROUTE');assert.ok((await flow()).commands.some(c=>c.id==='return-retire'));
  await send('request-again','RETIRE_REQUEST',{});view=(await screen()).retirement;assert.notEqual(view.eventKey,firstEvent);
  const archived=await send('confirm','RETIRE_RESOLVE',{eventKey:view.eventKey,eventVersion:view.eventVersion,decision:'CONFIRM_RETIRE'});assert.equal(archived.summary.phase,'ARCHIVED');view=(await screen()).retirement;
  const current=await stored();for(const key of ['source','return','retry','draft','service'] as const)assert.equal(canonicalJson(current[key]),canonicalJson(source[key]));assert.equal(current.retry.careerPreparationUsed,0);
  const publicView=await app.request(url+'/screens/US_RETURN_PROGRAM',{headers});assert.doesNotMatch(await publicView.text(),/"sourceBasis"|"source"|"rng"|"potential"/);
  assert.ok((await flow()).commands.some(c=>c.id==='return-archive'));
  const opened=await send('archive','OPEN_ARCHIVE',{eventKey:view.eventKey,eventVersion:view.eventVersion});assert.equal(opened.summary.navigation?.targetScreen,'S10');
  assert.equal((await flow()).commands.length,0);
 }finally{await client.close();}
});

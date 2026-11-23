import test from 'node:test';
import assert from 'node:assert/strict';
import {createTestDb,seedAllowedSubject,seedSave} from '@playball/db';
import {createApp} from '../src/app.js';

test('season job routes require explicit activation and retain authentication and save ownership',async()=>{
 const {db,client}=await createTestDb();
 try{
  await seedAllowedSubject(db,'job-api-owner');await seedAllowedSubject(db,'job-api-other');
  await seedSave(db,{id:'job-api-save',ownerId:'job-api-owner'});
  const path='/api/saves/job-api-save/season-job',headers={Authorization:'Bearer dev:job-api-owner'};
  const disabled=createApp({db,auth:{allowDevBearer:true},seasonJobs:false});
  assert.equal((await disabled.request(path,{headers})).status,404);
  const enabled=createApp({db,auth:{allowDevBearer:true},seasonJobs:true});
  assert.equal((await enabled.request(path)).status,401);
  assert.equal((await enabled.request(path,{headers:{Authorization:'Bearer dev:job-api-other'}})).status,404);
  const response=await enabled.request(path,{headers});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{job:null});
  assert.equal((await enabled.request(path,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({requestId:'invalid',expectedRevision:0})})).status,400);
  assert.equal((await enabled.request('/api/ready')).status,200);
  await client.exec('DROP TABLE season_jobs');
  assert.equal((await enabled.request('/api/ready')).status,503);
  assert.equal((await disabled.request('/api/ready')).status,200);
 }finally{await client.close();}
});

test('season job activation follows the environment and permits a false test override',async()=>{
 const {db,client}=await createTestDb(),previous=process.env.PLAYBALL_SEASON_JOBS;
 try{
  process.env.PLAYBALL_SEASON_JOBS='1';
  const enabled=createApp({db,auth:{allowDevBearer:true}});
  assert.equal((await enabled.request('/api/saves/absent/season-job')).status,401);
  await seedAllowedSubject(db,'job-env-owner');
  const disabled=createApp({db,auth:{allowDevBearer:true},seasonJobs:false});
  assert.equal((await disabled.request('/api/saves/absent/season-job',{headers:{Authorization:'Bearer dev:job-env-owner'}})).status,404);
 }finally{
  if(previous===undefined)delete process.env.PLAYBALL_SEASON_JOBS;
  else process.env.PLAYBALL_SEASON_JOBS=previous;
  await client.close();
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eq,sql} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,seedSave,gameSaves,seasonJobs,M3_CORE_SQL} from '@playball/db';
import type {NewSeasonJob} from '@playball/db';

const hasCode=(code:string)=>(error:unknown)=>(error as {cause?:{code?:string}}).cause?.code===code;

test('season job bootstrap enforces one run per save, unique identity and valid resumable counters',async()=>{
 const {db,client}=await createTestDb();
 try{
  await seedAllowedSubject(db,'job-owner');
  await seedSave(db,{id:'job-save',ownerId:'job-owner'});
  await seedSave(db,{id:'another-save',ownerId:'job-owner'});
  const job:NewSeasonJob={saveId:'job-save',runId:'run-1',requestId:'request-1',nextExpectedRevision:9007199254740993n};
  await db.insert(seasonJobs).values(job);
  const [row]=await db.select().from(seasonJobs);
  assert.equal(row!.status,'RUNNING');assert.equal(row!.stepOrdinal,0);
  assert.equal(row!.nextExpectedRevision,job.nextExpectedRevision);
  assert.deepEqual(row!.progress,{seasonKey:null,phase:null,completedGames:0,scheduledGames:0});
  assert.equal(row!.requestId,'request-1');assert.equal(row!.stopReason,null);
  await assert.rejects(db.insert(seasonJobs).values({...job,runId:'run-2'}),hasCode('23505'));
  await assert.rejects(db.insert(seasonJobs).values({...job,saveId:'another-save'}),hasCode('23505'));
  await assert.rejects(db.insert(seasonJobs).values({...job,saveId:'absent-save',runId:'missing'}),hasCode('23503'));
  for(const invalid of [{stepOrdinal:-1},{nextExpectedRevision:-1n},{runId:''},{requestId:''}]){
   await assert.rejects(db.insert(seasonJobs).values({...job,saveId:'another-save',runId:'invalid',...invalid}),hasCode('23514'));
  }
  await assert.rejects(db.execute(sql`INSERT INTO season_jobs (save_id,run_id,request_id,status,next_expected_revision) VALUES ('another-save','bad-status','request','READY',0)`),hasCode('23514'));
  await db.delete(gameSaves).where(eq(gameSaves.id,'job-save'));
  assert.deepEqual(await db.select().from(seasonJobs),[]);
 }finally{await client.close();}
});

test('season job additive migration preserves existing saves and rolls back job/save writes together',async()=>{
 const {db,client}=await createTestDb();
 try{
  await seedAllowedSubject(db,'migration-owner');
  await seedSave(db,{id:'old-save',ownerId:'migration-owner',revision:7n,state:{schemaVersion:1,history:['kept']}});
  await client.exec('DROP TABLE season_jobs');
  const migration=readFileSync(new URL('../../../packages/db/drizzle/0002_season_jobs.sql',import.meta.url),'utf8');
  await client.exec(migration);
  await db.insert(seasonJobs).values({saveId:'old-save',runId:'durable-run',requestId:'start-request',nextExpectedRevision:7n});
  await client.exec(migration);await client.exec(M3_CORE_SQL);
  const [before]=await db.select().from(seasonJobs);
  await assert.rejects(db.transaction(async tx=>{
   await tx.update(gameSaves).set({revision:8n}).where(eq(gameSaves.id,'old-save'));
   await tx.update(seasonJobs).set({nextExpectedRevision:8n,stepOrdinal:1,status:'STOPPED',stopReason:'EVENT',progress:{seasonKey:'2032',phase:'EVENT_DECISION',completedGames:12,scheduledGames:48}}).where(eq(seasonJobs.saveId,'old-save'));
   throw new Error('ROLLBACK_PROOF');
  }),/ROLLBACK_PROOF/);
  assert.deepEqual(await db.select().from(seasonJobs),[before]);
  const [save]=await db.select().from(gameSaves).where(eq(gameSaves.id,'old-save'));
  assert.equal(save!.revision,7n);assert.deepEqual(save!.state,{schemaVersion:1,history:['kept']});
 }finally{await client.close();}
});

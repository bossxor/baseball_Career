import { storedSave } from './stored-save.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {completedHighSchoolCareer} from '../../../packages/engine/test/fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../../../packages/engine/src/high-school-route.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';

test('amateur E36 requests, cancels, archives and opens S10 through owned save commands without pro appearances',async()=>{
 const {db,client}=await createTestDb();
 try{
  const subject='amateur-retirement',headers={Authorization:`Bearer dev:${subject}`,'Content-Type':'application/json'};await seedAllowedSubject(db,subject);const app=createApp({db,auth:{allowDevBearer:true}});
  const created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'amateur-exit',mode:'CLUB'})}));
  // Controlled completed school prefix; the real save pipeline and retirement owner execute below.
  const completed=completedHighSchoolCareer(),reviewed=acknowledgeHighSchoolSeasonReview(completed,completed.revision),source=openHighSchoolCareerRoute(reviewed,reviewed.revision,1).career;
  await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));
  let saveRevision=0,careerRevision=source.revision,sequence=0;
  const send=async(type:string,payload:Record<string,unknown>)=>{const res=await app.request(`/api/saves/${created.saveId}/commands`,{method:'POST',headers,body:JSON.stringify({commandId:'exit-'+sequence++,expectedRevision:saveRevision,type,payload:{careerRevision,...payload}})});assert.equal(res.status,200);const out=await json<{revision:string;summary:{careerRevision:number;phase:string;navigation?:{targetScreen:string}}}>(res);saveRevision=Number(out.revision);careerRevision=out.summary.careerRevision;return out;};
  const screen=async()=>json<{eventKey:string;eventVersion:number;status:string;militaryStatus:string;professionalAppearances:{PA:number;outs:number}}>(await app.request(`/api/saves/${created.saveId}/screens/AMATEUR_RETIREMENT`,{headers}));
  await send('CAREER_RETRY_AMATEUR_REQUEST_RETIRE',{});let v=await screen();assert.equal(v.status,'PENDING');
  const cancelled=await send('CAREER_RETRY_AMATEUR_RESOLVE_RETIRE',{eventKey:v.eventKey,eventVersion:v.eventVersion,decision:'CANCEL_RETIRE'});assert.equal(cancelled.summary.phase,'CAREER_ROUTE');
  await send('CAREER_RETRY_AMATEUR_REQUEST_RETIRE',{});v=await screen();await send('CAREER_RETRY_AMATEUR_RESOLVE_RETIRE',{eventKey:v.eventKey,eventVersion:v.eventVersion,decision:'CONFIRM_RETIRE'});v=await screen();assert.equal(v.status,'ARCHIVED');assert.equal(v.militaryStatus,'UNRESOLVED');assert.deepEqual(v.professionalAppearances,{PA:0,outs:0});
  const opened=await send('CAREER_RETRY_AMATEUR_OPEN_ARCHIVE',{eventKey:v.eventKey,eventVersion:v.eventVersion});assert.equal(opened.summary.navigation!.targetScreen,'S10');
  const [stored]=await storedSave(db, created.saveId);const career=(stored!.state as {career:typeof source}).career;assert.equal(canonicalJson(career.records),canonicalJson(source.records));assert.equal(career.phaseContext.phase,'ARCHIVED');
 }finally{await client.close();}
});

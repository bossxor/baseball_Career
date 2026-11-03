import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {eq} from 'drizzle-orm';
import {createDbFromUrl,M3_CORE_SQL,profiles,authAllowedSubjects,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {nativeUndraftedUsReturn,nativeOptionalUsReturnRetry,nativeExhaustedUsReturnRetry} from '../../../packages/engine/test/us-return-retry-fixture.js';
import * as retry from '../../../packages/engine/src/us-return-retry.js';
import {usCareerView} from '../../../packages/engine/src/us-career-entry.js';
import type {UsCareer} from '../../../packages/engine/src/us-career-entry.js';
import {kboCareerEntryView} from '../../../packages/engine/src/kbo-career-entry.js';
import type {KboCareer} from '../../../packages/engine/src/kbo-career-entry.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';

// Opt-in isolated PostgreSQL database: PGlite exhausts WASM memory on these native multi-year JSONB saves.
const databaseUrl=process.env.PLAYBALL_LARGE_SAVE_DATABASE_URL;
/** The initial US six-year record prefix is controlled; mandatory/optional games use the shared native fixture. */
async function owned(source:unknown,run:(h:{app:ReturnType<typeof createApp>;id:string;headers:Record<string,string>;foreignHeaders:Record<string,string>;post:(id:string,name:string,payload:Record<string,unknown>,revision?:number)=>Promise<Response>;screen:(name:string)=>Promise<Response>;stored:()=>Promise<unknown>})=>Promise<void>){
 const {db,pool}=createDbFromUrl(databaseUrl!),subject='returned-'+randomUUID(),other='returned-foreign-'+randomUUID();
 try{
  await pool.query(M3_CORE_SQL);
  const headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
  await db.insert(profiles).values([{id:subject,displayName:'Returned player'},{id:other,displayName:'Other player'}]);
  await db.insert(authAllowedSubjects).values([{subject,status:'ACTIVE'},{subject:other,status:'ACTIVE'}]);const app=createApp({db,auth:{allowDevBearer:true}});
  const created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'returned-retry-http',mode:'CAREER'})}));
  await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));
  await run({app,id:created.saveId,headers,foreignHeaders:{Authorization:'Bearer dev:'+other},post:async(id,name,payload,revision=0)=>app.request('/api/saves/'+created.saveId+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:revision,type:'CAREER_RETRY_US_RETURN_'+name,payload})}),screen:async name=>app.request('/api/saves/'+created.saveId+'/screens/'+name,{headers}),stored:async()=>{const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId));return (row!.state as {career:unknown}).career;}});
 }finally{
  try{await db.delete(gameSaves).where(eq(gameSaves.ownerId,subject));for(const id of [subject,other]){await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject,id));await db.delete(profiles).where(eq(profiles.id,id));}}
  finally{await pool.end();}
 }
}

test('returned player HTTP opens once, rejects stale/foreign/authority input and persists US acceptance once',{skip:!databaseUrl},async()=>{
 const origin=nativeUndraftedUsReturn();
 await owned(origin,async h=>{
  const payload={careerRevision:origin.revision},before=canonicalJson(await h.stored());
  assert.equal((await h.post('forged','OPEN',{...payload,origin})).status,400);assert.equal(canonicalJson(await h.stored()),before);
  const opened=await h.post('open','OPEN',payload);assert.equal(opened.status,200);const receipt=await json(opened);
  assert.deepEqual(await json(await h.post('open','OPEN',payload)),receipt);
  assert.equal((await h.post('open','OPEN',{careerRevision:origin.revision-1})).status,409);
  assert.equal((await h.app.request('/api/saves/'+h.id+'/screens/RETRY_ROUTES',{headers:h.foreignHeaders})).status,404);
  const root=await h.stored() as retry.UsAmateurReturnRetryCareer;assert.equal(root.revision,origin.revision+1);
  assert.equal((await h.post('stale-save','US_ASSESS',{careerRevision:root.revision})).status,409);
  assert.equal((await h.post('stale-owner','US_ASSESS',{careerRevision:root.revision-1},1)).status,400);
  assert.equal((await h.post('assess','US_ASSESS',{careerRevision:root.revision},1)).status,200);
  const route=await json<{revision:number;routePreviewId:string;usOpportunity:{offers:{offerKey:string}[]}}>(await h.screen('RETRY_ROUTES'));
  assert.doesNotMatch(JSON.stringify(route),/"seed"|"rng"|"potential"|"basis"|"origin"/);assert.ok(route.usOpportunity.offers.length);
  const input={careerRevision:route.revision,routePreviewId:route.routePreviewId,offerKey:route.usOpportunity.offers[0]!.offerKey};
  const signed=await h.post('accept','US_ACCEPT',input,2);assert.equal(signed.status,200);const accepted=await json(signed);
  const us=await h.stored() as UsCareer;usCareerView(us);assert.equal(us.mode,'US_CAREER');assert.equal(us.contract.annualSalaryUsd,30000);assert.equal(us.retryCareer!.careerPreparationUsed,0);assert.equal(us.usReturnContinuation!.remainingControlSeasons,1);
  assert.deepEqual(await json(await h.post('accept','US_ACCEPT',input,2)),accepted);assert.equal(canonicalJson(await h.stored()),canonicalJson(us));
  assert.equal((await h.post('stale-accept','US_ACCEPT',input,2)).status,409);
  assert.equal((await h.post('wrong-owner','US_ASSESS',{careerRevision:us.revision},3)).status,400);assert.equal(canonicalJson(await h.stored()),canonicalJson(us));
 });
});

test('latest native optional player persists an actual KBO signing and activation through HTTP',{skip:!databaseUrl},async()=>{
 const source=nativeOptionalUsReturnRetry();
 await owned(source,async h=>{
  let current=source;
  const send=async(id:string,name:string,payload:Record<string,unknown>,revision:number)=>{const res=await h.post(id,name,{careerRevision:current.revision,...payload},revision);assert.equal(res.status,200);current=await h.stored() as typeof current;return json(res);};
  await send('prepare','DRAFT_PREPARE',{},0);await send('resolve','DRAFT_RESOLVE',{programVersion:current.draft!.program.version},1);
  assert.ok(current.draft!.program.result!.round);await send('sign','DRAFT_DECIDE',{programVersion:current.draft!.program.version,decision:'SIGN'},2);
  const input={careerRevision:current.revision},activated=await h.post('activate','KBO_ACTIVATE',input,3);assert.equal(activated.status,200);const receipt=await json(activated),kbo=await h.stored() as KboCareer;
  assert.equal(kboCareerEntryView(kbo).phase,'PRESEASON_SETUP');assert.equal(kbo.world.players[kbo.protagonistKey]!.age,source.retry.age+1);assert.equal(kbo.retryCareer!.careerPreparationUsed,1);assert.equal(kbo.usAmateurReturnRetryHistory!.originReturnId,source.origin.return.returnId);
  assert.equal(canonicalJson(kbo.world.players[kbo.protagonistKey]!.abilities),canonicalJson(source.preparation!.world.players[source.retry.playerKey]!.abilities));
  for(const key of Object.keys(source.preparation!.records.games))assert.ok(Object.hasOwn(kbo.records.games,key));
  assert.deepEqual(await json(await h.post('activate','KBO_ACTIVATE',input,3)),receipt);assert.equal(canonicalJson(await h.stored()),canonicalJson(kbo));
 });
});

test('three actual optional seasons persist E35 confirmation atomically without another budget charge',{skip:!databaseUrl},async()=>{
 const source=nativeExhaustedUsReturnRetry();
 await owned(source,async h=>{
  const opened=await h.post('exhaust','EXHAUST',{careerRevision:source.revision});assert.equal(opened.status,200);
  const pending=await h.stored() as retry.UsAmateurReturnRetryCareer,view=await json<{eventKey:string;eventVersion:number}>(await h.screen('RETRY_RETIREMENT')),before=canonicalJson(pending);
  assert.equal((await h.post('bad-version','CONFIRM_RETIRE',{careerRevision:pending.revision,eventKey:view.eventKey,eventVersion:view.eventVersion+1},1)).status,400);assert.equal(canonicalJson(await h.stored()),before);
  const input={careerRevision:pending.revision,eventKey:view.eventKey,eventVersion:view.eventVersion},confirmed=await h.post('retire','CONFIRM_RETIRE',input,1);assert.equal(confirmed.status,200);const receipt=await json(confirmed),archived=await h.stored() as retry.UsAmateurReturnRetryCareer;
  retry.assertUsAmateurReturnRetryCareer(archived);assert.equal(archived.status,'ARCHIVED');assert.equal(archived.retry.careerPreparationUsed,3);assert.equal(archived.completedPreparation.length,3);assert.equal(archived.origin.return.years.length,2);assert.equal(canonicalJson(archived.preparation!.records),canonicalJson(source.preparation!.records));
  assert.deepEqual(await json(await h.post('retire','CONFIRM_RETIRE',input,1)),receipt);assert.equal(canonicalJson(await h.stored()),canonicalJson(archived));
  const after=await h.screen('RETRY_RETIREMENT');assert.equal(after.status,200);assert.doesNotMatch(await after.text(),/"seed"|"rng"|"potential"|"sourceBasis"/);
 });
});

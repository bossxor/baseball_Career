import test from 'node:test';
import { loadState } from './save-state.js';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {openUsMinorMarket,type UsAmateurReturnCareer} from '@playball/engine';
import {expiredRetryUsCareer} from '../../../packages/engine/test/us-return-retry-fixture.js';
import {createApp} from '../../api/src/app.js';
import {json} from '../../api/test/json.js';
import {createHttpApi} from '../src/http.js';

test('empty US minor market returns home and resumes owned return flow after a lost receipt',async()=>{
 const {db,client}=await createTestDb(),previous=globalThis.fetch;
 try{
  const subject='us-return-web';await seedAllowedSubject(db,subject);await seedAllowedSubject(db,'foreign-return');
  const app=createApp({db,auth:{allowDevBearer:true}}),headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
  const {saveId}=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:subject,mode:'CAREER'})}));
  const closed=expiredRetryUsCareer();
  const source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(club=>({organizationId:club.id,addedBudgetUsd:0})));
  // Controlled empty quote; the market, event and all return commands use their native owners.
  source.minorMarket!.offers=[];
  assert.equal(source.minorMarket!.offers.length,0);
  await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,saveId));
  const requests:string[]=[];let lose=false;
  globalThis.fetch=(async(input:RequestInfo|URL,init?:RequestInit)=>{
   if(init?.method==='POST')requests.push(String(init.body));
   const response=await app.request(String(input),init);
   if(lose&&init?.method==='POST'){lose=false;assert.equal(response.status,200);throw new TypeError('lost response');}
   return response;
  }) as typeof fetch;
  const api=createHttpApi({baseUrl:'http://api.local',getToken:()=>`dev:${subject}`});
  const initial=(await api.flow(saveId))!,request=initial.commands.find(c=>c.id==='return-request')!;
  assert.ok(request);assert.ok(request.confirm);lose=true;
  await assert.rejects(api.flowCommand(saveId,'return-intent',request.type,request.payload));
  let view=(await api.flowCommand(saveId,'return-intent',request.type,{...request.payload,careerRevision:-1}))!;
  assert.equal(requests.at(-1),requests.at(-2));
  assert.ok((await api.career(saveId)).nextActions.some(a=>a.id==='open:FLOW'));
  assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|potential|sourceBasis|"records"/);
  const start=view.commands.find(c=>c.id==='return-start')!;assert.ok(start);
  const stale=await app.request(`/api/saves/${saveId}/commands`,{method:'POST',headers,body:JSON.stringify({commandId:'stale',expectedRevision:1,type:start.type,payload:{...start.payload,eventVersion:Number(start.payload.eventVersion)+1}})});
  assert.equal(stale.status,400);
  view=(await api.flowCommand(saveId,'start',start.type,start.payload))!;
  assert.ok(view.commands.some(c=>c.id==='return-advance'));
  const foreign=await app.request(`/api/saves/${saveId}/screens/CAREER_FLOW`,{headers:{Authorization:'Bearer dev:foreign-return'}});
  assert.equal(foreign.status,404);
  const foreignPost=await app.request(`/api/saves/${saveId}/commands`,{method:'POST',headers:{...headers,Authorization:'Bearer dev:foreign-return'},body:JSON.stringify({commandId:'foreign',expectedRevision:2,type:start.type,payload:start.payload})});
  assert.equal(foreignPost.status,404);
  const resumed=(await api.flow(saveId))!,advance=resumed.commands.find(c=>c.id==='return-advance')!;
  assert.ok(advance);
  const advanced=(await api.flowCommand(saveId,'advance',advance.type,advance.payload))!;
  assert.match(advanced.lines.find(l=>l.label==='준비 경기')!.value,/^[0-9]+\/48경기$/);
  const preparation=(await loadState(db,saveId) as {career:UsAmateurReturnCareer}).career.preparation!;
  assert.ok(preparation.pendingGame||preparation.days.days.length>0||Object.values(preparation.records.games).some(g=>g.scope.leagueKey==='INDEPENDENT'&&g.scope.seasonKey===preparation.world.seasonKey));
  assert.deepEqual(await api.flow(saveId),advanced);
 }finally{globalThis.fetch=previous;await client.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import type {HighSchoolCareer} from '@playball/engine';
import {canonicalJson} from '@playball/engine';
import {abilityKeys} from '@playball/rules';

for(const kind of ['HITTER','PITCHER'] as const)test(kind+' native school starts through owned HTTP without a database fixture',async()=>{
 const {db,client}=await createTestDb();try{
  const headers={Authorization:'Bearer dev:school-start','Content-Type':'application/json'};await seedAllowedSubject(db,'school-start');await seedAllowedSubject(db,'school-foreign');const app=createApp({db,auth:{allowDevBearer:true}});
  const create=async(id:string,mode='CAREER')=>json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:id,mode})}));
  const {saveId}=await create('school-'+kind),path='/api/saves/'+saveId;let revision=0,careerRevision=0;
  const payload={name:'시작선수',kind,position:kind==='HITTER'?'CF':'SP',throws:'R',bats:'R',pitchForm:kind==='HITTER'?null:'OVERHAND',archetype:'BALANCED',focus:abilityKeys(kind).slice(0,4),difficulty:'GROWTH',schoolId:'H01',seasonYear:2029,...(kind==='PITCHER'?{secondaryPitch:'P03'}:{})};
  const post=(id:string,type:string,p:Record<string,unknown>={},save=saveId,rev=revision,auth=headers)=>app.request('/api/saves/'+save+'/commands',{method:'POST',headers:auth,body:JSON.stringify({commandId:id,expectedRevision:rev,type:'CAREER_SCHOOL_'+type,payload:type==='CREATE'?p:{careerRevision,...p}})});
  const send=async(id:string,type:string,p:Record<string,unknown>={})=>{const result=await post(id,type,p);assert.equal(result.status,200,await result.clone().text());const out=await json<{revision:string;summary:{careerRevision:number;stopReason?:string}}>(result);revision=Number(out.revision);careerRevision=out.summary.careerRevision;return out;};
  const stored=async()=>{const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,saveId));return (row!.state as {career:HighSchoolCareer}).career;};
  const screen=async()=>{const result=await app.request(path+'/screens/SCHOOL_CAREER',{headers});assert.equal(result.status,200,await result.clone().text());const view=await json<{careerRevision:number;phase:string;event:null|{eventKey:string;eventVersion:number;definitionId:string};player:{name:string;overall:string};teamGames:number}>(result);assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"|sourceBasis|"players"|"contracts"/);return view;};
  const {saveId:club}=await create('school-club-'+kind,'CLUB');assert.equal((await post('wrong-mode','CREATE',payload,club,0)).status,400);
  assert.equal((await post('inject','CREATE',{...payload,seed:'injected'})).status,400);assert.equal((await post('bad-focus','CREATE',{...payload,focus:[]})).status,400);assert.equal((await post('foreign','CREATE',payload,saveId,0,{Authorization:'Bearer dev:school-foreign','Content-Type':'application/json'})).status,404);assert.equal(await stored(),undefined);
  const receipt=await send('create-native','CREATE',payload),source=await stored();assert.equal(source.phaseContext.phase,'CREATED');assert.equal(source.world.schools.length,9);assert.equal(Object.keys(source.world.players).length,225);assert.equal(source.world.schools.find(s=>s.id==='H01')!.roster.length,25);assert.equal(source.world.players[source.world.protagonistKey]!.age,18);assert.equal(source.world.players[source.world.protagonistKey]!.name,'시작선수');assert.ok(source.world.calendar);assert.equal((await screen()).player.name,'시작선수');
  const home=await app.request(path+'/career',{headers});assert.equal(home.status,200);const publicHome=await json<{nextActions:{command:{type:string;payload:{careerRevision:number}}}[]}>(home);assert.equal(publicHome.nextActions[0]!.command.type,'CAREER_SCHOOL_CONFIRM_PLAYER');assert.equal(publicHome.nextActions[0]!.command.payload.careerRevision,0);assert.doesNotMatch(JSON.stringify(publicHome),/"seed"|"rng"|"potential"|sourceBasis|"players"/);
  assert.deepEqual(await json(await post('create-native','CREATE',payload,saveId,0)),receipt);assert.equal((await post('overwrite','CREATE',payload)).status,400);assert.equal(canonicalJson(await stored()),canonicalJson(source));
  await send('confirm-player','CONFIRM_PLAYER');const event=(await screen()).event!;assert.equal(event.definitionId,'E01');assert.equal((await post('ignored-focus','RESOLVE_FOCUS',{eventKey:event.eventKey,eventVersion:event.eventVersion,command:'KEEP_FOCUS',focus:payload.focus})).status,400);await send('focus','RESOLVE_FOCUS',{eventKey:event.eventKey,eventVersion:event.eventVersion,command:'KEEP_FOCUS'});await send('plan','CONFIRM_PRESEASON');assert.equal((await screen()).phase,'SEASON_PROGRESS');
  const before=await stored(),first=await send('advance','ADVANCE',{mode:'ONE_GAME'}),after=await stored();assert.notEqual(first.summary.stopReason,'ENGINE_LIMIT');assert.ok(after.revision>before.revision);assert.ok(after.phaseContext.phase==='SEASON_PROGRESS'||after.phaseContext.phase==='EVENT_DECISION');assert.deepEqual(JSON.parse(JSON.stringify(after)),after);await screen();
 }finally{await client.close();}
});

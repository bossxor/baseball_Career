import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {eq} from 'drizzle-orm';
import {authAllowedSubjects,commandReceipts,createDbFromUrl,gameSaveParts,gameSaves,M3_CORE_SQL,profiles,writeSaveState} from '@playball/db';
import * as engine from '@playball/engine';
import {controlledUsKboReturn} from '../../../packages/engine/test/us-kbo-return-fixture.js';
import {createApp} from '../src/app.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {careerFlowScreen} from '../src/career-flow-screen.js';
import type {SaveState} from '../src/engine-command.js';
import {json} from './json.js';
import {storedSave} from './stored-save.js';

function controlledReturnSave(){
 const {c,source,authority}=controlledUsKboReturn();
 const nextSeason=authority.host.world.seasonKey;
 // Controlled preseason authority isolates the command boundary from multi-season gameplay.
 const host=engine.createNpcLeagueHost({...engine.usNationalNpcOwner(c),seasonKey:nextSeason},Number(nextSeason),'calendar-2');
 host.departure={kboRevision:source.revision,usActivationReceiptKey:c.activation.receiptKey};
 host.revision=host.game.revision=authority.revision;
 const raw:SaveState={schemaVersion:1,career:c,kboDeparture:source,collegeNationalHost:host};
 return {raw,c,source,authority,host,nextSeason};
}

test('E67 compares server-owned domestic offers and replaces the root with its archive and ownership receipt',()=>{
 const {raw,c,source,authority,host,nextSeason}=controlledReturnSave();
 const command=(type:string,payload:unknown)=>({type,payload,commandId:type,expectedRevision:0});
 const open=careerFlowScreen(raw).commands.find(o=>o.id==='kbo-return-open')!;
 assert.ok(open);
 const usOffers=careerFlowScreen(raw).commands.filter(o=>o.type==='CAREER_US_PLAY_ACCEPT_MINOR_OFFER');
 assert.ok(usOffers.length);
 assert.ok(!careerFlowScreen({...raw,kboDeparture:undefined}).commands.some(o=>o.type.startsWith('CAREER_US_KBO_RETURN_')));
 const forgedHost={...host,departure:{...host.departure,usActivationReceiptKey:'foreign-activation'}};
 assert.throws(()=>applyEngineCommand({...raw,collegeNationalHost:forgedHost},command(open.type,open.payload)),/US_KBO_RETURN_NOT_AVAILABLE/);
 assert.throws(()=>applyEngineCommand(raw,command(open.type,{...open.payload,world:authority.host.world})),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand(raw,command(open.type,{...open.payload,careerRevision:c.revision-1})),/STALE_US_CAREER_REVISION/);
 const quote=applyEngineCommand(raw,command(open.type,open.payload));
 assert.deepEqual(quote.eventIds,['E67']);
 assert.equal(quote.nextState.kboDeparture,source);
 assert.equal(quote.nextState.collegeNationalHost,host);
 const view=careerFlowScreen(quote.nextState);
 assert.deepEqual(view.commands.filter(o=>o.type==='CAREER_US_PLAY_ACCEPT_MINOR_OFFER').map(o=>o.payload.offerKey),usOffers.map(o=>o.payload.offerKey));
 assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"|"sourceRevision"/);
 const accept=view.commands.find(o=>o.type==='CAREER_US_KBO_RETURN_ACCEPT')!;
 assert.ok(accept);
 assert.throws(()=>applyEngineCommand(quote.nextState,command(accept.type,{...accept.payload,hostRevision:host.revision+1})),/STALE_US_KBO_AUTHORITY/);
 assert.throws(()=>applyEngineCommand(quote.nextState,command(accept.type,{...accept.payload,eventVersion:-1})),/EVENT_VERSION_CHANGED/);
 const cancel=view.commands.find(o=>o.type==='CAREER_US_KBO_RETURN_CANCEL')!;
 const cancelled=applyEngineCommand(quote.nextState,command(cancel.type,cancel.payload)).nextState;
 const continuing=cancelled.career as engine.UsCareer;
 assert.equal(continuing.domesticReturn,undefined);
 assert.equal(continuing.events.find(e=>e.eventKey===cancel.payload.eventKey)?.resolution?.command,'CANCEL_RETURN');
 assert.equal(continuing.events.find(e=>e.eventKey===continuing.minorMarket!.eventKey)?.status,'OPEN');
 const reopen=careerFlowScreen(cancelled).commands.find(o=>o.id==='kbo-return-open')!;
 const reopened=applyEngineCommand(cancelled,command(reopen.type,reopen.payload)).nextState;
 const reopenedOffer=careerFlowScreen(reopened).commands.find(o=>o.type===accept.type)!;
 assert.notEqual(reopenedOffer.payload.eventKey,accept.payload.eventKey);
 const result=applyEngineCommand(reopened,command(reopenedOffer.type,reopenedOffer.payload));
 const kbo=result.nextState.career as engine.KboCareer;
 const [{archivedUs,ownership}]=result.nextState.kboReturnHistory as [{archivedUs:engine.UsCareer;ownership:engine.UsKboOwnershipReceipt}];
 assert.equal(engine.kboCareerEntryView(kbo).seasonKey,nextSeason);
 assert.equal(kbo.activation.receiptKey,ownership.receiptKey);
 assert.equal(ownership.authoritySourceRevision,host.revision);
 assert.equal(result.nextState.collegeNationalHost,undefined);
 assert.equal(result.nextState.kboDeparture,undefined);
 assert.equal(archivedUs.phaseContext.phase,'ARCHIVED');
 assert.deepEqual(archivedUs.domesticReturn?.ownership,ownership);
 assert.deepEqual(archivedUs.income,c.income);
 assert.equal(Object.keys(kbo.records.games).length,Object.keys(c.records.games).length);
 assert.throws(()=>applyEngineCommand(result.nextState,command(accept.type,accept.payload)),/US_KBO_RETURN_NOT_AVAILABLE/);
});

const databaseUrl=process.env.PLAYBALL_LARGE_SAVE_DATABASE_URL;
test('disposable PostgreSQL: competing E66/E67 acceptances commit one split save and one receipt',{skip:!databaseUrl},async()=>{
 const url=new URL(databaseUrl!);
 assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Use a disposable local PostgreSQL database');
 const {db,pool}=createDbFromUrl(databaseUrl!),subject='e66-e67-'+randomUUID();
 let initialized=false;
 try{
  await pool.query(M3_CORE_SQL);
  initialized=true;
  await db.insert(profiles).values({id:subject,displayName:'Return race fixture'});
  await db.insert(authAllowedSubjects).values({subject,status:'ACTIVE'});
  const headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'},app=createApp({db,auth:{allowDevBearer:true}});
  const {saveId}=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'return-race',mode:'CAREER'})}));
  const {raw,c,source,host,nextSeason}=controlledReturnSave();
  await db.transaction(async tx=>{
   const state=await writeSaveState(tx,saveId,0n,raw);
   assert.equal(state.stateFormat,'PARTS_V1');
   await tx.update(gameSaves).set(state).where(eq(gameSaves.id,saveId));
  });
  const path='/api/saves/'+saveId;
  const flow=async()=>json<ReturnType<typeof careerFlowScreen>>(await app.request(path+'/screens/CAREER_FLOW',{headers}));
  const post=(commandId:string,expectedRevision:number,command:{type:string;payload:unknown})=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId,expectedRevision,type:command.type,payload:command.payload})});
  const open=(await flow()).commands.find(command=>command.id==='kbo-return-open');
  assert.ok(open);
  assert.equal((await post('open-return',0,open)).status,200);
  const {commands}=await flow();
  const us=commands.find(command=>command.type==='CAREER_US_PLAY_ACCEPT_MINOR_OFFER'),kbo=commands.find(command=>command.type==='CAREER_US_KBO_RETURN_ACCEPT');
  assert.ok(us&&kbo);
  const entries=[{id:'accept-e66',command:us},{id:'accept-e67',command:kbo}];
  const responses=await Promise.all(entries.map(({id,command})=>post(id,1,command)));
  assert.deepEqual(responses.map(response=>response.status).sort((a,b)=>a-b),[200,409]);
  const winner=responses.findIndex(response=>response.status===200),{id,command}=entries[winner]!;
  const result=await json<{revision:string}>(responses[winner]!);
  assert.equal(result.revision,'2');
  assert.deepEqual(await json(await post(id,1,command)),result);

  const [stored]=await storedSave(db,saveId);
  assert.ok(stored);
  assert.equal(stored.revision,2n);
  assert.equal(stored.stateFormat,'PARTS_V1');
  const parts=await db.select({revision:gameSaveParts.revision}).from(gameSaveParts).where(eq(gameSaveParts.saveId,saveId));
  assert.ok(parts.length>1);
  assert.ok(parts.every(part=>part.revision===2n));
  const receipts=await db.select({id:commandReceipts.commandId,revision:commandReceipts.resultingRevision}).from(commandReceipts).where(eq(commandReceipts.saveId,saveId));
  assert.deepEqual(receipts.sort((a,b)=>Number(a.revision-b.revision)),[{id:'open-return',revision:1n},{id,revision:2n}]);

  const state=stored.state as SaveState;
  if(id==='accept-e67'){
   const career=state.career as engine.KboCareer;
   const [{archivedUs,ownership}]=state.kboReturnHistory as [{archivedUs:engine.UsCareer;ownership:engine.UsKboOwnershipReceipt}];
   assert.equal(engine.kboCareerEntryView(career).seasonKey,nextSeason);
   assert.equal(career.activation.receiptKey,ownership.receiptKey);
   assert.equal(ownership.authoritySourceRevision,host.revision);
   assert.equal(archivedUs.phaseContext.phase,'ARCHIVED');
   assert.deepEqual(archivedUs.income,c.income);
   assert.equal(state.kboDeparture,undefined);
   assert.equal(state.collegeNationalHost,undefined);
  }else{
   const career=state.career as engine.UsCareer;
   assert.equal(career.mode,'US_CAREER');
   assert.equal(career.world.seasonKey,nextSeason);
   assert.notEqual(career.contract.contractKey,c.contract.contractKey);
   assert.equal(career.domesticReturn,undefined);
   assert.equal(state.kboReturnHistory,undefined);
   assert.equal((state.kboDeparture as engine.KboCareer).revision,source.revision);
   assert.equal((state.collegeNationalHost as engine.CollegeLeagueHost).revision,host.revision);
  }
 }finally{
  try{
   if(initialized){
    await db.delete(gameSaves).where(eq(gameSaves.ownerId,subject));
    await db.delete(authAllowedSubjects).where(eq(authAllowedSubjects.subject,subject));
    await db.delete(profiles).where(eq(profiles.id,subject));
   }
  }finally{await pool.end();}
 }
});

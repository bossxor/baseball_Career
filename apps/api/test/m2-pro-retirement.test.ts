import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import type {KboCareer,UsCareer} from '@playball/engine';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {proRetirementScreen} from '../src/career-pro-retirement-shell.js';
import {finishedUsCareerFixture} from '../../../packages/engine/test/us-finished-fixture.js';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {confirmKboPreseasonPlan} from '../../../packages/engine/src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../../../packages/engine/src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../../../packages/engine/src/kbo-schedule.js';
import {startKboRegularSeason} from '../../../packages/engine/src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../../../packages/engine/src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../../../packages/engine/src/kbo-season-growth.js';
import {closeKboSeason} from '../../../packages/engine/src/kbo-year-end.js';
type Pro=KboCareer|UsCareer;
const apply=(c:Pro,type:string,payload:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:'retire',expectedRevision:0,type:'CAREER_PRO_RETIRE_'+type,payload:{careerRevision:c.revision,...payload}}).nextState.career as Pro;
const resolve=(c:Pro,command:string)=>{const e=c.events.find(e=>c.phaseContext.phase==='RETIRE_CONFIRM'&&e.eventKey===c.phaseContext.eventKey)!;return apply(c,'RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command});};
let cached:KboCareer|undefined;
/** Controlled regular-day receipts; actual native postseason games, growth and year close. Not a full regular season. */
function closedKbo(){
 if(cached)return structuredClone(cached);const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);let c=structuredClone(startKboRegularSeason(s,s.revision));
 const games=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...games.map(g=>g.worldDay)),last=Math.max(...games.map(g=>g.worldDay));c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;cached=closeKboSeason(c,c.revision,true);return structuredClone(cached);
}

test('retirement Flow shows a zero-game KBO archive and keeps the US farewell command',async()=>{
 const {db,client}=await createTestDb();
 try {
  const subject='retirement-summary',headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};
  await seedAllowedSubject(db,subject);
  const app=createApp({db,auth:{allowDevBearer:true}});
  const {saveId}=await json<{saveId:string}>(await app.request('/api/game-creations',{
   method:'POST',headers,body:JSON.stringify({creationId:subject,mode:'CAREER'}),
  }));
  const kbo=enteredKboCareer(),player=kbo.world.players[kbo.protagonistKey]!;
  kbo.phaseContext={phase:'ARCHIVED'};
  kbo.retirement={reason:'VOLUNTARY',seasonKey:kbo.world.seasonKey,age:player.age,clubId:kbo.protagonistClubId,
   receiptKey:'test-archive',sourceRevision:kbo.revision,remainingContractYears:0};
  const us=resolve(apply(finishedUsCareerFixture(),'REQUEST'),'CONFIRM_RETIRE');
  for(const c of [kbo,us]){
   await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,saveId));
   const response=await app.request(`/api/saves/${saveId}/screens/CAREER_FLOW`,{headers});
   assert.equal(response.status,200);
   const view=await json<{retirementSummary:{name:string;sections:{title:string;lines:{label:string;value:string}[]}[]};commands:{type:string;payload:Record<string,unknown>}[]}>(response);
   assert.equal(view.retirementSummary.name,c.world.players[c.protagonistKey]!.name);
   assert.doesNotMatch(JSON.stringify(view.retirementSummary),/potential|sourceBasis|"rng"|"seed"|archiveKey/);
   if(c===kbo){
    const row=view.retirementSummary.sections.find(s=>s.title==='KBO 정규시즌');
    assert.equal(row?.lines.find(l=>l.label==='경기')?.value,'0');
   }else{
    const e=us.events.find(e=>e.definitionId==='E69'&&e.status==='OPEN')!;
    const command=view.commands.find(x=>x.type==='CAREER_PRO_RETIRE_OPEN_ARCHIVE');
    assert.deepEqual(command?.payload,{careerRevision:us.revision,eventKey:e.eventKey,eventVersion:e.version});
    const result=await app.request(`/api/saves/${saveId}/commands`,{method:'POST',headers,body:JSON.stringify({
     commandId:'summary-farewell',expectedRevision:0,type:command!.type,payload:command!.payload,
    })});
    assert.equal(result.status,200);
   }
  }
 } finally { await client.close(); }
});

test('KBO and US native retirement cancel/confirm preserve money, records and identity and project public frozen archives',()=>{
 for(const c of [closedKbo(),finishedUsCareerFixture()]){
  const before=canonicalJson(c),opened=apply(c,'REQUEST');assert.equal(opened.phaseContext.phase,'RETIRE_CONFIRM');const v=proRetirementScreen({schemaVersion:1,career:opened},'CAREER_PRO_RETIREMENT');assert.deepEqual(v.confirmation!.commands,['CONFIRM_RETIRE','CANCEL_RETIRE']);assert.doesNotMatch(JSON.stringify(v),/potential|sourceBasis|"rng"|"seed"|ledger/);
  const cancel=resolve(opened,'CANCEL_RETIRE');assert.equal(cancel.phaseContext.phase,'SEASON_REVIEW');assert.equal(cancel.retirement,undefined);
  const retired=resolve(JSON.parse(JSON.stringify(opened)) as Pro,'CONFIRM_RETIRE');assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.retirement!.reason,'VOLUNTARY');assert.equal(canonicalJson(c),before);assert.equal(canonicalJson(retired.records),canonicalJson(c.records));assert.equal(canonicalJson(retired.world),canonicalJson(c.world));
  if('mode'in c&&c.mode==='US_CAREER'){assert.deepEqual((retired as UsCareer).income,c.income);assert.deepEqual((retired as UsCareer).contract,c.contract);}
  const view=proRetirementScreen({schemaVersion:1,career:retired},'CAREER_PRO_ARCHIVE');assert.ok(view.archive);assert.equal(view.archive.archiveKey,retired.retirement!.receiptKey);assert.equal(view.archive.player.abilities.length,6);assert.equal(view.archive.player.name,c.world.players[c.protagonistKey]!.name);assert.doesNotMatch(JSON.stringify(view),/potential|sourceBasis|"rng"|"seed"|openingPlayers|amateurHistory/);assert.deepEqual(proRetirementScreen({schemaVersion:1,career:JSON.parse(JSON.stringify(retired))},'CAREER_PRO_ARCHIVE'),view);assert.throws(()=>apply(retired,'REQUEST'));
 }
});

test('retirement trust boundary rejects unsupported choices, injected ledgers, wrong version/revision and early retirement',()=>{
 for(const c of [closedKbo(),finishedUsCareerFixture()]){
  const opened=apply(c,'REQUEST'),e=opened.events.find(e=>e.definitionId==='E36'&&e.status==='OPEN')!,before=canonicalJson(opened);
  for(const choice of ['__proto__','ACK_EVENT','RETIRE','CONFIRM'])assert.throws(()=>resolve(opened,choice),/INVALID_PAYLOAD/);
  assert.throws(()=>apply(opened,'RESOLVE',{eventKey:e.eventKey,eventVersion:e.version+1,command:'CONFIRM_RETIRE'}),/VERSION/);assert.throws(()=>apply(opened,'RESOLVE',{eventKey:'wrong',eventVersion:e.version,command:'CONFIRM_RETIRE'}));assert.throws(()=>apply(opened,'RESOLVE',{careerRevision:opened.revision-1,eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'}),/REVISION/);assert.equal(canonicalJson(opened),before);
  assert.throws(()=>apply(c,'REQUEST',{retirement:{reason:'MAX_AGE'}}),/INVALID_PAYLOAD/);assert.throws(()=>apply(c,'MAX_AGE'),/NOT_AVAILABLE/);assert.throws(()=>proRetirementScreen({schemaVersion:1,career:c},'CAREER_PRO_ARCHIVE'));
 }
 assert.throws(()=>apply(enteredKboCareer(),'REQUEST'),/NOT_AVAILABLE/);
});

test('native maximum-age guard freezes both roots at45 without new pay or military exemption',()=>{
 for(const c of [closedKbo(),finishedUsCareerFixture()]){c.world.players[c.protagonistKey]!.age=45;const before=canonicalJson(c),retired=apply(c,'MAX_AGE');assert.equal(retired.retirement!.reason,'MAX_AGE');assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(proRetirementScreen({schemaVersion:1,career:retired},'CAREER_PRO_ARCHIVE').archive!.retirement.age,45);assert.equal(canonicalJson(c),before);assert.equal(canonicalJson(retired.world),canonicalJson(c.world));if('mode'in c&&c.mode==='US_CAREER')assert.deepEqual((retired as UsCareer).military,c.military);}
});

test('owned retirement HTTP persists confirmation once and reloads the actual archive with CAS and owner isolation',async()=>{
 const {db,client}=await createTestDb();try{
  const c=closedKbo(),headers={Authorization:'Bearer dev:retirement-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'retirement-owner');await seedAllowedSubject(db,'retirement-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),creation=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'retire-http',mode:'CLUB'})}));await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,creation.saveId));const path='/api/saves/'+creation.saveId,post=(id:string,revision:number,type:string,payload:Record<string,unknown>)=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:revision,type:'CAREER_PRO_RETIRE_'+type,payload})});
  assert.equal((await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers})).status,400);assert.equal((await post('request',0,'REQUEST',{careerRevision:c.revision})).status,200);const read=await app.request(path+'/screens/CAREER_PRO_RETIREMENT',{headers});assert.equal(read.status,200);const view=await json<{careerRevision:number;confirmation:{eventKey:string;eventVersion:number}}>(read),payload={careerRevision:view.careerRevision,eventKey:view.confirmation.eventKey,eventVersion:view.confirmation.eventVersion,command:'CONFIRM_RETIRE'};
  assert.equal((await post('invalid',1,'RESOLVE',{...payload,command:'UNKNOWN'})).status,400);const done=await post('confirm',1,'RESOLVE',payload);assert.equal(done.status,200);const receipt=await json(done);assert.deepEqual(await json(await post('confirm',1,'RESOLVE',payload)),receipt);assert.equal((await post('stale',1,'RESOLVE',payload)).status,409);
  const archive=await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers});assert.equal(archive.status,200);const publicView=await json<{archive:{archiveKey:string}}>(archive),[row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,creation.saveId));assert.equal(publicView.archive.archiveKey,(row!.state as {career:KboCareer}).career.retirement!.receiptKey);assert.equal((await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers:{Authorization:'Bearer dev:retirement-foreign'}})).status,404);
 }finally{await client.close();}
});


test('pro farewell navigation opens the native archive for E37/E69 without copying a player or changing financial history',()=>{
 const seen=new Set<string>();
 for(const source of [closedKbo(),finishedUsCareerFixture()]){
  const c=resolve(apply(source,'REQUEST'),'CONFIRM_RETIRE'),e=c.events.at(-1)!,before=canonicalJson(c),state={schemaVersion:1,career:c},view=proRetirementScreen(state,'CAREER_PRO_ARCHIVE') as {farewell?:{eventKey:string;eventVersion:number;commands:string[]}};seen.add(e.definitionId);assert.ok(view.farewell);assert.deepEqual(view.farewell.commands,['OPEN_ARCHIVE']);
  const command={commandId:'farewell',expectedRevision:0,type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version}},result=applyEngineCommand(state,command),next=result.nextState.career as typeof c;assert.equal(result.summary.navigation&&typeof result.summary.navigation==='object'&&(result.summary.navigation as {targetScreen:string}).targetScreen,'S10');assert.equal(next.phaseContext.phase,'ARCHIVED');assert.equal(next.revision,c.revision+1);assert.equal(next.events.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.deepEqual(next.retirement,c.retirement);if('mode'in c){assert.deepEqual((next as UsCareer).income,c.income);assert.deepEqual((next as UsCareer).contract,c.contract);}assert.equal(canonicalJson(c),before);assert.deepEqual(applyEngineCommand({schemaVersion:1,career:JSON.parse(before)},command),result);
  assert.throws(()=>applyEngineCommand({schemaVersion:1,career:next},{...command,payload:{...command.payload,careerRevision:next.revision}}),/VERSION|RESOLVED/);assert.throws(()=>applyEngineCommand(state,{...command,payload:{...command.payload,eventKey:'foreign'}}));assert.throws(()=>applyEngineCommand(state,{...command,payload:{...command.payload,world:{}}}),/INVALID_PAYLOAD/);const closed=proRetirementScreen({schemaVersion:1,career:next},'CAREER_PRO_ARCHIVE') as typeof view;assert.deepEqual(closed.farewell!.commands,[]);
 }
 assert.deepEqual([...seen].sort(),['E37','E69']);
});


test('pro archive keeps legacy snapshots readable, rejects duplicate farewell authority and validates revision/event version',()=>{
 const c=resolve(apply(finishedUsCareerFixture(),'REQUEST'),'CONFIRM_RETIRE'),e=c.events.at(-1)!,command={commandId:'open-archive',expectedRevision:0,type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version}};
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:c},{...command,payload:{...command.payload,careerRevision:c.revision-1}}),/REVISION/);assert.throws(()=>applyEngineCommand({schemaVersion:1,career:c},{...command,payload:{...command.payload,eventVersion:e.version+1}}),/VERSION/);
 const legacy=structuredClone(c);legacy.events=legacy.events.filter(n=>n.eventKey!==e.eventKey);const view=proRetirementScreen({schemaVersion:1,career:legacy},'CAREER_PRO_ARCHIVE') as {farewell:unknown;archive:{archiveKey:string}};assert.equal(view.farewell,null);assert.equal(view.archive.archiveKey,c.retirement!.receiptKey);assert.throws(()=>applyEngineCommand({schemaVersion:1,career:legacy},command),/FAREWELL/);
 const duplicate=structuredClone(c);duplicate.events=[...duplicate.events,structuredClone(e)];assert.throws(()=>proRetirementScreen({schemaVersion:1,career:duplicate},'CAREER_PRO_ARCHIVE'),/FAREWELL/);assert.throws(()=>applyEngineCommand({schemaVersion:1,career:duplicate},command),/FAREWELL/);
});

test('pro farewell HTTP closes the stored navigation once and preserves archived identity and income across retries',async()=>{
 const {db,client}=await createTestDb();try{
  const c=resolve(apply(finishedUsCareerFixture(),'REQUEST'),'CONFIRM_RETIRE'),headers={Authorization:'Bearer dev:farewell-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'farewell-owner');await seedAllowedSubject(db,'farewell-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'farewell-http',mode:'CLUB'})}));await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId,response=await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers});assert.equal(response.status,200);const view=await json<{careerRevision:number;farewell:{eventKey:string;eventVersion:number;commands:string[]}}>(response);assert.deepEqual(view.farewell.commands,['OPEN_ARCHIVE']);assert.doesNotMatch(JSON.stringify(view.farewell),/evidenceKey|receiptKey|resume|sourceRevision|potential/);const payload={careerRevision:view.careerRevision,eventKey:view.farewell.eventKey,eventVersion:view.farewell.eventVersion},post=(id:string,extra:Record<string,unknown>={})=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:0,type:'CAREER_PRO_RETIRE_OPEN_ARCHIVE',payload:{...payload,...extra}})});
  assert.equal((await post('bad',{retirement:{}})).status,400);const done=await post('open');assert.equal(done.status,200);const receipt=await json<{summary:{navigation:{targetScreen:string}}}>(done);assert.equal(receipt.summary.navigation.targetScreen,'S10');assert.deepEqual(await json(await post('open')),receipt);assert.equal((await post('stale')).status,409);
  const [saved]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(saved!.state as {career:UsCareer}).career;assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.deepEqual(next.income,(c as UsCareer).income);assert.deepEqual(next.retirement,c.retirement);assert.equal(next.phaseContext.phase,'ARCHIVED');assert.equal((await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers:{Authorization:'Bearer dev:farewell-foreign'}})).status,404);const after=await json<{farewell:{commands:string[]}}>(await app.request(path+'/screens/CAREER_PRO_ARCHIVE',{headers}));assert.deepEqual(after.farewell.commands,[]);
 }finally{await client.close();}
});


test('a cancelled pro retirement can be requested again with a new confirmation identity while keeping the old decision',()=>{
 for(const source of [closedKbo(),finishedUsCareerFixture()]){const first=apply(source,'REQUEST'),old=first.events.at(-1)!,cancelled=resolve(first,'CANCEL_RETIRE'),second=apply(cancelled,'REQUEST'),current=second.events.at(-1)!;assert.notEqual(current.eventKey,old.eventKey);assert.equal(second.events.find(e=>e.eventKey===old.eventKey)!.status,'RESOLVED');const retired=resolve(second,'CONFIRM_RETIRE');assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.events.find(e=>e.eventKey===current.eventKey)!.resolution!.command,'CONFIRM_RETIRE');assert.equal(canonicalJson(retired.records),canonicalJson(source.records));}
});

import {createWorldEvent,resolveKboRetirement} from '@playball/engine';

test('legacy pending pro retirement confirmations remain readable and confirmable after identity versioning',()=>{
 for(const source of [closedKbo(),finishedUsCareerFixture()]){const asked=apply(source,'REQUEST'),e=asked.events.at(-1)!,receipt=JSON.stringify(['mode'in asked?'us-retirement':'kbo-retirement',asked.world.worldKey,asked.world.seasonKey,asked.protagonistKey]),legacy=createWorldEvent({definitionId:'E36',worldKey:e.worldKey,seasonKey:e.seasonKey,evidence:{...e.evidence,fields:{...e.evidence.fields,retirementTaskOrReceiptId:receipt}},resume:e.resume,sourceSequence:e.sourceSequence,worldDay:e.occurredWorldDay});asked.events=[...asked.events.slice(0,-1),legacy];asked.phaseContext={phase:'RETIRE_CONFIRM',eventKey:legacy.eventKey};const retired=resolve(JSON.parse(JSON.stringify(asked)),'CONFIRM_RETIRE');assert.equal(retired.phaseContext.phase,'ARCHIVED');assert.equal(retired.retirement!.receiptKey,receipt);assert.equal(retired.events.at(-1)!.evidence.fields.retirementTaskOrReceiptId,receipt);}
});


test('native KBO confirmation refuses an unknown runtime command without retiring or consuming the pending task',()=>{
 const c=apply(closedKbo(),'REQUEST') as KboCareer,e=c.events.at(-1)!,before=canonicalJson(c);assert.throws(()=>resolveKboRetirement(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'UNKNOWN' as 'CONFIRM_RETIRE'}),/INVALID_KBO_RETIREMENT_EVENT/);assert.equal(canonicalJson(c),before);
});

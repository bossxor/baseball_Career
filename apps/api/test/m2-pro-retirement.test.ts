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

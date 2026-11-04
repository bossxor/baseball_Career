import test from 'node:test';
import assert from 'node:assert/strict';
import {applyEngineCommand} from '../src/engine-command.js';
import {activeUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import {refreshCareerAchievements} from '../../../packages/engine/src/career-achievements.js';
test('achievement E90 reaches the actual native notice owner',()=>{const c=refreshCareerAchievements(activeUsCareer('HITTER')),e=c.achievements!.notices.find(e=>e.status==='OPEN')!;assert.ok(e);const r=applyEngineCommand({schemaVersion:1,career:c},{commandId:'honor',expectedRevision:0,type:'CAREER_HONOR_ACHIEVEMENT',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_ACHIEVEMENTS'}});assert.ok(r.summary.navigation);});

import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {careerHonorsScreen} from '../src/career-support-shell.js';
import {enteredKboCareer,enrolledCollegeCareer} from '../../../packages/engine/test/fixtures.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {createSeasonGrowthLedger,finalizeSeasonGrowth} from '../../../packages/engine/src/growth-ledger.js';
import {settleCareerSeasonAlias} from '../../../packages/engine/src/career-alias.js';
import type {GoalCareer,KboCareer} from '@playball/engine';
const apply=(c:GoalCareer,type:string,extra:Record<string,unknown>)=>applyEngineCommand({schemaVersion:1,career:c},{commandId:type,expectedRevision:0,type:'CAREER_HONOR_'+type,payload:{careerRevision:c.revision,...extra}});
/** Isolate annual alias selection with a controlled100-day growth ledger, not a played KBO year. */
function aliased(){const c=enteredKboCareer(),p=c.world.players[c.protagonistKey]!;c.seasonGrowth=finalizeSeasonGrowth(p,createSeasonGrowthLedger(p,c.world.seasonKey,100),100).ledger;p.archetype=p.archetype==='SLUGGER'?'BALANCED':'SLUGGER';c.phaseContext={phase:'SEASON_REVIEW'};return settleCareerSeasonAlias(c);}

test('actual E42 acknowledges only its alias outbox and exposes a receipt-free historical display',()=>{
 const c=aliased(),e=c.aliases!.notices.find(e=>e.status==='OPEN')!,before=canonicalJson(c);assert.ok(e);const view=careerHonorsScreen({schemaVersion:1,career:c});assert.equal(view.alias.history.length,c.aliases!.history.length);assert.equal(view.alias.current.display,c.aliases!.history.at(-1)!.after.display);assert.doesNotMatch(JSON.stringify(view),/completionReceipt|sourceRevision|receiptKey|firstReceipt|sourceBasis|"sources"|"rng"|"seed"|potential/);
 const next=apply(c,'ALIAS',{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'}).nextState.career as KboCareer;assert.equal(next.aliases!.notices.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.equal(canonicalJson(c),before);for(const field of ['world','records','health','seasonGrowth','goals'] as const)assert.equal(canonicalJson(next[field]??null),canonicalJson(c[field]??null));assert.deepEqual(next.aliases!.history,c.aliases!.history);
 const blocked={...c,phaseContext:{phase:'ARCHIVED' as const}};assert.ok(careerHonorsScreen({schemaVersion:1,career:blocked}).alias.notices.every(n=>n.commands.length===0));assert.throws(()=>apply(blocked,'ALIAS',{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT'}),/PHASE/);
});

test('honors expose cosmetics across owned school/pro roots without refreshing or issuing achievements on read',()=>{
 for(const c of [enrolledCollegeCareer(),enteredKboCareer(),refreshCareerAchievements(activeUsCareer('HITTER'))]){const before=canonicalJson(c),view=careerHonorsScreen({schemaVersion:1,career:c});assert.equal(view.gameplayRewardDelta,0);assert.ok(view.achievements.achievements.length);assert.ok(view.alias.current.typeLabel);assert.equal(canonicalJson(c),before);assert.doesNotMatch(JSON.stringify(view),/receiptKey|firstReceipt|sourceRevision|completionReceipt|sourceBasis|"sources"|"rng"|"seed"|potential/);}
 const c=refreshCareerAchievements(activeUsCareer('HITTER')),e=c.achievements!.notices.find(e=>e.status==='OPEN')!,before=canonicalJson(c),next=apply(c,'ACHIEVEMENT',{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_ACHIEVEMENTS'}).nextState.career as typeof c;assert.deepEqual(next.achievements!.unlocks,c.achievements!.unlocks);assert.deepEqual(next.achievements!.rewards,c.achievements!.rewards);assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.deepEqual(next.income,c.income);assert.equal(canonicalJson(c),before);
 for(const command of ['__proto__','ACK_EVENT','SET_GOALS'])assert.throws(()=>apply(c,'ACHIEVEMENT',{eventKey:e.eventKey,eventVersion:e.version,command}),/INVALID_PAYLOAD/);assert.throws(()=>apply(c,'ACHIEVEMENT',{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_ACHIEVEMENTS',rewards:[]}),/INVALID_PAYLOAD/);assert.throws(()=>apply(c,'ACHIEVEMENT',{eventKey:e.eventKey,eventVersion:e.version+1,command:'OPEN_ACHIEVEMENTS'}),/VERSION/);
});

test('honors HTTP uses the actual achievement owner with save CAS/replay, reloadable rewards and isolated reads',async()=>{
 const {db,client}=await createTestDb();try{
  const c=refreshCareerAchievements(activeUsCareer('HITTER')),e=c.achievements!.notices.find(e=>e.status==='OPEN')!,headers={Authorization:'Bearer dev:honor-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'honor-owner');await seedAllowedSubject(db,'honor-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'honor-http',mode:'CLUB'})}));await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId;
  const screen=await app.request(path+'/screens/CAREER_HONORS',{headers});assert.equal(screen.status,200);assert.doesNotMatch(await screen.text(),/receiptKey|firstReceipt|sourceBasis|potential|"rng"|"seed"/);const post=(id:string,extra:Record<string,unknown>={})=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:0,type:'CAREER_HONOR_ACHIEVEMENT',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_ACHIEVEMENTS',...extra}})});
  assert.equal((await post('injected',{achievements:[]})).status,400);const done=await post('read');assert.equal(done.status,200);const receipt=await json<{summary:{navigation:unknown}}>(done);assert.ok(receipt.summary.navigation);assert.deepEqual(await json(await post('read')),receipt);assert.equal((await post('stale')).status,409);const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(row!.state as {career:typeof c}).career;assert.deepEqual(next.achievements!.rewards,c.achievements!.rewards);assert.equal(next.achievements!.notices.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.equal((await app.request(path+'/screens/CAREER_HONORS',{headers:{Authorization:'Bearer dev:honor-foreign'}})).status,404);
 }finally{await client.close();}
});

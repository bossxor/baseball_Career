import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {relationScreen} from '../src/career-relations-shell.js';
import {activeUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer,enrolledCollegeCareer,completedCollegeAcademicYear} from '../../../packages/engine/test/fixtures.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../../../packages/engine/src/college-year.js';
import {schoolYearEndBasis} from '../../../packages/engine/src/college-entry.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {applyEngineCommand} from '../src/engine-command.js';
import type {KboCareer,HighSchoolCareer} from '@playball/engine';

const apply=(c:KboCareer|HighSchoolCareer,event:{eventKey:string;version:number})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:'read-'+event.eventKey,expectedRevision:0,type:'CAREER_RELATIONS_RESOLVE',payload:{careerRevision:c.revision,eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_RELATIONS'}});
test('actual KBO/college registration notice uses its native relation owner and changes only read metadata',()=>{
 for(const c of [enteredKboCareer(),enrolledCollegeCareer()]){
  const e=c.relationNotices!.find(e=>e.definitionId==='E94'&&e.status==='OPEN')!,before=canonicalJson(c);assert.ok(e);
  const result=apply(c,e),next=result.nextState.career as typeof c;assert.equal(next.revision,c.revision+1);assert.equal(next.relationNotices!.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.deepEqual(next.relationships,c.relationships);assert.equal(canonicalJson(c),before);assert.ok(result.summary.navigation);
 }
});

test('school relation read preserves a sealed academic year and permits the actual following-year activation',()=>{
 const source=completedCollegeAcademicYear(enrolledCollegeCareer()),c=closeCollegeSeasonForNextYear(source,source.revision,true),e=c.relationNotices!.find(e=>e.definitionId==='E94'&&e.status==='OPEN')!;assert.ok(e);assert.ok(c.collegeYearEnd);
 const next=apply(c,e).nextState.career as HighSchoolCareer;assert.equal(next.collegeYearEnd!.sourceRevision,next.revision);assert.equal(next.collegeYearEnd!.sourceBasis,schoolYearEndBasis(next));assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.doesNotThrow(()=>startNextCollegeSeason(next,next.revision));
});


test('relation list/detail expose existing identities and only requested official scope without raw player/history state',()=>{
 for(const c of [enteredKboCareer(),enrolledCollegeCareer()]){
  const before=canonicalJson(c),state={schemaVersion:1,career:c},view=relationScreen(state,'CAREER_RELATIONS') as {relations:{relationKey:string}[];notices:{commands:string[]}[]};assert.ok(view.relations.length);assert.doesNotMatch(JSON.stringify(view),/abilities|potential|amateurHistory|sourceBasis|"rng"|"seed"/i);
  const key=view.relations[0]!.relationKey,league='protagonistClubId'in c?'KBO':'COLLEGE',scope={relationKey:key,leagueKey:league,phase:'POSTSEASON',seasonKey:c.world.seasonKey},detail=relationScreen(state,'CAREER_RELATION_DETAIL',scope) as {scope:unknown};assert.deepEqual(detail.scope,{leagueKey:league,phase:'POSTSEASON',seasonKey:c.world.seasonKey});assert.equal(canonicalJson(c),before);
  assert.throws(()=>relationScreen(state,'CAREER_RELATION_DETAIL',{...scope,phase:'INVALID'}),/INVALID_PAYLOAD/);assert.throws(()=>relationScreen(state,'CAREER_RELATION_DETAIL',{...scope,seasonKey:'wrong'}),/INVALID_PAYLOAD/);assert.throws(()=>relationScreen(state,'CAREER_RELATION_DETAIL',{...scope,world:'injected'}),/INVALID_PAYLOAD/);
 }
 const us=activeUsCareer('HITTER');assert.throws(()=>relationScreen({schemaVersion:1,career:us},'CAREER_RELATIONS'),/US_RELATION_HISTORY_REQUIRED/);
});

test('relation HTTP uses actual owned notices, persists read once, retains its native navigation and isolates another owner',async()=>{
 const {db,client}=await createTestDb();
 try{
  const c=enteredKboCareer(),headers={Authorization:'Bearer dev:relation-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'relation-owner');await seedAllowedSubject(db,'relation-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'relations-http',mode:'CLUB'})}));
  await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId;
  const read=await app.request(path+'/screens/CAREER_RELATIONS',{headers});assert.equal(read.status,200);const view=await json<{careerRevision:number;notices:{eventKey:string;eventVersion:number;definitionId:string;relationKey:string}[]}>(read),event=view.notices.find(e=>e.definitionId==='E94')!,payload={careerRevision:view.careerRevision,eventKey:event.eventKey,eventVersion:event.eventVersion,command:'OPEN_RELATIONS'},post=(id:string,extra:Record<string,unknown>={})=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:0,type:'CAREER_RELATIONS_RESOLVE',payload:{...payload,...extra}})});
  assert.equal((await post('inject',{relationships:{}})).status,400);assert.equal((await post('bad-version',{eventVersion:event.eventVersion+1})).status,400);
  const done=await post('read');assert.equal(done.status,200);const receipt=await json<{summary:{navigation:{relationKey:string}}}>(done);assert.equal(receipt.summary.navigation.relationKey,event.relationKey);assert.deepEqual(await json(await post('read')),receipt);assert.equal((await post('conflict')).status,409);
  const detail=await app.request(path+'/screens/CAREER_RELATION_DETAIL?'+new URLSearchParams({relationKey:event.relationKey,leagueKey:'KBO',phase:'REGULAR',seasonKey:c.world.seasonKey}),{headers});assert.equal(detail.status,200);assert.doesNotMatch(await detail.text(),/potential|abilities|"seed"|"rng"/i);
  const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(row!.state as {career:KboCareer}).career;assert.equal(canonicalJson(next.world),canonicalJson(c.world));assert.equal(canonicalJson(next.records),canonicalJson(c.records));assert.equal(next.relationNotices.find(e=>e.eventKey===event.eventKey)!.status,'RESOLVED');
  assert.equal((await app.request(path+'/screens/CAREER_RELATIONS',{headers:{Authorization:'Bearer dev:relation-foreign'}})).status,404);assert.equal((await app.request(path+'/screens/CAREER_RELATION_DETAIL?'+new URLSearchParams({relationKey:event.relationKey}),{headers:{Authorization:'Bearer dev:relation-foreign'}})).status,404);
 }finally{await client.close();}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {activeUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import {relationScreen} from '../src/career-relations-shell.js';
test('actual US entry relationships are readable using the owned US root',()=>{const c=activeUsCareer('HITTER'),v=relationScreen({schemaVersion:1,career:c},'CAREER_RELATIONS') as {relations:unknown[]};assert.ok(v.relations.length);});

import {formRegisteredTeamTeammate} from '../../../packages/engine/src/team-teammates.js';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {usRelationshipListView,usRelationDetailView,unreadUsRelationNotices,resolveUsRelationNotice} from '../../../packages/engine/src/us-relations.js';
import {finishedUsCareerFixture} from '../../../packages/engine/test/us-finished-fixture.js';
import {startNextUsMinorSeason} from '../../../packages/engine/src/us-year-transition.js';

test('US actual formation notice read preserves every game, roster, money and phase with JSON restart',()=>{
 const c=activeUsCareer('HITTER'),before=canonicalJson(c),notices=unreadUsRelationNotices(c),e=notices.find(n=>n.seasonKey===c.world.seasonKey)!;assert.ok(e);const result=applyEngineCommand({schemaVersion:1,career:c},{commandId:'read-us-relation',expectedRevision:0,type:'CAREER_RELATIONS_RESOLVE',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.eventVersion,command:'OPEN_RELATIONS'}}),next=result.nextState.career as typeof c;
 assert.equal(next.revision,c.revision+1);assert.deepEqual(next.world,c.world);assert.deepEqual(next.records,c.records);assert.deepEqual(next.income,c.income);assert.deepEqual(next.contract,c.contract);assert.deepEqual(next.phaseContext,c.phaseContext);assert.equal(next.relationNotices.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.equal(canonicalJson(c),before);assert.deepEqual(usRelationshipListView(JSON.parse(JSON.stringify(next))),usRelationshipListView(next));assert.throws(()=>resolveUsRelationNotice(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion+1,command:'OPEN_RELATIONS'}),/VERSION/);
});

test('US list distinguishes actual live levels, archived school identity and unavailable legacy references without inventing players',()=>{
 // Controlled historical formation uses actual saved school players and the native formation owner.
 const c=activeUsCareer('HITTER');c.relationships=formRegisteredTeamTeammate(c.relationships,c.amateurHistory.world,'controlled-school-registration',0);const before=canonicalJson(c),rows=usRelationshipListView(c),live=rows.find(r=>r.otherAvailability==='CURRENT_WORLD')!,school=rows.find(r=>r.otherAvailability==='HISTORICAL_ONLY')!;assert.ok(live);assert.ok(school);const org=c.world.organizations.find(o=>Object.values(o.levels).some(keys=>keys.includes(live.otherPlayerKey)))!,level=Object.entries(org.levels).find(([,keys])=>keys.includes(live.otherPlayerKey))![0];assert.equal(live.lastKnownRegistration!.teamId,org.id);assert.equal(live.lastKnownRegistration!.leagueKey,level);assert.ok(!Object.hasOwn(c.world.players,school.otherPlayerKey));assert.ok(school.other?.name);assert.doesNotMatch(JSON.stringify(rows),/potential|abilities|"rng"|"seed"|amateurHistory|sourceBasis/);assert.equal(canonicalJson(c),before);
 const missing=structuredClone(c),r=structuredClone(missing.relationships.relations[0]!);r.otherPlayerKey='legacy-unavailable-reference';r.normalPairKey=JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort());r.relationKey=JSON.stringify([r.type,r.normalPairKey]);missing.relationships.relations=[...missing.relationships.relations,r];const absent=usRelationshipListView(missing).find(x=>x.relationKey===r.relationKey)!;assert.equal(absent.otherAvailability,'UNKNOWN_REFERENCE');assert.equal(absent.other,null);assert.equal(usRelationDetailView(missing,r.relationKey,{leagueKey:'MLB',phase:'REGULAR'}).mode,'UNAVAILABLE');assert.ok(!Object.hasOwn(missing.world.players,r.otherPlayerKey));
 const detail=relationScreen({schemaVersion:1,career:c},'CAREER_RELATION_DETAIL',{relationKey:live.relationKey,leagueKey:'MLB',phase:'POSTSEASON',seasonKey:c.world.seasonKey}) as {scope:unknown};assert.deepEqual(detail.scope,{leagueKey:'MLB',phase:'POSTSEASON',seasonKey:c.world.seasonKey});
});

test('US retired teammate identity is read from actual native annual supply, never restored to a roster',()=>{
 const c=finishedUsCareerFixture(),relation=usRelationshipListView(c).find(r=>r.otherAvailability==='CURRENT_WORLD')!,key=relation.otherPlayerKey;c.world.players[key]!.age=45;const next=startNextUsMinorSeason(c,c.revision,c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),before=canonicalJson(next),row=usRelationshipListView(next).find(r=>r.relationKey===relation.relationKey)!;assert.equal(row.otherAvailability,'HISTORICAL_ONLY');assert.equal(row.other!.name,c.world.players[key]!.name);assert.equal(row.lastKnownRegistration!.seasonKey,c.world.seasonKey);assert.ok(!Object.hasOwn(next.world.players,key));assert.ok(next.minorYears!.at(-1)!.supply.retired.some(r=>r.playerKey===key));assert.equal(canonicalJson(next),before);
});

test('US formation relation HTTP preserves save ownership, CAS and exact navigation across repeated delivery',async()=>{
 const {db,client}=await createTestDb();try{const c=activeUsCareer('HITTER'),headers={Authorization:'Bearer dev:us-relation-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'us-relation-owner');await seedAllowedSubject(db,'us-relation-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'us-relation-http',mode:'CLUB'})}));await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId,response=await app.request(path+'/screens/CAREER_RELATIONS',{headers});assert.equal(response.status,200);const view=await json<{careerRevision:number;notices:{eventKey:string;eventVersion:number;relationKey:string}[]}>(response),e=view.notices[0]!;assert.ok(e);const payload={careerRevision:view.careerRevision,eventKey:e.eventKey,eventVersion:e.eventVersion,command:'OPEN_RELATIONS'},post=(id:string,extra:Record<string,unknown>={})=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:0,type:'CAREER_RELATIONS_RESOLVE',payload:{...payload,...extra}})});assert.equal((await post('inject',{world:{}})).status,400);const done=await post('read');assert.equal(done.status,200);const receipt=await json<{summary:{navigation:{relationKey:string}}}>(done);assert.equal(receipt.summary.navigation.relationKey,e.relationKey);assert.deepEqual(await json(await post('read')),receipt);assert.equal((await post('stale')).status,409);assert.equal((await app.request(path+'/screens/CAREER_RELATIONS',{headers:{Authorization:'Bearer dev:us-relation-foreign'}})).status,404);const [saved]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(saved!.state as {career:typeof c}).career;assert.deepEqual(next.income,c.income);assert.deepEqual(next.records,c.records);assert.deepEqual(next.world,c.world);
 }finally{await client.close();}
});

import {emptyBatting} from '../../../packages/engine/src/stats.js';

test('US relation detail sums only actual requested league/phase/year rows, not merely echoing the scope',()=>{
 const c=activeUsCareer('HITTER'),r=usRelationshipListView(c).find(r=>r.otherAvailability==='CURRENT_WORLD')!,mine=c.protagonistKey,other=r.otherPlayerKey,year=c.world.seasonKey;
 // Controlled contributions isolate the shared native record filter; no games are simulated here.
 for(const [i,leagueKey,phase,seasonKey,H] of [[0,'MLB','POSTSEASON',year,1],[1,'MLB','REGULAR',year,2],[2,'AAA','POSTSEASON',year,3],[3,'MLB','POSTSEASON',String(Number(year)-1),4]] as const){
  const key='us-rel-scope-'+i,b={...emptyBatting(),PA:4,AB:4,H,TB:H,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0},split={PA:4,AB:4,H,TB:H,BB:0,HBP:0,K:0,HR:0,twoB:0,threeB:0,RBI:0},zero={...split,PA:0,AB:0,H:0,TB:0};c.records.games[key]={gameKey:key,worldDay:i+1,scope:{leagueKey,phase,seasonKey},teams:{},batting:{[mine]:{...b},[other]:{...b}},pitching:{},batterSplits:{[mine]:{L:{...zero},R:{...split}},[other]:{L:{...zero},R:{...split}}},pitcherSplits:{},matchups:{}};
 }
 const view=relationScreen({schemaVersion:1,career:c},'CAREER_RELATION_DETAIL',{relationKey:r.relationKey,leagueKey:'MLB',phase:'POSTSEASON',seasonKey:year}) as {detail:{mode:string;sharedGames:number;mine:{H:number;AB:number};theirs:{H:number}}};assert.equal(view.detail.mode,'COMPARISON');assert.equal(view.detail.sharedGames,1);assert.equal(view.detail.mine.H,1);assert.equal(view.detail.mine.AB,4);assert.equal(view.detail.theirs.H,1);
});

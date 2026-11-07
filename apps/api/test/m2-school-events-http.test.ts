import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createHighSchoolWorld,createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason,createWorldEvent,eventDefinition} from '@playball/engine';
import {createApp} from '../src/app.js';
import {json} from './json.js';

test('school event choices resolve owned current events through HTTP without changing game records',async()=>{
 const {db,client}=await createTestDb();try{
  const headers={Authorization:'Bearer dev:school-events','Content-Type':'application/json'};await seedAllowedSubject(db,'school-events');await seedAllowedSubject(db,'school-other');const app=createApp({db,auth:{allowDevBearer:true}});
  let c=createHighSchoolCareer(createHighSchoolWorld({worldKey:'events-world',seasonKey:'2032',seed:'fixture',schoolId:'H01',startDay:31,player:{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
  c=confirmCareerPlayer(c,0);c=resolveCareerFocusEvent(c,1,{eventKey:c.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});c=confirmCareerPreseason(c,2);
  for(const [definitionId,command] of [['E43','DEFER_TRAINING'],['E41','ACK_EVENT'],['E84','OPEN_TRAITS']] as const){
   const created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'event-'+definitionId,mode:'CAREER'})}));const path='/api/saves/'+created.saveId;
   const definition=eventDefinition(definitionId),fields=definitionId==='E84'?{playerSimulationKey:'me',traitId:'T13',unlockEvidenceVersion:1}:{playerOrTeamSimulationKey:'me',worldSeasonId:'2032',windowType:definitionId==='E43'?'TRAINING':'MID'};
   const event=createWorldEvent({definitionId,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'HS',registrationKey:'H01',sourceRevision:c.revision},sourceSequence:c.events.length+1,worldDay:31});
   const source={...c,events:[...c.events,event],phaseContext:{phase:'EVENT_DECISION' as const,eventKey:event.eventKey,resume:c.phaseContext as Extract<typeof c.phaseContext,{phase:'SEASON_PROGRESS'}>}};
   await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));
   const home=await json<{nextActions:{command:{type:string;payload:Record<string,unknown>}}[]}>(await app.request(path+'/career',{headers}));const action=home.nextActions[0]!.command;assert.equal(action.payload.eventVersion,event.version);assert.equal(action.payload.command,command);
   const post=(id:string,payload:Record<string,unknown>,auth=headers,revision=0)=>app.request(path+'/commands',{method:'POST',headers:auth,body:JSON.stringify({commandId:id,expectedRevision:revision,type:action.type,payload})});
   assert.equal((await post('foreign',action.payload,{...headers,Authorization:'Bearer dev:school-other'})).status,404);
   assert.equal((await post('forged',{...action.payload,eventKey:'forged'})).status,400);
   assert.equal((await post('stale',{...action.payload,eventVersion:event.version+1})).status,400);
   assert.equal((await post('stale-revision',{...action.payload,careerRevision:c.revision-1})).status,400);
   const response=await post('resolve',action.payload);assert.equal(response.status,200,await response.clone().text());const receipt=await json(response);
   assert.deepEqual(await json(await post('resolve',action.payload)),receipt);
   const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId));const next=(row!.state as {career:typeof c}).career;
   assert.equal(next.phaseContext.phase,'SEASON_PROGRESS');assert.deepEqual(next.records,c.records);assert.deepEqual(next.world,c.world);assert.deepEqual(next.development,c.development);
   assert.equal((await post('again',{...action.payload,careerRevision:next.revision},headers,1)).status,400);
  }
 }finally{await client.close();}
});

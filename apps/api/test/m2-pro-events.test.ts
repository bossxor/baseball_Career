import {confirmKboPreseasonPlan} from '../../../packages/engine/src/kbo-preseason.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {activeUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import {careerRepertoireEventsView,resolveCareerRepertoireEvent,refreshCareerRepertoireEvents} from '../../../packages/engine/src/repertoire-events.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {refreshProCareerResultEvents} from '../../../packages/engine/src/pro-career-results.js';
import {proCareerAdviceView} from '../../../packages/engine/src/pro-career-advice.js';
import {refreshProCareerAwards} from '../../../packages/engine/src/pro-career-awards.js';
import {createWorldEvent,eventDefinition} from '../../../packages/engine/src/events.js';
import {createStreams} from '../../../packages/engine/src/rng.js';
import {emptyBatting} from '../../../packages/engine/src/stats.js';
import type {KboCareer} from '@playball/engine';

// Controlled registration/contribution/medical prefix; real native choice writers below.
function controlled(days:number){
 const c=enteredKboCareer(),club=c.world.clubs.find(x=>x.id===c.protagonistClubId)!;c.registration.firstTeam=true;if(!club.firstTeam.includes(c.protagonistKey))club.firstTeam.push(c.protagonistKey);
 c.records={revision:days,games:{}};c.health.games=[];
 for(let day=1;day<=days;day++){const key='api-pro-'+day;c.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club.id]:{games:1,W:1,L:0,T:0,R:1,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.health.games=[...c.health.games,{evidence:{gameKey:key,teamKey:'KBO:'+club.id,seasonKey:c.world.seasonKey,day,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];}
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:days+1,pendingGame:null};return c;
}
function medical(){
 const c=controlled(1),key=c.protagonistKey;c.health.games[0]!.result.injured.push(key);c.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:'api-pro-1',seasonKey:c.world.seasonKey};
 const diagnosed=refreshProCareerResultEvents(c),next=controlled(2);next.proResults=diagnosed.proResults!;next.health.games[0]!.result.injured.push(key);next.health.games[1]!.result.recovered.push(key);return refreshProCareerResultEvents(next);
}
const dispatch=(c:KboCareer,domain:string,event:{eventKey:string;version:number},command:string,extra:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:domain+c.revision,expectedRevision:0,type:'CAREER_PRO_EVENT_'+domain,payload:{careerRevision:c.revision,eventKey:event.eventKey,eventVersion:event.version,command,...extra}});

test('controlled E12 uses the actual position-training domain writer; unrelated payload is rejected',()=>{
 const c=controlled(24),definition=eventDefinition('E12'),e=createWorldEvent({definitionId:'E12',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:c.protagonistKey,worldSeasonId:c.world.seasonKey,adviceWindowId:'api-window'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_PROGRESS',competitionKey:'KBO',registrationKey:c.protagonistClubId,sourceRevision:c.revision},sourceSequence:1,worldDay:24});
 c.advice={schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,rng:createStreams(c.world.seed,'api-advice-control').event,checkpoints:[],notices:[e],positionPlans:[],positionFits:null,roleReviews:[],restRequests:[]};
 const targetPosition=proCareerAdviceView(c).targetPositions[0]!,before=canonicalJson(c),next=dispatch(c,'ADVICE',e,'START_POSITION_PLAN',{targetPosition}).nextState.career as KboCareer;
 assert.equal(next.advice!.positionPlans[0]!.status,'TRAINING');assert.equal(next.advice!.positionPlans[0]!.targetPosition,targetPosition);assert.deepEqual(next.world.players,c.world.players);assert.deepEqual(next.records,c.records);assert.equal(canonicalJson(c),before);
 assert.throws(()=>dispatch(c,'ADVICE',e,'START_POSITION_PLAN',{targetPosition,focus:[]}),/INVALID_PAYLOAD/);
});

test('actual medical owner confirms only proven recovery; acknowledgment never heals or changes player abilities',()=>{
 const c=medical(),e=c.proResults!.notices.find(e=>e.definitionId==='E23')!,before=canonicalJson(c),next=dispatch(c,'RESULT',e,'CONFIRM_RETURN').nextState.career as KboCareer;
 assert.equal(next.proResults!.returns.length,1);assert.deepEqual(next.health,c.health);assert.deepEqual(next.world,c.world);assert.equal(canonicalJson(c),before);
 const bad=structuredClone(c);bad.health.games[1]!.result.recovered=[];assert.throws(()=>dispatch(bad,'RESULT',e,'CONFIRM_RETURN'),/RETURN_NOT_AVAILABLE/);
 assert.throws(()=>dispatch(c,'RESULT',e,'CONFIRM_RETURN',{health:{}}),/INVALID_PAYLOAD/);
});

test('native annual award notice acknowledgment preserves its receipt, statistics and money',()=>{
 let c=controlled(50);const team=c.protagonistClubId,other=c.world.clubs.find(o=>o.id!==team)!.id;
 c.proAwards={schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,games:{},annual:[],allStars:[],notices:[]};
 for(const row of Object.values(c.records.games)){
  row.teams[other]={games:1,W:0,L:1,T:0,R:0,RA:1};row.batting[c.protagonistKey]={...emptyBatting(),games:1,PA:4,AB:4,H:2,TB:2,twoB:0,threeB:0,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};const split={PA:0,AB:0,H:0,TB:0,BB:0,HBP:0,K:0,HR:0,twoB:0,threeB:0,RBI:0};row.batterSplits[c.protagonistKey]={L:{...split},R:{...split,PA:4,AB:4,H:2,TB:2}};
  c.proAwards.games[row.gameKey]={gameKey:row.gameKey,scope:row.scope,worldDay:row.worldDay,appearances:{[c.protagonistKey]:{teamKey:team,position:'CF',defenseUnits:500000}}};
 }
 c.competitionSchedule={receiptKey:'controlled-award-schedule',seasonKey:c.world.seasonKey,openingRosterReceiptKey:'controlled-roster',sourceRevision:0,confirmedRevision:1,leagues:{KBO:Object.values(c.records.games).map(row=>({simulationKey:row.gameKey,worldDay:row.worldDay,round:row.worldDay,leagueKey:'KBO',seasonKey:c.world.seasonKey,awayTeamKey:other,homeTeamKey:team})),FUTURES:[]}};
 c=refreshProCareerAwards(c,50);const e=c.proAwards!.notices.find(e=>e.definitionId==='E29')!;assert.ok(e);
 const next=dispatch(c,'AWARD',e,'ACK_EVENT').nextState.career as KboCareer;assert.deepEqual(next.proAwards!.annual,c.proAwards!.annual);assert.deepEqual(next.world,c.world);assert.deepEqual(next.agents,c.agents);assert.deepEqual(next.records,c.records);assert.equal(next.proAwards!.notices.find(x=>x.eventKey===e.eventKey)!.status,'RESOLVED');
});

test('owned KBO/US E86 and E88 commands use existing learning/approach writers without caller state',()=>{
 for(const source of [enteredKboCareer('PITCHER'),activeUsCareer('PITCHER')]){
  const c=refreshCareerRepertoireEvents(source),e=c.repertoireEvents!.notices.find(e=>e.definitionId==='E86')!,before=canonicalJson(c);
  const applied=applyEngineCommand({schemaVersion:1,career:c},{commandId:'pitch',expectedRevision:0,type:'CAREER_PRO_EVENT_REPERTOIRE',payload:{careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version,command:'SET_PITCH_TRAINING',pitchId:'P07'}}),next=applied.nextState.career as typeof c;
  assert.equal(next.world.repertoires[next.protagonistKey]!.learning!.pitchId,'P07');assert.equal(next.world.repertoires[next.protagonistKey]!.ledger.baseReservedUnits,100000);assert.equal(next.revision,c.revision+1);assert.equal(canonicalJson(c),before);assert.deepEqual(next.records,c.records);assert.deepEqual(next.agents,c.agents);
 }
 const c=refreshCareerRepertoireEvents(enteredKboCareer('HITTER')),e=c.repertoireEvents!.notices.find(e=>e.definitionId==='E88')!,payload={careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version,command:'SET_BATTING_APPROACH',approach:'PULL'};
 const apply=(extra:Record<string,unknown>)=>applyEngineCommand({schemaVersion:1,career:c},{commandId:'approach',expectedRevision:0,type:'CAREER_PRO_EVENT_REPERTOIRE',payload:{...payload,...extra}});
 assert.throws(()=>apply({world:c.world}),/INVALID_PAYLOAD/);assert.throws(()=>apply({careerRevision:c.revision-1}),/REVISION/);assert.throws(()=>apply({approach:'UNKNOWN'}));
 const next=apply({}).nextState.career as typeof c;assert.equal(next.repertoireEvents!.approach,'PULL');assert.deepEqual(next.world,c.world);assert.deepEqual(next.records,c.records);
 assert.deepEqual(applyEngineCommand({schemaVersion:1,career:JSON.parse(JSON.stringify(c))},{commandId:'approach',expectedRevision:0,type:'CAREER_PRO_EVENT_REPERTOIRE',payload}).nextState.career,next);
});


test('prototype-named choices are rejected as domain errors instead of escaping as TypeError',()=>{
 const c=medical(),e=c.proResults!.notices[0]!;
 for(const domain of ['ADVICE','REPERTOIRE'])for(const command of ['__proto__','constructor','toString'])assert.throws(()=>dispatch(c,domain,e,command),(error:unknown)=>error instanceof Error&&!(error instanceof TypeError)&&'code'in error&&typeof error.code==='string');
});

test('PRO_EVENTS real HTTP owns the source, hides private metadata, and applies medical choice once across retries and CAS conflicts',async()=>{
 const {db,client}=await createTestDb();
 try{
  const c=medical(),e=c.proResults!.notices.find(e=>e.definitionId==='E23')!,headers={Authorization:'Bearer dev:pro-owner','Content-Type':'application/json'};Object.assign(c.proResults!,{privateToken:'never-publish'});
  await seedAllowedSubject(db,'pro-owner');await seedAllowedSubject(db,'foreign-owner');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'pro-event-http',mode:'CLUB'})}));
  await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId;
  const screen=await app.request(path+'/screens/PRO_EVENTS',{headers});assert.equal(screen.status,200);const body=await screen.text();assert.doesNotMatch(body,/privateToken|never-publish|potential|negotiationRng|candidateScore|receiptKey|"rng"|"seed"/);assert.match(body,/CONFIRM_RETURN/);
  const payload={careerRevision:c.revision,eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETURN'},post=(id:string,extra:Record<string,unknown>={},revision=0)=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:revision,type:'CAREER_PRO_EVENT_RESULT',payload:{...payload,...extra}})});
  assert.equal((await post('injected',{world:c.world})).status,400);assert.equal((await post('wrong-version',{eventVersion:e.version+1})).status,400);
  const first=await post('confirm');assert.equal(first.status,200);const receipt=await json<{revision:string}>(first);assert.deepEqual(await json(await post('confirm')),receipt);assert.equal((await post('conflict')).status,409);
  const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(row!.state as {career:KboCareer}).career;assert.equal(next.proResults!.returns.length,1);assert.deepEqual(next.health,c.health);assert.deepEqual(next.world,c.world);
  const reread=await app.request(path+'/screens/PRO_EVENTS',{headers});assert.equal(reread.status,200);const fresh=await json<{results:{notices:{eventKey:string}[]}}>(reread);assert.ok(!fresh.results.notices.some(n=>n.eventKey===e.eventKey));
  assert.equal((await app.request(path+'/screens/PRO_EVENTS',{headers:{Authorization:'Bearer dev:foreign-owner'}})).status,404);
  assert.equal((await app.request(path+'/commands',{method:'POST',headers:{Authorization:'Bearer dev:foreign-owner','Content-Type':'application/json'},body:JSON.stringify({commandId:'foreign',expectedRevision:1,type:'CAREER_PRO_EVENT_RESULT',payload})})).status,404);
 }finally{await client.close();}
});


test('repertoire notices stop offering a domain choice when its actual preseason owner has locked the window',()=>{
 for(const kind of ['HITTER','PITCHER'] as const){const c=refreshCareerRepertoireEvents(enteredKboCareer(kind)),id=kind==='HITTER'?'E88':'E86',choice=kind==='HITTER'?'SET_BATTING_APPROACH':'SET_PITCH_TRAINING',locked=confirmKboPreseasonPlan(c,c.revision),notice=careerRepertoireEventsView(locked).notices.find(e=>e.definitionId===id)!;
  assert.ok(notice);assert.ok(!notice.commands.includes(choice));assert.ok(notice.commands.includes('ACK_EVENT'));
  assert.throws(()=>resolveCareerRepertoireEvent(locked,locked.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:choice,...(kind==='HITTER'?{approach:'PULL' as const}:{pitchId:'P07' as const})}));
 }
});


test('archived or blocking-decision careers cannot resolve repertoire notices or expose a runnable action',()=>{
 const source=refreshCareerRepertoireEvents(enteredKboCareer('HITTER')),e=source.repertoireEvents!.notices.find(n=>n.definitionId==='E88')!;
 for(const phase of ['ARCHIVED','EVENT_DECISION'] as const){const c={...source,phaseContext:{phase} as typeof source.phaseContext},before=canonicalJson(c);assert.throws(()=>dispatch(c,'REPERTOIRE',e,'ACK_EVENT'));assert.equal(canonicalJson(c),before);assert.equal(careerRepertoireEventsView(c).notices.find(n=>n.eventKey===e.eventKey)!.commands.length,0);}
});

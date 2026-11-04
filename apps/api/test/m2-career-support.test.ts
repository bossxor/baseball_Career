import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {createHash} from 'node:crypto';
import {careerSupportScreen} from '../src/career-support-shell.js';
import {confirmKboPreseasonPlan} from '../../../packages/engine/src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../../../packages/engine/src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../../../packages/engine/src/kbo-schedule.js';
import {startKboRegularSeason} from '../../../packages/engine/src/kbo-progress.js';
import {careerRoleReviewPreview,careerSalaryCounterPreview,resolveCareerAgentEvent} from '../../../packages/engine/src/career-agent.js';
import {closedUsMajorFixture,finishControlledMajorSeason} from '../../../packages/engine/test/us-major-fixture.js';
import {startNextUsMajorSeason} from '../../../packages/engine/src/us-major-renewal.js';
import {confirmUsPreseasonPlan} from '../../../packages/engine/src/us-preseason.js';
import {publishUsSeasonSchedule} from '../../../packages/engine/src/us-schedule.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer,enrolledCollegeCareer} from '../../../packages/engine/test/fixtures.js';
import {activeUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import {careerSeasonGoalsView} from '../../../packages/engine/src/season-goals.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';
import {applyEngineCommand} from '../src/engine-command.js';
import type {GoalCareer,KboCareer,UsCareer} from '@playball/engine';
const apply=(c:GoalCareer,type:string,extra:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:type+c.revision,expectedRevision:0,type,payload:{careerRevision:c.revision,...extra}});

test('KBO/US/college goal outbox selects actual native goals and never grants gameplay money or growth',()=>{
 for(const source of [enteredKboCareer(),activeUsCareer('HITTER'),enrolledCollegeCareer()]){
  const before=canonicalJson(source),opened=apply(source,'CAREER_GOALS_OPEN').nextState.career as typeof source,e=opened.goals!.notices.find(e=>e.definitionId==='E89'&&e.status==='OPEN')!,goalIds=careerSeasonGoalsView(opened).recommendedIds;
  const next=apply(opened,'CAREER_GOALS_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'SET_GOALS',goalIds}).nextState.career as typeof source;
  assert.deepEqual(next.goals!.seasons[next.world.seasonKey]!.slots.map(s=>s.goalId),goalIds);assert.deepEqual(next.world,opened.world);assert.deepEqual(next.records,opened.records);assert.deepEqual(next.seasonGrowth,opened.seasonGrowth);assert.equal(canonicalJson(source),before);
  assert.throws(()=>apply(opened,'CAREER_GOALS_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'SET_GOALS',goalIds,world:opened.world}),/INVALID_PAYLOAD/);
 }
});

test('KBO/US agent E91 hires its actual native contract without changing player, records or budget',()=>{
 for(const c of [enteredKboCareer(),activeUsCareer('HITTER')]){
  const before=canonicalJson(c),opened=apply(c,'CAREER_AGENT_OPEN').nextState.career as KboCareer|UsCareer,e=opened.agents!.notices.find(e=>e.definitionId==='E91')!;
  const next=apply(opened,'CAREER_AGENT_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'HIRE_AGENT',agentId:'AG03'}).nextState.career as typeof opened;
  assert.equal(next.agents!.contracts[0]!.agentId,'AG03');assert.equal(next.agents!.notices.find(n=>n.eventKey===e.eventKey)!.status,'RESOLVED');assert.deepEqual(next.world,opened.world);assert.deepEqual(next.records,opened.records);assert.equal(canonicalJson(c),before);
  assert.throws(()=>apply(opened,'CAREER_AGENT_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'HIRE_AGENT',agentId:'AG03',funding:[]}),/INVALID_PAYLOAD/);
 }
});


type AgentView={careerRevision:number;notices:{eventKey:string;eventVersion:number;definitionId:string}[];role:{previewId:string;probability:number|null;requestUsed:boolean}|null;salary:{previewId:string;requestUsed:boolean;options:{raiseBps:number;probability:number;eligible:boolean}[]}|null};
const agentView=(c:KboCareer|UsCareer)=>careerSupportScreen({schemaVersion:1,career:c},'CAREER_AGENT') as AgentView;
function regular(){let c=enteredKboCareer();c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);return startKboRegularSeason(c,c.revision);}
const digest=(s:string)=>createHash('sha256').update(s).digest('hex');

test('role preview is opaque, publishes actual odds and consumes the same native draw; stale/raw tokens reject without mutation',()=>{
 const c=apply(regular(),'CAREER_AGENT_OPEN').nextState.career as KboCareer,view=agentView(c),e=view.notices.find(e=>e.definitionId==='E93')!,q=careerRoleReviewPreview(c),before=canonicalJson(c);assert.ok(e);assert.ok(view.role);assert.match(view.role.previewId,/^[0-9a-f]{64}$/);assert.equal(view.role.previewId,digest(q.previewId));assert.equal(view.role.probability,q.probability);assert.doesNotMatch(JSON.stringify(view),/candidateScore|comparisonPlayerKey|comparisonScore|sourceBasis|negotiationRng|"health"|"roster"/);
 const payload={eventKey:e.eventKey,eventVersion:e.eventVersion,command:'REQUEST_ROLE_REVIEW',previewId:view.role.previewId};assert.throws(()=>apply(c,'CAREER_AGENT_RESOLVE',{...payload,previewId:q.previewId}),/PREVIEW_STALE/);
 const changed=apply(c,'CAREER_AGENT_PROMISE').nextState.career as KboCareer;assert.throws(()=>apply(changed,'CAREER_AGENT_RESOLVE',payload),/PREVIEW_STALE/);
 const actual=apply(c,'CAREER_AGENT_RESOLVE',payload).nextState.career as KboCareer,native=resolveCareerAgentEvent(c,c.revision,{...payload,command:'REQUEST_ROLE_REVIEW',previewId:q.previewId});assert.deepEqual(actual,native);assert.equal(actual.agents!.roleRequests.length,1);assert.deepEqual(actual.world,c.world);assert.deepEqual(actual.records,c.records);assert.equal(canonicalJson(c),before);
});

test('US salary quote uses booked money only, hides native funding/context and negotiates with the same native probability and draw',()=>{
 // Controlled regular/PS prefix; previous annual booking and current quote/choice writers are native.
 const initial=closedUsMajorFixture(),funded=startNextUsMajorSeason(initial,initial.revision,initial.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20000000}))),closed=finishControlledMajorSeason(publishUsSeasonSchedule(confirmUsPreseasonPlan(funded,funded.revision),funded.revision+1));
 assert.throws(()=>apply(closed,'CAREER_AGENT_OPEN_US_SALARY',{funding:[]}),/INVALID_PAYLOAD/);
 const quoted=apply(closed,'CAREER_AGENT_OPEN_US_SALARY').nextState.career as UsCareer;assert.ok(quoted.agents!.usSalaryOffers!.at(-1)!.funding.every(f=>f.addedBudgetUsd===0));assert.deepEqual(quoted.inventory,closed.inventory);
 const c=apply(quoted,'CAREER_AGENT_OPEN').nextState.career as UsCareer,view=agentView(c),e=view.notices.find(e=>e.definitionId==='E92')!,q=careerSalaryCounterPreview(c);assert.ok(e);assert.ok(view.salary);assert.match(view.salary.previewId,/^[0-9a-f]{64}$/);assert.deepEqual(view.salary.options,q.options);assert.doesNotMatch(JSON.stringify(view),/sourceBasis|availableBudgetUsd|futureBudgets|negotiationRng|"funding"/);
 const payload={eventKey:e.eventKey,eventVersion:e.eventVersion,command:'REQUEST_SALARY_COUNTER',previewId:view.salary.previewId,raiseBps:1000};assert.throws(()=>apply(c,'CAREER_AGENT_RESOLVE',{...payload,annualSalaryUsd:1}),/INVALID_PAYLOAD/);
 const actual=apply(c,'CAREER_AGENT_RESOLVE',payload).nextState.career as UsCareer,native=resolveCareerAgentEvent(c,c.revision,{...payload,command:'REQUEST_SALARY_COUNTER',previewId:q.previewId,raiseBps:1000});assert.deepEqual(actual,native);assert.deepEqual(actual.inventory,c.inventory);assert.deepEqual(actual.income,c.income);assert.equal(actual.agents!.salaryRequests.length,1);
});

test('goal and agent boundaries reject wrong-domain or injected fields and preserve the current owner',()=>{
 const c=enteredKboCareer(),e=c.goals!.notices.find(e=>e.definitionId==='E89')!,before=canonicalJson(c);
 for(const goalId of ['__proto__','constructor','UNKNOWN'])assert.throws(()=>apply(c,'CAREER_GOALS_REPLACE',{slot:0,goalId}),/INVALID_PAYLOAD/);
 assert.throws(()=>apply(c,'CAREER_GOALS_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'ACK_EVENT',goalIds:[]}),/INVALID_PAYLOAD/);
 assert.throws(()=>apply(c,'CAREER_AGENT_CHANGE',{}),/INVALID_PAYLOAD/);assert.throws(()=>apply(c,'CAREER_AGENT_OPEN_US_SALARY'),/US_CAREER_REQUIRED/);assert.equal(canonicalJson(c),before);
 const view=careerSupportScreen({schemaVersion:1,career:c},'CAREER_GOALS');assert.doesNotMatch(JSON.stringify(view),/completionReceipt|firstReceipt|injuryGameKey|potential|"rng"|"seed"/);
});


test('goal replacement uses the real midpoint and once-only owner instead of a client flag',()=>{
 const source=enteredKboCareer(),e=source.goals!.notices.find(e=>e.definitionId==='E89')!,selected=apply(source,'CAREER_GOALS_RESOLVE',{eventKey:e.eventKey,eventVersion:e.version,command:'SET_GOALS',goalIds:['G03']}).nextState.career as KboCareer;
 const c=structuredClone(selected);c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:73,pendingGame:null};assert.throws(()=>apply(c,'CAREER_GOALS_REPLACE',{slot:0,goalId:'G04'}),/WINDOW_NOT_OPEN/);
 const league=c.goals!.seasons[c.world.seasonKey]!.leagueKey;
 for(let day=1;day<=72;day++){const key='controlled-goal-midpoint-'+day;c.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[c.protagonistClubId]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.records.revision++;}
 const next=apply(c,'CAREER_GOALS_REPLACE',{slot:0,goalId:'G04'}).nextState.career as KboCareer;assert.equal(next.goals!.seasons[c.world.seasonKey]!.replacementUsed,true);assert.equal(next.goals!.seasons[c.world.seasonKey]!.slots[0]!.goalId,'G04');assert.equal(next.goals!.seasons[c.world.seasonKey]!.history[0]!.status,'REPLACED');assert.deepEqual(next.world,c.world);assert.deepEqual(next.records,c.records);assert.throws(()=>apply(next,'CAREER_GOALS_REPLACE',{slot:0,goalId:'G02'}),/REPLACEMENT_USED/);
});

test('goal selection and agent hiring persist through real HTTP with owner isolation, CAS and exact receipt replay',async()=>{
 const {db,client}=await createTestDb();
 try{
  const source=enteredKboCareer(),headers={Authorization:'Bearer dev:support-owner','Content-Type':'application/json'};await seedAllowedSubject(db,'support-owner');await seedAllowedSubject(db,'support-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'support-http',mode:'CLUB'})}));
  await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId;
  const get=(screen:string)=>app.request(path+'/screens/'+screen,{headers}),post=(type:string,payload:Record<string,unknown>,commandId:string,expectedRevision:number)=>app.request(path+'/commands',{method:'POST',headers,body:JSON.stringify({type,payload,commandId,expectedRevision})});
  const response=await get('CAREER_GOALS');assert.equal(response.status,200);const view=await json<{careerRevision:number;recommendedIds:string[];notices:{eventKey:string;version:number;definitionId:string}[]}>(response),event=view.notices.find(e=>e.definitionId==='E89')!,payload={careerRevision:view.careerRevision,eventKey:event.eventKey,eventVersion:event.version,command:'SET_GOALS',goalIds:view.recommendedIds};
  const selected=await post('CAREER_GOALS_RESOLVE',payload,'goals',0);assert.equal(selected.status,200);const receipt=await json(selected);assert.deepEqual(await json(await post('CAREER_GOALS_RESOLVE',payload,'goals',0)),receipt);assert.equal((await post('CAREER_GOALS_RESOLVE',payload,'conflict',0)).status,409);
  const agentBefore=await json<AgentView>(await get('CAREER_AGENT'));assert.equal((await post('CAREER_AGENT_OPEN',{careerRevision:agentBefore.careerRevision},'open-agent',1)).status,200);
  const agent=await json<AgentView>(await get('CAREER_AGENT')),hire=agent.notices.find(e=>e.definitionId==='E91')!,hired=await post('CAREER_AGENT_RESOLVE',{careerRevision:agent.careerRevision,eventKey:hire.eventKey,eventVersion:hire.eventVersion,command:'HIRE_AGENT',agentId:'AG01'},'hire',2);assert.equal(hired.status,200);
  const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId)),next=(row!.state as {career:KboCareer}).career;assert.equal(next.agents!.contracts[0]!.agentId,'AG01');assert.deepEqual(next.goals!.seasons[next.world.seasonKey]!.slots.map(s=>s.goalId),view.recommendedIds);assert.deepEqual(next.world,source.world);
  const publicAgent=await get('CAREER_AGENT');assert.equal(publicAgent.status,200);assert.doesNotMatch(await publicAgent.text(),/sourceBasis|availableBudgetUsd|candidateScore|comparisonScore|negotiationRng/);
  assert.equal((await app.request(path+'/screens/CAREER_GOALS',{headers:{Authorization:'Bearer dev:support-foreign'}})).status,404);assert.equal((await app.request(path+'/screens/CAREER_AGENT',{headers:{Authorization:'Bearer dev:support-foreign'}})).status,404);
 }finally{await client.close();}
});

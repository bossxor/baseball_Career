import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {completedHighSchoolCareer,enrolledCollegeCareer,completedCollegeAcademicYear,enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {preparedUsCareer} from '../../../packages/engine/test/us-fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../../../packages/engine/src/high-school-route.js';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../../../packages/engine/src/college-entry.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../../../packages/engine/src/college-year.js';
import {careerRouteNoticesView} from '../../../packages/engine/src/career-route-notices.js';
import {createOwnCareerAssessment} from '../../../packages/engine/src/high-school-assessment.js';
import {prepareCareerUsDirect} from '../../../packages/engine/src/career-us.js';
import {createCareerTraitLedger} from '../../../packages/engine/src/high-school-traits.js';
import {enterCollegeEarlyDraft,prepareCollegeUnsignedReturn} from '../../../packages/engine/src/college-route.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';

// Controlled school/pro prefix; commands, persistence, authorization and DTOs below are real HTTP execution.
async function owned<T extends {revision:number}>(source:T,run:(h:{app:ReturnType<typeof createApp>;id:string;headers:Record<string,string>;post:(type:string,payload:Record<string,unknown>,id:string,saveRevision?:number)=>Promise<Response>;screen:(name:string)=>Promise<Response>;stored:()=>Promise<T>})=>Promise<void>){
 const {db,client}=await createTestDb();
 try{
  const subject='choice-owner',headers={Authorization:'Bearer dev:'+subject,'Content-Type':'application/json'};await seedAllowedSubject(db,subject);await seedAllowedSubject(db,'someone-else');const app=createApp({db,auth:{allowDevBearer:true}});
  const created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'choice-api',mode:'CLUB'})}));
  await db.update(gameSaves).set({state:{schemaVersion:1,career:source}}).where(eq(gameSaves.id,created.saveId));
  await run({app,id:created.saveId,headers,post:async(type,payload,id,saveRevision=0)=>app.request('/api/saves/'+created.saveId+'/commands',{method:'POST',headers,body:JSON.stringify({commandId:id,expectedRevision:saveRevision,type,payload:{careerRevision:source.revision,...payload}})}),screen:async name=>app.request('/api/saves/'+created.saveId+'/screens/'+name,{headers}),stored:async()=>{const [row]=await db.select({state:gameSaves.state}).from(gameSaves).where(eq(gameSaves.id,created.saveId));return (row!.state as {career:T}).career;}});
 }finally{await client.close();}
}
function collegePre(){const c=completedHighSchoolCareer(),r=acknowledgeHighSchoolSeasonReview(c,c.revision),o=openHighSchoolCareerRoute(r,r.revision,1).career,a=enrollHighSchoolCollege(o,o.revision,{eventVersion:1,offerSetKey:highSchoolCareerRouteView(o).offerSetKey,offerSetVersion:1,collegeId:'U07'}),closed=closeHighSchoolSeasonForCollege(a,a.revision,true);return startAdmittedCollegeSeason(closed,closed.revision);}
function comparison(budget:number){const first=completedCollegeAcademicYear(enrolledCollegeCareer()),closed=closeCollegeSeasonForNextYear(first,first.revision,true),c=startNextCollegeSeason(closed,closed.revision),p=c.world.players.own!;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,950000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};c.development!.seasonStartPlayer=structuredClone(p);c.seasonGrowth!.seasonStart=structuredClone(p);c.ownAssessment=createOwnCareerAssessment(c.world);const end=completedCollegeAcademicYear(c);return prepareCareerUsDirect(end,end.revision,{schemaVersion:1,worldKey:end.world.worldKey,seasonKey:String(end.world.calendar!.year+1),seed:end.world.seed,registeredPlayerKeys:[],clubs:[{id:'US01',name:'Test organization',rookieSlots:1,aSlots:1,availableBudgetUsd:budget,nationalReleaseAllowed:true,militaryReturnOption:false}]});}

test('E71 HTTP focus commits once, resumes stored notice and rejects stale/foreign/authority input atomically',async()=>{
 const source=collegePre(),notice=careerRouteNoticesView(source).notices.find(e=>e.definitionId==='E71')!,focus=['POWER','DEFENSE','RUNNING','CLUTCH'];
 await owned(source,async h=>{
  const before=canonicalJson(await h.stored()),payload={eventKey:notice.eventKey,eventVersion:notice.eventVersion,focus};
  const read=await h.screen('CAREER_ROUTE_NOTICES');assert.equal(read.status,200);assert.doesNotMatch(await read.text(),/potential|"seed"|"rng"/);
  assert.equal((await h.post('CAREER_CHOICE_COLLEGE_FOCUS',{...payload,world:source.world},'forged')).status,400);assert.equal(canonicalJson(await h.stored()),before);
  assert.equal((await h.post('CAREER_CHOICE_COLLEGE_FOCUS',{...payload,careerRevision:source.revision-1},'stale-root')).status,400);
  const res=await h.post('CAREER_CHOICE_COLLEGE_FOCUS',payload,'focus');assert.equal(res.status,200);const committed=await json<{revision:string;summary:{careerRevision:number}}>(res);assert.equal(committed.summary.careerRevision,source.revision+1);
  const replay=await h.post('CAREER_CHOICE_COLLEGE_FOCUS',payload,'focus');assert.deepEqual(await json(replay),committed);const saved=await h.stored();assert.deepEqual(saved.world.players.own!.focus,focus);assert.equal(saved.routeNotices!.notices.find(e=>e.eventKey===notice.eventKey)!.resolution!.command,'CHOOSE_FOCUS');assert.equal(canonicalJson(saved.records),canonicalJson(source.records));
  assert.equal((await h.post('CAREER_CHOICE_COLLEGE_FOCUS',payload,'stale-save')).status,409);
  const final=canonicalJson(await h.stored());assert.equal((await h.post('CAREER_CHOICE_COLLEGE_FOCUS',{...payload,careerRevision:saved.revision,eventVersion:99},'stale-event',1)).status,400);assert.equal(canonicalJson(await h.stored()),final);
  assert.equal((await h.app.request('/api/saves/'+h.id+'/screens/CAREER_ROUTE_NOTICES',{headers:{Authorization:'Bearer dev:someone-else'}})).status,404);
 });
});

test('E73 HTTP comparison preserves enrollment until owned signing and reserves accepted terms once',async()=>{
 for(const budget of [3_000_000,0]){const source=comparison(budget);await owned(source,async h=>{
  const before=canonicalJson(await h.stored()),read=await h.screen('COLLEGE_US_COMPARISON');assert.equal(read.status,200);const view=await json<{us:unknown;commands:string[]}>(read);assert.equal(Boolean(view.us),budget>0);assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"/);
  const res=await h.post('CAREER_CHOICE_COLLEGE_OPEN_US',{eventVersion:source.events.at(-1)!.version},'open');assert.equal(res.status,budget>0?200:400);
  if(budget>0){const out=await json<{summary:{careerRevision:number};next:{kind:string;screenId:string}}>(res);assert.equal(out.summary.careerRevision,source.revision);assert.deepEqual(out.next,{kind:'screen',screenId:'S29'});}
  assert.equal(canonicalJson(await h.stored()),before);
  if(budget>0){
   const payload={eventVersion:source.events.at(-1)!.version,programVersion:source.usRecruitment!.program.version,offerKey:source.usRecruitment!.program.offers[0]!.offerKey};
   assert.equal((await h.post('CAREER_CHOICE_COLLEGE_SIGN_US',{...payload,annualSalaryUsd:1},'forged-terms',1)).status,400);
   const signed=await h.post('CAREER_CHOICE_COLLEGE_SIGN_US',payload,'sign',1);assert.equal(signed.status,200);const result=await json(signed),saved=await h.stored();
   assert.equal(saved.collegeAdmission!.status,'LEFT_FOR_PRO');assert.equal(saved.collegeAdmission!.earlyDraftAttempted,undefined);assert.equal(saved.events.at(-1)!.resolution!.command,'ACCEPT_CAREER_OFFER');assert.equal(saved.usRecruitment!.reservations.entries.length,1);assert.equal(canonicalJson(saved.records),canonicalJson(source.records));
   assert.deepEqual(await json(await h.post('CAREER_CHOICE_COLLEGE_SIGN_US',payload,'sign',1)),result);assert.equal((await h.stored()).usRecruitment!.reservations.entries.length,1);
  }
 });}
});

test('KBO and US E85 HTTP summary omits private receipts and ACK persists cursor without touching gameplay',async()=>{
 for(const prefix of [enteredKboCareer(),preparedUsCareer()]){const source=structuredClone(prefix),key=source.protagonistKey,traits=createCareerTraitLedger();traits.owned[key]={unlocked:['T02','T13'],qualifiedRivalPitcherKeys:[]};traits.unlocks=[{playerKey:key,traitId:'T02',worldDay:0,recordRevision:source.records.revision},{playerKey:key,traitId:'T13',worldDay:0,recordRevision:source.records.revision}];source.traits=traits;
  await owned(source,async h=>{
   const read=await h.screen('PRO_TRAIT_SUMMARY');assert.equal(read.status,200);const view=await json<{unlocks:{traitId:string}[]}>(read);assert.deepEqual(view.unlocks.map(r=>r.traitId),['T02']);assert.doesNotMatch(JSON.stringify(view),/T13|potential|"seed"|"rng"/);
   const res=await h.post('CAREER_CHOICE_PRO_ACK_TRAITS',{},'ack');assert.equal(res.status,200);const saved=await h.stored();assert.equal(saved.revision,source.revision+1);assert.equal(saved.traits!.summaryCursor,2);assert.equal(canonicalJson(saved.world),canonicalJson(source.world));assert.equal(canonicalJson(saved.records),canonicalJson(source.records));assert.deepEqual((await json<{unlocks:unknown[]}>(await h.screen('PRO_TRAIT_SUMMARY'))).unlocks,[]);
   assert.equal((await h.post('CAREER_CHOICE_PRO_ACK_TRAITS',{careerRevision:saved.revision},'ack-again',1)).status,200);assert.equal((await h.stored()).revision,saved.revision);
  });
 }
});

test('route notice HTTP acknowledgment persists only metadata and never substitutes for the focus domain writer',async()=>{
 const source=collegePre(),notice=careerRouteNoticesView(source).notices.find(e=>e.definitionId==='E71')!;
 await owned(source,async h=>{
  const payload={eventKey:notice.eventKey,eventVersion:notice.eventVersion};
  const original=canonicalJson(await h.stored());
  assert.equal((await h.post('CAREER_CHOICE_ACK_ROUTE_NOTICE',{...payload,eventVersion:99},'notice-stale-event')).status,400);assert.equal(canonicalJson(await h.stored()),original);
  assert.equal((await h.post('CAREER_CHOICE_ACK_ROUTE_NOTICE',{...payload,careerRevision:source.revision-1},'notice-stale-root')).status,400);assert.equal(canonicalJson(await h.stored()),original);
  const response=await h.post('CAREER_CHOICE_ACK_ROUTE_NOTICE',payload,'notice-ack');assert.equal(response.status,200);const receipt=await json(response);
  assert.deepEqual(await json(await h.post('CAREER_CHOICE_ACK_ROUTE_NOTICE',payload,'notice-ack')),receipt);
  const saved=await h.stored();assert.equal(saved.routeNotices!.notices.find(e=>e.eventKey===notice.eventKey)!.resolution!.command,'ACK_EVENT');assert.equal(saved.routeNotices!.collegeFocusChoices?.length??0,0);assert.equal(canonicalJson(saved.world),canonicalJson(source.world));assert.equal(canonicalJson(saved.planHistory),canonicalJson(source.planHistory));assert.equal(canonicalJson(saved.records),canonicalJson(source.records));
 });
});

test('E74 HTTP return resumes enrollment from actual empty offers and preserves records, with CAS and replay',async()=>{
 const quote=comparison(0),early=enterCollegeEarlyDraft(quote,quote.revision,quote.events.at(-1)!.version),source=prepareCollegeUnsignedReturn(early,early.revision);
 await owned(source,async h=>{
  const before=canonicalJson(await h.stored()),response=await h.screen('COLLEGE_UNSIGNED_RETURN');assert.equal(response.status,200);const view=await json<{eventKey:string;eventVersion:number;commands:string[]}>(response);assert.ok(view.commands.includes('ADVANCE_ACADEMIC_YEAR'));assert.doesNotMatch(JSON.stringify(view),/potential|"seed"|"rng"/);
  assert.equal((await h.post('CAREER_CHOICE_COLLEGE_RETURN',{eventVersion:99},'bad-event')).status,400);assert.equal(canonicalJson(await h.stored()),before);
  const payload={eventVersion:view.eventVersion},result=await h.post('CAREER_CHOICE_COLLEGE_RETURN',payload,'return');assert.equal(result.status,200);const receipt=await json(result),saved=await h.stored();assert.equal(saved.phaseContext.phase,'OFFSEASON_REVIEW');assert.equal(saved.collegeAdmission!.status,'ENROLLED');assert.equal(saved.collegeAdmission!.academicYear,2);assert.equal(saved.usRecruitment,undefined);assert.equal(saved.previousUsRecruitments!.at(-1)!.closedBy,'COLLEGE');assert.equal(canonicalJson(saved.records),canonicalJson(source.records));
  assert.deepEqual(await json(await h.post('CAREER_CHOICE_COLLEGE_RETURN',payload,'return')),receipt);assert.equal((await h.post('CAREER_CHOICE_COLLEGE_RETURN',payload,'stale-save')).status,409);assert.equal(canonicalJson(await h.stored()),canonicalJson(saved));
 });
});

test('E73 public event version drives early draft or continued enrollment without private save access',async()=>{
 for(const route of ['EARLY_DRAFT','CONTINUE']){const source=comparison(0);await owned(source,async h=>{
  const read=await h.screen('COLLEGE_US_COMPARISON');assert.equal(read.status,200);const view=await json<{eventKey:string;eventVersion:number;routeCommands:string[]}>(read);assert.equal(typeof view.eventKey,'string');assert.equal(typeof view.eventVersion,'number');assert.ok(!view.routeCommands.includes('OPEN_US_IF_VALID'));
  const type='CAREER_CHOICE_COLLEGE_'+route,payload={eventVersion:view.eventVersion,...(route==='CONTINUE'?{forfeitUnusedTraining:true}:{})},response=await h.post(type,payload,'route');assert.equal(response.status,200);const receipt=await json(response),saved=await h.stored();assert.equal(saved.collegeAdmission!.status,'ENROLLED');assert.equal(canonicalJson(saved.records),canonicalJson(source.records));
  if(route==='EARLY_DRAFT'){assert.equal(saved.phaseContext.phase,'CAREER_ROUTE');assert.equal(saved.collegeAdmission!.earlyDraftAttempted,true);assert.equal(canonicalJson(saved.usRecruitment!.program),canonicalJson(source.usRecruitment!.program));}
  else{assert.equal(saved.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(saved.collegeAdmission!.earlyDraftAttempted,undefined);assert.equal(saved.previousUsRecruitments!.at(-1)!.closedBy,'COLLEGE');assert.ok(saved.collegeYearEnd);}
  assert.deepEqual(await json(await h.post(type,payload,'route')),receipt);
 });}
});

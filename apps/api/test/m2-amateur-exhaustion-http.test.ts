import { storedSave } from './stored-save.js';
import {amateurRetryExhaustionView} from '../../../packages/engine/src/career-retry-exhaustion.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {eq} from 'drizzle-orm';
import {createTestDb,seedAllowedSubject,gameSaves} from '@playball/db';
import {createApp} from '../src/app.js';
import {json} from './json.js';
import {runRetryExhaustionScenario} from '../../../packages/engine/test/retry-completion-scenario.js';
import type {HighSchoolCareer} from '../../../packages/engine/src/high-school-career.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../../../packages/engine/src/career-kbo.js';
import {canonicalJson} from '../../../packages/engine/src/game.js';

function prefix():HighSchoolCareer {
 const pro=runRetryExhaustionScenario().commands.find(c=>c.command==='SETTLE_PREPARATION')!.output,p=structuredClone(pro.preparationSeason!);
 // Controlled amateur/athlete-duty prefix and two prior optional years; the shared final48 games and draft assessment use native owners.
 let c:HighSchoolCareer={...structuredClone(pro.amateurHistory),revision:p.revision,world:p.world as HighSchoolCareer['world'],records:p.records,health:p.health,days:p.days,development:p.development,seasonGrowth:p.seasonGrowth,styleUsedWindows:p.styleUsedWindows,...(p.traits?{traits:p.traits}:{}),relationships:p.relationships!,retryCareer:p.retry,preparationSeason:p,preparation:{version:1,used:3,seasons:p.retry.periods.map(s=>({seasonKey:s.worldSeasonId,receiptKey:s.evidenceReceipt!,baseScore:p.result!.baseScore}))},phaseContext:{phase:'CAREER_ROUTE'}};
 for(const key of ['kboRecruitment','kboYearEnd','usYearEnd','graduation','collegeAdmission','collegeGraduation','collegeYearEnd','usRecruitment','routeNotices'] as const)delete c[key];
 const id='controlled-prior-athlete-benefit';c.national={invitations:[],competitions:[{competitionId:id,tournament:'AG',seasonKey:'2026',medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1}],benefits:[{competitionId:id,benefitKey:JSON.stringify(['national-benefit',id,'ATHLETE_ELIGIBLE']),benefitType:'ATHLETE_ELIGIBLE',appliedRevision:1,resultVersion:1}],militaryStatus:'COMPLETED',athleteDutySeasonsRemaining:0,athleteDutyStartSeasonKey:'2027',athleteDutySettledSeasons:['2027','2028','2029']};
 c=prepareCareerKboDraft(c,c.revision);c=resolveCareerKboDraft(c,c.revision,c.kboRecruitment!.program.version);if(c.kboRecruitment!.program.result!.round)c=decideCareerKboDraft(c,c.revision,{programVersion:c.kboRecruitment!.program.version,decision:'DECLINE'});return c;
}

test('amateur E35 HTTP opens, reads and confirms one owned archive with CAS/replay and no extra preparation charge',async()=>{
 const c=prefix(),{db,client}=await createTestDb();try{
  const headers={Authorization:'Bearer dev:amateur-e35-owner','Content-Type':'application/json'},foreign={Authorization:'Bearer dev:amateur-e35-foreign','Content-Type':'application/json'};await seedAllowedSubject(db,'amateur-e35-owner');await seedAllowedSubject(db,'amateur-e35-foreign');const app=createApp({db,auth:{allowDevBearer:true}}),created=await json<{saveId:string}>(await app.request('/api/game-creations',{method:'POST',headers,body:JSON.stringify({creationId:'amateur-e35-http',mode:'CLUB'})}));await db.update(gameSaves).set({state:{schemaVersion:1,career:c}}).where(eq(gameSaves.id,created.saveId));const path='/api/saves/'+created.saveId;
  const stored=async()=>{const[row]=await storedSave(db, created.saveId);return (row!.state as {career:HighSchoolCareer}).career;};
  const post=(id:string,type:string,revision:number,payload:Record<string,unknown>,auth=headers)=>app.request(path+'/commands',{method:'POST',headers:auth,body:JSON.stringify({commandId:id,expectedRevision:revision,type,payload})});
  const opened=await post('open','CAREER_RETRY_AMATEUR_EXHAUST',0,{careerRevision:c.revision});assert.equal(opened.status,200);const openReceipt=await json(opened);assert.deepEqual(await json(await post('open','CAREER_RETRY_AMATEUR_EXHAUST',0,{careerRevision:c.revision})),openReceipt);const pending=await stored();assert.equal(pending.retryExit!.status,'PENDING');
  const screen=await app.request(path+'/screens/AMATEUR_RETIREMENT',{headers});assert.equal(screen.status,200);const view=await json<{status:string;eventKey:string;eventVersion:number;commands:string[];careerPreparationUsed:number}>(screen);assert.equal(view.status,'PENDING');assert.equal(view.careerPreparationUsed,3);assert.deepEqual(view.commands,['CONFIRM_RETIRE']);assert.doesNotMatch(JSON.stringify(view),/sourceBasis|"seed"|"rng"|"potential"|"source"/);
  for(const mutate of [(e:typeof pending.events[number])=>{e.occurredWorldDay++;},(e:typeof pending.events[number])=>{e.resume.sourceRevision=pending.revision+1;},(e:typeof pending.events[number])=>{e.resume.sourceRevision=pending.preparationSeason!.revision;}]){const bad=structuredClone(pending);mutate(bad.events.find(e=>e.eventKey===bad.retryExit!.eventKey)!);assert.throws(()=>amateurRetryExhaustionView(bad));}
  const input={careerRevision:pending.revision,eventKey:view.eventKey,eventVersion:view.eventVersion},before=canonicalJson(pending);assert.equal((await post('bad-version','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,{...input,eventVersion:view.eventVersion+1})).status,400);assert.equal((await post('bad-extra','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,{...input,world:{}})).status,400);assert.equal(canonicalJson(await stored()),before);assert.equal((await post('foreign','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,input,foreign)).status,404);
  const done=await post('confirm','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,input);assert.equal(done.status,200);const receipt=await json(done),archived=await stored();assert.equal(archived.phaseContext.phase,'ARCHIVED');assert.equal(archived.retryExit!.status,'ARCHIVED');assert.equal(archived.retryCareer!.careerPreparationUsed,3);for(const key of ['world','records','health','national','retryCareer'] as const)assert.deepEqual(archived[key],pending[key]);assert.deepEqual(await json(await post('confirm','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,input)),receipt);assert.equal((await post('stale','CAREER_RETRY_AMATEUR_CONFIRM_RETIRE',1,input)).status,409);assert.equal(canonicalJson(await stored()),canonicalJson(archived));
  const end=await app.request(path+'/screens/AMATEUR_RETIREMENT',{headers});assert.equal(end.status,200);const dto=await json<{status:string;commands:string[]}>(end);assert.equal(dto.status,'ARCHIVED');assert.deepEqual(dto.commands,[]);assert.equal((await app.request(path+'/screens/AMATEUR_RETIREMENT',{headers:foreign})).status,404);
 }finally{await client.close();}
});

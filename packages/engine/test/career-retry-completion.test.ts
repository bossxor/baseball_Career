import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalJson} from '../src/game.js';
import {kboCareerEntryView} from '../src/kbo-career-entry.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import * as retry from '../src/career-pro-retry.js';
import {retryNoOfferPrefix,runRetryExhaustionScenario} from './retry-completion-scenario.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {openAmateurRetryExhaustion,confirmAmateurRetryExhaustion} from '../src/career-retry-exhaustion.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';

test('voluntary retry retirement uses explicit E36 before spending any optional season',()=>{
 let c=retryNoOfferPrefix();c=retry.openKboUncontractedRetry(c,c.revision);c=retry.reviewKboUncontractedRoutes(c,c.revision,1);const before=canonicalJson(c),pending=retry.requestKboRetryRetirement(c,c.revision),e=pending.events.find(e=>e.eventKey===pending.retryPro!.eventKey)!;
 assert.equal(canonicalJson(c),before);assert.equal(e.definitionId,'E36');assert.equal(e.status,'OPEN');assert.equal(pending.retryCareer!.careerPreparationUsed,0);assert.equal(pending.retirement,undefined);assert.equal(pending.phaseContext.phase,'RETIRE_CONFIRM');
 assert.throws(()=>retry.confirmKboRetryRetirement(pending,pending.revision-1,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'}),/REVISION/);assert.throws(()=>retry.confirmKboRetryRetirement(pending,pending.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'CONFIRM_RETIRE'}),/EVENT_VERSION/);
 const out=retry.confirmKboRetryRetirement(JSON.parse(JSON.stringify(pending)),pending.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'});retry.assertKboRetryState(out);assert.equal(out.phaseContext.phase,'ARCHIVED');assert.equal(out.retryCareer!.careerPreparationUsed,0);assert.equal(out.retirement!.remainingContractYears,0);assert.deepEqual(out.records,c.records);assert.deepEqual(out.military,c.military);
 assert.equal(retry.kboRetryRetirementView(out).seasonKey,c.retryCareer!.seasonKey);assert.doesNotMatch(JSON.stringify(retry.kboRetryRetirementView(out)),/potential|seed|rng|sourceBasis/);
 for(const mutate of [(n:typeof c)=>{n.military!.status='UNRESOLVED';},(n:typeof c)=>{n.national={invitations:[],competitions:[],benefits:[]};},(n:typeof c)=>{n.protagonistClubId='forged';},(n:typeof c)=>{n.registration.seasonKey='2040';},(n:typeof c)=>{n.rights.holderOrgId='forged';},(n:typeof c)=>{n.world.players[n.protagonistKey]!.age++;}]){const forged=structuredClone(c);mutate(forged);assert.throws(()=>retry.assertKboRetryState(forged),/ORIGIN_CHANGED/);}
});

test('genuine empty pro market opens E34; root CAS and owned preview guard independent preparation',()=>{
 const source=retryNoOfferPrefix(),before=canonicalJson(source);assert.equal(source.offseasonExit!.offers.length,0);
 const opened=retry.openKboUncontractedRetry(source,source.revision),e=opened.events.find(e=>e.definitionId==='E34')!;
 assert.equal(e.status,'OPEN');assert.equal(canonicalJson(source),before);assert.throws(()=>retry.openKboUncontractedRetry(source,source.revision-1),/REVISION/);
 const c=retry.reviewKboUncontractedRoutes(opened,opened.revision,e.version),view=retry.kboRetryRoutesView(c);
 assert.ok(view.routes.some(r=>r.routeId==='PREPARATION'));assert.ok(!view.routes.some(r=>r.routeId==='COLLEGE_ENTRY'));assert.equal(view.rights.draftEligible,false);
 assert.throws(()=>retry.startKboRetryPreparation(c,c.revision,{routePreviewId:'stale'}),/PREVIEW_STALE/);
 const serving=structuredClone(source);serving.military!.status='SERVING_ACTIVE';assert.throws(()=>retry.openKboUncontractedRetry(serving,serving.revision),/UNSUPPORTED/);
 const started=retry.startKboRetryPreparation(c,c.revision,{routePreviewId:view.routePreviewId});retry.assertKboRetryState(started);assert.equal(started.retryCareer!.careerPreparationUsed,0);assert.equal(started.preparationSeason!.world.leagueKey,'INDEPENDENT');assert.deepEqual(started.records,c.records);
 assert.deepEqual(started.military,c.military);assert.deepEqual(started.world,c.world);assert.equal(started.preparationSeason!.world.protagonistKey,c.protagonistKey);
});

test('native final retry48 charges lifetime budget3 once; zero-budget market requires explicit E35 retirement',()=>{
 const s=runRetryExhaustionScenario(),settled=s.commands.find(x=>x.command==='SETTLE_PREPARATION')!.output,pending=s.commands.find(x=>x.command==='OPEN_RETRY_EXHAUSTION')!.output;
 assert.equal(settled.retryCareer!.careerPreparationUsed,3);assert.equal(settled.preparationSeason!.result!.completedTeamGames,48);assert.equal(retry.kboRetryPreparationView(settled).evaluation?.kind,'PRO_MARKET_REVIEW');assert.equal(retry.kboRetryRoutesView(settled).offers.length,0);
 assert.equal(retry.settleKboRetryPreparation(settled,settled.revision,true).retryCareer!.careerPreparationUsed,3);assert.equal(pending.phaseContext.phase,'RETIRE_CONFIRM');assert.equal(pending.retirement,undefined);
 const e=pending.events.find(e=>e.definitionId==='E35')!;assert.throws(()=>retry.confirmKboRetryExhaustion(pending,pending.revision,{eventKey:e.eventKey,eventVersion:e.version+1,command:'CONFIRM_RETIRE'}),/EVENT_VERSION/);
 const restored=JSON.parse(JSON.stringify(pending));assert.equal(canonicalJson(retry.confirmKboRetryExhaustion(restored,restored.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'})),canonicalJson(s.finalState));
 assert.equal(s.finalState.phaseContext.phase,'ARCHIVED');assert.ok(s.finalState.retirement?.receiptKey);assert.deepEqual(s.finalState.records,settled.records);assert.deepEqual(s.finalState.military,settled.military);retry.assertKboRetryState(s.finalState);
 assert.throws(()=>retry.openKboRetryExhaustion(s.finalState,s.finalState.revision),/CLOSED/);
});

test('controlled retiring-roster budget fixture uses the same native final48; real market quote accepts into playable KBO',()=>{
 const s=runRetryExhaustionScenario(),settlement=s.commands.findIndex(x=>x.command==='SETTLE_PREPARATION');
 // Shared independent competition is unchanged. Only the labelled pro-world prefix differs: its NPC cohort is age44.
 // Their native year transitions retire the cohort and free real budget; no offer is injected or guaranteed by production code.
 let c=structuredClone(s.commands[settlement-1]!.output),positive=retryNoOfferPrefix(true,true);positive=retry.openKboUncontractedRetry(positive,positive.revision);
 c.world=positive.world;c.retryPro!.origin=positive.retryPro!.origin;c.retryPro!.marketWorld=positive.retryPro!.marketWorld;
 c=retry.settleKboRetryPreparation(c,c.revision,true);const view=retry.kboRetryRoutesView(c);assert.ok(view.offers.length);assert.ok(c.retiredPlayers!.length);assert.equal(c.retryCareer!.careerPreparationUsed,3);
 assert.throws(()=>retry.openKboRetryExhaustion(c,c.revision),/ROUTES_REMAIN/);assert.throws(()=>retry.acceptKboRetryOffer(c,c.revision,{routePreviewId:'stale',offerKey:view.offers[0]!.offerKey}),/PREVIEW_STALE/);
 const signed=retry.acceptKboRetryOffer(c,c.revision,{routePreviewId:view.routePreviewId,offerKey:view.offers[0]!.offerKey});retry.assertKboRetryState(signed);assert.equal(kboCareerEntryView(signed).phase,'PRESEASON_SETUP');assert.equal(signed.world.contracts[signed.protagonistKey]!.contractKey,view.offers[0]!.offerKey);assert.deepEqual(signed.records,c.records);assert.equal(signed.world.clubs.filter(t=>t.roster.includes(c.protagonistKey)).length,1);assert.equal(signed.registration.competitionKey,undefined);assert.equal(signed.traits?.lastSeasonKey,signed.world.seasonKey);
 let playable=confirmKboPreseasonPlan(signed,signed.revision);playable=confirmKboOpeningRoster(playable,playable.revision);playable=confirmKboSeasonSchedule(playable,playable.revision);playable=startKboRegularSeason(playable,playable.revision);assert.equal(playable.phaseContext.phase,'SEASON_PROGRESS');retry.assertKboRetryState(playable);
});

test('controlled amateur root with shared native final48 requires fresh domestic assessment and explicit archive confirmation',()=>{
 const pro=runRetryExhaustionScenario().commands.find(x=>x.command==='SETTLE_PREPARATION')!.output,p=structuredClone(pro.preparationSeason!);
 // Controlled amateur/source and completed athlete-duty prefix. Independent games, growth and final E35 commands are native.
 let c:HighSchoolCareer={...structuredClone(pro.amateurHistory),revision:p.revision,world:p.world as HighSchoolCareer['world'],records:p.records,health:p.health,days:p.days,development:p.development,seasonGrowth:p.seasonGrowth,styleUsedWindows:p.styleUsedWindows,...(p.traits?{traits:p.traits}:{}),relationships:p.relationships!,retryCareer:p.retry,preparationSeason:p,preparation:{version:1,used:3,seasons:p.retry.periods.map(s=>({seasonKey:s.worldSeasonId,receiptKey:s.evidenceReceipt!,baseScore:p.result!.baseScore}))},phaseContext:{phase:'CAREER_ROUTE'}};
 for(const key of ['kboRecruitment','kboYearEnd','usYearEnd','graduation','collegeAdmission','collegeGraduation','collegeYearEnd','usRecruitment','routeNotices'] as const)delete c[key];
 const id='controlled-prior-athlete-benefit';c.national={invitations:[],competitions:[{competitionId:id,tournament:'AG',seasonKey:'2026',medal:'GOLD',finalRank:1,officialAppearance:true,registered:true,resultVersion:1}],benefits:[{competitionId:id,benefitKey:JSON.stringify(['national-benefit',id,'ATHLETE_ELIGIBLE']),benefitType:'ATHLETE_ELIGIBLE',appliedRevision:1,resultVersion:1}],militaryStatus:'COMPLETED',athleteDutySeasonsRemaining:0,athleteDutyStartSeasonKey:'2027',athleteDutySettledSeasons:['2027','2028','2029']};
 assert.throws(()=>openAmateurRetryExhaustion(c,c.revision),/ASSESSMENT/);
 c=prepareCareerKboDraft(c,c.revision);c=resolveCareerKboDraft(c,c.revision,c.kboRecruitment!.program.version);if(c.kboRecruitment!.program.result!.round)c=decideCareerKboDraft(c,c.revision,{programVersion:c.kboRecruitment!.program.version,decision:'DECLINE'});
 const missingMilitary=structuredClone(c);delete missingMilitary.national;assert.throws(()=>openAmateurRetryExhaustion(missingMilitary,missingMilitary.revision),/ROUTES_REMAIN/);
 const stale=structuredClone(c);stale.kboRecruitment!.program.assessmentKey='stale';assert.throws(()=>openAmateurRetryExhaustion(stale,stale.revision),/STALE|INVALID/);
 const pending=openAmateurRetryExhaustion(c,c.revision),e=pending.events.find(e=>e.eventKey===pending.retryExit!.eventKey)!;assert.equal(pending.retryExit!.status,'PENDING');assert.equal(pending.phaseContext.phase,'CAREER_ROUTE');
 const archived=confirmAmateurRetryExhaustion(JSON.parse(JSON.stringify(pending)),pending.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'});assert.equal(archived.phaseContext.phase,'ARCHIVED');assert.equal(archived.retryExit!.status,'ARCHIVED');assert.deepEqual(archived.records,c.records);assert.deepEqual(archived.national,c.national);
 assert.throws(()=>confirmAmateurRetryExhaustion(archived,archived.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_RETIRE'}),/NOT_AVAILABLE/);
});

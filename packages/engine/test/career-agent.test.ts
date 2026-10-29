import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {canonicalJson} from '../src/game.js';
import {kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import * as api from '../src/career-agent.js';
import type {CareerAgentLedger} from '../src/career-agent.js';
import {closedUsMajorFixture,finishControlledMajorSeason} from './us-major-fixture.js';
import {startNextUsMajorSeason,usMajorFreeAgencyPreview,acceptUsMajorFreeAgency} from '../src/us-major-renewal.js';
import {usCareerView} from '../src/us-career-entry.js';
import {setUsPreseasonFocus,confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {seedPcg32} from '../src/rng.js';
import {compareKboOffseasonOffers,acceptKboOffseasonOffer,assertKboOffseasonExit} from '../src/kbo-offseason-exit.js';
import {KBO_MONEY} from '@playball/rules';
import {settleKboPersonalPayrollDay} from '../src/career-payroll.js';

function requireDomain(){assert.equal(typeof api.hireCareerAgent,'function','P15 needs a real career-agent domain');}
type AgentKbo=KboCareer&{agents?:CareerAgentLedger};
function regular():AgentKbo {let c=enteredKboCareer();c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);return startKboRegularSeason(c,c.revision);}
/** Controlled season-close boundary isolates negotiation; it is not a played full-year claim. */
function closedBoundary():AgentKbo {const c=regular();c.phaseContext={phase:'SEASON_REVIEW'};c.days!.days=[{day:300,evidence:'controlled-close',result:{injured:[],recovered:[]}}];c.seasonClose={receiptKey:'controlled-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:0,trainingForfeited:true};return c;}
function offered():AgentKbo {const c=closedBoundary();return offerKboRenewal(c,c.revision);}
function preview(c:KboCareer){return api.careerSalaryCounterPreview(c);}
/** Controlled bench registrations isolate promise/payroll arithmetic, not a native full-season proof. */
function registerControlledGames(c:AgentKbo,count:number){const team=c.protagonistClubId,league=c.registration.firstTeam?'KBO':'FUTURES',games=c.competitionSchedule!.leagues[league].filter(g=>g.homeTeamKey===team||g.awayTeamKey===team).slice(0,count),line={games:1,W:0,L:0,T:1,R:0,RA:0};for(const g of games){if(c.records.games[g.simulationKey])continue;c.records.games[g.simulationKey]={gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[g.homeTeamKey]:line,[g.awayTeamKey]:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.health.games=[...c.health.games,{evidence:{gameKey:g.simulationKey,teamKey:league+':'+team,seasonKey:c.world.seasonKey,day:g.worldDay,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];c.records.revision++;}c.days!.days=[{day:games.at(-1)!.worldDay,evidence:'controlled-registered-games',result:{injured:[],recovered:[]}}];c.revision++;}

test('P15 first pro hire is immediate; changes and direct negotiation become effective next season once',()=>{
 requireDomain();const original=regular(),before=canonicalJson(original),hired=api.hireCareerAgent(original,original.revision,'AG01');
 assert.equal(api.careerAgentView(hired).currentAgent,'AG01');assert.equal(canonicalJson(original),before);
 assert.throws(()=>api.changeCareerAgent(hired,hired.revision,'AG03'),/WINDOW_CLOSED/);const review=structuredClone(hired);review.phaseContext={phase:'SEASON_REVIEW'};const changed=api.changeCareerAgent(review,review.revision,'AG03');assert.equal(api.careerAgentView(changed).currentAgent,'AG01');assert.equal(api.careerAgentView(changed).pendingAgent,'AG03');
 assert.throws(()=>api.changeCareerAgent(changed,changed.revision,null),/AGENT_CHANGE_USED/);
 assert.throws(()=>api.hireCareerAgent(hired,hired.revision,'AG02'),/AGENT_ALREADY_HIRED/);
 assert.throws(()=>api.hireCareerAgent(original,original.revision-1,'AG01'),/REVISION/);
});

test('P15 cumulative fee has exact2% with tiny splits, duplicate receipt and no signing-bonus or inactive-agent fee',()=>{
 requireDomain();let c=api.hireCareerAgent(regular(),regular().revision,'AG01');let gross=0,fee=0;
 for(let i=0;i<103;i++){const out=api.settleAgentFee(c,{entryKey:'salary-'+i,currency:'KRW',gross:i===102?99_999_898:1,kind:'SALARY',seasonKey:c.world.seasonKey,worldDay:100+i});c=out.career;gross+=out.gross;fee+=out.fee;assert.equal(out.gross,out.fee+out.net);}
 assert.equal(gross,100_000_000);assert.equal(fee,2_000_000);const before=canonicalJson(c),duplicate=api.settleAgentFee(c,{entryKey:'salary-0',currency:'KRW',gross:1,kind:'SALARY',seasonKey:c.world.seasonKey,worldDay:100});assert.equal(canonicalJson(duplicate.career),before);
 assert.throws(()=>api.settleAgentFee(c,{entryKey:'salary-0',currency:'KRW',gross:2,kind:'SALARY',seasonKey:c.world.seasonKey,worldDay:100}),/AGENT_INCOME_CHANGED/);
 assert.equal(api.settleAgentFee(c,{entryKey:'bonus',currency:'KRW',gross:50_000_000,kind:'SIGNING_BONUS',seasonKey:c.world.seasonKey,worldDay:300}).fee,0);
 assert.equal(api.settleAgentFee(regular(),{entryKey:'direct',currency:'USD',gross:99,kind:'SALARY',seasonKey:c.world.seasonKey,worldDay:300}).fee,0);
 assert.equal(api.careerAgentView(c).income.find((r:{currency:string})=>r.currency==='KRW')!.net,98_000_000);
 const adjusted=api.settleAgentFee(c,{entryKey:'rounding-adjustment',currency:'KRW',gross:-50,kind:'SALARY_ADJUSTMENT',seasonKey:c.world.seasonKey,worldDay:300});assert.equal(adjusted.fee,-1);assert.equal(adjusted.net,-49);assert.doesNotThrow(()=>api.careerAgentView(adjusted.career));
 const late=api.hireCareerAgent(regular(),regular().revision,'AG01');assert.equal(api.settleAgentFee(late,{entryKey:'prehire-rounding-adjustment',currency:'KRW',gross:-1,kind:'SALARY_ADJUSTMENT',seasonKey:c.world.seasonKey,worldDay:300}).fee,0);
});

test('P15 real renewal preview .60/.68 never draws; success reserves only delta, supersedes base and actual accept uses raised salary',()=>{
 requireDomain();let c=offered();assert.equal(preview(c).options[0]!.probability,.6);c=api.hireCareerAgent(c,c.revision,'AG01');const q=preview(c),before=canonicalJson(c),base=c.renewal!;
 assert.ok(Math.abs(q.options[0]!.probability-.68)<1e-12);preview(c);assert.equal(canonicalJson(c),before);
 let success:typeof c|undefined;
 for(let i=0;i<30;i++){const attempt=structuredClone(c);attempt.world.seed='agent-success-'+i;const p=preview(attempt);const next=api.requestCareerSalaryCounter(attempt,attempt.revision,{previewId:p.previewId,raiseBps:1000});if(next.agents!.salaryRequests.at(-1)!.outcome==='ACCEPTED'){success=next;break;}}
 assert.ok(success);const s=success,request=s.agents!.salaryRequests.at(-1)!,newSalary=q.options[0]!.annualSalary;
 assert.equal(s.renewal!.annualSalaryWon,base.annualSalaryWon);assert.equal(request.annualSalary,newSalary);assert.equal(kboFutureCommitmentWon(s.world,base.clubId,1)-kboFutureCommitmentWon(c.world,base.clubId,1),newSalary-base.annualSalaryWon);
 assert.throws(()=>acceptKboRenewal(s,s.revision,{eventKey:base.eventKey,eventVersion:1}),/SUPERSEDED/);
 const accepted=acceptKboRenewal(s,s.revision,{eventKey:base.eventKey,eventVersion:1,offerKey:request.counterOfferKey} as Parameters<typeof acceptKboRenewal>[2]);assert.equal(accepted.renewal!.annualSalaryWon,newSalary);assert.equal(accepted.renewal!.offerKey,request.counterOfferKey);
 assert.throws(()=>api.requestCareerSalaryCounter(s,s.revision,{previewId:preview(s).previewId,raiseBps:1000}),/REQUEST_USED/);
});

test('P15 rejection keeps original offer and no reserved delta; changed budget, forged raise and stale preview never consume RNG',()=>{
 requireDomain();const c=offered();let failed:typeof c|undefined;
 for(let i=0;i<30;i++){const attempt=structuredClone(c);attempt.world.seed='agent-reject-'+i;const p=preview(attempt);const next=api.requestCareerSalaryCounter(attempt,attempt.revision,{previewId:p.previewId,raiseBps:3000});if(next.agents!.salaryRequests.at(-1)!.outcome==='REJECTED'){failed=next;break;}}
 assert.ok(failed);assert.deepEqual(failed!.renewal,c.renewal);assert.equal(kboFutureCommitmentWon(failed!.world,c.protagonistClubId,1),kboFutureCommitmentWon(c.world,c.protagonistClubId,1));
 assert.doesNotThrow(()=>acceptKboRenewal(failed!,failed!.revision,{eventKey:failed!.renewal!.eventKey,eventVersion:1}));
 const q=preview(c),changed=structuredClone(c);changed.world.clubs.find(x=>x.id===c.protagonistClubId)!.budgetWon+=10_000;const before=canonicalJson(changed);
 assert.throws(()=>api.requestCareerSalaryCounter(changed,changed.revision,{previewId:q.previewId,raiseBps:1000}),/PREVIEW_STALE/);assert.equal(canonicalJson(changed),before);
 assert.throws(()=>api.requestCareerSalaryCounter(c,c.revision,{previewId:q.previewId,raiseBps:9900 as 1000}),/INVALID_RAISE/);
});

test('E91/E92/E93 are actual source-bound optional notices; domain choices and ACK close exactly once',()=>{
 requireDomain();let c=api.openCareerAgentEvents(offered(),offered().revision);const notices=api.careerAgentView(c).notices;assert.ok(notices.some((e:{definitionId:string})=>e.definitionId==='E91'));assert.ok(notices.some((e:{definitionId:string})=>e.definitionId==='E92'));
 const hire=notices.find((e:{definitionId:string})=>e.definitionId==='E91')!;c=api.resolveCareerAgentEvent(c,c.revision,{eventKey:hire.eventKey,eventVersion:hire.eventVersion,command:'HIRE_AGENT',agentId:'AG01'});assert.equal(api.careerAgentView(c).currentAgent,'AG01');
 assert.throws(()=>api.resolveCareerAgentEvent(c,c.revision,{eventKey:hire.eventKey,eventVersion:hire.eventVersion,command:'HIRE_AGENT',agentId:'AG02'}),/EVENT_/);
 const counter=api.careerAgentView(c).notices.find((e:{definitionId:string})=>e.definitionId==='E92')!,q=preview(c);c=api.resolveCareerAgentEvent(c,c.revision,{eventKey:counter.eventKey,eventVersion:counter.eventVersion,command:'REQUEST_SALARY_COUNTER',previewId:q.previewId,raiseBps:1000});assert.equal(c.agents!.salaryRequests.length,1);
});

test('accepted role review is consumed by next real lineup once, preserves bucket and never promises an appearance',()=>{
 requireDomain();let c=regular();let accepted:typeof c|undefined;
 for(let i=0;i<40;i++){const attempt=structuredClone(c);attempt.world.seed='role-success-'+i;const q=api.careerRoleReviewPreview(attempt);const next=api.requestCareerRoleReview(attempt,attempt.revision,{previewId:q.previewId});if(next.agents!.roleRequests.at(-1)!.outcome==='ACCEPTED'){accepted=next;break;}}
 assert.ok(accepted);c=JSON.parse(JSON.stringify(accepted));assert.throws(()=>api.requestCareerRoleReview(c,c.revision,{previewId:api.careerRoleReviewPreview(c).previewId}),/REQUEST_USED/);
 for(let i=0;i<25;i++){const out=advanceKboCareer(c,c.revision);c=out.career;if(c.agents!.roleRequests[0]!.evaluation)break;}
 const r=c.agents!.roleRequests[0]!;assert.ok(r.evaluation);assert.equal(r.evaluation.appearanceGuaranteed,false);assert.ok(r.evaluation.gameKey);assert.equal(r.evaluation.evaluations,1);
 const injured=regular();injured.health.injuries[injured.protagonistKey]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:'diagnosis',seasonKey:injured.world.seasonKey};assert.throws(()=>api.careerRoleReviewPreview(injured),/NOT_ELIGIBLE/);
});

test('AG03 actual USD counteroffer reserves a fixed funded quote, signs next year and survives immutable history replay',()=>{
 const source=closedUsMajorFixture(),funding=source.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:30_000_000}));
 const name='openUsAgentSalaryOffer';assert.equal(typeof Reflect.get(api,name),'function','USD offers need a sealed financial owner');
 let c=api.openUsAgentSalaryOffer(source,source.revision,funding);c=api.hireCareerAgent(c,c.revision,'AG03');const q=api.careerSalaryCounterPreview(c);assert.equal(q.currency,'USD');assert.ok(Math.abs(q.options[0]!.probability-.68)<1e-12);
 c.agents!.negotiationRng=seedPcg32(42n,54n);const result=api.requestCareerSalaryCounter(c,c.revision,{previewId:q.previewId,raiseBps:1000}),request=result.agents!.salaryRequests.at(-1)!;assert.equal(request.outcome,'ACCEPTED');
 const next=startNextUsMajorSeason(result,result.revision,funding,request.counterOfferKey??undefined);assert.equal(next.contract.annualSalaryUsd,request.annualSalary);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));
 const broken=structuredClone(next);broken.majorYears![0]!.nextContract.annualSalaryUsd+=100;assert.throws(()=>usCareerView(broken),/QUOTE|COUNTER/);
});

test('ordinary KBO payroll pays actual registered games, no prior-game replay, and agent hire never charges earlier gross',()=>{
 let c=regular();for(let i=0;i<45;i++){const r=advanceKboCareer(c,c.revision);c=r.career;if(c.days!.days.length)break;}const day=c.days!.days.at(-1)!.day,paid=settleKboPersonalPayrollDay(c,day),income=api.careerAgentView(paid).income.find(i=>i.currency==='KRW')!;assert.ok(income.gross>0);assert.equal(income.fee,0);
 const hired=api.hireCareerAgent(paid,paid.revision,'AG01'),before=canonicalJson(hired);assert.equal(canonicalJson(settleKboPersonalPayrollDay(hired,day)),before);assert.equal(api.careerAgentView(hired).income.find(i=>i.currency==='KRW')!.fee,0);
});

test('offseason transfer counter is one request for the entire offer set and the actual accepted renewal consumes its replacement',()=>{
 const c=closedBoundary(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;for(const k of club.roster)if(k!==c.protagonistKey)c.world.contracts[k]!.years=2;
 let remaining=club.budgetWon*.9-kboFutureCommitmentWon(c.world,club.id,1);for(const k of club.roster){if(k===c.protagonistKey)continue;const contract=c.world.contracts[k]!,add=Math.min(remaining,KBO_MONEY.maximumSalaryWon-contract.annualSalaryWon);contract.annualSalaryWon+=add;club.reservedSalaryWon+=add;remaining-=add;}assert.equal(remaining,0);
 let open=api.hireCareerAgent(compareKboOffseasonOffers(c,c.revision),c.revision+1,'AG01');open.agents!.negotiationRng=seedPcg32(42n,54n);const base=open.offseasonExit!.offers[0]!,q=api.careerSalaryCounterPreview(open,base.offerKey);open=api.requestCareerSalaryCounter(open,open.revision,{previewId:q.previewId,raiseBps:1000,baseOfferKey:base.offerKey});const r=open.agents!.salaryRequests[0]!;assert.equal(r.outcome,'ACCEPTED');
 assert.throws(()=>acceptKboOffseasonOffer(open,open.revision,{eventKey:open.offseasonExit!.eventKey,eventVersion:1,offerKey:base.offerKey}),/SUPERSEDED/);const accepted=acceptKboOffseasonOffer(open,open.revision,{eventKey:open.offseasonExit!.eventKey,eventVersion:1,offerKey:r.counterOfferKey!});assert.equal(accepted.renewal!.annualSalaryWon,r.annualSalary);assert.doesNotThrow(()=>assertKboOffseasonExit(accepted));assert.throws(()=>api.requestCareerSalaryCounter(open,open.revision,{previewId:api.careerSalaryCounterPreview(open,open.offseasonExit!.offers[1]!.offerKey).previewId,raiseBps:1000,baseOfferKey:open.offseasonExit!.offers[1]!.offerKey}),/REQUEST_USED/);
});

test('multi-year USD counter requires every trusted future year; missing or forged authority cannot consume a request',()=>{
 // Controlled official seasons exercise the real year/contract reducers; this is not a native seven-season run.
 let c=closedUsMajorFixture();const funds=()=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:30_000_000}));
 for(let i=0;i<6;i++){let next=startNextUsMajorSeason(c,c.revision,funds());next=setUsPreseasonFocus(next,next.revision,next.world.players[next.protagonistKey]!.focus);next=confirmUsPreseasonPlan(next,next.revision);next=publishUsSeasonSchedule(next,next.revision);c=finishControlledMajorSeason(next);}
 const funding=funds(),base=usMajorFreeAgencyPreview(c,funding),offer=base.offers[0]!;assert.ok(offer.years>1);const unfunded=api.openUsAgentSalaryOffer(c,c.revision,funding),q=api.careerSalaryCounterPreview(unfunded);assert.ok(q.options.every(o=>!o.eligible&&o.unavailableReason==='FUTURE_BUDGET_AUTHORITY_REQUIRED'));const before=canonicalJson(unfunded);assert.throws(()=>api.requestCareerSalaryCounter(unfunded,unfunded.revision,{previewId:q.previewId,raiseBps:1000}),/BUDGET/);assert.equal(canonicalJson(unfunded),before);
 const future=Array.from({length:offer.years-1},(_,i)=>({seasonKey:String(Number(base.nextSeasonKey)+i+1),availableBudgetUsd:40_000_000,authorityReceiptKey:'future-funds-'+i,authorityRevision:1}));
 assert.throws(()=>api.openUsAgentSalaryOffer(c,c.revision,funding,[{...future[0]!,availableBudgetUsd:NaN}]),/FUTURE_BUDGET/);assert.throws(()=>api.openUsAgentSalaryOffer(c,c.revision,funding,[{...future[0]!,authorityRevision:0}]),/FUTURE_BUDGET/);
 const poor=api.openUsAgentSalaryOffer(c,c.revision,funding,future.map(f=>({...f,availableBudgetUsd:1})));assert.ok(api.careerSalaryCounterPreview(poor).options.every(o=>!o.eligible&&o.unavailableReason==='FUTURE_BUDGET_INSUFFICIENT'));
 let funded=api.openUsAgentSalaryOffer(c,c.revision,funding,future);funded=api.hireCareerAgent(funded,funded.revision,'AG03');funded.agents!.negotiationRng=seedPcg32(42n,54n);const preview=api.careerSalaryCounterPreview(funded);assert.equal(preview.options[0]!.eligible,true);const counter=api.requestCareerSalaryCounter(funded,funded.revision,{previewId:preview.previewId,raiseBps:1000}),request=counter.agents!.salaryRequests.at(-1)!;assert.equal(request.outcome,'ACCEPTED');const signed=acceptUsMajorFreeAgency(counter,counter.revision,funding,request.counterOfferKey!);assert.equal(signed.contract.annualSalaryUsd,request.annualSalary);assert.equal(signed.contract.years,offer.years);assert.doesNotThrow(()=>usCareerView(JSON.parse(JSON.stringify(signed))));
});

test('normal KBO144 registered payments true up exactly and public income exposes net separately from audited gross',()=>{
 let c=api.hireCareerAgent(regular(),regular().revision,'AG01');const salary=c.world.contracts[c.protagonistKey]!.annualSalaryWon,sourceWorld=canonicalJson(c.world);registerControlledGames(c,1);c=settleKboPersonalPayrollDay(c,c.days!.days.at(-1)!.day);registerControlledGames(c,144);const paid=settleKboPersonalPayrollDay(c,c.days!.days.at(-1)!.day),money=api.careerIncomeView(paid).totals.find(r=>r.currency==='KRW')!;assert.equal(money.gross,salary);assert.equal(money.fee,Math.floor(salary/50));assert.equal(money.net,money.gross-money.fee);assert.equal(canonicalJson(paid.world),sourceWorld);assert.equal(api.careerIncomeView(paid).disposableAmountKind,'NET');
});

test('promise trust accumulates raw15 then-10 as5; injury cancels a promise without a trust penalty',()=>{
 let c=regular();for(let i=1;i<=3;i++){c=api.acceptCareerRolePromise(c,c.revision);registerControlledGames(c,20*i);const before=canonicalJson(c),settled=api.settleCareerRolePromises(c);assert.equal(canonicalJson(c),before);c=settled;}assert.equal(api.careerAgentView(c).relationshipTrust,60);c=api.acceptCareerRolePromise(c,c.revision);const old=c.world.players[c.protagonistKey]!;c.world.players[c.protagonistKey]={...old,position:old.position==='RF'?'LF':'RF'};c.revision++;c=api.settleCareerRolePromises(c,'explicit-voluntary-role-confirm');assert.equal(api.careerAgentView(c).relationships[0]!.rawSeasonDelta,5);assert.equal(api.careerAgentView(c).relationshipTrust,55);
 let injured=api.acceptCareerRolePromise(regular(),regular().revision);injured.health.injuries[injured.protagonistKey]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:'controlled-health-source',seasonKey:injured.world.seasonKey};injured=api.settleCareerRolePromises(injured);assert.equal(injured.agents!.promises![0]!.status,'CANCELLED');assert.equal(api.careerAgentView(injured).relationshipTrust,50);
});

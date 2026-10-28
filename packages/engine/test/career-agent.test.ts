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
import type {CareerAgentLedger} from '../src/career-agent.js';
type AgentKbo=KboCareer&{agents:CareerAgentLedger};

// Dynamic loading gives the initial missing-domain test a useful assertion instead of a loader error.
const modulePath='../src/career-agent.js',api=await import(modulePath).catch(()=>({}));
function requireDomain(){assert.equal(typeof api.hireCareerAgent,'function','P15 needs a real career-agent domain');}
function regular(){let c=enteredKboCareer();c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);return startKboRegularSeason(c,c.revision);}
/** Controlled season-close boundary isolates negotiation; it is not a played full-year claim. */
function offered(){const c=regular();c.phaseContext={phase:'SEASON_REVIEW'};c.days!.days=[{day:300,evidence:'controlled-close',result:{injured:[],recovered:[]}}];c.seasonClose={receiptKey:'controlled-close',seasonKey:c.world.seasonKey,sourceRevision:c.revision,agingLossUnits:0,trainingForfeited:true};return offerKboRenewal(c,c.revision);}
function preview(c:KboCareer){return api.careerSalaryCounterPreview(c);}

test('P15 first pro hire is immediate; changes and direct negotiation become effective next season once',()=>{
 requireDomain();const original=regular(),before=canonicalJson(original),hired=api.hireCareerAgent(original,original.revision,'AG01');
 assert.equal(api.careerAgentView(hired).currentAgent,'AG01');assert.equal(canonicalJson(original),before);
 const changed=api.changeCareerAgent(hired,hired.revision,'AG03');assert.equal(api.careerAgentView(changed).currentAgent,'AG01');assert.equal(api.careerAgentView(changed).pendingAgent,'AG03');
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
 assert.equal(api.careerAgentView(c).income.find((r:{currency:string})=>r.currency==='KRW').net,98_000_000);
});

test('P15 real renewal preview .60/.68 never draws; success reserves only delta, supersedes base and actual accept uses raised salary',()=>{
 requireDomain();let c=offered();assert.equal(preview(c).options[0].probability,.6);c=api.hireCareerAgent(c,c.revision,'AG01');const q=preview(c),before=canonicalJson(c),base=c.renewal!;
 assert.equal(q.options[0].probability,.68);preview(c);assert.equal(canonicalJson(c),before);
 let success:typeof c|undefined;
 for(let i=0;i<30;i++){const attempt=structuredClone(c);attempt.world.seed='agent-success-'+i;const p=preview(attempt);const next=api.requestCareerSalaryCounter(attempt,attempt.revision,{previewId:p.previewId,raiseBps:1000});if(next.agents.salaryRequests.at(-1).outcome==='ACCEPTED'){success=next;break;}}
 assert.ok(success);const s=success as AgentKbo,request=s.agents.salaryRequests.at(-1)!,newSalary=q.options[0].annualSalary;
 assert.equal(s.renewal!.annualSalaryWon,base.annualSalaryWon);assert.equal(request.annualSalary,newSalary);assert.equal(kboFutureCommitmentWon(s.world,base.clubId,1)-kboFutureCommitmentWon(c.world,base.clubId,1),newSalary-base.annualSalaryWon);
 assert.throws(()=>acceptKboRenewal(s,s.revision,{eventKey:base.eventKey,eventVersion:1}),/SUPERSEDED/);
 const accepted=acceptKboRenewal(s,s.revision,{eventKey:base.eventKey,eventVersion:1,offerKey:request.counterOfferKey} as Parameters<typeof acceptKboRenewal>[2]);assert.equal(accepted.renewal!.annualSalaryWon,newSalary);assert.equal(accepted.renewal!.offerKey,request.counterOfferKey);
 assert.throws(()=>api.requestCareerSalaryCounter(s,s.revision,{previewId:preview(s).previewId,raiseBps:1000}),/REQUEST_USED/);
});

test('P15 rejection keeps original offer and no reserved delta; changed budget, forged raise and stale preview never consume RNG',()=>{
 requireDomain();const c=offered();let failed:typeof c|undefined;
 for(let i=0;i<30;i++){const attempt=structuredClone(c);attempt.world.seed='agent-reject-'+i;const p=preview(attempt);const next=api.requestCareerSalaryCounter(attempt,attempt.revision,{previewId:p.previewId,raiseBps:3000});if(next.agents.salaryRequests.at(-1).outcome==='REJECTED'){failed=next;break;}}
 assert.ok(failed);assert.deepEqual(failed!.renewal,c.renewal);assert.equal(kboFutureCommitmentWon(failed!.world,c.protagonistClubId,1),kboFutureCommitmentWon(c.world,c.protagonistClubId,1));
 assert.doesNotThrow(()=>acceptKboRenewal(failed!,failed!.revision,{eventKey:failed!.renewal!.eventKey,eventVersion:1}));
 const q=preview(c),changed=structuredClone(c);changed.world.clubs.find(x=>x.id===c.protagonistClubId)!.budgetWon+=10_000;const before=canonicalJson(changed);
 assert.throws(()=>api.requestCareerSalaryCounter(changed,changed.revision,{previewId:q.previewId,raiseBps:1000}),/PREVIEW_STALE/);assert.equal(canonicalJson(changed),before);
 assert.throws(()=>api.requestCareerSalaryCounter(c,c.revision,{previewId:q.previewId,raiseBps:9900}),/INVALID_RAISE/);
});

test('E91/E92/E93 are actual source-bound optional notices; domain choices and ACK close exactly once',()=>{
 requireDomain();let c=api.openCareerAgentEvents(offered(),offered().revision);const notices=api.careerAgentView(c).notices;assert.ok(notices.some((e:{definitionId:string})=>e.definitionId==='E91'));assert.ok(notices.some((e:{definitionId:string})=>e.definitionId==='E92'));
 const hire=notices.find((e:{definitionId:string})=>e.definitionId==='E91');c=api.resolveCareerAgentEvent(c,c.revision,{eventKey:hire.eventKey,eventVersion:hire.eventVersion,command:'HIRE_AGENT',agentId:'AG01'});assert.equal(api.careerAgentView(c).currentAgent,'AG01');
 assert.throws(()=>api.resolveCareerAgentEvent(c,c.revision,{eventKey:hire.eventKey,eventVersion:hire.eventVersion,command:'HIRE_AGENT',agentId:'AG02'}),/EVENT_/);
 const counter=api.careerAgentView(c).notices.find((e:{definitionId:string})=>e.definitionId==='E92'),q=preview(c);c=api.resolveCareerAgentEvent(c,c.revision,{eventKey:counter.eventKey,eventVersion:counter.eventVersion,command:'REQUEST_SALARY_COUNTER',previewId:q.previewId,raiseBps:1000});assert.equal(c.agents.salaryRequests.length,1);
});

test('accepted role review is consumed by next real lineup once, preserves bucket and never promises an appearance',()=>{
 requireDomain();let c=regular();let accepted:typeof c|undefined;
 for(let i=0;i<40;i++){const attempt=structuredClone(c);attempt.world.seed='role-success-'+i;const q=api.careerRoleReviewPreview(attempt);const next=api.requestCareerRoleReview(attempt,attempt.revision,{previewId:q.previewId});if(next.agents.roleRequests.at(-1).outcome==='ACCEPTED'){accepted=next;break;}}
 assert.ok(accepted);c=JSON.parse(JSON.stringify(accepted));assert.throws(()=>api.requestCareerRoleReview(c,c.revision,{previewId:api.careerRoleReviewPreview(c).previewId}),/REQUEST_USED/);
 for(let i=0;i<25;i++){const out=advanceKboCareer(c,c.revision);c=out.career;if((c as AgentKbo).agents.roleRequests[0]!.evaluation)break;}
 const r=(c as AgentKbo).agents.roleRequests[0]!;assert.ok(r.evaluation);assert.equal(r.evaluation.appearanceGuaranteed,false);assert.ok(r.evaluation.gameKey);assert.equal(r.evaluation.evaluations,1);
 const injured=regular();injured.health.injuries[injured.protagonistKey]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:'diagnosis',seasonKey:injured.world.seasonKey};assert.throws(()=>api.careerRoleReviewPreview(injured),/NOT_ELIGIBLE/);
});

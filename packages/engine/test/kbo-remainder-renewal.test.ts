import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {offerKboRemainderRenewal,acceptKboRemainderRenewal,kboRemainderRenewalView} from '../src/kbo-remainder-renewal.js';
import {advanceKboCareer} from '../src/kbo-progress.js';
import {kboRemainderBalance,settleKboRemainderPayrollDay} from '../src/kbo-remainder-pay.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {canonicalJson} from '../src/game.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
function accept(o:ReturnType<typeof offerKboRemainderRenewal>){const v=kboRemainderRenewalView(o)!;return acceptKboRemainderRenewal(o,o.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion});}
test('midseason offer is fixed, private and blocking; explicit acceptance preserves original receipts and budgets before real play resumes',()=>{
 const source=remainderDecisionCareer(),before=canonicalJson(source),old=source.world.contracts[source.protagonistKey]!,offered=offerKboRemainderRenewal(source,source.revision),view=kboRemainderRenewalView(offered)!;
 assert.equal(view.canAccept,true);assert.equal(offered.phaseContext.phase,'EVENT_DECISION');assert.equal(canonicalJson(source),before);assert.deepEqual(offerKboRemainderRenewal(offered,offered.revision),offered);assert.doesNotMatch(JSON.stringify(view),/sourceBasis|previous|ledger|seed|potential|rng/i);assert.throws(()=>advanceKboCareer(offered,offered.revision,1),/INVALID_CAREER_PHASE/);
 const accepted=accept(offered),key=accepted.protagonistKey,c=accepted.world.contracts[key]!;assert.equal(c.status,'ACTIVE_PRORATED');assert.equal(c.servicePay,undefined);assert.deepEqual(c.remainderPay!.previous,old);assert.equal(accepted.world.clubs.find(x=>x.id===accepted.protagonistClubId)!.paidSalaryWon,source.world.clubs.find(x=>x.id===source.protagonistClubId)!.paidSalaryWon);assertKboRecruitmentWorld(accepted.world);assert.throws(()=>accept(accepted));
 let running=accepted;for(let i=0;i<150 && running.world.contracts[key]!.remainderPay!.receipts.length===0;i++)running=advanceKboCareer(running,running.revision,1).career;
 assert.ok(running.world.contracts[key]!.remainderPay!.receipts.length>0);assert.deepEqual(running.world.contracts[key]!.remainderPay!.previous,old);const balance=kboRemainderBalance(running.world.contracts[key]!);assert.equal(running.world.clubs.find(x=>x.id===running.protagonistClubId)!.paidSalaryWon,balance.priorPaidWon+balance.paidWon);assertKboRecruitmentWorld(running.world);
 const replay=structuredClone(running),snapshot=canonicalJson(replay);settleKboRemainderPayrollDay(replay,replay.days!.days.at(-1)!.day);assert.equal(canonicalJson(replay),snapshot);
});
test('stale events and forged term/basis reject atomically; insufficient budget cannot silently fund a renewal',()=>{
 const o=offerKboRemainderRenewal(remainderDecisionCareer(),remainderDecisionCareer().revision),v=kboRemainderRenewalView(o)!,before=canonicalJson(o);
 assert.throws(()=>acceptKboRemainderRenewal(o,o.revision-1,{eventKey:v.eventKey,eventVersion:v.eventVersion}));assert.throws(()=>acceptKboRemainderRenewal(o,o.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion+1}));
 for(const mutate of [(x:typeof o)=>{x.remainderRenewal!.endWorldDay--;},(x:typeof o)=>{x.remainderRenewal!.annualSalaryWon+=10_000;},(x:typeof o)=>{x.remainderRenewal!.reservedGameDays--;},(x:typeof o)=>{x.rights.holderOrgId='OTHER';}]){const bad=structuredClone(o);mutate(bad);assert.throws(()=>accept(bad),/OFFER_CHANGED/);}
 const base=remainderDecisionCareer(),club=base.world.clubs.find(x=>x.id===base.protagonistClubId)!;let fill=Math.floor((club.budgetWon-club.paidSalaryWon-club.reservedSalaryWon-10_000)/10_000)*10_000;
 for(const key of club.roster){if(key===base.protagonistKey)continue;const contract=base.world.contracts[key]!,delta=Math.min(fill,3_000_000_000-contract.annualSalaryWon);contract.annualSalaryWon+=delta;club.reservedSalaryWon+=delta;fill-=delta;if(fill===0)break;}
 assert.equal(fill,0);assertKboRecruitmentWorld(base.world);const unfunded=offerKboRemainderRenewal(base,base.revision),snapshot=canonicalJson(unfunded);assert.equal(kboRemainderRenewalView(unfunded)!.canAccept,false);assert.throws(()=>accept(unfunded));assert.equal(canonicalJson(unfunded),snapshot);assert.equal(canonicalJson(o),before);
});
test('actual final regular date settles new pay once; postseason pays no extra; normal next-year renewal archives all prior contract receipts',()=>{
 const original=remainderDecisionCareer(),old=canonicalJson(original.world.contracts[original.protagonistKey]!);let c=accept(offerKboRemainderRenewal(original,original.revision));const p=c.world.contracts[c.protagonistKey]!.remainderPay!,end=p.endWorldDay,last=c.days!.days.at(-1)!.day;
 // Intervening dates are controlled clocks; the final date, postseason and year activation are actual commands.
 c.days!.days=[...c.days!.days,...Array.from({length:end-last-1},(_,i)=>({day:last+i+1,evidence:'controlled-middle-clock',result:{injured:[],recovered:[]}}))];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:end,pendingGame:null};
 for(let i=0;i<150 && c.phaseContext.phase==='SEASON_PROGRESS';i++)c=advanceKboCareer(c,c.revision,1).career;assert.equal(c.phaseContext.phase,'SEASON_REVIEW');const closedPay=structuredClone(c.world.contracts[c.protagonistKey]!.remainderPay!);assert.ok(closedPay.settlement);assert.equal(closedPay.reservedGameDays,0);assertKboRecruitmentWorld(c.world);
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}assert.deepEqual(c.world.contracts[c.protagonistKey]!.remainderPay,closedPay);
 c=settleKboSeasonGrowth(c,c.revision).career;c=closeKboSeason(c,c.revision,true);const offered=offerKboRenewal(c,c.revision),event=offered.events.find(e=>e.eventKey===offered.renewal!.eventKey)!,renewed=acceptKboRenewal(offered,offered.revision,{eventKey:event.eventKey,eventVersion:event.version}),next=startNextKboSeason(renewed,renewed.revision);
 assert.equal(next.world.contracts[next.protagonistKey]!.status,'ACTIVE');assert.equal(next.world.contracts[next.protagonistKey]!.remainderPay,undefined);assert.equal(next.contractHistory!.length,1);assert.deepEqual(next.contractHistory![0]!.remainderPay,closedPay);assert.equal(canonicalJson(next.contractHistory![0]!.remainderPay!.previous),old);assertKboRecruitmentWorld(next.world);
});

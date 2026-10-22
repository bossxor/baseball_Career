import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,acceptKboRemainderRenewal,kboRemainderRenewalView} from '../src/kbo-remainder-renewal.js';
import {advanceKboCareer} from '../src/kbo-progress.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {canonicalJson} from '../src/game.js';
function offered(){const c=remainderDecisionCareer();return offerKboRemainderRenewal(c,c.revision);}
function request(c:ReturnType<typeof offered>){const v=kboRemainderRenewalView(c)!;return {eventKey:v.eventKey,eventVersion:v.eventVersion};}

test('comparison request keeps E30, original offer, clock, rights and money intact while games remain paused',()=>{
 const o=offered(),before=canonicalJson(o),out=compareKboRemainderOffers(o,o.revision,request(o)),c=out.career,v=kboRemainderRenewalView(c)!;
 assert.equal(out.navigation.targetScreen,'S08');assert.equal(c.revision,o.revision+1);assert.equal(v.comparison?.originalOfferAvailable,true);assert.equal(v.canAccept,true);assert.equal(c.phaseContext.phase,'EVENT_DECISION');assert.equal(c.events.find(e=>e.eventKey===request(o).eventKey)!.status,'OPEN');
 for(const key of ['world','records','health','days','rights','registration','events','phaseContext'] as const)assert.deepEqual(c[key],o[key]);
 assert.ok(v.comparison!.offers.length>0);assert.ok(v.comparison!.offers.every(x=>x.clubId!==o.protagonistClubId&&x.annualSalaryWon===Math.round(o.remainderRenewal!.valueWon/10_000)*10_000&&x.firstTeamGuaranteed===false&&x.reservedGameDays>=x.estimatedGameDays));assert.deepEqual(c.world.rng,o.world.rng);
 assert.throws(()=>advanceKboCareer(c,c.revision,1),/INVALID_CAREER_PHASE/);assert.equal(canonicalJson(o),before);assert.doesNotMatch(JSON.stringify(v),/sourceBasis|potential|seed|requestKey|ledger/);
});
test('comparison excludes fully committed clubs and keeps the original contract option when no alternate can fund the remainder',()=>{
 const c=remainderDecisionCareer();for(const club of c.world.clubs.filter(x=>x.id!==c.protagonistClubId)){let remaining=club.budgetWon-club.paidSalaryWon-club.reservedSalaryWon;for(const key of club.roster){const contract=c.world.contracts[key]!,add=Math.min(remaining,3_000_000_000-contract.annualSalaryWon);contract.annualSalaryWon+=add;club.reservedSalaryWon+=add;remaining-=add;if(remaining===0)break;}assert.equal(remaining,0);}assertKboRecruitmentWorld(c.world);
 const o=offerKboRemainderRenewal(c,c.revision),out=compareKboRemainderOffers(o,o.revision,request(o)),v=kboRemainderRenewalView(out.career)!;assert.equal(v.comparison!.offers.length,0);assert.equal(v.comparison!.emptyReason,'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET');assert.equal(v.canAccept,true);
});
test('comparison is idempotent after JSON resume; stale and altered requests reject without rerolls or state changes',()=>{
 const o=offered(),out=compareKboRemainderOffers(o,o.revision,request(o)),c=JSON.parse(JSON.stringify(out.career)) as typeof o,before=canonicalJson(c);
 assert.deepEqual(compareKboRemainderOffers(c,c.revision,request(c)).career,c);
 assert.throws(()=>compareKboRemainderOffers(c,c.revision-1,request(c)));assert.throws(()=>compareKboRemainderOffers(c,c.revision,{...request(c),eventVersion:request(c).eventVersion+1}));assert.throws(()=>compareKboRemainderOffers(c,c.revision,{...request(c),eventKey:'foreign'}));
 for(const change of [(x:typeof c)=>{x.remainderRenewal!.comparison!.requestKey='foreign';},(x:typeof c)=>{x.remainderRenewal!.comparison!.requestedAfterWorldDay--;},(x:typeof c)=>{x.remainderRenewal!.annualSalaryWon+=10_000;},(x:typeof c)=>{x.remainderRenewal!.comparison!.offers[0]!.annualSalaryWon+=10_000;},(x:typeof c)=>{x.world.clubs.find(t=>t.id!==x.protagonistClubId)!.paidSalaryWon++;}]){const bad=structuredClone(c);change(bad);assert.throws(()=>kboRemainderRenewalView(bad),/OFFER_CHANGED/);}
 assert.equal(canonicalJson(c),before);assert.equal(kboRemainderRenewalView(o)!.comparison,undefined);
});
test('original club acceptance remains possible after comparison and actually resumes registered prorated payment exactly once',()=>{
 const o=offered(),compared=compareKboRemainderOffers(o,o.revision,request(o)).career,before=canonicalJson(compared),accepted=acceptKboRemainderRenewal(compared,compared.revision,request(compared)),key=accepted.protagonistKey;
 assert.equal(accepted.phaseContext.phase,'SEASON_PROGRESS');assert.deepEqual(accepted.world.contracts[key]!.remainderPay!.previous,o.world.contracts[key]);assert.equal(accepted.rights.holderOrgId,o.rights.holderOrgId);assertKboRecruitmentWorld(accepted.world);
 let c=accepted;for(let i=0;i<150&&c.world.contracts[key]!.remainderPay!.receipts.length===0;i++)c=advanceKboCareer(c,c.revision,1).career;
 assert.ok(c.world.contracts[key]!.remainderPay!.receipts.length>0);assertKboRecruitmentWorld(c.world);assert.throws(()=>acceptKboRemainderRenewal(c,c.revision,request(compared)));assert.equal(canonicalJson(compared),before);
});

import {applyToSangmu,resolveSangmuApplication} from '../src/kbo-military-state.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {KBO_MONEY} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {kboCareerEntryView} from '../src/kbo-career-entry.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {startNextKboSeason,kboYearTransitionReadiness} from '../src/kbo-year-transition.js';
import {compareKboOffseasonOffers,acceptKboOffseasonOffer,kboOffseasonOffersView} from '../src/kbo-offseason-exit.js';
import {offerKboRenewal} from '../src/kbo-renewal.js';
import {kboFutureCommitmentWon,kboClubBalance} from '../src/kbo-finance.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {assertKboCareerRevision} from '../src/kbo-career-version.js';
import {canonicalJson} from '../src/game.js';
import {confirmKboActiveService} from '../src/kbo-active-service.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {signKboRequiredReplacement} from '../src/kbo-roster-repair.js';
import {nextKboFreeAgentYear,settleKboFreeAgentSeason} from '../src/kbo-free-agents.js';
import {requestKboRetirement,resolveKboRetirement} from '../src/kbo-retirement.js';

let cached:KboCareer|undefined;
function closed(){
 if(!cached){const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);let c=startKboRegularSeason(s,s.revision);const fixtures=Object.values(c.competitionSchedule!.leagues).flat(),first=Math.min(...fixtures.map(g=>g.worldDay)),last=Math.max(...fixtures.map(g=>g.worldDay));
 // Controlled unplayed regular clock, native postseason/closure and all later AI/Y02 commands.
 c.days!.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-offseason-source',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_REVIEW'};c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}c=settleKboSeasonGrowth(c,c.revision).career;cached=closeKboSeason(c,c.revision,true);}
 return structuredClone(cached);
}
function fillFuture(c:KboCareer,clubId:string){
 const club=c.world.clubs.find(t=>t.id===clubId)!;for(const k of club.roster)if(k!==c.protagonistKey)c.world.contracts[k]!.years=2;
 let remaining=club.budgetWon*.9-kboFutureCommitmentWon(c.world,club.id,1);
 for(const k of club.roster){if(k===c.protagonistKey)continue;const v=c.world.contracts[k]!,n=Math.min(remaining,KBO_MONEY.maximumSalaryWon-v.annualSalaryWon);v.annualSalaryWon+=n;club.reservedSalaryWon+=n;remaining-=n;}
 assert.equal(remaining,0);assertKboRecruitmentWorld(c.world);
}
function poor(){const c=closed();fillFuture(c,c.protagonistClubId);return c;}
function choose(c:KboCareer){const o=c.offseasonExit!,e=c.events.find(e=>e.eventKey===o.eventKey)!;return acceptKboOffseasonOffer(c,c.revision,{eventKey:e.eventKey,eventVersion:e.version,offerKey:o.offers[0]!.offerKey});}

test('unfunded next-year renewal opens stable one-year comparison without rewriting closing rights, money, records or RNG',()=>{
 const source=poor(),before=canonicalJson(source);assert.equal(offerKboRenewal(source,source.revision).offseasonExit!.status,'OPEN');const c=compareKboOffseasonOffers(source,source.revision),view=kboOffseasonOffersView(c)!;
 assert.equal(canonicalJson(source),before);assert.equal(c.schemaVersion,7);assert.ok(view.offers.length);assert.ok(view.offers.every(o=>o.years===1 && !o.firstTeamGuaranteed && o.clubId!==source.protagonistClubId));assert.deepEqual(c.world,source.world);assert.deepEqual(c.rights,source.rights);assert.deepEqual(c.records,source.records);assert.deepEqual(compareKboOffseasonOffers(c,c.revision),c);assert.ok(kboYearTransitionReadiness(c).blockers.includes('CONTRACT_DECISION_REQUIRED'));
 const down=structuredClone(c);down.schemaVersion=6;assert.throws(()=>assertKboCareerRevision(down,down.revision),/CAREER_REVISION_CHANGED/);assert.ok(!JSON.stringify(view).includes('potential'));
});

test('accepted alternative releases old rights only at atomic Y02, preserves player and closes the budget deadlock',()=>{
 const source=compareKboOffseasonOffers(poor(),poor().revision),before=canonicalJson(source),c=choose(source),key=c.protagonistKey,offer=c.offseasonExit!.offers[0]!;
 assert.equal(canonicalJson(source),before);assert.deepEqual(c.world,source.world);assert.deepEqual(c.rights,source.rights);assert.equal(kboYearTransitionReadiness(c).ready,true);
 const next=startNextKboSeason(c,c.revision);assert.equal(next.protagonistClubId,offer.clubId);assert.equal(next.rights.sourceType,'FREE_AGENT');assert.equal(next.rights.holderOrgId,offer.clubId);assert.equal(next.world.contracts[key]!.years,1);assert.equal(next.world.contracts[key]!.annualSalaryWon,offer.annualSalaryWon);assert.equal(next.world.contracts[key]!.contractKey,offer.offerKey);assert.equal(next.world.players[key]!.age,c.world.players[key]!.age+1);assert.deepEqual(next.world.players[key]!.abilities,c.world.players[key]!.abilities);assert.deepEqual(next.records,c.records);assert.equal(next.world.clubs.filter(t=>t.roster.includes(key)).length,1);assert.equal(next.world.clubs.find(t=>t.id===c.protagonistClubId)!.roster.includes(key),false);assertKboRecruitmentWorld(next.world);assert.ok(!next.freeAgents!.players[key]);assert.equal(kboCareerEntryView(next).club.id,offer.clubId);
 for(const t of next.world.clubs){assert.equal(t.firstTeam.length,28);assert.ok(kboClubBalance(next.world,t.id).availableWon>=0);}
 const intake=startSangmuCohort(next,next.revision);assert.equal(intake.schemaVersion,7);
});

test('stale offers, forged prices or domain receipts, replay and changed budgets reject without mutating input',()=>{
 const c=compareKboOffseasonOffers(poor(),poor().revision),o=c.offseasonExit!,e=c.events.find(e=>e.eventKey===o.eventKey)!,before=canonicalJson(c),input={eventKey:e.eventKey,eventVersion:e.version,offerKey:o.offers[0]!.offerKey};
 assert.throws(()=>acceptKboOffseasonOffer(c,c.revision,{...input,eventVersion:e.version+1}),/EVENT_VERSION_CHANGED/);assert.throws(()=>acceptKboOffseasonOffer(c,c.revision,{...input,offerKey:'forged'}),/KBO_OFFSEASON_OFFERS_CHANGED/);assert.equal(canonicalJson(c),before);
 const forged=structuredClone(c);forged.offseasonExit!.offers[0]!.annualSalaryWon+=10_000;assert.throws(()=>kboOffseasonOffersView(forged),/KBO_OFFSEASON_OFFERS_CHANGED/);
 const changed=structuredClone(c);fillFuture(changed,o.offers[0]!.clubId);assert.throws(()=>acceptKboOffseasonOffer(changed,changed.revision,input),/KBO_OFFSEASON_OFFERS_CHANGED/);
 const accepted=choose(c),receipt=structuredClone(accepted);receipt.events.find(x=>x.eventKey===o.eventKey)!.resolution!.receiptKey='forged';assert.throws(()=>startNextKboSeason(receipt,receipt.revision),/KBO_OFFSEASON_OFFERS_CHANGED/);assert.throws(()=>acceptKboOffseasonOffer(accepted,accepted.revision,input),/KBO_OFFSEASON_OFFERS_CHANGED/);
});

test('a current full60 recipient with expiring seats can sign, while genuine guaranteed60 capacity cannot',()=>{
 const c=poor(),first=compareKboOffseasonOffers(c,c.revision).offseasonExit!.offers[0]!,club=c.world.clubs.find(t=>t.id===first.clubId)!;
 c.freeAgents=nextKboFreeAgentYear({worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,difficulty:c.difficulty,registeredKeys:Object.keys(c.world.players)});
 while(club.roster.length<60)signKboRequiredReplacement(c.world,c.freeAgents,club.id,'CF',c.difficulty);c.freeAgents=settleKboFreeAgentSeason(c.freeAgents,c.world.calendar,c.difficulty);assertKboRecruitmentWorld(c.world);
 const offered=compareKboOffseasonOffers(c,c.revision);assert.ok(offered.offseasonExit!.offers.some(o=>o.clubId===club.id));const e=offered.events.find(e=>e.eventKey===offered.offseasonExit!.eventKey)!,accepted=acceptKboOffseasonOffer(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,offerKey:offered.offseasonExit!.offers.find(o=>o.clubId===club.id)!.offerKey});assertKboRecruitmentWorld(startNextKboSeason(accepted,accepted.revision).world);
 const locked=structuredClone(c);for(const k of locked.world.clubs.find(t=>t.id===club.id)!.roster)locked.world.contracts[k]!.years=2;assertKboRecruitmentWorld(locked.world);assert.ok(!compareKboOffseasonOffers(locked,locked.revision).offseasonExit!.offers.some(o=>o.clubId===club.id));
});

test('no funded club keeps comparison blocked and offers the existing explicit retirement path',()=>{
 const c=poor();for(const t of c.world.clubs)if(t.id!==c.protagonistClubId)fillFuture(c,t.id);const market=compareKboOffseasonOffers(c,c.revision),view=kboOffseasonOffersView(market)!;assert.equal(view.offers.length,0);assert.equal(view.emptyReason,'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET');assert.equal(view.retirementAvailable,true);assert.throws(()=>startNextKboSeason(market,market.revision),/YEAR_TRANSITION_NOT_READY/);
 const retirement=requestKboRetirement(market,market.revision),event=retirement.events.find(e=>e.definitionId==='E36'&&e.status==='OPEN')!,archived=resolveKboRetirement(retirement,retirement.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'CONFIRM_RETIRE'});assert.equal(archived.phaseContext.phase,'ARCHIVED');assert.equal(kboOffseasonOffersView(archived),null);
});

test('a planned ACTIVE service after alternative acceptance freezes the new club contract and preserves new rights',()=>{
 const c=choose(compareKboOffseasonOffers(poor(),poor().revision)),active=confirmKboActiveService(c,c.revision),next=startNextKboSeason(active,active.revision);assert.equal(active.military!.program!.originalClubId,c.renewal!.clubId);assert.equal(next.military!.program!.originalClubId,next.protagonistClubId);assert.equal(next.world.contracts[next.protagonistKey]!.servicePay!.kind,'ACTIVE');assert.equal(next.world.contracts[next.protagonistKey]!.servicePay!.ledger.contract.clubId,next.protagonistClubId);assertKboRecruitmentWorld(next.world);
});



test('accepted alternative also owns a subsequent Sangmu program and its suspended salary ledger',()=>{
 const entry=poor(),kind=entry.world.players[entry.protagonistKey]!.kind;for(const [key,p] of Object.entries(entry.world.players))if(key!==entry.protagonistKey && p.kind===kind)p.age=28;
 const offered=offerKboRenewal(entry,entry.revision),accepted=choose(offered),application=applyToSangmu(accepted,accepted.revision);assert.equal(application.military!.applications.at(-1)!.accepted,true);const enlisted=resolveSangmuApplication(application,application.revision,'ENLIST');assert.equal(enlisted.military!.program!.originalClubId,accepted.renewal!.clubId);
 const next=startNextKboSeason(enlisted,enlisted.revision);assert.equal(next.military!.program!.originalClubId,next.protagonistClubId);assert.equal(next.world.contracts[next.protagonistKey]!.servicePay!.kind,'SPORTS');assert.equal(next.world.contracts[next.protagonistKey]!.servicePay!.ledger.contract.clubId,next.protagonistClubId);assertKboRecruitmentWorld(next.world);
});

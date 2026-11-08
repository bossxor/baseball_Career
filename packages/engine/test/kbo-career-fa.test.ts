import test from 'node:test';
import assert from 'node:assert/strict';
import {KBO_MONEY} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {KboSeasonArchive} from '../src/kbo-year-transition.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {canonicalJson} from '../src/game.js';
import {kboServiceTimeView} from '../src/kbo-service-time.js';
import {openKboCareerFa,selectKboCareerFaOffer,acceptKboCareerFaOffer,declineKboCareerFaSelection,kboCareerFaView,assertAcceptedKboCareerFa,assertKboCareerFaLedger,activateKboCareerFa} from '../src/kbo-career-fa.js';
import {requestKboRetirement,resolveKboRetirement} from '../src/kbo-retirement.js';
import {kboRetirementArchiveView} from '../src/kbo-archive-view.js';
import {resolveEventChoice} from '../src/events.js';

/** Official registration-only receipts isolate FA; live day/game evidence is covered by kbo-service-time.test.ts. */
function closed(age=28,qualified=8){
 const c=enteredKboCareer(),key=c.protagonistKey,club=c.protagonistClubId,other=c.world.clubs.find(t=>t.id!==club)!.id;
 c.world.seasonKey='2040';c.world.calendar=createSeasonCalendar(2040,'calendar-2');c.world.players[key]={...c.world.players[key]!,age};c.phaseContext={phase:'SEASON_REVIEW'};c.events=[];
 for(const contract of Object.values(c.world.contracts)){contract.seasonKey='2040';contract.years=2;contract.annualSalaryWon=KBO_MONEY.minimumSalaryWon;}
 c.world.contracts[key]!.years=1;for(const team of c.world.clubs)team.reservedSalaryWon=team.roster.reduce((sum,k)=>sum+c.world.contracts[k]!.annualSalaryWon,0);
 c.seasonClose={seasonKey:'2040',receiptKey:'controlled-fa-season-close'} as NonNullable<KboCareer['seasonClose']>;
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:'2040',days:[{day:303,evidence:'controlled-fa-day',result:{injured:[],recovered:[]}}]};c.proSeasons=[];
 for(let i=0;i<qualified;i++){
  const seasonKey=String(2033+i);if(seasonKey!=='2040')c.proSeasons=[...c.proSeasons,{seasonKey} as KboSeasonArchive];
  for(let day=1;day<=100;day++){
   const gameKey=JSON.stringify(['fa-registration',seasonKey,day]);c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[other]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
   c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:'KBO:'+club,seasonKey,day,roster:[key],appearances:[]},result:{injured:[],recovered:[]}}];
  }
 }
 c.records.revision=qualified*100;return c;
}
function selected(c:KboCareer,offerKey?:string){const v=kboCareerFaView(c)!;return selectKboCareerFaOffer(c,c.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:offerKey??v.offers[0]!.offerKey});}
function accepted(c:KboCareer){const v=kboCareerFaView(c)!;return acceptKboCareerFaOffer(c,c.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:v.selectedOfferKey!});}
function backupSource(age:number){
 const source=closed(age),p=source.world.players[source.protagonistKey]!;
 source.world.players[p.simulationKey]={...p,abilities:Object.fromEntries(Object.keys(p.abilities).map(key=>[key,10_000]))};
 for(const other of Object.values(source.world.players))if(other.simulationKey!==p.simulationKey&&other.kind===p.kind&&other.position===p.position){const axes=Object.fromEntries(Object.keys(other.abilities).map(key=>[key,1_000_000]));source.world.players[other.simulationKey]={...other,abilities:axes,potential:{...axes},careerPeaks:{...axes}};}
 return source;
}

test('FA registered eight100-game closed seasons includes bench/injury; seven/99/Futures never become FA',()=>{
 const eligible=closed(),before=canonicalJson(eligible);assert.equal(kboServiceTimeView(eligible).qualifiedSeasons,8);const opened=openKboCareerFa(eligible,eligible.revision);assert.ok(kboCareerFaView(opened)!.offers.length);assert.equal(canonicalJson(eligible),before);assert.deepEqual(opened.world,eligible.world);assert.deepEqual(opened.records,eligible.records);assert.deepEqual(opened.rights,eligible.rights);
 const seven=closed(28,7);assert.throws(()=>openKboCareerFa(seven,seven.revision),/FA_NOT_AVAILABLE/);
 const only99=closed();const last=only99.health.games.at(-1)!;only99.health.games=only99.health.games.slice(0,-1);assert.equal(kboServiceTimeView(only99).qualifiedSeasons,7);assert.throws(()=>openKboCareerFa(only99,only99.revision),/FA_NOT_AVAILABLE/);assert.ok(last.evidence.appearances.length===0);
 const futures=closed();for(const row of futures.health.games){row.evidence.teamKey=row.evidence.teamKey.replace('KBO:','FUTURES:');futures.records.games[row.evidence.gameKey]!.scope.leagueKey='FUTURES';}assert.throws(()=>openKboCareerFa(futures,futures.revision),/FA_NOT_AVAILABLE/);
});
test('FA quote uses contract-start age4/3/2/1 years, fixed existing price seed, cap and JSON refresh stability',()=>{
 for(const [age,years]of [[28,4],[29,3],[31,3],[32,2],[34,2],[35,1]] as const){const c=closed(age),opened=openKboCareerFa(c,c.revision),view=kboCareerFaView(opened)!;assert.ok(view.offers.length);assert.ok(view.offers.every(o=>o.years===years&&o.annualSalaryWon>=30_000_000&&o.annualSalaryWon<=3_000_000_000&&o.annualSalaryWon%10_000===0&&!o.firstTeamGuaranteed));assert.deepEqual(openKboCareerFa(JSON.parse(JSON.stringify(opened)),opened.revision),opened);assert.doesNotMatch(JSON.stringify(view),/potential|careerPeaks|sourceBasis|seed|rng|snapshot/);}
 const max=closed(),p=max.world.players[max.protagonistKey]!,axes=Object.fromEntries(Object.keys(p.abilities).map(key=>[key,1_000_000]));max.world.players[max.protagonistKey]={...p,abilities:axes,potential:{...axes},careerPeaks:{...axes}};const capped=openKboCareerFa(max,max.revision);assert.ok(kboCareerFaView(capped)!.offers.every(o=>o.annualSalaryWon<=KBO_MONEY.maximumSalaryWon));
});
test('FA E31 comparison and E32/E33 actual domain contract; decline preserves identical offers and old money',()=>{
 const original=closed(),opened=openKboCareerFa(original,original.revision),view=kboCareerFaView(opened)!,chosen=selected(opened),selection=kboCareerFaView(chosen)!;
 assert.equal(chosen.events.find(e=>e.eventKey===view.eventKey)!.resolution!.kind,'DOMAIN');assert.equal(chosen.events.find(e=>e.eventKey===view.eventKey)!.resolution!.command,'SELECT_FA_OFFER');assert.ok(['E32','E33'].includes(chosen.events.find(e=>e.eventKey===selection.eventKey)!.definitionId));
 const declined=declineKboCareerFaSelection(chosen,chosen.revision,{eventKey:selection.eventKey,eventVersion:selection.eventVersion});assert.equal(kboCareerFaView(declined)!.state,'OPEN');assert.deepEqual(kboCareerFaView(declined)!.offers,view.offers);assert.deepEqual(declined.world,original.world);assert.deepEqual(declined.rights,original.rights);assert.deepEqual(declined.records,original.records);assert.equal(declined.renewal,undefined);
 const committed=accepted(selected(declined)),window=assertAcceptedKboCareerFa(committed);assert.equal(committed.renewal!.years,window.contract!.years);assert.equal(committed.renewal!.annualSalaryWon,window.contract!.annualSalaryWon);assert.deepEqual(committed.world,original.world);assert.deepEqual(committed.rights,original.rights);assert.equal(window.snapshot.contract.contractKey,original.world.contracts[original.protagonistKey]!.contractKey);assertKboCareerFaLedger(JSON.parse(JSON.stringify(committed.freeAgency)));
 const bad=structuredClone(committed);bad.events.find(e=>e.eventKey===window.eventKey)!.resolution!.receiptKey='forged';assert.throws(()=>assertAcceptedKboCareerFa(bad),/FA_ACCEPTED_CONTRACT_CHANGED/);
});
test('FA corrections do not reprice frozen quotes; CAS/version/forged quote/money failures preserve original source',()=>{
 const c=selected(openKboCareerFa(closed(),closed().revision)),before=canonicalJson(c),v=kboCareerFaView(c)!,input={eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:v.selectedOfferKey!};
 assert.throws(()=>acceptKboCareerFaOffer(c,c.revision-1,input),/REVISION_CHANGED/);assert.throws(()=>acceptKboCareerFaOffer(c,c.revision,{...input,eventVersion:v.eventVersion+1}),/EVENT_VERSION_CHANGED/);assert.throws(()=>acceptKboCareerFaOffer(c,c.revision,{...input,offerKey:'forged'}),/FA_OFFER_NOT_AVAILABLE/);assert.equal(canonicalJson(c),before);
 const corrected=structuredClone(c);corrected.records.revision++;corrected.records.games={};assert.deepEqual(kboCareerFaView(corrected)!.offers,v.offers);assert.equal(accepted(corrected).renewal!.annualSalaryWon,v.offers.find(o=>o.offerKey===v.selectedOfferKey)!.annualSalaryWon);
 const forged=structuredClone(c);forged.freeAgency!.windows[0]!.offers[0]!.annualSalaryWon+=10_000;assert.throws(()=>kboCareerFaView(forged),/FA_QUOTE_CHANGED/);
 const budget=structuredClone(c),target=v.offers.find(o=>o.offerKey===v.selectedOfferKey)!.clubId;budget.world.clubs.find(t=>t.id===target)!.budgetWon=1;const frozen=canonicalJson(budget);assert.throws(()=>accepted(budget),/FA_BUDGET_OR_CAPACITY_CHANGED/);assert.equal(canonicalJson(budget),frozen);
});
test('FA accepted different-club contract activates once at Y02; original season/player/registration/salary survives untouched',()=>{
 const opened=openKboCareerFa(closed(),closed().revision),offer=kboCareerFaView(opened)!.offers.find(o=>o.clubId!==opened.protagonistClubId)!,source=accepted(selected(opened,offer.offerKey)),snapshot=canonicalJson(source),w=assertAcceptedKboCareerFa(source),next=structuredClone(source);
 next.world.contracts[source.protagonistKey]=structuredClone(w.contract!);next.world.players[source.protagonistKey]={...next.world.players[source.protagonistKey]!,age:next.world.players[source.protagonistKey]!.age+1};activateKboCareerFa(source,next);
 assert.equal(next.protagonistClubId,offer.clubId);assert.equal(next.world.clubs.filter(t=>t.roster.includes(next.protagonistKey)).length,1);assert.equal(next.rights.holderOrgId,offer.clubId);assert.equal(next.rights.sourceType,'FREE_AGENT');assert.equal(next.registration.firstTeam,false);assert.equal(next.world.contracts[next.protagonistKey]!.years,offer.years);assert.deepEqual(next.world.players[next.protagonistKey]!.abilities,source.world.players[source.protagonistKey]!.abilities);assert.deepEqual(next.records,source.records);assert.equal(canonicalJson(source),snapshot);
});
test('FA a real backup-role quote opens E33 and commits ACCEPT_ROLE, without first-team guarantee',()=>{
 const source=backupSource(33);
 const opened=openKboCareerFa(source,source.revision),offer=kboCareerFaView(opened)!.offers.find(o=>o.role===.5)!;assert.ok(offer);
 const selection=selected(opened,offer.offerKey),v=kboCareerFaView(selection)!;assert.equal(selection.events.find(e=>e.eventKey===v.eventKey)!.definitionId,'E33');
 const signed=accepted(selection);assert.equal(signed.events.find(e=>e.eventKey===v.eventKey)!.resolution!.command,'ACCEPT_ROLE');assert.equal(signed.freeAgency!.windows[0]!.offers.find(o=>o.offerKey===offer.offerKey)!.firstTeamGuaranteed,false);
});

test('FA backup event uses sealed current age32 versus33, not next-contract age or mutable live age',()=>{
 for(const age of [32,33]){
  const source=backupSource(age),raw=canonicalJson(source),opened=openKboCareerFa(source,source.revision),offer=kboCareerFaView(opened)!.offers.find(o=>o.role===.5)!;assert.ok(offer);
  const quotes=canonicalJson(kboCareerFaView(opened)!.offers);
  opened.world.players[opened.protagonistKey]!.age=age===32?33:32;
  const selection=selected(JSON.parse(JSON.stringify(opened)),offer.offerKey),v=kboCareerFaView(selection)!,e=selection.events.find(e=>e.eventKey===v.eventKey)!;
  assert.equal(e.definitionId,age===32?'E32':'E33');
  const signed=accepted(selection);assert.equal(signed.events.find(x=>x.eventKey===v.eventKey)!.resolution!.command,age===32?'ACCEPT_CAREER_OFFER':'ACCEPT_ROLE');
  assert.equal(canonicalJson(kboCareerFaView(signed)!.offers),quotes);assert.equal(canonicalJson(source),raw);assertAcceptedKboCareerFa(JSON.parse(JSON.stringify(signed)));
 }
});

test('FA legacy unversioned young backup E33 and signed receipts remain readable and actionable',()=>{
 const source=backupSource(28),opened=openKboCareerFa(source,source.revision),w=opened.freeAgency!.windows[0]!;
 // Controlled old persisted window: its original basis has no role-event policy field.
 Reflect.deleteProperty(w.snapshot,'roleEventPolicy');
 w.sourceBasis=canonicalJson({windowId:w.windowId,sourceSeasonKey:w.sourceSeasonKey,seasonKey:w.seasonKey,sourceRevision:w.sourceRevision,sourceRecordRevision:w.sourceRecordRevision,sourceReceipt:w.sourceReceipt,fromClubId:w.fromClubId,snapshot:w.snapshot});
 const offer=kboCareerFaView(opened)!.offers.find(o=>o.role===.5)!;assert.ok(offer);
 const selection=selected(JSON.parse(JSON.stringify(opened)),offer.offerKey),v=kboCareerFaView(selection)!;
 assert.equal(selection.events.find(e=>e.eventKey===v.eventKey)!.definitionId,'E33');
 const signed=accepted(selection),raw=canonicalJson(signed),restored=JSON.parse(JSON.stringify(signed));assertAcceptedKboCareerFa(restored);assert.equal(canonicalJson(restored),raw);
 assert.equal(restored.events.find((e:{eventKey:string})=>e.eventKey===v.eventKey).resolution.command,'ACCEPT_ROLE');
 const declined=declineKboCareerFaSelection(selection,selection.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion});assert.deepEqual(kboCareerFaView(declined)!.offers,kboCareerFaView(opened)!.offers);
 const bad=JSON.parse(JSON.stringify(opened));bad.freeAgency.windows[0].snapshot.roleEventPolicy='UNKNOWN';assert.throws(()=>kboCareerFaView(bad),/FA_WINDOW/);
});
test('FA actual guaranteed60-player roster or future90 percent debt removes that club; an all-closed market has no fake offer',()=>{
 const source=closed(),to=source.world.clubs.find(t=>t.id!==source.protagonistClubId)!,donor=source.world.clubs.find(t=>t.id!==source.protagonistClubId&&t.id!==to.id)!;
 const moving=donor.roster.filter(k=>!donor.firstTeam.includes(k)).slice(0,60-to.roster.length);assert.equal(moving.length,60-to.roster.length);
 donor.roster=donor.roster.filter(k=>!moving.includes(k));to.roster=[...to.roster,...moving];for(const key of moving)source.world.contracts[key]!.clubId=to.id;
 const blocked=openKboCareerFa(source,source.revision);assert.ok(!kboCareerFaView(blocked)!.offers.some(o=>o.clubId===to.id));
 const bankrupt=closed();for(const club of bankrupt.world.clubs)club.budgetWon=1;const empty=openKboCareerFa(bankrupt,bankrupt.revision);assert.equal(kboCareerFaView(empty)!.offers.length,0);assert.equal(kboCareerFaView(empty)!.emptyReason,'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET');
});

test('empty FA market permits retirement confirmation while preserving the market on cancellation',()=>{
 const source=closed();for(const club of source.world.clubs)club.budgetWon=1;
 const market=openKboCareerFa(source,source.revision),view=kboCareerFaView(market)!,before=canonicalJson(market);
 assert.equal(view.offers.length,0);assert.equal(view.retirementAvailable,true);
 assert.throws(()=>requestKboRetirement(market,market.revision-1),/REVISION/);assert.equal(canonicalJson(market),before);
 const asked=requestKboRetirement(market,market.revision),phase=asked.phaseContext;assert.equal(phase.phase,'RETIRE_CONFIRM');if(phase.phase!=='RETIRE_CONFIRM')throw Error('phase');
 const e=asked.events.find(e=>e.eventKey===phase.eventKey)!,input={eventKey:e.eventKey,eventVersion:e.version,command:'CANCEL_RETIRE' as const};
 assert.throws(()=>resolveKboRetirement(asked,asked.revision,{...input,eventVersion:e.version+1}),/VERSION/);
 const cancelled=resolveKboRetirement(asked,asked.revision,input);assert.equal(cancelled.events.find(e=>e.eventKey===view.eventKey)!.status,'OPEN');assert.deepEqual(kboCareerFaView(cancelled)!.offers,[]);
 const again=requestKboRetirement(cancelled,cancelled.revision),next=again.phaseContext;if(next.phase!=='RETIRE_CONFIRM')throw Error('phase');const confirmation=again.events.find(e=>e.eventKey===next.eventKey)!;
 const retired=resolveKboRetirement(again,again.revision,{eventKey:confirmation.eventKey,eventVersion:confirmation.version,command:'CONFIRM_RETIRE'});assert.equal(retired.phaseContext.phase,'ARCHIVED');
 const resolved=retired.events.find(e=>e.eventKey===view.eventKey)!,receipt=retired.retirement!.receiptKey;
 assert.equal(resolved.status,'RESOLVED');assert.equal(resolved.resolution!.command,'RETIRE');assert.equal(resolved.resolution!.receiptKey,JSON.stringify(['kbo-retirement-decision',receipt,'RETIRE']));
 assert.equal(kboCareerFaView(retired),null);const archive=kboRetirementArchiveView(retired);assert.equal(archive.archiveKey,receipt);assert.deepEqual(kboRetirementArchiveView(JSON.parse(JSON.stringify(retired))),archive);
 const farewell=retired.events.find(e=>['E37','E69'].includes(e.definitionId)&&e.evidence.fields.retirementTaskOrReceiptId===receipt)!;assert.ok(farewell);
 const opened=resolveEventChoice(farewell,farewell.version,'OPEN_ARCHIVE',null,{worldKey:retired.world.worldKey,seasonKey:retired.world.seasonKey,worldDay:farewell.occurredWorldDay,eligibleCommands:['OPEN_ARCHIVE']});assert.equal(opened.navigation!.targetScreen,'S10');assert.equal(canonicalJson(market),before);
 const withOffers=openKboCareerFa(closed(),closed().revision);assert.throws(()=>requestKboRetirement(withOffers,withOffers.revision),/NOT_AVAILABLE/);
 const extra=structuredClone(market),unrelated=requestKboRetirement(source,source.revision).events.at(-1)!;extra.events=[...extra.events,unrelated];assert.throws(()=>requestKboRetirement(extra,extra.revision),/NOT_AVAILABLE/);
 const forged=structuredClone(market);forged.events=forged.events.map(e=>e.eventKey===view.eventKey?{...e,evidence:{...e.evidence,fields:{...e.evidence.fields,sourceReceiptId:'forged'}}}:e);assert.throws(()=>requestKboRetirement(forged,forged.revision),/EVENT|EVIDENCE/);
});

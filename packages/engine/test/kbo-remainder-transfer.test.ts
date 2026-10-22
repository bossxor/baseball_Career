import test from 'node:test';
import assert from 'node:assert/strict';
import {remainderDecisionCareer} from './remainder-fixtures.js';
import {offerKboRemainderRenewal,compareKboRemainderOffers,kboRemainderRenewalView,acceptKboRemainderRenewal} from '../src/kbo-remainder-renewal.js';
import {acceptKboRemainderTransfer} from '../src/kbo-remainder-transfer.js';
import {advanceKboCareer} from '../src/kbo-progress.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {kboRemainderBalance,settleKboRemainderPayrollDay} from '../src/kbo-remainder-pay.js';
import {canonicalJson} from '../src/game.js';
import {kboTeamGames,trainKboCareer} from '../src/kbo-windows.js';
import {kboRelationshipListView,unreadKboRelationNotices,resolveKboRelationNotice} from '../src/kbo-relations.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {kboContractSeasonCharge} from '../src/kbo-service-payroll.js';

function comparison(base=remainderDecisionCareer()){
 const offered=offerKboRemainderRenewal(base,base.revision),v=kboRemainderRenewalView(offered)!;
 return compareKboRemainderOffers(offered,offered.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion}).career;
}
function request(c:ReturnType<typeof comparison>){const v=kboRemainderRenewalView(c)!;return {eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:v.comparison!.offers[0]!.offerKey};}
function accept(c:ReturnType<typeof comparison>){return acceptKboRemainderTransfer(c,c.revision,request(c));}

test('pitcher transfer carries the exact book and XP budget, then actual new-club pitching continues without resetting prior entries',()=>{
 const source=comparison(remainderDecisionCareer('PITCHER')),key=source.protagonistKey,old=structuredClone(source.world.repertoires[key]!);assert.ok(old);let c=accept(source);assert.deepEqual(c.world.repertoires[key],old);assert.deepEqual(c.world.players[key],source.world.players[key]);
 for(let i=0;i<100&&!Object.values(c.records.games).some(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay>c.transferHistory!.at(-1)!.afterWorldDay && g.pitching[key]);i++)c=advanceKboCareer(c,c.revision,1).career;
 const game=Object.values(c.records.games).find(g=>g.scope.seasonKey===c.world.seasonKey && g.worldDay>c.transferHistory!.at(-1)!.afterWorldDay && g.pitching[key]);assert.ok(game);assert.ok(game.pitching[key]!.outs>0);assert.ok(Object.hasOwn(game.teams,c.protagonistClubId));
 const book=c.world.repertoires[key]!;assert.deepEqual(book.ledger.entries.slice(0,old.ledger.entries.length),old.ledger.entries);assert.ok(book.ledger.actualBudgetSpentUnits>old.ledger.actualBudgetSpentUnits);assert.deepEqual(book.usedWindows,old.usedWindows);assertKboRecruitmentWorld(c.world);
});

test('foreign acceptance atomically preserves old pay, records, health, growth and relations; actual next registration pays new club once',()=>{
 const source=comparison(),before=canonicalJson(source),oldClub=source.protagonistClubId,offer=source.remainderRenewal!.comparison!.offers[0]!,old=source.world.contracts[source.protagonistKey]!,c=accept(source),key=c.protagonistKey;
 assert.equal(c.schemaVersion,4);assert.equal(c.protagonistClubId,offer.clubId);assert.equal(c.registration.competitionKey,'FUTURES');assert.equal(c.registration.firstTeam,false);assert.equal(c.rights.holderOrgId,offer.clubId);assert.equal(c.rights.sourceType,'TRANSFER');assert.equal(c.phaseContext.phase,'SEASON_PROGRESS');
 assert.deepEqual(c.world.contracts[key]!.remainderPay!.previous,old);assert.equal(c.world.contracts[key]!.remainderPay!.schemaVersion,2);assert.equal(c.world.clubs.find(x=>x.id===oldClub)!.paidSalaryWon,source.world.clubs.find(x=>x.id===oldClub)!.paidSalaryWon);assert.equal(c.world.clubs.find(x=>x.id===offer.clubId)!.paidSalaryWon,0);
 for(const field of ['records','health','days','development','seasonGrowth','planHistory','styleUsedWindows','military'] as const)assert.deepEqual(c[field],source[field]);
 assert.deepEqual(c.world.players[key],source.world.players[key]);assert.deepEqual(c.world.repertoires[key],source.world.repertoires[key]);assert.deepEqual(c.world.rng,source.world.rng);
 for(const club of source.world.clubs.filter(t=>![oldClub,offer.clubId].includes(t.id))){assert.deepEqual(c.world.clubs.find(t=>t.id===club.id),club);for(const k of club.roster)assert.deepEqual(c.world.contracts[k],source.world.contracts[k]);}
 assert.equal(c.world.clubs.filter(t=>t.roster.includes(key)).length,1);assertKboRecruitmentWorld(c.world);for(const league of ['KBO','FUTURES'] as const)createKboCompetitionGameWorld(c.world,league,key,c.sangmu);
 assert.equal(kboTeamGames(c),source.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey&&h.evidence.roster.includes(key)).length);
 assert.equal(c.relationships.relations.length,source.relationships.relations.length+1);for(const r of source.relationships.relations){const retained=c.relationships.relations.find(x=>x.relationKey===r.relationKey)!;assert.equal(retained.type,r.type);assert.deepEqual(retained.milestones.slice(0,r.milestones.length),r.milestones);}assert.ok(kboRelationshipListView(c).length>0);assert.ok(unreadKboRelationNotices(c).some(n=>n.eventKey===c.relationNotices.at(-1)!.eventKey));
 const notice=c.relationNotices.at(-1)!,read=resolveKboRelationNotice(c,c.revision,{eventKey:notice.eventKey,eventVersion:notice.version,command:'OPEN_RELATIONS'}).career;assert.deepEqual(read.phaseContext,c.phaseContext);assert.deepEqual(read.world,c.world);assert.deepEqual(read.amateurHistory,c.amateurHistory);assert.equal(unreadKboRelationNotices(read).some(n=>n.eventKey===notice.eventKey),false);
 const v=kboRemainderRenewalView(c)!;assert.equal(v.status,'TRANSFERRED');assert.equal(v.annualSalaryWon,offer.annualSalaryWon);assert.equal(v.estimatedGameDays,offer.estimatedGameDays);assert.equal(v.acceptedClubId,offer.clubId);assert.equal(v.canAccept,false);assert.deepEqual(v.comparison!.offers,[]);assert.equal(v.comparison!.originalOfferAvailable,false);assert.doesNotMatch(JSON.stringify(v),/sourceBasis|previous|ledger|seed|potential|rng/i);
 assert.deepEqual(acceptKboRemainderTransfer(source,source.revision,request(source)),c);assert.throws(()=>accept(c));assert.throws(()=>acceptKboRemainderRenewal(c,c.revision,request(source)));assert.equal(canonicalJson(source),before);
 for(const schemaVersion of [1,2,3] as const){const oldReader=structuredClone(c);oldReader.schemaVersion=schemaVersion;assert.throws(()=>advanceKboCareer(oldReader,oldReader.revision,1),/REVISION_CHANGED/);}
 let running=JSON.parse(JSON.stringify(c)) as typeof c;for(let i=0;i<160&&running.world.contracts[key]!.remainderPay!.receipts.length===0;i++)running=advanceKboCareer(running,running.revision,1).career;
 const paid=running.world.contracts[key]!,b=kboRemainderBalance(paid);assert.ok(b.paidGameDays>0);assert.equal(running.world.clubs.find(x=>x.id===offer.clubId)!.paidSalaryWon,b.paidWon);assert.equal(running.world.clubs.find(x=>x.id===oldClub)!.paidSalaryWon,source.world.clubs.find(x=>x.id===oldClub)!.paidSalaryWon);assert.deepEqual(paid.remainderPay!.previous,old);
 for(const [gameKey,g] of Object.entries(source.records.games))assert.deepEqual(running.records.games[gameKey],g);assert.deepEqual(running.health.games.slice(0,source.health.games.length),source.health.games);
 const replay=structuredClone(running),snapshot=canonicalJson(replay);settleKboRemainderPayrollDay(replay,replay.days!.days.at(-1)!.day);assert.equal(canonicalJson(replay),snapshot);assertKboRecruitmentWorld(running.world);
});

test('foreign acceptance rejects stale/forged/funded-capacity changes with the entire source intact',()=>{
 const c=comparison(),input=request(c),before=canonicalJson(c);
 for(const command of [()=>acceptKboRemainderTransfer(c,c.revision-1,input),()=>acceptKboRemainderTransfer(c,c.revision,{...input,eventVersion:input.eventVersion+1}),()=>acceptKboRemainderTransfer(c,c.revision,{...input,offerKey:'forged'}),()=>acceptKboRemainderTransfer(c,c.revision,{...input,eventKey:'forged'})])assert.throws(command);
 for(const change of [(x:typeof c)=>{x.remainderRenewal!.comparison!.offers[0]!.annualSalaryWon+=10_000;},(x:typeof c)=>{x.rights.holderOrgId='OTHER';},(x:typeof c)=>{x.world.clubs.find(t=>t.id===x.remainderRenewal!.comparison!.offers[0]!.clubId)!.reservedSalaryWon++;}]){const bad=structuredClone(c);change(bad);const snapshot=canonicalJson(bad);assert.throws(()=>accept(bad));assert.equal(canonicalJson(bad),snapshot);}
 assert.equal(canonicalJson(c),before);
});

test('recipient injury repair keeps incoming player in Futures and preserves existing injury evidence',()=>{
 const base=remainderDecisionCareer(),probe=comparison(base),destination=probe.remainderRenewal!.comparison!.offers[0]!.clubId,club=base.world.clubs.find(t=>t.id===destination)!,position=base.world.players[base.protagonistKey]!.position,injured=club.firstTeam.find(k=>base.world.players[k]!.position===position)!;assert.ok(injured);
 const row=base.health.games.findLast(r=>r.evidence.teamKey==='KBO:'+destination)!;assert.ok(row);row.result.injured=[...row.result.injured,injured];base.health.injuries[injured]={severity:'MILD',remainingTeamGames:3,seasonKey:base.world.seasonKey,diagnosedGameKey:row.evidence.gameKey};
 const o=comparison(base),v=kboRemainderRenewalView(o)!,offer=v.comparison!.offers.find(x=>x.clubId===destination)!;assert.ok(offer);const before=structuredClone(o.health),c=acceptKboRemainderTransfer(o,o.revision,{eventKey:v.eventKey,eventVersion:v.eventVersion,offerKey:offer.offerKey}),to=c.world.clubs.find(t=>t.id===destination)!;
 assert.equal(to.firstTeam.includes(c.protagonistKey),false);assert.equal(to.firstTeam.includes(injured),false);assert.equal(c.registration.firstTeam,false);assert.equal(c.registration.competitionKey,'FUTURES');assert.deepEqual(c.health,before);assertKboRecruitmentWorld(c.world);
});

test('leaving a first-team required position repairs only the old club vacancy and independent Futures slot',()=>{
 const base=remainderDecisionCareer(),club=base.world.clubs.find(t=>t.id===base.protagonistClubId)!,key=base.protagonistKey,p=base.world.players[key]!;
 const alreadyFirst=club.firstTeam.includes(key),former=(alreadyFirst?club.roster.find(k=>k!==key&&!club.firstTeam.includes(k)&&base.world.players[k]!.position===p.position):club.firstTeam.find(k=>base.world.players[k]!.position===p.position))!;assert.ok(former);if(!alreadyFirst)club.firstTeam=club.firstTeam.map(k=>k===former?key:k);base.registration={...base.registration,firstTeam:true,competitionKey:'KBO'};
 // Controlled depth fixture: only one same-position reserve remains when the first-team player leaves.
 for(const k of [...club.roster])if(k!==key&&k!==former&&base.world.players[k]!.position===p.position){club.roster=club.roster.filter(x=>x!==k);club.reservedSalaryWon-=kboContractSeasonCharge(base.world.contracts[k]!);delete base.world.contracts[k];delete base.world.players[k];delete base.world.repertoires[k];}
 assertKboRecruitmentWorld(base.world);const source=comparison(base),c=accept(source),from=c.world.clubs.find(t=>t.id===club.id)!,signings=c.transferHistory!.at(-1)!.rosterSignings!;
 assert.equal(from.firstTeam.length,28);assert.ok(from.firstTeam.includes(former));const oldClubSignings=signings.filter(x=>x.clubId===club.id);assert.equal(oldClubSignings.length,1);assert.equal(oldClubSignings[0]!.position,p.position);assert.equal(from.firstTeam.includes(oldClubSignings[0]!.playerKey),false);assert.ok(signings.every(x=>[club.id,c.protagonistClubId].includes(x.clubId)));assert.equal(c.protagonistClubId,source.remainderRenewal!.comparison!.offers[0]!.clubId);assertKboRecruitmentWorld(c.world);
});

test('transferred term settles on final regular day, pays no postseason extra and preserves receipts/version into next year',()=>{
 let c=accept(comparison());const originalContract=structuredClone(c.world.contracts[c.protagonistKey]!),end=originalContract.remainderPay!.endWorldDay,last=c.days!.days.at(-1)!.day;
 // Prior middle dates are a controlled clock; final regular date, postseason, growth and activation use actual commands.
 c.days!.days=[...c.days!.days,...Array.from({length:end-last-1},(_,i)=>({day:last+i+1,evidence:'controlled-middle-clock',result:{injured:[],recovered:[]}}))];c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:end,pendingGame:null};
 for(let i=0;i<160&&c.phaseContext.phase==='SEASON_PROGRESS';i++)c=advanceKboCareer(c,c.revision,1).career;assert.equal(c.phaseContext.phase,'SEASON_REVIEW');const paid=structuredClone(c.world.contracts[c.protagonistKey]!);assert.ok(paid.remainderPay!.settlement);assertKboRecruitmentWorld(c.world);
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}assert.deepEqual(c.world.contracts[c.protagonistKey],paid);
 c=settleKboSeasonGrowth(c,c.revision).career;const settled=settleKboSeasonGrowth(c,c.revision);assert.equal(settled.duplicate,true);assert.throws(()=>trainKboCareer(c,c.revision,{type:'SKIP'}),/WINDOW_CLOSED/);
 c=closeKboSeason(c,c.revision,true);const o=offerKboRenewal(c,c.revision),event=o.events.find(e=>e.eventKey===o.renewal!.eventKey)!,renewed=acceptKboRenewal(o,o.revision,{eventKey:event.eventKey,eventVersion:event.version}),next=startNextKboSeason(renewed,renewed.revision);
 assert.equal(next.schemaVersion,4);assert.deepEqual(next.transferHistory,c.transferHistory);assert.equal(next.world.contracts[next.protagonistKey]!.status,'ACTIVE');assert.equal(next.world.contracts[next.protagonistKey]!.remainderPay,undefined);assert.deepEqual(next.contractHistory!.at(-1),paid);assert.equal(next.protagonistClubId,c.protagonistClubId);assertKboRecruitmentWorld(next.world);
});

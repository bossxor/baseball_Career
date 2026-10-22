import {kboRetirementArchiveView} from '../src/kbo-archive-view.js';
import {selectKboDualLeagueRoster} from '../src/kbo-roster-repair.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {kboYearTransitionReadiness,stageKboAgeAndContracts,startNextKboSeason} from '../src/kbo-year-transition.js';
import {advanceKboCareer} from '../src/kbo-progress.js';
import {kboForcedRetirementReview} from '../src/kbo-retirement-review.js';
import {requestKboRetirement,resolveKboRetirement,retireKboAtMaxAge} from '../src/kbo-retirement.js';
import {offerKboRenewal,acceptKboRenewal,kboRenewalValueWon} from '../src/kbo-renewal.js';

/** Controlled season-review state: closed day receipts for the whole regular range (no regular games played). */
function review():KboCareer {
 const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),c=structuredClone(startKboRegularSeason(s,s.revision));
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'test',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_REVIEW'};return c;
}

test('the postseason plays real games day by day to one champion and returns to SEASON_REVIEW',()=>{
 const r=review(),started=startKboPostseason(r,r.revision),before=canonicalJson(r);
 assert.equal(started.phaseContext.phase,'POSTSEASON_PROGRESS');assert.throws(()=>startKboPostseason(started,started.revision));
 let c=started,games=0,stop='';
 for(let i=0;i<400;i++){const out=advanceKboPostseason(JSON.parse(JSON.stringify(c)) as KboCareer,c.revision);c=out.career;stop=out.stopReason;if(stop==='GAME_FINAL' || stop==='HEALTH_CHANGE' || stop==='POSTSEASON_COMPLETE')games++;if(stop==='POSTSEASON_COMPLETE')break;assert.notEqual(stop,'ENGINE_LIMIT');}
 assert.equal(stop,'POSTSEASON_COMPLETE');assert.equal(c.phaseContext.phase,'SEASON_REVIEW');
 const ps=c.postseason!;assert.ok(ps.championKey && ps.seeds.includes(ps.championKey));
 const recorded=Object.values(c.records.games).filter(g=>g.scope.phase==='POSTSEASON' && g.scope.leagueKey==='KBO' && g.scope.seasonKey===c.world.seasonKey);
 assert.equal(recorded.length,ps.series.reduce((n,s)=>n+s.games.length,0));assert.equal(recorded.length,games);
 assert.ok(games>=10 && games<=17);
 const days=c.days!.days;days.forEach((d,i)=>{if(i>0)assert.equal(d.day,days[i-1]!.day+1);});
 assert.throws(()=>startKboPostseason(c,c.revision));assert.equal(canonicalJson(r),before);
 // Regular-season growth still reads only the regular range after postseason days were appended.
 assert.doesNotThrow(()=>settleKboSeasonGrowth(c,c.revision));
});

test('postseason home runs feed career trait evidence after each postseason day',()=>{
 const r=review(),key=r.protagonistKey;let c=startKboPostseason(r,r.revision);
 // Controlled official PS line for my player this season (5 HR): the first postseason day close must unlock T06 once.
 const seeded=structuredClone(c);seeded.records.games['old-ps']={gameKey:'old-ps',worldDay:r.days!.days.at(-1)!.day,scope:{seasonKey:r.world.seasonKey,leagueKey:'KBO',phase:'POSTSEASON'},teams:{a:{games:1,W:1,L:0,T:0,R:5,RA:0},b:{games:1,W:0,L:1,T:0,R:0,RA:5}},
  batting:{[key]:{PA:5,AB:5,BB:0,HBP:0,K:0,H:5,TB:20,HR:5,R:5,RBI:5,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},
  batterSplits:{[key]:{L:{PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},R:{PA:5,AB:5,H:5,BB:0,HBP:0,K:0,TB:20,HR:5,twoB:0,threeB:0,RBI:5}}},pitcherSplits:{},matchups:{}};
 c=seeded;
 for(let i=0;i<60;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason!=='CHUNK_LIMIT')break;}
 assert.ok(c.traits!.owned[key]!.unlocked.includes('T06'));
 assert.equal(c.traits!.unlocks.filter(u=>u.traitId==='T06').length,1);
});


/** Review → postseason to a champion → regular growth paid → season closed (unused training forfeited). */
function closed():KboCareer {
 let c=startKboPostseason(review(),review().revision);
 for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;return closeKboSeason(c,c.revision,true);
}
function renewed(c:KboCareer):KboCareer {const o=offerKboRenewal(c,c.revision),e=o.events.find(x=>x.eventKey===o.renewal!.eventKey)!;return acceptKboRenewal(o,o.revision,{eventKey:e.eventKey,eventVersion:e.version});}

test('year transition readiness lists every Y01 blocker until postseason, growth, season close and my contract are done',()=>{
 const r=review(),first=kboYearTransitionReadiness(r);
 assert.equal(first.ready,false);assert.deepEqual(first.blockers.sort(),['CONTRACT_DECISION_REQUIRED','GROWTH_NOT_FINALIZED','POSTSEASON_NOT_COMPLETE','SEASON_NOT_CLOSED']);
 assert.equal(first.targetSeasonKey,String(Number(r.world.seasonKey)+1));
 let c=startKboPostseason(r,r.revision);assert.ok(kboYearTransitionReadiness(c).blockers.includes('SEASON_NOT_IN_REVIEW'));
 for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;const before=JSON.stringify(c);
 assert.deepEqual(kboYearTransitionReadiness(c).blockers.sort(),['CONTRACT_DECISION_REQUIRED','GROWTH_NOT_FINALIZED','SEASON_NOT_CLOSED']);assert.equal(JSON.stringify(c),before);
 c=closeKboSeason(c,c.revision,true);assert.deepEqual(kboYearTransitionReadiness(c).blockers,['CONTRACT_DECISION_REQUIRED']);
 const offered=offerKboRenewal(c,c.revision);assert.deepEqual(kboYearTransitionReadiness(offered).blockers.sort(),['CONTRACT_DECISION_REQUIRED','OPEN_EVENT']);
 c=renewed(c);
 assert.deepEqual(kboYearTransitionReadiness(c),{ready:true,blockers:[],targetSeasonKey:String(Number(c.world.seasonKey)+1),nextAge:c.world.players[c.protagonistKey]!.age+1});
 const old=structuredClone(c);old.world.players[old.protagonistKey]={...old.world.players[old.protagonistKey]!,age:45};
 assert.deepEqual(kboYearTransitionReadiness(old).blockers,['MAX_AGE_REACHED']);
});

test('E30 renewal offer follows 08 once and closes only through the accepted domain commit',()=>{
 const c=closed(),key=c.protagonistKey,prev=c.world.contracts[key]!.annualSalaryWon;
 const o=offerKboRenewal(c,c.revision),r=o.renewal!,{valueWon}=kboRenewalValueWon(c);
 // No regular games in this controlled season: neutral OPS .600 / ERA 5 below sample.
 assert.equal(r.basis.PA,0);assert.equal(r.basis.OPS,.6);assert.equal(r.valueWon,valueWon);
 assert.equal(r.annualSalaryWon,Math.min(3_000_000_000,Math.max(30_000_000,Math.round((.5*prev+.5*valueWon)/10_000)*10_000)));
 assert.equal(r.seasonKey,String(Number(c.world.seasonKey)+1));assert.equal(r.years,1);
 const e=o.events.find(x=>x.eventKey===r.eventKey)!;assert.equal(e.definitionId,'E30');assert.equal(e.status,'OPEN');
 assert.throws(()=>offerKboRenewal(o,o.revision),/KBO_RENEWAL_NOT_AVAILABLE/);
 const a=acceptKboRenewal(o,o.revision,{eventKey:e.eventKey,eventVersion:e.version});
 assert.equal(a.renewal!.status,'ACCEPTED');assert.equal(a.events.find(x=>x.eventKey===e.eventKey)!.status,'RESOLVED');
 assert.equal(a.world.contracts[key]!.annualSalaryWon,prev);
 assert.throws(()=>acceptKboRenewal(a,a.revision,{eventKey:e.eventKey,eventVersion:e.version}),/INVALID_KBO_RENEWAL/);
});

test('Y02 stages age+1 and contract years for every pro player without changing the source',()=>{
 let c=closed();assert.throws(()=>stageKboAgeAndContracts(c),/YEAR_TRANSITION_NOT_READY/);
 c=renewed(c);
 const npc=Object.keys(c.world.players).find(k=>k!==c.protagonistKey)!;c.world.players[npc]={...c.world.players[npc]!,age:45};
 const before=JSON.stringify(c),stage=stageKboAgeAndContracts(c),target=Number(c.world.seasonKey)+1;
 assert.equal(JSON.stringify(c),before);assert.deepEqual(stageKboAgeAndContracts(c),stage);
 assert.equal(Object.keys(stage.players).length,Object.keys(c.world.players).length);
 for(const [key,p] of Object.entries(c.world.players)){
  const s=stage.players[key]!;assert.equal(s.age,p.age+1);if(key===c.protagonistKey)continue;
  const k=c.world.contracts[key]!;assert.equal(s.contract!.contractYear,target-Number(k.seasonKey)+1);assert.equal(s.contract!.expired,s.contract!.contractYear>k.years);
 }
 assert.deepEqual(stage.players[c.protagonistKey]!.contract,{contractKey:c.renewal!.offerKey,contractYear:1,years:1,expired:false});
 assert.deepEqual(stage.overAge,[npc]);
 assert.deepEqual(stage.expiring,Object.keys(stage.players).filter(k=>stage.players[k]!.contract!.expired));
 assert.ok(stage.expiring.length>0 && !stage.expiring.includes(c.protagonistKey));
});

test('next season activates every player at once and the second pro season opens and plays',()=>{
 let c=closed();assert.throws(()=>startNextKboSeason(c,c.revision),/YEAR_TRANSITION_NOT_READY/);
 c=renewed(c);const before=JSON.stringify(c),stage=stageKboAgeAndContracts(c),key=c.protagonistKey,season=c.world.seasonKey,target=String(Number(season)+1);
 const n=startNextKboSeason(c,c.revision);assert.equal(JSON.stringify(c),before);
 assert.ok(Object.keys(n.freeAgents!.players).length>=80);assert.ok(Object.keys(n.freeAgents!.players).every(k=>!Object.hasOwn(n.world.players,k) && !Object.hasOwn(n.world.contracts,k)));
 assert.equal(n.world.seasonKey,target);assert.equal(n.world.calendar.year,Number(target));assert.equal(n.phaseContext.phase,'PRESEASON_SETUP');assert.equal(n.revision,c.revision+1);
 for(const [k,s] of Object.entries(stage.players)){const p=n.world.players[k]??n.freeAgents!.players[k]?.player;assert.ok(p);assert.equal(p.age,s.age);if(n.world.contracts[k])assert.equal(n.world.contracts[k]!.seasonKey,target);}
 assert.equal(n.world.contracts[key]!.annualSalaryWon,c.renewal!.annualSalaryWon);assert.equal(n.world.contracts[key]!.contractKey,c.renewal!.offerKey);
 for(const [k,p] of Object.entries(c.world.players))assert.deepEqual((n.world.players[k]??n.freeAgents!.players[k]?.player)!.abilities,p.abilities);
 assert.equal(n.aiOffseasons!.length,1);assert.equal(n.aiOffseasons![0]!.rounds.length,3);assert.deepEqual(startNextKboSeason(JSON.parse(before),c.revision),n);
 assert.equal(n.proSeasons!.length,1);assert.equal(n.proSeasons![0]!.postseason.championKey,c.postseason!.championKey);
 assert.ok(!n.days && !n.seasonClose && !n.postseason && !n.competitionSchedule && !n.openingRoster);
 assert.equal(n.seasonGrowth.seasonKey,target);assert.equal(n.seasonGrowth.finalized,false);
 assert.throws(()=>startNextKboSeason(n,n.revision));
 // Second season: same preseason → opening roster → schedule → regular season commands as the first.
 const p=confirmKboPreseasonPlan(n,n.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);
 let g=startKboRegularSeason(s,s.revision);assert.equal(g.phaseContext.phase,'SEASON_PROGRESS');
 for(let i=0;i<40 && !Object.values(g.records.games).some(x=>x.scope.seasonKey===target);i++)g=advanceKboCareer(g,g.revision,1).career;
 assert.ok(Object.values(g.records.games).some(x=>x.scope.seasonKey===target && x.scope.phase==='REGULAR'));
 assert.equal((g.campNotices??[]).filter(e=>e.seasonKey===target).length,0);
 assert.equal(offerKboRenewal(closed(),closed().revision).renewal!.seasonKey,target);
});

test('season close grows and ages every pro NPC once from the natural PRO period',()=>{
 let c=startKboPostseason(review(),review().revision);
 for(let i=0;i<400;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;const after=closeKboSeason(c,c.revision,true),npc=after.seasonClose!.npcGrowth!;
 const keys=Object.keys(c.world.players).filter(k=>k!==c.protagonistKey);
 assert.equal(Object.keys(npc).length,keys.length);assert.ok(!Object.hasOwn(npc,c.protagonistKey));
 const sum=(p:{abilities:Record<string,number>})=>Object.values(p.abilities).reduce((a,b)=>a+b,0);
 for(const k of keys)assert.equal(sum(after.world.players[k]!),sum(c.world.players[k]!)+npc[k]!.gainedUnits-npc[k]!.agingLossUnits);
 const old=keys.filter(k=>c.world.players[k]!.age>=34);assert.ok(old.length>0 && old.some(k=>npc[k]!.agingLossUnits>0));
 assert.ok(keys.filter(k=>c.world.players[k]!.age<=24).some(k=>npc[k]!.gainedUnits>0));
 assert.throws(()=>closeKboSeason(after,after.revision,true));
});

test('NPCs who played at45 retire before AI renewal, supply and complete two-league reselection',()=>{
 const c=renewed(closed()),other=c.world.clubs.find(x=>x.id!==c.protagonistClubId)!,starter=other.firstTeam.find(k=>c.world.players[k]!.kind==='HITTER')!;
 c.world.players[starter]={...c.world.players[starter]!,age:45};const oldRecords=structuredClone(c.records);
 const n=startNextKboSeason(c,c.revision),club=n.world.clubs.find(x=>x.id===other.id)!;
 assert.deepEqual(n.retiredPlayers!.map(r=>[r.playerKey,r.clubId,r.reason,r.lastSeasonKey]),[[starter,other.id,'MAX_AGE',c.world.seasonKey]]);
 assert.ok(!Object.hasOwn(n.world.players,starter) && !Object.hasOwn(n.world.contracts,starter) && !club.roster.includes(starter));
 assert.equal(club.firstTeam.length,28);assert.ok(club.roster.length>=38 && club.roster.length<=60);
 assert.ok(n.world.clubs.every(x=>x.firstTeam.length===28));assert.deepEqual(n.records,oldRecords);assert.equal(n.aiOffseasons![0]!.seasonKey,n.world.seasonKey);
});

test('my retirement: E36 cancel returns, confirm closes E30 and archives; age 45 ends the career without a renewal',()=>{
 const c=closed();assert.throws(()=>retireKboAtMaxAge(c,c.revision),/KBO_RETIREMENT_NOT_AVAILABLE/);
 const o=offerKboRenewal(c,c.revision),asked=requestKboRetirement(o,o.revision),phase=asked.phaseContext as {phase:string;eventKey:string};
 assert.equal(phase.phase,'RETIRE_CONFIRM');const e36=asked.events.find(e=>e.eventKey===phase.eventKey)!;assert.equal(e36.definitionId,'E36');
 const back=resolveKboRetirement(asked,asked.revision,{eventKey:e36.eventKey,eventVersion:e36.version,command:'CANCEL_RETIRE'});
 assert.equal(back.phaseContext.phase,'SEASON_REVIEW');assert.equal(back.events.find(e=>e.definitionId==='E30')!.status,'OPEN');
 const done=resolveKboRetirement(asked,asked.revision,{eventKey:e36.eventKey,eventVersion:e36.version,command:'CONFIRM_RETIRE'});
 assert.equal(done.phaseContext.phase,'ARCHIVED');const archiveBefore=canonicalJson(done),archive=kboRetirementArchiveView(done);assert.equal(archive.archiveKey,done.retirement!.receiptKey);assert.equal(archive.player.name,done.world.players[done.protagonistKey]!.name);assert.equal(canonicalJson(done),archiveBefore);assert.equal(done.retirement!.reason,'VOLUNTARY');assert.equal(done.retirement!.age,c.world.players[c.protagonistKey]!.age);
 assert.ok(done.events.filter(e=>e.definitionId!=='E37').every(e=>e.status!=='OPEN'));assert.equal(done.events.at(-1)!.definitionId,'E37');
 assert.throws(()=>startNextKboSeason(done,done.revision));
 const old=structuredClone(c);old.world.players[old.protagonistKey]={...old.world.players[old.protagonistKey]!,age:45};
 assert.throws(()=>offerKboRenewal(old,old.revision),/KBO_RENEWAL_NOT_AVAILABLE/);
 const end=retireKboAtMaxAge(old,old.revision);assert.equal(end.phaseContext.phase,'ARCHIVED');assert.equal(end.retirement!.reason,'MAX_AGE');assert.equal(end.retirement!.age,45);
});

test('forced retirement review needs age 35 and two closed seasons under the first-team threshold',()=>{
 const c=closed(),key=c.protagonistKey,season=c.world.seasonKey,prev=String(Number(season)-1);
 assert.equal(kboForcedRetirementReview(c).required,false);
 const vet=structuredClone(c);vet.world.players[key]={...vet.world.players[key]!,age:35};
 assert.deepEqual(kboForcedRetirementReview(vet),{required:false,age:35,seasons:[{seasonKey:season,amount:0}]});
 vet.proSeasons=[{seasonKey:prev} as never];
 assert.equal(kboForcedRetirementReview(vet).required,true);
 // 50 first-team PA in the earlier season clears the review.
 vet.records.games['prev-kbo']={gameKey:'prev-kbo',worldDay:1,scope:{seasonKey:prev,leagueKey:'KBO',phase:'REGULAR'},teams:{a:{games:1,W:1,L:0,T:0,R:0,RA:0},b:{games:1,W:0,L:1,T:0,R:0,RA:0}},
  batting:{[key]:{PA:50,AB:50,BB:0,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},
  batterSplits:{[key]:{L:{PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},R:{PA:50,AB:50,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0}}},pitcherSplits:{},matchups:{}};
 assert.equal(kboForcedRetirementReview(vet).required,c.world.players[key]!.kind==='PITCHER');
});

test('year transition drafts a 100-player rookie class in reverse standings order, with room and budget respected',()=>{
 const c=renewed(closed()),n=startNextKboSeason(c,c.revision),target=n.world.seasonKey,d=n.rookieDrafts!;
 assert.equal(d.length,1);assert.equal(d[0]!.seasonKey,target);assert.equal(d[0]!.classKeys.length,100);
 const picks=d[0]!.picks;assert.ok(picks.length>0 && picks.length<=100);assert.equal(new Set(picks.map(p=>p.playerKey)).size,picks.length);
 // Round 1 follows one fixed club order that every round repeats (skips only for full clubs).
 const order=picks.filter(p=>p.round===1).map(p=>p.clubId);assert.equal(order.length,n.world.clubs.length);
 for(let r=2;r<=10;r++)assert.deepEqual(picks.filter(p=>p.round===r).map(p=>p.clubId),order.filter(id=>picks.some(p=>p.round===r&&p.clubId===id)));
 for(const club of n.world.clubs){assert.ok(club.roster.length<=60);const mine=picks.filter(p=>p.clubId===club.id);assert.ok(mine.every(p=>club.roster.includes(p.playerKey)));}
 for(const p of picks){const k=n.world.contracts[p.playerKey]!;assert.equal(k.years,1);assert.equal(k.annualSalaryWon,30_000_000);assert.equal(k.seasonKey,target);assert.equal(n.world.players[p.playerKey]!.age,18);}
 const again=startNextKboSeason(c,c.revision);assert.deepEqual(again.rookieDrafts,n.rookieDrafts);assert.deepEqual(again.world.clubs,n.world.clubs);
});


test('mass NPC retirement repairs both leagues before atomic activation, without deleting debt, records or the old generation',()=>{
 const c=renewed(closed()),club=c.world.clubs.find(x=>x.id!==c.protagonistClubId)!,keys=[...club.roster];
 for(const k of keys)c.world.players[k]!.age=45;
 const before=canonicalJson(c),n=startNextKboSeason(c,c.revision),receipt=n.aiOffseasons![0]!;
 assert.equal(canonicalJson(c),before);assert.equal(n.retiredPlayers!.filter(r=>r.clubId===club.id).length,keys.length);
 const safety=receipt.repair.signings.filter(r=>r.clubId===club.id);assert.ok(safety.length>0 && safety.length<=38);assert.equal(receipt.repair.releases.length,0);
 for(const signing of safety){const healthy=n.world.clubs.find(x=>x.id===club.id)!.roster.filter(k=>k!==signing.playerKey && !n.health.injuries[k]).map(k=>n.world.players[k]!);assert.throws(()=>selectKboDualLeagueRoster(healthy),/SUPPLY/);}
 assert.deepEqual(n.records,c.records);assert.ok(n.world.finance!.guarantees.some(g=>g.clubId===club.id));
 const target=n.world.clubs.find(x=>x.id===club.id)!;assert.equal(target.firstTeam.length,28);assert.ok(target.roster.length<=60);assert.ok(target.roster.every(k=>!keys.includes(k)));
 for(const k of keys){assert.equal(n.world.players[k],undefined);assert.equal(n.world.contracts[k],undefined);assert.equal(n.health.injuries[k],undefined);}
 assert.deepEqual(startNextKboSeason(JSON.parse(before),c.revision),n);
});


test('legacy multi-year contracts carry only actual remaining years, including my unexpired contract without a new renewal',()=>{
 const c=closed(),key=c.protagonistKey,season=Number(c.world.seasonKey),npc=Object.keys(c.world.players).find(k=>k!==key)!;
 c.world.contracts[key]={...c.world.contracts[key]!,seasonKey:String(season-1),years:4};
 c.world.contracts[npc]={...c.world.contracts[npc]!,seasonKey:String(season-2),years:4};
 assert.equal(kboYearTransitionReadiness(c).ready,true);const before=canonicalJson(c),n=startNextKboSeason(c,c.revision);
 assert.equal(n.world.contracts[key]!.years,2);assert.equal(n.world.contracts[npc]!.years,1);assert.equal(n.world.contracts[key]!.contractKey,c.world.contracts[key]!.contractKey);assert.equal(n.world.contracts[npc]!.contractKey,c.world.contracts[npc]!.contractKey);assert.equal(n.renewal,undefined);assert.equal(canonicalJson(c),before);
 assert.doesNotThrow(()=>confirmKboPreseasonPlan(n,n.revision));
 const asked=requestKboRetirement(c,c.revision),event=asked.events.at(-1)!,retired=resolveKboRetirement(asked,asked.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'CONFIRM_RETIRE'});assert.equal(retired.retirement!.remainingContractYears,2);assert.equal(kboRetirementArchiveView(retired).retirement.age,c.world.players[key]!.age);
});

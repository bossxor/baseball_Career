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
 assert.equal(n.world.seasonKey,target);assert.equal(n.world.calendar.year,Number(target));assert.equal(n.phaseContext.phase,'PRESEASON_SETUP');assert.equal(n.revision,c.revision+1);
 for(const [k,s] of Object.entries(stage.players)){assert.equal(n.world.players[k]!.age,s.age);assert.equal(n.world.contracts[k]!.seasonKey,target);}
 assert.equal(n.world.contracts[key]!.annualSalaryWon,c.renewal!.annualSalaryWon);assert.equal(n.world.contracts[key]!.contractKey,c.renewal!.offerKey);
 for(const [k,p] of Object.entries(c.world.players))assert.deepEqual(n.world.players[k]!.abilities,p.abilities);
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

test('NPCs who played at 45 retire at activation and only their first team is reselected',()=>{
 const c=renewed(closed()),other=c.world.clubs.find(x=>x.id!==c.protagonistClubId)!,starter=other.firstTeam.find(k=>c.world.players[k]!.kind==='HITTER')!;
 c.world.players[starter]={...c.world.players[starter]!,age:45};const untouched=c.world.clubs.filter(x=>x.id!==other.id).map(x=>[...x.firstTeam]);
 const n=startNextKboSeason(c,c.revision),club=n.world.clubs.find(x=>x.id===other.id)!;
 assert.deepEqual(n.retiredPlayers!.map(r=>[r.playerKey,r.clubId,r.reason,r.lastSeasonKey]),[[starter,other.id,'MAX_AGE',c.world.seasonKey]]);
 assert.ok(!Object.hasOwn(n.world.players,starter) && !Object.hasOwn(n.world.contracts,starter) && !club.roster.includes(starter));
 assert.equal(club.firstTeam.length,28);assert.equal(club.roster.length,other.roster.length-1);
 assert.deepEqual(n.world.clubs.filter(x=>x.id!==other.id).map(x=>[...x.firstTeam]),untouched);
});

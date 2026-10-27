import test from 'node:test';
import assert from 'node:assert/strict';
import {createSeasonCalendar} from '../src/season-calendar.js';
import type {KboSeasonArchive} from '../src/kbo-year-transition.js';
import type {KboSeasonClose} from '../src/kbo-year-end.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {emptyRecordLedger} from '../src/records.js';
import {createHealthLedger} from '../src/health.js';
import {createWorldStream} from '../src/rng.js';
import {UNITS_PER_POINT} from '@playball/rules';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {requestKboPosting,resolveKboPostingClub,openKboPostingOffers,acceptKboPostingOffer} from '../src/kbo-posting.js';
import {activateKboUsCareer} from '../src/kbo-us-activation.js';
import {usCareerView} from '../src/us-career-entry.js';
import {confirmUsPreseasonPlan,unreadUsFirstCampNotices,resolveUsFirstCampNotice} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {startUsRegularSeason,advanceUsCareer} from '../src/us-season.js';
import {usYearTransitionReadiness} from '../src/us-year-transition.js';
import {enteredKboCareer} from './fixtures.js';

type Fixture=Pick<KboCareer,'world'|'protagonistKey'> & {proSeasons:KboSeasonArchive[];seasonClose?:KboSeasonClose;records:ReturnType<typeof emptyRecordLedger>;health:ReturnType<typeof createHealthLedger>};
function season(s:Fixture,year:string,count:number){
 const club=s.world.contracts[s.protagonistKey]!.clubId,opponent=s.world.clubs.find(c=>c.id!==club)!.id;
 for(let day=1;day<=count;day++){
  const key=JSON.stringify(['act-service',year,day]);
  s.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:year,leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[opponent]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  s.health.games=[...s.health.games,{evidence:{gameKey:key,teamKey:'KBO:'+club,seasonKey:year,day,roster:[s.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
 }
 if(year===s.world.seasonKey)s.seasonClose={seasonKey:year} as KboSeasonClose;else s.proSeasons.push({seasonKey:year} as KboSeasonArchive);
}
function postedCareer():KboCareer {
 const base=enteredKboCareer(),hs=base.amateurHistory;base.world.seasonKey='2042';base.world.calendar=createSeasonCalendar(2042,'calendar-2');
 const key=base.protagonistKey,player=base.world.players[key]!,units=80*UNITS_PER_POINT;
 player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,units]));player.careerPeaks={...player.abilities};player.potential=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,Math.max(player.potential[k]!,units)]));
 const contract=base.world.contracts[key]!;contract.years=2;contract.seasonKey='2042';contract.status='ACTIVE';contract.clubId=base.protagonistClubId;
 const club=base.world.clubs.find(c=>c.id===base.protagonistClubId)!;if(!club.roster.includes(key))club.roster.push(key);if(!club.firstTeam.includes(key))club.firstTeam=[key,...club.firstTeam].slice(0,28);
 const records=emptyRecordLedger(),health=createHealthLedger(createWorldStream('act','health','roster')),proSeasons:KboSeasonArchive[]=[],fixture:Fixture={...base,records,health,proSeasons,seasonClose:{seasonKey:'2042'} as KboSeasonClose};
 for(let i=0;i<7;i++)season(fixture,String(2035+i),100);
 const split={PA:100,AB:90,H:40,BB:10,HBP:0,K:10,TB:70,HR:5,twoB:5,threeB:0,RBI:20},pitch={BF:120,outs:90,AB:90,H:20,HR:2,BB:10,HBP:0,K:40,TB:30},batKey=JSON.stringify(['act-bat',fixture.world.seasonKey]);
 fixture.records.games[batKey]={gameKey:batKey,worldDay:1,scope:{seasonKey:fixture.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club.id]:{games:1,W:1,L:0,T:0,R:1,RA:0},[base.world.clubs.find(c=>c.id!==club.id)!.id]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:player.kind==='HITTER'?{[key]:{PA:split.PA,AB:split.AB,H:split.H,TB:split.TB,HR:split.HR,R:20,RBI:split.RBI,BB:split.BB,HBP:0,K:split.K,twoB:split.twoB,threeB:split.threeB,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{ },pitching:player.kind==='PITCHER'?{[key]:{BF:pitch.BF,outs:pitch.outs,H:pitch.H,HR:pitch.HR,BB:pitch.BB,HBP:0,K:pitch.K,R:10,ER:8,pitches:400,games:1,starts:1,starterOuts:pitch.outs,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}}:{},batterSplits:player.kind==='HITTER'?{[key]:{L:{...split,PA:0,AB:0,H:0,BB:0,K:0,TB:0,HR:0,RBI:0},R:split}}:{},pitcherSplits:player.kind==='PITCHER'?{[key]:{L:{...pitch,BF:0,outs:0,AB:0,K:0},R:pitch}}:{},matchups:{}};
 let c={...fixture,schemaVersion:6,revision:1,difficulty:'GROWTH',protagonistClubId:club.id,phaseContext:{phase:'SEASON_REVIEW'},activation:{receiptKey:'act',sourceYearEndReceiptKey:'y',sourceRevision:0,contractKey:contract.contractKey},registration:{playerKey:key,clubId:club.id,seasonKey:'2042',status:'ACTIVE',firstTeam:true},rights:{sourceType:'DRAFT',holderOrgId:club.id,territory:'KR'},amateurHistory:hs,seasonGrowth:{seasonKey:'2042',days:0,finalized:true},development:{...structuredClone(hs.development!),seasonStartPlayer:structuredClone(player)},relationships:hs.relationships??{},events:[],relationNotices:[],styleUsedWindows:[],planHistory:[],military:{status:'COMPLETED',applications:[]}} as unknown as KboCareer;
 c=requestKboPosting(c,c.revision);c=resolveKboPostingClub(c,c.revision);c=openKboPostingOffers(c,c.revision,1);return acceptKboPostingOffer(c,c.revision,c.posting!.windows[0]!.offers![0]!.offerKey,1);
}

test('sealed posting activates a US root once, funds one salary, and keeps return rights without a signing bonus',()=>{
 const source=postedCareer(),offer=source.posting!.windows[0]!.offers!.find(o=>o.offerKey===source.posting!.windows[0]!.signedOfferKey)!,raw=canonicalJson(source);
 const roster=createUsRosterWorld({worldKey:source.world.worldKey,seasonKey:'2043',seed:source.world.seed,difficulty:source.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')}))});
 const inventory=initialUsRecruitmentInventory(roster,roster.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:40_000_000,nationalReleaseAllowed:true,militaryReturnOption:true})));
 assert.throws(()=>activateKboUsCareer(source,source.revision-1,roster,inventory),/REVISION/);
 const us=activateKboUsCareer(source,source.revision,roster,inventory);assert.equal(canonicalJson(source),raw);
 assert.equal(us.military.status,source.military!.status,'resolved military status must survive overseas activation');
 const ready=usYearTransitionReadiness(us);assert.equal(ready.controlSeasonsUsed,1);assert.ok(!ready.blockers.includes('MILITARY_PLAN_REQUIRED'));
 assert.equal(us.activation.populationBasis,'KBO_TRANSFER');assert.equal(us.protagonistOrganizationId,offer.organizationId);assert.equal(us.contract.annualSalaryUsd,offer.annualSalaryUsd);assert.equal(us.contract.years,offer.years);assert.equal(us.income.length,0);
 assert.equal(us.inventory.clubs.find(c=>c.id===offer.organizationId)!.availableBudgetUsd,40_000_000-offer.annualSalaryUsd);assert.deepEqual(us.kboTransfer!.returnRights,source.posting!.windows[0]!.returnRights);assert.deepEqual(usCareerView(us).contract.annualSalaryUsd,offer.annualSalaryUsd);
 assert.throws(()=>activateKboUsCareer(source,source.revision,us.world,us.inventory),/ALREADY_REGISTERED/);
 let live=confirmUsPreseasonPlan(us,us.revision);for(const e of unreadUsFirstCampNotices(live))live=resolveUsFirstCampNotice(live,live.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACK_EVENT'});live=publishUsSeasonSchedule(live,live.revision);live=startUsRegularSeason(live,live.revision);
 for(let i=0;i<200&&!live.season!.days.length;i++){const out=advanceUsCareer(live,live.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');assert.notEqual(out.stopReason,'ROSTER_DECISION_REQUIRED');live=out.career;}
 assert.equal(live.season!.days.length,1);assert.equal(Object.values(live.records.games).filter(g=>g.scope.seasonKey===live.world.seasonKey).length,75);assert.equal(live.military.status,'COMPLETED');assert.equal(live.income.filter(e=>e.kind==='SIGNING_BONUS').length,0);assert.equal(canonicalJson(source),raw);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(live))),usCareerView(live));
 console.log('M2-EG actual US opening (prior KBO service rows controlled):',JSON.stringify({source:'KBO_TRANSFER',military:live.military.status,year:live.world.seasonKey,games:75,paidUsd:live.season!.paidUsd}));
});

test('KBO overseas activation keeps nonapplicable service and refuses unresolved status without touching source or budgets',()=>{
 const source=postedCareer();source.military!.status='NOT_APPLICABLE';
 const roster=createUsRosterWorld({worldKey:source.world.worldKey,seasonKey:'2043',seed:source.world.seed,difficulty:source.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')}))});
 const inventory=initialUsRecruitmentInventory(roster,roster.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:40000000,nationalReleaseAllowed:true,militaryReturnOption:true}))),raw=canonicalJson({source,roster,inventory});
 const next=activateKboUsCareer(source,source.revision,roster,inventory);assert.equal(next.military.status,'NOT_APPLICABLE');assert.equal(usYearTransitionReadiness(next).controlSeasonsUsed,1);assert.equal(canonicalJson({source,roster,inventory}),raw);
 for(const drift of [{worldKey:'foreign-world'},{seed:'foreign-seed'},{seasonKey:'2042'}]){const wrong={...roster,...drift};assert.throws(()=>activateKboUsCareer(source,source.revision,wrong,inventory),/KBO_US_WORLD_MISMATCH/);assert.equal(canonicalJson({source,roster,inventory}),raw);}
 const bad=structuredClone(source);bad.military!.status='UNRESOLVED';const before=canonicalJson(bad);assert.throws(()=>activateKboUsCareer(bad,bad.revision,roster,inventory),/KBO_US_MILITARY_BLOCKED/);assert.equal(canonicalJson(bad),before);assert.equal(canonicalJson({source,roster,inventory}),raw);
});

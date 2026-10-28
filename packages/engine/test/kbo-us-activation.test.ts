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
import type {UsCareer} from '../src/us-career-entry.js';
import {finishControlledMajorSeason} from './us-major-fixture.js';
import {startNextUsMajorSeason} from '../src/us-major-renewal.js';
import {startNextUsMinorSeason} from '../src/us-year-transition.js';
import {reviewUsLevel,resolveUsLevelEvent} from '../src/us-levels.js';
import {usSalaryEntitlement} from '../src/us-season.js';
import {emptyBatting} from '../src/stats.js';
import {openUsMinorMarket,usMinorMarketView,resolveUsMinorMarketEvent,acceptUsMinorMarketOffer} from '../src/us-minor-market.js';
import {createSeasonGrowthLedger} from '../src/growth-ledger.js';
import {createWorldEvent,completeBlockingEvent} from '../src/events.js';

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
function postedCareer(ability=80,age?:number,sign=true):KboCareer {
 const base=enteredKboCareer(),hs=base.amateurHistory;base.world.seasonKey='2042';base.world.calendar=createSeasonCalendar(2042,'calendar-2');
 const key=base.protagonistKey,player=base.world.players[key]!,units=ability*UNITS_PER_POINT;if(age!==undefined)player.age=age;
 player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,units]));player.careerPeaks={...player.abilities};player.potential=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,Math.max(player.potential[k]!,units)]));
 const contract=base.world.contracts[key]!;contract.years=2;contract.seasonKey='2042';contract.status='ACTIVE';contract.clubId=base.protagonistClubId;
 const club=base.world.clubs.find(c=>c.id===base.protagonistClubId)!;if(!club.roster.includes(key))club.roster.push(key);if(!club.firstTeam.includes(key))club.firstTeam=[key,...club.firstTeam].slice(0,28);
 const records=emptyRecordLedger(),health=createHealthLedger(createWorldStream('act','health','roster')),proSeasons:KboSeasonArchive[]=[],fixture:Fixture={...base,records,health,proSeasons,seasonClose:{seasonKey:'2042'} as KboSeasonClose};
 for(let i=0;i<7;i++)season(fixture,String(2035+i),100);
 const split={PA:100,AB:90,H:40,BB:10,HBP:0,K:10,TB:70,HR:5,twoB:5,threeB:0,RBI:20},pitch={BF:120,outs:90,AB:90,H:20,HR:2,BB:10,HBP:0,K:40,TB:30},batKey=JSON.stringify(['act-bat',fixture.world.seasonKey]);
 fixture.records.games[batKey]={gameKey:batKey,worldDay:1,scope:{seasonKey:fixture.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club.id]:{games:1,W:1,L:0,T:0,R:1,RA:0},[base.world.clubs.find(c=>c.id!==club.id)!.id]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:player.kind==='HITTER'?{[key]:{PA:split.PA,AB:split.AB,H:split.H,TB:split.TB,HR:split.HR,R:20,RBI:split.RBI,BB:split.BB,HBP:0,K:split.K,twoB:split.twoB,threeB:split.threeB,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{ },pitching:player.kind==='PITCHER'?{[key]:{BF:pitch.BF,outs:pitch.outs,H:pitch.H,HR:pitch.HR,BB:pitch.BB,HBP:0,K:pitch.K,R:10,ER:8,pitches:400,games:1,starts:1,starterOuts:pitch.outs,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}}:{},batterSplits:player.kind==='HITTER'?{[key]:{L:{...split,PA:0,AB:0,H:0,BB:0,K:0,TB:0,HR:0,RBI:0},R:split}}:{},pitcherSplits:player.kind==='PITCHER'?{[key]:{L:{...pitch,BF:0,outs:0,AB:0,K:0},R:pitch}}:{},matchups:{}};
 let c={...fixture,schemaVersion:6,revision:base.revision,difficulty:'GROWTH',protagonistClubId:club.id,phaseContext:{phase:'SEASON_REVIEW'},activation:{receiptKey:'act',sourceYearEndReceiptKey:'y',sourceRevision:0,contractKey:contract.contractKey},registration:{playerKey:key,clubId:club.id,seasonKey:'2042',status:'ACTIVE',firstTeam:true},rights:{sourceType:'DRAFT',holderOrgId:club.id,territory:'KR'},amateurHistory:hs,seasonGrowth:{seasonKey:'2042',days:0,finalized:true},development:{...structuredClone(hs.development!),seasonStartPlayer:structuredClone(player)},relationships:base.relationships,events:[],relationNotices:[],styleUsedWindows:[],planHistory:[],military:{status:'COMPLETED',applications:[]}} as unknown as KboCareer;
 c=requestKboPosting(c,c.revision);c=resolveKboPostingClub(c,c.revision);c=openKboPostingOffers(c,c.revision,1);return sign?acceptKboPostingOffer(c,c.revision,c.posting!.windows[0]!.offers![0]!.offerKey,1):c;
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

function transferred(ability=80,age=29,budget=40_000_000,otherBudget=budget){
 const source=postedCareer(ability,age),holder=source.posting!.windows[0]!.offers!.find(o=>o.offerKey===source.posting!.windows[0]!.signedOfferKey)!.organizationId,roster=createUsRosterWorld({worldKey:source.world.worldKey,seasonKey:'2043',seed:source.world.seed,difficulty:source.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')}))}),inventory=initialUsRecruitmentInventory(roster,roster.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:o.id===holder?budget:otherBudget,nationalReleaseAllowed:true,militaryReturnOption:true})));
 return {source,us:activateKboUsCareer(source,source.revision,roster,inventory)};
}
function openingTransferred(c:UsCareer){let n=confirmUsPreseasonPlan(c,c.revision);for(const e of unreadUsFirstCampNotices(n))n=resolveUsFirstCampNotice(n,n.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:'ACK_EVENT'});n=publishUsSeasonSchedule(n,n.revision);return startUsRegularSeason(n,n.revision);}
const annualFunding=(c:UsCareer)=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:20_000_000}));

test('new KBO US origin uses contract-start age and preserves initial MLB guarantee through controlled annual replay',()=>{
 const {source,us}=transferred();assert.equal(us.world.players[us.protagonistKey]!.age,30);assert.equal(us.contract.years,3);assert.equal(source.posting!.windows[0]!.sealedPlayer!.age,29);
 const origin=us.kboTransfer!.origin;assert.ok(origin);assert.equal(origin.playerAge,30);assert.deepEqual(origin.contract,us.contract);assert.deepEqual(origin.inventory,us.inventory);
 const closed=finishControlledMajorSeason(openingTransferred(us)),raw=canonicalJson(closed),next=startNextUsMajorSeason(closed,closed.revision,annualFunding(closed));assert.equal(next.world.players[next.protagonistKey]!.age,31);assert.equal(next.contract.years,2);assert.equal(next.contract.annualSalaryUsd,us.contract.annualSalaryUsd);assert.equal(canonicalJson(closed),raw);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));assert.deepEqual(next.kboTransfer!.origin,origin);
 const forged=structuredClone(next);forged.majorYears![0]!.inventory.clubs[0]!.availableBudgetUsd++;assert.throws(()=>usCareerView(forged),/INVALID_US_MAJOR_YEAR_HISTORY/);
});

test('KBO minor signed period controls expiry and valid annual histories without adding amateur six-season rights',()=>{
 const {us}=transferred(70,33);assert.equal(us.contract.type,'US_MINOR');assert.equal(us.contract.years,2);assert.equal(usYearTransitionReadiness(us).remainingMinorControlSeasons,1);
 const closed=finishControlledMajorSeason(openingTransferred(us)),next=startNextUsMinorSeason(closed,closed.revision,annualFunding(closed));assert.equal(usYearTransitionReadiness(next).remainingMinorControlSeasons,0);assert.ok(usYearTransitionReadiness(next).blockers.includes('CONTRACT_DECISION_REQUIRED'));assert.equal(next.contract.annualSalaryUsd,30_000);assert.equal(next.income.filter(e=>e.kind==='SIGNING_BONUS').length,0);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));
});

test('legacy KBO US root remains read-only compatible without manufacturing an initial budget or age',()=>{
 const {us}=transferred();delete us.kboTransfer!.origin;const raw=canonicalJson(us);assert.doesNotThrow(()=>usCareerView(us));assert.equal(canonicalJson(us),raw);
});

test('KBO minor first MLB callup ends the minor term and replays next-day salary and the next annual contract',()=>{
 const {us}=transferred(70,33),c=openingTransferred(us),key=c.protagonistKey,club=c.protagonistOrganizationId,games=c.seasonSchedule!.leagues.AAA.filter(g=>g.homeTeamKey===club||g.awayTeamKey===club).slice(0,24);
 // Controlled performance prefix, not24 actually simulated games.
 for(const g of games)c.records.games[g.simulationKey]={gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'AAA',phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:1,L:0,T:0,R:1,RA:0},[g.awayTeamKey]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{[key]:{...emptyBatting(),PA:4,AB:4,H:4,TB:16,HR:4,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 const zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};for(const g of games)c.records.games[g.simulationKey]!.batterSplits[key]={L:{...zero},R:{...zero,PA:4,AB:4,H:4,TB:16,HR:4}};
 c.records.revision=Object.keys(c.records.games).length;const day=games.at(-1)!.worldDay;c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};const offered=reviewUsLevel(c,day,c.phaseContext)!;assert.equal(offered.phaseContext.phase,'EVENT_DECISION');const e=offered.events.at(-1)!,major=resolveUsLevelEvent(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_CALLUP'});assert.equal(major.contract.years,1);assert.equal(major.contract.annualSalaryUsd,800_000);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(major))),usCareerView(major));
 const s=major.season!,minorDays=s.majorActivation!.effectiveDay-s.firstDay,span=s.lastDay-s.firstDay+1;assert.equal(usSalaryEntitlement(major,minorDays),Math.floor(30_000*minorDays/span));assert.equal(usSalaryEntitlement(major,span),30_000+s.majorActivation!.reservedAdditionalUsd);
 const closed=finishControlledMajorSeason(major),next=startNextUsMajorSeason(closed,closed.revision,annualFunding(closed));assert.equal(next.contract.years,1);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));
});

test('present null and partial KBO contract origins cannot bypass validation as legacy saves',()=>{
 const {us}=transferred();for(const origin of [null,false,0,{}, {contract:null,inventory:null}, {...us.kboTransfer!.origin,inventory:{}}]){
  const forged=JSON.parse(JSON.stringify(us));forged.kboTransfer.origin=origin;forged.world.players[forged.protagonistKey].age++;forged.inventory.clubs[0].availableBudgetUsd++;const raw=canonicalJson(forged);assert.throws(()=>usCareerView(forged),/INVALID_US_CONTRACT_ORIGIN/);assert.equal(canonicalJson(forged),raw);
 }
});

test('new overseas quotes cannot start a season after the existing age45 career limit',()=>{
 const c=postedCareer(80,45,false);assert.deepEqual(c.posting!.windows[0]!.offers,[]);
});

let marketSource:UsCareer|undefined;
function expiredMinor(){marketSource??=finishControlledMajorSeason(openingTransferred(transferred(70,35).us));return structuredClone(marketSource);}
const zeroFunding=(c:UsCareer)=>c.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}));
function minorDemandSource(){
 const c=expiredMinor(),me=c.world.players[c.protagonistKey]!;
 // Controlled weak same-position competitors isolate demand admission; this is not native NPC growth evidence.
 for(const org of c.world.organizations.filter(o=>o.id!==c.protagonistOrganizationId))for(const key of org.levels[c.registration.level]){const p=c.world.players[key]!;if(p.kind===me.kind&&p.position===me.position)p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,100_000]));}
 return c;
}
test('expired KBO minor market seals real budget/demand offers at the current level once and survives JSON',()=>{
 const c=minorDemandSource();
 const raw=canonicalJson(c),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),view=usMinorMarketView(opened);assert.equal(canonicalJson(c),raw);assert.equal(view.offers.length,4);assert.equal(view.offers.filter(o=>o.organizationId!==c.protagonistOrganizationId).length,3);for(const o of view.offers){assert.equal(o.years,1);assert.equal(o.annualSalaryUsd,30_000);assert.equal(o.initialLevel,c.registration.level);if(o.organizationId!==c.protagonistOrganizationId&&o.competitorScore!==null)assert.ok(view.playerScore>o.competitorScore);}assert.equal(view.returnHome.route,'ORIGINAL_CLUB_PRIORITY');assert.deepEqual(usMinorMarketView(JSON.parse(JSON.stringify(opened))),view);assert.equal(openUsMinorMarket(opened,opened.revision,zeroFunding(c)),opened);assert.equal(opened.events.filter(e=>e.definitionId==='E66').length,1);
});
test('E66 offers and domestic-return navigation expose the sealed comparison without resolving, signing or paying',()=>{
 const c=expiredMinor(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),e=opened.events.at(-1)!,raw=canonicalJson(opened);for(const [command,screen]of [['OPEN_CAREER_OFFERS','S08'],['OPEN_RETURN','S33']]){const out=resolveUsMinorMarketEvent(opened,opened.revision,{eventKey:e.eventKey,eventVersion:e.version,command:command!});assert.equal(out.navigation.targetScreen,screen);assert.equal(out.career,opened);assert.equal(canonicalJson(opened),raw);assert.equal(e.status,'OPEN');}
 assert.throws(()=>resolveUsMinorMarketEvent(opened,opened.revision-1,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_RETURN'}),/REVISION/);
});
test('minor market rejects early entry, stale input, funding drift and forged quotes without partial writes',()=>{
 const c=expiredMinor(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),raw=canonicalJson(opened);assert.throws(()=>openUsMinorMarket(c,c.revision-1,zeroFunding(c)),/REVISION/);assert.throws(()=>openUsMinorMarket(transferred(70,33).us,1,[]),/REVISION|NOT_AVAILABLE/);const funding=zeroFunding(c);funding[0]!.addedBudgetUsd=1;assert.throws(()=>openUsMinorMarket(opened,opened.revision,funding),/US_MINOR_MARKET_FUNDING_CHANGED/);const bad=structuredClone(opened);bad.minorMarket!.offers[0]!.annualSalaryUsd++;assert.throws(()=>usMinorMarketView(bad),/INVALID_US_MINOR_MARKET/);assert.equal(canonicalJson(opened),raw);
});
test('unfunded KBO minor market still exposes domestic return, never invents an offer or resets level',()=>{
 const c=finishControlledMajorSeason(openingTransferred(transferred(70,35,30_000,0).us)),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),view=usMinorMarketView(opened);assert.deepEqual(view.offers,[]);assert.equal(view.returnHome.available,true);assert.equal(opened.registration.level,c.registration.level);assert.deepEqual(opened.inventory,c.inventory);
});

test('minor market malformed rows and unrelated E66 evidence fail with a controlled boundary error',()=>{
 const c=expiredMinor(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c));for(const market of [null,{...opened.minorMarket,offers:[null]},{...opened.minorMarket,funding:[null]}]){const bad=JSON.parse(JSON.stringify(opened));bad.minorMarket=market;const raw=canonicalJson(bad);assert.throws(()=>usMinorMarketView(bad),/INVALID_US_MINOR_MARKET/);assert.equal(canonicalJson(bad),raw);}const wrong=structuredClone(opened);wrong.events.find(e=>e.eventKey===wrong.minorMarket!.eventKey)!.evidence.fields={playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:'foreign-window',stage:'MINOR_EXPIRED'};assert.throws(()=>usMinorMarketView(wrong),/INVALID_US_MINOR_MARKET/);
});

test('minor market saved competitor identities cannot be foreign, unrelated or null',()=>{
 const c=minorDemandSource(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),wrongClub=c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!.levels[c.registration.level].find(k=>k!==c.protagonistKey)!;for(const key of ['foreign-player',wrongClub,null]){const forged=structuredClone(opened),offer=forged.minorMarket!.offers.find(o=>o.organizationId!==c.protagonistOrganizationId)!;offer.competitorKey=key;if(key===null)offer.competitorScore=null;assert.throws(()=>usMinorMarketView(forged),/INVALID_US_MINOR_MARKET/);}
});
test('minor market absent comparators cannot create other-club demand',()=>{
 const absent=minorDemandSource(),me=absent.world.players[absent.protagonistKey]!;for(const org of absent.world.organizations.filter(o=>o.id!==absent.protagonistOrganizationId))for(const key of org.levels[absent.registration.level]){const p=absent.world.players[key]!;if(p.kind===me.kind&&p.position===me.position)p.position=me.position==='LF'?'RF':'LF';}assert.equal(usMinorMarketView(openUsMinorMarket(absent,absent.revision,zeroFunding(absent))).offers.filter(o=>o.organizationId!==absent.protagonistOrganizationId).length,0);
});

test('accepting the sealed original-club minor offer archives the year, closes E66 and starts a 1yr $30000 term',()=>{
 const c=minorDemandSource(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),home=opened.minorMarket!.offers.find(o=>o.organizationId===opened.protagonistOrganizationId)!;assert.ok(home);
 const raw=canonicalJson(opened),signed=acceptUsMinorMarketOffer(opened,opened.revision,home.offerKey);
 assert.equal(canonicalJson(opened),raw);assert.equal(signed.contract.years,1);assert.equal(signed.contract.annualSalaryUsd,30_000);assert.equal(signed.protagonistOrganizationId,c.protagonistOrganizationId);
 assert.equal(signed.events.find(e=>e.eventKey===opened.minorMarket!.eventKey)!.status,'RESOLVED');assert.equal(signed.minorMarket,undefined);assert.ok(signed.minorRenewal);
 assert.equal(signed.phaseContext.phase,'PRESEASON_SETUP');assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(signed))),usCareerView(signed));
 assert.throws(()=>acceptUsMinorMarketOffer(opened,opened.revision-1,home.offerKey),/REVISION/);
 assert.throws(()=>acceptUsMinorMarketOffer(transferred(70,33).us,1,home.offerKey),/REVISION|NOT_AVAILABLE|INVALID/);
});

test('accepting another club offer moves the player, keeps level, and preserves the sealed quote under JSON',()=>{
 const c=minorDemandSource(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),away=opened.minorMarket!.offers.find(o=>o.organizationId!==opened.protagonistOrganizationId)!;assert.ok(away);assert.ok(away.competitorKey);
 const signed=acceptUsMinorMarketOffer(opened,opened.revision,away.offerKey);
 assert.equal(signed.protagonistOrganizationId,away.organizationId);assert.equal(signed.registration.level,opened.registration.level);assert.equal(signed.contract.annualSalaryUsd,30_000);
 assert.ok(signed.world.organizations.find(o=>o.id===away.organizationId)!.levels[signed.registration.level].includes(signed.protagonistKey));
 assert.ok(!signed.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!.levels[signed.registration.level].includes(signed.protagonistKey));
 assert.equal(signed.minorRenewal!.displacedCompetitorKey,away.competitorKey);
 assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(signed))),usCareerView(signed));
});

test('repeated minor renewals replay every signed year without replacing the original US financial origin',()=>{
 let c=expiredMinor();const origin=canonicalJson(c.kboTransfer!.origin),initial=c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd;
 for(let i=1;i<=3;i++){const opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),offer=opened.minorMarket!.offers.find(o=>o.organizationId===c.protagonistOrganizationId)!,before=canonicalJson(opened),signed=acceptUsMinorMarketOffer(opened,opened.revision,offer.offerKey);assert.equal(canonicalJson(opened),before);assert.equal(signed.minorYears!.length,i);assert.equal(signed.inventory.clubs.find(o=>o.id===signed.protagonistOrganizationId)!.availableBudgetUsd,initial-i*30000);assert.equal(canonicalJson(signed.kboTransfer!.origin),origin);
  if(i===1)delete signed.minorYears![0]!.minorRenewal; // EL saved the first renewal only on the root.
  const serialized=canonicalJson(signed);assert.deepEqual(usCareerView(JSON.parse(serialized)),usCareerView(signed));assert.equal(canonicalJson(signed),serialized);
  if(i<3)c=finishControlledMajorSeason(openingTransferred(signed));else{assert.ok(signed.minorYears!.every(y=>y.minorRenewal));const bad=structuredClone(signed);bad.minorYears![0]!.inventory.clubs[0]!.availableBudgetUsd++;assert.throws(()=>usCareerView(bad),/INVALID_US_YEAR_HISTORY/);const price=structuredClone(signed);price.minorYears![0]!.minorRenewal!.contract.annualSalaryUsd++;assert.throws(()=>usCareerView(price),/INVALID_US_MINOR_RENEWAL/);const receipt=structuredClone(signed);receipt.events.find(e=>e.definitionId==='E66')!.resolution!.receiptKey='foreign-receipt';assert.throws(()=>usCareerView(receipt),/INVALID_US_MINOR_RENEWAL/);}}
});

test('a renewed away-club minor contract supports a real callup command and next major-year financial replay',()=>{
 const source=minorDemandSource(),opened=openUsMinorMarket(source,source.revision,zeroFunding(source)),away=opened.minorMarket!.offers.find(o=>o.organizationId!==source.protagonistOrganizationId)!,signed=acceptUsMinorMarketOffer(opened,opened.revision,away.offerKey),key=signed.protagonistKey,p=signed.world.players[key]!;
 // Controlled strong new-season profile and24 certified performance rows, not native growth or games.
 const stats=Object.keys(p.abilities);p.abilities=Object.fromEntries(stats.map(stat=>[stat,800000]));p.potential=Object.fromEntries(stats.map(stat=>[stat,Math.max(p.potential[stat]!,800000)]));p.careerPeaks=Object.fromEntries(stats.map(stat=>[stat,Math.max(p.careerPeaks[stat]!,800000)]));signed.seasonGrowth=createSeasonGrowthLedger(p,signed.world.seasonKey,signed.world.calendar.growthDays.length);signed.development.seasonStartPlayer=structuredClone(p);
 const c=openingTransferred(signed),club=c.protagonistOrganizationId,oldKey=c.contract.contractKey,games=c.seasonSchedule!.leagues.AAA.filter(g=>g.homeTeamKey===club||g.awayTeamKey===club).slice(0,24),zero={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 for(const g of games)c.records.games[g.simulationKey]={gameKey:g.simulationKey,worldDay:g.worldDay,scope:{seasonKey:c.world.seasonKey,leagueKey:'AAA',phase:'REGULAR'},teams:{[g.homeTeamKey]:{games:1,W:1,L:0,T:0,R:1,RA:0},[g.awayTeamKey]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{[key]:{...emptyBatting(),PA:4,AB:4,H:4,TB:16,HR:4,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},batterSplits:{[key]:{L:{...zero},R:{...zero,PA:4,AB:4,H:4,TB:16,HR:4}}},pitcherSplits:{},matchups:{}};
 c.records.revision=Object.keys(c.records.games).length;const day=games.at(-1)!.worldDay;c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};const offered=reviewUsLevel(c,day,c.phaseContext)!;assert.equal(offered.phaseContext.phase,'EVENT_DECISION');const e=offered.events.at(-1)!,major=resolveUsLevelEvent(offered,offered.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'CONFIRM_CALLUP'});assert.equal(major.season!.majorActivation!.fromContractKey,oldKey);assert.equal(major.contract.years,1);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(major))),usCareerView(major));
 const closed=finishControlledMajorSeason(major),next=startNextUsMajorSeason(closed,closed.revision,annualFunding(closed));assert.equal(next.protagonistOrganizationId,away.organizationId);assert.equal(next.contract.type,'US_MAJOR');assert.equal(next.contract.years,1);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(next))),usCareerView(next));assert.deepEqual(next.kboTransfer!.origin,source.kboTransfer!.origin);
 let live=openingTransferred(next);for(let i=0;i<200&&!live.season!.days.length;i++){const out=advanceUsCareer(live,live.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');assert.notEqual(out.stopReason,'ROSTER_DECISION_REQUIRED');live=out.career;}assert.equal(live.season!.days.length,1);assert.equal(Object.values(live.records.games).filter(g=>g.scope.seasonKey===live.world.seasonKey).length,75);assert.equal(live.season!.payroll.length,1);assert.deepEqual(usCareerView(JSON.parse(JSON.stringify(live))),usCareerView(live));
});

test('historical renewal E66 must retain expiry stage and review phase even when its event identity is rebuilt',()=>{
 const c=expiredMinor(),opened=openUsMinorMarket(c,c.revision,zeroFunding(c)),home=opened.minorMarket!.offers.find(o=>o.organizationId===c.protagonistOrganizationId)!,signed=acceptUsMinorMarketOffer(opened,opened.revision,home.offerKey),source=signed.events.find(e=>e.eventKey===opened.minorMarket!.eventKey)!;
 for(const field of ['stage','phase','competition'] as const){const bad=structuredClone(signed),fresh=createWorldEvent({definitionId:'E66',worldKey:source.worldKey,seasonKey:source.seasonKey,evidence:{...source.evidence,fields:{...source.evidence.fields,...(field==='stage'?{stage:'UNRELATED_STAGE'}:{})}},resume:{...source.resume,...(field==='phase'?{phase:'PRESEASON_SETUP' as const}:{}),...(field==='competition'?{competitionKey:'ROOKIE'}:{})},sourceSequence:source.sourceSequence,worldDay:source.occurredWorldDay}),closed=completeBlockingEvent(fresh,fresh.version,{sourceEvidenceKey:fresh.evidenceKey,receiptKey:source.resolution!.receiptKey!,command:'ACCEPT_CAREER_OFFER'},{worldKey:fresh.worldKey,seasonKey:fresh.seasonKey,worldDay:fresh.occurredWorldDay,eligibleCommands:fresh.offeredChoices});bad.events=bad.events.map(e=>e.eventKey===source.eventKey?closed:e);const raw=canonicalJson(bad);assert.throws(()=>usCareerView(bad),/INVALID_US_MINOR_RENEWAL/);assert.equal(canonicalJson(bad),raw);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import type {KboSeasonArchive} from '../src/kbo-year-transition.js';
import type {KboSeasonClose} from '../src/kbo-year-end.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {canonicalJson} from '../src/game.js';
import {emptyRecordLedger} from '../src/records.js';
import {createHealthLedger} from '../src/health.js';
import {createWorldStream} from '../src/rng.js';
import {UNITS_PER_POINT} from '@playball/rules';
import {kboPostingEligibility,requestKboPosting,resolveKboPostingClub,openKboPostingOffers,expireOrRejectKboPosting,acceptKboPostingOffer,kboPostingFeeWon} from '../src/kbo-posting.js';

type PostingFixture=ReturnType<typeof stagedKboOffseason> & {proSeasons:KboSeasonArchive[];seasonClose?:KboSeasonClose;records:ReturnType<typeof emptyRecordLedger>;health:ReturnType<typeof createHealthLedger>;protagonistKey:string;world:ReturnType<typeof stagedKboOffseason>['world']};
function season(s:PostingFixture,year:string,count:number){
 const club=s.world.clubs[0]!.id,opponent=s.world.clubs[1]!.id;
 for(let day=1;day<=count;day++){
  const key=JSON.stringify(['posting-service',year,day]);
  s.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:year,leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[opponent]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  s.health.games=[...s.health.games,{evidence:{gameKey:key,teamKey:'KBO:'+club,seasonKey:year,day,roster:[s.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
 }
 if(year===s.world.seasonKey)s.seasonClose={seasonKey:year} as KboSeasonClose;else s.proSeasons.push({seasonKey:year} as KboSeasonArchive);
}

function postingCareer(opts:{ovr?:number;military?:'COMPLETED'|'UNRESOLVED'|'NOT_APPLICABLE';seasons?:number;poorForm?:boolean}={}):KboCareer {
 const base=stagedKboOffseason(0);base.world.seasonKey='2040';
 const key=base.protagonistKey,player=base.world.players[key]!,ovr=opts.ovr??80,units=ovr*UNITS_PER_POINT;
 player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,units]));
 player.careerPeaks={...player.abilities};player.potential=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,Math.max(player.potential[k]!,units)]));
 const contract=base.world.contracts[key]!;contract.years=2;contract.seasonKey='2040';contract.status='ACTIVE';contract.clubId=base.world.clubs[0]!.id;
 const club=base.world.clubs[0]!;if(!club.roster.includes(key))club.roster.push(key);if(!club.firstTeam.includes(key))club.firstTeam=[key,...club.firstTeam].slice(0,28);
 const records=emptyRecordLedger(),health=createHealthLedger(createWorldStream('posting','health','roster')),proSeasons:KboSeasonArchive[]=[],fixture:PostingFixture={...base,records,health,proSeasons,seasonClose:{seasonKey:'2040'} as KboSeasonClose};
 for(let i=0;i<(opts.seasons??7);i++)season(fixture,String(2033+i),100);
 const batKey=JSON.stringify(['posting-bat',fixture.world.seasonKey]),good= !opts.poorForm,split=good?{PA:100,AB:90,H:40,BB:10,HBP:0,K:10,TB:70,HR:5,twoB:5,threeB:0,RBI:20}:{PA:100,AB:100,H:0,BB:0,HBP:0,K:100,TB:0,HR:0,twoB:0,threeB:0,RBI:0},pitch=good?{BF:120,outs:90,AB:90,H:20,HR:2,BB:10,HBP:0,K:40,TB:30}:{BF:120,outs:90,AB:100,H:80,HR:20,BB:40,HBP:0,K:5,TB:140};
 fixture.records.games[batKey]={gameKey:batKey,worldDay:1,scope:{seasonKey:fixture.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club.id]:{games:1,W:1,L:0,T:0,R:1,RA:0},[base.world.clubs[1]!.id]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:player.kind==='HITTER'?{[key]:{PA:split.PA,AB:split.AB,H:split.H,TB:split.TB,HR:split.HR,R:good?20:0,RBI:split.RBI,BB:split.BB,HBP:0,K:split.K,twoB:split.twoB,threeB:split.threeB,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{ },pitching:player.kind==='PITCHER'?{[key]:{BF:pitch.BF,outs:pitch.outs,H:pitch.H,HR:pitch.HR,BB:pitch.BB,HBP:0,K:pitch.K,R:good?10:40,ER:good?8:40,pitches:400,games:1,starts:1,starterOuts:pitch.outs,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}}:{},batterSplits:player.kind==='HITTER'?{[key]:{L:{...split,PA:0,AB:0,H:0,BB:0,K:0,TB:0,HR:0,RBI:0},R:split}}:{},pitcherSplits:player.kind==='PITCHER'?{[key]:{L:{...pitch,BF:0,outs:0,AB:0,K:0},R:pitch}}:{},matchups:{}};
 return {...fixture,schemaVersion:6,revision:1,difficulty:'GROWTH',protagonistClubId:club.id,phaseContext:{phase:'SEASON_REVIEW'},activation:{receiptKey:'posting-act',sourceYearEndReceiptKey:'y',sourceRevision:0,contractKey:contract.contractKey},registration:{playerKey:key,clubId:club.id,seasonKey:'2040',status:'ACTIVE',firstTeam:true},rights:{sourceType:'DRAFT',holderOrgId:club.id,territory:'KR'},amateurHistory:{},seasonGrowth:{seasonKey:'2040',days:0,finalized:true},development:{seasonStartPlayer:structuredClone(player)},relationships:{},events:[],relationNotices:[],styleUsedWindows:[],planHistory:[],military:{status:opts.military??'COMPLETED',applications:[]}} as unknown as KboCareer;
}

test('posting needs seven closed registered seasons, completed military and an offseason contract',()=>{
 const short=postingCareer({seasons:6}),raw=canonicalJson(short);assert.equal(kboPostingEligibility(short).eligible,false);assert.ok(kboPostingEligibility(short).reasons.includes('SERVICE_SHORT'));assert.throws(()=>requestKboPosting(short,short.revision),/NOT_ELIGIBLE/);assert.equal(canonicalJson(short),raw);
 const blocked=postingCareer({military:'UNRESOLVED'});assert.ok(kboPostingEligibility(blocked).reasons.includes('MILITARY_BLOCKED'));
 const ok=postingCareer();assert.equal(kboPostingEligibility(ok).eligible,true);
});

test('club score defers below 65 without touching the contract, and approval opens a fixed offer set',()=>{
 const weak=postingCareer({ovr:40,poorForm:true});let c=requestKboPosting(weak,weak.revision);const before=canonicalJson(c.world.contracts[c.protagonistKey]);c=resolveKboPostingClub(c,c.revision);assert.equal(c.posting!.windows[0]!.status,'DEFERRED');assert.ok((c.posting!.windows[0]!.approvalScore??0)<65);assert.equal(canonicalJson(c.world.contracts[c.protagonistKey]),before);assert.throws(()=>requestKboPosting(c,c.revision),/NOT_ELIGIBLE/);
 const deferred=c.events.find(e=>e.definitionId==='E63'&&e.status==='OPEN');assert.ok(deferred);assert.equal(deferred!.postingDecision,'DEFERRED');
 const strong=postingCareer({ovr:80});let s=requestKboPosting(strong,strong.revision);s=resolveKboPostingClub(s,s.revision);assert.equal(s.posting!.windows[0]!.status,'APPROVED');assert.ok((s.posting!.windows[0]!.approvalScore??0)>=65);
 assert.equal(s.events.find(e=>e.definitionId==='E63'&&e.status==='OPEN')!.postingDecision,'APPROVED');
 s=openKboPostingOffers(s,s.revision,10);const first=canonicalJson(s.posting!.windows[0]!.offers);assert.throws(()=>openKboPostingOffers(s,s.revision,10),/OFFERS_NOT_AVAILABLE/);assert.equal(canonicalJson(s.posting!.windows[0]!.offers),first);assert.ok((s.posting!.windows[0]!.offers?.length??0)<=3);
 assert.equal(s.events.find(e=>e.definitionId==='E63')!.status,'RESOLVED');assert.ok(s.events.some(e=>e.definitionId==='E64'&&e.status==='OPEN'));
 const rejected=expireOrRejectKboPosting(s,s.revision,'REJECTED');assert.equal(rejected.posting!.windows[0]!.status,'REJECTED');assert.equal(canonicalJson(rejected.world.contracts[rejected.protagonistKey]),canonicalJson(s.world.contracts[s.protagonistKey]));
});

test('accept pays the club fee once, seals return rights, removes the player and never credits player income',()=>{
 let c=postingCareer({ovr:80});const key=c.protagonistKey,clubId=c.protagonistClubId,contract=structuredClone(c.world.contracts[key]!),budget=c.world.clubs.find(x=>x.id===clubId)!.budgetWon,reserved=c.world.clubs.find(x=>x.id===clubId)!.reservedSalaryWon,raw=canonicalJson(c);
 c=requestKboPosting(c,c.revision);c=resolveKboPostingClub(c,c.revision);c=openKboPostingOffers(c,c.revision,1);const offer=c.posting!.windows[0]!.offers![0]!;assert.ok(offer);const fee=kboPostingFeeWon(offer);
 assert.throws(()=>acceptKboPostingOffer(c,c.revision-1,offer.offerKey,1),/REVISION/);assert.throws(()=>acceptKboPostingOffer(c,c.revision,offer.offerKey,31),/EXPIRED/);
 const source=canonicalJson(c),signed=acceptKboPostingOffer(c,c.revision,offer.offerKey,1);assert.equal(canonicalJson(c),source);assert.notEqual(source,raw);assert.equal(signed.phaseContext.phase,'ARCHIVED');assert.equal(signed.posting!.windows[0]!.status,'SIGNED');assert.equal(signed.posting!.windows[0]!.compensationWon,fee);
 assert.equal(signed.world.clubs.find(x=>x.id===clubId)!.budgetWon,budget+fee);assert.equal(signed.world.clubs.find(x=>x.id===clubId)!.reservedSalaryWon,reserved-contract.annualSalaryWon);
 assert.equal(signed.world.contracts[key],undefined);assert.equal(signed.world.players[key],undefined);assert.ok(!signed.world.clubs.find(x=>x.id===clubId)!.roster.includes(key));
 assert.deepEqual(signed.posting!.windows[0]!.returnRights,{holderClubId:clubId,territory:'KR',sourceType:'POSTING',seasonKey:'2040',contractKey:contract.contractKey,annualSalaryWon:contract.annualSalaryWon,years:contract.years,snapshotRevision:c.revision});
 assert.equal(signed.posting!.windows[0]!.sealedContract!.contractKey,contract.contractKey);assert.equal(signed.posting!.windows[0]!.sealedPlayer!.simulationKey,key);
 assert.doesNotMatch(JSON.stringify(signed),/"kind":"SIGNING_BONUS"|"kind":"SALARY"/);
});

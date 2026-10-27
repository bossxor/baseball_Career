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
import {requestKboPosting,resolveKboPostingClub,openKboPostingOffers,acceptKboPostingOffer} from '../src/kbo-posting.js';
import {kboOverseasFaEligibility,openKboOverseasFaOffers,expireOrRejectKboOverseasFa,acceptKboOverseasFaOffer} from '../src/kbo-overseas-fa.js';
import {kboReturnEligibility,startKboReturnNegotiation,offerKboReturnTerms,acceptKboReturnOffer,rejectOrExpireKboReturn} from '../src/kbo-return.js';

type Fixture=ReturnType<typeof stagedKboOffseason> & {proSeasons:KboSeasonArchive[];seasonClose?:KboSeasonClose;records:ReturnType<typeof emptyRecordLedger>;health:ReturnType<typeof createHealthLedger>};
function season(s:Fixture,year:string,count:number){
 const club=s.world.clubs[0]!.id,opponent=s.world.clubs[1]!.id;
 for(let day=1;day<=count;day++){
  const key=JSON.stringify(['ofa-service',year,day]);
  s.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:year,leagueKey:'KBO',phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[opponent]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  s.health.games=[...s.health.games,{evidence:{gameKey:key,teamKey:'KBO:'+club,seasonKey:year,day,roster:[s.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
 }
 if(year===s.world.seasonKey)s.seasonClose={seasonKey:year} as KboSeasonClose;else s.proSeasons.push({seasonKey:year} as KboSeasonArchive);
}
function career(opts:{seasons?:number;ovr?:number}={}):KboCareer {
 const base=stagedKboOffseason(0);base.world.seasonKey='2040';
 const key=base.protagonistKey,player=base.world.players[key]!,units=(opts.ovr??80)*UNITS_PER_POINT;
 player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,units]));player.careerPeaks={...player.abilities};player.potential=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,Math.max(player.potential[k]!,units)]));
 const contract=base.world.contracts[key]!;contract.years=2;contract.seasonKey='2040';contract.status='ACTIVE';contract.clubId=base.world.clubs[0]!.id;
 const club=base.world.clubs[0]!;if(!club.roster.includes(key))club.roster.push(key);if(!club.firstTeam.includes(key))club.firstTeam=[key,...club.firstTeam].slice(0,28);
 const records=emptyRecordLedger(),health=createHealthLedger(createWorldStream('ofa','health','roster')),proSeasons:KboSeasonArchive[]=[],fixture:Fixture={...base,records,health,proSeasons,seasonClose:{seasonKey:'2040'} as KboSeasonClose};
 for(let i=0;i<(opts.seasons??9);i++)season(fixture,String(2031+i),100);
 const split={PA:100,AB:90,H:40,BB:10,HBP:0,K:10,TB:70,HR:5,twoB:5,threeB:0,RBI:20},pitch={BF:120,outs:90,AB:90,H:20,HR:2,BB:10,HBP:0,K:40,TB:30},batKey=JSON.stringify(['ofa-bat',fixture.world.seasonKey]);
 fixture.records.games[batKey]={gameKey:batKey,worldDay:1,scope:{seasonKey:fixture.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{[club.id]:{games:1,W:1,L:0,T:0,R:1,RA:0},[base.world.clubs[1]!.id]:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:player.kind==='HITTER'?{[key]:{PA:split.PA,AB:split.AB,H:split.H,TB:split.TB,HR:split.HR,R:20,RBI:split.RBI,BB:split.BB,HBP:0,K:split.K,twoB:split.twoB,threeB:split.threeB,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{ },pitching:player.kind==='PITCHER'?{[key]:{BF:pitch.BF,outs:pitch.outs,H:pitch.H,HR:pitch.HR,BB:pitch.BB,HBP:0,K:pitch.K,R:10,ER:8,pitches:400,games:1,starts:1,starterOuts:pitch.outs,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0}}:{},batterSplits:player.kind==='HITTER'?{[key]:{L:{...split,PA:0,AB:0,H:0,BB:0,K:0,TB:0,HR:0,RBI:0},R:split}}:{},pitcherSplits:player.kind==='PITCHER'?{[key]:{L:{...pitch,BF:0,outs:0,AB:0,K:0},R:pitch}}:{},matchups:{}};
 return {...fixture,schemaVersion:6,revision:1,difficulty:'GROWTH',protagonistClubId:club.id,phaseContext:{phase:'SEASON_REVIEW'},activation:{receiptKey:'ofa-act',sourceYearEndReceiptKey:'y',sourceRevision:0,contractKey:contract.contractKey},registration:{playerKey:key,clubId:club.id,seasonKey:'2040',status:'ACTIVE',firstTeam:true},rights:{sourceType:'DRAFT',holderOrgId:club.id,territory:'KR'},amateurHistory:{},seasonGrowth:{seasonKey:'2040',days:0,finalized:true},development:{seasonStartPlayer:structuredClone(player)},relationships:{},events:[],relationNotices:[],styleUsedWindows:[],planHistory:[],military:{status:'COMPLETED',applications:[]}} as unknown as KboCareer;
}

test('overseas FA needs nine seasons, pays no club fee, and releases domestic rights',()=>{
 const short=career({seasons:8});assert.equal(kboOverseasFaEligibility(short).eligible,false);assert.ok(kboOverseasFaEligibility(short).reasons.includes('SERVICE_SHORT'));
 let c=career({seasons:9});const budget=c.world.clubs.find(x=>x.id===c.protagonistClubId)!.budgetWon,key=c.protagonistKey,raw=canonicalJson(c);
 c=openKboOverseasFaOffers(c,c.revision,5);assert.throws(()=>openKboOverseasFaOffers(c,c.revision,5),/NOT_ELIGIBLE/);const offer=c.overseasFa!.windows[0]!.offers[0]!;assert.ok(offer);
 const kept=expireOrRejectKboOverseasFa(c,c.revision,'REJECTED');assert.equal(canonicalJson(kept.world.contracts[key]),canonicalJson(c.world.contracts[key]));
 c=openKboOverseasFaOffers(career({seasons:9}),1,5);const source=canonicalJson(c),signed=acceptKboOverseasFaOffer(c,c.revision,c.overseasFa!.windows[0]!.offers[0]!.offerKey,5);assert.equal(canonicalJson(c),source);
 assert.equal(signed.world.clubs.find(x=>x.id===signed.protagonistClubId)!.budgetWon,budget);assert.equal(signed.overseasFa!.windows[0]!.domesticRights,'RELEASED');assert.equal(signed.world.players[key],undefined);assert.equal(signed.phaseContext.phase,'ARCHIVED');assert.notEqual(canonicalJson(signed),raw);
 assert.equal(kboReturnEligibility(signed).eligible,false);assert.ok(kboReturnEligibility(signed).reasons.includes('OVERSEAS_FA_RELEASED')||kboReturnEligibility(signed).reasons.includes('RETURN_RIGHTS_REQUIRED'));
});

test('posted player can return to the original club without paying a second posting fee',()=>{
 let c=career({seasons:7});const key=c.protagonistKey,clubId=c.protagonistClubId,budget=c.world.clubs.find(x=>x.id===clubId)!.budgetWon;
 c=requestKboPosting(c,c.revision);c=resolveKboPostingClub(c,c.revision);c=openKboPostingOffers(c,c.revision,1);const feeBudget=c.world.clubs.find(x=>x.id===clubId)!.budgetWon;c=acceptKboPostingOffer(c,c.revision,c.posting!.windows[0]!.offers![0]!.offerKey,1);
 assert.ok(c.world.clubs.find(x=>x.id===clubId)!.budgetWon>feeBudget);assert.equal(kboReturnEligibility(c).eligible,true);
 c=startKboReturnNegotiation(c,c.revision,2);c=offerKboReturnTerms(c,c.revision);assert.equal(c.returnHome!.negotiations[0]!.offer!.clubId,clubId);assert.equal(c.returnHome!.negotiations[0]!.offer!.currency,'KRW');
 const source=canonicalJson(c),back=acceptKboReturnOffer(c,c.revision,2);assert.equal(canonicalJson(c),source);assert.ok(back.world.players[key]);assert.ok(back.world.contracts[key]);assert.ok(back.world.clubs.find(x=>x.id===clubId)!.roster.includes(key));
 assert.equal(back.phaseContext.phase,'PRESEASON_SETUP');assert.equal(back.returnHome!.negotiations[0]!.status,'ACCEPTED');assert.equal(back.world.clubs.find(x=>x.id===clubId)!.budgetWon,c.world.clubs.find(x=>x.id===clubId)!.budgetWon);
 let other=career({seasons:7});other=requestKboPosting(other,other.revision);other=resolveKboPostingClub(other,other.revision);other=openKboPostingOffers(other,other.revision,1);other=acceptKboPostingOffer(other,other.revision,other.posting!.windows[0]!.offers![0]!.offerKey,1);other=startKboReturnNegotiation(other,other.revision,3);const released=rejectOrExpireKboReturn(other,other.revision,'RELEASED');assert.equal(released.returnHome!.negotiations[0]!.status,'RELEASED');assert.ok(budget>0);
});

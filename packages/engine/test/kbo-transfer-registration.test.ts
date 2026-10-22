import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import {captureKboTransferPlanBoundaryDays,settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {kboTeamGames,protagonistLeague,trainKboCareer,changeKboMidseasonArchetype} from '../src/kbo-windows.js';
import {kboMilitaryGrowthPeriods,kboMilitaryGrowthWindow,kboMilitaryScheduledGames} from '../src/kbo-military-growth.js';
import {currentKboSeasonTransfers} from '../src/kbo-transfer-registration.js';
import {reviewKboCallup} from '../src/kbo-callup.js';
import {completeSangmuBlock,enlistInActiveService,enlistInSangmu} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {canonicalJson} from '../src/game.js';

let cached:KboCareer|undefined;
function started(){
 if(!cached){const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),r=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(r,r.revision);cached=startKboRegularSeason(s,s.revision);}
 return structuredClone(cached);
}
const schedule=(c:KboCareer,club:string,league:'KBO'|'FUTURES')=>c.competitionSchedule!.leagues[league].filter(g=>g.awayTeamKey===club || g.homeTeamKey===club);
function clock(c:KboCareer,day:number){
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay));
 c.days!.days=Array.from({length:day-first+1},(_,i)=>({day:first+i,evidence:'controlled-transfer-clock',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
}
/** Controlled official team contributions and immutable bench registration; not a whole-season simulation. */
function registered(c:KboCareer,club:string,league:'KBO'|'FUTURES',day:number,include=true){
 const game=schedule(c,club,league).find(g=>g.worldDay===day)!;assert.ok(game);
 const gameKey=game.simulationKey;
 c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[game.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},[game.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 if(include)c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:league+':'+club,seasonKey:c.world.seasonKey,day,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
 clock(c,day);
}
/** Only registration/calculation fixture: contract finances and playable roster repair have their own integration tests. */
function transfer(c:KboCareer,day:number){
 const boundary=captureKboTransferPlanBoundaryDays(c),from=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,to=c.world.clubs.find(t=>t.id!==from.id)!,contract=c.world.contracts[c.protagonistKey]!,previousContractKey=contract.contractKey;
 from.roster=from.roster.filter(k=>k!==c.protagonistKey);from.firstTeam=from.firstTeam.filter(k=>k!==c.protagonistKey);to.roster.push(c.protagonistKey);
 c.schemaVersion=4;c.protagonistClubId=to.id;c.registration={...c.registration,clubId:to.id,firstTeam:false,competitionKey:'FUTURES'};contract.clubId=to.id;contract.contractKey='controlled-transfer-contract';
 c.transferHistory=[...(c.transferHistory??[]),{receiptKey:'controlled-transfer-receipt',seasonKey:c.world.seasonKey,playerKey:c.protagonistKey,fromClubId:from.id,toClubId:to.id,afterWorldDay:day,previousContractKey,contractKey:contract.contractKey,planBoundaryDays:boundary}];
 return {from:from.id,to:to.id,boundary};
}

test('transfer counts actual registrations, freezes legacy plan dates, and preserves one annual growth ledger',()=>{
 const c=started(),club=c.protagonistClubId,league=protagonistLeague(c),days=schedule(c,club,league).slice(0,3).map(g=>g.worldDay);
 registered(c,club,league,days[0]!,false);registered(c,club,league,days[1]!);registered(c,club,league,days[2]!);
 c.planHistory=[...c.planHistory,{...c.planHistory[0]!,completedTeamGames:2}];
 const originalGrowth=canonicalJson(c.seasonGrowth),oldHealth=canonicalJson(c.health.games),move=transfer(c,days[2]!);
 assert.deepEqual(move.boundary,[0,days[1]]);assert.equal(kboTeamGames(c),2);assert.equal(canonicalJson(c.seasonGrowth),originalGrowth);assert.equal(canonicalJson(c.health.games),oldHealth);
 const next=schedule(c,move.to,'FUTURES').find(g=>g.worldDay>days[2]!)!;registered(c,move.to,'FUTURES',next.worldDay);assert.equal(kboTeamGames(c),3);
 const expected=2+schedule(c,move.to,'FUTURES').filter(g=>g.worldDay>days[2]!).length;assert.equal(kboMilitaryScheduledGames(c),expected);
 assert.deepEqual(captureKboTransferPlanBoundaryDays(c),[0,days[1]]);
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES];clock(c,Math.max(...all.map(g=>g.worldDay)));c.phaseContext={phase:'SEASON_REVIEW'};
 const before=canonicalJson(c),out=settleKboSeasonGrowth(c,c.revision),entries=out.career.seasonGrowth.entries.slice(c.seasonGrowth.entries.length),boundary=c.world.calendar.growthDays.indexOf(days[1]!)+1;
 assert.equal(entries.length,2);assert.equal(entries[0]!.period.endDay,boundary);assert.equal(entries[1]!.period.startDay,boundary);assert.equal(entries.at(-1)!.period.endDay,c.world.calendar.growthDays.length);assert.equal(canonicalJson(c),before);
 assert.equal(settleKboSeasonGrowth(out.career,out.career.revision).duplicate,true);
 const double=structuredClone(c);double.health.games=[...double.health.games,double.health.games.at(-1)!];assert.throws(()=>kboTeamGames(double),/DOUBLE_BOOKED/);
 const forged=structuredClone(c);forged.transferHistory=[{...forged.transferHistory![0]!,fromClubId:c.world.clubs.find(t=>![move.from,move.to].includes(t.id))!.id}];assert.throws(()=>kboTeamGames(forged),/TRANSFER_REGISTRATION/);
});

test('new-club call-up review starts at twenty actual new registrations and keeps old reviews',()=>{
 const c=started(),club=c.protagonistClubId,league=protagonistLeague(c),day=schedule(c,club,league)[0]!.worldDay;registered(c,club,league,day);
 const move=transfer(c,day),future=schedule(c,move.to,'FUTURES').filter(g=>g.worldDay>day);
 c.callupReviews=[{seasonKey:c.world.seasonKey,teamGames:20,outcome:'BELOW',comparedKey:null,candidateScore:0,comparedScore:null}];c.health.injuries[c.protagonistKey]={severity:'MILD',remainingTeamGames:2,diagnosedGameKey:'controlled-old-injury',seasonKey:c.world.seasonKey};
 for(const g of future.slice(0,19))registered(c,move.to,'FUTURES',g.worldDay);
 assert.equal(reviewKboCallup(c,future[18]!.worldDay,c.phaseContext as KboSeasonProgress),null);
 registered(c,move.to,'FUTURES',future[19]!.worldDay);const reviewed=reviewKboCallup(c,future[19]!.worldDay,c.phaseContext as KboSeasonProgress)!;
 assert.equal(reviewed.callupReviews!.length,2);assert.deepEqual(reviewed.callupReviews![0],c.callupReviews[0]);assert.equal(reviewed.callupReviews![1]!.outcome,'INJURED');assert.equal(reviewed.callupReviews![1]!.registrationReceiptKey,c.transferHistory![0]!.receiptKey);assert.equal(reviewed.callupReviews![1]!.clubId,move.to);
 assert.equal(reviewKboCallup(reviewed,future[19]!.worldDay,reviewed.phaseContext as KboSeasonProgress),null);
 c.events=[...c.events,{...c.events[0]!,definitionId:'E09'}];assert.equal(reviewKboCallup(c,future[19]!.worldDay,c.phaseContext as KboSeasonProgress),null);
});

test('transfer retains already-used season training and style windows without reopening either chance',()=>{
 let c=started();const club=c.protagonistClubId,league=protagonistLeague(c),games=schedule(c,club,league).slice(0,80);
 for(const g of games.slice(0,72))registered(c,club,league,g.worldDay);
 c=trainKboCareer(c,c.revision,{type:'SKIP'});const initial=c.world.players[c.protagonistKey]!.archetype,target=initial==='CONTACT'?'SLUGGER':'CONTACT';c=changeKboMidseasonArchetype(c,c.revision,target);
 // Legacy windows count club games even when this player was not registered there on those dates.
 for(const g of games.slice(72))registered(c,club,league,g.worldDay,false);c=changeKboMidseasonArchetype(c,c.revision,target);assert.deepEqual(c.planHistory.map(p=>p.completedTeamGames),[0,72,80]);
 const before=canonicalJson({development:c.development,style:c.styleUsedWindows,plan:c.planHistory,growth:c.seasonGrowth}),move=transfer(c,games.at(-1)!.worldDay);
 assert.equal(canonicalJson({development:c.development,style:c.styleUsedWindows,plan:c.planHistory,growth:c.seasonGrowth}),before);assert.equal(kboTeamGames(c),72);
 const same=changeKboMidseasonArchetype(c,c.revision,target);assert.deepEqual(same.planHistory,c.planHistory);assert.deepEqual(captureKboTransferPlanBoundaryDays(same),c.transferHistory![0]!.planBoundaryDays);
 assert.throws(()=>trainKboCareer(c,c.revision,{type:'SKIP'}),/LIMIT_REACHED/);assert.throws(()=>changeKboMidseasonArchetype(c,c.revision,initial),/STYLE_WINDOW_USED/);assert.equal(currentKboSeasonTransfers(c)![0]!.toClubId,move.to);
});

for(const kind of ['ACTIVE','SPORTS'] as const)test(`completed ${kind} military program keeps original rights/growth history across a valid transfer`,()=>{
 const c=started(),year=Number(c.world.seasonKey),club=c.protagonistClubId,contract=c.world.contracts[c.protagonistKey]!,program=(kind==='ACTIVE'?enlistInActiveService:enlistInSangmu)({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:club,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:1}),completion=kboMilitaryCompletionDays(program),done=completeSangmuBlock(completeSangmuBlock(program,completion[0]!.seasonKey,completion[0]!.worldDay),completion[1]!.seasonKey,completion[1]!.worldDay),until=completion[1]!.worldDay;
 c.military={status:'COMPLETED',applications:[],program:done,completionDays:completion,growthPolicyVersion:1};
 if(kind==='SPORTS'){
  const day=c.world.calendar.growthDays.filter(d=>d<=until).at(-1)!,gameKey='controlled-sangmu-game';
  c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{SANGMU:{games:1,W:0,L:0,T:1,R:0,RA:0},[club]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;
 }
 const day=schedule(c,club,protagonistLeague(c)).find(g=>g.worldDay>until)!.worldDay;registered(c,club,protagonistLeague(c),day);const original=canonicalJson(c.military),move=transfer(c,day),next=schedule(c,move.to,'FUTURES').find(g=>g.worldDay>day)!;registered(c,move.to,'FUTURES',next.worldDay);
 assert.deepEqual(kboMilitaryGrowthWindow(c),{untilWorldDay:until,kind});assert.equal(kboTeamGames(c),kind==='SPORTS'?3:2);assert.equal(canonicalJson(c.military),original);
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES];clock(c,Math.max(...all.map(g=>g.worldDay)));c.phaseContext={phase:'SEASON_REVIEW'};
 const parts=kboMilitaryGrowthPeriods(c)!;assert.equal(parts.some(p=>p.period.ordinaryMilitary),kind==='ACTIVE');assert.equal(parts.at(-1)!.period.ordinaryMilitary,false);
 const invalid=structuredClone(c);delete invalid.transferHistory;invalid.schemaVersion=3;assert.throws(()=>kboMilitaryGrowthWindow(invalid),/MILITARY_GROWTH_CALENDAR/);
 assert.equal(currentKboSeasonTransfers(c)!.length,1);
});

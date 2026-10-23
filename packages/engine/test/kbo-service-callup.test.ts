import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {reviewKboCallup,resolveKboCallup} from '../src/kbo-callup.js';
import {enlistInSangmu,completeSangmuBlock} from '../src/kbo-military-program.js';
import {createKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {resumeKboContractPayments} from '../src/kbo-contract-payments.js';
import {kboClubBalance} from '../src/kbo-finance.js';
import {canonicalJson} from '../src/game.js';

function remaining(c:KboCareer,league:'KBO'|'FUTURES',day:number){return c.competitionSchedule!.leagues[league].filter(g=>g.worldDay>day && [g.homeTeamKey,g.awayTeamKey].includes(c.protagonistClubId)).length;}
function returned(c:KboCareer,key:string,day:number,league:'KBO'|'FUTURES'){
 const contract=c.world.contracts[key]!,old=kboContractSeasonCharge(contract),season=c.world.seasonKey,year=Number(season),returnDay=year%4===0 && (year%100!==0 || year%400===0)?181:180;
 // A fixed unpaid144-day principal is created once; the fixture never invents past salary receipts.
 const program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:key,clubId:contract.clubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:144});
 contract.servicePay=createKboServicePayroll(contract,program,{seasonKey:season,worldDay:returnDay});
 contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,completeSangmuBlock(completeSangmuBlock(program,String(year-1),300),season,returnDay));
 contract.servicePay.reservedGameDays=remaining(c,league,day);c.world.clubs.find(t=>t.id===contract.clubId)!.reservedSalaryWon+=kboContractSeasonCharge(contract)-old;
}
function offered(ownService=false){
 const e=enteredKboCareer(),a=startSangmuCohort(e,e.revision),p=confirmKboPreseasonPlan(a,a.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),c=startKboRegularSeason(s,s.revision),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 const me=c.world.players[c.protagonistKey]!;
 if(club.firstTeam.includes(c.protagonistKey)){const sub=club.roster.find(k=>!club.firstTeam.includes(k) && c.world.players[k]!.kind===me.kind && c.world.players[k]!.position===me.position)!;assert.ok(sub);club.firstTeam=club.firstTeam.map(k=>k===c.protagonistKey?sub:k);c.registration={...c.registration,firstTeam:false,competitionKey:'FUTURES'};}
 const values=Object.fromEntries(abilityKeys(me.kind).map(k=>[k,1_000_000]));c.world.players[c.protagonistKey]={...me,abilities:values,potential:{...values},careerPeaks:{...values}};
 const year=Number(c.world.seasonKey),day=year%4===0 && (year%100!==0 || year%400===0)?181:180;
 // A shortened remaining calendar isolates the swap: one actual KBO fixture versus two actual Futures fixtures.
 for(const [league,count] of [['KBO',1],['FUTURES',2]] as const){const kept=new Set(c.competitionSchedule!.leagues[league].filter(g=>g.worldDay>day && [g.homeTeamKey,g.awayTeamKey].includes(club.id)).slice(0,count).map(g=>g.simulationKey));c.competitionSchedule!.leagues[league]=c.competitionSchedule!.leagues[league].filter(g=>g.worldDay<=day || ![g.homeTeamKey,g.awayTeamKey].includes(club.id) || kept.has(g.simulationKey));}
 assert.equal(remaining(c,'KBO',day),1);assert.equal(remaining(c,'FUTURES',day),2);
 for(let i=0;i<20;i++){const gameKey=`controlled-callup-${i}`,line={games:1,W:0,L:0,T:1,R:0,RA:0};c.records.games[gameKey]={gameKey,worldDay:i+1,scope:{seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[club.id]:line,OTHER:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};}
 c.days={...c.days!,days:[{day,evidence:'controlled-closed-clock',result:{injured:[],recovered:[]}}]};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 const result=reviewKboCallup(c,day,c.phaseContext as KboSeasonProgress)!;assert.ok(result);const key=result.callupReviews!.at(-1)!.comparedKey!;assert.ok(key);returned(result,key,day,'KBO');if(ownService)returned(result,result.protagonistKey,day,'FUTURES');return {c:result,key,day};
}
function accept(c:KboCareer){const event=c.events.at(-1)!;return resolveKboCallup(c,c.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACCEPT_CALLUP'});}

test('E09 demotion reserves the returned NPC remaining Futures dates in the same atomic swap',()=>{
 const {c,key,day}=offered(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,before=canonicalJson(c),old=c.world.contracts[key]!,expected=structuredClone(old),ledger=canonicalJson(old.servicePay!.ledger);
 expected.servicePay!.reservedGameDays=remaining(c,'FUTURES',day);const delta=kboContractSeasonCharge(expected)-kboContractSeasonCharge(old);assert.ok(delta>0);
 const accepted=accept(c),after=accepted.world.clubs.find(t=>t.id===club.id)!;
 assert.equal(canonicalJson(c),before);assert.equal(after.reservedSalaryWon,club.reservedSalaryWon+delta);assert.equal(accepted.world.contracts[key]!.servicePay!.reservedGameDays,remaining(c,'FUTURES',day));assert.equal(canonicalJson(accepted.world.contracts[key]!.servicePay!.ledger),ledger);assert.ok(!after.firstTeam.includes(key));assert.ok(after.firstTeam.includes(c.protagonistKey));assert.equal(accepted.events.at(-1)!.status,'RESOLVED');
});

test('E09 refuses an unfunded returned NPC demotion without consuming its event or changing either roster',()=>{
 const {c,key,day}=offered(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,old=c.world.contracts[key]!,next=structuredClone(old);next.servicePay!.reservedGameDays=remaining(c,'FUTURES',day);const delta=kboContractSeasonCharge(next)-kboContractSeasonCharge(old);assert.ok(delta>0);
 // Isolate the budget boundary with less room than this registration change requires.
 club.budgetWon=Math.floor((club.paidSalaryWon+club.reservedSalaryWon+delta-1)/10_000)*10_000;assert.ok(kboClubBalance(c.world,club.id).availableWon<delta);
 const before=canonicalJson(c);assert.throws(()=>accept(c),/CALLUP_BUDGET_CAPACITY_REQUIRED/);assert.equal(canonicalJson(c),before);assert.equal(c.events.at(-1)!.status,'OPEN');assert.ok(club.firstTeam.includes(key));assert.ok(!club.firstTeam.includes(c.protagonistKey));
});

test('E09 funds both resumed service contracts using their combined promotion and demotion reservation',()=>{
 const {c,key,day}=offered(true),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,npc=c.world.contracts[key]!,own=c.world.contracts[c.protagonistKey]!,nextNpc=structuredClone(npc),nextOwn=structuredClone(own);
 nextNpc.servicePay!.reservedGameDays=remaining(c,'FUTURES',day);nextOwn.servicePay!.reservedGameDays=remaining(c,'KBO',day);
 const npcDelta=kboContractSeasonCharge(nextNpc)-kboContractSeasonCharge(npc),ownDelta=kboContractSeasonCharge(nextOwn)-kboContractSeasonCharge(own),net=npcDelta+ownDelta;assert.ok(npcDelta>0);assert.ok(ownDelta<0);
 club.budgetWon=Math.ceil((club.paidSalaryWon+club.reservedSalaryWon+Math.max(0,net))/10_000)*10_000;const available=kboClubBalance(c.world,club.id).availableWon;assert.ok(available>=net);assert.ok(available<npcDelta);
 const before=canonicalJson(c),accepted=accept(c),after=accepted.world.clubs.find(t=>t.id===club.id)!;
 assert.equal(canonicalJson(c),before);assert.equal(after.reservedSalaryWon,club.reservedSalaryWon+net);assert.deepEqual(accepted.world.contracts[key],nextNpc);assert.deepEqual(accepted.world.contracts[c.protagonistKey],nextOwn);assert.ok(after.firstTeam.includes(c.protagonistKey));assert.ok(!after.firstTeam.includes(key));
});

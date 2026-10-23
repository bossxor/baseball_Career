import {closeKboNpcMilitaryGrowth} from '../src/kbo-npc-military-growth.js';
import {naturalGrowthBudgetUnits,applyGrowthBudget,applyAging} from '../src/development.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {canonicalJson} from '../src/game.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {assertSangmuUnit} from '../src/kbo-sangmu-unit.js';
import {KBO_MONEY} from '@playball/rules';
import {enlistInSangmu} from '../src/kbo-military-program.js';
import {createKboServicePayroll,reserveKboNpcServiceRosterChange} from '../src/kbo-service-payroll.js';
import {signKboRequiredReplacement} from '../src/kbo-roster-repair.js';
import {kboClubBalance,kboFutureCommitmentWon} from '../src/kbo-finance.js';
import {kboServiceFutureCommitment} from '../src/kbo-service-payroll.js';
import {assertKboCareerRevision} from '../src/kbo-career-version.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {closeKboNpcMilitaryCalendarDay,returnKboNpcMilitaryPlayers,settleKboNpcMilitaryPayrollDay} from '../src/kbo-npc-military.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {offerKboRenewal,acceptKboRenewal,kboContractDecisionRequired} from '../src/kbo-renewal.js';

function ready(c:KboCareer){const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);}
function closeFirst(source:KboCareer){
 // Controlled regular clock plus real postseason/settlement/Y02, not a full18-month simulation.
 let c=ready(source);const all=Object.values(c.competitionSchedule!.leagues).flat(),first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-clock',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};closeKboNpcMilitaryCalendarDay(c,last);c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;return closeKboSeason(c,c.revision,true);
}
function renewed(c:KboCareer){if(!kboContractDecisionRequired(c))return c;const o=offerKboRenewal(c,c.revision);return acceptKboRenewal(o,o.revision,{eventKey:o.renewal!.eventKey,eventVersion:o.events.find(e=>e.eventKey===o.renewal!.eventKey)!.version});}
const cache=new Map<boolean,{c:KboCareer;keys:string[]}>();
function second(short=false){if(!cache.has(short)){const e=enteredKboCareer(),first=startSangmuCohort(e,e.revision),keys=Object.keys(first.world.suspendedContracts!);
 if(short)for(const key of keys){
  // Controlled one unpaid day is created at real first-block activation, never by rewinding a completed program.
  const contract=first.world.suspendedContracts![key]!,m=first.sangmu!.members[key]!;
  m.program=enlistInSangmu({worldKey:first.world.worldKey,playerKey:key,clubId:contract.clubId,selectionSeasonKey:String(Number(first.world.seasonKey)-1),contract,remainingPaidGameDays:1});
  contract.servicePay=createKboServicePayroll(contract,m.program,{...contract.servicePay!.returnDate});
 }
 const closed=renewed(closeFirst(first)),c=startNextKboSeason(closed,closed.revision);cache.set(short,{c,keys});}return structuredClone(cache.get(short)!);}

test('new real intake retains authentic unpaid contracts/future liabilities and rejects a downgraded root',()=>{
 const source=enteredKboCareer(),before=canonicalJson(source),c=startSangmuCohort(source,source.revision);assert.equal(c.schemaVersion,6);assert.equal(Object.keys(c.world.suspendedContracts!).length,20);assert.equal(canonicalJson(source),before);assert.deepEqual(c.world.rng,source.world.rng);
 for(const contract of Object.values(c.world.suspendedContracts!)){assert.equal(contract.servicePay!.ledger.resume,null);assert.equal(contract.servicePay!.ledger.receipts.length,0);assert.ok(!c.world.players[contract.playerKey]);assert.deepEqual(contract.servicePay!.ledger.contract,c.sangmu!.members[contract.playerKey]!.program.contract);}
 for(const club of c.world.clubs)for(const offset of [1,2,3])assert.equal(kboFutureCommitmentWon(c.world,club.id,offset),club.roster.reduce((n,k)=>n+kboServiceFutureCommitment(c.world.contracts[k]!,offset),0)+Object.values(c.world.suspendedContracts!).filter(v=>v.clubId===club.id).reduce((n,v)=>n+kboServiceFutureCommitment(v,offset),0));
 assert.doesNotThrow(()=>assertKboRecruitmentWorld(c.world));assert.doesNotThrow(()=>assertSangmuUnit(c.sangmu!,c.world));
 const old=structuredClone(c);old.schemaVersion=5;assert.throws(()=>assertKboCareerRevision(old,old.revision),/CAREER_REVISION_CHANGED/);
 const playing=ready(c);assert.equal(playing.schemaVersion,6);
});

test('actual Y02 carries frozen principal and funding, fixed June30 restores only the original Futures registration',()=>{
 const {c,keys}=second(),source=canonicalJson(c),enlisted=startSangmuCohort(c,c.revision),playing=ready(enlisted),due=playing.world.suspendedContracts![keys[0]!]!.servicePay!.returnDate.worldDay;
 const first=Math.min(...Object.values(playing.competitionSchedule!.leagues).flat().map(g=>g.worldDay));playing.days={...playing.days!,days:Array.from({length:due-first+1},(_,i)=>({day:first+i,evidence:'controlled-return-clock',result:{injured:[],recovered:[]}}))};playing.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due+1,pendingGame:null};
 closeKboNpcMilitaryCalendarDay(playing,due);
 for(const key of keys){if(!playing.world.players[key]){const m=playing.sangmu!.members[key]!;assert.equal(m.program.completedBlocks,2);assert.equal(playing.world.clubs.find(t=>t.id===m.program.originalClubId)!.roster.length,60);assert.ok(playing.world.suspendedContracts![key]!.servicePay!.ledger.resume);continue;}assert.ok(!playing.world.suspendedContracts![key]);assert.ok(!playing.sangmu!.members[key]);const contract=playing.world.contracts[key]!,club=playing.world.clubs.find(t=>t.id===contract.clubId)!;assert.ok(club.roster.includes(key));assert.ok(!club.firstTeam.includes(key));assert.equal(contract.servicePay!.ledger.resume!.completedWorldDay,due);assert.equal(contract.servicePay!.ledger.receipts.length,0);}
 assert.doesNotThrow(()=>assertSangmuUnit(playing.sangmu!,playing.world));assert.doesNotThrow(()=>assertKboRecruitmentWorld(playing.world));assert.equal(canonicalJson(c),source);
 const key=keys.find(k=>!!playing.world.players[k])!;assert.ok(key);const club=playing.world.contracts[key]!.clubId,game=playing.competitionSchedule!.leagues.FUTURES.find(g=>g.worldDay>due && [g.homeTeamKey,g.awayTeamKey].includes(club))!;
 playing.competitionSchedule!.leagues={KBO:[],FUTURES:[game]};playing.days={...playing.days!,days:[]};playing.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:game.worldDay,pendingGame:null};
 let a=playing;for(let i=0;i<150;i++){const r=advanceKboCareer(a,a.revision);a=r.career;if(r.daysClosed)break;}
 assert.equal(a.world.contracts[key]!.servicePay!.ledger.receipts.length,1);assert.equal(a.world.contracts[key]!.servicePay!.ledger.receipts[0]!.amountWon,Math.round(a.world.contracts[key]!.annualSalaryWon/144));assert.doesNotThrow(()=>assertKboRecruitmentWorld(a.world));
});


function returnedShort(league:'KBO'|'FUTURES'='FUTURES'){
 const {c,keys}=second(true),u=startSangmuCohort(c,c.revision),playing=ready(u),due=playing.world.suspendedContracts![keys[0]!]!.servicePay!.returnDate.worldDay,first=Math.min(...Object.values(playing.competitionSchedule!.leagues).flat().map(g=>g.worldDay));
 playing.days={...playing.days!,days:Array.from({length:due-first+1},(_,i)=>({day:first+i,evidence:'controlled-clock',result:{injured:[],recovered:[]}}))};playing.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due+1,pendingGame:null};closeKboNpcMilitaryCalendarDay(playing,due);
 const key=keys.find(k=>!!playing.world.players[k] && playing.world.contracts[k]!.clubId===playing.protagonistClubId)??keys.find(k=>!!playing.world.players[k])!;assert.ok(key);const club=playing.world.contracts[key]!.clubId;
 if(league==='KBO'){const team=playing.world.clubs.find(t=>t.id===club)!,p=playing.world.players[key]!,swap=team.firstTeam.find(k=>k!==playing.protagonistKey && playing.world.players[k]!.kind===p.kind && playing.world.players[k]!.position===p.position)!;assert.ok(swap);const first=team.firstTeam.map(k=>k===swap?key:k);assert.ok(reserveKboNpcServiceRosterChange(playing,club,first));team.firstTeam=first;}
 const games=playing.competitionSchedule!.leagues[league].filter(g=>g.worldDay>due && [g.homeTeamKey,g.awayTeamKey].includes(club)).slice(0,2);assert.equal(games.length,2);
 playing.competitionSchedule!.leagues={KBO:league==='KBO'?games:[],FUTURES:league==='FUTURES'?games:[]};settleKboNpcMilitaryPayrollDay(playing,due);playing.days={...playing.days!,days:[]};playing.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:games[0]!.worldDay,pendingGame:null};return {c:playing,key,games};
}
function finishDay(c:KboCareer){for(let i=0;i<150;i++){const r=advanceKboCareer(c,c.revision);c=r.career;assert.notEqual(r.stopReason,'ENGINE_LIMIT');if(r.daysClosed)return c;}throw Error('DAY_LIMIT');}

test('NPC principal exhaustion uses actual AI salary/demand/budget, signs only remaining days and preserves old receipts',()=>{
 const {c,key,games}=returnedShort(),before=canonicalJson(c),a=finishDay(c),b=finishDay(JSON.parse(before));assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);
 const contract=a.world.contracts[key]!;assert.ok(contract);assert.equal(contract.status,'ACTIVE_PRORATED');assert.equal(contract.remainderPay!.previous.servicePay.ledger.receipts.length,1);assert.equal(contract.remainderPay!.startAfterWorldDay,games[0]!.worldDay);assert.equal(contract.remainderPay!.reservedGameDays,1);assert.equal(contract.remainderPay!.receipts.length,0);
 let next=a;while(next.days!.days.at(-1)!.day<games[1]!.worldDay)next=finishDay(next);assert.equal(next.world.contracts[key]!.remainderPay!.receipts.length,1);assert.ok(next.world.contracts[key]!.remainderPay!.settlement);assert.doesNotThrow(()=>assertKboRecruitmentWorld(next.world));
});

test('unfunded NPC renewal enters FA with immutable paid-cost proof, no deleted money or protagonist decision',()=>{
 const {c,key}=returnedShort('KBO'),club=c.world.clubs.find(t=>t.id===c.world.contracts[key]!.clubId)!;
 // Controlled current-year ordinary salaries consume available budget without changing any future guarantee.
 let available=kboClubBalance(c.world,club.id).availableWon;
 for(const k of club.roster){const v=c.world.contracts[k]!;if(k===c.protagonistKey || v.years!==1 || v.servicePay || v.remainderPay)continue;const amount=Math.min(KBO_MONEY.maximumSalaryWon-v.annualSalaryWon,Math.floor(available/10_000)*10_000);v.annualSalaryWon+=amount;club.reservedSalaryWon+=amount;available-=amount;}
 assert.ok(available<10_000);assert.doesNotThrow(()=>assertKboRecruitmentWorld(c.world));const before=canonicalJson(c),out=finishDay(c);assert.equal(canonicalJson(c),before);
 assert.ok(!out.world.players[key]);assert.ok(!out.world.contracts[key]);assert.equal(out.freeAgents!.players[key]!.origin,'EXPIRED');assert.equal(out.freeAgents!.players[key]!.previousContract!.servicePay!.ledger.receipts.length,1);assert.ok(out.world.finance!.closedContracts!.some(v=>v.playerKey===key));assert.equal(out.world.clubs.find(t=>t.id===club.id)!.firstTeam.length,28);assert.doesNotThrow(()=>assertKboRecruitmentWorld(out.world));
 const corrupt=structuredClone(out);corrupt.world.finance!.closedContracts=[];assert.throws(()=>assertKboRecruitmentWorld(corrupt.world));
 const annual=closeKboNpcMilitaryGrowth(out).get(key)!;assert.ok(annual);const savedAge=out.freeAgents!.players[key]!.player.age;
 let closing=structuredClone(out);const setup=second(true).c,baseline=ready(startSangmuCohort(setup,setup.revision));closing.competitionSchedule!.leagues.FUTURES=baseline.competitionSchedule!.leagues.FUTURES;const fixtures=Object.values(closing.competitionSchedule!.leagues).flat(),start=Math.min(...fixtures.map(g=>g.worldDay)),last=Math.max(...fixtures.map(g=>g.worldDay)),receipts=new Map(closing.days!.days.map(d=>[d.day,d]));closing.days!.days=Array.from({length:last-start+1},(_,i)=>receipts.get(start+i)??{day:start+i,evidence:'controlled-unplayed-clock',result:{injured:[],recovered:[]}});closing.phaseContext={phase:'SEASON_REVIEW'};
 closing=startKboPostseason(closing,closing.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(closing,closing.revision);closing=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}closing=settleKboSeasonGrowth(closing,closing.revision).career;closing=closeKboSeason(closing,closing.revision,true);
 assert.deepEqual(closing.freeAgents!.players[key]!.player,annual.player);assert.deepEqual(closing.freeAgents!.settlement!.players[key],annual.result);assert.deepEqual(closing.seasonClose!.npcGrowth![key],annual.result);assert.equal(closing.freeAgents!.players[key]!.player.age,savedAge);

});


test('full original roster keeps completed ownership unregistered and resumes only when a real slot is available',()=>{
 const {c,keys}=second(),u=startSangmuCohort(c,c.revision),playing=ready(u),key=keys[0]!,old=playing.world.suspendedContracts![key]!,club=playing.world.clubs.find(t=>t.id===old.clubId)!,added:string[]=[];
 while(club.roster.length<60)added.push(signKboRequiredReplacement(playing.world,playing.freeAgents!,club.id,'CF',playing.difficulty).playerKey);
 const due=old.servicePay!.returnDate.worldDay,first=Math.min(...Object.values(playing.competitionSchedule!.leagues).flat().map(g=>g.worldDay));playing.days={...playing.days!,days:Array.from({length:due-first+1},(_,i)=>({day:first+i,evidence:'controlled-clock',result:{injured:[],recovered:[]}}))};playing.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due+1,pendingGame:null};
 closeKboNpcMilitaryCalendarDay(playing,due);assert.ok(!playing.world.players[key]);assert.equal(playing.sangmu!.members[key]!.program.completedBlocks,2);assert.ok(playing.world.suspendedContracts![key]!.servicePay!.ledger.resume);assert.equal(playing.world.suspendedContracts![key]!.servicePay!.ledger.receipts.length,0);assert.doesNotThrow(()=>assertSangmuUnit(playing.sangmu!,playing.world));
 // Controlled unused fixture slot, not an implemented user release command.
 const remove=added.at(-1)??club.roster.find(k=>!club.firstTeam.includes(k)&&k!==playing.protagonistKey&&!playing.world.contracts[k]!.servicePay)!;
 club.reservedSalaryWon-=playing.world.contracts[remove]!.annualSalaryWon;club.roster=club.roster.filter(k=>k!==remove);delete playing.world.players[remove];delete playing.world.contracts[remove];delete playing.world.repertoires[remove];
 returnKboNpcMilitaryPlayers(playing,due);assert.ok(playing.world.players[key]);assert.ok(!club.firstTeam.includes(key));assert.equal(playing.world.contracts[key]!.servicePay!.ledger.receipts.length,0);assert.doesNotThrow(()=>assertKboRecruitmentWorld(playing.world));
 const stable=canonicalJson(playing);returnKboNpcMilitaryPlayers(playing,due);assert.equal(canonicalJson(playing),stable);
 const corrupt=structuredClone(playing),record=Object.values(corrupt.sangmu!.npcReturns!)[0]!;record.program.originalClubId='foreign';assert.throws(()=>assertSangmuUnit(corrupt.sangmu!,corrupt.world));
});

test('NPC service blocks never finish early or from skipped fixed dates, and orphaned suspension proof rejects',()=>{
 const {c,keys}=second(),u=startSangmuCohort(c,c.revision),playing=ready(u),due=playing.world.suspendedContracts![keys[0]!]!.servicePay!.returnDate.worldDay;
 playing.days={...playing.days!,days:[{day:due-1,evidence:'controlled-clock',result:{injured:[],recovered:[]}}]};closeKboNpcMilitaryCalendarDay(playing,due-1);assert.equal(playing.sangmu!.members[keys[0]!]!.program.completedBlocks,1);
 playing.days.days=[{day:due+1,evidence:'controlled-missed-date',result:{injured:[],recovered:[]}}];assert.throws(()=>closeKboNpcMilitaryCalendarDay(playing,due+1),/NPC_MILITARY_COMPLETION_DAY_MISSED/);
 const corrupt=structuredClone(c);delete (corrupt.sangmu!.members as Record<string,unknown>)[keys[0]!];assert.throws(()=>assertSangmuUnit(corrupt.sangmu!,corrupt.world),/INVALID_NPC_SERVICE_OWNER/);
 const wrong=structuredClone(c);wrong.world.suspendedContracts![keys[0]!]!.servicePay!.ledger.contract.totalRemainingWon++;assert.throws(()=>assertKboRecruitmentWorld(wrong.world));
});


test('authentic serving NPCs receive one annual PRO budget and one aging application without mutating source',()=>{
 const entry=enteredKboCareer(),c=startSangmuCohort(entry,entry.revision),playing=ready(c),key=Object.keys(c.world.suspendedContracts!)[0]!;
 playing.sangmu!.members[key]!.player.age=33;
 const before=canonicalJson(playing),W=playing.world.calendar.growthDays.length,p=playing.sangmu!.members[key]!.player;
 const units=naturalGrowthBudgetUnits(p,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:0,pitcherRole:p.position==='RP'?'RP':p.position==='CP'?'CP':'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:playing.difficulty,beneficiary:false}}]);
 const expected=applyAging(applyGrowthBudget(p,units).player,1),first=closeKboNpcMilitaryGrowth(playing),second=closeKboNpcMilitaryGrowth(playing);
 assert.equal(first.size,Object.keys(playing.world.suspendedContracts!).length);assert.equal(first.get(key)!.result.budgetUnits,units);assert.deepEqual(first.get(key)!.player,expected.player);assert.deepEqual(first,second);assert.equal(canonicalJson(playing),before);
 const closed=closeFirst(c);for(const k of Object.keys(c.world.suspendedContracts!)){assert.ok(closed.seasonClose!.npcGrowth![k]);assert.equal(closed.sangmu!.members[k]!.player.age,c.sangmu!.members[k]!.player.age);}
 const next=startNextKboSeason(renewed(closed),renewed(closed).revision);for(const k of Object.keys(c.world.suspendedContracts!)){assert.equal(next.sangmu!.members[k]!.player.age,c.sangmu!.members[k]!.player.age+1);assert.deepEqual(next.sangmu!.members[k]!.player.abilities,closed.sangmu!.members[k]!.player.abilities);}
});


let armyGrowthCache:KboCareer|undefined;
function armyGrowthGame(){
 if(!armyGrowthCache){const entry=enteredKboCareer();let c=ready(startSangmuCohort(entry,entry.revision));for(let i=0;i<300;i++){const r=advanceKboCareer(c,c.revision);c=r.career;if(r.daysClosed && Object.values(c.records.games).some(g=>g.scope.leagueKey==='FUTURES' && Object.hasOwn(g.teams,'SANGMU')))break;}armyGrowthCache=c;}
 return structuredClone(armyGrowthCache);
}

test('NPC army growth counts only actual health registration and rejects double booking or missing registration',()=>{
 const c=armyGrowthGame(),game=Object.values(c.records.games).find(g=>g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,'SANGMU'))!,key=Object.keys(game.batting).find(k=>c.sangmu!.members[k] && game.batting[k]!.PA>0)!;assert.ok(key);
 const player=c.sangmu!.members[key]!.player,W=c.world.calendar.growthDays.length,expected=naturalGrowthBudgetUnits(player,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:game.batting[key]!.PA,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:false}}]);
 assert.equal(closeKboNpcMilitaryGrowth(c).get(key)!.result.budgetUnits,expected);
 const doubled=structuredClone(c),other=doubled.health.games.find(g=>g.evidence.seasonKey===c.world.seasonKey && g.evidence.day===game.worldDay && g.evidence.teamKey!=='FUTURES:SANGMU')!;assert.ok(other);other.evidence.roster=[...other.evidence.roster,key];assert.throws(()=>closeKboNpcMilitaryGrowth(doubled),/DOUBLE_BOOKED_GROWTH_DAY/);
 const missing=structuredClone(c);for(const h of missing.health.games)h.evidence.roster=h.evidence.roster.filter(k=>k!==key);assert.throws(()=>closeKboNpcMilitaryGrowth(missing),/INVALID_NPC_GROWTH_REGISTRATION/);
});

test('serving NPC rehabilitation uses actual injured registrations and survives season-end major-injury healing',()=>{
 let c=armyGrowthGame();const first=Object.values(c.records.games).find(g=>g.scope.phase==='REGULAR' && Object.hasOwn(g.teams,'SANGMU'))!,key=Object.keys(first.batting).find(k=>c.sangmu!.members[k] && first.batting[k]!.PA>0 && !c.days!.days.some(d=>d.result.injured.includes(k)))!;assert.ok(key);
 c.health.injuries[key]={severity:'MAJOR',remainingTeamGames:null,diagnosedGameKey:first.gameKey,seasonKey:c.world.seasonKey};c.days!.days.find(d=>d.day===first.worldDay)!.result.injured.push(key);c.health.games.find(h=>h.evidence.gameKey===first.gameKey && h.evidence.teamKey==='FUTURES:SANGMU')!.result.injured.push(key);
 for(let i=0;i<300;i++){const r=advanceKboCareer(c,c.revision);c=r.career;if(r.daysClosed && c.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey && h.evidence.teamKey==='FUTURES:SANGMU').length>=2)break;}
 const result=closeKboNpcMilitaryGrowth(c).get(key)!,player=c.sangmu!.members[key]!.player,W=c.world.calendar.growthDays.length,expected=naturalGrowthBudgetUnits(player,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:first.batting[key]!.PA,pitcherRole:'SP',rehabRatio:.5,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:false}}]);assert.equal(result.result.budgetUnits,expected);
 const all=Object.values(c.competitionSchedule!.leagues).flat(),start=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay)),receipts=new Map(c.days!.days.map(d=>[d.day,d]));c.days!.days=Array.from({length:last-start+1},(_,i)=>receipts.get(start+i)??{day:start+i,evidence:'controlled-future-clock',result:{injured:[],recovered:[]}});c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};closeKboNpcMilitaryCalendarDay(c,last);c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}c=settleKboSeasonGrowth(c,c.revision).career;const closed=closeKboSeason(c,c.revision,true);assert.equal(closed.seasonClose!.npcGrowth![key]!.budgetUnits,expected);assert.ok(!closed.health.injuries[key]);assert.deepEqual(closed.sangmu!.members[key]!.player.abilities,result.player.abilities);
});

test('NPC return-season registrations share one annual growth budget and aging before Y02 preserves the result',()=>{
 const {c:setup,keys}=second();let c=ready(startSangmuCohort(setup,setup.revision));
 for(let i=0;i<300;i++){const r=advanceKboCareer(c,c.revision);c=r.career;if(r.daysClosed && Object.values(c.records.games).some(g=>g.scope.seasonKey===c.world.seasonKey && Object.hasOwn(g.teams,'SANGMU')))break;}
 const army=Object.values(c.records.games).find(g=>g.scope.seasonKey===c.world.seasonKey && Object.hasOwn(g.teams,'SANGMU'))!;assert.ok(army);
 const key=keys.find(k=>(army.batting[k]?.PA??0)>0 && !c.health.injuries[k] && c.world.clubs.find(t=>t.id===c.sangmu!.members[k]!.program.originalClubId)!.roster.length<60)!;assert.ok(key);
 // Controlled age boundary makes a duplicate aging application observable without simulating another decade.
 c.sangmu!.members[key]!.player.age=33;
 const opening=structuredClone(c.sangmu!.members[key]!.player),program=structuredClone(c.sangmu!.members[key]!.program),clubId=program.originalClubId,fullSchedule=structuredClone(c.competitionSchedule!.leagues),due=c.world.suspendedContracts![key]!.servicePay!.returnDate.worldDay;
 const returnedGame=fullSchedule.FUTURES.find(g=>g.worldDay>due && [g.homeTeamKey,g.awayTeamKey].includes(clubId))!;assert.ok(returnedGame);
 // Keep actual games/health; only the unplayed interval uses a controlled clock, not an 18-month simulation.
 const receipts=new Map(c.days!.days.map(d=>[d.day,d])),first=Math.min(...Object.values(fullSchedule).flat().map(g=>g.worldDay));
 c.days!.days=Array.from({length:due-first},(_,i)=>receipts.get(first+i)??{day:first+i,evidence:'controlled-between-registrations',result:{injured:[],recovered:[]}});
 c.competitionSchedule!.leagues={KBO:fullSchedule.KBO.filter(g=>Object.hasOwn(c.records.games,g.simulationKey)),FUTURES:[...fullSchedule.FUTURES.filter(g=>Object.hasOwn(c.records.games,g.simulationKey)),returnedGame]};
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due,pendingGame:null};c=finishDay(c);
 assert.equal(c.days!.days.at(-1)!.day,due);assert.ok(c.world.players[key]);assert.ok(!c.sangmu!.members[key]);assert.ok(!c.world.clubs.find(t=>t.id===clubId)!.firstTeam.includes(key));
 assert.equal(c.world.contracts[key]!.servicePay!.ledger.receipts.length,0);assert.deepEqual(c.world.contracts[key]!.servicePay!.ledger.contract,program.contract);
 while(c.days!.days.at(-1)!.day<returnedGame.worldDay)c=finishDay(c);
 const registrations=c.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey && h.evidence.roster.includes(key));
 assert.equal(registrations.length,2);assert.deepEqual(registrations.map(h=>h.evidence.teamKey),['FUTURES:SANGMU','FUTURES:'+clubId]);assert.ok(!c.health.injuries[key]);
 const contract=structuredClone(c.world.contracts[key]!);assert.equal(contract.servicePay!.ledger.receipts.length,1);assert.equal(contract.servicePay!.ledger.receipts[0]!.gameKey,returnedGame.simulationKey);
 const W=c.world.calendar.growthDays.length,cut=c.world.calendar.growthDays.filter(day=>day<=due).length,returned=c.records.games[returnedGame.simulationKey]!,policy={mode:'CAREER' as const,difficulty:c.difficulty,beneficiary:false};
 const budget=naturalGrowthBudgetUnits(opening,W,[{startDay:0,endDay:cut,levelSeasonDays:W,level:'PRO',appearances:army.batting[key]!.PA,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy},{startDay:cut,endDay:W,levelSeasonDays:W,level:'PRO',appearances:returned.batting[key]?.PA??0,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy}]);
 const grown=applyGrowthBudget(opening,budget),expected=applyAging(grown.player,1),sum=(values:Record<string,number>)=>Object.values(values).reduce((a,b)=>a+b,0);
 c.competitionSchedule!.leagues=fullSchedule;const last=Math.max(...Object.values(fullSchedule).flat().map(g=>g.worldDay)),playedDays=new Map(c.days!.days.map(d=>[d.day,d]));
 c.days!.days=Array.from({length:last-first+1},(_,i)=>playedDays.get(first+i)??{day:first+i,evidence:'controlled-after-registrations',result:{injured:[],recovered:[]}});c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};closeKboNpcMilitaryCalendarDay(c,last);c.phaseContext={phase:'SEASON_REVIEW'};
 c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;const before=canonicalJson(c),closed=closeKboSeason(c,c.revision,true);assert.equal(canonicalJson(c),before);
 assert.deepEqual(closed.world.players[key]!.abilities,expected.player.abilities);assert.deepEqual(closed.world.players[key]!.potential,opening.potential);assert.deepEqual(closed.world.players[key]!.careerPeaks,expected.player.careerPeaks);assert.equal(closed.world.players[key]!.age,33);
 assert.deepEqual(closed.seasonClose!.npcGrowth![key],{budgetUnits:budget,gainedUnits:grown.gains.reduce((a,b)=>a+b,0),agingLossUnits:sum(grown.player.abilities)-sum(expected.player.abilities)});assert.deepEqual(closed.world.contracts[key],contract);
 assert.throws(()=>closeKboSeason(closed,closed.revision,true),/INVALID_KBO_SEASON_CLOSE/);
 const nextSource=renewed(closed),next=startNextKboSeason(nextSource,nextSource.revision);
 assert.equal(next.world.players[key]!.age,34);assert.deepEqual(next.world.players[key]!.abilities,closed.world.players[key]!.abilities);assert.deepEqual(next.world.contracts[key]!.servicePay!.ledger,contract.servicePay!.ledger);assert.deepEqual(next.records,closed.records);assert.deepEqual(next.proSeasons!.at(-1)!.seasonClose,closed.seasonClose);
});

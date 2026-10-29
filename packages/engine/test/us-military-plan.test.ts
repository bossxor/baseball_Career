import {usGameContext,usMajorCallupAdditionalUsd} from '../src/us-season.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsMajorFixture} from './us-major-fixture.js';
import {closedUsOptionCareer as closedOptionCareer} from './us-option-fixture.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startUsMilitaryWorld,usSalaryEntitlement,salaryContractKey,assertUsSeason} from '../src/us-season.js';
import {auditUsClosedDays} from '../src/us-growth.js';
import {canonicalJson} from '../src/game.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {usMilitaryPlanPreview,chooseUsMilitaryPlan,completeUsMilitaryService,settleUsMilitaryServiceBlock,usMilitaryCompletionDays,assertUsMilitaryPlayable,startUsMilitaryServiceSeason,recordUsMilitaryClosedDay,usMilitaryServiceView,confirmUsMilitaryReturn,declineUsMilitaryReturn} from '../src/us-military-plan.js';
import {usYearTransitionReadiness,startNextUsMinorSeason} from '../src/us-year-transition.js';
import type {UsCareer} from '../src/us-career-entry.js';
import * as military from '../src/us-military-plan.js';

/** Controlled scheduled rows, never evidence of native competitive service seasons. No dates/blocks are assigned directly. */
function closeControlledServiceDates(c:UsCareer,through:number):UsCareer {
 const next=structuredClone(c),s=next.season!,all=Object.values(next.seasonSchedule!.leagues).flat();
 for(let day=(s.days.at(-1)?.day??s.firstDay-1)+1;day<=through;day++){
  const games=all.filter(g=>g.worldDay===day).map(g=>{const row={gameKey:g.simulationKey,worldDay:day,scope:{seasonKey:next.world.seasonKey,leagueKey:g.leagueKey,phase:'REGULAR' as const},teams:{[g.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},[g.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};next.records.games[g.simulationKey]=row;next.records.revision++;return row;});
  s.days.push({day,evidence:canonicalJson(games),level:next.registration.level,appearances:0,rehabilitating:false,injured:[],recovered:[]});const entryKey=JSON.stringify(['us-salary',salaryContractKey(next,day),next.world.seasonKey,day]),amount=usSalaryEntitlement(next,s.days.length)-s.paidUsd;s.paidUsd+=amount;s.payroll=[...s.payroll,{day,amount,entryKey}];next.income=[...next.income,{entryKey,kind:'SALARY',currency:'USD',seasonKey:next.world.seasonKey,day,amount}];if(next.military.service!.returnOption?.status!=='CONFIRMED')recordUsMilitaryClosedDay(next,day);
 }
 next.phaseContext=through===s.lastDay?{phase:'SEASON_REVIEW'}:{phase:'SEASON_PROGRESS',nextWorldDay:through+1,pendingGame:null};next.revision++;assertUsSeason(next,next.revision);auditUsClosedDays(next);return next;
}

const dischargedCache=new Map<string,UsCareer>();
function controlledDischargedOption(kind:'HITTER'|'PITCHER'='PITCHER'):UsCareer {
 if(dischargedCache.has(kind))return structuredClone(dischargedCache.get(kind)!);
 const source=closedOptionCareer(kind),chosen=chooseUsMilitaryPlan(source,source.revision,'FREEZE');let first=startUsMilitaryServiceSeason(chosen,chosen.revision);first=startUsMilitaryWorld(first,first.revision);first=closeControlledServiceDates(first,first.season!.lastDay);
 let second=startUsMilitaryServiceSeason(first,first.revision);second=startUsMilitaryWorld(second,second.revision);second=closeControlledServiceDates(second,second.military.service!.completionDays[1]!.worldDay);const discharged=completeUsMilitaryService(second,second.revision);dischargedCache.set(kind,discharged);return structuredClone(discharged);
}

/** Advances sealed calendar identity only; not a substitute for native year-transition play. */
function atServiceSeason(c:UsCareer,seasonKey:string):UsCareer {
 const next=structuredClone(c),calendar=createSeasonCalendar(Number(seasonKey));
 next.world={...next.world,seasonKey,calendar};next.registration={...next.registration,seasonKey};next.contract={...next.contract,seasonKey};
 for(const key of Object.keys(next.world.repertoires))next.world.repertoires[key]={...next.world.repertoires[key]!,seasonId:seasonKey};
 next.phaseContext={phase:'SEASON_REVIEW'};return next;
}

test('termination stops the active US contract and rejects fabricated service-season identity',()=>{
 const c=closedUsMajorFixture();c.world.players[c.protagonistKey]!.age=27;c.military={status:'UNRESOLVED',deadlineAge:28};c.contract.militaryReturnOption=false;
 assert.ok(usYearTransitionReadiness(c).blockers.includes('MILITARY_PLAN_REQUIRED'));assert.deepEqual(usMilitaryPlanPreview(c).choices,['TERMINATE']);
 assert.throws(()=>chooseUsMilitaryPlan(c,c.revision,'FREEZE'),/REFUSED|UNAVAILABLE/);
 const raw=canonicalJson(c),ended=chooseUsMilitaryPlan(c,c.revision,'TERMINATE');assert.equal(canonicalJson(c),raw);assert.equal(ended.military.status,'TERMINATED_SERVICE');assert.equal(ended.registration.status,'INJURED');
 assert.equal(ended.contract.status,'TERMINATED');
 assert.ok((ended.world.reserves?.[ended.protagonistOrganizationId]??[]).includes(ended.protagonistKey));
 assert.ok(ended.military.service);assert.equal(ended.military.service!.scheduledBlocks,2);assert.equal(ended.military.service!.completedBlocks,0);
 assert.throws(()=>completeUsMilitaryService(ended,ended.revision),/INCOMPLETE/);
 const days=usMilitaryCompletionDays(ended.military.planSeasonKey!);
 assert.throws(()=>settleUsMilitaryServiceBlock(atServiceSeason(ended,days[0]!.seasonKey),ended.revision),/CALENDAR|DAY|EVIDENCE/);
 assert.throws(()=>assertUsMilitaryPlayable(ended),/NOT_PLAYABLE/);
 assert.ok(usYearTransitionReadiness(ended).blockers.includes('MILITARY_SERVICE_ACTIVE'));
 assert.throws(()=>confirmUsMilitaryReturn(ended,ended.revision),/NOT_AVAILABLE/);
});

test('service annual owner ages and supplies the real roster without paying or rewriting history',()=>{
 const source=closedUsMajorFixture();source.world.players[source.protagonistKey]!.age=27;
 const chosen=chooseUsMilitaryPlan(source,source.revision,'TERMINATE'),raw=canonicalJson(chosen),year=startUsMilitaryServiceSeason(chosen,chosen.revision);
 assert.equal(canonicalJson(chosen),raw);assert.equal(year.world.seasonKey,String(Number(source.world.seasonKey)+1));assert.equal(year.world.players[year.protagonistKey]!.age,28);
 assert.deepEqual(year.income,source.income);assert.deepEqual(year.records,source.records);assert.deepEqual(year.rights,source.rights);assert.deepEqual(year.military.service!.sourceInventory,source.inventory);assert.deepEqual(year.inventory.clubs,source.inventory.clubs);assert.equal(year.inventory.seasonKey,year.world.seasonKey);assert.deepEqual(year.inventory.registeredPlayerKeys,Object.keys(year.world.players).sort());
 assert.equal(year.contract.status,'TERMINATED');assert.equal(year.military.service!.sourceContract!.status,'ACTIVE');assert.equal(year.military.service!.sourceSeason!.paidUsd,source.season!.paidUsd);
 assert.deepEqual(year.military.service!.years?.[0]?.postseason,source.postseason);
 assert.deepEqual(usMilitaryServiceView(JSON.parse(JSON.stringify(year))),usMilitaryServiceView(year));
 assert.throws(()=>startUsMilitaryServiceSeason(chosen,chosen.revision-1),/STALE/);
 assert.throws(()=>startUsMilitaryServiceSeason(year,year.revision),/NOT_READY/);
 assert.throws(()=>recordUsMilitaryClosedDay(year,year.military.service!.cursor!.worldDay+1),/EVIDENCE/);
 const forged=structuredClone(year);forged.military.service!.blocks[0]!.completedWorldDay=forged.military.service!.completionDays[0]!.worldDay;forged.military.service!.completedBlocks=1;
 assert.throws(()=>usMilitaryServiceView(forged),/SERVICE_BLOCK/);
});

test('freeze parks the pitcher under the already signed option and preserves original USD and pitch history',()=>{
 const source=closedOptionCareer(),key=source.protagonistKey,raw=canonicalJson(source),frozen=chooseUsMilitaryPlan(source,source.revision,'FREEZE');
 assert.equal(canonicalJson(source),raw);assert.equal(frozen.contract.status,'FROZEN');assert.equal(frozen.military.status,'FROZEN_SERVICE');assert.equal(frozen.registration.status,'INJURED');
 assert.ok(!Object.values(frozen.world.organizations.find(o=>o.id===frozen.protagonistOrganizationId)!.levels).flat().includes(key));
 assert.deepEqual(frozen.income,source.income);assert.deepEqual(frozen.records,source.records);assert.deepEqual(frozen.world.repertoires[key],source.world.repertoires[key]);assert.deepEqual(frozen.rights,source.rights);
 assert.throws(()=>assertUsMilitaryPlayable(frozen),/NOT_PLAYABLE/);assert.throws(()=>confirmUsMilitaryReturn(frozen,frozen.revision),/NOT_AVAILABLE/);
 const resumed=JSON.parse(JSON.stringify(frozen)) as UsCareer;assert.deepEqual(usMilitaryServiceView(resumed),usMilitaryServiceView(frozen));
});

test('controlled calendar discharge opens only the existing option and confirms through day29 without retroactive salary',()=>{
 const source=controlledDischargedOption(),option=source.military.service!.returnOption!,raw=canonicalJson(source);
 assert.equal(source.military.status,'COMPLETED');assert.equal(option.expiresWorldDay-option.issuedWorldDay,30);assert.equal(source.contract.status,'FROZEN');assert.equal(source.season!.paidUsd,0);assert.equal(source.military.service!.years!.length,2);
 const last=closeControlledServiceDates(source,option.expiresWorldDay-1),confirmed=confirmUsMilitaryReturn(last,last.revision);
 assert.equal(canonicalJson(source),raw);assert.equal(confirmed.contract.status,'ACTIVE');assert.equal(confirmed.military.service!.returnOption!.effectiveWorldDay,option.expiresWorldDay);assert.equal(confirmed.registration.status,'ACTIVE');assert.deepEqual(confirmed.records,last.records);assert.deepEqual(confirmed.income,last.income);assertUsMilitaryPlayable(confirmed);assertUsSeason(confirmed,confirmed.revision);
 assert.deepEqual(confirmUsMilitaryReturn(JSON.parse(JSON.stringify(last)),last.revision),confirmed);assert.throws(()=>confirmUsMilitaryReturn(last,last.revision-1),/STALE/);assert.throws(()=>confirmUsMilitaryReturn(confirmed,confirmed.revision),/NOT_AVAILABLE/);
});

test('controlled30day expiry terminates the frozen contract without manufacturing another option',()=>{
 const source=controlledDischargedOption(),option=source.military.service!.returnOption!,expired=closeControlledServiceDates(source,option.expiresWorldDay);
 assert.equal(expired.military.service!.returnOption!.status,'EXPIRED');assert.equal(expired.contract.status,'TERMINATED');assert.equal(expired.military.service!.returnOption!.optionId,option.optionId);assert.equal(expired.season!.paidUsd,0);
 assert.throws(()=>confirmUsMilitaryReturn(expired,expired.revision),/NOT_AVAILABLE/);assert.throws(()=>assertUsMilitaryPlayable(expired),/NOT_PLAYABLE/);
 const declined=declineUsMilitaryReturn(source,source.revision);assert.equal(declined.contract.status,'TERMINATED');assert.equal(declined.military.service!.returnOption!.status,'DECLINED');
});

test('service resume rejects removed native closed dates and altered archived game evidence',()=>{
 const source=controlledDischargedOption(),missing=structuredClone(source),changed=structuredClone(source);
 missing.military.service!.closedDays=missing.military.service!.completionDays;
 assert.throws(()=>usMilitaryServiceView(missing),/CALENDAR|DAY|ARCHIVE/);
 changed.military.service!.years![1]!.season.days[0]!.evidence='[]';
 assert.throws(()=>usMilitaryServiceView(changed),/ARCHIVE|EVIDENCE/);
});

test('return preserves existing unique field positions when selecting a legal roster slot',()=>{
 const source=controlledDischargedOption('HITTER'),org=source.world.organizations.find(o=>o.id===source.protagonistOrganizationId)!,level=source.military.service!.returnOption!.level;
 const catcher=org.levels[level].find(k=>source.world.players[k]!.position==='C')!;assert.ok(catcher);
 const confirmed=confirmUsMilitaryReturn(source,source.revision),returned=confirmed.world.organizations.find(o=>o.id===org.id)!;
 assert.ok(returned.levels[level].includes(catcher));assert.equal(returned.levels[level].filter(k=>confirmed.world.players[k]!.kind==='HITTER').length,org.levels[level].filter(k=>source.world.players[k]!.kind==='HITTER').length);
});

test('service annual supply preserves a retiring45yearold pitcher and his historical repertoire across JSON',()=>{
 const source=closedUsMajorFixture(),key=Object.keys(source.world.players).find(k=>k!==source.protagonistKey&&source.world.players[k]!.kind==='PITCHER')!;
 source.world.players[key]!.age=45;const original=structuredClone(source.world.players[key]!),book=structuredClone(source.world.repertoires[key]!),records=structuredClone(source.records),chosen=chooseUsMilitaryPlan(source,source.revision,'TERMINATE'),raw=canonicalJson(chosen),next=startUsMilitaryServiceSeason(chosen,chosen.revision),receipt=next.military.service!.supply![0]!;
 assert.equal(canonicalJson(chosen),raw);assert.equal(next.world.players[key],undefined);assert.equal(next.world.repertoires[key],undefined);assert.deepEqual(next.records,records);
 const retired=receipt.retired.find(p=>p.playerKey===key)!;assert.deepEqual(retired.player,original);assert.deepEqual(retired.repertoire,book);assert.equal(retired.lastSeasonKey,source.world.seasonKey);assert.ok(receipt.arrivals.length);
 assert.deepEqual(usMilitaryServiceView(JSON.parse(JSON.stringify(next))),usMilitaryServiceView(next));assert.deepEqual(next.military.service!.years![0]!.season.openingPlayers[key],source.season!.openingPlayers[key]);
});

test('controlled minor return resumes the next annual contract without consuming a frozen full season',()=>{
 const discharged=controlledDischargedOption(),returned=confirmUsMilitaryReturn(discharged,discharged.revision),closed=finishedUsCareerFixture(closeControlledServiceDates(returned,returned.season!.lastDay)),funding=closed.inventory.clubs.map(c=>({organizationId:c.id,addedBudgetUsd:3_000_000}));
 const next=startNextUsMinorSeason(closed,closed.revision,funding);
 assert.equal(next.world.seasonKey,String(Number(closed.world.seasonKey)+1));assert.deepEqual(next.income,closed.income);assert.deepEqual(next.records,closed.records);assert.equal(next.contract.contractKey,returned.contract.contractKey);
 assert.equal(usYearTransitionReadiness(closed).controlSeasonsUsed,2);assert.equal(usYearTransitionReadiness(next).controlSeasonsUsed,3);assert.deepEqual(usMilitaryServiceView(JSON.parse(JSON.stringify(next))),usMilitaryServiceView(next));
});

test('active US return condition counts six registered bench games, excludes INT and never changes abilities',()=>{
 assert.equal(typeof military.usMilitaryReturnConditionMultiplier,'function');
 const source=controlledDischargedOption(),c=confirmUsMilitaryReturn(source,source.revision),key=c.protagonistKey,abilities=canonicalJson(c.world.players[key]!.abilities),effective=c.military.service!.returnOption!.effectiveWorldDay!,club=c.protagonistOrganizationId;
 assert.equal(military.usMilitaryReturnConditionMultiplier(c),.95);
 assert.equal(usGameContext(c,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,protagonistKey:key,leagueKey:c.registration.level,schools:[],repertoires:{},players:c.world.players} as Parameters<typeof usGameContext>[1]).conditionMultipliers?.[key],.95);
 c.health.games=[...c.health.games,{evidence:{gameKey:'controlled-int-return-rest',teamKey:'INT:'+club,seasonKey:c.world.seasonKey,day:effective,roster:[key],appearances:[]},result:{injured:[],recovered:[]}}];assert.equal(military.usMilitaryReturnConditionMultiplier(c),.95);
 for(let i=0;i<6;i++){const gameKey='controlled-us-return-health-'+i,day=effective+i;c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:c.registration.level,phase:'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},other:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:c.registration.level+':'+club,seasonKey:c.world.seasonKey,day,roster:[key],appearances:[]},result:{injured:[],recovered:[]}}];assert.equal(military.usMilitaryReturnConditionMultiplier(c),i<5?.95:1);}
 assert.equal(usGameContext(c,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,protagonistKey:key,leagueKey:c.registration.level,schools:[],repertoires:{},players:c.world.players} as Parameters<typeof usGameContext>[1]).conditionMultipliers,undefined);
 assert.equal(usGameContext(c,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,seed:c.world.seed,protagonistKey:key,leagueKey:c.registration.level,schools:[],repertoires:{},players:{}} as Parameters<typeof usGameContext>[1]).conditionMultipliers,undefined);
 assert.equal(canonicalJson(c.world.players[key]!.abilities),abilities);
 const dup=structuredClone(c);dup.health.games=[...dup.health.games,dup.health.games.at(-1)!];assert.throws(()=>military.usMilitaryReturnConditionMultiplier(dup),/DOUBLE_BOOKED/);
});


test('controlled return-year MLB activation preserves pre-callup salary and validates derived contract and budget',()=>{
 const returned=confirmUsMilitaryReturn(controlledDischargedOption(),controlledDischargedOption().revision),c=structuredClone(returned),s=c.season!,effectiveDay=c.military.service!.returnOption!.effectiveWorldDay!+10,closedDays=effectiveDay-s.firstDay,oldPaid=usSalaryEntitlement(c,closedDays),extra=usMajorCallupAdditionalUsd(c,effectiveDay),base=c.contract;
 s.majorActivation={contractKey:JSON.stringify(['us-major-entry',base.contractKey,c.world.seasonKey]),fromContractKey:base.contractKey,effectiveDay,annualSalaryUsd:800000,reservedAdditionalUsd:extra};c.contract={...base,type:'US_MAJOR',contractKey:s.majorActivation.contractKey,annualSalaryUsd:800000};c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd-=extra;
 assert.equal(usSalaryEntitlement(c,closedDays),oldPaid);
 const games=Object.values(c.seasonSchedule!.leagues).flat(),first=Math.min(...games.map(g=>g.worldDay)),last=Math.max(...games.map(g=>g.worldDay)),start=Math.max(first,c.military.service!.returnOption!.effectiveWorldDay!);
 assert.equal(usSalaryEntitlement(c,closedDays+1),Math.floor((30000*(effectiveDay-start)+800000)/(last-first+1)));
 assert.equal(usMilitaryServiceView(c).contractStatus,'ACTIVE');
 const bad=structuredClone(c);bad.season!.majorActivation!.reservedAdditionalUsd++;assert.throws(()=>usMilitaryServiceView(bad),/ACTIVATION/);
 assert.deepEqual(c.military.service!.returnContract,returned.military.service!.returnContract);
});

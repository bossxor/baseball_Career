import test from 'node:test';
import assert from 'node:assert/strict';
import {closedUsMajorFixture} from './us-major-fixture.js';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {closeSchoolSeasonForUs} from '../src/us-entry.js';
import {startSignedUsCareer} from '../src/us-career-entry.js';
import {setUsPreseasonArchetype,confirmUsPreseasonPlan,unreadUsFirstCampNotices,resolveUsFirstCampNotice} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import {finishedUsCareerFixture} from './us-finished-fixture.js';
import {startUsMilitaryWorld,usSalaryEntitlement,salaryContractKey,assertUsSeason} from '../src/us-season.js';
import {auditUsClosedDays} from '../src/us-growth.js';
import {canonicalJson} from '../src/game.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {usMilitaryPlanPreview,chooseUsMilitaryPlan,completeUsMilitaryService,settleUsMilitaryServiceBlock,usMilitaryCompletionDays,assertUsMilitaryPlayable,startUsMilitaryServiceSeason,recordUsMilitaryClosedDay,usMilitaryServiceView,confirmUsMilitaryReturn,declineUsMilitaryReturn} from '../src/us-military-plan.js';
import {usYearTransitionReadiness} from '../src/us-year-transition.js';
import type {UsCareer} from '../src/us-career-entry.js';

/** Existing option is negotiated in real signing commands; regular/PS contribution rows remain controlled fixtures. */
function closedOptionCareer(kind:'HITTER'|'PITCHER'='PITCHER'):UsCareer {
 const hs=completedHighSchoolCareer(800_000,kind),review=acknowledgeHighSchoolSeasonReview(hs,hs.revision),open=openHighSchoolCareerRoute(review,review.revision,1).career;
 const world=createUsRosterWorld({worldKey:open.world.worldKey,seasonKey:String(open.world.calendar!.year+1),seed:open.world.seed,difficulty:open.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US'+String(i+1).padStart(2,'0')}))});
 const inventory=initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:3_000_000,nationalReleaseAllowed:true,militaryReturnOption:true}))),prepared=prepareCareerUsDirect(open,open.revision,inventory),offer=careerUsDirectView(prepared).offers[0]!;
 const signed=decideCareerUsDirect(prepared,prepared.revision,{programVersion:1,decision:{type:'SIGN',offerKey:offer.offerKey},eventVersion:1}),closed=closeSchoolSeasonForUs(signed,signed.revision,true);let career=startSignedUsCareer(closed,closed.revision,world);
 career=setUsPreseasonArchetype(career,career.revision,career.world.players[career.protagonistKey]!.archetype);const event=unreadUsFirstCampNotices(career)[0]!;career=resolveUsFirstCampNotice(career,career.revision,{eventKey:event.eventKey,eventVersion:event.eventVersion,command:'ACK_EVENT'});career=confirmUsPreseasonPlan(career,career.revision);career=publishUsSeasonSchedule(career,career.revision);
 return finishedUsCareerFixture(career);
}

/** Controlled scheduled rows, never evidence of native competitive service seasons. No dates/blocks are assigned directly. */
function closeControlledServiceDates(c:UsCareer,through:number):UsCareer {
 const next=structuredClone(c),s=next.season!,all=Object.values(next.seasonSchedule!.leagues).flat();
 for(let day=(s.days.at(-1)?.day??s.firstDay-1)+1;day<=through;day++){
  const games=all.filter(g=>g.worldDay===day).map(g=>{const row={gameKey:g.simulationKey,worldDay:day,scope:{seasonKey:next.world.seasonKey,leagueKey:g.leagueKey,phase:'REGULAR' as const},teams:{[g.homeTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0},[g.awayTeamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};next.records.games[g.simulationKey]=row;next.records.revision++;return row;});
  s.days.push({day,evidence:canonicalJson(games),level:next.registration.level,appearances:0,rehabilitating:false,injured:[],recovered:[]});const entryKey=JSON.stringify(['us-salary',salaryContractKey(next,day),next.world.seasonKey,day]),amount=usSalaryEntitlement(next,s.days.length)-s.paidUsd;s.paidUsd+=amount;s.payroll=[...s.payroll,{day,amount,entryKey}];next.income=[...next.income,{entryKey,kind:'SALARY',currency:'USD',seasonKey:next.world.seasonKey,day,amount}];recordUsMilitaryClosedDay(next,day);
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
 assert.deepEqual(year.income,source.income);assert.deepEqual(year.records,source.records);assert.deepEqual(year.rights,source.rights);assert.deepEqual(year.inventory,source.inventory);
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

test('return preserves existing unique field positions when selecting a legal roster slot',()=>{
 const source=controlledDischargedOption('HITTER'),org=source.world.organizations.find(o=>o.id===source.protagonistOrganizationId)!,level=source.military.service!.returnOption!.level;
 const catcher=org.levels[level].find(k=>source.world.players[k]!.position==='C')!;assert.ok(catcher);
 const confirmed=confirmUsMilitaryReturn(source,source.revision),returned=confirmed.world.organizations.find(o=>o.id===org.id)!;
 assert.ok(returned.levels[level].includes(catcher));assert.equal(returned.levels[level].filter(k=>confirmed.world.players[k]!.kind==='HITTER').length,org.levels[level].filter(k=>source.world.players[k]!.kind==='HITTER').length);
});

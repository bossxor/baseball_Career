import {closeKboNpcMilitaryCalendarDay} from '../src/kbo-npc-military.js';
import {kboContractPaymentBalance} from '../src/kbo-contract-payments.js';
import {kboContractSeasonCharge,settleKboServicePayrollDay} from '../src/kbo-service-payroll.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {ABILITY_MAX_UNITS} from '@playball/rules';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {applyToSangmu,resolveSangmuApplication} from '../src/kbo-military-state.js';
import {kboMilitaryCompletionDays,kboMilitaryEventView,resolveKboMilitaryEvent,closeKboMilitaryCalendarDay} from '../src/kbo-military-events.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal,kboContractDecisionRequired} from '../src/kbo-renewal.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';

/** Controlled season-clock fixture, actual postseason; not a simulated eighteen-month season. */
function closed(c:KboCareer):KboCareer {
 const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);let g=startKboRegularSeason(s,s.revision);
 const all=[...g.competitionSchedule!.leagues.KBO,...g.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(x=>x.worldDay)),last=Math.max(...all.map(x=>x.worldDay));
 g.days={...g.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-clock',result:{injured:[],recovered:[]}}))};
 g.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last+1,pendingGame:null};closeKboMilitaryCalendarDay(g,last,g.phaseContext);closeKboNpcMilitaryCalendarDay(g,last);g.phaseContext={phase:'SEASON_REVIEW'};
 g=startKboPostseason(g,g.revision);for(let i=0;i<400;i++){const out=advanceKboPostseason(g,g.revision);g=out.career;if(out.stopReason==='POSTSEASON_COMPLETE')break;}
 g=settleKboSeasonGrowth(g,g.revision).career;return closeKboSeason(g,g.revision,true);
}
function renewed(c:KboCareer):KboCareer {if(!kboContractDecisionRequired(c))return c;const o=offerKboRenewal(c,c.revision);return acceptKboRenewal(o,o.revision,{eventKey:o.renewal!.eventKey,eventVersion:o.events.find(e=>e.eventKey===o.renewal!.eventKey)!.version});}
function enlisted():KboCareer {
 const c=closed(enteredKboCareer('HITTER')),p=c.world.players[c.protagonistKey]!,max=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,ABILITY_MAX_UNITS]));
 c.world.players[c.protagonistKey]={...p,abilities:{...max},potential:{...max},careerPeaks:{...max}};
 const a=applyToSangmu(c,c.revision);assert.equal(a.military!.applications.at(-1)!.accepted,true);const r=renewed(a);return resolveSangmuApplication(r,r.revision,'ENLIST');
}
function acknowledge(c:KboCareer,command='ADVANCE_SERVICE',focus?:readonly string[]){const e=kboMilitaryEventView(c)[0]!;return resolveKboMilitaryEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command,...(focus?{focus}:{})});}

test('fixed service calendar uses June30 in leap and ordinary years, independent of fixture counts',()=>{
 for(const [selection,day] of [['2030',181],['2031',180]] as const){const p=enlistInSangmu({worldKey:'w',playerKey:'p',clubId:'LG',selectionSeasonKey:selection,contract:{contractKey:'c',playerKey:'p',clubId:'LG',seasonKey:selection,years:2,annualSalaryWon:100_000_000,signingBonusWon:0,status:'ACTIVE'},remainingPaidGameDays:144});assert.equal(kboMilitaryCompletionDays(p)[1]!.worldDay,day);assert.equal(kboMilitaryCompletionDays(p)[1]!.seasonKey,String(Number(selection)+2));}
});

test('E52 confirms four focus choices through the existing plan command; invalid focus/version and replay preserve source',()=>{
 const e=enlisted(),n=startNextKboSeason(e,e.revision),view=kboMilitaryEventView(n);assert.equal(view.length,1);assert.equal(view[0]!.definitionId,'E52');assert.equal(n.events.find(x=>x.eventKey===view[0]!.eventKey)!.status,'OPEN');
 assert.doesNotMatch(JSON.stringify(view),/potential|seed|rng|sourceBasis/i);const before=JSON.stringify(n),focus=Object.keys(n.world.players[n.protagonistKey]!.abilities).slice(2,6);
 assert.throws(()=>acknowledge(n,'CHOOSE_FOCUS',focus.slice(0,2)));assert.equal(JSON.stringify(n),before);
 assert.throws(()=>resolveKboMilitaryEvent(n,n.revision,{eventKey:view[0]!.eventKey,eventVersion:view[0]!.eventVersion+1,command:'ADVANCE_SERVICE'}),/EVENT_VERSION_CHANGED/);
 const out=acknowledge(n,'CHOOSE_FOCUS',focus);assert.deepEqual(out.world.players[out.protagonistKey]!.focus,focus);assert.deepEqual(out.world.players[out.protagonistKey]!.abilities,n.world.players[n.protagonistKey]!.abilities);assert.equal(out.revision,n.revision+1);assert.equal(kboMilitaryEventView(out).length,0);assert.equal(JSON.stringify(n),before);
 assert.throws(()=>resolveKboMilitaryEvent(out,out.revision,{eventKey:view[0]!.eventKey,eventVersion:view[0]!.eventVersion,command:'ADVANCE_SERVICE'}));
 const kept=acknowledge(n);assert.deepEqual(kept.world.players[kept.protagonistKey]!.focus,n.world.players[n.protagonistKey]!.focus);
});

test('actual June30 date queue closes service once, E53 stops, following dates register only the original Futures club',()=>{
 const enlist=enlisted(),first=acknowledge(startNextKboSeason(enlist,enlist.revision)),firstUnit=startSangmuCohort(first,first.revision),firstClose=renewed(closed(firstUnit));
 assert.equal(kboContractSeasonCharge(first.world.contracts[first.protagonistKey]!),0);assert.equal(first.world.contracts[first.protagonistKey]!.servicePay!.ledger.receipts.length,0);assert.equal(kboContractDecisionRequired(firstClose),false);
 const next=startNextKboSeason(firstClose,firstClose.revision);assert.equal(next.military!.program!.completedBlocks,1);assert.equal(kboMilitaryEventView(next).length,0);
 const unit=startSangmuCohort(next,next.revision),plan=confirmKboPreseasonPlan(unit,unit.revision),roster=confirmKboOpeningRoster(plan,plan.revision),schedule=confirmKboSeasonSchedule(roster,roster.revision);let g=startKboRegularSeason(schedule,schedule.revision);
 const due=g.military!.completionDays![1]!.worldDay,all=[...g.competitionSchedule!.leagues.KBO,...g.competitionSchedule!.leagues.FUTURES],firstDay=Math.min(...all.map(x=>x.worldDay));
 // Earlier regular dates are controlled clock receipts; June30 and subsequent games are actual worker execution.
 g.days={...g.days!,days:Array.from({length:due-firstDay},(_,i)=>({day:firstDay+i,evidence:'controlled-prior-date',result:{injured:[],recovered:[]}}))};g.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due,pendingGame:null};
 for(let i=0;i<150 && g.phaseContext.phase==='SEASON_PROGRESS';i++)g=advanceKboCareer(g,g.revision,1).career;
 assert.equal(g.phaseContext.phase,'EVENT_DECISION');assert.equal(g.days!.days.at(-1)!.day,due);assert.equal(g.military!.status,'COMPLETED');assert.equal(g.military!.program!.completedBlocks,2);assert.equal(g.military!.program!.blocks[1]!.completedWorldDay,due);assert.ok(!g.sangmu!.loaned!.includes(g.protagonistKey));
 const event=kboMilitaryEventView(g)[0]!;assert.equal(event.definitionId,'E53');assert.equal(g.world.contracts[g.protagonistKey]!.servicePay!.ledger.resume!.completedWorldDay,due);assert.equal(kboContractPaymentBalance(g.world.contracts[g.protagonistKey]!.servicePay!.ledger).paidDays,0);assertKboRecruitmentWorld(g.world);
 const today=g.health.games.filter(x=>x.evidence.seasonKey===g.world.seasonKey && x.evidence.day===due && x.evidence.teamKey==='FUTURES:'+g.protagonistClubId);assert.ok(today.every(x=>!x.evidence.roster.includes(g.protagonistKey)));
 assert.throws(()=>advanceKboCareer(g,g.revision,1),/INVALID_CAREER_PHASE/);g=acknowledge(g,'CONFIRM_SERVICE_RETURN');
 for(let i=0;i<150 && !g.health.games.some(x=>x.evidence.seasonKey===g.world.seasonKey && x.evidence.day>due && x.evidence.teamKey==='FUTURES:'+g.protagonistClubId && x.evidence.roster.includes(g.protagonistKey));i++)g=advanceKboCareer(g,g.revision,1).career;
 assert.ok(g.health.games.some(x=>x.evidence.seasonKey===g.world.seasonKey && x.evidence.day>due && x.evidence.teamKey==='FUTURES:'+g.protagonistClubId && x.evidence.roster.includes(g.protagonistKey)));
 const paidContract=g.world.contracts[g.protagonistKey]!,balance=kboContractPaymentBalance(paidContract.servicePay!.ledger);assert.ok(balance.paidDays>=1);const ownClub=g.world.clubs.find(c=>c.id===g.protagonistClubId)!;assert.equal(ownClub.paidSalaryWon,Object.values(g.world.contracts).filter(c=>c.clubId===g.protagonistClubId).reduce((n,c)=>n+(c.servicePay?.ledger.receipts.filter(r=>r.seasonKey===g.world.seasonKey).reduce((sum,r)=>sum+r.amountWon,0)??0),0));assertKboRecruitmentWorld(g.world);
 const replay=structuredClone(g),before=JSON.stringify(replay);settleKboServicePayrollDay(replay,replay.days!.days.at(-1)!.day);assert.equal(JSON.stringify(replay),before);assert.equal(first.world.contracts[first.protagonistKey]!.servicePay!.ledger.receipts.length,0);
 const games=Object.values(g.records.games).filter(x=>x.scope.seasonKey===g.world.seasonKey && x.worldDay>=due);for(const day of new Set(games.map(x=>x.worldDay)))assert.ok(games.filter(x=>x.worldDay===day && (Object.hasOwn(x.batting,g.protagonistKey)||Object.hasOwn(x.pitching,g.protagonistKey))).length<=1);
});

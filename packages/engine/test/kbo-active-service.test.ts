import {kboReturnConditionView} from '../src/kbo-return-condition.js';
import {assertCareerRevision as legacyV1RevisionGuard} from '../src/high-school-career.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {kboActiveServicePreview,confirmKboActiveService} from '../src/kbo-active-service.js';
import {confirmKboPreseasonPlan,beginKboPreseasonPitchLearning,kboPreseasonPlanView} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster,kboOpeningRosterView} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule,kboSeasonScheduleView} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {closeKboSeason} from '../src/kbo-year-end.js';
import {offerKboRenewal,acceptKboRenewal} from '../src/kbo-renewal.js';
import {startNextKboSeason} from '../src/kbo-year-transition.js';
import {kboMilitaryEventView,resolveKboMilitaryEvent} from '../src/kbo-military-events.js';
import {kboContractSeasonCharge,settleKboServicePayrollDay} from '../src/kbo-service-payroll.js';
import {kboContractPaymentBalance} from '../src/kbo-contract-payments.js';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {previewKboTraining,trainKboCareer} from '../src/kbo-windows.js';
import {canonicalJson} from '../src/game.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {requestKboRetirement,resolveKboRetirement} from '../src/kbo-retirement.js';
import {kboRetirementArchiveView} from '../src/kbo-archive-view.js';

function ack(c:KboCareer){const e=kboMilitaryEventView(c)[0]!;return resolveKboMilitaryEvent(c,c.revision,{eventKey:e.eventKey,eventVersion:e.eventVersion,command:e.definitionId==='E53'?'CONFIRM_SERVICE_RETURN':'ADVANCE_SERVICE'});}
function playing(c:KboCareer){if(kboMilitaryEventView(c).length)c=ack(c);const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);}
/** Prior dates are controlled clock receipts; last regular date, postseason, closure and activation use actual commands. */
function closed(source:KboCareer){
 let c=playing(source);const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(x=>x.worldDay)),last=Math.max(...all.map(x=>x.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first},(_,i)=>({day:first+i,evidence:'controlled-clock',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:last,pendingGame:null};
 for(let i=0;i<150 && c.phaseContext.phase==='SEASON_PROGRESS';i++)c=advanceKboCareer(c,c.revision).career;
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');c=startKboPostseason(c,c.revision);
 for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
 c=settleKboSeasonGrowth(c,c.revision).career;return closeKboSeason(c,c.revision,true);
}
const cache=new Map<string,KboCareer>();
function decision(kind:'HITTER'|'PITCHER'='HITTER'){let c=cache.get(kind);if(!c){c=closed(enteredKboCareer(kind));cache.set(kind,c);}return structuredClone(c);}
function renewed(c:KboCareer){const o=offerKboRenewal(c,c.revision);return acceptKboRenewal(o,o.revision,{eventKey:o.renewal!.eventKey,eventVersion:o.events.find(e=>e.eventKey===o.renewal!.eventKey)!.version});}
function enlisted(kind:'HITTER'|'PITCHER'='HITTER'){const c=renewed(decision(kind));return confirmKboActiveService(c,c.revision);}

test('ACTIVE preview is read-only; explicit confirmation fixes program, rights and contract without creating a military team',()=>{
 const c=decision(),before=canonicalJson(c);assert.equal(kboActiveServicePreview(c).canEnlist,false);assert.throws(()=>confirmKboActiveService(c,c.revision),/CONTRACT_DECISION_REQUIRED/);assert.equal(canonicalJson(c),before);
 const r=renewed(c),snapshot=canonicalJson(r),view=kboActiveServicePreview(r);assert.equal(view.canEnlist,true);assert.equal(canonicalJson(r),snapshot);assert.doesNotMatch(JSON.stringify(view),/potential|ledger|programId|seed|rng|sourceBasis/);
 const e=confirmKboActiveService(r,r.revision);assert.equal(e.schemaVersion,3);assert.equal(r.schemaVersion,1);assert.throws(()=>legacyV1RevisionGuard(e as never,e.revision),/CAREER_REVISION_CHANGED/);assert.equal(e.military!.status,'SERVING_ACTIVE');assert.equal(e.military!.program!.kind,'ACTIVE');assert.equal(e.military!.program!.contract.contractKey,r.renewal!.offerKey);assert.deepEqual(e.rights,r.rights);assert.deepEqual(e.world,r.world);assert.equal(e.sangmu,undefined);assert.deepEqual(confirmKboActiveService(e,e.revision),e);assert.equal(canonicalJson(r),snapshot);
 assert.throws(()=>confirmKboActiveService(r,r.revision-1));const bad=structuredClone(r);bad.rights.holderOrgId='OTHER';assert.throws(()=>confirmKboActiveService(bad,bad.revision),/MILITARY_CONTRACT_CHANGED/);
});
test('ACTIVE first block: E51, no registration/appearance, rest only and no calendar injury recovery',()=>{
 const e=enlisted(),n=startNextKboSeason(e,e.revision),notice=kboMilitaryEventView(n)[0]!;assert.equal(notice.definitionId,'E51');assert.equal(kboContractSeasonCharge(n.world.contracts[n.protagonistKey]!),0);assert.equal(n.world.contracts[n.protagonistKey]!.servicePay!.kind,'ACTIVE');
 assert.throws(()=>resolveKboMilitaryEvent(n,n.revision,{eventKey:notice.eventKey,eventVersion:notice.eventVersion+1,command:'ADVANCE_SERVICE'}));
 const a=ack(n),p=confirmKboPreseasonPlan(a,a.revision),o=confirmKboOpeningRoster(p,p.revision),v=kboOpeningRosterView(o);assert.equal(v.competitionKey,null);assert.equal(v.reason,'SERVING_ACTIVE');assert.ok(!v.futures.some(p=>p.playerKey===o.protagonistKey));
 const s=confirmKboSeasonSchedule(o,o.revision);assert.equal(kboSeasonScheduleView(s).competitionKey,null);assert.equal(s.competitionSchedule!.leagues.FUTURES.some(g=>g.homeTeamKey==='SANGMU'||g.awayTeamKey==='SANGMU'),false);
 let c=startKboRegularSeason(s,s.revision);const key=c.protagonistKey,book=canonicalJson(c.world.repertoires[key]??null);c.world.players[key]={...c.world.players[key]!,fatigue:70};
 const prior=c.health.games.findLast(h=>h.evidence.roster.includes(key))!;assert.ok(prior);
 c.health.games=c.health.games.map(h=>h===prior?{...h,result:{...h.result,injured:[...new Set([...h.result.injured,key])]}}:h);
 c.health.injuries[key]={severity:'MILD',remainingTeamGames:3,diagnosedGameKey:prior.evidence.gameKey,seasonKey:prior.evidence.seasonKey};
 for(const league of ['KBO','FUTURES'] as const)assert.ok(createKboCompetitionGameWorld(c.world,league,key).schools.every(t=>!t.roster.includes(key)));
 const first=c.phaseContext.phase==='SEASON_PROGRESS'?c.phaseContext.nextWorldDay:0;
 for(let i=0;i<80 && c.days!.days.length<3;i++)c=advanceKboCareer(c,c.revision,1).career;
 assert.ok(c.days!.days.at(-1)!.day>=first);assert.ok(c.world.players[key]!.fatigue<70);assert.equal(c.health.injuries[key]!.remainingTeamGames,3);assert.equal(canonicalJson(c.world.repertoires[key]??null),book);
 assert.ok(Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey).every(g=>!Object.hasOwn(g.batting,key)&&!Object.hasOwn(g.pitching,key)));assert.ok(c.health.games.filter(h=>h.evidence.seasonKey===c.world.seasonKey).every(h=>!h.evidence.roster.includes(key)));assert.equal(c.world.contracts[key]!.servicePay!.ledger.receipts.length,0);assertKboRecruitmentWorld(c.world);
});
test('ACTIVE full first season closes with zero natural growth and unchanged frozen principal before second activation',()=>{
 const n=startNextKboSeason(enlisted(),enlisted().revision),before=n.world.contracts[n.protagonistKey]!.servicePay!.ledger.contract,close=closed(n),key=close.protagonistKey;
 assert.equal(close.seasonGrowth.totalBudgetUnits,0);assert.ok(close.seasonGrowth.entries.every(e=>e.period.ordinaryMilitary));assert.equal(close.military!.program!.completedBlocks,1);assert.deepEqual(close.world.contracts[key]!.servicePay!.ledger.contract,before);assert.equal(close.world.contracts[key]!.servicePay!.ledger.receipts.length,0);
 const next=startNextKboSeason(close,close.revision);assert.equal(next.military!.status,'SERVING_ACTIVE');assert.equal(kboMilitaryEventView(next).length,0);assert.ok(next.world.contracts[key]!.servicePay!.reservedGameDays>0);assertKboRecruitmentWorld(next.world);
 const retirement=requestKboRetirement(close,close.revision),event=retirement.events.find(e=>e.definitionId==='E36'&&e.status==='OPEN')!;
 const archived=resolveKboRetirement(retirement,retirement.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'CONFIRM_RETIRE'});
 assert.equal(archived.schemaVersion,3);assert.equal(archived.military!.status,'SERVING_ACTIVE');assert.equal(archived.retirement!.remainingPaidGameDays,144);assert.equal(kboRetirementArchiveView(archived).player.name,archived.world.players[key]!.name);
});
test('ACTIVE actual June30 return closes once, E53 confirms original Futures rights, following registered date pays once',()=>{
 const e=enlisted(),first=closed(startNextKboSeason(e,e.revision)),next=startNextKboSeason(first,first.revision);let c=playing(next);const key=c.protagonistKey,due=c.military!.completionDays![1]!.worldDay,start=c.days!.days.length?c.days!.days[0]!.day:Math.min(...c.competitionSchedule!.leagues.KBO.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:due-start},(_,i)=>({day:start+i,evidence:'controlled-prior-date',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:due,pendingGame:null};
 for(let i=0;i<150 && c.phaseContext.phase==='SEASON_PROGRESS';i++)c=advanceKboCareer(c,c.revision,1).career;
 assert.equal(c.phaseContext.phase,'EVENT_DECISION');assert.equal(c.military!.status,'COMPLETED');assert.equal(c.military!.program!.blocks[1]!.completedWorldDay,due);assert.equal(kboMilitaryEventView(c)[0]!.definitionId,'E53');assert.equal(kboContractPaymentBalance(c.world.contracts[key]!.servicePay!.ledger).paidDays,0);assert.ok(c.health.games.filter(h=>h.evidence.day===due&&h.evidence.seasonKey===c.world.seasonKey).every(h=>!h.evidence.roster.includes(key)));
 assert.equal(kboReturnConditionView(c)!.remainingTeamGames,6);const rawAbilities=structuredClone(c.world.players[key]!.abilities);
 c=ack(c);for(let i=0;i<150 && c.world.contracts[key]!.servicePay!.ledger.receipts.length===0;i++)c=advanceKboCareer(c,c.revision,1).career;
 assert.ok(c.world.contracts[key]!.servicePay!.ledger.receipts.length>0);assert.equal(c.registration.firstTeam,false);assertKboRecruitmentWorld(c.world);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,5);
 for(let i=0;i<400 && kboReturnConditionView(c)!.remainingTeamGames>0;i++)c=advanceKboCareer(c,c.revision,1).career;
 assert.equal(kboReturnConditionView(c)!.effectiveMultiplier,1);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,0);assert.deepEqual(c.world.players[key]!.abilities,rawAbilities);
 const replay=structuredClone(c),snapshot=canonicalJson(replay);settleKboServicePayrollDay(replay,replay.days!.days.at(-1)!.day);assert.equal(canonicalJson(replay),snapshot);
});
test('ACTIVE blocks special training and new-pitch learning while preserving the existing repertoire and source',()=>{
 const e=enlisted('PITCHER'),n=startNextKboSeason(e,e.revision),a=ack(n),before=canonicalJson(a),view=kboPreseasonPlanView(a);
 assert.equal(view.pitcher!.learningAvailable,false);assert.throws(()=>beginKboPreseasonPitchLearning(a,a.revision,'P07'),/ACTIVE_SERVICE_TRAINING_UNAVAILABLE/);assert.equal(canonicalJson(a),before);
 const c=playing(a);assert.throws(()=>previewKboTraining(c,{type:'CONDITIONING'}),/ACTIVE_SERVICE_TRAINING_UNAVAILABLE/);assert.throws(()=>trainKboCareer(c,c.revision,{type:'CONDITIONING'}),/ACTIVE_SERVICE_TRAINING_UNAVAILABLE/);
});

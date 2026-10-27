import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enlistInSangmu,enlistInActiveService} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {createKboServicePayroll,kboContractSeasonCharge} from '../src/kbo-service-payroll.js';
import {emptySangmuUnit} from '../src/kbo-sangmu-unit.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {setCareerSeasonGoals,replaceCareerSeasonGoal,careerSeasonGoalsView,refreshCareerSeasonGoals} from '../src/season-goals.js';
import {recordTotals} from '../src/records.js';
import {canonicalJson} from '../src/game.js';

let cached:KboCareer|undefined;
/** Authentic first-block payroll/program with controlled prior enlistment; not an eighteen-month service simulation. */
function serving(kind:'SPORTS'|'ACTIVE'){
 cached??=enteredKboCareer();
 const c=structuredClone(cached),contract=c.world.contracts[c.protagonistKey]!,club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!;
 const program=(kind==='SPORTS'?enlistInSangmu:enlistInActiveService)({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:club.id,selectionSeasonKey:String(Number(c.world.seasonKey)-1),contract,remainingPaidGameDays:144});
 contract.servicePay=createKboServicePayroll(contract,program,kboMilitaryCompletionDays(program)[1]!);
 club.reservedSalaryWon-=contract.annualSalaryWon-kboContractSeasonCharge(contract);
 c.military={status:kind==='SPORTS'?'SERVING_SPORTS':'SERVING_ACTIVE',applications:[],program};
 c.schemaVersion=3;c.sangmu={...emptySangmuUnit(),loaned:kind==='SPORTS'?[c.protagonistKey]:[]};
 return kind==='SPORTS'?startSangmuCohort(c,c.revision):c;
}
function playing(c:KboCareer){
 const p=confirmKboPreseasonPlan(c,c.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);
 return startKboRegularSeason(s,s.revision);
}
/** Team-only controlled contributions isolate the half-season window; native records are covered separately. */
function teamRows(c:KboCareer,teamKey:string,count:number){
 for(let i=0;i<count;i++){
  const gameKey=JSON.stringify(['controlled-military-goal',teamKey,i]);
  c.records.games[gameKey]={gameKey,worldDay:100+i,scope:{seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teams:{[teamKey]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
 }
 c.records.revision+=count;
}

test('SPORTS goals seal SANGMU/FUTURES, exclude team PS, and follow the army half-season rather than the original club',()=>{
 const pre=serving('SPORTS'),raw=canonicalJson(pre),view=careerSeasonGoalsView(pre);
 assert.deepEqual(view.registration,{teamKey:'SANGMU',leagueKey:'FUTURES'});
 assert.deepEqual(view.selection,{open:true,reason:null});
 assert.ok(!view.definitions.some(g=>g.goalId==='G09'));
 assert.throws(()=>setCareerSeasonGoals(pre,pre.revision,['G09']),/GOAL_NOT_ELIGIBLE/);
 const selected=setCareerSeasonGoals(pre,pre.revision,['G03']);assert.equal(canonicalJson(pre),raw);
 const season=selected.goals!.seasons[pre.world.seasonKey]!;
 assert.equal(season.teamKey,'SANGMU');assert.equal(season.leagueKey,'FUTURES');assert.equal(season.slots[0]!.teamKey,'SANGMU');
 const c=playing(selected);teamRows(c,c.protagonistClubId,72);
 assert.equal(careerSeasonGoalsView(c).replacement.open,false);
 assert.throws(()=>replaceCareerSeasonGoal(c,c.revision,0,'G04'),/WINDOW_NOT_OPEN/);
 teamRows(c,'SANGMU',71);assert.equal(careerSeasonGoalsView(c).replacement.open,false);
 teamRows(c,'SANGMU',72);assert.equal(careerSeasonGoalsView(c).replacement.open,true);
 const changed=replaceCareerSeasonGoal(JSON.parse(JSON.stringify(c)),c.revision,0,'G04');
 assert.equal(changed.goals!.seasons[c.world.seasonKey]!.slots[0]!.teamKey,'SANGMU');
 assert.equal(careerSeasonGoalsView(changed).replacement.used,true);
 assert.throws(()=>replaceCareerSeasonGoal(changed,changed.revision,0,'G01'),/USED/);
});

test('ACTIVE has no current registration, recommendations, new selection or MID replacement, while retained goals remain readable',()=>{
 const c=serving('ACTIVE'),raw=canonicalJson(c),view=careerSeasonGoalsView(c);
 assert.deepEqual(view.registration,{teamKey:null,leagueKey:null});
 assert.deepEqual(view.selection,{open:false,reason:'SERVING_ACTIVE'});
 assert.deepEqual(view.definitions,[]);assert.deepEqual(view.recommendedIds,[]);
 for(const ids of [[],['G01']] as const)assert.throws(()=>setCareerSeasonGoals(c,c.revision,ids),/GOAL_SELECTION_UNAVAILABLE/);
 assert.equal(canonicalJson(c),raw);
 // A previous save can already contain goals: disabling selection must not erase its scope or consume replacement usage.
 const old=structuredClone(c);old.goals={schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,seasons:{[c.world.seasonKey]:{leagueKey:'FUTURES',teamKey:c.protagonistClubId,scheduledGames:144,replacementUsed:false,slots:[{slot:0,goalId:'G03',scope:{seasonKey:c.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'},teamKey:c.protagonistClubId,status:'ACTIVE',progress:0,selectedRevision:1}],history:[]}},notices:[],rewards:[]};
 const active=playing(old);teamRows(active,c.protagonistClubId,72);const before=canonicalJson(active);
 assert.deepEqual(careerSeasonGoalsView(active).replacement,{used:false,reason:'SERVING_ACTIVE',open:false});
 assert.throws(()=>replaceCareerSeasonGoal(active,active.revision,0,'G04'),/NOT_ELIGIBLE/);
 assert.deepEqual(refreshCareerSeasonGoals(JSON.parse(JSON.stringify(active))),active);
 assert.equal(canonicalJson(active),before);assert.equal(active.goals!.rewards.length,0);
});

test('native SANGMU registration advances army goal counts identically with or without goals and through JSON replay',()=>{
 const pre=serving('SPORTS'),selected=setCareerSeasonGoals(pre,pre.revision,['G01','G02']);
 let plain=playing(pre),withGoals=playing(selected),replayed=JSON.parse(JSON.stringify(withGoals)) as KboCareer;
 const original=canonicalJson(withGoals);
 for(let i=0;i<160;i++){
  const a=advanceKboCareer(plain,plain.revision,1),b=advanceKboCareer(withGoals,withGoals.revision,1),r=advanceKboCareer(replayed,replayed.revision,1);
  plain=a.career;withGoals=b.career;replayed=r.career;
  assert.equal(a.stopReason,b.stopReason);assert.deepEqual(withGoals,replayed);
  if(withGoals.health.games.some(h=>h.evidence.seasonKey===pre.world.seasonKey&&h.evidence.teamKey==='FUTURES:SANGMU'&&h.evidence.roster.includes(pre.protagonistKey)))break;
  if(i===159)throw Error('NATIVE_ARMY_GOAL_LIMIT');
 }
 assert.deepEqual(withGoals.records,plain.records);assert.deepEqual(withGoals.world,plain.world);
 assert.deepEqual(withGoals.health,plain.health);assert.deepEqual(withGoals.sangmu,plain.sangmu);
 const totals=recordTotals(withGoals.records,{seasonKey:pre.world.seasonKey,leagueKey:'FUTURES',phase:'REGULAR'}).batting[pre.protagonistKey]!;
 assert.ok(totals.PA>0);
 assert.equal(withGoals.goals!.seasons[pre.world.seasonKey]!.slots[0]!.progress,totals.PA);
 assert.equal(withGoals.goals!.seasons[pre.world.seasonKey]!.slots[1]!.progress,totals.games);
 assert.equal(canonicalJson(playing(selected)),original);
 assert.equal(withGoals.goals!.rewards.length,0);
 console.log('Native military goals:',JSON.stringify({team:'SANGMU',ownPA:totals.PA,ownStarts:totals.games,worldAndRecordsEqualWithoutGoals:true,jsonReplayEqual:true}));
});

test('completed ACTIVE and SPORTS return to civilian eligibility without rewriting previously sealed goals',()=>{
 for(const kind of ['SPORTS','ACTIVE'] as const){
  const pre=serving(kind),c=kind==='SPORTS'?setCareerSeasonGoals(pre,pre.revision,['G03']):pre;
  const goals=canonicalJson(c.goals??null);
  // Isolate the read/selection boundary after an already settled return; native return settlement has separate military tests.
  c.world.contracts[c.protagonistKey]!.servicePay!.ledger.resume={returnOptionId:'controlled-settled-return',completedSeasonKey:c.world.contracts[c.protagonistKey]!.servicePay!.returnDate.seasonKey,completedWorldDay:c.world.contracts[c.protagonistKey]!.servicePay!.returnDate.worldDay};
  c.military!.status='COMPLETED';c.sangmu!.loaned=[];
  const view=careerSeasonGoalsView(c);
  assert.deepEqual(view.registration,{teamKey:c.protagonistClubId,leagueKey:c.registration.firstTeam?'KBO':'FUTURES'});
  assert.equal(view.selection.open,true);assert.ok(view.definitions.some(g=>g.goalId==='G01'));
  assert.equal(canonicalJson(c.goals??null),goals);
  if(kind==='SPORTS')assert.equal(view.slots[0]!.teamKey,'SANGMU');
 }
});

test('a confirmed future service program does not change current civilian goal registration or eligibility',()=>{
 for(const kind of ['SPORTS','ACTIVE'] as const){
  const c=structuredClone(cached??=enteredKboCareer()),contract=c.world.contracts[c.protagonistKey]!;
  const program=(kind==='SPORTS'?enlistInSangmu:enlistInActiveService)({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:c.world.seasonKey,contract,remainingPaidGameDays:144});
  c.military={status:kind==='SPORTS'?'SERVING_SPORTS':'SERVING_ACTIVE',applications:[],program};
  c.sangmu={...emptySangmuUnit(),loaned:kind==='SPORTS'?[c.protagonistKey]:[]};
  const view=careerSeasonGoalsView(c);
  assert.equal(view.registration.teamKey,c.protagonistClubId);assert.equal(view.selection.open,true);
  const selected=setCareerSeasonGoals(c,c.revision,['G01']);
  assert.equal(selected.goals!.seasons[c.world.seasonKey]!.slots[0]!.teamKey,c.protagonistClubId);
 }
});

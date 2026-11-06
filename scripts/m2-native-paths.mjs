// Native (no controlled prefix) command segments. Every segment is written against a trace-like `t`
// ({state, command(name,input,apply)}); the runner supplies a hashing/replaying trace, so each call is evidence.
import assert from 'node:assert/strict';
import {KBO_CLUBS} from '@playball/rules';
import {createHighSchoolWorld} from '../packages/engine/src/high-school-world.ts';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../packages/engine/src/high-school-career.ts';
import {advanceHighSchoolCareer,resolveCareerWindowEvent} from '../packages/engine/src/high-school-progress.ts';
import {resolveHiddenTraitNotice} from '../packages/engine/src/trait-notices.ts';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute,highSchoolCareerRouteView,enrollHighSchoolCollege} from '../packages/engine/src/high-school-route.ts';
import {closeHighSchoolSeasonForCollege,startAdmittedCollegeSeason} from '../packages/engine/src/college-entry.ts';
import {confirmCollegePreseason,advanceCollegeCareer} from '../packages/engine/src/college-career.ts';
import {startCollegeCup,advanceCollegeCup} from '../packages/engine/src/college-cup.ts';
import {acknowledgeCollegeSeasonReview} from '../packages/engine/src/college-result.ts';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../packages/engine/src/college-year.ts';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../packages/engine/src/career-kbo.ts';
import {closeSchoolSeasonForKbo} from '../packages/engine/src/kbo-entry.ts';
import {startSignedKboCareer} from '../packages/engine/src/kbo-career-entry.ts';
import {prepareCareerUsDirect,careerUsDirectView} from '../packages/engine/src/career-us.ts';
import {createUsRosterWorld} from '../packages/engine/src/us-world.ts';
import {initialUsRecruitmentInventory} from '../packages/engine/src/us-inventory.ts';
import {startCollegeMilitaryLeave,advanceCollegeMilitaryService,resumeCollegeAfterService} from '../packages/engine/src/college-service.ts';
import {validateSeasonGrowthLedger} from '../packages/engine/src/growth-ledger.ts';
import {graduateCollegeCareer} from '../packages/engine/src/college-graduation.ts';
import {canonicalJson} from '../packages/engine/src/game.ts';

export const HS_SPEC={worldKey:'m2-closure-native',seasonKey:'2032',seasonYear:2032,seed:'m2-closure-native-v1',schoolId:'H01',player:{simulationKey:'own',name:'경로 검증',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}};
export const createNativeHs=()=>createHighSchoolCareer(createHighSchoolWorld(HS_SPEC),'GROWTH');

const FOCUS=new Set(['E01','E02','E03']);
/** Resolve the single open decision with the neutral command each event definition accepts. */
export function resolveOpenEvent(t){
 const c=t.state,e=c.events.find(e=>e.eventKey===c.phaseContext.eventKey);assert.ok(e,'open event');
 const command=FOCUS.has(e.definitionId)?'KEEP_FOCUS':e.definitionId==='E84'?'OPEN_TRAITS':e.definitionId==='E43'?'FORFEIT_TRAINING':'ACK_EVENT';
 const input={eventKey:e.eventKey,eventVersion:e.version,command};
 t.command('resolve:'+e.definitionId,input,s=>FOCUS.has(e.definitionId)?resolveCareerFocusEvent(s,s.revision,input):e.definitionId==='E84'?resolveHiddenTraitNotice(s,s.revision,input):resolveCareerWindowEvent(s,s.revision,input));
 return e.definitionId;
}

/** Player creation -> actual 216-game HS season, stopping at SEASON_REVIEW. */
export function hsSeason(t){
 t.command('CONFIRM_PLAYER',{},s=>confirmCareerPlayer(s,s.revision));resolveOpenEvent(t);
 t.command('CONFIRM_PRESEASON',{},s=>confirmCareerPreseason(s,s.revision));
 for(let n=0;t.state.phaseContext.phase!=='SEASON_REVIEW';n++){
  assert.ok(n<1800,'native HS command budget exhausted');
  if(t.state.phaseContext.phase==='EVENT_DECISION')resolveOpenEvent(t);
  else t.command('ADVANCE_HS',{mode:'NEXT_MAJOR_EVENT'},s=>{const out=advanceHighSchoolCareer(s,s.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;});
 }
 assert.equal(Object.keys(t.state.records.games).length,216);
}
export function toRoute(t){
 t.command('ACKNOWLEDGE_HS_REVIEW',{},s=>acknowledgeHighSchoolSeasonReview(s,s.revision));
 t.command('OPEN_CAREER_ROUTE',{eventVersion:1},s=>openHighSchoolCareerRoute(s,s.revision,1));
}

/** Draft with a stated club preference (a sort tie-break only). Returns {preferredClubId,draftedClubId,round}. */
export function kboSign(t,preferredClubId=null){
 t.command('PREPARE_KBO_DRAFT',{preferredClubId},s=>prepareCareerKboDraft(s,s.revision,preferredClubId));
 t.command('RESOLVE_KBO_DRAFT',{programVersion:1},s=>resolveCareerKboDraft(s,s.revision,1));
 const result=t.state.kboRecruitment.program.result;assert.ok(result.round,'draft produced no pick');
 const sign={programVersion:2,decision:'SIGN',eventVersion:1};
 t.command('SIGN_KBO_DRAFT',sign,s=>decideCareerKboDraft(s,s.revision,sign));
 t.command('CLOSE_SCHOOL_FOR_KBO',{forfeitUnusedTraining:true},s=>closeSchoolSeasonForKbo(s,s.revision,true));
 t.command('START_SIGNED_KBO',{},s=>startSignedKboCareer(s,s.revision));
 assert.equal(t.state.registration.status,'ACTIVE');assert.ok(t.state.world.contracts[t.state.protagonistKey]);
 return {preferredClubId,draftedClubId:result.clubId,round:result.round};
}

/** Probe (read-only, no state change) which club is drafted for a given preference. */
export function probeDraft(state,preferredClubId){
 const p=prepareCareerKboDraft(state,state.revision,preferredClubId),r=resolveCareerKboDraft(p.career??p,(p.career??p).revision,1);
 return (r.career??r).kboRecruitment.program.result;
}
export const clubIds=()=>KBO_CLUBS.map(c=>c.id);

export function usDirectInventory(c,budget=3000000){
 const world=createUsRosterWorld({worldKey:c.world.worldKey,seasonKey:String(c.world.calendar.year+1),seed:c.world.seed,difficulty:c.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'미국조직'+(i+1)}))});
 return {world,inventory:initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:budget,nationalReleaseAllowed:true,militaryReturnOption:false})))};
}
export function usDirectView(t,budget=3000000){
 const us=usDirectInventory(t.state,budget);
 t.command('PREPARE_US_DIRECT',{inventory:us.inventory},s=>prepareCareerUsDirect(s,s.revision,us.inventory));
 return careerUsDirectView(t.state);
}

export function collegeEnroll(t,collegeId='U07'){
 const view=highSchoolCareerRouteView(t.state),offer=view.colleges.find(c=>c.id===collegeId);assert.ok(offer?.eligible,'college offer');
 const enrollment={eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId};
 t.command('ENROLL_COLLEGE',enrollment,s=>enrollHighSchoolCollege(s,s.revision,enrollment));
 t.command('CLOSE_HS_FOR_COLLEGE',{forfeitUnusedTraining:true},s=>closeHighSchoolSeasonForCollege(s,s.revision,true));
 t.command('START_ADMITTED_COLLEGE',{},s=>startAdmittedCollegeSeason(s,s.revision));
}
/** Actual college regular season (216 league games), cup and annual review for the current academic year. */
export function collegeYear(t){
 t.command('CONFIRM_COLLEGE_PRESEASON',{},s=>confirmCollegePreseason(s,s.revision));
 for(let n=0;t.state.phaseContext.phase!=='SEASON_REVIEW';n++){
  assert.ok(n<1500,'native college command budget exhausted');
  if(t.state.phaseContext.phase==='EVENT_DECISION')resolveOpenEvent(t);
  else t.command('ADVANCE_COLLEGE',{},s=>{const out=advanceCollegeCareer(s,s.revision);assert.notEqual(out.stopReason,'ENGINE_LIMIT');return out;});
 }
 t.command('START_COLLEGE_CUP',{},s=>startCollegeCup(s,s.revision));
 for(let n=0;;n++){
  assert.ok(n<60,'college cup budget exhausted');
  let stop;t.command('ADVANCE_COLLEGE_CUP',{},s=>{const out=advanceCollegeCup(s,s.revision);stop=out.stopReason;return out;});
  if(stop==='CUP_COMPLETE')break;
 }
 t.command('ACKNOWLEDGE_COLLEGE_REVIEW',{},s=>acknowledgeCollegeSeasonReview(s,s.revision));
}
/** Close the academic year and enter the next. Returns growth-ledger facts: the closed year's ledger conserves its budget, no period is paid twice, and the new year starts with an empty ledger from the carried player. */
export function collegeNextYear(t){
 t.command('CLOSE_COLLEGE_YEAR',{forfeitUnusedTraining:true},s=>closeCollegeSeasonForNextYear(s,s.revision,true));
 const closed=t.state.seasonGrowth,own=t.state.protagonistKey??'own';
 validateSeasonGrowthLedger(closed);assert.equal(closed.finalized,true);
 const keys=closed.entries.map(e=>e.periodKey);assert.equal(new Set(keys).size,keys.length,'growth period paid twice');
 const sum=a=>Object.values(a).reduce((x,y)=>x+y,0),gained=closed.entries.reduce((x,e)=>x+e.gainedUnits,0);
 assert.equal(sum(t.state.world.players[own].abilities),sum(closed.seasonStart.abilities)+gained-closed.aging.lossUnits,'closed-year ability delta must equal ledger gains minus aging');
 const carried=canonicalJson(t.state.world.players[own].abilities);
 t.command('START_COLLEGE_YEAR',{},s=>startNextCollegeSeason(s,s.revision));
 const fresh=t.state.seasonGrowth;validateSeasonGrowthLedger(fresh);
 assert.equal(fresh.entries.length,0);assert.equal(fresh.totalBudgetUnits,0);assert.equal(canonicalJson(fresh.seasonStart.abilities),carried,'next year must start from the carried abilities');
 return {periods:keys.length,gainedUnits:gained,agingLossUnits:closed.aging.lossUnits,newLedgerEmpty:true};
}
/** Graduation then KBO signing (4th academic year already reviewed). */
export function collegeGraduateAndSign(t){
 t.command('GRADUATE_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>graduateCollegeCareer(s,s.revision,s.events.at(-1).version));
 const draft=kboSign(t,null);
 assert.equal(t.state.amateurHistory.collegeAdmission.status,'GRADUATED');
 return draft;
}
export function collegeLeave(t){
 const academicYear=t.state.collegeAdmission.academicYear;
 t.command('START_COLLEGE_MILITARY_LEAVE',{},s=>startCollegeMilitaryLeave(s,s.revision));
 for(let i=0;t.state.phaseContext.phase==='SERVICE_PROGRESS';i++){assert.ok(i<40,'service budget');t.command('ADVANCE_COLLEGE_SERVICE',{maxDays:31},s=>advanceCollegeMilitaryService(s,s.revision,31));}
 assert.equal(t.state.collegeService.status,'COMPLETED');
 t.command('RESUME_COLLEGE',{eventVersion:t.state.events.at(-1).version},s=>resumeCollegeAfterService(s,s.revision,s.events.at(-1).version));
 return academicYear;
}
export const stateHash=canonicalJson;

/** Creation fixtures the verifier can rebuild itself, so a slice cannot start from a doctored state. */
const CREATIONS={HS_HITTER:createNativeHs};
/** Machine verdict from receipts alone: creation origin, hash linkage, and required commands in order. */
export function nativeSliceVerdict(s,required,hash){
 const bad=problem=>({ok:false,problem:s.id+': '+problem}),rows=s.commandReceipts;
 if(s.prefix?.kind!=='NATIVE_FROM_CREATION')return bad('prefix is not NATIVE_FROM_CREATION');
 if(!required?.length)return bad('no required-command list');
 const build=CREATIONS[s.prefix.creation];if(!build)return bad('unknown creation fixture');
 if(hash(s.initialFixture)!==hash(build()))return bad('initial fixture is not the rebuilt creation state');
 if(!rows.length||rows[0].sourceHash!==hash(s.initialFixture))return bad('first command does not start from creation state');
 for(let i=0;i<rows.length;i++){
  if(rows[i].inputHash!==hash(rows[i].input))return bad('input hash mismatch at '+i);
  if(i>0&&rows[i].sourceHash!==rows[i-1].resultHash)return bad('broken source/result link at '+i);
 }
 if(rows.at(-1).resultHash!==s.finalStateHash)return bad('final state hash mismatch');
 if(hash(rows)!==s.commandChainHash)return bad('command chain hash mismatch');
 let at=0;for(const name of required){const next=rows.findIndex((r,i)=>i>=at&&r.command===name);if(next<0)return bad('required command missing/out of order: '+name);at=next+1;}
 return {ok:true,commandChainHash:s.commandChainHash,finalStateHash:s.finalStateHash,commands:rows.length};
}

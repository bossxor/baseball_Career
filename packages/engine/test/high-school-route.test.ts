import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer} from '../src/high-school-career.js';
import {acknowledgeHighSchoolSeasonReview,highSchoolCareerRouteView,openHighSchoolCareerRoute,enrollHighSchoolCollege} from '../src/high-school-route.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {canonicalJson} from '../src/game.js';
import type {GameContribution} from '../src/records.js';
import {COLLEGES,abilityKeys} from '@playball/rules';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';

// Controlled no-appearance receipts isolate transitions. The progress test covers real216-game play.
function completedCareer(capAt?:number){
 const state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'route-world',seasonKey:'2029',seasonYear:2029,seed:'route-fixture',schoolId:'H01',player:{simulationKey:'own',name:'진로선수',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 if(capAt!==undefined){
  const values=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,capAt]));
  state.world.players.own={...state.world.players.own!,abilities:values,potential:{...values},careerPeaks:{...values}};
  state.development!.seasonStartPlayer=structuredClone(state.world.players.own);
  state.ownAssessment=createOwnCareerAssessment(state.world);
 }
 state.phaseContext={phase:'SEASON_REVIEW'};
 for(const game of state.world.schedule){
  const line={games:1,W:0,L:0,T:1,R:0,RA:0};
  const contribution:GameContribution={gameKey:game.simulationKey,worldDay:game.worldDay,scope:{seasonKey:state.world.seasonKey,leagueKey:'HS',phase:'REGULAR'},teams:{[game.awayTeamKey]:line,[game.homeTeamKey]:line},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  state.records.games[game.simulationKey]=contribution;
  for(const teamKey of [game.awayTeamKey,game.homeTeamKey])state.health.games=[...state.health.games,{evidence:{gameKey:game.simulationKey,teamKey,seasonKey:state.world.seasonKey,day:game.worldDay,roster:state.world.schools.find(s=>s.id===teamKey)!.roster,appearances:[]},result:{injured:[],recovered:[]}}];
 }
 state.records.revision=216;
 state.days.days=Array.from({length:150},(_,i)=>{
  const day=31+i,contributions=Object.values(state.records.games).filter(g=>g.worldDay===day).sort((a,b)=>a.gameKey<b.gameKey?-1:1);
  return {day,evidence:canonicalJson({worldKey:state.world.worldKey,seasonKey:state.world.seasonKey,day,contributions}),result:{injured:[],recovered:[]}};
 });
 return state;
}
function ready(capAt?:number){const state=completedCareer(capAt);return acknowledgeHighSchoolSeasonReview(state,state.revision);}
function opened(){const state=ready();return openHighSchoolCareerRoute(state,state.revision,1).career;}

test('season review atomically pays growth and opens one blocking E04 with a post-growth route snapshot',()=>{
 const source=completedCareer(),before=canonicalJson(source),state=acknowledgeHighSchoolSeasonReview(source,source.revision);
 assert.equal(state.revision,source.revision+1);assert.equal(state.phaseContext.phase,'EVENT_DECISION');assert.equal(state.events.at(-1)!.definitionId,'E04');assert.equal(state.events.at(-1)!.status,'OPEN');assert.equal(state.events.at(-1)!.resume.phase,'CAREER_ROUTE');
 const paid=state.seasonGrowth!.totalBudgetUnits;assert.ok(paid>0);assert.equal(Object.values(state.world.players.own!.abilities).reduce((n,v)=>n+v,0),3_000_000+paid);
 assert.equal(state.seasonGrowth!.finalized,false);assert.ok(highSchoolCareerRouteView(state).overall>50);assert.equal(canonicalJson(source),before);
 assert.throws(()=>acknowledgeHighSchoolSeasonReview(state,state.revision),/INVALID_CAREER_PHASE/);assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
});

test('opening S28 keeps E04 open, repeated views/JSON restore do not change growth, RNG or revision',()=>{
 const state=ready(),before=canonicalJson(state),opened=openHighSchoolCareerRoute(state,state.revision,1);
 assert.equal(opened.navigation!.targetScreen,'S28');assert.equal(opened.career.phaseContext.phase,'CAREER_ROUTE');assert.equal(opened.career.events.at(-1)!.status,'OPEN');assert.equal(opened.career.events.at(-1)!.version,1);assert.equal(canonicalJson(state),before);
 const view=highSchoolCareerRouteView(opened.career),snapshot=canonicalJson(opened.career);
 assert.equal(view.colleges.length,9);assert.equal(view.kbo.status,'AWAITING_RECRUITMENT');assert.equal('selectionProbability' in view.kbo,false);assert.equal('us' in view,false);
 assert.deepEqual(highSchoolCareerRouteView(JSON.parse(JSON.stringify(opened.career))),view);assert.equal(canonicalJson(opened.career),snapshot);
 for(const field of ['seed','rng','potential','sourceBasis','seasonStart','abilities','careerPeaks'])assert.equal(JSON.stringify(view).includes('"'+field+'"'),false);
});

test('43: college eligibility uses exact post-growth overall at48/52/55, fallback three stay available',()=>{
 assert.equal(new Set(COLLEGES.map(c=>c.id)).size,9);
 for(const [capAt,count] of [[479999,3],[480000,5],[519999,5],[520000,7],[549999,7],[550000,9]]){
  const state=ready(capAt),view=highSchoolCareerRouteView(state);
  assert.equal(view.colleges.filter(c=>c.eligible).length,count);assert.ok(view.colleges.slice(-3).every(c=>c.eligible));assert.ok(view.colleges.filter(c=>!c.eligible).every(c=>c.reasonCode==='OVERALL_TOO_LOW'));
 }
});

test('college acceptance closes E04 once, preserves historical roster/records and reserves next-year admission',()=>{
 const source=opened(),before=canonicalJson(source),view=highSchoolCareerRouteView(source);
 const state=enrollHighSchoolCollege(source,source.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'});
 assert.equal(state.collegeAdmission!.collegeId,'U07');assert.equal(state.collegeAdmission!.status,'ADMITTED');assert.equal(state.collegeAdmission!.entryYear,2030);assert.equal(state.collegeAdmission!.academicYear,1);assert.equal(state.collegeAdmission!.yearsCompleted,0);assert.equal(state.collegeAdmission!.position,'CF');
 assert.equal(state.phaseContext.phase,'NEXT_SEASON_READY');assert.equal(state.events.at(-1)!.status,'RESOLVED');assert.equal(state.events.at(-1)!.resolution!.command,'ENROLL_COLLEGE');assert.equal(state.events.at(-1)!.resolution!.receiptKey,state.collegeAdmission!.admissionKey);
 assert.deepEqual(state.world,source.world);assert.deepEqual(state.records,source.records);assert.deepEqual(state.seasonGrowth,source.seasonGrowth);assert.equal(state.world.players.own!.age,18);assert.equal(canonicalJson(source),before);
 assert.throws(()=>enrollHighSchoolCollege(state,state.revision,{eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U08'}));assert.throws(()=>advanceHighSchoolCareer(state,state.revision));
});

test('stale revision/event/offer, ineligible or unknown college, changed evaluation reject without partial effects',()=>{
 const source=opened(),view=highSchoolCareerRouteView(source),input={eventVersion:1,offerSetKey:view.offerSetKey,offerSetVersion:1,collegeId:'U07'},before=canonicalJson(source);
 for(const change of [{eventVersion:0},{offerSetKey:'other-world'},{offerSetVersion:2},{collegeId:'U01'},{collegeId:'UNKNOWN'}])assert.throws(()=>enrollHighSchoolCollege(source,source.revision,{...input,...change}));
 assert.throws(()=>enrollHighSchoolCollege(source,0,input));assert.throws(()=>openHighSchoolCareerRoute(source,source.revision,0));assert.equal(canonicalJson(source),before);
 const stale=structuredClone(source);stale.world.players.own!.abilities={...stale.world.players.own!.abilities,CONTACT:stale.world.players.own!.abilities.CONTACT!+1};stale.world.players.own!.careerPeaks={...stale.world.players.own!.abilities};
 assert.throws(()=>highSchoolCareerRouteView(stale),/STALE_CAREER_ROUTE/);assert.throws(()=>enrollHighSchoolCollege(stale,stale.revision,input),/STALE_CAREER_ROUTE/);
});

test('missing calendar, incomplete review and another pending event do not pay growth or create graduation',()=>{
 const source=completedCareer();
 for(const mutate of [
  (s:typeof source)=>{delete s.world.calendar;},
  (s:typeof source)=>{s.days.days=s.days.days.slice(1);},
  (s:typeof source)=>{s.events=ready().events;},
  (s:typeof source)=>{const event=ready().events[0]!;s.events=[{...event,status:'RESOLVED',resolution:{kind:'DOMAIN',command:'ENROLL_COLLEGE',receiptKey:'old-admission',reason:null}}];},
 ]){
  const state=structuredClone(source);mutate(state);const before=canonicalJson(state);assert.throws(()=>acknowledgeHighSchoolSeasonReview(state,state.revision));assert.equal(canonicalJson(state),before);
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {startSangmuCohort} from '../src/kbo-sangmu-start.js';
import {canonicalJson} from '../src/game.js';
import {kboRelationshipListView} from '../src/kbo-relations.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {kboOpponentReunionNoticeRows} from '../src/kbo-reunion-events.js';
import {emptySangmuUnit} from '../src/kbo-sangmu-unit.js';

let cached:KboCareer|undefined;
function input(){
 if(!cached){
  const c=enteredKboCareer(),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,r=c.relationships.relations.find(r=>r.type==='TEAMMATE'&&club.roster.includes(r.otherPlayerKey))!;assert.ok(r);
  // Controlled eligible candidate guarantees this relationship's actual intake; it is not an NPC-distribution test.
  for(const k of club.roster)if(k!==r.otherPlayerKey && k!==c.protagonistKey && c.world.players[k]!.kind==='HITTER')c.world.players[k]!.age=28;
  const p=c.world.players[r.otherPlayerKey]!;p.age=19;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,1_000_000]));p.potential={...p.abilities};p.careerPeaks={...p.abilities};cached=c;
 }
 const c=structuredClone(cached),club=c.world.clubs.find(t=>t.id===c.protagonistClubId)!,r=c.relationships.relations.find(r=>r.type==='TEAMMATE'&&club.roster.includes(r.otherPlayerKey))!;return {c,r};
}
function finishDay(source:KboCareer){let c=source;for(let i=0;i<150;i++){const r=advanceKboCareer(c,c.revision);c=r.career;assert.notEqual(r.stopReason,'ENGINE_LIMIT');if(r.daysClosed)return c;}throw Error('DAY_LIMIT');}

test('actual teammate intake separates both relation kinds, preserving prior history and all non-relation simulation state',()=>{
 const {c,r}=input(),rival={...structuredClone(r),type:'RIVAL' as const,relationKey:JSON.stringify(['RIVAL',r.normalPairKey]),stage:'REUNITED_TEAM' as const};
 c.relationships.relations=[...c.relationships.relations,rival];const before=canonicalJson(c),a=startSangmuCohort(c,c.revision),b=startSangmuCohort(JSON.parse(before),c.revision);
 assert.deepEqual(a,b);assert.equal(canonicalJson(c),before);assert.ok(a.sangmu!.members[r.otherPlayerKey]);assert.ok(!a.world.players[r.otherPlayerKey]);
 for(const old of [r,rival]){const next=a.relationships.relations.find(x=>x.relationKey===old.relationKey)!;assert.equal(next.type,old.type);assert.equal(next.stage,'SEPARATED');assert.deepEqual(next.milestones.slice(0,-1),old.milestones);assert.equal(next.milestones.at(-1)!.worldDay,c.world.calendar.growthDays[0]);assert.equal(next.milestones.at(-1)!.evidenceKey,JSON.stringify(['relation-separation',old.relationKey,a.sangmu!.members[r.otherPlayerKey]!.program.programId]));}
 const without=structuredClone(c);without.relationships.relations=[];const control=startSangmuCohort(without,without.revision);
 for(const k of ['world','sangmu','records','health','events','relationNotices','seasonGrowth','development'] as const)assert.deepEqual(a[k],control[k]);
 assert.equal(kboRelationshipListView(a).find(x=>x.relationKey===r.relationKey)!.stage,'SEPARATED');
});

test('unselected, already separated and military-loaned relations retain their existing stages',()=>{
 for(const stage of ['SEPARATED','REUNITED_OPPONENT','RETIRED'] as const){const {c,r}=input();r.stage=stage;const moved=startSangmuCohort(c,c.revision);assert.deepEqual(moved.relationships,c.relationships);}
 const {c,r}=input();c.world.players[r.otherPlayerKey]!.age=28;const unselected=startSangmuCohort(c,c.revision);assert.ok(!unselected.sangmu!.members[r.otherPlayerKey]);assert.deepEqual(unselected.relationships,c.relationships);
 const loan=input();loan.c.sangmu={...emptySangmuUnit(),loaned:[loan.c.protagonistKey]};const club=loan.c.world.clubs.find(t=>t.id===loan.c.protagonistClubId)!,me=loan.c.world.players[loan.c.protagonistKey]!;
 const reserve=club.roster.find(k=>!club.firstTeam.includes(k) && loan.c.world.players[k]!.position===me.position)!;assert.ok(reserve);club.firstTeam=club.firstTeam.map(k=>k===me.simulationKey?reserve:k);loan.c.registration.firstTeam=false;loan.c.registration.competitionKey='FUTURES';
 const moved=startSangmuCohort(loan.c,loan.c.revision);assert.ok(moved.sangmu!.members[loan.r.otherPlayerKey]);assert.deepEqual(moved.relationships,loan.c.relationships);
});

test('invalid relation ownership or duplicate evidence rejects the entire intake without mutating its source',()=>{
 for(const mutate of [(c:KboCareer)=>{c.relationships.relations[0]!.primaryPlayerKey='foreign';},(c:KboCareer)=>{c.relationships.relations[0]!.normalPairKey='foreign';},(c:KboCareer)=>{c.relationships.relations[0]!.milestones=[];},(c:KboCareer)=>{c.relationships.relations=[...c.relationships.relations,structuredClone(c.relationships.relations[0]!)];}]){
  const {c}=input();mutate(c);const before=canonicalJson(c);assert.throws(()=>startSangmuCohort(c,c.revision),/INVALID_CAREER_RELATION/);assert.equal(canonicalJson(c),before);
 }
 const {c,r}=input(),selectionSeason=String(Number(c.world.seasonKey)-1),programId=JSON.stringify(['sangmu-program',c.world.worldKey,selectionSeason,r.otherPlayerKey]);r.milestones=[...r.milestones,{stage:'SEPARATED',worldDay:31,evidenceKey:JSON.stringify(['relation-separation',r.relationKey,programId])}];
 const before=canonicalJson(c);assert.throws(()=>startSangmuCohort(c,c.revision),/SANGMU_RELATION_EVIDENCE_REUSED/);assert.equal(canonicalJson(c),before);
});

test('duplicate intake and reading a previously enlisted save never add separation retroactively',()=>{
 const {c,r}=input(),moved=startSangmuCohort(c,c.revision);assert.throws(()=>startSangmuCohort(moved,moved.revision),/SANGMU_COHORT_NOT_AVAILABLE/);
 const legacy=structuredClone(moved);legacy.relationships=structuredClone(c.relationships);const before=canonicalJson(legacy);
 assert.equal(kboRelationshipListView(legacy).find(x=>x.relationKey===r.relationKey)!.stage,'FORMED');assert.equal(canonicalJson(legacy),before);
});

test('intake separation supplies the real opposing army appearance path to E95, without a synthetic meeting',()=>{
 const {c,r}=input(),u=startSangmuCohort(c,c.revision),p=confirmKboPreseasonPlan(u,u.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),a=startKboRegularSeason(s,s.revision);
 const club=a.world.clubs.find(t=>t.id===a.protagonistClubId)!,me=a.world.players[a.protagonistKey]!,reserve=club.roster.find(k=>!club.firstTeam.includes(k) && a.world.players[k]!.position===me.position)!;assert.ok(reserve);
 club.firstTeam=club.firstTeam.map(k=>k===me.simulationKey?reserve:k);a.registration={...a.registration,firstTeam:false,competitionKey:'FUTURES'};
 const game=a.competitionSchedule!.leagues.FUTURES.find(g=>[g.homeTeamKey,g.awayTeamKey].includes('SANGMU') && [g.homeTeamKey,g.awayTeamKey].includes(club.id))!;assert.ok(game);
 a.competitionSchedule!.leagues={KBO:[],FUTURES:[game]};a.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:game.worldDay,pendingGame:null};
 const before=canonicalJson(a),played=finishDay(a),again=finishDay(JSON.parse(before));assert.deepEqual(played,again);assert.equal(canonicalJson(a),before);
 const actual=played.records.games[game.simulationKey]!;assert.ok(actual.batting[me.simulationKey]);assert.ok(actual.batting[r.otherPlayerKey]);
 const notice=kboOpponentReunionNoticeRows(played).find(n=>n.relationKey===r.relationKey)!;assert.ok(notice);assert.equal(notice.definitionId,'E95');assert.equal(played.relationships.relations.find(x=>x.relationKey===r.relationKey)!.stage,'REUNITED_OPPONENT');
});

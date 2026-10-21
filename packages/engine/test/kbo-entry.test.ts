import {acknowledgeTraitSummary,unreadTraitSummary} from '../src/trait-notices.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft,careerKboDraftView,assertCareerKboSigning} from '../src/career-kbo.js';
import {closeSchoolSeasonForKbo,assertKboAmateurYearEnd} from '../src/kbo-entry.js';
import {applyCareerSeasonTraining} from '../src/high-school-training.js';
import {beginPitchLearning} from '../src/repertoire.js';
import {formHighSchoolRelations} from '../src/relationships.js';
import {queueRelationFormationNotices,unreadRelationNotices,resolveCareerRelationNotice} from '../src/relation-notices.js';
import {canonicalJson} from '../src/game.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
function signed(kind:'HITTER'|'PITCHER'='HITTER',edit?:(source:HighSchoolCareer)=>HighSchoolCareer){
 let s=completedHighSchoolCareer(800_000,kind);if(edit)s=edit(s);s=acknowledgeHighSchoolSeasonReview(s,s.revision);s=openHighSchoolCareerRoute(s,s.revision,1).career;s=prepareCareerKboDraft(s,s.revision);s=resolveCareerKboDraft(s,s.revision,1);return decideCareerKboDraft(s,s.revision,{programVersion:2,decision:'SIGN',eventVersion:1});
}
for(const kind of ['HITTER','PITCHER'] as const)test(kind+' signed school year closes only with explicit unused-training decision, without age/pro roster/salary or growth payout',()=>{
 const source=signed(kind),before=canonicalJson(source);assert.throws(()=>closeSchoolSeasonForKbo(source,source.revision),/TRAINING_FORFEIT_REQUIRED/);assert.equal(canonicalJson(source),before);
 const closed=closeSchoolSeasonForKbo(source,source.revision,true);assert.equal(closed.revision,source.revision+1);assert.equal(closed.seasonGrowth!.finalized,true);assert.ok(closed.health.closedSeasons.includes('2029'));assert.equal(closed.world.players.own!.age,18);assert.equal(closed.kboRecruitment!.world.seasonKey,'2030');assert.equal(Object.keys(closed.kboRecruitment!.world.players).length,500);
 for(const key of ['world','records','days','relationships','kboRecruitment','planHistory'] as const)assert.equal(canonicalJson(closed[key]??null),canonicalJson(source[key]??null));assert.equal(closed.seasonGrowth!.totalBudgetUnits,source.seasonGrowth!.totalBudgetUnits);assert.equal(closed.development!.trainingResults.at(-1)!.choice.type,'SKIP');assert.deepEqual(closed.development!.trainingRng,source.development!.trainingRng);
 assert.equal(assertKboAmateurYearEnd(closed).contractKey,source.kboRecruitment!.program.signing!.contract.contractKey);assert.equal(careerKboDraftView(closed).status,'SIGNED');assert.equal(assertCareerKboSigning(closed).program.decision,'SIGNED');assert.equal(canonicalJson(closeSchoolSeasonForKbo(JSON.parse(JSON.stringify(source)),source.revision,true)),canonicalJson(closed));assert.throws(()=>closeSchoolSeasonForKbo(closed,closed.revision,true),/INVALID_KBO_AMATEUR_YEAR_END/);assert.equal(canonicalJson(source),before);
});

test('already used training is preserved and an unfinished pitch learning never publishes year end',()=>{
 const source=signed('HITTER',s=>applyCareerSeasonTraining(s,{type:'SKIP'})),closed=closeSchoolSeasonForKbo(source,source.revision);assert.deepEqual(closed.development,source.development);
 const learning=signed('PITCHER',s=>{s.world.repertoires.own=beginPitchLearning(s.world.repertoires.own!,'P04',true);return s;}),before=canonicalJson(learning);assert.throws(()=>closeSchoolSeasonForKbo(learning,learning.revision,true),/LEARNING_SETTLEMENT_REQUIRED/);assert.equal(canonicalJson(learning),before);
});

test('mild/medium injuries retain team-game recovery across closure while major season injury ends',()=>{
 for(const severity of ['MILD','MEDIUM','MAJOR'] as const){const source=signed('HITTER',s=>{const receipt=s.health.games.filter(g=>g.evidence.roster.includes('own')).at(-1)!;receipt.result.injured.push('own');s.days.days.find(d=>d.day===receipt.evidence.day)!.result.injured.push('own');s.health.injuries.own={severity,remainingTeamGames:severity==='MAJOR'?null:severity==='MILD'?3:8,diagnosedGameKey:receipt.evidence.gameKey,seasonKey:'2029'};return s;});
 const closed=closeSchoolSeasonForKbo(source,source.revision,true);if(severity==='MAJOR')assert.equal(closed.health.injuries.own,undefined);else assert.equal(closed.health.injuries.own!.remainingTeamGames,severity==='MILD'?3:8);assert.ok(source.health.injuries.own);assert.deepEqual(closed.health.rng,source.health.rng);}
});

test('stale revision/unsigned route/changed signing and changed sealed data cannot close or repair a year end',()=>{
 const source=signed(),before=canonicalJson(source);assert.throws(()=>closeSchoolSeasonForKbo(source,source.revision-1,true),/REVISION/);assert.throws(()=>closeSchoolSeasonForKbo(completedHighSchoolCareer(),0,true));
 const bad=structuredClone(source);bad.kboRecruitment!.program.signing!.reservedSalaryAfterWon++;assert.throws(()=>closeSchoolSeasonForKbo(bad,bad.revision,true),/SIGNING/);assert.equal(canonicalJson(source),before);
 const closed=closeSchoolSeasonForKbo(source,source.revision,true);for(const mutate of [(s:HighSchoolCareer)=>{s.kboYearEnd!.sourceRevision--;},(s:HighSchoolCareer)=>{s.world.players.own!.age++;},(s:HighSchoolCareer)=>{s.kboRecruitment!.program.signing!.contract.annualSalaryWon++;},(s:HighSchoolCareer)=>{s.kboYearEnd!.contractKey='wrong';}]){const changed=structuredClone(closed);mutate(changed);assert.throws(()=>careerKboDraftView(changed),/YEAR_END/);assert.throws(()=>assertKboAmateurYearEnd(changed),/YEAR_END/);}
});

test('reading E94 after KBO year end validates then updates only its metadata seal and keeps signing valid',()=>{
 const source=signed('HITTER',s=>{s.relationships=formHighSchoolRelations(s.world,31);const notices=queueRelationFormationNotices(s,180);assert.ok(notices);s.relationNotices=notices;return s;}),closed=closeSchoolSeasonForKbo(source,source.revision,true),notice=unreadRelationNotices(closed)[0]!,read=resolveCareerRelationNotice(closed,closed.revision,{eventKey:notice.eventKey,eventVersion:1,command:'OPEN_RELATIONS'}).career;
 assert.equal(assertKboAmateurYearEnd(read).receiptKey,closed.kboYearEnd!.receiptKey);assert.equal(careerKboDraftView(read).status,'SIGNED');for(const key of ['world','records','health','development','seasonGrowth','kboRecruitment','phaseContext'] as const)assert.equal(canonicalJson(read[key]),canonicalJson(closed[key]));assert.equal(unreadRelationNotices(read).length,unreadRelationNotices(closed).length-1);
 const bad=structuredClone(closed);bad.world.players.own!.fatigue++;assert.throws(()=>resolveCareerRelationNotice(bad,bad.revision,{eventKey:notice.eventKey,eventVersion:1,command:'OPEN_RELATIONS'}),/YEAR_END/);
});

test('general trait summary after sealed KBO year end does not invalidate activation evidence or repair bad seals',()=>{
 const source=signed('HITTER',s=>{s.traits!.owned.own={unlocked:['T02'],qualifiedRivalPitcherKeys:[]};s.traits!.unlocks=[{playerKey:'own',traitId:'T02',worldDay:100,recordRevision:s.records.revision}];return s;}),closed=closeSchoolSeasonForKbo(source,source.revision,true),read=acknowledgeTraitSummary(closed,closed.revision);
 assert.equal(read.revision,closed.revision+1);assert.equal(unreadTraitSummary(read).length,0);assertKboAmateurYearEnd(read);assert.equal(careerKboDraftView(read).status,'SIGNED');assert.deepEqual(read.kboRecruitment,closed.kboRecruitment);assert.equal(canonicalJson(read.world),canonicalJson(closed.world));assert.deepEqual(acknowledgeTraitSummary(read,read.revision),read);
 const bad=structuredClone(closed);bad.kboYearEnd!.sourceBasis='changed';assert.throws(()=>acknowledgeTraitSummary(bad,bad.revision),/YEAR_END/);
});

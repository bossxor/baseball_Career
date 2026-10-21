import test from 'node:test';
import assert from 'node:assert/strict';
import {completedHighSchoolCareer} from './fixtures.js';
import {acknowledgeHighSchoolSeasonReview,openHighSchoolCareerRoute} from '../src/high-school-route.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {closeSchoolSeasonForKbo,assertKboAmateurYearEnd} from '../src/kbo-entry.js';
import {startSignedKboCareer,kboCareerEntryView} from '../src/kbo-career-entry.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {canonicalJson} from '../src/game.js';
import {formHighSchoolRelations} from '../src/relationships.js';
import {queueRelationFormationNotices} from '../src/relation-notices.js';
import {grantPracticePitchXp} from '../src/repertoire.js';
import {recordTotals} from '../src/records.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
function ready(kind:'HITTER'|'PITCHER'='HITTER',edit?:(s:HighSchoolCareer)=>void){
 let s=completedHighSchoolCareer(800_000,kind);s.relationships=formHighSchoolRelations(s.world,31);s.relationNotices=queueRelationFormationNotices(s,180)!;if(edit)edit(s);
 s=acknowledgeHighSchoolSeasonReview(s,s.revision);s=openHighSchoolCareerRoute(s,s.revision,1).career;s=prepareCareerKboDraft(s,s.revision);s=resolveCareerKboDraft(s,s.revision,1);s=decideCareerKboDraft(s,s.revision,{programVersion:2,decision:'SIGN',eventVersion:1});return closeSchoolSeasonForKbo(s,s.revision,true);
}
for(const kind of ['HITTER','PITCHER'] as const)test(kind+' school year end→actual pro roster applies signing once, ages own player once, preserves500 NPCs and opens fresh budgets',()=>{
 const source=ready(kind),snapshot=canonicalJson(source),signing=source.kboRecruitment!.program.signing!,base=source.kboRecruitment!.world,entered=startSignedKboCareer(source,source.revision),world=entered.world;
 assertKboRecruitmentWorld(world);assertKboAmateurYearEnd(source);assert.equal(world.status,'ACTIVE');assert.equal(world.seasonKey,'2030');assert.equal(Object.keys(world.players).length,501);assert.equal(world.players.own!.age,19);assert.equal(world.players.own!.fatigue,0);assert.deepEqual(world.players.own!.abilities,source.world.players.own!.abilities);assert.deepEqual(world.players.own!.potential,source.world.players.own!.potential);assert.deepEqual(world.players.own!.careerPeaks,source.world.players.own!.careerPeaks);
 for(const [k,p] of Object.entries(base.players))assert.equal(canonicalJson(world.players[k]),canonicalJson(p));
 for(const club of world.clubs){const old=base.clubs.find(c=>c.id===club.id)!;assert.deepEqual(club.firstTeam,old.firstTeam);assert.equal(club.paidSalaryWon,old.paidSalaryWon);if(club.id===signing.registration.clubId){assert.deepEqual(club.roster,signing.rosterAfter);assert.equal(club.roster.length,51);assert.equal(club.reservedSalaryWon,old.reservedSalaryWon+30_000_000);}else assert.deepEqual(club,old);}
 assert.deepEqual(world.contracts.own,signing.contract);assert.equal(entered.registration.status,'ACTIVE');assert.equal(entered.registration.firstTeam,false);assert.deepEqual(entered.rights,signing.rights);assert.equal(entered.revision,source.revision+1);assert.equal(entered.phaseContext.phase,'PRESEASON_SETUP');assert.equal(entered.seasonGrowth.totalBudgetUnits,0);assert.equal(entered.seasonGrowth.finalized,false);assert.equal(entered.seasonGrowth.worldGrowthDays,world.calendar.growthDays.length);assert.equal(entered.development.seasonStartPlayer.age,19);assert.deepEqual(entered.development.trainingUsedSeasons,source.development!.trainingUsedSeasons);assert.equal(entered.development.trainingUsedSeasons.includes('2030'),false);assert.equal(entered.traits!.lastClosedDay,null);assert.equal(entered.traits!.lastSeasonKey,'2030');
 assert.equal(canonicalJson(entered.records),canonicalJson(source.records));assert.equal(Object.keys(recordTotals(entered.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:'2030'}).teams).length,0);assert.equal(canonicalJson(entered.amateurHistory),snapshot);assert.equal(canonicalJson(source),snapshot);assert.equal(canonicalJson(startSignedKboCareer(JSON.parse(JSON.stringify(source)),source.revision)),canonicalJson(entered));assert.equal(entered.world.rng.roster.draws,base.rng.roster.draws);
});

test('pitcher earned book/weights survive entry but annual XP/learning/window state starts fresh',()=>{
 const source=ready('PITCHER',s=>{s.world.repertoires.own=grantPracticePitchXp(s.world.repertoires.own!,'old-earned-practice','P01',3,5);}),old=source.world.repertoires.own!,entered=startSignedKboCareer(source,source.revision),book=entered.world.repertoires.own!;
 assert.ok(old.ledger.baseSpentUnits>0);assert.deepEqual(book.book,old.book);assert.deepEqual(book.weights,old.weights);assert.equal(book.seasonId,'2030');assert.equal(book.ledger.baseSpentUnits,0);assert.equal(book.learning,null);assert.deepEqual(book.usedWindows,[]);assert.equal(canonicalJson(entered.amateurHistory.world.repertoires.own),canonicalJson(old));
});

test('new pro teammate/formation notice append to HS history from actual club registration, not guaranteed first team',()=>{
 const source=ready(),entered=startSignedKboCareer(source,source.revision),ledger=entered.relationships,entry=ledger.teamEntries!.at(-1)!;
 assert.deepEqual(ledger.relations.slice(0,source.relationships!.relations.length),source.relationships!.relations);assert.equal(ledger.relations.length,source.relationships!.relations.length+1);assert.equal(entry.leagueKey,'KBO');assert.equal(entry.teamId,entered.protagonistClubId);assert.equal(entry.registrationReceiptKey,source.kboRecruitment!.program.signing!.receiptKey);assert.ok(entered.world.clubs.find(c=>c.id===entry.teamId)!.roster.includes(entry.otherPlayerKey!));assert.equal(entered.world.players[entry.otherPlayerKey!]!.kind,'HITTER');
 assert.deepEqual(entered.relationNotices.slice(0,source.relationNotices!.length),source.relationNotices);assert.equal(entered.relationNotices.length,source.relationNotices!.length+1);const notice=entered.relationNotices.at(-1)!;assert.equal(notice.definitionId,'E94');assert.equal(notice.seasonKey,'2030');assert.equal(notice.evidence.fields.relationId,entry.relationKey);assert.equal(notice.resume.competitionKey,'KBO');assert.equal(notice.status,'OPEN');assert.ok(entered.events.every(e=>e.status!=='OPEN'));
});

test('team-game injury carries without healing across new calendar; old school injuries stay only in archive',()=>{
 const source=ready('HITTER',s=>{const receipt=s.health.games.filter(g=>g.evidence.roster.includes('own')).at(-1)!,other=receipt.evidence.roster.find(k=>k!=='own')!;for(const k of ['own',other]){receipt.result.injured.push(k);s.days.days.find(d=>d.day===receipt.evidence.day)!.result.injured.push(k);s.health.injuries[k]={severity:'MEDIUM',remainingTeamGames:8,diagnosedGameKey:receipt.evidence.gameKey,seasonKey:'2029'};}}),entered=startSignedKboCareer(source,source.revision);
 assert.deepEqual(Object.keys(entered.health.injuries),['own']);assert.equal(entered.health.injuries.own!.remainingTeamGames,8);assert.ok(Object.keys(entered.amateurHistory.health.injuries).length>1);assert.deepEqual(entered.health.rng,source.health.rng);assert.notStrictEqual(entered.health.injuries.own,source.health.injuries.own);
});

test('stale/unsigned/unclosed/changed sealed source and wrong root reject without duplicate roster/salary or age',()=>{
 const source=ready(),before=canonicalJson(source);assert.throws(()=>startSignedKboCareer(source,source.revision-1),/REVISION/);const unclosed=structuredClone(source);delete unclosed.kboYearEnd;assert.throws(()=>startSignedKboCareer(unclosed,unclosed.revision),/YEAR_END/);const bad=structuredClone(source);bad.kboRecruitment!.program.signing!.reservedSalaryAfterWon++;assert.throws(()=>startSignedKboCareer(bad,bad.revision),/YEAR_END/);assert.equal(canonicalJson(source),before);
 const entered=startSignedKboCareer(source,source.revision);assert.throws(()=>startSignedKboCareer(entered as unknown as HighSchoolCareer,entered.revision));assert.equal(Object.keys(entered.world.players).length,501);
});

test('entry public DTO omits raw roots/P/abilities/seed/RNG; restored entry projects identically and malformed registration rejects',()=>{
 const source=ready(),entered=startSignedKboCareer(source,source.revision),before=canonicalJson(entered),view=kboCareerEntryView(entered);assert.equal(view.player.age,19);assert.equal(view.contract.annualSalaryWon,30_000_000);assert.equal(view.registration.firstTeam,false);assert.deepEqual(kboCareerEntryView(JSON.parse(JSON.stringify(entered))),view);assert.doesNotMatch(JSON.stringify(view),/potential|abilities|sourceBasis|amateurHistory|"rng"|"seed"/i);assert.equal(canonicalJson(entered),before);
 const bad=structuredClone(entered);bad.registration.firstTeam=true as false;assert.throws(()=>kboCareerEntryView(bad),/INVALID_KBO_ENTRY_VIEW/);
});

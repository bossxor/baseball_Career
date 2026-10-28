import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer,completedCollegeAcademicYear} from './fixtures.js';
import {confirmCollegePreseason,advanceCollegeCareer} from '../src/college-career.js';
import {assertCollegeWorld} from '../src/college-world.js';
import type {CollegeWorld} from '../src/college-world.js';
import {assertCollegeCareerRevision} from '../src/high-school-career.js';
import {closeCollegeSeasonForNextYear,startNextCollegeSeason} from '../src/college-year.js';
import {canonicalJson} from '../src/game.js';
import {createOwnCareerAssessment} from '../src/high-school-assessment.js';
import {graduateCollegeCareer} from '../src/college-graduation.js';
import {prepareCareerKboDraft,resolveCareerKboDraft,decideCareerKboDraft} from '../src/career-kbo.js';
import {closeSchoolSeasonForKbo} from '../src/kbo-entry.js';
import {startSignedKboCareer} from '../src/kbo-career-entry.js';
import {prepareCareerUsDirect,careerUsDirectView,decideCareerUsDirect} from '../src/career-us.js';
import {createUsRosterWorld} from '../src/us-world.js';
import {initialUsRecruitmentInventory} from '../src/us-inventory.js';
import {closeSchoolSeasonForUs} from '../src/us-entry.js';
import {startSignedUsCareer} from '../src/us-career-entry.js';

test('college world permits a carried student older than22 while its NPC generation remains19–22',()=>{
 const c=enrolledCollegeCareer();c.world.players.own!.age=23;assert.doesNotThrow(()=>assertCollegeWorld(c.world as CollegeWorld));const npc=Object.keys(c.world.players).find(k=>k!=='own')!;c.world.players[npc]!.age=23;assert.throws(()=>assertCollegeWorld(c.world as CollegeWorld),/AGE/);
});
test('native partial college play survives real18month active service and resumes the same academic year on a future school schedule',async()=>{
 const api=await import('../src/college-service.js');let source=confirmCollegePreseason(enrolledCollegeCareer('PITCHER'),enrolledCollegeCareer('PITCHER').revision);
 for(let i=0;i<50;i++){const out=advanceCollegeCareer(source,source.revision,i===0?'ONE_GAME':undefined);source=out.career;if(out.stopReason==='ONE_GAME')break;}
 assert.equal(source.phaseContext.phase,'SEASON_PROGRESS');if(source.phaseContext.phase!=='SEASON_PROGRESS')throw Error('phase');assert.equal(source.phaseContext.pendingGame,null);assert.ok(Object.values(source.records.games).some(g=>g.scope.leagueKey==='COLLEGE'&&g.scope.seasonKey==='2030'));
 const raw=canonicalJson(source),leave=api.startCollegeMilitaryLeave(source,source.revision),originalRecords=canonicalJson(source.records);assert.equal(leave.collegeAdmission!.status,'ON_LEAVE');assert.equal(leave.collegeAdmission!.academicYear,1);assert.equal(leave.collegeAdmission!.yearsCompleted,0);assert.equal(leave.phaseContext.phase,'SERVICE_PROGRESS');assert.equal(canonicalJson(source),raw);assert.equal(canonicalJson(leave.records),originalRecords);assert.throws(()=>advanceCollegeCareer(leave,leave.revision),/REGISTRATION/);assert.throws(()=>api.resumeCollegeAfterService(leave,leave.revision,1),/COMPLETE|READY/);
 let c=leave;for(let i=0;i<40&&c.phaseContext.phase==='SERVICE_PROGRESS';i++)c=api.advanceCollegeMilitaryService(JSON.parse(JSON.stringify(c)),c.revision,31).career;
 assert.equal(c.phaseContext.phase,'EVENT_DECISION');assert.equal(c.collegeService!.status,'COMPLETED');assert.equal(c.world.seasonKey,'2032');assert.equal(c.world.players.own!.age,21);assert.equal(c.events.at(-1)!.definitionId,'E76');assert.equal(c.collegeAdmission!.academicYear,1);assert.equal(c.collegeAdmission!.yearsCompleted,0);assert.equal(canonicalJson(c.records),originalRecords);assert.ok(c.collegeService!.closedDays.length>500);assert.equal(c.collegeService!.completionDays[1]!.worldDay,181);
 const event=c.events.at(-1)!,before=canonicalJson(c);assert.throws(()=>api.resumeCollegeAfterService(c,c.revision-1,event.version),/REVISION/);assert.throws(()=>api.resumeCollegeAfterService(c,c.revision,event.version+1),/VERSION/);const corrupt=structuredClone(c);corrupt.collegeService!.source.days.days=[];assert.throws(()=>api.resumeCollegeAfterService(corrupt,corrupt.revision,event.version),/EVIDENCE|STALE/);
 const history=structuredClone(c);history.collegeService!.years[0]!.world.players.own!.fatigue++;assert.throws(()=>api.resumeCollegeAfterService(history,history.revision,event.version),/EVIDENCE|STALE/);
 const resumed=api.resumeCollegeAfterService(JSON.parse(JSON.stringify(c)),c.revision,event.version);assertCollegeCareerRevision(resumed,resumed.revision);assert.equal(resumed.world.seasonKey,'2033');assert.equal(resumed.world.players.own!.age,22);assert.equal(resumed.collegeAdmission!.academicYear,1);assert.equal(resumed.collegeAdmission!.yearsCompleted,0);assert.equal(resumed.collegeAdmission!.status,'ENROLLED');assert.equal(resumed.days.days.length,0);assert.equal(resumed.seasonGrowth!.totalBudgetUnits,0);assert.equal(canonicalJson(resumed.records),originalRecords);assert.equal(canonicalJson(c),before);assert.equal(resumed.collegeService!.source.world.seasonKey,'2030');assert.deepEqual(resumed.world.players.own!.potential,source.world.players.own!.potential);assert.deepEqual(resumed.world.repertoires.own!.book,c.world.repertoires.own!.book);assert.throws(()=>api.startCollegeMilitaryLeave(resumed,resumed.revision),/ALREADY|COMPLETE/);
 let playing=confirmCollegePreseason(resumed,resumed.revision);for(let i=0;i<50;i++){const out=advanceCollegeCareer(playing,playing.revision,i===0?'ONE_GAME':undefined);playing=out.career;if(out.stopReason==='ONE_GAME')break;}
 assert.ok(Object.values(playing.records.games).some(g=>g.scope.seasonKey==='2033'&&g.scope.leagueKey==='COLLEGE'));assert.equal(Object.values(playing.records.games).filter(g=>g.scope.seasonKey==='2030').length,Object.values(source.records.games).filter(g=>g.scope.seasonKey==='2030').length);
 // Controlled completed future years verify the actual enrollment transitions after the native leave/resume proof.
 const completed=completedCollegeAcademicYear(resumed),closed=closeCollegeSeasonForNextYear(completed,completed.revision,true),second=startNextCollegeSeason(closed,closed.revision);assert.equal(second.collegeAdmission!.academicYear,2);assert.equal(second.world.players.own!.age,23);assertCollegeCareerRevision(second,second.revision);
});
test('college service completion survives later graduation and actual KBO/US signing activation without resetting age or military status',async()=>{
 const api=await import('../src/college-service.js');let c=enrolledCollegeCareer();const player=c.world.players.own!;player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,950000]));player.potential={...player.abilities};player.careerPeaks={...player.abilities};c.development!.seasonStartPlayer=structuredClone(player);c.seasonGrowth!.seasonStart=structuredClone(player);c.ownAssessment=createOwnCareerAssessment(c.world);
 c=api.startCollegeMilitaryLeave(c,c.revision);for(let i=0;i<40&&c.phaseContext.phase==='SERVICE_PROGRESS';i++)c=api.advanceCollegeMilitaryService(c,c.revision,31).career;c=api.resumeCollegeAfterService(c,c.revision,c.events.at(-1)!.version);
 for(let year=1;year<=4;year++){c=completedCollegeAcademicYear(c);if(year<4){c=closeCollegeSeasonForNextYear(c,c.revision,true);c=startNextCollegeSeason(c,c.revision);}}
 c=graduateCollegeCareer(c,c.revision,c.events.at(-1)!.version);assert.equal(c.world.seasonKey,'2036');assert.equal(c.world.players.own!.age,25);assert.equal(c.collegeAdmission!.yearsCompleted,4);
 let kbo=prepareCareerKboDraft(c,c.revision);kbo=resolveCareerKboDraft(kbo,kbo.revision,1);kbo=decideCareerKboDraft(kbo,kbo.revision,{programVersion:2,decision:'SIGN'});kbo=closeSchoolSeasonForKbo(kbo,kbo.revision,true);const domestic=startSignedKboCareer(kbo,kbo.revision);assert.equal(domestic.military!.status,'COMPLETED');assert.equal(domestic.military!.completedSeasonKey,'2032');assert.equal(domestic.world.players.own!.age,26);assert.deepEqual(domestic.records,c.records);
 const world=createUsRosterWorld({worldKey:c.world.worldKey,seasonKey:'2037',seed:c.world.seed,difficulty:c.difficulty,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'미국조직'+(i+1)}))}),inventory=initialUsRecruitmentInventory(world,world.organizations.map(o=>({organizationId:o.id,rookieCapacity:23,aCapacity:23,availableBudgetUsd:3000000,nationalReleaseAllowed:true,militaryReturnOption:false})));
 let us=prepareCareerUsDirect(c,c.revision,inventory);const view=careerUsDirectView(us);assert.ok(view.visible);us=decideCareerUsDirect(us,us.revision,{programVersion:1,decision:{type:'SIGN',offerKey:view.offers[0]!.offerKey}});us=closeSchoolSeasonForUs(us,us.revision,true);const overseas=startSignedUsCareer(us,us.revision,world);assert.equal(overseas.military.status,'COMPLETED');assert.equal(overseas.world.players.own!.age,26);assert.deepEqual(overseas.records,c.records);
});
test('service rejects pending games, completed academic years and altered service cursors without changing the source',async()=>{
 const api=await import('../src/college-service.js'),s=enrolledCollegeCareer(),leave=api.startCollegeMilitaryLeave(s,s.revision),raw=canonicalJson(leave);assert.throws(()=>api.advanceCollegeMilitaryService(leave,leave.revision-1,31),/REVISION/);assert.throws(()=>api.advanceCollegeMilitaryService(leave,leave.revision,32),/DAYS/);
 const altered=structuredClone(leave);altered.collegeService!.cursor.worldDay++;assert.throws(()=>api.advanceCollegeMilitaryService(altered,altered.revision,1),/EVIDENCE|CURSOR|CALENDAR/);assert.equal(canonicalJson(leave),raw);
 const complete=completedCollegeAcademicYear();assert.throws(()=>api.startCollegeMilitaryLeave(complete,complete.revision),/INCOMPLETE|NOT_AVAILABLE/);
 const preseason=confirmCollegePreseason(s,s.revision),pending=advanceCollegeCareer(preseason,preseason.revision,'ONE_GAME').career;assert.equal(pending.phaseContext.phase,'SEASON_PROGRESS');if(pending.phaseContext.phase!=='SEASON_PROGRESS')throw Error('phase');assert.ok(pending.phaseContext.pendingGame);assert.throws(()=>api.startCollegeMilitaryLeave(pending,pending.revision),/INCOMPLETE/);
});

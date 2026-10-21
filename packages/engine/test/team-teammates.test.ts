import test from 'node:test';
import assert from 'node:assert/strict';
import {enrolledCollegeCareer} from './fixtures.js';
import {formRegisteredTeamTeammate,teamEntryFormationKey} from '../src/team-teammates.js';
import {formHighSchoolRelations} from '../src/relationships.js';
import {careerRelationshipListView} from '../src/relationship-history.js';
import {queueRelationFormationNotices,unreadRelationNotices,resolveCareerRelationNotice} from '../src/relation-notices.js';
import {canonicalJson} from '../src/game.js';

for(const kind of ['HITTER','PITCHER'] as const)test(kind+' actual college activation adds one teammate with registration E94, no blocking or growth changes',()=>{
 const s=enrolledCollegeCareer(kind),entry=s.relationships!.teamEntries![0]!,me=s.world.players.own!,team=s.world.schools.find(t=>t.id==='U07')!;
 assert.equal(s.relationships!.relations.length,1);assert.equal(entry.registrationReceiptKey,s.collegeAdmission!.admissionKey);assert.equal(entry.seasonKey,'2030');assert.equal(entry.teamId,'U07');assert.equal(entry.leagueKey,'COLLEGE');
 const expected=team.roster.map(k=>s.world.players[k]!).filter(p=>p.kind===kind && p.simulationKey!=='own').sort((a,b)=>Math.abs(a.age-me.age)-Math.abs(b.age-me.age) || (a.simulationKey<b.simulationKey?-1:1))[0]!;
 assert.equal(entry.otherPlayerKey,expected.simulationKey);assert.equal(s.world.schools.length,9);assert.ok(s.world.schools.every(t=>t.roster.length===25));assert.equal(Object.keys(s.world.players).length,225);
 const notices=unreadRelationNotices(s);assert.equal(notices.length,1);assert.equal(notices[0]!.otherName,expected.name);assert.equal(s.phaseContext.phase,'PRESEASON_SETUP');assert.ok(s.events.every(e=>e.status!=='OPEN'));
 const before=canonicalJson(s),read=resolveCareerRelationNotice(s,s.revision,{eventKey:notices[0]!.eventKey,eventVersion:1,command:'OPEN_RELATIONS'}).career;
 for(const key of ['world','records','health','phaseContext','seasonGrowth','relationships'] as const)assert.equal(canonicalJson(read[key]),canonicalJson(s[key]));assert.equal(unreadRelationNotices(read).length,0);assert.deepEqual(queueRelationFormationNotices(read,entry.worldDay),read.relationNotices);assert.equal(canonicalJson(s),before);
 assert.deepEqual(unreadRelationNotices(JSON.parse(JSON.stringify(s))),notices);assert.doesNotMatch(JSON.stringify(notices),/potential|abilities|sourceBasis|"rng"|"seed"/i);
});

test('old HS relationships survive, new college teammate appends and historical/current identities remain distinct',()=>{
 const s=enrolledCollegeCareer(),old=s.previousSeasons![0]!.world,hs=formHighSchoolRelations(old,old.schedule[0]!.worldDay),before=canonicalJson(hs);
 const ledger=formRegisteredTeamTeammate(hs,s.world,s.collegeAdmission!.admissionKey,31);assert.deepEqual(ledger.relations.slice(0,hs.relations.length),hs.relations);assert.equal(ledger.relations.length,hs.relations.length+1);assert.equal(canonicalJson(hs),before);
 s.relationships=ledger;const list=careerRelationshipListView(s);assert.equal(list.filter(r=>r.otherAvailability==='HISTORICAL_ONLY').length,2);assert.equal(list.filter(r=>r.otherAvailability==='CURRENT_WORLD').length,1);
});

test('same team next season or return uses first entry without RNG/extra teammate; another actual team may add one',()=>{
 const s=enrolledCollegeCareer(),ledger=s.relationships!,world=structuredClone(s.world),before=canonicalJson(world);world.seasonKey='2031';
 assert.deepEqual(formRegisteredTeamTeammate(ledger,world,'next-registration',31),ledger);assert.equal(canonicalJson(s.world),before);
 const old=world.schools.find(t=>t.id==='U07')!,next=world.schools.find(t=>t.id==='U08')!;old.roster=old.roster.filter(k=>k!=='own');next.roster=[...next.roster,'own'];world.protagonistSchoolId=next.id;
 const added=formRegisteredTeamTeammate(ledger,world,'transfer-registration',31);assert.equal(added.relations.length,ledger.relations.length+1);assert.equal(added.teamEntries!.length,2);assert.equal(added.teamEntries![1]!.teamId,'U08');
 world.protagonistSchoolId='U07';next.roster=next.roster.filter(k=>k!=='own');old.roster=[...old.roster,'own'];assert.deepEqual(formRegisteredTeamTeammate(added,world,'return-registration',31),added);
});

test('no candidate records empty first entry without generating anyone or retrying; unregistered/invalid receipts reject',()=>{
 const s=enrolledCollegeCareer(),w=structuredClone(s.world),team=w.schools.find(t=>t.id==='U07')!;team.roster=['own'];const before=canonicalJson(w),ledger=formRegisteredTeamTeammate(undefined,w,'entry-empty',31);
 assert.equal(ledger.relations.length,0);assert.equal(ledger.teamEntries![0]!.otherPlayerKey,null);assert.equal(ledger.formation.teammate,'NO_CANDIDATE');assert.equal(canonicalJson(w),before);
 team.roster=s.world.schools.find(t=>t.id==='U07')!.roster;assert.deepEqual(formRegisteredTeamTeammate(ledger,w,'entry-later',32),ledger);
 assert.throws(()=>formRegisteredTeamTeammate(undefined,w,'',31),/INVALID/);assert.throws(()=>formRegisteredTeamTeammate(undefined,w,'x',-1),/INVALID/);team.roster=[];assert.throws(()=>formRegisteredTeamTeammate(undefined,w,'x',31),/REGISTRATION/);
});

test('existing rival may also become teammate without overwriting rival history',()=>{
 const s=enrolledCollegeCareer(),ledger=structuredClone(s.relationships!),relation=ledger.relations[0]!,pair=relation.normalPairKey;delete ledger.teamEntries;ledger.relations=[{...relation,type:'RIVAL',relationKey:JSON.stringify(['RIVAL',pair])}];
 const added=formRegisteredTeamTeammate(ledger,s.world,'rival-joins',31);assert.equal(added.relations.length,2);assert.deepEqual(added.relations[0],ledger.relations[0]);assert.equal(added.relations[1]!.otherPlayerKey,relation.otherPlayerKey);
});

test('college E94 requires exact formation/registration receipt; never synthesizes HS notice in college',()=>{
 const s=enrolledCollegeCareer(),entry=s.relationships!.teamEntries![0]!,r=s.relationships!.relations[0]!;assert.equal(r.milestones[0]!.evidenceKey,teamEntryFormationKey(entry));
 const bad=structuredClone(s);bad.relationships!.teamEntries![0]!.registrationReceiptKey='tampered';assert.throws(()=>unreadRelationNotices(bad),/INVALID_RELATION_NOTICE_SOURCE/);
 const owner=structuredClone(s);owner.relationships!.teamEntries![0]!.primaryPlayerKey='other';assert.throws(()=>unreadRelationNotices(owner),/INVALID_TEAM_ENTRY_RELATION/);
 const duplicate=structuredClone(s);duplicate.relationships!.teamEntries=[entry,entry];assert.throws(()=>unreadRelationNotices(duplicate),/INVALID_RELATION_NOTICE_SOURCE/);
 const historical=structuredClone(s);historical.relationships=formHighSchoolRelations(s.previousSeasons![0]!.world,31);delete historical.relationNotices;assert.equal(queueRelationFormationNotices(historical,31),undefined);
});

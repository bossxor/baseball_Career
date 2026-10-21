import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import type {HighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer} from '../src/high-school-career.js';
import {formHighSchoolRelations,validateRelationshipLedger,relationshipListView} from '../src/relationships.js';
import {canonicalJson} from '../src/game.js';

const world=(seed='rel-fixture')=>createHighSchoolWorld({worldKey:'rel-world',seasonKey:'2032',seed,schoolId:'H01',startDay:31,player:{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}});
const total=(w:HighSchoolWorld,key:string)=>{const p=w.players[key]!;return abilityKeys(p.kind).reduce((s,k)=>s+p.abilities[k]!,0);};

test('career start forms one same-team teammate and one eligible rival, distinct and deterministic',()=>{
 const w=world(),ledger=formHighSchoolRelations(w,31);
 validateRelationshipLedger(ledger,w);
 const rival=ledger.relations.find(r=>r.type==='RIVAL')!,mate=ledger.relations.find(r=>r.type==='TEAMMATE')!;
 assert.equal(ledger.formation.rival,'FORMED');assert.equal(ledger.formation.teammate,'FORMED');
 assert.notEqual(rival.otherPlayerKey,mate.otherPlayerKey);
 for(const r of [rival,mate]){assert.equal(w.players[r.otherPlayerKey]!.kind,'HITTER');assert.notEqual(r.otherPlayerKey,'me');assert.equal(r.stage,'FORMED');}
 assert.ok(w.schools.find(s=>s.id==='H01')!.roster.includes(mate.otherPlayerKey));
 assert.ok(Math.abs(total(w,rival.otherPlayerKey)-total(w,'me'))<=300_000);
 assert.equal(canonicalJson(formHighSchoolRelations(w,31)),canonicalJson(ledger));
});

test('no eligible rival is a normal empty state; teammate still forms',()=>{
 const w=structuredClone(world());
 for(const p of Object.values(w.players))if(p.simulationKey!=='me' && p.kind==='HITTER')p.abilities=Object.fromEntries(abilityKeys('HITTER').map(k=>[k,Math.min(1_000_000,p.abilities[k]!+200_000)]));
 const ledger=formHighSchoolRelations(w,31);
 assert.equal(ledger.formation.rival,'NO_CANDIDATE');assert.equal(ledger.relations.filter(r=>r.type==='RIVAL').length,0);
 assert.equal(ledger.formation.teammate,'FORMED');
});

test('confirmCareerPlayer stores relations once; list view shows identity only',()=>{
 const started=confirmCareerPlayer(createHighSchoolCareer(world(),'GROWTH'),0);
 assert.equal(started.relationships!.relations.length,2);
 const view=relationshipListView(started.relationships,started.world);
 assert.deepEqual(Object.keys(view[0]!.other).sort(),['bats','kind','name','pitchForm','position','schoolName','throws']);
 assert.doesNotMatch(JSON.stringify(view),/abilit|potential|seed/i);
 assert.deepEqual(relationshipListView(undefined,started.world),[]);
});

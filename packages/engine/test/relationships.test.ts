import test from 'node:test';
import assert from 'node:assert/strict';
import {abilityKeys} from '@playball/rules';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import type {HighSchoolWorld} from '../src/high-school-world.js';
import {canonicalJson} from '../src/game.js';
import {formHighSchoolRelations,validateRelationshipLedger,relationshipListView,relationDetailView} from '../src/relationships.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';

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


function playedWeek():HighSchoolCareer {
 let state=confirmCareerPlayer(createHighSchoolCareer(world(),'GROWTH'),0);
 state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});state=confirmCareerPreseason(state,2);
 for(let i=0;i<60;i++){const r=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_WEEK':undefined);state=r.career;if(r.stopReason!=='CHUNK_LIMIT' && r.stopReason!=='HEALTH_CHANGE')break;}
 return state;
}

test('same-kind detail compares own lines only in games both played; leagues and phases stay separate',()=>{
 const state=playedWeek(),before=canonicalJson(state),scope={leagueKey:'HS',phase:'REGULAR' as const,seasonKey:'2032'};
 for(const r of state.relationships!.relations){
  const view=relationDetailView(state,r.relationKey,scope);
  assert.equal(view.mode,'COMPARISON');if(view.mode!=='COMPARISON')continue;
  const shared=Object.values(state.records.games).filter(g=>[r.primaryPlayerKey,r.otherPlayerKey].every(k=>Object.hasOwn(g.batting,k)||Object.hasOwn(g.pitching,k)));
  assert.equal(view.sharedGames,shared.length);
  assert.equal((view.mine as {PA:number}).PA,shared.reduce((s,g)=>s+(g.batting[r.primaryPlayerKey]?.PA??0),0));
  assert.match(view.note,/직접 상대 전적/);
 }
 const mate=state.relationships!.relations.find(r=>r.type==='TEAMMATE')!;
 assert.deepEqual(relationDetailView(state,mate.relationKey,{leagueKey:'HS',phase:'POSTSEASON'}),{relationKey:mate.relationKey,mode:'EMPTY',reason:'NO_GAMES_IN_SCOPE'});
 assert.throws(()=>relationDetailView(state,'missing',scope),/UNKNOWN_RELATION/);
 assert.equal(canonicalJson(state),before);
});

test('cross-kind detail sums only real batter-vs-pitcher plate appearances',()=>{
 const state=structuredClone(playedWeek());
 const g=Object.values(state.records.games).find(x=>Object.values(x.matchups).some(m=>m.batterKey==='me'))!;
 const m=Object.values(g.matchups).find(x=>x.batterKey==='me')!;
 const key=JSON.stringify(['RIVAL',JSON.stringify(['me',m.pitcherKey].sort())]);
 state.relationships={...state.relationships!,relations:[...state.relationships!.relations,{relationKey:key,type:'RIVAL',normalPairKey:JSON.stringify(['me',m.pitcherKey].sort()),primaryPlayerKey:'me',otherPlayerKey:m.pitcherKey,stage:'FORMED',milestones:[{stage:'FORMED',evidenceKey:'test',worldDay:31}]}]};
 const view=relationDetailView(state,key,{leagueKey:'HS',phase:'REGULAR'});
 assert.equal(view.mode,'DIRECT');if(view.mode!=='DIRECT')return;
 const expected=Object.values(state.records.games).flatMap(x=>Object.values(x.matchups)).filter(x=>x.batterKey==='me' && x.pitcherKey===m.pitcherKey).reduce((s,x)=>s+x.stats.PA,0);
 assert.equal(view.stats.PA,expected);assert.ok(view.stats.PA>0);
 const moved={...state,world:{...state.world,players:Object.fromEntries(Object.entries(state.world.players).filter(([k])=>k!==m.pitcherKey))}};
 assert.equal(relationDetailView(moved,key,{leagueKey:'HS',phase:'REGULAR'}).mode,'UNAVAILABLE');
});

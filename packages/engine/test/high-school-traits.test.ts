import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer,highSchoolGameContext} from '../src/high-school-progress.js';
import {refreshCareerTraits,validateCareerTraitLedger} from '../src/high-school-traits.js';
import {canonicalJson} from '../src/game.js';

const fixture=()=>{
 let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'traits-world',seasonKey:'2032',seed:'traits-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'my-hitter',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return confirmCareerPreseason(state,2);
};
function oneGame(state:HighSchoolCareer):HighSchoolCareer {
 for(let i=0;i<50;i++){const r=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_GAME':undefined);state=r.career;if(r.stopReason!=='CHUNK_LIMIT')return state;}
 throw new Error('TEST_LIMIT');
}
/** Test-only evidence: raise one official HS regular line so the T02 threshold (BB30) is crossed. */
function withWalks(state:HighSchoolCareer,walks:number):HighSchoolCareer {
 const next=structuredClone(state),game=Object.values(next.records.games).find(g=>Object.hasOwn(g.batting,'my-hitter'))!;
 const line=game.batting['my-hitter']!;line.BB+=walks;line.PA+=walks;next.records.revision+=1;return next;
}

test('day close records the evaluated day and unlocks nothing without evidence',()=>{
 const state=oneGame(fixture());
 assert.equal(state.traits!.lastClosedDay,Math.max(...state.days.days.map(d=>d.day)));
 assert.deepEqual(state.traits!.unlocks,[]);
});

test('crossing BB30 unlocks T02 once with a receipt; replay and older days are no-ops',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1,evidence=withWalks(base,30),before=canonicalJson(evidence);
 const ledger=refreshCareerTraits(evidence,day);
 assert.deepEqual(ledger.owned['my-hitter']!.unlocked,['T02']);
 assert.deepEqual(ledger.unlocks.filter(u=>u.playerKey==='my-hitter').map(u=>[u.traitId,u.worldDay]),[['T02',day]]);
 assert.equal(canonicalJson(evidence),before);
 const replay=refreshCareerTraits({...evidence,traits:ledger},day);assert.equal(canonicalJson(replay),canonicalJson(ledger));
 const older=refreshCareerTraits({...evidence,traits:ledger},day-1);assert.equal(canonicalJson(older),canonicalJson(ledger));
 validateCareerTraitLedger(ledger,evidence.world.players);
});

test('owned traits survive a later correction and pitcher-only traits never reach a hitter',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1;
 const unlocked=refreshCareerTraits(withWalks(base,30),day);
 const corrected=refreshCareerTraits({...base,traits:unlocked},day+1);
 assert.deepEqual(corrected.owned['my-hitter']!.unlocked,['T02']);
 assert.ok(corrected.owned['my-hitter']!.unlocked.every(id=>['T01','T02','T03','T04','T05','T06','T13','T14'].includes(id)));
});

test('unlocked traits feed the next game context and the career keeps advancing',()=>{
 const base=oneGame(fixture()),day=base.traits!.lastClosedDay!+1;
 const state={...base,traits:refreshCareerTraits(withWalks(base,30),day)};
 assert.deepEqual(highSchoolGameContext(state).traits['my-hitter']!.unlocked,['T02']);
 assert.equal(highSchoolGameContext(base).traits['my-hitter'],undefined);
 const next=oneGame(state);
 assert.deepEqual(next.traits!.owned['my-hitter']!.unlocked,['T02']);
 assert.ok(next.records.revision>state.records.revision);
});

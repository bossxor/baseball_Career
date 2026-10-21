import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighSchoolWorld} from '../src/high-school-world.js';
import {createHighSchoolCareer,confirmCareerPlayer,resolveCareerFocusEvent,confirmCareerPreseason} from '../src/high-school-career.js';
import type {HighSchoolCareer} from '../src/high-school-career.js';
import {advanceHighSchoolCareer} from '../src/high-school-progress.js';
import {raiseHiddenTraitNotice,resolveHiddenTraitNotice,unreadTraitSummary,acknowledgeTraitSummary} from '../src/trait-notices.js';
import type {TraitId} from '../src/traits.js';

const fixture=()=>{
 let state=createHighSchoolCareer(createHighSchoolWorld({worldKey:'notice-world',seasonKey:'2032',seed:'notice-fixture',schoolId:'H01',startDay:31,player:{simulationKey:'me',name:'내타자',kind:'HITTER',position:'CF',throws:'R',bats:'R',pitchForm:null,archetype:'BALANCED',focus:['CONTACT','POWER','DISCIPLINE','DEFENSE'],difficulty:'GROWTH'}}),'GROWTH');
 state=confirmCareerPlayer(state,0);state=resolveCareerFocusEvent(state,1,{eventKey:state.events[0]!.eventKey,eventVersion:1,command:'KEEP_FOCUS'});return confirmCareerPreseason(state,2);
};
function withUnlock(state:HighSchoolCareer,traitId:TraitId,worldDay=40):HighSchoolCareer {
 const next=structuredClone(state),traits=next.traits!;
 const owned=traits.owned['me']??{unlocked:[],qualifiedRivalPitcherKeys:[]};
 traits.owned['me']={...owned,unlocked:[...owned.unlocked,traitId]};
 traits.unlocks=[...traits.unlocks,{playerKey:'me',traitId,worldDay,recordRevision:1,seasonKey:'2032',leagueKey:'HS'}];
 return next;
}

test('hidden unlock raises one E84 stop; general unlock does not',()=>{
 const base=fixture();
 assert.equal(raiseHiddenTraitNotice(withUnlock(base,'T02'),40,base.phaseContext),null);
 const raised=raiseHiddenTraitNotice(withUnlock(base,'T13'),40,base.phaseContext)!;
 assert.equal(raised.phaseContext.phase,'EVENT_DECISION');
 const event=raised.events.at(-1)!;assert.equal(event.definitionId,'E84');assert.equal(event.evidence.fields.traitId,'T13');
 assert.equal(raiseHiddenTraitNotice({...raised,phaseContext:base.phaseContext},41,base.phaseContext),null);
});

test('OPEN_TRAITS resolves E84, navigates to S38 and restores the saved phase once',()=>{
 const base=fixture(),raised=raiseHiddenTraitNotice(withUnlock(base,'T13'),40,base.phaseContext)!,event=raised.events.at(-1)!;
 assert.throws(()=>resolveHiddenTraitNotice(raised,raised.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'ACK_EVENT'}));
 const {career,navigation}=resolveHiddenTraitNotice(raised,raised.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAITS'});
 assert.equal(navigation!.targetScreen,'S38');assert.deepEqual(career.phaseContext,base.phaseContext);assert.equal(career.revision,raised.revision+1);
 assert.equal(career.events.at(-1)!.status,'RESOLVED');
 assert.throws(()=>resolveHiddenTraitNotice(career,career.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAITS'}));
});

test('general unlocks collect in the unread summary until acknowledged',()=>{
 const state=withUnlock(withUnlock(fixture(),'T02'),'T13');
 assert.deepEqual(unreadTraitSummary(state).map(u=>u.traitId),['T02']);
 const seen=acknowledgeTraitSummary(state,state.revision);
 assert.deepEqual(unreadTraitSummary(seen),[]);assert.equal(seen.revision,state.revision+1);
 assert.equal(acknowledgeTraitSummary(seen,seen.revision).revision,seen.revision);
});

test('season progress stops at the day close with MAJOR_EVENT when a hidden unlock is pending',()=>{
 let state=fixture();
 for(let i=0;i<50;i++){const r=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_GAME':undefined);state=r.career;if(r.stopReason!=='CHUNK_LIMIT')break;}
 state=withUnlock(state,'T13',state.traits!.lastClosedDay!);
 let stop='';
 for(let i=0;i<50;i++){const r=advanceHighSchoolCareer(state,state.revision,i===0?'ONE_GAME':undefined);state=r.career;stop=r.stopReason;if(r.stopReason!=='CHUNK_LIMIT')break;}
 assert.equal(stop,'MAJOR_EVENT');assert.equal(state.phaseContext.phase,'EVENT_DECISION');assert.equal(state.events.at(-1)!.definitionId,'E84');
});

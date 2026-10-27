import test from 'node:test';
import assert from 'node:assert/strict';
import {HITTER_TYPES,PITCHER_TYPES,HITTER_ABILITIES,PITCHER_ABILITIES,PITCH_FORMS,PITCH_IDS,OUTCOMES,overall} from '@playball/rules';
import {createCareerPlayer,validateDevelopmentPlayer} from '../src/player.js';
import type {CreationInput,DevelopmentPlayer} from '../src/player.js';
import {createStreams} from '../src/rng.js';
import {matchupEffects,combineEffects} from '../src/probabilities.js';
import {canonicalJson} from '../src/game.js';
function input(kind:'HITTER'|'PITCHER'):CreationInput{return {simulationKey:'pf-display',name:'검수선수',kind,position:kind==='HITTER'?'CF':'SP',throws:'R',bats:'R',pitchForm:kind==='HITTER'?null:'OVERHAND',archetype:Object.keys(kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES)[0]!,focus:(kind==='HITTER'?HITTER_ABILITIES:PITCHER_ABILITIES).slice(0,4),difficulty:'GROWTH'};}
const create=(i:CreationInput)=>createCareerPlayer(i,createStreams('pf-display','fixed').worldCreation).player;
test('119/PF-D08 engine: raw combined form/platoon/trait/pitch effects retain provenance while applied totals cap at both signs',()=>{
 const traits=[{K:.08,OUT:-.08}],raw=canonicalJson(traits);
 for(const form of PITCH_FORMS)for(const pitch of PITCH_IDS)for(const hand of ['L','R'] as const)for(const bats of ['L','R','S'] as const){const effects=matchupEffects(form,pitch,5,hand,bats,'BALANCED',traits);for(const outcome of OUTCOMES)assert.ok(Math.abs(effects.applied[outcome]??0)<=.100000000001);}
 const positive=matchupEffects('OVERHAND','P01',5,'R','R','BALANCED',traits);assert.ok(positive.raw.K!>.1);assert.equal(positive.applied.K,.1);
 const negative=combineEffects([{OUT:-.08}],[{OUT:-.08}]);assert.ok(Math.abs(negative.raw.OUT!+.14)<1e-12);assert.equal(negative.applied.OUT,-.1);assert.equal(canonicalJson(traits),raw);
});
test('119/PF-D09 engine: hitter null and pitcher non-null forms survive JSON; malformed loaded identities reject',()=>{
 for(const kind of ['HITTER','PITCHER'] as const){const p=create(input(kind)),loaded=JSON.parse(JSON.stringify(p)) as DevelopmentPlayer;validateDevelopmentPlayer(loaded);assert.deepEqual(loaded,p);if(kind==='HITTER'){assert.equal(p.pitchForm,null);loaded.pitchForm='OVERHAND';}else {assert.equal(p.pitchForm,'OVERHAND');loaded.pitchForm=null;}assert.throws(()=>validateDevelopmentPlayer(loaded),/INVALID_PITCH_FORM/);}
});
test('119/PF-D11 engine: left-throwing catcher cannot be created, while legitimate right catcher and left pitcher remain valid',()=>{
 const c={...input('HITTER'),position:'C' as const};assert.throws(()=>create({...c,throws:'L'}),/INVALID_POSITION/);assert.equal(create(c).position,'C');assert.equal(create({...input('PITCHER'),throws:'L'}).position,'SP');
});
test('119/PF-D13 engine: hands, batting side and pitch form never change six-ability overall or initial growth draws',()=>{
 for(const kind of ['HITTER','PITCHER'] as const){const base=input(kind),p=create(base),ovr=overall(kind,p.abilities);for(const hand of ['L','R'] as const)for(const bats of ['L','R','S'] as const)for(const form of kind==='PITCHER'?PITCH_FORMS:[null]){const changed=create({...base,throws:hand,bats,pitchForm:form});assert.deepEqual(overall(kind,changed.abilities),ovr);assert.deepEqual(changed.abilities,p.abilities);assert.deepEqual(changed.potential,p.potential);}}
});

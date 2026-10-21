import test from 'node:test';
import assert from 'node:assert/strict';
import {overall} from '@playball/rules';
import {createUsRosterWorld,assertInitialUsRosterWorld,US_LEVEL_MEANS} from '../src/us-world.js';
import {canonicalJson} from '../src/game.js';
const input=()=>({worldKey:'us-world',seasonKey:'2030',seed:'us-initial',difficulty:'GROWTH' as const,organizations:Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'가상 조직'+(i+1)}))});
test('US initial world has30 organizations,114 players each, minor22/MLB26 and1590 pitcher books',()=>{
 const i=input(),before=canonicalJson(i),w=createUsRosterWorld(i);assert.equal(Object.keys(w.players).length,3420);assert.equal(Object.keys(w.repertoires).length,1590);assert.equal(canonicalJson(i),before);assertInitialUsRosterWorld(JSON.parse(JSON.stringify(w)));
 for(const o of w.organizations){assert.equal(Object.values(o.levels).flat().length,114);for(const [level,mean] of Object.entries(US_LEVEL_MEANS)){const ids=o.levels[level as keyof typeof US_LEVEL_MEANS];assert.equal(ids.length,level==='MLB'?26:22);for(const key of ids){const p=w.players[key]!,score=overall(p.kind,p.abilities);assert.ok(Math.abs(score.sumUnits/score.denominator-mean)<=8);assert.equal(p.focus.length,4);}}}
});
test('US generation is repeatable, registry order independent, new seed changes ability/potential; no extra cheat P100 for rivals',()=>{
 const i=input(),one=createUsRosterWorld(i),two=createUsRosterWorld({...i,organizations:[...i.organizations].reverse()});assert.equal(canonicalJson(one),canonicalJson(two));
 const other=createUsRosterWorld({...i,seed:'other-us'});assert.notEqual(canonicalJson(one.players),canonicalJson(other.players));assert.deepEqual(Object.keys(one.players),Object.keys(other.players));
 const cheat=createUsRosterWorld({...i,difficulty:'SECRET_CHEAT'});assert.equal(canonicalJson(cheat.players),canonicalJson(one.players));
});
test('US level overall values cluster near the approved means; extremes are not per-team quotas',()=>{
 const w=createUsRosterWorld(input());for(const [level,mean] of Object.entries(US_LEVEL_MEANS)){const values=w.organizations.flatMap(o=>o.levels[level as keyof typeof US_LEVEL_MEANS]).map(key=>{const p=w.players[key]!,s=overall(p.kind,p.abilities);return s.sumUnits/s.denominator;});const avg=values.reduce((a,b)=>a+b,0)/values.length;assert.ok(Math.abs(avg-mean)<.65);assert.ok(values.filter(v=>Math.abs(v-mean)<=4).length/values.length>.70);assert.ok(values.filter(v=>Math.abs(v-mean)===8).length/values.length<.06);}
});
test('US initial restore rejects duplicate registration, changed level means, bad position depth or pitcher book',()=>{
 const w=createUsRosterWorld(input());let bad=structuredClone(w);bad.organizations[0]!.levels.A[0]=bad.organizations[0]!.levels.ROOKIE[0]!;assert.throws(()=>assertInitialUsRosterWorld(bad));bad=structuredClone(w);const key=bad.organizations[0]!.levels.MLB[0]!,p=bad.players[key]!;p.abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,100_000]));p.careerPeaks={...p.abilities};assert.throws(()=>assertInitialUsRosterWorld(bad),/DISTRIBUTION/);bad=structuredClone(w);delete bad.repertoires[Object.keys(bad.repertoires)[0]!];assert.throws(()=>assertInitialUsRosterWorld(bad));assert.throws(()=>createUsRosterWorld({...input(),organizations:input().organizations.slice(1)}));
});

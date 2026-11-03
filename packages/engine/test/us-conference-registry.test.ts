import test from 'node:test';
import assert from 'node:assert/strict';
import * as registry from '../src/us-conference-registry.js';

const organizations=Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0')}));
test('fixed fictional membership follows identity rather than sorted array position',()=>{
 const a=registry.createUsConferenceRegistry(organizations),b=registry.createUsConferenceRegistry([...organizations].reverse());assert.deepEqual(a,b);
 assert.equal(a.AL.length,15);assert.equal(a.NL.length,15);assert.ok(a.AL.includes('US29'));assert.ok(a.NL.includes('US02'));assert.ok(!a.AL.includes('US02'));assert.equal(new Set([...a.AL,...a.NL]).size,30);
 registry.assertUsConferenceRegistry(JSON.parse(JSON.stringify(a)),organizations);
 const forged={...a,AL:[...a.NL],NL:[...a.AL]};assert.throws(()=>registry.assertUsConferenceRegistry(forged,organizations),/REGISTRY/);
 assert.throws(()=>registry.createUsConferenceRegistry([...organizations.slice(0,29),{id:'custom'}]),/REGISTRY/);
 a.AL.reverse();assert.deepEqual(registry.createUsConferenceRegistry(organizations),b);
});

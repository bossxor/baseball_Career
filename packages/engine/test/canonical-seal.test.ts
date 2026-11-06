import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {canonicalSeal,canonicalSha256,matchesCanonicalSeal} from '../src/canonical-seal.js';
import {canonicalJson} from '../src/game.js';

test('incremental SHA matches historical canonical bytes and accepts existing object seals',()=>{
 const state={z:['abc',{second:true,first:'가'.repeat(65_534)+'😀'+'가'.repeat(70_000)},null],a:{'9':-0,'10':1.5}};
 const legacy=canonicalJson(state),expected=createHash('sha256').update(legacy).digest('hex');
 assert.equal(canonicalSha256(state),expected);
 assert.equal(canonicalSeal(state),'sha256:'+expected);
 assert.ok(matchesCanonicalSeal(legacy,canonicalSeal(state)));
 assert.ok(matchesCanonicalSeal(canonicalSeal(state),canonicalSeal(state)));
 assert.equal(matchesCanonicalSeal(legacy,canonicalSeal({...state,a:{'9':1,'10':1.5}})),false);
});


test('legacy raw text handles a surrogate pair across the byte update boundary',()=>{
 const legacy='{"a":"'+ 'x'.repeat(65_529)+'😀'+'"}';
 const expected='sha256:'+createHash('sha256').update(legacy).digest('hex');
 assert.ok(matchesCanonicalSeal(legacy,expected));
 assert.equal(canonicalSeal(JSON.parse(legacy)),expected);
 assert.equal(matchesCanonicalSeal(legacy+'x',expected),false);
});

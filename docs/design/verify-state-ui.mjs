// Documentation/pure-preview checks only. No browser, game engine, DB, or real API.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {runInNewContext,Script} from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));const read=n=>fs.readFileSync(path.join(root,n),'utf8');const json=n=>JSON.parse(read(n));
const rules=json('server-only/hidden-trait-rules.json');assert.equal(rules.distribution,'SERVER_ONLY_DO_NOT_BUNDLE');assert.equal(rules.definitions.length,4);assert.deepEqual(rules.definitions.map(d=>d.id),['T13','T14','T15','T16']);assert.equal(rules.caps.traitLogit,.06);assert.equal(rules.caps.combinedLogit,.10);
const locked=json('hidden-traits-locked-preview.json');assert.equal(locked.items.length,4);for(const t of locked.items){assert.deepEqual(Object.keys(t).sort(),['hidden','hint','name','traitId']);assert.equal(t.hidden,true);const def=rules.definitions.find(d=>d.id===t.traitId);assert.equal(t.name,def.name);assert.equal(t.hint,def.hint);}
for(const d of rules.definitions)for(const v of Object.values(d.effects))assert.ok(Math.abs(v)<=.05);
const t14=rules.definitions.find(d=>d.id==='T14').predicate;assert.equal(t14.minPA,20);assert.deepEqual(t14.minOPS,{numerator:9,denominator:10});assert.equal(t14.requiresRelationshipWin,true);
const qualifies=({AB,H,TB,BB=0,HBP=0,won=true})=>{if(!won||AB===0||AB+BB+HBP<20)return false;const den=BigInt(AB+BB+HBP),ab=BigInt(AB);return 10n*(BigInt(H+BB+HBP)*ab+BigInt(TB)*den)>=9n*ab*den;};
assert.equal(qualifies({AB:20,H:6,TB:12}),true);assert.equal(qualifies({AB:19,H:6,TB:12}),false);assert.equal(qualifies({AB:20,H:6,TB:12,won:false}),false);assert.equal(qualifies({AB:25000,H:7500,TB:14999}),false);assert.equal(qualifies({AB:0,H:0,TB:0,BB:20}),false);
const ctx={};new Script(read('ui-preview-helpers.js'));runInNewContext(read('ui-preview-helpers.js'),ctx,{timeout:1000});const balance=ctx.PBPreview.rebalancePitchWeights;const encode=x=>JSON.parse(JSON.stringify(x));
const plan=[{id:'P01',weight:60},{id:'P03',weight:30},{id:'P04',weight:10}],before=JSON.stringify(plan);assert.deepEqual(encode(balance(plan,'P01',80)).map(p=>p.weight),[80,10,10]);assert.equal(JSON.stringify(plan),before);assert.deepEqual(encode(balance([{id:'P01',weight:60},{id:'P03',weight:20},{id:'P04',weight:20}],'P01',65)).map(p=>p.weight),[65,18,17]);
const four=['P01','P02','P03','P04'].map(id=>({id,weight:25}));assert.deepEqual(encode(balance(four,'P01',90)).map(p=>p.weight),[70,10,10,10]);assert.deepEqual(encode(balance([{id:'P01',weight:60},{id:'P03',weight:40}],'P01',0)).map(p=>p.weight),[10,90]);
for(let n=2;n<=4;n++){const ids=['P01','P02','P03','P04'].slice(0,n);const p=ids.map((id,i)=>({id,weight:Math.floor(100/n)+(i<100%n?1:0)}));for(const id of ids)for(let v=-10;v<=110;v++){const out=encode(balance(p,id,v));assert.equal(out.reduce((a,p)=>a+p.weight,0),100);assert.ok(out.every(p=>Number.isInteger(p.weight)&&p.weight>=10&&p.weight<=90));const reversed=encode(balance([...p].reverse(),id,v));for(const item of out)assert.equal(reversed.find(p=>p.id===item.id).weight,item.weight);}}
assert.throws(()=>balance([{id:'P01',weight:60},{id:'P03',weight:39}],'P01',60));
for(const name of ['design-board.html','art-direction-lab.html']){const h=read(name);assert.ok(!/(src|href)=["'][^"']*server-only\//.test(h));assert.ok(!h.includes('RIVAL_SEASON_SPLIT_AND_EVENT'));assert.ok(!h.includes('minPA'));assert.ok(!h.includes('OPS .900'));assert.ok(!h.includes('중단 상태 예시'));}
const state=json('state-ui-expectations.json');const ids=state.groups.flatMap(g=>{assert.ok(fs.existsSync(path.join(root,g.doc)));assert.equal(g.status,'NOT_EXECUTED');return g.ids;});assert.equal(new Set(ids).size,ids.length);
console.log('PASS: locked hidden-trait DTO allowlist, approved T14 OPS/PA boundaries and unchanged caps; deterministic slider lower bounds / largest remainders / stable ties / sum100; '+ids.length+' UI expectations remain NOT_EXECUTED.');
console.log('NOT TESTED: browser slider events/focus/layout, real API confidentiality, trait unlock transactions, game outcomes and database writes.');

import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const path=process.argv[2];assert.ok(path,'usage: node scripts/analyze-career-profile.mjs <profile.json>');
const {cpuProfile}=JSON.parse(readFileSync(path,'utf8'));assert.ok(cpuProfile);
const nodes=new Map(cpuProfile.nodes.map(n=>[n.id,n])),parent=new Map();
for(const node of nodes.values())for(const child of node.children??[])parent.set(child,node.id);
const classify=({functionName:n='',url:u=''})=>{
 if(n==='(garbage collector)')return 'gc';
 if(n==='(idle)')return 'idle';
 if(n==='structuredClone')return 'clone';
 if(/^(stringify|parse)$/.test(n)&&!u)return 'json';
 if(/^(assert|validate)[A-Z_]/.test(n))return 'validation';
 if(/canonicalSha|canonicalSeal|sealHash/i.test(n))return 'seal';
 if(/close.*Day|settle.*(Growth|Health|Trait|Pitch)|refreshCareerTraits/i.test(n))return 'day-close';
 if(/processPlateAppearance|runGameChunk|simulate.*Game|automaticFieldLineup|matchupEffects|effectiveAbilities|commit.*CompetitionGame/i.test(n))return 'simulation';
 if(/node_modules\/(?:@electric-sql\/pglite|drizzle-orm)\//.test(u)||u.startsWith('wasm://'))return 'database';
 return null;
};
const totals=Object.fromEntries(['simulation','day-close','validation','clone','seal','json','database','gc','idle','unclassified'].map(k=>[k,0]));
for(let i=0;i<cpuProfile.samples.length;i++){
 let id=cpuProfile.samples[i],category=null;
 while(id!==undefined&&!category){category=classify(nodes.get(id)?.callFrame??{});id=parent.get(id);}
 totals[category??'unclassified']+=cpuProfile.timeDeltas[i]??0;
}
const total=Object.values(totals).reduce((a,b)=>a+b,0);assert.ok(total>0);
console.log(JSON.stringify({source:path,method:'exclusive nearest matching sampled stack frame; weighted by V8 timeDelta; estimated attribution, not component wall time',totalSampleMicroseconds:total,categories:Object.fromEntries(Object.entries(totals).map(([key,us])=>[key,{microseconds:us,percent:100*us/total}])),limitations:['Rules are conservative heuristics; helper work follows its nearest recognized ancestor.','canonicalJson is not itself a seal; JSON builtins may be invisible.','V8 samples and PGlite wasm cannot measure database wait time.','GC, idle and unclassified remain separate.']},null,2));

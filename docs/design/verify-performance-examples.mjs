// Fixed design arithmetic only; no RNG, season simulation or production engine.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'ability-performance-examples.json'),'utf8'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
assert.equal(data.status,'UNCALIBRATED_DESIGN_ARITHMETIC');assert.equal(data.cases.length,4);
assert.ok(fs.existsSync(path.join(root,data.source)));
const d=(a,b)=>Math.max(-1,Math.min(1,(a-b)/50));
const display=[['0.265','0.425'],['0.467','0.858'],['0.218','0.371'],['0.536','0.934']];
for(const [i,c] of data.cases.entries()){
 const b=c.batterSix,p=c.pitcherSix,D=c.defense;
 // Independent unnormalised weights equivalent to 08; not the runtime engine.
 const weights={BB:.085*Math.exp(.6*d(b,p)),HBP:.01*Math.exp(-.15*d(p,50)),K:.2*Math.exp(.7*d(p,b)-.2*d(b,p)),
 '1B':.16*Math.exp(.35*d(b,p)-.2*d(D,50)),'2B':.045*Math.exp(.5*d(b,p)),
 '3B':.005*Math.exp(.45*d(b,50)+.15*d(b,p)),HR:.03*Math.exp(.95*d(b,p)),OUT:.465*Math.exp(.2*d(D,50)-.25*d(b,p))};
 const total=Object.values(weights).reduce((a,b)=>a+b,0),q=c.probabilities;
 assert.deepEqual(Object.keys(q).sort(),Object.keys(weights).sort());
 for(const k of Object.keys(q)){assert.ok(q[k]>0&&q[k]<1);near(q[k],weights[k]/total);}
 near(Object.values(q).reduce((a,b)=>a+b,0),1);
 const hit=q['1B']+q['2B']+q['3B']+q.HR,ab=1-q.BB-q.HBP;
 near(c.metrics.AVG,hit/ab);near(c.metrics.OBP,hit+q.BB+q.HBP);
 near(c.metrics.SLG,(q['1B']+2*q['2B']+3*q['3B']+4*q.HR)/ab);
 near(c.metrics.HRperPA,q.HR);near(c.metrics.KplusOUTperPA,q.K+q.OUT);
 assert.deepEqual([c.metrics.AVG.toFixed(3),c.metrics.SLG.toFixed(3)],display[i]);
 assert.equal(c.seasonExecutionStatus,'NOT_EXECUTED');
}
near(data.cases[0].probabilities.OUT,.465);
assert.ok(data.cases[1].metrics.hitPerPA<data.cases[1].metrics.AVG);
assert.equal(4*100/100,4);assert.equal(25/100,.25);assert.equal(25*4/100,1);
assert.equal(data.plannedRuns.length,6);for(const run of data.plannedRuns)assert.equal(run.executionStatus,'NOT_EXECUTED');
console.log('PASS: four fixed ability-ceiling distributions, displayed AVG/SLG, positive out probabilities and correct PA/AB denominators; six balance runs remain NOT_EXECUTED.');

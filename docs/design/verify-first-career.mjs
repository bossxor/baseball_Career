// Read-only storyboard and contract checks, not actual career/game execution.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';import {runInNewContext,Script} from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url)),read=n=>fs.readFileSync(path.join(root,n),'utf8'),json=n=>JSON.parse(read(n));
const data=json('first-career-flow.json'),ctx={};new Script(read('first-career-board.js'));runInNewContext(read('first-career-flow-data.js')+read('first-career-board.js'),ctx,{timeout:1000});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.PBFirstCareerData)),data);assert.equal(data.common.length,7);assert.equal(data.implementationStatus,'NOT_IMPLEMENTED');
const all=[...data.common,...Object.values(data.routes).flat()];assert.equal(all.length,26);assert.equal(new Set(all.map(s=>s.id)).size,26);
const screens=json('screen-state-catalog.json').screens,events=json('event-catalog-v2.json').events;
for(const s of all){assert.ok(screens.some(r=>r.id===s.screenId));assert.ok(s.eventIds.every(id=>events.some(e=>e.id===id)));assert.ok(fs.existsSync(path.join(root,s.image.asset)));assert.equal(s.executionStatus,'NOT_EXECUTED');assert.ok(s.guard&&s.action&&s.body);const html=ctx.PBFirstCareer.render(s,data.usExamples.ELIGIBLE);assert.ok(!html.includes('undefined'));assert.ok(!/>[^<]*100%/.test(html));assert.ok(!html.includes('server-only'));}
const p=ctx.PBFirstCareer;assert.equal(p.canUS(data.usExamples.ELIGIBLE),true);for(const kind of ['LOW_ABILITY','NO_OFFER']){assert.equal(p.canUS(data.usExamples[kind]),false);assert.ok(!p.routes(data.usExamples[kind]).includes('US'));assert.ok(!p.render(data.common.at(-1),data.usExamples[kind]).includes('data-route="US"'));assert.equal(p.path(data,'US',data.usExamples[kind]).length,7);}
assert.equal(p.canUS({...data.usExamples.ELIGIBLE,amateurEvaluation:49}),false);assert.equal(p.canUS({...data.usExamples.ELIGIBLE,rightsOpen:false}),false);
for(const route of Object.keys(data.routes)){const seq=p.path(data,route,data.usExamples.ELIGIBLE);assert.equal(seq.length,7+data.routes[route].length);assert.equal(seq[7].age,19);assert.equal(data.common[0].age,18);}
assert.deepEqual(JSON.parse(JSON.stringify(p.routes(data.usExamples.ELIGIBLE))),['KBO','COLLEGE','US']);
assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|Math\.random/.test(read('first-career-board.js')));
const before=JSON.stringify(data);p.render(data.common[0],data.usExamples.ELIGIBLE);assert.equal(JSON.stringify(data),before);
for(const file of ['design-board.html','art-direction-lab.html','finish-board.html'])assert.ok(read(file).includes('href="first-career-board.html"'));
console.log('PASS: first-career storyboard 7 common + 19 branch stages, 45/99 source references, US eligibility boundaries/card hiding, immutable read-only templates. Real onboarding remains NOT_EXECUTED.');

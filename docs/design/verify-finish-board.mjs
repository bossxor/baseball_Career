// Document and pure string-render checks; no browser/API/database/game execution.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {runInNewContext,Script} from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=n=>fs.readFileSync(path.join(root,n),'utf8'),json=n=>JSON.parse(read(n));
const data=json('finish-board-data.json'),art=json('art-direction-catalog.json'),register=json('screen-finish-register.json');
const ctx={};new Script(read('finish-board.js'));new Script(read('finish-board-data.js'));
runInNewContext(read('finish-board-data.js')+read('finish-board.js'),ctx,{timeout:1000});
assert.deepEqual(JSON.parse(JSON.stringify(ctx.PBFinishData)),data);
assert.equal(data.screens.length,17);assert.equal(data.states.length,8);
assert.equal(new Set(data.screens.map(s=>s.id)).size,17);
assert.equal(new Set([...art.previewScreens,...data.screens.map(s=>s.id)]).size,45);
assert.ok(data.screens.every(s=>!art.previewScreens.includes(s.id)));
assert.equal(data.browserReview,'NOT_EXECUTED');
assert.equal(art.supplementalFinishBoard.stateCount,136);
assert.deepEqual(art.supplementalFinishBoard.screenIds,data.screens.map(s=>s.id));
for(const row of register.rows)assert.equal(Boolean(row.supplementalPreview),data.screens.some(s=>s.id===row.screenId));
for(const s of data.screens){
 assert.ok(s.cards.length&&s.action&&s.guard&&s.empty&&s.error);
 assert.ok(s.scene.every(n=>[0,50,100].includes(n)));
 for(const mode of data.states){const html=ctx.PBFinish.render(s,mode);assert.ok(html.includes('<h2>'));assert.ok(!html.includes('undefined'));assert.ok(!/>[^<]*100%/.test(html));assert.ok(!html.includes('server-only'));assert.ok(!html.includes('minPA'));if(mode==='ASSET_FAILURE')assert.ok(html.includes('no-art'));if(mode==='EMPTY')assert.ok(html.includes(s.empty));}
}
const home=data.screens.find(s=>s.id==='S01');for(const mode of ['NORMAL','LOADING','SUBMITTING','CONFLICT']){const html=ctx.PBFinish.render(home,mode);assert.ok(html.includes('>이어하기</button>'));assert.ok(!/중단|복구|처리 중|결과를 확인/.test(html));if(['LOADING','SUBMITTING'].includes(mode))assert.ok(html.includes('aria-busy="true"'));}
assert.equal(ctx.PBFinish.validateLineup(['P01','P02','P03']),true);
assert.equal(ctx.PBFinish.validateLineup(['P01','P01','P03']),false);
assert.equal(ctx.PBFinish.validateLineup(['P01','P02','P99']),false);
assert.equal(ctx.PBFinish.validateLineup(['P01','P02']),false);
const malicious=JSON.parse(JSON.stringify(home));malicious.title='<img src=x onerror=alert(1)>';malicious.cards[0].text='<script>alert(1)</script>';
const escaped=ctx.PBFinish.render(malicious);assert.ok(!escaped.includes('<script>'));assert.ok(!escaped.includes('<img src=x'));assert.ok(escaped.includes('&lt;img'));
assert.ok(data.screens.find(s=>s.id==='S34').cards.some(c=>c.table?.rows.some(r=>r.includes('입학 조건 미달'))));
assert.ok(ctx.PBFinish.render(data.screens.find(s=>s.id==='S11')).includes('19세 / 45.8'));
assert.equal([45,50,44,43,46,47].reduce((a,b)=>a+b,0)/6,275/6);
const png=fs.readFileSync(path.join(root,data.image));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),1536);assert.equal(png.readUInt32BE(20),1024);
const record=json('assets/art-lab/FINISH-GENERATION.json');assert.ok(record.prompt?.length>300);assert.equal(record.asset,path.basename(data.image));
const html=read('finish-board.html');for(const src of ['finish-board-data.js','finish-board.js'])assert.ok(html.includes('src="'+src+'"'));
for(const src of ['finish-board.js','finish-board-data.js'])assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage/.test(read(src)));
for(const source of ['design-board.html','art-direction-lab.html'])assert.ok(read(source).includes('href="finish-board.html"'));
console.log('PASS: supplemental 17 screens x 8 = 136 pure render examples; original 28 + 17 = 45 IDs, resume-only home, local lineup example, escaping and six-panel PNG metadata.');
console.log('NOT TESTED: finish-board DOM/input/focus/rendering, image crops, responsive layout, real service integration, saves or application build.');

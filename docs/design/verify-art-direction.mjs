// Static art/markup/data checks; deliberately does not launch a browser.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Script,runInNewContext} from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const json=name=>JSON.parse(read(name));
const art=json('art-direction-catalog.json');
const slots=json('screen-image-slots.json');
const screens=json('screen-state-catalog.json').screens;
const events=json('event-catalog-v2.json').events;
const html=read('art-direction-lab.html');
const unique=a=>assert.equal(new Set(a).size,a.length);
assert.equal(art.status,'DESIGN_PREVIEW_ONLY');
assert.equal(art.selectedStyle,'almanac');
assert.equal(art.gameRulesChanged,false);
assert.equal(art.browserVerification,'BLOCKED_FILE_PROTOCOL');
assert.equal(art.styles.length,3);unique(art.styles.map(s=>s.id));
assert.equal(art.styles.filter(s=>s.status==='USER_SELECTED').length,1);
assert.equal(art.styles.find(s=>s.status==='USER_SELECTED').id,'almanac');
assert.equal(art.scenes.length,12);unique(art.scenes.map(s=>s.id));
assert.equal(art.portraits.length,2);unique(art.portraits.map(p=>p.id));
const assets=new Set([...art.portraits.map(p=>p.asset),art.portrait,...art.styles.map(s=>s.hero),...art.scenes.map(s=>s.asset)]);
for(const asset of assets){
  const buffer=fs.readFileSync(path.join(root,asset));
  assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
  assert.ok(width>0&&height>0);
  if(asset.includes('hero-'))assert.deepEqual([width,height],[1672,941]);
  if(asset.includes('events-almanac'))assert.deepEqual([width,height],[1536,1024]);
  if(asset===art.portrait){assert.deepEqual([width,height],[1130,1392]);assert.ok([4,6].includes(buffer[25]),'Portrait must include alpha channel');}
}
for(const portrait of art.portraits){const b=fs.readFileSync(path.join(root,portrait.asset));assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],[portrait.width,portrait.height]);assert.ok([4,6].includes(b[25]));}
for(const scene of art.scenes){
  assert.ok(scene.column>=0&&scene.column<=2&&scene.row>=0&&scene.row<=1);
  assert.ok(scene.cropFocusPercent>=0&&scene.cropFocusPercent<=100);
  for(const id of scene.eventIds)assert.ok(events.some(e=>e.id===id));
  assert.ok(scene.eligibilityNote);assert.equal(scene.implementationStatus,'DESIGN_PREVIEW_ONLY');
}
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
new Script(scripts);
const decode=literal=>JSON.parse(JSON.stringify(runInNewContext('('+literal+')',{}, {timeout:1000})));
const sceneLiteral=scripts.match(/const scenes=(\[[\s\S]*?\]);\s*const key=/)?.[1];assert.ok(sceneLiteral);
const previewScenes=decode(sceneLiteral);
assert.equal(previewScenes.length,12);unique(previewScenes.map(s=>s.id));
for(const scene of art.scenes){
  const preview=previewScenes.find(s=>s.id===scene.id);assert.ok(preview);
  assert.equal(preview.x,[0,50,100][scene.column]+'%');assert.equal(preview.y,[0,100][scene.row]+'%');
  assert.equal(preview.focus,scene.cropFocusPercent+'%');
  const file=preview.pack==='extra'?'assets/art-lab/career-events-almanac-extra-v1.png':'assets/art-lab/career-events-almanac-v1.png';assert.equal(file,scene.asset);
}
assert.ok(scripts.includes("const state={style:'almanac'"));
assert.ok(scripts.includes("const key='playball-art-lab-v2'"));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);unique(ids);
for(const id of ['style-options','screen-options','device-options','density-options','event-options','product','selection-summary','selection-text','shared-art-note'])assert.ok(ids.includes(id));
for(const src of [...html.matchAll(/\bsrc="([^"]+)"/g),...html.matchAll(/\bhref="([^"]+)"/g)]){
  if(!src[1].includes('${')&&!/^(https?:|#)/.test(src[1]))assert.ok(fs.existsSync(path.join(root,src[1])),src[1]);
}
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(scripts));
const visible=html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,'');
assert.ok(!visible.includes('100%'));
assert.equal(slots.screens.length,45);unique(slots.screens.map(s=>s.screenId));
const refs=new Set(['NONE','EVENT_RESOLVER','almanacHero','almanacPortrait',...art.scenes.map(s=>s.id)]);
for(const row of slots.screens){assert.ok(screens.some(s=>s.id===row.screenId));for(const ref of row.assetRefs)assert.ok(refs.has(ref),ref);assert.ok(row.guard&&row.purpose);assert.equal(row.gameStateAuthority,'SERVER_TEXT_AND_RECEIPTS');}
const values=[72,80,64,68,66,76];assert.equal(values.reduce((a,b)=>a+b,0)/6,71);
assert.ok(fs.existsSync(path.join(root,art.prompts)));
assert.equal(json(art.prompts).selectedStyle,'almanac');

// Evaluate only isolated pure string-template functions, without a DOM/browser/network.
const playersLiteral=scripts.match(/const players=([\s\S]*?);\s*const ability=/)?.[1];assert.ok(playersLiteral);
const playerData=decode(playersLiteral);
for(const [id,mean] of [['hitter',71],['pitcher',72]]){const p=playerData[id];assert.equal(p.stats.length,6);assert.equal(p.focus.length,4);unique(p.focus);for(const name of p.focus)assert.ok(p.stats.some(row=>row[0]===name));assert.equal(p.stats.reduce((a,row)=>a+row[1],0)/6,mean);assert.ok(fs.existsSync(path.join(root,p.asset)));}
const flow=json(art.visualFlowCatalog);assert.equal(flow.status,'DESIGN_PREVIEW_ONLY');assert.equal(flow.gameRulesChanged,false);assert.equal(flow.expectationStatus,'NOT_IMPLEMENTED');assert.equal(flow.flows.length,4);unique(flow.flows.map(f=>f.id));assert.equal(art.previewVariants,8);assert.equal(art.previewScreens.length,8);
const pure=scripts.slice(scripts.indexOf('const phases='),scripts.indexOf('function persist(){'));
assert.ok(pure.startsWith('const phases='));
const abilitySource=scripts.slice(scripts.indexOf('const ability='),scripts.indexOf('function career(){'));
const context={state:{player:'hitter',phase:'base'},players:playerData,scenes:previewScenes,bar:()=>'<header>example</header>',nav:()=>'<footer>example</footer>',sprite:scene=>'<figure data-scene="'+scene.id+'"></figure>'};
runInNewContext(abilitySource+pure+';this.draw={growth,rehab,contract,national};',context,{timeout:1000});
for(const f of flow.flows){assert.equal(f.states.length,3);assert.deepEqual(f.states.map(s=>s.phase),flow.phases);for(const id of f.screenIds)assert.ok(screens.some(s=>s.id===id));assert.ok(scripts.includes('data-screen="'+f.id+'"')||html.includes('data-screen="'+f.id+'"'));for(const st of f.states){assert.ok(st.requiredEvidence.length&&st.expected&&st.label);assert.ok(art.scenes.some(s=>s.id===st.allowedScene));context.state.phase=st.phase;const markup=context.draw[f.id]();assert.ok(markup.includes('data-scene="'+st.allowedScene+'"'));assert.ok(!markup.includes('undefined'));assert.ok(!/>[^<]*100%/.test(markup));if(f.id==='national'&&st.phase!=='receipt')assert.ok(!markup.includes('data-scene="international"'));if(f.id==='growth'&&st.phase==='receipt')assert.ok(markup.includes('82 <small>'));if(f.id==='rehab')assert.ok(markup.includes(({base:'12',detail:'6',receipt:'0'})[st.phase]+' <small>'));}}
context.state.player='pitcher';context.state.phase='base';const pitcherMarkup=context.draw.growth();assert.ok(pitcherMarkup.includes('72.0 <small>'));assert.ok(pitcherMarkup.includes('구위 76 → 78'));assert.ok(pitcherMarkup.includes('누적 XP 30'));assert.ok(pitcherMarkup.includes('누적 XP 10'));context.state.phase='receipt';assert.ok(context.draw.growth().includes('78 <small>'));
for(const id of ['player-options','phase-control','phase-options'])assert.ok(ids.includes(id));
console.log('PASS: 2 alpha portrait assets, 8 preview variants, 4 detail flows / 12 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.');

console.log('PASS: chosen vintage direction, 3 hero alternatives, 12 scene data/crops, alpha PNG metadata, 45 image-slot contracts, lab script/IDs/assets and example overall 71.0.');
console.log('NOT TESTED: art-lab browser rendering, interactive clicks, viewport layout, clipboard and localStorage; file: browser navigation was policy-blocked.');
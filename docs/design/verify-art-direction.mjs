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
assert.equal(art.selectedStyle,'animation');
assert.equal(art.gameRulesChanged,false);
assert.equal(art.browserVerification,'BLOCKED_FILE_PROTOCOL');
assert.equal(art.styles.length,3);unique(art.styles.map(s=>s.id));
assert.equal(art.styles.filter(s=>s.status==='USER_SELECTED').length,1);
assert.equal(art.styles.find(s=>s.status==='USER_SELECTED').id,'animation');
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
  const file=preview.pack==='extra'?'assets/art-lab/career-events-animation-extra-v1.png':'assets/art-lab/career-events-animation-v1.png';assert.equal(file,scene.asset);
}
assert.ok(scripts.includes("const state={style:'animation'"));
assert.ok(scripts.includes("const key='playball-art-lab-v3'"));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);unique(ids);
for(const id of ['style-options','screen-options','device-options','density-options','event-options','product','selection-summary','selection-text','shared-art-note'])assert.ok(ids.includes(id));
for(const src of [...html.matchAll(/\bsrc="([^"]+)"/g),...html.matchAll(/\bhref="([^"]+)"/g)]){
  if(!src[1].includes('${')&&!/^(https?:|#)/.test(src[1]))assert.ok(fs.existsSync(path.join(root,src[1])),src[1]);
}
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(scripts));
const visible=html.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<script>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,'');
assert.ok(!visible.includes('100%'));
assert.equal(slots.screens.length,45);unique(slots.screens.map(s=>s.screenId));
const refs=new Set(['NONE','EVENT_RESOLVER','almanacHero','almanacPortrait','silhouetteCard','appBrandMark','finishScenes',...art.scenes.map(s=>s.id)]);
for(const row of slots.screens){assert.ok(screens.some(s=>s.id===row.screenId));for(const ref of row.assetRefs)assert.ok(refs.has(ref),ref);assert.ok(row.guard&&row.purpose);assert.equal(row.gameStateAuthority,'SERVER_TEXT_AND_RECEIPTS');}
const values=[72,80,64,68,66,76];assert.equal(values.reduce((a,b)=>a+b,0)/6,71);
assert.ok(fs.existsSync(path.join(root,art.prompts)));
assert.equal(json(art.prompts).selectedStyle,'animation');

// Evaluate only isolated pure string-template functions, without a DOM/browser/network.
const playersLiteral=scripts.match(/const players=([\s\S]*?);\s*const ability=/)?.[1];assert.ok(playersLiteral);
const playerData=decode(playersLiteral);
for(const [id,mean] of [['hitter',71],['pitcher',72]]){const p=playerData[id];assert.equal(p.stats.length,6);assert.equal(p.focus.length,4);unique(p.focus);for(const name of p.focus)assert.ok(p.stats.some(row=>row[0]===name));assert.equal(p.stats.reduce((a,row)=>a+row[1],0)/6,mean);assert.ok(fs.existsSync(path.join(root,p.asset)));}
const flow=json(art.visualFlowCatalog);assert.equal(flow.status,'DESIGN_PREVIEW_ONLY');assert.equal(flow.gameRulesChanged,false);assert.equal(flow.expectationStatus,'NOT_IMPLEMENTED');assert.equal(flow.flows.length,26);unique(flow.flows.map(f=>f.id));assert.equal(art.previewVariants,30);assert.equal(art.previewScreens.length,28);
const pure=scripts.slice(scripts.indexOf('const phases='),scripts.indexOf('function persist(){'));
assert.ok(pure.startsWith('const phases='));
const abilitySource=scripts.slice(scripts.indexOf('const ability='),scripts.indexOf('function career(){'));
const context={state:{player:'hitter',phase:'base'},players:playerData,scenes:previewScenes,bar:()=>'<header>example</header>',nav:()=>'<footer>example</footer>',sprite:scene=>'<figure data-scene="'+scene.id+'"></figure>'};
runInNewContext(read('ui-preview-helpers.js'),context,{timeout:1000});
runInNewContext(abilitySource+pure+';this.draw={growth,rehab,contract,national,match,season,draft,roster,scout,recruit,budget,rebirth,creation,route,college,america,traits,repertoire,goals,achievements,agents,relations,staff,commentary,chronicle,exportCard};this.previewDemo=expansionDemo;',context,{timeout:1000});
for(const f of flow.flows){assert.equal(f.states.length,3);assert.deepEqual(f.states.map(s=>s.phase),flow.phases);for(const id of f.screenIds)assert.ok(screens.some(s=>s.id===id));assert.ok(scripts.includes('data-screen="'+f.id+'"')||html.includes('data-screen="'+f.id+'"'));for(const st of f.states){assert.ok(st.requiredEvidence.length&&st.expected&&st.label);assert.ok(st.allowedScene==='NONE'||art.scenes.some(s=>s.id===st.allowedScene));context.state.phase=st.phase;const markup=context.draw[f.id]();if(st.allowedScene!=='NONE')assert.ok(markup.includes('data-scene="'+st.allowedScene+'"'));assert.ok(!markup.includes('undefined'));assert.ok(!/>[^<]*100%/.test(markup));if(f.id==='national'&&st.phase!=='receipt')assert.ok(!markup.includes('data-scene="international"'));if(f.id==='growth'&&st.phase==='receipt')assert.ok(markup.includes('82 <small>'));if(f.id==='rehab')assert.ok(markup.includes(({base:'12',detail:'6',receipt:'0'})[st.phase]+' <small>'));}}
context.state.player='pitcher';context.state.phase='base';const pitcherMarkup=context.draw.growth();assert.ok(pitcherMarkup.includes('72.0 <small>'));assert.ok(pitcherMarkup.includes('구위 76 → 78'));assert.ok(pitcherMarkup.includes('누적 XP 30'));assert.ok(pitcherMarkup.includes('누적 XP 10'));context.state.phase='receipt';assert.ok(context.draw.growth().includes('78 <small>'));
for(const id of ['player-options','phase-control','phase-options'])assert.ok(ids.includes(id));

const examples=json('result-experience-examples.json');assert.equal(examples.expectationStatus,'NOT_IMPLEMENTED');assert.equal(examples.gameRulesChanged,false);assert.equal(examples.edgeCases.length,14);unique(examples.edgeCases.map(c=>c.id));for(const e of examples.edgeCases){assert.equal(e.status,'NOT_IMPLEMENTED');assert.ok(e.scenario&&e.expected);}
const {game:g,batter:b,pitcher:p,draft:d}=examples.examples;
assert.equal(g.away.length,9);assert.equal(g.home.length,9);assert.equal(g.away.reduce((a,v)=>a+v,0),g.awayR);assert.equal(g.home.filter(v=>typeof v==='number').reduce((a,v)=>a+v,0),g.homeR);assert.equal(g.home[8],'X');assert.ok(g.homeR>g.awayR);
const noLeadingZero=x=>x.toFixed(3).replace(/^0/,'');assert.equal(noLeadingZero(b.H/b.AB),b.display.AVG);const obp=(b.H+b.BB+b.HBP)/(b.AB+b.BB+b.HBP),slg=b.TB/b.AB;assert.equal(noLeadingZero(obp),b.display.OBP);assert.equal(noLeadingZero(slg),b.display.SLG);assert.equal(noLeadingZero(obp+slg),b.display.OPS);assert.equal(Math.floor(p.outs/3)+'.'+p.outs%3,p.display.IP);assert.equal((p.ER*27/p.outs).toFixed(2),p.display.ERA);assert.equal(((p.H+p.BB)*3/p.outs).toFixed(2),p.display.WHIP);
assert.equal(d.distribution.reduce((a,row)=>a+row.p,0),1);assert.equal(d.distribution.filter(row=>row.round!==null).reduce((a,row)=>a+row.p,0),d.overallDraftProbability);assert.equal(d.distribution.filter(row=>row.round!==null).sort((a,b)=>b.p-a.p)[0].round,d.mostLikelyRoundIfDrafted);
const roundForScore=score=>score<45?null:score<49?10:score<53?9:score<57?8:score<61?7:score<65?6:score<69?5:score<73?4:score<77?3:score<81?2:1;
// Uniform variation [-5,5]: exact interval lengths for the B45 documented example.
assert.equal((49-45)/10,d.distribution.find(row=>row.round===10).p);assert.equal((50-49)/10,d.distribution.find(row=>row.round===9).p);assert.equal(roundForScore(44),null);assert.equal(roundForScore(49),9);
const resultLiteral=scripts.match(/const resultExample=([\s\S]*?);\s*function match\(/)?.[1];assert.ok(resultLiteral);assert.deepEqual(decode(resultLiteral),g);
for(const who of ['hitter','pitcher']){context.state.player=who;context.state.phase='base';const pending=context.draw.match();assert.ok(pending.includes('경기 처리 중'));assert.ok(!pending.includes('FINAL ·'));assert.ok(!pending.includes('score-table'));context.state.phase='detail';assert.ok(context.draw.match().includes('B 3 : 4'));assert.ok(context.draw.match().includes('<td>X</td>'));assert.ok(context.draw.season().includes(who==='hitter'?'.369 / .500 / .869':'150.0 / 50 / 150'));context.state.phase='receipt';assert.ok(context.draw.match().includes('같은 resultHash'));assert.ok(context.draw.season().includes('필수 확인 예시'));}
context.state.phase='base';assert.ok(context.draw.draft().includes('지명 가능성 50%'));assert.ok(context.draw.draft().includes('10라운드 유력'));context.state.phase='detail';assert.ok(context.draw.draft().includes('9라운드 · 가상 구단 A'));context.state.phase='receipt';assert.ok(context.draw.draft().includes('지명되지 않았습니다'));
console.log('PASS: result/season/draft examples: inning totals 3:4 and X, batting .300/.369/.500/.869, pitching 150.0/3.00/1.23, B45 draft distribution; 14 NOT_IMPLEMENTED edge expectations.');


const club=json('club-experience-examples.json');assert.equal(club.status,'DESIGN_PREVIEW_ONLY');assert.equal(club.expectationStatus,'NOT_IMPLEMENTED');assert.equal(club.gameRulesChanged,false);assert.equal(club.edgeCases.length,20);unique(club.edgeCases.map(e=>e.id));for(const e of club.edgeCases){assert.equal(e.status,'NOT_IMPLEMENTED');assert.ok(e.scenario&&e.expected);}
const {ledger:l,search:searchEx,offer:offerEx,report:reportEx,rebirth:rebirthEx}=club.examples;
const available=x=>x.budget+x.postingIncome+x.supportGrant-x.paidSalary-x.reservedSalary-x.guaranteedReleaseCost-x.reservedOffers-x.protectedMinimum-x.paidOperations-x.reservedOperations;
assert.equal(available(l),l.expectedAvailable);assert.equal(available({...l,paidOperations:l.paidOperations+l.searchCost}),l.afterSearchAvailable);assert.equal(available({...l,reservedOffers:l.reservedOffers+l.offerAnnual}),l.afterNewOfferAvailable);
const reserved={...l,reservedOffers:l.reservedOffers+l.offerAnnual};assert.equal(available({...reserved,reservedOffers:reserved.reservedOffers-l.offerAnnual,reservedSalary:reserved.reservedSalary+l.offerAnnual}),available(reserved));
for(const v of Object.values(l))assert.ok(Number.isFinite(v)&&Number.isSafeInteger(v));
assert.equal(Number(Math.max(.10,Math.min(.90,.35+.08*searchEx.L+.20*Math.min(searchEx.N,20)/20-.08*searchEx.q)).toFixed(2)),searchEx.p);assert.equal(searchEx.monthRemainingBefore-1,searchEx.monthRemainingAfter);assert.equal(Math.min(3,searchEx.N),searchEx.discoveredOnSuccess);
const weight=Math.exp(6*(offerEx.score-.60));assert.equal(weight/(offerEx.outsideWeight+weight+offerEx.otherWeights.reduce((a,v)=>a+v,0)),offerEx.acceptProbability);
const w=Math.min(100-reportEx.A,Math.max(2,[20,16,12,8,6][reportEx.level-1]-2*reportEx.stage));const low=Math.max(reportEx.A,Math.min(100-w,reportEx.P-reportEx.z*w));assert.equal(low,reportEx.expectedLow);assert.equal(low+w,reportEx.expectedHigh);assert.ok(low<=reportEx.P&&reportEx.P<=low+w);
assert.deepEqual(rebirthEx.peaks.map(v=>Math.max(1,v/2)),rebirthEx.expectedAbilities);assert.deepEqual(rebirthEx.peaks.map((v,i)=>Math.min(100,Math.max(v,rebirthEx.sourcePotential[i])+rebirthEx.boosts[i])),rebirthEx.expectedInternalPotential);assert.equal((rebirthEx.expectedAbilities.reduce((a,v)=>a+v,0)/6).toFixed(1),rebirthEx.expectedOverall);assert.equal(rebirthEx.newAge,19);assert.equal(rebirthEx.newMilitary,'UNRESOLVED');assert.equal(rebirthEx.newCareerRecords,0);
const clubLiteral=scripts.match(/const clubExamples=([\s\S]*?);\s*const clubPage=/)?.[1];assert.ok(clubLiteral);const labClub=decode(clubLiteral);for(const [k,v] of Object.entries(l))if(k in labClub)assert.equal(labClub[k],v);assert.deepEqual(labClub.peaks,rebirthEx.peaks);assert.deepEqual(labClub.sourcePotential,rebirthEx.sourcePotential);assert.deepEqual(labClub.boosts,rebirthEx.boosts);
context.state.phase='base';assert.ok(context.draw.scout().includes('발견 성공률 63%'));assert.ok(context.draw.recruit().includes('수락 가능성 50%'));assert.ok(context.draw.budget().includes('18억4,000만'));assert.ok(context.draw.rebirth().includes('41세'));context.state.phase='detail';assert.ok(context.draw.scout().includes('후보 3명'));assert.ok(context.draw.scout().includes('잠재력 전망80~96'));assert.ok(context.draw.budget().includes('18억3,500만'));assert.ok(context.draw.roster().includes('28명 / 1명'));assert.ok(context.draw.rebirth().includes('종합45.8'));assert.ok(context.draw.rebirth().includes('100 → 50'));context.state.phase='receipt';assert.ok(context.draw.scout().includes('찾지 못했습니다'));assert.ok(context.draw.recruit().includes('가용17억4천만원 유지'));assert.ok(context.draw.budget().includes('무제한'));assert.ok(!context.draw.budget().includes('Infinity'));assert.ok(context.draw.rebirth().includes('여섯 잠재력100'));assert.ok(context.draw.rebirth().includes('현재 능력은 그대로'));assert.ok(context.draw.roster().includes('28명 / 2명 / 8명'));
for(const f of flow.flows.filter(f=>['roster','scout','recruit','budget','rebirth'].includes(f.id))){const refs=new Set(f.screenIds.flatMap(id=>slots.screens.find(row=>row.screenId===id).assetRefs));for(const st of f.states)assert.ok(refs.has(st.allowedScene),'Club scene absent from screen image-slot family: '+f.id);}
console.log('PASS: club examples: search .63 / offer .50, finite ledger 1,840,000,000 -> 1,835,000,000, reservation transfer conserved, report 80~96, rebirth overall 45.8 and capped potentials; 20 NOT_IMPLEMENTED edge expectations.');


const journey=json('journey-experience-examples.json');assert.equal(journey.expectationStatus,'NOT_IMPLEMENTED');assert.equal(journey.gameRulesChanged,false);assert.equal(journey.edgeCases.length,16);unique(journey.edgeCases.map(e=>e.id));for(const e of journey.edgeCases){assert.equal(e.status,'NOT_IMPLEMENTED');assert.ok(e.scenario&&e.expected);}
const journeyLiteral=scripts.match(/const journeyExamples=([\s\S]*?);\s*function creation\(/)?.[1];assert.ok(journeyLiteral);const journeyData=decode(journeyLiteral);for(const kind of ['hitter','pitcher']){assert.deepEqual(journeyData[kind],journey.examples.initial[kind]);assert.equal(journeyData[kind].reduce((a,v)=>a+v,0),300);context.state.player=kind;context.state.phase='detail';const m=context.draw.creation();assert.ok(m.includes('종합50.0'));assert.ok(m.includes('주요 육성4 / 4'));assert.ok(!m.includes('CLUB DETAIL'));}
for(const g of journey.examples.usGate)assert.equal(g.routeOpen&&g.overall>=55&&g.amateur>=50&&g.validOffers>0,g.visible);
const col=journey.examples.college;assert.equal(journeyData.schools.length,col.teamCount);unique(journeyData.schools.map(s=>s.id));assert.equal((col.teamCount-1)*col.gamesPerOpponent,col.expectedTeamGames);assert.equal(col.teamCount*col.expectedTeamGames/2,col.expectedLeagueGames);assert.deepEqual(journeyData.schools.filter(s=>s.minimum<=col.exampleOverall).map(s=>s.id),col.eligibleSchools);
const jd=journey.examples.draft;assert.equal(jd.overall*.7+jd.performance*.3,jd.B);assert.ok(Math.abs(jd.distribution.reduce((a,row)=>a+row.p,0)-1)<1e-12);assert.deepEqual(jd.distribution.filter(row=>row.p===.4).map(row=>row.round).sort((a,b)=>a-b),jd.topRounds);for(const [round,lo,hi] of [[10,45,49],[9,49,53],[8,53,57],[7,57,61]]){const probability=Math.max(0,Math.min(jd.B+5,hi)-Math.max(jd.B-5,lo))/10;assert.ok(Math.abs(probability-jd.distribution.find(row=>row.round===round).p)<1e-12);}
context.state.phase='base';assert.ok(!context.draw.route().includes('미국'));assert.ok(context.draw.route().includes('지명 가능성50%'));context.state.phase='detail';assert.ok(context.draw.route().includes('유효 제안1개'));assert.ok(context.draw.route().includes('예상8~9라운드'));assert.ok(context.draw.college().includes('48 / 48'));context.state.phase='receipt';assert.ok(context.draw.college().includes('3학년으로'));assert.ok(context.draw.college().includes('소비하지 않습니다'));assert.ok(context.draw.america().includes('실제 출전0경기'));assert.ok(!context.draw.route().includes('미국 프로 진출'));
for(const f of flow.flows.filter(f=>['creation','route','college','america'].includes(f.id))){const refs=new Set(f.screenIds.flatMap(id=>slots.screens.find(row=>row.screenId===id).assetRefs));for(const st of f.states)assert.ok(refs.has(st.allowedScene),'Journey scene absent from image-slot family: '+f.id);}
console.log('PASS: journey examples: 2 initial arrays total 300, US visibility boundaries, 9 colleges / 48 team and 216 league games, B53.5 round distribution, MLB registration with zero appearances; 16 NOT_IMPLEMENTED edge expectations.');


const expansionData=json('expansion-preview-data.json');const expansionLiteral=scripts.match(/const expansionPreviewData=([\s\S]*?);\s*const expansionDemo=/)?.[1];assert.ok(expansionLiteral);assert.deepEqual(decode(expansionLiteral),expansionData);
context.state.phase='base';assert.ok(context.draw.goals().includes('추천3'));assert.ok(context.draw.goals().includes('선택0 / 3'));assert.ok(!context.draw.goals().includes('달성률'));assert.equal((context.draw.achievements().match(/class="choice-demo"/g)||[]).length,12);const salaryMarkup=context.draw.agents();for(const v of ['70%','55%','40%','11000만원','12000만원','13000만원'])assert.ok(salaryMarkup.includes(v));assert.ok(context.draw.staff().includes('현재 역할: 현역'));context.previewDemo.staffTab='generic';assert.ok(context.draw.staff().includes('유효레벨3'));context.previewDemo.staffTab='owned';context.previewDemo.chronicleMode='book';assert.ok(context.draw.chronicle().includes('2032 · KBO의 장'));context.previewDemo.chronicleYear='2031';context.previewDemo.chronicleScope='KBO';assert.ok(context.draw.chronicle().includes('조건에 맞는 기록이 없습니다'));context.previewDemo.chronicleYear='all';context.previewDemo.chronicleScope='all';
context.state.phase='detail';assert.ok(context.draw.goals().includes('볼넷22 / 30'));assert.ok(context.draw.goals().includes('blocked-choice'));assert.ok(context.draw.staff().includes('7500만원'));assert.ok(context.draw.relations().includes('같은 종류'));const viewing=context.draw.commentary();assert.ok(viewing.includes('점수 숨김'));assert.ok(viewing.includes('aria-live="off"'));assert.ok(viewing.includes('data-viewer-action="skip"'));assert.ok(!viewing.includes('홈4 : 원정3'));context.previewDemo.noteTitle='<img src=x onerror=alert(1)>';context.previewDemo.note='</textarea><script>alert(1)</script>';const noteMarkup=context.draw.chronicle();assert.ok(noteMarkup.includes('&lt;img'));assert.ok(!noteMarkup.includes('<img src=x'));assert.ok(noteMarkup.includes('<h3>첫 홈런의 기억</h3>'));const exportMarkup=context.draw.exportCard();assert.ok(exportMarkup.includes('data-export-state="READY"'));context.state.phase='base';assert.ok(!context.draw.exportCard().includes('<img src=x'));
for(const f of flow.flows.filter(f=>['goals','achievements','agents','relations','staff','commentary','chronicle','exportCard'].includes(f.id))){const refs=new Set(f.screenIds.flatMap(id=>slots.screens.find(row=>row.screenId===id).assetRefs));for(const st of f.states)assert.ok(refs.has(st.allowedScene));}
console.log('PASS: expansion templates: 12 public challenges, PRE/MID/reward separation, salary previews 70/55/40, staff debt, DIRECT/COMPARISON, hidden-score viewer controls, chapter filters, escaped notes and export states.');

console.log('PASS: 2 alpha portrait assets, 30 preview variants, 26 detail flows / 78 state templates, evidence guards, hitter overall 71.0 and pitcher 72.0 / focus 4; pure HTML-string checks only.');

console.log('PASS: chosen animation direction, 3 hero alternatives, 12 scene data/crops, alpha PNG metadata, 45 image-slot contracts, lab script/IDs/assets and example overall 71.0.');
console.log('NOT TESTED: art-lab browser rendering, interactive clicks, viewport layout, clipboard and localStorage; file: browser navigation was policy-blocked.');
// User-approved SVG batches: verify the real files and slot bindings, not just labels.
{
  const approval=json(art.approvedArt);
  assert.deepEqual(approval.selection,{pitcher:'A',hitter:'A',logo:'2',palette:'NAVY_BLUE_V1'});
  const registry=json('image-production-register.json');
  assert.equal(approval.files.length,15);
  for(const asset of approval.files){
    const row=registry.items.find(i=>i.id===asset.id);
    assert.equal(row.status,'EXISTS');assert.equal(row.file,asset.file);
    assert.equal(row.approval.status,'USER_SELECTED');
    const svg=read(asset.file);
    assert.ok(/<title>[^<]+<\/title>/.test(svg),asset.file);
    assert.ok(!/<(?:script|foreignObject|image|text)\b/i.test(svg),asset.file);
    assert.ok(!/scale\(\s*-1|matrix\(\s*-1/.test(svg),asset.file);
    for(const [,paint]of svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)){
      assert.ok(paint==='none'||/^var\(--sil-[a-z]+,#[a-fA-F0-9]{6}\)$/.test(paint),asset.file+' paint '+paint);
    }
    assert.ok(svg.includes('viewBox="0 0 120 '+(asset.id==='IMG-BRAND-MARK'?'120':'160')+'"'));
  }
  assert.equal(slots.selectedPalette,'NAVY_BLUE_V1');
  assert.equal(slots.assetLibrary.silhouetteCard.approvedCount,14);
  assert.equal(slots.assetLibrary.silhouetteCard.plannedCount,14);
  assert.equal(slots.assetLibrary.silhouetteCard.fallback,'INITIALS_ON_ASSET_LOAD_FAILURE');
  assert.equal(slots.assetLibrary.silhouetteCard.variants.length,14);
  for(const variant of slots.assetLibrary.silhouetteCard.variants)assert.ok(approval.files.some(a=>a.file===variant.file));
  const variants=slots.assetLibrary.silhouetteCard.variants;
  unique(variants.map(v=>[v.kind,v.throws,v.bats||v.pitchForm].join(':')));
  assert.equal(slots.assetLibrary.silhouetteCard.status,'APPROVED');
  for(const hand of ['R','L']){
    for(const bats of ['R','L','S'])assert.ok(variants.some(v=>v.kind==='HITTER'&&v.throws===hand&&v.bats===bats),'Missing hitter '+hand+bats);
    for(const form of ['OVERHAND','THREE_QUARTER','SIDEARM','UNDERHAND'])assert.ok(variants.some(v=>v.kind==='PITCHER'&&v.throws===hand&&v.pitchForm===form),'Missing pitcher '+hand+form);
  }
  assert.ok(registry.items.filter(i=>i.group==='G1').every(i=>i.status==='EXISTS'));

  assert.ok(approval.files.some(a=>a.file===slots.assetLibrary.appBrandMark.file));
  for(const id of ['S01','S21'])assert.ok(slots.screens.find(s=>s.screenId===id).assetRefs.includes('appBrandMark'));
  for(const player of art.activePortraits)assert.ok(approval.files.some(a=>a.file===player.asset));
  assert.equal(playerData.hitter.asset,'assets/silhouettes/hitter-RR.svg');
  assert.equal(playerData.pitcher.asset,'assets/silhouettes/pitcher-R-overhand.svg');
  const approvedBoard=read('approved-art-board.html');
  assert.equal((approvedBoard.match(/<svg\b/g)||[]).length,15);
  assert.ok(!/player-youth-animation-v1|player-pitcher-animation-v1/.test(approvedBoard));
  assert.equal(registry.items.filter(i=>i.status==='TODO').length,41);
  assert.equal(registry.items.filter(i=>i.status==='EXISTS').length,39);
  console.log('PASS: approved pitcher A, hitter A and logo2 SVGs; navy-blue palette, CSS paints, forbidden-element guards and real slot bindings; 14/14 silhouettes ready, 41 image TODOs remain.');
}

{
  const icons=json('assets/brand/APPROVED-ICONS-v1.json');
  assert.equal(icons.approval,'USER_SELECTED');assert.equal(icons.option,1);
  assert.equal(icons.background,'#172c50');assert.equal(icons.files.length,8);
  const bound=[...slots.assetLibrary.appIcons.android,...slots.assetLibrary.appIcons.web].sort();
  assert.deepEqual(bound,icons.files.map(f=>f.file).sort());
  assert.equal(slots.assetLibrary.appIcons.approval,'assets/brand/APPROVED-ICONS-v1.json');
  for(const f of icons.files){
    const buffer=fs.readFileSync(path.join(root,f.file));
    if(f.type==='PNG'){
      assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.deepEqual([buffer.readUInt32BE(16),buffer.readUInt32BE(20)],[f.width,f.height]);
      assert.equal(f.opaque,true);
    }else{
      const svg=buffer.toString('utf8');
      assert.ok(svg.includes('viewBox="0 0 432 432"')&&/<title>[^<]+<\/title>/.test(svg),f.file);
      assert.ok(!/<(?:script|foreignObject|image|text)\b/i.test(svg),f.file);
    }
  }
  assert.ok(icons.androidSafeArea.actualMaxRadius<=icons.androidSafeArea.radius);
  assert.ok(icons.maskableSafeArea.foregroundRadiusRatio<=icons.maskableSafeArea.radiusRatio);
  assert.equal(icons.browserReview,'NOT_EXECUTED');assert.equal(icons.deviceInstallReview,'NOT_EXECUTED');
  const registry=json('image-production-register.json');
  for(const [id,kind]of [['IMG-BRAND-ANDROID','android'],['IMG-BRAND-PWA','web']]){
    const row=registry.items.find(i=>i.id===id);assert.equal(row.status,'EXISTS');
    assert.deepEqual([...row.files].sort(),[...slots.assetLibrary.appIcons[kind]].sort());
  }
  assert.ok(registry.items.filter(i=>i.priority==='P0').every(i=>i.status==='EXISTS'));
  console.log('PASS: approved navy icon1; Android 3 SVGs / web 5 assets, PNG dimensions and safe-area evidence, registry/slot bindings; P0 files complete. App/device integration remains NOT_EXECUTED.');
}

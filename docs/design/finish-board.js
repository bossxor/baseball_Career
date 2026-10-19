/* Pure design templates plus local DOM controls. No API, storage or game mutations. */
(function(global){
'use strict';
const escape=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const row=(label,value)=>'<div class="row"><span>'+escape(label)+'</span><b>'+escape(value)+'</b></div>';
const card=(title,body)=>'<section class="card"><h3>'+escape(title)+'</h3>'+body+'</section>';
const table=(caption,head,rows)=>'<div class="table-scroll"><table><caption>'+escape(caption)+'</caption><thead><tr>'+head.map(v=>'<th scope="col">'+escape(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function render(data,mode='NORMAL'){
const long=mode==='LONG_CONTENT';
const banner=mode==='LOADING'&&data.id!=='S01'?'<div class="skeleton" aria-label="불러오는 중"></div>':mode==='ERROR'?'<div class="notice" role="alert">'+escape(data.error)+'</div>':mode==='CONFLICT'&&data.id!=='S01'?'<div class="notice">'+escape(data.conflict)+'</div>':mode==='SUBMITTING'&&data.id!=='S01'&&data.writable?'<div class="notice">선택한 내용의 결과를 확인하고 있습니다.</div>':'';
const art=mode==='ASSET_FAILURE'?'<div class="scene-window no-art">'+escape(data.fallback)+'</div>':'<div class="scene-window"><div class="scene-sheet" style="--sx:'+data.scene[0]+'%;--sy:'+data.scene[1]+'%" role="img" aria-label="'+escape(data.sceneAlt)+'"></div></div>';
const content=mode==='EMPTY'?card('아직 표시할 항목이 없어요','<p>'+escape(data.empty)+'</p>'):mode==='LOADING'?card('현재 정보','<p class="muted">'+(data.id==='S01'?'최근 게임':'최신 내용을 불러옵니다.')+'</p>'):data.cards.map(c=>card(c.title,(c.text?'<p>'+escape(c.text)+'</p>':'')+(c.rows?c.rows.map(r=>row(...r)).join(''):'')+(c.stats?'<div class="mini-stats">'+c.stats.map(r=>'<span>'+escape(r[0])+'<b>'+escape(r[1])+'</b></span>').join('')+'</div>':'')+(c.table?table(c.table.caption,c.table.head,c.table.rows):'')+(c.control||''))).join('');
const busy=mode==='LOADING'||mode==='SUBMITTING';
const action=data.id==='S01'?(mode==='EMPTY'?'새 커리어 시작':'이어하기'):data.action;
const readOnlySubmit=mode==='SUBMITTING'&&!data.writable&&data.id!=='S01';
return '<div class="topbar"><b>다시, 플레이볼</b><span>'+escape(data.id==='S01'?'나의 야구':'2032 · '+data.section)+'</span></div>'+art+'<div class="content"><p class="eyebrow">'+escape(data.section)+'</p><h2>'+escape(data.title)+'</h2><p class="intro">'+escape(long?'김도윤과함께다시시작하는아주긴이름의야구이야기 — '+data.subtitle:data.subtitle)+'</p>'+banner+(readOnlySubmit?'<p class="notice">이 화면은 기록 열람입니다. 확정 처리 상태가 없습니다.</p>':'')+'<div class="cards">'+content+'</div><div class="actions"><button type="button" class="primary" data-preview-action="primary"'+(busy?' disabled aria-busy="true"':'')+'>'+escape(action)+'</button><button type="button" class="secondary" data-preview-action="secondary">'+escape(data.secondary||'뒤로')+'</button></div></div><div class="footer">'+escape(data.id==='S01'?'커리어 · 구단 운영 · 보관함':'확정 기록과 현재 선택을 구분합니다.')+'</div>';
}
function validateLineup(ids){return ids.length===3&&new Set(ids).size===3&&ids.every(v=>['P01','P02','P03'].includes(v));}
global.PBFinish=Object.freeze({render,escape,validateLineup});
if(typeof document==='undefined')return;
const data=global.PBFinishData;let selected=data.screens[0].id;
const product=document.getElementById('product'),menu=document.getElementById('screen-list'),state=document.getElementById('view-state'),width=document.getElementById('view-width'),font=document.getElementById('view-font'),feedback=document.getElementById('demo-result');
menu.innerHTML=data.screens.map(s=>'<button type="button" data-id="'+s.id+'" aria-pressed="'+(s.id===selected)+'">'+escape(s.id+' '+s.title)+'</button>').join('');
function paint(){const s=data.screens.find(s=>s.id===selected);product.innerHTML=render(s,state.value);product.style.width=width.value+'px';product.style.setProperty('--text',font.value+'px');product.classList.toggle('desktop',Number(width.value)>=768);for(const b of menu.querySelectorAll('button'))b.setAttribute('aria-pressed',b.dataset.id===selected?'true':'false');document.getElementById('evidence').innerHTML='<h3>'+escape(s.id+' · 설계 확인점')+'</h3><p>'+escape(s.guard)+'</p><p class="muted">'+escape(s.review)+'</p><p><a href="108-ALL-SCREEN-FINALIZATION.md">45화면 마감 명세</a></p>';feedback.textContent='로컬 시안입니다. 서버 확정·게임 데이터 변경은 없습니다.';}
menu.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;selected=b.dataset.id;paint();});
for(const control of [state,width,font])control.addEventListener('change',paint);
product.addEventListener('click',e=>{const b=e.target.closest('button[data-preview-action]');if(!b)return;const s=data.screens.find(s=>s.id===selected);if(s.id==='S15'&&b.dataset.previewAction==='primary'){const ids=[...product.querySelectorAll('[data-lineup]')].map(el=>el.value);feedback.textContent=validateLineup(ids)?'세 타순에 서로 다른 선수가 선택됐습니다. 시안 검증만 했으며 실제 라인업은 저장하지 않았습니다.':'같은 선수를 두 타순에 넣을 수 없습니다. 타순별 선수를 다시 골라주세요.';return;}feedback.textContent='「'+b.textContent+'」 선택 위치를 확인했습니다. 실제 '+s.action+' 명령은 실행하지 않았습니다.';});
paint();
})(globalThis);

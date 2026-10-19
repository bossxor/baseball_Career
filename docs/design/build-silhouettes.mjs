// Generates the 14 face-less silhouettes of 119 and silhouette-board.html. No game/runtime work.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'assets','silhouettes');fs.mkdirSync(out,{recursive:true});
const U='var(--sil-uniform,#34495e)',A='var(--sil-accent,#c0392b)',S='var(--sil-skin,#8a97a6)';
const KO={R:'우',L:'좌',S:'양'},FORM={overhand:'오버핸드',threequarter:'쓰리쿼터',sidearm:'사이드암',underhand:'언더핸드'};
const wrap=(title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const pt=(p,m)=>p.map((v,i)=>i%2?v:(m?120-v:v)).join(' ');
const arm=(pts,m,w=8)=>{const q=[];for(let i=0;i<pts.length;i+=2)q.push((m?120-pts[i]:pts[i])+','+pts[i+1]);return `<polyline points="${q.join(' ')}" fill="none" stroke="${U}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`};
const mx=(x,m)=>m?120-x:x;
const base=(spread=0)=>`<circle cx="60" cy="26" r="10" fill="${S}"/><path d="M49 25a11 11 0 0 1 22 0z" fill="${A}"/><rect x="60" y="23" width="14" height="3" rx="1.5" fill="${A}"/><polygon points="46,40 74,40 71,90 49,90" fill="${U}"/><rect x="49" y="86" width="22" height="4" fill="${A}"/><polygon points="49,90 61,90 ${58-spread},152 ${46-spread},152" fill="${U}"/><polygon points="59,90 71,90 ${74+spread},152 ${62+spread},152" fill="${U}"/>`;
const glove=(x,y)=>`<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${A}"/>`;
function hitter(th,bt){
 const m=bt==='L'; // right-handed batter: bat over viewer's left (rear) shoulder
 const bat=(mm,op)=>`<g opacity="${op}">${arm([46,42,44,46],mm)}${arm([74,42,44,46],mm)}<line x1="${mx(44,mm)}" y1="46" x2="${mx(28,mm)}" y2="6" stroke="${U}" stroke-width="5" stroke-linecap="round"/><circle cx="${mx(44,mm)}" cy="46" r="4" fill="${S}"/></g>`;
 const gx=th==='R'?82:38; // glove hangs on the glove hand's hip (left hand for right-throwers)
 const body=base()+glove(gx,96)+(bt==='S'?bat(true,.4)+bat(false,1):bat(m,1));
 return wrap(`타자 실루엣 · 던지는 손 ${KO[th]} · 타석 ${KO[bt]}`,body);
}
const P={overhand:{e:[38,26],h:[44,8]},threequarter:{e:[34,34],h:[28,16]},sidearm:{e:[34,46],h:[20,44]},underhand:{e:[34,66],h:[38,92]}};
function pitcher(th,form){
 const m=th==='L',p=P[form];
 const t=arm([46,42,...p.e,...p.h],m),b=`<circle cx="${mx(p.h[0],m)}" cy="${p.h[1]}" r="4.5" fill="${A}"/>`;
 const g=arm([74,42,70,60],m,7)+glove(mx(68,m),62);
 return wrap(`투수 실루엣 · 던지는 손 ${KO[th]} · ${FORM[form]}`,base(3)+g+t+b);
}
const files=[];
for(const th of 'RL')for(const bt of 'RLS'){const n=`hitter-${th}${bt}.svg`;fs.writeFileSync(path.join(out,n),hitter(th,bt));files.push([n,`타자 ${KO[th]}투${KO[bt]}타`,'hitter'])}
for(const th of 'RL')for(const f of Object.keys(FORM)){const n=`pitcher-${th}-${f}.svg`;fs.writeFileSync(path.join(out,n),pitcher(th,f));files.push([n,`투수 ${KO[th]}투 ${FORM[f]}`,'pitcher'])}
const pal={'기본':'#34495e/#c0392b','진녹':'#1f4d3a/#e8c547','남색':'#1d2f6f/#e63946','회색':'#4a4f57/#f4a261'};
const cards=files.map(([n,t,k])=>`<figure class="card ${k}"><div class="sil">${fs.readFileSync(path.join(out,n),'utf8')}</div><figcaption><b>이름 예시</b><span>${t}</span><small>${n}</small></figcaption></figure>`).join('\n');
const opts=Object.entries(pal).map(([k,v])=>`<option value="${v}">${k}</option>`).join('');
fs.writeFileSync(path.join(root,'silhouette-board.html'),`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>실루엣 보드</title>
<style>
:root{--bg:#f6f1e7;--ink:#1f2933;--card:#fffdf8;--line:#d9d0bd;--sil-uniform:#34495e;--sil-accent:#c0392b;--sil-skin:#8a97a6}
@media (prefers-color-scheme:dark){:root{--bg:#161a1f;--ink:#e8e6e1;--card:#1f252c;--line:#38414b;--sil-uniform:#9db4cc;--sil-skin:#c3ccd6}}
body{margin:0;padding:16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,"Noto Sans KR",sans-serif}
h1{font-size:1.25rem;margin:0 0 4px}p{margin:4px 0 12px;max-width:60ch}
label{display:inline-flex;gap:8px;align-items:center;margin:8px 0 16px}select{font:inherit;padding:4px 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.card{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px;text-align:center}
.sil svg{width:100%;max-width:120px;height:auto}figcaption{display:grid;gap:2px;font-size:.9rem}small{opacity:.6}
</style></head><body>
<h1>119 실루엣 14종</h1>
<p>사람 얼굴·체형 없이 던지는 손·타석·투구폼만 보여줍니다. 팔레트만 바꿔 팀/NPC를 표현합니다. 투수는 오른팔 던지는 손이 정면 기준 왼쪽에 보입니다. 이 보드는 정적 시안이며 실제 렌더·접근성 검수는 하지 않았습니다.</p>
<label>팔레트 <select id="pal">${opts}</select></label>
<div class="grid">
${cards}
</div>
<script>
document.getElementById('pal').addEventListener('change',function(){var v=this.value.split('/'),r=document.documentElement.style;r.setProperty('--sil-uniform',v[0]);r.setProperty('--sil-accent',v[1]);});
</script></body></html>
`);
console.log('silhouettes',files.length);

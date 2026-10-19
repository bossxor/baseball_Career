// Regenerate the portable design book and SHA256 manifest; no game/runtime work.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const write=(name,text)=>fs.writeFileSync(path.join(root,name),text.replace(/\r\n/g,'\n').replace(/^\uFEFF/,''),'utf8');
for(const file of walk(root))if(/\.(md|html|json|js|mjs)$/.test(file)){
const before=fs.readFileSync(file,'utf8'),after=before.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');if(before!==after)fs.writeFileSync(file,after,'utf8');}
const leading=['START-HERE.md','README.md','STATUS.md','DETAIL-PLAN.md','14-CANONICAL-DECISIONS.md'];
const numbered=fs.readdirSync(root).filter(n=>/^\d+-.*\.md$/.test(n)&&!leading.includes(n)).sort((a,b)=>parseInt(a,10)-parseInt(b,10)||(a<b?-1:a>b?1:0));
const ordered=[...leading,...numbered,'EVENT-CATALOG.md','HANDOFF-PROMPT.md','VALIDATION.md'];
const index=JSON.parse(read('current-contract-index.json')),closure=JSON.parse(read('design-closure-register.json'));
write('DESIGN-ALL.md','# 다시, 플레이볼 — 게임 설계 기준본'+index.baselineVersion+' · 청춘 야구 애니 시각 확장'+closure.visualExtension.version+'\n'+ordered.map(n=>'\n---\n\n<!-- SOURCE: '+n+' -->\n\n'+read(n).trimEnd()+'\n').join(''));
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
const entries=walk(root).filter(p=>path.basename(p)!=='MANIFEST-SHA256.csv').map(p=>({file:p,name:path.relative(root,p).replaceAll('\\','/')})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
const rows=entries.map(({file,name})=>{const data=fs.readFileSync(file);return [name,data.length,crypto.createHash('sha256').update(data).digest('hex').toUpperCase()].map(quote).join(',');});
write('MANIFEST-SHA256.csv',[['Path','Bytes','SHA256'].map(quote).join(','),...rows].join('\n')+'\n');
console.log('Rebuilt '+ordered.length+' document sections in numeric order and '+entries.length+' SHA256 entries.');

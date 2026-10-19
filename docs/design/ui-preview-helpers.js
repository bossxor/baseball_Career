(function(root){'use strict';
function rebalancePitchWeights(entries,changedId,value){
if(!Array.isArray(entries)||entries.length<2||entries.length>4||new Set(entries.map(p=>p.id)).size!==entries.length||entries.some(p=>!Number.isInteger(p.weight)||p.weight<10||p.weight>90)||entries.reduce((a,p)=>a+p.weight,0)!==100||!Number.isInteger(value)||!entries.some(p=>p.id===changedId))throw new Error('INVALID_ALLOCATION');
const result=entries.map(p=>({...p}));const chosen=result.find(p=>p.id===changedId);chosen.weight=Math.max(10,Math.min(100-10*(entries.length-1),value));let remaining=100-chosen.weight;let free=result.filter(p=>p.id!==changedId);
while(free.length){const total=free.reduce((a,p)=>a+p.weight,0);const locked=free.filter(p=>remaining*p.weight<10*total);if(locked.length){for(const p of locked){p.weight=10;remaining-=10;}free=free.filter(p=>!locked.includes(p));continue;}
const shares=free.map(p=>({p,base:Math.floor(remaining*p.weight/total),remainder:remaining*p.weight%total}));let left=remaining-shares.reduce((a,p)=>a+p.base,0);shares.sort((a,b)=>b.remainder-a.remainder||(a.p.id<b.p.id?-1:a.p.id>b.p.id?1:0));for(const s of shares){s.p.weight=s.base+(left-->0?1:0);}break;}
return result;
}

function advanceCommentaryPreview(state,action,count){
if(!Number.isInteger(count)||count<1||!Number.isInteger(state.cursor)||state.cursor<0||state.cursor>=count||![1,2,4].includes(state.speed))throw new Error('INVALID_VIEWER_STATE');
const next={...state};switch(action){case 'step':next.cursor=Math.min(count-1,state.cursor+1);next.playing=false;break;case 'back':next.cursor=Math.max(0,state.cursor-1);next.playing=false;break;case 'skip':next.cursor=count-1;next.playing=false;break;case 'reset':next.cursor=0;next.playing=false;break;case 'play':next.playing=!state.playing&&state.cursor<count-1;break;case 'tick':if(state.playing)next.cursor=Math.min(count-1,state.cursor+1);if(next.cursor===count-1)next.playing=false;break;case 'speed':next.speed=state.speed===1?2:state.speed===2?4:1;break;default:throw new Error('INVALID_VIEWER_ACTION');}return next;
}
function escapePreviewText(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}

root.PBPreview=Object.freeze({rebalancePitchWeights,advanceCommentaryPreview,escapePreviewText});
})(globalThis);

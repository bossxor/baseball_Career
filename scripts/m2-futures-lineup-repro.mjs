// Repro for the KBO Futures lineup crash (2036 day 224 of the native P11 attempt): node --max-old-space-size=8192 --import tsx scripts/m2-futures-lineup-repro.mjs <p11 checkpoint.gz>
// Prints: the advance that throws ROSTER_INVALID, every club's healthy hitters by league, and LT Futures with/without its injury.
import fs from 'node:fs';import zlib from 'node:zlib';
import {advanceKboCareerRun} from '../packages/engine/src/kbo-progress.ts';
import {kboNationalStopDay} from '../apps/api/src/career-pro-national-shell.ts';
const raw=JSON.parse(zlib.gunzipSync(fs.readFileSync(process.argv[2])).toString());let c=raw.state;
const adv=()=>{const o=advanceKboCareerRun(c,c.revision,7,()=>true,kboNationalStopDay);c=o.career;console.log('adv ->',c.phaseContext.phase,c.phaseContext.nextWorldDay,o.stopReason);};
adv();
const day=c.phaseContext.nextWorldDay;
const sch=c.competitionSchedule.leagues;
const pend=Object.entries(sch).flatMap(([lg,g])=>g.filter(x=>x.worldDay>=day&&x.worldDay<day+8).map(x=>({lg,...x})));
console.log('games',pend.length,Object.keys(c.world).slice(0,30).join(','));
const teams=new Set(pend.flatMap(x=>[x.homeTeamKey,x.awayTeamKey]));
const inj=c.health.injuries;
for(const t of teams){const s=(c.world.schools??[]).find(s=>s.id===t);const club=c.world.clubs.find(k=>k.id===t);
 const ids=s?s.roster:null;console.log(t,!!s,!!club,ids?ids.length:null);
 if(ids){const hit=ids.map(k=>c.world.players[k]).filter(p=>p?.kind==='HITTER');console.log(' hit',hit.length,'unavail?',hit.filter(p=>Object.hasOwn(inj,p.simulationKey)).length);}}
try{adv();}catch(e){console.log('ERR',e.message);}
const inj2=c.health.injuries;
for(const cl of c.world.clubs){for(const [lg,ros] of [['KBO',cl.firstTeam],['FUT',cl.roster.filter(k=>!cl.firstTeam.includes(k))]]){
 const hit=ros.map(k=>c.world.players[k]).filter(p=>p?.kind==='HITTER'),av=hit.filter(p=>!Object.hasOwn(inj2,p.simulationKey));
 const pos={};for(const p of av)pos[p.position]=(pos[p.position]??0)+1;
 console.log(cl.id,lg,'roster',ros.length,'hit',hit.length,'avail',av.length,JSON.stringify(pos));}}
import {automaticFieldLineup,initialPositionFits} from '../packages/engine/src/lineup.ts';
import {emptyBatting} from '../packages/engine/src/stats.ts';
const lt=c.world.clubs.find(k=>k.id==='LT');const fut=lt.roster.filter(k=>!lt.firstTeam.includes(k)).map(k=>c.world.players[k]).filter(p=>p.kind==='HITTER');
const run=(avail)=>{try{automaticFieldLineup(fut.map(player=>({player,available:avail(player),fits:initialPositionFits(player.position),recent:emptyBatting()}))); return 'ok';}catch(e){return e.message;}};
console.log('LT futures hitters',fut.length,'injured',fut.filter(p=>Object.hasOwn(c.health.injuries,p.simulationKey)).map(p=>p.simulationKey+':'+p.position+':'+p.throws));
console.log('all available ->',run(()=>true));
console.log('injury respected ->',run(p=>!Object.hasOwn(c.health.injuries,p.simulationKey)));

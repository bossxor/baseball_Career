import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';

/** Controlled season-review state: closed day receipts for the whole regular range (no regular games played). */
function review():KboCareer {
 const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),c=structuredClone(startKboRegularSeason(s,s.revision));
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'test',result:{injured:[],recovered:[]}}))};c.phaseContext={phase:'SEASON_REVIEW'};return c;
}

test('the postseason plays real games day by day to one champion and returns to SEASON_REVIEW',()=>{
 const r=review(),started=startKboPostseason(r,r.revision),before=canonicalJson(r);
 assert.equal(started.phaseContext.phase,'POSTSEASON_PROGRESS');assert.throws(()=>startKboPostseason(started,started.revision));
 let c=started,games=0,stop='';
 for(let i=0;i<400;i++){const out=advanceKboPostseason(JSON.parse(JSON.stringify(c)) as KboCareer,c.revision);c=out.career;stop=out.stopReason;if(stop==='GAME_FINAL' || stop==='HEALTH_CHANGE' || stop==='POSTSEASON_COMPLETE')games++;if(stop==='POSTSEASON_COMPLETE')break;assert.notEqual(stop,'ENGINE_LIMIT');}
 assert.equal(stop,'POSTSEASON_COMPLETE');assert.equal(c.phaseContext.phase,'SEASON_REVIEW');
 const ps=c.postseason!;assert.ok(ps.championKey && ps.seeds.includes(ps.championKey));
 const recorded=Object.values(c.records.games).filter(g=>g.scope.phase==='POSTSEASON' && g.scope.leagueKey==='KBO' && g.scope.seasonKey===c.world.seasonKey);
 assert.equal(recorded.length,ps.series.reduce((n,s)=>n+s.games.length,0));assert.equal(recorded.length,games);
 assert.ok(games>=10 && games<=17);
 const days=c.days!.days;days.forEach((d,i)=>{if(i>0)assert.equal(d.day,days[i-1]!.day+1);});
 assert.throws(()=>startKboPostseason(c,c.revision));assert.equal(canonicalJson(r),before);
 // Regular-season growth still reads only the regular range after postseason days were appended.
 assert.doesNotThrow(()=>settleKboSeasonGrowth(c,c.revision));
});

test('postseason home runs feed career trait evidence after each postseason day',()=>{
 const r=review(),key=r.protagonistKey;let c=startKboPostseason(r,r.revision);
 // Controlled official PS line for my player this season (5 HR): the first postseason day close must unlock T06 once.
 const seeded=structuredClone(c);seeded.records.games['old-ps']={gameKey:'old-ps',worldDay:r.days!.days.at(-1)!.day,scope:{seasonKey:r.world.seasonKey,leagueKey:'KBO',phase:'POSTSEASON'},teams:{a:{games:1,W:1,L:0,T:0,R:5,RA:0},b:{games:1,W:0,L:1,T:0,R:0,RA:5}},
  batting:{[key]:{PA:5,AB:5,BB:0,HBP:0,K:0,H:5,TB:20,HR:5,R:5,RBI:5,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},
  batterSplits:{[key]:{L:{PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},R:{PA:5,AB:5,H:5,BB:0,HBP:0,K:0,TB:20,HR:5,twoB:0,threeB:0,RBI:5}}},pitcherSplits:{},matchups:{}};
 c=seeded;
 for(let i=0;i<60;i++){const out=advanceKboPostseason(c,c.revision);c=out.career;if(out.stopReason!=='CHUNK_LIMIT')break;}
 assert.ok(c.traits!.owned[key]!.unlocked.includes('T06'));
 assert.equal(c.traits!.unlocks.filter(u=>u.traitId==='T06').length,1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';

const scheduled=(kind:'HITTER'|'PITCHER'='PITCHER')=>{const e=enteredKboCareer(kind),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision);return confirmKboSeasonSchedule(o,o.revision);};
function runDay(start:KboCareer):{career:KboCareer;steps:number} {
 let career=start,steps=0;
 for(;steps<200;steps++){const r=advanceKboCareer(career,career.revision,1);career=r.career;if(r.stopReason==='DAY_CLOSED' || r.stopReason==='SEASON_REVIEW')return {career,steps:steps+1};assert.equal(r.stopReason,'CHUNK_LIMIT');}
 throw new Error('PROGRESS_LIMIT');
}
const proGames=(c:KboCareer)=>Object.values(c.records.games).filter(g=>['KBO','FUTURES'].includes(g.scope.leagueKey) && g.scope.seasonKey===c.world.seasonKey);

test('start needs the confirmed plan, roster and schedule and cannot repeat',()=>{
 const s=scheduled(),before=canonicalJson(s),started=startKboRegularSeason(s,s.revision);
 assert.equal(started.phaseContext.phase,'SEASON_PROGRESS');assert.equal(started.revision,s.revision+1);assert.equal(started.days!.days.length,0);
 assert.equal(canonicalJson(s),before);
 assert.throws(()=>startKboRegularSeason(started,started.revision),/KBO_SEASON_NOT_READY/);
 assert.throws(()=>startKboRegularSeason(s,s.revision+5),/CAREER_REVISION_CHANGED/);
 const e=enteredKboCareer('HITTER');assert.throws(()=>startKboRegularSeason(e,e.revision),/KBO_SEASON_NOT_READY/);
});

test('one real opening day: both leagues play and close once; chunk limits resume exactly from JSON',()=>{
 const started=startKboRegularSeason(scheduled(),scheduled().revision);
 const a=runDay(started),b=(()=>{let c=started;for(let i=0;i<200;i++){const r=advanceKboCareer(JSON.parse(JSON.stringify(c)) as KboCareer,c.revision,1);c=r.career;if(r.stopReason!=='CHUNK_LIMIT')return {career:c,steps:i+1};}throw new Error('LIMIT');})();
 assert.equal(canonicalJson(a.career),canonicalJson(b.career));
 const day=Math.min(...Object.values(a.career.competitionSchedule!.leagues).flatMap(l=>l.map(g=>g.worldDay)));
 const played=proGames(a.career);assert.equal(played.length,10);assert.ok(played.every(g=>g.worldDay===day));
 assert.ok(played.some(g=>g.scope.leagueKey==='KBO') && played.some(g=>g.scope.leagueKey==='FUTURES'));
 assert.equal(a.career.days!.days.length,1);assert.equal((a.career.phaseContext as KboSeasonProgress).nextWorldDay,day+1);assert.equal((a.career.phaseContext as KboSeasonProgress).pendingGame,null);
 assert.equal(a.career.records.games[played[0]!.gameKey]!.worldDay,day);
 assert.ok(a.steps>=1);
});

test('a stale revision, wrong phase or bad day count is rejected without changing the career',()=>{
 const s=scheduled(),started=startKboRegularSeason(s,s.revision),before=canonicalJson(started);
 assert.throws(()=>advanceKboCareer(started,started.revision+1),/CAREER_REVISION_CHANGED/);
 assert.throws(()=>advanceKboCareer(started,started.revision,0),/INVALID_ADVANCE_DAYS/);
 assert.throws(()=>advanceKboCareer(s,s.revision),/INVALID_CAREER_PHASE/);
 assert.equal(canonicalJson(started),before);
});

test('three days close in order; pitcher books never roll back and each club plays at most once per league and day',()=>{
 let career=startKboRegularSeason(scheduled(),scheduled().revision);
 const xp=(c:KboCareer)=>Object.fromEntries(Object.entries(c.world.repertoires).map(([k,r])=>[k,Object.values(r.book).reduce((s,v)=>s+v,0)]));
 for(let d=0;d<3;d++){
  const before=xp(career),next=runDay(career).career;career=next;
  for(const [k,v] of Object.entries(xp(career)))assert.ok(v>=(before[k]??0),k);
 }
 assert.equal(career.days!.days.length,3);
 career.days!.days.forEach((d,i)=>assert.equal(d.day,career.days!.days[0]!.day+i));
 const seen=new Set<string>();
 for(const g of proGames(career))for(const team of Object.keys(g.teams)){const key=[g.scope.leagueKey,g.worldDay,team].join('|');assert.ok(!seen.has(key),key);seen.add(key);}
 const first=career.days!.days[0]!.day,expected=Object.values(career.competitionSchedule!.leagues).flatMap(l=>l.filter(g=>g.worldDay>=first && g.worldDay<first+3)).length;
 assert.equal(proGames(career).length,expected);assert.ok(expected>0);
});

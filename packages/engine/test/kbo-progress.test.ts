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
import {settleStarterSeasonTraits} from '../src/high-school-traits.js';

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

const firstScheduledDay=(c:KboCareer)=>Math.min(...Object.values(c.competitionSchedule!.leagues).flatMap(l=>l.map(g=>g.worldDay)));

test('recovery of my own player stops progress with HEALTH_CHANGE after the day closes',()=>{
 const s=scheduled('HITTER'),first=firstScheduledDay(s),key=s.protagonistKey,season=s.world.seasonKey;
 const injured=structuredClone(s);
 injured.health={...injured.health,injuries:Object.assign(Object.create(null),injured.health.injuries,{[key]:{severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'earlier-game',seasonKey:season}}),
  games:[...injured.health.games,{evidence:{gameKey:'earlier-game',teamKey:'earlier-team',seasonKey:season,day:first-5,roster:[key],appearances:[]},result:{injured:[key],recovered:[]}}]};
 const started=startKboRegularSeason(injured,injured.revision);
 let career=started,stop='',days=0;
 for(let i=0;i<200;i++){const r=advanceKboCareer(career,career.revision,1);career=r.career;days+=r.daysClosed;stop=r.stopReason;if(r.stopReason!=='CHUNK_LIMIT')break;}
 assert.equal(stop,'HEALTH_CHANGE');assert.equal(days,1);assert.ok(!Object.hasOwn(career.health.injuries,key));
 assert.equal((career.phaseContext as KboSeasonProgress).nextWorldDay,first+1);assert.equal(career.days!.days.length,1);
});

test('official records that cross a trait threshold unlock it once after a pro day close',()=>{
 const s=scheduled('HITTER'),first=firstScheduledDay(s),key=s.protagonistKey,season=s.world.seasonKey;
 const seeded=structuredClone(s),gameKey='seed-official-game';
 seeded.records.games[gameKey]={gameKey,worldDay:first-1,scope:{seasonKey:season,leagueKey:'KBO',phase:'REGULAR'},teams:{seedA:{games:1,W:1,L:0,T:0,R:1,RA:0},seedB:{games:1,W:0,L:1,T:0,R:0,RA:1}},
  batting:{[key]:{PA:30,AB:0,BB:30,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},
  batterSplits:{[key]:{L:{PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0},R:{PA:30,AB:0,H:0,BB:30,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0}}},pitcherSplits:{},matchups:{}};
 seeded.records.revision+=1;
 let career=startKboRegularSeason(seeded,seeded.revision);
 career=runDay(career).career;
 assert.ok(career.traits!.owned[key]!.unlocked.includes('T02'));
 assert.equal(career.traits!.unlocks.filter(u=>u.traitId==='T02' && u.playerKey===key).length,1);
 const once=career.traits!.unlocks.length;career=runDay(career).career;
 assert.equal(career.traits!.unlocks.filter(u=>u.traitId==='T02').length,1);assert.ok(career.traits!.unlocks.length>=once);
});


test('pro season close settles T16 once from official starter outs and labels the qualifying league',()=>{
 const s=scheduled('PITCHER'),season=s.world.seasonKey,index=Number(season),key=s.protagonistKey,first=firstScheduledDay(s);
 const seeded=structuredClone(s);
 seeded.traits={...(seeded.traits??{schemaVersion:1,owned:{},unlocks:[],lastClosedDay:null}),starterStreaks:{[key]:{lastSeasonIndex:index-1,streak:4}},settledStarterSeasons:[]};
 const pz={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};
 for(let i=0;i<3;i++){const gameKey=`seed-start-${i}`;seeded.records.games[gameKey]={gameKey,worldDay:first-10+i,scope:{seasonKey:season,leagueKey:'KBO',phase:'REGULAR'},teams:{sA:{games:1,W:1,L:0,T:0,R:1,RA:0},sB:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},
  pitching:{[key]:{BF:27,outs:27,H:0,HR:0,BB:0,HBP:0,K:0,R:0,ER:0,pitches:90,games:1,starts:1,starterOuts:27,loadedBF:0,W:1,L:0,SV:0,HLD:0,BS:0,shutouts:0}},batterSplits:{},pitcherSplits:{[key]:{L:{...pz},R:{...pz,BF:27,outs:27}}},matchups:{}};}
 const ledger=settleStarterSeasonTraits(seeded,first+200);
 assert.equal(ledger.starterStreaks![key]!.streak,5);assert.ok(ledger.owned[key]!.unlocked.includes('T16'));
 assert.deepEqual(ledger.unlocks.filter(u=>u.traitId==='T16').map(u=>[u.seasonKey,u.leagueKey]),[[season,'KBO']]);
 assert.equal(JSON.stringify(settleStarterSeasonTraits({...seeded,traits:ledger},first+200)),JSON.stringify(ledger));
});

test('advancing past the last scheduled day enters SEASON_REVIEW and settles the season once',()=>{
 const started=startKboRegularSeason(scheduled(),scheduled().revision),last=Math.max(...Object.values(started.competitionSchedule!.leagues).flatMap(l=>l.map(g=>g.worldDay)));
 const atEnd=structuredClone(started);(atEnd.phaseContext as KboSeasonProgress).nextWorldDay=last+1;
 const r=advanceKboCareer(atEnd,atEnd.revision);
 assert.equal(r.stopReason,'SEASON_REVIEW');assert.equal(r.career.phaseContext.phase,'SEASON_REVIEW');
 assert.deepEqual(r.career.traits!.settledStarterSeasons,[r.career.world.seasonKey]);
 assert.throws(()=>advanceKboCareer(r.career,r.career.revision),/INVALID_CAREER_PHASE/);
});

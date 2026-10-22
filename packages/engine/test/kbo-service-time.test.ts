import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {kboServiceTimeView} from '../src/kbo-service-time.js';
import type {KboSeasonArchive} from '../src/kbo-year-transition.js';
import type {KboSeasonClose} from '../src/kbo-year-end.js';
import {canonicalJson} from '../src/game.js';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
function fixture():ReturnType<typeof stagedKboOffseason> & {proSeasons:KboSeasonArchive[];seasonClose?:KboSeasonClose}{const x=stagedKboOffseason(0);x.world.seasonKey='2040';return {...x,proSeasons:[]};}
function season(s:ReturnType<typeof fixture>,year:string,count:number,options:{league?:string;phase?:'REGULAR'|'POSTSEASON'|'INTERNATIONAL';registered?:boolean;closed?:boolean}={}){
 const league=options.league??'KBO',club=s.world.clubs[0]!.id,opponent=s.world.clubs[1]!.id;
 for(let day=1;day<=count;day++){
  const key=JSON.stringify(['service-test',year,league,options.phase??'REGULAR',day]);
  s.records.games[key]={gameKey:key,worldDay:day,scope:{seasonKey:year,leagueKey:league,phase:options.phase??'REGULAR'},teams:{[club]:{games:1,W:0,L:0,T:1,R:0,RA:0},[opponent]:{games:1,W:0,L:0,T:1,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  s.health.games=[...s.health.games,{evidence:{gameKey:key,teamKey:league+':'+club,seasonKey:year,day,roster:options.registered===false?[]:[s.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
 }
 if(options.closed!==false){if(year===s.world.seasonKey)s.seasonClose={seasonKey:year} as KboSeasonClose;else s.proSeasons.push({seasonKey:year} as KboSeasonArchive);}
}
test('registration thresholds stay separate at6/7/8/9 closed100-game seasons, independent of actual appearances',()=>{
 for(const n of [6,7,8,9]){const s=fixture();for(let i=0;i<n;i++)season(s,String(2030+i),100);const before=canonicalJson(s),v=kboServiceTimeView(s);assert.equal(v.qualifiedSeasons,n);assert.equal(v.registrationThresholds.posting.reached,n>=7);assert.equal(v.registrationThresholds.domesticFa.reached,n>=8);assert.equal(v.registrationThresholds.overseasFa.reached,n>=9);assert.equal(canonicalJson(s),before);assert.deepEqual(kboServiceTimeView(JSON.parse(before)),v);assert.doesNotMatch(JSON.stringify(v),/potential|abilities|rng|seed|probability/i);}
});
test('99 fails and100 qualifies once; an open current100-game season is projected but not yet counted',()=>{
 const s=fixture();season(s,'2030',99);season(s,'2031',100);season(s,'2040',100,{closed:false});let v=kboServiceTimeView(s);assert.equal(v.qualifiedSeasons,1);assert.equal(v.currentSeason.qualifiesWhenClosed,true);assert.equal(v.currentSeason.registeredGames,100);s.seasonClose={seasonKey:'2040'} as KboSeasonClose;v=kboServiceTimeView(s);assert.equal(v.qualifiedSeasons,2);assert.equal(v.seasons.find(y=>y.seasonKey==='2030')!.qualified,false);
});
test('Futures, PS, international, missing official games and unregistered days do not create service years; injury registration counts',()=>{
 const s=fixture();season(s,'2030',144,{league:'FUTURES'});season(s,'2031',100,{phase:'POSTSEASON'});season(s,'2032',100,{phase:'INTERNATIONAL'});season(s,'2033',144,{registered:false});season(s,'2034',100);s.health.injuries[s.protagonistKey]={severity:'MEDIUM',remainingTeamGames:8,seasonKey:'2034',diagnosedGameKey:'controlled-injury'};
 const before=canonicalJson(s),v=kboServiceTimeView(s);assert.equal(v.qualifiedSeasons,1);assert.equal(v.seasons.find(y=>y.seasonKey==='2034')!.registeredGames,100);assert.equal(canonicalJson(s),before);s.records.games={};assert.equal(kboServiceTimeView(s).qualifiedSeasons,0);
});
test('duplicate registration, mismatched day/team/year and malformed close markers reject without modifying input',()=>{
 const source=fixture();season(source,'2030',1);for(const change of [(s:typeof source)=>{s.health.games=[...s.health.games,s.health.games[0]!];},(s:typeof source)=>{s.health.games[0]!.evidence.day++;},(s:typeof source)=>{s.health.games[0]!.evidence.teamKey='KBO:missing';},(s:typeof source)=>{s.health.games[0]!.evidence.seasonKey='2029';},(s:typeof source)=>{s.proSeasons.push(s.proSeasons[0]!);},(s:typeof source)=>{s.seasonClose={seasonKey:'2030'} as KboSeasonClose;}]){const bad=structuredClone(source);change(bad);const before=canonicalJson(bad);assert.throws(()=>kboServiceTimeView(bad),/KBO_SERVICE/);assert.equal(canonicalJson(bad),before);}
});
test('old careers without service evidence remain zero; no service year is inferred from age, salary, current roster or stats',()=>{
 const s=fixture(),before=canonicalJson(s),v=kboServiceTimeView(s);assert.equal(v.qualifiedSeasons,0);assert.equal(v.currentSeason.registeredGames,0);assert.equal(v.seasons.length,1);assert.equal(v.registrationThresholds.posting.reached,false);assert.equal(canonicalJson(s),before);
});

test('an actual closed KBO opening day gives an unused registered bench player one game and no qualified service season',()=>{
 const entered=enteredKboCareer(),plan=confirmKboPreseasonPlan(entered,entered.revision),roster=confirmKboOpeningRoster(plan,plan.revision),scheduled=confirmKboSeasonSchedule(roster,roster.revision);let career=startKboRegularSeason(scheduled,scheduled.revision);
 for(let i=0;i<60 && !career.health.games.some(r=>r.evidence.seasonKey===career.world.seasonKey && r.evidence.teamKey.startsWith('KBO:'));i++){const out=advanceKboCareer(career,career.revision,1);career=out.career;assert.notEqual(out.stopReason,'ENGINE_LIMIT');}
 const row=career.health.games.find(r=>r.evidence.seasonKey===career.world.seasonKey && r.evidence.teamKey.startsWith('KBO:'))!;assert.ok(row);const bench=row.evidence.roster.find(k=>!row.evidence.appearances.some(a=>a.playerKey===k))!;assert.ok(bench);
 const before=canonicalJson(career),v=kboServiceTimeView({...career,protagonistKey:bench});assert.equal(v.currentSeason.registeredGames,1);assert.equal(v.qualifiedSeasons,0);assert.equal(v.currentSeason.qualifiesWhenClosed,false);assert.equal(canonicalJson(career),before);
});

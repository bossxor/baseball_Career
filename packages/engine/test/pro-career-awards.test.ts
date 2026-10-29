import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './fixtures.js';
import {createGame,runGameChunk,canonicalJson} from '../src/game.js';
import {buildGameContribution,emptyRecordLedger} from '../src/records.js';
import type {GameContribution,RecordLedger} from '../src/records.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {FIELD_POSITIONS} from '../src/lineup.js';
import {observeProCareerAwardGame,refreshProCareerAwards,calculateProSeasonAwards,positiveCumulativeAwardLeaders,proCareerAwardsView} from '../src/pro-career-awards.js';
import type {CareerProAwardLedger} from '../src/pro-career-awards.js';

function finalGame(positions=true){const input=game('award-proof');if(positions)for(const t of input.teams)t.fielders=t.fielders.map((f,i)=>({...f,position:FIELD_POSITIONS[i]!}));return runGameChunk(createGame(input)).state;}
function career(records:RecordLedger,ledger?:CareerProAwardLedger):KboCareer&{proAwards?:CareerProAwardLedger}{return {revision:1,world:{worldKey:'awards',seasonKey:'2027'},protagonistKey:'away-h0',protagonistClubId:'away',phaseContext:{phase:'SEASON_PROGRESS',nextWorldDay:1,pendingGame:null},registration:{firstTeam:true},records,...(ledger?{proAwards:ledger}:{})}as unknown as KboCareer;}
function syntheticSeason(count=50){
 const records=emptyRecordLedger(),l:CareerProAwardLedger={schemaVersion:1,worldKey:'awards',playerKey:'a',games:{},annual:[],allStars:[],notices:[]};
 const split={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 for(let i=0;i<count;i++){
  const id=`g${i}`,scope={seasonKey:'2027',leagueKey:'KBO',phase:'REGULAR' as const},row:GameContribution={gameKey:id,worldDay:i,scope,teams:{away:{games:1,W:1,L:0,T:0,R:1,RA:0},home:{games:1,W:0,L:1,T:0,R:0,RA:1}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
  const appearances:CareerProAwardLedger['games'][string]['appearances']={};
  for(const key of ['a','b','c','d','e','f']){row.batting[key]={PA:4,AB:4,H:key==='a'?3:2,BB:0,HBP:0,K:0,TB:4,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};row.batterSplits[key]={L:{...split},R:{...split}};appearances[key]={teamKey:'away',position:key==='e'&&i<30?'CF':'SS',defenseUnits:500_000};}
  records.games[id]=row;l.games[id]={gameKey:id,scope,worldDay:i,appearances};
 }
 return {records,l};
}

test('FINAL observer keeps actual immutable fielding slots, JSON replay is idempotent and legacy slots stay unknown',()=>{
 const g=finalGame(),r=buildGameContribution(g,{seasonKey:'2027',leagueKey:'KBO',phase:'REGULAR'},1),c=career({revision:1,games:{[r.gameKey]:r}}),before=canonicalJson(c),observed=observeProCareerAwardGame(c,g);
 assert.equal(observed.proAwards!.games[r.gameKey]!.appearances['away-h0']!.position,'C');
 assert.equal(observed.proAwards!.games[r.gameKey]!.appearances['away-h8']!.position,'DH');
 assert.equal(canonicalJson(c),before);assert.equal(observeProCareerAwardGame(observed,JSON.parse(JSON.stringify(g))),observed);
 const legacy=finalGame(false),lr=buildGameContribution(legacy,r.scope,1),old=observeProCareerAwardGame(career({revision:1,games:{[lr.gameKey]:lr}}),legacy);
 assert.equal(old.proAwards!.games[lr.gameKey]!.appearances['away-h0'],undefined);assert.equal(old.proAwards!.games[lr.gameKey]!.appearances['away-h8'],undefined);
 assert.throws(()=>observeProCareerAwardGame(c,createGame(game())),/PRO_AWARD_GAME_NOT_COMMITTED/);
 const bad=structuredClone(g);(bad.input.teams[0].fielders[0]as {position?:string}).position='SP';assert.throws(()=>observeProCareerAwardGame(c,bad),/INVALID_PRO_AWARD_POSITION/);
});

test('annual awards use actual most-played position, 50-game and 200-PA thresholds, explicit first-pro proof and deterministic ties',()=>{
 const {records,l}=syntheticSeason(),awards=calculateProSeasonAwards(records,l,'2027','KBO',{a:'2027',b:'2026'});
 assert.equal(awards.find(a=>a.awardType==='MVP')?.playerKey,'a');assert.equal(awards.find(a=>a.awardType==='ROOKIE')?.playerKey,'a');
 assert.equal(awards.find(a=>a.awardType==='POSITION_SS')?.playerKey,'a');assert.equal(awards.some(a=>a.awardType==='POSITION_CF'),false);
 assert.equal(awards.find(a=>a.awardType==='AVG')?.playerKey,'a');assert.equal(calculateProSeasonAwards(records,l,'2027','MLB').length,0);
 assert.equal(calculateProSeasonAwards(records,l,'2027','KBO').some(a=>a.awardType==='ROOKIE'),false);
 const short=syntheticSeason(49);assert.equal(calculateProSeasonAwards(short.records,short.l,'2027','KBO').some(a=>['MVP','POSITION_SS'].includes(a.awardType)),false);
 for(const row of Object.values(records.games))row.batting.a!.H=2;
 assert.equal(calculateProSeasonAwards(records,l,'2027','KBO').find(a=>a.awardType==='MVP')?.playerKey,'a');
 assert.deepEqual(positiveCumulativeAwardLeaders({b:3,a:3,c:0}),['a','b']);assert.deepEqual(positiveCumulativeAwardLeaders({a:0}),[]);
});

test('E25 freezes midpoint top ceil(eligible*.25), E29 comes from actual annual result and repeats neither receipt nor award type',()=>{
 const {records,l}=syntheticSeason(100),c=career(records,l);c.protagonistKey='a';c.proAwards!.playerKey='a';
 const fixtures=Object.values(records.games).map((r,i)=>({simulationKey:r.gameKey,leagueKey:'KBO',seasonKey:'2027',round:i,worldDay:i,awayTeamKey:'away',homeTeamKey:'home'}));
 c.competitionSchedule={receiptKey:'schedule',seasonKey:'2027',openingRosterReceiptKey:'opening',sourceRevision:0,confirmedRevision:1,leagues:{KBO:fixtures,FUTURES:[]}};
 const first=refreshProCareerAwards(c,49,{a:'2027'}),view=proCareerAwardsView(first);
 assert.equal(view.annual.length,0);assert.equal(view.allStars[0]!.selected.filter(r=>r.position==='SS').length,2);assert.equal(view.allStars[0]!.selected[0]!.playerKey,'a');assert.equal(view.notices.filter(e=>e.definitionId==='E25').length,1);
 const finished=refreshProCareerAwards(first,99,{a:'2027'}),awards=proCareerAwardsView(finished);
 assert.equal(awards.annual.length,1);assert.ok(awards.notices.some(e=>e.definitionId==='E29'));
 assert.equal(refreshProCareerAwards(finished,99,{a:'2027'}),finished);
 const missing=structuredClone(c);delete missing.records.games.g49;delete missing.proAwards!.games.g49;assert.equal(proCareerAwardsView(refreshProCareerAwards(missing,99)).annual.length,0);
});

test('pitcher titles use recorded starts/relief, positive saves, full team inning qualification and exact rate ties',()=>{
 const {records,l}=syntheticSeason(50);
 for(const row of Object.values(records.games))for(const key of ['starter','reliever','closer']){
  row.pitching[key]={BF:4,outs:3,H:0,HR:0,BB:0,HBP:0,K:1,R:0,ER:0,pitches:12,games:1,starts:key==='starter'?1:0,starterOuts:key==='starter'?3:0,loadedBF:0,W:0,L:0,SV:key==='closer'?1:0,HLD:0,BS:0,shutouts:0};
  const ps={BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0};row.pitcherSplits[key]={L:{...ps},R:{...ps}};
  l.games[row.gameKey]!.appearances[key]={teamKey:'away',position:key==='starter'?'SP':key==='closer'?'CP':'RP',defenseUnits:0};
 }
 const awards=calculateProSeasonAwards(records,l,'2027','KBO');
 assert.equal(awards.find(a=>a.awardType==='SP')?.playerKey,'starter');assert.equal(awards.find(a=>a.awardType==='RP')?.playerKey,'closer');assert.equal(awards.find(a=>a.awardType==='CP')?.playerKey,'closer');
 assert.equal(awards.filter(a=>a.awardType==='ERA').length,3);
 records.games.g0!.pitching.reliever!.outs=2;
 assert.equal(calculateProSeasonAwards(records,l,'2027','KBO').some(a=>a.awardType==='ERA'&&a.playerKey==='reliever'),false);
 for(const r of Object.values(records.games))r.pitching.closer!.SV=0;
 assert.equal(calculateProSeasonAwards(records,l,'2027','KBO').some(a=>a.awardType==='CP'),false);
});


test('position awards count defensive appearances separately from a majority of DH games',()=>{
 const {records,l}=syntheticSeason(110);
 for(let i=0;i<110;i++)l.games[`g${i}`]!.appearances.a={teamKey:'away',position:i<60?'DH':'CF',defenseUnits:i<60?0:500_000};
 const before=canonicalJson(l),awards=calculateProSeasonAwards(records,l,'2027','KBO');
 assert.equal(awards.find(a=>a.awardType==='POSITION_CF')?.playerKey,'a');
 assert.equal(canonicalJson(l),before);
 for(let i=0;i<110;i++)l.games[`g${i}`]!.appearances.a!.position='DH';
 assert.equal(calculateProSeasonAwards(records,l,'2027','KBO').some(a=>a.awardType.startsWith('POSITION_')&&a.playerKey==='a'),false);
});

import {createHash} from 'node:crypto';
import {prepareUsRosters} from '../src/us-roster-repair.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createMlbPostseason,nextMlbPostseasonGame,recordMlbPostseasonGame} from '../src/us-postseason.js';
import {startUsPostseason,advanceUsPostseason,usPostseasonView} from '../src/us-postseason-progress.js';
import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import {canonicalJson} from '../src/game.js';
import {auditUsClosedDays,settleUsSeasonGrowth} from '../src/us-growth.js';
import {usCompetitionGameWorld,usGameContext} from '../src/us-season.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame} from '../src/high-school-game.js';
import type {ScheduledGame} from '../src/schedule.js';
const seeds={AL:Array.from({length:6},(_,i)=>'A'+(i+1)),NL:Array.from({length:6},(_,i)=>'N'+(i+1))},priority=[...seeds.AL,...seeds.NL];

test('MLB fixed 12-team bracket gives two byes per league, preserves WC upsets and plays all four rounds',()=>{
 let s=createMlbPostseason('2030',seeds,priority);const before=canonicalJson(s);assert.equal(nextMlbPostseasonGame(s)!.homeTeamKey,'A3');assert.equal(canonicalJson(s),before);
 while(s.series.at(-1)!.round==='WILD_CARD'){const g=nextMlbPostseasonGame(s)!,series=s.series.find(x=>x.id===g.seriesId)!;s=recordMlbPostseasonGame(s,series.lowerSeed);}
 assert.deepEqual(s.series.filter(x=>x.round==='DIVISION_SERIES').map(x=>[x.higherSeed,x.lowerSeed]),[['A1','A5'],['A2','A6'],['N1','N5'],['N2','N6']]);
 while(nextMlbPostseasonGame(s)){const g=nextMlbPostseasonGame(s)!,series=s.series.find(x=>x.id===g.seriesId)!;s=recordMlbPostseasonGame(s,series.higherSeed);}
 assert.equal(s.championKey,'A1');assert.equal(s.results.length,32);assert.equal(s.series.length,11);assert.equal(s.series.at(-1)!.lowerSeed,'N1');assert.throws(()=>recordMlbPostseasonGame(s,'A1'),/COMPLETE/);
});
test('MLB all decisive games reach exactly53; JSON replays and edited wins, winners or seeds reject',()=>{
 let s=createMlbPostseason('2030',seeds,priority);
 while(nextMlbPostseasonGame(s)){const g=nextMlbPostseasonGame(s)!,series=s.series.find(x=>x.id===g.seriesId)!;s=recordMlbPostseasonGame(JSON.parse(JSON.stringify(s)),series.higherWins<=series.lowerWins?series.higherSeed:series.lowerSeed);}
 assert.equal(s.results.length,53);const bad=structuredClone(s);bad.series[0]!.higherWins++;assert.throws(()=>nextMlbPostseasonGame(bad),/CHANGED/);
 const fresh=createMlbPostseason('2030',seeds,priority);assert.throws(()=>recordMlbPostseasonGame(fresh,'alien'),/WINNER/);assert.throws(()=>createMlbPostseason('2030',{...seeds,NL:seeds.AL},priority),/SEEDS/);
 const wc=s.series[0]!;assert.ok(wc.games.every(g=>g.homeTeamKey===wc.higherSeed));
 const ds=s.series.find(x=>x.round==='DIVISION_SERIES')!;assert.deepEqual(ds.games.map(g=>g.homeTeamKey===ds.higherSeed),[true,true,false,false,true]);
 const cs=s.series.find(x=>x.round==='CHAMPIONSHIP_SERIES')!;assert.deepEqual(cs.games.map(g=>g.homeTeamKey===cs.higherSeed),[true,true,false,false,false,true,true]);
});
test('US native postseason follows controlled completed regular records, resumes a real partial PA and closes one champion without extra salary',()=>{
 const source=reviewedUsCareerFixture(),ids=source.world.organizations.map(o=>o.id),conferences={AL:ids.slice(0,15),NL:ids.slice(15)},raw=canonicalJson(source),opened=startUsPostseason(source,source.revision,conferences);
 assert.equal(canonicalJson(source),raw);assert.equal(opened.phaseContext.phase,'POSTSEASON_PROGRESS');if(opened.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');
 const bad=structuredClone(opened);if(bad.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');bad.phaseContext.bracket.series[0]!.higherWins=1;assert.throws(()=>advanceUsPostseason(bad,bad.revision),/CHANGED/);
 const partial=structuredClone(opened);if(partial.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');prepareUsRosters(partial,partial.phaseContext.nextWorldDay);const game=nextMlbPostseasonGame(partial.phaseContext.bracket)!,scheduled:ScheduledGame={simulationKey:JSON.stringify([partial.world.seasonKey,'MLB','POSTSEASON',game.seriesId,game.gameNumber]),leagueKey:'MLB',seasonKey:partial.world.seasonKey,phase:'POSTSEASON',round:0,worldDay:partial.phaseContext.nextWorldDay,homeTeamKey:game.homeTeamKey,awayTeamKey:game.awayTeamKey},world=usCompetitionGameWorld(partial,'MLB',scheduled);
 // One real PA creates the pending save; no clock/score/completion shortcut.
 partial.phaseContext.pendingGame={level:'MLB',job:advanceHighSchoolGame(prepareSchoolCompetitionGame(world,partial.records,scheduled,usGameContext(partial,world)),1,20)};
 const first=advanceUsPostseason(opened,opened.revision),resumed=advanceUsPostseason(JSON.parse(JSON.stringify(partial)),partial.revision);assert.equal(createHash('sha256').update(canonicalJson(resumed)).digest('hex'),createHash('sha256').update(canonicalJson(first)).digest('hex'));
 let c=first.career;for(let i=0;i<120&&c.phaseContext.phase==='POSTSEASON_PROGRESS';i++){const r=advanceUsPostseason(c,c.revision);assert.notEqual(r.stopReason,'ENGINE_LIMIT');assert.notEqual(r.stopReason,'ROSTER_DECISION_REQUIRED');c=r.career;}
 assert.equal(c.phaseContext.phase,'SEASON_REVIEW');assert.ok(c.postseason!.bracket.championKey);const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.scope.phase==='POSTSEASON'&&g.scope.leagueKey==='MLB');assert.ok(games.length>=32&&games.length<=53);assert.equal(games.length,c.postseason!.bracket.results.length);assert.ok(games.every(g=>Object.values(g.teams).filter(t=>t.W===1).length===1));
 console.log('M2-DJ native postseason proof:',JSON.stringify({regularFixture:'controlled8790',nativePostseasonGames:games.length,champion:c.postseason!.bracket.championKey,firstDay:Math.min(...games.map(g=>g.worldDay)),lastDay:Math.max(...games.map(g=>g.worldDay)),paidUsd:c.season!.paidUsd}));
 const view=usPostseasonView(c);assert.equal(view.status,'COMPLETE');assert.equal(view.champion!.id,c.postseason!.bracket.championKey);assert.ok(!JSON.stringify(view).includes('potential'));assert.ok(!JSON.stringify(view).includes('rng'));
 assert.deepEqual(c.income,source.income);assert.equal(c.season!.paidUsd,30000);assert.deepEqual(c.season!.days,source.season!.days);assert.equal(c.world.players[c.protagonistKey]!.age,source.world.players[source.protagonistKey]!.age);auditUsClosedDays(c);
 const changed=structuredClone(c);changed.records.games[games[0]!.gameKey]!.teams[Object.keys(games[0]!.teams)[0]!]!.R++;assert.throws(()=>settleUsSeasonGrowth(changed,changed.revision,true),/EVIDENCE/);
 const settled=settleUsSeasonGrowth(c,c.revision,true);assert.equal(settled.seasonGrowth.finalized,true);assert.equal(Object.values(settled.records.games).filter(g=>g.scope.phase==='POSTSEASON'&&g.scope.seasonKey===c.world.seasonKey).length,games.length);assert.throws(()=>startUsPostseason(c,c.revision,conferences),/NOT_READY/);
 assert.throws(()=>startUsPostseason(source,source.revision,{AL:ids.slice(0,15),NL:ids.slice(0,15)}),/CONFERENCES/);
});

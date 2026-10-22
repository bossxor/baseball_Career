import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {enlistInSangmu} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {kboMilitaryGrowthPeriods,kboMilitaryRegisteredGames} from '../src/kbo-military-growth.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {kboTeamGames} from '../src/kbo-windows.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';
import {canonicalJson} from '../src/game.js';

/** Controlled registrations/day receipts isolate growth; this does not simulate18 months of matches. */
function review(second:boolean):KboCareer {
 const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),c=startKboRegularSeason(s,s.revision);
 const season=c.world.seasonKey,selection=String(Number(season)-(second?2:1)),program=enlistInSangmu({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:selection,contract:c.world.contracts[c.protagonistKey]!,remainingPaidGameDays:144});
 c.military={status:second?'COMPLETED':'SERVING_SPORTS',applications:[],program,completionDays:kboMilitaryCompletionDays(program),growthPolicyVersion:1};
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled',result:{injured:[],recovered:[]}}))};
 c.phaseContext={phase:'SEASON_REVIEW'};return c;
}
function add(c:KboCareer,day:number,PA:number,team='SANGMU',key='game-'+day){
 const league=team==='SANGMU'?'FUTURES':c.registration.competitionKey!;
 const line={PA,AB:PA,BB:0,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};
 const game={gameKey:key,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[team]:{games:1,W:1,L:0,T:0,R:0,RA:0},other:{games:1,W:0,L:1,T:0,R:0,RA:0}},batting:PA?{[c.protagonistKey]:line}:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;
 c.records.games[key]=game;
 if(team!=='SANGMU')c.health.games=[...c.health.games,{evidence:{gameKey:key,teamKey:league+':'+team,seasonKey:c.world.seasonKey,day,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];
}
test('military growth: full SPORTS season has one PRO/Futures period, actual military PA and one annual budget',()=>{
 const c=review(false),days=c.world.calendar.growthDays.filter(d=>d>=c.days!.days[0]!.day).slice(0,20);for(const day of days)add(c,day,4);
 const before=canonicalJson(c),periods=kboMilitaryGrowthPeriods(c)!;assert.equal(periods.length,1);assert.equal(periods[0]!.period.appearances,80);
 const out=settleKboSeasonGrowth(c,c.revision);assert.equal(out.budgetUnits,naturalGrowthBudgetUnits(c.seasonGrowth.seasonStart,c.world.calendar.growthDays.length,periods.map(p=>p.period)));assert.equal(out.career.seasonGrowth.entries.length,1);assert.equal(canonicalJson(c),before);
 const again=settleKboSeasonGrowth(JSON.parse(JSON.stringify(out.career)) as KboCareer,out.career.revision);assert.equal(again.duplicate,true);assert.equal(again.budgetUnits,0);
});
test('military growth: June30 splits service/return periods, preserves one annual cap and actual original-club registrations',()=>{
 const c=review(true),cut=c.military!.completionDays![1]!.worldDay,first=c.days!.days[0]!.day;
 for(const day of c.world.calendar.growthDays.filter(d=>d>=first && d<=cut).slice(0,12))add(c,day,4);
 for(const day of c.world.calendar.growthDays.filter(d=>d>cut).slice(0,8))add(c,day,3,c.protagonistClubId);
 const periods=kboMilitaryGrowthPeriods(c)!,W=c.world.calendar.growthDays.length;
 assert.equal(periods.length,2);assert.equal(periods[0]!.period.appearances,48);assert.equal(periods[1]!.period.appearances,24);assert.equal(periods[0]!.period.endDay,periods[1]!.period.startDay);assert.equal(periods[1]!.period.endDay,W);
 const out=settleKboSeasonGrowth(c,c.revision);assert.equal(out.budgetUnits,naturalGrowthBudgetUnits(c.seasonGrowth.seasonStart,W,periods.map(p=>p.period)));assert.equal(out.career.seasonGrowth.entries.length,2);assert.equal(kboTeamGames(c),20);
});
test('military growth: plan boundary uses military games, not the original club calendar; focus/history stay intact',()=>{
 const c=review(false),days=c.world.calendar.growthDays.filter(d=>d>=c.days!.days[0]!.day).slice(0,4);for(const d of days)add(c,d,4);
 const player=c.world.players[c.protagonistKey]!,focus=[...Object.keys(player.abilities)].slice(2,6);
 c.planHistory=[c.planHistory[0]!,{completedTeamGames:2,focus,archetype:player.archetype}];player.focus=focus;
 const out=settleKboSeasonGrowth(c,c.revision);assert.equal(out.career.seasonGrowth.entries.length,2);assert.equal(out.career.seasonGrowth.entries[0]!.period.appearances,8);assert.deepEqual(out.career.seasonGrowth.entries[1]!.focus,focus);assert.deepEqual(out.career.world.players[c.protagonistKey]!.focus,focus);assert.equal(kboTeamGames(c),4);
});
test('military growth rejects foreign/unregistered PA, reused days and changed calendar without mutation',()=>{
 const c=review(true),cut=c.military!.completionDays![1]!.worldDay,after=c.world.calendar.growthDays.find(d=>d>cut)!;
 add(c,after,4,c.protagonistClubId);c.health.games=[];const before=canonicalJson(c);assert.throws(()=>settleKboSeasonGrowth(c,c.revision),/INVALID_MILITARY_GROWTH_REGISTRATION/);assert.equal(canonicalJson(c),before);
 const duplicate=review(false),day=duplicate.days!.days[0]!.day;add(duplicate,day,2);add(duplicate,day,2,'SANGMU','dup');assert.throws(()=>kboMilitaryRegisteredGames(duplicate),/DOUBLE_BOOKED_GROWTH_DAY/);
 const changed=review(false);changed.military!.completionDays=[{seasonKey:changed.world.seasonKey,worldDay:1}];assert.throws(()=>settleKboSeasonGrowth(changed,changed.revision),/INVALID_MILITARY_GROWTH_CALENDAR/);
});
test('legacy military saves retain their existing unsplit periods and do not opt in during reads',()=>{
 const c=review(true);delete c.military!.growthPolicyVersion;const before=canonicalJson(c);
 assert.equal(kboMilitaryGrowthPeriods(c),null);const out=settleKboSeasonGrowth(c,c.revision);assert.equal(out.career.seasonGrowth.entries.length,1);assert.equal(canonicalJson(c),before);assert.equal(out.career.military!.growthPolicyVersion,undefined);
});

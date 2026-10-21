import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';

/** Controlled season-review fixture: closed day receipts for every scheduled date and my official PA on chosen days.
 * Playing two 720-game leagues end to end is out of scope for a unit test; day closing itself is covered by kbo-day/kbo-progress. */
function reviewed(paByDay:Readonly<Record<number,number>>,extra?:(c:KboCareer)=>void):KboCareer {
 const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),c=structuredClone(startKboRegularSeason(s,s.revision));
 const all=[...c.competitionSchedule!.leagues.KBO,...c.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 c.days={...c.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'test',result:{injured:[],recovered:[]}}))};
 for(const [day,PA] of Object.entries(paByDay)){const gameKey=`seed-${day}`;c.records.games[gameKey]={gameKey,worldDay:Number(day),scope:{seasonKey:c.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'},teams:{a:{games:1,W:1,L:0,T:0,R:0,RA:0},b:{games:1,W:0,L:1,T:0,R:0,RA:0}},
  batting:{[c.protagonistKey]:{PA,AB:PA,BB:0,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;}
 c.phaseContext={phase:'SEASON_REVIEW'};extra?.(c);return c;
}
const firstDay=(c:KboCareer)=>c.days!.days[0]!.day;

test('pro growth pays one PRO period over the growth calendar from official appearances, once',()=>{
 const probe=reviewed({}),d=firstDay(probe),c=reviewed({[d]:4,[d+1]:5,[d+3]:4}),before=canonicalJson(c);
 const r=settleKboSeasonGrowth(c,c.revision),W=c.world.calendar.growthDays.length;
 const expected=naturalGrowthBudgetUnits(c.seasonGrowth.seasonStart,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:13,pitcherRole:'SP',rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty:c.difficulty,beneficiary:true}}]);
 assert.equal(r.duplicate,false);assert.equal(r.budgetUnits,expected);assert.ok(r.budgetUnits>0);
 assert.equal(r.career.seasonGrowth.entries.length,c.seasonGrowth.entries.length+1);assert.equal(r.career.revision,c.revision+1);
 assert.equal(canonicalJson(c),before);
 const again=settleKboSeasonGrowth(r.career,r.career.revision);assert.equal(again.duplicate,true);assert.equal(again.budgetUnits,0);
});

test('growth rejects wrong phase, missing day receipts, double-booked days and rehabilitation appearances',()=>{
 const ok=reviewed({});
 assert.throws(()=>settleKboSeasonGrowth({...ok,phaseContext:{phase:'PRESEASON_SETUP'}} as KboCareer,ok.revision),/INVALID_CAREER_PHASE/);
 assert.throws(()=>settleKboSeasonGrowth({...ok,days:{...ok.days!,days:ok.days!.days.slice(1)}},ok.revision),/INCOMPLETE_GROWTH_DAYS/);
 const d=firstDay(ok);
 const doubled=reviewed({[d]:4},c=>{const g=structuredClone(c.records.games[`seed-${d}`]!);g.gameKey='seed-dup';g.scope={...g.scope,leagueKey:'FUTURES'};c.records.games['seed-dup']=g;});
 assert.throws(()=>settleKboSeasonGrowth(doubled,doubled.revision),/DOUBLE_BOOKED_GROWTH_DAY/);
 const rehab=reviewed({[d+2]:4},c=>{c.days!.days=c.days!.days.map(x=>x.day===d?{...x,result:{injured:[c.protagonistKey],recovered:[]}}:x);});
 assert.throws(()=>settleKboSeasonGrowth(rehab,rehab.revision),/INVALID_GROWTH_APPEARANCES/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import {protagonistLeague,kboTeamGames,raiseKboWindowEvent,resolveKboWindowEvent,changeKboMidseasonArchetype,trainKboCareer} from '../src/kbo-windows.js';
import {settleKboSeasonGrowth} from '../src/kbo-season-growth.js';
import {naturalGrowthBudgetUnits} from '../src/development.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';
import {canonicalJson} from '../src/game.js';

const started=()=>{const e=enteredKboCareer('HITTER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);};
/** Controlled official games of my club in my league on its real scheduled days (not a full-season simulation). */
function withTeamGames(source:KboCareer,n:number,pa=0):KboCareer {
 const c=structuredClone(source),league=protagonistLeague(c),club=c.protagonistClubId;
 const days=c.competitionSchedule!.leagues[league].filter(g=>g.awayTeamKey===club || g.homeTeamKey===club).map(g=>g.worldDay).sort((a,b)=>a-b);
 for(let i=0;i<n;i++){const gameKey=`win-${i}`;c.records.games[gameKey]={gameKey,worldDay:days[i]!,scope:{seasonKey:c.world.seasonKey,leagueKey:league,phase:'REGULAR'},teams:{[club]:{games:1,W:1,L:0,T:0,R:0,RA:0},opp:{games:1,W:0,L:1,T:0,R:0,RA:0}},
  batting:pa?{[c.protagonistKey]:{PA:pa,AB:pa,BB:0,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}}:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;}
 return c;
}
const progress=(c:KboCareer)=>c.phaseContext as KboSeasonProgress;

test('E43 opens at 48 team games and E41 at 72, once per season and only while healthy',()=>{
 const s=started();
 assert.equal(raiseKboWindowEvent(withTeamGames(s,47),100,progress(s)),null);
 const at48=raiseKboWindowEvent(withTeamGames(s,48),100,progress(s))!;
 assert.equal(at48.events.at(-1)!.definitionId,'E43');assert.equal(at48.phaseContext.phase,'EVENT_DECISION');assert.equal(kboTeamGames(withTeamGames(s,48)),48);
 const used=withTeamGames(s,72);used.development={...used.development,trainingUsedSeasons:[...used.development.trainingUsedSeasons,used.world.seasonKey]};
 assert.equal(raiseKboWindowEvent(used,100,progress(s))!.events.at(-1)!.definitionId,'E41');
 const injured=withTeamGames(s,72);injured.health={...injured.health,injuries:{...injured.health.injuries,[s.protagonistKey]:{severity:'MILD',remainingTeamGames:2,diagnosedGameKey:'x',seasonKey:s.world.seasonKey}}};
 assert.equal(raiseKboWindowEvent(injured,100,progress(s)),null);
});

test('window choices resolve once and return to progress; FORFEIT spends the season chance',()=>{
 const raised=raiseKboWindowEvent(withTeamGames(started(),48),100,progress(started()))!,event=raised.events.at(-1)!;
 const deferred=resolveKboWindowEvent(raised,raised.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'DEFER_TRAINING'});
 assert.equal(deferred.career.phaseContext.phase,'SEASON_PROGRESS');assert.equal(deferred.career.revision,raised.revision+1);
 assert.equal(deferred.career.development.trainingUsedSeasons.includes(raised.world.seasonKey),false);
 assert.throws(()=>resolveKboWindowEvent(deferred.career,deferred.career.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'DEFER_TRAINING'}));
 const forfeited=resolveKboWindowEvent(raised,raised.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'FORFEIT_TRAINING'});
 assert.ok(forfeited.career.development.trainingUsedSeasons.includes(raised.world.seasonKey));
 const open=resolveKboWindowEvent(raised,raised.revision,{eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAINING'});assert.equal(open.navigation!.targetScreen,'S23');
});

test('training uses the 48-game window once per season',()=>{
 const early=withTeamGames(started(),47);assert.throws(()=>trainKboCareer(early,early.revision,{type:'ABILITY',ability:'CONTACT'} as never));
 const ready=withTeamGames(started(),48),trained=trainKboCareer(ready,ready.revision,{type:'SKIP'});
 assert.ok(trained.development.trainingUsedSeasons.includes(ready.world.seasonKey));
 assert.throws(()=>trainKboCareer(trained,trained.revision,{type:'SKIP'}));
});

test('MID style change needs 72 healthy team games, keeps abilities, records the plan and splits season growth',()=>{
 const early=withTeamGames(started(),71);assert.throws(()=>changeKboMidseasonArchetype(early,early.revision,'SLUGGER'),/STYLE_WINDOW_CLOSED/);
 const ready=withTeamGames(started(),72,4),player=ready.world.players[ready.protagonistKey]!;
 const target=player.archetype==='SLUGGER'?'CONTACT':'SLUGGER',changed=changeKboMidseasonArchetype(ready,ready.revision,target);
 assert.equal(changed.world.players[ready.protagonistKey]!.archetype,target);
 assert.equal(canonicalJson(changed.world.players[ready.protagonistKey]!.abilities),canonicalJson(player.abilities));
 assert.deepEqual(changed.planHistory.map(p=>[p.completedTeamGames,p.archetype]),[[0,ready.planHistory[0]!.archetype],[72,target]]);
 assert.throws(()=>changeKboMidseasonArchetype(changed,changed.revision,player.archetype),/STYLE_WINDOW_USED/);
 // Growth: two periods split at the growth day after my 72nd team game.
 const review=structuredClone(changed),all=[...review.competitionSchedule!.leagues.KBO,...review.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 review.days={...review.days!,days:Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'test',result:{injured:[],recovered:[]}}))};review.phaseContext={phase:'SEASON_REVIEW'};
 const r=settleKboSeasonGrowth(review,review.revision),W=review.world.calendar.growthDays.length;
 assert.equal(r.career.seasonGrowth.entries.length-review.seasonGrowth.entries.length,2);
 const entries=r.career.seasonGrowth.entries.slice(-2);assert.equal(entries[0]!.period.startDay,0);assert.equal(entries[0]!.period.endDay,entries[1]!.period.startDay);assert.equal(entries[1]!.period.endDay,W);
 assert.equal(entries[0]!.period.appearances+entries[1]!.period.appearances,72*4);
 assert.equal(r.budgetUnits,naturalGrowthBudgetUnits(review.seasonGrowth.seasonStart,W,entries.map(e=>e.period)));
});

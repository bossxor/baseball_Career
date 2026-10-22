import test from 'node:test';
import assert from 'node:assert/strict';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {enteredKboCareer} from './fixtures.js';
import {enlistInActiveService,completeKboMilitaryBlock} from '../src/kbo-military-program.js';
import {kboMilitaryCompletionDays} from '../src/kbo-military-events.js';
import {kboReturnConditionView,kboReturnConditionMultiplier,settleKboReturnConditionDay} from '../src/kbo-return-condition.js';
import {createKboCompetitionGameWorld} from '../src/kbo-game-world.js';
import {kboGameContext} from '../src/kbo-progress.js';
import {createKboSeasonSchedules} from '../src/kbo-schedule.js';
import {prepareSchoolCompetitionGame,advanceHighSchoolGame} from '../src/high-school-game.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {canonicalJson} from '../src/game.js';
/** Controlled completion/registration evidence. Actual six-game career integration is in kbo-active-service.test.ts. */
function returned():KboCareer {
 const c=enteredKboCareer(),year=Number(c.world.seasonKey),contract={...c.world.contracts[c.protagonistKey]!,contractKey:'prior-service-contract',seasonKey:String(year-1)},p=enlistInActiveService({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:String(year-2),contract,remainingPaidGameDays:144}),days=kboMilitaryCompletionDays(p),program=completeKboMilitaryBlock(completeKboMilitaryBlock(p,days[0]!.seasonKey,days[0]!.worldDay),days[1]!.seasonKey,days[1]!.worldDay);
 c.schemaVersion=3;c.military={status:'COMPLETED',applications:[],program,completedSeasonKey:c.world.seasonKey,completionDays:days,returnCondition:{programId:program.programId,returnSeasonKey:days[1]!.seasonKey,returnWorldDay:days[1]!.worldDay,gameKeys:[]}};c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,days:[]};return c;
}
function closedDay(c:KboCareer,day:number){c.days!.days=[...c.days!.days,{day,evidence:'controlled-clock',result:{injured:[],recovered:[]}}];}
function registered(c:KboCareer,day:number,key:string,league='FUTURES'){
 const club=c.protagonistClubId,season=c.world.seasonKey,g={gameKey:key,worldDay:day,scope:{seasonKey:season,leagueKey:league,phase:'REGULAR'},teams:{[club]:{games:1,W:1,L:0,T:0,R:0,RA:0},other:{games:1,W:0,L:1,T:0,R:0,RA:0}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}} as GameContribution;
 c.records.games[key]=g;c.health.games=[...c.health.games,{evidence:{gameKey:key,teamKey:league+':'+club,seasonKey:season,day,roster:[c.protagonistKey],appearances:[]},result:{injured:[],recovered:[]}}];closedDay(c,day);
}
test('return condition consumes exactly six registered team games, including bench, across years; breaks/INT and replay never consume',()=>{
 const c=returned(),key=c.protagonistKey,raw=structuredClone(c.world.players[key]!.abilities),day=c.military!.returnCondition!.returnWorldDay;
 assert.equal(kboReturnConditionMultiplier(c),.95);registered(c,day+1,'bench-1');settleKboReturnConditionDay(c,day+1);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,5);
 const before=canonicalJson(c);settleKboReturnConditionDay(c,day+1);assert.equal(canonicalJson(c),before);
 registered(c,day+2,'international','INT');settleKboReturnConditionDay(c,day+2);closedDay(c,day+3);settleKboReturnConditionDay(c,day+3);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,5);
 for(let i=2;i<=5;i++){registered(c,day+i+3,'bench-'+i);settleKboReturnConditionDay(c,day+i+3);}
 assert.equal(kboReturnConditionView(c)!.remainingTeamGames,1);
 c.world.seasonKey=String(Number(c.world.seasonKey)+1);c.world.calendar=createSeasonCalendar(Number(c.world.seasonKey));c.days={...c.days!,seasonKey:c.world.seasonKey,days:[]};registered(c,1,'next-year-bench-6');settleKboReturnConditionDay(c,1);
 assert.equal(kboReturnConditionMultiplier(c),1);assert.equal(kboReturnConditionView(c)!.remainingTeamGames,0);assert.deepEqual(c.world.players[key]!.abilities,raw);assert.equal(c.military!.returnCondition!.gameKeys.length,6);
});
test('return condition freezes .95 into game snapshots and JSON chunks, leaves permanent abilities intact, and defaults legacy saves to1',()=>{
 const c=returned(),key=c.protagonistKey,before=canonicalJson(c),context=kboGameContext(c,'FUTURES'),world=createKboCompetitionGameWorld(c.world,'FUTURES',key),schedule=createKboSeasonSchedules(c.world.clubs.map(t=>t.id),c.world.seasonKey,c.world.calendar).FUTURES.find(g=>g.worldDay>c.military!.returnCondition!.returnWorldDay&&(g.homeTeamKey===c.protagonistClubId||g.awayTeamKey===c.protagonistClubId))!;
 const job=prepareSchoolCompetitionGame(world,c.records,schedule,context),player=job.game.input.teams.flatMap(t=>[...t.lineup,...t.pitchers]).find(p=>p.simulationKey===key)!;assert.ok(player);assert.equal(player.morale,.95);assert.deepEqual(player.abilities,c.world.players[key]!.abilities);assert.equal(canonicalJson(c),before);
 assert.deepEqual(advanceHighSchoolGame(JSON.parse(JSON.stringify(job)),50,1),advanceHighSchoolGame(job,50,1));assert.throws(()=>prepareSchoolCompetitionGame(world,c.records,schedule,{...context,conditionMultipliers:{[key]:NaN}}),/INVALID_GAME_CONTEXT/);
 const legacy=structuredClone(c);delete legacy.military!.returnCondition;assert.equal(kboReturnConditionMultiplier(legacy),1);assert.equal(kboReturnConditionView(legacy),null);assert.equal(kboGameContext(legacy,'FUTURES').conditionMultipliers,undefined);
});
test('return counter rejects unsettled, altered, duplicate and missing official registration evidence without repairing it silently',()=>{
 const c=returned(),day=c.military!.returnCondition!.returnWorldDay+1;registered(c,day,'registered');const before=canonicalJson(c);
 assert.throws(()=>kboReturnConditionMultiplier(c),/DAY_NOT_SETTLED/);assert.throws(()=>settleKboReturnConditionDay(c,day-1),/DAY_NOT_CLOSED/);assert.equal(canonicalJson(c),before);
 settleKboReturnConditionDay(c,day);
 const forged=structuredClone(c);forged.military!.returnCondition!.gameKeys=['forged'];assert.throws(()=>kboReturnConditionView(forged),/CHANGED_RETURN_CONDITION_EVIDENCE/);
 const duplicate=structuredClone(c);duplicate.health.games=[...duplicate.health.games,structuredClone(duplicate.health.games.at(-1)!)];assert.throws(()=>kboReturnConditionView(duplicate),/DOUBLE_BOOKED/);
 const missing=structuredClone(c);delete missing.records.games.registered;assert.throws(()=>kboReturnConditionView(missing),/INVALID_RETURN_CONDITION_REGISTRATION/);
});

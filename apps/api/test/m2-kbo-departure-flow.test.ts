import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '@playball/engine';
import {UNITS_PER_POINT} from '@playball/rules';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {kboDepartureFlow,kboDepartureOptions} from '../src/career-kbo-departure-shell.js';
import type {SaveState} from '../src/engine-command.js';

const body=(name:string,payload:unknown)=>({commandId:'controlled-departure',expectedRevision:0,type:'CAREER_KBO_DEPARTURE_'+name,payload});

function completedReview():engine.KboCareer{
 const c=enteredKboCareer(),key=c.protagonistKey,clubId=c.protagonistClubId,ids=c.world.clubs.map(x=>x.id);
 const year=Array.from({length:32},(_,i)=>2042+i).find(y=>{
  const window=JSON.stringify(['kbo-overseas-fa',c.world.worldKey,String(y),key]);
  return engine.nextInteger(engine.createWorldStream(c.world.seed,JSON.stringify(['kbo-overseas-fa-offers',window]),'roster'),4).value>0;
 })!;
 const season=String(year);
 c.world.seasonKey=season;
 c.world.calendar=engine.createSeasonCalendar(year,'calendar-2');
 for(const contract of Object.values(c.world.contracts))contract.seasonKey=season;
 for(const book of Object.values(c.world.repertoires))book.seasonId=season;
 c.phaseContext={phase:'SEASON_REVIEW'};
 c.events=[];
 c.military={status:'COMPLETED',applications:[]};
 c.seasonClose={receiptKey:'controlled-kbo-close',seasonKey:season,sourceRevision:c.revision,agingLossUnits:0,trainingForfeited:false};
 c.days=engine.createKboDayLedger(c.world);
 c.competitionSchedule={receiptKey:'controlled-kbo-schedule',seasonKey:season,sourceRevision:c.revision,
  confirmedRevision:c.revision,openingRosterReceiptKey:'controlled-kbo-roster',leagues:engine.createKboSeasonSchedules(ids,season,c.world.calendar)};
 let postseason=engine.createKboPostseason(season,ids.slice(0,5));
 for(let game=engine.nextKboPostseasonGame(postseason);game;game=engine.nextKboPostseasonGame(postseason)){
  postseason=engine.recordKboPostseasonGame(postseason,game.homeTeamKey);
 }
 c.postseason=postseason;
 c.freeAgents=engine.nextKboFreeAgentYear({worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:season,
  difficulty:c.difficulty,registeredKeys:Object.keys(c.world.players)});
 const player=c.world.players[key]!;
 player.abilities=Object.fromEntries(Object.keys(player.abilities).map(k=>[k,80*UNITS_PER_POINT]));
 player.potential={...player.abilities};
 player.careerPeaks={...player.abilities};
 const club=c.world.clubs.find(x=>x.id===clubId)!,opponent=ids.find(id=>id!==clubId)!;
 const row={games:1,W:0,L:0,T:1,R:0,RA:0};
 for(let y=year-8;y<=year;y++){
  const yearKey=String(y);
  for(let day=1;day<=100;day++){
   const gameKey=JSON.stringify(['controlled-registration',y,day]);
   c.records.games[gameKey]={gameKey,worldDay:day,scope:{seasonKey:yearKey,leagueKey:'KBO',phase:'REGULAR'},
    teams:{[clubId]:row,[opponent]:row},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
   c.health.games=[...c.health.games,{evidence:{gameKey,teamKey:'KBO:'+clubId,seasonKey:yearKey,day,roster:[key],appearances:[]},result:{injured:[],recovered:[]}}];
  }
 }
 c.proSeasons=Array.from({length:8},(_,i)=>({seasonKey:String(year-8+i)} as engine.KboSeasonArchive));
 club.firstTeam=engine.selectKboFirstTeamRoster(club.roster.map(k=>c.world.players[k]!));
 return c;
}

test('KBO departure flow seals E62, validates revisions and declines without altering the original contract',()=>{
 const c=completedReview(),initial:SaveState={schemaVersion:1,career:c};
 const button=kboDepartureOptions(c).find(command=>command.id==='posting-invite')!;
 const opened=applyEngineCommand(initial,body('POSTING_INVITE',button.payload));
 assert.deepEqual(opened.eventIds,['E62']);
 assert.equal(c.events.length,0);
 const decline=kboDepartureFlow(opened.nextState)!.commands.find(choice=>choice.id==='posting-stay')!;
 assert.throws(()=>applyEngineCommand(opened.nextState,body('POSTING_DECLINE',{...decline.payload,worldDay:30})),/INVALID_PAYLOAD/);
 assert.throws(()=>applyEngineCommand(opened.nextState,body('POSTING_DECLINE',{...decline.payload,careerRevision:c.revision})),/CAREER_REVISION_CHANGED/);
 const declined=applyEngineCommand(opened.nextState,body('POSTING_DECLINE',decline.payload));
 const kbo=declined.nextState.career as engine.KboCareer;
 assert.deepEqual(kbo.world.contracts[c.protagonistKey],c.world.contracts[c.protagonistKey]);
 assert.equal(kbo.events.find(event=>event.definitionId==='E62')?.status,'RESOLVED');
 assert.equal(kboDepartureOptions(kbo).some(command=>command.id==='posting-invite'),false);
 assert.equal(declined.nextState.kboDeparture,undefined);
});

test('overseas FA review preserves the domestic contract when remaining and blocks bypass via the next season command',()=>{
 const c=completedReview(),initial:SaveState={schemaVersion:1,career:c};
 const button=kboDepartureOptions(c).find(command=>command.id==='overseas-open')!;
 const opened=applyEngineCommand(initial,body('OVERSEAS_OPEN',button.payload)).nextState;
 const review=kboDepartureFlow(opened)!;
 assert.ok(review.title.includes('해외 FA'));
 assert.throws(()=>applyEngineCommand(opened,{...body('unused',{careerRevision:review.careerRevision}),type:'CAREER_KBO_PLAY_NEXT_YEAR'}),/KBO_DEPARTURE_DECISION_REQUIRED/);
 assert.throws(()=>applyEngineCommand(opened,body('OVERSEAS_EXPIRE',{careerRevision:review.careerRevision})),/KBO_OVERSEAS_FA_OFFER_ACTIVE/);
 const remain=review.commands.find(choice=>choice.id==='departure-remain')!;
 const next=applyEngineCommand(opened,body('OVERSEAS_REMAIN',remain.payload)).nextState.career as engine.KboCareer;
 assert.deepEqual(next.world,c.world);
 assert.equal(next.overseasFa?.windows[0]?.status,'REJECTED');
});

test('overseas FA sign commits the US registration and both domestic roots atomically',()=>{
 const c=completedReview(),initial:SaveState={schemaVersion:1,career:c};
 const opened=applyEngineCommand(initial,body('OVERSEAS_OPEN',{careerRevision:c.revision})).nextState;
 const sign=kboDepartureFlow(opened)!.commands.find(command=>command.id.startsWith('departure-sign-'))!;
 const before=JSON.stringify(opened);
 assert.throws(()=>applyEngineCommand(opened,body('OVERSEAS_SIGN',{...sign.payload,offerKey:'foreign-offer'})),/KBO_OVERSEAS_FA_OFFER_NOT_FOUND/);
 const result=applyEngineCommand(opened,body('OVERSEAS_SIGN',sign.payload)).nextState;
 assert.equal(JSON.stringify(opened),before);
 const us=result.career as engine.UsCareer,departure=result.kboDeparture as engine.KboCareer;
 const host=result.collegeNationalHost as engine.CollegeLeagueHost;
 assert.equal(us.mode,'US_CAREER');
 assert.equal(us.kboTransfer?.source,'OVERSEAS_FA');
 assert.equal(departure.phaseContext.phase,'ARCHIVED');
 assert.equal(departure.world.players[c.protagonistKey],undefined);
 assert.deepEqual(host.game.world,departure.world);
 assert.deepEqual(host.game.records,departure.records);
 assert.deepEqual(host.departure,{kboRevision:departure.revision,usActivationReceiptKey:us.activation.receiptKey});
 assert.equal(us.inventory.clubs.find(org=>org.id===us.protagonistOrganizationId)?.availableBudgetUsd,80_000_000-us.contract.annualSalaryUsd);
 assert.equal(departure.world.clubs.find(club=>club.id===c.protagonistClubId)?.budgetWon,c.world.clubs.find(club=>club.id===c.protagonistClubId)?.budgetWon);
 assert.deepEqual(engine.usCareerView(JSON.parse(JSON.stringify(us))),engine.usCareerView(us));
});
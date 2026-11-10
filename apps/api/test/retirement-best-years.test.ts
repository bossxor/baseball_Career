import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.js';
import {bestRetirementYears,retirementSummary} from '../src/career-retirement-summary.js';

function archived() {
 const c=enteredKboCareer(),player=c.world.players[c.protagonistKey]!;
 c.phaseContext={phase:'ARCHIVED'};
 c.retirement={reason:'VOLUNTARY',seasonKey:c.world.seasonKey,age:player.age,clubId:c.protagonistClubId,receiptKey:'archive',sourceRevision:c.revision,remainingContractYears:0};
 return c;
}
function game(c:ReturnType<typeof archived>,seasonKey:string,leagueKey:string,games=1) {
 const key=`${seasonKey}-${leagueKey}`,player=c.protagonistKey;
 const split={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};
 c.records.games[key]={gameKey:key,worldDay:1,scope:{seasonKey,leagueKey,phase:'REGULAR'},teams:{},
  batting:{[player]:{PA:1,AB:1,BB:0,HBP:0,K:0,H:0,TB:0,HR:0,R:0,RBI:0,twoB:0,threeB:0,games,fieldingGames:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0}},
  pitching:{},batterSplits:{[player]:{L:{...split},R:{...split}}},pitcherSplits:{},matchups:{}};
}
function best(c:ReturnType<typeof archived>) {
 return retirementSummary({schemaVersion:1,career:c})!.summary.sections.find(s=>s.title==='가장 빛난 3년')?.lines;
}
function annual(c:ReturnType<typeof archived>,year:string,league:string,players:string[]) {
 return {receiptKey:JSON.stringify(['pro-awards',c.world.worldKey,'annual',year,league]),seasonKey:year,leagueKey:league,worldDay:1,awards:players.map((playerKey,i)=>({playerKey,awardType:(i===0?'MVP':'ROOKIE') as 'MVP'|'ROOKIE',score:1}))};
}
function allstar(c:ReturnType<typeof archived>,year:string,league:string,playerKey:string) {
 return {receiptKey:JSON.stringify(['pro-awards',c.world.worldKey,'allstar',year,league]),seasonKey:year,leagueKey:league,worldDay:1,selected:[{playerKey,position:'DH',score:1}]};
}
test('confirmed awards and all-star selections rank playing years across leagues, with newer ties and no phantom years',()=>{
 const c=archived(),key=c.protagonistKey;
 game(c,'2025','KBO');game(c,'2024','KBO');game(c,'2024','FUTURES');game(c,'2023','KBO');game(c,'2022','KBO');
 c.proAwards={schemaVersion:1,worldKey:c.world.worldKey,playerKey:key,games:{},notices:[],
  annual:[annual(c,'2024','KBO',[key]),annual(c,'2024','FUTURES',[key]),annual(c,'2025','KBO',['other']),annual(c,'2022','KBO',[key])],
  allStars:[allstar(c,'2022','KBO',key),allstar(c,'2023','KBO',key),allstar(c,'2021','KBO',key)]};
 assert.deepEqual(best(c),[
  {label:'2024 시즌',value:'개인 수상·올스타 2회'},
  {label:'2022 시즌',value:'개인 수상·올스타 2회'},
  {label:'2023 시즌',value:'개인 수상·올스타 1회'},
 ]);
});
test('a confirmed award year remains eligible without an official game row',()=>{
 const c=archived(),key=c.protagonistKey;game(c,'2025','KBO');
 c.proAwards={schemaVersion:1,worldKey:c.world.worldKey,playerKey:key,games:{},notices:[],annual:[annual(c,'2021','KBO',[key])],allStars:[]};
 assert.deepEqual(best(c),[{label:'2021 시즌',value:'개인 수상·올스타 1회'},{label:'2025 시즌',value:'개인 수상·올스타 0회'}]);
});
test('legacy years without awards fall back to most recent official appearances, omitting zero and limiting to available years',()=>{
 const c=archived();game(c,'2020','KBO');game(c,'2022','FUTURES');game(c,'2023','KBO',0);
 assert.deepEqual(best(c),[{label:'2022 시즌',value:'개인 수상·올스타 0회'},{label:'2020 시즌',value:'개인 수상·올스타 0회'}]);
});
test('the projection ignores cancelled, void, duplicate and other-player awards',()=>{
 const rows=[{seasonKey:'2022',record:{games:1}},{seasonKey:'2023',record:{games:1}}];
 const receipt={receiptKey:'a',seasonKey:'2022',awards:[{playerKey:'player'},{playerKey:'other'}]};
 const annual=[receipt,structuredClone(receipt),{receiptKey:'b',seasonKey:'2023',status:'CANCELLED',awards:[{playerKey:'player'}]}];
 const allStars=[{receiptKey:'c',seasonKey:'2023',status:'VOID',selected:[{playerKey:'player'}]}];
 assert.deepEqual(bestRetirementYears(rows,'player',annual,allStars),[
  {label:'2022 시즌',value:'개인 수상·올스타 1회'},{label:'2023 시즌',value:'개인 수상·올스타 0회'},
 ]);
});
test('the archive rejects a duplicated award ledger instead of weakening its validation',()=>{
 const c=archived(),key=c.protagonistKey;game(c,'2022','KBO');
 const receipt=annual(c,'2022','KBO',[key]);
 c.proAwards={schemaVersion:1,worldKey:c.world.worldKey,playerKey:key,games:{},notices:[],annual:[receipt,structuredClone(receipt)],allStars:[]};
 assert.throws(()=>best(c),/DUPLICATE_PRO_AWARD_RECEIPT/);
});

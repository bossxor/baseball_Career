import test from 'node:test';
import assert from 'node:assert/strict';
import {leagueStandings} from '../src/standings.js';
import {emptyRecordLedger} from '../src/records.js';
import type {RecordLedger} from '../src/records.js';
import {canonicalJson} from '../src/game.js';

const scope={seasonKey:'2030',leagueKey:'COLLEGE',phase:'REGULAR' as const};
function score(records:RecordLedger,a:string,b:string,ar:number,br:number){
 const gameKey=String(records.revision++);
 records.games[gameKey]={gameKey,worldDay:records.revision,scope,teams:{[a]:{games:1,W:Number(ar>br),L:Number(ar<br),T:Number(ar===br),R:ar,RA:br},[b]:{games:1,W:Number(br>ar),L:Number(br<ar),T:Number(ar===br),R:br,RA:ar}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
}

test('conference standings retain interleague wins while tie-breaks use only the tied conference clubs',()=>{
 const records=emptyRecordLedger();score(records,'A','X',3,0);score(records,'B','X',0,2);score(records,'B','A',1,0);
 const rows=leagueStandings(records,scope,['A','B'],'seed','world',['A','B','X']);assert.equal(rows[0]!.teamKey,'B');assert.equal(rows.find(r=>r.teamKey==='A')!.W,1);assert.equal(rows.find(r=>r.teamKey==='A')!.games,2);assert.equal(rows.find(r=>r.teamKey==='B')!.games,2);
 assert.throws(()=>leagueStandings(records,scope,['A','B'],'seed','world',['A','B','Y']),/UNREGISTERED/);
});
test('standings use exact winning percentage then tied-group head-to-head, before run difference',()=>{
 const records=emptyRecordLedger();score(records,'A','B',1,0);score(records,'A','C',0,9);score(records,'B','C',1,0);score(records,'C','D',1,0);
 const rows=leagueStandings(records,scope,['A','B','C','D'],'seed','world');assert.deepEqual(rows.map(r=>r.teamKey),['C','A','B','D']);
 assert.equal(rows[0]!.winPercentage,2/3);assert.equal(rows[1]!.winPercentage,.5);assert.equal(rows[1]!.R-rows[1]!.RA,-8);
});
test('multi-team mini-league ties use overall run difference and deterministic independent seeded lots',()=>{
 const records=emptyRecordLedger();score(records,'A','B',5,0);score(records,'B','C',2,0);score(records,'C','A',1,0);
 assert.deepEqual(leagueStandings(records,scope,['A','B','C'],'seed','world').map(r=>r.teamKey),['A','C','B']);
 const tied=emptyRecordLedger();score(tied,'A','B',0,0);score(tied,'B','C',0,0);score(tied,'C','A',0,0);const before=canonicalJson(tied);
 const first=leagueStandings(tied,scope,['A','B','C'],'seed','world');assert.ok(first.every(r=>r.winPercentage===null));
 assert.deepEqual(leagueStandings(JSON.parse(JSON.stringify(tied)),{phase:'REGULAR',leagueKey:'COLLEGE',seasonKey:'2030'},['C','A','B'],'seed','world'),first);assert.equal(canonicalJson(tied),before);
 assert.throws(()=>leagueStandings(tied,scope,['A','A'],'seed','world'),/TEAMS/);
 assert.throws(()=>leagueStandings(tied,scope,['A','B'],'seed','world'),/UNREGISTERED/);
 assert.throws(()=>leagueStandings(tied,{...scope,seasonKey:''},['A','B','C'],'seed','world'),/SCOPE/);
});

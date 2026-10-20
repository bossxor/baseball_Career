import assert from 'node:assert/strict';
import test from 'node:test';
import {createGame,runGameChunk,canonicalJson} from '../src/game.js';
import {game} from './fixtures.js';
import {buildGameContribution,identityPlayRecords,putGameContribution,emptyRecordLedger,recordTotals,splitPitchingRates,directDuelOutcome,assertContributionSplits} from '../src/records.js';
const final=(seed='record42')=>runGameChunk(createGame(game(seed))).state;
const scope={seasonKey:'2027',leagueKey:'HS',phase:'REGULAR' as const};
test('122: v2 identity snapshots self-contained from immutable game input and switch hitter opposite side',()=>{
  const source=final(),records=identityPlayRecords(source);assert.equal(records.length,source.plays.length);
  for(const record of records) {assert.equal(record.logSchemaVersion,2);assert.ok(['R','L'].includes(record.effectiveBatSide));assert.ok(record.pitcherFormAtTime);if(record.batterBatsAtTime==='S')assert.notEqual(record.effectiveBatSide,record.pitcherThrowsAtTime);}
  const broken=structuredClone(source);broken.plays[0]!.batterSide=broken.plays[0]!.batterSide==='R'?'L':'R';assert.throws(()=>identityPlayRecords(broken));
});
test('60/121: contribution splits/matchups conserve all PA,AB,H,TB,K,outs and team records',()=>{
  for(let i=0;i<25;i++) {
    const source=final('record'+i),contribution=buildGameContribution(source,scope,i);assertContributionSplits(contribution);
    assert.equal(Object.values(contribution.teams).reduce((s,t)=>s+t.games,0),2);
    for(const [id,line] of Object.entries(contribution.batting)) {const pairs=Object.values(contribution.matchups).filter(p=>p.batterKey===id);assert.equal(pairs.reduce((s,p)=>s+p.stats.PA,0),line.PA);assert.equal(line.AB,line.PA-line.BB-line.HBP);}
    for(const [id,line] of Object.entries(contribution.pitching)) {const splits=contribution.pitcherSplits[id]!;assert.equal(splits.L.outs+splits.R.outs,line.outs);assert.equal(splits.L.BF+splits.R.BF,line.BF);}
  }
});
test('60: duplicate contribution no-op and changed evidence rejects; original ledger immutable',()=>{
  const source=final(),c=buildGameContribution(source,scope,1),initial=emptyRecordLedger(),put=putGameContribution(initial,c);assert.equal(put.ledger.revision,1);assert.deepEqual(initial,emptyRecordLedger());
  assert.deepEqual(putGameContribution(put.ledger,JSON.parse(JSON.stringify(c))),{ledger:put.ledger,duplicate:true,corrected:false});
  assert.throws(()=>putGameContribution(put.ledger,buildGameContribution(final('other'),scope,1)),/GAME_EVIDENCE_REUSED/);
  const live=createGame(game());assert.throws(()=>buildGameContribution(live,scope,1),/GAME_NOT_FINAL/);
  assert.throws(()=>buildGameContribution(source,{...scope,phase:'POSTSEASON'},1));
});
test('60: official correction atomically replaces old stats, never appends twice or changes scope/score',()=>{
  const c=buildGameContribution(final(),scope,1),ledger=putGameContribution(emptyRecordLedger(),c).ledger,corrected=structuredClone(c);
  // Approved stat classification correction 1B→2B with unchanged score; keep all read models consistent.
  const play=final().plays.find(p=>p.outcome==='1B')!;
  const pair=corrected.matchups[JSON.stringify([play.batterKey,play.pitcherKey])]!;
  const id=pair.batterKey,split=corrected.batterSplits[id]![play.pitcherThrows];
  pair.stats.TB++;pair.stats.twoB++;corrected.batting[id]!.TB++;corrected.batting[id]!.twoB++;split.TB++;split.twoB++;
  // Update the pitcher's actual-side TB in the corresponding classified row.
  const ps=corrected.pitcherSplits[pair.pitcherKey]![play.batterSide];ps.TB++;
  const result=putGameContribution(ledger,corrected,true);assert.equal(result.corrected,true);assert.equal(result.ledger.revision,2);
  assert.equal(recordTotals(result.ledger,scope).batting[id]!.TB,corrected.batting[id]!.TB);
  assert.equal(Object.keys(result.ledger.games).length,1);assert.equal(canonicalJson(ledger.games[c.gameKey]),canonicalJson(c));
  assert.deepEqual(putGameContribution(result.ledger,corrected,true).ledger,result.ledger);
  assert.throws(()=>putGameContribution(ledger,{...corrected,worldDay:2},true));
});
test('121: league/phase separate, career same-league years only, zero AB rates remain null',()=>{
  const state=final(),base=buildGameContribution(state,scope,1);let ledger=putGameContribution(emptyRecordLedger(),base).ledger;
  const next=structuredClone(base);next.gameKey='year2';next.scope.seasonKey='2028';ledger=putGameContribution(ledger,next).ledger;
  const other=structuredClone(base);other.gameKey='mlb';other.scope.leagueKey='MLB';other.worldDay=2;ledger=putGameContribution(ledger,other).ledger;
  const postseason=structuredClone(base);postseason.gameKey='ps';postseason.scope.phase='POSTSEASON';postseason.worldDay=3;ledger=putGameContribution(ledger,postseason).ledger;
  const key=Object.keys(base.batting)[0]!;assert.equal(recordTotals(ledger,scope).batting[key]!.PA,base.batting[key]!.PA);
  assert.equal(recordTotals(ledger,{leagueKey:'HS',phase:'REGULAR'}).batting[key]!.PA,2*base.batting[key]!.PA);
  assert.deepEqual(splitPitchingRates({BF:1,outs:0,AB:0,H:0,TB:0,HR:0,BB:1,HBP:0,K:0}),{AVG:null,OPS:null});
});
test('107: direct duel is based on PA/H/TB and independent of team result',()=>{
  assert.equal(directDuelOutcome({PA:2,H:2,TB:8}),'NO_DECISION');assert.equal(directDuelOutcome({PA:3,H:1,TB:1}),'NO_DECISION');assert.equal(directDuelOutcome({PA:3,H:1,TB:2}),'WIN');assert.equal(directDuelOutcome({PA:3,H:0,TB:0}),'LOSS');
});

test('71 INV03: same player cannot contribute twice in one world-season day across different leagues',()=>{
 const contribution=buildGameContribution(final(),scope,1),ledger=putGameContribution(emptyRecordLedger(),contribution).ledger;
 assert.throws(()=>putGameContribution(ledger,{...contribution,gameKey:'another',scope:{...scope,leagueKey:'MLB'}}),/DOUBLE_BOOKED_PLAYER/);
 const corrupt=structuredClone(contribution);const id=Object.keys(corrupt.pitching)[0]!;corrupt.pitcherSplits[id]!.R.TB++;assert.throws(()=>assertContributionSplits(corrupt),/PITCHING_MATCHUP_MISMATCH/);
});

test('record keys remain data after JSON restore, including prototype-like logical names',()=>{
 const input=game('prototype-key');input.simulationKey='constructor';input.teams[0].lineup[0]!.simulationKey='__proto__';input.teams[0].fielders[0]!.simulationKey='__proto__';
 const c=buildGameContribution(runGameChunk(createGame(input)).state,scope,1),source=JSON.parse(JSON.stringify(emptyRecordLedger()));
 const put=putGameContribution(source,c);assert.ok(Object.hasOwn(put.ledger.games,'constructor'));assert.ok(Object.hasOwn(recordTotals(put.ledger,scope).batting,'__proto__'));
 assert.equal(putGameContribution(JSON.parse(JSON.stringify(put.ledger)),c).duplicate,true);
});

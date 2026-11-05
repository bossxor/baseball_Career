import {correctCareerGameContribution} from '../src/career-record-correction.js';
import {emptyBatting,emptyPitching} from '../src/stats.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {expiredRetryUsCareer} from './us-return-retry-fixture.js';
import {closeControlledServiceDates} from './us-service-fixture.js';
import {requestUsAmateurReturn,startUsAmateurReturnYear,settleUsAmateurReturnYear,advanceUsAmateurReturn,assertUsAmateurReturnCareer,resignUsAfterAmateurReturn} from '../src/us-amateur-return-career.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import {canonicalJson} from '../src/game.js';

test('controlled service dates exercise both actual year settlements and reject forged/duplicate return completion evidence',()=>{
 const closed=expiredRetryUsCareer();closed.military.status='UNRESOLVED';const source=openUsMinorMarket(closed,closed.revision,closed.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:3_000_000}))),offer=source.minorMarket!.offers.find(o=>o.militaryReturnOption)!;assert.ok(offer);let c=requestUsAmateurReturn(source,source.revision);
 // All scheduled contributions/dates are controlled. Only the settlement, archive and contract commands below are native.
 for(let year=0;year<2;year++){c=startUsAmateurReturnYear(c,c.revision,c.events.at(-1)!.version);c={...c,service:closeControlledServiceDates(c.service!,c.service!.season!.lastDay)};{
 const service=c.service!,g=Object.values(service.records.games).findLast(g=>g.scope.seasonKey===service.world.seasonKey&&g.scope.leagueKey==='ROOKIE')!,org=service.world.organizations.find(o=>o.id===Object.keys(g.teams)[0])!,away=service.world.organizations.find(o=>o.id===Object.keys(g.teams)[1])!,b=org.levels.ROOKIE.find(k=>service.world.players[k]!.kind==='HITTER')!,p=away.levels.ROOKIE.find(k=>service.world.players[k]!.kind==='PITCHER')!;
 const z={PA:0,AB:0,H:0,TB:0,BB:0,HBP:0,K:0,HR:0,twoB:0,threeB:0,RBI:0},line={...z,PA:1,AB:1};g.batting[b]={...emptyBatting(),games:1,PA:1,AB:1,fieldingGames:1,twoB:0,threeB:0,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};g.pitching[p]={...emptyPitching(),games:1,starts:1,BF:1,outs:1,starterOuts:1,loadedBF:0,W:0,L:0,SV:0,HLD:0,BS:0,shutouts:0};g.batterSplits[b]={L:{...z},R:{...line}};g.pitcherSplits[p]={L:{BF:0,outs:0,AB:0,H:0,TB:0,HR:0,BB:0,HBP:0,K:0},R:{BF:1,outs:1,AB:1,H:0,TB:0,HR:0,BB:0,HBP:0,K:0}};g.matchups[JSON.stringify([b,p])]={batterKey:b,pitcherKey:p,stats:{...line}};
 const day=service.season!.days.find(d=>d.day===g.worldDay)!;const rows=JSON.parse(day.evidence) as typeof g[];day.evidence=canonicalJson(rows.map(row=>row.gameKey===g.gameKey?g:row));service.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:service.season!.lastDay+1,pendingGame:null};
 const after=structuredClone(g);after.batting[b]!.RBI=1;after.batterSplits[b]!.R.RBI=1;after.matchups[JSON.stringify([b,p])]!.stats.RBI=1;
 const corrected=correctCareerGameContribution(service,{correctionId:'controlled-final-service-correction-'+year,expectedRevision:service.revision,expectedRecordRevision:service.records.revision,beforeEvidence:canonicalJson(g),contribution:after});assert.equal(corrected.duplicate,false);c={...c,service:corrected.career};c=advanceUsAmateurReturn(c,c.revision).career;
 }
 const before=canonicalJson(c);c=settleUsAmateurReturnYear(c,c.revision);assert.ok(c.return.years[year]!.seasonGrowth.finalized);assertUsAmateurReturnCareer(c);assert.notEqual(canonicalJson(c),before);if(year===0)assert.throws(()=>resignUsAfterAmateurReturn(c,c.revision,offer.offerKey),/OPTION_NOT_AVAILABLE/);}
 assert.equal(c.return.years.length,2);assert.equal(c.return.status,'DRAFT_READY');assertUsAmateurReturnCareer(JSON.parse(JSON.stringify(c)));
 const us=resignUsAfterAmateurReturn(c,c.revision,offer.offerKey);assert.deepEqual(us.recordCorrections,c.service!.recordCorrections,'return re-sign must preserve actual official correction receipts');assert.ok(us.revision>=c.service!.recordCorrections!.receipts.at(-1)!.afterRevision);
 for(const mutate of [(s:typeof c)=>{s.return.years[0]!.receiptKey='forged';},(s:typeof c)=>{s.return.years[1]!.receiptKey=s.return.years[0]!.receiptKey;},(s:typeof c)=>{s.service!.military.service!.years=[];},(s:typeof c)=>{s.return.years[0]!.recordRevision++;},(s:typeof c)=>{s.return.years[0]!.recordRevision--;}]){const bad=structuredClone(c);mutate(bad);assert.throws(()=>assertUsAmateurReturnCareer(bad),'forged completion must reject: '+mutate.toString());}
});

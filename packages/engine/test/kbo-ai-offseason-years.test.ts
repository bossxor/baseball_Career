import test from 'node:test';
import assert from 'node:assert/strict';
import {stagedKboOffseason} from './kbo-offseason-fixtures.js';
import {prepareKboAiRenewals} from '../src/kbo-ai-offseason.js';
import {runKboAiFreeAgentMarket} from '../src/kbo-fa-market.js';
import {repairKboDualLeagueRosters,selectKboDualLeagueRoster} from '../src/kbo-roster-repair.js';
import {draftKboRookieClass} from '../src/kbo-supply.js';
import {retireKboOverAgeNpcs} from '../src/kbo-retirement.js';
import {assertKboRecruitmentWorld} from '../src/kbo-draft.js';
import {assertKboFreeAgentPool,nextKboFreeAgentYear,settleKboFreeAgentSeason} from '../src/kbo-free-agents.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import type {KboAiAssessments} from '../src/kbo-ai-offseason.js';
import {kboClubBalance} from '../src/kbo-finance.js';

/** Controlled AI-only year carry: no official games, no simulated active-player growth/performance.
 * This validates repeated roster/contract/supply/finance transitions, not long-career competitive balance. */
test('ten controlled AI offseasons keep both leagues legal, debts finite, identities disjoint and annual budget unchanged',()=>{
 let x=stagedKboOffseason(0);let reports:KboAiAssessments={};let contracts=0;
 for(let year=0;year<10;year++){
  const prepared=prepareKboAiRenewals({...x,reports}),market=runKboAiFreeAgentMarket({...prepared,reports:prepared.reports,sourceSeasonKey:x.sourceSeasonKey,records:x.records,difficulty:'GROWTH'});
  draftKboRookieClass(market.world,market.world.seasonKey,market.world.clubs.map(c=>c.id).reverse(),'GROWTH');
  const repaired=repairKboDualLeagueRosters({...market,protagonistKey:x.protagonistKey,difficulty:'GROWTH'}),world=repaired.world;
  reports=market.reports;contracts+=market.rounds.reduce((n,r)=>n+r.outcomes.filter(o=>o.offerKey!==null).length,0);
  for(const club of world.clubs){club.firstTeam=selectKboDualLeagueRoster(club.roster.filter(k=>!repaired.health.injuries[k]).map(k=>world.players[k]!));assert.ok(club.roster.length>=38 && club.roster.length<=60);assert.equal(club.firstTeam.length,28);assert.equal(club.budgetWon,12_000_000_000);assert.ok(kboClubBalance(world,club.id).availableWon>=0);}
  assertKboRecruitmentWorld(world);assertKboFreeAgentPool(repaired.pool,Object.keys(world.players));assert.ok(Object.keys(repaired.pool.players).length>=80);assert.equal(Object.keys(x.records.games).length,0);assert.equal(world.players[x.protagonistKey]!.simulationKey,x.protagonistKey);
  if(year===9)break;
  const sourceSeasonKey=world.seasonKey,priorContracts=structuredClone(world.contracts),next=String(Number(sourceSeasonKey)+1),closing=settleKboFreeAgentSeason(repaired.pool,world.calendar,'GROWTH');
  const retirees=Object.keys(world.players).filter(k=>k!==x.protagonistKey && world.players[k]!.age===45);retireKboOverAgeNpcs(world,retirees,sourceSeasonKey,true);
  for(const [k,p] of Object.entries(world.players)){p.age++;p.fatigue=0;const c=world.contracts[k]!;c.seasonKey=next;c.years=Math.max(1,c.years-1);if(world.repertoires[k])world.repertoires[k]!.seasonId=next;}
  world.seasonKey=next;world.calendar=createSeasonCalendar(Number(next));for(const club of world.clubs){club.paidSalaryWon=0;club.reservedSalaryWon=club.roster.reduce((n,k)=>n+world.contracts[k]!.annualSalaryWon,0);}
  const pool=nextKboFreeAgentYear({source:closing,worldKey:world.worldKey,seed:world.seed,seasonKey:next,difficulty:'GROWTH',registeredKeys:Object.keys(world.players)});
  x={...x,world,pool,priorContracts,expiringKeys:Object.keys(priorContracts).filter(k=>k!==x.protagonistKey && Object.hasOwn(world.players,k) && priorContracts[k]!.years===1),sourceSeasonKey,health:repaired.health};
 }
 assert.ok(contracts>0);
});

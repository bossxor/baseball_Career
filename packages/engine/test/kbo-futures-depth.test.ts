import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import {nextKboFreeAgentYear} from '../src/kbo-free-agents.js';
import {enteredKboCareer} from './fixtures.js';

const started=()=>{const e=enteredKboCareer('PITCHER'),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision);return startKboRegularSeason(s,s.revision);};

// Regression for the native P11 run (2036 day 224): an AI Futures squad with exactly nine hitters aborted the whole day when one was hurt.
for(const own of [false,true])test(`${own?'the protagonist club':'an AI club'} Futures squad below a legal lineup is refilled by the required-replacement rule instead of aborting the day`,()=>{
 const c=structuredClone(started()) as KboCareer;c.freeAgents=nextKboFreeAgentYear({worldKey:c.world.worldKey,seed:c.world.seed,seasonKey:c.world.seasonKey,difficulty:c.difficulty,registeredKeys:Object.keys(c.world.players)});
 const first=Math.min(...c.competitionSchedule!.leagues.FUTURES.map(g=>g.worldDay));
 const game=c.competitionSchedule!.leagues.FUTURES.find(g=>g.worldDay===first && (g.homeTeamKey===c.protagonistClubId||g.awayTeamKey===c.protagonistClubId)===own)!;
 const club=c.world.clubs.find(t=>t.id===(own?c.protagonistClubId:game.homeTeamKey))!,futures=()=>club.roster.filter(k=>!club.firstTeam.includes(k)).map(k=>c.world.players[k]!);
 const hitters=futures().filter(p=>p.kind==='HITTER');
 for(const p of hitters.slice(8))c.health.injuries[p.simulationKey]={severity:'MILD',remainingTeamGames:30,diagnosedGameKey:'controlled-past-medical',seasonKey:c.world.seasonKey};
 const healthy=()=>futures().filter(p=>p.kind==='HITTER' && !Object.hasOwn(c.health.injuries,p.simulationKey)).length;
 assert.equal(healthy(),8);const before=club.roster.length,snapshot=JSON.stringify(c);
 const out=advanceKboCareer(c,c.revision,1);
 assert.equal(JSON.stringify(c),snapshot,'source career must not change');
 const next=out.career,after=next.world.clubs.find(t=>t.id===club.id)!;
 assert.ok(after.roster.length>before,'a replacement joins the club');
 const joined=after.roster.filter(k=>!club.roster.includes(k));
 assert.ok(joined.every(k=>after.firstTeam.indexOf(k)<0 && next.world.contracts[k]!.annualSalaryWon>0));
 assert.ok(Object.hasOwn(next.records.games,game.simulationKey),'the Futures game was played');
 const again=advanceKboCareer(JSON.parse(JSON.stringify(c)) as KboCareer,c.revision,1);
 assert.equal(JSON.stringify(again.career),JSON.stringify(out.career),'deterministic after JSON replay');
});

// Controlled regular clock, real postseason/close/AI offseason; not an eighteen-month simulated season.
import assert from 'node:assert/strict';
import {enteredKboCareer} from '../../../packages/engine/test/fixtures.ts';
import {startSangmuCohort} from '../../../packages/engine/src/kbo-sangmu-start.ts';
import {confirmKboPreseasonPlan} from '../../../packages/engine/src/kbo-preseason.ts';
import {confirmKboOpeningRoster} from '../../../packages/engine/src/kbo-opening-roster.ts';
import {confirmKboSeasonSchedule} from '../../../packages/engine/src/kbo-schedule.ts';
import {startKboRegularSeason} from '../../../packages/engine/src/kbo-progress.ts';
import {reconcileSangmuEmergency} from '../../../packages/engine/src/kbo-sangmu-emergency.ts';
import {startKboPostseason,advanceKboPostseason} from '../../../packages/engine/src/kbo-postseason-progress.ts';
import {settleKboSeasonGrowth} from '../../../packages/engine/src/kbo-season-growth.ts';
import {closeKboSeason} from '../../../packages/engine/src/kbo-year-end.ts';
import {kboContractDecisionRequired,offerKboRenewal,acceptKboRenewal} from '../../../packages/engine/src/kbo-renewal.ts';
import {startNextKboSeason} from '../../../packages/engine/src/kbo-year-transition.ts';
import {assertSangmuUnit} from '../../../packages/engine/src/kbo-sangmu-unit.ts';
let c=enteredKboCareer();c=startSangmuCohort(c,c.revision);c=confirmKboPreseasonPlan(c,c.revision);c=confirmKboOpeningRoster(c,c.revision);c=confirmKboSeasonSchedule(c,c.revision);c=startKboRegularSeason(c,c.revision);
const keys=Object.keys(c.sangmu.members),seasonKey=c.world.seasonKey,gameKey='controlled-army-year-injury';
c.health.games=[...c.health.games,{evidence:{gameKey,seasonKey,teamKey:'FUTURES:SANGMU',day:0,roster:keys,appearances:[]},result:{injured:keys,recovered:[]}}];
for(const k of keys)c.health.injuries[k]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:gameKey,seasonKey};
c.sangmu=reconcileSangmuEmergency(c.world,c.sangmu,c.health,c.world.calendar.growthDays[0]);
const all=[...c.competitionSchedule.leagues.KBO,...c.competitionSchedule.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
c.days.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled-regular-clock',result:{injured:[],recovered:[]}}));c.phaseContext={phase:'SEASON_REVIEW'};
c=startKboPostseason(c,c.revision);for(let i=0;i<400;i++){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason==='POSTSEASON_COMPLETE')break;}
assert.equal(c.phaseContext.phase,'SEASON_REVIEW');c=settleKboSeasonGrowth(c,c.revision).career;c=closeKboSeason(c,c.revision,true);
if(kboContractDecisionRequired(c)){c=offerKboRenewal(c,c.revision);c=acceptKboRenewal(c,c.revision,{eventKey:c.renewal.eventKey,eventVersion:c.events.find(e=>e.eventKey===c.renewal.eventKey).version});}
const before=JSON.stringify(c),archive=structuredClone(c.sangmu.emergency),next=startNextKboSeason(c,c.revision),end=c.days.days.at(-1).day;
assert.equal(JSON.stringify(c),before);assert.equal(next.schemaVersion,5);assert.equal(next.world.seasonKey,String(Number(seasonKey)+1));assert.deepEqual(startNextKboSeason(JSON.parse(before),c.revision),next);
assert.deepEqual(Object.keys(next.sangmu.emergency.entries),Object.keys(archive.entries));
for(const [key,e] of Object.entries(archive.entries)){assert.deepEqual(next.sangmu.emergency.entries[key].player,e.player);assert.deepEqual(next.sangmu.emergency.entries[key].repertoire,e.repertoire);assert.deepEqual(next.sangmu.emergency.entries[key].released,{seasonKey,worldDay:end});}
assertSangmuUnit(next.sangmu,next.world);
console.log(JSON.stringify({result:'PASS',scope:'controlled regular clock; real postseason, year close and AI year transition',temporaryIdentitiesPreserved:Object.keys(archive.entries).length,newVersion:next.schemaVersion,targetSeason:next.world.seasonKey,activeTemporaryCount:Object.values(next.sangmu.emergency.entries).filter(e=>e.released===null).length,jsonReplayEqual:true,sourceUnchanged:true}));

import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import {reviewedUsCareerFixture} from './us-reviewed-fixture.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason} from '../src/kbo-progress.js';
import {startKboPostseason,advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {nextKboPostseasonGame,recordKboPostseasonGame} from '../src/kbo-postseason.js';
import {startUsPostseason,advanceUsPostseason,auditUsCompletedPostseason} from '../src/us-postseason-progress.js';
import {nextMlbPostseasonGame,recordMlbPostseasonGame} from '../src/us-postseason.js';
import {resolveProHiddenTraitNotice} from '../src/pro-trait-notices.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {UsCareer} from '../src/us-career-entry.js';
import type {GameContribution} from '../src/records.js';
import {canonicalJson} from '../src/game.js';
import {emptyBatting} from '../src/stats.js';
const split={PA:0,AB:0,H:0,BB:0,HBP:0,K:0,TB:0,HR:0,twoB:0,threeB:0,RBI:0};

function contribution(c:KboCareer|UsCareer,key:string,day:number,home:string,away:string,winner:string):GameContribution {
 return {gameKey:key,worldDay:day,scope:{seasonKey:c.world.seasonKey,leagueKey:'mode' in c?'MLB':'KBO',phase:'POSTSEASON'},teams:{[home]:{games:1,W:+(winner===home),L:+(winner!==home),T:0,R:+(winner===home),RA:+(winner!==home)},[away]:{games:1,W:+(winner===away),L:+(winner!==away),T:0,R:+(winner===away),RA:+(winner!==away)}},batting:{},pitching:{},batterSplits:{},pitcherSplits:{},matchups:{}};
}
/** Controlled prior official evidence; the native worker must generate the unlock receipt itself. */
function priorWalkoffs(c:KboCareer|UsCareer){
 const key='controlled-prior-walkoffs',row=contribution(c,key,0,'prior-home','prior-away','prior-home');
 row.scope={seasonKey:String(Number(c.world.seasonKey)-1),leagueKey:'KBO',phase:'REGULAR'};
 row.batting[c.protagonistKey]={...emptyBatting(),twoB:0,threeB:0,games:3,fieldingGames:3,PA:3,AB:3,H:3,TB:3,loadedHits:0,walkoffHits:3,extraHomeSuccesses:0};
 row.batterSplits[c.protagonistKey]={L:{...split},R:{...split,PA:3,AB:3,H:3,TB:3}};
 c.records.games[key]=row;c.records.revision++;
}
/** Controlled regular/earlier playoff contributions, followed by a native decisive or ordinary playoff game. */
function kbo(final:boolean){
 const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),r=startKboRegularSeason(s,s.revision),all=[...r.competitionSchedule!.leagues.KBO,...r.competitionSchedule!.leagues.FUTURES],first=Math.min(...all.map(g=>g.worldDay)),last=Math.max(...all.map(g=>g.worldDay));
 r.days!.days=Array.from({length:last-first+1},(_,i)=>({day:first+i,evidence:'controlled regular day',result:{injured:[],recovered:[]}}));r.phaseContext={phase:'SEASON_REVIEW'};
 const c=startKboPostseason(r,r.revision);if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');const phase=c.phaseContext;
 do {
  const g=nextKboPostseasonGame(phase.postseason)!,series=phase.postseason.series.at(-1)!;
  if(final&&g.round==='KOREAN_SERIES'&&series.higherWins===3&&series.lowerWins===3)break;
  const winner=series.higherWins<=series.lowerWins?series.higherSeed:series.lowerSeed,key=JSON.stringify([c.world.seasonKey,'KBO','POSTSEASON',g.round,g.gameNumber]),row=contribution(c,key,phase.nextWorldDay,g.homeTeamKey,g.awayTeamKey,winner);
  row.batting[c.protagonistKey]={...emptyBatting(),twoB:0,threeB:0,games:1,fieldingGames:1,loadedHits:0,walkoffHits:0,extraHomeSuccesses:0};c.records.games[key]=row;c.records.revision++;
  row.batterSplits[c.protagonistKey]={L:{...split},R:{...split}};
  c.days!.days=[...c.days!.days,{day:phase.nextWorldDay,evidence:canonicalJson({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,day:phase.nextWorldDay,contributions:[row]}),result:{injured:[],recovered:[]}}];
  phase.postseason=recordKboPostseasonGame(phase.postseason,winner);phase.nextWorldDay++;
 }while(final);
 priorWalkoffs(c);return c;
}
function resolve(c:KboCareer|UsCareer,input:{eventKey:string;eventVersion:number;command:string},revision=c.revision){return 'mode' in c?resolveProHiddenTraitNotice(c,revision,input):resolveProHiddenTraitNotice(c,revision,input);}
function us(final:boolean){
 const r=reviewedUsCareerFixture(),ids=r.world.organizations.map(o=>o.id),c=startUsPostseason(r,r.revision,{AL:ids.slice(0,15),NL:ids.slice(15)});if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');const phase=c.phaseContext;
 do {
  const g=nextMlbPostseasonGame(phase.bracket)!,series=phase.bracket.series.find(s=>s.id===g.seriesId)!;
  if(final&&series.round==='WORLD_SERIES'&&series.higherWins===3&&series.lowerWins===3)break;
  const winner=series.higherWins<=series.lowerWins?series.higherSeed:series.lowerSeed,key=JSON.stringify([c.world.seasonKey,'MLB','POSTSEASON',g.seriesId,g.gameNumber]),row=contribution(c,key,phase.nextWorldDay,g.homeTeamKey,g.awayTeamKey,winner);
  c.records.games[key]=row;c.records.revision++;phase.gameEvidence.push(canonicalJson(row));phase.bracket=recordMlbPostseasonGame(phase.bracket,winner);phase.nextWorldDay++;
 }while(final);
 priorWalkoffs(c);return c;
}

for(const league of ['KBO','US'] as const)for(const final of [false,true])test(`${league} native closed postseason ${final?'championship':'date'} raises E84 and restores its exact continuation`,()=>{
 const source=league==='KBO'?kbo(final):us(final),day=source.phaseContext.phase==='POSTSEASON_PROGRESS'?source.phaseContext.nextWorldDay:0,raw=canonicalJson(source);
 let out=league==='KBO'?advanceKboPostseason(source as KboCareer,source.revision):advanceUsPostseason(source as UsCareer,source.revision);
 for(let i=0;i<30&&out.stopReason==='CHUNK_LIMIT';i++)out=league==='KBO'?advanceKboPostseason(out.career as KboCareer,out.career.revision):advanceUsPostseason(out.career as UsCareer,out.career.revision);
 assert.equal(out.stopReason,'MAJOR_EVENT');assert.equal(out.career.phaseContext.phase,'EVENT_DECISION');if(out.career.phaseContext.phase!=='EVENT_DECISION')throw Error('notice');
 const raised=out.career,event=raised.events.at(-1)!,resume=out.career.phaseContext.resume;
 assert.equal(event.definitionId,'E84');assert.equal(event.evidence.fields.traitId,'T13');assert.equal(event.occurredWorldDay,day);assert.equal(event.resume.phase,final?'SEASON_REVIEW':'POSTSEASON_PROGRESS');assert.equal(resume.phase,final?'SEASON_REVIEW':'POSTSEASON_PROGRESS');
 assert.equal(raised.traits!.unlocks.find(u=>u.playerKey===source.protagonistKey&&u.traitId==='T13')!.worldDay,day);
 assert.equal(Object.keys(raised.records.games).length,Object.keys(source.records.games).length+1);assert.deepEqual(raised.seasonGrowth,source.seasonGrowth);assert.deepEqual(raised.development,source.development);
 if(league==='US'){assert.deepEqual((raised as UsCareer).income,(source as UsCareer).income);assert.deepEqual((raised as UsCareer).season!.payroll,(source as UsCareer).season!.payroll);}else assert.deepEqual((raised as KboCareer).world.finance,(source as KboCareer).world.finance);
 const restored=JSON.parse(JSON.stringify(raised)) as KboCareer|UsCareer,input={eventKey:event.eventKey,eventVersion:event.version,command:'OPEN_TRAITS'},restoredRaw=canonicalJson(restored);
 assert.throws(()=>resolve(restored,input,restored.revision-1),/REVISION/);assert.throws(()=>resolve(restored,{...input,eventVersion:event.version+1}),/VERSION/);
 const changed=structuredClone(restored),record=Object.values(changed.records.games).find(g=>g.worldDay===day)!;record.teams[Object.keys(record.teams)[0]!]!.R++;assert.throws(()=>resolve(changed,input),/EVIDENCE|CHANGED/);
 const done=resolve(restored,input).career;assert.deepEqual(done.phaseContext,resume);assert.equal(done.revision,restored.revision+1);
 for(const key of ['world','records','health','traits','development','seasonGrowth'] as const)assert.deepEqual(done[key],restored[key]);
 assert.equal(canonicalJson(restored),restoredRaw);assert.equal(canonicalJson(source),raw);
 // Controlled already-earned receipt isolates backlog delivery from the independent T14 qualification domain.
 const backlog=structuredClone(restored);backlog.traits!.owned[backlog.protagonistKey]!.unlocked=[...backlog.traits!.owned[backlog.protagonistKey]!.unlocked,'T14'];backlog.traits!.unlocks=[...backlog.traits!.unlocks,{playerKey:backlog.protagonistKey,traitId:'T14',worldDay:day,recordRevision:backlog.records.revision,seasonKey:backlog.world.seasonKey,leagueKey:league==='US'?'ROOKIE':'KBO'}];
 const second=resolve(backlog,input).career;assert.equal(second.phaseContext.phase,'EVENT_DECISION');assert.equal(second.events.at(-1)!.evidence.fields.traitId,'T14');const e2=second.events.at(-1)!;
 const drained=resolve(JSON.parse(JSON.stringify(second)) as KboCareer|UsCareer,{eventKey:e2.eventKey,eventVersion:e2.version,command:'OPEN_TRAITS'}).career;assert.deepEqual(drained.phaseContext,resume);assert.equal(drained.events.filter(e=>e.definitionId==='E84'&&e.status==='OPEN').length,0);for(const key of ['records','health','world','development','seasonGrowth'] as const)assert.deepEqual(drained[key],backlog[key]);
 if(final){assert.ok(done.postseason);assert.throws(()=>league==='KBO'?advanceKboPostseason(done as KboCareer,done.revision):advanceUsPostseason(done as UsCareer,done.revision),/PHASE/);if(league==='US')auditUsCompletedPostseason(done as UsCareer);}
 else {const next=league==='KBO'?advanceKboPostseason(done as KboCareer,done.revision):advanceUsPostseason(done as UsCareer,done.revision);assert.equal(Object.keys(next.career.records.games).length,Object.keys(done.records.games).length+1);}
});

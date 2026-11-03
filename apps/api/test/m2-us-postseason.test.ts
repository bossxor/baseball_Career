import test from 'node:test';
import assert from 'node:assert/strict';
import type {UsCareer} from '@playball/engine';
import {startUsPostseason,createUsConferenceRegistry} from '@playball/engine';
import {reviewedUsCareerFixture} from '../../../packages/engine/test/us-reviewed-fixture.js';
import {applyEngineCommand} from '../src/engine-command.js';
import {usPlayScreen} from '../src/career-us-play-shell.js';

const dispatch=(c:UsCareer,type:string,extra:Record<string,unknown>={})=>applyEngineCommand({schemaVersion:1,career:c},{commandId:type+c.revision,expectedRevision:0,type:'CAREER_US_PLAY_'+type,payload:{careerRevision:c.revision,...extra}});
test('US legacy membership configuration preserves owner data and rejects client membership',()=>{
 const legacy=reviewedUsCareerFixture();delete legacy.world.conferenceRegistry;
 assert.throws(()=>dispatch(legacy,'CONFIGURE_LEAGUES',{conferences:{AL:[],NL:[]}}),/INVALID_PAYLOAD/);
 assert.throws(()=>dispatch(legacy,'START_POSTSEASON'),/CONFERENCES_NOT_CONFIGURED/);
 const configured=dispatch(legacy,'CONFIGURE_LEAGUES').nextState.career as UsCareer;
 assert.equal(configured.revision,legacy.revision+1);assert.equal(legacy.world.conferenceRegistry,undefined);
 assert.strictEqual(configured.world.players,legacy.world.players);assert.strictEqual(configured.world.rng,legacy.world.rng);assert.strictEqual(configured.records,legacy.records);assert.strictEqual(configured.income,legacy.income);assert.deepEqual(configured.phaseContext,legacy.phaseContext);
 assert.deepEqual(configured.world.conferenceRegistry!.AL,['US01','US03','US05','US07','US09','US11','US13','US15','US17','US19','US21','US23','US25','US27','US29']);
 assert.strictEqual(dispatch(configured,'CONFIGURE_LEAGUES').nextState.career,configured);
 assert.throws(()=>applyEngineCommand({schemaVersion:1,career:configured},{commandId:'stale',expectedRevision:0,type:'CAREER_US_PLAY_CONFIGURE_LEAGUES',payload:{careerRevision:legacy.revision}}),/REVISION/);
 const view=usPlayScreen({schemaVersion:1,career:JSON.parse(JSON.stringify(configured))}) as {leagues:{configured:boolean;groups:{AL:unknown[];NL:unknown[]}}};assert.equal(view.leagues.configured,true);assert.equal(view.leagues.groups.AL.length,15);assert.equal(view.leagues.groups.NL.length,15);assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
 const activeLegacy=startUsPostseason(legacy,legacy.revision,createUsConferenceRegistry(legacy.world.organizations));
 assert.throws(()=>dispatch(activeLegacy,'CONFIGURE_LEAGUES'),/CONFIGURATION_NOT_READY/);assert.equal(activeLegacy.world.conferenceRegistry,undefined);
});
test('owned US postseason API starts fixed leagues and commits a native game without regular payroll changes',()=>{
 // Controlled regular-season contributions; the postseason start/progress/FINAL below use native writers.
 const closed=reviewedUsCareerFixture();assert.ok(closed.world.conferenceRegistry,'new recognized generation must already own the league registry');const configured=dispatch(closed,'CONFIGURE_LEAGUES').nextState.career as UsCareer;
 assert.throws(()=>dispatch(configured,'START_POSTSEASON',{seeds:{AL:['US02']}}),/INVALID_PAYLOAD/);
 let c=dispatch(configured,'START_POSTSEASON').nextState.career as UsCareer;assert.equal(c.phaseContext.phase,'POSTSEASON_PROGRESS');
 if(c.phaseContext.phase!=='POSTSEASON_PROGRESS')throw Error('phase');
 assert.deepEqual(c.phaseContext.conferences.AL,c.world.conferenceRegistry!.AL);assert.deepEqual(c.phaseContext.conferences.NL,c.world.conferenceRegistry!.NL);
 const income=JSON.stringify(c.income),paid=c.season!.paidUsd,regularDays=c.season!.days.length;
 c=JSON.parse(JSON.stringify(c));
 for(let i=0;i<20&&c.phaseContext.phase==='POSTSEASON_PROGRESS'&&c.phaseContext.bracket.results.length===0;i++)c=dispatch(c,'ADVANCE_POSTSEASON').nextState.career as UsCareer;
 assert.ok(c.phaseContext.phase==='POSTSEASON_PROGRESS'&&c.phaseContext.bracket.results.length>0);assert.equal(JSON.stringify(c.income),income);assert.equal(c.season!.paidUsd,paid);assert.equal(c.season!.days.length,regularDays);
 const view=usPlayScreen({schemaVersion:1,career:c}) as {postseason:{status:string;series:unknown[]}};assert.equal(view.postseason.status,'ACTIVE');assert.ok(view.postseason.series.length>0);assert.doesNotMatch(JSON.stringify(view),/"seed"|"rng"|"potential"/);
 assert.throws(()=>dispatch(c,'ADVANCE_POSTSEASON',{winner:'US01'}),/INVALID_PAYLOAD/);
});

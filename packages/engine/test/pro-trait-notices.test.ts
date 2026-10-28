import {preparedUsCareer} from './us-fixtures.js';
import {startUsRegularSeason} from '../src/us-season.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {UsCareer} from '../src/us-career-entry.js';
import type {KboSeasonProgress} from '../src/kbo-progress.js';
import type {TraitId} from '../src/traits.js';
import {raiseProHiddenTraitNotice,resolveProHiddenTraitNotice} from '../src/pro-trait-notices.js';
import {canonicalJson} from '../src/game.js';

const day=80;
function kbo(traitId:TraitId='T13'):KboCareer {
 const c=enteredKboCareer(traitId==='T16'?'PITCHER':'HITTER');
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 c.days={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,days:[{day,evidence:'controlled closed day',result:{injured:[],recovered:[]}}]};
 c.traits={schemaVersion:1,lastClosedDay:day,lastSeasonKey:c.world.seasonKey,owned:{[c.protagonistKey]:{unlocked:[traitId],qualifiedRivalPitcherKeys:[]}},unlocks:[{playerKey:c.protagonistKey,traitId,worldDay:day,recordRevision:c.records.revision,seasonKey:c.world.seasonKey,leagueKey:'KBO'}]};
 return c;
}
function progress(c:KboCareer):KboSeasonProgress {assert.equal(c.phaseContext.phase,'SEASON_PROGRESS');return c.phaseContext as KboSeasonProgress;}
/** Real signed root with a controlled closed-day/trait receipt, not a native played season. */
function us():UsCareer {
 const prepared=preparedUsCareer(),c=startUsRegularSeason(prepared,prepared.revision),key=c.protagonistKey;
 c.phaseContext={phase:'SEASON_PROGRESS',nextWorldDay:day+1,pendingGame:null};
 c.season!.days=[{day,evidence:'controlled closed day',level:c.registration.level,appearances:0,rehabilitating:false,injured:[],recovered:[]}];
 c.traits={schemaVersion:1,lastClosedDay:day,lastSeasonKey:c.world.seasonKey,owned:{[key]:{unlocked:['T13'],qualifiedRivalPitcherKeys:[]}},unlocks:[{playerKey:key,traitId:'T13',worldDay:day,recordRevision:c.records.revision,seasonKey:c.world.seasonKey,leagueKey:c.registration.level}]};return c;
}

test('KBO first hidden notice stops at a closed day with real registration, structural sharing and no general trait stop',()=>{
 const c=kbo(),raw=canonicalJson(c),raised=raiseProHiddenTraitNotice(c,day,progress(c))!;
 assert.equal(canonicalJson(c),raw);assert.equal(raised.revision,c.revision);assert.equal(raised.records,c.records);assert.equal(raised.world,c.world);assert.equal(raised.traits,c.traits);assert.notEqual(raised.events,c.events);
 assert.equal(raised.phaseContext.phase,'EVENT_DECISION');const e=raised.events.at(-1)!;
 assert.equal(e.definitionId,'E84');assert.equal(e.evidence.fields.playerSimulationKey,c.protagonistKey);assert.equal(e.resume.registrationKey,c.registration.clubId);assert.equal(e.resume.competitionKey,c.registration.firstTeam?'KBO':'FUTURES');assert.equal(e.resume.sourceRevision,c.revision+1);
 const again={...raised,phaseContext:progress(c)};assert.equal(raiseProHiddenTraitNotice(again,day,progress(c)),null);const general=kbo('T02');assert.equal(raiseProHiddenTraitNotice(general,day,progress(general)),null);
});

test('US top-level identity and actual level navigate to S38 once after JSON restoration',()=>{
 const c=us();assert.equal(c.phaseContext.phase,'SEASON_PROGRESS');if(c.phaseContext.phase!=='SEASON_PROGRESS')throw new Error('fixture');
 const raised=raiseProHiddenTraitNotice(c,day,c.phaseContext)!;raised.revision++;
 const e=raised.events.at(-1)!,input={eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'};assert.equal(e.resume.registrationKey,c.registration.clubId);assert.equal(e.resume.competitionKey,c.registration.level);
 raised.revision++; // An unrelated outbox read may commit while the blocking notice remains open.
 const restored=JSON.parse(JSON.stringify(raised)) as UsCareer,raw=canonicalJson(restored),result=resolveProHiddenTraitNotice(restored,restored.revision,input);
 assert.equal(result.navigation!.targetScreen,'S38');assert.deepEqual(result.career.phaseContext,c.phaseContext);assert.equal(result.career.events.at(-1)!.status,'RESOLVED');assert.equal(result.career.revision,restored.revision+1);assert.equal(canonicalJson(restored),raw);assert.equal(result.career.records,restored.records);assert.equal(result.career.world,restored.world);
 assert.throws(()=>resolveProHiddenTraitNotice(result.career,result.career.revision,input),/PHASE/);
});

test('resolver rejects stale revision, version, command, foreign world, altered owner and changed resume without mutation',()=>{
 const c=kbo(),raised=raiseProHiddenTraitNotice(c,day,progress(c))!;raised.revision++;const e=raised.events.at(-1)!,input={eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'},raw=canonicalJson(raised);
 assert.throws(()=>resolveProHiddenTraitNotice(raised,raised.revision-1,input),/REVISION/);assert.throws(()=>resolveProHiddenTraitNotice(raised,raised.revision,{...input,eventVersion:e.version+1}),/VERSION/);assert.throws(()=>resolveProHiddenTraitNotice(raised,raised.revision,{...input,command:'ACK_EVENT'}),/CHOICE/);
 const foreign=structuredClone(raised);foreign.world.worldKey+='foreign';assert.throws(()=>resolveProHiddenTraitNotice(foreign,foreign.revision,input),/SOURCE/);
 const owner=structuredClone(raised);owner.registration.clubId+='changed';assert.throws(()=>resolveProHiddenTraitNotice(owner,owner.revision,input),/SOURCE/);
 const resume=structuredClone(raised);if(resume.phaseContext.phase!=='EVENT_DECISION'||resume.phaseContext.resume.phase!=='SEASON_PROGRESS')throw new Error('fixture');resume.phaseContext.resume.nextWorldDay++;assert.throws(()=>resolveProHiddenTraitNotice(resume,resume.revision,input),/RESUME/);
 const receipt=structuredClone(raised);receipt.traits!.unlocks=receipt.traits!.unlocks.map(u=>({...u,seasonKey:'1900'}));assert.throws(()=>resolveProHiddenTraitNotice(receipt,receipt.revision,input),/SOURCE/);assert.equal(canonicalJson(raised),raw);
 const result=resolveProHiddenTraitNotice(raised,raised.revision,input);assert.equal(result.navigation!.targetScreen,'S38');assert.equal(canonicalJson(raised),raw);
});

test('only same-source owned receipts qualify; pending games and unclosed days are rejected',()=>{
 const c=kbo(),resume=progress(c),unknown=structuredClone(c);unknown.traits!.unlocks=unknown.traits!.unlocks.map(u=>({...u,playerKey:'npc'}));assert.equal(raiseProHiddenTraitNotice(unknown,day,resume),null);
 const future=structuredClone(c);future.traits!.unlocks=future.traits!.unlocks.map(u=>({...u,recordRevision:c.records.revision+1}));assert.equal(raiseProHiddenTraitNotice(future,day,resume),null);
 const historical=structuredClone(c);historical.traits!.unlocks=historical.traits!.unlocks.map(u=>({...u,seasonKey:'1900'}));assert.equal(raiseProHiddenTraitNotice(historical,day,resume),null);
 const foreign=structuredClone(c);foreign.days!.worldKey+='foreign';assert.throws(()=>raiseProHiddenTraitNotice(foreign,day,resume),/DAY_NOT_CLOSED/);
 assert.throws(()=>raiseProHiddenTraitNotice(c,day,{...resume,pendingGame:{} as NonNullable<KboSeasonProgress['pendingGame']>}),/RESUME/);
 assert.throws(()=>raiseProHiddenTraitNotice(c,day,{...resume,nextWorldDay:day}),/PHASE/);
 const review=structuredClone(c);review.phaseContext={phase:'SEASON_REVIEW'};assert.throws(()=>raiseProHiddenTraitNotice(review,day,resume),/PHASE/);
});

test('backlog and same-day hidden traits resume one at a time, including season-close T16 before review',()=>{
 const c=kbo('T16'),resume=progress(c);c.traits!.unlocks=c.traits!.unlocks.map(u=>({...u,worldDay:day-1,recordRevision:Math.max(0,c.records.revision-1)}));
 c.traits!.owned[c.protagonistKey]!.unlocked=['T15','T16'];c.traits!.unlocks=[...c.traits!.unlocks,{playerKey:c.protagonistKey,traitId:'T15',worldDay:day,recordRevision:c.records.revision,seasonKey:c.world.seasonKey,leagueKey:'KBO'}];
 const raised=raiseProHiddenTraitNotice(c,day,resume)!;raised.revision++;const e=raised.events.at(-1)!;assert.equal(e.evidence.fields.traitId,'T16');
 const resolved=resolveProHiddenTraitNotice(raised,raised.revision,{eventKey:e.eventKey,eventVersion:e.version,command:'OPEN_TRAITS'}).career,next=raiseProHiddenTraitNotice(resolved,day,resume)!;assert.equal(next.events.at(-1)!.evidence.fields.traitId,'T15');
 next.revision++;const e2=next.events.at(-1)!,done=resolveProHiddenTraitNotice(next,next.revision,{eventKey:e2.eventKey,eventVersion:e2.version,command:'OPEN_TRAITS'}).career;assert.equal(raiseProHiddenTraitNotice(done,day,resume),null);
});

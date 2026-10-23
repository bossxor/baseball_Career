import test from 'node:test';
import assert from 'node:assert/strict';
import {enteredKboCareer} from './fixtures.js';
import type {KboCareer} from '../src/kbo-career-entry.js';
import type {PlayerRelationship,RelationStage} from '../src/relationships.js';
import type {GameContribution} from '../src/records.js';
import {confirmKboPreseasonPlan} from '../src/kbo-preseason.js';
import {confirmKboOpeningRoster} from '../src/kbo-opening-roster.js';
import {confirmKboSeasonSchedule} from '../src/kbo-schedule.js';
import {startKboRegularSeason,advanceKboCareer} from '../src/kbo-progress.js';
import {advanceKboPostseason} from '../src/kbo-postseason-progress.js';
import {createKboPostseason} from '../src/kbo-postseason.js';
import {settleKboOpponentReunions,kboOpponentReunionNoticeRows} from '../src/kbo-reunion-events.js';
import {unreadKboRelationNotices,resolveKboRelationNotice,kboRelationshipListView} from '../src/kbo-relations.js';
import {canonicalJson} from '../src/game.js';

function run(start:KboCareer,postseason=false){let c=structuredClone(start);for(let i=0;i<150;i++){if(postseason){const r=advanceKboPostseason(c,c.revision);c=r.career;if(r.stopReason!=='CHUNK_LIMIT')return c;}else{const r=advanceKboCareer(c,c.revision,1);c=r.career;if(r.daysClosed)return c;}}throw Error('DAY_LIMIT');}
let cached:{start:KboCareer;end:KboCareer;g:GameContribution;other:string}|undefined;
function fixture(){
 if(!cached){const e=enteredKboCareer(),p=confirmKboPreseasonPlan(e,e.revision),o=confirmKboOpeningRoster(p,p.revision),s=confirmKboSeasonSchedule(o,o.revision),start=startKboRegularSeason(s,s.revision),end=run(start),g=Object.values(end.records.games).find(g=>g.scope.seasonKey===end.world.seasonKey&&Object.hasOwn(g.batting,end.protagonistKey))!;
  assert.ok(g);const own=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(end.protagonistKey))!.evidence,opponent=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.teamKey!==own.teamKey)!.evidence,other=opponent.appearances.find(a=>Object.hasOwn(g.batting,a.playerKey))!.playerKey;cached={start,end,g,other};}
 return structuredClone(cached);
}
function relation(c:KboCareer,other:string,stage:RelationStage='SEPARATED'):PlayerRelationship {
 const normalPairKey=JSON.stringify([c.protagonistKey,other].sort());return {relationKey:JSON.stringify(['RIVAL',normalPairKey]),normalPairKey,primaryPlayerKey:c.protagonistKey,otherPlayerKey:other,type:'RIVAL',stage,milestones:[{stage:'FORMED',evidenceKey:'controlled-formation:'+other,worldDay:0},{stage:'SEPARATED',evidenceKey:'controlled-separation:'+other,worldDay:0}]};
}
function install(c:KboCareer,r:PlayerRelationship){c.relationships.relations=[...c.relationships.relations.filter(x=>x.relationKey!==r.relationKey),r];}

test('actual regular day reunites opposing appearances once, preserves results/RNG and resumes identically from JSON',()=>{
 const {start,end,g,other}=fixture(),r=relation(start,other);install(start,r);const before=canonicalJson(start),a=run(start),b=run(JSON.parse(JSON.stringify(start))),actual=a.relationships.relations.find(x=>x.relationKey===r.relationKey)!;
 assert.equal(actual.stage,'REUNITED_OPPONENT');assert.deepEqual(actual.milestones.slice(0,-1),r.milestones);assert.equal(actual.milestones.at(-1)!.worldDay,g.worldDay);assert.deepEqual(a,b);
 for(const field of ['world','records','health','days','phaseContext','traits','development','seasonGrowth'] as const)assert.equal(canonicalJson(a[field]),canonicalJson(end[field]));assert.equal(canonicalJson(start),before);
 const notice=a.relationNotices.find(e=>e.definitionId==='E95')!;assert.ok(notice);assert.equal(notice.evidence.fields.actualMeetingGameId,g.gameKey);assert.equal(notice.evidence.fields.stageEvidenceId,r.milestones[1]!.evidenceKey);
 const snap=canonicalJson(a);settleKboOpponentReunions(a,g.worldDay);assert.equal(canonicalJson(a),snap);assert.equal(kboRelationshipListView(a).find(x=>x.relationKey===r.relationKey)!.stage,'REUNITED_OPPONENT');
});

test('E95 and E94 share a private-data-free read path; acknowledging a reunion changes no gameplay state or old notices',()=>{
 const {start,other}=fixture();install(start,relation(start,other));const c=run(start),before=canonicalJson(c),v=unreadKboRelationNotices(c),notice=v.find(n=>n.definitionId==='E95')!;assert.ok(notice);assert.ok(v.some(n=>n.definitionId==='E94'));for(const row of v)assert.deepEqual(Object.keys(row).sort(),['eventKey','eventVersion','definitionId','title','body','relationKey','type','otherPlayerKey','otherName','otherInCurrentWorld','seasonKey','occurredWorldDay','targetScreen'].sort());
 const input={eventKey:notice.eventKey,eventVersion:notice.eventVersion,command:'OPEN_RELATIONS'},read=resolveKboRelationNotice(c,c.revision,input).career;
 assert.equal(read.revision,c.revision+1);assert.deepEqual(read.phaseContext,c.phaseContext);for(const key of ['world','records','health','relationships','days','development','traits'] as const)assert.equal(canonicalJson(read[key]),canonicalJson(c[key]));assert.deepEqual(read.relationNotices.filter(e=>e.definitionId==='E94'),c.relationNotices.filter(e=>e.definitionId==='E94'));assert.ok(!unreadKboRelationNotices(read).some(e=>e.eventKey===notice.eventKey));
 assert.throws(()=>resolveKboRelationNotice(read,read.revision,input));assert.throws(()=>resolveKboRelationNotice(c,c.revision-1,input));assert.throws(()=>resolveKboRelationNotice(c,c.revision,{...input,eventVersion:notice.eventVersion+1}));assert.throws(()=>resolveKboRelationNotice(c,c.revision,{...input,command:'ACK_EVENT'}));assert.equal(canonicalJson(c),before);
});

test('bench-only registration, same team, other game, retired and already reunited relations do not create E95',()=>{
 const {end,g}=fixture(),own=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(end.protagonistKey))!.evidence,opponent=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.teamKey!==own.teamKey)!.evidence;
 const bench=opponent.roster.find(k=>!Object.hasOwn(g.batting,k)&&!Object.hasOwn(g.pitching,k))!,same=own.appearances.find(a=>a.playerKey!==end.protagonistKey)!.playerKey,otherGame=Object.values(end.records.games).find(x=>x.scope.seasonKey===end.world.seasonKey&&!Object.hasOwn(x.batting,end.protagonistKey))!,elsewhere=Object.keys(otherGame.batting)[0]!;assert.ok(bench);
 for(const [other,stage] of [[bench,'SEPARATED'],[same,'SEPARATED'],[elsewhere,'SEPARATED'],[opponent.appearances[0]!.playerKey,'RETIRED'],[opponent.appearances[0]!.playerKey,'REUNITED_OPPONENT']] as const){const c=structuredClone(end);c.relationships.relations=[relation(c,other,stage)];const before=canonicalJson(c);settleKboOpponentReunions(c,g.worldDay);assert.equal(canonicalJson(c),before);}
});

test('unclosed days, corrupt registrations and invalid historical evidence reject atomically instead of inventing a meeting',()=>{
 const {start,end,g,other}=fixture();install(start,relation(start,other));assert.throws(()=>settleKboOpponentReunions(start,g.worldDay),/DAY_NOT_CLOSED/);
 for(const mutate of [(c:KboCareer)=>{c.health.games=c.health.games.filter(h=>!(h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(other)));},(c:KboCareer)=>{const h=c.health.games.find(h=>h.evidence.gameKey===g.gameKey)!;c.health.games=[...c.health.games,structuredClone(h)];},(c:KboCareer)=>{c.relationships.relations=[...c.relationships.relations,{...relation(c,'foreign'),primaryPlayerKey:'foreign'}];}]){const c=structuredClone(end);install(c,relation(c,other));mutate(c);const before=canonicalJson(c);assert.throws(()=>settleKboOpponentReunions(c,g.worldDay));assert.equal(canonicalJson(c),before);}
 const reunited=run(start);for(const mutate of [(c:KboCareer)=>{delete c.records.games[g.gameKey];},(c:KboCareer)=>{c.records.games[g.gameKey]!.batting[other]!.games=0;},(c:KboCareer)=>{c.relationNotices.find(e=>e.definitionId==='E95')!.resume.registrationKey='foreign';}]){const c=structuredClone(reunited);mutate(c);const before=canonicalJson(c);assert.throws(()=>unreadKboRelationNotices(c));assert.equal(canonicalJson(c),before);}
});

test('postseason hook uses a real final game without generating a direct-duel win or modifying permanent state',()=>{
 const f=fixture(),start=f.end,club=start.world.clubs.find(t=>t.id===start.protagonistClubId)!,me=start.world.players[start.protagonistKey]!,replace=club.firstTeam.find(k=>start.world.players[k]!.kind===me.kind&&start.world.players[k]!.position===me.position)!;assert.ok(replace);club.firstTeam=club.firstTeam.map(k=>k===replace?me.simulationKey:k);start.registration={...start.registration,firstTeam:true,competitionKey:'KBO'};
 const others=start.world.clubs.filter(t=>t.id!==club.id).slice(0,4).map(t=>t.id),seeds=[...others.slice(0,3),club.id,others[3]!];start.phaseContext={phase:'POSTSEASON_PROGRESS',postseason:createKboPostseason(start.world.seasonKey,seeds),nextWorldDay:f.g.worldDay+1,pendingGame:null};
 const dry=run(start,true),g=Object.values(dry.records.games).find(g=>g.scope.phase==='POSTSEASON')!,own=dry.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(me.simulationKey))!.evidence,other=dry.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.teamKey!==own.teamKey)!.evidence.appearances[0]!.playerKey;assert.ok(Object.hasOwn(g.batting,me.simulationKey));install(start,relation(start,other));const actual=run(start,true);
 const notice=kboOpponentReunionNoticeRows(actual)[0]!;assert.equal(notice.definitionId,'E95');assert.deepEqual(actual.records,dry.records);assert.deepEqual(actual.world,dry.world);assert.deepEqual(actual.traits,dry.traits);assert.equal(actual.relationNotices.find(e=>e.eventKey===notice.eventKey)!.resume.phase,'POSTSEASON_PROGRESS');
});

test('cross-kind opponent meeting does not fabricate a duel, WIN, or hidden trait qualification',()=>{
 const {start,end,g}=fixture(),own=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.roster.includes(end.protagonistKey))!.evidence,opponent=end.health.games.find(h=>h.evidence.gameKey===g.gameKey&&h.evidence.teamKey!==own.teamKey)!.evidence,other=opponent.appearances.find(a=>Object.hasOwn(g.pitching,a.playerKey))!.playerKey;
 install(start,relation(start,other));const c=run(start);assert.equal(kboOpponentReunionNoticeRows(c).length,1);assert.deepEqual(c.records,end.records);assert.deepEqual(c.traits,end.traits);assert.ok(!c.relationships.relations.flatMap(r=>r.milestones).some(m=>m.evidenceKey.includes('WIN')));
});

test('reading a completed legacy day does not backfill an opponent reunion',()=>{
 const {end,other}=fixture();install(end,relation(end,other));const before=canonicalJson(end);
 assert.equal(kboRelationshipListView(end).find(r=>r.otherPlayerKey===other)!.stage,'SEPARATED');
 assert.ok(!unreadKboRelationNotices(end).some(e=>e.definitionId==='E95'));assert.equal(canonicalJson(end),before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalJson} from '../src/game.js';
import {unreadUsRelationNotices,resolveUsRelationNotice} from '../src/us-relations.js';
import {settleUsOpponentReunions,usTeamReunionNoticeRows} from '../src/us-reunion-events.js';
import type {UsCareer} from '../src/us-career-entry.js';
import {fixture,relation} from './us-reunion-fixture.js';

/** Native first US regular day; the separated pair is a controlled history prefix. */
function sameTeam(){
 const {end,gameKey}=fixture(),g=end.records.games[gameKey]!,own=end.health.games.find(h=>h.evidence.gameKey===gameKey&&h.evidence.roster.includes(end.protagonistKey))!.evidence,mate=own.roster.find(k=>k!==end.protagonistKey)!;
 const r={...relation(end,mate),type:'TEAMMATE' as const};r.relationKey=JSON.stringify(['TEAMMATE',r.normalPairKey]);end.relationships.relations=[...end.relationships.relations,r];return {end,r,mate,day:g.worldDay,gameKey};
}
test('actual shared US registration creates one E96 REUNITED_TEAM, even for a bench mate, and reads only its notice',()=>{
 const {end,r,day,gameKey}=sameTeam(),before=canonicalJson(end);
 settleUsOpponentReunions(end,day,'REGULAR');assert.notEqual(canonicalJson(end),before);
 const rel=end.relationships.relations.find(x=>x.relationKey===r.relationKey)!;assert.equal(rel.stage,'REUNITED_TEAM');assert.deepEqual(rel.milestones.slice(0,2),r.milestones);
 const rows=usTeamReunionNoticeRows(end);assert.equal(rows.length,1);assert.equal(rows[0]!.definitionId,'E96');
 const e=unreadUsRelationNotices(end).find(n=>n.definitionId==='E96')!;assert.ok(e);assert.equal(JSON.parse(String(end.relationNotices.find(n=>n.eventKey===e.eventKey)!.evidence.fields.sharedTeamRegistrationReceiptId))[2],gameKey);assert.doesNotMatch(JSON.stringify(e),/abilities|potential|seed|fatigue/);
 const snap=canonicalJson(end);settleUsOpponentReunions(end,day,'REGULAR');assert.equal(canonicalJson(end),snap);
 const input={eventKey:e.eventKey,eventVersion:e.eventVersion,command:'OPEN_RELATIONS'},read=resolveUsRelationNotice(end,end.revision,input);assert.equal(read.navigation.relationKey,r.relationKey);assert.equal(read.career.revision,end.revision+1);assert.ok(!unreadUsRelationNotices(read.career).some(n=>n.eventKey===e.eventKey));assert.throws(()=>resolveUsRelationNotice(read.career,read.career.revision,input));
 const forged=structuredClone(end);forged.relationNotices.find(n=>n.definitionId==='E96')!.resume.registrationKey='foreign';assert.throws(()=>usTeamReunionNoticeRows(forged),/INVALID_US_TEAM_REUNION_NOTICE/);
 const gone=structuredClone(end);delete gone.records.games[gameKey];assert.throws(()=>usTeamReunionNoticeRows(gone));
});
test('opponents never create E96; a former opponent later reunites as teammates',()=>{
 const f=fixture(),c=structuredClone(f.end),day=c.records.games[f.gameKey]!.worldDay;c.relationships.relations=[relation(c,f.other)];
 settleUsOpponentReunions(c,day,'REGULAR');assert.equal(c.relationships.relations[0]!.stage,'REUNITED_OPPONENT');assert.equal(usTeamReunionNoticeRows(c).length,0);
 const t=sameTeam();t.end.relationships.relations.find(x=>x.relationKey===t.r.relationKey)!.stage='REUNITED_OPPONENT' as UsCareer['relationships']['relations'][number]['stage'];settleUsOpponentReunions(t.end,t.day,'REGULAR');assert.equal(t.end.relationships.relations.find(x=>x.relationKey===t.r.relationKey)!.stage,'REUNITED_TEAM');
});

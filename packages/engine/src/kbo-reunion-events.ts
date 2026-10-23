import type {KboCareer} from './kbo-career-entry.js';
import type {PlayerRelationship} from './relationships.js';
import type {GameContribution} from './records.js';
import type {EventInstance} from './events.js';
import {createWorldEvent,enqueueWorldEvent,resolveEventChoice,eventDefinition} from './events.js';
import {canonicalJson} from './game.js';

function assertRelation(c:KboCareer,r:PlayerRelationship){
 if(r.primaryPlayerKey!==c.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
}
/** Sides come from the game's immutable registrations, never today's club membership. */
function meeting(c:KboCareer,r:PlayerRelationship,g:GameContribution){
 const played=(key:string)=>(g.batting[key]?.games??0)>0||(g.pitching[key]?.games??0)>0;
 if(!['KBO','FUTURES'].includes(g.scope.leagueKey)||!['REGULAR','POSTSEASON'].includes(g.scope.phase)||!played(r.primaryPlayerKey)||!played(r.otherPlayerKey))return null;
 const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence);
 // The existing military team has no health registration ledger. Do not invent its side evidence.
 if(Object.hasOwn(g.teams,'SANGMU')&&rows.length<2)return null;
 if(Object.keys(g.teams).length!==2||rows.length!==2||new Set(rows.map(h=>h.teamKey)).size!==2||rows.some(h=>h.seasonKey!==g.scope.seasonKey||h.day!==g.worldDay||!h.teamKey.startsWith(g.scope.leagueKey+':')||!Object.hasOwn(g.teams,h.teamKey.slice(g.scope.leagueKey.length+1))||new Set(h.roster).size!==h.roster.length||new Set(h.appearances.map(a=>a.playerKey)).size!==h.appearances.length||h.appearances.some(a=>!h.roster.includes(a.playerKey))))throw new RangeError('INVALID_KBO_REUNION_REGISTRATION');
 const side=(key:string)=>{const own=rows.filter(h=>h.roster.includes(key));if(own.length!==1||!own[0]!.appearances.some(a=>a.playerKey===key))throw new RangeError('INVALID_KBO_REUNION_REGISTRATION');return own[0]!;};
 const primary=side(r.primaryPlayerKey),other=side(r.otherPlayerKey);return primary.teamKey===other.teamKey?null:primary;
}

/** Caller owns the closed-day transaction. Historical games are not scanned or backfilled. */
export function settleKboOpponentReunions(c:KboCareer,day:number):void {
 if(c.days?.seasonKey!==c.world.seasonKey||c.days.days.at(-1)?.day!==day)throw new RangeError('KBO_REUNION_DAY_NOT_CLOSED');
 if(!c.relationships.relations.some(r=>r.stage==='SEPARATED'))return;
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.worldDay===day).sort((a,b)=>a.gameKey<b.gameKey?-1:1);
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(r.stage!=='SEPARATED')return r;
  const separated=r.milestones.findLast(m=>m.stage==='SEPARATED');if(!separated)throw new RangeError('INVALID_KBO_REUNION_SEPARATION');
  const matches=games.flatMap(g=>{const side=meeting(c,r,g);return side?[{g,side}]:[];});if(matches.length>1)throw new RangeError('DOUBLE_BOOKED_KBO_REUNION');const match=matches[0];if(!match)return r;
  const {g,side}=match,event=createWorldEvent({definitionId:'E95',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,stageEvidenceId:separated.evidenceKey,actualMeetingGameId:g.gameKey}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:g.scope.phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS',competitionKey:g.scope.leagueKey,registrationKey:side.teamKey.slice(g.scope.leagueKey.length+1),sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey))throw new RangeError('KBO_REUNION_STAGE_CHANGED');
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_OPPONENT' as const,milestones:[...r.milestones,{stage:'REUNITED_OPPONENT' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}

function source(c:KboCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,matches=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=matches[0];
 if(event.definitionId!=='E95'||event.worldKey!==c.world.worldKey||matches.length!==1||!r)throw new RangeError('INVALID_KBO_REUNION_NOTICE');assertRelation(c,r);
 const stage=r.milestones.findIndex(m=>m.stage==='SEPARATED'&&m.evidenceKey===f.stageEvidenceId),reunion=r.milestones.findIndex(m=>m.stage==='REUNITED_OPPONENT'&&m.evidenceKey===event.evidenceKey&&m.worldDay===event.occurredWorldDay),g=typeof f.actualMeetingGameId==='string'?c.records.games[f.actualMeetingGameId]:undefined;
 if(stage<0||reunion<=stage||!g||g.scope.seasonKey!==event.seasonKey||g.worldDay!==event.occurredWorldDay||canonicalJson(f)!==canonicalJson({relationId:r.relationKey,stageEvidenceId:r.milestones[stage]!.evidenceKey,actualMeetingGameId:g.gameKey}))throw new RangeError('INVALID_KBO_REUNION_NOTICE');
 const side=meeting(c,r,g);if(!side||event.resume.phase!==(g.scope.phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS')||event.resume.competitionKey!==g.scope.leagueKey||event.resume.registrationKey!==side.teamKey.slice(g.scope.leagueKey.length+1))throw new RangeError('INVALID_KBO_REUNION_NOTICE');return r;
}
export function kboOpponentReunionNoticeRows(c:KboCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E95').flatMap(e=>{const r=source(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E95');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E95' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
export function prepareKboOpponentReunionRead(c:KboCareer,input:{eventKey:string;eventVersion:number;command:string}){
 const found=c.relationNotices.filter(e=>e.eventKey===input.eventKey);if(found.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const e=found[0]!,r=source(c,e),selected=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});
 return {event:selected.event,navigation:{...selected.navigation!,relationKey:r.relationKey}};
}

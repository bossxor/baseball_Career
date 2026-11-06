import type {UsCareer} from './us-career-entry.js';
import type {PlayerRelationship} from './relationships.js';
import type {GameContribution} from './records.js';
import type {EventInstance} from './events.js';
import {createWorldEvent,enqueueWorldEvent,resolveEventChoice,eventDefinition} from './events.js';
import {canonicalJson} from './game.js';

function assertRelation(c:UsCareer,r:PlayerRelationship){
 if(r.primaryPlayerKey!==c.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
}
/** Sides come from the game's immutable registrations, never today's club membership. */
function meeting(c:UsCareer,r:PlayerRelationship,g:GameContribution){
 const played=(key:string)=>(g.batting[key]?.games??0)>0||(g.pitching[key]?.games??0)>0;
 if(!['ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey)||!['REGULAR','POSTSEASON'].includes(g.scope.phase)||!played(r.primaryPlayerKey)||!played(r.otherPlayerKey))return null;
 const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence);
 if(Object.keys(g.teams).length!==2||rows.length!==2||new Set(rows.map(h=>h.teamKey)).size!==2||rows.some(h=>h.seasonKey!==g.scope.seasonKey||h.day!==g.worldDay||!h.teamKey.startsWith(g.scope.leagueKey+':')||!Object.hasOwn(g.teams,h.teamKey.slice(g.scope.leagueKey.length+1))||new Set(h.roster).size!==h.roster.length||new Set(h.appearances.map(a=>a.playerKey)).size!==h.appearances.length||h.appearances.some(a=>!h.roster.includes(a.playerKey))))throw new RangeError('INVALID_US_REUNION_REGISTRATION');
 const side=(key:string)=>{const own=rows.filter(h=>h.roster.includes(key));if(own.length!==1||!own[0]!.appearances.some(a=>a.playerKey===key))throw new RangeError('INVALID_US_REUNION_REGISTRATION');return own[0]!;};
 const primary=side(r.primaryPlayerKey),other=side(r.otherPlayerKey);return primary.teamKey===other.teamKey?null:primary;
}

/** Same-team registration in one real game row (bench included). Today's club membership is never consulted. */
function sharedRegistration(c:UsCareer,r:PlayerRelationship,g:GameContribution){
 if(!['ROOKIE','A','AA','AAA','MLB'].includes(g.scope.leagueKey)||!['REGULAR','POSTSEASON'].includes(g.scope.phase))return null;
 const rows=c.health.games.filter(h=>h.evidence.gameKey===g.gameKey).map(h=>h.evidence);
 if(Object.keys(g.teams).length!==2||rows.length!==2||new Set(rows.map(h=>h.teamKey)).size!==2||rows.some(h=>h.seasonKey!==g.scope.seasonKey||h.day!==g.worldDay||!h.teamKey.startsWith(g.scope.leagueKey+':')||!Object.hasOwn(g.teams,h.teamKey.slice(g.scope.leagueKey.length+1))||new Set(h.roster).size!==h.roster.length))throw new RangeError('INVALID_US_REUNION_REGISTRATION');
 const team=rows.find(h=>h.roster.includes(r.primaryPlayerKey)&&h.roster.includes(r.otherPlayerKey));if(!team)return null;
 if(rows.some(h=>h!==team&&(h.roster.includes(r.primaryPlayerKey)||h.roster.includes(r.otherPlayerKey))))throw new RangeError('INVALID_US_REUNION_REGISTRATION');
 return {side:team,key:JSON.stringify(['us-shared-registration',r.relationKey,g.gameKey,[...team.roster].sort()])};
}

/** Caller owns the closed-day transaction. Historical games are not scanned or backfilled. */
export function settleUsOpponentReunions(c:UsCareer,day:number,phase:'REGULAR'|'POSTSEASON'='REGULAR'):void {
 if(phase==='REGULAR'?c.season?.days.at(-1)?.day!==day:c.phaseContext.phase!=='POSTSEASON_PROGRESS'||c.phaseContext.nextWorldDay!==day+1||!c.phaseContext.gameEvidence.length)throw new RangeError('US_REUNION_DAY_NOT_CLOSED');
 if(!c.relationships.relations.some(r=>r.stage==='SEPARATED'||r.stage==='REUNITED_OPPONENT'))return;
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===c.world.seasonKey&&g.worldDay===day&&g.scope.phase===phase).sort((a,b)=>a.gameKey<b.gameKey?-1:1);
 let notices=structuredClone([...c.relationNotices]);const seen=new Set<string>();
 const relations=c.relationships.relations.map(r=>{
  assertRelation(c,r);if(seen.has(r.relationKey))throw new RangeError('DUPLICATE_CAREER_RELATION');seen.add(r.relationKey);
  if(r.stage==='REUNITED_OPPONENT'||r.stage==='SEPARATED'){const t=teamReunion(c,r,games,day,phase,notices);if(t){notices=t.notices;return t.relation;}}
  if(r.stage!=='SEPARATED')return r;
  const separated=r.milestones.findLast(m=>m.stage==='SEPARATED');if(!separated)throw new RangeError('INVALID_US_REUNION_SEPARATION');
  const matches=games.flatMap(g=>{if(phase==='POSTSEASON'&&c.phaseContext.phase==='POSTSEASON_PROGRESS'&&!c.phaseContext.gameEvidence.includes(canonicalJson(g)))throw new RangeError('US_REUNION_DAY_NOT_CLOSED');const side=meeting(c,r,g);return side?[{g,side}]:[];});if(matches.length>1)throw new RangeError('DOUBLE_BOOKED_US_REUNION');const match=matches[0];if(!match)return r;
  const {g,side}=match,event=createWorldEvent({definitionId:'E95',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,stageEvidenceId:separated.evidenceKey,actualMeetingGameId:g.gameKey}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:g.scope.phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS',competitionKey:g.scope.leagueKey,registrationKey:side.teamKey.slice(g.scope.leagueKey.length+1),sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
  if(r.milestones.some(m=>m.evidenceKey===event.evidenceKey))throw new RangeError('US_REUNION_STAGE_CHANGED');
  notices=enqueueWorldEvent(notices,event).events;return {...r,stage:'REUNITED_OPPONENT' as const,milestones:[...r.milestones,{stage:'REUNITED_OPPONENT' as const,evidenceKey:event.evidenceKey,worldDay:day}]};
 });
 c.relationships={...c.relationships,relations};c.relationNotices=notices;
}

function teamReunion(c:UsCareer,r:PlayerRelationship,games:GameContribution[],day:number,phase:'REGULAR'|'POSTSEASON',notices:EventInstance[]){
 const matches=games.flatMap(g=>{const m=sharedRegistration(c,r,g);return m?[{g,...m}]:[];});if(matches.length>1)throw new RangeError('DOUBLE_BOOKED_US_REUNION');const m=matches[0];if(!m)return null;
 if(!r.milestones.some(x=>x.stage==='SEPARATED'))throw new RangeError('INVALID_US_REUNION_SEPARATION');
 const {g,side,key}=m,event=createWorldEvent({definitionId:'E96',worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,evidence:{version:1,type:'RELATIONS',fields:{relationId:r.relationKey,sharedTeamRegistrationReceiptId:key}},resume:{worldKey:c.world.worldKey,seasonKey:g.scope.seasonKey,phase:phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS',competitionKey:g.scope.leagueKey,registrationKey:side.teamKey.slice(g.scope.leagueKey.length+1),sourceRevision:c.revision+1},sourceSequence:c.events.length+notices.length+1,worldDay:day});
 if(r.milestones.some(x=>x.evidenceKey===event.evidenceKey))return null;
 return {notices:enqueueWorldEvent(notices,event).events,relation:{...r,stage:'REUNITED_TEAM' as const,milestones:[...r.milestones,{stage:'REUNITED_TEAM' as const,evidenceKey:event.evidenceKey,worldDay:day}]}};
}
function teamSource(c:UsCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,matches=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=matches[0],receipt=typeof f.sharedTeamRegistrationReceiptId==='string'?(()=>{try{return JSON.parse(f.sharedTeamRegistrationReceiptId);}catch{return null;}})():null;
 if(event.definitionId!=='E96'||event.worldKey!==c.world.worldKey||matches.length!==1||!r||!Array.isArray(receipt)||receipt.length!==4||receipt[0]!=='us-shared-registration'||receipt[1]!==r.relationKey||typeof receipt[2]!=='string')throw new RangeError('INVALID_US_TEAM_REUNION_NOTICE');assertRelation(c,r);
 const g=c.records.games[receipt[2]],index=r.milestones.findIndex(m=>m.stage==='REUNITED_TEAM'&&m.evidenceKey===event.evidenceKey&&m.worldDay===event.occurredWorldDay);
 if(!g||g.scope.seasonKey!==event.seasonKey||g.worldDay!==event.occurredWorldDay||index<0||!r.milestones.slice(0,index).some(m=>m.stage==='SEPARATED'))throw new RangeError('INVALID_US_TEAM_REUNION_NOTICE');
 const m=sharedRegistration(c,r,g);if(!m||m.key!==f.sharedTeamRegistrationReceiptId||event.resume.phase!==(g.scope.phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS')||event.resume.competitionKey!==g.scope.leagueKey||event.resume.registrationKey!==m.side.teamKey.slice(g.scope.leagueKey.length+1)||canonicalJson(f)!==canonicalJson({relationId:r.relationKey,sharedTeamRegistrationReceiptId:m.key}))throw new RangeError('INVALID_US_TEAM_REUNION_NOTICE');return r;
}
function source(c:UsCareer,event:EventInstance){
 enqueueWorldEvent([],event);const f=event.evidence.fields,matches=c.relationships.relations.filter(r=>r.relationKey===f.relationId),r=matches[0];
 if(event.definitionId!=='E95'||event.worldKey!==c.world.worldKey||matches.length!==1||!r)throw new RangeError('INVALID_US_REUNION_NOTICE');assertRelation(c,r);
 const stage=r.milestones.findIndex(m=>m.stage==='SEPARATED'&&m.evidenceKey===f.stageEvidenceId),reunion=r.milestones.findIndex(m=>m.stage==='REUNITED_OPPONENT'&&m.evidenceKey===event.evidenceKey&&m.worldDay===event.occurredWorldDay),g=typeof f.actualMeetingGameId==='string'?c.records.games[f.actualMeetingGameId]:undefined;
 if(stage<0||reunion<=stage||!g||g.scope.seasonKey!==event.seasonKey||g.worldDay!==event.occurredWorldDay||canonicalJson(f)!==canonicalJson({relationId:r.relationKey,stageEvidenceId:r.milestones[stage]!.evidenceKey,actualMeetingGameId:g.gameKey}))throw new RangeError('INVALID_US_REUNION_NOTICE');
 const side=meeting(c,r,g);if(!side||event.resume.phase!==(g.scope.phase==='POSTSEASON'?'POSTSEASON_PROGRESS':'SEASON_PROGRESS')||event.resume.competitionKey!==g.scope.leagueKey||event.resume.registrationKey!==side.teamKey.slice(g.scope.leagueKey.length+1))throw new RangeError('INVALID_US_REUNION_NOTICE');return r;
}
export function usOpponentReunionNoticeRows(c:UsCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E95'&&!['KBO','FUTURES'].includes(c.records.games[String(e.evidence.fields.actualMeetingGameId)]?.scope.leagueKey??'')).flatMap(e=>{const r=source(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E95');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E95' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
/** E96 rows. Carried KBO E96 notices use another receipt owner and are left to the KBO reader. */
export function usTeamReunionNoticeRows(c:UsCareer){
 return c.relationNotices.filter(e=>e.definitionId==='E96'&&usReceipt(e)).flatMap(e=>{const r=teamSource(c,e);if(e.status!=='OPEN')return [];const d=eventDefinition('E96');return [{eventKey:e.eventKey,eventVersion:e.version,definitionId:'E96' as const,title:d.title,body:d.body,relationKey:r.relationKey,type:r.type,otherPlayerKey:r.otherPlayerKey,seasonKey:e.seasonKey,occurredWorldDay:e.occurredWorldDay,targetScreen:'S42' as const}];});
}
const usReceipt=(e:EventInstance)=>String(e.evidence.fields.sharedTeamRegistrationReceiptId).startsWith('["us-shared-registration"');
export const isUsTeamReunion=(e:EventInstance)=>e.definitionId==='E96'&&usReceipt(e);
export function prepareUsOpponentReunionRead(c:UsCareer,input:{eventKey:string;eventVersion:number;command:string}){
 const found=c.relationNotices.filter(e=>e.eventKey===input.eventKey);if(found.length!==1)throw new RangeError('UNKNOWN_RELATION_NOTICE');const e=found[0]!,r=e.definitionId==='E96'?teamSource(c,e):source(c,e),selected=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_RELATIONS']});
 return {event:selected.event,navigation:{...selected.navigation!,relationKey:r.relationKey}};
}

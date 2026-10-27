import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,validateEvent} from './events.js';
import type {GameContribution} from './records.js';
const appeared=(row:GameContribution|undefined,key:string)=>!!row&&(row.batting[key]?.PA??0)+(row.pitching[key]?.BF??0)>0;
const earlier=(a:GameContribution,b:GameContribution)=>Number(a.scope.seasonKey)<Number(b.scope.seasonKey)||a.scope.seasonKey===b.scope.seasonKey&&(a.worldDay<b.worldDay||a.worldDay===b.worldDay&&a.gameKey<b.gameKey);
/** Internal game-commit hook: actual FINAL contribution, never an accepted call-up or roster listing. */
export function queueUsMajorDebut(c:UsCareer,gameKey:string):void {
 const row=Object.hasOwn(c.records.games,gameKey)?c.records.games[gameKey]:undefined,key=c.protagonistKey;
 if(!row||row.scope.leagueKey!=='MLB'||row.scope.phase==='INTERNATIONAL'||!appeared(row,key)||!Object.hasOwn(row.teams,c.protagonistOrganizationId)||c.events.some(e=>e.definitionId==='E65'&&e.evidence.fields.playerSimulationKey===key))return;
 // Legacy first appearances remain history; do not invent a new debut when the old save had no E65.
 const first=c.season?.firstAppearance.MLB;
 if(first&&first.gameKey!==gameKey||[...(c.minorYears??[]),...(c.majorYears??[])].some(y=>y.season.firstAppearance.MLB))return;
 if(Object.values(c.records.games).some(g=>g.gameKey!==gameKey&&g.scope.leagueKey==='MLB'&&g.scope.phase!=='INTERNATIONAL'&&appeared(g,key)&&earlier(g,row)))return;
 const d=eventDefinition('E65'),event=createWorldEvent({definitionId:'E65',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:key,promotionDecisionIdOrFirstAppearanceId:gameKey}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:'MLB',registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:row.worldDay});
 c.events=[...c.events,event];
}
export function resolveUsMajorDebut(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'ACK_EVENT'}):UsCareer {
 assertUsCareerRevision(c,revision);const e=c.events.find(e=>e.eventKey===input.eventKey),key=c.protagonistKey;
 if(!e||e.definitionId!=='E65'||e.evidence.fields.playerSimulationKey!==key||e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey)throw new RangeError('INVALID_US_DEBUT_NOTICE');
 validateEvent(e);const gameKey=String(e.evidence.fields.promotionDecisionIdOrFirstAppearanceId),row=Object.hasOwn(c.records.games,gameKey)?c.records.games[gameKey]:undefined;
 if(!row||row.scope.leagueKey!=='MLB'||row.scope.phase==='INTERNATIONAL'||row.scope.seasonKey!==e.seasonKey||row.worldDay!==e.occurredWorldDay||!appeared(row,key)||!Object.hasOwn(row.teams,c.protagonistOrganizationId))throw new RangeError('US_DEBUT_EVIDENCE_CHANGED');
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['ACK_EVENT']});
 return {...c,revision:c.revision+1,events:c.events.map(x=>x.eventKey===e.eventKey?picked.event:x)};
}

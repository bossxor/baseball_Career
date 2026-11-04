import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsAnnualFunding} from './us-minor-history.js';
import {usMajorFreeAgencyPreview} from './us-major-renewal.js';
import {createWorldEvent,validateEvent,resolveEventChoice,completeBlockingEvent} from './events.js';

export interface UsMajorFaWindow {windowId:string;sourceRevision:number;eventKey:string}
const id=(c:UsCareer)=>JSON.stringify(['us-major-fa-window',c.activation.receiptKey,c.world.seasonKey,c.contract.contractKey]);
/** Pure root-reader guard. No root assertion or quote calls here, so native readers cannot recurse. */
export function assertUsMajorFaWindow(c:UsCareer):void {
 const w=c.majorFaWindow;if(w===undefined)return;
 if(!w||typeof w!=='object'||w.windowId!==id(c)||!Number.isSafeInteger(w.sourceRevision)||w.sourceRevision<c.activation.sourceRevision||w.sourceRevision>=c.revision||typeof w.eventKey!=='string'||!['SEASON_REVIEW','RETIRE_CONFIRM'].includes(c.phaseContext.phase)||c.contract.type!=='US_MAJOR')throw new RangeError('INVALID_US_MAJOR_FA_WINDOW');
 const events=c.events.filter(e=>e.eventKey===w.eventKey),e=events[0];
 if(events.length!==1||!e||e.status!=='OPEN'||e.definitionId!=='E66'||e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.evidence.fields.contractWindowIdOrReturnProgramId!==w.windowId||e.evidence.fields.stage!=='MAJOR_EXPIRED'||e.resume.phase!=='SEASON_REVIEW'||e.resume.competitionKey!==c.registration.level||e.resume.registrationKey!==c.protagonistOrganizationId||e.resume.sourceRevision!==w.sourceRevision+1)throw new RangeError('INVALID_US_MAJOR_FA_WINDOW');validateEvent(e);
}
/** Only this already-validated contract window can accompany its signing/retirement owner. */
export function hasOnlyUsMajorFaWindowEvent(c:UsCareer):boolean {return !!c.majorFaWindow&&c.events.some(e=>e.status==='OPEN'&&e.eventKey===c.majorFaWindow!.eventKey)&&c.events.every(e=>e.status!=='OPEN'||e.eventKey===c.majorFaWindow!.eventKey);}
export function openUsMajorFaWindow(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);if(c.majorFaWindow)return c;usMajorFreeAgencyPreview(c,funding);
 const windowId=id(c),day=Object.values(c.records.games).reduce((n,g)=>g.scope.seasonKey===c.world.seasonKey?Math.max(n,g.worldDay):n,c.season!.lastDay),e=createWorldEvent({definitionId:'E66',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:windowId,stage:'MAJOR_EXPIRED'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:c.registration.level,registrationKey:c.protagonistOrganizationId,sourceRevision:revision+1},sourceSequence:c.events.reduce((n,e)=>Math.max(n,e.sourceSequence),0)+1,worldDay:day});
 const next:UsCareer={...c,revision:revision+1,majorFaWindow:{windowId,sourceRevision:revision,eventKey:e.eventKey},events:[...c.events,e]};assertUsCareerRevision(next,next.revision);return next;
}
export function usMajorFaWindowView(c:UsCareer){assertUsCareerRevision(c,c.revision);const w=c.majorFaWindow;if(!w)return null;const e=c.events.find(e=>e.eventKey===w.eventKey)!;return {eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,commands:['OPEN_CAREER_OFFERS','OPEN_RETURN']};}
export function resolveUsMajorFaWindow(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}){
 assertUsCareerRevision(c,revision);const w=c.majorFaWindow,e=c.events.find(e=>e.eventKey===input.eventKey);if(!w||!e||e.eventKey!==w.eventKey||c.phaseContext.phase!=='SEASON_REVIEW')throw new RangeError('INVALID_US_MAJOR_FA_EVENT');
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS','OPEN_RETURN']});if(!picked.navigation||picked.domain||picked.event.status!=='OPEN')throw new RangeError('INVALID_US_MAJOR_FA_NAVIGATION');return {career:c,navigation:picked.navigation};
}
/** Internal transaction preparation only: discard this result unless the actual signing/retirement commits. */
export function completeUsMajorFaWindow(c:UsCareer,command:'ACCEPT_CAREER_OFFER'|'CONFIRM_RETIRE',receiptKey:string):UsCareer {
 if(!c.majorFaWindow)return c;assertUsMajorFaWindow(c);const e=c.events.find(e=>e.eventKey===c.majorFaWindow!.eventKey)!,closed=completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey,command},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[]}),next={...c,events:c.events.map(n=>n.eventKey===e.eventKey?closed:n)};delete next.majorFaWindow;return next;
}

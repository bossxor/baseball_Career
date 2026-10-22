import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboMilitaryPlan,kboMilitaryStatus,applyToSangmu} from './kbo-military-state.js';
import {createWorldEvent,eventDefinition,resolveEventChoice,completeEventDomain} from './events.js';
import type {EventInstance} from './events.js';
import {canonicalJson} from './game.js';

const task=(c:KboCareer)=>JSON.stringify(['kbo-military-plan',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);
function eligible(c:KboCareer){
 const age=c.world.players[c.protagonistKey]!.age;
 if(c.phaseContext.phase!=='SEASON_REVIEW' || c.seasonClose?.seasonKey!==c.world.seasonKey || kboMilitaryStatus(c)!=='UNRESOLVED' || age<19 || age>=45)throw new RangeError('KBO_MILITARY_PLAN_UNAVAILABLE');
 return age;
}
function current(c:KboCareer,key:string):EventInstance {
 const age=eligible(c),e=c.events.find(e=>e.eventKey===key),id=age>=27?'E54':'E49';
 if(!e || e.definitionId!==id || e.status!=='OPEN' || e.worldKey!==c.world.worldKey || e.seasonKey!==c.world.seasonKey || canonicalJson(e.evidence.fields)!==canonicalJson({playerSimulationKey:c.protagonistKey,serviceTaskIdOrServicePeriodId:task(c),stage:'PLAN'}))throw new RangeError('INVALID_KBO_MILITARY_PLAN');
 return e;
}
function choices(c:KboCareer,e:EventInstance){
 const plan=kboMilitaryPlan(c);
 return eventDefinition(e.definitionId).choices.map(x=>{
  const reason=x.command==='APPLY_MILITARY_TEAM'?(!plan.canApply?'SANGMU_AGE_UNAVAILABLE':Object.hasOwn(c.health.injuries,c.protagonistKey)?'INJURED':null):x.command==='DEFER_SERVICE'&&plan.mustResolveBeforeNextSeason?'MILITARY_PLAN_REQUIRED':null;
  return {command:x.command,label:x.label,available:reason===null,reason};
 });
}
/** Explicit offseason plan opening, like E30 offer opening. Mandatory year guard does not depend on opening this event. */
export function openKboMilitaryPlan(source:KboCareer,expectedRevision:number):KboCareer {
 assertKboCareerRevision(source,expectedRevision);const age=eligible(source),id=age>=27?'E54':'E49';
 const existing=source.events.find(e=>['E49','E54'].includes(e.definitionId)&&e.seasonKey===source.world.seasonKey&&e.evidence.fields.serviceTaskIdOrServicePeriodId===task(source));
 if(existing){if(existing.status==='OPEN')current(source,existing.eventKey);return structuredClone(source);}
 if(source.events.some(e=>e.status==='OPEN'&&e.definitionId!=='E30'))throw new RangeError('KBO_MILITARY_PLAN_UNAVAILABLE');
 const d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:{playerSimulationKey:source.protagonistKey,serviceTaskIdOrServicePeriodId:task(source),stage:'PLAN'}},resume:{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:source.days!.days.at(-1)!.day});
 const c=structuredClone(source);if(c.schemaVersion<3)c.schemaVersion=3;c.events=[...c.events,event];c.revision++;return c;
}
/** START_SERVICE only opens S26 review. Actual enlistment still requires confirmKboActiveService. */
export function resolveKboMilitaryPlan(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:string}){
 assertKboCareerRevision(source,expectedRevision);const event=current(source,input.eventKey),available=choices(source,event).filter(c=>c.available).map(c=>c.command);
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:available};
 const selected=resolveEventChoice(event,input.eventVersion,input.command,null,context);if(!selected.domain)throw new RangeError('INVALID_KBO_MILITARY_PLAN');
 const resolved=completeEventDomain(event,selected.domain,JSON.stringify(['kbo-military-plan-choice',task(source),input.command]),context);
 let c=structuredClone(source);if(c.schemaVersion<3)c.schemaVersion=3;c.events=c.events.map(e=>e.eventKey===event.eventKey?resolved:e);
 if(input.command==='APPLY_MILITARY_TEAM')c=applyToSangmu(c,c.revision);else c.revision++;
 return {career:c,navigation:input.command==='START_SERVICE'?{targetScreen:'S26',sourceEventKey:event.eventKey}:null};
}
export function kboMilitaryPlanEventView(c:KboCareer){
 assertKboCareerRevision(c,c.revision);
 return c.events.filter(e=>e.status==='OPEN'&&['E49','E54'].includes(e.definitionId)&&e.seasonKey===c.world.seasonKey).map(e=>{
  current(c,e.eventKey);const d=eventDefinition(e.definitionId),p=kboMilitaryPlan(c);
  return {eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:d.title,body:d.body,age:p.age,deadlineAge:28,futureGraceSeasons:p.futureGraceSeasons,choices:choices(c,e)};
 });
}

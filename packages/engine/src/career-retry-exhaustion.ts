import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerPreparation} from './career-preparation.js';
import {highSchoolCareerRouteView} from './high-school-route.js';
import {careerUsDirectView} from './career-us.js';
import {assertKboDraft} from './kbo-draft.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,validateEvent} from './events.js';

export interface AmateurRetryExit {version:1;eventKey:string;sourceBasis:string;status:'PENDING'|'ARCHIVED';receiptKey?:string}
function exhausted(c:HighSchoolCareer){
 assertCareerPreparation(c);const r=c.retryCareer!,p=c.preparationSeason!,k=c.kboRecruitment;
 if(c.world.leagueKey!=='INDEPENDENT'||p.phase!=='PREPARATION_RESULT'||r.careerPreparationUsed!==3||!k||!k.program.result)throw new RangeError('RETRY_ASSESSMENT_REQUIRED');
 assertKboDraft(k.world,k.program);
 const routeSource={...c,events:c.events.filter(e=>e.eventKey!==c.retryExit?.eventKey)};
 const college=highSchoolCareerRouteView(routeSource).colleges.some(o=>o.eligible),resume=c.collegeAdmission?.status==='ENROLLED'&&c.collegeAdmission.yearsCompleted<4,us=c.usRecruitment&&careerUsDirectView(c).visible;
 const militaryComplete=c.collegeService?.status==='RESUMED'||c.national?.militaryStatus==='COMPLETED';
 if(college||resume||us||!militaryComplete||k.program.signing||k.program.result.round&&k.program.decision!=='DECLINED')throw new RangeError('RETRY_ROUTES_REMAIN');
 return canonicalJson([c.world,c.records,c.health,c.retryCareer,c.preparationSeason!.result,k.program,c.collegeAdmission??null,c.usRecruitment?.program??null,c.national??null,c.collegeService??null]);
}
/** Fresh actual domestic result and every still-legal college/US/military route must be resolved first. */
export function openAmateurRetryExhaustion(source:HighSchoolCareer,revision:number):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='CAREER_ROUTE'||source.events.some(e=>e.status==='OPEN'))throw new RangeError('RETRY_EXHAUSTION_NOT_AVAILABLE');
 const basis=exhausted(source),c=structuredClone(source),task=JSON.stringify(['retry-exhausted',source.preparationSeason!.result!.receiptKey]);
 const e=createWorldEvent({definitionId:'E35',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition('E35').evidenceDomain,fields:{playerSimulationKey:c.world.protagonistKey,retirementTaskOrReceiptId:task}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'INDEPENDENT',registrationKey:c.world.protagonistSchoolId,sourceRevision:revision+1},sourceSequence:c.events.length+1,worldDay:c.days.days.at(-1)!.day});
 c.retryExit={version:1,eventKey:e.eventKey,sourceBasis:basis,status:'PENDING'};c.events=[...c.events,e];c.revision++;return c;
}
export function confirmAmateurRetryExhaustion(source:HighSchoolCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'}):HighSchoolCareer {
 assertCareerRevision(source,revision);const x=source.retryExit,e=source.events.find(e=>e.eventKey===input.eventKey);
 if(!x||x.status!=='PENDING'||x.eventKey!==e?.eventKey||e.definitionId!=='E35'||input.command!=='CONFIRM_RETIRE'||source.phaseContext.phase!=='CAREER_ROUTE')throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');validateEvent(e);
 if(x.sourceBasis!==exhausted(source))throw new RangeError('PREVIEW_STALE');
 const receipt=JSON.stringify(['amateur-retry-retirement',e.evidenceKey]),resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:receipt,command:input.command},{worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[input.command]}),c=structuredClone(source);
 c.events=c.events.map(x=>x.eventKey===e.eventKey?resolved:x);c.retryExit={...x,status:'ARCHIVED',receiptKey:receipt};c.phaseContext={phase:'ARCHIVED'};c.revision++;return c;
}

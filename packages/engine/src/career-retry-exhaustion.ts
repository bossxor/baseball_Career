import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerPreparation} from './career-preparation.js';
import {highSchoolCareerRouteView} from './high-school-route.js';
import {careerUsDirectView} from './career-us.js';
import {assertKboDraft} from './kbo-draft.js';
import {careerKboDraftView} from './career-kbo.js';
import {collegeLeaveElapsedYears} from './college-service.js';
import {assertCollegeNationalState} from './college-national.js';
import {canonicalJson} from './game.js';
import {canonicalSeal,matchesCanonicalSeal} from './canonical-seal.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,validateEvent} from './events.js';

export interface AmateurRetryExit {version:1;eventKey:string;sourceBasis:string;status:'PENDING'|'ARCHIVED';receiptKey?:string}
function exhausted(c:HighSchoolCareer){
 assertCareerPreparation(c);const r=c.retryCareer!,p=c.preparationSeason!,k=c.kboRecruitment;
 if(c.world.leagueKey!=='INDEPENDENT'||p.phase!=='PREPARATION_RESULT'||r.careerPreparationUsed!==3||!k||!k.program.result)throw new RangeError('RETRY_ASSESSMENT_REQUIRED');
 assertKboDraft(k.world,k.program);
 const routeSource={...c,events:c.events.filter(e=>e.eventKey!==c.retryExit?.eventKey)};
 careerKboDraftView(routeSource);
 const college=highSchoolCareerRouteView(routeSource).colleges.some(o=>o.eligible),resume=c.collegeAdmission?.status==='ENROLLED'&&c.collegeAdmission.yearsCompleted<4,us=c.usRecruitment&&careerUsDirectView(c).visible;
 if(c.collegeService?.status==='RESUMED')collegeLeaveElapsedYears(c);if(c.national)assertCollegeNationalState(c);
 const militaryComplete=c.collegeService?.status==='RESUMED'||c.national?.militaryStatus==='COMPLETED'&&c.national.benefits.length>0&&c.national.athleteDutySettledSeasons?.length===3&&c.national.athleteDutySeasonsRemaining===0;
 if(college||resume||us||!militaryComplete||k.program.signing||k.program.result.round&&k.program.decision!=='DECLINED')throw new RangeError('RETRY_ROUTES_REMAIN');
 return canonicalSeal([c.world,c.records,c.health,c.retryCareer,c.preparationSeason!.result,k.program,c.collegeAdmission??null,c.usRecruitment?.program??null,c.national??null,c.collegeService??null]);
}
/** Fresh actual domestic result and every still-legal college/US/military route must be resolved first. */
export function openAmateurRetryExhaustion(source:HighSchoolCareer,revision:number):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.phaseContext.phase!=='CAREER_ROUTE'||source.events.some(e=>e.status==='OPEN'))throw new RangeError('RETRY_EXHAUSTION_NOT_AVAILABLE');
 const basis=exhausted(source),c=structuredClone(source),task=JSON.stringify(['retry-exhausted',source.preparationSeason!.result!.receiptKey]);
 const e=createWorldEvent({definitionId:'E35',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:eventDefinition('E35').evidenceDomain,fields:{playerSimulationKey:c.world.protagonistKey,retirementTaskOrReceiptId:task}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'CAREER_ROUTE',competitionKey:'INDEPENDENT',registrationKey:c.world.protagonistSchoolId,sourceRevision:revision+1},sourceSequence:c.events.length+1,worldDay:c.days.days.at(-1)!.day});
 c.retryExit={version:1,eventKey:e.eventKey,sourceBasis:basis,status:'PENDING'};c.events=[...c.events,e];c.revision++;return c;
}
function checkedAmateurExit(source:HighSchoolCareer){
 const x=source.retryExit,events=source.events.filter(e=>e.eventKey===x?.eventKey),e=events[0];
 if(!x||x.version!==1||!['PENDING','ARCHIVED'].includes(x.status)||events.length!==1||!e||source.phaseContext.phase!==(x.status==='PENDING'?'CAREER_ROUTE':'ARCHIVED'))throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');validateEvent(e);
 const fields={playerSimulationKey:source.world.protagonistKey,retirementTaskOrReceiptId:JSON.stringify(['retry-exhausted',source.preparationSeason?.result?.receiptKey])},receipt=JSON.stringify(['amateur-retry-retirement',e.evidenceKey]);
 if(e.definitionId!=='E35'||e.worldKey!==source.world.worldKey||e.seasonKey!==source.world.seasonKey||canonicalJson(e.evidence.fields)!==canonicalJson(fields)||e.resume.phase!=='CAREER_ROUTE'||e.resume.competitionKey!=='INDEPENDENT'||e.resume.registrationKey!==source.world.protagonistSchoolId||e.occurredWorldDay!==source.days.days.at(-1)?.day||e.resume.sourceRevision>source.revision||e.resume.sourceRevision<=source.preparationSeason!.revision)throw new RangeError('INVALID_AMATEUR_RETRY_EXIT');
 if(x.status==='PENDING'?(e.status!=='OPEN'||x.receiptKey!==undefined):(e.status!=='RESOLVED'||x.receiptKey!==receipt||e.resolution?.kind!=='DOMAIN'||e.resolution.command!=='CONFIRM_RETIRE'||e.resolution.receiptKey!==receipt))throw new RangeError('INVALID_AMATEUR_RETRY_EXIT');
 // Archive reads validate the original route evidence without reactivating the stored career.
 if(!matchesCanonicalSeal(x.sourceBasis,exhausted({...source,phaseContext:{phase:'CAREER_ROUTE'}})))throw new RangeError('PREVIEW_STALE');return {x,e,receipt};
}
export function amateurRetryExhaustionView(source:HighSchoolCareer){
 assertCareerRevision(source,source.revision);const {x,e}=checkedAmateurExit(source),key=source.world.protagonistKey,p=source.world.players[key]!;
 return {status:x.status,eventKey:e.eventKey,eventVersion:e.version,title:eventDefinition('E35').title,player:{simulationKey:key,name:p.name,age:p.age,kind:p.kind,position:p.position},careerPreparationUsed:source.retryCareer!.careerPreparationUsed,militaryStatus:'COMPLETED' as const,receiptKey:x.receiptKey??null,commands:x.status==='PENDING'?['CONFIRM_RETIRE']:[]};
}
export function confirmAmateurRetryExhaustion(source:HighSchoolCareer,revision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'}):HighSchoolCareer {
 assertCareerRevision(source,revision);if(source.retryExit?.status!=='PENDING'||input.command!=='CONFIRM_RETIRE')throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');const {x,e}=checkedAmateurExit(source);if(x.eventKey!==input.eventKey)throw new RangeError('RETRY_RETIREMENT_NOT_AVAILABLE');
 const receipt=JSON.stringify(['amateur-retry-retirement',e.evidenceKey]),resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:receipt,command:input.command},{worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[input.command]}),c=structuredClone(source);
 c.events=c.events.map(x=>x.eventKey===e.eventKey?resolved:x);c.retryExit={...x,status:'ARCHIVED',receiptKey:receipt};c.phaseContext={phase:'ARCHIVED'};c.revision++;return c;
}

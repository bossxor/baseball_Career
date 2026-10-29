import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import type {EventInstance} from './events.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice,completeBlockingEvent,cancelInvalidEvent} from './events.js';
import {assertKboDraft} from './kbo-draft.js';
import {assertUsDirect} from './us-direct.js';
import {canShowUsDirect} from './draft.js';
import {collegeCupSchedule} from './college-cup.js';
import {canonicalJson} from './game.js';

type NoticeId='E05'|'E06'|'E56'|'E57'|'E71'|'E72';
export interface CareerRouteNoticeLedger {version:1;worldKey:string;playerKey:string;notices:readonly EventInstance[]}
export type RouteNoticeCareer=HighSchoolCareer & {routeNotices?:CareerRouteNoticeLedger};
function ledger(c:RouteNoticeCareer):CareerRouteNoticeLedger {return c.routeNotices??{version:1,worldKey:c.world.worldKey,playerKey:c.world.protagonistKey,notices:[]};}
const domestic=(c:RouteNoticeCareer)=>[...(c.previousKboRecruitments??[]),...(c.kboRecruitment?[c.kboRecruitment]:[])];
const overseas=(c:RouteNoticeCareer)=>[...(c.previousUsRecruitments??[]),...(c.usRecruitment?[c.usRecruitment]:[])];
function admissionProven(c:RouteNoticeCareer){
 const a=c.collegeAdmission,e=a&&c.events.find(e=>e.definitionId==='E04'&&e.status==='RESOLVED'&&e.resolution?.command==='ENROLL_COLLEGE'&&e.resolution.receiptKey===a.admissionKey);
 if(!a||a.playerKey!==c.world.protagonistKey||!e||e.worldKey!==c.world.worldKey||e.evidence.fields.careerSimulationKey!==a.playerKey||a.admissionKey!==JSON.stringify(['college-admission',JSON.stringify(['hs-route',c.world.worldKey,e.seasonKey,a.playerKey]),a.collegeId]))return null;
 return a;
}
function cupEvidence(c:RouteNoticeCareer){
 const a=admissionProven(c),cup=c.collegeCup;
 if(!a||c.world.leagueKey!=='COLLEGE'||!cup||!cup.seeds.includes(c.world.protagonistSchoolId))return null;
 const semis=collegeCupSchedule(c).filter(g=>g.round===0),own=semis.find(g=>g.homeTeamKey===c.world.protagonistSchoolId||g.awayTeamKey===c.world.protagonistSchoolId);
 if(semis.length!==2||!own)return null;
 return {playerSimulationKey:c.world.protagonistKey,enrollmentId:a.admissionKey,academicYear:a.academicYear,sourceTaskId:JSON.stringify(['college-cup-entry',c.world.worldKey,c.world.seasonKey,a.admissionKey,own.simulationKey])};
}
/** Pure guard: proofs read native domain programs directly, never invoke a root reader or producer. */
export function assertCareerRouteNotices(c:RouteNoticeCareer):void {
 const l=ledger(c);
 if(l.version!==1||l.worldKey!==c.world.worldKey||l.playerKey!==c.world.protagonistKey||!Array.isArray(l.notices)||new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length)throw new RangeError('INVALID_CAREER_ROUTE_NOTICES');
 for(const e of l.notices){
  validateEvent(e);if(!['E05','E06','E56','E57','E71','E72'].includes(e.definitionId)||e.worldKey!==l.worldKey||e.resume.sourceRevision>c.revision)throw new RangeError('INVALID_CAREER_ROUTE_NOTICE');
  const f=e.evidence.fields;
  if(e.definitionId==='E05'||e.definitionId==='E06'){
   const r=domestic(c).find(r=>r.program.assessmentKey===f.draftProgramId);if(!r)throw new RangeError('ROUTE_NOTICE_SOURCE_MISSING');assertKboDraft(r.world,r.program);
   const result=r.program.result;if(r.world.worldKey!==l.worldKey||e.seasonKey!==String(Number(r.world.seasonKey)-1)||r.program.input.player.simulationKey!==l.playerKey||!result||result.receiptKey!==f.resultReceiptId||e.definitionId!==(result.round?'E05':'E06'))throw new RangeError('ROUTE_NOTICE_DRAFT_EVIDENCE_CHANGED');
  }else if(e.definitionId==='E56'||e.definitionId==='E57'){
   const r=overseas(c).find(r=>e.definitionId==='E56'?r.program.input.assessmentKey===f.routeDecisionIdOrContractId:r.program.offers.some(o=>o.offerKey===f.routeDecisionIdOrContractId));if(!r)throw new RangeError('ROUTE_NOTICE_SOURCE_MISSING');assertUsDirect(r.world,r.program);
   if(r.world.worldKey!==l.worldKey||e.seasonKey!==String(Number(r.world.seasonKey)-1)||r.program.input.player.simulationKey!==l.playerKey||f.playerSimulationKey!==l.playerKey||f.stage!==(e.definitionId==='E56'?'VALID_US_ROUTE':'US_CONTRACT_OFFER')||e.occurredWorldDay<r.program.input.issuedWorldDay||e.occurredWorldDay>=r.program.input.expiresWorldDay||!canShowUsDirect({scoutScore:r.program.score,eligible:r.program.input.eligible,validOfferCount:r.program.offers.length}))throw new RangeError('ROUTE_NOTICE_US_EVIDENCE_CHANGED');
  }else if(e.definitionId==='E71'){
   const a=admissionProven(c);if(!a||f.playerSimulationKey!==l.playerKey||f.enrollmentId!==a.admissionKey||f.sourceTaskId!==a.admissionKey||f.academicYear!==1)throw new RangeError('ROUTE_NOTICE_ADMISSION_EVIDENCE_CHANGED');
  }else{
   const current=cupEvidence(c),archive=c.previousSeasons?.find(s=>s.world.seasonKey===e.seasonKey&&s.collegeCup);
   if(current&&e.seasonKey===c.world.seasonKey){if(canonicalJson(current)!==canonicalJson(f))throw new RangeError('ROUTE_NOTICE_CUP_EVIDENCE_CHANGED');}
   else {const a=admissionProven(c);if(!archive||!a||typeof f.academicYear!=='number'||![1,2,3,4].includes(f.academicYear)||archive.collegeResult?.academicYear!==f.academicYear)throw new RangeError('ROUTE_NOTICE_CUP_SOURCE_MISSING');const historical={...c,...archive,collegeAdmission:{...a,academicYear:f.academicYear as 1|2|3|4}};if(canonicalJson(cupEvidence(historical))!==canonicalJson(f))throw new RangeError('ROUTE_NOTICE_CUP_EVIDENCE_CHANGED');}
  }
  if(e.status==='RESOLVED'||e.status==='CANCELLED_WITH_REASON'&&e.definitionId==='E06'){
   const fresh:EventInstance={...e,version:1,status:'OPEN',resolution:null};
   if(e.resolution?.kind==='DOMAIN'||e.status==='CANCELLED_WITH_REASON'){const proof={...l,notices:[fresh]};settleNotices(c,proof);if(canonicalJson(proof.notices[0]!.resolution)!==canonicalJson(e.resolution))throw new RangeError('ROUTE_NOTICE_COMMIT_RECEIPT_CHANGED');}
   else {const command=e.resolution?.command,selected=command&&resolveEventChoice(fresh,1,command,null,context(fresh));if(!selected||canonicalJson(selected.event.resolution)!==canonicalJson(e.resolution))throw new RangeError('INVALID_ROUTE_NOTICE_RESOLUTION');}
  }
 }
}
function append(c:RouteNoticeCareer,l:CareerRouteNoticeLedger,id:NoticeId,fields:Record<string,string|number>,day:number,deadline?:number){
 const d=eventDefinition(id),e=createWorldEvent({definitionId:id,worldKey:l.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields},resume:{worldKey:l.worldKey,seasonKey:c.world.seasonKey,phase:c.phaseContext.phase,competitionKey:c.world.leagueKey??'HS',registrationKey:c.world.protagonistSchoolId,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day,...(deadline===undefined?{}:{deadlineWorldDay:deadline})});
 if(!l.notices.some(old=>old.eventKey===e.eventKey))l.notices=[...l.notices,e];
}
function context(e:EventInstance,day=e.occurredWorldDay){return {worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:day,eligibleCommands:eventDefinition(e.definitionId).choices.map(x=>x.command)};}
function settleNotices(c:RouteNoticeCareer,l:CareerRouteNoticeLedger){
 l.notices=l.notices.map(e=>{
  if(e.status!=='OPEN')return e;const f=e.evidence.fields;
  if(e.definitionId==='E05'||e.definitionId==='E06'){
   const r=domestic(c).find(r=>r.program.assessmentKey===f.draftProgramId)!;
   if(r.program.signing)return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:r.program.signing.receiptKey,command:'ACCEPT_CAREER_OFFER'},context(e));
   const signedUs=e.definitionId==='E06'?overseas(c).find(u=>u.program.signing?.playerKey===l.playerKey&&u.world.worldKey===l.worldKey&&u.program.signing.seasonKey===String(Number(e.seasonKey)+1)):undefined;
   if(signedUs){assertUsDirect(signedUs.world,signedUs.program);return cancelInvalidEvent(e,e.version,'US_CONTRACT_SIGNED',context(e,signedUs.program.signing!.signedWorldDay));}
   if(r.program.decision==='DECLINED')return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['draft-decision',r.program.assessmentKey,'DECLINED',r.program.version]),command:'DECLINE_DRAFT'},context(e));
   const admission=admissionProven(c);if(admission&&admission.entryYear===Number(e.seasonKey)+1)return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:admission.admissionKey,command:'ENROLL_COLLEGE'},context(e));
   const episode=c.retryCareer?.episodes.find(p=>p.receiptKey===r.program.result!.receiptKey),archive=episode&&c.previousSeasons?.find(s=>s.yearEndReceiptKey===JSON.stringify(['preparation-entry',c.world.worldKey,episode.seasonKey,c.world.protagonistKey,episode.receiptKey]));
   if(archive)return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:archive.yearEndReceiptKey,command:'START_PREPARATION'},context(e));
  }else if(e.definitionId==='E56'||e.definitionId==='E57'){
   const r=overseas(c).find(r=>e.definitionId==='E56'?r.program.input.assessmentKey===f.routeDecisionIdOrContractId:r.program.offers.some(o=>o.offerKey===f.routeDecisionIdOrContractId))!;
   if(r.program.signing&&(e.definitionId==='E56'||r.program.signing.offer.offerKey===f.routeDecisionIdOrContractId))return completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:r.program.signing.receiptKey,command:'ACCEPT_CAREER_OFFER'},context(e,r.program.signing.signedWorldDay));
   const reason=r.program.decision==='DECLINED'?'US_OFFERS_DECLINED':r.program.signing?'ANOTHER_US_OFFER_SIGNED':r.closedBy?'OTHER_ROUTE_COMMITTED':r.currentWorldDay>=r.program.input.expiresWorldDay?'US_OFFERS_EXPIRED':null;
   if(reason)return cancelInvalidEvent(e,e.version,reason,context(e,Math.max(e.occurredWorldDay,r.currentWorldDay)));
  }
  return e;
 });
}
/** Called inside the successful native writer result. Publication does not spend a root revision or modify domain state. */
export function refreshCareerRouteNotices<T extends RouteNoticeCareer>(c:T):T {
 assertCareerRouteNotices(c);if(c.collegeYearEnd||c.kboYearEnd||c.usYearEnd)return c;const l=structuredClone(ledger(c)),day=c.days.days.at(-1)?.day??0;
 const r=c.kboRecruitment;if(r?.program.result){assertKboDraft(r.world,r.program);append(c,l,r.program.result.round?'E05':'E06',{draftProgramId:r.program.assessmentKey,resultReceiptId:r.program.result.receiptKey},day);}
 const u=c.usRecruitment;
 if(u&&u.closedBy===undefined&&u.program.decision==='PENDING'&&u.currentWorldDay<u.program.input.expiresWorldDay){assertUsDirect(u.world,u.program);if(canShowUsDirect({scoutScore:u.program.score,validOfferCount:u.program.offers.length,eligible:u.program.input.eligible})){append(c,l,'E56',{playerSimulationKey:l.playerKey,routeDecisionIdOrContractId:u.program.input.assessmentKey,stage:'VALID_US_ROUTE'},u.currentWorldDay,u.program.input.expiresWorldDay);for(const offer of u.program.offers)append(c,l,'E57',{playerSimulationKey:l.playerKey,routeDecisionIdOrContractId:offer.offerKey,stage:'US_CONTRACT_OFFER'},u.currentWorldDay,u.program.input.expiresWorldDay);}}
 const a=admissionProven(c);if(a?.status==='ADMITTED')append(c,l,'E71',{playerSimulationKey:l.playerKey,enrollmentId:a.admissionKey,academicYear:1,sourceTaskId:a.admissionKey},day);
 const cup=cupEvidence(c);if(cup)append(c,l,'E72',cup,day);
 settleNotices(c,l);const next=canonicalJson(l)===canonicalJson(ledger(c))?c:{...c,routeNotices:l};assertCareerRouteNotices(next);return next;
}
/** Navigation/ACK never signs, declines, enters a school, or changes a focus plan. */
export function resolveCareerRouteNotice<T extends RouteNoticeCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:string}){
 assertCareerRevision(c,revision);assertCareerRouteNotices(c);if(c.collegeYearEnd||c.kboYearEnd||c.usYearEnd)throw new RangeError('ROUTE_NOTICE_YEAR_END_SEALED');
 const l=structuredClone(ledger(c));settleNotices(c,l);const e=l.notices.find(e=>e.eventKey===input.eventKey);if(!e)throw new RangeError('ROUTE_NOTICE_NOT_FOUND');
 const selected=resolveEventChoice(e,input.eventVersion,input.command,null,context(e));if(selected.domain)throw new RangeError('ROUTE_NOTICE_REQUIRES_DOMAIN_COMMAND');l.notices=l.notices.map(old=>old.eventKey===e.eventKey?selected.event:old);
 const changed=canonicalJson(l)!==canonicalJson(ledger(c));return {career:changed?{...c,revision:revision+1,routeNotices:l}:c,navigation:selected.navigation};
}
export function careerRouteNoticesView(c:RouteNoticeCareer){
 assertCareerRouteNotices(c);return {notices:ledger(c).notices.map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,status:e.status,title:eventDefinition(e.definitionId).title,commands:e.status==='OPEN'?eventDefinition(e.definitionId).choices.filter(x=>x.dispatchClass!=='DOMAIN').map(x=>x.command):[],requiresDomainCommands:e.status==='OPEN'?eventDefinition(e.definitionId).choices.filter(x=>x.dispatchClass==='DOMAIN').map(x=>x.command):[]}))};
}

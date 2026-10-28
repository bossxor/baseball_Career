import {overall} from '@playball/rules';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {UsAnnualFunding} from './us-minor-history.js';
import {fundUsMinorYear} from './us-minor-history.js';
import {usContractPerformance,usTermCovers} from './us-contract-history.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {mlbServiceTime} from './us-service-time.js';
import {roleScore} from '@playball/rules';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,completeBlockingEvent,validateEvent} from './events.js';

export interface UsContractOffer {
 offerKey:string;clubId:string;clubName:string;initialLevel:'MLB';currency:'USD';annualSalaryUsd:number;years:number;guaranteedUsd:number;
 swapKey:string|null;nationalReleaseAllowed:boolean;militaryReturnOption:boolean;
}
export interface UsContractMarket {
 schemaVersion:1;marketKey:string;sourceRevision:number;targetSeasonKey:string;sourceBasis:string;freeAgent:boolean;
 funding:UsAnnualFunding[];offers:UsContractOffer[];status:'OPEN'|'ACCEPTED'|'DECLINED';acceptedOfferKey:string|null;eventKey:string;
}
export function usMajorContractTerms(ovr:number,performance:number,startingAge:number){
 if(!Number.isFinite(ovr)||ovr<0||ovr>100||!Number.isFinite(performance)||performance<0||performance>100||!Number.isSafeInteger(startingAge)||startingAge<19||startingAge>45)throw new RangeError('INVALID_US_CONTRACT_VALUE');
 const annualSalaryUsd=Math.round(Math.min(40000000,Math.max(800000,Math.max(800000,(ovr-65)*400000)*(.8+.4*performance/100)))),years=startingAge<=29?5:startingAge<=32?3:startingAge<=35?2:1;
 return {annualSalaryUsd,years,guaranteedUsd:annualSalaryUsd*years};
}
function source(c:UsCareer){
 const p=c.world.players[c.protagonistKey]!,t=overall(p.kind,p.abilities),targetSeasonKey=String(Number(c.world.seasonKey)+1),service=mlbServiceTime(c.records,c.health,c.protagonistKey),initial=c.amateurHistory.usRecruitment!.program.signing!,controlUsed=Number(c.world.seasonKey)-Number(initial.seasonKey)+1;
 return {p,ovr:t.sumUnits/t.denominator,targetSeasonKey,terms:usMajorContractTerms(t.sumUnits/t.denominator,usContractPerformance(c,c.world.seasonKey,c.registration.level,p.kind),p.age+1),freeAgent:service.freeAgentEligible||c.rights.sourceType==='FREE_AGENT'||c.contract.type==='US_MINOR'&&controlUsed>=c.contract.controlSeasons};
}
const marketKey=(c:UsCareer)=>JSON.stringify(['us-contract-market',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);
function basis(c:UsCareer,funding:readonly UsAnnualFunding[]){
 const p=c.world.players[c.protagonistKey]!,emergency=c.season?.emergency;
 return canonicalJson({worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,player:p,contract:c.contract,rights:c.rights,registration:c.registration,inventory:c.inventory,recordRevision:c.records.revision,performance:usContractPerformance(c,c.world.seasonKey,c.registration.level,p.kind),service:mlbServiceTime(c.records,c.health,c.protagonistKey),funding,candidates:c.world.organizations.map(o=>({clubId:o.id,players:o.levels.MLB.map(k=>c.world.players[k]),injured:o.levels.MLB.filter(k=>Object.hasOwn(c.health.injuries,k))})),emergency:emergency??null});
}
function offers(c:UsCareer,funding:readonly UsAnnualFunding[]):UsContractOffer[]{
 const s=source(c),budget=fundUsMinorYear(c.inventory,s.targetSeasonKey,Object.keys(c.world.players).sort(),funding,c.protagonistOrganizationId,0),emergency=new Set(Object.entries(c.season?.emergency?.entries??{}).filter(([,e])=>e.releasedDay===null).flatMap(([k,e])=>[k,e.replacedKey]));
 if(s.ovr<75)return [];
 return c.world.organizations.filter(o=>s.freeAgent||o.id===c.protagonistOrganizationId).flatMap(org=>{
  const b=budget.clubs.find(o=>o.id===org.id)!;if(b.availableBudgetUsd<s.terms.guaranteedUsd)return [];
  const ownHere=org.levels.MLB.includes(c.protagonistKey),swapKey=ownHere?null:org.levels.MLB.filter(k=>{const p=c.world.players[k]!;return !emergency.has(k)&&p.kind===s.p.kind&&p.position===s.p.position&&p.age<45&&!Object.hasOwn(c.health.injuries,k);}).sort((a,b)=>roleScore(c.world.players[a]!.kind,c.world.players[a]!.abilities,c.world.players[a]!.position)-roleScore(c.world.players[b]!.kind,c.world.players[b]!.abilities,c.world.players[b]!.position)||(a<b?-1:1))[0];
  if(!ownHere&&!swapKey)return [];
  return [{offerKey:JSON.stringify(['us-contract-offer',marketKey(c),org.id]),clubId:org.id,clubName:org.name,initialLevel:'MLB' as const,currency:'USD' as const,...s.terms,swapKey:swapKey??null,nationalReleaseAllowed:b.nationalReleaseAllowed,militaryReturnOption:b.militaryReturnOption}];
 }).sort((a,b)=>a.clubId<b.clubId?-1:1).slice(0,3);
}
export function assertUsContractMarket(c:UsCareer):void {
 const m=c.contractMarket;if(!m)return;
 if(m.schemaVersion!==1||m.marketKey!==marketKey(c)||m.targetSeasonKey!==String(Number(c.world.seasonKey)+1)||!Number.isSafeInteger(m.sourceRevision)||m.sourceRevision<1||m.sourceRevision>=c.revision||!['OPEN','ACCEPTED','DECLINED'].includes(m.status)||m.sourceBasis!==basis(c,m.funding)||m.freeAgent!==source(c).freeAgent||canonicalJson(m.offers)!==canonicalJson(offers(c,m.funding)))throw new RangeError('INVALID_US_CONTRACT_MARKET');
 const event=c.events.find(e=>e.eventKey===m.eventKey);if(!event||event.worldKey!==c.world.worldKey||event.seasonKey!==c.world.seasonKey||event.resume.sourceRevision!==m.sourceRevision+1||event.resume.registrationKey!==c.protagonistOrganizationId||event.resume.competitionKey!==c.registration.level||event.evidence.fields.playerSimulationKey!==c.protagonistKey||event.definitionId!==(m.freeAgent?'E66':'E30')||(m.freeAgent?event.evidence.fields.contractWindowIdOrReturnProgramId:event.evidence.fields.contractWindowId)!==m.marketKey)throw new RangeError('INVALID_US_CONTRACT_MARKET');validateEvent(event);
 if(m.status==='OPEN'?(m.acceptedOfferKey!==null||event.status!=='OPEN'):m.status==='DECLINED'?(m.acceptedOfferKey!==null||event.status!=='RESOLVED'||event.resolution?.receiptKey!==JSON.stringify(['us-contract-declined',m.marketKey])):(!m.offers.some(o=>o.offerKey===m.acceptedOfferKey)||event.status!=='RESOLVED'||event.resolution?.receiptKey!==JSON.stringify(['us-contract-accepted',m.acceptedOfferKey])))throw new RangeError('INVALID_US_CONTRACT_MARKET');
}
export function prepareUsContractMarket(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);
 if(c.contractMarket){assertUsContractMarket(c);if(canonicalJson([...funding].sort((a,b)=>a.organizationId<b.organizationId?-1:1))!==canonicalJson(c.contractMarket.funding))throw new RangeError('US_CONTRACT_MARKET_CHANGED');return c;}
 const ready=usYearTransitionReadiness(c),s=source(c);
 if(ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED')||usTermCovers(c.contract,s.targetSeasonKey)||c.contract.type==='US_MINOR'&&!s.freeAgent)throw new RangeError('US_CONTRACT_NOT_AVAILABLE');
 const sortedFunding=funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:1),fixed=offers(c,sortedFunding),key=marketKey(c),id=s.freeAgent?'E66':'E30',d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:d.evidenceDomain,fields:s.freeAgent?{playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:key,stage:'OFFERS'}:{playerSimulationKey:c.protagonistKey,contractWindowId:key,sourceReceiptId:c.contract.contractKey}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:c.registration.level,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.length+1,worldDay:c.season!.lastDay});
 const market:UsContractMarket={schemaVersion:1,marketKey:key,sourceRevision:c.revision,targetSeasonKey:s.targetSeasonKey,sourceBasis:basis(c,sortedFunding),freeAgent:s.freeAgent,funding:sortedFunding,offers:fixed,status:'OPEN',acceptedOfferKey:null,eventKey:event.eventKey};
 const next={...c,revision:c.revision+1,contractMarket:market,events:[...c.events,event]};assertUsContractMarket(next);return next;
}
export function usContractMarketView(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const m=c.contractMarket;if(!m)return {status:'NOT_PREPARED' as const,freeAgent:false,offers:[],reason:'CONTRACT_NOT_PREPARED'};
 assertUsContractMarket(c);return {status:m.status,freeAgent:m.freeAgent,targetSeasonKey:m.targetSeasonKey,acceptedOfferKey:m.acceptedOfferKey,offers:m.offers.map(({offerKey,clubId,clubName,initialLevel,currency,annualSalaryUsd,years,guaranteedUsd,nationalReleaseAllowed,militaryReturnOption})=>({offerKey,clubId,clubName,initialLevel,currency,annualSalaryUsd,years,guaranteedUsd,nationalReleaseAllowed,militaryReturnOption})),reason:m.status==='DECLINED'?'DECLINED':m.offers.length?null:'NO_VALID_CLUB_BUDGET_OR_SLOT'};
}
export function acceptUsContractOffer(c:UsCareer,revision:number,offerKey:string):UsCareer {
 assertUsCareerRevision(c,revision);assertUsContractMarket(c);const m=c.contractMarket;
 if(!m||m.status!=='OPEN'||!m.offers.some(o=>o.offerKey===offerKey))throw new RangeError('US_CONTRACT_OFFER_NOT_AVAILABLE');
 const event=c.events.find(e=>e.eventKey===m.eventKey)!,closed=completeBlockingEvent(event,event.version,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['us-contract-accepted',offerKey]),command:'SIGN_US_CONTRACT'},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['SIGN_US_CONTRACT']});
 const next:UsCareer={...c,revision:c.revision+1,contractMarket:{...m,status:'ACCEPTED',acceptedOfferKey:offerKey},events:c.events.map(e=>e.eventKey===closed.eventKey?closed:e)};assertUsContractMarket(next);return next;
}
export function usContractForOffer(previous:UsCareer['contract'],m:UsContractMarket,offer:UsContractOffer):UsCareer['contract']{
 return {...previous,type:'US_MAJOR',contractKey:JSON.stringify(['us-contract',m.marketKey,offer.clubId]),seasonKey:m.targetSeasonKey,annualSalaryUsd:offer.annualSalaryUsd,signingBonusUsd:0,nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption,term:{startSeasonKey:m.targetSeasonKey,years:offer.years,guaranteedUsd:offer.guaranteedUsd}};
}

/** Explicit refusal also closes an empty market. It never signs a fallback or chooses retirement. */
export function declineUsContractOffers(c:UsCareer,revision:number):UsCareer {
 assertUsCareerRevision(c,revision);assertUsContractMarket(c);const m=c.contractMarket;
 if(!m||m.status!=='OPEN')throw new RangeError('US_CONTRACT_NOT_AVAILABLE');
 const event=c.events.find(e=>e.eventKey===m.eventKey)!,closed=completeBlockingEvent(event,event.version,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['us-contract-declined',m.marketKey]),command:'DECLINE_US_CONTRACTS'},{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['DECLINE_US_CONTRACTS']});
 const next:UsCareer={...c,revision:c.revision+1,contractMarket:{...m,status:'DECLINED',acceptedOfferKey:null},events:c.events.map(e=>e.eventKey===closed.eventKey?closed:e)};assertUsContractMarket(next);return next;
}

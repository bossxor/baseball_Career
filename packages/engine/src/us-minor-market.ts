import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {fundUsMinorYear} from './us-minor-history.js';
import type {UsAnnualFunding} from './us-minor-history.js';
import type {UsLevel} from './us-world.js';
import {recordTotals} from './records.js';
import {usCompetitionScore} from './us-levels.js';
import {createWorldEvent,resolveEventChoice,validateEvent} from './events.js';
import {canonicalJson} from './game.js';

export interface UsMinorOffer {
 offerKey:string;organizationId:string;organizationName:string;initialLevel:Exclude<UsLevel,'MLB'>;years:1;annualSalaryUsd:number;signingBonusUsd:0;currency:'USD';nationalReleaseAllowed:boolean;militaryReturnOption:boolean;competitorKey:string|null;competitorScore:number|null;
}
export interface UsMinorMarket {
 marketId:string;worldKey:string;seasonKey:string;targetSeasonKey:string;playerKey:string;sourceContractKey:string;sourceOrganizationId:string;sourceRevision:number;recordRevision:number;initialLevel:Exclude<UsLevel,'MLB'>;status:'OPEN';playerScore:number;funding:UsAnnualFunding[];offers:UsMinorOffer[];eventKey:string;
}
const marketId=(c:UsCareer)=>JSON.stringify(['us-minor-market',c.activation.receiptKey,c.world.seasonKey,c.contract.contractKey]);
const sortedFunding=(funding:readonly UsAnnualFunding[])=>funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:a.organizationId>b.organizationId?1:0);

/** Saved quotes are validated, never rerated from later corrected statistics. */
export function assertUsMinorMarket(c:UsCareer):void {
 const m=c.minorMarket;
 if(!m||typeof m!=='object'||!c.kboTransfer?.origin||m.marketId!==marketId(c)||m.status!=='OPEN'||m.worldKey!==c.world.worldKey||m.seasonKey!==c.world.seasonKey||m.targetSeasonKey!==String(Number(c.world.seasonKey)+1)||m.playerKey!==c.protagonistKey||m.sourceContractKey!==c.contract.contractKey||m.sourceOrganizationId!==c.protagonistOrganizationId||m.initialLevel!==c.registration.level||!['ROOKIE','A','AA','AAA'].includes(m.initialLevel)||c.contract.type!=='US_MINOR'||c.phaseContext.phase!=='SEASON_REVIEW'||!Number.isSafeInteger(m.sourceRevision)||m.sourceRevision<c.activation.sourceRevision||m.sourceRevision>=c.revision||!Number.isSafeInteger(m.recordRevision)||m.recordRevision<0||m.recordRevision>c.records.revision||!Number.isFinite(m.playerScore)||m.playerScore<0||m.playerScore>100||!Array.isArray(m.funding)||m.funding.some(f=>!f||typeof f!=='object')||!Array.isArray(m.offers)||m.offers.some(o=>!o||typeof o!=='object')||m.offers.length>4||new Set(m.offers.map(o=>o?.organizationId)).size!==m.offers.length||m.offers.filter(o=>o.organizationId!==m.sourceOrganizationId).length>3)throw new RangeError('INVALID_US_MINOR_MARKET');
 const funded=fundUsMinorYear(c.inventory,m.targetSeasonKey,c.inventory.registeredPlayerKeys,m.funding,m.sourceOrganizationId,0);
 for(const o of m.offers){const player=o.competitorKey===null?null:c.world.players[o.competitorKey],owner=c.world.organizations.find(org=>org.id===o.organizationId);if(o.organizationId!==m.sourceOrganizationId&&o.competitorKey===null||o.competitorKey!==null&&(!player||!owner?.levels[m.initialLevel].includes(o.competitorKey)||player.kind!==c.world.players[c.protagonistKey]!.kind||player.position!==c.world.players[c.protagonistKey]!.position))throw new RangeError('INVALID_US_MINOR_MARKET');const club=funded.clubs.find(x=>x.id===o.organizationId),org=c.world.organizations.find(x=>x.id===o.organizationId);if(!club||!org||o.offerKey!==JSON.stringify(['us-minor-offer',m.marketId,o.organizationId])||o.organizationName!==org.name||o.initialLevel!==m.initialLevel||o.years!==1||o.currency!=='USD'||o.annualSalaryUsd!==30000||o.signingBonusUsd!==0||o.nationalReleaseAllowed!==club.nationalReleaseAllowed||o.militaryReturnOption!==club.militaryReturnOption||club.availableBudgetUsd<30000||o.competitorKey!==null&&(typeof o.competitorKey!=='string'||!o.competitorKey)||(o.competitorKey===null)!==(o.competitorScore===null)||o.competitorScore!==null&&(!Number.isFinite(o.competitorScore)||o.competitorScore<0||o.competitorScore>100||o.organizationId!==m.sourceOrganizationId&&m.playerScore<=o.competitorScore))throw new RangeError('INVALID_US_MINOR_MARKET');}
 const e=c.events.find(e=>e.eventKey===m.eventKey);if(!e||e.definitionId!=='E66'||e.status!=='OPEN'||e.worldKey!==m.worldKey||e.seasonKey!==m.seasonKey||e.evidence.fields.playerSimulationKey!==m.playerKey||e.evidence.fields.contractWindowIdOrReturnProgramId!==m.marketId||e.evidence.fields.stage!=='MINOR_EXPIRED'||e.resume.phase!=='SEASON_REVIEW'||e.resume.competitionKey!==m.initialLevel||e.resume.registrationKey!==m.sourceOrganizationId||e.resume.sourceRevision!==m.sourceRevision+1)throw new RangeError('INVALID_US_MINOR_MARKET');validateEvent(e);
}

/** Trusted funding only; this freezes comparison data, not a salary reservation or a new contract. */
export function openUsMinorMarket(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);const fixed=sortedFunding(funding);
 if(c.minorMarket){if(canonicalJson(fixed)!==canonicalJson(c.minorMarket.funding))throw new RangeError('US_MINOR_MARKET_FUNDING_CHANGED');return c;}
 const ready=usYearTransitionReadiness(c);if(!c.kboTransfer?.origin||c.contract.type!=='US_MINOR'||c.registration.level==='MLB'||ready.remainingMinorControlSeasons!==0||ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MINOR_MARKET_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
 const id=marketId(c),level=c.registration.level,p=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:level,phase:'REGULAR',seasonKey:c.world.seasonKey}),score=usCompetitionScore(c,c.protagonistKey,level,totals),future=fundUsMinorYear(c.inventory,ready.targetSeasonKey,c.inventory.registeredPlayerKeys,fixed,c.protagonistOrganizationId,0);
 const candidate=(org:UsCareer['world']['organizations'][number]):UsMinorOffer|null=>{
  const club=future.clubs.find(x=>x.id===org.id)!;if(club.availableBudgetUsd<30000||org.id!==c.protagonistOrganizationId&&Object.values(org.levels).flat().length+(c.world.reserves?.[org.id]?.length??0)>=160)return null;
  const keys=org.levels[level].filter(k=>k!==c.protagonistKey&&c.world.players[k]!.kind===p.kind&&c.world.players[k]!.position===p.position&&!c.health.injuries[k]&&c.season?.emergency?.entries[k]?.releasedDay!==null),ranked=keys.map(key=>({key,score:usCompetitionScore(c,key,level,totals)})).sort((a,b)=>a.score-b.score||(a.key<b.key?-1:1)),weakest=ranked[0];
  if(org.id!==c.protagonistOrganizationId&&(!weakest||score<=weakest.score))return null;
  return {offerKey:JSON.stringify(['us-minor-offer',id,org.id]),organizationId:org.id,organizationName:org.name,initialLevel:level,years:1,annualSalaryUsd:30000,signingBonusUsd:0,currency:'USD',nationalReleaseAllowed:club.nationalReleaseAllowed,militaryReturnOption:club.militaryReturnOption,competitorKey:weakest?.key??null,competitorScore:weakest?.score??null};
 };
 const original=candidate(c.world.organizations.find(o=>o.id===c.protagonistOrganizationId)!),others=c.world.organizations.filter(o=>o.id!==c.protagonistOrganizationId).map(candidate).filter((o):o is UsMinorOffer=>o!==null).sort((a,b)=>Number(a.competitorScore!==null)-Number(b.competitorScore!==null)||(a.competitorScore??0)-(b.competitorScore??0)||(a.organizationId<b.organizationId?-1:1)).slice(0,3),day=Object.values(c.records.games).reduce((n,g)=>g.scope.seasonKey===c.world.seasonKey?Math.max(n,g.worldDay):n,0)+1;
 const event=createWorldEvent({definitionId:'E66',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:id,stage:'MINOR_EXPIRED'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:level,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.reduce((n,e)=>Math.max(n,e.sourceSequence),0)+1,worldDay:day});
 const next:UsCareer={...c,revision:c.revision+1,events:[...c.events,event],minorMarket:{marketId:id,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,targetSeasonKey:ready.targetSeasonKey,playerKey:c.protagonistKey,sourceContractKey:c.contract.contractKey,sourceOrganizationId:c.protagonistOrganizationId,sourceRevision:c.revision,recordRevision:c.records.revision,initialLevel:level,status:'OPEN',playerScore:score,funding:fixed,offers:[...(original?[original]:[]),...others],eventKey:event.eventKey}};assertUsCareerRevision(next,next.revision);return next;
}

export function usMinorMarketView(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const m=c.minorMarket;if(!m)throw new RangeError('US_MINOR_MARKET_NOT_OPEN');
 return {marketId:m.marketId,playerScore:m.playerScore,currentLevel:m.initialLevel,offers:structuredClone(m.offers),returnHome:{available:true,route:c.kboTransfer!.returnRights?'ORIGINAL_CLUB_PRIORITY' as const:'DOMESTIC_FA' as const,holderClubId:c.kboTransfer!.returnRights?.holderClubId??null}};
}
export function resolveUsMinorMarketEvent(c:UsCareer,revision:number,input:{eventKey:string;eventVersion:number;command:string}){
 assertUsCareerRevision(c,revision);const m=c.minorMarket,e=c.events.find(e=>e.eventKey===input.eventKey);if(!m||m.eventKey!==input.eventKey||!e)throw new RangeError('INVALID_US_MINOR_MARKET_EVENT');
 const picked=resolveEventChoice(e,input.eventVersion,input.command,null,{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS','OPEN_RETURN']});if(!picked.navigation||picked.domain||picked.event.status!=='OPEN')throw new RangeError('INVALID_US_MINOR_MARKET_NAVIGATION');return {career:c,navigation:picked.navigation};
}

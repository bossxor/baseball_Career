import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {stageUsControlledMajorYear,usYearTransitionReadiness} from './us-year-transition.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {fundUsMinorYear} from './us-minor-history.js';
import type {UsAnnualFunding} from './us-minor-history.js';
import {usMajorAnnualContract,usMajorFaContract,usMajorGuaranteedContract} from './us-major-history.js';
import type {UsMajorYearArchive} from './us-major-history.js';
import {usMajorContractValue,usMlbOfferYears} from './us-contract-value.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';

function quote(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const ready=usYearTransitionReadiness(c),guaranteed=(c.contract.years??1)>1;
 if(c.contract.type!=='US_MAJOR'||!guaranteed&&ready.mlbService.freeAgentEligible||ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MAJOR_RENEWAL_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
 const totals=recordTotals(c.records,{leagueKey:'MLB',phase:'REGULAR',seasonKey:c.world.seasonKey}),batting=structuredClone(totals.batting[c.protagonistKey]??emptyBatting()),pitching=structuredClone(totals.pitching[c.protagonistKey]??emptyPitching()),value=usMajorContractValue(c.world.players[c.protagonistKey]!,batting,pitching);
 return {ready,batting,pitching,value,guaranteed,annualSalaryUsd:guaranteed?c.contract.annualSalaryUsd:value.annualSalaryUsd,years:guaranteed?c.contract.years!-1:1 as const};
}
/** Salary/period only: annual organization funding is supplied by the server, never by a player's UI. */
export function usMajorRenewalPreview(c:UsCareer){
 const q=quote(c);return {sourceRevision:c.revision,nextSeasonKey:q.ready.targetSeasonKey,contractStartAge:q.ready.nextAge,clubId:c.protagonistOrganizationId,years:q.years,currency:'USD' as const,annualSalaryUsd:q.annualSalaryUsd,basis:q.value.basis,mlbService:q.ready.mlbService,guaranteed:q.guaranteed};
}
function market(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const ready=usYearTransitionReadiness(c);
 if(c.contract.type!=='US_MAJOR'||!ready.mlbService.freeAgentEligible||(c.contract.years??1)>1||ready.blockers.some(b=>b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('US_MAJOR_FA_NOT_AVAILABLE');
 auditUsClosedDays(c);auditUsCompletedPostseason(c);
 const totals=recordTotals(c.records,{leagueKey:'MLB',phase:'REGULAR',seasonKey:c.world.seasonKey}),batting=structuredClone(totals.batting[c.protagonistKey]??emptyBatting()),pitching=structuredClone(totals.pitching[c.protagonistKey]??emptyPitching()),value=usMajorContractValue(c.world.players[c.protagonistKey]!,batting,pitching),years=usMlbOfferYears(ready.nextAge);
 return {ready,batting,pitching,value,years};
}
/** Current-club offer only. Another organization's roster move is not signed here. */
export function usMajorFreeAgencyPreview(c:UsCareer,funding:readonly UsAnnualFunding[]){
 const q=market(c),added=funding.find(f=>f.organizationId===c.protagonistOrganizationId)?.addedBudgetUsd??0,budget=(c.inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)?.availableBudgetUsd??0)+added,offer={organizationId:c.protagonistOrganizationId,years:q.years,currency:'USD' as const,annualSalaryUsd:q.value.annualSalaryUsd};
 return {sourceRevision:c.revision,nextSeasonKey:q.ready.targetSeasonKey,contractStartAge:q.ready.nextAge,mlbService:q.ready.mlbService,offers:budget>=offer.annualSalaryUsd?[offer]:[]};
}
/** User2026-10-27: before six credited MLB seasons, renew for one year without resetting service or options. */
export function startNextUsMajorSeason(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);const q=quote(c),stage=stageUsControlledMajorYear(c,revision,q.guaranteed),registered=Object.keys(stage.world.players).sort(),sortedFunding=funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:1),nextContract=q.guaranteed?usMajorGuaranteedContract(c,c.contract,stage.targetSeasonKey):usMajorAnnualContract(c,c.contract,stage.targetSeasonKey,q.annualSalaryUsd);
 let inventory;try{inventory=fundUsMinorYear(c.inventory,stage.targetSeasonKey,registered,sortedFunding,c.protagonistOrganizationId,nextContract.annualSalaryUsd);}catch(error){if(error instanceof RangeError&&error.message==='US_MINOR_CONTRACT_BUDGET_REQUIRED')throw new RangeError('US_MAJOR_CONTRACT_BUDGET_REQUIRED',{cause:error});throw error;}
 const archive:UsMajorYearArchive={receiptKey:JSON.stringify(['us-major-year-close',c.activation.receiptKey,c.world.seasonKey]),seasonKey:c.world.seasonKey,sourceRevision:c.revision,recordRevision:c.records.revision,endingPlayer:structuredClone(c.world.players[c.protagonistKey]!),contract:structuredClone(c.contract),inventory:c.inventory,season:c.season!,seasonSchedule:c.seasonSchedule!,preseasonPlan:c.preseasonPlan!,campNotices:c.campNotices??[],postseason:c.postseason!,seasonGrowth:c.seasonGrowth,funding:sortedFunding,nextRegisteredPlayerKeys:registered,supply:stage.supply,nextContract:structuredClone(nextContract),valuation:{modelVersion:1,batting:q.batting,pitching:q.pitching}};
 const player=stage.world.players[c.protagonistKey]!,next:UsCareer={...c,schemaVersion:4,revision:revision+1,world:stage.world,health:stage.health,majorYears:[...(c.majorYears??[]),archive],inventory,contract:nextContract,registration:{...c.registration,seasonKey:stage.targetSeasonKey,status:'ACTIVE'},phaseContext:{phase:'PRESEASON_SETUP'},seasonGrowth:createSeasonGrowthLedger(player,stage.targetSeasonKey,stage.world.calendar.growthDays.length),development:{...c.development,seasonStartPlayer:structuredClone(player)},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
 if(c.traits)next.traits={...c.traits,lastClosedDay:null,lastSeasonKey:stage.targetSeasonKey};
 delete next.season;delete next.seasonSchedule;delete next.preseasonPlan;delete next.campNotices;delete next.postseason;
 assertUsCareerRevision(next,next.revision);return refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(next));
}
/** One current-club MLB offer after six credited seasons. Signing bonus is not paid again. */
export function acceptUsMajorFreeAgency(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 assertUsCareerRevision(c,revision);const preview=usMajorFreeAgencyPreview(c,funding);if(!preview.offers.length)throw new RangeError('US_MAJOR_FA_UNFUNDED');const q=market(c),stage=stageUsControlledMajorYear(c,revision,true),registered=Object.keys(stage.world.players).sort(),sortedFunding=funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:1),offer=preview.offers[0]!,nextContract=usMajorFaContract(c,c.contract,stage.targetSeasonKey,offer.annualSalaryUsd,offer.years);
 let inventory;try{inventory=fundUsMinorYear(c.inventory,stage.targetSeasonKey,registered,sortedFunding,c.protagonistOrganizationId,nextContract.annualSalaryUsd);}catch(error){if(error instanceof RangeError&&error.message==='US_MINOR_CONTRACT_BUDGET_REQUIRED')throw new RangeError('US_MAJOR_CONTRACT_BUDGET_REQUIRED',{cause:error});throw error;}
 const archive:UsMajorYearArchive={receiptKey:JSON.stringify(['us-major-year-close',c.activation.receiptKey,c.world.seasonKey]),seasonKey:c.world.seasonKey,sourceRevision:c.revision,recordRevision:c.records.revision,endingPlayer:structuredClone(c.world.players[c.protagonistKey]!),contract:structuredClone(c.contract),inventory:c.inventory,season:c.season!,seasonSchedule:c.seasonSchedule!,preseasonPlan:c.preseasonPlan!,campNotices:c.campNotices??[],postseason:c.postseason!,seasonGrowth:c.seasonGrowth,funding:sortedFunding,nextRegisteredPlayerKeys:registered,supply:stage.supply,nextContract:structuredClone(nextContract),valuation:{modelVersion:1,batting:q.batting,pitching:q.pitching}};
 const player=stage.world.players[c.protagonistKey]!,next:UsCareer={...c,schemaVersion:4,revision:revision+1,world:stage.world,health:stage.health,majorYears:[...(c.majorYears??[]),archive],inventory,contract:nextContract,registration:{...c.registration,seasonKey:stage.targetSeasonKey,status:'ACTIVE'},phaseContext:{phase:'PRESEASON_SETUP'},seasonGrowth:createSeasonGrowthLedger(player,stage.targetSeasonKey,stage.world.calendar.growthDays.length),development:{...c.development,seasonStartPlayer:structuredClone(player)},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
 if(c.traits)next.traits={...c.traits,lastClosedDay:null,lastSeasonKey:stage.targetSeasonKey};
 delete next.season;delete next.seasonSchedule;delete next.preseasonPlan;delete next.campNotices;delete next.postseason;
 assertUsCareerRevision(next,next.revision);return refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(next));
}

import type {UsCareer} from './us-career-entry.js';
import type {UsRecruitmentWorld} from './us-direct.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {assertMlbPostseason} from './us-postseason.js';
import type {UsSupplyReceipt} from './us-supply.js';
import {canonicalJson} from './game.js';
import {usContractOrigin} from './us-contract-origin.js';
import type {UsMinorRenewal} from './us-minor-market.js';
import {validateEvent} from './events.js';

/** Trusted financial additions; no UI money command or ability-based budget estimate. */
export interface UsAnnualFunding {organizationId:string;addedBudgetUsd:number}
export interface UsMinorYearArchive {
 receiptKey:string;seasonKey:string;sourceRevision:number;recordRevision:number;endingPlayer:DevelopmentPlayer;
 contract:UsCareer['contract'];inventory:UsRecruitmentWorld;season:NonNullable<UsCareer['season']>;seasonSchedule:NonNullable<UsCareer['seasonSchedule']>;preseasonPlan:NonNullable<UsCareer['preseasonPlan']>;campNotices:NonNullable<UsCareer['campNotices']>;postseason:NonNullable<UsCareer['postseason']>;seasonGrowth:UsCareer['seasonGrowth'];
 funding:UsAnnualFunding[];nextRegisteredPlayerKeys:string[];supply:UsSupplyReceipt;minorRenewal?:UsMinorRenewal;
}
export function fundUsMinorYear(source:UsRecruitmentWorld,targetSeasonKey:string,registeredKeys:readonly string[],funding:readonly UsAnnualFunding[],holder:string,annualSalary:number):UsRecruitmentWorld {
 assertUsRecruitmentWorld(source);
 if(targetSeasonKey!==String(Number(source.seasonKey)+1)||source.clubs.length!==30||funding.length!==30||new Set(funding.map(f=>f.organizationId)).size!==30||funding.some(f=>!source.clubs.some(c=>c.id===f.organizationId)||!Number.isSafeInteger(f.addedBudgetUsd)||f.addedBudgetUsd<0)||!Number.isSafeInteger(annualSalary)||annualSalary<0)throw new RangeError('INVALID_US_ANNUAL_FUNDING');
 const next:UsRecruitmentWorld={...source,seasonKey:targetSeasonKey,registeredPlayerKeys:[...registeredKeys].sort(),clubs:source.clubs.map(c=>{const amount=c.availableBudgetUsd+funding.find(f=>f.organizationId===c.id)!.addedBudgetUsd;if(!Number.isSafeInteger(amount))throw new RangeError('US_BUDGET_OVERFLOW');return {...c,availableBudgetUsd:amount-(c.id===holder?annualSalary:0)};})};
 if(!next.clubs.some(c=>c.id===holder)||next.clubs.some(c=>c.availableBudgetUsd<0))throw new RangeError('US_MINOR_CONTRACT_BUDGET_REQUIRED');assertUsRecruitmentWorld(next);return next;
}
/** A sealed renewal belongs to the transition that paid for it, not merely the current root. */
function renewalContract(c:UsCareer,r:UsMinorRenewal,y:UsMinorYearArchive,previous:UsCareer['contract'],holder:string,target:string):UsCareer['contract'] {
 const club=y.inventory.clubs.find(o=>o.id===r?.organizationId),id=JSON.stringify(['us-minor-market',c.activation.receiptKey,y.seasonKey,previous.contractKey]);
 if(!c.kboTransfer||!r||typeof r!=='object'||!r.contract||typeof r.contract!=='object'||!Array.isArray(r.funding)||!club||r.marketId!==id||r.offerKey!==JSON.stringify(['us-minor-offer',id,r.organizationId])||r.signedFromSeasonKey!==y.seasonKey||r.sourceRevision!==y.sourceRevision||canonicalJson(r.funding)!==canonicalJson(y.funding)||(r.organizationId===holder?r.displacedCompetitorKey!==null:typeof r.displacedCompetitorKey!=='string'||!r.displacedCompetitorKey))throw new RangeError('INVALID_US_MINOR_RENEWAL');
 const expected:UsCareer['contract']={contractKey:JSON.stringify(['us-minor-renewal',id,r.offerKey]),type:'US_MINOR',currency:'USD',years:1,annualSalaryUsd:30000,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:target,nationalReleaseAllowed:club.nationalReleaseAllowed,militaryReturnOption:club.militaryReturnOption};
 if(canonicalJson(r.contract)!==canonicalJson(expected))throw new RangeError('INVALID_US_MINOR_RENEWAL');
 const e=c.events.find(e=>e.definitionId==='E66'&&e.evidence.fields.contractWindowIdOrReturnProgramId===id);
 const closingLevel=y.season.levelMoves?.at(-1)?.to??y.season.days.at(-1)?.level;
 if(!e||e.worldKey!==c.world.worldKey||e.seasonKey!==y.seasonKey||e.status!=='RESOLVED'||e.resolution?.kind!=='DOMAIN'||e.resolution.command!=='ACCEPT_CAREER_OFFER'||e.resolution.receiptKey!==y.receiptKey||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.evidence.fields.stage!=='MINOR_EXPIRED'||e.resume.phase!=='SEASON_REVIEW'||e.resume.competitionKey!==closingLevel||e.resume.registrationKey!==holder)throw new RangeError('INVALID_US_MINOR_RENEWAL');validateEvent(e);return expected;
}
/** Replays every contract epoch. EL's single tail renewal remains a read-only compatibility source. */
export function openingUsMinorState(c:UsCareer) {
 const origin=usContractOrigin(c),first=Number(origin.contract.seasonKey),years=c.minorYears??[],limit=c.kboTransfer?origin.contract.years!:origin.contract.controlSeasons;
 if(!c.amateurHistory.world.players[c.protagonistKey]||!c.world.players[c.protagonistKey])throw new RangeError('INVALID_US_ENTRY_VIEW');
 let inventory=structuredClone(origin.inventory),contract={...origin.contract},organizationId=c.kboTransfer?c.kboTransfer.offer.organizationId:c.amateurHistory.usRecruitment!.program.signing!.rights.holderOrgId,epoch=first,term=limit,last:UsMinorRenewal|undefined;
 if(c.schemaVersion!==3){if(years.length||c.minorRenewal!==undefined||c.world.seasonKey!==origin.contract.seasonKey||c.kboTransfer&&c.world.players[c.protagonistKey]!.age!==origin.playerAge)throw new RangeError('INVALID_US_ENTRY_VIEW');return {inventory,contract,organizationId};}
 if(origin.contract.type!=='US_MINOR'||!years.length||Number(c.world.seasonKey)!==first+years.length||c.world.players[c.protagonistKey]!.age!==origin.playerAge+years.length)throw new RangeError('INVALID_US_YEAR_HISTORY');
 for(const [i,y]of years.entries()){
  const season=String(first+i),target=String(first+i+1),elapsed=Number(season)-epoch+1;
  if(y.seasonKey!==season||y.receiptKey!==JSON.stringify(['us-minor-year-close',c.activation.receiptKey,season])||!Number.isSafeInteger(y.sourceRevision)||y.sourceRevision<=c.activation.sourceRevision||y.sourceRevision>=c.revision||i>0&&y.sourceRevision<=years[i-1]!.sourceRevision||canonicalJson(y.contract)!==canonicalJson(contract)||canonicalJson(y.inventory)!==canonicalJson(inventory)||y.endingPlayer.simulationKey!==c.protagonistKey||y.endingPlayer.age!==origin.playerAge+i||y.supply.targetSeasonKey!==target||y.season.paidUsd!==contract.annualSalaryUsd||!y.season.growthFinalized||!y.seasonGrowth.finalized||y.seasonGrowth.seasonKey!==season||y.season.receiptKey!==JSON.stringify(['us-regular-season',y.seasonSchedule.receiptKey])||y.season.days.length!==y.season.lastDay-y.season.firstDay+1||!y.postseason.bracket.championKey||y.postseason.bracket.seasonKey!==season)throw new RangeError('INVALID_US_YEAR_HISTORY');
  validateDevelopmentPlayer(y.endingPlayer);validateSeasonGrowthLedger(y.seasonGrowth);assertMlbPostseason(y.postseason.bracket);
  if(y.minorRenewal!==undefined&&(!y.minorRenewal||typeof y.minorRenewal!=='object'))throw new RangeError('INVALID_US_MINOR_RENEWAL');
  const renewal=y.minorRenewal??(i===years.length-1&&years.length===limit&&c.minorRenewal?.signedFromSeasonKey===season?c.minorRenewal:undefined);
  if(renewal){if(elapsed!==term)throw new RangeError('INVALID_US_MINOR_RENEWAL');contract=renewalContract(c,renewal,y,contract,organizationId,target);organizationId=renewal.organizationId;epoch=Number(target);term=1;last=renewal;}
  else{if(elapsed>=term)throw new RangeError('INVALID_US_YEAR_HISTORY');contract={...contract,seasonKey:target};}
  inventory=fundUsMinorYear(y.inventory,target,y.nextRegisteredPlayerKeys,y.funding,organizationId,contract.annualSalaryUsd);
 }
 if(organizationId!==c.protagonistOrganizationId||(last?(!c.minorRenewal||canonicalJson(last)!==canonicalJson(c.minorRenewal)):c.minorRenewal!==undefined))throw new RangeError('INVALID_US_MINOR_RENEWAL');
 return {inventory,contract,organizationId};
}
export function openingUsMinorInventory(c:UsCareer):UsRecruitmentWorld {return openingUsMinorState(c).inventory;}

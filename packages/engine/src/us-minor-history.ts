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

/** Trusted financial additions; no UI money command or ability-based budget estimate. */
export interface UsAnnualFunding {organizationId:string;addedBudgetUsd:number}
export interface UsMinorYearArchive {
 receiptKey:string;seasonKey:string;sourceRevision:number;recordRevision:number;endingPlayer:DevelopmentPlayer;
 contract:UsCareer['contract'];inventory:UsRecruitmentWorld;season:NonNullable<UsCareer['season']>;seasonSchedule:NonNullable<UsCareer['seasonSchedule']>;preseasonPlan:NonNullable<UsCareer['preseasonPlan']>;campNotices:NonNullable<UsCareer['campNotices']>;postseason:NonNullable<UsCareer['postseason']>;seasonGrowth:UsCareer['seasonGrowth'];
 funding:UsAnnualFunding[];nextRegisteredPlayerKeys:string[];supply:UsSupplyReceipt;
}
export function fundUsMinorYear(source:UsRecruitmentWorld,targetSeasonKey:string,registeredKeys:readonly string[],funding:readonly UsAnnualFunding[],holder:string,annualSalary:number):UsRecruitmentWorld {
 assertUsRecruitmentWorld(source);
 if(targetSeasonKey!==String(Number(source.seasonKey)+1)||source.clubs.length!==30||funding.length!==30||new Set(funding.map(f=>f.organizationId)).size!==30||funding.some(f=>!source.clubs.some(c=>c.id===f.organizationId)||!Number.isSafeInteger(f.addedBudgetUsd)||f.addedBudgetUsd<0)||!Number.isSafeInteger(annualSalary)||annualSalary<0)throw new RangeError('INVALID_US_ANNUAL_FUNDING');
 const next:UsRecruitmentWorld={...source,seasonKey:targetSeasonKey,registeredPlayerKeys:[...registeredKeys].sort(),clubs:source.clubs.map(c=>{const amount=c.availableBudgetUsd+funding.find(f=>f.organizationId===c.id)!.addedBudgetUsd;if(!Number.isSafeInteger(amount))throw new RangeError('US_BUDGET_OVERFLOW');return {...c,availableBudgetUsd:amount-(c.id===holder?annualSalary:0)};})};
 if(!next.clubs.some(c=>c.id===holder)||next.clubs.some(c=>c.availableBudgetUsd<0))throw new RangeError('US_MINOR_CONTRACT_BUDGET_REQUIRED');assertUsRecruitmentWorld(next);return next;
}
/** The expanded reader checks the financial chain while preserving the legacy first-year reader. */
export function openingUsMinorInventory(c:UsCareer):UsRecruitmentWorld {
 const origin=usContractOrigin(c),first=Number(origin.contract.seasonKey),years=c.minorYears??[],limit=c.kboTransfer?origin.contract.years!:origin.contract.controlSeasons;
 if(!c.amateurHistory.world.players[c.protagonistKey]||!c.world.players[c.protagonistKey])throw new RangeError('INVALID_US_ENTRY_VIEW');
 const startAge=origin.playerAge;
 let expected=structuredClone(origin.inventory);
 if(c.schemaVersion!==3){if(years.length||c.world.seasonKey!==origin.contract.seasonKey||c.kboTransfer&&c.world.players[c.protagonistKey]!.age!==startAge)throw new RangeError('INVALID_US_ENTRY_VIEW');return expected;}
 if(origin.contract.type!=='US_MINOR'||!years.length||years.length>limit||(years.length<limit&&!!c.minorRenewal)||(years.length===limit&&!c.minorRenewal)||Number(c.world.seasonKey)!==first+years.length||c.world.players[c.protagonistKey]!.age!==startAge+years.length)throw new RangeError('INVALID_US_YEAR_HISTORY');
 const originOrg=c.kboTransfer?c.kboTransfer.offer.organizationId:c.protagonistOrganizationId;
 for(const [i,y]of years.entries()){
  const season=String(first+i),target=String(first+i+1),contract={...origin.contract,seasonKey:season},renew=i===limit-1&&c.minorRenewal,pay=renew?30000:origin.contract.annualSalaryUsd,holder=renew?c.minorRenewal!.organizationId:originOrg,funding=renew?c.minorRenewal!.funding:y.funding;
  if(y.seasonKey!==season||y.receiptKey!==JSON.stringify(['us-minor-year-close',c.activation.receiptKey,season])||!Number.isSafeInteger(y.sourceRevision)||y.sourceRevision<=c.activation.sourceRevision||y.sourceRevision>=c.revision||i>0&&y.sourceRevision<=years[i-1]!.sourceRevision||canonicalJson(y.contract)!==canonicalJson(contract)||canonicalJson(y.inventory)!==canonicalJson(expected)||y.endingPlayer.simulationKey!==c.protagonistKey||y.endingPlayer.age!==startAge+i||y.supply.targetSeasonKey!==target||y.season.paidUsd!==origin.contract.annualSalaryUsd||!y.season.growthFinalized||!y.seasonGrowth.finalized||y.seasonGrowth.seasonKey!==season||y.season.receiptKey!==JSON.stringify(['us-regular-season',y.seasonSchedule.receiptKey])||y.season.days.length!==y.season.lastDay-y.season.firstDay+1||!y.postseason.bracket.championKey||y.postseason.bracket.seasonKey!==season)throw new RangeError('INVALID_US_YEAR_HISTORY');
  if(renew){const r=c.minorRenewal!;if(r.signedFromSeasonKey!==season||r.marketId!==JSON.stringify(['us-minor-market',c.activation.receiptKey,season,origin.contract.contractKey])||r.organizationId!==c.protagonistOrganizationId||canonicalJson(r.funding)!==canonicalJson(y.funding)||r.contract.years!==1||r.contract.annualSalaryUsd!==30000||r.contract.type!=='US_MINOR'||r.contract.signingBonusUsd!==0||r.contract.contractKey!==JSON.stringify(['us-minor-renewal',r.marketId,r.offerKey]))throw new RangeError('INVALID_US_MINOR_RENEWAL');}
  validateDevelopmentPlayer(y.endingPlayer);validateSeasonGrowthLedger(y.seasonGrowth);assertMlbPostseason(y.postseason.bracket);
  expected=fundUsMinorYear(y.inventory,target,y.nextRegisteredPlayerKeys,funding,holder,pay);
 }
 return expected;
}

import {usMajorCallupAdditionalUsd} from './us-season.js';
import type {UsCareer} from './us-career-entry.js';
import type {UsMinorYearArchive} from './us-minor-history.js';
import {openingUsMinorState,fundUsMinorYear} from './us-minor-history.js';
import {canonicalJson} from './game.js';
import {validateDevelopmentPlayer} from './player.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {assertMlbPostseason} from './us-postseason.js';
import type {BattingLine,PitchingLine} from './types.js';
import {usMajorContractValue,usMlbOfferYears} from './us-contract-value.js';
import {usContractOrigin} from './us-contract-origin.js';
import {archivedAgentUsSalary} from './career-agent.js';
import type {AgentSalaryRequest} from './career-agent.js';
import {usMilitaryContinuationOrigin} from './us-military-plan.js';

export interface UsMajorYearArchive extends UsMinorYearArchive {
 agentCounter?:AgentSalaryRequest;
 nextContract:UsCareer['contract'];
 valuation:{modelVersion:1;batting:BattingLine;pitching:PitchingLine};
}
const same=(a:unknown,b:unknown)=>canonicalJson(a)===canonicalJson(b);
export function usMajorAnnualContract(c:Pick<UsCareer,'activation'|'protagonistKey'|'protagonistOrganizationId'>,previous:UsCareer['contract'],targetSeasonKey:string,annualSalaryUsd:number):UsCareer['contract']{
 const contract:UsCareer['contract']={...previous,contractKey:JSON.stringify(['us-major-annual',c.activation.receiptKey,targetSeasonKey]),type:'US_MAJOR',years:1,seasonKey:targetSeasonKey,annualSalaryUsd,signingBonusUsd:0};delete contract.remainingGuaranteedUsd;return contract;
}
/** Remaining guaranteed years keep the signed salary. They are not repriced. */
export function usMajorGuaranteedContract(c:Pick<UsCareer,'activation'> & Partial<Pick<UsCareer,'season'>>,previous:UsCareer['contract'],targetSeasonKey:string):UsCareer['contract']{
 if(previous.remainingGuaranteedUsd!==undefined){const remainingGuaranteedUsd=previous.remainingGuaranteedUsd-(c.season?.paidUsd??0);if(!Number.isSafeInteger(remainingGuaranteedUsd)||remainingGuaranteedUsd<=0)throw new RangeError('US_MAJOR_GUARANTEE_EXHAUSTED');return {...previous,contractKey:JSON.stringify(['us-major-guarantee',c.activation.receiptKey,targetSeasonKey]),type:'US_MAJOR',years:Math.ceil(remainingGuaranteedUsd/previous.annualSalaryUsd),remainingGuaranteedUsd,seasonKey:targetSeasonKey,signingBonusUsd:0};}
 const years=(previous.years??1)-1;if(years<1)throw new RangeError('US_MAJOR_GUARANTEE_EXHAUSTED');
 return {...previous,contractKey:JSON.stringify(['us-major-guarantee',c.activation.receiptKey,targetSeasonKey]),type:'US_MAJOR',years,seasonKey:targetSeasonKey,annualSalaryUsd:previous.annualSalaryUsd,signingBonusUsd:0};
}
export function usMajorFaContract(c:Pick<UsCareer,'activation'>,previous:UsCareer['contract'],targetSeasonKey:string,annualSalaryUsd:number,years:1|2|3|5):UsCareer['contract']{
 const contract:UsCareer['contract']={...previous,contractKey:JSON.stringify(['us-major-fa',c.activation.receiptKey,targetSeasonKey]),type:'US_MAJOR',years,seasonKey:targetSeasonKey,annualSalaryUsd,signingBonusUsd:0};delete contract.remainingGuaranteedUsd;return contract;
}
/** Replays immutable financial quote snapshots. Later record corrections do not reprice an already signed year. */
export function openingUsMajorYear(c:UsCareer){
 const resumed=usMilitaryContinuationOrigin(c),years=resumed?.majorYears??c.majorYears,origin=resumed?.origin??usContractOrigin(c),minorYears=resumed?.minorYears??c.minorYears??[],first=years?.[0],firstYear=Number(origin.contract.seasonKey)+minorYears.length,startAge=origin.playerAge;
 if(c.schemaVersion!==4||!first||Number(first.seasonKey)!==firstYear||Number(c.world.seasonKey)!==firstYear+years!.length||c.world.players[c.protagonistKey]?.age!==startAge+minorYears.length+years!.length)throw new RangeError('INVALID_US_MAJOR_YEAR_HISTORY');
 const projected:UsCareer={...c,schemaVersion:minorYears.length?3:2,world:{...c.world,seasonKey:first.seasonKey,players:{...c.world.players,[c.protagonistKey]:first.endingPlayer}}};
 const minorState=openingUsMinorState(projected);let inventory=minorState.inventory,contract:UsCareer['contract']=minorState.contract;
 const activation=first.season.majorActivation;
 let firstPaid=resumed?resumed.returnPaidUsd:contract.annualSalaryUsd;
 if(contract.type==='US_MINOR'){
  if(!activation)throw new RangeError('MISSING_US_MAJOR_ORIGIN');
  const key=JSON.stringify(['us-major-entry',contract.contractKey,first.seasonKey]),minor=contract.annualSalaryUsd;
  if(activation.contractKey!==key||activation.fromContractKey!==contract.contractKey||activation.annualSalaryUsd!==800000||!Number.isSafeInteger(activation.effectiveDay)||activation.effectiveDay<=first.season.firstDay||activation.effectiveDay>first.season.lastDay||activation.reservedAdditionalUsd!==usMajorCallupAdditionalUsd({...projected,contract,season:first.season,seasonSchedule:first.seasonSchedule},activation.effectiveDay))throw new RangeError('INVALID_US_MAJOR_ORIGIN');
  inventory.clubs.find(o=>o.id===c.protagonistOrganizationId)!.availableBudgetUsd-=activation.reservedAdditionalUsd;firstPaid=(resumed&&first.season.militaryService?resumed.returnPaidUsd:minor)+activation.reservedAdditionalUsd;
  contract={...contract,type:'US_MAJOR',contractKey:key,annualSalaryUsd:800000,...(c.kboTransfer?{years:1}:{})};
 }else if(activation||minorYears.length)throw new RangeError('INVALID_US_MAJOR_ORIGIN');
 for(const [i,y]of years!.entries()){
  const year=String(firstYear+i),target=String(firstYear+i+1),paid=i===0?firstPaid:Math.min(contract.annualSalaryUsd,contract.remainingGuaranteedUsd??contract.annualSalaryUsd);
  if(!y.valuation||y.seasonKey!==year||y.receiptKey!==JSON.stringify(['us-major-year-close',c.activation.receiptKey,year])||!Number.isSafeInteger(y.recordRevision)||y.recordRevision<0||y.recordRevision>c.records.revision||i>0&&y.recordRevision<years![i-1]!.recordRevision||!Number.isSafeInteger(y.sourceRevision)||y.sourceRevision<=c.activation.sourceRevision||y.sourceRevision>=c.revision||i>0&&y.sourceRevision<=years![i-1]!.sourceRevision||!same(y.inventory,inventory)||!same(y.contract,contract)||y.endingPlayer.simulationKey!==c.protagonistKey||y.endingPlayer.age!==startAge+minorYears.length+i||y.supply.targetSeasonKey!==target||y.season.paidUsd!==paid||!y.season.growthFinalized||!y.seasonGrowth.finalized||y.seasonGrowth.seasonKey!==year||y.season.receiptKey!==JSON.stringify(['us-regular-season',y.seasonSchedule.receiptKey])||y.season.days.length!==y.season.lastDay-y.season.firstDay+1||!y.postseason.bracket.championKey||y.postseason.bracket.seasonKey!==year||i>0&&y.season.majorActivation||y.valuation.modelVersion!==1)throw new RangeError('INVALID_US_MAJOR_YEAR_HISTORY');
  validateDevelopmentPlayer(y.endingPlayer);validateSeasonGrowthLedger(y.seasonGrowth);assertMlbPostseason(y.postseason.bracket);
  const value=usMajorContractValue(y.endingPlayer,y.valuation.batting,y.valuation.pitching),salary=y.agentCounter?archivedAgentUsSalary(c,target,value.annualSalaryUsd,y.agentCounter):value.annualSalaryUsd,annual=usMajorAnnualContract(c,contract,target,salary),expected=(contract.years??1)>1||contract.remainingGuaranteedUsd!==undefined&&contract.remainingGuaranteedUsd>y.season.paidUsd?usMajorGuaranteedContract({...c,season:y.season},contract,target):annual;
  if(y.agentCounter&&(contract.years??1)>1)throw new RangeError('US_AGENT_COUNTER_QUOTE_CHANGED');
  if(!same(y.nextContract,expected)){const fa={...annual,years:usMlbOfferYears(y.endingPlayer.age+1),contractKey:JSON.stringify(['us-major-fa',c.activation.receiptKey,target])};if((contract.years??1)>1||!same(y.nextContract,fa))throw new RangeError('US_MAJOR_RENEWAL_QUOTE_CHANGED');}
  inventory=fundUsMinorYear(inventory,target,y.nextRegisteredPlayerKeys,y.funding,c.protagonistOrganizationId,y.nextContract.annualSalaryUsd);contract=structuredClone(y.nextContract);
 }
 return {inventory,contract};
}

import type {UsCareer} from './us-career-entry.js';
import type {UsRecruitmentWorld} from './us-direct.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import {canonicalJson} from './game.js';

export interface UsContractOrigin {playerAge:number;contract:UsCareer['contract'];inventory:UsRecruitmentWorld}
/** KBO origins are captured at activation; missing historical budgets are never inferred from live funds. */
export function usContractOrigin(c:UsCareer):UsContractOrigin {
 if(c.kboTransfer){
  const t=c.kboTransfer,o=t.origin,id=t.postingId??t.windowId,offer=t.offer;
  if(o===undefined)throw new RangeError('US_CONTRACT_ORIGIN_REQUIRED');
  if(!o||typeof o!=='object'||!o.contract||typeof o.contract!=='object'||!o.inventory||typeof o.inventory!=='object'||!Array.isArray(o.inventory.clubs)||o.inventory.clubs.length!==30||o.inventory.clubs.some(club=>!club||typeof club!=='object')||!Array.isArray(o.inventory.registeredPlayerKeys))throw new RangeError('INVALID_US_CONTRACT_ORIGIN');
  const expected:UsCareer['contract']={contractKey:JSON.stringify(['kbo-us-transfer',id,offer.offerKey]),type:offer.kind==='MLB'?'US_MAJOR':'US_MINOR',currency:'USD',years:offer.years,annualSalaryUsd:offer.annualSalaryUsd,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:String(Number(t.kboSeasonKey)+1),nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption};
  if(c.activation.populationBasis!=='KBO_TRANSFER'||!['POSTING','OVERSEAS_FA'].includes(t.source)||!id||c.activation.receiptKey!==JSON.stringify(['kbo-us-activation',id])||c.activation.sourceRevision!==t.sourceRevision||c.activation.contractKey!==expected.contractKey||!Number.isSafeInteger(o.playerAge)||o.playerAge<18||o.playerAge>45||canonicalJson(o.contract)!==canonicalJson(expected)||o.inventory.worldKey!==c.world.worldKey||o.inventory.seed!==c.world.seed||o.inventory.seasonKey!==expected.seasonKey||offer.organizationId!==c.protagonistOrganizationId||!o.inventory.registeredPlayerKeys.includes(c.protagonistKey))throw new RangeError('INVALID_US_CONTRACT_ORIGIN');
  assertUsRecruitmentWorld(o.inventory);return o;
 }
 const signing=c.amateurHistory.usRecruitment?.program.signing,age=c.amateurHistory.world.players[c.protagonistKey]?.age;
 if(!signing||!Number.isSafeInteger(age))throw new RangeError('INVALID_US_ENTRY_VIEW');
 return {playerAge:age!+1,contract:{...signing.contract,seasonKey:signing.seasonKey,status:'ACTIVE',nationalReleaseAllowed:signing.offer.nationalReleaseAllowed,militaryReturnOption:signing.offer.militaryReturnOption},inventory:c.amateurHistory.usRecruitment!.reservations.currentWorld};
}

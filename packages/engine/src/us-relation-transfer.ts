import {restoreUsEmergencyRegistrations} from './us-year-transition.js';
import type {UsCareer} from './us-career-entry.js';

/** Only a successful native signing owns this separation. A quote or read never changes relationships. */
export function separateUsTransferRelations(source:UsCareer,next:UsCareer,receiptKey:string):UsCareer['relationships']|undefined {
 const registered=structuredClone(source.world);restoreUsEmergencyRegistrations(source,registered);const from=registered.organizations.find(o=>o.id===source.protagonistOrganizationId),to=next.world.organizations.find(o=>o.id===next.protagonistOrganizationId),archive=[...(next.minorYears??[]),...(next.majorYears??[])].filter(y=>y.receiptKey===receiptKey);
 if(source.world.worldKey!==next.world.worldKey||source.protagonistKey!==next.protagonistKey||!from||!to||from.id===to.id||next.world.seasonKey!==String(Number(source.world.seasonKey)+1)||archive.length!==1||archive[0]!.sourceRevision!==source.revision||archive[0]!.seasonKey!==source.world.seasonKey||archive[0]!.contract.contractKey!==source.contract.contractKey||!from.levels[source.registration.level].includes(source.protagonistKey)||!to.levels[next.registration.level].includes(next.protagonistKey))throw new RangeError('INVALID_US_RELATION_TRANSFER');
 if(!source.relationships||!Array.isArray(source.relationships.relations))return undefined;
 const ledger=structuredClone(source.relationships),seen=new Set<string>();
 ledger.relations=ledger.relations.map(r=>{
  if(r.primaryPlayerKey!==source.protagonistKey||r.primaryPlayerKey===r.otherPlayerKey||!['RIVAL','TEAMMATE'].includes(r.type)||r.normalPairKey!==JSON.stringify([r.primaryPlayerKey,r.otherPlayerKey].sort())||r.relationKey!==JSON.stringify([r.type,r.normalPairKey])||!r.milestones.length||seen.has(r.relationKey))throw new RangeError('INVALID_CAREER_RELATION');seen.add(r.relationKey);
  if(!['FORMED','REUNITED_TEAM'].includes(r.stage)||!from.levels[source.registration.level].includes(r.otherPlayerKey)||to.levels[next.registration.level].includes(r.otherPlayerKey))return r;
  const evidenceKey=JSON.stringify(['relation-separation',r.relationKey,receiptKey]);return {...r,stage:'SEPARATED',milestones:[...r.milestones,{stage:'SEPARATED',evidenceKey,worldDay:source.season!.lastDay}]};
 });return ledger;
}

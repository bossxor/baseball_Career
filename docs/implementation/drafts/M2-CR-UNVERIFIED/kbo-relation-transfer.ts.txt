import type {KboCareer} from './kbo-career-entry.js';
import {currentKboSeasonTransfers} from './kbo-transfer-registration.js';
import {kboActiveContractSuspended} from './kbo-service-payroll.js';

/** Successful transfers only: preserve earlier history and separate relations that actually shared the old club.
 * Loans/active service are not current club registration; an injured registered teammate still qualifies. */
export function separateKboTransferRelations(source:KboCareer,career:KboCareer):KboCareer['relationships'] {
 const receipt=currentKboSeasonTransfers(career)?.at(-1),key=source.protagonistKey,from=source.world.clubs.find(c=>c.id===source.protagonistClubId),to=career.world.clubs.find(c=>c.id===career.protagonistClubId);
 if(!receipt || source.world.worldKey!==career.world.worldKey || source.world.seasonKey!==career.world.seasonKey || key!==career.protagonistKey || receipt.fromClubId!==from?.id || receipt.toClubId!==to?.id || receipt.previousContractKey!==source.world.contracts[key]?.contractKey || receipt.afterWorldDay!==source.days?.days.at(-1)?.day || !from?.roster.includes(key) || !to?.roster.includes(key))throw new RangeError('INVALID_KBO_RELATION_TRANSFER');
 const ledger=structuredClone(career.relationships);
 ledger.relations=ledger.relations.map(r=>{
  if(r.primaryPlayerKey!==key || r.primaryPlayerKey===r.otherPlayerKey || !['RIVAL','TEAMMATE'].includes(r.type) || r.normalPairKey!==JSON.stringify([key,r.otherPlayerKey].sort()) || r.relationKey!==JSON.stringify([r.type,r.normalPairKey]) || !r.milestones.length)throw new RangeError('INVALID_CAREER_RELATION');
  if(!['FORMED','REUNITED_TEAM'].includes(r.stage) || !from.roster.includes(r.otherPlayerKey) || to.roster.includes(r.otherPlayerKey) || source.sangmu?.loaned?.includes(r.otherPlayerKey) || kboActiveContractSuspended(source.world.contracts[r.otherPlayerKey]!))return r;
  const evidenceKey=JSON.stringify(['relation-separation',r.relationKey,receipt.receiptKey]);
  return {...r,stage:'SEPARATED',milestones:r.milestones.some(m=>m.evidenceKey===evidenceKey)?r.milestones:[...r.milestones,{stage:'SEPARATED',evidenceKey,worldDay:receipt.afterWorldDay}]};
 });
 return ledger;
}

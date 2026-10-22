import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision as assertCareerRevision} from './kbo-career-version.js';
import {acceptedRenewal} from './kbo-renewal.js';
import {remainingKboMilitaryContractDays,kboMilitaryStatus} from './kbo-military-state.js';
import {enlistInActiveService} from './kbo-military-program.js';
import {kboMilitaryCompletionDays} from './kbo-military-events.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

function eligible(c:KboCareer):string|null {
 if(c.phaseContext.phase!=='SEASON_REVIEW' || c.seasonClose?.seasonKey!==c.world.seasonKey)return 'SEASON_REVIEW_REQUIRED';
 if(kboMilitaryStatus(c)!=='UNRESOLVED')return 'MILITARY_ALREADY_RESOLVED_OR_PENDING';
 const player=c.world.players[c.protagonistKey],contract=c.world.contracts[c.protagonistKey];
 if(!player || player.age<19 || player.age>=45)return 'MILITARY_AGE_UNAVAILABLE';
 if(!contract || contract.clubId!==c.protagonistClubId || c.rights.holderOrgId!==c.protagonistClubId || c.registration.clubId!==c.protagonistClubId || contract.servicePay || contract.remainderPay)return 'MILITARY_CONTRACT_CHANGED';
 if(c.events.some(e=>e.status==='OPEN'))return 'OPEN_EVENT';
 return remainingKboMilitaryContractDays(c)>0?null:'CONTRACT_DECISION_REQUIRED';
}
function programFor(c:KboCareer){
 const r=acceptedRenewal(c),current=c.world.contracts[c.protagonistKey]!,contract=r?{...current,contractKey:r.offerKey,seasonKey:r.seasonKey,years:r.years,annualSalaryWon:r.annualSalaryWon}:current;
 return enlistInActiveService({worldKey:c.world.worldKey,playerKey:c.protagonistKey,clubId:c.protagonistClubId,selectionSeasonKey:c.world.seasonKey,contract,remainingPaidGameDays:remainingKboMilitaryContractDays(c)});
}
/** S26 review only. No enlistment, loan, contract mutation, RNG or future game is published by reading. */
export function kboActiveServicePreview(c:KboCareer){
 const reason=eligible(c);if(reason)return {canEnlist:false as const,reason};
 assertKboRecruitmentWorld(c.world);const p=programFor(c),days=kboMilitaryCompletionDays(p);
 return {canEnlist:true as const,reason:null,confirmationRevision:c.revision,clubId:p.originalClubId,annualSalaryWon:p.contract.annualSalaryWon,remainingPaidGameDays:p.contract.remainingPaidGameDays,unpaidPrincipalWon:p.contract.totalRemainingWon,servicePayWon:0,firstSeasonKey:p.startedSeason,returnSeasonKey:days[1]!.seasonKey,returnWorldDay:days[1]!.worldDay,officialAppearances:0,naturalGrowth:0};
}
/** Explicit S26 confirmation. Viewing E49/S26 never calls this command automatically.
 * ACTIVE starts next season; confirmed programs cannot be cancelled back to the original abilities/contract. */
export function confirmKboActiveService(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 if(source.military?.status==='SERVING_ACTIVE' && source.military.program?.kind==='ACTIVE' && source.military.program.startedSeason===String(Number(source.world.seasonKey)+1))return structuredClone(source);
 const reason=eligible(source);if(reason)throw new RangeError(reason);
 assertKboRecruitmentWorld(source.world);const program=programFor(source),career=structuredClone(source);
 career.military={status:'SERVING_ACTIVE',applications:structuredClone(source.military?.applications??[]),program,completionDays:kboMilitaryCompletionDays(program),contractPaymentVersion:1,growthPolicyVersion:1};
 if(career.schemaVersion<3)career.schemaVersion=3;career.revision++;return career;
}

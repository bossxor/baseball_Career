import {refreshCareerPreseasonGoalSelection} from './season-goals.js';
import {KBO_MONEY,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboPlayerContractValue,kboRenewalSalaryWon} from './kbo-contract-value.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import type {KboInitialContract} from './kbo-world.js';
import type {DevelopmentPlayer} from './player.js';

export const KBO_RETURN_WINDOW_DAYS=30;

export interface KboReturnOffer {
 offerKey:string;clubId:string;currency:'KRW';years:1|2|3|4;annualSalaryWon:number;signingBonusWon:0;
}
export interface KboReturnNegotiation {
 negotiationId:string;postingId:string;seasonKey:string;status:'OPEN'|'ACCEPTED'|'REJECTED'|'RELEASED'|'EXPIRED';
 issuedWorldDay:number;expiresWorldDay:number;offer?:KboReturnOffer;acceptedContractKey?:string;
}

function signedPosting(c:KboCareer){
 const w=c.posting?.windows.find(x=>x.status==='SIGNED'&&x.returnRights&&x.sealedPlayer&&x.sealedContract);if(!w)throw new RangeError('KBO_RETURN_RIGHTS_REQUIRED');return w;
}
function negotiationId(c:KboCareer,postingId:string){return JSON.stringify(['kbo-return',c.world.worldKey,c.world.seasonKey,postingId]);}

/** Original-club priority after a sealed posting. Overseas-FA leavers have no return rights here. */
export function kboReturnEligibility(c:KboCareer){
 assertKboCareerRevision(c,c.revision);const reasons:string[]=[];
 if(c.phaseContext.phase!=='ARCHIVED'&&c.phaseContext.phase!=='SEASON_REVIEW')reasons.push('PHASE_BLOCKED');
 try{signedPosting(c);}catch{reasons.push('RETURN_RIGHTS_REQUIRED');}
 if(c.overseasFa?.windows.some(w=>w.status==='SIGNED'))reasons.push('OVERSEAS_FA_RELEASED');
 if(c.returnHome?.negotiations.some(n=>n.status==='OPEN'||n.status==='ACCEPTED'))reasons.push('NEGOTIATION_OPEN');
 if(c.events.some(e=>e.status==='OPEN'))reasons.push('OPEN_EVENT');
 return {eligible:reasons.length===0,reasons};
}

export function startKboReturnNegotiation(c:KboCareer,revision:number,issuedWorldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);const gate=kboReturnEligibility(c);if(!gate.eligible)throw new RangeError('KBO_RETURN_NOT_ELIGIBLE');
 if(!Number.isSafeInteger(issuedWorldDay)||issuedWorldDay<0)throw new RangeError('INVALID_KBO_RETURN_DAY');
 const posting=signedPosting(c),next=structuredClone(c),id=negotiationId(c,posting.postingId);
 const row:KboReturnNegotiation={negotiationId:id,postingId:posting.postingId,seasonKey:c.world.seasonKey,status:'OPEN',issuedWorldDay,expiresWorldDay:issuedWorldDay+KBO_RETURN_WINDOW_DAYS};
 next.returnHome={negotiations:[...(next.returnHome?.negotiations??[]).filter(n=>n.negotiationId!==id),row]};next.revision++;return next;
}

/** One original-club offer. Salary uses the sealed player's public value against the frozen prior annual. */
export function offerKboReturnTerms(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);const open=c.returnHome?.negotiations.find(n=>n.status==='OPEN');if(!open||open.offer)throw new RangeError('KBO_RETURN_OFFER_NOT_AVAILABLE');
 const posting=signedPosting(c);if(open.postingId!==posting.postingId)throw new RangeError('KBO_RETURN_POSTING_MISMATCH');
 const player=posting.sealedPlayer!,prior=posting.sealedContract!,value=kboPlayerContractValue(player,emptyBatting(),emptyPitching()),annual=kboRenewalSalaryWon(prior.annualSalaryWon,value.valueWon);
 const years=(player.age<=29?4:player.age<=32?3:player.age<=35?2:1) as 1|2|3|4;
 const next=structuredClone(c),n=next.returnHome!.negotiations.find(x=>x.negotiationId===open.negotiationId)!;
 n.offer={offerKey:JSON.stringify(['kbo-return-offer',open.negotiationId,posting.returnRights!.holderClubId]),clubId:posting.returnRights!.holderClubId,currency:'KRW',years,annualSalaryWon:annual,signingBonusWon:0};next.revision++;return next;
}

export function rejectOrExpireKboReturn(c:KboCareer,revision:number,reason:'REJECTED'|'EXPIRED'|'RELEASED'):KboCareer {
 assertKboCareerRevision(c,revision);const open=c.returnHome?.negotiations.find(n=>n.status==='OPEN');if(!open)throw new RangeError('KBO_RETURN_NOT_OPEN');
 const next=structuredClone(c),n=next.returnHome!.negotiations.find(x=>x.negotiationId===open.negotiationId)!;n.status=reason;next.revision++;return next;
}

/** Restores the sealed player to the original club under a new active contract. */
export function acceptKboReturnOffer(c:KboCareer,revision:number,worldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);const open=c.returnHome?.negotiations.find(n=>n.status==='OPEN');if(!open?.offer)throw new RangeError('KBO_RETURN_OFFER_REQUIRED');
 if(!Number.isSafeInteger(worldDay)||worldDay<open.issuedWorldDay||worldDay>=open.expiresWorldDay)throw new RangeError('KBO_RETURN_EXPIRED');
 const posting=signedPosting(c),offer=open.offer,player=structuredClone(posting.sealedPlayer!) as DevelopmentPlayer,clubId=offer.clubId;
 if(offer.clubId!==posting.returnRights!.holderClubId)throw new RangeError('KBO_RETURN_CLUB_MISMATCH');
 const next=structuredClone(c),club=next.world.clubs.find(x=>x.id===clubId)!;if(club.roster.includes(c.protagonistKey)||Object.hasOwn(next.world.players,c.protagonistKey)||Object.hasOwn(next.world.contracts,c.protagonistKey))throw new RangeError('KBO_RETURN_ALREADY_REGISTERED');
 if(club.roster.length>=KBO_ROSTER_LIMITS.maximum)throw new RangeError('KBO_RETURN_ROSTER_FULL');
 if(offer.annualSalaryWon<KBO_MONEY.minimumSalaryWon||offer.annualSalaryWon>KBO_MONEY.maximumSalaryWon||offer.annualSalaryWon%10_000!==0)throw new RangeError('KBO_RETURN_SALARY_INVALID');
 const contract:KboInitialContract={contractKey:JSON.stringify(['kbo-return-contract',open.negotiationId]),playerKey:c.protagonistKey,clubId,seasonKey:c.world.seasonKey,years:offer.years,annualSalaryWon:offer.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};
 next.world.players[c.protagonistKey]=player;next.world.contracts[c.protagonistKey]=contract;club.roster=[...club.roster,c.protagonistKey].sort();club.reservedSalaryWon+=offer.annualSalaryWon;
 if(club.roster.length>=KBO_ROSTER_LIMITS.firstTeam){const first=selectKboFirstTeamRoster(club.roster.map(k=>next.world.players[k]!));if(first.length===KBO_ROSTER_LIMITS.firstTeam)club.firstTeam=first;}
 const n=next.returnHome!.negotiations.find(x=>x.negotiationId===open.negotiationId)!;n.status='ACCEPTED';n.acceptedContractKey=contract.contractKey;
 next.registration={playerKey:c.protagonistKey,clubId,seasonKey:c.world.seasonKey,status:'ACTIVE',firstTeam:club.firstTeam.includes(c.protagonistKey)};
 next.phaseContext={phase:'PRESEASON_SETUP'};next.revision++;return refreshCareerPreseasonGoalSelection(next);
}

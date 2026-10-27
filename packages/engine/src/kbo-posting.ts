import {overall,roleScore,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboServiceTimeView} from './kbo-service-time.js';
import {kboMilitaryStatus} from './kbo-military-state.js';
import {recordTotals} from './records.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {usMajorContractValue,usMlbOfferYears} from './us-contract-value.js';
import {createWorldStream,nextInteger} from './rng.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';

export const KBO_POSTING_APPROVAL_SCORE=65;
export const KBO_POSTING_WINDOW_DAYS=30;
export const KBO_POSTING_FEE_RATE=.2;
export const KBO_POSTING_FX_KRW_PER_USD=1_300;
const MLB_ORGS=Object.freeze(Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')})));

export type KboPostingOfferKind='MLB'|'MILB';
export interface KboPostingOffer {
 offerKey:string;organizationId:string;organizationName:string;kind:KboPostingOfferKind;currency:'USD';
 years:1|2|3|5;annualSalaryUsd:number;initialLevel:'MLB'|'AAA'|'AA'|'A'|'ROOKIE';nationalReleaseAllowed:boolean;militaryReturnOption:boolean;
}
export interface KboPostingReturnRights {
 holderClubId:string;territory:'KR';sourceType:'POSTING';seasonKey:string;contractKey:string;annualSalaryWon:number;years:number;snapshotRevision:number;
}
export interface KboPostingWindow {
 postingId:string;seasonKey:string;requestedRevision:number;clubId:string;status:'REQUESTED'|'DEFERRED'|'APPROVED'|'EXPIRED'|'REJECTED'|'SIGNED';
 approvalScore?:number;decision?:'APPROVED'|'DEFERRED';offers?:readonly KboPostingOffer[];issuedWorldDay?:number;expiresWorldDay?:number;
 signedOfferKey?:string;compensationWon?:number;returnRights?:KboPostingReturnRights;sealedPlayer?:DevelopmentPlayer;sealedContract?:KboInitialContract;
}

function offseason(c:KboCareer){
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)throw new RangeError('KBO_POSTING_NOT_AVAILABLE');
}
function activeContract(c:KboCareer){
 const contract=c.world.contracts[c.protagonistKey];if(!contract||contract.status!=='ACTIVE'||contract.clubId!==c.protagonistClubId)throw new RangeError('KBO_POSTING_CONTRACT_REQUIRED');return contract;
}
function performance(c:KboCareer){
 const player=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:c.world.seasonKey}),bat=totals.batting[c.protagonistKey]??emptyBatting(),pit=totals.pitching[c.protagonistKey]??emptyPitching(),o=overall(player.kind,player.abilities);
 return {player,bat,pit,recent:player.kind==='HITTER'?recentBattingPerformance(bat):recentPitchingPerformance(pit),role:roleScore(player.kind,player.abilities,player.position),ovr:o.sumUnits/o.denominator};
}
function windowId(c:KboCareer){return JSON.stringify(['kbo-posting',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);}
function current(c:KboCareer){return c.posting?.windows.find(w=>w.seasonKey===c.world.seasonKey);}

/** Read-only checklist. Does not invent missing registration years. */
export function kboPostingEligibility(c:KboCareer){
 assertKboCareerRevision(c,c.revision);const service=kboServiceTimeView(c),contract=c.world.contracts[c.protagonistKey],military=kboMilitaryStatus(c),open=current(c);
 const reasons:string[]=[];
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)reasons.push('OFFSEASON_REQUIRED');
 if(!service.registrationThresholds.posting.reached)reasons.push('SERVICE_SHORT');
 if(!contract||contract.status!=='ACTIVE'||contract.clubId!==c.protagonistClubId)reasons.push('CONTRACT_REQUIRED');
 if(military!=='COMPLETED'&&military!=='NOT_APPLICABLE')reasons.push('MILITARY_BLOCKED');
 if(open&&open.status!=='EXPIRED'&&open.status!=='REJECTED')reasons.push('WINDOW_OPEN');
 if(c.events.some(e=>e.status==='OPEN'))reasons.push('OPEN_EVENT');
 return {eligible:reasons.length===0,reasons,service,military,postingReached:service.registrationThresholds.posting.reached,window:open??null};
}

/** Once per closed season. Deferred windows wait for the next season key. */
export function requestKboPosting(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const gate=kboPostingEligibility(c);if(!gate.eligible)throw new RangeError('KBO_POSTING_NOT_ELIGIBLE');
 activeContract(c);const next=structuredClone(c),postingId=windowId(c);
 next.posting={windows:[...(next.posting?.windows??[]).filter(w=>w.postingId!==postingId),{postingId,seasonKey:c.world.seasonKey,requestedRevision:revision,clubId:c.protagonistClubId,status:'REQUESTED'}]};next.revision++;return next;
}

/** Score = recent×0.6 + role×0.4. No redraw. Below 65 defers; the contract stays. */
export function resolveKboPostingClub(c:KboCareer,revision:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='REQUESTED')throw new RangeError('KBO_POSTING_REQUEST_REQUIRED');
 const p=performance(c),score=p.recent*.6+p.role*.4,decision:'APPROVED'|'DEFERRED'=score>=KBO_POSTING_APPROVAL_SCORE?'APPROVED':'DEFERRED';
 const next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.approvalScore=score;w.decision=decision;w.status=decision;next.revision++;return next;
}

function buildOffers(c:KboCareer,postingId:string):KboPostingOffer[] {
 const p=performance(c),years=usMlbOfferYears(p.player.age),value=usMajorContractValue(p.player,p.bat,p.pit),kind:KboPostingOfferKind|null=p.ovr>=75?'MLB':p.ovr>=65?'MILB':null;if(!kind)return [];
 let rng=createWorldStream(c.world.seed,JSON.stringify(['kbo-posting-offers',postingId]),'roster');const pool=[...MLB_ORGS],offers:KboPostingOffer[]=[];
 const countDraw=nextInteger(rng,4);rng=countDraw.state;const count=Math.min(3,countDraw.value);if(!count)return [];
 while(pool.length&&offers.length<count){const pick=nextInteger(rng,pool.length);rng=pick.state;const org=pool.splice(pick.value,1)[0]!;
  offers.push({offerKey:JSON.stringify(['kbo-posting-offer',postingId,org.id]),organizationId:org.id,organizationName:org.name,kind,currency:'USD',years,annualSalaryUsd:kind==='MLB'?value.annualSalaryUsd:30_000,initialLevel:kind==='MLB'?'MLB':'AAA',nationalReleaseAllowed:true,militaryReturnOption:true});}
 return offers.sort((a,b)=>a.organizationId<b.organizationId?-1:1);
}

/** Fixed offer set for the approved window. Refresh does not redraw. */
export function openKboPostingOffers(c:KboCareer,revision:number,issuedWorldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='APPROVED'||open.offers)throw new RangeError('KBO_POSTING_OFFERS_NOT_AVAILABLE');
 if(!Number.isSafeInteger(issuedWorldDay)||issuedWorldDay<0)throw new RangeError('INVALID_KBO_POSTING_DAY');
 const next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.offers=buildOffers(c,open.postingId);w.issuedWorldDay=issuedWorldDay;w.expiresWorldDay=issuedWorldDay+KBO_POSTING_WINDOW_DAYS;next.revision++;return next;
}

export function expireOrRejectKboPosting(c:KboCareer,revision:number,reason:'EXPIRED'|'REJECTED'):KboCareer {
 assertKboCareerRevision(c,revision);const open=current(c);if(!open||open.status!=='APPROVED'||!open.offers)throw new RangeError('KBO_POSTING_CANCEL_NOT_AVAILABLE');
 const before=JSON.stringify(c.world.contracts[c.protagonistKey]),next=structuredClone(c),w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.status=reason;next.revision++;
 if(JSON.stringify(next.world.contracts[c.protagonistKey])!==before)throw new RangeError('KBO_POSTING_CONTRACT_MUTATED');return next;
}

export function kboPostingFeeWon(offer:Pick<KboPostingOffer,'annualSalaryUsd'|'years'>){
 const fee=Math.round(offer.annualSalaryUsd*offer.years*KBO_POSTING_FEE_RATE)*KBO_POSTING_FX_KRW_PER_USD;if(!Number.isSafeInteger(fee)||fee%10_000!==0)throw new RangeError('KBO_POSTING_FEE_INVALID');return fee;
}

/** Ends the KBO contract, pays the club fee once, snapshots return rights. Does not create a US career root. */
export function acceptKboPostingOffer(c:KboCareer,revision:number,offerKey:string,worldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='APPROVED'||!open.offers||open.issuedWorldDay===undefined||open.expiresWorldDay===undefined)throw new RangeError('KBO_POSTING_OFFERS_NOT_AVAILABLE');
 if(!Number.isSafeInteger(worldDay)||worldDay<open.issuedWorldDay||worldDay>=open.expiresWorldDay)throw new RangeError('KBO_POSTING_OFFER_EXPIRED');
 const offer=open.offers.find(o=>o.offerKey===offerKey);if(!offer)throw new RangeError('KBO_POSTING_OFFER_NOT_FOUND');
 const expected=buildOffers(c,open.postingId).find(o=>o.offerKey===offerKey);if(!expected||JSON.stringify(expected)!==JSON.stringify(offer))throw new RangeError('KBO_POSTING_OFFER_CHANGED');
 const contract=activeContract(c),player=c.world.players[c.protagonistKey]!,compensationWon=kboPostingFeeWon(offer);
 const next=structuredClone(c),club=next.world.clubs.find(x=>x.id===c.protagonistClubId)!;if(!club.roster.includes(c.protagonistKey))throw new RangeError('KBO_POSTING_ROSTER_CHANGED');
 const returnRights:KboPostingReturnRights={holderClubId:c.protagonistClubId,territory:'KR',sourceType:'POSTING',seasonKey:c.world.seasonKey,contractKey:contract.contractKey,annualSalaryWon:contract.annualSalaryWon,years:contract.years,snapshotRevision:revision};
 const sealedPlayer=structuredClone(player),sealedContract=structuredClone(contract);
 delete next.world.contracts[c.protagonistKey];delete next.world.players[c.protagonistKey];delete next.world.repertoires[c.protagonistKey];
 club.roster=club.roster.filter(k=>k!==c.protagonistKey);club.firstTeam=club.firstTeam.filter(k=>k!==c.protagonistKey);
 if(club.reservedSalaryWon<contract.annualSalaryWon)throw new RangeError('KBO_POSTING_PAYROLL_CHANGED');club.reservedSalaryWon-=contract.annualSalaryWon;club.budgetWon+=compensationWon;
 if(club.roster.length>=KBO_ROSTER_LIMITS.firstTeam){const first=selectKboFirstTeamRoster(club.roster.map(k=>next.world.players[k]!));if(first.length===KBO_ROSTER_LIMITS.firstTeam)club.firstTeam=first;}
 const w=next.posting!.windows.find(x=>x.postingId===open.postingId)!;w.status='SIGNED';w.signedOfferKey=offerKey;w.compensationWon=compensationWon;w.returnRights=returnRights;w.sealedPlayer=sealedPlayer;w.sealedContract=sealedContract;w.offers=open.offers;
 next.phaseContext={phase:'ARCHIVED'};next.revision++;return next;
}

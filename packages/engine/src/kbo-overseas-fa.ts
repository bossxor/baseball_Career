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
import type {KboPostingOffer,KboPostingWindow} from './kbo-posting.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';

export const KBO_OVERSEAS_FA_WINDOW_DAYS=30;
const MLB_ORGS=Object.freeze(Array.from({length:30},(_,i)=>({id:'US'+String(i+1).padStart(2,'0'),name:'US Club '+String(i+1).padStart(2,'0')})));

export interface KboOverseasFaWindow {
 windowId:string;seasonKey:string;requestedRevision:number;status:'OPEN'|'EXPIRED'|'REJECTED'|'SIGNED';
 offers:readonly KboPostingOffer[];issuedWorldDay:number;expiresWorldDay:number;
 signedOfferKey?:string;sealedPlayer?:DevelopmentPlayer;sealedContract?:KboInitialContract;domesticRights:'RELEASED';
}

function offseason(c:KboCareer){
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)throw new RangeError('KBO_OVERSEAS_FA_NOT_AVAILABLE');
}
function performance(c:KboCareer){
 const player=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:c.world.seasonKey}),bat=totals.batting[c.protagonistKey]??emptyBatting(),pit=totals.pitching[c.protagonistKey]??emptyPitching(),o=overall(player.kind,player.abilities);
 return {player,bat,pit,recent:player.kind==='HITTER'?recentBattingPerformance(bat):recentPitchingPerformance(pit),role:roleScore(player.kind,player.abilities,player.position),ovr:o.sumUnits/o.denominator};
}
function windowId(c:KboCareer){return JSON.stringify(['kbo-overseas-fa',c.world.worldKey,c.world.seasonKey,c.protagonistKey]);}
function current(c:KboCareer){return c.overseasFa?.windows.find(w=>w.seasonKey===c.world.seasonKey);}

function buildOffers(c:KboCareer,id:string):KboPostingOffer[] {
 const p=performance(c),years=usMlbOfferYears(p.player.age),value=usMajorContractValue(p.player,p.bat,p.pit),kind=p.ovr>=75?'MLB' as const:p.ovr>=65?'MILB' as const:null;if(!kind)return [];
 let rng=createWorldStream(c.world.seed,JSON.stringify(['kbo-overseas-fa-offers',id]),'roster');const pool=[...MLB_ORGS],offers:KboPostingOffer[]=[];
 const countDraw=nextInteger(rng,4);rng=countDraw.state;const count=Math.min(3,countDraw.value);if(!count)return [];
 while(pool.length&&offers.length<count){const pick=nextInteger(rng,pool.length);rng=pick.state;const org=pool.splice(pick.value,1)[0]!;
  offers.push({offerKey:JSON.stringify(['kbo-overseas-fa-offer',id,org.id]),organizationId:org.id,organizationName:org.name,kind,currency:'USD',years,annualSalaryUsd:kind==='MLB'?value.annualSalaryUsd:30_000,initialLevel:kind==='MLB'?'MLB':'AAA',nationalReleaseAllowed:true,militaryReturnOption:true});}
 return offers.sort((a,b)=>a.organizationId<b.organizationId?-1:1);
}

/** Nine closed 100-game KBO seasons. No club approval and no posting fee. */
export function kboOverseasFaEligibility(c:KboCareer){
 assertKboCareerRevision(c,c.revision);const service=kboServiceTimeView(c),contract=c.world.contracts[c.protagonistKey],military=kboMilitaryStatus(c),open=current(c),posting=c.posting?.windows.find(w=>w.seasonKey===c.world.seasonKey);
 const reasons:string[]=[];
 if(c.phaseContext.phase!=='SEASON_REVIEW'||c.seasonClose?.seasonKey!==c.world.seasonKey)reasons.push('OFFSEASON_REQUIRED');
 if(!service.registrationThresholds.overseasFa.reached)reasons.push('SERVICE_SHORT');
 if(!contract||contract.status!=='ACTIVE'||contract.clubId!==c.protagonistClubId)reasons.push('CONTRACT_REQUIRED');
 if(military!=='COMPLETED'&&military!=='NOT_APPLICABLE')reasons.push('MILITARY_BLOCKED');
 if(open&&open.status!=='EXPIRED'&&open.status!=='REJECTED')reasons.push('WINDOW_OPEN');
 if(posting&&!['EXPIRED','REJECTED','DEFERRED'].includes(posting.status as string))reasons.push('POSTING_WINDOW_OPEN');
 if(c.events.some(e=>e.status==='OPEN'))reasons.push('OPEN_EVENT');
 return {eligible:reasons.length===0,reasons,service,military,overseasReached:service.registrationThresholds.overseasFa.reached,window:open??null};
}

export function openKboOverseasFaOffers(c:KboCareer,revision:number,issuedWorldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const gate=kboOverseasFaEligibility(c);if(!gate.eligible)throw new RangeError('KBO_OVERSEAS_FA_NOT_ELIGIBLE');
 if(!Number.isSafeInteger(issuedWorldDay)||issuedWorldDay<0)throw new RangeError('INVALID_KBO_OVERSEAS_FA_DAY');
 const next=structuredClone(c),id=windowId(c),window:KboOverseasFaWindow={windowId:id,seasonKey:c.world.seasonKey,requestedRevision:revision,status:'OPEN',offers:buildOffers(c,id),issuedWorldDay,expiresWorldDay:issuedWorldDay+KBO_OVERSEAS_FA_WINDOW_DAYS,domesticRights:'RELEASED'};
 next.overseasFa={windows:[...(next.overseasFa?.windows??[]).filter(w=>w.windowId!==id),window]};next.revision++;return next;
}

export function expireOrRejectKboOverseasFa(c:KboCareer,revision:number,reason:'EXPIRED'|'REJECTED'):KboCareer {
 assertKboCareerRevision(c,revision);const open=current(c);if(!open||open.status!=='OPEN')throw new RangeError('KBO_OVERSEAS_FA_CANCEL_NOT_AVAILABLE');
 const before=JSON.stringify(c.world.contracts[c.protagonistKey]),next=structuredClone(c),w=next.overseasFa!.windows.find(x=>x.windowId===open.windowId)!;w.status=reason;next.revision++;
 if(JSON.stringify(next.world.contracts[c.protagonistKey])!==before)throw new RangeError('KBO_OVERSEAS_FA_CONTRACT_MUTATED');return next;
}

/** Leaves KBO without a posting fee. Domestic return rights are released; later return is domestic FA. */
export function acceptKboOverseasFaOffer(c:KboCareer,revision:number,offerKey:string,worldDay:number):KboCareer {
 assertKboCareerRevision(c,revision);offseason(c);const open=current(c);if(!open||open.status!=='OPEN')throw new RangeError('KBO_OVERSEAS_FA_NOT_AVAILABLE');
 if(!Number.isSafeInteger(worldDay)||worldDay<open.issuedWorldDay||worldDay>=open.expiresWorldDay)throw new RangeError('KBO_OVERSEAS_FA_OFFER_EXPIRED');
 const offer=open.offers.find(o=>o.offerKey===offerKey);if(!offer)throw new RangeError('KBO_OVERSEAS_FA_OFFER_NOT_FOUND');
 const expected=buildOffers(c,open.windowId).find(o=>o.offerKey===offerKey);if(!expected||JSON.stringify(expected)!==JSON.stringify(offer))throw new RangeError('KBO_OVERSEAS_FA_OFFER_CHANGED');
 const contract=c.world.contracts[c.protagonistKey]!,player=c.world.players[c.protagonistKey]!,next=structuredClone(c),club=next.world.clubs.find(x=>x.id===c.protagonistClubId)!;
 const budget=club.budgetWon,sealedPlayer=structuredClone(player),sealedContract=structuredClone(contract);
 delete next.world.contracts[c.protagonistKey];delete next.world.players[c.protagonistKey];delete next.world.repertoires[c.protagonistKey];
 club.roster=club.roster.filter(k=>k!==c.protagonistKey);club.firstTeam=club.firstTeam.filter(k=>k!==c.protagonistKey);
 if(club.reservedSalaryWon<contract.annualSalaryWon)throw new RangeError('KBO_OVERSEAS_FA_PAYROLL_CHANGED');club.reservedSalaryWon-=contract.annualSalaryWon;
 if(club.roster.length>=KBO_ROSTER_LIMITS.firstTeam){const first=selectKboFirstTeamRoster(club.roster.map(k=>next.world.players[k]!));if(first.length===KBO_ROSTER_LIMITS.firstTeam)club.firstTeam=first;}
 const w=next.overseasFa!.windows.find(x=>x.windowId===open.windowId)!;w.status='SIGNED';w.signedOfferKey=offerKey;w.sealedPlayer=sealedPlayer;w.sealedContract=sealedContract;w.domesticRights='RELEASED';
 next.phaseContext={phase:'ARCHIVED'};next.revision++;
 if(club.budgetWon!==budget)throw new RangeError('KBO_OVERSEAS_FA_FEE_FORBIDDEN');return next;
}

/** Type re-export for career field typing without importing posting windows. */
export type {KboPostingWindow};

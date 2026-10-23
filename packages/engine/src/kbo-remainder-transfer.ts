import {KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import type {KboClub} from './kbo-world.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboRosterRepairReceipt} from './kbo-roster-repair.js';
import {signKboRequiredReplacement} from './kbo-roster-repair.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertKboRemainderRenewal} from './kbo-remainder-renewal.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {createKboRemainderContract,kboRemainderBalance} from './kbo-remainder-pay.js';
import {kboContractSeasonCharge,kboContractSuspended} from './kbo-service-payroll.js';
import {kboClubBalance} from './kbo-finance.js';
import {completeBlockingEvent} from './events.js';
import {FIELD_POSITIONS,automaticFieldLineup,initialPositionFits} from './lineup.js';
import {emptyBatting} from './stats.js';
import {captureKboTransferPlanBoundaryDays} from './kbo-season-growth.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {separateKboTransferRelations} from './kbo-relation-transfer.js';
import {settleKboTransferTeamReunions} from './kbo-team-reunions.js';

/** Only the two affected clubs may fill missing legal slots; existing healthy registrations stay in place. */
function repairTransferClub(c:KboCareer,club:KboClub,leaving?:DevelopmentPlayer):KboRosterRepairReceipt['signings'] {
 const signings:KboRosterRepairReceipt['signings'][number][]=[];
 const available=(key:string)=>!Object.hasOwn(c.health.injuries,key) && !c.sangmu?.loaned?.includes(key) && !kboContractSuspended(c.world.contracts[key]!);
 const sign=(position:string)=>{
  c.freeAgents??={schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,players:{},supplies:[],retired:[]};
  const receipt=signKboRequiredReplacement(c.world,c.freeAgents,club.id,position,c.difficulty);signings.push(receipt);return receipt.playerKey;
 };
 const bench=(position:string)=>club.roster.filter(k=>k!==c.protagonistKey && !club.firstTeam.includes(k) && available(k) && c.world.players[k]!.position===position).sort((a,b)=>roleScore(c.world.players[b]!.kind,c.world.players[b]!.abilities,position)-roleScore(c.world.players[a]!.kind,c.world.players[a]!.abilities,position) || (a<b?-1:1))[0];
 if(club.firstTeam.length===27 && leaving)club.firstTeam=[...club.firstTeam,bench(leaving.position)??sign(leaving.position)];
 if(club.firstTeam.length!==28 || new Set(club.firstTeam).size!==28 || club.firstTeam.some(k=>!club.roster.includes(k)))throw new RangeError('INVALID_KBO_TRANSFER_ROSTER');
 for(const key of [...club.firstTeam])if(!available(key)){
  const position=c.world.players[key]!.position,replacement=bench(position)??sign(position);club.firstTeam=club.firstTeam.map(k=>k===key?replacement:k);
 }
 const first=club.firstTeam.map(k=>c.world.players[k]!);
 if(first.filter(p=>p.kind==='HITTER').length!==15 || first.filter(p=>p.kind==='PITCHER').length!==13 || first.filter(p=>p.position==='C').length<2 || ([['SP',5],['RP',6],['CP',2]] as const).some(([position,n])=>first.filter(p=>p.position===position).length!==n))throw new RangeError('INVALID_KBO_TRANSFER_ROSTER');
 automaticFieldLineup(first.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
 const futures=()=>club.roster.filter(k=>!club.firstTeam.includes(k) && available(k)).map(k=>c.world.players[k]!);
 for(const position of FIELD_POSITIONS)if(!futures().some(p=>p.kind==='HITTER' && p.position===position))sign(position);
 while(futures().filter(p=>p.kind==='HITTER').length<9)sign('DH');
 if(!futures().some(p=>p.kind==='PITCHER'))sign('SP');
 while(club.roster.length<KBO_ROSTER_LIMITS.minimum)sign('DH');
 automaticFieldLineup(futures().filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
 return signings;
}

/** One cloned transaction: old pay stays with its payer, the new club funds only future registered dates. */
export function acceptKboRemainderTransfer(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;offerKey:string}):KboCareer {
 assertKboCareerRevision(source,expectedRevision);assertKboRecruitmentWorld(source.world);
 const o=assertKboRemainderRenewal(source),event=source.events.find(e=>e.eventKey===o.eventKey)!,offer=o.comparison?.offers.find(x=>x.offerKey===input.offerKey);
 if(input.eventKey!==event.eventKey || !offer || offer.clubId===source.protagonistClubId || source.events.some(e=>e.status==='OPEN' && e.eventKey!==event.eventKey))throw new RangeError('KBO_REMAINDER_OFFER_CHANGED');
 const recipient=source.world.clubs.find(x=>x.id===offer.clubId);
 if(!recipient || recipient.roster.length>=KBO_ROSTER_LIMITS.maximum || kboClubBalance(source.world,recipient.id).availableWon<offer.maximumReservedWon)throw new RangeError('KBO_TRANSFER_CAPACITY_REQUIRED');
 const planBoundaryDays=captureKboTransferPlanBoundaryDays(source),receiptKey=JSON.stringify(['kbo-remainder-transfer',offer.offerKey]);
 const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey,command:'ACCEPT_REMAINDER_TRANSFER'},{worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:o.startAfterWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS']});
 const c=structuredClone(source),key=c.protagonistKey,old=c.world.contracts[key]!,from=c.world.clubs.find(x=>x.id===c.protagonistClubId)!,to=c.world.clubs.find(x=>x.id===offer.clubId)!,wasFirst=from.firstTeam.includes(key);
 const next=createKboRemainderContract(old,{contractKey:offer.offerKey,clubId:to.id,annualSalaryWon:offer.annualSalaryWon,startAfterWorldDay:o.startAfterWorldDay,endWorldDay:o.endWorldDay,reservedGameDays:offer.reservedGameDays});
 if(kboContractSeasonCharge(old)!==kboRemainderBalance(next).priorPaidWon)throw new RangeError('KBO_PREVIOUS_PAYROLL_NOT_SETTLED');
 from.roster=from.roster.filter(k=>k!==key);from.firstTeam=from.firstTeam.filter(k=>k!==key);
 to.roster=[...to.roster,key].sort();to.reservedSalaryWon+=kboContractSeasonCharge(next);c.world.contracts[key]=next;
 const rosterSignings=[...repairTransferClub(c,from,wasFirst?c.world.players[key]:undefined),...repairTransferClub(c,to)];
 c.protagonistClubId=to.id;c.rights={...c.rights,holderOrgId:to.id,sourceType:'TRANSFER'};c.registration={...c.registration,clubId:to.id,firstTeam:false,competitionKey:'FUTURES'};
 c.transferHistory=[...(c.transferHistory??[]),{receiptKey,seasonKey:c.world.seasonKey,playerKey:key,fromClubId:from.id,toClubId:to.id,afterWorldDay:o.startAfterWorldDay,previousContractKey:old.contractKey,contractKey:next.contractKey,planBoundaryDays,rosterSignings}];
 c.events=c.events.map(e=>e.eventKey===event.eventKey?resolved:e);c.remainderRenewal={...o,status:'TRANSFERRED',acceptedOfferKey:offer.offerKey};
 if(source.phaseContext.phase!=='EVENT_DECISION')throw new RangeError('INVALID_CAREER_PHASE');
 c.phaseContext=structuredClone(source.phaseContext.resume);c.schemaVersion=4;c.revision++;
 const world={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:to.id,schools:c.world.clubs,players:c.world.players};
 c.relationships=separateKboTransferRelations(source,c);
 settleKboTransferTeamReunions(source,c);
 c.relationships=formRegisteredTeamTeammate(c.relationships,world,receiptKey,o.startAfterWorldDay);
 c.relationNotices=queueRelationFormationNotices({...c,world,previousSeasons:[...(c.amateurHistory.previousSeasons??[]),{world:c.amateurHistory.world}]},o.startAfterWorldDay)??[];
 captureKboTransferPlanBoundaryDays(c);assertKboRecruitmentWorld(c.world);return c;
}

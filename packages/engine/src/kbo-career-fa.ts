import {KBO_MONEY,KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import type {BattingTotals,PitchingTotals} from './records.js';
import type {EventInstance} from './events.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {kboServiceTimeView} from './kbo-service-time.js';
import {kboContractExpiresAfterSeason} from './kbo-renewal.js';
import {kboFreeAgentTerms} from './kbo-contract-value.js';
import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import {kboFutureCommitmentWon,kboRecruitmentOpen} from './kbo-finance.js';
import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {recordTotals} from './records.js';
import {createWorldStream,nextFloat} from './rng.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,eventDefinition,validateEvent,completeBlockingEvent,resolveEventChoice,completeEventDomain} from './events.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';

export interface KboCareerFaOffer {offerKey:string;clubId:string;annualSalaryWon:number;years:1|2|3|4;role:1|.8|.5;firstTeamGuaranteed:false}
interface ClubQuoteBasis {clubId:string;budgetWon:number;recruitmentOpen:boolean;guaranteedKeys:readonly string[];commitments:readonly number[];need:{needScore:number;incumbentRoleScore:number}}
export interface KboCareerFaWindow {
 windowId:string;worldKey:string;playerKey:string;fromClubId:string;sourceSeasonKey:string;seasonKey:string;sourceRevision:number;sourceRecordRevision:number;sourceReceipt:string;sourceBasis:string;
 snapshot:{seed:string;player:DevelopmentPlayer;contract:KboInitialContract;batting?:BattingTotals;pitching?:PitchingTotals;qualifiedSeasons:number;clubs:readonly ClubQuoteBasis[]};
 valueWon:number;basis:{ovr:number;PA:number;OPS:number;outs:number;ERA:number};offers:readonly KboCareerFaOffer[];
 state:'OPEN'|'SELECTED'|'ACCEPTED';eventKey:string;eventKeys:readonly string[];selectionSequence:number;selectedOfferKey?:string;contract?:KboInitialContract;receiptKey?:string;
}
export interface KboCareerFaLedger {version:1;worldKey:string;playerKey:string;windows:readonly KboCareerFaWindow[]}
type Source=KboCareer & {freeAgency?:KboCareerFaLedger};
const integer=(n:number,min=0)=>Number.isSafeInteger(n)&&n>=min;
const validYear=(s:string)=>/^\d{4}$/.test(s)&&Number(s)>=2027&&Number(s)<=9999;
function id(worldKey:string,seasonKey:string,playerKey:string,contractKey:string){return JSON.stringify(['kbo-career-fa',worldKey,seasonKey,playerKey,contractKey]);}
function frozenBasis(w:KboCareerFaWindow){return canonicalJson({windowId:w.windowId,sourceSeasonKey:w.sourceSeasonKey,seasonKey:w.seasonKey,sourceRevision:w.sourceRevision,sourceRecordRevision:w.sourceRecordRevision,sourceReceipt:w.sourceReceipt,fromClubId:w.fromClubId,snapshot:w.snapshot});}
/** Same fixed price stream/range as the existing NPC FA market; no new draw is taken on read or selection. */
function quote(w:KboCareerFaWindow){
 const p={...w.snapshot.player,age:w.snapshot.player.age+1},terms=kboFreeAgentTerms(p,w.snapshot.batting,w.snapshot.pitching);
 const offers=w.snapshot.clubs.filter(c=>c.recruitmentOpen&&c.guaranteedKeys.filter(k=>k!==w.playerKey).length<KBO_ROSTER_LIMITS.maximum).sort((a,b)=>a.clubId<b.clubId?-1:1).flatMap(c=>{
  const ratio=.9+.3*nextFloat(createWorldStream(w.snapshot.seed,JSON.stringify(['kbo-ai-fa-price',w.worldKey,w.seasonKey,1,c.clubId,w.playerKey]),'roster')).value;
  const annualSalaryWon=Math.min(KBO_MONEY.maximumSalaryWon,Math.max(KBO_MONEY.minimumSalaryWon,Math.round(terms.annualSalaryWon*ratio/10_000)*10_000));
  let years=Math.min(terms.years,10000-Number(w.seasonKey));
  while(years>0&&c.commitments.slice(0,years).some(n=>n+annualSalaryWon>c.budgetWon*.9))years--;
  if(!years)return [];
  const role:KboCareerFaOffer['role']=c.need.needScore===100||roleScore(p.kind,p.abilities,p.position)>=c.need.incumbentRoleScore?1:c.need.needScore===50?.8:.5;
  return [{offerKey:JSON.stringify(['kbo-career-fa-offer',w.windowId,c.clubId]),clubId:c.clubId,annualSalaryWon,years:years as KboCareerFaOffer['years'],role,firstTeamGuaranteed:false as const}];
 });
 return {valueWon:terms.valueWon,basis:terms.basis,offers};
}
/** Root-reader validation is self-contained. Official corrections never reprice an already issued quote. */
export function assertKboCareerFaLedger(ledger:KboCareerFaLedger|undefined,identity?:{worldKey:string;playerKey:string}):void {
 if(!ledger)return;
 if(ledger.version!==1||!ledger.worldKey||!ledger.playerKey||!Array.isArray(ledger.windows)||identity&&(ledger.worldKey!==identity.worldKey||ledger.playerKey!==identity.playerKey))throw new RangeError('INVALID_KBO_CAREER_FA');
 const seasons=new Set<string>();
 for(const w of ledger.windows as readonly KboCareerFaWindow[]){
  if(w.worldKey!==ledger.worldKey||w.playerKey!==ledger.playerKey||!validYear(w.sourceSeasonKey)||!validYear(w.seasonKey)||Number(w.seasonKey)!==Number(w.sourceSeasonKey)+1||seasons.has(w.seasonKey)||!integer(w.sourceRevision)||!integer(w.sourceRecordRevision)||!w.sourceReceipt||w.snapshot.player.simulationKey!==w.playerKey||w.snapshot.player.age>=45||w.snapshot.contract.playerKey!==w.playerKey||w.snapshot.contract.clubId!==w.fromClubId||!integer(w.snapshot.qualifiedSeasons,8)||w.windowId!==id(w.worldKey,w.seasonKey,w.playerKey,w.snapshot.contract.contractKey)||!['OPEN','SELECTED','ACCEPTED'].includes(w.state)||!integer(w.selectionSequence)||!Array.isArray(w.eventKeys)||w.eventKeys.length===0||new Set(w.eventKeys).size!==w.eventKeys.length||w.eventKey!==w.eventKeys.at(-1)||w.sourceBasis!==frozenBasis(w))throw new RangeError('INVALID_KBO_CAREER_FA_WINDOW');
  seasons.add(w.seasonKey);
  if(!w.snapshot.seed||w.snapshot.clubs.length!==10||new Set(w.snapshot.clubs.map(c=>c.clubId)).size!==10||w.snapshot.clubs.some(c=>!c.clubId||typeof c.recruitmentOpen!=='boolean'||!integer(c.budgetWon,1)||c.commitments.length!==4||c.commitments.some(n=>!integer(n))||new Set(c.guaranteedKeys).size!==c.guaranteedKeys.length||![10,50,100].includes(c.need.needScore)||!Number.isFinite(c.need.incumbentRoleScore)||c.need.incumbentRoleScore<0||c.need.incumbentRoleScore>100))throw new RangeError('INVALID_KBO_FA_QUOTE_BASIS');
  const expected=quote(w);if(w.valueWon!==expected.valueWon||canonicalJson(w.basis)!==canonicalJson(expected.basis)||canonicalJson(w.offers)!==canonicalJson(expected.offers))throw new RangeError('KBO_FA_QUOTE_CHANGED');
  const selected=w.offers.find(o=>o.offerKey===w.selectedOfferKey);
  if((['SELECTED','ACCEPTED'].includes(w.state)?!selected:w.selectedOfferKey!==undefined)||(w.state==='ACCEPTED'?(!w.contract||w.receiptKey!==JSON.stringify(['kbo-career-fa-signing',w.windowId,selected!.offerKey])||canonicalJson(w.contract)!==canonicalJson(contract(w,selected!))):(w.contract!==undefined||w.receiptKey!==undefined)))throw new RangeError('INVALID_KBO_FA_DECISION');
 }
}
function contract(w:KboCareerFaWindow,o:KboCareerFaOffer):KboInitialContract{return {contractKey:o.offerKey,playerKey:w.playerKey,clubId:o.clubId,seasonKey:w.seasonKey,years:o.years,annualSalaryWon:o.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};}
function active(source:Source){assertKboCareerFaLedger(source.freeAgency,{worldKey:source.world.worldKey,playerKey:source.protagonistKey});const w=source.freeAgency?.windows.find(w=>w.sourceSeasonKey===source.world.seasonKey);if(!w)throw new RangeError('KBO_FA_WINDOW_NOT_OPEN');return w;}
function put(c:Source,w:KboCareerFaWindow):Source {c.freeAgency={version:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,windows:[...(c.freeAgency?.windows??[]).filter(old=>old.windowId!==w.windowId),w]};return c;}
function event(source:Source,w:KboCareerFaWindow):EventInstance {
 const e=source.events.find(e=>e.eventKey===w.eventKey);if(!e)throw new RangeError('KBO_FA_EVENT_MISSING');validateEvent(e);
 if(e.worldKey!==w.worldKey||e.seasonKey!==w.sourceSeasonKey||!w.eventKeys.includes(e.eventKey)||e.evidence.fields.playerSimulationKey!==w.playerKey||e.evidence.fields.sourceReceiptId!==w.sourceReceipt||e.evidence.fields.contractWindowId!==JSON.stringify([w.windowId,w.selectionSequence,w.state==='OPEN'?'MARKET':w.selectedOfferKey])||e.definitionId!==(w.state==='OPEN'?'E31':w.offers.find(o=>o.offerKey===w.selectedOfferKey)?.role===.5?'E33':'E32'))throw new RangeError('KBO_FA_EVENT_CHANGED');return e;
}
function makeEvent(source:Source,w:KboCareerFaWindow,offer?:KboCareerFaOffer):EventInstance {
 const definitionId=offer?(offer.role===.5?'E33':'E32'):'E31',definition=eventDefinition(definitionId),day=source.days?.days.at(-1)?.day;
 if(day===undefined)throw new RangeError('KBO_FA_CLOSED_DAY_REQUIRED');
 return createWorldEvent({definitionId,worldKey:w.worldKey,seasonKey:w.sourceSeasonKey,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:w.playerKey,contractWindowId:JSON.stringify([w.windowId,w.selectionSequence,offer?.offerKey??'MARKET']),sourceReceiptId:w.sourceReceipt}},resume:{worldKey:w.worldKey,seasonKey:w.sourceSeasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:w.fromClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
}
function context(e:EventInstance){return {worldKey:e.worldKey,seasonKey:e.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[...e.offeredChoices]};}
function resolve(source:Source,e:EventInstance,resolved:EventInstance){source.events=source.events.map(old=>old.eventKey===e.eventKey?resolved:old);}
function safe(source:Source,revision:number){assertKboCareerRevision(source,revision);assertKboCareerFaLedger(source.freeAgency,{worldKey:source.world.worldKey,playerKey:source.protagonistKey});if(source.phaseContext.phase!=='SEASON_REVIEW'||source.seasonClose?.seasonKey!==source.world.seasonKey||!kboContractExpiresAfterSeason(source))throw new RangeError('KBO_FA_NOT_AVAILABLE');}
function guaranteed(source:Source,clubId:string){return source.world.clubs.find(c=>c.id===clubId)!.roster.filter(key=>{const p=source.world.players[key]!,c=source.world.contracts[key]!;return p.age<45&&(c.servicePay?kboContractPaymentBalance(c.servicePay.ledger).remainingPaidGameDays>0:Number(c.seasonKey)+c.years-1>Number(source.world.seasonKey));});}
/** Existing eight100-registration-season eligibility; never substitutes current roster, PA, age or elapsed years. */
export function openKboCareerFa(source:Source,revision:number):Source {
 safe(source,revision);const old=source.freeAgency?.windows.find(w=>w.sourceSeasonKey===source.world.seasonKey);
 if(old){if(old.state==='OPEN'||old.state==='SELECTED')event(source,old);return structuredClone(source);}
 const service=kboServiceTimeView(source),key=source.protagonistKey,target=String(Number(source.world.seasonKey)+1),p=source.world.players[key]!;
 if(!service.registrationThresholds.domesticFa.reached||p.age>=45||!validYear(target)||source.renewal?.seasonKey===target||source.offseasonExit?.seasonKey===target||source.rights.holderOrgId!==source.protagonistClubId||source.events.some(e=>e.status==='OPEN'&&e.definitionId!=='E50'))throw new RangeError('KBO_FA_NOT_AVAILABLE');
 const totals=recordTotals(source.records,{seasonKey:source.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'}),oldContract=source.world.contracts[key]!,windowId=id(source.world.worldKey,target,key,oldContract.contractKey);
 let w:KboCareerFaWindow={windowId,worldKey:source.world.worldKey,playerKey:key,fromClubId:source.protagonistClubId,sourceSeasonKey:source.world.seasonKey,seasonKey:target,sourceRevision:revision,sourceRecordRevision:source.records.revision,sourceReceipt:source.seasonClose!.receiptKey,sourceBasis:'',snapshot:{seed:source.world.seed,player:structuredClone(p),contract:structuredClone(oldContract),...(totals.batting[key]?{batting:structuredClone(totals.batting[key]!)}:{}),...(totals.pitching[key]?{pitching:structuredClone(totals.pitching[key]!)}:{}),qualifiedSeasons:service.qualifiedSeasons,clubs:source.world.clubs.map(club=>{const keys=guaranteed(source,club.id).filter(k=>k!==key);return {clubId:club.id,budgetWon:club.budgetWon,recruitmentOpen:kboRecruitmentOpen(source.world,club.id),guaranteedKeys:keys,commitments:[1,2,3,4].map(y=>kboFutureCommitmentWon(source.world,club.id,y)),need:kboAiRoleNeed(p,keys.map(k=>source.world.players[k]!))};})},valueWon:0,basis:{ovr:0,PA:0,OPS:0,outs:0,ERA:0},offers:[],state:'OPEN',eventKey:'',eventKeys:[],selectionSequence:0};
 w={...w,...quote(w)};w.sourceBasis=frozenBasis(w);const e=makeEvent(source,w);w.eventKey=e.eventKey;w.eventKeys=[e.eventKey];
 const c=put(structuredClone(source),w);c.events=[...c.events,e];c.revision++;assertKboCareerFaLedger(c.freeAgency);return c;
}
/** Selecting a real frozen offer commits comparison and opens the actual contract/backup-role decision. */
export function selectKboCareerFaOffer(source:Source,revision:number,input:{eventKey:string;eventVersion:number;offerKey:string}):Source {
 safe(source,revision);const w=active(source),e=event(source,w),o=w.offers.find(o=>o.offerKey===input.offerKey);
 if(w.state!=='OPEN'||input.eventKey!==e.eventKey||!o)throw new RangeError('KBO_FA_OFFER_NOT_AVAILABLE');
 const resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['kbo-fa-compare',w.windowId,w.selectionSequence,o.offerKey]),command:'SELECT_FA_OFFER'},context(e)),next={...structuredClone(w),state:'SELECTED' as const,selectedOfferKey:o.offerKey,selectionSequence:w.selectionSequence+1},c=structuredClone(source);resolve(c,e,resolved);
 const selected=makeEvent(c,next,o);next.eventKey=selected.eventKey;next.eventKeys=[...w.eventKeys,selected.eventKey];put(c,next);c.events=[...c.events,selected];c.revision++;return c;
}
/** Rechecks only current rights/capacity/future money. Recorded statistics cannot reprice the fixed signed quote. */
export function acceptKboCareerFaOffer(source:Source,revision:number,input:{eventKey:string;eventVersion:number;offerKey:string}):Source {
 safe(source,revision);const w=active(source),e=event(source,w),o=w.offers.find(o=>o.offerKey===input.offerKey);
 if(w.state!=='SELECTED'||w.selectedOfferKey!==input.offerKey||!o||input.eventKey!==e.eventKey||source.renewal?.seasonKey===w.seasonKey||canonicalJson(source.world.contracts[w.playerKey])!==canonicalJson(w.snapshot.contract)||source.rights.holderOrgId!==w.fromClubId)throw new RangeError('KBO_FA_OFFER_NOT_AVAILABLE');
 const club=source.world.clubs.find(c=>c.id===o.clubId)!;
 if(!club||!kboRecruitmentOpen(source.world,club.id)||guaranteed(source,club.id).filter(k=>k!==w.playerKey).length>=KBO_ROSTER_LIMITS.maximum||Array.from({length:o.years},(_,i)=>kboFutureCommitmentWon(source.world,club.id,i+1)+o.annualSalaryWon>club.budgetWon*.9).some(Boolean))throw new RangeError('KBO_FA_BUDGET_OR_CAPACITY_CHANGED');
 const command=e.definitionId==='E33'?'ACCEPT_ROLE':'ACCEPT_CAREER_OFFER',plan=resolveEventChoice(e,input.eventVersion,command,{offerKey:o.offerKey},context(e)).domain!,receiptKey=JSON.stringify(['kbo-career-fa-signing',w.windowId,o.offerKey]),resolved=completeEventDomain(e,plan,receiptKey,context(e));
 const c=put(structuredClone(source),{...structuredClone(w),state:'ACCEPTED',contract:contract(w,o),receiptKey});
 c.renewal={offerKey:o.offerKey,eventKey:e.eventKey,playerKey:w.playerKey,clubId:o.clubId,seasonKey:w.seasonKey,years:o.years,previousSalaryWon:w.snapshot.contract.annualSalaryWon,valueWon:w.valueWon,annualSalaryWon:o.annualSalaryWon,basis:structuredClone(w.basis),status:'ACCEPTED'};resolve(c,e,resolved);c.revision++;return c;
}
/** A failed/declined selection restores the same quotes. No salary, rights, records or ability is rewritten. */
export function declineKboCareerFaSelection(source:Source,revision:number,input:{eventKey:string;eventVersion:number}):Source {
 safe(source,revision);const w=active(source),e=event(source,w);if(w.state!=='SELECTED'||input.eventKey!==e.eventKey)throw new RangeError('KBO_FA_SELECTION_NOT_OPEN');
 const c=structuredClone(source),resolved=completeBlockingEvent(e,input.eventVersion,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['kbo-fa-selection-declined',w.windowId,w.selectionSequence]),command:'DECLINE_FA_SELECTION'},context(e));resolve(c,e,resolved);
 const next={...structuredClone(w),state:'OPEN' as const};delete next.selectedOfferKey;const market=makeEvent(c,next);next.eventKey=market.eventKey;next.eventKeys=[...next.eventKeys,market.eventKey];put(c,next);c.events=[...c.events,market];c.revision++;return c;
}
export function kboCareerFaView(source:Source){
 const w=source.freeAgency?.windows.find(w=>w.sourceSeasonKey===source.world.seasonKey);if(!w)return null;assertKboCareerFaLedger(source.freeAgency);const e=event(source,w);
 return {windowId:w.windowId,state:w.state,eventKey:e.eventKey,eventVersion:e.version,seasonKey:w.seasonKey,fromClubId:w.fromClubId,offers:w.offers.map(o=>({...o})),selectedOfferKey:w.selectedOfferKey??null,emptyReason:w.offers.length?null:'NO_ELIGIBLE_CLUB_CAPACITY_OR_BUDGET',registrationQualifiedSeasons:w.snapshot.qualifiedSeasons,retirementAvailable:w.state!=='ACCEPTED'};
}
/** Pure accepted-renewal guard for root/year readers; no live value recalculation and no recursive career view. */
export function assertAcceptedKboCareerFa(source:Source):KboCareerFaWindow {
 const w=active(source),r=source.renewal,e=event(source,w);
 if(w.state!=='ACCEPTED'||!r||r.status!=='ACCEPTED'||!w.contract||r.offerKey!==w.contract.contractKey||r.eventKey!==w.eventKey||r.playerKey!==w.playerKey||r.clubId!==w.contract.clubId||r.seasonKey!==w.seasonKey||r.years!==w.contract.years||r.annualSalaryWon!==w.contract.annualSalaryWon||r.previousSalaryWon!==w.snapshot.contract.annualSalaryWon||r.valueWon!==w.valueWon||canonicalJson(r.basis)!==canonicalJson(w.basis)||e.status!=='RESOLVED'||e.resolution?.kind!=='DOMAIN'||e.resolution.receiptKey!==w.receiptKey||e.resolution.command!==(e.definitionId==='E33'?'ACCEPT_ROLE':'ACCEPT_CAREER_OFFER'))throw new RangeError('KBO_FA_ACCEPTED_CONTRACT_CHANGED');return w;
}
/** Private Y02 after staged contract creation, before expiring NPC removal/minimum-roster repair. */
export function activateKboCareerFa(source:Source,next:Source):void {
 const w=assertAcceptedKboCareerFa(source),c=w.contract!,key=w.playerKey;
 const staged=next.world.contracts[key],base={...staged};delete base.servicePay;
 if(![w.sourceSeasonKey,w.seasonKey].includes(next.world.seasonKey)||!staged||staged.remainderPay||canonicalJson(base)!==canonicalJson(c))throw new RangeError('KBO_FA_ACTIVATION_CHANGED');
 const from=next.world.clubs.find(t=>t.id===w.fromClubId)!,to=next.world.clubs.find(t=>t.id===c.clubId)!;
 if(!from||!to)throw new RangeError('KBO_FA_CLUB_MISSING');
 if(from.id!==to.id){from.roster=from.roster.filter(k=>k!==key);from.firstTeam=from.firstTeam.filter(k=>k!==key);to.roster=[...to.roster.filter(k=>k!==key),key].sort();to.firstTeam=to.firstTeam.filter(k=>k!==key);}
 next.protagonistClubId=to.id;next.rights={...next.rights,sourceType:'FREE_AGENT',holderOrgId:to.id};next.registration={...next.registration,clubId:to.id,seasonKey:w.seasonKey,firstTeam:to.firstTeam.includes(key),competitionKey:to.firstTeam.includes(key)?'KBO':'FUTURES'};
 if(from.id!==to.id){
  const day=source.days!.days.at(-1)!.day;
  next.relationships.relations=next.relationships.relations.map(r=>r.primaryPlayerKey===key&&['FORMED','REUNITED_TEAM'].includes(r.stage)&&from.roster.includes(r.otherPlayerKey)&&!to.roster.includes(r.otherPlayerKey)?{...r,stage:'SEPARATED',milestones:[...r.milestones,{stage:'SEPARATED',worldDay:day,evidenceKey:JSON.stringify(['relation-separation',r.relationKey,w.receiptKey])}]}:r);
  const world={worldKey:next.world.worldKey,seasonKey:w.seasonKey,leagueKey:'KBO',protagonistKey:key,protagonistSchoolId:to.id,schools:next.world.clubs,players:next.world.players};
  next.relationships=formRegisteredTeamTeammate(next.relationships,world,w.receiptKey!,0);next.relationNotices=queueRelationFormationNotices({...next,world,previousSeasons:[...(next.amateurHistory.previousSeasons??[]),{world:next.amateurHistory.world}]},0)??[];
 }
}

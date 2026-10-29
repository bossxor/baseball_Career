import {refreshCareerRepertoireEvents} from './repertoire-events.js';
import {KBO_MONEY,KBO_ROSTER_LIMITS} from '@playball/rules';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import type {KboCareer} from './kbo-career-entry.js';
import {kboCareerEntryView} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {kboPlayerContractValue,kboRenewalSalaryWon,kboFreeAgentTerms} from './kbo-contract-value.js';
import {kboClubBalance,kboFutureCommitmentWon,kboRecruitmentOpen} from './kbo-finance.js';
import {kboAiRoleNeed} from './kbo-ai-offseason.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import {KBO_RETURN_WINDOW_DAYS} from './kbo-return.js';
import {usYearTransitionReadiness} from './us-year-transition.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {assertUsMinorMarket} from './us-minor-market.js';
import {recordTotals} from './records.js';
import {canonicalJson} from './game.js';
import {createWorldEvent,completeEventDomain,completeBlockingEvent,resolveEventChoice,cancelInvalidEvent,validateEvent} from './events.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {emptyPitchXpLedger,validatePitchXpLedger} from './pitch-xp.js';
import {validatePitchWeights} from './repertoire.js';
import {closeSeasonHealth} from './health.js';
import {assertSeasonCalendar} from './season-calendar.js';
import {formRegisteredTeamTeammate} from './team-teammates.js';
import {queueRelationFormationNotices} from './relation-notices.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';

/** Trusted latest domestic state, supplied by its owner; never generated from the departure snapshot. */
export interface UsKboReturnAuthority {receiptKey:string;revision:number;host:KboCareer}
export interface UsKboReturnOffer {offerKey:string;clubId:string;years:number;annualSalaryWon:number;signingBonusWon:0;currency:'KRW'}
export interface UsKboOwnershipReceipt {
 receiptKey:string;worldKey:string;playerKey:string;fromSeasonKey:string;targetSeasonKey:string;usSourceRevision:number;usArchivedRevision:number;authorityReceiptKey:string;authoritySourceRevision:number;authorityNextRevision:number;originalKboRevision:number;expiredUsContractKey:string;kboContractKey:string;offerKey:string;requiresAtomicCommit:true;
}
export interface UsKboReturnQuote {
 returnId:string;status:'OPEN'|'ACCEPTED';eventKey:string;marketEventKey:string;marketId:string;sourceRevision:number;authorityReceiptKey:string;authorityRevision:number;originalKboRevision:number;targetSeasonKey:string;route:'ORIGINAL_CLUB_PRIORITY'|'DOMESTIC_FA';holderClubId:string|null;issuedWorldDay:number;expiresWorldDay:number;offers:UsKboReturnOffer[];ownership?:UsKboOwnershipReceipt;
}
const same=(a:unknown,b:unknown)=>a===undefined||b===undefined?a===b:canonicalJson(a)===canonicalJson(b);
const returnId=(c:UsCareer)=>JSON.stringify(['us-kbo-return',c.activation.receiptKey,c.world.seasonKey,c.contract.contractKey]);

/** Root-reader hook: no root revision assertion here, so imports cannot recurse. */
export function assertUsKboReturnQuote(c:UsCareer):void {
 const q=c.domesticReturn;if(q===undefined)return;
 if(!q||typeof q!=='object'||!c.kboTransfer?.origin||c.contract.type!=='US_MINOR'||q.returnId!==returnId(c)||!['OPEN','ACCEPTED'].includes(q.status)||q.targetSeasonKey!==String(Number(c.world.seasonKey)+1)||!Number.isSafeInteger(q.sourceRevision)||q.sourceRevision<c.activation.sourceRevision||q.sourceRevision>=c.revision||!q.authorityReceiptKey||!Number.isSafeInteger(q.authorityRevision)||q.authorityRevision<1||!Number.isSafeInteger(q.originalKboRevision)||q.originalKboRevision!==c.kboTransfer.sourceRevision||!Number.isSafeInteger(q.issuedWorldDay)||q.issuedWorldDay<0||q.expiresWorldDay!==q.issuedWorldDay+KBO_RETURN_WINDOW_DAYS||!Array.isArray(q.offers)||q.offers.some(o=>!o||typeof o!=='object')||new Set(q.offers.map(o=>o.clubId)).size!==q.offers.length)throw new RangeError('INVALID_US_KBO_RETURN');
 const rights=c.kboTransfer.returnRights;
 if(q.route!==(rights?'ORIGINAL_CLUB_PRIORITY':'DOMESTIC_FA')||q.holderClubId!==(rights?.holderClubId??null)||q.offers.some(o=>o.offerKey!==JSON.stringify(['us-kbo-return-offer',q.returnId,o.clubId])||rights&&o.clubId!==rights.holderClubId||o.currency!=='KRW'||o.signingBonusWon!==0||!Number.isSafeInteger(o.years)||o.years<1||o.years>4||!Number.isSafeInteger(o.annualSalaryWon)||o.annualSalaryWon%10000!==0||o.annualSalaryWon<KBO_MONEY.minimumSalaryWon||o.annualSalaryWon>KBO_MONEY.maximumSalaryWon))throw new RangeError('INVALID_US_KBO_RETURN');
 const e=c.events.find(e=>e.eventKey===q.eventKey),m=c.events.find(e=>e.eventKey===q.marketEventKey);
 if(!e||e.definitionId!=='E67'||e.worldKey!==c.world.worldKey||e.seasonKey!==c.world.seasonKey||e.evidence.fields.playerSimulationKey!==c.protagonistKey||e.evidence.fields.contractWindowIdOrReturnProgramId!==q.returnId||e.evidence.fields.stage!=='KBO_MINOR_EXPIRED_RETURN'||e.resume.phase!=='SEASON_REVIEW'||e.resume.registrationKey!==c.protagonistOrganizationId||e.resume.competitionKey!==c.registration.level||e.resume.sourceRevision!==q.sourceRevision+1||e.occurredWorldDay!==q.issuedWorldDay||e.deadlineWorldDay!==q.expiresWorldDay||!m||m.definitionId!=='E66'||m.evidence.fields.contractWindowIdOrReturnProgramId!==q.marketId||m.evidence.fields.playerSimulationKey!==c.protagonistKey)throw new RangeError('INVALID_US_KBO_RETURN');
 validateEvent(e);validateEvent(m);
 if(q.status==='OPEN'){if(c.phaseContext.phase!=='SEASON_REVIEW'||q.ownership!==undefined||e.status!=='OPEN'||m.status!=='OPEN'||c.minorMarket?.marketId!==q.marketId)throw new RangeError('INVALID_US_KBO_RETURN');}
 else{
  const r=q.ownership,offer=q.offers.find(o=>o.offerKey===r?.offerKey);
  if(c.phaseContext.phase!=='ARCHIVED'||c.retirement!==undefined||c.minorMarket!==undefined||!r||!offer||r.receiptKey!==JSON.stringify(['us-kbo-ownership',q.returnId,offer.offerKey,q.authorityReceiptKey,q.authorityRevision])||r.worldKey!==c.world.worldKey||r.playerKey!==c.protagonistKey||r.fromSeasonKey!==c.world.seasonKey||r.targetSeasonKey!==q.targetSeasonKey||!Number.isSafeInteger(r.usSourceRevision)||r.usSourceRevision<q.sourceRevision+1||!Number.isSafeInteger(r.usArchivedRevision)||r.usArchivedRevision!==r.usSourceRevision+1||r.usArchivedRevision>c.revision||r.authorityReceiptKey!==q.authorityReceiptKey||r.authoritySourceRevision!==q.authorityRevision||r.authorityNextRevision!==Math.max(r.usSourceRevision,q.authorityRevision)+1||r.originalKboRevision!==q.originalKboRevision||r.expiredUsContractKey!==c.contract.contractKey||r.kboContractKey!==JSON.stringify(['us-kbo-contract',q.returnId,offer.offerKey])||r.requiresAtomicCommit!==true||e.status!=='RESOLVED'||e.resolution?.kind!=='DOMAIN'||e.resolution.command!=='CONFIRM_DOMESTIC_RETURN'||e.resolution.receiptKey!==r.receiptKey||m.status!=='RESOLVED'||m.resolution?.kind!=='DOMAIN'||m.resolution.command!=='CONFIRM_DOMESTIC_RETURN'||m.resolution.receiptKey!==r.receiptKey)throw new RangeError('INVALID_US_KBO_RETURN');
 }
}
function eligible(c:UsCareer):void {
 const ready=usYearTransitionReadiness(c),allowed=new Set([c.minorMarket?.eventKey,c.domesticReturn?.eventKey]);
 if(!c.kboTransfer?.origin||c.contract.type!=='US_MINOR'||c.phaseContext.phase!=='SEASON_REVIEW'||ready.remainingMinorControlSeasons!==0||ready.blockers.some(b=>!['CONTRACT_DECISION_REQUIRED','OPEN_EVENT'].includes(b))||c.events.some(e=>e.status==='OPEN'&&!allowed.has(e.eventKey)))throw new RangeError('US_KBO_RETURN_NOT_AVAILABLE');
 assertUsMinorMarket(c);auditUsClosedDays(c);auditUsCompletedPostseason(c);
}
function authority(c:UsCareer,source:KboCareer,a:UsKboReturnAuthority,expectedRevision:number):void {
 if(!a||!a.receiptKey||!Number.isSafeInteger(a.revision)||a.revision<1||a.revision!==expectedRevision||a.host?.revision!==a.revision)throw new RangeError('STALE_US_KBO_AUTHORITY');
 assertKboCareerRevision(source,c.kboTransfer!.sourceRevision);assertKboCareerRevision(a.host,a.revision);
 const t=c.kboTransfer!,h=a.host,w=h.world,key=c.protagonistKey,target=String(Number(c.world.seasonKey)+1);
 if(source.phaseContext.phase!=='ARCHIVED'||source.protagonistKey!==key||source.world.seasonKey!==t.kboSeasonKey||h.phaseContext.phase!=='ARCHIVED'||h.protagonistKey!==key||w.status!=='ACTIVE'||w.worldKey!==c.world.worldKey||source.world.worldKey!==w.worldKey||w.seed!==c.world.seed||source.world.seed!==w.seed||w.difficulty!==c.difficulty||h.difficulty!==c.difficulty||source.difficulty!==c.difficulty||!['COMPLETED','NOT_APPLICABLE'].includes(c.military.status)||source.military?.status!==c.military.status||h.military?.status!==c.military.status||w.seasonKey!==target||w.calendar.year!==Number(target)||Object.hasOwn(w.players,key)||Object.hasOwn(w.contracts,key)||Object.hasOwn(w.suspendedContracts??{},key)||w.clubs.some(o=>o.roster.includes(key)||o.firstTeam.includes(key))||h.events.some(e=>e.status==='OPEN')||h.records.revision<c.records.revision||Object.values(h.records.games).some(g=>g.scope.seasonKey===target))throw new RangeError('US_KBO_AUTHORITY_CHANGED');
 assertSeasonCalendar(w.calendar);assertKboRecruitmentWorld(w);
 const row=t.source==='POSTING'?source.posting?.windows.find(s=>s.postingId===t.postingId):source.overseasFa?.windows.find(s=>s.windowId===t.windowId);
 if(!row||row.status!=='SIGNED'||row.signedOfferKey!==t.offer.offerKey||!same(row.offers?.find(o=>o.offerKey===row.signedOfferKey),t.offer)||!same(source.posting,h.posting)||!same(source.overseasFa,h.overseasFa)||t.source==='POSTING'&&!same(source.posting?.windows.find(s=>s.postingId===t.postingId)?.returnRights,t.returnRights)||t.source==='OVERSEAS_FA'&&t.returnRights!==null)throw new RangeError('US_KBO_ORIGINAL_SOURCE_CHANGED');
 for(const [id,g]of Object.entries(c.records.games))if(!Object.hasOwn(h.records.games,id)||!same(h.records.games[id],g))throw new RangeError('US_KBO_RECORD_CONFLICT');
}
function offers(c:UsCareer,a:UsKboReturnAuthority):UsKboReturnOffer[] {
 const w=a.host.world,p={...c.world.players[c.protagonistKey]!,age:c.world.players[c.protagonistKey]!.age+1},t=recordTotals(c.records,{leagueKey:c.registration.level,phase:'REGULAR',seasonKey:c.world.seasonKey}),bat=t.batting[c.protagonistKey],pit=t.pitching[c.protagonistKey],rights=c.kboTransfer!.returnRights,value=kboPlayerContractValue(p,bat,pit),fa=kboFreeAgentTerms(p,bat,pit),salary=rights?kboRenewalSalaryWon(rights.annualSalaryWon,value.valueWon):fa.annualSalaryWon;
 return w.clubs.filter(club=>(!rights||club.id===rights.holderClubId)&&kboRecruitmentOpen(w,club.id)&&club.roster.length<KBO_ROSTER_LIMITS.maximum&&salary<=KBO_MONEY.maximumSalaryWon&&kboClubBalance(w,club.id).availableWon>=salary&&club.paidSalaryWon+club.reservedSalaryWon+salary<=club.budgetWon*.9&&Array.from({length:fa.years-1},(_,i)=>i+1).every(y=>kboFutureCommitmentWon(w,club.id,y)+salary<=club.budgetWon*.9)).map(club=>({club,need:kboAiRoleNeed(p,club.roster.map(k=>w.players[k]!))})).sort((a,b)=>b.need.needScore-a.need.needScore||a.need.incumbentRoleScore-b.need.incumbentRoleScore||(a.club.id<b.club.id?-1:1)).map(({club})=>({offerKey:JSON.stringify(['us-kbo-return-offer',returnId(c),club.id]),clubId:club.id,years:fa.years,annualSalaryWon:salary,signingBonusWon:0,currency:'KRW'}));
}
/** Quote/start returns an unchanged-money US root. Authority is revalidated at actual accept. */
export function openUsKboReturn(c:UsCareer,revision:number,source:KboCareer,a:UsKboReturnAuthority,authorityRevision:number):UsCareer {
 assertUsCareerRevision(c,revision);eligible(c);authority(c,source,a,authorityRevision);
 if(c.domesticReturn){assertUsKboReturnQuote(c);if(c.domesticReturn.authorityReceiptKey!==a.receiptKey||c.domesticReturn.authorityRevision!==a.revision||!same(c.domesticReturn.offers,offers(c,a)))throw new RangeError('US_KBO_RETURN_QUOTE_CHANGED');return c;}
 const id=returnId(c),day=Math.max(c.season!.lastDay,c.events.find(e=>e.eventKey===c.minorMarket!.eventKey)!.occurredWorldDay),event=createWorldEvent({definitionId:'E67',worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,evidence:{version:1,type:'US_RETURN',fields:{playerSimulationKey:c.protagonistKey,contractWindowIdOrReturnProgramId:id,stage:'KBO_MINOR_EXPIRED_RETURN'}},resume:{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:c.registration.level,registrationKey:c.protagonistOrganizationId,sourceRevision:c.revision+1},sourceSequence:c.events.reduce((n,e)=>Math.max(n,e.sourceSequence),0)+1,worldDay:day,deadlineWorldDay:day+KBO_RETURN_WINDOW_DAYS});
 const next:UsCareer={...c,revision:c.revision+1,events:[...c.events,event],domesticReturn:{returnId:id,status:'OPEN',eventKey:event.eventKey,marketEventKey:c.minorMarket!.eventKey,marketId:c.minorMarket!.marketId,sourceRevision:c.revision,authorityReceiptKey:a.receiptKey,authorityRevision:a.revision,originalKboRevision:source.revision,targetSeasonKey:a.host.world.seasonKey,route:c.kboTransfer!.returnRights?'ORIGINAL_CLUB_PRIORITY':'DOMESTIC_FA',holderClubId:c.kboTransfer!.returnRights?.holderClubId??null,issuedWorldDay:day,expiresWorldDay:day+KBO_RETURN_WINDOW_DAYS,offers:offers(c,a)}};assertUsKboReturnQuote(next);return next;
}
export function usKboReturnView(c:UsCareer){assertUsCareerRevision(c,c.revision);assertUsKboReturnQuote(c);const q=c.domesticReturn;if(!q)throw new RangeError('US_KBO_RETURN_NOT_OPEN');return {returnId:q.returnId,status:q.status,eventKey:q.eventKey,eventVersion:c.events.find(e=>e.eventKey===q.eventKey)!.version,targetSeasonKey:q.targetSeasonKey,route:q.route,holderClubId:q.holderClubId,offers:structuredClone(q.offers),expiresWorldDay:q.expiresWorldDay};}
/** Call inside the continuing-US writer, before its single revision commit. E66 stays its responsibility. */
export function cancelUsKboReturnQuote(c:UsCareer):UsCareer {
 if(c.domesticReturn===undefined)return c;assertUsKboReturnQuote(c);const q=c.domesticReturn!;if(q.status!=='OPEN')throw new RangeError('US_KBO_RETURN_ALREADY_ACCEPTED');
 const e=c.events.find(e=>e.eventKey===q.eventKey)!,cancelled=cancelInvalidEvent(e,e.version,'CONTINUING_US_CONTRACT',{worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:e.offeredChoices}),next={...c,events:c.events.map(e=>e.eventKey===cancelled.eventKey?cancelled:e)};delete next.domesticReturn;return next;
}
function transferredHealth(c:UsCareer,a:UsKboReturnAuthority){
 const ended=closeSeasonHealth(c.health,c.world.seasonKey).ledger,health=structuredClone(a.host.health),games=[...health.games],seen=new Map(games.map(g=>[JSON.stringify([g.evidence.gameKey,g.evidence.teamKey]),g]));
 for(const g of ended.games){const id=JSON.stringify([g.evidence.gameKey,g.evidence.teamKey]),old=seen.get(id);if(old&&!same(old,g))throw new RangeError('US_KBO_HEALTH_CONFLICT');if(!old){games.push(structuredClone(g));seen.set(id,g);}}
 health.games=games;delete health.injuries[c.protagonistKey];if(ended.injuries[c.protagonistKey])health.injuries[c.protagonistKey]=structuredClone(ended.injuries[c.protagonistKey]!);
 health.closedSeasons=[...new Set([...health.closedSeasons,...ended.closedSeasons])];return health;
}
/** Persistence must CAS both source roots and install this result plus receipt atomically. */
export function acceptUsKboReturn(c:UsCareer,revision:number,source:KboCareer,a:UsKboReturnAuthority,authorityRevision:number,input:{eventKey:string;eventVersion:number;offerKey:string;worldDay:number}):{archivedUs:UsCareer;kbo:KboCareer;ownership:UsKboOwnershipReceipt} {
 assertUsCareerRevision(c,revision);eligible(c);assertUsKboReturnQuote(c);authority(c,source,a,authorityRevision);const q=c.domesticReturn,offer=q?.offers.find(o=>o.offerKey===input.offerKey);
 if(!q||q.status!=='OPEN'||!offer||q.eventKey!==input.eventKey||q.authorityReceiptKey!==a.receiptKey||q.authorityRevision!==a.revision||!same(q.offers,offers(c,a)))throw new RangeError('US_KBO_RETURN_QUOTE_CHANGED');
 if(!Number.isSafeInteger(input.worldDay)||input.worldDay<q.issuedWorldDay||input.worldDay>=q.expiresWorldDay)throw new RangeError('US_KBO_RETURN_EXPIRED');
 const event=c.events.find(e=>e.eventKey===q.eventKey)!,context={worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,worldDay:input.worldDay,eligibleCommands:['CONFIRM_DOMESTIC_RETURN']},plan=resolveEventChoice(event,input.eventVersion,'CONFIRM_DOMESTIC_RETURN',{offerKey:offer.offerKey},context).domain!;
 const destinationRevision=Math.max(c.revision,a.revision)+1,contractKey=JSON.stringify(['us-kbo-contract',q.returnId,offer.offerKey]),ownership:UsKboOwnershipReceipt={receiptKey:JSON.stringify(['us-kbo-ownership',q.returnId,offer.offerKey,a.receiptKey,a.revision]),worldKey:c.world.worldKey,playerKey:c.protagonistKey,fromSeasonKey:c.world.seasonKey,targetSeasonKey:q.targetSeasonKey,usSourceRevision:c.revision,usArchivedRevision:c.revision+1,authorityReceiptKey:a.receiptKey,authoritySourceRevision:a.revision,authorityNextRevision:destinationRevision,originalKboRevision:source.revision,expiredUsContractKey:c.contract.contractKey,kboContractKey:contractKey,offerKey:offer.offerKey,requiresAtomicCommit:true};
 const closed=completeEventDomain(event,plan,ownership.receiptKey,context),market=c.events.find(e=>e.eventKey===q.marketEventKey)!,closedMarket=completeBlockingEvent(market,market.version,{sourceEvidenceKey:market.evidenceKey,receiptKey:ownership.receiptKey,command:'CONFIRM_DOMESTIC_RETURN'},context),archivedUs:UsCareer={...structuredClone(c),revision:c.revision+1,phaseContext:{phase:'ARCHIVED'},events:c.events.map(e=>e.eventKey===event.eventKey?closed:e.eventKey===market.eventKey?closedMarket:structuredClone(e)),domesticReturn:{...structuredClone(q),status:'ACCEPTED',ownership}};delete archivedUs.minorMarket;assertUsKboReturnQuote(archivedUs);
 const world=structuredClone(a.host.world),player={...structuredClone(c.world.players[c.protagonistKey]!),age:c.world.players[c.protagonistKey]!.age+1,fatigue:0},club=world.clubs.find(o=>o.id===offer.clubId)!,day=world.calendar.growthDays[0]!;
 world.players[c.protagonistKey]=player;world.contracts[c.protagonistKey]={contractKey,playerKey:c.protagonistKey,clubId:club.id,seasonKey:world.seasonKey,years:offer.years,annualSalaryWon:offer.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};club.roster=[...club.roster,c.protagonistKey].sort();club.reservedSalaryWon+=offer.annualSalaryWon;
 if(player.kind==='PITCHER'){const book=c.world.repertoires[c.protagonistKey];if(!book)throw new RangeError('MISSING_US_KBO_REPERTOIRE');validatePitchWeights(book.book,book.weights);validatePitchXpLedger(book.ledger);world.repertoires[c.protagonistKey]={...structuredClone(book),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};}
 const health=transferredHealth(c,a),first=selectKboFirstTeamRoster(club.roster.filter(k=>!health.injuries[k]).map(k=>world.players[k]!));if(first.length===KBO_ROSTER_LIMITS.firstTeam)club.firstTeam=first;
 assertKboRecruitmentWorld(world);
 const teamWorld={worldKey:world.worldKey,seasonKey:world.seasonKey,leagueKey:'KBO',protagonistKey:c.protagonistKey,protagonistSchoolId:club.id,schools:world.clubs,players:world.players};
 const kbo:KboCareer={...structuredClone(a.host),schemaVersion:7,revision:destinationRevision,world,records:structuredClone(a.host.records),health,protagonistKey:c.protagonistKey,protagonistClubId:club.id,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey:ownership.receiptKey,sourceYearEndReceiptKey:c.season!.receiptKey,sourceRevision:c.revision,contractKey},registration:{playerKey:c.protagonistKey,clubId:club.id,seasonKey:world.seasonKey,status:'ACTIVE',firstTeam:club.firstTeam.includes(c.protagonistKey)},rights:{...structuredClone(source.rights),sourceType:q.route==='DOMESTIC_FA'?'FREE_AGENT':'TRANSFER',holderOrgId:club.id},amateurHistory:structuredClone(c.amateurHistory),seasonGrowth:createSeasonGrowthLedger(player,world.seasonKey,world.calendar.growthDays.length),development:{...structuredClone(c.development),seasonStartPlayer:structuredClone(player)},relationships:formRegisteredTeamTeammate(structuredClone(c.relationships),teamWorld,ownership.receiptKey,day),events:structuredClone(archivedUs.events),relationNotices:structuredClone(c.relationNotices),styleUsedWindows:[...c.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}],...(c.goals?{goals:structuredClone(c.goals)}:{})};
 for(const field of ['days','seasonClose','postseason','preseasonPlan','openingRoster','competitionSchedule','callupReviews','renewal','remainderRenewal','retirement','offseasonExit'] as const)delete kbo[field];
 if(c.achievements)kbo.achievements=structuredClone(c.achievements);else delete kbo.achievements;
 if(c.agents)kbo.agents=structuredClone(c.agents);else delete kbo.agents;
 if(c.traits)kbo.traits={...structuredClone(c.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};else delete kbo.traits;
 const notices=queueRelationFormationNotices({...kbo,world:teamWorld},day);if(notices)kbo.relationNotices=notices;
 if(c.retryCareer!==undefined)kbo.retryCareer=structuredClone(c.retryCareer);else delete kbo.retryCareer;
 if(c.repertoireEvents!==undefined)kbo.repertoireEvents=structuredClone(c.repertoireEvents);else delete kbo.repertoireEvents;
 if(c.advice!==undefined)kbo.advice=structuredClone(c.advice);else delete kbo.advice;
 if(c.adviceMorale!==undefined)kbo.adviceMorale=structuredClone(c.adviceMorale);else delete kbo.adviceMorale;
 if(c.proResults!==undefined)kbo.proResults=structuredClone(c.proResults);else delete kbo.proResults;
 kboCareerEntryView(kbo);return {archivedUs,kbo:refreshCareerRepertoireEvents(refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(kbo))),ownership};
}

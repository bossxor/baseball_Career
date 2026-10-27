import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer,ActiveUsRosterWorld,KboUsTransfer} from './us-career-entry.js';
import {assertActiveUsRosterWorld} from './us-career-entry.js';
import type {UsRosterWorld,UsLevel} from './us-world.js';
import {assertInitialUsRosterWorld} from './us-world.js';
import type {UsRecruitmentWorld} from './us-direct.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {emptyPitchXpLedger,validatePitchXpLedger} from './pitch-xp.js';
import {refreshCareerSeasonGoals} from './season-goals.js';
import {validatePitchWeights} from './repertoire.js';

function signedOffer(c:KboCareer){
 const posting=c.posting?.windows.find(w=>w.status==='SIGNED'&&w.signedOfferKey&&w.offers&&w.sealedPlayer);
 if(posting){const offer=posting.offers!.find(o=>o.offerKey===posting.signedOfferKey);if(!offer||!posting.returnRights)throw new RangeError('KBO_US_POSTING_INCOMPLETE');return {kind:'POSTING' as const,offer,returnRights:posting.returnRights,id:posting.postingId,player:posting.sealedPlayer!};}
 const overseas=c.overseasFa?.windows.find(w=>w.status==='SIGNED'&&w.signedOfferKey&&w.sealedPlayer);
 if(overseas){const offer=overseas.offers.find(o=>o.offerKey===overseas.signedOfferKey);if(!offer)throw new RangeError('KBO_US_OVERSEAS_INCOMPLETE');return {kind:'OVERSEAS_FA' as const,offer,returnRights:null,id:overseas.windowId,player:overseas.sealedPlayer!};}
 throw new RangeError('KBO_US_TRANSFER_NOT_READY');
}

/** Builds a US career root from a sealed KBO posting/overseas FA. Does not re-pay the KBO club fee. */
export function activateKboUsCareer(source:KboCareer,revision:number,roster:UsRosterWorld,inventory:UsRecruitmentWorld):UsCareer {
 assertKboCareerRevision(source,revision);if(source.phaseContext.phase!=='ARCHIVED')throw new RangeError('KBO_US_TRANSFER_NOT_READY');
 const military=source.military?.status;if(military!=='COMPLETED'&&military!=='NOT_APPLICABLE')throw new RangeError('KBO_US_MILITARY_BLOCKED');
 const signed=signedOffer(source),key=source.protagonistKey;if(signed.player.simulationKey!==key)throw new RangeError('KBO_US_PLAYER_MISSING');
 if(Object.hasOwn(roster.players,key))throw new RangeError('KBO_US_PLAYER_ALREADY_REGISTERED');
 if(roster.worldKey!==source.world.worldKey||roster.seed!==source.world.seed||roster.seasonKey!==String(Number(source.world.seasonKey)+1))throw new RangeError('KBO_US_WORLD_MISMATCH');
 assertInitialUsRosterWorld(roster);assertUsRecruitmentWorld(inventory);
 if(roster.difficulty!==source.difficulty||inventory.seasonKey!==roster.seasonKey||inventory.worldKey!==roster.worldKey||inventory.seed!==roster.seed)throw new RangeError('KBO_US_INVENTORY_MISMATCH');
 const offer=signed.offer,org=roster.organizations.find(o=>o.id===offer.organizationId);if(!org)throw new RangeError('KBO_US_ORG_MISSING');
 const club=inventory.clubs.find(c=>c.id===offer.organizationId);if(!club||club.availableBudgetUsd<offer.annualSalaryUsd)throw new RangeError('KBO_US_BUDGET_REQUIRED');
 const level:UsLevel=offer.initialLevel==='MLB'?'MLB':offer.initialLevel==='AAA'||offer.kind==='MILB'?'AAA':'ROOKIE';
 const calendar=createSeasonCalendar(Number(roster.seasonKey),'calendar-2'),world:ActiveUsRosterWorld={...structuredClone(roster),status:'ACTIVE',calendar},nextPlayer={...structuredClone(signed.player),fatigue:0},live=world.organizations.find(o=>o.id===org.id)!;
 if(level==='MLB'){
  const other=live.levels.MLB.find(k=>world.players[k]!.kind===nextPlayer.kind&&world.players[k]!.position===nextPlayer.position);if(!other)throw new RangeError('KBO_US_MLB_SLOT');
  live.levels.MLB=live.levels.MLB.filter(k=>k!==other).concat(key).sort();live.levels.AAA=[...live.levels.AAA,other].sort();
 }else live.levels[level]=[...live.levels[level],key].sort();
 world.players[key]=nextPlayer;
 if(nextPlayer.kind==='PITCHER'){
  const old=source.world.repertoires[key]??source.amateurHistory.world.repertoires[key];if(!old)throw new RangeError('MISSING_YEAR_END_REPERTOIRE');
  validatePitchWeights(old.book,old.weights);validatePitchXpLedger(old.ledger);world.repertoires[key]={...structuredClone(old),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 assertActiveUsRosterWorld(world);
 const nextInventory:UsRecruitmentWorld={...structuredClone(inventory),registeredPlayerKeys:[...new Set([...inventory.registeredPlayerKeys,key])].sort(),clubs:inventory.clubs.map(c=>c.id===offer.organizationId?{...c,availableBudgetUsd:c.availableBudgetUsd-offer.annualSalaryUsd}:c)};assertUsRecruitmentWorld(nextInventory);
 const contractKey=JSON.stringify(['kbo-us-transfer',signed.id,offer.offerKey]),contract:UsCareer['contract']={contractKey,type:offer.kind==='MLB'?'US_MAJOR':'US_MINOR',currency:'USD',years:offer.years,annualSalaryUsd:offer.annualSalaryUsd,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:world.seasonKey,nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption};
 const transfer:KboUsTransfer={source:signed.kind,...(signed.kind==='POSTING'?{postingId:signed.id}:{windowId:signed.id}),offer:structuredClone(offer),returnRights:signed.returnRights?structuredClone(signed.returnRights):null,kboSeasonKey:source.world.seasonKey,sourceRevision:revision};
 const us:UsCareer={schemaVersion:1,mode:'US_CAREER',revision:revision+1,difficulty:source.difficulty,world,protagonistKey:key,protagonistOrganizationId:offer.organizationId,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey:JSON.stringify(['kbo-us-activation',signed.id]),sourceYearEndReceiptKey:signed.id,sourceRevision:revision,contractKey,populationBasis:'KBO_TRANSFER'},registration:{playerKey:key,clubId:offer.organizationId,level,seasonKey:world.seasonKey,status:'ACTIVE'},rights:{territory:'US',holderOrgId:offer.organizationId,sourceType:'AMATEUR',playerKey:key},contract,income:[],inventory:nextInventory,amateurHistory:structuredClone(source.amateurHistory),records:structuredClone(source.records),health:structuredClone(source.health),seasonGrowth:createSeasonGrowthLedger(nextPlayer,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(source.development!),seasonStartPlayer:structuredClone(nextPlayer)},relationships:structuredClone(source.relationships),events:structuredClone(source.events),relationNotices:structuredClone(source.relationNotices??[]),styleUsedWindows:[...source.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...nextPlayer.focus],archetype:nextPlayer.archetype}],military:{status:military,deadlineAge:28},kboTransfer:transfer};
 if(source.traits)us.traits={...structuredClone(source.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};if(source.goals)us.goals=source.goals;
 return refreshCareerSeasonGoals(us);
}

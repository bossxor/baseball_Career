import {KBO_POSTING_FEE_RATE} from './kbo-posting.js';
import {refreshCareerRepertoireEvents} from './repertoire-events.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer,ActiveUsRosterWorld,KboUsTransfer} from './us-career-entry.js';
import {assertActiveUsRosterWorld,assertUsCareerRevision} from './us-career-entry.js';
import type {UsRosterWorld,UsLevel} from './us-world.js';
import {assertInitialUsRosterWorld} from './us-world.js';
import type {UsRecruitmentWorld} from './us-direct.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';
import {emptyPitchXpLedger,validatePitchXpLedger} from './pitch-xp.js';
import {refreshCareerSeasonGoals,refreshCareerPreseasonGoalSelection} from './season-goals.js';
import {validatePitchWeights} from './repertoire.js';

function signedOffer(c:KboCareer){
 const posting=c.posting?.windows.find(w=>w.seasonKey===c.world.seasonKey&&w.status==='SIGNED'&&w.signedOfferKey&&w.offers&&w.sealedPlayer);
 if(posting){const offer=posting.offers!.find(o=>o.offerKey===posting.signedOfferKey);if(!offer||!posting.returnRights)throw new RangeError('KBO_US_POSTING_INCOMPLETE');return {kind:'POSTING' as const,offer,returnRights:posting.returnRights,id:posting.postingId,player:posting.sealedPlayer!,repertoire:posting.sealedRepertoire};}
 const overseas=c.overseasFa?.windows.find(w=>w.seasonKey===c.world.seasonKey&&w.status==='SIGNED'&&w.signedOfferKey&&w.sealedPlayer);
 if(overseas){const offer=overseas.offers.find(o=>o.offerKey===overseas.signedOfferKey);if(!offer)throw new RangeError('KBO_US_OVERSEAS_INCOMPLETE');return {kind:'OVERSEAS_FA' as const,offer,returnRights:null,id:overseas.windowId,player:overseas.sealedPlayer!,repertoire:overseas.sealedRepertoire};}
 throw new RangeError('KBO_US_TRANSFER_NOT_READY');
}

/** Past KBO relations whose person is in neither the US world nor the carried amateur history keep a sealed identity (read-only projection source). */
function sealedRelationIdentities(source:KboCareer,us:UsCareer):NonNullable<UsCareer['relationIdentities']>|undefined {
 const known=new Set([...Object.keys(us.world.players),...Object.keys(source.amateurHistory.world.players),...(source.amateurHistory.previousSeasons??[]).flatMap(a=>Object.keys(a.world.players))]),out:Record<string,NonNullable<UsCareer['relationIdentities']>[string]>={};
 for(const r of source.relationships.relations){
  const key=r.otherPlayerKey;if(known.has(key)||Object.hasOwn(out,key))continue;
  const club=source.world.clubs.find(c=>c.roster.includes(key)),player=source.world.players[key]??source.freeAgents?.players[key]?.player??source.retiredPlayers?.find(p=>p.playerKey===key)?.player;
  if(player)out[key]={player:structuredClone(player),lastKnownRegistration:club?{seasonKey:source.world.seasonKey,leagueKey:'KBO',teamId:club.id,teamName:club.name}:null};
 }
 return Object.keys(out).length?out:undefined;
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
 const postingFeeUsd=signed.kind==='POSTING'?Math.round(offer.annualSalaryUsd*offer.years*KBO_POSTING_FEE_RATE):0,cost=offer.annualSalaryUsd+postingFeeUsd;
 const club=inventory.clubs.find(c=>c.id===offer.organizationId);if(!club||club.availableBudgetUsd<cost)throw new RangeError('KBO_US_BUDGET_REQUIRED');
 const level:UsLevel=offer.initialLevel==='MLB'?'MLB':offer.initialLevel==='AAA'||offer.kind==='MILB'?'AAA':'ROOKIE';
 const calendar=createSeasonCalendar(Number(roster.seasonKey),'calendar-2'),world:ActiveUsRosterWorld={...structuredClone(roster),status:'ACTIVE',calendar},nextPlayer={...structuredClone(signed.player),age:signed.player.age+1,fatigue:0},live=world.organizations.find(o=>o.id===org.id)!;
 if(level==='MLB'){
  const other=live.levels.MLB.find(k=>world.players[k]!.kind===nextPlayer.kind&&world.players[k]!.position===nextPlayer.position);if(!other)throw new RangeError('KBO_US_MLB_SLOT');
  live.levels.MLB=live.levels.MLB.filter(k=>k!==other).concat(key).sort();live.levels.AAA=[...live.levels.AAA,other].sort();
 }else live.levels[level]=[...live.levels[level],key].sort();
 world.players[key]=nextPlayer;
 if(nextPlayer.kind==='PITCHER'){
  const old=signed.repertoire??source.world.repertoires[key]??source.amateurHistory.world.repertoires[key];if(!old)throw new RangeError('MISSING_YEAR_END_REPERTOIRE');
  validatePitchWeights(old.book,old.weights);validatePitchXpLedger(old.ledger);world.repertoires[key]={...structuredClone(old),seasonId:world.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 assertActiveUsRosterWorld(world);
 const nextInventory:UsRecruitmentWorld={...structuredClone(inventory),registeredPlayerKeys:[...new Set([...inventory.registeredPlayerKeys,key])].sort(),clubs:inventory.clubs.map(c=>c.id===offer.organizationId?{...c,availableBudgetUsd:c.availableBudgetUsd-cost}:c)};assertUsRecruitmentWorld(nextInventory);
 const contractKey=JSON.stringify(['kbo-us-transfer',signed.id,offer.offerKey]),contract:UsCareer['contract']={contractKey,type:offer.kind==='MLB'?'US_MAJOR':'US_MINOR',currency:'USD',years:offer.years,annualSalaryUsd:offer.annualSalaryUsd,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:world.seasonKey,nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption};
 const transfer:KboUsTransfer={source:signed.kind,...(signed.kind==='POSTING'?{postingId:signed.id}:{windowId:signed.id}),offer:structuredClone(offer),returnRights:signed.returnRights?structuredClone(signed.returnRights):null,kboSeasonKey:source.world.seasonKey,sourceRevision:revision,origin:{playerAge:nextPlayer.age,contract:structuredClone(contract),inventory:structuredClone(nextInventory)}};
 const us:UsCareer={schemaVersion:1,mode:'US_CAREER',revision:revision+1,difficulty:source.difficulty,world,protagonistKey:key,protagonistOrganizationId:offer.organizationId,phaseContext:{phase:'PRESEASON_SETUP'},activation:{receiptKey:JSON.stringify(['kbo-us-activation',signed.id]),sourceYearEndReceiptKey:signed.id,sourceRevision:revision,contractKey,populationBasis:'KBO_TRANSFER'},registration:{playerKey:key,clubId:offer.organizationId,level,seasonKey:world.seasonKey,status:'ACTIVE'},rights:{territory:'US',holderOrgId:offer.organizationId,sourceType:'AMATEUR',playerKey:key},contract,income:[],inventory:nextInventory,amateurHistory:structuredClone(source.amateurHistory),records:structuredClone(source.records),health:structuredClone(source.health),seasonGrowth:createSeasonGrowthLedger(nextPlayer,world.seasonKey,calendar.growthDays.length),development:{...structuredClone(source.development!),seasonStartPlayer:structuredClone(nextPlayer)},relationships:structuredClone(source.relationships),events:structuredClone(source.events),relationNotices:structuredClone(source.relationNotices??[]),styleUsedWindows:[...source.styleUsedWindows],planHistory:[{completedTeamGames:0,focus:[...nextPlayer.focus],archetype:nextPlayer.archetype}],military:{status:military,deadlineAge:28},kboTransfer:transfer};
 if(source.achievements)us.achievements=structuredClone(source.achievements);if(source.agents)us.agents=structuredClone(source.agents);if(source.traits)us.traits={...structuredClone(source.traits),lastClosedDay:null,lastSeasonKey:world.seasonKey};if(source.goals)us.goals=source.goals;
 if(source.retryCareer!==undefined)us.retryCareer=structuredClone(source.retryCareer);
 if(source.repertoireEvents!==undefined)us.repertoireEvents=structuredClone(source.repertoireEvents);
 if(source.advice!==undefined)us.advice=structuredClone(source.advice);
 if(source.adviceMorale!==undefined)us.adviceMorale=structuredClone(source.adviceMorale);
 if(source.proResults!==undefined)us.proResults=structuredClone(source.proResults);
 if(source.proAwards!==undefined)us.proAwards=structuredClone(source.proAwards);
 if(source.aliases!==undefined)us.aliases=structuredClone(source.aliases);
 if(source.recordCorrections!==undefined)us.recordCorrections=structuredClone(source.recordCorrections);
 const identities=sealedRelationIdentities(source,us);if(identities)us.relationIdentities=identities;
 assertUsCareerRevision(us,us.revision);return refreshCareerRepertoireEvents(refreshCareerPreseasonGoalSelection(refreshCareerSeasonGoals(us)));
}

import type {UsCareer} from './us-career-entry.js';
import type {UsMinorYearArchive} from './us-minor-history.js';
import type {UsContractMarket} from './us-contracts.js';
import {usMajorContractTerms,usContractForOffer,assertUsContractMarket} from './us-contracts.js';
import type {DevelopmentPlayer} from './player.js';
import {fundUsMinorYear,openingUsMinorInventory} from './us-minor-history.js';
import {recordTotals} from './records.js';
import {recentBattingPerformance,recentPitchingPerformance} from './lineup.js';
import {emptyBatting,emptyPitching} from './stats.js';
import {overall} from '@playball/rules';
import {canonicalJson} from './game.js';
import {validateDevelopmentPlayer} from './player.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {assertMlbPostseason} from './us-postseason.js';

export interface UsContractTerm {startSeasonKey:string;years:number;guaranteedUsd:number}
export interface UsContractYearArchive extends UsMinorYearArchive {
 clubId:string;registration:UsCareer['registration'];rights:UsCareer['rights'];
 nextClubId:string;nextRegistration:UsCareer['registration'];nextRights:UsCareer['rights'];nextContract:UsCareer['contract'];
 market?:UsContractMarket;
}
export function usContractPerformance(c:Pick<UsCareer,'records'|'protagonistKey'>,year:string,level:string,kind:'HITTER'|'PITCHER'){
 const t=recordTotals(c.records,{seasonKey:year,leagueKey:level,phase:'REGULAR'});
 return kind==='HITTER'?recentBattingPerformance(t.batting[c.protagonistKey]??emptyBatting()):recentPitchingPerformance(t.pitching[c.protagonistKey]??emptyPitching());
}
export const usTermCovers=(contract:UsCareer['contract'],year:string)=>!!contract.term&&Number(year)>=Number(contract.term.startSeasonKey)&&Number(year)<Number(contract.term.startSeasonKey)+contract.term.years;

/** Rebuild the old offer input from its sealed roster snapshot and independently preserved annual/record evidence. */
function assertArchivedMarket(c:UsCareer,y:UsContractYearArchive):void {
 try {
  const m=y.market!,body=JSON.parse(m.sourceBasis) as {candidates:{clubId:string;players:DevelopmentPlayer[];injured:string[]}[]};
  if(!Array.isArray(body.candidates)||body.candidates.length!==30||new Set(body.candidates.map(t=>t.clubId)).size!==30||m.sourceRevision>y.sourceRevision-2)throw new RangeError('INVALID_US_CONTRACT_HISTORY');
  const players={...c.world.players},seen=new Set<string>(),injuries:UsCareer['health']['injuries']={};
  const organizations=c.world.organizations.map(org=>{
   const team=body.candidates.find(t=>t.clubId===org.id);
   if(!team||!Array.isArray(team.players)||team.players.length!==26||!Array.isArray(team.injured)||new Set(team.injured).size!==team.injured.length)throw new RangeError('INVALID_US_CONTRACT_HISTORY');
   for(const p of team.players){validateDevelopmentPlayer(p);if(seen.has(p.simulationKey))throw new RangeError('INVALID_US_CONTRACT_HISTORY');seen.add(p.simulationKey);players[p.simulationKey]=p;}
   for(const key of team.injured){if(!team.players.some(p=>p.simulationKey===key))throw new RangeError('INVALID_US_CONTRACT_HISTORY');injuries[key]={severity:'MILD',remainingTeamGames:1,diagnosedGameKey:'archived-registration',seasonKey:y.seasonKey};}
   return {...org,levels:{...org.levels,MLB:team.players.map(p=>p.simulationKey)}};
  });
  players[c.protagonistKey]=y.endingPlayer;
  const old:UsCareer={...c,revision:y.sourceRevision,world:{...c.world,seasonKey:y.seasonKey,players,organizations},protagonistOrganizationId:y.clubId,contract:y.contract,rights:y.rights,registration:y.registration,inventory:y.inventory,records:{...c.records,revision:y.recordRevision},health:{...c.health,injuries,games:c.health.games.filter(g=>Number(g.evidence.seasonKey)<=Number(y.seasonKey))},season:y.season,phaseContext:{phase:'SEASON_REVIEW'},contractMarket:m};
  assertUsContractMarket(old);
 }catch{throw new RangeError('INVALID_US_CONTRACT_HISTORY');}
}

/** Replay the original minor financial chain, then every explicit contract decision and annual carry. */
export function openingUsContractState(c:UsCareer){
 const years=c.contractYears,first=years?.[0],signing=c.amateurHistory.usRecruitment!.program.signing!;
 if(!first||Number(first.seasonKey)<Number(signing.seasonKey)||Number(first.seasonKey)>Number(signing.seasonKey)+5)throw new RangeError('INVALID_US_CONTRACT_HISTORY');
 const old:UsCareer={...c,schemaVersion:(c.minorYears?.length?3:2),protagonistOrganizationId:signing.rights.holderOrgId,world:{...c.world,seasonKey:first.seasonKey,players:{...c.world.players,[c.protagonistKey]:first.endingPlayer}}};
 let inventory=openingUsMinorInventory(old),contract:UsCareer['contract']={...signing.contract,seasonKey:first.seasonKey,status:'ACTIVE',nationalReleaseAllowed:signing.offer.nationalReleaseAllowed,militaryReturnOption:signing.offer.militaryReturnOption},rights:UsCareer['rights']={...signing.rights};
 const firstMajor=first.season.majorActivation;
 if(firstMajor){const span=first.season.lastDay-first.season.firstDay+1,extra=Math.floor((30000*(firstMajor.effectiveDay-first.season.firstDay)+800000*(first.season.lastDay-firstMajor.effectiveDay+1))/span)-30000;
  if(firstMajor.contractKey!==JSON.stringify(['us-major-entry',signing.contract.contractKey,first.seasonKey])||firstMajor.fromContractKey!==signing.contract.contractKey||firstMajor.annualSalaryUsd!==800000||firstMajor.reservedAdditionalUsd!==extra||firstMajor.effectiveDay<=first.season.firstDay||firstMajor.effectiveDay>first.season.lastDay)throw new RangeError('INVALID_US_CONTRACT_HISTORY');
  inventory=structuredClone(inventory);inventory.clubs.find(o=>o.id===signing.rights.holderOrgId)!.availableBudgetUsd-=extra;
  contract={...contract,type:'US_MAJOR',contractKey:firstMajor.contractKey,annualSalaryUsd:800000};
 }
 let previousRevision=c.activation.sourceRevision,registration=first.registration;
 const startAge=c.amateurHistory.world.players[c.protagonistKey]!.age+1;
 for(const [i,y]of years!.entries()){
  const target=String(Number(y.seasonKey)+1),p=y.endingPlayer;
  if(y.seasonKey!==String(Number(first.seasonKey)+i)||y.receiptKey!==JSON.stringify(['us-contract-year-close',c.activation.receiptKey,y.seasonKey])||!Number.isSafeInteger(y.sourceRevision)||y.sourceRevision<=previousRevision||y.sourceRevision>=c.revision||!Number.isSafeInteger(y.recordRevision)||y.recordRevision>c.records.revision||p.simulationKey!==c.protagonistKey||p.age!==startAge+Number(y.seasonKey)-Number(signing.seasonKey)||y.clubId!==rights.holderOrgId||y.registration.clubId!==y.clubId||y.registration.seasonKey!==y.seasonKey||canonicalJson(y.contract)!==canonicalJson(contract)||canonicalJson(y.rights)!==canonicalJson(rights)||canonicalJson(y.inventory)!==canonicalJson(inventory)||!y.season.growthFinalized||!y.seasonGrowth.finalized||y.seasonGrowth.seasonKey!==y.seasonKey||y.season.days.length!==y.season.lastDay-y.season.firstDay+1||y.supply.targetSeasonKey!==target||!y.postseason.bracket.championKey)throw new RangeError('INVALID_US_CONTRACT_HISTORY');
  validateDevelopmentPlayer(p);validateSeasonGrowthLedger(y.seasonGrowth);assertMlbPostseason(y.postseason.bracket);
  let charge=0;
  if(y.market){
   assertArchivedMarket(c,y);
   const m=y.market,offer=m.offers.find(o=>o.offerKey===m.acceptedOfferKey),o=overall(p.kind,p.abilities),terms=usMajorContractTerms(o.sumUnits/o.denominator,usContractPerformance(c,y.seasonKey,y.registration.level,p.kind),p.age+1);
   if(m.status!=='ACCEPTED'||m.marketKey!==JSON.stringify(['us-contract-market',c.world.worldKey,y.seasonKey,c.protagonistKey])||m.targetSeasonKey!==target||!offer||canonicalJson({annualSalaryUsd:offer.annualSalaryUsd,years:offer.years,guaranteedUsd:offer.guaranteedUsd})!==canonicalJson(terms)||canonicalJson(y.nextContract)!==canonicalJson(usContractForOffer(contract,m,offer))||y.nextClubId!==offer.clubId||y.nextRegistration.level!=='MLB'||canonicalJson(m.funding)!==canonicalJson(y.funding))throw new RangeError('INVALID_US_CONTRACT_HISTORY');
   charge=offer.guaranteedUsd;rights={territory:'US',holderOrgId:offer.clubId,sourceType:m.freeAgent?'FREE_AGENT':'RENEWAL',playerKey:c.protagonistKey};
  }else{
   if(!usTermCovers(contract,target)||y.nextClubId!==y.clubId||canonicalJson(y.nextContract)!==canonicalJson({...contract,seasonKey:target}))throw new RangeError('INVALID_US_CONTRACT_HISTORY');
  }
  if(canonicalJson(y.nextRights)!==canonicalJson(rights)||y.nextRegistration.playerKey!==c.protagonistKey||y.nextRegistration.clubId!==y.nextClubId||y.nextRegistration.seasonKey!==target||y.nextRegistration.status!=='ACTIVE')throw new RangeError('INVALID_US_CONTRACT_HISTORY');
  inventory=fundUsMinorYear(inventory,target,y.nextRegisteredPlayerKeys,y.funding,y.nextClubId,charge);contract=y.nextContract;registration=y.nextRegistration;previousRevision=y.sourceRevision;
 }
 if(c.world.seasonKey!==contract.seasonKey||c.world.players[c.protagonistKey]!.age!==startAge+Number(c.world.seasonKey)-Number(signing.seasonKey))throw new RangeError('INVALID_US_CONTRACT_HISTORY');
 return {inventory,contract,rights,registration};
}

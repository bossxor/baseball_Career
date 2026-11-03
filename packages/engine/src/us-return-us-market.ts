import type {UsAmateurReturnCareer} from './us-amateur-return-career.js';
import type {PreparationSeason} from './preparation-season.js';
import type {UsCareer,ActiveUsRosterWorld} from './us-career-entry.js';
import {assertActiveUsRosterWorld} from './us-career-entry.js';
import {quoteUsMinorContractOffers,moveToOffer} from './us-minor-market.js';
import type {UsMinorOffer} from './us-minor-market.js';
import {fundUsMinorYear} from './us-minor-history.js';
import {restoreUsEmergencyRegistrations} from './us-year-transition.js';
import {createSeasonCalendar} from './season-calendar.js';
import {createSeasonGrowthLedger,settleClosedGrowthPeriods,finalizeSeasonGrowth} from './growth-ledger.js';
import {retireAndSupplyUsNpcs} from './us-supply.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import type {UsReturnRetryUsOpportunity} from './us-return-retry.js';
import {assertUsRecruitmentWorld} from './us-direct.js';

/** Register the exact quoted competitor; a service reserve must not displace a different player. */
export function registerQuotedUsReturn(world:ActiveUsRosterWorld,key:string,fromId:string,offer:UsMinorOffer):string|null {
 const from=world.organizations.find(o=>o.id===fromId),to=world.organizations.find(o=>o.id===offer.organizationId),level=offer.initialLevel;
 if(!from||!to)throw new RangeError('US_RETURN_MARKET_NO_LEGAL_SLOT');
 let displaced:string|null;
 if(from.levels[level].includes(key))displaced=moveToOffer(world,key,level,fromId,offer,world.seasonKey);
 else{
  const reserve=world.reserves?.[fromId],competitor=offer.competitorKey,p=world.players[key],other=competitor?world.players[competitor]:undefined;
  if(!reserve?.includes(key)||!competitor||!to.levels[level].includes(competitor)||!p||!other||p.kind!==other.kind||p.position!==other.position)throw new RangeError('US_RETURN_MARKET_NO_LEGAL_SLOT');
  world.reserves![fromId]=reserve.filter(k=>k!==key);to.levels[level]=to.levels[level].map(k=>k===competitor?key:k).sort();world.reserves![to.id]=[...(world.reserves![to.id]??[]),competitor].sort();displaced=competitor;
 }
 assertActiveUsRosterWorld(world);return displaced;
}

/** Called only after the returned owner/quote has been validated. One same-year reservation, no pay entry. */
export function materializeUsReturnMinorContract(origin:UsAmateurReturnCareer,q:UsReturnRetryUsOpportunity,offerKey:string){
 const offer=q.offers.find(o=>o.offerKey===offerKey),source=origin.service??origin.source,key=origin.return.playerKey;
 if(q.status!=='AVAILABLE'||!offer)throw new RangeError('US_RETURN_RETRY_US_OFFER_NOT_AVAILABLE');
 const world=structuredClone(q.world),displacedCompetitorKey=registerQuotedUsReturn(world,key,source.protagonistOrganizationId,offer),inventory=structuredClone(q.inventory),club=inventory.clubs.find(o=>o.id===offer.organizationId);
 if(!club||club.availableBudgetUsd<30000)throw new RangeError('US_MINOR_CONTRACT_BUDGET_REQUIRED');
 club.availableBudgetUsd-=30000;inventory.registeredPlayerKeys=Object.keys(world.players).sort();assertUsRecruitmentWorld(inventory);
 const contract:UsCareer['contract']={contractKey:JSON.stringify(['us-return-retry-contract',q.assessmentKey,offerKey]),type:'US_MINOR',currency:'USD',years:1,annualSalaryUsd:30000,signingBonusUsd:0,controlSeasons:6,status:'ACTIVE',seasonKey:world.seasonKey,nationalReleaseAllowed:offer.nationalReleaseAllowed,militaryReturnOption:offer.militaryReturnOption};
 const renewal={marketId:q.assessmentKey,offerKey,organizationId:offer.organizationId,signedFromSeasonKey:q.ownerSeasonKey,sourceRevision:q.sourceRevision,contract:structuredClone(contract),funding:inventory.clubs.map(c=>({organizationId:c.id,addedBudgetUsd:0})),displacedCompetitorKey};
 return {world,inventory,contract,renewal,offer};
}

/** A disposable current quote stage; no contract, salary or official game is written. */
export function stageUsReturnMarket(origin:UsAmateurReturnCareer,owner:PreparationSeason|UsCareer,assessmentKey:string,declinedReturnOfferRefs:readonly string[]=[]){
 const source=origin.service??origin.source,key=origin.return.playerKey,world=structuredClone(source.world),target=String(Number(owner.world.seasonKey)+1);
 if(Number(target)<=Number(world.seasonKey))throw new RangeError('US_RETURN_MARKET_YEAR_CHANGED');
 let inventory=structuredClone(source.inventory);
 restoreUsEmergencyRegistrations(source,world);
 const first=Number(world.seasonKey);
 for(let year=first;year<Number(target);year++){
  if(year>first){
   const season=String(year),days=createSeasonCalendar(year,'calendar-2').growthDays.length;
   // shortcut: offscreen independent years use the existing fixed workload until native US seasons own them.
   for(const npc of Object.keys(world.players).sort()){
    if(npc===key)continue;const p=world.players[npc]!,ledger=createSeasonGrowthLedger(p,season,days);
    const period={startDay:0,endDay:days,levelSeasonDays:days,level:'PRO' as const,appearances:p.kind==='HITTER'?400:p.position==='RP'||p.position==='CP'?180:540,pitcherRole:p.position==='RP'?'RP' as const:p.position==='CP'?'CP' as const:'SP' as const,rehabRatio:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER' as const,difficulty:origin.source.difficulty,beneficiary:false}};
    const grown=settleClosedGrowthPeriods(p,ledger,[{periodKey:JSON.stringify(['us-return-offscreen',origin.return.returnId,season,npc]),focus:[...p.focus],archetype:p.archetype,period}]);
    world.players[npc]=finalizeSeasonGrowth(grown.player,grown.ledger,days).player;
   }
  }
  const next=String(year+1),existing=new Set(Object.keys(world.players));
  retireAndSupplyUsNpcs(world,Object.keys(world.players).filter(k=>k!==key&&world.players[k]!.age===45),next,key);
  for(const [k,p]of Object.entries(world.players))if(k!==key&&existing.has(k))world.players[k]={...p,age:p.age+1,fatigue:0};
  world.seasonKey=next;world.calendar=createSeasonCalendar(year+1,'calendar-2');
  for(const book of Object.values(world.repertoires))Object.assign(book,{seasonId:next,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()});
  // No finance worker supplied new money for absence years; carry only actually booked balances.
  inventory=fundUsMinorYear(inventory,next,Object.keys(world.players).sort(),inventory.clubs.map(c=>({organizationId:c.id,addedBudgetUsd:0})),source.protagonistOrganizationId,0);
 }
 world.players[key]={...structuredClone(owner.world.players[key]!),age:owner.world.players[key]!.age+1,fatigue:0};
 const book=schoolYearEndRepertoire(owner,key);if(book)world.repertoires[key]={...structuredClone(book),seasonId:target,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 assertActiveUsRosterWorld(world);
 const retained=(origin.source.minorMarket?.offers??[]).filter(o=>o.militaryReturnOption&&!declinedReturnOfferRefs.includes(o.offerKey));
 const quoted=quoteUsMinorContractOffers({world,records:owner.records,health:owner.health,registration:{...source.registration,seasonKey:target},protagonistKey:key,protagonistOrganizationId:source.protagonistOrganizationId},assessmentKey,inventory,owner.world.seasonKey,retained);
 quoted.offers=quoted.offers.filter(offer=>{
  try{registerQuotedUsReturn(structuredClone(world),key,source.protagonistOrganizationId,offer);return true;}
  catch(error){if(error instanceof RangeError&&['US_RETURN_MARKET_NO_LEGAL_SLOT','US_MINOR_MARKET_SOURCE_RESERVE_REQUIRED','US_ORGANIZATION_CAPACITY_EXCEEDED','INVALID_US_LEVEL_SIZE'].includes(error.message))return false;throw error;}
 });
 return {world,inventory,...quoted,retainedOfferRefs:retained.map(o=>o.offerKey).sort(),blockedReturnOfferRefs:retained.filter(o=>!quoted.offers.some(q=>q.offerKey===o.offerKey)).map(o=>o.offerKey).sort()};
}

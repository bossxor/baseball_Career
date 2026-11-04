import type {UsCareer} from './us-career-entry.js';
import type {UsLevel} from './us-world.js';
import type {UsAnnualFunding} from './us-minor-history.js';
import {fundUsMinorYear} from './us-minor-history.js';
import {usCompetitionScore} from './us-levels.js';
import {recordTotals} from './records.js';

export interface UsMajorOffer {
 offerKey:string;organizationId:string;initialLevel:UsLevel;years:1|2|3|5;currency:'USD';annualSalaryUsd:number;
 nationalReleaseAllowed:boolean;militaryReturnOption:boolean;competitorKey:string|null;competitorScore:number|null;playerScore:number;
}
export const usMajorOfferKey=(activationKey:string,year:string,contractKey:string,org:string)=>JSON.stringify(['us-major-offer',activationKey,year,contractKey,org]);

/** Same-level position demand; no RNG, salary changes, automatic promotion or invented funding. */
export function quoteUsMajorOffers(c:UsCareer,funding:readonly UsAnnualFunding[],salary:number,years:1|2|3|5):UsMajorOffer[]{
 const future=fundUsMinorYear(c.inventory,String(Number(c.world.seasonKey)+1),c.inventory.registeredPlayerKeys,funding,c.protagonistOrganizationId,0),level=c.registration.level,p=c.world.players[c.protagonistKey]!,totals=recordTotals(c.records,{leagueKey:level,phase:'REGULAR',seasonKey:c.world.seasonKey}),score=usCompetitionScore(c,c.protagonistKey,level,totals);
 const candidate=(id:string):UsMajorOffer|null=>{
  const org=c.world.organizations.find(o=>o.id===id)!,club=future.clubs.find(o=>o.id===id)!,own=id===c.protagonistOrganizationId;
  if(club.availableBudgetUsd<salary||!own&&Object.values(org.levels).flat().length+(c.world.reserves?.[id]?.length??0)>=160)return null;
  const protectedKeys=new Set([...org.levels.MLB,...(c.season?.protectedRoster?.[id]??[]).filter(k=>Object.values(org.levels).some(keys=>keys.includes(k))||c.world.reserves?.[id]?.includes(k)),c.protagonistKey]);if(protectedKeys.size>40)return null;
  const competitor=org.levels[level].filter(k=>k!==c.protagonistKey&&c.world.players[k]!.kind===p.kind&&c.world.players[k]!.position===p.position&&!c.health.injuries[k]&&c.season?.emergency?.entries[k]?.releasedDay!==null).map(key=>({key,score:usCompetitionScore(c,key,level,totals)})).sort((a,b)=>a.score-b.score||(a.key<b.key?-1:a.key>b.key?1:0))[0];
  const active=own&&org.levels[level].includes(c.protagonistKey);
  if(!active&&(!competitor||!own&&score<=competitor.score))return null;
  return {offerKey:usMajorOfferKey(c.activation.receiptKey,c.world.seasonKey,c.contract.contractKey,id),organizationId:id,initialLevel:level,years,currency:'USD',annualSalaryUsd:salary,nationalReleaseAllowed:club.nationalReleaseAllowed,militaryReturnOption:club.militaryReturnOption,competitorKey:active?null:competitor!.key,competitorScore:active?null:competitor!.score,playerScore:score};
 };
 const original=candidate(c.protagonistOrganizationId),others=c.world.organizations.filter(o=>o.id!==c.protagonistOrganizationId).map(o=>candidate(o.id)).filter((o):o is UsMajorOffer=>o!==null).sort((a,b)=>(a.competitorScore??0)-(b.competitorScore??0)||(a.organizationId<b.organizationId?-1:1)).slice(0,3);
 return [...(original?[original]:[]),...others];
}

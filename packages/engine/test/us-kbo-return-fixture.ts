import {setCareerSeasonGoals} from '../src/season-goals.js';
import {preparedUsCareer} from './us-fixtures.js';
import {finishControlledMajorSeason} from './us-major-fixture.js';
import {enteredKboCareer} from './fixtures.js';
import {createKboRosterWorld} from '../src/kbo-world.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {createHealthLedger} from '../src/health.js';
import {createWorldStream} from '../src/rng.js';
import {openUsMinorMarket} from '../src/us-minor-market.js';
import type {UsKboReturnAuthority} from '../src/us-kbo-return.js';
import type {KboPostingOffer} from '../src/kbo-posting.js';
/** Controlled signed-origin and completed-year fixtures, not simulated KBO departure/domestic years. */
export function controlledUsKboReturn(route:'POSTING'|'OVERSEAS_FA'='POSTING',kind:'HITTER'|'PITCHER'='HITTER',withGoals=false){
 let p=preparedUsCareer(kind);if(withGoals)p=setCareerSeasonGoals(p,p.revision,['G01']);const key=p.protagonistKey,year=String(Number(p.world.seasonKey)-1),source=enteredKboCareer(),id=JSON.stringify(['controlled-return-origin',route,key]),offer:KboPostingOffer={offerKey:'controlled-minor-offer',organizationId:p.protagonistOrganizationId,organizationName:p.world.organizations.find(o=>o.id===p.protagonistOrganizationId)!.name,kind:'MILB',currency:'USD',years:1,annualSalaryUsd:30000,initialLevel:p.registration.level,nationalReleaseAllowed:true,militaryReturnOption:true};
 // This synthetic revision-one departure has no earned alias receipts.
 delete source.aliases;
 source.revision=1;source.protagonistKey=key;source.world.worldKey=p.world.worldKey;source.world.seed=p.world.seed;source.world.seasonKey=year;source.world.calendar=createSeasonCalendar(Number(year),'calendar-2');source.phaseContext={phase:'ARCHIVED'};source.events=[];source.military={status:'COMPLETED',applications:[]};
 const old=source.world.contracts[source.registration.playerKey]!,rights={holderClubId:source.protagonistClubId,territory:'KR' as const,sourceType:'POSTING' as const,seasonKey:year,contractKey:old.contractKey,annualSalaryWon:old.annualSalaryWon,years:old.years,snapshotRevision:1},sealedPlayer={...structuredClone(p.world.players[key]!),age:p.world.players[key]!.age-1};
 if(route==='POSTING')source.posting={windows:[{postingId:id,seasonKey:year,requestedRevision:1,clubId:source.protagonistClubId,status:'SIGNED',offers:[offer],signedOfferKey:offer.offerKey,sealedPlayer,sealedContract:structuredClone(old),returnRights:rights}]};
 else source.overseasFa={windows:[{windowId:id,seasonKey:year,requestedRevision:1,issuedWorldDay:0,expiresWorldDay:30,status:'SIGNED',offers:[offer],signedOfferKey:offer.offerKey,sealedPlayer,sealedContract:structuredClone(old),domesticRights:'RELEASED'}]};
 const contract={...p.contract,contractKey:JSON.stringify(['kbo-us-transfer',id,offer.offerKey]),years:1,signingBonusUsd:0,nationalReleaseAllowed:true,militaryReturnOption:true};
 p.contract=contract;p.activation={receiptKey:JSON.stringify(['kbo-us-activation',id]),sourceYearEndReceiptKey:id,sourceRevision:1,contractKey:contract.contractKey,populationBasis:'KBO_TRANSFER'};p.kboTransfer={source:route,...(route==='POSTING'?{postingId:id}:{windowId:id}),offer,returnRights:route==='POSTING'?rights:null,kboSeasonKey:year,sourceRevision:1,origin:{playerAge:p.world.players[key]!.age,contract:structuredClone(contract),inventory:structuredClone(p.inventory)}};p.income=p.income.filter(i=>i.kind!=='SIGNING_BONUS');p.military.status='COMPLETED';
 const closed=finishControlledMajorSeason(p),c=openUsMinorMarket(closed,closed.revision,closed.world.organizations.map(o=>({organizationId:o.id,addedBudgetUsd:0}))),target=String(Number(c.world.seasonKey)+1),world={...createKboRosterWorld({worldKey:c.world.worldKey,seasonKey:target,seed:c.world.seed,difficulty:c.difficulty}),status:'ACTIVE' as const,calendar:createSeasonCalendar(Number(target),'calendar-2')};
 const host={...structuredClone(source),revision:100,world,records:structuredClone(c.records),health:createHealthLedger(createWorldStream('controlled-current-domestic','health','roster'))},authority:UsKboReturnAuthority={receiptKey:'controlled-authoritative-domestic-v100',revision:100,host};
 return {c,source,authority};
}

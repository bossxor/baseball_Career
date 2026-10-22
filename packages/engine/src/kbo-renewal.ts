import {kboContractPaymentBalance} from './kbo-contract-payments.js';
import {kboPlayerContractValue,kboRenewalSalaryWon} from './kbo-contract-value.js';
export {KBO_RENEWAL_SAMPLE} from './kbo-contract-value.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {recordTotals} from './records.js';
import {createWorldEvent,completeBlockingEvent,eventDefinition} from './events.js';

/** 01 §6 non-FA 1-year renewal offer for my player, fixed once per season (no RNG, refresh never changes it). */
export interface KboRenewal {
 offerKey:string;eventKey:string;playerKey:string;clubId:string;seasonKey:string;years:1;
 previousSalaryWon:number;valueWon:number;annualSalaryWon:number;
 basis:{ovr:number;PA:number;OPS:number;outs:number;ERA:number};status:'OFFERED'|'ACCEPTED';
}
/** 08 role base value from current ability and this KBO regular-season sample. */
export function kboRenewalValueWon(source:KboCareer):{valueWon:number;basis:KboRenewal['basis']} {
 const key=source.protagonistKey,totals=recordTotals(source.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:source.world.seasonKey});
 return kboPlayerContractValue(source.world.players[key]!,totals.batting[key],totals.pitching[key]);
}
function expiresAfterSeason(source:KboCareer):boolean {
 const c=source.world.contracts[source.protagonistKey]!;if(c.servicePay)return kboContractPaymentBalance(c.servicePay.ledger).remainingPaidGameDays===0;return Number(source.world.seasonKey)-Number(c.seasonKey)+1>=c.years;
}
/** The accepted renewal that covers the season after the current one, if any. */
export function acceptedRenewal(source:KboCareer):KboRenewal|null {
 const r=source.renewal;return r?.status==='ACCEPTED' && r.seasonKey===String(Number(source.world.seasonKey)+1)?r:null;
}
/** True when my contract ends with this season and no accepted renewal covers the next one (72 Y01 blocker). */
export function kboContractDecisionRequired(source:KboCareer):boolean {
 return expiresAfterSeason(source) && !acceptedRenewal(source);
}
/** After season close: fix the offer once and open blocking E30 (S08 compare / S09 retire). Phase stays SEASON_REVIEW. */
export function offerKboRenewal(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const season=source.world.seasonKey,close=source.seasonClose;
 if(source.phaseContext.phase!=='SEASON_REVIEW' || !close || close.seasonKey!==season || source.renewal?.seasonKey===String(Number(season)+1) || !expiresAfterSeason(source) || source.events.some(e=>e.status==='OPEN' && e.definitionId!=='E50') || source.world.players[source.protagonistKey]!.age>=45)throw new RangeError('KBO_RENEWAL_NOT_AVAILABLE');
 const key=source.protagonistKey,previous=source.world.contracts[key]!.annualSalaryWon,{valueWon,basis}=kboRenewalValueWon(source);
 const target=String(Number(season)+1),offerKey=JSON.stringify(['kbo-renewal',source.world.worldKey,target,key]);
 const day=source.days!.days.at(-1)!.day,definition=eventDefinition('E30');
 const event=createWorldEvent({definitionId:'E30',worldKey:source.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:key,contractWindowId:offerKey,sourceReceiptId:close.receiptKey}},
  resume:{worldKey:source.world.worldKey,seasonKey:season,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 const career=structuredClone(source);
 career.renewal={offerKey,eventKey:event.eventKey,playerKey:key,clubId:source.protagonistClubId,seasonKey:target,years:1,previousSalaryWon:previous,valueWon,annualSalaryWon:kboRenewalSalaryWon(previous,valueWon),basis,status:'OFFERED'};
 career.events=[...career.events,event];career.revision++;return career;
}
/** S08 accept: closes E30 by domain commit. The new contract activates with the next season (72 Y02), not now. */
export function acceptKboRenewal(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number}):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const renewal=source.renewal,event=source.events.find(e=>e.eventKey===input.eventKey);
 if(!renewal || renewal.status!=='OFFERED' || renewal.eventKey!==input.eventKey || !event || event.definitionId!=='E30')throw new RangeError('INVALID_KBO_RENEWAL');
 const context={worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:['OPEN_CAREER_OFFERS']};
 const resolved=completeBlockingEvent(event,input.eventVersion,{sourceEvidenceKey:event.evidenceKey,receiptKey:JSON.stringify(['kbo-renewal-accept',renewal.offerKey]),command:'ACCEPT_RENEWAL'},context);
 const career=structuredClone(source);
 career.renewal={...renewal,status:'ACCEPTED'};career.events=career.events.map(e=>e.eventKey===event.eventKey?resolved:e);career.revision++;return career;
}

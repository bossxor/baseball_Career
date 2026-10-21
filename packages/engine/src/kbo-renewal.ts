import {overall,KBO_MONEY} from '@playball/rules';
import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {recordTotals} from './records.js';
import {battingRates,pitchingRates} from './stats.js';
import {createWorldEvent,completeBlockingEvent,eventDefinition} from './events.js';

/** 01 §6 non-FA 1-year renewal offer for my player, fixed once per season (no RNG, refresh never changes it). */
export interface KboRenewal {
 offerKey:string;eventKey:string;playerKey:string;clubId:string;seasonKey:string;years:1;
 previousSalaryWon:number;valueWon:number;annualSalaryWon:number;
 basis:{ovr:number;PA:number;OPS:number;outs:number;ERA:number};status:'OFFERED'|'ACCEPTED';
}
/** Below these KBO regular samples the 08 neutral OPS .600 / ERA 5 is used (implementation default D: 01 §6 50PA/20IP). */
export const KBO_RENEWAL_SAMPLE={PA:50,outs:60} as const;
const clamp=(won:number)=>Math.min(KBO_MONEY.maximumSalaryWon,Math.max(KBO_MONEY.minimumSalaryWon,won));
const manwon=(won:number)=>Math.round(won/10_000)*10_000;

/** 08 role base value. */
export function kboRenewalValueWon(source:KboCareer):{valueWon:number;basis:KboRenewal['basis']} {
 const key=source.protagonistKey,player=source.world.players[key]!,o=overall(player.kind,player.abilities),ovr=o.sumUnits/o.denominator;
 const totals=recordTotals(source.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:source.world.seasonKey});
 const bat=totals.batting[key],pit=totals.pitching[key],PA=bat?.PA??0,outs=pit?.outs??0;
 const OPS=bat && PA>=KBO_RENEWAL_SAMPLE.PA?battingRates(bat).OPS??.6:.6,ERA=pit && outs>=KBO_RENEWAL_SAMPLE.outs?pitchingRates(pit).ERA??5:5;
 const base=30_000_000+Math.max(0,ovr-40)*10_000_000;
 const raw=player.kind==='PITCHER'?base+outs*200_000+Math.max(0,5-ERA)*50_000_000:base+PA*100_000+Math.max(0,OPS-.6)*500_000_000;
 return {valueWon:clamp(raw),basis:{ovr,PA,OPS,outs,ERA}};
}
function expiresAfterSeason(source:KboCareer):boolean {
 const c=source.world.contracts[source.protagonistKey]!;return Number(source.world.seasonKey)-Number(c.seasonKey)+1>=c.years;
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
 if(source.phaseContext.phase!=='SEASON_REVIEW' || !close || close.seasonKey!==season || source.renewal?.seasonKey===String(Number(season)+1) || !expiresAfterSeason(source) || source.events.some(e=>e.status==='OPEN'))throw new RangeError('KBO_RENEWAL_NOT_AVAILABLE');
 const key=source.protagonistKey,previous=source.world.contracts[key]!.annualSalaryWon,{valueWon,basis}=kboRenewalValueWon(source);
 const target=String(Number(season)+1),offerKey=JSON.stringify(['kbo-renewal',source.world.worldKey,target,key]);
 const day=source.days!.days.at(-1)!.day,definition=eventDefinition('E30');
 const event=createWorldEvent({definitionId:'E30',worldKey:source.world.worldKey,seasonKey:season,evidence:{version:1,type:definition.evidenceDomain,fields:{playerSimulationKey:key,contractWindowId:offerKey,sourceReceiptId:close.receiptKey}},
  resume:{worldKey:source.world.worldKey,seasonKey:season,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:source.protagonistClubId,sourceRevision:source.revision+1},sourceSequence:source.events.length+1,worldDay:day});
 const career=structuredClone(source);
 career.renewal={offerKey,eventKey:event.eventKey,playerKey:key,clubId:source.protagonistClubId,seasonKey:target,years:1,previousSalaryWon:previous,valueWon,annualSalaryWon:clamp(manwon(.5*previous+.5*valueWon)),basis,status:'OFFERED'};
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

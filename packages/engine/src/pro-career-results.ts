import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {createWorldEvent,eventDefinition,validateEvent,resolveEventChoice,completeEventDomain} from './events.js';
import type {EventInstance} from './events.js';
import {canonicalJson} from './game.js';

type ResultId='E21'|'E22'|'E23'|'E24'|'E27'|'E28';
export interface CareerProResultLedger {schemaVersion:1;worldKey:string;playerKey:string;notices:readonly EventInstance[];returns:readonly {eventKey:string;injuryId:string;receiptKey:string}[]}
type ResultCareer=(KboCareer|UsCareer)&{proResults?:CareerProResultLedger};
const isUs=(c:ResultCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
const order=(a:{seasonKey:string;day:number},b:{seasonKey:string;day:number})=>Number(a.seasonKey)-Number(b.seasonKey)||a.day-b.day;
const played=(c:ResultCareer,g:{batting:Record<string,{PA:number}>;pitching:Record<string,{BF:number}>})=>(g.batting[c.protagonistKey]?.PA??0)>0||(g.pitching[c.protagonistKey]?.BF??0)>0;
const proLeagues=['KBO','FUTURES','ROOKIE','A','AA','AAA','MLB'];
function ledger(c:ResultCareer):CareerProResultLedger{return c.proResults??{schemaVersion:1,worldKey:c.world.worldKey,playerKey:c.protagonistKey,notices:[],returns:[]};}
function validate(c:ResultCareer){const l=ledger(c);if(l.schemaVersion!==1||l.worldKey!==c.world.worldKey||l.playerKey!==c.protagonistKey||!Array.isArray(l.notices)||!Array.isArray(l.returns)||new Set(l.notices.map(e=>e.eventKey)).size!==l.notices.length||new Set(l.returns.map(r=>r.eventKey)).size!==l.returns.length)throw new RangeError('INVALID_PRO_RESULT_LEDGER');for(const e of l.notices){validateEvent(e);if(!['E21','E22','E23','E24','E27','E28'].includes(e.definitionId)||e.worldKey!==l.worldKey||e.resume.sourceRevision>c.revision)throw new RangeError('INVALID_PRO_RESULT_EVENT');}for(const r of l.returns)if(!r.receiptKey||!l.notices.some(e=>e.eventKey===r.eventKey&&e.definitionId==='E23'&&e.evidence.fields.injuryId===r.injuryId&&e.status==='RESOLVED'&&e.resolution?.receiptKey===r.receiptKey))throw new RangeError('INVALID_PRO_RETURN_RECEIPT');}
function append(c:ResultCareer,l:CareerProResultLedger,id:ResultId,fields:Record<string,string>,seasonKey:string,day:number){
 const d=eventDefinition(id),event=createWorldEvent({definitionId:id,worldKey:c.world.worldKey,seasonKey,evidence:{version:1,type:d.evidenceDomain,fields},resume:{worldKey:c.world.worldKey,seasonKey,phase:c.phaseContext.phase,competitionKey:isUs(c)?c.registration.level:c.registration.firstTeam?'KBO':'FUTURES',registrationKey:isUs(c)?c.protagonistOrganizationId:c.protagonistClubId,sourceRevision:c.revision},sourceSequence:l.notices.length+1,worldDay:day});
 if(!l.notices.some(e=>e.eventKey===event.eventKey))l.notices=[...l.notices,event];
}
const injuryId=(c:ResultCareer,season:string,game:string)=>JSON.stringify(['career-injury',c.world.worldKey,c.protagonistKey,season,game]);
function returnProven(c:ResultCareer,event:EventInstance){
 const diagnosis=c.health.games.find(h=>h.result.injured.includes(c.protagonistKey)&&injuryId(c,h.evidence.seasonKey,h.evidence.gameKey)===event.evidence.fields.injuryId);
 return !!diagnosis&&!Object.hasOwn(c.health.injuries,c.protagonistKey)&&(c.health.closedSeasons.includes(diagnosis.evidence.seasonKey)||c.health.games.some(h=>h.result.recovered.includes(c.protagonistKey)&&order({seasonKey:h.evidence.seasonKey,day:h.evidence.day},{seasonKey:diagnosis.evidence.seasonKey,day:diagnosis.evidence.day})>0&&order({seasonKey:h.evidence.seasonKey,day:h.evidence.day},{seasonKey:event.seasonKey,day:event.occurredWorldDay})<=0));
}
/** SERVER ONLY: observe confirmed health/record/result ledgers; never creates a medical or award result. */
export function refreshProCareerResultEvents<T extends ResultCareer>(c:T):T {
 validate(c);if(c.phaseContext.phase==='ARCHIVED'||c.phaseContext.phase==='EVENT_DECISION'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))return c;
 const l=structuredClone(ledger(c)),key=c.protagonistKey,health=c.health.games.filter(h=>h.evidence.roster.includes(key)).sort((a,b)=>order({seasonKey:a.evidence.seasonKey,day:a.evidence.day},{seasonKey:b.evidence.seasonKey,day:b.evidence.day}));
 const injury=c.health.injuries[key];
 if(injury&&health.some(h=>h.evidence.gameKey===injury.diagnosedGameKey&&h.evidence.seasonKey===injury.seasonKey&&h.result.injured.includes(key))){const h=health.find(h=>h.evidence.gameKey===injury.diagnosedGameKey&&h.evidence.seasonKey===injury.seasonKey)!;append(c,l,injury.severity==='MILD'?'E21':'E22',{injuryId:injuryId(c,injury.seasonKey,injury.diagnosedGameKey),stage:'DIAGNOSED'},injury.seasonKey,h.evidence.day);}
 let diagnosis:typeof health[number]|undefined;
 for(const h of health){if(h.result.injured.includes(key))diagnosis=h;if(h.result.recovered.includes(key)&&diagnosis){append(c,l,'E23',{injuryId:injuryId(c,diagnosis.evidence.seasonKey,diagnosis.evidence.gameKey),stage:'RECOVERED'},h.evidence.seasonKey,h.evidence.day);diagnosis=undefined;}}
 // Major injuries close with the season rather than an ordinary recovery game.
 for(const e of l.notices.filter(e=>e.definitionId==='E22'&&c.health.closedSeasons.includes(e.seasonKey))){if(injury&&injuryId(c,injury.seasonKey,injury.diagnosedGameKey)===e.evidence.fields.injuryId)continue;append(c,l,'E23',{injuryId:String(e.evidence.fields.injuryId),stage:'RECOVERED'},e.seasonKey,Math.max(e.occurredWorldDay,...health.filter(h=>h.evidence.seasonKey===e.seasonKey).map(h=>h.evidence.day)));}
 const games=Object.values(c.records.games).filter(g=>proLeagues.includes(g.scope.leagueKey)).sort((a,b)=>order({seasonKey:a.scope.seasonKey,day:a.worldDay},{seasonKey:b.scope.seasonKey,day:b.worldDay})||a.gameKey.localeCompare(b.gameKey));
 for(const league of proLeagues){let hits=0,wins=0,saves=0;for(const g of games.filter(g=>g.scope.leagueKey===league&&g.scope.phase==='REGULAR')){const before=[hits,wins,saves];hits+=g.batting[key]?.H??0;wins+=g.pitching[key]?.W??0;saves+=g.pitching[key]?.SV??0;for(const [i,value,target,name]of [[0,hits,100,'100_H'],[1,wins,10,'10_W'],[2,saves,20,'20_SV']] as const)if(before[i]!<target&&value>=target)append(c,l,'E24',{playerSimulationKey:key,milestoneKey:JSON.stringify(['first-pro-record',league,name])},g.scope.seasonKey,g.worldDay);}}
 const firstPs=games.find(g=>g.scope.phase==='POSTSEASON'&&played(c,g));if(firstPs)append(c,l,'E27',{playerSimulationKey:key,milestoneKey:JSON.stringify(['first-postseason'])},firstPs.scope.seasonKey,firstPs.worldDay);
 if(c.phaseContext.phase==='SEASON_REVIEW'){
  const bracket=isUs(c)?c.postseason?.bracket:c.postseason,team=isUs(c)?c.protagonistOrganizationId:c.protagonistClubId;
  if(bracket?.seasonKey===c.world.seasonKey&&bracket.championKey===team)append(c,l,'E28',{playerOrTeamSimulationKey:team,worldSeasonId:c.world.seasonKey,windowType:JSON.stringify(['championship',team])},c.world.seasonKey,Math.max(0,...games.filter(g=>g.scope.seasonKey===c.world.seasonKey).map(g=>g.worldDay)));
 }
 return canonicalJson(l)===canonicalJson(ledger(c))?c:{...c,proResults:l};
}
export function resolveProCareerResultEvent<T extends ResultCareer>(c:T,revision:number,input:{eventKey:string;eventVersion:number;command:'ACK_INJURY'|'ACK_EVENT'|'CONFIRM_RETURN'}){
 if(isUs(c))assertUsCareerRevision(c,revision);else assertKboCareerRevision(c,revision);validate(c);if(c.phaseContext.phase==='ARCHIVED'||c.phaseContext.phase==='EVENT_DECISION'||('pendingGame'in c.phaseContext&&c.phaseContext.pendingGame))throw new RangeError('INVALID_PRO_RESULT_PHASE');
 const l=structuredClone(ledger(c)),event=l.notices.find(e=>e.eventKey===input.eventKey);if(!event)throw new RangeError('PRO_RESULT_NOT_FOUND');
 const context={worldKey:c.world.worldKey,seasonKey:event.seasonKey,worldDay:event.occurredWorldDay,eligibleCommands:eventDefinition(event.definitionId).choices.map(x=>x.command)},chosen=resolveEventChoice(event,input.eventVersion,input.command,input,context);
 if(chosen.domain){if(input.command!=='CONFIRM_RETURN'||event.definitionId!=='E23'||!returnProven(c,event))throw new RangeError('PRO_RETURN_NOT_AVAILABLE');const receiptKey=JSON.stringify(['confirm-medical-return',event.eventKey,revision+1]);l.returns=[...l.returns,{eventKey:event.eventKey,injuryId:String(event.evidence.fields.injuryId),receiptKey}];l.notices=l.notices.map(e=>e.eventKey===event.eventKey?completeEventDomain(event,chosen.domain!,receiptKey,context):e);}else l.notices=l.notices.map(e=>e.eventKey===event.eventKey?chosen.event:e);
 return {career:{...c,revision:revision+1,proResults:l} as T,navigation:chosen.navigation};
}
export function proCareerResultEventsView(c:ResultCareer){validate(c);return {notices:ledger(c).notices.filter(e=>e.status==='OPEN').map(e=>({eventKey:e.eventKey,eventVersion:e.version,definitionId:e.definitionId,title:eventDefinition(e.definitionId).title,body:eventDefinition(e.definitionId).body,commands:eventDefinition(e.definitionId).choices.filter(x=>x.command!=='CONFIRM_RETURN'||returnProven(c,e)).map(x=>x.command)}))};}

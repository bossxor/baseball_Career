import {kboServiceContractView} from './kbo-service-payroll.js';
import {KBO_CONTRACT_GAME_DAYS} from './kbo-military-program.js';
import {reserveKboOffseasonGuarantee} from './kbo-finance.js';
import {KBO_ROSTER_LIMITS} from '@playball/rules';
import type {ActiveKboRosterWorld,KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {createWorldEvent,completeBlockingEvent,eventDefinition} from './events.js';
import type {EventInstance} from './events.js';
import {kboYearTransitionReadiness} from './kbo-year-transition.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';

/** A retired pro NPC kept for record pages (15); official stats stay in the shared record ledger. */
export interface KboRetiredPlayer {playerKey:string;clubId:string;lastSeasonKey:string;reason:'MAX_AGE';player:DevelopmentPlayer;contract:KboInitialContract}

/** 01 §6/14: every player retires after the season played at 45. Mutates the caller's cloned world: retirees leave
 * players/contracts/repertoires/rosters at once, and only a first team that lost someone is reselected by the 41/44
 * selector. No replacement is created here (the 15 rookie supply is Y04); a club that would fall below 35 or cannot
 * field 28 stops the transition instead of shrinking silently. */
export function retireKboOverAgeNpcs(world:ActiveKboRosterWorld,keys:readonly string[],lastSeasonKey:string,deferSupply=false):KboRetiredPlayer[] {
 const retired:KboRetiredPlayer[]=[],gone=new Set(keys);
 for(const club of world.clubs){
  const leaving=club.roster.filter(k=>gone.has(k));if(!leaving.length)continue;
  for(const k of leaving){reserveKboOffseasonGuarantee(world,world.contracts[k]!,lastSeasonKey,'RETIREMENT');retired.push({playerKey:k,clubId:club.id,lastSeasonKey,reason:'MAX_AGE',player:world.players[k]!,contract:world.contracts[k]!});delete world.players[k];delete world.contracts[k];delete world.repertoires[k];}
  club.roster=club.roster.filter(k=>!gone.has(k));
  if(deferSupply){club.firstTeam=club.firstTeam.filter(k=>!gone.has(k));continue;}
  if(club.roster.length<KBO_ROSTER_LIMITS.minimum)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');
  if(club.firstTeam.some(k=>gone.has(k))){
   const first=selectKboFirstTeamRoster(club.roster.map(k=>world.players[k]!));
   if(first.length!==KBO_ROSTER_LIMITS.firstTeam)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');
   club.firstTeam=first;
  }
 }
 if(retired.length!==gone.size)throw new RangeError('UNKNOWN_RETIRING_PLAYER');
 return retired.sort((a,b)=>a.playerKey<b.playerKey?-1:1);
}

/** My pro career's end: frozen with the archive in the same result (01 §6, 15). */
export interface KboCareerRetirement {receiptKey:string;reason:'VOLUNTARY'|'MAX_AGE';seasonKey:string;age:number;clubId:string;remainingContractYears:number;remainingPaidGameDays?:number;sourceRevision:number}
const taskKey=(s:KboCareer)=>JSON.stringify(['kbo-retirement',s.world.worldKey,s.world.seasonKey,s.protagonistKey]);
function offseason(s:KboCareer){
 if(s.phaseContext.phase!=='SEASON_REVIEW' || s.seasonClose?.seasonKey!==s.world.seasonKey)throw new RangeError('KBO_RETIREMENT_NOT_AVAILABLE');
}
function retirementEvent(s:KboCareer,definitionId:'E36'|'E37',revision:number){
 return createWorldEvent({definitionId,worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,evidence:{version:1,type:eventDefinition(definitionId).evidenceDomain,fields:{playerSimulationKey:s.protagonistKey,retirementTaskOrReceiptId:taskKey(s)}},
  resume:{worldKey:s.world.worldKey,seasonKey:s.world.seasonKey,phase:'SEASON_REVIEW',competitionKey:null,registrationKey:s.protagonistClubId,sourceRevision:revision},sourceSequence:s.events.length+1,worldDay:s.days!.days.at(-1)!.day});
}
function retire(source:KboCareer,career:KboCareer,reason:KboCareerRetirement['reason']):KboCareer {
 const c=source.world.contracts[source.protagonistKey]!,days=c.servicePay?kboServiceContractView(c)!.remainingPaidGameDays:undefined;career.revision++;
 career.retirement={receiptKey:taskKey(source),reason,seasonKey:source.world.seasonKey,age:source.world.players[source.protagonistKey]!.age,clubId:source.protagonistClubId,...(days===undefined?{}:{remainingPaidGameDays:days}),remainingContractYears:days===undefined?Math.max(0,c.years-(Number(source.world.seasonKey)-Number(c.seasonKey)+1)):Math.ceil(days/KBO_CONTRACT_GAME_DAYS),sourceRevision:career.revision};
 const farewell=retirementEvent(career,'E37',career.revision);career.events=[...career.events,farewell];
 career.phaseContext={phase:'ARCHIVED'};return career;
}
/** S09 / E30 REQUEST_RETIRE: manual retirement opens blocking E36 in the offseason after any finished pro season. */
export function requestKboRetirement(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);offseason(source);
 if(source.events.some(e=>e.status==='OPEN' && e.definitionId!=='E30'))throw new RangeError('KBO_RETIREMENT_NOT_AVAILABLE');
 const career=structuredClone(source),event=retirementEvent(source,'E36',source.revision+1);
 career.events=[...career.events,event];career.phaseContext={phase:'RETIRE_CONFIRM',eventKey:event.eventKey};career.revision++;return career;
}
/** E36: CANCEL returns to the review; CONFIRM ends the career (an open E30 closes with it, the remaining personal
 * contract ends after the warning shown in S09) and archives in the same result. */
export function resolveKboRetirement(source:KboCareer,expectedRevision:number,input:{eventKey:string;eventVersion:number;command:'CONFIRM_RETIRE'|'CANCEL_RETIRE'}):KboCareer {
 assertCareerRevision(source,expectedRevision);const phase=source.phaseContext;
 if(phase.phase!=='RETIRE_CONFIRM' || phase.eventKey!==input.eventKey)throw new RangeError('INVALID_CAREER_PHASE');
 const event=source.events.find(e=>e.eventKey===input.eventKey)!,context=(e:EventInstance)=>({worldKey:source.world.worldKey,seasonKey:source.world.seasonKey,worldDay:e.occurredWorldDay,eligibleCommands:[input.command]});
 const close=(e:EventInstance,command:string)=>completeBlockingEvent(e,e.version,{sourceEvidenceKey:e.evidenceKey,receiptKey:JSON.stringify(['kbo-retirement-decision',taskKey(source),command]),command},context(e));
 if(input.eventVersion!==event.version)throw new RangeError('EVENT_VERSION_CONFLICT');
 const career=structuredClone(source);
 career.events=career.events.map(e=>e.eventKey===event.eventKey?close(e,input.command):e.status==='OPEN' && e.definitionId==='E30' && input.command==='CONFIRM_RETIRE'?close(e,'RETIRE'):e);
 if(input.command==='CANCEL_RETIRE'){career.phaseContext={phase:'SEASON_REVIEW'};career.revision++;return career;}
 return retire(source,career,'VOLUNTARY');
}
/** 01 §6: after the season played at 45 the career ends; no new season is forced (72 Y01 MAX_AGE_REACHED). */
export function retireKboAtMaxAge(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);offseason(source);
 const blockers=kboYearTransitionReadiness(source).blockers;
 if(!blockers.includes('MAX_AGE_REACHED') || blockers.some(b=>b!=='MAX_AGE_REACHED' && b!=='CONTRACT_DECISION_REQUIRED'))throw new RangeError('KBO_RETIREMENT_NOT_AVAILABLE');
 return retire(source,structuredClone(source),'MAX_AGE');
}

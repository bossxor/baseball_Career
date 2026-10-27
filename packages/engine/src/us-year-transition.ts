import {refreshCareerSeasonGoals} from './season-goals.js';
import {mlbServiceTime} from './us-service-time.js';
import type {UsCareer,ActiveUsRosterWorld} from './us-career-entry.js';
import {assertUsCareerRevision,assertActiveUsRosterWorld} from './us-career-entry.js';
import {assertUsSeason} from './us-season.js';
import {auditUsClosedDays} from './us-growth.js';
import {auditUsCompletedPostseason} from './us-postseason-progress.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';
import {schoolYearEndRepertoire} from './college-entry.js';
import {emptyPitchXpLedger} from './pitch-xp.js';
import {closeSeasonHealth} from './health.js';
import type {HealthLedger} from './health.js';
import {createSeasonCalendar} from './season-calendar.js';
import {retireAndSupplyUsNpcs} from './us-supply.js';
import type {UsSupplyReceipt} from './us-supply.js';
import {fundUsMinorYear} from './us-minor-history.js';
import type {UsAnnualFunding,UsMinorYearArchive} from './us-minor-history.js';
import {createSeasonGrowthLedger} from './growth-ledger.js';

export type UsYearBlocker='SEASON_NOT_IN_REVIEW'|'POSTSEASON_NOT_COMPLETE'|'PENDING_GAME'|'OPEN_EVENT'|'GROWTH_NOT_FINALIZED'|'TRAINING_DECISION_REQUIRED'|'PITCH_LEARNING_NOT_SETTLED'|'MILITARY_PLAN_REQUIRED'|'MAX_AGE_REACHED'|'CONTRACT_DECISION_REQUIRED';
/** Read-only blockers. Contract/FA and military decisions are never made by the annual world worker. */
export function usYearTransitionReadiness(c:UsCareer){
 assertUsCareerRevision(c,c.revision);const blockers:UsYearBlocker[]=[],phase=c.phaseContext,player=c.world.players[c.protagonistKey]!,nextAge=player.age+1,targetSeasonKey=String(Number(c.world.seasonKey)+1);
 if(phase.phase!=='SEASON_REVIEW')blockers.push('SEASON_NOT_IN_REVIEW');
 if((phase.phase==='SEASON_PROGRESS'||phase.phase==='POSTSEASON_PROGRESS')&&phase.pendingGame)blockers.push('PENDING_GAME');
 if(!c.postseason?.bracket.championKey)blockers.push('POSTSEASON_NOT_COMPLETE');
 if(c.events.some(e=>e.status==='OPEN'))blockers.push('OPEN_EVENT');
 validateSeasonGrowthLedger(c.seasonGrowth);if(!c.seasonGrowth.finalized||!c.season?.growthFinalized)blockers.push('GROWTH_NOT_FINALIZED');
 if(!c.development.trainingUsedSeasons.includes(c.world.seasonKey))blockers.push('TRAINING_DECISION_REQUIRED');
 if(Object.values(c.world.repertoires).some(b=>b.ledger.baseReservedUnits!==0||b.learning&&b.learning.quarters.length!==4))blockers.push('PITCH_LEARNING_NOT_SETTLED');
 if(nextAge>=c.military.deadlineAge&&c.military.status==='UNRESOLVED')blockers.push('MILITARY_PLAN_REQUIRED');
 if(nextAge>45)blockers.push('MAX_AGE_REACHED');
 const signing=c.amateurHistory.usRecruitment!.program.signing!,controlSeasonsUsed=Number(c.world.seasonKey)-Number(signing.seasonKey)+1;
 if(c.contract.type==='US_MAJOR'||controlSeasonsUsed>=c.contract.controlSeasons)blockers.push('CONTRACT_DECISION_REQUIRED');
 return {ready:blockers.length===0,blockers,targetSeasonKey,nextAge,mlbService:mlbServiceTime(c.records,c.health,c.protagonistKey),controlSeasonsUsed,remainingMinorControlSeasons:Math.max(0,c.contract.controlSeasons-controlSeasonsUsed)};
}
export interface UsAgeRosterStage {receiptKey:string;sourceRevision:number;sourceSeasonKey:string;sourceRecordRevision:number;targetSeasonKey:string;world:ActiveUsRosterWorld;health:HealthLedger;supply:UsSupplyReceipt}
/** Restore injury substitutions before their year-local emergency registry is retired; injuries themselves remain. */
function restoreEmergencyRegistrations(c:UsCareer,world:ActiveUsRosterWorld):void {
 for(const[key,e]of Object.entries(c.season!.emergency?.entries??{}))if(e.releasedDay===null){const org=world.organizations.find(o=>o.id===e.clubId)!,reserve=world.reserves?.[org.id];if(!org.levels[e.level].includes(key)||!reserve?.includes(e.replacedKey))throw new RangeError('INVALID_US_EMERGENCY_REGISTRATION');org.levels[e.level]=org.levels[e.level].map(k=>k===key?e.replacedKey:k);world.reserves![org.id]=reserve.filter(k=>k!==e.replacedKey);world.reserves![org.id]!.push(key);}
}
/** Expand/stage only: no new root, salary, contract or active year is committed. Discarding the stage is rollback.
 * Historical official games are not copied into the stage; the later activation must preserve the source ledger. */
function stageUsYear(c:UsCareer,revision:number,majorRenewal:boolean):UsAgeRosterStage {
 assertUsCareerRevision(c,revision);const ready=usYearTransitionReadiness(c);if(ready.blockers.some(b=>!majorRenewal||b!=='CONTRACT_DECISION_REQUIRED')||majorRenewal&&(c.contract.type!=='US_MAJOR'||ready.mlbService.freeAgentEligible))throw new RangeError('US_YEAR_TRANSITION_NOT_READY');assertUsSeason(c,revision);auditUsClosedDays(c);auditUsCompletedPostseason(c);
 if(Object.values(c.records.games).some(g=>g.scope.seasonKey===ready.targetSeasonKey))throw new RangeError('NEXT_SEASON_RECORDS_ALREADY_EXIST');
 const world=structuredClone(c.world);restoreEmergencyRegistrations(c,world);
 const retiring=Object.keys(world.players).filter(key=>key!==c.protagonistKey&&world.players[key]!.age===45),supply=retireAndSupplyUsNpcs(world,retiring,ready.targetSeasonKey,c.protagonistKey);
 for(const[key,p]of Object.entries(world.players)){
  if(!Object.hasOwn(c.world.players,key))continue;world.players[key]={...p,age:p.age+1,fatigue:0};
  const book=schoolYearEndRepertoire({world:c.world},key);if(book)world.repertoires[key]={...structuredClone(book),seasonId:ready.targetSeasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()};
 }
 const ended=closeSeasonHealth(c.health,c.world.seasonKey).ledger,health:HealthLedger={...ended,rng:{...ended.rng},injuries:structuredClone(ended.injuries)};for(const r of supply.retired)delete health.injuries[r.playerKey];
 world.seasonKey=ready.targetSeasonKey;world.calendar=createSeasonCalendar(Number(ready.targetSeasonKey));assertActiveUsRosterWorld(world);
 return {receiptKey:JSON.stringify(['us-age-roster-stage',c.world.worldKey,c.world.seasonKey,ready.targetSeasonKey,c.revision]),sourceRevision:c.revision,sourceSeasonKey:c.world.seasonKey,sourceRecordRevision:c.records.revision,targetSeasonKey:ready.targetSeasonKey,world,health,supply};
}

export function stageUsAgeAndRosters(c:UsCareer,revision:number):UsAgeRosterStage {return stageUsYear(c,revision,false);}
/** Server-only stage: contract commit still requires the controlled-major annual writer. */
export function stageUsControlledMajorYear(c:UsCareer,revision:number):UsAgeRosterStage {return stageUsYear(c,revision,true);}

/** Atomic continuation of the original six-season minor contract. Major renewals/FA remain explicit decisions. */
export function startNextUsMinorSeason(c:UsCareer,revision:number,funding:readonly UsAnnualFunding[]):UsCareer {
 const stage=stageUsAgeAndRosters(c,revision),registered=Object.keys(stage.world.players).sort(),sortedFunding=funding.map(f=>({...f})).sort((a,b)=>a.organizationId<b.organizationId?-1:1),inventory=fundUsMinorYear(c.inventory,stage.targetSeasonKey,registered,sortedFunding,c.protagonistOrganizationId,c.contract.annualSalaryUsd),player=stage.world.players[c.protagonistKey]!;
 const archive:UsMinorYearArchive={receiptKey:JSON.stringify(['us-minor-year-close',c.activation.receiptKey,c.world.seasonKey]),seasonKey:c.world.seasonKey,sourceRevision:c.revision,recordRevision:c.records.revision,endingPlayer:structuredClone(c.world.players[c.protagonistKey]!),contract:structuredClone(c.contract),inventory:c.inventory,season:c.season!,seasonSchedule:c.seasonSchedule!,preseasonPlan:c.preseasonPlan!,campNotices:c.campNotices??[],postseason:c.postseason!,seasonGrowth:c.seasonGrowth,funding:sortedFunding,nextRegisteredPlayerKeys:registered,supply:stage.supply};
 // shortcut: historical game ledgers remain in the root; externalize closed seasons before long native careers.
 const next:UsCareer={...c,schemaVersion:3,revision:c.revision+1,world:stage.world,health:stage.health,minorYears:[...(c.minorYears??[]),archive],inventory,contract:{...c.contract,seasonKey:stage.targetSeasonKey},registration:{...c.registration,seasonKey:stage.targetSeasonKey,status:'ACTIVE'},phaseContext:{phase:'PRESEASON_SETUP'},seasonGrowth:createSeasonGrowthLedger(player,stage.targetSeasonKey,stage.world.calendar.growthDays.length),development:{...c.development,seasonStartPlayer:structuredClone(player)},planHistory:[{completedTeamGames:0,focus:[...player.focus],archetype:player.archetype}]};
 if(c.traits)next.traits={...c.traits,lastClosedDay:null,lastSeasonKey:stage.targetSeasonKey};
 delete next.season;delete next.seasonSchedule;delete next.preseasonPlan;delete next.campNotices;delete next.postseason;
 assertUsCareerRevision(next,next.revision);return refreshCareerSeasonGoals(next);
}

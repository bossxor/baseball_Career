import {refreshCareerSeasonGoals} from './season-goals.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerKboSigning} from './career-kbo.js';
import {schoolYearEndBasis,schoolYearEndRepertoire} from './college-entry.js';
import {applyCareerSeasonTraining} from './high-school-training.js';
import {validateSeasonGrowthLedger,finalizeSeasonGrowth} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {canonicalJson} from './game.js';

export interface KboAmateurYearEnd {
 receiptKey:string;contractKey:string;signingReceiptKey:string;recruitmentSourceBasis:string;
 sourceRevision:number;sourceBasis:string;
}
const yearEndKey=(source:HighSchoolCareer,contractKey:string)=>JSON.stringify(['school-kbo-year-end',source.world.worldKey,source.world.seasonKey,source.world.protagonistKey,contractKey]);
/** Full-career metadata seal, not an activation or a second draft/signing. */
export function assertKboAmateurYearEnd(source:HighSchoolCareer):KboAmateurYearEnd {
 const ready=source.kboYearEnd,r=source.kboRecruitment,signing=r?.program.signing,phase=source.phaseContext;
 if(!ready || !r || !signing || r.program.decision!=='SIGNED' || phase.phase!=='NEXT_SEASON_READY' || phase.route!=='KBO' || phase.contractKey!==ready.contractKey || ready.contractKey!==signing.contract.contractKey || ready.signingReceiptKey!==signing.receiptKey || ready.recruitmentSourceBasis!==r.sourceBasis || ready.receiptKey!==yearEndKey(source,ready.contractKey) || ready.sourceRevision!==source.revision || ready.sourceBasis!==schoolYearEndBasis(source) || !source.seasonGrowth?.finalized || !source.health.closedSeasons.includes(source.world.seasonKey))throw new RangeError('STALE_KBO_AMATEUR_YEAR_END');
 return ready;
}
/** Explicit closure after a signed domestic contract. Age, pro roster and salary reservations do not advance here. */
export function closeSchoolSeasonForKbo(source:HighSchoolCareer,expectedRevision:number,forfeitUnusedTraining=false):HighSchoolCareer {
 assertCareerRevision(source,expectedRevision);const recruitment=assertCareerKboSigning(source),signing=recruitment.program.signing!;
 if(source.kboYearEnd || source.collegeYearEnd || !source.world.calendar || !source.seasonGrowth || !source.development || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_KBO_AMATEUR_YEAR_END');
 validateSeasonGrowthLedger(source.seasonGrowth);schoolYearEndRepertoire(source,source.world.protagonistKey);
 let career=structuredClone(source);
 if(!source.development.trainingUsedSeasons.includes(source.world.seasonKey)){
  if(forfeitUnusedTraining!==true)throw new RangeError('TRAINING_FORFEIT_REQUIRED');
  career=applyCareerSeasonTraining(source,{type:'SKIP'});
 }
 const key=source.world.protagonistKey,closed=finalizeSeasonGrowth(career.world.players[key]!,career.seasonGrowth!,source.world.calendar.growthDays.length);
 career.world.players[key]=closed.player;career.seasonGrowth=closed.ledger;career.health=closeSeasonHealth(career.health,source.world.seasonKey).ledger;career.revision++;
 // These amateur contracts were evaluated before annual closure. Never silently replace their player snapshot.
 if(canonicalJson(career.world.players[key])!==canonicalJson(recruitment.program.input.player))throw new RangeError('KBO_YEAR_END_PLAYER_CHANGED');
 Object.assign(career,refreshCareerSeasonGoals(career));career.kboYearEnd={receiptKey:yearEndKey(career,signing.contract.contractKey),contractKey:signing.contract.contractKey,signingReceiptKey:signing.receiptKey,recruitmentSourceBasis:recruitment.sourceBasis,sourceRevision:career.revision,sourceBasis:schoolYearEndBasis(career)};
 assertKboAmateurYearEnd(career);return refreshCareerSeasonGoals(career);
}

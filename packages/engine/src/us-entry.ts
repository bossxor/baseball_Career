import {refreshCareerSeasonGoals} from './season-goals.js';
import type {HighSchoolCareer} from './high-school-career.js';
import {assertCareerRevision} from './high-school-career.js';
import {assertCareerUsSigning} from './career-us.js';
import {assertUsDirect} from './us-direct.js';
import {assertUsReservationLedger} from './us-reservations.js';
import {schoolYearEndBasis,schoolYearEndRepertoire} from './college-entry.js';
import {applyCareerSeasonTraining} from './high-school-training.js';
import {finalizeSeasonGrowth,validateSeasonGrowthLedger} from './growth-ledger.js';
import {closeSeasonHealth} from './health.js';
import {canonicalJson} from './game.js';

export interface UsAmateurYearEnd {receiptKey:string;contractKey:string;signingReceiptKey:string;recruitmentSourceBasis:string;sourceRevision:number;sourceBasis:string}
const key=(s:HighSchoolCareer,contract:string)=>JSON.stringify(['school-us-year-end',s.world.worldKey,s.world.seasonKey,s.world.protagonistKey,contract]);

export function assertUsAmateurYearEnd(s:HighSchoolCareer):UsAmateurYearEnd {
 const ready=s.usYearEnd,r=s.usRecruitment,signing=r?.program.signing,p=s.phaseContext;
 if(!ready || !r || r.closedBy!==undefined || r.program.decision!=='SIGNED' || !signing || p.phase!=='NEXT_SEASON_READY' || p.route!=='US' || p.contractKey!==ready.contractKey || ready.contractKey!==signing.contract.contractKey || ready.signingReceiptKey!==signing.receiptKey || ready.recruitmentSourceBasis!==r.sourceBasis || ready.receiptKey!==key(s,ready.contractKey) || ready.sourceRevision!==s.revision || ready.sourceBasis!==schoolYearEndBasis(s) || !s.seasonGrowth?.finalized || !s.health.closedSeasons.includes(s.world.seasonKey))throw new RangeError('STALE_US_AMATEUR_YEAR_END');
 assertUsDirect(r.world,r.program);assertUsReservationLedger(r.reservations);return ready;
}

/** Signed offers retain their evaluated player; annual aging and unresolved learning are never silently skipped. */
export function closeSchoolSeasonForUs(source:HighSchoolCareer,expectedRevision:number,forfeitUnusedTraining=false):HighSchoolCareer {
 assertCareerRevision(source,expectedRevision);const r=assertCareerUsSigning(source),signing=r.program.signing!;
 if(source.usYearEnd || source.kboYearEnd || source.collegeYearEnd || !source.world.calendar || !source.seasonGrowth || !source.development || source.events.some(e=>e.status==='OPEN'))throw new RangeError('INVALID_US_AMATEUR_YEAR_END');
 validateSeasonGrowthLedger(source.seasonGrowth);schoolYearEndRepertoire(source,source.world.protagonistKey);
 let c=structuredClone(source);
 if(!source.development.trainingUsedSeasons.includes(source.world.seasonKey)){if(forfeitUnusedTraining!==true)throw new RangeError('TRAINING_FORFEIT_REQUIRED');c=applyCareerSeasonTraining(source,{type:'SKIP'});}
 const playerKey=c.world.protagonistKey,closed=finalizeSeasonGrowth(c.world.players[playerKey]!,c.seasonGrowth!,c.world.calendar!.growthDays.length);c.world.players[playerKey]=closed.player;c.seasonGrowth=closed.ledger;c.health=closeSeasonHealth(c.health,c.world.seasonKey).ledger;c.revision++;
 if(canonicalJson(c.world.players[playerKey])!==canonicalJson(r.program.input.player))throw new RangeError('US_YEAR_END_PLAYER_CHANGED');
 Object.assign(c,refreshCareerSeasonGoals(c));c.usYearEnd={receiptKey:key(c,signing.contract.contractKey),contractKey:signing.contract.contractKey,signingReceiptKey:signing.receiptKey,recruitmentSourceBasis:r.sourceBasis,sourceRevision:c.revision,sourceBasis:schoolYearEndBasis(c)};assertUsAmateurYearEnd(c);return refreshCareerSeasonGoals(c);
}

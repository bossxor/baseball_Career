import type {HighSchoolCareer} from './high-school-career.js';
import {assertSchoolCareerRevision} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import {assertKboCareerRevision} from './kbo-career-version.js';
import type {UsCareer} from './us-career-entry.js';
import {assertUsCareerRevision} from './us-career-entry.js';
import {canonicalJson} from './game.js';
import {assertContributionSplits,putGameContribution} from './records.js';
import type {GameContribution} from './records.js';
import {settleRelationshipDirectDuels,validateDirectDuelReceipts} from './relationships.js';
import type {DirectDuelReceipt} from './relationships.js';
import {refreshCareerTraits,settleStarterSeasonTraits,validateCareerTraitLedger} from './high-school-traits.js';
import type {CareerTraitLedger} from './high-school-traits.js';
import {refreshCareerSeasonGoals} from './season-goals.js';
import {validateHealthLedger} from './health.js';

export interface CareerRecordCorrectionCommand {
 correctionId:string;expectedRevision:number;expectedRecordRevision:number;
 beforeEvidence:string;contribution:GameContribution;
}
export interface CareerRecordCorrectionReceipt {
 status:'CORRECTED';receiptKey:string;worldKey:string;playerKey:string;seasonKey:string;
 command:CareerRecordCorrectionCommand;afterRevision:number;afterRecordRevision:number;
 before:GameContribution;after:GameContribution;beforeDuels:readonly DirectDuelReceipt[];afterDuels:readonly DirectDuelReceipt[];
 beforeTraits?:CareerTraitLedger;afterTraits?:CareerTraitLedger;beforeDayEvidence:string;afterDayEvidence:string;seal:string;
}
export interface CareerRecordCorrectionLedger {schemaVersion:1;receipts:readonly CareerRecordCorrectionReceipt[]}
export type RecordCorrectionCareer=(HighSchoolCareer|KboCareer|UsCareer)&{recordCorrections?:CareerRecordCorrectionLedger};
const isUs=(c:RecordCorrectionCareer):c is UsCareer=>'mode'in c&&c.mode==='US_CAREER';
const isKbo=(c:RecordCorrectionCareer):c is KboCareer=>'protagonistClubId'in c;
const playerKey=(c:RecordCorrectionCareer)=>'protagonistKey'in c?c.protagonistKey:c.world.protagonistKey;
const receiptKey=(c:RecordCorrectionCareer,id:string)=>JSON.stringify(['official-record-correction-1',c.world.worldKey,playerKey(c),id]);
function seal(r:CareerRecordCorrectionReceipt){const {seal:ignored,...body}=r;void ignored;return canonicalJson(body);}
function assertRoot(c:RecordCorrectionCareer,revision:number){if(isUs(c))assertUsCareerRevision(c,revision);else if(isKbo(c))assertKboCareerRevision(c,revision);else assertSchoolCareerRevision(c,revision);}
/** Preserve the already committed game/participation accounting; no health, growth, salary or RNG replay. */
function assertReplacement(before:GameContribution,after:GameContribution){
 assertContributionSplits(before);assertContributionSplits(after);
 if(before.gameKey!==after.gameKey||before.worldDay!==after.worldDay||canonicalJson(before.scope)!==canonicalJson(after.scope)||canonicalJson(before.teams)!==canonicalJson(after.teams))throw new RangeError('CORRECTION_SCOPE_CHANGED');
 const participants=(g:GameContribution)=>({batting:Object.entries(g.batting).map(([key,b])=>[key,b.PA,b.games,b.fieldingGames]).sort(),pitching:Object.entries(g.pitching).map(([key,p])=>[key,p.BF,p.outs,p.starts,p.games]).sort()});
 if(canonicalJson(participants(before))!==canonicalJson(participants(after)))throw new RangeError('CORRECTION_PARTICIPATION_TRANSPORT_REQUIRED');
}
/** Reader guard is pure and never invokes root/view guards, so public root readers may call it safely. */
export function auditCareerRecordCorrections(c:RecordCorrectionCareer):void {
 const l=c.recordCorrections;if(l===undefined)return;
 if(l.schemaVersion!==1||!Array.isArray(l.receipts))throw new RangeError('INVALID_RECORD_CORRECTION_LEDGER');
 const ids=new Set<string>(),latest=new Map<string,CareerRecordCorrectionReceipt>(),dates=new Map<string,CareerRecordCorrectionReceipt>();let revision=-1,recordRevision=-1;
 for(const raw of l.receipts){const r:CareerRecordCorrectionReceipt=raw;
  if(!r||r.status!=='CORRECTED'||!r.command?.correctionId||r.receiptKey!==receiptKey(c,r.command.correctionId)||ids.has(r.receiptKey)||r.worldKey!==c.world.worldKey||r.playerKey!==playerKey(c)||r.seasonKey!==r.before.scope.seasonKey||r.seal!==seal(r)||r.command.beforeEvidence!==canonicalJson(r.before)||canonicalJson(r.command.contribution)!==canonicalJson(r.after)||r.afterRevision!==r.command.expectedRevision+1||r.afterRecordRevision!==r.command.expectedRecordRevision+1||![r.afterRevision,r.afterRecordRevision].every(n=>Number.isSafeInteger(n)&&n>0)||r.afterRevision>c.revision||r.afterRecordRevision>c.records.revision||r.afterRevision<=revision||r.afterRecordRevision<=recordRevision)throw new RangeError('INVALID_RECORD_CORRECTION_RECEIPT');
  assertReplacement(r.before,r.after);const prior=latest.get(r.before.gameKey);if(prior&&canonicalJson(prior.after)!==canonicalJson(r.before))throw new RangeError('CHANGED_RECORD_CORRECTION_CHAIN');
  for(const [key,owned]of Object.entries(r.beforeTraits?.owned??{})){const after=r.afterTraits?.owned[key];if(!after||owned.unlocked.some(t=>!after.unlocked.includes(t))||owned.qualifiedRivalPitcherKeys.some(k=>!after.qualifiedRivalPitcherKeys.includes(k)))throw new RangeError('CORRECTION_TRAIT_OWNERSHIP_CHANGED');}
  ids.add(r.receiptKey);latest.set(r.before.gameKey,r);dates.set(JSON.stringify([r.seasonKey,r.after.worldDay]),r);revision=r.afterRevision;recordRevision=r.afterRecordRevision;
 }
 for(const [key,r]of latest){
  if(canonicalJson(c.records.games[key])!==canonicalJson(r.after)||canonicalJson((c.relationships?.directDuels??[]).filter(d=>d.gameKey===key))!==canonicalJson(r.afterDuels))throw new RangeError('CHANGED_RECORD_CORRECTION_EVIDENCE');
  for(const [key,owned]of Object.entries(r.afterTraits?.owned??{})){const now=c.traits?.owned[key];if(!now||owned.unlocked.some(t=>!now.unlocked.includes(t))||owned.qualifiedRivalPitcherKeys.some(k=>!now.qualifiedRivalPitcherKeys.includes(k)))throw new RangeError('CORRECTION_TRAIT_OWNERSHIP_CHANGED');}
 }
 for(const r of dates.values())if(r.seasonKey===c.world.seasonKey){const days=isUs(c)?c.season?.days:c.days?.days;if(days?.find(d=>d.day===r.after.worldDay)?.evidence!==r.afterDayEvidence)throw new RangeError('CHANGED_RECORD_CORRECTION_DAY');}
}
function assertOpen(c:RecordCorrectionCareer,g:GameContribution){
 if(c.phaseContext.phase!=='SEASON_PROGRESS'||c.phaseContext.pendingGame||g.scope.seasonKey!==c.world.seasonKey||g.scope.phase!=='REGULAR'||c.seasonGrowth?.finalized||c.health.closedSeasons.includes(g.scope.seasonKey))throw new RangeError('RECORD_CORRECTION_SEALED_OR_PENDING');
 if(isUs(c)){if(!c.season||c.season.growthFinalized||c.postseason)throw new RangeError('RECORD_CORRECTION_TRANSPORT_REQUIRED');}
 else if(isKbo(c)){if(c.seasonClose||c.postseason)throw new RangeError('RECORD_CORRECTION_TRANSPORT_REQUIRED');}
 else if(c.collegeCup||c.collegeResult||c.collegeYearEnd||c.kboYearEnd||c.usYearEnd||c.kboRecruitment||c.usRecruitment)throw new RangeError('RECORD_CORRECTION_TRANSPORT_REQUIRED');
 // National selections and host handoffs carry independent immutable source projections.
 if(c.national?.selections?.some(s=>s.seasonKey===g.scope.seasonKey))throw new RangeError('RECORD_CORRECTION_TRANSPORT_REQUIRED');
}
/** Rebase only the closed date's contribution evidence; its health/fatigue/payroll receipt stays unchanged. */
function rebaseClosedDay(c:RecordCorrectionCareer,before:GameContribution,after:GameContribution){
 const days=isUs(c)?c.season!.days:c.days?.days,day=days?.find(d=>d.day===before.worldDay);if(!day)throw new RangeError('RECORD_CORRECTION_DAY_NOT_CLOSED');
 const old=day.evidence;let parsed:unknown;try{parsed=JSON.parse(old);}catch{throw new RangeError('RECORD_CORRECTION_DAY_EVIDENCE_CHANGED');}
 const raw=parsed as {worldKey?:string;seasonKey?:string;day?:number;contributions?:GameContribution[]},rows=isUs(c)?parsed:raw.contributions;
 if(!Array.isArray(rows)||!isUs(c)&&(raw.worldKey!==c.world.worldKey||raw.seasonKey!==c.world.seasonKey||raw.day!==before.worldDay)||rows.filter(r=>r.gameKey===before.gameKey).length!==1||rows.some(r=>canonicalJson(c.records.games[r.gameKey])!==canonicalJson(r)))throw new RangeError('RECORD_CORRECTION_DAY_EVIDENCE_CHANGED');
 const corrected=rows.map(r=>r.gameKey===before.gameKey?after:r);day.evidence=canonicalJson(isUs(c)?corrected:{...raw,contributions:corrected});return {before:old,after:day.evidence};
}
function replayStarterSeasons(c:RecordCorrectionCareer,day:number){
 const settled=c.traits?.settledStarterSeasons;if(!settled?.length)return;
 const seasons=[...settled].sort((a,b)=>Number(a)-Number(b));if(new Set(seasons).size!==seasons.length||seasons.some(s=>!/^\d{4}$/.test(s)))throw new RangeError('INVALID_TRAIT_LEDGER');
 c.traits={...c.traits!,starterStreaks:{},settledStarterSeasons:[]};
 for(const seasonKey of seasons)c.traits=settleStarterSeasonTraits({...c,world:{...c.world,seasonKey}},day);
}
/** SERVER ONLY: contribution and correction identity must come from the official scoring owner, never client game data. */
export function correctCareerGameContribution<T extends RecordCorrectionCareer>(source:T,command:CareerRecordCorrectionCommand):{career:T;receipt:CareerRecordCorrectionReceipt;duplicate:boolean} {
 auditCareerRecordCorrections(source);assertRoot(source,source.revision);
 if(!command.correctionId||command.correctionId.length>256||!Number.isSafeInteger(command.expectedRecordRevision)||command.expectedRecordRevision<0)throw new RangeError('INVALID_RECORD_CORRECTION_COMMAND');
 const key=receiptKey(source,command.correctionId),old=source.recordCorrections?.receipts.find(r=>r.receiptKey===key);
 if(old){if(canonicalJson(old.command)!==canonicalJson(command))throw new RangeError('RECORD_CORRECTION_RECEIPT_REUSED');return {career:structuredClone(source),receipt:structuredClone(old),duplicate:true};}
 assertRoot(source,command.expectedRevision);if(source.records.revision!==command.expectedRecordRevision||source.records.revision===Number.MAX_SAFE_INTEGER)throw new RangeError('RECORD_REVISION_CHANGED');
 const before=source.records.games[command.contribution.gameKey];if(!before||command.beforeEvidence!==canonicalJson(before))throw new RangeError('RECORD_CORRECTION_SOURCE_CHANGED');
 assertOpen(source,before);assertReplacement(before,command.contribution);if(canonicalJson(before)===canonicalJson(command.contribution))throw new RangeError('RECORD_CORRECTION_UNCHANGED');
 validateHealthLedger(source.health);validateDirectDuelReceipts(source);if(source.traits)validateCareerTraitLedger(source.traits,source.world.players);
 const career=structuredClone(source),day=rebaseClosedDay(career,before,command.contribution),beforeDuels=(source.relationships?.directDuels??[]).filter(d=>d.gameKey===before.gameKey);
 career.records=putGameContribution(source.records,command.contribution,true).ledger;career.revision++;
 if(career.relationships){career.relationships={...career.relationships,directDuels:(career.relationships.directDuels??[]).filter(d=>d.gameKey!==before.gameKey)};career.relationships=settleRelationshipDirectDuels(career,before.gameKey)!;}
 const closedDay=isUs(career)?career.season!.days.at(-1)!.day:career.days!.days.at(-1)!.day;
 replayStarterSeasons(career,closedDay);
 if(career.traits)career.traits={...career.traits,lastClosedDay:null};
 const leagues=[...new Set(Object.values(career.records.games).filter(g=>g.scope.seasonKey===career.world.seasonKey&&g.scope.phase==='REGULAR').map(g=>g.scope.leagueKey))];career.traits=refreshCareerTraits(career,closedDay,leagues);
 Object.assign(career,refreshCareerSeasonGoals(career));
 const receipt:CareerRecordCorrectionReceipt={status:'CORRECTED',receiptKey:key,worldKey:career.world.worldKey,playerKey:playerKey(career),seasonKey:career.world.seasonKey,command:structuredClone(command),afterRevision:career.revision,afterRecordRevision:career.records.revision,before:structuredClone(before),after:structuredClone(command.contribution),beforeDuels:structuredClone(beforeDuels),afterDuels:structuredClone((career.relationships?.directDuels??[]).filter(d=>d.gameKey===before.gameKey)),...(source.traits?{beforeTraits:structuredClone(source.traits)}:{}),...(career.traits?{afterTraits:structuredClone(career.traits)}:{}),beforeDayEvidence:day.before,afterDayEvidence:day.after,seal:''};receipt.seal=seal(receipt);
 career.recordCorrections={schemaVersion:1,receipts:[...(source.recordCorrections?.receipts??[]),receipt]};auditCareerRecordCorrections(career);assertRoot(career,career.revision);return {career,receipt:structuredClone(receipt),duplicate:false};
}

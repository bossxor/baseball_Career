import {kboContractSeasonCharge} from './kbo-service-payroll.js';
import {assertKboFinanceLedger,kboClubBalance,kboFutureCommitmentWon} from './kbo-finance.js';
import {KBO_CLUBS,KBO_MONEY,KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {KboRosterWorld,KboInitialContract} from './kbo-world.js';
import {canonicalJson} from './game.js';
import {createWorldStream,validateRng} from './rng.js';
import type {RngState} from './rng.js';
import {draftPreview,drawDraft} from './draft.js';
export interface KboDraftInput {assessmentKey:string;player:DevelopmentPlayer;baseScore:number;preferredClubId:string|null}
export interface KboDraftResult {receiptKey:string;score:number|null;round:number|null;clubId:string|null}
export interface KboRookieSigning {
 receiptKey:string;contract:KboInitialContract & {type:'KBO';currency:'KRW'};
 rights:{sourceType:'DRAFT';holderOrgId:string;territory:'KR';playerKey:string;draftReceiptKey:string};
 registration:{playerKey:string;clubId:string;seasonKey:string;status:'PENDING_SEASON_ACTIVATION';firstTeam:false};
 rosterAfter:string[];reservedSalaryBeforeWon:number;reservedSalaryAfterWon:number;
}
export interface KboDraftProgram {
 schemaVersion:1;version:number;assessmentKey:string;worldKey:string;seasonKey:string;
 sourceBasis:string;input:KboDraftInput;rngStart:RngState;rng:RngState;
 result:KboDraftResult|null;decision:'PENDING'|'SIGNED'|'DECLINED';signing:KboRookieSigning|null;
}
/** Current salary-only world boundary. Initial age/distribution checks do not apply to recruitment. */
export function assertKboRecruitmentWorld(world:Omit<KboRosterWorld,'status'>):void {
 if(world.schemaVersion!==1 || !world.worldKey || !world.seasonKey || !world.seed || world.clubs.length!==10 || new Set(world.clubs.map(c=>c.id)).size!==10)throw new RangeError('INVALID_KBO_RECRUITMENT_WORLD');
 for(const stream of [world.rng.roster,world.rng.potential,world.rng.handedness])validateRng(stream);
 assertKboFinanceLedger(world);
 const seen=new Set<string>();
 for(const club of world.clubs){
  if(KBO_CLUBS.find(c=>c.id===club.id)?.name!==club.name || club.roster.length<KBO_ROSTER_LIMITS.minimum || club.roster.length>KBO_ROSTER_LIMITS.maximum || new Set(club.roster).size!==club.roster.length || club.budgetWon!==KBO_MONEY.annualBudgetWon || !Number.isSafeInteger(club.paidSalaryWon) || club.paidSalaryWon<0 || !Number.isSafeInteger(club.reservedSalaryWon) || club.reservedSalaryWon<0)throw new RangeError('INVALID_KBO_RECRUITMENT_CLUB');
  let annual=0;for(const key of club.roster){const p=world.players[key],c=world.contracts[key];if(!Object.hasOwn(world.players,key) || !p || p.simulationKey!==key || seen.has(key) || !Object.hasOwn(world.contracts,key) || !c || !c.contractKey || c.playerKey!==key || c.clubId!==club.id || c.seasonKey!==world.seasonKey || c.status!=='ACTIVE' || c.signingBonusWon!==0 || !Number.isInteger(c.years) || c.years<1 || c.years>4 || !Number.isSafeInteger(c.annualSalaryWon) || c.annualSalaryWon%10_000!==0 || c.annualSalaryWon<KBO_MONEY.minimumSalaryWon || c.annualSalaryWon>KBO_MONEY.maximumSalaryWon)throw new RangeError('INVALID_KBO_RECRUITMENT_CONTRACT');validateDevelopmentPlayer(p);seen.add(key);annual+=kboContractSeasonCharge(c);}
  if(annual!==club.paidSalaryWon+club.reservedSalaryWon || kboClubBalance(world,club.id).availableWon<0)throw new RangeError('INVALID_KBO_RECRUITMENT_PAYROLL');
  for(let year=1;year<4;year++)if(kboFutureCommitmentWon(world,club.id,year)>club.budgetWon*.9)throw new RangeError('INVALID_KBO_FUTURE_COMMITMENT');
 }
 if(seen.size!==Object.keys(world.players).length || seen.size!==Object.keys(world.contracts).length)throw new RangeError('INVALID_KBO_RECRUITMENT_REGISTRATION');
}
function validInput(world:KboRosterWorld,input:KboDraftInput):void {
 validateDevelopmentPlayer(input.player);draftPreview({baseScore:input.baseScore,hasEligibleClubSlot:true});
 if(!input.assessmentKey || input.preferredClubId!==null && !KBO_CLUBS.some(c=>c.id===input.preferredClubId) || Object.hasOwn(world.players,input.player.simulationKey))throw new RangeError('INVALID_KBO_DRAFT_CANDIDATE');
}
/** Need tier, then weakest incumbent at the requested role; preference resolves exact ties only (08/44). */
function slots(world:KboRosterWorld,input:KboDraftInput){
 const p=input.player;
 return world.clubs.filter(c=>c.roster.length<KBO_ROSTER_LIMITS.maximum && c.budgetWon-c.paidSalaryWon-c.reservedSalaryWon>=KBO_MONEY.minimumSalaryWon && c.paidSalaryWon+c.reservedSalaryWon+KBO_MONEY.minimumSalaryWon<=c.budgetWon*.9).map(c=>{
  const group=c.roster.map(k=>world.players[k]!).filter(n=>n.kind===p.kind && (p.kind==='PITCHER' && p.position!=='SP'?n.position==='RP' || n.position==='CP':n.position===p.position));
  const required=p.position==='C'?2:p.position==='SP'?5:p.kind==='PITCHER'?8:1,need=group.length<required?100:group.length<required+1?50:10;
  const strength=group.map(n=>roleScore(n.kind,n.abilities,p.position)).sort((a,b)=>b-a),incumbent=group.length>=required?strength[required-1]!:0;
  return {clubId:c.id,need,incumbent,preferred:c.id===input.preferredClubId};
 }).sort((a,b)=>b.need-a.need || a.incumbent-b.incumbent || Number(b.preferred)-Number(a.preferred) || (a.clubId<b.clubId?-1:1));
}
function basis(world:KboRosterWorld,input:KboDraftInput){return canonicalJson({world,input});}
export function prepareKboDraft(world:KboRosterWorld,input:KboDraftInput):KboDraftProgram {
 assertKboRecruitmentWorld(world);validInput(world,input);
 const rng=createWorldStream(world.seed,JSON.stringify(['career-kbo-draft-1',world.worldKey,world.seasonKey,input.assessmentKey]),'roster');
 return {schemaVersion:1,version:1,assessmentKey:input.assessmentKey,worldKey:world.worldKey,seasonKey:world.seasonKey,sourceBasis:basis(world,input),input:structuredClone(input),rngStart:rng,rng:{...rng},result:null,decision:'PENDING',signing:null};
}
function expectedResult(world:KboRosterWorld,p:KboDraftProgram){
 const eligible=slots(world,p.input),draw=drawDraft({baseScore:p.input.baseScore,hasEligibleClubSlot:eligible.length>0},p.rngStart);
 return {result:{receiptKey:JSON.stringify(['career-kbo-draft-result',p.assessmentKey]),score:draw.score,round:draw.round,clubId:draw.round===null?null:eligible[0]!.clubId},rng:draw.state};
}
function signing(world:KboRosterWorld,p:KboDraftProgram):KboRookieSigning {
 const club=world.clubs.find(c=>c.id===p.result?.clubId);if(!club || !p.result?.round)throw new RangeError('KBO_NOT_DRAFTED');
 const playerKey=p.input.player.simulationKey,receiptKey=JSON.stringify(['kbo-rookie-signing',p.result.receiptKey]);
 return {receiptKey,contract:{contractKey:receiptKey,playerKey,clubId:club.id,seasonKey:world.seasonKey,years:1,annualSalaryWon:KBO_MONEY.minimumSalaryWon,signingBonusWon:0,status:'ACTIVE',type:'KBO',currency:'KRW'},rights:{sourceType:'DRAFT',holderOrgId:club.id,territory:'KR',playerKey,draftReceiptKey:p.result.receiptKey},registration:{playerKey,clubId:club.id,seasonKey:world.seasonKey,status:'PENDING_SEASON_ACTIVATION',firstTeam:false},rosterAfter:[...club.roster,playerKey].sort(),reservedSalaryBeforeWon:club.reservedSalaryWon,reservedSalaryAfterWon:club.reservedSalaryWon+KBO_MONEY.minimumSalaryWon};
}
export function assertKboDraft(world:KboRosterWorld,p:KboDraftProgram):void {
 assertKboRecruitmentWorld(world);validInput(world,p.input);validateRng(p.rngStart);validateRng(p.rng);
 const start=createWorldStream(world.seed,JSON.stringify(['career-kbo-draft-1',world.worldKey,world.seasonKey,p.assessmentKey]),'roster');
 if(p.schemaVersion!==1 || p.assessmentKey!==p.input.assessmentKey || p.worldKey!==world.worldKey || p.seasonKey!==world.seasonKey || p.sourceBasis!==basis(world,p.input) || canonicalJson(start)!==canonicalJson(p.rngStart))throw new RangeError('STALE_KBO_DRAFT');
 const version=p.result?(p.decision==='PENDING'?2:3):1;
 if(p.version!==version || !['PENDING','SIGNED','DECLINED'].includes(p.decision) || !p.result && (p.decision!=='PENDING' || p.signing!==null || canonicalJson(p.rng)!==canonicalJson(start)))throw new RangeError('INVALID_KBO_DRAFT');
 if(p.result){const expected=expectedResult(world,p);if(canonicalJson(p.result)!==canonicalJson(expected.result) || canonicalJson(p.rng)!==canonicalJson(expected.rng))throw new RangeError('INVALID_KBO_DRAFT_RESULT');}
 if(p.decision==='SIGNED'){if(canonicalJson(p.signing)!==canonicalJson(signing(world,p)))throw new RangeError('INVALID_KBO_SIGNING');}else if(p.signing!==null)throw new RangeError('INVALID_KBO_SIGNING');
}
/** Explicit allowlist: the persisted program also contains hidden P, seed and source snapshots. */
export function kboDraftView(world:KboRosterWorld,p:KboDraftProgram){
 assertKboDraft(world,p);const eligible=slots(world,p.input).length>0;
 return {eligible,reasonCode:eligible?null:'NO_ELIGIBLE_CLUB_SLOT',assessmentKey:p.assessmentKey,version:p.version,status:p.decision==='SIGNED'?'SIGNED' as const:p.decision==='DECLINED'?'DECLINED' as const:p.result?'RESULT' as const:'PREVIEW' as const,preview:draftPreview({baseScore:p.input.baseScore,hasEligibleClubSlot:eligible}),result:p.result?{...p.result}:null,offer:p.result?.round && p.decision!=='DECLINED'?{clubId:p.result.clubId,years:1,annualSalaryWon:KBO_MONEY.minimumSalaryWon,signingBonusWon:0,currency:'KRW' as const,seasonKey:world.seasonKey,firstTeamGuaranteed:false}:null};
}
export function resolveKboDraft(world:KboRosterWorld,source:KboDraftProgram,expectedVersion:number):KboDraftProgram {
 assertKboDraft(world,source);if(source.version!==expectedVersion)throw new RangeError('KBO_DRAFT_VERSION_CHANGED');
 if(source.result)return structuredClone(source);
 const result=expectedResult(world,source);return {...structuredClone(source),version:2,result:result.result,rng:result.rng};
}
export function decideKboDraft(world:KboRosterWorld,source:KboDraftProgram,expectedVersion:number,decision:'SIGN'|'DECLINE'):KboDraftProgram {
 assertKboDraft(world,source);if(source.version!==expectedVersion)throw new RangeError('KBO_DRAFT_VERSION_CHANGED');
 if(source.decision!=='PENDING' || !source.result || !source.result.round || !['SIGN','DECLINE'].includes(decision))throw new RangeError('INVALID_KBO_SIGNING_DECISION');
 const next={...structuredClone(source),version:3,decision:decision==='SIGN'?'SIGNED' as const:'DECLINED' as const,signing:decision==='SIGN'?signing(world,source):null};assertKboDraft(world,next);return next;
}

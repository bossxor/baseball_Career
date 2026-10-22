import {kboContractSeasonCharge} from './kbo-service-payroll.js';
import {KBO_MONEY,KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import {assertKboFreeAgentPool} from './kbo-free-agents.js';
import type {RecordLedger} from './records.js';
import {recordTotals} from './records.js';
import type {HealthLedger} from './health.js';
import {reconcileAssessment,assessmentMidpointScore,observeAssessmentProgress} from './assessment.js';
import type {AssessmentProgress,PotentialRange} from './assessment.js';
import {kboPlayerContractValue,kboRenewalSalaryWon} from './kbo-contract-value.js';
import {kboClubBalance} from './kbo-finance.js';

export interface KboAiAssessment {schemaVersion:1;modelVersion:'potential-1';level:number;progress:AssessmentProgress;ranges:Record<string,PotentialRange>}
export type KboAiAssessments=Record<string,KboAiAssessment>;
const group=(p:Pick<DevelopmentPlayer,'kind'|'position'>)=>p.kind==='PITCHER'?p.position==='SP'?'SP':'RELIEF':p.position;
const required=(g:string)=>g==='C'?2:g==='SP'?5:g==='RELIEF'?8:1;
/** 44: gap100, backup50, improvement10. RP/CP share the relief competition group. */
export function kboAiRoleNeed(candidate:Pick<DevelopmentPlayer,'kind'|'position'>,members:readonly DevelopmentPlayer[]){
 const g=group(candidate),needed=required(g),peers=members.filter(p=>group(p)===g),scores=peers.map(p=>roleScore(p.kind,p.abilities,candidate.position)).sort((a,b)=>b-a);
 return {needScore:peers.length<needed?100:peers.length<needed+1?50:10,incumbentRoleScore:scores[needed-1]??0};
}
/** Decision boundary accepts only public outlook, not raw P. Any missing-role100 takes precedence at the caller. */
export function kboAiCandidatePriority(input:{roleScore:number;incumbentRoleScore:number;outlookMidpoint:number;needScore:number;annualSalaryWon:number;budgetWon:number}):number {
 for(const n of [input.roleScore,input.incumbentRoleScore,input.outlookMidpoint,input.needScore])if(!Number.isFinite(n) || n<0 || n>100)throw new RangeError('INVALID_KBO_AI_SCORE');
 if(!Number.isSafeInteger(input.annualSalaryWon) || input.annualSalaryWon<KBO_MONEY.minimumSalaryWon || input.annualSalaryWon>KBO_MONEY.maximumSalaryWon || input.budgetWon!==KBO_MONEY.annualBudgetWon)throw new RangeError('INVALID_KBO_AI_PRICE');
 return .6*Math.max(0,input.roleScore-input.incumbentRoleScore)+.2*input.outlookMidpoint+.2*input.needScore-10*(input.annualSalaryWon/input.budgetWon);
}
/** Fixed level2 facility baseline (D). Only actual registered-team regular receipts add observation, never elapsed time. */
export function refreshKboAiAssessments(input:{world:ActiveKboRosterWorld;players:readonly DevelopmentPlayer[];reports?:KboAiAssessments;records:RecordLedger;health:HealthLedger;sourceSeasonKey:string}):KboAiAssessments {
 const reports:KboAiAssessments=structuredClone(input.reports??{}),keys=new Set(input.players.map(p=>p.simulationKey)),observations=new Map<string,{gameKey:string;worldDay:number;seasonYear:number}[]>();
 const games=new Map(Object.values(input.records.games).filter(g=>g.scope.seasonKey===input.sourceSeasonKey && g.scope.phase==='REGULAR' && ['KBO','FUTURES'].includes(g.scope.leagueKey)).map(g=>[g.gameKey,g]));
 for(const row of input.health.games){const e=row.evidence,g=games.get(e.gameKey);if(!g || e.seasonKey!==input.sourceSeasonKey)continue;if(e.day!==g.worldDay || !e.teamKey.startsWith(g.scope.leagueKey+':') || !Object.hasOwn(g.teams,e.teamKey.slice(g.scope.leagueKey.length+1)))throw new RangeError('INVALID_KBO_AI_OBSERVATION');for(const key of e.roster)if(keys.has(key)){const list=observations.get(key)??[];list.push({gameKey:e.gameKey,worldDay:e.day,seasonYear:Number(e.seasonKey)});observations.set(key,list);}}
 for(const player of input.players){
  const key=player.simulationKey,old=reports[key];if(old && (old.schemaVersion!==1 || old.modelVersion!=='potential-1' || old.progress.stage!==Math.min(4,Math.floor(old.progress.observed.length/20))))throw new RangeError('INVALID_KBO_AI_ASSESSMENT');
  let progress=structuredClone(old?.progress??{observed:[],stage:0});for(const e of (observations.get(key)??[]).sort((a,b)=>a.worldDay-b.worldDay || (a.gameKey<b.gameKey?-1:a.gameKey>b.gameKey?1:0)))progress=observeAssessmentProgress(progress,e);
  const level=Math.max(2,old?.level??2),ranges=reconcileAssessment({playerKey:JSON.stringify([input.world.worldKey,key]),modelVersion:'potential-1',kind:player.kind,abilities:player.abilities,potential:player.potential,level,stage:progress.stage,...(old?{previous:old.ranges}:{})});
  reports[key]={schemaVersion:1,modelVersion:'potential-1',level,progress,ranges};
 }
 return reports;
}
export interface KboAiRenewalReceipt {receiptKey:string;seasonKey:string;renewed:readonly {playerKey:string;clubId:string;annualSalaryWon:number}[];expired:readonly {playerKey:string;clubId:string}[]}
/** Internal Y03 preparation, after age/contract carry. It is not a user club release command. Guaranteed contracts and
 * my already accepted contract are locked. Expiring NPCs compete up to the existing initial50 roster target (D).
 * Below35/unfinished first teams are allowed only in this private result and must be repaired before activation. */
export function prepareKboAiRenewals(input:{world:ActiveKboRosterWorld;pool:KboFreeAgentPool;priorContracts:Readonly<Record<string,KboInitialContract>>;expiringKeys:readonly string[];protagonistKey:string;sourceSeasonKey:string;records:RecordLedger;health:HealthLedger;reports?:KboAiAssessments}){
 const {world,pool}=input;
 if(Number(world.seasonKey)!==Number(input.sourceSeasonKey)+1 || pool.worldKey!==world.worldKey || pool.seasonKey!==world.seasonKey || pool.settlement || new Set(input.expiringKeys).size!==input.expiringKeys.length || input.expiringKeys.includes(input.protagonistKey))throw new RangeError('INVALID_KBO_AI_RENEWAL_SOURCE');
 assertKboFreeAgentPool(pool,Object.keys(world.players));
 for(const key of input.expiringKeys){const prior=input.priorContracts[key],c=world.contracts[key];if(!prior || !c || !Object.hasOwn(world.players,key) || c.seasonKey!==world.seasonKey || c.years!==1 || world.clubs.filter(t=>t.id===c.clubId && t.roster.includes(key)).length!==1 || c.contractKey!==prior.contractKey || c.annualSalaryWon!==prior.annualSalaryWon || c.clubId!==prior.clubId || Number(input.sourceSeasonKey)-Number(prior.seasonKey)+1<prior.years)throw new RangeError('INVALID_KBO_AI_EXPIRING_CONTRACT');}
 const next=structuredClone(world),freeAgents=structuredClone(pool),health=structuredClone(input.health),candidates=new Map(input.expiringKeys.map(key=>[key,{player:structuredClone(world.players[key]!),contract:structuredClone(input.priorContracts[key]!),repertoire:world.repertoires[key]?structuredClone(world.repertoires[key]):undefined}]));
 const reports=refreshKboAiAssessments({...input,players:[...candidates.values()].map(c=>c.player)}),totals=recordTotals(input.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:input.sourceSeasonKey});
 const renewed:KboAiRenewalReceipt['renewed'][number][]=[],expired:KboAiRenewalReceipt['expired'][number][]=[];
 for(const club of next.clubs){
  const mine=input.expiringKeys.filter(k=>input.priorContracts[k]!.clubId===club.id),unresolved=new Set(mine);
  club.roster=club.roster.filter(k=>!unresolved.has(k));club.firstTeam=club.firstTeam.filter(k=>!unresolved.has(k));
  for(const key of mine){delete next.players[key];delete next.contracts[key];delete next.repertoires[key];}
  club.reservedSalaryWon=club.roster.reduce((n,k)=>n+kboContractSeasonCharge(next.contracts[k]!),0);club.paidSalaryWon=0;
  while(unresolved.size && club.roster.length<KBO_ROSTER_LIMITS.initial){
   const ranked=[...unresolved].map(key=>{const c=candidates.get(key)!,p=c.player,need=kboAiRoleNeed(p,club.roster.map(k=>next.players[k]!)),v=kboPlayerContractValue(p,totals.batting[key],totals.pitching[key]),salary=kboRenewalSalaryWon(c.contract.annualSalaryWon,v.valueWon),score=kboAiCandidatePriority({roleScore:roleScore(p.kind,p.abilities,p.position),...need,outlookMidpoint:assessmentMidpointScore(p.kind,reports[key]!.ranges),annualSalaryWon:salary,budgetWon:club.budgetWon});return {key,salary,score,need:need.needScore};}).sort((a,b)=>Number(b.need===100)-Number(a.need===100) || b.score-a.score || (a.key<b.key?-1:a.key>b.key?1:0));
   const best=ranked.find(r=>{const b=kboClubBalance(next,club.id),protectedAfter=Math.max(0,KBO_ROSTER_LIMITS.minimum-(club.roster.length+1))*KBO_MONEY.minimumSalaryWon;return club.paidSalaryWon+club.reservedSalaryWon+r.salary+b.guaranteedWon+protectedAfter<=club.budgetWon+b.supportWon;});if(!best)break;
   const c=candidates.get(best.key)!;next.players[best.key]=c.player;if(c.repertoire)next.repertoires[best.key]=c.repertoire;
   next.contracts[best.key]={...c.contract,contractKey:JSON.stringify(['kbo-ai-renewal',world.worldKey,world.seasonKey,best.key]),seasonKey:world.seasonKey,years:1,annualSalaryWon:best.salary};club.roster.push(best.key);club.reservedSalaryWon+=best.salary;unresolved.delete(best.key);renewed.push({playerKey:best.key,clubId:club.id,annualSalaryWon:best.salary});
  }
  for(const key of unresolved){const c=candidates.get(key)!;if(Object.hasOwn(freeAgents.players,key))throw new RangeError('KBO_AI_DOUBLE_FREE_AGENT');freeAgents.players[key]={player:c.player,previousClubId:club.id,previousContract:c.contract,origin:'EXPIRED',enteredSeasonKey:world.seasonKey,...(input.health.injuries[key]?{injury:structuredClone(input.health.injuries[key]!)}:{}),...(c.repertoire?{repertoire:c.repertoire}:{})};expired.push({playerKey:key,clubId:club.id});}
  club.roster.sort();
 }
 if(Object.keys(next.players).length+expired.length!==Object.keys(world.players).length)throw new RangeError('KBO_AI_PLAYER_CONSERVATION');assertKboFreeAgentPool(freeAgents,Object.keys(next.players));
 health.injuries=Object.fromEntries(Object.entries(health.injuries).filter(([k])=>Object.hasOwn(next.players,k)));
 return {world:next,pool:freeAgents,reports,health,receipt:{receiptKey:JSON.stringify(['kbo-ai-renewals',world.worldKey,world.seasonKey]),seasonKey:world.seasonKey,renewed,expired} satisfies KboAiRenewalReceipt};
}

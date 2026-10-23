import type {KboCareer} from './kbo-career-entry.js';
import {KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import {canonicalJson} from './game.js';
import {createKboServicePayroll,reserveKboNpcServiceRosterChange,settleKboPlayerServicePayrollDay,kboContractSeasonCharge,kboContractSuspended,kboActiveContractSuspended} from './kbo-service-payroll.js';
import {kboMilitaryCompletionDays} from './kbo-military-events.js';
import {completeSangmuBlock,compareKboSeasonDays} from './kbo-military-program.js';
import {resumeKboContractPayments,kboContractPaymentBalance} from './kbo-contract-payments.js';
import {createKboRemainderContract,kboClubRemainderFutureDates} from './kbo-remainder-pay.js';
import {kboPlayerContractValue,kboRenewalSalaryWon} from './kbo-contract-value.js';
import {kboAiRoleNeed,kboAiCandidatePriority,refreshKboAiAssessments} from './kbo-ai-offseason.js';
import {assessmentMidpointScore} from './assessment.js';
import {archiveKboSettledContract,kboClubBalance,kboRecruitmentOpen} from './kbo-finance.js';
import {replenishKboFreeAgents} from './kbo-free-agents.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import {recordTotals} from './records.js';
import {signKboRequiredReplacement} from './kbo-roster-repair.js';
import {planEmergencyRoster} from './emergency-roster.js';

/** New actual intakes only: the real untouched principal is suspended before either block can complete. */
export function activateKboNpcMilitaryContracts(source:KboCareer,c:KboCareer):void {
 const added=Object.entries(c.sangmu?.members??{}).filter(([key])=>!source.sangmu?.members[key]);if(!added.length)return;
 c.world.suspendedContracts??={};c.sangmu!.npcReturns??={};
 for(const [key,m] of added){
  const original=source.world.contracts[key];
  if(key===c.protagonistKey || !original || m.program.startedSeason!==c.world.seasonKey || Object.hasOwn(c.world.suspendedContracts,key) || original.contractKey!==m.program.contract.contractKey)throw new RangeError('INVALID_NPC_SERVICE_ACTIVATION');
  const contract=structuredClone(original);contract.servicePay=createKboServicePayroll(contract,m.program,kboMilitaryCompletionDays(m.program)[1]!);
  c.world.suspendedContracts[key]=contract;c.world.clubs.find(t=>t.id===contract.clubId)!.reservedSalaryWon+=kboContractSeasonCharge(contract);
 }
 c.schemaVersion=6;
}

/** A full original club keeps ownership and the completed member off army registration until a real slot opens. */
export function returnKboNpcMilitaryPlayers(c:KboCareer,day:number):void {
 if(!c.sangmu || !c.world.suspendedContracts)return;const date={seasonKey:c.world.seasonKey,worldDay:day};compareKboSeasonDays(date,date);
 const members={...c.sangmu.members};let returned={...(c.sangmu.npcReturns??{})};
 for(const key of Object.keys(c.world.suspendedContracts??{}).sort()){
  const m=members[key],contract=c.world.suspendedContracts![key]!;
  if(!m || !contract.servicePay || contract.servicePay.ledger.programId!==m.program.programId || canonicalJson(contract.servicePay.ledger.contract)!==canonicalJson(m.program.contract))throw new RangeError('INVALID_NPC_SERVICE_OWNER');
  if(m.program.completedBlocks!==2)continue;
  if(!contract.servicePay.ledger.resume || compareKboSeasonDays(date,kboMilitaryCompletionDays(m.program)[1]!)<0)throw new RangeError('INVALID_NPC_SERVICE_RETURN');
  const club=c.world.clubs.find(t=>t.id===m.program.originalClubId)!;if(club.roster.length>=KBO_ROSTER_LIMITS.maximum)continue;
  if(Object.hasOwn(c.world.players,key) || Object.hasOwn(returned,m.program.programId))throw new RangeError('DUPLICATE_NPC_SERVICE_RETURN');
  c.world.players[key]=structuredClone(m.player);if(m.repertoire)c.world.repertoires[key]=structuredClone(m.repertoire);
  c.world.contracts[key]=contract;club.roster=[...club.roster,key].sort();delete c.world.suspendedContracts![key];delete members[key];
  returned={...returned,[m.program.programId]:{program:structuredClone(m.program),returned:{...date}}};
 }
 c.sangmu={...c.sangmu,members,npcReturns:returned};
}

/** Fixed first-season end / second-season June30, after the actual world-day close, never a game-count shortcut. */
export function closeKboNpcMilitaryCalendarDay(c:KboCareer,day:number):void {
 if(!c.world.suspendedContracts)return;
 if(c.days?.days.at(-1)?.day!==day)throw new RangeError('NPC_MILITARY_DAY_NOT_FINAL');
 for(const [key,contract] of Object.entries(c.world.suspendedContracts)){
  const m=c.sangmu?.members[key];if(!m || !contract.servicePay)throw new RangeError('INVALID_NPC_SERVICE_OWNER');
  const open=m.program.blocks.find(b=>b.seasonKey===c.world.seasonKey && b.completedWorldDay===null);if(!open)continue;
  const due=kboMilitaryCompletionDays(m.program).find(d=>d.seasonKey===open.seasonKey)!;
  if(day>due.worldDay)throw new RangeError('NPC_MILITARY_COMPLETION_DAY_MISSED');if(day!==due.worldDay)continue;
  m.program=completeSangmuBlock(m.program,open.seasonKey,day);
  if(m.program.completedBlocks===2)contract.servicePay.ledger=resumeKboContractPayments(contract.servicePay.ledger,m.program);
 }
 returnKboNpcMilitaryPlayers(c,day);
}

function repairExpiredNpcSlots(c:KboCareer,clubId:string,holes:readonly {key:string;kind:'HITTER'|'PITCHER';position:string}[]):void {
 const club=c.world.clubs.find(t=>t.id===clubId)!,available=(key:string)=>!c.health.injuries[key],future=()=>club.roster.filter(k=>!club.firstTeam.includes(k) && !c.sangmu?.loaned?.includes(k) && !kboContractSuspended(c.world.contracts[k]!));
 const legal=(keys:string[])=>{const p=planEmergencyRoster(keys.map(k=>({player:c.world.players[k]!,available:available(k),temporary:false})));return p.requiredHitters===0 && p.requiredPitchers===0;};
 for(const hole of holes){
  const candidates=future().filter(k=>k!==c.protagonistKey && c.world.players[k]!.kind===hole.kind && available(k) && legal(future().filter(n=>n!==k))).sort((a,b)=>Number(c.world.players[b]!.position===hole.position)-Number(c.world.players[a]!.position===hole.position) || roleScore(c.world.players[b]!.kind,c.world.players[b]!.abilities,c.world.players[b]!.position)-roleScore(c.world.players[a]!.kind,c.world.players[a]!.abilities,c.world.players[a]!.position) || (a<b?-1:1));
  const key=candidates.find(k=>reserveKboNpcServiceRosterChange(c,club.id,[...club.firstTeam,k]))??signKboRequiredReplacement(c.world,c.freeAgents!,club.id,hole.position,c.difficulty).playerKey;club.firstTeam=[...club.firstTeam,key];
 }
 for(let i=0;i<60;i++){
  const plan=planEmergencyRoster(future().map(k=>({player:c.world.players[k]!,available:available(k),temporary:false})));if(plan.requiredHitters===0 && plan.requiredPitchers===0)return;
  signKboRequiredReplacement(c.world,c.freeAgents!,club.id,plan.requiredRightThrowingHitters?'C':plan.requiredHitters?'CF':'SP',c.difficulty);
 }
 throw new RangeError('NPC_EXPIRY_REPAIR_LIMIT');
}

/** Existing AI value/demand/budget decide residual-season renewals; the user player's decision remains separate. */
function settleNpcExpiry(c:KboCareer,day:number):void {
 const future=(clubId:string)=>kboClubRemainderFutureDates(c,clubId,day);
 const expired=Object.entries(c.world.contracts).filter(([k,v])=>k!==c.protagonistKey && v.servicePay && kboContractPaymentBalance(v.servicePay.ledger).status==='SETTLED' && future(v.clubId)>0);
 if(!expired.length)return;
 for(const [,v] of expired)if(v.servicePay!.ledger.receipts.at(-1)?.worldDay!==day)throw new RangeError('NPC_CONTRACT_DECISION_MISSED');
 c.freeAgents??=replenishKboFreeAgents({schemaVersion:1,worldKey:c.world.worldKey,seasonKey:c.world.seasonKey,players:{},supplies:[],retired:[]},{seed:c.world.seed,difficulty:c.difficulty,registeredKeys:Object.keys(c.world.players)});
 c.aiAssessments=refreshKboAiAssessments({world:c.world,players:expired.map(([k])=>c.world.players[k]!),records:c.records,health:c.health,sourceSeasonKey:c.world.seasonKey,...(c.aiAssessments?{reports:c.aiAssessments}:{})});
 const totals=recordTotals(c.records,{seasonKey:c.world.seasonKey,leagueKey:'KBO',phase:'REGULAR'}),end=Math.max(...Object.values(c.competitionSchedule!.leagues).flat().map(g=>g.worldDay));
 for(const club of c.world.clubs){
  const pending=expired.filter(([,v])=>v.clubId===club.id).map(([key,contract])=>({key,contract,player:c.world.players[key]!,book:c.world.repertoires[key],wasFirst:club.firstTeam.includes(key)}));if(!pending.length)continue;
  const removed=new Set(pending.map(x=>x.key));club.roster=club.roster.filter(k=>!removed.has(k));club.firstTeam=club.firstTeam.filter(k=>!removed.has(k));
  for(const x of pending){delete c.world.players[x.key];delete c.world.contracts[x.key];delete c.world.repertoires[x.key];}
  const remaining=[...pending];
  while(remaining.length && club.roster.length<KBO_ROSTER_LIMITS.maximum && kboRecruitmentOpen(c.world,club.id)){
   const ranked=remaining.map(x=>{const need=kboAiRoleNeed(x.player,club.roster.map(k=>c.world.players[k]!)),v=kboPlayerContractValue(x.player,totals.batting[x.key],totals.pitching[x.key]),salary=kboRenewalSalaryWon(x.contract.annualSalaryWon,v.valueWon),deal=createKboRemainderContract(x.contract,{contractKey:JSON.stringify(['kbo-npc-remainder',c.world.worldKey,c.world.seasonKey,day,x.key]),annualSalaryWon:salary,startAfterWorldDay:day,endWorldDay:end,reservedGameDays:future(club.id)}),cost=kboContractSeasonCharge(deal)-kboContractSeasonCharge(x.contract),priority=kboAiCandidatePriority({roleScore:roleScore(x.player.kind,x.player.abilities,x.player.position),...need,outlookMidpoint:assessmentMidpointScore(x.player.kind,c.aiAssessments![x.key]!.ranges),annualSalaryWon:salary,budgetWon:club.budgetWon});return {x,deal,cost,priority,need:need.needScore};}).sort((a,b)=>Number(b.need===100)-Number(a.need===100) || b.priority-a.priority || (a.x.key<b.x.key?-1:1));
   const best=ranked.find(x=>x.cost<=kboClubBalance(c.world,club.id).availableWon);if(!best)break;
   const {x,deal,cost}=best;c.world.players[x.key]=x.player;c.world.contracts[x.key]=deal;if(x.book)c.world.repertoires[x.key]=x.book;club.roster.push(x.key);if(x.wasFirst)club.firstTeam.push(x.key);club.reservedSalaryWon+=cost;remaining.splice(remaining.findIndex(v=>v.key===x.key),1);
  }
  for(const x of remaining){
   if(Object.hasOwn(c.freeAgents.players,x.key))throw new RangeError('DUPLICATE_NPC_EXPIRED_PLAYER');
   archiveKboSettledContract(c.world,x.contract);const injury=c.health.injuries[x.key];
   c.freeAgents.players[x.key]={player:x.player,previousClubId:club.id,previousContract:x.contract,origin:'EXPIRED',enteredSeasonKey:c.world.seasonKey,...(x.book?{repertoire:x.book}:{}),...(injury?{injury:structuredClone(injury)}:{})};delete c.health.injuries[x.key];
   if(club.id===c.protagonistClubId && !c.sangmu?.loaned?.includes(c.protagonistKey) && !kboActiveContractSuspended(c.world.contracts[c.protagonistKey]!))c.relationships.relations=c.relationships.relations.map(r=>['FORMED','REUNITED_TEAM'].includes(r.stage) && r.otherPlayerKey===x.key?{...r,stage:'SEPARATED',milestones:[...r.milestones,{stage:'SEPARATED',worldDay:day,evidenceKey:JSON.stringify(['relation-separation',r.relationKey,'kbo-npc-expiry',x.contract.contractKey,c.world.seasonKey,day])}]}:r);
  }
  if(remaining.length)repairExpiredNpcSlots(c,club.id,remaining.filter(x=>x.wasFirst).map(x=>({key:x.key,kind:x.player.kind,position:x.player.position})));
  club.roster.sort();
 }
 assertKboRecruitmentWorld(c.world);
}

export function settleKboNpcMilitaryPayrollDay(c:KboCareer,day:number):void {
 if(!c.world.suspendedContracts)return;
 const keys=new Set([...Object.keys(c.world.suspendedContracts),...Object.values(c.sangmu?.npcReturns??{}).map(r=>r.program.playerKey)]);
 for(const key of [...keys].sort())if(c.world.suspendedContracts[key] || c.world.contracts[key]?.servicePay || c.world.contracts[key]?.remainderPay)settleKboPlayerServicePayrollDay(c,key,day);
 settleNpcExpiry(c,day);
}

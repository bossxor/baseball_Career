import {KBO_MONEY,KBO_ROSTER_LIMITS,roleScore} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import {assertKboFreeAgentPool,replenishKboFreeAgents} from './kbo-free-agents.js';
import type {KboAiAssessments} from './kbo-ai-offseason.js';
import {refreshKboAiAssessments,kboAiRoleNeed,kboAiCandidatePriority} from './kbo-ai-offseason.js';
import {assessmentMidpointScore} from './assessment.js';
import {kboFreeAgentTerms} from './kbo-contract-value.js';
import {kboClubBalance,kboFutureCommitmentWon,kboRecruitmentOpen} from './kbo-finance.js';
import {recordTotals} from './records.js';
import type {RecordLedger} from './records.js';
import type {HealthLedger} from './health.js';
import {createWorldStream,nextFloat} from './rng.js';
import {recruitmentOfferScore,resolveRecruitmentOffers} from './recruitment.js';

export interface KboAiFaOffer {offerKey:string;playerKey:string;clubId:string;annualSalaryWon:number;years:number;score:number;role:number;preference:number;desiredAnnualSalaryWon:number;desiredYears:number}
export interface KboAiFaRound {
 receiptKey:string;round:1|2|3;offers:readonly KboAiFaOffer[];
 outcomes:readonly {playerKey:string;offerKey:string|null;previousClubId:string|null;outside:number;chances:readonly {offerKey:string;probability:number}[]}[];
 releasedOfferKeys:readonly string[];
}
/** Pure internal AI-only three-round market for a staged target year, not the interactive club command/API.
 * Every team's offers are fixed/reserved before any draw. A later player's odds never react to earlier winners. */
export function runKboAiFreeAgentMarket(input:{world:ActiveKboRosterWorld;pool:KboFreeAgentPool;reports?:KboAiAssessments;sourceSeasonKey:string;records:RecordLedger;health:HealthLedger;difficulty:Difficulty}){
 if(Number(input.world.seasonKey)!==Number(input.sourceSeasonKey)+1 || input.pool.worldKey!==input.world.worldKey || input.pool.seasonKey!==input.world.seasonKey || input.pool.settlement)throw new RangeError('INVALID_KBO_FA_MARKET_SOURCE');
 const world=structuredClone(input.world);let pool=structuredClone(input.pool);const health=structuredClone(input.health);let reports=structuredClone(input.reports??{});const rounds:KboAiFaRound[]=[],totals=recordTotals(input.records,{leagueKey:'KBO',phase:'REGULAR',seasonKey:input.sourceSeasonKey});
 for(const round of [1,2,3] as const){
  pool=replenishKboFreeAgents(pool,{seed:world.seed,difficulty:input.difficulty,registeredKeys:Object.keys(world.players)});
  reports=refreshKboAiAssessments({world,players:Object.values(pool.players).map(e=>e.player),reports,records:input.records,health:input.health,sourceSeasonKey:input.sourceSeasonKey});
  const terms=new Map(Object.entries(pool.players).map(([k,e])=>[k,kboFreeAgentTerms(e.player,totals.batting[k],totals.pitching[k])])),offers:KboAiFaOffer[]=[];
  for(const club of [...world.clubs].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)){
   if(!kboRecruitmentOpen(world,club.id))continue;
   const pending:KboAiFaOffer[]=[],members=club.roster.map(k=>world.players[k]!);
   const candidates=Object.keys(pool.players).sort().map(playerKey=>{
    const p=pool.players[playerKey]!.player,t=terms.get(playerKey)!,need=kboAiRoleNeed(p,members),preference=nextFloat(createWorldStream(world.seed,JSON.stringify(['kbo-fa-preference',world.worldKey,playerKey,club.id]),'potential')).value;
    const ratio=.9+.3*nextFloat(createWorldStream(world.seed,JSON.stringify(['kbo-ai-fa-price',world.worldKey,world.seasonKey,round,club.id,playerKey]),'roster')).value;
    const salary=Math.max(KBO_MONEY.minimumSalaryWon,Math.min(KBO_MONEY.maximumSalaryWon,Math.round(t.annualSalaryWon*ratio/10_000)*10_000)),role=need.needScore===100 || roleScore(p.kind,p.abilities,p.position)>=need.incumbentRoleScore?1:need.needScore===50?.8:.5;
    const priority=kboAiCandidatePriority({roleScore:roleScore(p.kind,p.abilities,p.position),...need,outlookMidpoint:assessmentMidpointScore(p.kind,reports[playerKey]!.ranges),annualSalaryWon:salary,budgetWon:club.budgetWon});
    return {playerKey,salary,priority,need:need.needScore,role,preference};
   }).sort((a,b)=>Number(b.need===100)-Number(a.need===100) || b.priority-a.priority || (a.playerKey<b.playerKey?-1:a.playerKey>b.playerKey?1:0));
   for(const c of candidates){
    if(pending.length>=3 || club.roster.length+pending.length>=KBO_ROSTER_LIMITS.maximum)break;
    const t=terms.get(c.playerKey)!,balance=kboClubBalance(world,club.id),annualPending=pending.reduce((n,o)=>n+o.annualSalaryWon,0);
    // Protected minimum cannot fund a normal competitive offer (44); safety contracts use a separate repair reducer.
    if(c.salary+annualPending>balance.availableWon)continue;
    let years=Math.min(t.years,10000-Number(world.seasonKey));
    while(years>1 && Array.from({length:years-1},(_,i)=>i+1).some(y=>kboFutureCommitmentWon(world,club.id,y)+pending.reduce((n,o)=>n+(o.years>y?o.annualSalaryWon:0),0)+c.salary>club.budgetWon*.9))years--;
    if(years<1)continue;
    pending.push({offerKey:JSON.stringify(['kbo-ai-fa-offer',world.worldKey,world.seasonKey,round,club.id,c.playerKey]),playerKey:c.playerKey,clubId:club.id,annualSalaryWon:c.salary,years,role:c.role,preference:c.preference,desiredAnnualSalaryWon:t.annualSalaryWon,desiredYears:t.years,score:recruitmentOfferScore({totalWon:c.salary*years,desiredTotalWon:t.annualSalaryWon*t.years,role:c.role,preference:c.preference})});
   }
   offers.push(...pending);
  }
  const outcomes:KboAiFaRound['outcomes'][number][]=[],won=new Set<string>();
  for(const playerKey of [...new Set(offers.map(o=>o.playerKey))].sort()){
   const candidates=offers.filter(o=>o.playerKey===playerKey),rng=createWorldStream(world.seed,JSON.stringify(['kbo-fa-decision',world.worldKey,world.seasonKey,round,playerKey]),'roster'),result=resolveRecruitmentOffers(candidates,round,rng),entry=pool.players[playerKey];
   if(!entry || Object.hasOwn(world.players,playerKey) || Object.hasOwn(world.contracts,playerKey))throw new RangeError('KBO_FA_DOUBLE_SIGNING');
   outcomes.push({playerKey,offerKey:result.offerKey,previousClubId:entry.previousClubId,outside:result.distribution.outside,chances:result.distribution.offers});
   if(result.offerKey===null)continue;const offer=candidates.find(o=>o.offerKey===result.offerKey)!,club=world.clubs.find(c=>c.id===offer.clubId)!;
   world.players[playerKey]=structuredClone(entry.player);if(entry.injury)health.injuries[playerKey]=structuredClone(entry.injury);else delete health.injuries[playerKey];if(entry.repertoire)world.repertoires[playerKey]=structuredClone(entry.repertoire);
   world.contracts[playerKey]={contractKey:offer.offerKey,playerKey,clubId:club.id,seasonKey:world.seasonKey,years:offer.years,annualSalaryWon:offer.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};
   club.roster=[...club.roster,playerKey].sort();club.reservedSalaryWon+=offer.annualSalaryWon;delete pool.players[playerKey];won.add(offer.offerKey);
  }
  rounds.push({receiptKey:JSON.stringify(['kbo-fa-round',world.worldKey,world.seasonKey,round]),round,offers,outcomes,releasedOfferKeys:offers.filter(o=>!won.has(o.offerKey)).map(o=>o.offerKey)});
  assertKboFreeAgentPool(pool,Object.keys(world.players));
 }
 pool=replenishKboFreeAgents(pool,{seed:world.seed,difficulty:input.difficulty,registeredKeys:Object.keys(world.players)});
 health.injuries=Object.fromEntries(Object.entries(health.injuries).filter(([k])=>Object.hasOwn(world.players,k)));
 return {world,pool,reports,health,rounds};
}

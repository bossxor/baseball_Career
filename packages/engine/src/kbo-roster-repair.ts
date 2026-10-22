import {kboContractSuspended} from './kbo-service-payroll.js';
import {KBO_MONEY,KBO_ROSTER_LIMITS,overall,roleScore} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {HealthLedger} from './health.js';
import type {KboFreeAgentPool} from './kbo-free-agents.js';
import {assertKboFreeAgentPool,replenishKboFreeAgents} from './kbo-free-agents.js';
import {FIELD_POSITIONS,automaticFieldLineup,initialPositionFits} from './lineup.js';
import {emptyBatting} from './stats.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';
import {generateSchoolNpcRoster} from './school-roster.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {createWorldStream,nextInteger} from './rng.js';
import {kboClubBalance,protectKboEmergencyBudget,reserveKboPreseasonGuarantee} from './kbo-finance.js';

const stable=(a:DevelopmentPlayer,b:DevelopmentPlayer)=>a.simulationKey<b.simulationKey?-1:a.simulationKey>b.simulationKey?1:0;
const weak=(a:DevelopmentPlayer,b:DevelopmentPlayer)=>roleScore(a.kind,a.abilities,a.position)-roleScore(b.kind,b.abilities,b.position) || stable(a,b);
/** Minimum healthy depth for disjoint first28 (15H/13P) and an independent legal Futures nine plus pitcher.
 * Counts follow the existing primary-position-only opening selector. This is not a target of50 contracts. */
function missing(players:readonly DevelopmentPlayer[]):string|null {
 const hitters=players.filter(p=>p.kind==='HITTER'),pitchers=players.filter(p=>p.kind==='PITCHER');
 for(const pos of FIELD_POSITIONS)if(hitters.filter(p=>p.position===pos).length<(pos==='C'?3:2))return pos;
 if(hitters.length<24)return 'DH';
 for(const [pos,n] of [['SP',5],['RP',6],['CP',2]] as const)if(pitchers.filter(p=>p.position===pos).length<n)return pos;
 return pitchers.length<14?'SP':null;
}
export function selectKboDualLeagueRoster(players:readonly DevelopmentPlayer[]):string[] {
 if(missing(players))throw new RangeError('KBO_DUAL_LEAGUE_SUPPLY_REQUIRED');
 // Keep the weakest legal Futures nine available before filling first-team bench slots.
 const reserved=new Set<string>();for(const pos of FIELD_POSITIONS)reserved.add(players.filter(p=>p.kind==='HITTER' && p.position===pos).sort(weak)[0]!.simulationKey);
 const remaining=players.filter(p=>p.kind==='HITTER' && !reserved.has(p.simulationKey));
 const extra=[...remaining].sort(weak).find(p=>!FIELD_POSITIONS.includes(p.position as typeof FIELD_POSITIONS[number]) || remaining.filter(n=>n.position===p.position).length>(p.position==='C'?2:1));
 if(!extra)throw new RangeError('KBO_DUAL_LEAGUE_SUPPLY_REQUIRED');reserved.add(extra.simulationKey);
 const first=selectKboFirstTeamRoster(players.filter(p=>!reserved.has(p.simulationKey)));
 if(first.length!==28)throw new RangeError('KBO_DUAL_LEAGUE_SUPPLY_REQUIRED');
 for(const list of [first,players.filter(p=>!first.includes(p.simulationKey)).map(p=>p.simulationKey)]){
  const members=list.map(k=>players.find(p=>p.simulationKey===k)!);
  automaticFieldLineup(members.filter(p=>p.kind==='HITTER').map(player=>({player,available:true,fits:initialPositionFits(player.position),recent:emptyBatting()})),100);
  if(!members.some(p=>p.kind==='PITCHER'))throw new RangeError('KBO_DUAL_LEAGUE_SUPPLY_REQUIRED');
 }
 return first;
}
export interface KboRosterRepairReceipt {
 receiptKey:string;seasonKey:string;
 signings:readonly {playerKey:string;clubId:string;position:string;generated:boolean;reason:'REQUIRED_DUAL_LEAGUE_SLOT';supportWon:number}[];
 releases:readonly {playerKey:string;clubId:string;reason:'REQUIRED_ROSTER_SLOT'}[];
}
/** AI-only preseason safety repair (44 and14 U). Pure result; user club commands require their own confirmation.
 * Existing low-ability independent replacements are preferred. Never force a valuable former pro to accept minimum. */
export function repairKboDualLeagueRosters(input:{world:ActiveKboRosterWorld;pool:KboFreeAgentPool;health:HealthLedger;protagonistKey:string;difficulty:Difficulty}){
 const world=structuredClone(input.world),health=structuredClone(input.health);let pool=structuredClone(input.pool);
 if(pool.worldKey!==world.worldKey || pool.seasonKey!==world.seasonKey || pool.settlement || !Object.hasOwn(world.players,input.protagonistKey))throw new RangeError('INVALID_KBO_ROSTER_REPAIR');
 assertKboFreeAgentPool(pool,Object.keys(world.players));
 const signings:KboRosterRepairReceipt['signings'][number][]=[],releases:KboRosterRepairReceipt['releases'][number][]=[];
 for(const club of [...world.clubs].sort((a,b)=>a.id<b.id?-1:1)){
  const healthy=()=>club.roster.filter(k=>!Object.hasOwn(health.injuries,k) && !kboContractSuspended(world.contracts[k]!)).map(k=>world.players[k]!);
  for(let step=0;missing(healthy())!==null;step++){
   if(step>=KBO_ROSTER_LIMITS.maximum)throw new RangeError('KBO_ROSTER_REPAIR_LIMIT');const position=missing(healthy())!;
   if(club.roster.length===KBO_ROSTER_LIMITS.maximum){
    const members=healthy(),gapBefore=deficit(members);
    const leaving=club.roster.filter(k=>k!==input.protagonistKey && deficit(members.filter(p=>p.simulationKey!==k))===gapBefore).sort((a,b)=>{
     const ca=world.contracts[a]!,cb=world.contracts[b]!;return ca.annualSalaryWon*ca.years-cb.annualSalaryWon*cb.years || weak(world.players[a]!,world.players[b]!);
    })[0];if(!leaving)throw new RangeError('KBO_ROSTER_REPAIR_NO_RELEASABLE_SLOT');
    const contract=world.contracts[leaving]!,player=world.players[leaving]!,book=world.repertoires[leaving],injury=health.injuries[leaving];reserveKboPreseasonGuarantee(world,contract);
    pool.players[leaving]={player:structuredClone(player),...(book?{repertoire:structuredClone(book)}:{}),...(injury?{injury:structuredClone(injury)}:{}),origin:'RELEASED',enteredSeasonKey:world.seasonKey,previousClubId:club.id,previousContract:structuredClone(contract)};
    club.roster=club.roster.filter(k=>k!==leaving);club.firstTeam=club.firstTeam.filter(k=>k!==leaving);club.reservedSalaryWon-=contract.annualSalaryWon;delete world.players[leaving];delete world.contracts[leaving];delete world.repertoires[leaving];delete health.injuries[leaving];releases.push({playerKey:leaving,clubId:club.id,reason:'REQUIRED_ROSTER_SLOT'});
   }
   signings.push(signKboRequiredReplacement(world,pool,club.id,position,input.difficulty));
  }
  club.firstTeam=selectKboDualLeagueRoster(healthy());if(kboClubBalance(world,club.id).availableWon<0)throw new RangeError('KBO_REPAIR_BUDGET_INVALID');
 }
 pool=replenishKboFreeAgents(pool,{seed:world.seed,difficulty:input.difficulty,registeredKeys:Object.keys(world.players)});
 const receipt:KboRosterRepairReceipt={receiptKey:JSON.stringify(['kbo-roster-repair',world.worldKey,world.seasonKey]),seasonKey:world.seasonKey,signings,releases};return {world,pool,health,receipt};
}
function deficit(players:readonly DevelopmentPlayer[]):number {
 const hitters=players.filter(p=>p.kind==='HITTER'),pitchers=players.filter(p=>p.kind==='PITCHER');
 return Math.max(0,24-hitters.length)+FIELD_POSITIONS.reduce((n,pos)=>n+Math.max(0,(pos==='C'?3:2)-hitters.filter(p=>p.position===pos).length),0)+Math.max(0,14-pitchers.length)+([['SP',5],['RP',6],['CP',2]] as const).reduce((n,[pos,count])=>n+Math.max(0,count-pitchers.filter(p=>p.position===pos).length),0);
}

/** Internal transaction helper: caller owns world/pool and proves a missing legal slot before signing. */
export function signKboRequiredReplacement(world:ActiveKboRosterWorld,pool:KboFreeAgentPool,clubId:string,position:string,difficulty:Difficulty):KboRosterRepairReceipt['signings'][number] {
 const club=world.clubs.find(c=>c.id===clubId);
 if(!club || club.roster.length>=KBO_ROSTER_LIMITS.maximum || pool.worldKey!==world.worldKey || pool.seasonKey!==world.seasonKey || pool.settlement)throw new RangeError('INVALID_KBO_ROSTER_REPAIR');
 assertKboFreeAgentPool(pool,Object.keys(world.players));
 const candidates=Object.entries(pool.players).filter(([,e])=>e.origin==='INDEPENDENT' && !e.injury && e.player.position===position && overall(e.player.kind,e.player.abilities).sumUnits<=45*overall(e.player.kind,e.player.abilities).denominator).map(([k,e])=>({key:k,player:e.player})).sort((a,b)=>weak(a.player,b.player));
 let playerKey=candidates[0]?.key,generated=false;
 if(!playerKey){
  const index=pool.supplies.filter(s=>s.seasonKey===world.seasonKey).reduce((n,s)=>n+s.playerKeys.length,0),batchKey=JSON.stringify(['kbo-replacement',world.worldKey,world.seasonKey,index]),key=JSON.stringify(['kbo-replacement-player',world.worldKey,world.seasonKey,index]),kind=['SP','RP','CP'].includes(position)?'PITCHER' as const:'HITTER' as const;
  if(Object.hasOwn(pool.players,key) || Object.hasOwn(world.players,key))throw new RangeError('KBO_REPLACEMENT_ID_CONFLICT');
  const result=generateSchoolNpcRoster({templates:[{simulationKey:key,kind,position,schoolId:'INDEPENDENT'}],seed:world.seed,worldKey:batchKey,seasonKey:world.seasonKey,difficulty,balanceVersion:2}),p=result.players[key]!,target=35+nextInteger(createWorldStream(world.seed,batchKey,'protagonist'),11).value,age=22+nextInteger(createWorldStream(world.seed,batchKey,'roster'),9).value,abilities=initialProfileAbilities(kind,p.archetype,target);
  pool.players[key]={player:{...p,age,abilities,careerPeaks:{...abilities},potential:Object.fromEntries(Object.keys(abilities).map(k=>[k,Math.max(abilities[k]!,p.potential[k]!)]))},...(result.repertoires[key]?{repertoire:result.repertoires[key]}:{}),origin:'INDEPENDENT',enteredSeasonKey:world.seasonKey,previousClubId:null,previousContract:null};
  pool.supplies=[...pool.supplies,{seasonKey:world.seasonKey,batchKey,playerKeys:[key]}];playerKey=key;generated=true;
 }
 const entry=pool.players[playerKey]!,supportWon=protectKboEmergencyBudget(world,club.id,world.seasonKey,1);
 world.players[playerKey]=structuredClone(entry.player);if(entry.repertoire)world.repertoires[playerKey]=structuredClone(entry.repertoire);
 world.contracts[playerKey]={contractKey:JSON.stringify(['kbo-safety-contract',world.seasonKey,club.id,playerKey]),playerKey,clubId:club.id,seasonKey:world.seasonKey,years:1,annualSalaryWon:KBO_MONEY.minimumSalaryWon,signingBonusWon:0,status:'ACTIVE'};club.roster=[...club.roster,playerKey].sort();club.reservedSalaryWon+=KBO_MONEY.minimumSalaryWon;delete pool.players[playerKey];
 return {playerKey,clubId:club.id,position,generated,reason:'REQUIRED_DUAL_LEAGUE_SLOT',supportWon};
}

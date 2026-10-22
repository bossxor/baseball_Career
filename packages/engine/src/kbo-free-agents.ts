import type {Injury} from './health.js';
import {overall,KBO_CLUBS} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import type {Repertoire} from './repertoire.js';
import {validatePitchWeights} from './repertoire.js';
import {generateSchoolNpcRoster,HITTER_POSITIONS,PITCHER_POSITIONS} from './school-roster.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {createWorldStream,nextInteger} from './rng.js';
import {createSeasonCalendar,assertSeasonCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {naturalGrowthBudgetUnits,applyGrowthBudget,applyAging} from './development.js';
import {emptyPitchXpLedger} from './pitch-xp.js';

export const KBO_FA_MINIMUM=80;
export interface KboFreeAgent {
 player:DevelopmentPlayer;repertoire?:Repertoire;injury?:Injury;origin:'INDEPENDENT'|'EXPIRED'|'RELEASED';
 enteredSeasonKey:string;previousClubId:string|null;previousContract:KboInitialContract|null;
}
export interface KboFreeAgentPool {
 schemaVersion:1;worldKey:string;seasonKey:string;players:Record<string,KboFreeAgent>;
 supplies:readonly {seasonKey:string;batchKey:string;playerKeys:readonly string[]}[];
 retired:readonly {seasonKey:string;player:DevelopmentPlayer}[];
 settlement?:{seasonKey:string;players:Record<string,{budgetUnits:number;gainedUnits:number;agingLossUnits:number}>};
}
function year(key:string){const y=Number(key);createSeasonCalendar(y);if(String(y)!==key)throw new RangeError('INVALID_KBO_FA_SEASON');return y;}
/** Private saved state. Contractless players never appear in the contracted world or its rosters. */
export function assertKboFreeAgentPool(pool:KboFreeAgentPool,registeredKeys:readonly string[]=[]):void {
 year(pool.seasonKey);const active=new Set(registeredKeys),known=new Set<string>();
 if(pool.schemaVersion!==1 || !pool.worldKey)throw new RangeError('INVALID_KBO_FA_POOL');
 for(const [key,e] of Object.entries(pool.players)){
  validateDevelopmentPlayer(e.player);
  if(key!==e.player.simulationKey || active.has(key) || !['INDEPENDENT','EXPIRED','RELEASED'].includes(e.origin) || year(e.enteredSeasonKey)>year(pool.seasonKey) || e.player.age<18 || e.player.age>45 || e.previousClubId!==null && !KBO_CLUBS.some(c=>c.id===e.previousClubId))throw new RangeError('INVALID_KBO_FA_ENTRY');
  if(e.previousContract && (e.previousContract.playerKey!==key || e.previousContract.clubId!==e.previousClubId))throw new RangeError('INVALID_KBO_FA_CONTRACT_HISTORY');
  if(e.origin!=='INDEPENDENT' && (!e.previousClubId || !e.previousContract))throw new RangeError('INVALID_KBO_FA_ORIGIN');
  if(e.origin==='INDEPENDENT' && (e.previousClubId!==null || e.previousContract!==null))throw new RangeError('INVALID_KBO_FA_ORIGIN');
  if(e.injury && (!['MILD','MEDIUM','MAJOR'].includes(e.injury.severity) || !e.injury.diagnosedGameKey || year(e.injury.seasonKey)>year(pool.seasonKey) || (e.injury.severity==='MAJOR'?e.injury.remainingTeamGames!==null:!Number.isSafeInteger(e.injury.remainingTeamGames) || e.injury.remainingTeamGames!<1)))throw new RangeError('INVALID_KBO_FA_INJURY');
  if(e.player.kind==='PITCHER'){if(!e.repertoire || e.repertoire.seasonId!==pool.seasonKey)throw new RangeError('INVALID_KBO_FA_REPERTOIRE');validatePitchWeights(e.repertoire.book,e.repertoire.weights);}else if(e.repertoire)throw new RangeError('INVALID_KBO_FA_REPERTOIRE');
 }
 for(const s of pool.supplies){if(year(s.seasonKey)>year(pool.seasonKey) || !s.batchKey)throw new RangeError('INVALID_KBO_FA_SUPPLY');for(const key of s.playerKeys){if(known.has(key))throw new RangeError('DUPLICATE_KBO_FA_SUPPLY');known.add(key);}}
 const retired=new Set<string>();for(const r of pool.retired){validateDevelopmentPlayer(r.player);if(year(r.seasonKey)>year(pool.seasonKey) || r.player.age!==45 || Object.hasOwn(pool.players,r.player.simulationKey) || active.has(r.player.simulationKey) || retired.has(r.player.simulationKey))throw new RangeError('INVALID_KBO_FA_RETIREMENT');retired.add(r.player.simulationKey);}
 if(pool.settlement && (pool.settlement.seasonKey!==pool.seasonKey || Object.keys(pool.settlement.players).length!==Object.keys(pool.players).length || Object.keys(pool.players).some(k=>!Object.hasOwn(pool.settlement!.players,k))))throw new RangeError('INVALID_KBO_FA_SETTLEMENT');
}
/** 15 supply floor. A batch is fixed by world/target season/prior supply count; a retry never rolls new candidates.
 * Only a real deficit creates 22..30-year independent players with overall35..50; it never fills club rosters. */
export function replenishKboFreeAgents(source:KboFreeAgentPool,input:{seed:string;difficulty:Difficulty;registeredKeys?:readonly string[]}):KboFreeAgentPool {
 assertKboFreeAgentPool(source,input.registeredKeys);if(source.settlement)throw new RangeError('KBO_FA_SEASON_ALREADY_CLOSED');
 const count=Math.max(0,KBO_FA_MINIMUM-Object.keys(source.players).length),next=structuredClone(source);if(!count)return next;
 const offset=source.supplies.filter(s=>s.seasonKey===source.seasonKey).reduce((n,s)=>n+s.playerKeys.length,0),batchKey=JSON.stringify(['kbo-fa-supply',source.worldKey,source.seasonKey,offset]);
 const pattern=[...HITTER_POSITIONS.map(p=>['HITTER',p] as const),...PITCHER_POSITIONS.map(p=>['PITCHER',p] as const)];
 const templates=Array.from({length:count},(_,i)=>{const [kind,position]=pattern[(offset+i)%pattern.length]!;return {simulationKey:JSON.stringify(['kbo-fa',source.worldKey,source.seasonKey,offset+i]),kind,position,schoolId:'INDEPENDENT'};});
 const occupied=new Set([...(input.registeredKeys??[]),...Object.keys(source.players),...source.retired.map(r=>r.player.simulationKey)]);
 if(templates.some(t=>occupied.has(t.simulationKey)))throw new RangeError('KBO_FA_SUPPLY_CONFLICT');
 const generated=generateSchoolNpcRoster({templates,seed:input.seed,worldKey:batchKey,seasonKey:source.seasonKey,difficulty:input.difficulty,balanceVersion:2});let rng=createWorldStream(input.seed,batchKey,'protagonist');
 for(const key of Object.keys(generated.players).sort()){
  const p=generated.players[key]!,draw=nextInteger(rng,16);rng=draw.state;const a=nextInteger(rng,9);rng=a.state;
  const abilities=initialProfileAbilities(p.kind,p.archetype,35+draw.value),player={...p,age:22+a.value,abilities,careerPeaks:{...abilities},potential:Object.fromEntries(Object.keys(abilities).map(k=>[k,Math.max(p.potential[k]!,abilities[k]!)]))};
  next.players[key]={player,origin:'INDEPENDENT',enteredSeasonKey:source.seasonKey,previousClubId:null,previousContract:null,...(generated.repertoires[key]?{repertoire:generated.repertoires[key]}:{})};
 }
 next.supplies=[...next.supplies,{seasonKey:source.seasonKey,batchKey,playerKeys:templates.map(t=>t.simulationKey)}];assertKboFreeAgentPool(next,input.registeredKeys);return next;
}
/** Unsigned NPCs get the existing zero-appearance PRO budget (D), no invented official appearances/XP.
 * Close once with the source season; Y02 later changes age only. */
export function settleKboFreeAgentSeason(source:KboFreeAgentPool,calendar:SeasonCalendar,difficulty:Difficulty):KboFreeAgentPool {
 assertSeasonCalendar(calendar);assertKboFreeAgentPool(source);if(source.seasonKey!==String(calendar.year))throw new RangeError('KBO_FA_CALENDAR_MISMATCH');if(source.settlement)return structuredClone(source);
 const next=structuredClone(source),results:NonNullable<KboFreeAgentPool['settlement']>['players']={},W=calendar.growthDays.length;
 for(const [key,e] of Object.entries(next.players)){
  const p=e.player,budgetUnits=naturalGrowthBudgetUnits(p,W,[{startDay:0,endDay:W,levelSeasonDays:W,level:'PRO',appearances:0,pitcherRole:p.position==='RP'?'RP':p.position==='CP'?'CP':'SP',rehabRatio:e.injury?1:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER',difficulty,beneficiary:false}}]),grown=applyGrowthBudget(p,budgetUnits),aged=applyAging(grown.player,1);
  e.player=aged.player;if(e.injury?.severity==='MAJOR' && e.injury.seasonKey===source.seasonKey)delete e.injury;results[key]={budgetUnits,gainedUnits:grown.gains.reduce((a,b)=>a+b,0),agingLossUnits:Object.values(grown.player.abilities).reduce((a,b)=>a+b,0)-Object.values(aged.player.abilities).reduce((a,b)=>a+b,0)};
 }
 next.settlement={seasonKey:source.seasonKey,players:results};return next;
}
/** Y02/Y04: carry existing identities/books and retire after the last season at45; refill only the actual shortage. */
export function nextKboFreeAgentYear(input:{source?:KboFreeAgentPool;worldKey:string;seed:string;seasonKey:string;difficulty:Difficulty;registeredKeys:readonly string[]}):KboFreeAgentPool {
 const target=year(input.seasonKey),pool:KboFreeAgentPool={schemaVersion:1,worldKey:input.worldKey,seasonKey:input.seasonKey,players:{},supplies:[],retired:[]};
 if(input.source){const source=input.source;assertKboFreeAgentPool(source,input.registeredKeys);if(source.worldKey!==input.worldKey || year(source.seasonKey)+1!==target || !source.settlement)throw new RangeError('KBO_FA_YEAR_NOT_READY');pool.supplies=structuredClone(source.supplies);pool.retired=structuredClone(source.retired);
  for(const [key,e] of Object.entries(source.players))if(e.player.age===45)pool.retired=[...pool.retired,{seasonKey:source.seasonKey,player:structuredClone(e.player)}];else pool.players[key]={...structuredClone(e),player:{...structuredClone(e.player),age:e.player.age+1,fatigue:0},...(e.repertoire?{repertoire:{...structuredClone(e.repertoire),seasonId:input.seasonKey,usedWindows:[],learning:null,ledger:emptyPitchXpLedger()}}:{})};
 }
 return replenishKboFreeAgents(pool,input);
}
/** Query allowlist: no raw potential, generation seed, private books or contract-history internals. */
export function kboFreeAgentListView(pool:KboFreeAgentPool){assertKboFreeAgentPool(pool);return Object.entries(pool.players).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([playerKey,e])=>{const p=e.player,o=overall(p.kind,p.abilities);return {playerKey,name:p.name,age:p.age,kind:p.kind,position:p.position,overall:Math.round(o.sumUnits/o.denominator*10)/10,previousClubId:e.previousClubId,...(e.injury?{injury:{severity:e.injury.severity,remainingTeamGames:e.injury.remainingTeamGames}}:{})};});}

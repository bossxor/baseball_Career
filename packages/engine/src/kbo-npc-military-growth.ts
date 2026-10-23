import type {KboCareer} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboMilitaryProgram} from './kbo-military-program.js';
import {naturalGrowthBudgetUnits,applyGrowthBudget,applyAging} from './development.js';
import {kboMilitaryCompletionDays} from './kbo-military-events.js';
import {assertSangmuUnit} from './kbo-sangmu-unit.js';
import {canonicalJson} from './game.js';

/** Only authentic v6 intakes opt in; legacy paid seasons and auxiliary identities keep their existing treatment. */
export function closeKboNpcMilitaryGrowth(c:KboCareer){
 const season=c.world.seasonKey,calendar=c.world.calendar.growthDays,W=calendar.length,programs=new Map<string,KboMilitaryProgram>();
 if(!c.world.suspendedContracts)return new Map<string,{player:DevelopmentPlayer;result:{budgetUnits:number;gainedUnits:number;agingLossUnits:number}}>();
 assertSangmuUnit(c.sangmu!,c.world);
 for(const key of Object.keys(c.world.suspendedContracts))programs.set(key,c.sangmu!.members[key]!.program);
 for(const r of Object.values(c.sangmu?.npcReturns??{}))if(r.returned.seasonKey===season || r.program.blocks.some(b=>b.seasonKey===season))programs.set(r.program.playerKey,r.program);
 const games=Object.values(c.records.games).filter(g=>g.scope.seasonKey===season && g.scope.phase==='REGULAR' && ['KBO','FUTURES'].includes(g.scope.leagueKey));
 const index=new Map(calendar.map((day,i)=>[day,i])),results=new Map<string,{player:DevelopmentPlayer;result:{budgetUnits:number;gainedUnits:number;agingLossUnits:number}}>();
 for(const [key,program] of programs){
  if(key===c.protagonistKey)throw new RangeError('INVALID_NPC_GROWTH_OWNER');
  const member=c.sangmu!.members[key],agent=c.freeAgents?.players[key],player=c.world.players[key]??member?.player??agent?.player;
  if(!player || Number(!!c.world.players[key])+Number(!!member)+Number(!!agent)!==1)throw new RangeError('INVALID_NPC_GROWTH_OWNER');
  const due=kboMilitaryCompletionDays(program).find(d=>d.seasonKey===season)?.worldDay;
  const release=agent?.previousContract?.servicePay?.ledger.receipts.at(-1)?.worldDay;
  const cuts=[...new Set([0,W,...[due,release].filter((d):d is number=>d!==undefined).map(d=>calendar.filter(day=>day<=d).length)])].sort((a,b)=>a-b);
  const parts=cuts.slice(0,-1).map((start,i)=>({start,end:cuts[i+1]!,appearances:0,registered:0,rehab:0}));
  const registrations=new Set(c.health.games.filter(h=>h.evidence.seasonKey===season && h.evidence.roster.includes(key)).map(h=>canonicalJson([h.evidence.gameKey,h.evidence.day,h.evidence.teamKey])));
  const registered=games.filter(g=>Object.keys(g.teams).some(team=>registrations.has(canonicalJson([g.gameKey,g.worldDay,g.scope.leagueKey+':'+team]))));
  if(new Set(registered.map(g=>g.worldDay)).size!==registered.length)throw new RangeError('DOUBLE_BOOKED_GROWTH_DAY');
  const byDay=new Map(registered.map(g=>[g.worldDay,g])),gameKeys=new Set(registered.map(g=>g.gameKey));
  for(const g of games)if((g.batting[key] || g.pitching[key]) && !gameKeys.has(g.gameKey))throw new RangeError('INVALID_NPC_GROWTH_REGISTRATION');
  let injured=!!(c.health.injuries[key]??agent?.injury);
  // Reverse actual transitions before replaying; year-end healing must not erase a season's rehabilitation.
  for(const d of [...c.days!.days].reverse()){
   const diagnosis=d.result.injured.includes(key),recovery=d.result.recovered.includes(key);
   if(diagnosis && recovery || diagnosis && !injured || recovery && injured)throw new RangeError('CHANGED_NPC_GROWTH_HEALTH');
   if(diagnosis)injured=false;else if(recovery)injured=true;
  }
  for(const d of c.days!.days){
   const g=byDay.get(d.day),i=index.get(d.day),part=i===undefined?undefined:parts.find(p=>i>=p.start && i<p.end);
   if(g){
    if(!part)throw new RangeError('DAY_OUTSIDE_GROWTH_CALENDAR');
    const appearances=player.kind==='HITTER'?g.batting[key]?.PA??0:g.pitching[key]?.outs??0;
    if(injured && appearances>0)throw new RangeError('INVALID_GROWTH_APPEARANCES');
    const serving=due!==undefined && d.day<=due;
    if(serving?!Object.hasOwn(g.teams,'SANGMU') || g.scope.leagueKey!=='FUTURES':Object.hasOwn(g.teams,'SANGMU'))throw new RangeError('INVALID_NPC_GROWTH_REGISTRATION');
    part.appearances+=appearances;part.registered++;if(injured)part.rehab++;
   }
   if(d.result.injured.includes(key))injured=true;if(d.result.recovered.includes(key))injured=false;
  }
  const periods=parts.map(p=>({startDay:p.start,endDay:p.end,levelSeasonDays:W,level:'PRO' as const,appearances:p.appearances,pitcherRole:player.position==='RP'?'RP' as const:player.position==='CP'?'CP' as const:'SP' as const,rehabRatio:p.registered?p.rehab/p.registered:agent?.injury && release!==undefined && calendar[p.start]!>release?1:0,trainingMultiplier:1,ordinaryMilitary:false,policy:{mode:'CAREER' as const,difficulty:c.difficulty,beneficiary:false}}));
  const budgetUnits=naturalGrowthBudgetUnits(player,W,periods),grown=applyGrowthBudget(player,budgetUnits),aged=applyAging(grown.player,1),sum=(p:DevelopmentPlayer)=>Object.values(p.abilities).reduce((a,b)=>a+b,0);
  results.set(key,{player:aged.player,result:{budgetUnits,gainedUnits:grown.gains.reduce((a,b)=>a+b,0),agingLossUnits:sum(grown.player)-sum(aged.player)}});
 }
 return results;
}

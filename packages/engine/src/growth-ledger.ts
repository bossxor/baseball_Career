import {assertFocus,abilityKeys} from '@playball/rules';
import {naturalGrowthBudgetUnits,applyGrowthBudget,applyAging} from './development.js';
import type {GrowthPeriod} from './development.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {canonicalJson} from './game.js';
export interface ClosedGrowthPeriod {periodKey:string;period:GrowthPeriod;focus:readonly string[];archetype:string}
export interface SeasonGrowthLedger {
  seasonKey:string;playerKey:string;worldGrowthDays:number;seasonStart:DevelopmentPlayer;
  entries:(ClosedGrowthPeriod & {budgetUnits:number;gainedUnits:number;discardedUnits:number;gains:readonly number[]})[];
  totalBudgetUnits:number;finalized:boolean;aging:null|{elapsedDays:number;lossUnits:number;discardedUnits:number};
}
export function createSeasonGrowthLedger(player:DevelopmentPlayer,seasonKey:string,worldGrowthDays:number):SeasonGrowthLedger {
  validateDevelopmentPlayer(player);naturalGrowthBudgetUnits(player,worldGrowthDays,[]);
  if(!seasonKey)throw new RangeError('INVALID_GROWTH_SEASON');
  return {seasonKey,playerKey:player.simulationKey,worldGrowthDays,seasonStart:structuredClone(player),entries:[],totalBudgetUnits:0,finalized:false,aging:null};
}
/** Reject a restored ledger whose receipts no longer conserve its cumulative entitlement. */
export function validateSeasonGrowthLedger(ledger:SeasonGrowthLedger):void {
  validateDevelopmentPlayer(ledger.seasonStart);
  if(!ledger.seasonKey || ledger.playerKey!==ledger.seasonStart.simulationKey || ledger.finalized!==(ledger.aging!==null))throw new RangeError('INVALID_GROWTH_LEDGER');
  naturalGrowthBudgetUnits(ledger.seasonStart,ledger.worldGrowthDays,[]);
  let budget=0,lastEnd=0;const periods:GrowthPeriod[]=[],seen=new Set<string>();
  for(const entry of ledger.entries) {
    if(!entry.periodKey || seen.has(entry.periodKey) || entry.period.startDay<lastEnd)throw new RangeError('INVALID_GROWTH_HISTORY');
    assertFocus(ledger.seasonStart.kind,entry.focus);archetypeFor(ledger.seasonStart.kind,entry.archetype);seen.add(entry.periodKey);lastEnd=entry.period.endDay;periods.push(entry.period);
    const cumulative=naturalGrowthBudgetUnits(ledger.seasonStart,ledger.worldGrowthDays,periods);
    for(const value of [entry.budgetUnits,entry.gainedUnits,entry.discardedUnits,...entry.gains])if(!Number.isSafeInteger(value) || value<0)throw new RangeError('INVALID_GROWTH_ENTRY');
    if(entry.gains.length!==6 || entry.budgetUnits!==cumulative-budget || entry.gainedUnits+entry.discardedUnits!==entry.budgetUnits || entry.gains.reduce((a,b)=>a+b,0)!==entry.gainedUnits)throw new RangeError('GROWTH_LEDGER_TOTAL_MISMATCH');
    budget=cumulative;
  }
  if(ledger.totalBudgetUnits!==budget)throw new RangeError('GROWTH_LEDGER_TOTAL_MISMATCH');
  if(ledger.aging)for(const value of [ledger.aging.elapsedDays,ledger.aging.lossUnits,ledger.aging.discardedUnits])if(!Number.isSafeInteger(value) || value<0)throw new RangeError('INVALID_AGING_ENTRY');
  if(ledger.aging && ledger.aging.elapsedDays>ledger.worldGrowthDays)throw new RangeError('INVALID_AGING_ENTRY');
  if(ledger.aging) {
    const base=applyAging(ledger.seasonStart,ledger.aging.elapsedDays/ledger.worldGrowthDays);
    const expected=abilityKeys(ledger.seasonStart.kind).reduce((sum,key)=>sum+ledger.seasonStart.abilities[key]!-base.player.abilities[key]!,0)+base.discarded;
    if(ledger.aging.lossUnits+ledger.aging.discardedUnits!==expected)throw new RangeError('AGING_LEDGER_TOTAL_MISMATCH');
  }
}
/** Server closes actual nonoverlapping registration/focus periods. No fresh annual budget at a route change. */
export function settleClosedGrowthPeriods(source:DevelopmentPlayer,sourceLedger:SeasonGrowthLedger,periods:readonly ClosedGrowthPeriod[]) {
  validateDevelopmentPlayer(source);validateSeasonGrowthLedger(sourceLedger);
  if(source.simulationKey!==sourceLedger.playerKey || source.age!==sourceLedger.seasonStart.age || source.kind!==sourceLedger.seasonStart.kind)throw new RangeError('GROWTH_PLAYER_MISMATCH');
  let player=structuredClone(source);const ledger=structuredClone(sourceLedger);let newBudgetUnits=0,newGainedUnits=0,newDiscardedUnits=0;
  const newGains=abilityKeys(source.kind).map(()=>0);
  for(const entry of periods) {
    if(!entry.periodKey)throw new RangeError('INVALID_GROWTH_EVIDENCE');assertFocus(source.kind,entry.focus);archetypeFor(source.kind,entry.archetype);
    const old=ledger.entries.find(e=>e.periodKey===entry.periodKey);
    if(old) {
      if(canonicalJson({period:old.period,focus:old.focus,archetype:old.archetype})!==canonicalJson({period:entry.period,focus:entry.focus,archetype:entry.archetype}))throw new RangeError('GROWTH_EVIDENCE_REUSED');
      continue;
    }
    if(ledger.finalized)throw new RangeError('GROWTH_SEASON_FINALIZED');
    const last=ledger.entries[ledger.entries.length-1];if(last && entry.period.startDay<last.period.endDay)throw new RangeError('GROWTH_PERIOD_OUT_OF_ORDER');
    const cumulative=naturalGrowthBudgetUnits(ledger.seasonStart,ledger.worldGrowthDays,[...ledger.entries.map(e=>e.period),entry.period]);
    const budgetUnits=cumulative-ledger.totalBudgetUnits;if(budgetUnits<0)throw new RangeError('GROWTH_LEDGER_INCONSISTENT');
    const grown=applyGrowthBudget({...player,focus:entry.focus,archetype:entry.archetype},budgetUnits),gainedUnits=grown.gains.reduce((a,b)=>a+b,0);
    // Historical allocation must not overwrite the user's current training plan.
    player={...grown.player,focus:[...source.focus],archetype:source.archetype};
    ledger.entries.push({...structuredClone(entry),budgetUnits,gainedUnits,discardedUnits:grown.discarded,gains:grown.gains});ledger.totalBudgetUnits=cumulative;
    newBudgetUnits+=budgetUnits;newGainedUnits+=gainedUnits;newDiscardedUnits+=grown.discarded;grown.gains.forEach((gain,i)=>newGains[i]!+=gain);
  }
  return {player,ledger,newBudgetUnits,newGainedUnits,newDiscardedUnits,newGains};
}
/** Final aging is separate from already-paid growth. Elapsed days come from the server's world calendar. */
export function finalizeSeasonGrowth(source:DevelopmentPlayer,sourceLedger:SeasonGrowthLedger,elapsedDays:number) {
  validateDevelopmentPlayer(source);
  if(source.simulationKey!==sourceLedger.playerKey || source.age!==sourceLedger.seasonStart.age || source.kind!==sourceLedger.seasonStart.kind || !Number.isSafeInteger(elapsedDays) || elapsedDays<0 || elapsedDays>sourceLedger.worldGrowthDays)throw new RangeError('INVALID_GROWTH_FINALIZATION');
  if(sourceLedger.finalized) {
    if(sourceLedger.aging?.elapsedDays!==elapsedDays)throw new RangeError('GROWTH_EVIDENCE_REUSED');
    return {player:structuredClone(source),ledger:structuredClone(sourceLedger),lossUnits:0,duplicate:true};
  }
  const aged=applyAging(source,elapsedDays/sourceLedger.worldGrowthDays),lossUnits=abilityKeys(source.kind).reduce((sum,key)=>sum+source.abilities[key]!-aged.player.abilities[key]!,0);
  const ledger={...structuredClone(sourceLedger),finalized:true,aging:{elapsedDays,lossUnits,discardedUnits:aged.discarded}};
  return {player:aged.player,ledger,lossUnits,duplicate:false};
}

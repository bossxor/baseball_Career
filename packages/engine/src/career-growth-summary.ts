import {abilityKeys,assertAbilities} from '@playball/rules';
import type {HighSchoolCareer} from './high-school-career.js';
import type {KboCareer} from './kbo-career-entry.js';
import type {UsCareer} from './us-career-entry.js';
import {validateSeasonGrowthLedger} from './growth-ledger.js';

/** Actual changes in the current season, including training and aging. */
export function careerSeasonGrowthSummary(career:HighSchoolCareer|KboCareer|UsCareer):{seasonKey:string;finalized:boolean;abilities:{ability:string;beforeUnits:number;afterUnits:number;deltaUnits:number}[]}|null {
 const ledger=career.seasonGrowth;if(!ledger)return null;
 validateSeasonGrowthLedger(ledger);
 const key='protagonistKey' in career?career.protagonistKey:career.world.protagonistKey;
 const player=career.world.players[key];
 if(!player||ledger.playerKey!==key||ledger.seasonKey!==career.world.seasonKey||player.kind!==ledger.seasonStart.kind)throw new RangeError('GROWTH_PLAYER_MISMATCH');
 assertAbilities(player.kind,player.abilities);
 return {seasonKey:ledger.seasonKey,finalized:ledger.finalized,abilities:abilityKeys(player.kind).map(ability=>{
  const beforeUnits=ledger.seasonStart.abilities[ability]!,afterUnits=player.abilities[ability]!;
  return {ability,beforeUnits,afterUnits,deltaUnits:afterUnits-beforeUnits};
 })};
}

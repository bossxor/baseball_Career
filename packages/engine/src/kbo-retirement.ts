import {KBO_ROSTER_LIMITS} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {KboInitialContract} from './kbo-world.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';

/** A retired pro NPC kept for record pages (15); official stats stay in the shared record ledger. */
export interface KboRetiredPlayer {playerKey:string;clubId:string;lastSeasonKey:string;reason:'MAX_AGE';player:DevelopmentPlayer;contract:KboInitialContract}

/** 01 §6/14: every player retires after the season played at 45. Mutates the caller's cloned world: retirees leave
 * players/contracts/repertoires/rosters at once, and only a first team that lost someone is reselected by the 41/44
 * selector. No replacement is created here (the 15 rookie supply is Y04); a club that would fall below 35 or cannot
 * field 28 stops the transition instead of shrinking silently. */
export function retireKboOverAgeNpcs(world:ActiveKboRosterWorld,keys:readonly string[],lastSeasonKey:string):KboRetiredPlayer[] {
 const retired:KboRetiredPlayer[]=[],gone=new Set(keys);
 for(const club of world.clubs){
  const leaving=club.roster.filter(k=>gone.has(k));if(!leaving.length)continue;
  for(const k of leaving){retired.push({playerKey:k,clubId:club.id,lastSeasonKey,reason:'MAX_AGE',player:world.players[k]!,contract:world.contracts[k]!});delete world.players[k];delete world.contracts[k];delete world.repertoires[k];}
  club.roster=club.roster.filter(k=>!gone.has(k));
  if(club.roster.length<KBO_ROSTER_LIMITS.minimum)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');
  if(club.firstTeam.some(k=>gone.has(k))){
   const first=selectKboFirstTeamRoster(club.roster.map(k=>world.players[k]!));
   if(first.length!==KBO_ROSTER_LIMITS.firstTeam)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');
   club.firstTeam=first;
  }
 }
 if(retired.length!==gone.size)throw new RangeError('UNKNOWN_RETIRING_PLAYER');
 return retired.sort((a,b)=>a.playerKey<b.playerKey?-1:1);
}

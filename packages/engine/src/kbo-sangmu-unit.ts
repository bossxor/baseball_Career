import {KBO_ROSTER_LIMITS} from '@playball/rules';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {DevelopmentPlayer} from './player.js';
import type {Repertoire} from './repertoire.js';
import type {SangmuSelection} from './kbo-sangmu.js';
import {enlistInSangmu,KBO_CONTRACT_GAME_DAYS} from './kbo-military-program.js';
import type {KboMilitaryProgram} from './kbo-military-program.js';
import {selectKboFirstTeamRoster} from './kbo-world.js';

/** The 11th Futures team's people. Serving players are NOT in `world.players` (every world player must sit on a club
 * roster); their identity, books and suspended contract live here, and the original club keeps the rights. */
export interface KboSangmuMember {player:DevelopmentPlayer;repertoire:Repertoire|null;wasFirstTeam:boolean;program:KboMilitaryProgram}
export interface KboSangmuUnit {schemaVersion:1;teamKey:'SANGMU';members:Readonly<Record<string,KboSangmuMember>>;enlistedSeasons:readonly string[]}
export const emptySangmuUnit=():KboSangmuUnit=>({schemaVersion:1,teamKey:'SANGMU',members:{},enlistedSeasons:[]});

/** Contract days still unplayed when service starts: whole seasons of the contract after the selection season. */
function remainingDays(contractSeason:string,years:number,selectionSeason:string):number {
 return Math.max(0,Number(contractSeason)+years-1-Number(selectionSeason))*KBO_CONTRACT_GAME_DAYS;
}
/** Moves one yearly selection into the unit. Mutates the caller's cloned world: each selected player leaves his club
 * roster, first team, players, contracts and books at once; the suspended contract (not a +1 year) and the original
 * club are kept in the program. A club whose first team lost someone is reselected by the 41/44 selector (except `openingRosterClubId`: my club's opening roster is picked later by the confirmed opening-roster step, which also needs my registration untouched). A season can
 * be enlisted only once. Never creates a player. */
export function enlistSangmuCohort(world:ActiveKboRosterWorld,unit:KboSangmuUnit,selection:SangmuSelection,openingRosterClubId?:string):KboSangmuUnit {
 if(unit.enlistedSeasons.includes(selection.seasonKey))throw new RangeError('SANGMU_COHORT_ALREADY_ENLISTED');
 const members:Record<string,KboSangmuMember>={...structuredClone(unit.members)},touched=new Set<string>();
 for(const a of selection.selected){
  const club=world.clubs.find(c=>c.id===a.clubId),player=world.players[a.playerKey],contract=world.contracts[a.playerKey];
  if(!club || !player || !contract || !club.roster.includes(a.playerKey) || Object.hasOwn(members,a.playerKey))throw new RangeError('INVALID_SANGMU_ENLISTMENT');
  const wasFirstTeam=club.firstTeam.includes(a.playerKey),remaining=remainingDays(contract.seasonKey,contract.years,selection.seasonKey);
  members[a.playerKey]={player:structuredClone(player),repertoire:world.repertoires[a.playerKey]?structuredClone(world.repertoires[a.playerKey]!):null,wasFirstTeam,
   program:enlistInSangmu({worldKey:world.worldKey,playerKey:a.playerKey,clubId:club.id,selectionSeasonKey:selection.seasonKey,contract,remainingPaidGameDays:remaining})};
  club.roster=club.roster.filter(k=>k!==a.playerKey);club.firstTeam=club.firstTeam.filter(k=>k!==a.playerKey);
  if(club.reservedSalaryWon>=contract.annualSalaryWon)club.reservedSalaryWon-=contract.annualSalaryWon;else club.paidSalaryWon-=contract.annualSalaryWon;
  delete world.players[a.playerKey];delete world.contracts[a.playerKey];delete world.repertoires[a.playerKey];touched.add(club.id);
 }
 for(const club of world.clubs){
  if(!touched.has(club.id))continue;
  if(club.roster.length<KBO_ROSTER_LIMITS.minimum)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');
  if(club.id!==openingRosterClubId && club.firstTeam.length!==KBO_ROSTER_LIMITS.firstTeam){
   const first=selectKboFirstTeamRoster(club.roster.map(k=>world.players[k]!));
   if(first.length!==KBO_ROSTER_LIMITS.firstTeam)throw new RangeError('KBO_PLAYER_SUPPLY_REQUIRED');club.firstTeam=first;
  }
 }
 return {schemaVersion:1,teamKey:'SANGMU',members,enlistedSeasons:[...unit.enlistedSeasons,selection.seasonKey]};
}
/** Structural check against a world: nobody is both serving and on a club, programs match their keys. */
export function assertSangmuUnit(unit:KboSangmuUnit,world:Pick<ActiveKboRosterWorld,'players'|'contracts'|'clubs'>):void {
 for(const [key,m] of Object.entries(unit.members)){
  if(m.player.simulationKey!==key || m.program.playerKey!==key || Object.hasOwn(world.players,key) || Object.hasOwn(world.contracts,key) || world.clubs.some(c=>c.roster.includes(key)))throw new RangeError('INVALID_SANGMU_UNIT');
  if(!world.clubs.some(c=>c.id===m.program.originalClubId))throw new RangeError('INVALID_SANGMU_UNIT');
 }
}

/** 21 return: players whose two blocks are complete rejoin the original club's Futures squad, never the first team and
 * with no automatic starter role. The suspended contract resumes for exactly its remaining game days (years = days/144
 * rounded up, same salary). A club with no free slot (60) keeps the player in the unit and reports it for an explicit
 * roster cleanup, never deleting anybody. Players with no contract days left are reported uncontracted (21 MIL10) and
 * stay in the unit until the free-agent flow takes them. Mutates the caller's cloned world. */
export function returnSangmuPlayers(world:ActiveKboRosterWorld,unit:KboSangmuUnit,resumeSeasonKey:string):{unit:KboSangmuUnit;returned:string[];blockedByRoster:string[];uncontracted:string[]} {
 const members={...structuredClone(unit.members)} as Record<string,KboSangmuMember>,returned:string[]=[],blockedByRoster:string[]=[],uncontracted:string[]=[];
 for(const key of Object.keys(members).sort()){
  const m=members[key]!,p=m.program;
  if(p.completedBlocks<p.scheduledBlocks)continue;
  if(p.contract.remainingPaidGameDays===0){uncontracted.push(key);continue;}
  const club=world.clubs.find(c=>c.id===p.originalClubId);
  if(!club || Object.hasOwn(world.players,key))throw new RangeError('INVALID_SANGMU_UNIT');
  if(club.roster.length>=KBO_ROSTER_LIMITS.maximum){blockedByRoster.push(key);continue;}
  const s=p.contract,years=Math.ceil(s.remainingPaidGameDays/KBO_CONTRACT_GAME_DAYS);
  world.players[key]={...structuredClone(m.player),fatigue:0};
  if(m.repertoire)world.repertoires[key]={...structuredClone(m.repertoire),seasonId:resumeSeasonKey};
  world.contracts[key]={contractKey:s.contractKey,playerKey:key,clubId:club.id,seasonKey:resumeSeasonKey,years,annualSalaryWon:s.annualSalaryWon,signingBonusWon:0,status:'ACTIVE'};
  club.roster=[...club.roster,key].sort();club.reservedSalaryWon+=s.annualSalaryWon;returned.push(key);delete members[key];
 }
 return {unit:{schemaVersion:1,teamKey:'SANGMU',members,enlistedSeasons:[...unit.enlistedSeasons]},returned,blockedByRoster,uncontracted};
}

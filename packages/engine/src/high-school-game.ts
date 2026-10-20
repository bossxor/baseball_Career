import { RULES_VERSION } from '@playball/rules';
import type { Difficulty, Approach, PitchId } from '@playball/rules';
import type { HighSchoolWorld } from './high-school-world.js';
import { automaticFieldLineup, initialPositionFits } from './lineup.js';
import { emptyBatting } from './stats.js';
import { validateDevelopmentPlayer } from './player.js';
import type { DevelopmentPlayer } from './player.js';
import { pitchMastery, validatePitchWeights } from './repertoire.js';
import { createGame, runGameChunk, canonicalJson } from './game.js';
import { buildGameContribution, putGameContribution } from './records.js';
import type { RecordLedger } from './records.js';
import type { GameState, GameInput, TeamSnapshot, PlayerSnapshot, BattingLine } from './types.js';
import type { TraitOwnership } from './traits.js';

export interface HighSchoolGameContext {
  difficulty:Difficulty;
  unavailableKeys:readonly string[];
  /** The world AI chooses rotation/availability before preparation, not during a resumed game. */
  starters:Readonly<Record<string,string>>;
  recentBatting:Readonly<Record<string,BattingLine>>;
  recentPitchingOuts:Readonly<Record<string,number>>;
  traits:Readonly<Record<string,TraitOwnership>>;
  approaches:Readonly<Record<string,Approach>>;
}
export interface HighSchoolGameJob {
  schemaVersion:1; worldKey:string; seasonKey:string; worldDay:number;
  basisWorld:string; basisRecordRevision:number;
  game:GameState;
  stopReason:'READY'|'FINAL'|'CHUNK_LIMIT'|'ENGINE_LIMIT';
}
const lookup=<T>(values:Readonly<Record<string,T>>,key:string):T|undefined=>Object.hasOwn(values,key)?values[key]:undefined;
/** Internal server adapter only. The career command must authorize phase, queue and date first. */
export function prepareHighSchoolGame(world:HighSchoolWorld,records:RecordLedger,gameKey:string,context:HighSchoolGameContext):HighSchoolGameJob {
  const scheduled=world.schedule.find(g=>g.simulationKey===gameKey);
  if(!scheduled || scheduled.leagueKey!=='HS' || scheduled.seasonKey!==world.seasonKey || Object.hasOwn(records.games,gameKey))throw new RangeError('INVALID_SCHEDULED_GAME');
  if(!['GROWTH','REALISTIC','SECRET_CHEAT'].includes(context.difficulty) || new Set(context.unavailableKeys).size!==context.unavailableKeys.length || context.unavailableKeys.some(k=>!Object.hasOwn(world.players,k)))throw new RangeError('INVALID_GAME_CONTEXT');
  const development:NonNullable<GameInput['pitchDevelopment']>={seasonKey:world.seasonKey,players:Object.create(null) as NonNullable<GameInput['pitchDevelopment']>['players']};
  const snapshot=(player:DevelopmentPlayer):PlayerSnapshot=>({simulationKey:player.simulationKey,abilities:{...player.abilities},fatigue:player.fatigue,morale:1,temporary:{},traitLogits:[],traits:structuredClone(lookup(context.traits,player.simulationKey)??{unlocked:[],qualifiedRivalPitcherKeys:[]})});
  const team=(teamKey:string):TeamSnapshot=>{
    const school=world.schools.find(s=>s.id===teamKey);if(!school)throw new RangeError('MISSING_SCHOOL');
    if(new Set(school.roster).size!==school.roster.length)throw new RangeError('DUPLICATE_SCHOOL_PLAYER');
    const players=school.roster.map(k=>{const p=Object.hasOwn(world.players,k)?world.players[k]:undefined;if(!p || p.simulationKey!==k)throw new RangeError('MISSING_ROSTER_PLAYER');validateDevelopmentPlayer(p);return p;});
    const available=(p:DevelopmentPlayer)=>!context.unavailableKeys.includes(p.simulationKey);
    const hitters=players.filter(p=>p.kind==='HITTER');
    const assignment=automaticFieldLineup(hitters.map(player=>({player,available:available(player),fits:initialPositionFits(player.position),recent:lookup(context.recentBatting,player.simulationKey)??emptyBatting()})));
    const starters=players.filter(p=>p.kind==='PITCHER' && p.position==='SP' && available(p));
    const selected=players.find(p=>p.simulationKey===lookup(context.starters,teamKey));
    if(!selected || selected.kind!=='PITCHER' || !available(selected) || starters.length>0 && selected.position!=='SP')throw new RangeError('INVALID_SCHOOL_STARTER');
    const pitchers=players.filter(p=>p.kind==='PITCHER').sort((a,b)=>a===selected?-1:b===selected?1:a.simulationKey<b.simulationKey?-1:1);
    return {simulationKey:teamKey,fielders:assignment.fielders,lineup:assignment.lineup.map(k=>{
      const player=world.players[k]!;return {...snapshot(player),bats:player.bats,approach:lookup(context.approaches,k)??'BALANCED',available:true};
    }),pitchers:pitchers.map(player=>{
      const repertoire=world.repertoires[player.simulationKey];if(!repertoire || repertoire.seasonId!==world.seasonKey)throw new RangeError('MISSING_SCHOOL_REPERTOIRE');validatePitchWeights(repertoire.book,repertoire.weights);
      const numerator=player.simulationKey===world.protagonistKey?(context.difficulty==='SECRET_CHEAT'?15:5):(context.difficulty==='REALISTIC'?6:5);
      development.players[player.simulationKey]={repertoire:structuredClone(repertoire),numerator};
      return {...snapshot(player),throws:player.throws,pitchForm:player.pitchForm!,role:player.position as 'SP'|'RP'|'CP',available:available(player) && (player.position!=='SP' || player===selected),recentOuts:lookup(context.recentPitchingOuts,player.simulationKey)??0,repertoire:Object.keys(repertoire.weights).sort().map(id=>({pitchId:id as PitchId,weight:repertoire.weights[id as PitchId]!,mastery:pitchMastery(repertoire.book[id as PitchId]!)}))};
    })};
  };
  const teams:[TeamSnapshot,TeamSnapshot]=[team(scheduled.awayTeamKey),team(scheduled.homeTeamKey)];
  const game=createGame({simulationKey:scheduled.simulationKey,seed:world.seed,rulesVersion:RULES_VERSION,competition:'REGULAR',traitRulesVersion:1,pitchDevelopment:development,teams});
  return {schemaVersion:1,worldKey:world.worldKey,seasonKey:world.seasonKey,worldDay:scheduled.worldDay,basisWorld:canonicalJson(world),basisRecordRevision:records.revision,game,stopReason:'READY'};
}
export function advanceHighSchoolGame(job:HighSchoolGameJob,maxPlateAppearances=1000,maxCompletedInnings=20):HighSchoolGameJob {
  if(job.schemaVersion!==1)throw new RangeError('INVALID_SCHOOL_GAME_JOB');
  const result=runGameChunk(job.game,{plateAppearances:maxPlateAppearances,completedInnings:maxCompletedInnings});
  return {...job,game:result.state,stopReason:result.stopReason};
}
/** Publish books and official contribution as one pure result. M3 must persist both atomically. */
export function commitHighSchoolGame(world:HighSchoolWorld,records:RecordLedger,job:HighSchoolGameJob):{world:HighSchoolWorld;records:RecordLedger;duplicate:boolean} {
  if(job.schemaVersion!==1 || job.worldKey!==world.worldKey || job.seasonKey!==world.seasonKey || job.game.status!=='FINAL' || !job.game.pitchDevelopment)throw new RangeError('SCHOOL_GAME_NOT_COMMITTABLE');
  const scheduled=world.schedule.find(g=>g.simulationKey===job.game.input.simulationKey);
  if(!scheduled || scheduled.worldDay!==job.worldDay || scheduled.seasonKey!==world.seasonKey || scheduled.leagueKey!=='HS' || job.game.input.teams[0].simulationKey!==scheduled.awayTeamKey || job.game.input.teams[1].simulationKey!==scheduled.homeTeamKey)throw new RangeError('SCHOOL_SCHEDULE_MISMATCH');
  const contribution=buildGameContribution(job.game,{seasonKey:world.seasonKey,leagueKey:'HS',phase:'REGULAR'},scheduled.worldDay);
  const result=putGameContribution(records,contribution);
  if(result.duplicate)return {world,records,duplicate:true};
  if(records.revision!==job.basisRecordRevision || canonicalJson(world)!==job.basisWorld)throw new RangeError('STALE_SCHOOL_GAME');
  const updated=structuredClone(world);
  for(const [key,entry] of Object.entries(job.game.pitchDevelopment.players)){
    if(!Object.hasOwn(updated.repertoires,key))throw new RangeError('UNREGISTERED_GAME_PITCHER');
    updated.repertoires[key]=structuredClone(entry.repertoire);
  }
  return {world:updated,records:result.ledger,duplicate:false};
}

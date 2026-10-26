import {roleScore,abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS} from '@playball/rules';
import type {ActiveUsRosterWorld} from './us-career-entry.js';
import {assertActiveUsRosterWorld} from './us-career-entry.js';
import type {UsLevel} from './us-world.js';
import type {DevelopmentPlayer} from './player.js';
import {archetypeFor,truncatedNormal,validateDevelopmentPlayer} from './player.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {nextInteger} from './rng.js';
import {createRepertoire} from './repertoire.js';
import type {Repertoire} from './repertoire.js';

const levels:readonly UsLevel[]=['ROOKIE','A','AA','AAA','MLB'];
type Organization=ActiveUsRosterWorld['organizations'][number];
interface Vacancy {kind:DevelopmentPlayer['kind'];position:string}
export interface UsRetiredNpc {playerKey:string;organizationId:string;level:UsLevel|'RESERVE';lastSeasonKey:string;reason:'MAX_AGE';player:DevelopmentPlayer;repertoire:Repertoire|null}
export interface UsSupplyReceipt {targetSeasonKey:string;retired:UsRetiredNpc[];arrivals:{playerKey:string;organizationId:string;level:'ROOKIE'}[];moves:{playerKey:string;organizationId:string;from:UsLevel|'RESERVE';to:UsLevel}[]}
/** Y04 writer on a cloned world. Restore emergency substitutions first; the outer year command then ages survivors
 * and resets annual books. Newcomers stay in Rookie; no free upper-level replacements or player ability changes. */
export function retireAndSupplyUsNpcs(world:ActiveUsRosterWorld,retiringKeys:readonly string[],targetSeasonKey:string,protagonistKey:string):UsSupplyReceipt {
 assertActiveUsRosterWorld(world);
 if(targetSeasonKey!==String(Number(world.seasonKey)+1)||!Object.hasOwn(world.players,protagonistKey)||new Set(retiringKeys).size!==retiringKeys.length||retiringKeys.some(key=>key===protagonistKey||!Object.hasOwn(world.players,key)||world.players[key]!.age!==45))throw new RangeError('INVALID_US_RETIREMENT_SUPPLY');
 const receipt:UsSupplyReceipt={targetSeasonKey,retired:[],arrivals:[],moves:[]},vacancies=new Map(world.organizations.map(o=>[o.id,Object.fromEntries(levels.map(l=>[l,[] as Vacancy[]])) as Record<UsLevel,Vacancy[]>]));
 for(const key of [...retiringKeys].sort()){
  const org=world.organizations.find(o=>Object.values(o.levels).some(keys=>keys.includes(key))||world.reserves?.[o.id]?.includes(key))!,level=levels.find(l=>org.levels[l].includes(key))??'RESERVE',player=world.players[key]!;
  receipt.retired.push({playerKey:key,organizationId:org.id,level,lastSeasonKey:world.seasonKey,reason:'MAX_AGE',player:structuredClone(player),repertoire:world.repertoires[key]?structuredClone(world.repertoires[key]!):null});
  if(level==='RESERVE')world.reserves![org.id]=world.reserves![org.id]!.filter(k=>k!==key);
  else{org.levels[level]=org.levels[level].filter(k=>k!==key);vacancies.get(org.id)![level].push({kind:player.kind,position:player.position});}
  delete world.players[key];delete world.repertoires[key];
 }
 let serial=0;
 const rookie=(org:Organization,slot:Vacancy)=>{
  const key=JSON.stringify(['us-rookie',world.worldKey,targetSeasonKey,org.id,slot.kind,slot.position,serial++]);if(Object.hasOwn(world.players,key))throw new RangeError('US_ROOKIE_KEY_COLLISION');
  const identity=generateNpcIdentities([{simulationKey:key,kind:slot.kind,position:slot.position}],world.rng.handedness);world.rng.handedness=identity.state;
  const types=Object.keys(slot.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),draw=nextInteger(world.rng.roster,types.length);world.rng.roster=draw.state;const archetype=types[draw.value]!,profile=archetypeFor(slot.kind,archetype),keys=abilityKeys(slot.kind),z=truncatedNormal(world.rng.roster);world.rng.roster=z.state;
  const abilities=initialProfileAbilities(slot.kind,archetype,Math.round(35+4*z.value)),potential=generateNpcPotential(slot.kind,abilities,{mode:'CAREER',difficulty:world.difficulty,owned:false},world.rng.potential);world.rng.potential=potential.state;
  const age=nextInteger(world.rng.roster,5);world.rng.roster=age.state;
  const player:DevelopmentPlayer={...identity.players[0]!,name:'미국신인'+serial,age:18+age.value,archetype,focus:[...keys].sort((a,b)=>profile.weights[keys.indexOf(b)]!-profile.weights[keys.indexOf(a)]!||keys.indexOf(a)-keys.indexOf(b)).slice(0,4),abilities,potential:potential.potential,careerPeaks:{...abilities},fatigue:0};validateDevelopmentPlayer(player);world.players[key]=player;
  if(player.kind==='PITCHER'){const pitch=nextInteger(world.rng.roster,6);world.rng.roster=pitch.state;world.repertoires[key]=createRepertoire(PITCH_IDS[pitch.value+1]!,targetSeasonKey);}
  receipt.arrivals.push({playerKey:key,organizationId:org.id,level:'ROOKIE'});return key;
 };
 const select=(keys:readonly string[],slot:Vacancy)=>keys.filter(k=>k!==protagonistKey&&world.players[k]!.kind===slot.kind&&(slot.position!=='C'||world.players[k]!.throws==='R')).sort((a,b)=>Number(world.players[b]!.position===slot.position)-Number(world.players[a]!.position===slot.position)||roleScore(slot.kind,world.players[b]!.abilities,slot.position)-roleScore(slot.kind,world.players[a]!.abilities,slot.position)||(a<b?-1:1))[0];
 for(const org of [...world.organizations].sort((a,b)=>a.id<b.id?-1:1))for(let index=levels.length-1;index>=0;index--){const level=levels[index]!,queue=vacancies.get(org.id)![level];
  for(const slot of queue){let key:string|undefined,from:UsLevel|'RESERVE'='RESERVE';
   if(level==='ROOKIE')key=rookie(org,slot);
   else{
    for(let donor=index-1;donor>=0;donor--){const lower=levels[donor]!;key=select(org.levels[lower],slot);if(!key)continue;from=lower;org.levels[lower]=org.levels[lower].filter(k=>k!==key);vacancies.get(org.id)![lower].push({kind:world.players[key]!.kind,position:world.players[key]!.position});break;}
    if(!key){key=select(world.reserves?.[org.id]??[],slot);if(key)world.reserves![org.id]=world.reserves![org.id]!.filter(k=>k!==key);}
    // A pathological world with no existing candidate cannot silently promote a newly generated rookie into MLB.
    if(!key)throw new RangeError('US_EXISTING_PROMOTION_REQUIRED');receipt.moves.push({playerKey:key,organizationId:org.id,from,to:level});
   }
   org.levels[level].push(key);org.levels[level].sort();
  }
 }
 return receipt;
}

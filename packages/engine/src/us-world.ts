import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS,overall} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {createWorldStream,nextInteger,validateRng} from './rng.js';
import type {RngState} from './rng.js';
import {archetypeFor,truncatedNormal,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {createRepertoire,validatePitchWeights} from './repertoire.js';
import type {Repertoire} from './repertoire.js';

export const US_LEVEL_MEANS={ROOKIE:35,A:45,AA:55,AAA:65,MLB:75} as const;
export type UsLevel=keyof typeof US_LEVEL_MEANS;
const LEVELS=Object.keys(US_LEVEL_MEANS) as UsLevel[];
const minorH=['C','C','1B','2B','3B','SS','LF','LF','CF','CF','RF','DH'];
const minorP=['SP','SP','SP','SP','RP','RP','RP','RP','CP','CP'];
function positions(level:UsLevel){return {HITTER:level==='MLB'?[...minorH,'RF']:minorH,PITCHER:level==='MLB'?['SP','SP','SP','SP','SP','RP','RP','RP','RP','RP','RP','CP','CP']:minorP};}
function ageRange(level:UsLevel):readonly [number,number] {return level==='ROOKIE'?[18,22]:level==='A'?[19,24]:level==='AA'?[20,27]:level==='AAA'?[21,32]:[22,38];}
export interface UsRosterWorld {
 schemaVersion:1;modelVersion:'us-roster-1';worldKey:string;seasonKey:string;seed:string;difficulty:Difficulty;
 organizations:{id:string;name:string;levels:Record<UsLevel,string[]>}[];
 players:Record<string,DevelopmentPlayer>;repertoires:Record<string,Repertoire>;
 rng:{roster:RngState;potential:RngState;handedness:RngState};
}
/** Initial population only. Caller supplies the organization registry; this never invents official club identities. */
export function createUsRosterWorld(input:{worldKey:string;seasonKey:string;seed:string;difficulty:Difficulty;organizations:readonly {id:string;name:string}[]}):UsRosterWorld {
 if(!input.worldKey || !input.seasonKey || !input.seed || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(input.difficulty) || input.organizations.length!==30 || new Set(input.organizations.map(o=>o.id)).size!==30 || input.organizations.some(o=>!o.id || !o.name))throw new RangeError('INVALID_US_ROSTER_INPUT');
 const organizations=[...input.organizations].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(o=>({...o,levels:Object.fromEntries(LEVELS.map(l=>[l,[] as string[]])) as Record<UsLevel,string[]>}));
 const templates=organizations.flatMap(o=>LEVELS.flatMap(level=>(['HITTER','PITCHER'] as const).flatMap(kind=>positions(level)[kind].map((position,i)=>({simulationKey:JSON.stringify(['us-npc',input.worldKey,input.seasonKey,o.id,level,kind,i]),kind,position,organizationId:o.id,level})))));
 const namespace=JSON.stringify(['us-roster-1',input.worldKey,input.seasonKey]),identity=generateNpcIdentities(templates.map(({simulationKey,kind,position})=>({simulationKey,kind,position})),createWorldStream(input.seed,namespace,'handedness'));
 let roster=createWorldStream(input.seed,namespace,'roster'),potential=createWorldStream(input.seed,namespace,'potential');
 const metadata=new Map(templates.map(t=>[t.simulationKey,t])),byOrg=new Map(organizations.map(o=>[o.id,o])),players:Record<string,DevelopmentPlayer>=Object.create(null),repertoires:Record<string,Repertoire>=Object.create(null);
 for(const [index,npc] of identity.players.entries()){
  const meta=metadata.get(npc.simulationKey)!,types=Object.keys(npc.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),typeDraw=nextInteger(roster,types.length);roster=typeDraw.state;const archetype=types[typeDraw.value]!,type=archetypeFor(npc.kind,archetype),keys=abilityKeys(npc.kind);
  const z=truncatedNormal(roster);roster=z.state;const target=Math.round(US_LEVEL_MEANS[meta.level]+4*z.value),abilities=initialProfileAbilities(npc.kind,archetype,target);
  const p=generateNpcPotential(npc.kind,abilities,{mode:'CAREER',difficulty:input.difficulty,owned:false},potential);potential=p.state;
  const [low,high]=ageRange(meta.level),age=nextInteger(roster,high-low+1);roster=age.state;
  const focus=[...keys].sort((a,b)=>type.weights[keys.indexOf(b)]!-type.weights[keys.indexOf(a)]! || keys.indexOf(a)-keys.indexOf(b)).slice(0,4);
  const player:DevelopmentPlayer={...npc,name:'미국선수'+(index+1),age:low+age.value,archetype,focus,abilities,potential:p.potential,careerPeaks:{...abilities},fatigue:0};validateDevelopmentPlayer(player);players[npc.simulationKey]=player;byOrg.get(meta.organizationId)!.levels[meta.level].push(npc.simulationKey);
  if(npc.kind==='PITCHER'){const pitch=nextInteger(roster,6);roster=pitch.state;repertoires[npc.simulationKey]=createRepertoire(PITCH_IDS[pitch.value+1]!,input.seasonKey);}
 }
 const result:UsRosterWorld={schemaVersion:1,modelVersion:'us-roster-1',worldKey:input.worldKey,seasonKey:input.seasonKey,seed:input.seed,difficulty:input.difficulty,organizations,players,repertoires,rng:{roster,potential,handedness:identity.state}};assertInitialUsRosterWorld(result);return result;
}
/** Initial-size constraints must not be reused after real signings, promotions, aging or releases. */
export function assertInitialUsRosterWorld(world:UsRosterWorld):void {
 if(world.schemaVersion!==1 || world.modelVersion!=='us-roster-1' || !world.worldKey || !world.seasonKey || !world.seed || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(world.difficulty) || world.organizations.length!==30 || new Set(world.organizations.map(o=>o.id)).size!==30 || Object.keys(world.players).length!==3420 || Object.keys(world.repertoires).length!==1590)throw new RangeError('INVALID_US_INITIAL_WORLD');
 for(const key of ['roster','potential','handedness'] as const)validateRng(world.rng[key]);const seen=new Set<string>();
 for(const org of world.organizations){
  if(!org.id || !org.name || Object.keys(org.levels).length!==5)throw new RangeError('INVALID_US_ORGANIZATION');
  for(const level of LEVELS){const required=positions(level),members=org.levels[level];if(!members || members.length!==(level==='MLB'?26:22))throw new RangeError('INVALID_US_LEVEL_SIZE');
   const actual=members.map(key=>{const p=world.players[key];if(!Object.hasOwn(world.players,key) || !p || p.simulationKey!==key || seen.has(key))throw new RangeError('INVALID_US_ROSTER_REGISTRATION');seen.add(key);validateDevelopmentPlayer(p);const score=overall(p.kind,p.abilities),target=score.sumUnits/score.denominator,[low,high]=ageRange(level);if(!Number.isInteger(target) || Math.abs(target-US_LEVEL_MEANS[level])>8 || p.age<low || p.age>high)throw new RangeError('INVALID_US_INITIAL_DISTRIBUTION');if(p.kind==='PITCHER'){const r=world.repertoires[key];if(!Object.hasOwn(world.repertoires,key) || !r || r.seasonId!==world.seasonKey)throw new RangeError('INVALID_US_REPERTOIRE');validatePitchWeights(r.book,r.weights);}return p;});
   for(const kind of ['HITTER','PITCHER'] as const)for(const pos of new Set(required[kind]))if(actual.filter(p=>p.kind===kind && p.position===pos).length!==required[kind].filter(p=>p===pos).length)throw new RangeError('INVALID_US_POSITION_DEPTH');
  }
 }
 if(seen.size!==3420 || Object.keys(world.repertoires).some(k=>world.players[k]?.kind!=='PITCHER'))throw new RangeError('INVALID_US_ROSTER_REGISTRATION');
}

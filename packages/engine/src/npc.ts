import { abilityKeys, assertAbilities } from '@playball/rules';
import type { AbilityUnits, PlayerKind, Difficulty } from '@playball/rules';
import { nextFloat } from './rng.js';
import type { RngState } from './rng.js';
import { truncatedNormal } from './player.js';
import type { Hand, BatSide, PitchForm } from './probabilities.js';

export interface NpcIdentityInput { simulationKey:string; kind:PlayerKind; position:string }
export interface NpcIdentity extends NpcIdentityInput { throws:Hand; bats:BatSide; pitchForm:PitchForm|null }
/** 121: immutable sorted batch; handedness RNG must not be reused as the potential stream. */
export function generateNpcIdentities(source:readonly NpcIdentityInput[], rng:RngState):{players:NpcIdentity[];state:RngState} {
  const sorted=[...source].sort((a,b)=>a.simulationKey<b.simulationKey?-1:a.simulationKey>b.simulationKey?1:0);
  if(new Set(sorted.map(p=>p.simulationKey)).size!==sorted.length) throw new RangeError('DUPLICATE_PLAYER');
  for(const player of sorted) {
    const positions=player.kind==='HITTER'?['C','1B','2B','3B','SS','LF','CF','RF','DH']:player.kind==='PITCHER'?['SP','RP','CP']:[];
    if(!player.simulationKey || !positions.includes(player.position)) throw new RangeError('INVALID_NPC');
  }
  const restricted=(p:NpcIdentityInput)=>p.kind==='HITTER' && ['C','2B','3B','SS'].includes(p.position);
  const hitters=sorted.filter(p=>p.kind==='HITTER'), free=hitters.filter(p=>!restricted(p)).length;
  const leftProbability=free===0?0:Math.min(1,.15*hitters.length/free);
  let state=rng;
  const draw=()=>{const next=nextFloat(state);state=next.state;return next.value;};
  const players=sorted.map(player=>{
    // A fixed hand draw is consumed even for forced-right positions; subsequent fields are stable.
    const handDraw=draw(),throws:Hand=restricted(player)?'R':handDraw<(player.kind==='PITCHER'?.15:leftProbability)?'L':'R';
    const batDraw=draw(),bats:BatSide=throws==='R'?(batDraw<.8?'R':batDraw<.92?'L':'S'):(batDraw<.7?'L':batDraw<.95?'R':'S');
    let pitchForm:PitchForm|null=null;
    if(player.kind==='PITCHER') {const u=draw();pitchForm=u<.45?'OVERHAND':u<.8?'THREE_QUARTER':u<.95?'SIDEARM':'UNDERHAND';}
    return {...player,throws,bats,pitchForm};
  });
  return {players,state};
}
/** 42/85: caller owns current-ability/age generation; no invented roster-strength distribution. */
export function generateNpcPotential(kind:PlayerKind, abilities:AbilityUnits, context:{mode:'CAREER'|'CLUB';difficulty:Difficulty;owned:boolean}, rng:RngState) {
  assertAbilities(kind,abilities);
  if(!['CAREER','CLUB'].includes(context.mode) || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(context.difficulty)) throw new RangeError('INVALID_NPC_POLICY');
  const potential:Record<string,number>={};let state=rng;
  for(const key of abilityKeys(kind)) {
    const normal=truncatedNormal(state);state=normal.state;
    const base=Math.max(abilities[key]!,Math.min(95,Math.max(60,Math.round(75+10*normal.value)))*10_000);
    potential[key]=context.mode==='CLUB' && context.difficulty==='SECRET_CHEAT' && context.owned?1_000_000:Math.min(1_000_000,base+(context.mode==='CAREER' && context.difficulty==='REALISTIC'?50_000:0));
  }
  return {potential,state};
}

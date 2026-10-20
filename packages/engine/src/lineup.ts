import {roleScore} from '@playball/rules';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import {battingRates,pitchingRates,emptyBatting,emptyPitching} from './stats.js';
import type {BattingLine,PitchingLine} from './types.js';
import {clamp,pitcherAppearanceFatigue} from './probabilities.js';
export const FIELD_POSITIONS=['C','1B','2B','3B','SS','LF','CF','RF'] as const;
export type FieldPosition=(typeof FIELD_POSITIONS)[number];
export interface LineupCandidate {player:DevelopmentPlayer;available:boolean;fits:Readonly<Record<FieldPosition,number>>;recent:BattingLine}
export function initialPositionFits(position:string):Record<FieldPosition,number> {
  if(![...FIELD_POSITIONS,'DH'].includes(position as FieldPosition))throw new RangeError('INVALID_HITTER_POSITION');
  return Object.fromEntries(FIELD_POSITIONS.map(p=>[p,p===position?100:0])) as Record<FieldPosition,number>;
}
function validateStats(stats:object,keys:readonly string[]):void {if(keys.some(key=>!Object.hasOwn(stats,key)))throw new RangeError('INVALID_RECENT_STATS');for(const value of Object.values(stats))if(typeof value!=='number' || !Number.isSafeInteger(value) || value<0)throw new RangeError('INVALID_RECENT_STATS');}
export function recentBattingPerformance(stats:BattingLine):number {
  validateStats(stats,Object.keys(emptyBatting()));
  const ops=battingRates(stats).OPS;return stats.PA<50 || ops===null?50:clamp(50+100*(ops-.700),0,100);
}
export function recentPitchingPerformance(stats:PitchingLine):number {
  validateStats(stats,Object.keys(emptyPitching()));
  const era=pitchingRates(stats).ERA;return stats.outs<30 || era===null?50:clamp(50+10*(4-era),0,100);
}
export function lineupCompetition(candidate:LineupCandidate,position:string):number {return .8*roleScore('HITTER',candidate.player.abilities,position)+.2*recentBattingPerformance(candidate.recent);}
interface Assignment {fit:number;score:number;fatigue:number;keys:(string|null)[]}
function better(a:Assignment,b:Assignment|undefined):boolean {
  if(!b)return true;if(a.fit!==b.fit)return a.fit>b.fit;if(a.score!==b.score)return a.score>b.score;if(a.fatigue!==b.fatigue)return a.fatigue<b.fatigue;
  const ak=JSON.stringify(a.keys),bk=JSON.stringify(b.keys);return ak<bk;
}
/** Global slot assignment avoids greedy utility-player theft leaving another position unfilled. */
export function automaticFieldLineup(source:readonly LineupCandidate[],minimumFit=0) {
  if(!Number.isFinite(minimumFit) || minimumFit<0 || minimumFit>100)throw new RangeError('INVALID_MINIMUM_FIT');
  const candidates=[...source].sort((a,b)=>a.player.simulationKey<b.player.simulationKey?-1:a.player.simulationKey>b.player.simulationKey?1:0);
  if(new Set(candidates.map(c=>c.player.simulationKey)).size!==candidates.length)throw new RangeError('DUPLICATE_LINEUP_PLAYER');
  for(const c of candidates) {validateDevelopmentPlayer(c.player);if(typeof c.available!=='boolean' || c.player.kind!=='HITTER' || Object.keys(c.fits).length!==8 || FIELD_POSITIONS.some(p=>!Number.isFinite(c.fits[p]) || c.fits[p]<0 || c.fits[p]>100))throw new RangeError('INVALID_LINEUP_CANDIDATE');}
  const slots=[...FIELD_POSITIONS,'DH'];let states=new Map<number,Assignment>([[0,{fit:0,score:0,fatigue:0,keys:slots.map(()=>null)}]]);
  for(const c of candidates.filter(c=>c.available)) {
    const next=new Map(states);
    for(const [mask,assignment] of states)for(let i=0;i<slots.length;i++) {
      if(mask&(1<<i))continue;const position=slots[i]!;
      if(c.player.throws==='L' && ['C','2B','3B','SS'].includes(position))continue;
      const fit=position==='DH'?100:c.fits[position as FieldPosition];if(fit<minimumFit)continue;
      const keys=[...assignment.keys];keys[i]=c.player.simulationKey;
      const proposal={fit:assignment.fit+fit,score:assignment.score+lineupCompetition(c,position),fatigue:assignment.fatigue+c.player.fatigue,keys},newMask=mask|(1<<i);
      if(better(proposal,next.get(newMask)))next.set(newMask,proposal);
    }
    states=next;
  }
  const best=states.get(511);if(!best)throw new RangeError('ROSTER_INVALID: no legal field lineup');
  const selected=best.keys.map(key=>candidates.find(c=>c.player.simulationKey===key)!);
  const stable=(a:LineupCandidate,b:LineupCandidate)=>a.player.simulationKey<b.player.simulationKey?-1:a.player.simulationKey>b.player.simulationKey?1:0;
  const remaining=[...selected];
  const take=(compare:(a:LineupCandidate,b:LineupCandidate)=>number,n:number)=>{remaining.sort((a,b)=>compare(a,b)||stable(a,b));return remaining.splice(0,n);};
  const lead=take((a,b)=>b.player.abilities.DISCIPLINE!-a.player.abilities.DISCIPLINE! || b.player.abilities.CONTACT!-a.player.abilities.CONTACT!,2);
  const middle=take((a,b)=>b.player.abilities.POWER!-a.player.abilities.POWER! || b.player.abilities.CONTACT!-a.player.abilities.CONTACT!,3);
  const tail=take((a,b)=>roleScore('HITTER',b.player.abilities,'DH')-roleScore('HITTER',a.player.abilities,'DH'),4);
  return {lineup:[...lead,...middle,...tail].map(c=>c.player.simulationKey),fielders:FIELD_POSITIONS.map((position,i)=>({position,simulationKey:best.keys[i]!,fit:selected[i]!.fits[position]})),dhKey:best.keys[8]!,fitSum:best.fit,competitionSum:best.score};
}
/** A played day adds its appearance cost; an idle/bench day recovers, never both. */
export function appearanceFatigue(player:DevelopmentPlayer,appearance:'NONE'|'HITTER'|'STARTER'|'RELIEF'):DevelopmentPlayer {
  validateDevelopmentPlayer(player);
  if(!['NONE','HITTER','STARTER','RELIEF'].includes(appearance))throw new RangeError('INVALID_APPEARANCE_KIND');
  if(player.kind==='HITTER' && !['NONE','HITTER'].includes(appearance) || player.kind==='PITCHER' && appearance==='HITTER')throw new RangeError('INVALID_APPEARANCE_KIND');
  const delta=appearance==='NONE'?(player.kind==='HITTER'?-8:-10):appearance==='HITTER'?5:pitcherAppearanceFatigue(player.abilities.STAMINA!/10_000,appearance==='STARTER');
  return {...structuredClone(player),fatigue:clamp(player.fatigue+delta,0,100)};
}

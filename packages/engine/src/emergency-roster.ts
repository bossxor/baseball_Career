import type { DevelopmentPlayer } from './player.js';
import { validateDevelopmentPlayer } from './player.js';
export interface EmergencyCandidate {player:DevelopmentPlayer;available:boolean;temporary:boolean}
export interface EmergencyRosterPlan {retainTemporaryKeys:string[];releaseTemporaryKeys:string[];requiredHitters:number;requiredPitchers:number;requiredRightThrowingHitters:number}
/** Minimum legal nine with four right-throwing critical defenders, plus one available pitcher.
 * Released temporary players leave registration only; their identity/records must be retained.
 * Generation and the registration change belong to one upper-level world command.
 */
export function planEmergencyRoster(source:readonly EmergencyCandidate[]):EmergencyRosterPlan {
  if(new Set(source.map(p=>p.player.simulationKey)).size!==source.length)throw new RangeError('DUPLICATE_ROSTER_PLAYER');
  for(const p of source){validateDevelopmentPlayer(p.player);if(typeof p.available!=='boolean' || typeof p.temporary!=='boolean')throw new RangeError('INVALID_EMERGENCY_CANDIDATE');}
  const permanent=source.filter(p=>!p.temporary && p.available),temps=source.filter(p=>p.temporary).sort((a,b)=>a.player.simulationKey<b.player.simulationKey?-1:1);
  let hitters=permanent.filter(p=>p.player.kind==='HITTER').length;
  let right=permanent.filter(p=>p.player.kind==='HITTER' && p.player.throws==='R').length;
  let pitchers=permanent.filter(p=>p.player.kind==='PITCHER').length;
  const retained=new Set<string>();
  const keep=(p:EmergencyCandidate)=>{retained.add(p.player.simulationKey);if(p.player.kind==='PITCHER')pitchers++;else {hitters++;if(p.player.throws==='R')right++;}};
  // Resolve the scarce legal defenders first so retained left throwers cannot inflate the count.
  for(const p of temps)if(p.available && p.player.kind==='HITTER' && p.player.throws==='R' && right<4)keep(p);
  for(const p of temps)if(p.available && p.player.kind==='HITTER' && !retained.has(p.player.simulationKey) && hitters+Math.max(0,4-right)<9)keep(p);
  for(const p of temps)if(p.available && p.player.kind==='PITCHER' && pitchers<1)keep(p);
  const requiredRightThrowingHitters=Math.max(0,4-right);
  return {retainTemporaryKeys:[...retained].sort(),releaseTemporaryKeys:temps.filter(p=>!retained.has(p.player.simulationKey)).map(p=>p.player.simulationKey),requiredHitters:Math.max(0,9-hitters,requiredRightThrowingHitters),requiredPitchers:Math.max(0,1-pitchers),requiredRightThrowingHitters};
}

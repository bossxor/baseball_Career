import {abilityKeys} from '@playball/rules';
import type {PlayerKind,AbilityUnits} from '@playball/rules';
import {archetypeFor} from './player.js';
/** Common-offset water filling keeps the requested integer mean and1..100 bounds. */
export function initialProfileAbilities(kind:PlayerKind,archetype:string,target:number):AbilityUnits {
 if(!Number.isInteger(target) || target<1 || target>100)throw new RangeError('INVALID_INITIAL_TARGET');
 const keys=abilityKeys(kind),type=archetypeFor(kind,archetype),wanted=target*60_000;
 const value=(i:number,offset:number)=>Math.max(10_000,Math.min(1_000_000,type.initial[i]!*10_000+offset));
 let low=-1_000_000,high=1_000_000;
 while(low<high){const middle=Math.floor((low+high+1)/2);if(keys.reduce((sum,_,i)=>sum+value(i,middle),0)<=wanted)low=middle;else high=middle-1;}
 const values=keys.map((_,i)=>value(i,low));let remaining=wanted-values.reduce((a,b)=>a+b,0);
 for(let i=0;remaining>0 && i<values.length;i++)if(values[i]!<1_000_000){values[i]=values[i]!+1;remaining--;}
 if(remaining!==0)throw new RangeError('INITIAL_ABILITY_ALLOCATION_FAILED');
 return Object.fromEntries(keys.map((key,i)=>[key,values[i]!]));
}

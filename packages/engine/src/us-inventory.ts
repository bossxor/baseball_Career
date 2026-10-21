import {assertInitialUsRosterWorld} from './us-world.js';
import type {UsRosterWorld} from './us-world.js';
import {assertUsRecruitmentWorld} from './us-direct.js';
import type {UsRecruitmentWorld} from './us-direct.js';

/** Server/world-owned earmarks. Budget is supplied by the financial worker, never guessed from player strength. */
export interface UsRecruitmentAllocation {organizationId:string;rookieCapacity:number;aCapacity:number;availableBudgetUsd:number;nationalReleaseAllowed:boolean;militaryReturnOption:boolean}
export function initialUsRecruitmentInventory(world:UsRosterWorld,allocations:readonly UsRecruitmentAllocation[]):UsRecruitmentWorld {
 assertInitialUsRosterWorld(world);
 if(allocations.length!==30 || new Set(allocations.map(a=>a.organizationId)).size!==30 || allocations.some(a=>!world.organizations.some(o=>o.id===a.organizationId)))throw new RangeError('INVALID_US_RECRUITMENT_ALLOCATIONS');
 const clubs=world.organizations.map(o=>{
  const a=allocations.find(a=>a.organizationId===o.id)!,occupied=Object.values(o.levels).reduce((n,r)=>n+r.length,0),rookieSlots=a.rookieCapacity-o.levels.ROOKIE.length,aSlots=a.aCapacity-o.levels.A.length;
  if(!Number.isSafeInteger(a.rookieCapacity) || !Number.isSafeInteger(a.aCapacity) || rookieSlots<0 || aSlots<0 || occupied+rookieSlots+aSlots>160)throw new RangeError('US_ORGANIZATION_CAPACITY_EXCEEDED');
  return {id:o.id,name:o.name,rookieSlots,aSlots,availableBudgetUsd:a.availableBudgetUsd,nationalReleaseAllowed:a.nationalReleaseAllowed,militaryReturnOption:a.militaryReturnOption};
 });
 const inventory:UsRecruitmentWorld={schemaVersion:1,worldKey:world.worldKey,seasonKey:world.seasonKey,seed:world.seed,registeredPlayerKeys:Object.keys(world.players).sort(),clubs};assertUsRecruitmentWorld(inventory);return inventory;
}

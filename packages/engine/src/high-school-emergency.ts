import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import type {HighSchoolWorld} from './high-school-world.js';
import type {HealthLedger} from './health.js';
import {planEmergencyRoster} from './emergency-roster.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {nextInteger,nextFloat} from './rng.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import {createRepertoire} from './repertoire.js';
import {schoolNpcTarget,schoolNpcAbilities} from './school-roster.js';

export interface SchoolEmergencyRegistry {
  schemaVersion:1;worldKey:string;nextSerial:number;
  entries:Record<string,{schoolKey:string;createdDay:number;releasedDay:number|null}>;
}
export const createSchoolEmergencyRegistry=(world:HighSchoolWorld):SchoolEmergencyRegistry=>({schemaVersion:1,worldKey:world.worldKey,nextSerial:1,entries:Object.create(null) as SchoolEmergencyRegistry['entries']});
/** Reuses the active school's NPC profile and saved streams. Release never deletes identity/history. */
export function reconcileSchoolEmergency(world:HighSchoolWorld,health:HealthLedger,source:SchoolEmergencyRegistry,day:number,difficulty:Difficulty):{world:HighSchoolWorld;registry:SchoolEmergencyRegistry;added:string[];released:string[]} {
  if(source.schemaVersion!==1 || source.worldKey!==world.worldKey || !Number.isSafeInteger(source.nextSerial) || source.nextSerial<1 || !Number.isSafeInteger(day) || day<0 || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(difficulty))throw new RangeError('INVALID_EMERGENCY_REGISTRY');
  const membership=new Map<string,string>();
  for(const school of world.schools)for(const key of school.roster){if(membership.has(key) || !Object.hasOwn(world.players,key))throw new RangeError('INVALID_EMERGENCY_REGISTRATION');membership.set(key,school.id);}
  for(const [key,entry] of Object.entries(source.entries)){
    const identity:unknown=JSON.parse(key);
    if(!Array.isArray(identity) || identity.length!==4 || identity[0]!==(world.leagueKey==='COLLEGE'?'college-temp':'hs-temp') || identity[1]!==entry.schoolKey || identity[2]!==world.seasonKey || !Number.isSafeInteger(identity[3]) || identity[3]<1 || identity[3]>=source.nextSerial)throw new RangeError('INVALID_TEMPORARY_KEY');
    if(!Object.hasOwn(world.players,key) || !world.schools.some(s=>s.id===entry.schoolKey) || !Number.isSafeInteger(entry.createdDay) || entry.createdDay<0 || entry.createdDay>day || entry.releasedDay!==null && (!Number.isSafeInteger(entry.releasedDay) || entry.releasedDay<entry.createdDay || entry.releasedDay>day) || (entry.releasedDay===null?membership.get(key)!==entry.schoolKey:membership.has(key)))throw new RangeError('INVALID_TEMPORARY_MEMBERSHIP');
  }
  const updated=structuredClone(world),registry=structuredClone(source),added:string[]=[],released:string[]=[];
  for(const school of [...updated.schools].sort((a,b)=>a.id<b.id?-1:1)){
    const plan=planEmergencyRoster(school.roster.map(key=>({player:updated.players[key]!,available:!Object.hasOwn(health.injuries,key),temporary:Object.hasOwn(registry.entries,key)})));
    for(const key of plan.releaseTemporaryKeys){registry.entries[key]!.releasedDay=day;released.push(key);}
    school.roster=school.roster.filter(key=>!plan.releaseTemporaryKeys.includes(key));
    const requests:{simulationKey:string;kind:'HITTER'|'PITCHER';position:string}[]=[];
    const add=(kind:'HITTER'|'PITCHER',position:string)=>{
      if(!Number.isSafeInteger(registry.nextSerial+1))throw new RangeError('EMERGENCY_SERIAL_LIMIT');
      const simulationKey=JSON.stringify([world.leagueKey==='COLLEGE'?'college-temp':'hs-temp',school.id,world.seasonKey,registry.nextSerial++]);
      if(simulationKey.length>128 || Object.hasOwn(updated.players,simulationKey) || Object.hasOwn(registry.entries,simulationKey))throw new RangeError('EMERGENCY_KEY_COLLISION');
      requests.push({simulationKey,kind,position});
    };
    for(let i=0;i<plan.requiredHitters;i++)add('HITTER',i<plan.requiredRightThrowingHitters?['C','2B','3B','SS'][i]!:'CF');
    for(let i=0;i<plan.requiredPitchers;i++)add('PITCHER','SP');
    const identities=generateNpcIdentities(requests,updated.rng.handedness);updated.rng.handedness=identities.state;
    for(const [index,identity] of identities.players.entries()){
      const types=Object.keys(identity.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),typeDraw=nextInteger(updated.rng.roster,types.length);updated.rng.roster=typeDraw.state;
      const archetype=types[typeDraw.value]!,type=archetypeFor(identity.kind,archetype),keys=abilityKeys(identity.kind);
      const u=nextFloat(updated.rng.roster);updated.rng.roster=u.state;
      const target=schoolNpcTarget(u.value,school.id,world.leagueKey,world.schoolBalanceVersion??1);let age=18;
      if(world.leagueKey==='COLLEGE'){const ageDraw=nextInteger(updated.rng.roster,4);updated.rng.roster=ageDraw.state;age=19+ageDraw.value;}
      const abilities=schoolNpcAbilities(identity.kind,archetype,target,world.leagueKey,world.schoolBalanceVersion??1);
      const potential=generateNpcPotential(identity.kind,abilities,{mode:'CAREER',difficulty,owned:false},updated.rng.potential);updated.rng.potential=potential.state;
      const focus=[...keys].sort((a,b)=>type.weights[keys.indexOf(b)]!-type.weights[keys.indexOf(a)]! || keys.indexOf(a)-keys.indexOf(b)).slice(0,4);
      const serial=registry.nextSerial-requests.length+index;
      const player={...identity,name:['강','김','박','이','정'][serial%5]!+['도윤','민준','서준','시우','우진'][Math.floor(serial/5)%5]!,age,archetype,focus,abilities,potential:potential.potential,careerPeaks:{...abilities},fatigue:0};
      validateDevelopmentPlayer(player);updated.players[player.simulationKey]=player;
      if(player.kind==='PITCHER'){const secondary=nextInteger(updated.rng.roster,6);updated.rng.roster=secondary.state;updated.repertoires[player.simulationKey]=createRepertoire(PITCH_IDS[secondary.value+1]!,world.seasonKey);}
      school.roster.push(player.simulationKey);registry.entries[player.simulationKey]={schoolKey:school.id,createdDay:day,releasedDay:null};added.push(player.simulationKey);
    }
    school.roster.sort();
  }
  return {world:updated,registry,added,released};
}

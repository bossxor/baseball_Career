import {abilityKeys} from '@playball/rules';
import {createStreams,nextInteger} from './rng.js';
import type {HighSchoolWorld} from './high-school-world.js';
import type {DevelopmentPlayer} from './player.js';

export type RelationType='RIVAL'|'TEAMMATE';
export type RelationStage='FORMED'|'SEPARATED'|'REUNITED_OPPONENT'|'REUNITED_TEAM'|'RETIRED';
export interface RelationMilestone {stage:RelationStage;evidenceKey:string;worldDay:number}
export interface PlayerRelationship {relationKey:string;type:RelationType;normalPairKey:string;primaryPlayerKey:string;otherPlayerKey:string;stage:RelationStage;milestones:readonly RelationMilestone[]}
export interface RelationshipLedger {
 schemaVersion:1;relations:readonly PlayerRelationship[];
 /** Why a role is empty. Empty is a normal state and never blocks the career. */
 formation:{rival:'FORMED'|'NO_CANDIDATE';teammate:'FORMED'|'NO_CANDIDATE'};
}
const sum=(p:DevelopmentPlayer)=>abilityKeys(p.kind).reduce((s,k)=>s+p.abilities[k]!,0);
const pairKey=(a:string,b:string)=>JSON.stringify([a,b].sort());

/** 60/51 high-school start: one same-team teammate first, then one rival from the eligible pool excluding that teammate.
 * Overall gap uses exact ability units (5 display points = 300,000 units over six abilities). Uses its own seed stream. */
export function formHighSchoolRelations(world:HighSchoolWorld,worldDay:number):RelationshipLedger {
 const me=world.players[world.protagonistKey];if(!me)throw new RangeError('MISSING_PROTAGONIST');
 const school=world.schools.find(s=>s.id===world.protagonistSchoolId);if(!school)throw new RangeError('MISSING_SCHOOL');
 const others=Object.values(world.players).filter(p=>p.simulationKey!==me.simulationKey && p.kind===me.kind);
 const teammate=others.filter(p=>school.roster.includes(p.simulationKey))
  .sort((a,b)=>Math.abs(a.age-me.age)-Math.abs(b.age-me.age) || (a.simulationKey<b.simulationKey?-1:1))[0];
 const candidates=others.filter(p=>p.simulationKey!==teammate?.simulationKey && Math.abs(p.age-me.age)<=1 && Math.abs(sum(p)-sum(me))<=300_000)
  .sort((a,b)=>a.simulationKey<b.simulationKey?-1:1);
 let rival:DevelopmentPlayer|undefined;
 if(candidates.length){const draw=nextInteger(createStreams(world.seed,JSON.stringify(['relation-formation',world.worldKey])).worldCreation,candidates.length);rival=candidates[draw.value];}
 const relation=(type:RelationType,other:DevelopmentPlayer):PlayerRelationship=>{const key=pairKey(me.simulationKey,other.simulationKey);
  return {relationKey:JSON.stringify([type,key]),type,normalPairKey:key,primaryPlayerKey:me.simulationKey,otherPlayerKey:other.simulationKey,stage:'FORMED',milestones:[{stage:'FORMED',evidenceKey:JSON.stringify(['hs-formation',world.worldKey,type]),worldDay}]};};
 return {schemaVersion:1,relations:[...(rival?[relation('RIVAL',rival)]:[]),...(teammate?[relation('TEAMMATE',teammate)]:[])],formation:{rival:rival?'FORMED':'NO_CANDIDATE',teammate:teammate?'FORMED':'NO_CANDIDATE'}};
}

export function validateRelationshipLedger(ledger:RelationshipLedger,world:HighSchoolWorld):void {
 if(ledger.schemaVersion!==1)throw new RangeError('INVALID_RELATIONSHIPS');
 const seen=new Set<string>(),roles=new Set<string>();
 for(const r of ledger.relations){
  if(seen.has(r.relationKey) || roles.has(r.otherPlayerKey) || !world.players[r.otherPlayerKey] || r.otherPlayerKey===r.primaryPlayerKey || r.normalPairKey!==pairKey(r.primaryPlayerKey,r.otherPlayerKey) || r.milestones.length===0)throw new RangeError('INVALID_RELATIONSHIPS');
  seen.add(r.relationKey);roles.add(r.otherPlayerKey);
 }
}

/** S42 list projection: identity by name, hand and form only (119). No abilities, potential or seeds. */
export function relationshipListView(ledger:RelationshipLedger|undefined,world:HighSchoolWorld) {
 const schoolName=(key:string)=>world.schools.find(s=>s.roster.includes(key))?.name??null;
 // Relations to players outside the current world stay stored; their separation stages are a later transition.
 return (ledger?.relations??[]).filter(r=>Object.hasOwn(world.players,r.otherPlayerKey)).map(r=>{const p=world.players[r.otherPlayerKey]!;
  return {relationKey:r.relationKey,type:r.type,stage:r.stage,other:{name:p.name,kind:p.kind,position:p.position,throws:p.throws,bats:p.bats,pitchForm:p.pitchForm??null,schoolName:schoolName(p.simulationKey)}};});
}

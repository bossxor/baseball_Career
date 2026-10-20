import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS,COLLEGES} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import {createWorldStream,createHandednessStream,nextFloat,nextInteger} from './rng.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {createRepertoire} from './repertoire.js';
import type {Repertoire} from './repertoire.js';

export const HITTER_POSITIONS=['C','C','1B','1B','2B','2B','3B','3B','SS','SS','LF','CF','RF','DH','DH'];
export const PITCHER_POSITIONS=['SP','SP','SP','SP','RP','RP','RP','RP','CP','CP'];
export interface SchoolNpcTemplate {simulationKey:string;kind:'HITTER'|'PITCHER';position:string;schoolId:string}
export function generateSchoolNpcRoster(input:{templates:readonly SchoolNpcTemplate[];seed:string;worldKey:string;seasonKey:string;difficulty:Difficulty;league?:'COLLEGE'}){
  const identity=generateNpcIdentities(input.templates,createHandednessStream(input.seed,input.worldKey));
  const players:Record<string,DevelopmentPlayer>=Object.create(null),repertoires:Record<string,Repertoire>=Object.create(null),rosters:Record<string,string[]>=Object.create(null);
  let rosterRng=createWorldStream(input.seed,input.worldKey,'roster'),potentialRng=createWorldStream(input.seed,input.worldKey,'potential');
  for(const [index,npc] of identity.players.entries()) {
    const types=Object.keys(npc.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),typeDraw=nextInteger(rosterRng,types.length);rosterRng=typeDraw.state;
    const archetype=types[typeDraw.value]!,type=archetypeFor(npc.kind,archetype),abilityKeysForKind=abilityKeys(npc.kind);
    // Approved target OVR35..65, triangular mode48. Profile shape retained, no extra ability reroll.
    const u=nextFloat(rosterRng);rosterRng=u.state;
    const school=input.templates.find(t=>t.simulationKey===npc.simulationKey)!.schoolId;
    let target=Math.round(u.value<13/30?35+Math.sqrt(u.value*30*13):65-Math.sqrt((1-u.value)*30*17)),age=18;
    if(input.league==='COLLEGE'){
      const college=COLLEGES.find(c=>c.id===school);if(!college)throw new RangeError('INVALID_COLLEGE_ROSTER');
      const low=Math.max(40,college.minimumOverall),mode=Math.max(52,low),width=65-low;
      target=Math.round(u.value<(mode-low)/width?low+Math.sqrt(u.value*width*(mode-low)):65-Math.sqrt((1-u.value)*width*(65-mode)));
      const ageDraw=nextInteger(rosterRng,4);rosterRng=ageDraw.state;age=19+ageDraw.value;
    }
    const abilities=Object.fromEntries(abilityKeysForKind.map((key,i)=>[key,(type.initial[i]!+target-50)*10_000]));
    const generated=generateNpcPotential(npc.kind,abilities,{mode:'CAREER',difficulty:input.difficulty,owned:false},potentialRng);potentialRng=generated.state;
    const focus=[...abilityKeysForKind].sort((a,b)=>type.weights[abilityKeysForKind.indexOf(b)]!-type.weights[abilityKeysForKind.indexOf(a)]! || abilityKeysForKind.indexOf(a)-abilityKeysForKind.indexOf(b)).slice(0,4);
    const player:DevelopmentPlayer={...npc,name:['강','고','권','김','남','문','박','백','서','송','신','안','오','유','이','정'][Math.floor(index/15)]!+['건우','도윤','민준','서준','시우','예준','우진','윤호','재민','정우','준서','지호','태윤','하준','현우'][index%15]!,age,archetype,focus,abilities,potential:generated.potential,careerPeaks:{...abilities},fatigue:0};
    validateDevelopmentPlayer(player);players[player.simulationKey]=player;
    (rosters[school]??=[]).push(player.simulationKey);
    if(player.kind==='PITCHER') {const pitchDraw=nextInteger(rosterRng,6);rosterRng=pitchDraw.state;repertoires[player.simulationKey]=createRepertoire(PITCH_IDS[pitchDraw.value+1]!,input.seasonKey);}
  }
  return {players,repertoires,rosters,rng:{roster:rosterRng,potential:potentialRng,handedness:identity.state}};
}

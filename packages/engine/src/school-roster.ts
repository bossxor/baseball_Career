import {abilityKeys,HITTER_TYPES,PITCHER_TYPES,PITCH_IDS,COLLEGES} from '@playball/rules';
import type {Difficulty,PlayerKind} from '@playball/rules';
import {createWorldStream,createHandednessStream,nextFloat,nextInteger} from './rng.js';
import {generateNpcIdentities,generateNpcPotential} from './npc.js';
import {archetypeFor,validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {createRepertoire} from './repertoire.js';
import type {Repertoire} from './repertoire.js';

export const HITTER_POSITIONS=['C','C','1B','1B','2B','2B','3B','3B','SS','SS','LF','CF','RF','DH','DH'];
export const PITCHER_POSITIONS=['SP','SP','SP','SP','RP','RP','RP','RP','CP','CP'];
export interface SchoolNpcTemplate {simulationKey:string;kind:'HITTER'|'PITCHER';position:string;schoolId:string}
function normalCdf(x:number):number {const t=1/(1+.2316419*Math.abs(x)),d=.3989422804014327*Math.exp(-x*x/2),tail=d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x>=0?1-tail:tail;}
/** One existing uniform draw; conditional CDF avoids endpoint piles and variable RNG consumption. */
function centeredSchoolTarget(u:number):number {
 const left=normalCdf((35-48)/4),right=normalCdf((65-48)/4),q=left+u*(right-left);let lo=35,hi=65;
 for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(normalCdf((mid-48)/4)<q)lo=mid;else hi=mid;}
 return Math.round((lo+hi)/2);
}
export function schoolNpcAbilities(kind:PlayerKind,archetype:string,target:number,league?:'COLLEGE',balanceVersion:1|2=1){
 const type=archetypeFor(kind,archetype),keys=abilityKeys(kind),scale=league!=='COLLEGE' && balanceVersion===2?6000:10000;
 return Object.fromEntries(keys.map((key,i)=>[key,target*10000+(type.initial[i]!-50)*scale]));
}
export function schoolNpcTarget(u:number,schoolId:string,league?:'COLLEGE',balanceVersion:1|2=1):number {
 if(!Number.isFinite(u) || u<0 || u>1 || ![1,2].includes(balanceVersion))throw new RangeError('INVALID_SCHOOL_DISTRIBUTION');
 if(league!=='COLLEGE' && balanceVersion===2)return centeredSchoolTarget(u);
 if(league!=='COLLEGE')return Math.round(u<13/30?35+Math.sqrt(u*30*13):65-Math.sqrt((1-u)*30*17));
 const college=COLLEGES.find(c=>c.id===schoolId);if(!college)throw new RangeError('INVALID_COLLEGE_ROSTER');
 const low=Math.max(40,college.minimumOverall),mode=Math.max(52,low),width=65-low;
 return Math.round(u<(mode-low)/width?low+Math.sqrt(u*width*(mode-low)):65-Math.sqrt((1-u)*width*(65-mode)));
}
export function generateSchoolNpcRoster(input:{templates:readonly SchoolNpcTemplate[];seed:string;worldKey:string;seasonKey:string;difficulty:Difficulty;league?:'COLLEGE';balanceVersion?:1|2}){
  const identity=generateNpcIdentities(input.templates,createHandednessStream(input.seed,input.worldKey));
  const players:Record<string,DevelopmentPlayer>=Object.create(null),repertoires:Record<string,Repertoire>=Object.create(null),rosters:Record<string,string[]>=Object.create(null);
  let rosterRng=createWorldStream(input.seed,input.worldKey,'roster'),potentialRng=createWorldStream(input.seed,input.worldKey,'potential');
  for(const [index,npc] of identity.players.entries()) {
    const types=Object.keys(npc.kind==='HITTER'?HITTER_TYPES:PITCHER_TYPES),typeDraw=nextInteger(rosterRng,types.length);rosterRng=typeDraw.state;
    const archetype=types[typeDraw.value]!,type=archetypeFor(npc.kind,archetype),abilityKeysForKind=abilityKeys(npc.kind);
    // Version1 remains byte-compatible; version2 centers HS NPC and softens only NPC profiles.
    const u=nextFloat(rosterRng);rosterRng=u.state;
    const school=input.templates.find(t=>t.simulationKey===npc.simulationKey)!.schoolId;
    const target=schoolNpcTarget(u.value,school,input.league,input.balanceVersion);let age=18;
    if(input.league==='COLLEGE'){
      const ageDraw=nextInteger(rosterRng,4);rosterRng=ageDraw.state;age=19+ageDraw.value;
    }
    const abilities=schoolNpcAbilities(npc.kind,archetype,target,input.league,input.balanceVersion);
    const generated=generateNpcPotential(npc.kind,abilities,{mode:'CAREER',difficulty:input.difficulty,owned:false},potentialRng);potentialRng=generated.state;
    const focus=[...abilityKeysForKind].sort((a,b)=>type.weights[abilityKeysForKind.indexOf(b)]!-type.weights[abilityKeysForKind.indexOf(a)]! || abilityKeysForKind.indexOf(a)-abilityKeysForKind.indexOf(b)).slice(0,4);
    const player:DevelopmentPlayer={...npc,name:['강','고','권','김','남','문','박','백','서','송','신','안','오','유','이','정'][Math.floor(index/15)]!+['건우','도윤','민준','서준','시우','예준','우진','윤호','재민','정우','준서','지호','태윤','하준','현우'][index%15]!,age,archetype,focus,abilities,potential:generated.potential,careerPeaks:{...abilities},fatigue:0};
    validateDevelopmentPlayer(player);players[player.simulationKey]=player;
    (rosters[school]??=[]).push(player.simulationKey);
    if(player.kind==='PITCHER') {const pitchDraw=nextInteger(rosterRng,6);rosterRng=pitchDraw.state;repertoires[player.simulationKey]=createRepertoire(PITCH_IDS[pitchDraw.value+1]!,input.seasonKey);}
  }
  return {players,repertoires,rosters,rng:{roster:rosterRng,potential:potentialRng,handedness:identity.state}};
}

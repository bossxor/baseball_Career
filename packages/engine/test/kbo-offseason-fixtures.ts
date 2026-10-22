import {abilityKeys} from '@playball/rules';
import {createKboRosterWorld} from '../src/kbo-world.js';
import {createSeasonCalendar} from '../src/season-calendar.js';
import {nextKboFreeAgentYear} from '../src/kbo-free-agents.js';
import {emptyRecordLedger} from '../src/records.js';
import {createHealthLedger} from '../src/health.js';
import {createWorldStream} from '../src/rng.js';
import {initialProfileAbilities} from '../src/initial-abilities.js';

/** Controlled closed-year carry, with no official games invented for AI bookkeeping tests. */
export function stagedKboOffseason(extras=10){
 const source=createKboRosterWorld({worldKey:'ai-offseason',seasonKey:'2030',seed:'ai-offseason-seed',difficulty:'GROWTH'}),world={...structuredClone(source),status:'ACTIVE' as const,seasonKey:'2031',calendar:createSeasonCalendar(2031)},priorContracts=structuredClone(source.contracts),club=world.clubs[0]!,protagonistKey=club.roster[0]!;
 for(const p of Object.values(world.players))p.age++;
 for(const c of Object.values(world.contracts)){c.seasonKey='2031';c.years=Math.max(1,c.years-1);}
 for(let i=0;i<extras;i++){
  const template=world.players[club.roster[i+1]!]!,key='expired-extra-'+i,abilities=initialProfileAbilities(template.kind,template.archetype,35),player={...structuredClone(template),simulationKey:key,age:20,abilities,careerPeaks:{...abilities},potential:Object.fromEntries(abilityKeys(template.kind).map(k=>[k,Math.max(template.potential[k]!,abilities[k]!)]))};world.players[key]=player;
  priorContracts[key]={contractKey:'extra-contract-'+i,playerKey:key,clubId:club.id,seasonKey:'2030',years:1,annualSalaryWon:30_000_000,signingBonusWon:0,status:'ACTIVE'};world.contracts[key]={...priorContracts[key]!,seasonKey:'2031'};if(world.repertoires[template.simulationKey])world.repertoires[key]={...structuredClone(world.repertoires[template.simulationKey]!),seasonId:'2031'};club.roster.push(key);club.reservedSalaryWon+=30_000_000;
 }
 for(const r of Object.values(world.repertoires))r.seasonId='2031';
 const pool=nextKboFreeAgentYear({worldKey:world.worldKey,seed:world.seed,seasonKey:'2031',difficulty:'GROWTH',registeredKeys:Object.keys(world.players)});
 return {world,pool,priorContracts,expiringKeys:Object.keys(priorContracts).filter(k=>k!==protagonistKey && priorContracts[k]!.years===1),protagonistKey,sourceSeasonKey:'2030',records:emptyRecordLedger(),health:createHealthLedger(createWorldStream('ai','health','roster'))};
}

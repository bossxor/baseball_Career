import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {KboSangmuUnit} from './kbo-sangmu-unit.js';
import type {DevelopmentPlayer} from './player.js';
import {validateDevelopmentPlayer} from './player.js';
import type {Repertoire} from './repertoire.js';
import {validatePitchWeights} from './repertoire.js';
import type {HealthLedger} from './health.js';
import {planEmergencyRoster} from './emergency-roster.js';
import {generateSchoolNpcRoster} from './school-roster.js';
import {initialProfileAbilities} from './initial-abilities.js';
import {createWorldStream,nextInteger} from './rng.js';
import {compareKboSeasonDays} from './kbo-military-program.js';

type DatePoint={seasonKey:string;worldDay:number};
/** Military-only identities survive deregistration; they have no club contract or service program. */
export interface KboSangmuEmergency {
 schemaVersion:1|2;worldKey:string;nextSerial:number;
 entries:Record<string,{player:DevelopmentPlayer;repertoire:Repertoire|null;created:DatePoint;released:DatePoint|null}>;
}
export const createSangmuEmergency=(world:ActiveKboRosterWorld):KboSangmuEmergency=>({schemaVersion:2,worldKey:world.worldKey,nextSerial:1,entries:{}});

/** Validate the archive as well as active registrations before projecting a game or accepting a saved snapshot. */
export function assertSangmuEmergency(unit:KboSangmuUnit,world:Pick<ActiveKboRosterWorld,'worldKey'|'seasonKey'|'players'|'contracts'|'clubs'>):void {
 const e=unit.emergency;if(!e)return;
 if(![1,2].includes(e.schemaVersion) || e.worldKey!==world.worldKey || !Number.isSafeInteger(e.nextSerial) || e.nextSerial<1)throw new RangeError('INVALID_SANGMU_EMERGENCY');
 const serials=new Set<number>();
 for(const [key,entry] of Object.entries(e.entries)){
  const id:unknown=JSON.parse(key);
  if(!Array.isArray(id) || id.length!==3 || id[0]!=='sangmu-temp' || id[1]!==entry.created.seasonKey || !Number.isSafeInteger(id[2]) || id[2]<1 || id[2]>=e.nextSerial || serials.has(id[2]) || key.length>128 || entry.player.simulationKey!==key || Object.hasOwn(unit.members,key) || unit.loaned?.includes(key) || Object.hasOwn(world.players,key) || Object.hasOwn(world.contracts,key) || world.clubs.some(c=>c.roster.includes(key)))throw new RangeError('INVALID_SANGMU_TEMPORARY_ID');
  serials.add(id[2]);validateDevelopmentPlayer(entry.player);
  if(compareKboSeasonDays(entry.created,entry.created)!==0 || Number(entry.created.seasonKey)>Number(world.seasonKey) || entry.released===null && entry.created.seasonKey!==world.seasonKey || entry.released && (compareKboSeasonDays(entry.created,entry.released)>0 || Number(entry.released.seasonKey)>Number(world.seasonKey)) || (entry.player.kind==='PITCHER')!==(entry.repertoire!==null))throw new RangeError('INVALID_SANGMU_TEMPORARY_HISTORY');
  if(entry.repertoire)validatePitchWeights(entry.repertoire.book,entry.repertoire.weights);
 }
 if(serials.size!==e.nextSerial-1)throw new RangeError('INVALID_SANGMU_EMERGENCY');
}

/** Caller owns the date transaction; run only before preparing a new game, never during a saved pending game. */
export function reconcileSangmuEmergency(world:ActiveKboRosterWorld,source:KboSangmuUnit,health:HealthLedger,day:number):KboSangmuUnit {
 assertSangmuEmergency(source,world);if(!source.emergency)return source;
 const date={seasonKey:world.seasonKey,worldDay:day};compareKboSeasonDays(date,date);
 const unit=structuredClone(source),registry=unit.emergency!;
 for(const e of Object.values(registry.entries))if(compareKboSeasonDays(e.created,date)>0 || e.released && compareKboSeasonDays(e.released,date)>0)throw new RangeError('FUTURE_SANGMU_TEMPORARY_HISTORY');
 const permanent=[...Object.values(unit.members).filter(m=>m.program.completedBlocks<m.program.scheduledBlocks).map(m=>m.player),...(unit.loaned??[]).map(k=>world.players[k]!)];
 const healthyPlan=planEmergencyRoster(permanent.map(player=>({player,available:true,temporary:false})));
 // Version1 preserves injury-only saves; version2 also covers approved discharge/recruitment vacancies.
 if(registry.schemaVersion===1 && (healthyPlan.requiredHitters || healthyPlan.requiredPitchers))throw new RangeError('SANGMU_PERMANENT_ROSTER_INSUFFICIENT');
 const active=Object.values(registry.entries).filter(e=>e.released===null);
 const plan=planEmergencyRoster([...permanent.map(player=>({player,available:!Object.hasOwn(health.injuries,player.simulationKey),temporary:false})),...active.map(e=>({player:e.player,available:!Object.hasOwn(health.injuries,e.player.simulationKey),temporary:true}))]);
 for(const key of plan.releaseTemporaryKeys)registry.entries[key]!.released={...date};
 const add=(kind:'HITTER'|'PITCHER',position:string)=>{
  if(!Number.isSafeInteger(registry.nextSerial+1))throw new RangeError('EMERGENCY_SERIAL_LIMIT');
  const key=JSON.stringify(['sangmu-temp',world.seasonKey,registry.nextSerial++]);
  if(key.length>128 || Object.hasOwn(registry.entries,key) || Object.hasOwn(world.players,key))throw new RangeError('EMERGENCY_KEY_COLLISION');
  // Reuse the existing KBO safety-replacement profile and isolated identity streams, never the saved game/health streams.
  const batchKey=JSON.stringify(['sangmu-emergency',world.worldKey,key]),generated=generateSchoolNpcRoster({templates:[{simulationKey:key,kind,position,schoolId:'SANGMU'}],seed:world.seed,worldKey:batchKey,seasonKey:world.seasonKey,difficulty:world.difficulty,balanceVersion:2}),p=generated.players[key]!;
  const target=35+nextInteger(createWorldStream(world.seed,batchKey,'protagonist'),11).value,age=22+nextInteger(createWorldStream(world.seed,batchKey,'roster'),9).value,abilities=initialProfileAbilities(kind,p.archetype,target);
  const player={...p,age,abilities,careerPeaks:{...abilities},potential:Object.fromEntries(Object.keys(abilities).map(k=>[k,Math.max(abilities[k]!,p.potential[k]!)]))};
  validateDevelopmentPlayer(player);registry.entries[key]={player,repertoire:generated.repertoires[key]??null,created:{...date},released:null};
 };
 for(let i=0;i<plan.requiredHitters;i++)add('HITTER',i<plan.requiredRightThrowingHitters?['C','2B','3B','SS'][i]!:'CF');
 for(let i=0;i<plan.requiredPitchers;i++)add('PITCHER','SP');
 assertSangmuEmergency(unit,world);return unit;
}

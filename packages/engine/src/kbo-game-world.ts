import {kboActiveContractSuspended} from './kbo-service-payroll.js';
import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {CompetitionGameWorld} from './high-school-game.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';
import type {KboSangmuUnit} from './kbo-sangmu-unit.js';
import {assertSangmuUnit} from './kbo-sangmu-unit.js';

/** The military team's school id in the Futures projection (11th team, 2026-10-22 rule). */
export const SANGMU_TEAM_KEY='SANGMU';

/** Internal worker projection only. Caller authorizes career phase, queue/date, health and starters.
 * Both leagues share identities/books but have disjoint registered rosters. This is not a career transition. */
export function createKboCompetitionGameWorld(world:ActiveKboRosterWorld,leagueKey:'KBO'|'FUTURES',protagonistKey:string,sangmu?:KboSangmuUnit):CompetitionGameWorld {
 if(!['KBO','FUTURES'].includes(leagueKey) || !Object.hasOwn(world.players,protagonistKey) || !world.clubs.some(c=>c.roster.includes(protagonistKey)))throw new RangeError('INVALID_KBO_GAME_WORLD');
 assertKboRecruitmentWorld(world);
 if(sangmu)assertSangmuUnit(sangmu,world);
 for(const c of world.clubs)if(c.firstTeam.length!==28 || new Set(c.firstTeam).size!==28 || c.firstTeam.some(k=>!c.roster.includes(k) || kboActiveContractSuspended(world.contracts[k]!)))throw new RangeError('INVALID_KBO_GAME_REGISTRATION');
 const schools=world.clubs.map(c=>({id:c.id,name:c.name,roster:leagueKey==='KBO'?[...c.firstTeam]:c.roster.filter(k=>!c.firstTeam.includes(k) && !kboActiveContractSuspended(world.contracts[k]!))}));
 const players={...world.players},repertoires={...world.repertoires};
 // Futures only: serving members play for the military team and are registered nowhere else (they are not in world.players).
 if(sangmu && leagueKey==='FUTURES' && (Object.keys(sangmu.members).length>0 || (sangmu.loaned?.length??0)>0 || Object.values(sangmu.emergency?.entries??{}).some(e=>e.released===null))){
  const serving=Object.entries(sangmu.members).filter(([,m])=>m.program.completedBlocks<m.program.scheduledBlocks).sort(([a],[b])=>a<b?-1:1);
  if(serving.some(([k])=>Object.hasOwn(world.players,k)))throw new RangeError('INVALID_SANGMU_UNIT');
  for(const [k,m] of serving){players[k]=m.player;if(m.repertoire)repertoires[k]=m.repertoire;}
  const temporary=Object.entries(sangmu.emergency?.entries??{}).filter(([,e])=>e.released===null).sort(([a],[b])=>a<b?-1:1);
  for(const [k,e] of temporary){players[k]=e.player;if(e.repertoire)repertoires[k]=e.repertoire;}
  const loaned=(sangmu.loaned??[]).filter(k=>Object.hasOwn(world.players,k)).sort();
  for(const school of schools)school.roster=school.roster.filter(k=>!loaned.includes(k));
  schools.push({id:SANGMU_TEAM_KEY,name:'상무',roster:[...serving.map(([k])=>k),...loaned,...temporary.map(([k])=>k)]});
 }
 return structuredClone({worldKey:world.worldKey,seasonKey:world.seasonKey,seed:world.seed,protagonistKey,leagueKey,schools,players,repertoires});
}

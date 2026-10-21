import type {ActiveKboRosterWorld} from './kbo-career-entry.js';
import type {CompetitionGameWorld} from './high-school-game.js';
import {assertKboRecruitmentWorld} from './kbo-draft.js';

/** Internal worker projection only. Caller authorizes career phase, queue/date, health and starters.
 * Both leagues share identities/books but have disjoint registered rosters. This is not a career transition. */
export function createKboCompetitionGameWorld(world:ActiveKboRosterWorld,leagueKey:'KBO'|'FUTURES',protagonistKey:string):CompetitionGameWorld {
 if(!['KBO','FUTURES'].includes(leagueKey) || !Object.hasOwn(world.players,protagonistKey) || !world.clubs.some(c=>c.roster.includes(protagonistKey)))throw new RangeError('INVALID_KBO_GAME_WORLD');
 assertKboRecruitmentWorld(world);
 for(const c of world.clubs)if(c.firstTeam.length!==28 || new Set(c.firstTeam).size!==28 || c.firstTeam.some(k=>!c.roster.includes(k)))throw new RangeError('INVALID_KBO_GAME_REGISTRATION');
 const schools=world.clubs.map(c=>({id:c.id,name:c.name,roster:leagueKey==='KBO'?[...c.firstTeam]:c.roster.filter(k=>!c.firstTeam.includes(k))}));
 return structuredClone({worldKey:world.worldKey,seasonKey:world.seasonKey,seed:world.seed,protagonistKey,leagueKey,schools,players:world.players,repertoires:world.repertoires});
}

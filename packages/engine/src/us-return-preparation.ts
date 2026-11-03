import type {DevelopmentPlayer} from './player.js';
import type {UsRosterWorld} from './us-world.js';
import type {PreparationWorld} from './preparation-season.js';
import {createSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import {createRoundRobinSchedule} from './schedule.js';
import {emptyPitchXpLedger} from './pitch-xp.js';

/** Reuse the latest real population; no new ability distribution, identities or RNG draws. */
export function createUsReturnPreparationWorld(source:PreparationWorld|UsRosterWorld,player:DevelopmentPlayer,seasonKey:string):PreparationWorld {
 const key=player.simulationKey,calendar=createSeasonCalendar(Number(seasonKey),'calendar-2');
 const schools='organizations' in source?source.organizations.slice(0,9).map(o=>({id:o.id,name:o.name,roster:o.levels.ROOKIE.filter(k=>k!==key)})):structuredClone(source.schools);
 const protagonistSchoolId='organizations' in source?schools[0]!.id:source.protagonistSchoolId;
 if(!schools.some(t=>t.roster.includes(key)))schools.find(t=>t.id===protagonistSchoolId)!.roster.push(key);
 const registered=new Set(schools.flatMap(t=>t.roster));
 const world:PreparationWorld={worldKey:source.worldKey,seed:source.seed,seasonKey,leagueKey:'INDEPENDENT',protagonistKey:key,protagonistSchoolId,schools,players:structuredClone(Object.fromEntries(Object.entries(source.players).filter(([k])=>registered.has(k)))),repertoires:structuredClone(Object.fromEntries(Object.entries(source.repertoires).filter(([k])=>registered.has(k)))),calendar,schedule:[]};
 world.players[key]=structuredClone(player);
 for(const p of Object.values(world.players)){p.age++;p.fatigue=0;}
 for(const book of Object.values(world.repertoires)){if(book.learning&&book.learning.quarters.length!==4)throw new RangeError('PITCH_LEARNING_SETTLEMENT_REQUIRED');book.seasonId=seasonKey;book.learning=null;book.usedWindows=[];book.ledger=emptyPitchXpLedger();}
 world.schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:schools.map(t=>t.id),leagueKey:'INDEPENDENT',seasonKey,startDay:calendar.highSchoolDays[0]!},6),calendar);return world;
}

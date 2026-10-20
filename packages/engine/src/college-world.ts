import {COLLEGES,overall} from '@playball/rules';
import type {Difficulty} from '@playball/rules';
import {assertSchoolWorldRoster} from './high-school-world.js';
import type {HighSchoolWorld} from './high-school-world.js';
import {HITTER_POSITIONS,PITCHER_POSITIONS,generateSchoolNpcRoster} from './school-roster.js';
import {validateDevelopmentPlayer} from './player.js';
import type {DevelopmentPlayer} from './player.js';
import {validatePitchWeights} from './repertoire.js';
import type {Repertoire} from './repertoire.js';
import {validatePitchXpLedger} from './pitch-xp.js';
import {createStreams} from './rng.js';
import {createSeasonCalendar,assertSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';
import {createRoundRobinSchedule,assertSchedule} from './schedule.js';

export interface CollegeWorld extends HighSchoolWorld {leagueKey:'COLLEGE';calendar:SeasonCalendar}
/** Initializes the first college population; the carried protagonist is never generated again. */
export function createCollegeWorld(input:{worldKey:string;seed:string;seasonYear:number;collegeId:string;player:DevelopmentPlayer;repertoire?:Repertoire;difficulty:Difficulty}):CollegeWorld {
 validateDevelopmentPlayer(input.player);
 const college=COLLEGES.find(c=>c.id===input.collegeId),score=overall(input.player.kind,input.player.abilities);
 if(!input.worldKey || !input.seed || !college || input.player.age!==19 || score.sumUnits/score.denominator<college.minimumOverall || !['GROWTH','REALISTIC','SECRET_CHEAT'].includes(input.difficulty))throw new RangeError('INVALID_COLLEGE_WORLD');
 const calendar=createSeasonCalendar(input.seasonYear),seasonKey=String(input.seasonYear),generationKey=JSON.stringify([input.worldKey,'COLLEGE',seasonKey]);
 const schools=COLLEGES.map(c=>({id:c.id,name:c.name,roster:[] as string[]}));
 const templates=schools.flatMap(s=>[...HITTER_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['college',seasonKey,s.id,'H',i]),kind:'HITTER' as const,position,schoolId:s.id})),...PITCHER_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['college',seasonKey,s.id,'P',i]),kind:'PITCHER' as const,position,schoolId:s.id}))]);
 if(templates.some(p=>p.simulationKey===input.player.simulationKey))throw new RangeError('PLAYER_KEY_COLLISION');
 const replaced=templates.find(p=>p.schoolId===input.collegeId && p.kind===input.player.kind && p.position===input.player.position);
 if(!replaced)throw new RangeError('INVALID_COLLEGE_POSITION');
 const generated=generateSchoolNpcRoster({templates:templates.filter(p=>p!==replaced),seed:input.seed,worldKey:generationKey,seasonKey,difficulty:input.difficulty,league:'COLLEGE'});
 generated.players[input.player.simulationKey]=structuredClone(input.player);
 for(const school of schools)school.roster=generated.rosters[school.id]??[];
 schools.find(s=>s.id===input.collegeId)!.roster.push(input.player.simulationKey);for(const school of schools)school.roster.sort();
 if(input.player.kind==='PITCHER'){
  if(!input.repertoire || input.repertoire.seasonId!==seasonKey)throw new RangeError('MISSING_COLLEGE_REPERTOIRE');
  validatePitchWeights(input.repertoire.book,input.repertoire.weights);validatePitchXpLedger(input.repertoire.ledger);
  generated.repertoires[input.player.simulationKey]=structuredClone(input.repertoire);
 }
 const schedule=scheduleHighSchoolCalendar(createRoundRobinSchedule({teamKeys:schools.map(s=>s.id),leagueKey:'COLLEGE',seasonKey,startDay:calendar.highSchoolDays[0]!},6),calendar);
 const world:CollegeWorld={schemaVersion:1,rulesVersion:'1.0.0',leagueKey:'COLLEGE',worldKey:input.worldKey,seasonKey,seed:input.seed,phase:'CREATED',protagonistKey:input.player.simulationKey,protagonistSchoolId:input.collegeId,schools,players:generated.players,repertoires:generated.repertoires,schedule,calendar,rng:{...generated.rng,protagonist:createStreams(input.seed,generationKey).worldCreation}};
 assertCollegeWorld(world);return world;
}
export function assertCollegeWorld(world:CollegeWorld):void {
 if(world.leagueKey!=='COLLEGE' || world.seasonKey!==String(world.calendar.year) || world.schools.some((s,i)=>s.id!==COLLEGES[i]?.id || s.name!==COLLEGES[i]?.name))throw new RangeError('INVALID_COLLEGE_WORLD');
 assertSeasonCalendar(world.calendar);assertSchoolWorldRoster(world);assertSchedule(world.schedule,world.schools.map(s=>s.id),48,24);
 const expected=scheduleHighSchoolCalendar(world.schedule,world.calendar);
 if(world.schedule.some((g,i)=>g.worldDay!==expected[i]!.worldDay || g.leagueKey!=='COLLEGE' || g.seasonKey!==world.seasonKey))throw new RangeError('INVALID_COLLEGE_SCHEDULE');
 for(const player of Object.values(world.players))if(player.age<19 || player.age>22)throw new RangeError('INVALID_COLLEGE_PLAYER_AGE');
}

import { PITCH_IDS } from '@playball/rules';
import type { PitchId } from '@playball/rules';
import { createWorldStream } from './rng.js';
import type { RngState } from './rng.js';
import { createCareerPlayer, validateDevelopmentPlayer } from './player.js';
import type { CreationInput, DevelopmentPlayer } from './player.js';
import { createRepertoire, validatePitchWeights } from './repertoire.js';
import type { Repertoire } from './repertoire.js';
import { createRoundRobinSchedule, assertSchedule } from './schedule.js';
import type { ScheduledGame } from './schedule.js';
import {createSeasonCalendar,assertSeasonCalendar,scheduleHighSchoolCalendar} from './season-calendar.js';
import type {SeasonCalendar} from './season-calendar.js';

export const HIGH_SCHOOLS = [
  {id:'H01',name:'한울빛고'},{id:'H02',name:'청해솔고'},{id:'H03',name:'별하람고'},
  {id:'H04',name:'해온누리고'},{id:'H05',name:'서리들고'},{id:'H06',name:'새나래고'},
  {id:'H07',name:'빛여울고'},{id:'H08',name:'다온숲고'},{id:'H09',name:'푸른결고'},
] as const;
import {HITTER_POSITIONS,PITCHER_POSITIONS,generateSchoolNpcRoster} from './school-roster.js';
export interface HighSchoolWorld {
  schemaVersion:1; rulesVersion:'1.0.0'; worldKey:string; seasonKey:string; seed:string;
  phase:'CREATED'; protagonistKey:string; protagonistSchoolId:string;
  schools:{id:string;name:string;roster:string[]}[];
  players:Record<string,DevelopmentPlayer>; repertoires:Record<string,Repertoire>; schedule:ScheduledGame[];
  calendar?:SeasonCalendar;
  rng:{roster:RngState;potential:RngState;protagonist:RngState;handedness:RngState};
}
export function createHighSchoolWorld(input:{worldKey:string;seasonKey:string;seed:string;schoolId:string;player:CreationInput;secondaryPitch?:PitchId;startDay?:number;seasonYear?:number}):HighSchoolWorld {
  if(!input.worldKey || !input.seasonKey || !input.seed || !HIGH_SCHOOLS.some(s=>s.id===input.schoolId)) throw new RangeError('INVALID_WORLD_CREATION');
  if(input.player.kind==='PITCHER' && (!input.secondaryPitch || input.secondaryPitch==='P01' || !PITCH_IDS.includes(input.secondaryPitch))) throw new RangeError('SECONDARY_PITCH_REQUIRED');
  const schools=HIGH_SCHOOLS.map(s=>({...s,roster:[] as string[]}));
  const templates=schools.flatMap(s=>[...HITTER_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['hs',s.id,'H',i]),kind:'HITTER' as const,position,schoolId:s.id})),...PITCHER_POSITIONS.map((position,i)=>({simulationKey:JSON.stringify(['hs',s.id,'P',i]),kind:'PITCHER' as const,position,schoolId:s.id}))]);
  if(templates.some(p=>p.simulationKey===input.player.simulationKey)) throw new RangeError('PLAYER_KEY_COLLISION');
  const replaced=templates.find(p=>p.schoolId===input.schoolId && p.kind===input.player.kind && p.position===input.player.position);
  if(!replaced) throw new RangeError('INVALID_STARTING_POSITION');
  const creation=createCareerPlayer(input.player,createWorldStream(input.seed,input.worldKey,'protagonist'));
  const generated=generateSchoolNpcRoster({templates:templates.filter(p=>p!==replaced),seed:input.seed,worldKey:input.worldKey,seasonKey:input.seasonKey,difficulty:input.player.difficulty});
  const {players,repertoires}=generated;
  for(const school of schools)school.roster=generated.rosters[school.id]??[];
  players[creation.player.simulationKey]=creation.player;schools.find(s=>s.id===input.schoolId)!.roster.push(creation.player.simulationKey);
  if(creation.player.kind==='PITCHER') repertoires[creation.player.simulationKey]=createRepertoire(input.secondaryPitch!,input.seasonKey);
  for(const school of schools) school.roster.sort();
  const calendar=input.seasonYear===undefined?undefined:createSeasonCalendar(input.seasonYear);
  if(calendar && input.startDay!==undefined && input.startDay!==calendar.highSchoolDays[0])throw new RangeError('SCHOOL_CALENDAR_START_MISMATCH');
  const baseSchedule=createRoundRobinSchedule({teamKeys:schools.map(s=>s.id),leagueKey:'HS',seasonKey:input.seasonKey,startDay:calendar?.highSchoolDays[0]??input.startDay!},6);
  const schedule=calendar?scheduleHighSchoolCalendar(baseSchedule,calendar):baseSchedule;
  assertSchedule(schedule,schools.map(s=>s.id),48,24);
  const world:HighSchoolWorld={schemaVersion:1,rulesVersion:'1.0.0',worldKey:input.worldKey,seasonKey:input.seasonKey,seed:input.seed,phase:'CREATED',protagonistKey:creation.player.simulationKey,protagonistSchoolId:input.schoolId,schools,players,repertoires,schedule,rng:{roster:generated.rng.roster,potential:generated.rng.potential,protagonist:creation.state,handedness:generated.rng.handedness}};
  if(calendar)world.calendar=calendar;
  assertHighSchoolWorld(world);return world;
}
export function assertHighSchoolWorld(world:HighSchoolWorld):void {
  if(world.calendar){
    assertSeasonCalendar(world.calendar);
    assertSchedule(world.schedule,world.schools.map(s=>s.id),48,24);
    const expected=scheduleHighSchoolCalendar(world.schedule,world.calendar);
    if(world.schedule.some((g,i)=>g.worldDay!==expected[i]!.worldDay))throw new RangeError('CHANGED_SCHOOL_CALENDAR');
  }
  assertSchoolWorldRoster(world);
}
export function assertSchoolWorldRoster(world:HighSchoolWorld):void {
  if(world.schools.length!==9 || Object.keys(world.players).length!==225 || !world.players[world.protagonistKey]) throw new RangeError('INVALID_WORLD_ROSTER');
  const registered=new Set<string>();
  for(const school of world.schools) {
    const roster=school.roster.map(id=>{const player=world.players[id];if(player && player.simulationKey!==id) throw new RangeError('INVALID_PLAYER_KEY');return player;});
    if(roster.length!==25 || roster.some(p=>!p) || roster.filter(p=>p!.kind==='HITTER').length!==15 || roster.filter(p=>p!.kind==='PITCHER').length!==10) throw new RangeError('INVALID_SCHOOL_ROSTER');
    for(const player of roster) {validateDevelopmentPlayer(player!);if(player!.kind==='PITCHER') {const repertoire=world.repertoires[player!.simulationKey];if(!repertoire || repertoire.seasonId!==world.seasonKey) throw new RangeError('MISSING_REPERTOIRE');validatePitchWeights(repertoire.book,repertoire.weights);}if(registered.has(player!.simulationKey)) throw new RangeError('DUPLICATE_REGISTRATION');registered.add(player!.simulationKey);}
    for(const position of ['C','1B','2B','3B','SS','LF','CF','RF','DH','SP','RP','CP']) if(!roster.some(p=>p!.position===position)) throw new RangeError('MISSING_POSITION');
  }
  if(!world.schools.find(s=>s.id===world.protagonistSchoolId)?.roster.includes(world.protagonistKey)) throw new RangeError('INVALID_PROTAGONIST_SCHOOL');
}

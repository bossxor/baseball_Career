import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {selectSangmuCohort} from './kbo-sangmu.js';
import {emptySangmuUnit,enlistSangmuCohort} from './kbo-sangmu-unit.js';

/** Members still serving (a finished program is waiting for a roster slot, not on the team). */
export const kboSangmuServing=(s:Pick<KboCareer,'sangmu'>)=>[...Object.entries(s.sangmu?.members??{}).filter(([,m])=>m.program.completedBlocks<m.program.scheduledBlocks).map(([k])=>k),...(s.sangmu?.loaned??[])].sort();

/** The military team needs a squad that can field a lineup: nine hitters and a starting pitcher at least. */
export function kboSangmuFieldable(s:Pick<KboCareer,'sangmu'|'world'>):boolean {
 const kinds=[...Object.values(s.sangmu?.members??{}).filter(m=>m.program.completedBlocks<m.program.scheduledBlocks).map(m=>m.player),...(s.sangmu?.loaned??[]).map(k=>s.world.players[k]).filter(p=>!!p)] as {kind:string;position:string}[];
 return kinds.filter(p=>p.kind==='HITTER').length>=9 && kinds.some(p=>p.kind==='PITCHER' && p.position==='SP');
}

/** PRESEASON_SETUP, before the opening roster: selects this year's cohort from the last two closed seasons (selection
 * season = previous season, so the first block is the whole coming season), moves it into the unit and joins the military
 * team to this season's Futures calendar. Once per season, never for my own player (he applies through S26/S27), and not after
 * the roster or schedule is fixed. */
export function startSangmuCohort(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const selectionSeason=String(Number(source.world.seasonKey)-1);
 if(source.phaseContext.phase!=='PRESEASON_SETUP' || source.openingRoster || source.competitionSchedule || source.days || source.sangmu?.enlistedSeasons.includes(selectionSeason))throw new RangeError('SANGMU_COHORT_NOT_AVAILABLE');
 const career=structuredClone(source),unit=career.sangmu??emptySangmuUnit();
 // My own player already holds one slot of this recruitment when he enlisted for it (his application was the same snapshot).
 const mine=career.military?.status==='SERVING_SPORTS' && career.military.program?.blocks[0]?.seasonKey===career.world.seasonKey?career.world.players[career.protagonistKey]!.kind:null;
 const selection=selectSangmuCohort({world:career.world,records:career.records,health:career.health,seasonKey:selectionSeason,serving:new Set(Object.keys(unit.members)),excluded:new Set([career.protagonistKey]),reserved:{hitters:mine==='HITTER'?1:0,pitchers:mine==='PITCHER'?1:0}});
 career.sangmu=enlistSangmuCohort(career.world,unit,selection,career.protagonistClubId);career.revision++;return career;
}

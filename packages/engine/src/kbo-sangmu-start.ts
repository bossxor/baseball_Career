import type {KboCareer} from './kbo-career-entry.js';
import {assertCareerRevision} from './high-school-career.js';
import {selectSangmuCohort} from './kbo-sangmu.js';
import {emptySangmuUnit,enlistSangmuCohort} from './kbo-sangmu-unit.js';

/** Members still serving (a finished program is waiting for a roster slot, not on the team). */
export const kboSangmuServing=(s:Pick<KboCareer,'sangmu'>)=>Object.entries(s.sangmu?.members??{}).filter(([,m])=>m.program.completedBlocks<m.program.scheduledBlocks).map(([k])=>k).sort();

/** PRESEASON_SETUP, before the opening roster: selects this year's cohort from the last two closed seasons (selection
 * season = previous season, so the first block is the whole coming season), moves it into the unit and joins the military
 * team to this season's Futures calendar. Once per season, never for my own player (he applies through S26/S27), and not after
 * the roster or schedule is fixed. */
export function startSangmuCohort(source:KboCareer,expectedRevision:number):KboCareer {
 assertCareerRevision(source,expectedRevision);
 const selectionSeason=String(Number(source.world.seasonKey)-1);
 if(source.phaseContext.phase!=='PRESEASON_SETUP' || source.openingRoster || source.competitionSchedule || source.days || source.sangmu?.enlistedSeasons.includes(selectionSeason))throw new RangeError('SANGMU_COHORT_NOT_AVAILABLE');
 const career=structuredClone(source),unit=career.sangmu??emptySangmuUnit();
 const selection=selectSangmuCohort({world:career.world,records:career.records,health:career.health,seasonKey:selectionSeason,serving:new Set(Object.keys(unit.members)),excluded:new Set([career.protagonistKey])});
 career.sangmu=enlistSangmuCohort(career.world,unit,selection,career.protagonistClubId);career.revision++;return career;
}

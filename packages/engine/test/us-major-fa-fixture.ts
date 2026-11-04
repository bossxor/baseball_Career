import {closedUsMajorFixture,finishControlledMajorSeason} from './us-major-fixture.js';
import {startNextUsMajorSeason} from '../src/us-major-renewal.js';
import {confirmUsPreseasonPlan} from '../src/us-preseason.js';
import {publishUsSeasonSchedule} from '../src/us-schedule.js';
import type {UsCareer} from '../src/us-career-entry.js';
export const majorFaFunding=(c:UsCareer)=>c.inventory.clubs.map(o=>({organizationId:o.id,addedBudgetUsd:20_000_000}));
let cached:UsCareer|undefined;
/** Controlled official contribution/date prefixes and native annual transitions; not six native competitive seasons. */
export function closedUsFreeAgentFixture(){
 if(!cached){let c=closedUsMajorFixture();for(let i=0;i<6;i++){const next=startNextUsMajorSeason(c,c.revision,majorFaFunding(c)),pre=confirmUsPreseasonPlan(next,next.revision);c=finishControlledMajorSeason(publishUsSeasonSchedule(pre,pre.revision));}cached=c;}return structuredClone(cached);
}
